import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Activity, Calendar, UserCheck, ShieldAlert, Heart, CalendarPlus, UserCheck2 } from 'lucide-react';

const Physio = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: '09:00 AM - 10:00 AM',
    therapist: 'Dr. Sarah Croft (Sports Physio)',
    condition: '',
    phone: ''
  });
  const [myConsults, setMyConsults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const therapists = [
    'Dr. Sarah Croft (Sports Physio)',
    'Dr. Liam Miller (Rehab Specialist)',
    'Dr. Maya Senanayake (Dry Needling & Joints)',
    'Any Available Therapist'
  ];

  const timeSlots = [
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM'
  ];

  useEffect(() => {
    if (user) {
      fetchConsults();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchConsults = async () => {
    try {
      const data = await api.physio.getMy();
      setMyConsults(data);
    } catch (err) {
      console.error('Failed to load physiotherapy bookings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must sign in to request a physiotherapy session.');
      navigate('/login');
      return;
    }

    if (!formData.condition || !formData.phone) {
      setError('Phone number and injury details are required.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        date: formData.date,
        timeSlot: formData.timeSlot,
        therapist: formData.therapist,
        condition: formData.condition,
        userPhone: formData.phone,
        userName: user.username,
        userEmail: user.email
      };

      await api.physio.create(payload);
      setSuccess(true);
      setFormData({
        ...formData,
        condition: '',
        phone: ''
      });
      await fetchConsults();
    } catch (err) {
      setError(err.message || 'Consultation request failed. The therapist might be booked.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section animate-fade-in">
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
          PHYSIOTHERAPY & <span style={{ color: 'var(--primary)' }}>REHABILITATION</span>
        </h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Consult our expert sports physical therapists. Complete a rehabilitation booking request.
        </p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', marginBottom: '4rem' }}>
        {/* Info & Services */}
        <div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '1.25rem' }}>
            Expert Care for Athletes
          </h2>
          <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            At KDN Sports Clinic, our mission is to return you to active sports as quickly and safely as possible. We specialize in acute injury diagnosis, post-operative rehabilitation, joints adjustments, dry needling, and sports massage recovery.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="grid-2">
            <div className="card" style={{ backgroundColor: '#141416', padding: '1.25rem' }}>
              <Heart size={20} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', marginBottom: '0.5rem' }}>Sports Rehab</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Targeted flexibility, mobility, and motor control training for sports recovery.</p>
            </div>
            
            <div className="card" style={{ backgroundColor: '#141416', padding: '1.25rem' }}>
              <UserCheck2 size={20} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', marginBottom: '0.5rem' }}>Manual Adjustments</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Spinal manipulation, joint mobilization, and active release tissue therapies.</p>
            </div>

            <div className="card" style={{ backgroundColor: '#141416', padding: '1.25rem' }}>
              <Activity size={20} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', marginBottom: '0.5rem' }}>Dry Needling</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Intramuscular stimulation targeting muscular trigger zones to relieve tension.</p>
            </div>

            <div className="card" style={{ backgroundColor: '#141416', padding: '1.25rem' }}>
              <Calendar size={20} style={{ color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <h4 style={{ fontFamily: 'Outfit', fontSize: '1rem', marginBottom: '0.5rem' }}>Injury Prevention</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>Gait analysis, biomechanics correction, and athlete conditioning profiling.</p>
            </div>
          </div>
        </div>

        {/* Booking Request Form */}
        <div className="card card-accent" style={{ backgroundColor: '#141416', padding: '2rem' }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Request Consultation</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            Book a clinical slot. Sessions require therapist confirmation.
          </p>

          {success && (
            <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', color: '#4ade80', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
              Consultation request registered! An admin will confirm your slot shortly.
            </div>
          )}

          {error && (
            <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!user ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Please sign in to request consultations.</p>
              <button onClick={() => navigate('/login')} className="btn btn-outline">Sign In</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-2">
                <div className="form-group">
                  <label className="form-label">Consult Date</label>
                  <input
                    type="date"
                    required
                    name="date"
                    className="form-input"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Hour</label>
                  <select name="timeSlot" className="form-input" value={formData.timeSlot} onChange={handleInputChange}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resident Practitioner</label>
                <select name="therapist" className="form-input" value={formData.therapist} onChange={handleInputChange}>
                  {therapists.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Contact Number</label>
                <input
                  type="tel"
                  required
                  name="phone"
                  className="form-input"
                  placeholder="e.g. +94 77 123 4567"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Condition & Injury Summary</label>
                <textarea
                  required
                  name="condition"
                  rows="3"
                  className="form-input"
                  placeholder="Describe your pain area, when the injury occurred, or rehabilitation goals..."
                  value={formData.condition}
                  onChange={handleInputChange}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                <CalendarPlus size={16} />
                {submitting ? 'Submitting...' : 'Request Consultation Slot'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* User's Physiotherapy Requests history */}
      {user && !loading && (
        <div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            My Consultation History
          </h2>
          
          {myConsults.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>You have no scheduled clinical consultations.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Requested Date</th>
                    <th>Practitioner</th>
                    <th>Time Slot</th>
                    <th>Injury Focus</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myConsults.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.date}</td>
                      <td>{c.therapist.split(' (')[0]}</td>
                      <td>{c.slot}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.condition}</td>
                      <td>
                        <span className={`badge ${
                          c.status === 'Approved' ? 'badge-success' :
                          c.status === 'Pending' ? 'badge-pending' : 'badge-error'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Physio;
