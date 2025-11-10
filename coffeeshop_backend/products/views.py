from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Product, ProductIngredient
from ingredient_inventory.models import Ingredient
from .serializers import ProductSerializer, ProductDetailSerializer, ProductIngredientSerializer
from decimal import Decimal

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return ProductDetailSerializer
        return ProductSerializer
        
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        was_deductable = instance.deductable
        
        # Keep track of if deductable status is changing
        becoming_non_deductable = was_deductable and 'deductable' in request.data and not request.data.get('deductable')
        
        # Process update normally
        response = super().update(request, *args, **kwargs)
        
        # Special case: if product was deductable but now isn't, clear the stock field
        if becoming_non_deductable:
            product = self.get_object()  # Get the updated instance
            
            # Clear the stock value when switching from deductable to non-deductable
            # This forces users to manually set an appropriate stock value
            product.stock = 0
            product.save(update_fields=['stock'])
            
            # Update the response data
            response.data['stock'] = product.stock
                
        return response

class ProductIngredientView(APIView):
    """
    API endpoint to manage ingredients associated with a product
    """
    
    def get(self, request, product_id):
        """Get all ingredients for a specific product"""
        product = get_object_or_404(Product, id=product_id)
        product_ingredients = ProductIngredient.objects.filter(product=product)
        serializer = ProductIngredientSerializer(product_ingredients, many=True)
        return Response(serializer.data)
    
    def post(self, request, product_id):
        """Update ingredients for a specific product"""
        product = get_object_or_404(Product, id=product_id)
        
        # First delete all existing product-ingredient associations
        ProductIngredient.objects.filter(product=product).delete()
        
        # Extract ingredients data from request
        ingredients_data = request.data.get('ingredients', [])
        created_items = []
        errors = []
        
        for item in ingredients_data:
            try:
                ingredient_id = item.get('ingredient')
                quantity = item.get('quantity')
                
                if not ingredient_id or not quantity:
                    errors.append({"error": "Missing ingredient_id, quantity, or required_unit", "item": item})
                    continue
                
                # Convert quantity to Decimal
                try:
                    quantity = Decimal(str(quantity))
                except:
                    errors.append({"error": "Invalid quantity format", "item": item})
                    continue
                
                # Get the ingredient
                try:
                    ingredient = Ingredient.objects.get(id=ingredient_id)
                except Ingredient.DoesNotExist:
                    errors.append({"error": f"Ingredient with ID {ingredient_id} not found", "item": item})
                    continue
                
                # Extract required_unit
                required_unit = item.get('required_unit', ingredient.unit)
                
                # Create the product-ingredient relation
                product_ingredient = ProductIngredient.objects.create(
                    product=product,
                    ingredient=ingredient,
                    quantity=quantity,
                    required_unit=required_unit
                )
                created_items.append(ProductIngredientSerializer(product_ingredient).data)
            
            except Exception as e:
                errors.append({"error": str(e), "item": item})
        
        return Response({
            "created": created_items,
            "errors": errors if errors else None,
            "message": f"Added {len(created_items)} ingredients to product {product.name}"
        }, status=status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS)
