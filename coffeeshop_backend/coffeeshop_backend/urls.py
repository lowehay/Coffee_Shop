"""
URL configuration for coffeeshop_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/ingredients/', include('ingredient_inventory.urls')),
    path('', include('users.urls')),
]

# Serve media files in all environments
# Note: On Render free tier, uploaded files are ephemeral and will be lost on restart
# For production, consider using cloud storage like Cloudinary or AWS S3
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
