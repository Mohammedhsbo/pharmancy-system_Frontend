import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, initializing } = useAuthStore();
  const location = useLocation();

  // While checking auth on initial load, show nothing (App.jsx handles the loading screen)
  if (initializing) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // RBAC check — roles are lowercase: 'admin', 'pharmacist', 'cashier'
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
