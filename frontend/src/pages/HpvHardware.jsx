import React, { useState, useEffect } from 'react';
import './HpvHardware.css';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import ProgressRail from '../components/ProgressRail';

export default function HpvHardware({ onNext, onCancel, demoScenario }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
  const [testId, setTestId] = useState('');
  const [testQuality, setTestQuality] = useState('Optimal');
  const [hpvDetected, setHpvDetected] = useState(false);
  const [reading, setReading] = useState(false);
  const [readComplete, setReadComplete] = useState(false);

  useEffect(() => {
    if (demoScenario) {
      setTestId(`HPV-${Math.floor(Math.random() * 9000) + 1000}`);
      if (demoScenario === 'routine') {
        setHpvDetected(false);
      } else {
        // For high-priority or conflicting scenarios
        setHpvDetected(true);
      }
    }
  }, [demoScenario]);

  const connectDevice = () => {
    setConnectionStatus('connecting');
    setTimeout(() => {
      setConnectionStatus('connected');
    }, 2000);
  };

  const startReading = () => {
    if (!testId.trim()) return;
    setReading(true);
    setTimeout(() => {
      setReading(false);
      setReadComplete(true);
    }, 3000);
  };

  const handleNext = () => {
    onNext({
      testId,
      testQuality,
      hpvDetected,
      deviceConnected: connectionStatus === 'connected'
    });
  };

  return (
    <div className="hpv-container">
      <ProgressRail currentStep={1} /> {/* Between Intake (0) and Upload (1 originally, so we can use 1) */}
      
      <div className="hpv-header">
        <h2>HPV Rapid Reader</h2>
        <p>Connect to the external hardware assay reader to fetch viral loads before cytology.</p>
      </div>

      <Card className="hpv-card">
        <div className="device-status-section">
          <h3>Hardware Status</h3>
          <div className="connection-box">
            <div className={`status-indicator ${connectionStatus}`}></div>
            <span className="status-text">
              {connectionStatus === 'disconnected' && 'Reader Disconnected'}
              {connectionStatus === 'connecting' && 'Connecting via Bluetooth...'}
              {connectionStatus === 'connected' && 'Reader Connected (Ready)'}
            </span>
            {connectionStatus === 'disconnected' && (
              <Button variant="secondary" onClick={connectDevice} className="connect-btn">Connect Device</Button>
            )}
          </div>
        </div>

        {connectionStatus === 'connected' && !readComplete && (
          <div className="reading-section fade-in-scale">
            <div className="form-group">
              <label>Sample Cartridge ID</label>
              <input 
                type="text" 
                className="text-input" 
                value={testId} 
                onChange={(e) => setTestId(e.target.value)}
                placeholder="e.g. HPV-1024"
                disabled={reading}
              />
            </div>
            
            <div className="form-actions">
              <Button 
                variant={reading ? 'ghost' : 'primary'} 
                onClick={startReading} 
                disabled={reading || !testId.trim()}
              >
                {reading ? 'Analyzing Cartridge...' : 'Start Assay Read'}
              </Button>
            </div>
            
            {reading && (
              <div className="reading-animation">
                <div className="scanner-line"></div>
              </div>
            )}
          </div>
        )}

        {readComplete && (
          <div className="results-section fade-in-scale">
            <div className="result-header">
              <h3>Assay Complete</h3>
              <StatusBadge status="success" label="SYNCED" />
            </div>
            
            <div className="result-data">
              <div className="data-row">
                <span className="data-label">Test ID:</span>
                <span className="data-value">{testId}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Sample Quality:</span>
                <span className="data-value">{testQuality}</span>
              </div>
              <div className="data-row result-highlight">
                <span className="data-label">HPV (Types 16, 18, 45):</span>
                <span className={`data-value ${hpvDetected ? 'detected' : 'not-detected'}`}>
                  {hpvDetected ? 'DETECTED' : 'NOT DETECTED'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="form-actions bottom-actions">
        <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
        <Button 
          variant="accent" 
          onClick={handleNext} 
          disabled={!readComplete}
        >
          Proceed to Cytology Upload &rarr;
        </Button>
      </div>
    </div>
  );
}
