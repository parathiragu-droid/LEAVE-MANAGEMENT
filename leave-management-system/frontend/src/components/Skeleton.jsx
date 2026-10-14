import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ width, height, borderRadius, className = '' }) => {
  return (
    <div
      className={`skeleton-base ${className}`}
      style={{
        width: width || '100%',
        height: height || '18px',
        borderRadius: borderRadius || '6px',
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonCards = ({ count = 4 }) => {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <Skeleton width="40%" height="16px" />
          <Skeleton width="60%" height="32px" />
          <Skeleton width="80%" height="14px" />
        </div>
      ))}
    </div>
  );
};

export const SkeletonTable = ({ rows = 4, cols = 5 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width="70%" height="16px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={c === 0 ? '50%' : '80%'} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
