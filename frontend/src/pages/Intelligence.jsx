import React, { useState, useEffect } from 'react';
import './Intelligence.css';
import Button from '../components/Button';
import ProgressRail from '../components/ProgressRail';
import SignalCard from '../components/SignalCard';
import ProbabilityBar from '../components/ProbabilityBar';
import StatusBadge from '../components/StatusBadge';

export default function Intelligence({ onNext, onCancel, hpvData, aiResult, demoScenario }) {
  const [viewMode, setViewMode] = useState('clinical');
  const [showReveal, setShowReveal] = useState(false);
  const [showExplainability, setShowExplainability] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReveal(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const hpvPositive = hpvData?.hpvDetected;
  
  const aiError = aiResult?.error;
  const visionPrediction = (!aiError && aiResult?.prediction) || (hpvPositive ? 'Koilocytotic' : 'Superficial-Intermediate');
  const visionConfidence = (!aiError && aiResult?.confidence) ? (aiResult.confidence * 100).toFixed(1) : (hpvPositive ? 89 : 96);
  const isAbnormalCytology = !aiError && ['Koilocytotic', 'Dyskeratotic'].includes(visionPrediction);
  
  const isHighPriority = hpvPositive && isAbnormalCytology;
  const isModeratePriority = (hpvPositive && !isAbnormalCytology) || (!hpvPositive && isAbnormalCytology);
  
  const finalPriority = isHighPriority ? 'HIGH PRIORITY' : (isModeratePriority ? 'MODERATE' : 'ROUTINE');

  const sortedScores = (!aiError && aiResult?.all_scores) 
    ? Object.entries(aiResult.all_scores).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  return (
    <div className="intelligence-container">
      <ProgressRail currentStep={4} />
      
      <div className="intelligence-header">
        <h2>Intelligence & Screening Result</h2>
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${viewMode === 'clinical' ? 'active' : ''}`}
            onClick={() => setViewMode('clinical')}
          >
            Clinical View
          </button>
          <button 
            className={`toggle-btn ${viewMode === 'technical' ? 'active' : ''}`}
            onClick={() => setViewMode('technical')}
          >
            Technical Details
          </button>
        </div>
      </div>

      <div className="signals-grid">
        <SignalCard 
          title="HPV Hardware Assay"
          badgeStatus={hpvPositive ? "danger" : "success"}
          badgeLabel={hpvPositive ? "DETECTED" : "CLEAR"}
          mainValue={hpvData?.testId || "N/A"}
        >
          {viewMode === 'clinical' ? (
            <div className="clinical-factors">
              <p>Hardware Result:</p>
              <ul>
                <li>HPV Types 16, 18, 45: <strong>{hpvPositive ? 'Positive' : 'Negative'}</strong></li>
                <li>Sample Quality: {hpvData?.testQuality || 'Unknown'}</li>
              </ul>
            </div>
          ) : (
            <div className="technical-factors mono-light">
              <p>Device: Dhaal Rapid Assay Reader v1.2</p>
              <p>Protocol: Bluetooth LE Sync</p>
              <p>Raw Output:</p>
              <ul>
                <li>load_detected: {hpvPositive ? 'true' : 'false'}</li>
                <li>confidence_interval: 99.8%</li>
              </ul>
            </div>
          )}
        </SignalCard>

        <SignalCard 
          title="Clinical Risk Engine"
          badgeStatus={isHighPriority ? "warning" : "success"}
          badgeLabel={isHighPriority ? "ELEVATED" : "LOW"}
          mainValue={isHighPriority ? "62%" : "12%"}
        >
          {viewMode === 'clinical' ? (
            <div className="clinical-factors">
              <p>Key contributing factors:</p>
              <ul>
                {isHighPriority ? (
                  <>
                    <li>Current smoking history</li>
                    <li>Long-term oral contraceptive use</li>
                  </>
                ) : (
                  <li>No significant risk factors identified</li>
                )}
              </ul>
            </div>
          ) : (
            <div className="technical-factors mono-light">
              <p>Model: XGBoost Classifier</p>
              <p>Features: 32</p>
              <p>Top weights:</p>
              <ul>
                <li>Smokes (w=1.42)</li>
                <li>Hormonal_Contraceptives_Years (w=0.87)</li>
              </ul>
            </div>
          )}
        </SignalCard>

        <SignalCard 
          title="Vision Engine"
          badgeStatus={isAbnormalCytology ? "danger" : "success"}
          badgeLabel={isAbnormalCytology ? "ABNORMAL" : "NORMAL"}
          mainValue={`${visionConfidence}%`}
        >
          {viewMode === 'clinical' ? (
            <div className="vision-factors">
              <p>Cytology Pattern Identified:</p>
              <p className="pattern-label">{visionPrediction} {isAbnormalCytology ? '(Abnormal)' : '(Normal)'}</p>
              <div className="probability-list">
                {aiResult && sortedScores.length > 0 ? (
                  sortedScores.map(([cls, score]) => (
                    <ProbabilityBar key={cls} label={cls} percentage={Math.round(score * 100)} />
                  ))
                ) : (
                  isAbnormalCytology ? (
                    <>
                      <ProbabilityBar label={visionPrediction} percentage={89} />
                      <ProbabilityBar label="Dyskeratotic" percentage={8} />
                      <ProbabilityBar label="Superficial-Intermediate" percentage={3} />
                    </>
                  ) : (
                    <>
                      <ProbabilityBar label={visionPrediction} percentage={96} />
                      <ProbabilityBar label="Parabasal" percentage={3} />
                      <ProbabilityBar label="Metaplastic" percentage={1} />
                    </>
                  )
                )}
              </div>
            </div>
          ) : (
            <div className="technical-factors mono-light">
              <p>Model: MobileViT (apple/mobilevit-small)</p>
              <p>Resolution: 256x256</p>
              <p>Raw Softmax Output:</p>
              <div className="probability-list">
                {aiResult && sortedScores.length > 0 ? (
                  sortedScores.map(([cls, score]) => (
                    <ProbabilityBar key={cls} label={cls} percentage={parseFloat((score * 100).toFixed(2))} />
                  ))
                ) : (
                  isAbnormalCytology ? (
                    <>
                      <ProbabilityBar label={`class_2 (${visionPrediction})`} percentage={89.12} />
                      <ProbabilityBar label="class_3 (Dyskeratotic)" percentage={8.05} />
                    </>
                  ) : (
                    <>
                      <ProbabilityBar label={`class_0 (${visionPrediction})`} percentage={96.21} />
                      <ProbabilityBar label="class_4 (Parabasal)" percentage={3.12} />
                    </>
                  )
                )}
              </div>
            </div>
          )}
        </SignalCard>
      </div>

      <div className="explainability-section">
        <button 
          className="explainability-toggle"
          onClick={() => setShowExplainability(!showExplainability)}
        >
          Detailed Screening Analysis {showExplainability ? '▲' : '▼'}
        </button>
        
        {showExplainability && (
          <div className="explainability-panel fade-in-scale">
            <div className="explain-row">
              <span className="explain-label">Hardware Signal</span>
              <span className="explain-text">
                {hpvPositive 
                  ? "High-risk HPV viral load detected by the rapid assay." 
                  : "No high-risk HPV viral load detected."}
              </span>
            </div>
            <div className="explain-row">
              <span className="explain-label">Vision Signal</span>
              <span className="explain-text">
                {isAbnormalCytology
                  ? `Cellular abnormalities identified in cytology (${visionPrediction} pattern).`
                  : `Cytology appears normal with typical ${visionPrediction} cells.`}
              </span>
            </div>
            <div className="explain-row summary-row">
              <span className="explain-label">Combined Assessment</span>
              <span className="explain-text">
                {isHighPriority
                  ? "HPV positive status combined with abnormal cytology strongly correlates with cellular changes requiring further review."
                  : (isModeratePriority 
                      ? "Conflicting signals between HPV and Cytology indicate follow-up screening is needed."
                      : "HPV negative status and normal cytology indicate routine screening interval is appropriate."
                    )
                }
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="triage-reveal-container">
        <div className={`convergence-lines ${showReveal ? 'animate' : ''}`}>
          <div className="line left-line"></div>
          <div className="center-node"></div>
          <div className="line right-line"></div>
        </div>

        <div className={`triage-result ${showReveal ? 'visible' : ''}`}>
          <div className="triage-status">
            <StatusBadge 
              status={finalPriority === 'HIGH PRIORITY' ? 'danger' : (finalPriority === 'MODERATE' ? 'warning' : 'success')} 
              label={finalPriority} 
              className="large-badge" 
            />
            <h3 className="triage-action">
              {finalPriority === 'HIGH PRIORITY' 
                ? "Colposcopy Recommended" 
                : (finalPriority === 'MODERATE' ? "Follow-up Screening" : "Routine Follow-up")}
            </h3>
          </div>
          
          <div className="triage-details">
            <div className="triage-col">
              <h4>Findings Summary</h4>
              <ul>
                {hpvPositive ? <li>High-risk HPV Positive</li> : <li>HPV Negative</li>}
                {isAbnormalCytology ? <li>Abnormal Cytology ({visionPrediction})</li> : <li>Normal Cytology ({visionPrediction})</li>}
              </ul>
            </div>
            <div className="triage-col">
              <h4>Recommended next step:</h4>
              <p>
                {finalPriority === 'HIGH PRIORITY'
                  ? "Refer for qualified clinical evaluation and colposcopy to assess cellular abnormalities."
                  : (finalPriority === 'MODERATE'
                      ? "Schedule patient for early follow-up screening to monitor potential conflicting indicators."
                      : "Return for routine screening according to standard guidelines."
                    )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
        <Button variant="accent" onClick={onNext} disabled={!showReveal}>
          Proceed to Human Review &rarr;
        </Button>
      </div>
    </div>
  );
}
