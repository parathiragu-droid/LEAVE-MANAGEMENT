import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES, LEAVE_TYPE_LABELS, LEAVE_STATUSES } from '../utils/constants';
import leaveService from '../services/leaveService';
import { useNotification } from '../context/NotificationContext';
import { formatDate, calculateDuration, getFriendlyErrorMessage } from '../utils/helpers';
import ConfirmationModal from '../components/ConfirmationModal';
import { SkeletonTable } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const MyRequests = () => {
  const { showSuccess, showError } = useNotification();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state
  const [cancelModalLeave, setCancelModalLeave] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await leaveService.getMyLeaves();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to load your leave requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleOpenCancelModal = (leave) => {
    setCancelModalLeave(leave);
  };

  const handleCloseCancelModal = () => {
    setCancelModalLeave(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalLeave) return;

    try {
      setCancelling(true);
      await leaveService.cancelLeave(cancelModalLeave.id);
      showSuccess('Leave request cancelled successfully.');
      handleCloseCancelModal();
      await fetchLeaves();
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to cancel leave request.'));
      handleCloseCancelModal();
    } finally {
      setCancelling(false);
    }
  };

  // Filtered and sorted newest first
  const filteredLeaves = useMemo(() => {
    return leaves
      .filter((l) => {
        const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
        const query = searchQuery.trim().toLowerCase();
        const typeLabel = (LEAVE_TYPE_LABELS[l.leaveType] || l.leaveType || '').toLowerCase();
        const reason = (l.reason || '').toLowerCase();
        const matchesQuery = !query || typeLabel.includes(query) || reason.includes(query);
        return matchesStatus && matchesQuery;
      })
      .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  }, [leaves, statusFilter, searchQuery]);


  return (
    <div className="page-container" id="page-my-requests">
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">My Leave Requests</h1>
          <span className="badge badge-employee">Employee</span>
        </div>
        <p className="page-subtitle">
          Track and manage your submitted leave applications. Only pending requests can be modified or cancelled.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-banner-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>Request History</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
              Showing {filteredLeaves.length} of {leaves.length} total request{leaves.length === 1 ? '' : 's'}
            </span>
          </div>
          <Link to={ROUTES.APPLY_LEAVE} className="btn btn-primary" id="btn-new-application" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>
            + Apply for Leave
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
          <div style={{ flex: '1 1 220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by category or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.875rem' }}
              aria-label="Search leaves by category or reason"
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter(st)}
                style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              >
                {st}
              </button>
            ))}

            {(statusFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                style={{ fontSize: '0.75rem', padding: '5px 10px', color: 'var(--color-secondary-text)' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={4} cols={5} />
        ) : filteredLeaves.length === 0 ? (
          <div className="empty-state" id="empty-state-leaves">
            <div className="empty-state-icon" aria-hidden="true">📄</div>
            <h3 className="empty-state-title">
              {leaves.length === 0 ? 'No leave requests found.' : 'No requests match your filter.'}
            </h3>
            <p className="empty-state-text">
              {leaves.length === 0
                ? "You haven't submitted any leave applications yet. Click below to submit your first request."
                : 'Try adjusting your search query or status filter to see other requests.'}
            </p>
            {leaves.length === 0 && (
              <Link to={ROUTES.APPLY_LEAVE} className="btn btn-primary" id="btn-empty-apply">
                Apply for Leave
              </Link>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" id="table-my-requests">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates & Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => {
                  const typeLabel = LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType;
                  const isPending = leave.status === 'PENDING';

                  return (
                    <tr key={leave.id} id={`row-leave-${leave.id}`}>
                      <td>
                        <strong>{typeLabel}</strong>
                      </td>
                      <td>
                        <div>{formatDate(leave.startDate)} to {formatDate(leave.endDate)}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', fontWeight: 600 }}>
                          {calculateDuration(leave.startDate, leave.endDate)}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td><StatusBadge status={leave.status} /></td>
                      <td>{formatDate(leave.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <Link
                            to={`/my-requests/${leave.id}`}
                            className="btn-sm btn-action-view"
                            id={`btn-view-${leave.id}`}
                          >
                            View
                          </Link>

                          {isPending && (
                            <>
                              <Link
                                to={`/my-requests/${leave.id}/edit`}
                                className="btn-sm btn-action-edit"
                                id={`btn-edit-${leave.id}`}
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                className="btn-sm btn-action-cancel"
                                id={`btn-cancel-${leave.id}`}
                                onClick={() => handleOpenCancelModal(leave)}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal for Leave Cancellation */}
      <ConfirmationModal
        isOpen={!!cancelModalLeave}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave request?"
        confirmText="Yes, Cancel Leave"
        confirmVariant="danger"
        cancelText="Keep Request"
        onConfirm={handleConfirmCancel}
        onCancel={handleCloseCancelModal}
        loading={cancelling}
      >
        {cancelModalLeave && (
          <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem' }}>
            <div><strong>Type:</strong> {LEAVE_TYPE_LABELS[cancelModalLeave.leaveType] || cancelModalLeave.leaveType}</div>
            <div><strong>Dates:</strong> {formatDate(cancelModalLeave.startDate)} to {formatDate(cancelModalLeave.endDate)} ({calculateDuration(cancelModalLeave.startDate, cancelModalLeave.endDate)})</div>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
};

export default MyRequests;
