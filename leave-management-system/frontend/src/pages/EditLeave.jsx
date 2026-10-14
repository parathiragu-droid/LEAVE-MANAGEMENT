import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ROUTES, LEAVE_TYPES } from '../utils/constants';
import { useNotification } from '../context/NotificationContext';
import leaveService from '../services/leaveService';
import { calculateDuration, getFriendlyErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const EditLeave = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [leaveStatus, setLeaveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  const [reasonError, setReasonError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchLeave = async () => {
      try {
        setLoading(true);
        const data = await leaveService.getLeaveById(id);
        if (isMounted) {
          setLeaveStatus(data.status);
          setFormData({
            leaveType: data.leaveType,
            startDate: data.startDate,
            endDate: data.endDate,
            reason: data.reason || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          showError(getFriendlyErrorMessage(err, 'Failed to load leave request for editing.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLeave();
    return () => {
      isMounted = false;
    };
  }, [id, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextForm = { ...formData, [name]: value };
    setFormData(nextForm);

    if (name === 'startDate' || name === 'endDate') {
      if (nextForm.startDate && nextForm.endDate) {
        if (new Date(nextForm.endDate) < new Date(nextForm.startDate)) {
          setDateError('End date cannot be before start date.');
        } else {
          setDateError('');
        }
      } else {
        setDateError('');
      }
    }

    if (name === 'reason' && reasonError) {
      setReasonError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (leaveStatus !== 'PENDING') {
      showError('Only pending leave requests can be updated.');
      return;
    }

    if (!formData.startDate) {
      setDateError('Start date is required.');
      return;
    }
    if (!formData.endDate) {
      setDateError('End date is required.');
      return;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setDateError('End date cannot be before start date.');
      return;
    }
    if (!formData.reason.trim()) {
      setReasonError('Reason is required.');
      return;
    }

    try {
      setSubmitting(true);
      await leaveService.updateLeave(id, {
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      });

      showSuccess('Leave request updated successfully.');
      navigate(ROUTES.MY_REQUESTS);
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to update leave request.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: '640px', margin: '32px auto' }}>
        <LoadingSpinner size="lg" text="Loading leave details..." />
      </div>
    );
  }

  const isEditable = leaveStatus === 'PENDING';
  const durationText =
    formData.startDate && formData.endDate && !dateError
      ? calculateDuration(formData.startDate, formData.endDate)
      : null;

  return (
    <div className="page-container" id="page-edit-leave" style={{ maxWidth: '640px', margin: '32px auto' }}>
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">Edit Leave Request</h1>
          {leaveStatus && (
            <StatusBadge status={leaveStatus} />
          )}
        </div>
        <p className="page-subtitle">
          Modify your pending leave details. Identity fields and current status are strictly managed by the backend.
        </p>
      </div>

      {!isEditable && (
        <div className="alert-banner alert-banner-info" role="alert" style={{ marginBottom: '1rem' }}>
          <span>ℹ️</span>
          <span>
            This leave request is <strong>{leaveStatus}</strong> and cannot be edited. Only <strong>PENDING</strong> requests may be updated.
          </span>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="placeholder-form" id="form-edit-leave" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-leave-type">
              Leave Category <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="edit-leave-type"
              name="leaveType"
              className="form-input"
              value={formData.leaveType}
              onChange={handleChange}
              disabled={!isEditable || submitting}
              required
            >
              {LEAVE_TYPES.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-start-date">
                Start Date <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="date"
                id="edit-start-date"
                name="startDate"
                className={`form-input ${dateError ? 'input-error' : ''}`}
                value={formData.startDate}
                onChange={handleChange}
                disabled={!isEditable || submitting}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-end-date">
                End Date <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="date"
                id="edit-end-date"
                name="endDate"
                className={`form-input ${dateError ? 'input-error' : ''}`}
                value={formData.endDate}
                onChange={handleChange}
                disabled={!isEditable || submitting}
                required
              />
            </div>
          </div>

          {dateError && (
            <div className="field-error" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginTop: '-0.5rem', marginBottom: '0.75rem' }} role="alert">
              ⚠️ {dateError}
            </div>
          )}

          {durationText && (
            <div style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-primary-text)', marginBottom: '1rem' }}>
              📅 Estimated duration: <strong>{durationText}</strong>
            </div>
          )}

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="edit-reason">
                Reason / Remarks <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: formData.reason.length > 500 ? 'var(--color-danger)' : 'var(--color-secondary-text)' }}>
                {formData.reason.length} / 500 characters
              </span>
            </div>
            <textarea
              id="edit-reason"
              name="reason"
              className={`form-input ${reasonError ? 'input-error' : ''}`}
              rows="4"
              maxLength={500}
              value={formData.reason}
              onChange={handleChange}
              disabled={!isEditable || submitting}
              required
            ></textarea>
            {reasonError && (
              <div className="field-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '4px' }} role="alert">
                ⚠️ {reasonError}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            {isEditable && (
              <button
                type="submit"
                className="btn btn-primary"
                id="btn-save-leave"
                disabled={submitting || !!dateError}
                style={{ flex: 1 }}
              >
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            )}
            <Link
              to={ROUTES.MY_REQUESTS}
              className="btn btn-secondary"
              id="btn-back-requests"
              style={{ padding: '0.75rem 1.25rem' }}
            >
              {isEditable ? 'Cancel' : '← Return to Requests'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeave;
