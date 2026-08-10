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
          <p className="hero-subtitle">{t('app_subtitle')}</p>
          <p className="hero-description">{t('app_desc')}</p>
          <div className="cta-group" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Button variant="accent" className="start-cta" onClick={onStartScreening}>
              {t('start_screening')}
            </Button>
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
            <span className="metric-label">{t('total_screenings')}</span>
            <span className="metric-value mono">{totalScreenings}</span>
          </Card>
          <Card className="metric-stat">
            <span className="metric-label">{t('high_priority')}</span>
            <span className="metric-value mono warning-text">{highPriority}</span>
          </Card>
          <Card className="metric-stat">
            <span className="metric-label">{t('moderate')}</span>
            <span className="metric-value mono">{moderatePriority}</span>
          </Card>
          <Card className="metric-stat">
            <span className="metric-label">{t('routine')}</span>
            <span className="metric-value mono">{routinePriority}</span>
          </Card>
        </div>

        <div className="main-content-grid">
          {/* Recent Sessions */}
          <Card title={t('recent_sessions')} className="recent-sessions">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>{t('session_id')}</th>
                  <th>{t('date')}</th>
                  <th>{t('priority')}</th>
                  <th>{t('status')}</th>
                  <th>{t('action')}</th>
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
                        <a href={s.report_pdf_url} target="_blank" rel="noreferrer" className="text-link" download>{t('download_pdf')}</a>
                      ) : (
                        <span className="mono-light">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
                {screenings.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)'}}>
                      {t('no_sessions')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          {/* System Status */}
          <Card title={t('ai_status')} className="system-status">
            <ul className="status-list">
              <li>
                <span className="status-dot success"></span>
                <span>{t('clinical_ready')}</span>
              </li>
              <li>
                <span className="status-dot success"></span>
                <span>{t('vision_ready')}</span>
              </li>
              <li>
                <span className="status-dot success"></span>
                <span>{t('offline_avail')}</span>
              </li>
              <li>
                <span className="status-dot success"></span>
                <span>{t('pdf_ready')}</span>
              </li>
            </ul>
            <p className="system-note">System readiness indicators. Not a clinical validation.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
