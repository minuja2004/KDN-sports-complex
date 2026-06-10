import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Calendar as CalendarIcon, Clock, ChevronRight, CheckSquare, Trash2, HelpCircle } from 'lucide-react';

const Badminton = ({ user }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null); // { court, slot }
  const [error, setError] = useState('');
  const [bookingProcessing, setBookingProcessing] = useState(false);

  const courts = ['Court 1', 'Court 2', 'Court 3'];
  const timeSlots = [
    '06:00 AM - 07:00 AM',
    '07:00 AM - 08:00 AM',
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
    '06:00 PM - 07:00 PM',
    '07:00 PM - 08:00 PM',
    '08:00 PM - 09:00 PM',
    '09:00 PM - 10:00 PM'
  ];

  useEffect(() => {
    fetchDailyBookings();
    if (user) {
      fetchUserBookings();
    }
  }, [selectedDate, user]);

  const fetchDailyBookings = async () => {
    setLoading(true);
    try {
      const data = await api.bookings.getByDate(selectedDate);
      // Filter out physiotherapy bookings which also live in bookings table
      const courtBookings = data.filter(b => b.type !== 'physio');
      setBookings(courtBookings);
    } catch (err) {
      console.error('Failed to retrieve daily bookings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const data = await api.bookings.getByDate(''); // Get all bookings
      // Filter to retrieve current user's court bookings
      const userCourtBookings = data.filter(
        b => b.userId === user.id && b.type !== 'physio'
      );
      setMyBookings(userCourtBookings);
    } catch (err) {
      console.error('Failed to retrieve user bookings:', err.message);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlot(null);
    setError('');
  };

  const isSlotBooked = (court, slot) => {
    return bookings.find(b => b.court === court && b.slot === slot);
  };

  const getBookedInfo = (court, slot) => {
    return bookings.find(b => b.court === court && b.slot === slot);
  };

  const handleSlotClick = (court, slot) => {
    if (!user) {
      alert('You must sign in to book a court slot.');
      navigate('/login');
      return;
    }
    
    if (isSlotBooked(court, slot)) return;
    
    setSelectedSlot({ court, slot });
    setError('');
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    setBookingProcessing(true);
    setError('');

    try {
      const bookingData = {
        court: selectedSlot.court,
        date: selectedDate,
        slot: selectedSlot.slot,
        userName: user.username,
        userEmail: user.email
      };

      await api.bookings.create(bookingData);
      
      // Refresh list
      setSelectedSlot(null);
      await fetchDailyBookings();
      await fetchUserBookings();
    } catch (err) {
      setError(err.message || 'Court booking failed. The slot might have been locked.');
    } finally {
      setBookingProcessing(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this badminton court booking?')) return;
    
    try {
      await api.bookings.cancel(id);
      await fetchDailyBookings();
      await fetchUserBookings();
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    }
  };

  return (
    <div className="container section animate-fade-in">
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
          BADMINTON COURT <span style={{ color: 'var(--primary)' }}>RESERVATIONS</span>
        </h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Select a date, view court availability, and book your hourly court slot.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }} className="grid-2">
        {/* Scheduler Grid */}
        <div>
          {/* Date Selector Header */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#141416' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontWeight: 600 }}>Select Booking Date:</span>
            </div>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            />
          </div>

          {loading ? (
            <div className="text-center" style={{ padding: '3rem 0' }}>
              <p className="text-muted">Loading court schedules...</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table className="table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                  <tr>
                    <th style={{ width: '25%' }}>Time Slot</th>
                    {courts.map(c => (
                      <th key={c} className="text-center" style={{ width: '25%' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(slot => (
                    <tr key={slot}>
                      <td style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <Clock size={12} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary)' }} />
                        {slot.split(' ')[0] + ' ' + slot.split(' ')[1] + ' - ' + slot.split(' - ')[1].split(' ')[0] + ' ' + slot.split(' - ')[1].split(' ')[1]}
                      </td>
                      
                      {courts.map(court => {
                        const booked = isSlotBooked(court, slot);
                        const isSelected = selectedSlot?.court === court && selectedSlot?.slot === slot;
                        
                        let cellStyle = {
                          padding: '0.5rem',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        };
                        
                        let cellContent = '';

                        if (booked) {
                          cellStyle.backgroundColor = '#18181b';
                          cellStyle.color = '#ef4444';
                          cellStyle.cursor = 'not-allowed';
                          cellContent = (
                            <span style={{
                              display: 'block',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.15)',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}>
                              Booked {user && user.role === 'admin' ? `(${booked.userName})` : ''}
                            </span>
                          );
                        } else if (isSelected) {
                          cellStyle.backgroundColor = 'rgba(240, 129, 25, 0.1)';
                          cellContent = (
                            <span style={{
                              display: 'block',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--primary)',
                              color: '#fff',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              boxShadow: '0 0 10px var(--primary-glow)'
                            }}>
                              Selected
                            </span>
                          );
                        } else {
                          cellStyle.backgroundColor = 'transparent';
                          cellContent = (
                            <span 
                              className="court-available-btn"
                              style={{
                                display: 'block',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px dashed var(--border)',
                                color: 'var(--success)',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              Available
                            </span>
                          );
                        }

                        return (
                          <td 
                            key={court} 
                            style={cellStyle}
                            onClick={() => handleSlotClick(court, slot)}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Side Booking Summary */}
        <div>
          <div className="card card-accent" style={{ backgroundColor: '#141416', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              Booking Summary
            </h3>
            
            {selectedSlot ? (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span className="text-muted">Date:</span> <strong style={{ color: '#fff' }}>{selectedDate}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span className="text-muted">Court:</span> <strong style={{ color: 'var(--primary)' }}>{selectedSlot.court}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span className="text-muted">Time Slot:</span> <strong style={{ color: '#fff' }}>{selectedSlot.slot}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    <span className="text-muted">Hourly Rate:</span> <strong style={{ color: '#fff' }}>රු 1,500.00</strong>
                  </div>
                </div>

                {error && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleBookSlot}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={bookingProcessing}
                >
                  {bookingProcessing ? 'Booking...' : 'Confirm Reservation'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <HelpCircle size={32} style={{ color: 'var(--border-highlight)', marginBottom: '0.5rem' }} />
                <p>Click on an available grid cell on the left to queue court reservation.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's Bookings List */}
      {user && (
        <div style={{ marginTop: '4rem' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            My Court Reservations
          </h2>
          
          {myBookings.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>You have no active court bookings scheduled.</p>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Court</th>
                    <th>Time Slot</th>
                    <th>Payment</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.date}</td>
                      <td><span className="badge badge-info">{b.court}</span></td>
                      <td>{b.slot}</td>
                      <td>
                        <span className={`badge ${b.paymentStatus === 'Paid' ? 'badge-success' : 'badge-pending'}`}>
                          {b.paymentStatus === 'Paid' ? 'Cleared' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', color: 'var(--error)' }}
                        >
                          <Trash2 size={12} style={{ marginRight: '4px' }} />
                          Cancel
                        </button>
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

export default Badminton;
