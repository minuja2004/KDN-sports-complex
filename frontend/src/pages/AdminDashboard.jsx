import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  Calendar, 
  Dumbbell, 
  ShoppingBag, 
  Activity, 
  Trash2, 
  ShieldAlert, 
  Truck, 
  Check, 
  Edit, 
  Plus, 
  X, 
  Package,
  CheckCircle2
} from 'lucide-react';

const AdminDashboard = ({ user, onLoginSuccess }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  
  // Admin logs state
  const [bookings, setBookings] = useState([]);
  const [gymMembers, setGymMembers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [physios, setPhysios] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  // Admin login states
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Supplement Modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = Add, object = Edit
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    images: [],
    category: 'protein',
    stock: '',
    allowKoko: true,
    isMultipleOption: false,
    optionTitle: '',
    selectionType: 'dropdown',
    selections: []
  });

  // Gym Member Modal state
  const [gymModalOpen, setGymModalOpen] = useState(false);
  const [editingGymMember, setEditingGymMember] = useState(null);
  const [gymForm, setGymForm] = useState({
    tier: 'Monthly',
    price: '',
    startDate: '',
    endDate: '',
    paymentStatus: 'Paid',
    status: 'Active'
  });

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
      // Fetch bookings
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

      // Fetch store products
      const storeProducts = await api.products.getAll();
      setProducts(storeProducts);
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

  // 2. Gym member edit & delete
  const handleOpenEditGym = (member) => {
    setEditingGymMember(member);
    setGymForm({
      tier: member.tier,
      price: member.price,
      startDate: member.startDate,
      endDate: member.endDate,
      paymentStatus: member.paymentStatus,
      status: member.status
    });
    setGymModalOpen(true);
  };

  const handleSaveGymMember = async (e) => {
    e.preventDefault();
    if (!editingGymMember) return;
    try {
      const updated = await api.gym.updateStatus(editingGymMember.id, {
        tier: gymForm.tier,
        price: parseFloat(gymForm.price),
        startDate: gymForm.startDate,
        endDate: gymForm.endDate,
        paymentStatus: gymForm.paymentStatus,
        status: gymForm.status
      });
      setGymMembers(gymMembers.map(m => m.id === editingGymMember.id ? updated : m));
      setGymModalOpen(false);
      setEditingGymMember(null);
    } catch (err) {
      alert(err.message || 'Failed to update membership details.');
    }
  };

  const handleDeleteGymMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gym membership registration?')) return;
    try {
      await api.gym.delete(id);
      setGymMembers(gymMembers.filter(m => m.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete membership.');
    }
  };

  // 3. E-commerce order updates
  const handleUpdateOrderStatus = async (id, orderStatus) => {
    try {
      const updated = await api.orders.updateStatus(id, { orderStatus });
      setOrders(orders.map(o => o.id === id ? updated : o));
    } catch (err) {
      alert(err.message || 'Fulfillment shift failed.');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await api.orders.delete(id);
      setOrders(orders.filter(o => o.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete order.');
    }
  };

  // 4. Physiotherapy updates
  const handleUpdatePhysioStatus = async (id, status) => {
    try {
      const updated = await api.physio.updateStatus(id, { status });
      setPhysios(physios.map(p => p.id === id ? updated : p));
    } catch (err) {
      alert(err.message || 'Status update failed.');
    }
  };

  // 5. Products CRUD handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      description: '',
      price: '',
      image: '',
      images: [],
      category: 'protein',
      stock: '',
      allowKoko: true,
      isMultipleOption: false,
      optionTitle: '',
      selectionType: 'dropdown',
      selections: []
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      images: product.images || (product.image ? [product.image] : []),
      category: product.category,
      stock: product.stock,
      allowKoko: product.allowKoko !== undefined ? product.allowKoko : true,
      isMultipleOption: product.isMultipleOption || false,
      optionTitle: product.optionTitle || '',
      selectionType: product.selectionType || 'dropdown',
      selections: product.selections || []
    });
    setProductModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Selected file "${file.name}" is too large. Please select images under 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const readPromises = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(base64Images => {
      setProductForm(prev => {
        const newImages = [...(prev.images || [])];
        base64Images.forEach(img => {
          if (!newImages.includes(img)) {
            newImages.push(img);
          }
        });
        return {
          ...prev,
          images: newImages,
          image: prev.image || newImages[0] || ''
        };
      });
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.category || productForm.stock === '') return;

    if (!productForm.isMultipleOption && !productForm.price) {
      alert('Price is required for single products.');
      return;
    }
    if (productForm.isMultipleOption && (!productForm.selections || productForm.selections.length === 0)) {
      alert('At least one option selection item is required for option products.');
      return;
    }

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: productForm.isMultipleOption ? parseFloat(productForm.selections[0]?.price || 0) : parseFloat(productForm.price),
        image: productForm.image,
        images: productForm.images || [],
        category: productForm.category,
        stock: parseInt(productForm.stock),
        allowKoko: productForm.allowKoko,
        isMultipleOption: productForm.isMultipleOption,
        optionTitle: productForm.optionTitle,
        selectionType: productForm.selectionType,
        selections: productForm.selections || []
      };

      if (editingProduct) {
        // Edit Mode
        const updated = await api.products.update(editingProduct.id, payload);
        setProducts(products.map(p => p.id === editingProduct.id ? updated : p));
      } else {
        // Add Mode
        const newProduct = await api.products.create(payload);
        setProducts([...products, newProduct]);
      }
      setProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      alert(err.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product from the storefront catalog?')) return;
    try {
      await api.products.delete(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete product.');
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
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@kdnsport.com"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
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
          onClick={() => setActiveTab('products')}
          className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <Package size={16} />
          Manage Supplements ({products.length})
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
        
        {/* Tab 1: Court Bookings */}
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
                            className="btn btn-secondary"
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

        {/* Tab 2: Gym Members */}
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
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleOpenEditGym(m)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary)' }}
                            >
                              <Edit size={12} style={{ marginRight: '4px' }} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGymMember(m.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)' }}
                            >
                              <Trash2 size={12} style={{ marginRight: '4px' }} />
                              Delete
                            </button>
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

        {/* Tab 3: Store Orders */}
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Fulfillment Status:</span>
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="form-input"
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.8rem',
                            width: 'auto',
                            minWidth: '110px',
                            backgroundColor: '#141416',
                            border: '1px solid var(--border)',
                            color: order.orderStatus === 'Pending' ? '#fbbf24' :
                                   order.orderStatus === 'Approved' ? '#34d399' :
                                   order.orderStatus === 'Shipped' ? '#60a5fa' : '#a78bfa',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="Pending" style={{ color: '#fbbf24', backgroundColor: '#141416' }}>Pending</option>
                          <option value="Approved" style={{ color: '#34d399', backgroundColor: '#141416' }}>Approved</option>
                          <option value="Shipped" style={{ color: '#60a5fa', backgroundColor: '#141416' }}>Shipped</option>
                          <option value="Delivered" style={{ color: '#a78bfa', backgroundColor: '#141416' }}>Delivered</option>
                        </select>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Charged amount:</span>
                        <strong style={{ color: 'var(--primary)' }}>රු {order.totalAmount.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Payment Detail:</span>
                        <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
                          {order.paymentMethod === 'cod' ? (order.shippingDetails.address.includes('Store Pickup') ? 'Pay on Pickup' : 'Cash on Delivery') :
                           order.paymentMethod === 'koko' ? 'Koko BNPL' : 'Card Payment'}
                        </span>
                        <span style={{ fontSize: '0.75rem', marginLeft: '6px', verticalAlign: 'middle' }} className={`badge ${order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-pending'}`}>
                          {order.paymentStatus}
                        </span>
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
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={14} />
                          Cancel/Delete Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Manage Supplements */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem' }}>Supplement Store Catalog</h3>
              <button onClick={handleOpenAddProduct} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                <Plus size={16} />
                Add New Supplement
              </button>
            </div>

            {products.length === 0 ? (
              <p className="text-muted">No products found in catalog.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock Level</th>
                      <th>Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} />
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{p.category}</span></td>
                        <td><strong>රු {p.price.toFixed(2)}</strong></td>
                        <td>
                          <span style={{ color: p.stock > 10 ? 'var(--success)' : p.stock > 0 ? 'var(--warning)' : 'var(--error)', fontWeight: 600 }}>
                            {p.stock} units
                          </span>
                        </td>
                        <td>★ {p.rating.toFixed(1)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--primary)' }}
                            >
                              <Edit size={12} style={{ marginRight: '4px' }} />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)' }}
                            >
                              <Trash2 size={12} style={{ marginRight: '4px' }} />
                              Remove
                            </button>
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

        {/* Tab 5: Physio Consults */}
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

      {/* MODAL 1: ADD/EDIT SUPPLEMENT PRODUCT */}
      {productModalOpen && (
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
          <div className="card card-accent animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', backgroundColor: '#141416', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>
                {editingProduct ? 'Edit Supplement Info' : 'Add New Supplement'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Supplement Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. KDN Premium Whey Gold"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Type</label>
                <select
                  className="form-input"
                  value={productForm.isMultipleOption ? 'multiple' : 'single'}
                  onChange={(e) => {
                    const isMult = e.target.value === 'multiple';
                    const currentSelections = productForm.selections || [];
                    setProductForm({ 
                      ...productForm, 
                      isMultipleOption: isMult,
                      selections: isMult && currentSelections.length === 0 
                        ? [{ id: Math.random().toString(36).substr(2, 9), name: '', price: '', description: '', image: '' }] 
                        : currentSelections
                    });
                  }}
                >
                  <option value="single">Single Product (Standard)</option>
                  <option value="multiple">Multiple Options Product (e.g. Flavors, Sizes)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {productForm.isMultipleOption ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      >
                        <option value="protein">Protein</option>
                        <option value="pre-workout">Pre-Workout</option>
                        <option value="creatine">Creatine</option>
                        <option value="recovery">Recovery</option>
                        <option value="vitamins">Vitamins</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Multiple Option Selection Method</label>
                      <select
                        className="form-input"
                        value={productForm.selectionType}
                        onChange={(e) => setProductForm({ ...productForm, selectionType: e.target.value })}
                      >
                        <option value="dropdown">Dropdown Options</option>
                        <option value="radio">Radio Selector Cards</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Price (රු LKR)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="form-input"
                        placeholder="16500.00"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      >
                        <option value="protein">Protein</option>
                        <option value="pre-workout">Pre-Workout</option>
                        <option value="creatine">Creatine</option>
                        <option value="recovery">Recovery</option>
                        <option value="vitamins">Vitamins</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {productForm.isMultipleOption && (
                <div className="form-group">
                  <label className="form-label">Option Group Title</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Select Flavor"
                    value={productForm.optionTitle}
                    onChange={(e) => setProductForm({ ...productForm, optionTitle: e.target.value })}
                  />
                </div>
              )}

              {productForm.isMultipleOption && (
                <div style={{ border: '1px dashed var(--border)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.25rem', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '1rem', fontFamily: 'Outfit', color: 'var(--primary)' }}>
                    Option Items (e.g. Flavors, Sizes)
                  </h4>
                  
                  <span className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Option Items:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '220px', overflowY: 'auto', paddingRight: '5px', marginBottom: '1rem' }}>
                    {(productForm.selections || []).map((sel, idx) => (
                      <div key={sel.id} style={{ border: '1px solid #2d2d32', padding: '0.75rem', borderRadius: '6px', backgroundColor: '#18181b', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = (productForm.selections || []).filter((_, i) => i !== idx);
                            setProductForm({ ...productForm, selections: filtered });
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          title="Remove option"
                        >
                          <X size={16} />
                        </button>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Option Name</label>
                            <input
                              type="text"
                              required
                              className="form-input"
                              placeholder="e.g. Chocolate 1kg"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                              value={sel.name}
                              onChange={(e) => {
                                const newSels = [...productForm.selections];
                                newSels[idx].name = e.target.value;
                                setProductForm({ ...productForm, selections: newSels });
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Price (LKR)</label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              className="form-input"
                              placeholder="16000"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                              value={sel.price}
                              onChange={(e) => {
                                const newSels = [...productForm.selections];
                                newSels[idx].price = e.target.value;
                                setProductForm({ ...productForm, selections: newSels });
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '0.75rem', alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Option Description (Optional)</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Nutritional detail or size"
                              style={{ padding: '0.3rem 0.5rem', fontSize: '0.85rem' }}
                              value={sel.description || ''}
                              onChange={(e) => {
                                const newSels = [...productForm.selections];
                                newSels[idx].description = e.target.value;
                                setProductForm({ ...productForm, selections: newSels });
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Option Photo</label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                id={`sel-img-${sel.id}`}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (!file) return;
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert('Image must be under 5MB.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newSels = [...productForm.selections];
                                    newSels[idx].image = reader.result;
                                    setProductForm({ ...productForm, selections: newSels });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                              <label
                                htmlFor={`sel-img-${sel.id}`}
                                style={{
                                  backgroundColor: 'var(--bg-surface-elevated)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  color: '#fff',
                                  textAlign: 'center',
                                  flexGrow: 1
                                }}
                              >
                                {sel.image ? 'Change' : 'Upload'}
                              </label>
                              {sel.image && (
                                <img
                                  src={sel.image}
                                  alt="Option Thumbnail"
                                  style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProductForm({
                        ...productForm,
                        selections: [
                          ...(productForm.selections || []),
                          { id: Math.random().toString(36).substr(2, 9), name: '', price: '', description: '', image: '' }
                        ]
                      });
                    }}
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Add Selection Option Item
                  </button>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Stock Units</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    placeholder="25"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Product Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-input"
                    onChange={handleImageUpload}
                    style={{ padding: '0.45rem 0.8rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={productForm.allowKoko}
                    onChange={(e) => setProductForm({ ...productForm, allowKoko: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: 'var(--primary)'
                    }}
                  />
                  <span>Allow Koko Installment (BNPL) logo & pricing display</span>
                </label>
              </div>

               {productForm.images && productForm.images.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <span className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'block' }}>
                    Gallery Images (First is Main):
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {productForm.images.map((img, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          position: 'relative', 
                          width: '70px', 
                          height: '70px', 
                          borderRadius: '6px', 
                          overflow: 'hidden', 
                          border: idx === 0 ? '2px solid var(--primary)' : '1px solid var(--border)',
                          boxShadow: idx === 0 ? '0 0 8px var(--primary-glow)' : 'none'
                        }}
                      >
                        <img
                          src={img}
                          alt={`Preview ${idx}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm(prev => {
                              const filtered = prev.images.filter((_, i) => i !== idx);
                              return {
                                ...prev,
                                images: filtered,
                                image: filtered[0] || ''
                              };
                            });
                          }}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            padding: 0,
                            lineHeight: 1
                          }}
                          title="Remove image"
                        >
                          ×
                        </button>
                        {idx === 0 && (
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--primary)',
                            color: '#fff',
                            fontSize: '8px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            padding: '1px 0'
                          }}>
                            MAIN
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Supplement Description</label>
                <textarea
                  rows="3"
                  className="form-input"
                  placeholder="Explain benefits, serving size, flavor..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save Supplement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT GYM MEMBER REGISTRATION */}
      {gymModalOpen && (
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
          <div className="card card-accent animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '2rem', backgroundColor: '#141416' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>
                Edit Gym Membership Details
              </h3>
              <button onClick={() => setGymModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGymMember}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tier Plan</label>
                  <select
                    className="form-input"
                    value={gymForm.tier}
                    onChange={(e) => setGymForm({ ...gymForm, tier: e.target.value })}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Plan Price (රු)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="form-input"
                    value={gymForm.price}
                    onChange={(e) => setGymForm({ ...gymForm, price: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={gymForm.startDate}
                    onChange={(e) => setGymForm({ ...gymForm, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expiration Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={gymForm.endDate}
                    onChange={(e) => setGymForm({ ...gymForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Billing Status</label>
                  <select
                    className="form-input"
                    value={gymForm.paymentStatus}
                    onChange={(e) => setGymForm({ ...gymForm, paymentStatus: e.target.value })}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Access Card Status</label>
                  <select
                    className="form-input"
                    value={gymForm.status}
                    onChange={(e) => setGymForm({ ...gymForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setGymModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
