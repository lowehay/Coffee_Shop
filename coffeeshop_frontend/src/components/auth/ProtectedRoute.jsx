import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';

/**
 * ProtectedRoute component that restricts access to authenticated users only
 * Redirects to login if not authenticated, preserving the intended destination
 * Allows child components to handle their own loading states
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  const location = useLocation();

  // Show nothing while loading to prevent flash of login page
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  // Only redirect to login after loading is complete and no user
  if (!user) {
    // Prevent redirect loop when already on login page
    if (location.pathname === "/") {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  return children;
}
