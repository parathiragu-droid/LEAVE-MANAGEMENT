import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTES, LEAVE_TYPES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import leaveService from '../services/leaveService';
import { calculateDuration, getFriendlyErrorMessage } from '../utils/helpers';
import './pages.css';

export const ApplyLeave = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [dateError, setDateError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const durationText =
    formData.startDate && formData.endDate && !dateError
      ? calculateDuration(formData.startDate, formData.endDate)
      : null;

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
      setReasonError('Please provide a reason for your leave.');
      return;
    }

    try {
      setSubmitting(true);
      await leaveService.createLeave({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      });

      showSuccess('Leave request submitted successfully.');
      navigate(ROUTES.MY_REQUESTS);
    } catch (err) {
      showError(getFriendlyErrorMessage(err, 'Failed to submit leave request. Please check inputs and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container" id="page-apply-leave" style={{ maxWidth: '640px', margin: '32px auto' }}>
      <div className="page-header">
        <h1 className="page-title">Apply for Leave</h1>
        <p className="page-subtitle">
          Applying as <strong>{user?.name}</strong>. Fill in the details below to submit a new leave request.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="placeholder-form" id="form-apply-leave" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="leave-type">
              Leave Category <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="leave-type"
              name="leaveType"
              className="form-input"
              value={formData.leaveType}
              onChange={handleChange}
              disabled={submitting}
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
              <label className="form-label" htmlFor="leave-start-date">
                Start Date <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="date"
                id="leave-start-date"
                name="startDate"
                className={`form-input ${dateError ? 'input-error' : ''}`}
                value={formData.startDate}
                onChange={handleChange}
                disabled={submitting}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="leave-end-date">
                End Date <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="date"
                id="leave-end-date"
                name="endDate"
                className={`form-input ${dateError ? 'input-error' : ''}`}
                value={formData.endDate}
                onChange={handleChange}
                disabled={submitting}
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
              <label className="form-label" htmlFor="leave-reason">
                Reason / Remarks <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: formData.reason.length > 500 ? 'var(--color-danger)' : 'var(--color-secondary-text)' }}>
                {formData.reason.length} / 500 characters
              </span>
            </div>
            <textarea
              id="leave-reason"
              name="reason"
              className={`form-input ${reasonError ? 'input-error' : ''}`}
              rows="4"
              maxLength={500}
              placeholder="Briefly state the reason for your leave request..."
              value={formData.reason}
              onChange={handleChange}
              disabled={submitting}
              required
            ></textarea>
            {reasonError && (
              <div className="field-error" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '4px' }} role="alert">
                ⚠️ {reasonError}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              id="btn-submit-leave"
              disabled={submitting || !!dateError}
              style={{ flex: 1 }}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link
              to={ROUTES.MY_REQUESTS}
              className="btn btn-secondary"
              id="btn-cancel-apply"
              style={{ padding: '0.75rem 1.25rem' }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
