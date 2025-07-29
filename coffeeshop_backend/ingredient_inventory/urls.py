from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, IngredientViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'ingredients', IngredientViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
