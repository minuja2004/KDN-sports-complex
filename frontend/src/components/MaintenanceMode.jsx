import React, { useState } from 'react';
import { ShieldAlert, Send, Phone, Mail, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const MaintenanceMode = () => {
  const [inquiry, setInquiry] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inquiry.name || !inquiry.email || !inquiry.message) return;
    
    // Mock submit
    setSubmitted(true);
    setInquiry({ name: '', email: '', message: '' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center', margin: 'auto' }} className="animate-fade-in">
        {/* Glowing Orange Logo Shield */}
        <div style={{
          display: 'inline-flex',
          padding: '1.5rem',
          borderRadius: '50%',
          backgroundColor: 'rgba(240, 129, 25, 0.1)',
          border: '1px solid #F08119',
          boxShadow: '0 0 30px rgba(240, 129, 25, 0.2)',
          marginBottom: '2rem'
        }}>
          <ShieldAlert size={48} style={{ color: '#F08119' }} />
        </div>

        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
          SYSTEM <span style={{ color: '#F08119' }}>OFFLINE</span>
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2.5rem' }}>
          The KDN Sport Complex portal is currently undergoing scheduled maintenance and upgrades. Gym check-ins, badminton court bookings, and supplement purchases are temporarily suspended.
        </p>

        {/* Inquiry Card */}
        <div className="card card-accent" style={{ textAlign: 'left', padding: '2rem', marginBottom: '3rem', backgroundColor: '#141416' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Urgent Inquiries</h3>
          <p style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Need to cancel a booking or have questions? Send our support desk a quick memo and we will reply as soon as systems recover.
          </p>

          {submitted ? (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '1rem', borderRadius: '6px', color: '#4ade80', fontSize: '0.9rem', textAlign: 'center' }}>
              Your inquiry has been cached and queued. Thank you for your patience!
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Your Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={inquiry.name}
                    onChange={(e) => setInquiry({ ...inquiry, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    value={inquiry.email}
                    onChange={(e) => setInquiry({ ...inquiry, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Message Detail</label>
                <textarea
                  required
                  rows="3"
                  className="form-input"
                  value={inquiry.message}
                  onChange={(e) => setInquiry({ ...inquiry, message: e.target.value })}
                  placeholder="Ask about gym memberships, bookings, or store order status..."
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={16} />
                Send Support Request
              </button>
            </form>
          )}
        </div>

        {/* Contact Numbers info */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', color: '#71717a', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Phone size={12} />
            <span>+94 11 234 5678</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} />
            <span>Est. Recovery: 2 Hours</span>
          </div>
        </div>

        {/* Secret Restorer Lock */}
        <div style={{ marginTop: '4rem' }}>
          <Link to="/secret-gatekeeper" style={{ color: '#27272a', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>System Administrator Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceMode;
