from rest_framework import serializers
from .models import Category, Ingredient

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']


class IngredientSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'category', 'category_name', 'stock', 
            'unit', 'reorder_point', 'cost_per_unit', 'notes', 
            'is_low_stock', 'created_at', 'updated_at'
        ]
