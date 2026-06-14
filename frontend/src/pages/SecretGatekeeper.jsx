import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { ShieldAlert, LogOut, Power } from 'lucide-react';

const SecretGatekeeper = () => {
  const navigate = useNavigate();
  const [isShutdown, setIsShutdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('kdn_secret_token');
    if (token) {
      setHasToken(true);
      checkCurrentStatus();
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
    setHasToken(false);
    navigate('/login');
  };

  if (!hasToken) {
    return (
      <div className="container section animate-fade-in" style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
        <div className="card card-accent" style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem',
          backgroundColor: '#141416',
          borderTopColor: '#ef4444',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px dashed #ef4444',
            color: '#ef4444',
            marginBottom: '1.5rem'
          }}>
            <ShieldAlert size={48} />
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', letterSpacing: '-0.02em', color: '#fff', marginBottom: '1rem' }}>
            RESTRICTED SYSTEM ACCESS
          </h2>
          <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            This portal is restricted to the developer master console. Direct unauthenticated access is disabled. Please log in first.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1rem', backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#fff', fontWeight: 700 }}
          >
            Go to Login Page
          </button>
        </div>
      </div>
    );
  }

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
      </div>
    </div>
  );
};

export default SecretGatekeeper;
