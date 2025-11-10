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
        available_units = float('inf')
        
        # Get all ingredients for this product
        product_ingredients = self.product_ingredients.select_related('ingredient').all()
        
        # If no ingredients defined, product can't be made
        if not product_ingredients.exists():
            return 0
        
        # Debug: Print current ingredients
        print(f"Calculating stock for {self.name}:")
        
        # Check each ingredient
        for product_ingredient in product_ingredients:
            ingredient = product_ingredient.ingredient
            required_amount = float(product_ingredient.quantity)
            required_unit = str(product_ingredient.required_unit).lower().strip()
            ingredient_unit = str(ingredient.unit).lower().strip()
            ingredient_stock = float(ingredient.stock)
            
            print(f"  Ingredient: {ingredient.name}")
            print(f"    Stock: {ingredient_stock} {ingredient_unit}")
            print(f"    Required: {required_amount} {required_unit}")
            
            if required_amount <= 0:
                print(f"    SKIP: Required amount is {required_amount}")
                continue
            
            # Unit conversion with special handling for coffee
            # Format: 'from_unit': {'to_unit': multiplier}
            # Example: 1kg = 1000g, so kg->g multiplier is 1000
            conversion_factors = {
                'g': {'kg': 0.001, 'mg': 1000, 'g': 1, 'tsp': 0.2, 'tbsp': 0.067},
                'kg': {'g': 1000, 'mg': 1000000, 'kg': 1, 'tsp': 200, 'tbsp': 67},
                'ml': {'l': 0.001, 'cl': 0.1, 'ml': 1, 'tsp': 0.2, 'tbsp': 0.067},
                'l': {'ml': 1000, 'cl': 10, 'l': 1, 'tsp': 200, 'tbsp': 67},
                'pcs': {'pcs': 1, 'dozen': 0.0833, 'unit': 1},
                'tbsp': {'tbsp': 1, 'tsp': 3, 'ml': 15, 'g': 15},
                'tsp': {'tsp': 1, 'tbsp': 0.333333, 'ml': 5, 'g': 5},
            }
            
            # Special conversion for coffee beans: ml to kg
            # Approximate: 1ml coffee beans ≈ 0.4g (varies by grind and bean density)
            special_conversions = {
                ('kg', 'ml'): 0.0004,  # 1ml = 0.0004kg = 0.4g
                ('g', 'ml'): 0.4,     # 1ml = 0.4g
            }
            
            # Calculate converted stock with special handling
            converted_stock = ingredient_stock
            conversion_found = False
            
            # Try standard conversion first
            if ingredient_unit == required_unit:
                converted_stock = ingredient_stock
                conversion_found = True
            elif ingredient_unit in conversion_factors and required_unit in conversion_factors[ingredient_unit]:
                conversion_factor = conversion_factors[ingredient_unit][required_unit]
                converted_stock = ingredient_stock * conversion_factor
                print(f"    Standard conversion: {ingredient_stock} {ingredient_unit} = {converted_stock} {required_unit}")
                conversion_found = True
            elif (ingredient_unit, required_unit) in [('kg', 'ml'), ('g', 'ml')]:
                # Special coffee beans conversion: mass to volume
                if ingredient_unit == 'kg' and required_unit == 'ml':
                    converted_stock = ingredient_stock * 2500  # 1kg ≈ 2500ml coffee beans
                    print(f"    Coffee conversion: {ingredient_stock}kg = {converted_stock}ml")
                    conversion_found = True
                elif ingredient_unit == 'g' and required_unit == 'ml':
                    converted_stock = ingredient_stock * 2.5  # 1g ≈ 2.5ml coffee beans
                    print(f"    Coffee conversion: {ingredient_stock}g = {converted_stock}ml")
                    conversion_found = True
            
            if not conversion_found:
                print(f"    WARNING: No conversion available: {ingredient_unit} to {required_unit}")
                print(f"    Assuming 1:1 ratio for calculation")
                # Use 1:1 ratio as fallback instead of skipping
                converted_stock = ingredient_stock
            
            # Calculate possible units
            possible_units = converted_stock / required_amount
            possible_units = max(0, int(possible_units))
            
            print(f"    Can make: {possible_units} units")
            
            available_units = min(available_units, possible_units)
        
        result = max(0, int(available_units))
        print(f"  FINAL: {result} units available")
        return result
    
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
    required_unit = models.CharField(max_length=10, help_text="Unit for the required quantity (e.g., ml, g, kg)", default='g')
    
    class Meta:
        unique_together = ('product', 'ingredient')
        verbose_name = "Product Ingredient"
        verbose_name_plural = "Product Ingredients"
    
    def __str__(self):
        return f"{self.product.name} - {self.ingredient.name}: {self.quantity} {self.required_unit}"

