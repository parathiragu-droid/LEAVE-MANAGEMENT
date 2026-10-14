import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-headings)' }}>
        <p>Verifying permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (user?.role !== 'ADMIN') {
    // Non-admin employee denied access to admin console, safely redirected to employee dashboard
    return <Navigate to={ROUTES.EMPLOYEE_DASHBOARD} replace />;
  }

  return children;
};

export default AdminRoute;
