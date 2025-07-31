from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, ProductIngredientView

router = DefaultRouter()
router.register(r'products', ProductViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('product-ingredients/<int:product_id>/', ProductIngredientView.as_view(), name='product-ingredients'),
]
