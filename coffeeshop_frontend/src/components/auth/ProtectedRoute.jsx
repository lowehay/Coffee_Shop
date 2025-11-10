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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // User is authenticated, render children
  return children;
}
