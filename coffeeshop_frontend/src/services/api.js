import axios from 'axios';

/**
 * Centralized axios instance configured for the application
 * - Includes base URL setup for API calls
 * - Configured with credentials for authentication
 * - Can be extended with interceptors for token refresh, error handling, etc.
 */

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
console.log('API URL:', API_URL); // Debug log to verify environment variable

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

/**
 * Request interceptor
 * - Add authorization headers
 * - Handle request configuration
 */
api.interceptors.request.use(
  (config) => {
    // You can add common headers here if needed
    // For example, if you need to add a token that's not in cookies:
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    
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
        // If refresh fails, don't redirect - let components handle it
        console.error('Token refresh failed, user needs to login');
        return Promise.reject(refreshError);
      }
    }
    
    // Handle 400 Bad Request (invalid refresh token)
    if (error.response?.status === 400 && originalRequest.url?.includes('/token/refresh/')) {
      console.error('Invalid refresh token');
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

export default api;
