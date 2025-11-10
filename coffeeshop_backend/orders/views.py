from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import F
from .models import Order, OrderStatusHistory, OrderItem
from .serializers import OrderSerializer, OrderStatusHistorySerializer, OrderItemSerializer
from products.models import Product, ProductIngredient
from ingredient_inventory.models import Ingredient
from decimal import Decimal

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by order_id if provided in query params
        order_id = self.request.query_params.get('order_id')
        if order_id:
            queryset = queryset.filter(order__id=order_id)
            
        return queryset
    
    @transaction.atomic
    def perform_create(self, serializer):
        # Get the order
        order_id = self.request.data.get('order')
        if not order_id:
            order = serializer.validated_data.get('order')
            if not order:
                raise serializers.ValidationError({"order": "Order is required"})
        else:
            try:
                order = Order.objects.get(pk=order_id)
                serializer.validated_data['order'] = order
            except Order.DoesNotExist:
                raise serializers.ValidationError({"order": "Order not found"})
        
        # Only allow adding items to pending/preparing orders
        if order.status not in ['pending', 'preparing']:
            raise serializers.ValidationError(
                {"order": f"Cannot add items to order with status: {order.status}"}
            )
        
        # Check if there's enough stock (validation only, no deduction)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']
        
        available = product.get_available_stock()
        if available < quantity:
            raise serializers.ValidationError({
                "quantity": f"Not enough available. Only {available} {product.name} can be made with current ingredients."
            })
                                                                                                                                                                                                                                                                                                                                                                                                                  
        # Save with current price - no stock changes during creation
        serializer.save(price=product.price)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Include related items for better performance
        return queryset.prefetch_related('items', 'status_history')
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        
        # Prevent cancellation during processing
        if old_status in ['processing', 'preparing'] and new_status == 'cancelled':
            raise serializers.ValidationError(
                {"status": "Cannot cancel order while it's being processed"}
            )
        
        # Handle stock deduction only when marking as completed
        if new_status == 'completed' and old_status != 'completed':
            # Check if all products have enough stock
            stock_issues = []
            
            print(f"Checking stock for order {instance.id}:")
            for item in instance.items.all():
                if item.product.deductable:
                    available = item.product.get_available_stock()
                    print(f"  Product: {item.product.name}, Available: {available}, Required: {item.quantity}")
                    if available < item.quantity:
                        stock_issues.append({
                            'product': item.product.name,
                            'available': available,
                            'required': item.quantity,
                            'shortage': item.quantity - available
                        })
                else:
                    # For non-deductable products, check direct stock
                    if item.product.stock < item.quantity:
                        stock_issues.append({
                            'product': item.product.name,
                            'available': item.product.stock,
                            'required': item.quantity,
                            'shortage': item.quantity - item.product.stock
                        })
            
            if stock_issues:
                error_messages = []
                for issue in stock_issues:
                    error_messages.append(
                        f"{issue['product']}: Available {issue['available']}, Required {issue['required']} (shortage: {issue['shortage']})"
                    )
                raise serializers.ValidationError({
                    "status": f"Cannot complete order due to insufficient stock: {'; '.join(error_messages)}"
                })
            
            try:
                self.process_ingredients(instance, 'deduct')
            except ValueError as e:
                raise serializers.ValidationError({"status": str(e)})
        
        # Handle stock return when cancelling from non-processing states
        elif new_status == 'cancelled' and old_status not in ['processing', 'preparing']:
            self.process_ingredients(instance, 'return')
        
        updated_instance = serializer.save()
        
        # Create status history
        if old_status != new_status:
            username = None
            if hasattr(self.request, 'user') and self.request.user.is_authenticated:
                username = self.request.user.username
                
            OrderStatusHistory.objects.create(
                order=updated_instance,
                status=new_status,
            )
    
    @transaction.atomic
    def process_ingredients(self, order, action):
        """Process ingredients for an order based on action type (deduct or return)"""
        if order.status == 'cancelled' and action == 'deduct':
            raise ValueError("Cannot process ingredients for cancelled order")
            
        order_items = OrderItem.objects.filter(order=order)
        processed_ingredients = []
        
        for item in order_items:
            product = item.product
            quantity = item.quantity
            
            if product.deductable:
                product_ingredients = ProductIngredient.objects.filter(product=product)
                
                for pi in product_ingredients:
                    ingredient = pi.ingredient
                    required_amount = pi.quantity * quantity
                    required_unit = pi.required_unit
                    ingredient_unit = ingredient.unit
                    
                    # Convert required_amount to ingredient's base unit
                    conversion_factors = {
                        'g': {'kg': 0.001, 'mg': 1000, 'g': 1, 'tsp': 0.2, 'tbsp': 0.067},
                        'kg': {'g': 1000, 'mg': 1000000, 'kg': 1, 'tsp': 200, 'tbsp': 67},
                        'ml': {'l': 0.001, 'cl': 0.1, 'ml': 1, 'tsp': 0.2, 'tbsp': 0.067},
                        'l': {'ml': 1000, 'cl': 10, 'l': 1, 'tsp': 200, 'tbsp': 67},
                        'pcs': {'pcs': 1, 'dozen': 0.0833, 'unit': 1},
                        'tbsp': {'tbsp': 1, 'tsp': 3, 'ml': 15, 'g': 15},
                        'tsp': {'tsp': 1, 'tbsp': 0.333333, 'ml': 5, 'g': 5},
                    }
                    
                    # Convert required amount to ingredient's base unit
                    required_in_base_unit = float(required_amount)
                    req_unit_lower = str(required_unit).lower().strip()
                    ing_unit_lower = str(ingredient_unit).lower().strip()
                    
                    if req_unit_lower != ing_unit_lower:
                        # Special coffee conversion
                        if (ing_unit_lower, req_unit_lower) in [('kg', 'ml'), ('g', 'ml')]:
                            if ing_unit_lower == 'kg' and req_unit_lower == 'ml':
                                required_in_base_unit = float(required_amount) / 2500  # ml to kg
                            elif ing_unit_lower == 'g' and req_unit_lower == 'ml':
                                required_in_base_unit = float(required_amount) / 2.5  # ml to g
                        elif req_unit_lower in conversion_factors and ing_unit_lower in conversion_factors[req_unit_lower]:
                            # Convert from required unit to ingredient unit
                            required_in_base_unit = float(required_amount) * conversion_factors[req_unit_lower][ing_unit_lower]
                    
                    if action == 'deduct':
                        print(f"  Deducting {ingredient.name}: {required_amount}{required_unit} → {required_in_base_unit}{ingredient_unit}")
                        print(f"    Current stock: {ingredient.stock}{ingredient_unit}")
                        
                        if ingredient.stock < required_in_base_unit:
                            error_msg = f"Not enough {ingredient.name} in stock. Required: {required_in_base_unit}{ingredient_unit}, Available: {ingredient.stock}{ingredient_unit}"
                            print(f"    ERROR: {error_msg}")
                            raise ValueError(error_msg)
                        
                        ingredient.stock = F('stock') - required_in_base_unit
                        ingredient.save()
                        print(f"    Deducted successfully")
                        processed_ingredients.append(f"{ingredient.name} (-{required_in_base_unit}{ingredient_unit})")
                        
                    elif action == 'return':
                        ingredient.stock = F('stock') + required_amount
                        ingredient.save()
                        processed_ingredients.append(f"{ingredient.name} (+{required_amount})")
            else:
                # Handle non-deductable products
                if action == 'deduct':
                    if product.stock < quantity:
                        raise ValueError(
                            f"Not enough {product.name} in stock. "
                            f"Required: {quantity}, Available: {product.stock}"
                        )
                    product.stock = F('stock') - quantity
                    product.save()
                    processed_ingredients.append(f"{product.name} (-{quantity})")
                elif action == 'return':
                    product.stock = F('stock') + quantity
                    product.save()
                    processed_ingredients.append(f"{product.name} (+{quantity})")
        
        return processed_ingredients
    
    @action(detail=True, methods=['patch'])
    @transaction.atomic
    def update_status(self, request, pk=None):
        """Special endpoint to update just the status of an order"""
        order = self.get_object()
        
        # Validate the status is valid
        if 'status' not in request.data:
            return Response({'error': 'Status field is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        new_status = request.data['status']
        if new_status not in dict(Order.STATUS_CHOICES).keys():
            return Response(
                {'error': f'Invalid status. Must be one of: {dict(Order.STATUS_CHOICES).keys()}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = order.status
        
        # Prevent cancellation during processing/preparing
        if old_status in ['processing', 'preparing'] and new_status == 'cancelled':
            return Response(
                {'error': 'Cannot cancel order while it is being processed or prepared'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only update if status has changed
        if order.status != new_status:
            ingredient_changes = []
            
            # Check stock availability before completing
            if new_status == "completed" and old_status != "completed":
                stock_issues = []
                
                print(f"Checking stock for order {order.id}:")
                for item in order.items.all():
                    if item.product.deductable:
                        available = item.product.get_available_stock()
                        print(f"  Product: {item.product.name}, Available: {available}, Required: {item.quantity}")
                        if available < item.quantity:
                            stock_issues.append({
                                'product': item.product.name,
                                'available': available,
                                'required': item.quantity,
                                'shortage': item.quantity - available
                            })
                    else:
                        if item.product.stock < item.quantity:
                            stock_issues.append({
                                'product': item.product.name,
                                'available': item.product.stock,
                                'required': item.quantity,
                                'shortage': item.quantity - item.product.stock
                            })
                
                if stock_issues:
                    error_messages = []
                    for issue in stock_issues:
                        error_messages.append(
                            f"{issue['product']}: Available {issue['available']}, Required {issue['required']} (shortage: {issue['shortage']})"
                        )
                    return Response(
                        {'error': f"Cannot complete order due to insufficient stock: {'; '.join(error_messages)}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Process ingredient stock changes based on status change
            try:
                # If new status is completed, deduct ingredients
                if new_status == "completed" and old_status != "completed":
                    print(f"Deducting ingredients for order {order.id}")
                    ingredient_changes = self.process_ingredients(order, "deduct")
                    print(f"Successfully deducted: {ingredient_changes}")
                
                # If cancelling from non-processing states, return ingredients
                if new_status == "cancelled" and old_status not in ["processing", "preparing", "completed"]:
                    ingredient_changes = self.process_ingredients(order, "return")
                    
                # Update order status
                order.status = new_status
                order.save()
                
                # Create history entry
                username = None
                if request.user.is_authenticated:
                    username = request.user.username
                    
                history_entry = OrderStatusHistory.objects.create(
                    order=order,
                    status=new_status,
                    changed_by=username
                )
                
                return Response({
                    'success': True,
                    'message': f'Status updated from {old_status} to {new_status}',
                    'status': new_status,
                    'status_display': order.get_status_display(),
                    'history_entry': OrderStatusHistorySerializer(history_entry).data,
                    'ingredient_changes': ingredient_changes
                })
            except Exception as e:
                # If any errors occur during stock processing, don't change the status
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'message': 'Status unchanged'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def add_item(self, request, pk=None):
        """Add a new item to a pending order"""
        order = self.get_object()
        
        # Only allow modifications for pending orders
        if order.status != "pending":
            return Response(
                {'error': 'Can only add items to pending orders'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        product_id = request.data.get('product')
        quantity = request.data.get('quantity', 1)
        
        if not product_id or not quantity:
            return Response(
                {'error': 'Product ID and quantity are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(pk=product_id)
            quantity = int(quantity)
            
            # Check available stock
            available = product.get_available_stock()
            if available < quantity:
                return Response(
                    {'error': f'Not enough available. Only {available} {product.name} can be made with current ingredients.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create order item
            order_item = OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=product.price
            )
            
            # Update order total
            order.refresh_from_db()
            order.update_total_price()
            
            return Response({
                'success': True,
                'message': 'Item added successfully',
                'item': OrderItemSerializer(order_item).data,
                'new_total': str(order.total_price)
            })
            
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {'error': 'Invalid quantity'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['patch'])
    @transaction.atomic
    def update_item(self, request, pk=None):
        """Update an existing item in a pending order"""
        order = self.get_object()
        
        # Only allow modifications for pending orders
        if order.status != "pending":
            return Response(
                {'error': 'Can only update items in pending orders'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        item_id = request.data.get('item_id')
        new_quantity = request.data.get('quantity')
        
        if not item_id or new_quantity is None:
            return Response(
                {'error': 'Item ID and quantity are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_quantity = int(new_quantity)
            if new_quantity <= 0:
                return Response(
                    {'error': 'Quantity must be greater than zero'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            order_item = OrderItem.objects.get(pk=item_id, order=order)
            
            # Check available stock for the new quantity
            available = order_item.product.get_available_stock()
            if available < new_quantity:
                return Response(
                    {'error': f'Not enough available. Only {available} {order_item.product.name} can be made with current ingredients.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update quantity
            order_item.quantity = new_quantity
            order_item.save()
            
            # Update order total
            order.refresh_from_db()
            order.update_total_price()
            
            return Response({
                'success': True,
                'message': 'Item updated successfully',
                'item': OrderItemSerializer(order_item).data,
                'new_total': str(order.total_price)
            })
            
        except OrderItem.DoesNotExist:
            return Response(
                {'error': 'Order item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {'error': 'Invalid quantity'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def cancel_order(self, request, pk=None):
        """Custom endpoint for safe order cancellation"""
        order = self.get_object()
        
        # Check if order can be cancelled
        if order.status in ['processing', 'preparing']:
            return Response(
                {'error': 'Cannot cancel order while it is being processed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if order.status == 'completed':
            return Response(
                {'error': 'Cannot cancel completed order'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if order.status == 'cancelled':
            return Response(
                {'error': 'Order is already cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Cancel the order and return ingredients
            serializer = self.get_serializer(order, data={'status': 'cancelled'}, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            return Response({
                'success': True,
                'message': 'Order cancelled successfully',
                'order': serializer.data
            })
            
        except serializers.ValidationError as e:
            return Response(
                {'error': str(e.detail)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
