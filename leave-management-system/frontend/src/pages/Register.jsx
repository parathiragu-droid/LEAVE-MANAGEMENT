import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { authService } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { getFriendlyErrorMessage } from '../utils/helpers';
import './pages.css';

export const Register = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      showSuccess(response.message || 'Registration successful! Please login.');
      navigate(ROUTES.LOGIN, {
        state: { message: 'Registration successful! Please sign in with your credentials.' },
      });
    } catch (err) {
      const msg = getFriendlyErrorMessage(err, 'An error occurred during registration. Please try again.');
      setServerError(msg);
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" id="page-register" style={{ maxWidth: '480px', margin: '32px auto' }}>
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1 className="page-title">Create Account</h1>
        <p className="page-subtitle">
          Register to submit and track your employee leave requests.
        </p>
      </div>

      <div className="card">
        {serverError && (
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
            id="register-server-error"
            role="alert"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="placeholder-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <input
              type="text"
              id="register-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
              placeholder="e.g. Ragu Parathi"
              disabled={isSubmitting}
              autoComplete="name"
              required
            />
            {validationErrors.name && (
              <span className="field-error" style={{ color: '#dc2626', fontSize: '0.85rem' }} role="alert">
                {validationErrors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <input
              type="email"
              id="register-email"
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
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                placeholder="Minimum 8 characters"
                disabled={isSubmitting}
                autoComplete="new-password"
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
              <span className="field-error" style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }} role="alert">
                {validationErrors.password}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="register-confirm-password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Re-enter your password"
                disabled={isSubmitting}
                autoComplete="new-password"
                required
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? '👁️' : '🔒'}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <span className="field-error" style={{ color: '#dc2626', fontSize: '0.85rem' }} role="alert">
                {validationErrors.confirmPassword}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={isSubmitting}
            id="register-submit-button"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1rem',
              textAlign: 'center',
              fontSize: '0.85rem',
            }}
          >
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Sign in here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
