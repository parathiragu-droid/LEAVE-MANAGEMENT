import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ROUTES, LEAVE_TYPE_LABELS } from '../utils/constants';
import adminService from '../services/adminService';
import { useNotification } from '../context/NotificationContext';
import { formatDate, formatDateTime, calculateDuration, getFriendlyErrorMessage } from '../utils/helpers';
import ConfirmationModal from '../components/ConfirmationModal';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const AdminLeaveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComment, setApproveComment] = useState('Approved.');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchLeave = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getLeaveById(id);
      setLeave(data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to load leave details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeave();
  }, [id]);

  const handleConfirmApprove = async () => {
    try {
      setSubmittingAction(true);
      await adminService.approveLeave(id, approveComment);
      setShowApproveModal(false);
      showSuccess('Leave request approved successfully.');
      await fetchLeave();
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to approve leave request.'));
      setShowApproveModal(false);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectComment.trim()) {
      setRejectError('A rejection reason is strictly required.');
      return;
    }

    try {
      setSubmittingAction(true);
      await adminService.rejectLeave(id, rejectComment.trim());
      setShowRejectModal(false);
      showSuccess('Leave request rejected successfully.');
      await fetchLeave();
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to reject leave request.'));
      setShowRejectModal(false);
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: '680px', margin: '32px auto' }}>
        <LoadingSpinner size="lg" text="Loading leave review record..." />
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="page-container" style={{ maxWidth: '680px', margin: '32px auto' }}>
        <div className="alert-banner alert-banner-error" role="alert">
          <span>⚠️</span>
          <span>{error || 'Leave request record not found.'}</span>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <Link to={ROUTES.ADMIN_REQUESTS} className="btn btn-secondary">
            ← Return to All Requests
          </Link>
        </div>
      </div>
    );
  }

  const isPending = leave.status === 'PENDING';
  const typeLabel = LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType;
  const durationText = calculateDuration(leave.startDate, leave.endDate);

  return (
    <div className="page-container" id="page-admin-leave-detail" style={{ maxWidth: '680px', margin: '32px auto' }}>
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">Leave Request Review</h1>
          <span className="badge badge-admin">Admin Portal</span>
          <StatusBadge status={leave.status} />
        </div>
        <p className="page-subtitle">
          Administrative inspection and determination console for leave submission.
        </p>
      </div>

      <div className="card">
        {/* Employee Identity Information */}
        <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-text)', marginBottom: '0.75rem' }}>
            👤 Employee Information
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <span className="form-label">Employee Name</span>
              <div style={{ fontWeight: 600, color: 'var(--color-primary-text)', marginTop: '0.2rem' }}>
                {leave.employeeName || 'Unknown Employee'}
              </div>
            </div>

            <div>
              <span className="form-label">Email Address</span>
              <div style={{ color: 'var(--color-secondary-text)', marginTop: '0.2rem' }}>
                {leave.employeeEmail}
              </div>
            </div>
          </div>
        </div>

        {/* Leave Request Specification */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span className="form-label">Leave Category</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-text)', marginTop: '0.2rem' }}>
              {typeLabel}
            </div>
          </div>

          <div>
            <span className="form-label">Duration</span>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.2rem' }}>
              {durationText}
            </div>
          </div>

          <div>
            <span className="form-label">Date Window</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-primary-text)', marginTop: '0.2rem' }}>
              {formatDate(leave.startDate)} to {formatDate(leave.endDate)}
            </div>
          </div>

          <div>
            <span className="form-label">Submitted On</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-secondary-text)', marginTop: '0.2rem' }}>
              {formatDateTime(leave.createdAt)}
            </div>
          </div>
        </div>

        {/* Reason / Narrative */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
          <span className="form-label">Employee Justification</span>
          <div
            style={{
              marginTop: '0.35rem',
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

        {/* Historical Admin Review Audit Trail */}
        {(leave.status === 'APPROVED' || leave.status === 'REJECTED') && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-text)', marginBottom: '0.5rem' }}>
              🛡️ Administrative Audit Information
            </h2>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span className="form-label">Review Comment</span>
                <div
                  style={{
                    marginTop: '0.35rem',
                    padding: '0.85rem',
                    backgroundColor: leave.status === 'APPROVED' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                    borderRadius: '8px',
                    border: `1px solid ${leave.status === 'APPROVED' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                    fontWeight: 500,
                  }}
                >
                  {leave.adminComment || 'No comment recorded.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span className="form-label">Reviewed By</span>
                  <div style={{ marginTop: '0.2rem' }}>
                    <strong>{leave.reviewedByName || 'Administrator'}</strong>
                    {leave.reviewedBy && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                        {leave.reviewedBy}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="form-label">Reviewed At</span>
                  <div style={{ marginTop: '0.2rem', color: 'var(--color-primary-text)', fontWeight: 600 }}>
                    {formatDateTime(leave.reviewedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {isPending ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                onClick={() => setShowApproveModal(true)}
                id="btn-detail-approve"
              >
                ✓ Approve Request
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-border)' }}
                onClick={() => setShowRejectModal(true)}
                id="btn-detail-reject"
              >
                ✕ Reject Request
              </button>
            </>
          ) : (
            <div style={{ padding: '0.5rem 0', fontSize: '0.9rem', color: 'var(--color-secondary-text)' }}>
              This request is finalized as <strong>{leave.status}</strong> and cannot be further transitioned.
            </div>
          )}

          <Link to={ROUTES.ADMIN_REQUESTS} className="btn btn-secondary" style={{ marginLeft: 'auto' }}>
            ← Back to All Requests
          </Link>
        </div>
      </div>

      {/* Confirmation Dialog: Approve Leave */}
      <ConfirmationModal
        isOpen={showApproveModal}
        title="Approve Leave Request"
        message="Approve this leave request?"
        confirmText="Confirm Approve"
        confirmVariant="success"
        cancelText="Cancel"
        onConfirm={handleConfirmApprove}
        onCancel={() => setShowApproveModal(false)}
        loading={submittingAction}
      >
        <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '14px', border: '1px solid var(--color-border)' }}>
          <div><strong>Employee:</strong> {leave.employeeName} ({leave.employeeEmail})</div>
          <div><strong>Category:</strong> {typeLabel}</div>
          <div><strong>Dates:</strong> {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({durationText})</div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="detail-approve-comment">
            Admin Review Comment (Optional):
          </label>
          <input
            type="text"
            id="detail-approve-comment"
            className="form-input"
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            placeholder="e.g., Approved. Handover confirmed."
          />
        </div>
      </ConfirmationModal>

      {/* Confirmation Dialog: Reject Leave */}
      <ConfirmationModal
        isOpen={showRejectModal}
        title="Reject Leave Request"
        confirmText="Confirm Reject"
        confirmVariant="danger"
        cancelText="Cancel"
        onConfirm={handleConfirmReject}
        onCancel={() => setShowRejectModal(false)}
        loading={submittingAction}
      >
        <p style={{ color: 'var(--color-secondary-text)', margin: '0 0 12px 0' }}>
          Please enter a mandatory administrative reason for rejecting this request.
        </p>

        {rejectError && (
          <div className="field-error" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '8px' }} role="alert">
            ⚠️ {rejectError}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="detail-reject-comment">
            Rejection Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="detail-reject-comment"
            className="form-input"
            rows="3"
            value={rejectComment}
            onChange={(e) => {
              setRejectComment(e.target.value);
              setRejectError('');
            }}
            placeholder="e.g., Critical release milestone planned during this period."
            required
          ></textarea>
        </div>
      </ConfirmationModal>
    </div>
  );
};

export default AdminLeaveDetail;
