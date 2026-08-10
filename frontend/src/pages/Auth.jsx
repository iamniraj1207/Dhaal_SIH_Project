import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import Card from '../components/Card';
import Button from '../components/Button';
import './Auth.css';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setErrorMsg(error.message);
      else setSuccessMsg('Check your email for the confirmation link.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-hero fade-in-scale">
        <h1 className="hero-title">Dhaal</h1>
        <p className="hero-subtitle">AI-Assisted Cervical Screening & Clinical Triage</p>
      </div>
      <Card className="auth-card fade-in-scale">
        <h2>{isSignUp ? 'Create an Account' : 'Welcome to Dhaal'}</h2>
        <p>{isSignUp ? 'Sign up to securely save patient records.' : 'Please sign in to access the secure clinical portal.'}</p>
        
        <form className="auth-form" onSubmit={handleAuth}>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="clinician@hospital.org"
            />
          </div>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>
          
          {errorMsg && <div className="alert warning-alert" style={{ marginBottom: '16px', padding: '12px' }}><p>{errorMsg}</p></div>}
          {successMsg && <div className="alert success-alert" style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--color-surface-sunken)' }}><p>{successMsg}</p></div>}
          
          <Button variant="accent" type="submit" disabled={loading} style={{ width: '100%', marginBottom: '16px' }}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
          
          <button 
            type="button" 
            className="text-link" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ fontSize: '14px', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 500 }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </form>
      </Card>
    </div>
  );
}
