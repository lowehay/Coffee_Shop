from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that extracts tokens from cookies.
    """
    def authenticate(self, request):
        # First try to get the token from the cookies
        raw_token = request.COOKIES.get(settings.SIMPLE_JWT.get('AUTH_COOKIE')) or None
        
        if not raw_token:
            # If not in cookies, try the default Authorization header method
            return super().authenticate(request)
        
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
