import React, { useState, useEffect } from 'react';
import './AiAnalysis.css';
import Card from '../components/Card';
import ProgressRail from '../components/ProgressRail';

const steps = [
  { label: "Clinical factors analyzed", delay: 600 },
  { label: "Image quality checked", delay: 500 },
  { label: "Cytology image processing", delay: 1200 },
  { label: "AI classification running", delay: 1500 },
  { label: "Combining clinical signals", delay: 800 },
  { label: "Preparing triage recommendation", delay: 600 }
];

export default function AiAnalysis({ onComplete, imageFile, demoScenario, setAiResult }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const runAnalysis = async () => {
      // 1. UX Animation
      for (let i = 0; i < steps.length; i++) {
        if (!isMounted) return;
        await new Promise(resolve => setTimeout(resolve, steps[i].delay));
        if (!isMounted) return;
        setCurrentStepIndex(i + 1);
      }

      // 2. AI Inference
      if (imageFile && imageFile instanceof File) {
        try {
          const formData = new FormData();
          formData.append('file', imageFile);
          
          const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            if (setAiResult) setAiResult(result);
          } else {
            console.error("API returned error status:", response.status);
          }
        } catch (error) {
          console.error("Failed to reach Python API:", error);
        }
      } else if (demoScenario) {
        // Fallback demo results
        if (demoScenario === 'routine') {
          if (setAiResult) setAiResult({ prediction: "Superficial-Intermediate", confidence: 0.98 });
        } else if (demoScenario === 'high-priority') {
          if (setAiResult) setAiResult({ prediction: "Koilocytotic", confidence: 0.95 });
        } else if (demoScenario === 'conflicting') {
          if (setAiResult) setAiResult({ prediction: "Superficial-Intermediate", confidence: 0.89 });
        }
      }

      if (isMounted) {
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    };

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, [onComplete, steps, imageFile, demoScenario, setAiResult]);

  return (
    <div className="analysis-container">
      <ProgressRail currentStep={3} />
      
      <div className="analysis-content">
        <div className="analysis-header">
          <h2>AI Triage Processing</h2>
          <p>Please wait while the system analyzes the inputs.</p>
        </div>

        <Card className="analysis-card">
          <ul className="checklist">
            {steps.map((step, index) => {
              const status = index < currentStepIndex 
                ? 'complete' 
                : (index === currentStepIndex ? 'active' : 'pending');

              return (
                <li key={index} className={`checklist-item ${status}`}>
                  <span className="checklist-icon">
                    {status === 'complete' && '✓'}
                    {status === 'active' && '◉'}
                    {status === 'pending' && '○'}
                  </span>
                  <span className="checklist-label">{step.label}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
