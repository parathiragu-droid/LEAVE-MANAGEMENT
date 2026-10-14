import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import './pages.css';

export const NotFound = () => {
  const { user, isAuthenticated } = useAuth();

  const getDestination = () => {
    if (!isAuthenticated) return { route: ROUTES.HOME, label: 'Go Home' };
    if (user?.role === 'ADMIN') return { route: ROUTES.ADMIN_DASHBOARD, label: 'Go to Dashboard' };
    return { route: ROUTES.EMPLOYEE_DASHBOARD, label: 'Go to Dashboard' };
  };

  const { route, label } = getDestination();

  return (
    <div className="page-container" id="page-not-found" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '8px' }} aria-hidden="true">🧭</div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent)', margin: 0 }}>404</h1>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-primary-text)', marginTop: '8px' }}>
          Page not found
        </h2>
        <p style={{ color: 'var(--color-secondary-text)', marginTop: '8px', marginBottom: '24px', fontSize: '0.95rem' }}>
          The page you are looking for does not exist, has been removed, or you may not have permission to view it.
        </p>
        <Link to={route} className="btn btn-primary" id="btn-404-destination" style={{ padding: '0.6rem 1.6rem' }}>
          {label}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
