from rest_framework import serializers
from .models import Order, OrderStatusHistory, OrderItem
from products.models import Product
from users.models import Customer

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'changed_at', 'changed_by']
        read_only_fields = ['id', 'changed_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    item_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image', 'quantity', 'price', 'item_total']
        read_only_fields = ['price', 'item_total']

    def validate(self, data):
        # Check if we have enough stock
        product = data['product']
        quantity = data['quantity']
        
        if quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
            
        if product.stock < quantity:
            raise serializers.ValidationError({"quantity": f"Not enough stock. Only {product.stock} available."})
        
        return data

class OrderSerializer(serializers.ModelSerializer):
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source='customer',
        write_only=True,
        required=False
    )
    # Accept customer_name directly for writing
    customer_name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    items = OrderItemSerializer(many=True, read_only=False, required=False)
    
    # Add item count for table display
    items_count = serializers.SerializerMethodField()
    
    # Add summary of items for table display
    items_summary = serializers.SerializerMethodField()
    
    # For bulk creation of items during order creation
    order_items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_items_summary(self, obj):
        items = obj.items.all()
        if not items:
            return "No items"
        
        # If only one item, return its name and quantity
        if items.count() == 1:
            item = items[0]
            return f"{item.quantity}x {item.product.name}"
        
        # Otherwise, return first item + count of others
        return f"{items[0].product.name} + {items.count() - 1} more"
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_id', 'customer_id', 'customer_name', 'total_price',
            'status', 'status_display', 'status_history', 'ordered_at', 'items', 'order_items',
            'items_count', 'items_summary'
        ]
        read_only_fields = ['total_price', 'ordered_at', 'order_id', 'status_history']
    
    def create(self, validated_data):
        # Extract and remove order_items data
        order_items_data = validated_data.pop('order_items', [])
        
        # Handle customer name logic
        # If customer (FK) exists, use its name if customer_name not provided
        customer = validated_data.get('customer')
        if customer and not validated_data.get('customer_name'):
            validated_data['customer_name'] = customer.name
        
        # Create the order without items first
        order = Order.objects.create(**validated_data)
        
        # Create order items and handle stock reductions
        for item_data in order_items_data:
            product_id = item_data.get('product')
            quantity = item_data.get('quantity', 1)
            
            # Get the product instance
            try:
                product = Product.objects.get(pk=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError({"product": f"Product with ID {product_id} not found."})
            
            # Check stock
            if product.stock < quantity:
                raise serializers.ValidationError(
                    {"quantity": f"Not enough stock for {product.name}. Only {product.stock} available."}
                )
            
            # Reduce stock
            product.stock -= quantity
            product.save()
            
            # Create order item
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=product.price
            )
        
        # The order.update_total_price() will be called by the OrderItem.save() method
        return order
    
    def update(self, instance, validated_data):
        # We're not supporting direct updates to order items through this serializer
        # Items should be managed through a dedicated OrderItemViewSet
        
        # Update basic order fields
        instance.customer = validated_data.get('customer', instance.customer)
        instance.status = validated_data.get('status', instance.status)
        instance.save()
        
        return instance
