import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { LogIn, UserPlus, Mail, Lock, User, ShieldAlert } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer' // customer or admin (for ease of local testing)
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let result;
      if (isRegister) {
        if (!formData.username || !formData.email || !formData.password) {
          setError('All fields are required.');
          setSubmitting(false);
          return;
        }
        result = await api.auth.register(
          formData.username,
          formData.email,
          formData.password,
          formData.role
        );
      } else {
        if (!formData.email || !formData.password) {
          setError('Email and password are required.');
          setSubmitting(false);
          return;
        }
        result = await api.auth.login(formData.email, formData.password);
      }

      // Success
      localStorage.setItem('kdn_token', result.token);
      onLoginSuccess(result.user);
      
      // Redirect
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section animate-fade-in" style={{ display: 'flex', justifyContent: 'center' }}>
      <div className="card card-accent" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', backgroundColor: '#141416' }}>
        
        {/* Toggle tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
          <button
            onClick={() => { setIsRegister(false); setError(''); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: !isRegister ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: !isRegister ? '2px solid var(--primary)' : 'none',
              paddingBottom: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(''); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: isRegister ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: isRegister ? '2px solid var(--primary)' : 'none',
              paddingBottom: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Register
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginBottom: '0.25rem' }}>
            {isRegister ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {isRegister ? 'Join Colombo\'s premium sport complex' : 'Sign in to access your bookings & logs'}
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--error)',
            padding: '0.75rem',
            borderRadius: '6px',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="username"
                  required
                  className="form-input"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                required
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: isRegister ? '1.25rem' : '2rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {isRegister && (
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Register User Role</label>
              <select
                name="role"
                className="form-input"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="customer">Customer (Member)</option>
                <option value="admin">Normal Admin (Management)</option>
              </select>
              <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                * Standard admins can manage bookings, gym logs, physio, and store orders.
              </span>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
            {submitting ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {!isRegister && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Demo standard admin credentials:</span>
            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem', border: '1px solid var(--border)' }}>
              Email: <code style={{ color: 'var(--primary)' }}>admin@kdnsport.com</code><br/>
              Password: <code style={{ color: 'var(--primary)' }}>admin123</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
