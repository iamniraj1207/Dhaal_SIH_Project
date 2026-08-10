import React from 'react';
import './ProgressRail.css';

export default function ProgressRail({ currentStep }) {
  const steps = [
    { id: 1, label: 'Clinical History' },
    { id: 2, label: 'Cytology Scan' },
    { id: 3, label: 'AI Triage' }
  ];

  return (
    <div className="progress-rail">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isFuture = step.id > currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className={`step-item ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''}`}>
              <div className="step-circle">
                {isCompleted ? '✓' : step.id}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${isCompleted ? 'solid' : 'dashed'}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
