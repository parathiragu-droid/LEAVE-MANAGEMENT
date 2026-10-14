import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LEAVE_TYPE_LABELS, LEAVE_TYPES, ROUTES } from '../utils/constants';
import adminService from '../services/adminService';
import { useNotification } from '../context/NotificationContext';
import { formatDate, calculateDuration, getFriendlyErrorMessage } from '../utils/helpers';
import ConfirmationModal from '../components/ConfirmationModal';
import { SkeletonTable } from '../components/Skeleton';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const AdminRequests = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const { showSuccess, showError } = useNotification();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Confirmation
  const [approveModalLeave, setApproveModalLeave] = useState(null);
  const [approveComment, setApproveComment] = useState('Approved.');
  const [rejectModalLeave, setRejectModalLeave] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchLeaves = async (status) => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAllLeaves(status !== 'ALL' ? status : null);
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to load leave requests.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(statusFilter);
  }, [statusFilter]);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    if (status === 'ALL') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status });
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setSearchQuery('');
    searchParams.delete('status');
    setSearchParams(searchParams);
  };

  // Approval flow
  const handleOpenApproveModal = (leave) => {
    setApproveModalLeave(leave);
    setApproveComment('Approved.');
  };

  const handleConfirmApprove = async () => {
    if (!approveModalLeave) return;
    try {
      setSubmittingAction(true);
      await adminService.approveLeave(approveModalLeave.id, approveComment);
      showSuccess('Leave request approved successfully.');
      setApproveModalLeave(null);
      await fetchLeaves(statusFilter);
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to approve leave request.'));
      setApproveModalLeave(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Rejection flow
  const handleOpenRejectModal = (leave) => {
    setRejectModalLeave(leave);
    setRejectComment('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalLeave) return;
    if (!rejectComment.trim()) {
      setRejectError('A rejection reason is strictly required.');
      return;
    }
    try {
      setSubmittingAction(true);
      await adminService.rejectLeave(rejectModalLeave.id, rejectComment.trim());
      showSuccess('Leave request rejected successfully.');
      setRejectModalLeave(null);
      await fetchLeaves(statusFilter);
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to reject leave request.'));
      setRejectModalLeave(null);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtering & Sorting
  const filteredLeaves = useMemo(() => {
    return leaves
      .filter((leave) => {
        // Status filter
        if (statusFilter !== 'ALL' && leave.status !== statusFilter) {
          return false;
        }
        // Type filter
        if (typeFilter !== 'ALL' && leave.leaveType !== typeFilter) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const nameMatch = (leave.employeeName || '').toLowerCase().includes(q);
          const emailMatch = (leave.employeeEmail || '').toLowerCase().includes(q);
          const reasonMatch = (leave.reason || '').toLowerCase().includes(q);
          return nameMatch || emailMatch || reasonMatch;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
  }, [leaves, statusFilter, typeFilter, searchQuery]);

  const hasActiveFilters = statusFilter !== 'ALL' || typeFilter !== 'ALL' || searchQuery.trim() !== '';


  return (
    <div className="page-container" id="page-admin-requests">
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">Manage Leave Requests</h1>
          <span className="badge badge-admin">Admin Portal</span>
        </div>
        <p className="page-subtitle">
          Review, approve, and reject employee time-off requests. Rejection requires a mandatory administrative reason.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-banner-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        {/* Filters and Search Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-text)', marginRight: '4px' }}>
              Status:
            </span>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => handleStatusFilterChange(st)}
                id={`filter-status-${st.toLowerCase()}`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search, Type Filter, and Clear Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'center' }}>
            <div>
              <input
                type="text"
                className="form-input"
                placeholder="Search by employee name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="input-search-employee"
                aria-label="Search by employee name or email"
              />
            </div>

            <div>
              <select
                className="form-input"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                id="select-filter-type"
                aria-label="Filter by leave category"
              >
                <option value="ALL">All Categories</option>
                {LEAVE_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>
                    {lt.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClearFilters}
                  id="btn-clear-filters"
                  style={{ width: '100%', padding: '10px 14px' }}
                >
                  ✕ Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Count Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-secondary-text)' }}>
            {loading ? 'Searching requests...' : `Showing ${filteredLeaves.length} request${filteredLeaves.length === 1 ? '' : 's'}`}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary-text)' }}>
            {leaves.length} total in system
          </span>
        </div>

        {loading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : filteredLeaves.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">📂</div>
            <h3 className="empty-state-title">No leave requests match your filters.</h3>
            <p className="empty-state-text">
              Try adjusting your search keyword, category, or status filter to see other records.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearFilters}
                style={{ marginTop: '8px' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" id="table-admin-leaves">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Category</th>
                  <th>Dates & Duration</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => {
                  const isPending = leave.status === 'PENDING';
                  const typeLabel = LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType;

                  return (
                    <tr key={leave.id} id={`row-admin-leave-${leave.id}`}>
                      <td>
                        <strong>{leave.employeeName || 'Employee'}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                          {leave.employeeEmail}
                        </span>
                      </td>
                      <td>{typeLabel}</td>
                      <td>
                        <div>{formatDate(leave.startDate)} to {formatDate(leave.endDate)}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)', fontWeight: 600 }}>
                          {calculateDuration(leave.startDate, leave.endDate)}
                        </span>
                      </td>
                      <td style={{ maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td><StatusBadge status={leave.status} /></td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {formatDate(leave.createdAt)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons" style={{ justifyContent: 'center' }}>
                          <Link
                            to={`/admin/requests/${leave.id}`}
                            className="btn-sm btn-action-view"
                            id={`btn-admin-view-${leave.id}`}
                          >
                            View
                          </Link>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn-sm btn-action-approve"
                                onClick={() => handleOpenApproveModal(leave)}
                                id={`btn-admin-approve-${leave.id}`}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-sm btn-action-cancel"
                                onClick={() => handleOpenRejectModal(leave)}
                                id={`btn-admin-reject-${leave.id}`}
                              >
                                Reject
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

      {/* Confirmation Dialog: Approve Leave */}
      <ConfirmationModal
        isOpen={!!approveModalLeave}
        title="Approve Leave Request"
        message="Approve this leave request?"
        confirmText="Confirm Approve"
        confirmVariant="success"
        cancelText="Cancel"
        onConfirm={handleConfirmApprove}
        onCancel={() => setApproveModalLeave(null)}
        loading={submittingAction}
      >
        {approveModalLeave && (
          <div>
            <div style={{ background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '14px', border: '1px solid var(--color-border)' }}>
              <div><strong>Employee:</strong> {approveModalLeave.employeeName} ({approveModalLeave.employeeEmail})</div>
              <div><strong>Category:</strong> {LEAVE_TYPE_LABELS[approveModalLeave.leaveType] || approveModalLeave.leaveType}</div>
              <div><strong>Dates:</strong> {formatDate(approveModalLeave.startDate)} to {formatDate(approveModalLeave.endDate)} ({calculateDuration(approveModalLeave.startDate, approveModalLeave.endDate)})</div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="input-approve-comment">
                Admin Review Comment (Optional):
              </label>
              <input
                type="text"
                id="input-approve-comment"
                className="form-input"
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder="e.g., Approved. Handover confirmed."
              />
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Confirmation Dialog: Reject Leave with Mandatory Reason */}
      <ConfirmationModal
        isOpen={!!rejectModalLeave}
        title="Reject Leave Request"
        confirmText="Confirm Reject"
        confirmVariant="danger"
        cancelText="Cancel"
        onConfirm={handleConfirmReject}
        onCancel={() => setRejectModalLeave(null)}
        loading={submittingAction}
      >
        {rejectModalLeave && (
          <div>
            <p style={{ color: 'var(--color-secondary-text)', margin: '0 0 12px 0' }}>
              Provide a mandatory rejection reason for <strong>{rejectModalLeave.employeeName}</strong>'s request.
            </p>

            <div style={{ background: 'var(--color-bg-secondary)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', border: '1px solid var(--color-border)' }}>
              <div><strong>Dates:</strong> {formatDate(rejectModalLeave.startDate)} to {formatDate(rejectModalLeave.endDate)}</div>
              <div><strong>Reason:</strong> {rejectModalLeave.reason}</div>
            </div>

            {rejectError && (
              <div className="field-error" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '8px' }} role="alert">
                ⚠️ {rejectError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="input-reject-comment">
                Rejection Reason <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                id="input-reject-comment"
                className="form-input"
                rows="3"
                value={rejectComment}
                onChange={(e) => {
                  setRejectComment(e.target.value);
                  setRejectError('');
                }}
                placeholder="e.g., Critical sprint deliverable scheduled during this window."
                required
              ></textarea>
            </div>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
};

export default AdminRequests;
