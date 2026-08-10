import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabase';
import Dashboard from './pages/Dashboard';
import PatientIntake from './pages/PatientIntake';
import HpvHardware from './pages/HpvHardware';
import CytologyUpload from './pages/CytologyUpload';
import AiAnalysis from './pages/AiAnalysis';
import Intelligence from './pages/Intelligence';
import HumanReview from './pages/HumanReview';
import Auth from './pages/Auth';
import Button from './components/Button';

function App() {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [patientData, setPatientData] = useState(null);
  const [hpvData, setHpvData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [demoMode, setDemoMode] = useState(null);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const startScreening = (scenario = null) => {
    if (typeof scenario === 'string' && scenario !== '[object Object]') {
      setDemoMode(scenario);
      if (scenario === 'routine') {
        setPatientData({ age: 28, smoking: 'never', hormonalContraceptives: false, stdHistory: false });
      } else if (scenario === 'high-priority') {
        setPatientData({ age: 45, smoking: 'current', hormonalContraceptives: true, stdHistory: true });
      } else if (scenario === 'conflicting') {
        setPatientData({ age: 39, smoking: 'former', hormonalContraceptives: true, stdHistory: false });
      }
    } else {
      setDemoMode(null);
      setPatientData(null);
    }
    setCurrentView('intake');
  };

  const handleIntakeNext = async (data) => {
    setPatientData(data);
    
    // Save to Supabase (Patients table)
    if (session?.user) {
      const { data: insertedPatient, error } = await supabase
        .from('patients')
        .insert([{
          user_id: session.user.id,
          age: data.age,
          smoking_history: data.smoking,
          hormonal_contraceptives: data.hormonalContraceptives,
          hormonal_years: data.hormonalYears,
          iud: data.iud,
          iud_years: data.iudYears,
          std_history: data.stdHistory,
          pregnancies: data.pregnancies
        }])
        .select()
        .single();
        
      if (!error && insertedPatient) {
        // Create initial screening record
        const { data: insertedScreening } = await supabase
          .from('screenings')
          .insert([{
            patient_id: insertedPatient.id,
            session_id: `#CG-${Math.floor(Math.random() * 90000) + 10000}`,
            clinician_id: session.user.id
          }])
          .select()
          .single();
          
        if (insertedScreening) {
          setCurrentRecordId(insertedScreening.id);
        }
      }
    }
    
    setCurrentView('hpv');
  };

  const handleHpvNext = async (data) => {
    setHpvData(data);
    
    if (currentRecordId) {
      await supabase
        .from('screenings')
        .update({
          hpv_device_connected: data.deviceConnected,
          hpv_test_id: data.testId,
          hpv_test_quality: data.testQuality,
          hpv_detected: data.hpvDetected
        })
        .eq('id', currentRecordId);
    }
    
    setCurrentView('upload');
  };

  const handleUploadNext = (file) => {
    setImageFile(file);
    setCurrentView('analysis');
  };

  const handleAnalysisComplete = () => {
    setCurrentView('intelligence');
  };

  const handleIntelligenceNext = () => {
    setCurrentView('review');
  };

  const handleReviewComplete = async (priority, note) => {
    // Update screening record in Supabase
    if (currentRecordId) {
      await supabase
        .from('screenings')
        .update({
          final_human_priority: priority,
          clinician_notes: note,
          status: 'completed'
        })
        .eq('id', currentRecordId);
    }
  };

  const handleRestart = () => {
    setPatientData(null);
    setHpvData(null);
    setImageFile(null);
    setCurrentRecordId(null);
    setAiResult(null);
    setCurrentView('dashboard');
  };

  const handleCancel = () => {
    setCurrentView('dashboard');
  };

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app">
      {/* Global Language Selector */}
      <div style={{ background: 'var(--color-surface-sunken)', padding: '8px 24px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'flex-end', borderBottom: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>LANGUAGE:</span>
        <select onChange={(e) => changeLanguage(e.target.value)} style={{ padding: '4px', fontSize: '13px' }}>
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="gu">ગુજરાતી (Gujarati)</option>
          <option value="ta">தமிழ் (Tamil)</option>
        </select>
        <Button variant="ghost" onClick={() => supabase.auth.signOut()} style={{ padding: '4px 8px', fontSize: '13px' }}>Sign Out</Button>
      </div>

      {currentView === 'dashboard' && <Dashboard onStartScreening={startScreening} session={session} />}
      {currentView === 'intake' && (
        <PatientIntake onNext={handleIntakeNext} onCancel={handleCancel} initialData={patientData} />
      )}
      {currentView === 'hpv' && (
        <HpvHardware onNext={handleHpvNext} onCancel={handleCancel} demoScenario={demoMode} />
      )}
      {currentView === 'upload' && (
        <CytologyUpload onNext={handleUploadNext} onCancel={handleCancel} />
      )}
      {currentView === 'analysis' && (
        <AiAnalysis 
          onComplete={handleAnalysisComplete} 
          imageFile={imageFile} 
          setAiResult={setAiResult} 
          demoScenario={demoMode} 
        />
      )}
      {currentView === 'intelligence' && (
        <Intelligence 
          onNext={handleIntelligenceNext} 
          onCancel={handleCancel} 
          hpvData={hpvData} 
          aiResult={aiResult}
          demoScenario={demoMode}
        />
      )}
      {currentView === 'review' && (
        <HumanReview 
          onComplete={handleReviewComplete} 
          onRestart={handleRestart} 
          hpvData={hpvData} 
          patientData={patientData} 
          imageFile={imageFile}
          currentRecordId={currentRecordId}
        />
      )}
    </div>
  );
}

export default App;
