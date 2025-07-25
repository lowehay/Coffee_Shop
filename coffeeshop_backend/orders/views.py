from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order, OrderStatusHistory, OrderItem
from .serializers import OrderSerializer, OrderStatusHistorySerializer, OrderItemSerializer

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
    
    def perform_create(self, serializer):
        # Get the order
        order_id = self.request.data.get('order')
        if not order_id:
            # Also check if order is directly in validated_data
            order = serializer.validated_data.get('order')
            if not order:
                from rest_framework import serializers
                raise serializers.ValidationError({"order": "Order is required"})
        else:
            try:
                order = Order.objects.get(pk=order_id)
                # Add order to validated_data so it's available during save
                serializer.validated_data['order'] = order
            except Order.DoesNotExist:
                from rest_framework import serializers
                raise serializers.ValidationError({"order": "Order not found"})
        
        # Check if there's enough stock
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']
        
        if product.stock < quantity:
            raise serializers.ValidationError(
                {"quantity": f"Not enough stock. Only {product.stock} available."}
            )
            
        # Update product stock
        product.stock -= quantity
        product.save()
        
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
    
    @action(detail=True, methods=['patch'])
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
                'history_entry': OrderStatusHistorySerializer(history_entry).data
            })
        else:
            return Response({'message': 'Status unchanged'}, status=status.HTTP_200_OK)
