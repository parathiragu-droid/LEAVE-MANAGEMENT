import React from 'react';
import './LoadingSpinner.css';

export const LoadingSpinner = ({ size = 'md', text = 'Loading...', inline = false }) => {
  return (
    <div
      className={`spinner-wrapper ${inline ? 'spinner-inline' : 'spinner-block'} spinner-${size}`}
      role="status"
      aria-live="polite"
    >
      <div className="spinner-circle" aria-hidden="true"></div>
      {text && <span className="spinner-text">{text}</span>}
      <span className="sr-only">Loading</span>
    </div>
  );
};

export default LoadingSpinner;
