from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet, UserInfoView, CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView, RegisterView

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)

urlpatterns = [
    path('api/login/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
    path('me/', UserInfoView.as_view(), name='user-info'),
    path('api/logout/', LogoutView.as_view(), name='auth_logout'),
]   
