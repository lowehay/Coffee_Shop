from rest_framework import serializers
from .models import Order
from products.models import Product

class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['id', 'product', 'quantity', 'total_price', 'ordered_at']
        read_only_fields = ['total_price', 'ordered_at']

    def validate_quantity(self, value):
        product = self.initial_data.get('product')
        try:
            product_obj = Product.objects.get(id=product)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")

        if value > product_obj.stock:
            raise serializers.ValidationError("Ordered quantity exceeds available stock.")
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

    def create(self, validated_data):
        product = validated_data['product']
        quantity = validated_data['quantity']

        if product.stock < quantity:
            raise serializers.ValidationError("Not enough stock available.")

        # Calculate total price
        total_price = product.price * quantity
        validated_data['total_price'] = total_price

        # Deduct stock
        product.stock -= quantity
        product.save()

        # Create order
        return super().create(validated_data)
    
    
    def update(self, instance, validated_data):
        product = instance.product
        new_quantity = validated_data.get('quantity', instance.quantity)
        quantity_diff = new_quantity - instance.quantity

        if quantity_diff > 0:
            # Additional quantity requested — check if stock is enough
            if product.stock < quantity_diff:
                raise serializers.ValidationError("Not enough stock to increase quantity.")
            product.stock -= quantity_diff
        elif quantity_diff < 0:
            # Returned or reduced quantity — restock the difference
            product.stock += abs(quantity_diff)

        # Update product stock
        product.save()

        # Update total price
        instance.total_price = product.price * new_quantity
        instance.quantity = new_quantity
        instance.save()

        return instance
