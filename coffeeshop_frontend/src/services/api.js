import axios from 'axios';

/**
 * Centralized axios instance configured for the application
 * - Includes base URL setup for API calls
 * - Configured with credentials for authentication
 * - CSRF protection via X-CSRFToken header
 * - Request timeout to prevent indefinite hanging
 * - Can be extended with interceptors for token refresh, error handling, etc.
 */

const isDev = import.meta.env.DEV;

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
if (isDev) console.log('API URL:', API_URL);

/**
 * Parse a cookie value by name from document.cookie
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout to prevent indefinite hanging
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  xsrfCookieName: 'csrftoken',      // Django's default CSRF cookie name
  xsrfHeaderName: 'X-CSRFToken',     // Django's expected CSRF header name
});

/**
 * Request interceptor
 * - Attach CSRF token for state-changing requests
 * - Handle request configuration
 */
api.interceptors.request.use(
  (config) => {
    // For state-changing methods, ensure CSRF token is included
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handle common responses
 * - Global error handling
 * - Prevent infinite loops on auth failures
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip retry for /me/ endpoint to prevent loops
      if (originalRequest.url?.includes('/me/')) {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        await axios.post(
          `${API_URL}/api/token/refresh/`, 
          {}, 
          { withCredentials: true }
        );
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        if (isDev) console.error('Token refresh failed, user needs to login');
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 400 Bad Request (invalid refresh token)
    if (error.response?.status === 400 && originalRequest.url?.includes('/token/refresh/')) {
      if (isDev) console.error('Invalid refresh token');
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;
