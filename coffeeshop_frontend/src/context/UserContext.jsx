import React, { useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";

// Import UserContext from separate file for Fast Refresh compatibility
import { UserContext } from "./UserContext.context";


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
  const refreshTimerRef = useRef(null);
  
  // Token refresh interval (4 minutes = 240000ms)
  // Set this to refresh before your token expires (typically 5 minutes)
  const REFRESH_INTERVAL = 240000;

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

  // Define logout first to avoid circular reference
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to clear cookies on server
      await api.post("/api/logout/");
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    // Clear token refresh timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    // Clear user state regardless of API success
    setUser(null);
  }, [refreshTimerRef]);

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

  // Setup automatic token refresh using useCallback to avoid dependency issues
  const setupTokenRefresh = useCallback(() => {
    // Clear any existing timer first
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
    
    // Set up new timer for regular token refresh
    refreshTimerRef.current = setInterval(async () => {
      try {
        // Only try to refresh if we have a user (we're logged in)
        if (user) {
          console.log('Performing automatic token refresh');
          await api.post('/api/token/refresh/');
          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Automatic token refresh failed:', error);
        // If refresh fails, logout the user
        if (error.response && error.response.status === 401) {
          console.log('Token refresh failed with 401, logging out');
          logout();
        }
      }
    }, REFRESH_INTERVAL);
  }, [user, logout, REFRESH_INTERVAL]);
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);
  
  // Load user data on initial render
  useEffect(() => {
    fetchUserData();
  }, []);
  
  // Setup token refresh whenever user changes
  useEffect(() => {
    if (user) {
      setupTokenRefresh();
    } else if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }
  }, [user, setupTokenRefresh]);

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

// useUser hook moved to a separate file src/hooks/useUser.jsx
