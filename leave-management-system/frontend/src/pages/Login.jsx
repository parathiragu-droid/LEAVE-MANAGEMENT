import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './pages.css';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bannerMessage = location.state?.message;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validate = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      login(response.token, response.user);
      showSuccess('Login successful.');

      // Role-based navigation to appropriate dashboard
      if (response.user.role === 'ADMIN') {
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      } else {
        const redirectPath = location.state?.from?.pathname || ROUTES.EMPLOYEE_DASHBOARD;
        const safePath = redirectPath.includes('/admin') ? ROUTES.EMPLOYEE_DASHBOARD : redirectPath;
        navigate(safePath, { replace: true });
      }
    } catch (err) {
      const msg = 'Incorrect email or password. Please try again.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" id="page-login" style={{ maxWidth: '440px', margin: '32px auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Sign In</h1>
        <p className="page-subtitle">
          Enter your credentials to access your leave management account.
        </p>
      </div>

      <div className="card">
        {bannerMessage && !errorMessage && (
          <div
            className="alert alert-success"
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
            id="login-banner-message"
            role="status"
          >
            {bannerMessage}
          </div>
        )}

        {errorMessage && (
          <div
            className="alert alert-error"
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
            id="login-error-message"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="placeholder-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              type="email"
              id="login-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
              placeholder="e.g. employee@company.com"
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
            {validationErrors.email && (
              <span className="field-error" style={{ color: '#dc2626', fontSize: '0.85rem' }} role="alert">
                {validationErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                disabled={isSubmitting}
                autoComplete="current-password"
                required
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--color-secondary-text)',
                  padding: '4px',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '🔒'}
              </button>
            </div>
            {validationErrors.password && (
              <span className="field-error" style={{ color: '#dc2626', fontSize: '0.85rem' }} role="alert">
                {validationErrors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting}
            id="login-submit-button"
          >
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </button>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1rem',
              textAlign: 'center',
              fontSize: '0.85rem',
            }}
          >
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
