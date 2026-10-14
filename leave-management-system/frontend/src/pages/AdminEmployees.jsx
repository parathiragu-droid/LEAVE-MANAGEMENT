import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LEAVE_TYPE_LABELS } from '../utils/constants';
import adminService from '../services/adminService';
import { formatDate, calculateDuration, getFriendlyErrorMessage } from '../utils/helpers';
import { SkeletonTable } from '../components/Skeleton';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import './pages.css';

export const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected employee leave history modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await adminService.getEmployees();
        if (isMounted) {
          setEmployees(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(getFriendlyErrorMessage(err, 'Failed to load employee list.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmployees();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleInspectLeaves = async (emp) => {
    setSelectedEmployee(emp);
    setEmployeeLeaves([]);
    setHistoryError('');
    try {
      setLoadingHistory(true);
      const leaves = await adminService.getEmployeeLeaves(emp.id);
      setEmployeeLeaves(Array.isArray(leaves) ? leaves : []);
    } catch (err) {
      setHistoryError(getFriendlyErrorMessage(err, 'Failed to load employee leave history.'));
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="page-container" id="page-admin-employees">
      <div className="page-header">
        <div className="page-title-row">
          <h1 className="page-title">Employees Directory</h1>
          <span className="badge badge-admin">Admin Portal</span>
        </div>
        <p className="page-subtitle">
          View all registered employees and inspect individual leave request histories.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-banner-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0 }}>Registered Employees</h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text)' }}>
              Showing {employees.length} employee{employees.length === 1 ? '' : 's'} (excluding administrative accounts)
            </span>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={4} cols={6} />
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">👥</div>
            <h3 className="empty-state-title">No employees found.</h3>
            <p className="empty-state-text">
              When new employees register through the portal, their records and leave summaries will appear here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table" id="table-admin-employees">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Joined Date</th>
                  <th>Total Requests</th>
                  <th>Pending</th>
                  <th>Approved</th>
                  <th style={{ textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} id={`row-employee-${emp.id}`}>
                    <td>
                      <strong>{emp.name || 'Employee'}</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                        {emp.email}
                      </span>
                    </td>
                    <td>{formatDate(emp.createdAt)}</td>
                    <td>
                      <span className="badge badge-secondary">{emp.totalLeaves || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-pending">{emp.pendingLeaves || 0}</span>
                    </td>
                    <td>
                      <span className="badge badge-approved">{emp.approvedLeaves || 0}</span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-sm btn-action-view"
                        id={`btn-inspect-employee-${emp.id}`}
                        onClick={() => handleInspectLeaves(emp)}
                      >
                        👁️ History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Leave History Modal */}
      {selectedEmployee && (
        <div
          className="modal-backdrop"
          id="modal-employee-leaves"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEmployee(null);
          }}
          role="presentation"
        >
          <div className="modal-card" style={{ maxWidth: '640px' }} role="dialog" aria-modal="true" aria-labelledby="modal-emp-history-title">
            <div className="modal-header">
              <div>
                <h3 className="modal-title" id="modal-emp-history-title">
                  Leave History: {selectedEmployee.name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary-text)' }}>
                  {selectedEmployee.email}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedEmployee(null)}
                aria-label="Close dialog"
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px 24px' }}>
              {historyError && (
                <div className="alert-banner alert-banner-error" style={{ marginBottom: '1rem' }}>
                  <span>⚠️</span>
                  <span>{historyError}</span>
                </div>
              )}

              {loadingHistory ? (
                <LoadingSpinner size="md" text="Loading leave history..." />
              ) : employeeLeaves.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 16px' }}>
                  <p className="empty-state-text" style={{ margin: 0 }}>No leave requests found for this employee.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Dates & Duration</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeLeaves.map((leave) => (
                        <tr key={leave.id}>
                          <td>{LEAVE_TYPE_LABELS[leave.leaveType] || leave.leaveType}</td>
                          <td>
                            <div>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-text)' }}>
                              ({calculateDuration(leave.startDate, leave.endDate)})
                            </span>
                          </td>
                          <td><StatusBadge status={leave.status} /></td>
                          <td>
                            <Link
                              to={`/admin/requests/${leave.id}`}
                              className="btn-sm btn-action-view"
                              onClick={() => setSelectedEmployee(null)}
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

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn modal-btn-cancel"
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmployees;
