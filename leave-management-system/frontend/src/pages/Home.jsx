import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import './pages.css';

export const Home = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="page-container" id="page-home">
      {/* Hero Section */}
      <section className="hero-section" aria-labelledby="home-hero-title">
        <div className="hero-badge">Modern Workplace System</div>
        <h1 className="hero-title" id="home-hero-title">
          Leave Management
        </h1>
        <p className="hero-lead">
          Request leave. Track updates. Stay informed.
        </p>

        <div className="hero-actions">
          {!isAuthenticated ? (
            <>
              <Link to={ROUTES.LOGIN} className="btn btn-primary" id="home-cta-login">
                Login
              </Link>
              <Link to={ROUTES.REGISTER} className="btn btn-secondary" id="home-cta-register">
                Create Account
              </Link>
            </>
          ) : user?.role === 'ADMIN' ? (
            <Link to={ROUTES.ADMIN_DASHBOARD} className="btn btn-primary" id="home-cta-admin">
              Go to Admin Dashboard →
            </Link>
          ) : (
            <Link to={ROUTES.EMPLOYEE_DASHBOARD} className="btn btn-primary" id="home-cta-employee">
              Go to Employee Dashboard →
            </Link>
          )}
        </div>
      </section>

      {/* Simple 3-Step Process Flow: Apply -> Review -> Track */}
      <section className="process-section" aria-labelledby="process-heading">
        <div className="section-header">
          <h2 className="section-title" id="process-heading">How It Works</h2>
          <p className="section-subtitle">A straightforward workflow designed for clarity and efficiency</p>
        </div>

        <div className="process-grid">
          <div className="process-card">
            <div className="process-step-number">01</div>
            <div className="process-icon" aria-hidden="true">📝</div>
            <h3 className="process-card-title">Apply</h3>
            <p className="process-card-text">
              Select your leave category, choose start and end dates, and provide context in seconds.
            </p>
          </div>

          <div className="process-divider" aria-hidden="true">→</div>

          <div className="process-card">
            <div className="process-step-number">02</div>
            <div className="process-icon" aria-hidden="true">⚖️</div>
            <h3 className="process-card-title">Review</h3>
            <p className="process-card-text">
              Supervisors assess requests promptly with transparent status updates and notes.
            </p>
          </div>

          <div className="process-divider" aria-hidden="true">→</div>

          <div className="process-card">
            <div className="process-step-number">03</div>
            <div className="process-icon" aria-hidden="true">📊</div>
            <h3 className="process-card-title">Track</h3>
            <p className="process-card-text">
              Monitor approval progression, remaining balance summaries, and audit histories in real-time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
