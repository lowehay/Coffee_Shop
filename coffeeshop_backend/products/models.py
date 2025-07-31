from django.db import models
from ingredient_inventory.models import Ingredient
from decimal import Decimal
import math

class Product(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    stock = models.PositiveIntegerField()
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deductable = models.BooleanField(default=False, help_text="If checked, selling this product will deduct ingredients from inventory")
    ingredients = models.ManyToManyField(Ingredient, through='ProductIngredient', related_name='products', blank=True)

    def get_available_stock(self):
        """
        Calculate available stock based on either:
        - For deductable products: The maximum possible units based on available ingredients
        - For non-deductable products: The product's stock field
        """
        if not self.deductable:
            # For non-deductable products, just return the stock field
            return self.stock
        
        # For deductable products, calculate based on ingredients
        available_units = float('inf')  # Start with infinity
        
        # Get all ingredients for this product
        product_ingredients = self.product_ingredients.select_related('ingredient').all()
        
        # If no ingredients defined, product can't be made
        if not product_ingredients.exists():
            return 0
        
        # Check each ingredient
        for product_ingredient in product_ingredients:
            ingredient = product_ingredient.ingredient
            required_amount = product_ingredient.quantity
            
            if required_amount <= 0:
                continue  # Skip ingredients with zero quantity
                
            # Calculate how many units we can make with this ingredient
            possible_units = ingredient.stock / required_amount
            
            # Take the floor of the decimal to get whole units
            possible_units = math.floor(possible_units)
            
            # Update the available units (limited by the scarcest ingredient)
            available_units = min(available_units, possible_units)
        
        return available_units
    
    @property
    def available_stock(self):
        """Property for easy access to available stock"""
        return self.get_available_stock()

    def __str__(self):
        return self.name


class ProductIngredient(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_ingredients')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, related_name='product_ingredients')
    quantity = models.DecimalField(max_digits=8, decimal_places=2, help_text="Quantity of ingredient used per product unit")
    
    class Meta:
        unique_together = ('product', 'ingredient')
        verbose_name = "Product Ingredient"
        verbose_name_plural = "Product Ingredients"
    
    def __str__(self):
        return f"{self.product.name} - {self.ingredient.name}: {self.quantity} {self.ingredient.unit}"

