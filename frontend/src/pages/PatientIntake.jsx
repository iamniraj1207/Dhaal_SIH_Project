import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './PatientIntake.css';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressRail from '../components/ProgressRail';

export default function PatientIntake({ onNext, onCancel, initialData }) {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    age: 35,
    smoking: 'never',
    hormonalContraceptives: false,
    hormonalYears: 0,
    iud: false,
    iudYears: 0,
    stdHistory: false,
    pregnancies: 1
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sessionId = "#CG-9943";

  return (
    <div className="intake-container">
      <ProgressRail currentStep={1} />
      
      <div className="intake-content">
        <div className="intake-header">
          <h2>Hey Beautiful!</h2>
          <p>Lets get to know you a little better.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onNext(formData); }}>
          <Card title="Clinical Factors" className="form-card">
            <div className="form-row">
              <div className="form-group">
                <label>
                  Session ID
                  <span className="tooltip" title="Auto-generated unique identifier for this screening session.">ⓘ</span>
                </label>
                <input type="text" value={sessionId} readOnly className="mono-input" />
              </div>
              <div className="form-group">
                <label>
                  Age
                  <span className="tooltip" title="Patient's current age.">ⓘ</span>
                </label>
                <input 
                  type="number" 
                  value={formData.age} 
                  onChange={(e) => handleChange('age', e.target.value)}
                  min="15" max="100"
                />
              </div>
            </div>
          </Card>

          <Card title="Clinical Factors" className="form-card">
            <div className="form-group">
              <label>
                Smoking History
                <span className="tooltip" title="Current or former smoking can elevate baseline risk.">ⓘ</span>
              </label>
              <div className="segmented-control">
                {['never', 'former', 'current'].map(val => (
                  <button 
                    type="button" 
                    key={val}
                    className={`segment-btn ${formData.smoking === val ? 'active' : ''}`}
                    onClick={() => handleChange('smoking', val)}
                  >
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  Hormonal Contraceptives
                  <span className="tooltip" title="History of hormonal contraceptive use.">ⓘ</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={formData.hormonalContraceptives} 
                    onChange={(e) => handleChange('hormonalContraceptives', e.target.checked)}
                  />
                  <span className="slider"></span>
                  <span className="toggle-label">{formData.hormonalContraceptives ? 'Yes' : 'No'}</span>
                </label>
              </div>
              
              {formData.hormonalContraceptives && (
                <div className="form-group slide-in">
                  <label>Duration (Years)</label>
                  <input 
                    type="number" 
                    value={formData.hormonalYears} 
                    onChange={(e) => handleChange('hormonalYears', e.target.value)}
                    min="0" step="0.5"
                  />
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  IUD Use
                  <span className="tooltip" title="History of Intrauterine Device (IUD) use.">ⓘ</span>
                </label>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={formData.iud} 
                    onChange={(e) => handleChange('iud', e.target.checked)}
                  />
                  <span className="slider"></span>
                  <span className="toggle-label">{formData.iud ? 'Yes' : 'No'}</span>
                </label>
              </div>

              {formData.iud && (
                <div className="form-group slide-in">
                  <label>Duration (Years)</label>
                  <input 
                    type="number" 
                    value={formData.iudYears} 
                    onChange={(e) => handleChange('iudYears', e.target.value)}
                    min="0" step="0.5"
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>
                STD History
                <span className="tooltip" title="Previous diagnosis of any Sexually Transmitted Diseases.">ⓘ</span>
              </label>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={formData.stdHistory} 
                  onChange={(e) => handleChange('stdHistory', e.target.checked)}
                />
                <span className="slider"></span>
                <span className="toggle-label">{formData.stdHistory ? 'Yes' : 'No'}</span>
              </label>
            </div>

            <div className="form-group">
              <label>
                Number of Pregnancies
                <span className="tooltip" title="Total number of pregnancies.">ⓘ</span>
              </label>
              <input 
                type="number" 
                value={formData.pregnancies} 
                onChange={(e) => handleChange('pregnancies', e.target.value)}
                min="0" max="20"
                style={{ maxWidth: '120px' }}
              />
            </div>
          </Card>

          <div className="form-actions">
            <Button variant="ghost" onClick={onCancel} type="button">Cancel</Button>
            <Button variant="primary" type="submit">Next: Cytology Scan &rarr;</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
