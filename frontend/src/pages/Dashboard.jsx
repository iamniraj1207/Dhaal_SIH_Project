import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import './Dashboard.css';
import Button from '../components/Button';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard({ onStartScreening, session }) {
  const { t } = useTranslation();
  const [screenings, setScreenings] = useState([]);

  useEffect(() => {
    const fetchScreenings = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('screenings')
          .select('*')
          .eq('clinician_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (!error && data) {
          setScreenings(data);
        }
      }
    };
    fetchScreenings();
  }, [session]);

  const totalScreenings = screenings.length;
  const highPriority = screenings.filter(s => s.final_human_priority === 'HIGH PRIORITY').length;
  const moderatePriority = screenings.filter(s => s.final_human_priority === 'MODERATE').length;
  const routinePriority = screenings.filter(s => s.final_human_priority === 'ROUTINE').length;

  return (
    <div className="dashboard-container">
      {/* Hero Section */}
      <header className="hero fade-in-scale">
        <div className="hero-content">
          <h1 className="hero-title">{t('app_title').split('—')[0]}</h1>
          <p className="hero-subtitle">{t('app_title').split('—')[1] || 'AI-Assisted Cervical Screening & Clinical Triage'}</p>
          <p className="hero-description">
            A point-of-care decision-support workflow designed to help frontline healthcare workers identify cases requiring further clinical review.
          </p>
          <div className="cta-group" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Button variant="accent" className="start-cta" onClick={onStartScreening}>
              Start New Screening &rarr;
            </Button>
            <div className="demo-dropdown">
              <select 
                className="demo-select" 
                onChange={(e) => {
                  if (e.target.value) {
                    onStartScreening(e.target.value);
                    e.target.value = "";
                  }
                }}
                style={{ padding: '12px 16px', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', fontFamily: 'var(--font-body)' }}
              >
                <option value="">Load Demo Scenario...</option>
                <option value="routine">Routine Patient (Low Risk)</option>
                <option value="high-priority">High Priority (High Risk + Abnormal)</option>
                <option value="conflicting">Conflicting Signals (High Risk + Normal Image)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Value Strip (Mini Convergence) */}
      <div className="value-strip">
        <div className="convergence-mini">
          <span className="signal">Clinical Risk</span>
          <span className="plus">+</span>
          <span className="signal">Cytology AI</span>
          <span className="arrow">&rarr;</span>
          <span className="result">Explainable Triage</span>
          <span className="arrow">&rarr;</span>
          <span className="action">Referral Action</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Metrics Row */}
        <div className="metrics-row">
          <Card className="metric-stat">
            <span className="metric-label">Total Screenings</span>
            <span className="metric-value mono">{totalScreenings}</span>
          </Card>
          <Card className="metric-stat">
            <span className="metric-label">High Priority</span>
            <span className="metric-value mono warning-text">{highPriority}</span>
          </Card>
          <Card className="metric-stat">
            <span className="metric-label">Moderate</span>
            <span className="metric-value mono">{moderatePriority}</span>
          </Card>
          <Card className="metric-stat">
            <span className="metric-label">Routine</span>
            <span className="metric-value mono">{routinePriority}</span>
          </Card>
        </div>

        <div className="main-content-grid">
          {/* Recent Sessions */}
          <Card title="Recent Screening Sessions" className="recent-sessions">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {screenings.map((s) => (
                  <tr key={s.id}>
                    <td className="mono">{s.session_id}</td>
                    <td className="mono-light">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td>
                      {s.final_human_priority ? (
                        <StatusBadge 
                          status={s.final_human_priority === 'HIGH PRIORITY' ? 'danger' : (s.final_human_priority === 'MODERATE' ? 'warning' : 'success')} 
                          label={s.final_human_priority} 
                        />
                      ) : (
                        <span className="mono-light">-</span>
                      )}
                    </td>
                    <td>{s.status}</td>
                    <td>
                      {s.report_pdf_url ? (
                        <a href={s.report_pdf_url} target="_blank" rel="noreferrer" className="text-link" download>Download PDF</a>
                      ) : (
                        <span className="mono-light">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                {screenings.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)'}}>
                      No previous screenings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* System Status */}
          <Card title="AI System Status" className="system-status">
            <ul className="status-list">
              <li>
                <span className="status-dot success"></span>
                <span>Clinical model: Ready</span>
              </li>
              <li>
                <span className="status-dot success"></span>
                <span>Vision model: Ready</span>
              </li>
              <li>
                <span className="status-dot success"></span>
                <span>Offline inference: Available</span>
              </li>
              <li>
                <span className="status-dot success"></span>
                <span>PDF engine: Ready</span>
              </li>
            </ul>
            <p className="system-note">System readiness indicators. Not a clinical validation.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
