import React from 'react';
import './ProbabilityBar.css';

export default function ProbabilityBar({ label, percentage }) {
  return (
    <div className="probability-bar-container">
      <div className="probability-header">
        <span className="probability-label">{label}</span>
        <span className="probability-value mono">{percentage}%</span>
      </div>
      <div className="probability-track">
        <div className="probability-fill" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
