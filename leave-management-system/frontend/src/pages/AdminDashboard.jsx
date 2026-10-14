import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, LEAVE_TYPE_LABELS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import { formatDate, calculateDuration } from '../utils/helpers';
import { SkeletonCards } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        const [dashMetrics, allLeaves] = await Promise.all([
          adminService.getDashboard(),
          adminService.getAllLeaves(),
        ]);
        if (isMounted) {
          setMetrics(dashMetrics);
          const sorted = Array.isArray(allLeaves)
            ? [...allLeaves].sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate))
            : [];
          setRecentLeaves(sorted.slice(0, 5));
          setPendingLeaves(sorted.filter((l) => l.status === 'PENDING').slice(0, 5));
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load admin dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-container" id="page-admin-dashboard">
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">Admin Dashboard</h1>
          <span className="badge badge-admin">Administrator</span>
        </div>
        <p className="page-subtitle">
          Welcome back, <strong>{user?.name || 'Administrator'}</strong>. Real-time enterprise leave operations overview.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-banner-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: '1rem' }}>
          <SkeletonCards count={6} />
        </div>
      ) : (
        <>
          {/* Real Metrics Cards */}
          <div className="stats-grid" id="admin-stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid var(--color-accent)' }} id="stat-total-employees">
              <span className="stat-label">👥 Total Employees</span>
              <span className="stat-value" style={{ color: 'var(--color-primary-text)' }}>{metrics.totalEmployees}</span>
            </div>

            <div className="stat-card stat-card-total" id="stat-total-requests">
              <span className="stat-label">📋 Total Requests</span>
              <span className="stat-value">{metrics.totalRequests}</span>
            </div>

            <div className="stat-card stat-card-pending" id="stat-pending-requests">
              <span className="stat-label">⏳ Pending</span>
              <span className="stat-value" style={{ color: 'var(--color-warning)' }}>{metrics.pending}</span>
            </div>

            <div className="stat-card stat-card-approved" id="stat-approved-requests">
              <span className="stat-label">✅ Approved</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>{metrics.approved}</span>
            </div>

            <div className="stat-card stat-card-rejected" id="stat-rejected-requests">
              <span className="stat-label">❌ Rejected</span>
              <span className="stat-value" style={{ color: 'var(--color-danger)' }}>{metrics.rejected}</span>
            </div>

            <div className="stat-card stat-card-cancelled" id="stat-cancelled-requests">
              <span className="stat-label">🚫 Cancelled</span>
              <span className="stat-value" style={{ color: 'var(--color-secondary-text)' }}>{metrics.cancelled}</span>
            </div>
          </div>

          {/* Quick Management Links */}
          <div style={{ display: 'flex', gap: '12px', margin: '20px 0', flexWrap: 'wrap' }}>
            <Link to={ROUTES.ADMIN_REQUESTS} className="btn btn-primary" id="btn-admin-all-requests">
              View All Requests
            </Link>
            <Link to={ROUTES.ADMIN_EMPLOYEES} className="btn btn-secondary" id="btn-admin-employees-list">
              View Employees
            </Link>
            <Link to={ROUTES.PROFILE} className="btn btn-secondary" id="btn-admin-profile">
              Profile Settings
            </Link>
          </div>

          {/* Pending Requests Requiring Attention Section */}
          {pendingLeaves.length > 0 && (
            <div className="card" style={{ marginBottom: '24px', borderLeft: '5px solid var(--color-warning)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 className="card-title" style={{ margin: 0, color: 'var(--color-warning)' }}>
                    ⏳ Pending Requests Requiring Attention ({metrics.pending})
                  </h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary-text)' }}>
                    Unreviewed requests submitted by employees
                  </span>
                </div>
                <Link
                  to={`${ROUTES.ADMIN_REQUESTS}?status=PENDING`}
                  style={{ color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  Review All Pending →
                </Link>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Dates</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <strong>{req.employeeName || 'Unknown Employee'}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                            {req.employeeEmail}
                          </span>
                        </td>
                        <td>{LEAVE_TYPE_LABELS[req.leaveType] || req.leaveType}</td>
                        <td>
                          <strong>{calculateDuration(req.startDate, req.endDate)}</strong>
                        </td>
                        <td>
                          {formatDate(req.startDate)} to {formatDate(req.endDate)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Link
                            to={`/admin/requests/${req.id}`}
                            className="btn btn-primary"
                            style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Leave Requests Section */}
          <div className="card" id="card-recent-leaves">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>Recent Leave Submissions</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-secondary-text)' }}>
                  Latest submissions across the organization
                </span>
              </div>
              <Link to={ROUTES.ADMIN_REQUESTS} style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem' }}>
                View All Requests →
              </Link>
            </div>

            {recentLeaves.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-secondary-text)' }}>
                <p style={{ margin: 0 }}>No leave requests recorded in the system yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table" id="table-recent-requests">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <strong>{req.employeeName || 'Unknown Employee'}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                            {req.employeeEmail}
                          </span>
                        </td>
                        <td>{LEAVE_TYPE_LABELS[req.leaveType] || req.leaveType}</td>
                        <td>
                          {formatDate(req.startDate)} to {formatDate(req.endDate)}
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                            ({calculateDuration(req.startDate, req.endDate)})
                          </span>
                        </td>
                        <td><StatusBadge status={req.status} /></td>
                        <td style={{ textAlign: 'center' }}>
                          <Link
                            to={`/admin/requests/${req.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                            id={`btn-recent-view-${req.id}`}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
