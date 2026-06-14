import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ShieldAlert, Mail, Lock, CheckCircle, RefreshCw, LogOut, Terminal, Power, Eye, EyeOff } from 'lucide-react';

const SecretGatekeeper = () => {
  const [email, setEmail] = useState('workzeez2026@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Dashboard
  const [isShutdown, setIsShutdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkCurrentStatus();
    // Auto login if token exists
    const token = localStorage.getItem('kdn_secret_token');
    if (token) {
      setStep(3);
    }
  }, []);

  const checkCurrentStatus = async () => {
    try {
      const data = await api.secret.checkShutdown();
      setIsShutdown(data.isShutdown);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const result = await api.secret.requestOtp(email, password);
      setMessage(result.message);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Access Denied: Email is not whitelisted in security parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError('');

    try {
      const result = await api.secret.verifyOtp(email, otp);
      localStorage.setItem('kdn_secret_token', result.token);
      setMessage(result.message);
      setStep(3);
      await checkCurrentStatus();
    } catch (err) {
      setError(err.message || 'Security code verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShutdown = async (shutdownState) => {
    if (shutdownState === true) {
      if (!window.confirm('⚠️ CRITICAL WARNING: You are shutting down the entire website. This blocks all badminton court bookings, gym check-ins, store sales, and therapy inquiries. Proceed?')) return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await api.secret.toggleShutdown(shutdownState);
      setIsShutdown(result.isShutdown);
      setMessage(result.message);
      
      // Dispatch status shift event to immediately update local client layout
      window.dispatchEvent(new CustomEvent('kdn-shutdown-state-changed', {
        detail: { isShutdown: result.isShutdown }
      }));
    } catch (err) {
      setError(err.message || 'Failed to toggle shutdown state.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecretLogout = () => {
    localStorage.removeItem('kdn_secret_token');
    setStep(1);
    setEmail('workzeez2026@gmail.com');
    setPassword('');
    setOtp('');
    setError('');
    setMessage('');
  };

  return (
    <div className="container section animate-fade-in" style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
      <div className="card card-accent" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '2.5rem',
        backgroundColor: '#141416',
        borderTopColor: '#ef4444' // Red alert border for secret gatekeeper
      }}>
        
        {/* Shield Icon Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px dashed #ef4444',
            color: '#ef4444',
            marginBottom: '1rem'
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>
            GATEKEEPER CONTROL
          </h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            Master shutdown control center for KDN Sport Complex
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '0.75rem', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', padding: '0.75rem', borderRadius: '6px', color: '#60a5fa', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        {/* STEP 1: Email Request */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Whitelisted Admin Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="workzeez2026@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Master Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn btn-danger" style={{ width: '100%', backgroundColor: '#ef4444' }} disabled={loading}>
              {loading ? 'Validating Credentials...' : 'Request Verification OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Verification OTP Code</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  maxLength="6"
                  className="form-input"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ paddingLeft: '2.5rem', letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
              
              <div style={{
                marginTop: '1rem',
                backgroundColor: 'rgba(240, 129, 25, 0.05)',
                border: '1px solid rgba(240, 129, 25, 0.2)',
                borderRadius: '6px',
                padding: '0.75rem',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start'
              }}>
                <Terminal size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  <strong>Local Testing Notice:</strong> If Gmail SMTP settings are not configured in your env file, please check your <strong>node backend terminal logs</strong>. The 6-digit OTP code will print directly in your command shell!
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                Back
              </button>
              <button type="submit" className="btn btn-danger" style={{ flex: 1, backgroundColor: '#ef4444' }} disabled={loading}>
                {loading ? 'Verifying...' : 'Validate Code'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Control Panel Dashboard */}
        {step === 3 && (
          <div>
            {/* Server Online Status Card */}
            <div style={{
              backgroundColor: isShutdown ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)',
              border: isShutdown ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              padding: '1.5rem',
              textAlign: 'center',
              marginBottom: '2rem'
            }}>
              <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal Status</span>
              <h3 style={{
                fontSize: '1.8rem',
                fontFamily: 'Outfit',
                color: isShutdown ? '#f87171' : '#4ade80',
                marginTop: '0.25rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Power size={22} />
                {isShutdown ? 'OFFLINE (SHUTDOWN)' : 'ONLINE (OPERATIONAL)'}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {isShutdown 
                  ? 'All public views and standard admin API paths are currently locked with 503 HTTP responses.' 
                  : 'All normal booking forms, e-commerce checkout, and admin dashboard panels are online.'
                }
              </p>
            </div>

            {/* Toggle Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {isShutdown ? (
                <button
                  onClick={() => handleToggleShutdown(false)}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1rem', backgroundColor: '#22c55e' }}
                  disabled={loading}
                >
                  RESTORE SITE ONLINE
                </button>
              ) : (
                <button
                  onClick={() => handleToggleShutdown(true)}
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '1rem', backgroundColor: '#ef4444' }}
                  disabled={loading}
                >
                  🚨 TRIGGER MASTER SHUTDOWN
                </button>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleSecretLogout}
              className="btn btn-secondary"
              style={{ width: '100%', display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}
            >
              <LogOut size={14} />
              Revoke Gatekeeper Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecretGatekeeper;
