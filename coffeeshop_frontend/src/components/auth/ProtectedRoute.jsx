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

  // If user is not authenticated AND not currently loading, redirect to login
  if (!loading && !user) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />;
  }

  // Pass through to child components to handle their own loading/auth states
  return children;
}
