from django.contrib import admin
from .models import Category, Ingredient

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'stock', 'unit', 'reorder_point', 'is_low_stock')
    list_filter = ('category',)
    search_fields = ('name', 'notes')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'category', 'stock', 'unit', 'reorder_point')
        }),
        ('Financial', {
            'fields': ('cost_per_unit',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
