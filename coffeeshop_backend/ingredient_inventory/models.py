from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"


class Ingredient(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='ingredients')
    stock = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=20)  # ml, g, etc.
    reorder_point = models.DecimalField(max_digits=8, decimal_places=2)
    cost_per_unit = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.stock} {self.unit})"
    
    @property
    def is_low_stock(self):
        return self.stock <= self.reorder_point
