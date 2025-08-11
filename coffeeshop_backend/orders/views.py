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
            # Also check if order is directly in validated_data
            order = serializer.validated_data.get('order')
            if not order:
                raise serializers.ValidationError({"order": "Order is required"})
        else:
            try:
                order = Order.objects.get(pk=order_id)
                # Add order to validated_data so it's available during save
                serializer.validated_data['order'] = order
            except Order.DoesNotExist:
                raise serializers.ValidationError({"order": "Order not found"})
        
        # Check if there's enough stock
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']
        
        # Use available_stock for validation (handles both regular and ingredient-based products)
        available = product.get_available_stock()
        if available < quantity:
            raise serializers.ValidationError({
                "quantity": f"Not enough available. Only {available} {product.name} can be made with current ingredients."
            })
            
        # For non-deductable products, update product stock directly
        if not product.deductable:
            product.stock -= quantity
            product.save()
            
        # For deductable products, we don't deduct anything yet
        # Ingredients will be deducted when order is marked as completed
        
        # Save with the current price
        serializer.save(price=product.price)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Include related items for better performance
        return queryset.prefetch_related('items', 'status_history')
    
    def perform_update(self, serializer):
        # Check if status has changed
        instance = self.get_object()
        old_status = instance.status
        updated_instance = serializer.save()
        
        # If status changed, create history entry
        if 'status' in serializer.validated_data and old_status != updated_instance.status:
            # Get username if available
            username = None
            if hasattr(self.request, 'user') and self.request.user.is_authenticated:
                username = self.request.user.username
                
            OrderStatusHistory.objects.create(
                order=updated_instance,
                status=updated_instance.status,
                changed_by=username
            )
    
    @transaction.atomic
    def process_ingredients(self, order, action):
        """Process ingredients for an order based on action type (deduct or return)"""
        # Process all order items
        order_items = OrderItem.objects.filter(order=order)
        processed_ingredients = []
        
        for item in order_items:
            product = item.product
            quantity = item.quantity
            
            # Only process deductable products
            if product.deductable:
                # Get all ingredients for this product
                product_ingredients = ProductIngredient.objects.filter(product=product)
                
                # Process each ingredient
                for product_ingredient in product_ingredients:
                    ingredient = product_ingredient.ingredient
                    amount = product_ingredient.quantity * Decimal(quantity)
                    
                    # Deduct or return based on action
                    if action == "deduct":
                        # Verify we have enough stock (safety check)
                        if ingredient.stock < amount:
                            raise serializers.ValidationError(
                                f"Not enough {ingredient.name} in stock to complete this order."
                            )
                        # Deduct from stock
                        ingredient.stock -= amount
                    elif action == "return":
                        # Return to stock
                        ingredient.stock += amount
                    
                    ingredient.save()
                    
                    processed_ingredients.append({
                        "product": product.name,
                        "ingredient": ingredient.name,
                        "amount": float(amount),
                        "unit": ingredient.unit,
                        "action": action
                    })
        
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
        
        # Only update if status has changed
        if order.status != new_status:
            old_status = order.status
            ingredient_changes = []
            
            # Process ingredient stock changes based on status change
            try:
                # If new status is completed, deduct ingredients
                if new_status == "completed":
                    ingredient_changes = self.process_ingredients(order, "deduct")
                
                # If previously processing/pending and new status is cancelled, return any reserved ingredients
                if new_status == "cancelled" and old_status in ["pending", "processing"]:
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
            
            if quantity <= 0:
                return Response(
                    {'error': 'Quantity must be greater than zero'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
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
    def remove_item(self, request, pk=None):
        """Remove an item from a pending order"""
        order = self.get_object()
        
        # Only allow modifications for pending orders
        if order.status != "pending":
            return Response(
                {'error': 'Can only remove items from pending orders'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate input
        item_id = request.data.get('item_id')
        if not item_id:
            return Response(
                {'error': 'Item ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            order_item = OrderItem.objects.get(pk=item_id, order=order)
            order_item.delete()
            
            # Update order total
            order.refresh_from_db()
            order.update_total_price()
            
            return Response({
                'success': True,
                'message': 'Item removed successfully',
                'new_total': str(order.total_price)
            })
            
        except OrderItem.DoesNotExist:
            return Response(
                {'error': 'Order item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
