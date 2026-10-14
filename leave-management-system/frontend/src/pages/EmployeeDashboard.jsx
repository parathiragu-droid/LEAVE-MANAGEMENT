import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, LEAVE_TYPE_LABELS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import leaveService from '../services/leaveService';
import { formatDate, calculateDuration } from '../utils/helpers';
import { SkeletonCards } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        const [summaryData, leavesData] = await Promise.all([
          leaveService.getDashboardSummary(),
          leaveService.getMyLeaves(),
        ]);

        if (isMounted) {
          setSummary(summaryData);
          // Sort newest first and take top 5
          const sorted = Array.isArray(leavesData)
            ? [...leavesData].sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate)).slice(0, 5)
            : [];
          setRecentLeaves(sorted);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-container" id="page-employee-dashboard">
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">Employee Dashboard</h1>
          <span className="badge badge-employee">Employee</span>
        </div>
        <p className="page-subtitle">
          Welcome back, <strong>{user?.name || 'Employee'}</strong>. Here is your real-time leave overview.
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
          <SkeletonCards count={5} />
        </div>
      ) : (
        <>
          {/* Real Backend Data Stat Cards */}
          <div className="stats-grid" id="dashboard-stats-grid">
            <div className="stat-card stat-card-total" id="stat-total">
              <span className="stat-label">📋 Total Requests</span>
              <span className="stat-value">{summary.total}</span>
            </div>

            <div className="stat-card stat-card-pending" id="stat-pending">
              <span className="stat-label">⏳ Pending</span>
              <span className="stat-value" style={{ color: '#d97706' }}>{summary.pending}</span>
            </div>

            <div className="stat-card stat-card-approved" id="stat-approved">
              <span className="stat-label">✅ Approved</span>
              <span className="stat-value" style={{ color: '#059669' }}>{summary.approved}</span>
            </div>

            <div className="stat-card stat-card-rejected" id="stat-rejected">
              <span className="stat-label">❌ Rejected</span>
              <span className="stat-value" style={{ color: '#dc2626' }}>{summary.rejected}</span>
            </div>

            <div className="stat-card stat-card-cancelled" id="stat-cancelled">
              <span className="stat-label">🚫 Cancelled</span>
              <span className="stat-value" style={{ color: '#475569' }}>{summary.cancelled}</span>
            </div>
          </div>

          {/* Quick Actions & Recent Requests Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '24px' }}>
            {/* Quick Actions */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h2 className="card-title">⚡ Quick Actions</h2>
              <div className="card-body">
                <p style={{ color: 'var(--color-secondary-text)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Manage your leaves or view your account:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link to={ROUTES.APPLY_LEAVE} className="btn btn-primary" id="btn-goto-apply" style={{ textAlign: 'center' }}>
                    + Apply for Leave
                  </Link>
                  <Link to={ROUTES.MY_REQUESTS} className="btn btn-secondary" id="btn-goto-requests" style={{ textAlign: 'center' }}>
                    View All My Requests
                  </Link>
                  <Link to={ROUTES.PROFILE} className="btn btn-secondary" id="btn-goto-profile" style={{ textAlign: 'center' }}>
                    View Profile Settings
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Leave Requests */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="card-title" style={{ margin: 0 }}>📅 Recent Leave Requests</h2>
                <Link to={ROUTES.MY_REQUESTS} style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                  View All →
                </Link>
              </div>

              {recentLeaves.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-secondary-text)' }}>
                  <p style={{ margin: '0 0 12px 0' }}>You have not submitted any leave requests yet.</p>
                  <Link to={ROUTES.APPLY_LEAVE} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                    Apply for Leave
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentLeaves.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: '10px',
                        border: '1px solid var(--color-border)',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary-text)', fontSize: '0.925rem' }}>
                          {LEAVE_TYPE_LABELS[req.leaveType] || req.leaveType}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary-text)' }}>
                          {formatDate(req.startDate)} - {formatDate(req.endDate)} &bull; {calculateDuration(req.startDate, req.endDate)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <StatusBadge status={req.status} />
                        <Link
                          to={`/my-requests/${req.id}`}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeeDashboard;
