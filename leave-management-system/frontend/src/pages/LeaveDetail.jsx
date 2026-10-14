import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ROUTES, LEAVE_TYPE_LABELS } from '../utils/constants';
import leaveService from '../services/leaveService';
import { useNotification } from '../context/NotificationContext';
import { formatDate, formatDateTime, calculateDuration, getFriendlyErrorMessage } from '../utils/helpers';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const LeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchLeave = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await leaveService.getLeaveById(id);
      setLeave(data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Leave request not found.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeave();
  }, [id]);

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await leaveService.cancelLeave(id);
      setShowCancelModal(false);
      showSuccess('Leave request cancelled successfully.');
      await fetchLeave();
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to cancel leave request.'));
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: '640px', margin: '32px auto' }}>
        <LoadingSpinner size="lg" text="Loading leave details..." />
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="page-container" style={{ maxWidth: '640px', margin: '32px auto' }}>
        <div className="alert-banner alert-banner-error" role="alert">
          <span>⚠️</span>
          <span>{error || 'Leave request not found.'}</span>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to={ROUTES.MY_REQUESTS} className="btn btn-secondary">
            ← Return to My Requests
          </Link>
        </div>
      </div>
    );
  }

  const isPending = leave.status === 'PENDING';
  const typeLabel = LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType;
  const durationText = calculateDuration(leave.startDate, leave.endDate);

  return (
    <div className="page-container" id="page-leave-detail" style={{ maxWidth: '640px', margin: '32px auto' }}>
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">Leave Request Details</h1>
          <StatusBadge status={leave.status} />
        </div>
        <p className="page-subtitle">
          Submitted by <strong>{leave.employeeName}</strong>
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <div>
              <span className="form-label">Leave Category</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-text)', marginTop: '0.25rem' }}>
                {typeLabel}
              </div>
            </div>

            <div>
              <span className="form-label">Total Duration</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.25rem' }}>
                {durationText}
              </div>
            </div>

            <div>
              <span className="form-label">Start Date</span>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary-text)', marginTop: '0.25rem' }}>
                {formatDate(leave.startDate)}
              </div>
            </div>

            <div>
              <span className="form-label">End Date</span>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary-text)', marginTop: '0.25rem' }}>
                {formatDate(leave.endDate)}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <span className="form-label">Reason / Remarks</span>
            <div
              style={{
                marginTop: '0.4rem',
                padding: '0.85rem',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary-text)',
                lineHeight: 1.6,
              }}
            >
              {leave.reason}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--color-secondary-text)', display: 'block' }}>Submitted On:</span>
              <strong style={{ color: 'var(--color-primary-text)' }}>{formatDateTime(leave.createdAt)}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-secondary-text)', display: 'block' }}>Last Updated:</span>
              <strong style={{ color: 'var(--color-primary-text)' }}>{formatDateTime(leave.updatedAt)}</strong>
            </div>
          </div>

          {/* Administrative Review Section */}
          {(leave.status === 'APPROVED' || leave.status === 'REJECTED') && (
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }} id="section-admin-review">
              <span className="form-label">Review Status & Feedback</span>
              <div
                style={{
                  marginTop: '0.4rem',
                  padding: '1rem',
                  backgroundColor: leave.status === 'APPROVED' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  borderRadius: '10px',
                  border: `1px solid ${leave.status === 'APPROVED' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                }}
              >
                <div style={{ fontWeight: 700, color: leave.status === 'APPROVED' ? 'var(--color-success)' : 'var(--color-danger)', marginBottom: '0.35rem' }}>
                  {leave.status === 'APPROVED' ? '✅ Request Approved' : '❌ Request Rejected'}
                </div>
                <p style={{ margin: 0, color: 'var(--color-primary-text)', fontSize: '0.95rem' }}>
                  {leave.adminComment || (leave.status === 'APPROVED' ? 'Approved by administrator.' : 'Rejected.')}
                </p>
                <div style={{ marginTop: '0.65rem', fontSize: '0.8rem', color: 'var(--color-secondary-text)' }}>
                  Reviewed by Administrator {leave.reviewedAt && `on ${formatDateTime(leave.reviewedAt)}`}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {isPending && (
              <>
                <Link
                  to={`/my-requests/${leave.id}/edit`}
                  className="btn btn-primary"
                  id="btn-detail-edit"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  ✏️ Edit Request
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  id="btn-detail-cancel"
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)', padding: '0.65rem 1.25rem' }}
                  onClick={() => setShowCancelModal(true)}
                >
                  ✕ Cancel Request
                </button>
              </>
            )}
            <Link
              to={ROUTES.MY_REQUESTS}
              className="btn btn-secondary"
              id="btn-detail-back"
              style={{ padding: '0.65rem 1.25rem' }}
            >
              ← Back to My Requests
            </Link>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request?"
        confirmText="Yes, Cancel Leave"
        confirmVariant="danger"
        cancelText="Keep Request"
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
        loading={cancelling}
      >
        <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem' }}>
          <div><strong>Category:</strong> {typeLabel}</div>
          <div><strong>Dates:</strong> {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({durationText})</div>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default LeaveDetail;
