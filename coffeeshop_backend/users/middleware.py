class JWTCookieMiddleware:
    """
    Middleware that adds Authorization header from cookies for JWT authentication
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # If there's already an Authorization header, don't override it
        if 'HTTP_AUTHORIZATION' not in request.META:
            # Check if access token exists in cookies
            access_token = request.COOKIES.get('access_token')
            if access_token:
                # Add the token to the Authorization header
                request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'
                
        response = self.get_response(request)
        return response
