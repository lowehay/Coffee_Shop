from rest_framework import serializers
from .models import Product, ProductIngredient
from ingredient_inventory.serializers import IngredientSerializer

class ProductIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')
    required_unit = serializers.ReadOnlyField()
    
    class Meta:
        model = ProductIngredient
        fields = ['id', 'ingredient', 'ingredient_name', 'ingredient_unit', 'quantity', 'required_unit']

class ProductIngredientWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductIngredient
        fields = ['ingredient', 'quantity', 'required_unit']

class ProductSerializer(serializers.ModelSerializer):
    product_ingredients = ProductIngredientSerializer(many=True, read_only=True)
    available_stock = serializers.IntegerField(source='get_available_stock', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'stock', 'available_stock', 'description', 'image', 
                  'deductable', 'created_at', 'updated_at', 'product_ingredients']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        # For deductable products, replace the stock value with the available_stock (ingredient-based)
        # This ensures the frontend always sees the correct stock for deductable products
        if instance.deductable:
            data['stock'] = data['available_stock']
        
        # Ensure image URL is absolute (important for Cloudinary)
        if instance.image:
            request = self.context.get('request')
            if request and not data['image'].startswith('http'):
                # Build absolute URL for local storage
                data['image'] = request.build_absolute_uri(instance.image.url)
            elif data['image'] and not data['image'].startswith('http'):
                # For Cloudinary, the URL should already be absolute
                # But if it's not, use the image.url which Cloudinary provides
                data['image'] = instance.image.url
            
        return data
        
    def validate(self, data):
        # If product is deductable, stock can be any value (we'll ignore it)
        # For non-deductable products, stock must be a valid positive integer
        if data.get('deductable'):
            # For deductable products, always set a default stock value
            # This will be replaced with calculated available_stock when displaying
            data['stock'] = 0
        elif data.get('stock', 0) <= 0:
            raise serializers.ValidationError({'stock': 'Stock must be a positive integer for non-deductable products'})
            
        return data

class ProductDetailSerializer(ProductSerializer):
    ingredients_data = serializers.SerializerMethodField()
    
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ['ingredients_data']
    
    def get_ingredients_data(self, obj):
        product_ingredients = obj.product_ingredients.all()
        return ProductIngredientSerializer(product_ingredients, many=True).data
