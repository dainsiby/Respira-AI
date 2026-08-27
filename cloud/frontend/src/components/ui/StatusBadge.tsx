import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'success' | 'warning' | 'error' | 'info';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  let badgeClass = 'status-badge ';

  if (type) {
    badgeClass += `badge-${type}`;
  } else {
    const s = status.toUpperCase();
    if (['ONLINE', 'ACTIVE', 'OPERATIONAL', 'SUCCESS'].includes(s)) {
      badgeClass += 'badge-success';
    } else if (['OFFLINE', 'PENDING', 'WARNING'].includes(s)) {
      badgeClass += 'badge-warning';
    } else if (['DISABLED', 'FAILED', 'ERROR', 'INACTIVE'].includes(s)) {
      badgeClass += 'badge-error';
    } else {
      badgeClass += 'badge-info';
    }
  }

  return <span className={badgeClass}>{status.replace(/_/g, ' ')}</span>;
};
