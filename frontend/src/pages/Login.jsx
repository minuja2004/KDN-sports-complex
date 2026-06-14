import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { LogIn, UserPlus, Mail, Lock, User, ShieldAlert, Phone, Eye, EyeOff } from 'lucide-react';

const getPasswordStrength = (password) => {
  if (!password) return { label: '', color: 'transparent', width: '0%', criteriaCount: 0 };
  
  let criteriaCount = 0;
  const hasLength = password.length >= 6;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[@$!%*?&]/.test(password);

  if (hasLength) criteriaCount++;
  if (hasLower) criteriaCount++;
  if (hasUpper) criteriaCount++;
  if (hasDigit) criteriaCount++;
  if (hasSpecial) criteriaCount++;

  let label = 'Very Weak';
  let color = '#ef4444'; // red
  let width = '20%';

  if (criteriaCount === 5) {
    label = 'Very Strong';
    color = '#10b981'; // emerald green
    width = '100%';
  } else if (criteriaCount === 4) {
    label = 'Strong';
    color = '#22c55e'; // green
    width = '80%';
  } else if (criteriaCount === 3) {
    label = 'Medium';
    color = '#eab308'; // yellow/orange
    width = '60%';
  } else if (criteriaCount === 2) {
    label = 'Weak';
    color = '#ef4444'; // red
    width = '40%';
  }

  return { label, color, width, criteriaCount };
};

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer' // customer or admin (for ease of local testing)
  });
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginOtpInput, setShowLoginOtpInput] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');

  const strength = getPasswordStrength(formData.password);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setSubmitting(true);

    try {
      let result;
      if (isRegister) {
        if (!formData.username || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
          setError('All fields are required.');
          setSubmitting(false);
          return;
        }

        // Passwords match validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setSubmitting(false);
          return;
        }

        // Strong password regex check (at least 6 characters, one uppercase, one lowercase, one number)
        const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!strongPasswordRegex.test(formData.password)) {
          setError('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
          setSubmitting(false);
          return;
        }

        if (!otpSent) {
          // Request OTP
          const response = await api.auth.requestRegisterOtp(formData.email);
          setOtpSent(true);
          setInfoMessage(response.message || 'Verification code sent to your email.');
          setSubmitting(false);
          return;
        } else {
          // Verify & Register
          if (!otp) {
            setError('Please enter the verification code.');
            setSubmitting(false);
            return;
          }
          result = await api.auth.register(
            formData.username,
            formData.email,
            formData.password,
            formData.role,
            otp,
            formData.phone
          );
        }
      } else {
        if (!formData.email || !formData.password) {
          setError('Email and password are required.');
          setSubmitting(false);
          return;
        }
        if (showLoginOtpInput) {
          if (!loginOtp) {
            setError('Please enter the verification code.');
            setSubmitting(false);
            return;
          }
          result = await api.auth.login(formData.email, formData.password, loginOtp);
        } else {
          result = await api.auth.login(formData.email, formData.password);
          if (result && result.otpRequired) {
            setShowLoginOtpInput(true);
            setInfoMessage(result.message || 'Verification code sent to your email.');
            setSubmitting(false);
            return;
          }
        }
      }

      // Success
      if (result.user && result.user.role === 'secret_admin') {
        localStorage.setItem('kdn_secret_token', result.token);
        const SUPER_ADMIN_PATH = import.meta.env.VITE_SUPER_ADMIN_PATH || '/dev-super-admin-portal-xyz';
        navigate(SUPER_ADMIN_PATH);
      } else {
        localStorage.setItem('kdn_token', result.token);
        onLoginSuccess(result.user);
        
        // Redirect
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
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
            onClick={() => { setIsRegister(false); setError(''); setInfoMessage(''); setOtpSent(false); setOtp(''); setShowLoginOtpInput(false); setLoginOtp(''); }}
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
            onClick={() => { setIsRegister(true); setError(''); setInfoMessage(''); setOtpSent(false); setOtp(''); setShowLoginOtpInput(false); setLoginOtp(''); }}
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

        {infoMessage && (
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid #22c55e',
            padding: '0.75rem',
            borderRadius: '6px',
            color: '#4ade80',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Username</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="username"
                    required
                    disabled={otpSent}
                    className="form-input"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    name="phone"
                    required
                    disabled={otpSent}
                    className="form-input"
                    placeholder="e.g. 0771234567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                required
                disabled={otpSent || showLoginOtpInput}
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                style={{ paddingLeft: '2.5rem' }}
              />
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={!isRegister ? { marginBottom: '2rem' } : { marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              {isRegister && formData.password && (
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: strength.color }}>
                  {strength.label}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                disabled={otpSent || showLoginOtpInput}
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
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
            {isRegister && formData.password && (
              <div style={{ height: '4px', width: '100%', backgroundColor: '#222224', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: strength.width,
                  backgroundColor: strength.color,
                  transition: 'width 0.3s ease, background-color 0.3s ease'
                }} />
              </div>
            )}
          </div>

          {isRegister && (
            <div className="form-group" style={{ marginBottom: otpSent ? '1rem' : '2rem' }}>
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  disabled={otpSent}
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {isRegister && otpSent && (
            <div className="form-group animate-fade-in" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Verification Code</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit OTP code"
                  className="form-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ paddingLeft: '2.5rem', borderColor: 'var(--primary)', boxShadow: '0 0 5px rgba(240, 129, 25, 0.15)' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--primary)' }} />
              </div>
            </div>
          )}

          {!isRegister && showLoginOtpInput && (
            <div className="form-group animate-fade-in" style={{ marginBottom: '2rem' }}>
              <label className="form-label" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Admin Verification Code</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit OTP code"
                  className="form-input"
                  value={loginOtp}
                  onChange={(e) => setLoginOtp(e.target.value)}
                  style={{ paddingLeft: '2.5rem', borderColor: 'var(--primary)', boxShadow: '0 0 5px rgba(240, 129, 25, 0.15)' }}
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--primary)' }} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
            {submitting 
              ? 'Authenticating...' 
              : isRegister 
                ? (otpSent ? 'Verify & Create Account' : 'Send Verification OTP') 
                : (showLoginOtpInput ? 'Verify OTP & Sign In' : 'Sign In')
            }
          </button>
          
          {isRegister && otpSent && (
            <button 
              type="button" 
              onClick={() => { setOtpSent(false); setOtp(''); setInfoMessage(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '1rem', width: '100%', textDecoration: 'underline' }}
            >
              Change registration details
            </button>
          )}

          {!isRegister && showLoginOtpInput && (
            <button 
              type="button" 
              onClick={() => { setShowLoginOtpInput(false); setLoginOtp(''); setInfoMessage(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '1rem', width: '100%', textDecoration: 'underline' }}
            >
              Change login details
            </button>
          )}
        </form>

      </div>
    </div>
  );
};

export default Login;
