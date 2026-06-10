import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Calendar, Dumbbell, ShoppingBag, Activity, Trash2, CheckCircle2, ShieldAlert, Truck, Check } from 'lucide-react';

const AdminDashboard = ({ user, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  
  // Admin logs state
  const [bookings, setBookings] = useState([]);
  const [gymMembers, setGymMembers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [error, setError] = useState('');

  // Admin login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [user]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      const result = await api.auth.login(adminEmail, adminPassword);
      if (result.user.role !== 'admin') {
        setLoginError('Access Denied: This panel is restricted to administrative staff only.');
        setLoginSubmitting(false);
        return;
      }
      localStorage.setItem('kdn_token', result.token);
      if (onLoginSuccess) {
        onLoginSuccess(result.user);
      }
    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please verify management credentials.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch bookings (court & physio are separated)
      const allBookings = await api.bookings.getByDate('');
      const courtBookings = allBookings.filter(b => b.type !== 'physio');
      setBookings(courtBookings);

      // Fetch gym members
      const members = await api.gym.getAll();
      setGymMembers(members);

      // Fetch store orders
      const storeOrders = await api.orders.getAll();
      setOrders(storeOrders);

      // Fetch physiotherapy requests
      const clinicalConsults = await api.physio.getAll();
      setPhysios(clinicalConsults);
    } catch (err) {
      setError('Failed to fetch administration logs. Please check server authorization.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Cancel court booking
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this customer court booking?')) return;
    try {
      await api.bookings.cancel(id);
      setBookings(bookings.filter(b => b.id !== id));
    } catch (err) {
      alert(err.message || 'Action failed.');
    }
  };

  // 2. Gym membership state update
  const handleUpdateGymStatus = async (id, status, paymentStatus) => {
    try {
      const updated = await api.gym.updateStatus(id, { status, paymentStatus });
      setGymMembers(gymMembers.map(m => m.id === id ? updated : m));
    } catch (err) {
      alert(err.message || 'Update failed.');
    }
  };

  // 3. E-commerce order shipping status update
  const handleUpdateOrderStatus = async (id, orderStatus) => {
    try {
      const updated = await api.orders.updateStatus(id, { orderStatus });
      setOrders(orders.map(o => o.id === id ? updated : o));
    } catch (err) {
      alert(err.message || 'Fulfillment shift failed.');
    }
  };

  // 4. Physiotherapy booking state update
  const handleUpdatePhysioStatus = async (id, status) => {
    try {
      const updated = await api.physio.updateStatus(id, { status });
      setPhysios(physios.map(p => p.id === id ? updated : p));
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  if (loading) {
    return (
      <div className="container section text-center">
        <p className="text-muted">Loading administrative records dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="container section animate-fade-in" style={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
        <div className="card card-accent" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', backgroundColor: '#141416' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(240, 129, 25, 0.08)',
              border: '1px dashed var(--primary)',
              color: 'var(--primary)',
              marginBottom: '1rem'
            }}>
              <ShieldAlert size={36} />
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', letterSpacing: '-0.02em' }}>
              ADMIN PORTAL
            </h2>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Management Sign In for KDN Sport Complex
            </p>
          </div>

          {loginError && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '0.75rem', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="admin@kdnsport.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loginSubmitting}>
              {loginSubmitting ? 'Verifying Credentials...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem' }}>
            ADMINISTRATIVE <span style={{ color: 'var(--primary)' }}>MANAGEMENT CONTROL</span>
          </h1>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Authorized Manager: <strong style={{ color: '#fff' }}>{user?.username}</strong> ({user?.email})
          </p>
        </div>
        
        <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          Refresh Records
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: '8px', color: '#f87171', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      {/* Tabs list */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <Calendar size={16} />
          Badminton Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('gym')}
          className={`btn ${activeTab === 'gym' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <Dumbbell size={16} />
          Gym Members ({gymMembers.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <ShoppingBag size={16} />
          Store Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('physio')}
          className={`btn ${activeTab === 'physio' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <Activity size={16} />
          Physio Consults ({physios.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="card" style={{ backgroundColor: '#141416', padding: '2rem' }}>
        {/* 1. Court Bookings Panel */}
        {activeTab === 'bookings' && (
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', marginBottom: '1.25rem' }}>Badminton Court Bookings</h3>
            {bookings.length === 0 ? (
              <p className="text-muted">No badminton court bookings found.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Court</th>
                      <th>Time Slot</th>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Payment</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.date}</td>
                        <td><span className="badge badge-info">{b.court}</span></td>
                        <td>{b.slot}</td>
                        <td>{b.userName}</td>
                        <td>{b.userEmail}</td>
                        <td>
                          <span className={`badge ${b.paymentStatus === 'Paid' ? 'badge-success' : 'badge-pending'}`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="btn btn-secondary animate-fade-in"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--error)' }}
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

        {/* 2. Gym Members Panel */}
        {activeTab === 'gym' && (
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', marginBottom: '1.25rem' }}>Gym Registrations</h3>
            {gymMembers.length === 0 ? (
              <p className="text-muted">No gym members found.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Email</th>
                      <th>Tier Package</th>
                      <th>Start Date</th>
                      <th>Renewal Date</th>
                      <th>Billing Status</th>
                      <th>Keycard Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gymMembers.map(m => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600 }}>{m.userName}</td>
                        <td>{m.userEmail}</td>
                        <td><span className="badge badge-info">{m.tier}</span></td>
                        <td>{m.startDate}</td>
                        <td>{m.endDate}</td>
                        <td>
                          <span className={`badge ${m.paymentStatus === 'Paid' ? 'badge-success' : 'badge-pending'}`}>
                            {m.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${m.status === 'Active' ? 'badge-success' : 'badge-error'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {m.status !== 'Active' ? (
                              <button
                                onClick={() => handleUpdateGymStatus(m.id, 'Active', 'Paid')}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}
                              >
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateGymStatus(m.id, 'Expired', m.paymentStatus)}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)' }}
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. Supplement Orders Panel */}
        {activeTab === 'orders' && (
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', marginBottom: '1.25rem' }}>E-Commerce Store Orders</h3>
            {orders.length === 0 ? (
              <p className="text-muted">No store purchases logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem', backgroundColor: 'var(--bg-surface-elevated)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order ID: #{order.id}</span>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Recipient: {order.shippingDetails.name} ({order.userEmail})</h4>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Address:</span>
                        <span style={{ fontSize: '0.85rem' }}>{order.shippingDetails.address} (Tel: {order.shippingDetails.phone})</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fulfillment Status:</span>
                        <span className={`badge ${
                          order.orderStatus === 'Pending' ? 'badge-pending' :
                          order.orderStatus === 'Shipped' ? 'badge-info' : 'badge-success'
                        }`}>{order.orderStatus}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Charged amount:</span>
                        <strong style={{ color: 'var(--primary)' }}>${order.totalAmount.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flexGrow: 1 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Supplements:</span>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                          {order.items.map((item, index) => (
                            <span key={index} style={{ fontSize: '0.85rem', backgroundColor: '#141416', border: '1px solid var(--border)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                              {item.name} <strong>x{item.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {order.orderStatus === 'Pending' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#60a5fa' }}
                          >
                            <Truck size={14} style={{ marginRight: '4px' }} />
                            Ship Order
                          </button>
                        )}
                        {order.orderStatus === 'Shipped' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--success)' }}
                          >
                            <Check size={14} style={{ marginRight: '4px' }} />
                            Deliver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Physiotherapy Consults Panel */}
        {activeTab === 'physio' && (
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', marginBottom: '1.25rem' }}>Physiotherapy consultation slots</h3>
            {physios.length === 0 ? (
              <p className="text-muted">No physiotherapy requests registered.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Contact Phone</th>
                      <th>Requested Date</th>
                      <th>Time Slot</th>
                      <th>Assigned Therapist</th>
                      <th>Condition description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {physios.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.userName}</td>
                        <td>{p.userPhone}</td>
                        <td>{p.date}</td>
                        <td>{p.slot}</td>
                        <td>{p.therapist}</td>
                        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.condition}</td>
                        <td>
                          <span className={`badge ${
                            p.status === 'Approved' ? 'badge-success' :
                            p.status === 'Pending' ? 'badge-pending' : 'badge-error'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {p.status === 'Pending' && (
                              <button
                                onClick={() => handleUpdatePhysioStatus(p.id, 'Approved')}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}
                              >
                                <Check size={12} style={{ marginRight: '4px' }} />
                                Approve
                              </button>
                            )}
                            {p.status === 'Approved' && (
                              <button
                                onClick={() => handleUpdatePhysioStatus(p.id, 'Completed')}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}
                              >
                                Complete
                              </button>
                            )}
                            {p.status !== 'Cancelled' && p.status !== 'Completed' && (
                              <button
                                onClick={() => handleUpdatePhysioStatus(p.id, 'Cancelled')}
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)' }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
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
    </div>
  );
};

export default AdminDashboard;
