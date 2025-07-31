from django.contrib import admin
from .models import Product, ProductIngredient

class ProductIngredientInline(admin.TabularInline):
    model = ProductIngredient
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'deductable', 'created_at')
    list_filter = ('deductable', 'created_at')
    search_fields = ('name', 'description')
    inlines = [ProductIngredientInline]

@admin.register(ProductIngredient)
class ProductIngredientAdmin(admin.ModelAdmin):
    list_display = ('product', 'ingredient', 'quantity')
    list_filter = ('product', 'ingredient')
    search_fields = ('product__name', 'ingredient__name')
