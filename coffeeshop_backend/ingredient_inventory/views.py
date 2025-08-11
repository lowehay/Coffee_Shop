from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Category, Ingredient
from .serializers import CategorySerializer, IngredientSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['category']
    search_fields = ['name', 'notes']
    ordering_fields = ['name', 'stock', 'created_at']
    ordering = ['name']
