import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { showInfo } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    showInfo('Logged out successfully.');
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="navbar" role="banner">
      <div className="navbar-container">
        <Link to={ROUTES.HOME} className="navbar-brand" onClick={closeMenu} aria-label="Leave Management Home">
          <div className="brand-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
              <path d="M8 14h.01"></path>
              <path d="M12 14h.01"></path>
              <path d="M16 14h.01"></path>
              <path d="M8 18h.01"></path>
              <path d="M12 18h.01"></path>
            </svg>
          </div>
          <span className="brand-text">Leave Management</span>
        </Link>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          id="mobile-nav-toggle"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <nav className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`} aria-label="Main Navigation">
          <ul className="nav-links">
            {/* When logged out: Show Home */}
            {!isAuthenticated && (
              <li>
                <NavLink
                  to={ROUTES.HOME}
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeMenu}
                  id="nav-home"
                >
                  Home
                </NavLink>
              </li>
            )}

            {/* When logged in as EMPLOYEE: Dashboard, Apply Leave, My Requests, Profile */}
            {isAuthenticated && user?.role === 'EMPLOYEE' && (
              <>
                <li>
                  <NavLink
                    to={ROUTES.EMPLOYEE_DASHBOARD}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-employee-dashboard"
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={ROUTES.APPLY_LEAVE}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-apply-leave"
                  >
                    Apply Leave
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={ROUTES.MY_REQUESTS}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-my-requests"
                  >
                    My Requests
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={ROUTES.PROFILE}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-employee-profile"
                  >
                    Profile
                  </NavLink>
                </li>
              </>
            )}

            {/* When logged in as ADMIN: Dashboard, Leave Requests, Employees, Profile */}
            {isAuthenticated && user?.role === 'ADMIN' && (
              <>
                <li>
                  <NavLink
                    to={ROUTES.ADMIN_DASHBOARD}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-admin-dashboard"
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={ROUTES.ADMIN_REQUESTS}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-admin-requests"
                  >
                    Leave Requests
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={ROUTES.ADMIN_EMPLOYEES}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-admin-employees"
                  >
                    Employees
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to={ROUTES.PROFILE}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={closeMenu}
                    id="nav-admin-profile"
                  >
                    Profile
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="navbar-actions">
            {/* When logged out: Login & Register buttons */}
            {!isAuthenticated ? (
              <div className="auth-nav">
                <NavLink
                  to={ROUTES.LOGIN}
                  className={({ isActive }) => `nav-btn nav-btn-outline ${isActive ? 'active' : ''}`}
                  onClick={closeMenu}
                  id="nav-login"
                >
                  Login
                </NavLink>
                <NavLink
                  to={ROUTES.REGISTER}
                  className="nav-btn nav-btn-primary"
                  onClick={closeMenu}
                  id="nav-register"
                >
                  Create Account
                </NavLink>
              </div>
            ) : (
              /* When logged in: Profile link + Logout button */
              <div className="auth-nav">
                <Link
                  to={ROUTES.PROFILE}
                  onClick={closeMenu}
                  className="user-profile-badge"
                  id="nav-user-greeting"
                  title="View your profile"
                >
                  <span className="user-icon" aria-hidden="true">👤</span>
                  <span className="user-display-name">{user?.name || user?.email}</span>
                  <span className={`role-pill ${user?.role === 'ADMIN' ? 'role-admin' : 'role-employee'}`}>
                    {user?.role}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="nav-btn nav-btn-logout"
                  id="nav-logout-button"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
