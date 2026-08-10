import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status, label, className = '' }) {
  const iconMap = {
    success: '●',
    warning: '▲',
    danger: '■',
    info: 'ⓘ'
  };

  return (
    <span className={`status-badge status-${status} ${className}`}>
      <span className="status-icon">{iconMap[status] || '●'}</span>
      <span className="status-label">{label}</span>
    </span>
  );
}
