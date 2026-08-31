import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  let badgeClass = 'status-badge ';

  if (type) {
    badgeClass += `badge-${type}`;
  } else {
    const s = status.toUpperCase();
    if (['ACTIVE', 'COMPLETED', 'ACQUIRED', 'READY_FOR_AI', 'AI_COMPLETED', 'ROUTINE'].includes(s)) {
      badgeClass += 'badge-success';
    } else if (['IN_PROGRESS', 'ASSIGNED', 'SCHEDULED', 'AI_PROCESSING', 'URGENT'].includes(s)) {
      badgeClass += 'badge-warning';
    } else if (['CANCELLED', 'INACTIVE', 'AI_FAILED', 'QUARANTINED', 'FAILED'].includes(s)) {
      badgeClass += 'badge-error';
    } else {
      badgeClass += 'badge-info';
    }
  }

  return <span className={badgeClass}>{status.replace(/_/g, ' ')}</span>;
};
