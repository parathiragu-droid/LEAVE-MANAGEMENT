import React from 'react';
import './StatusBadge.css';

/**
 * Modern Status Badge meeting accessibility standards.
 * Never communicates status using color alone (always icon + text).
 */
export const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  switch (normalized) {
    case 'PENDING':
      return (
        <span className="status-badge status-badge-pending" role="status">
          <span className="status-badge-icon" aria-hidden="true">⏳</span>
          <span className="status-badge-text">Pending</span>
        </span>
      );
    case 'APPROVED':
      return (
        <span className="status-badge status-badge-approved" role="status">
          <span className="status-badge-icon" aria-hidden="true">✓</span>
          <span className="status-badge-text">Approved</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="status-badge status-badge-rejected" role="status">
          <span className="status-badge-icon" aria-hidden="true">✕</span>
          <span className="status-badge-text">Rejected</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="status-badge status-badge-cancelled" role="status">
          <span className="status-badge-icon" aria-hidden="true">⊘</span>
          <span className="status-badge-text">Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="status-badge status-badge-default">
          <span className="status-badge-text">{status || 'Unknown'}</span>
        </span>
      );
  }
};

export default StatusBadge;
