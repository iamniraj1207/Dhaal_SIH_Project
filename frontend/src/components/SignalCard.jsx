import React from 'react';
import './SignalCard.css';
import Card from './Card';
import StatusBadge from './StatusBadge';

export default function SignalCard({ title, badgeStatus, badgeLabel, mainValue, children }) {
  return (
    <Card className="signal-card" title={title}>
      <div className="signal-content">
        <StatusBadge status={badgeStatus} label={badgeLabel} className="signal-badge" />
        <div className="signal-value mono">{mainValue}</div>
        <div className="signal-details">
          {children}
        </div>
      </div>
    </Card>
  );
}
