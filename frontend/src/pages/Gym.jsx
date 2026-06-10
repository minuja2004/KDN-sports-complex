import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Dumbbell, ShieldCheck, CreditCard, Award, Zap, Sparkles } from 'lucide-react';

const Gym = ({ user }) => {
  const navigate = useNavigate();
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const tiers = [
    {
      id: 'monthly',
      name: 'Starter Plan',
      price: 29.99,
      duration: 'Monthly',
      features: ['Full gym equipment access', 'Standard locker amenities', '1 Fitness consultation', 'Open gym hours (5am-11pm)'],
      icon: <Zap size={20} />
    },
    {
      id: 'quarterly',
      name: 'Champion Plan',
      price: 79.99,
      duration: 'Quarterly',
      features: ['All Starter Plan features', 'Free group classes admission', '3 Personal coaching hours', 'Shower & sauna amenities'],
      icon: <Award size={20} style={{ color: 'var(--primary)' }} />,
      popular: true
    },
    {
      id: 'annual',
      name: 'Titanium Club',
      price: 249.99,
      duration: 'Annual',
      features: ['All Champion features', 'Unlimited body fat analyses', 'Customized monthly nutrition log', '1 Free gym t-shirt & bottle', 'Priority court booking privilege'],
      icon: <Sparkles size={20} style={{ color: '#fbbf24' }} />
    }
  ];

  useEffect(() => {
    if (user) {
      fetchMembership();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchMembership = async () => {
    try {
      const data = await api.gym.getMember();
      setMemberData(data);
    } catch (err) {
      // 404 means no active member, ignore as it's normal for new signups
      if (err.message.indexOf('404') === -1) {
        console.error('Failed to load membership status:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTier = (tier) => {
    if (!user) {
      alert('You must sign in to subscribe to a gym membership plan.');
      navigate('/login');
      return;
    }
    setSelectedTier(tier);
    setError('');
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTier) return;
    
    setPaymentProcessing(true);
    setError('');

    try {
      // Send registration request to server
      const result = await api.gym.register(selectedTier.duration, selectedTier.price, 'Paid');
      setSuccess(true);
      setMemberData(result);
      setSelectedTier(null);
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.message || 'Payment registration failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container section text-center">
        <p className="text-muted">Loading gym membership details...</p>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in">
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
          KDN FITNESS & <span style={{ color: 'var(--primary)' }}>GYM MEMBERSHIPS</span>
        </h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Commit to your physical health. Select one of our premium tiers and register today.
        </p>
      </div>

      {success && (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid var(--success)',
          padding: '1.25rem',
          borderRadius: '8px',
          color: '#4ade80',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <ShieldCheck size={24} />
          <div>
            <strong style={{ display: 'block', color: '#fff' }}>Subscription Successful!</strong>
            Your membership is now active. See your dashboard below.
          </div>
        </div>
      )}

      {/* Existing Membership Status Card */}
      {user && memberData ? (
        <div className="card card-accent" style={{ marginBottom: '4rem', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '0.5rem' }}>Active Member</span>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginBottom: '0.25rem' }}>
                {memberData.tier} Tier Plan
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Registered to: <strong style={{ color: '#fff' }}>{memberData.userName}</strong> ({memberData.userEmail})
              </p>
            </div>
            
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span className="text-muted">Activation Date:</span> <strong style={{ color: '#fff' }}>{memberData.startDate}</strong>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <span className="text-muted">Renewal Date:</span> <strong style={{ color: 'var(--primary)' }}>{memberData.endDate}</strong>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Paid Amount</div>
              <h3 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 800 }}>${memberData.price.toFixed(2)}</h3>
              <span className="badge badge-success" style={{ marginTop: '0.25rem' }}>Payment Cleared</span>
            </div>
          </div>
        </div>
      ) : user ? (
        <div className="card" style={{ marginBottom: '4rem', textAlign: 'center', padding: '2.5rem', backgroundColor: '#141416' }}>
          <Dumbbell size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>No Active Gym Subscription</h3>
          <p className="text-muted" style={{ maxWidth: '450px', margin: '0 auto' }}>
            Select a plan below to activate your gym access code and register your keycard.
          </p>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '4rem', textAlign: 'center', padding: '2.5rem', backgroundColor: '#141416' }}>
          <Dumbbell size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Sign In to Subscribe</h3>
          <p className="text-muted" style={{ maxWidth: '450px', margin: '0 auto', marginBottom: '1.5rem' }}>
            Please sign in with your customer account to purchase memberships or view your billing details.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-outline">Sign In Now</button>
        </div>
      )}

      {/* Membership Plan Selection Grid */}
      <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        Select a Plan & Renew
      </h2>
      <div className="grid-3" style={{ marginBottom: '4rem' }}>
        {tiers.map((tier) => (
          <div key={tier.id} className={`card ${tier.popular ? 'card-accent' : ''}`} style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#141416'
          }}>
            {tier.popular && (
              <span style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                letterSpacing: '0.05em'
              }}>
                Best Value
              </span>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem' }}>{tier.name}</h3>
                {tier.icon}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff' }}>${tier.price}</span>
                <span className="text-muted" style={{ fontSize: '0.9rem', marginLeft: '0.25rem' }}>/ {tier.duration.toLowerCase()}</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {tier.features.map((feature, idx) => (
                  <li key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => handleSelectTier(tier)}
              className={`btn ${tier.popular ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%' }}
            >
              Select {tier.duration}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Checkout Modal/Panel if a tier is selected */}
      {selectedTier && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card card-accent animate-fade-in" style={{ maxWidth: '450px', width: '100%', padding: '2rem', backgroundColor: '#141416' }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Checkout Membership</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Confirm details and authorize mock transaction charge.
            </p>

            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                <span>Selected Plan:</span>
                <strong style={{ color: '#fff' }}>{selectedTier.name} ({selectedTier.duration})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Total Charge:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>${selectedTier.price.toFixed(2)}</strong>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit}>
              <div className="form-group">
                <label className="form-label">Cardholder Name</label>
                <input type="text" required defaultValue={user?.username} className="form-input" placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Mock Card Number</label>
                <div style={{ position: 'relative' }}>
                  <input type="text" required maxLength="19" className="form-input" placeholder="4000 1234 5678 9010" style={{ paddingLeft: '2.5rem' }} />
                  <CreditCard size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label">Expiration</label>
                  <input type="text" required maxLength="5" className="form-input" placeholder="MM/YY" />
                </div>
                <div>
                  <label className="form-label">CVV</label>
                  <input type="password" required maxLength="3" className="form-input" placeholder="123" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedTier(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={paymentProcessing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? 'Processing...' : 'Pay & Subscribe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gym;
