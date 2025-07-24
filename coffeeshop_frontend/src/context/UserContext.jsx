import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const UserContext = createContext();

// Create axios instance with credentials support
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Important for cookies to be sent/received
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(config => {
  console.log('Making request:', config.url);
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for debugging
api.interceptors.response.use(response => {
  return response;
}, error => {
  console.error('API Error:', error.response ? error.response.status : 'No response', 
              error.response ? error.response.data : error.message);
  return Promise.reject(error);
});

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    // No need to check for tokens in localStorage - cookies are sent automatically
    setLoading(true);
    
    try {
      // Cookies are sent automatically with withCredentials
      const response = await api.get("/me/");
      setUser({ ...response.data, avatar: "/avatars/admin.jpg" });
      setError(null);
    } catch (error) {
      console.log("Error fetching user data:", error);
      
      // If token expired (401 error), try to refresh
      if (error.response && error.response.status === 401) {
        try {
          // Attempt to refresh token - cookies are sent automatically
          await api.post("/api/token/refresh/");
          
          // If refresh successful, retry original request
          const retryResponse = await api.get("/me/");
          setUser({ ...retryResponse.data, avatar: "/avatars/admin.jpg" });
          setError(null);
        } catch (refreshError) {
          // Refresh token is invalid or expired
          console.log("Error refreshing token:", refreshError);
          setUser(null);
          setError("Your session has expired. Please login again.");
          // No need to manually remove cookies - they will be cleared by logout API
        }
      } else {
        // Other error
        setUser(null);
        setError("Could not fetch user data");
      }
    } finally {
      setLoading(false);
    }
  };

  // Create a reusable function for API calls that handles token refresh
  const apiCallWithTokenRefresh = async (url, method = "get", data = null) => {
    try {
      const config = {
        method,
        url
      };
      
      if (data && (method === "post" || method === "put" || method === "patch")) {
        config.data = data;
      }
      
      return await api(config);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Token expired, try refreshing
        try {
          // Attempt to refresh the token - cookie is sent automatically
          await api.post("/api/token/refresh/");
          
          // Retry original request
          return await api({
            method,
            url,
            data: data && (method === "post" || method === "put" || method === "patch") ? data : undefined
          });
        } catch (refreshError) {
          // Refresh failed - logout and redirect
          console.error("Token refresh failed:", refreshError);
          await logout();
          throw new Error("Session expired. Please login again.");
        }
      }
      
      // If not 401 or refresh failed, rethrow the original error
      throw error;
    }
  };

  // Load user data on initial render
  useEffect(() => {
    fetchUserData();
  }, []);

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookies on server
      await api.post("/api/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    // Clear user state regardless of API success
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      error,
      logout,
      fetchUserData,
      apiCallWithTokenRefresh
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
