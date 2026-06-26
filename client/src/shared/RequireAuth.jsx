import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { PageSpinner } from './Spinner';

export default function RequireAuth({ children, role }) {
  const { isAuthenticated, user, isInitialized } = useSelector((state) => state.auth);

  if (!isInitialized) {
    return <PageSpinner message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    // Redirect to the correct portal
    if (user?.role === 'shopOperator') {
      return <Navigate to="/operator/dashboard" replace />;
    }
    return <Navigate to="/app/dashboard" replace />;
  }

  return children;
}
