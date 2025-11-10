from rest_framework import viewsets, status
from .models import Customer
from .serializers import CustomerSerializer
from django.contrib.auth.models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from datetime import datetime

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

# Create your views here.

class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            "id": user.id,
        })

class CookieTokenObtainPairView(TokenObtainPairView):
    def finalize_response(self, request, response, *args, **kwargs):
        from django.conf import settings
        
        # Determine cookie settings based on DEBUG mode
        is_production = not settings.DEBUG
        
        if response.data.get('access'):
            response.set_cookie(
                'access_token',
                response.data['access'],
                max_age=5*60,  # 5 minutes
                httponly=True,
                samesite='None' if is_production else 'Lax',
                secure=is_production  # True in production with HTTPS
            )
            del response.data['access']
            
        if response.data.get('refresh'):
            response.set_cookie(
                'refresh_token',
                response.data['refresh'],
                max_age=14*24*60*60,  # 14 days
                httponly=True,
                samesite='None' if is_production else 'Lax',
                secure=is_production  # True in production with HTTPS
            )
            del response.data['refresh']
            
        return super().finalize_response(request, response, *args, **kwargs)

class CookieTokenRefreshView(TokenRefreshView):
    def extract_refresh_token(self):
        refresh_token = self.request.COOKIES.get('refresh_token')
        if refresh_token:
            return {"refresh": refresh_token}
        # Return empty dict if no refresh token found, let validation handle it
        return {"refresh": None}

    def post(self, request, *args, **kwargs):
        # Get refresh token from cookies
        refresh_token = self.request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {"detail": "Refresh token not found in cookies"},     
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Create mutable data with refresh token
        data = {"refresh": refresh_token}
        
        # Create a serializer instance with the data
        from rest_framework_simplejwt.serializers import TokenRefreshSerializer
        serializer = TokenRefreshSerializer(data=data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response(
                {"detail": "Invalid refresh token"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )          
        
        # Get the validated data
        validated_data = serializer.validated_data
        
        # Create response with new access token
        response = Response({"detail": "Token refreshed successfully"})
        
        # Set new access token cookie
        from django.conf import settings
        is_production = not settings.DEBUG
        
        response.set_cookie(
            'access_token',
            validated_data['access'],
            max_age=5*60,  # 5 minutes
            httponly=True,
            samesite='None' if is_production else 'Lax',
            secure=is_production
        )
        
        return response
        
    def finalize_response(self, request, response, *args, **kwargs):
        from django.conf import settings
        is_production = not settings.DEBUG
        
        if response.data.get('access'):
            response.set_cookie(
                'access_token',
                response.data['access'],
                max_age=5*60,  # 5 minutes
                httponly=True,
                samesite='None' if is_production else 'Lax',
                secure=is_production
            )
            del response.data['access']
            
        return super().finalize_response(request, response, *args, **kwargs)

class LogoutView(APIView):
    def post(self, request):
        response = Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        
        # Delete access token cookie with all necessary parameters
        response.delete_cookie(
            'access_token',
            path='/',
            domain=None,  # Use None for localhost
            samesite='Lax'
        )
        
        # Delete refresh token cookie with all necessary parameters
        response.delete_cookie(
            'refresh_token',
            path='/',
            domain=None,  # Use None for localhost
            samesite='Lax'
        )
        
        return response

class RegisterView(APIView):
    def post(self, request):
        print("Registration request data:", request.data)  # Debug log
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not username or not email or not password:
            return Response(
                {"error": "Username, email, and password are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already exists"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Create Customer profile
            Customer.objects.create(
                user=user,
                name=username
            )
            
            return Response(
                {"message": "User registered successfully"}, 
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            print("Registration error:", str(e))  # Debug log
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )