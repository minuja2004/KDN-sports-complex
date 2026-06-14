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
  CheckCircle2,
  Image as ImageIcon,
  Users as UsersIcon,
  Power,
  Loader2,
  Terminal,
  ArrowLeft,
  AlertTriangle,
  Upload,
  Link as LinkIcon,
  UserX,
  Search,
  Filter
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

  // Flyers Form States
  const [flyerTitle, setFlyerTitle] = useState('');
  const [flyerLink, setFlyerLink] = useState('');
  const [flyerImage, setFlyerImage] = useState('');
  const [flyerImageType, setFlyerImageType] = useState('url'); // 'url' or 'file'
  const [flyers, setFlyers] = useState([]);
  const [loadingFlyers, setLoadingFlyers] = useState(false);
  const [flyerSubmitLoading, setFlyerSubmitLoading] = useState(false);
  const [flyerError, setFlyerError] = useState('');
  const [flyerSuccess, setFlyerSuccess] = useState('');

  // Users Management States
  const [userList, setUserList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Site Lockdown States
  const [isShutdown, setIsShutdown] = useState(false);
  const [lockdownLoading, setLockdownLoading] = useState(false);
  const [lockdownError, setLockdownError] = useState('');
  const [lockdownSuccess, setLockdownSuccess] = useState('');

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

      // Fetch active flyers
      try {
        const activeFlyers = await api.flyers.getAll();
        setFlyers(activeFlyers);
      } catch (flyerErr) {
        console.error('Failed to retrieve flyers:', flyerErr);
      }

      // Fetch lockdown status
      try {
        const status = await api.secret.checkShutdown();
        setIsShutdown(status.isShutdown);
      } catch (lockdownErr) {
        console.error('Failed to load site lockdown status:', lockdownErr);
      }
    } catch (err) {
      setError('Failed to fetch administration logs. Please check server authorization.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users' && user && user.role === 'admin') {
      fetchUsers();
    }
  }, [activeTab, user]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUserError('');
    try {
      const data = await api.secret.getUsers();
      setUserList(data);
    } catch (err) {
      console.error('Failed to retrieve users:', err);
      setUserError('Error loading user directory database.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFlyerError('Image file is too large. Max size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFlyerImage(reader.result);
      setFlyerError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFlyer = async (e) => {
    e.preventDefault();
    if (!flyerTitle) {
      setFlyerError('Flyer title is required.');
      return;
    }
    if (!flyerImage) {
      setFlyerError('Please provide a flyer image (upload file or paste URL).');
      return;
    }

    setFlyerSubmitLoading(true);
    setFlyerError('');
    setFlyerSuccess('');

    try {
      const payload = {
        title: flyerTitle,
        image: flyerImage,
        link: flyerLink
      };
      
      const newFlyer = await api.flyers.create(payload);
      setFlyers([newFlyer, ...flyers]);
      
      setFlyerTitle('');
      setFlyerLink('');
      setFlyerImage('');
      setFlyerSuccess('Promotional flyer saved and published successfully!');
      
      setTimeout(() => setFlyerSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setFlyerError(err.message || 'Error occurred while saving the flyer.');
    } finally {
      setFlyerSubmitLoading(false);
    }
  };

  const handleDeleteFlyer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flyer? This action cannot be undone.')) {
      return;
    }

    setFlyerError('');
    setFlyerSuccess('');

    try {
      await api.flyers.delete(id);
      setFlyers(flyers.filter(f => f.id !== id));
      setFlyerSuccess('Flyer removed successfully.');
      setTimeout(() => setFlyerSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setFlyerError(err.message || 'Error deleting the flyer.');
    }
  };

  const handleToggleUserStatus = async (userObj) => {
    const nextStatus = !userObj.isActive;
    const confirmMsg = nextStatus 
      ? `Are you sure you want to reactivate the account for "${userObj.username}" (${userObj.email})?`
      : `Are you sure you want to deactivate the account for "${userObj.username}" (${userObj.email})? Deactivated users cannot log in or perform administrative tasks.`;
      
    if (!window.confirm(confirmMsg)) return;

    setUserError('');
    setUserSuccess('');

    try {
      await api.secret.updateUserStatus(userObj.id, nextStatus);
      setUserList(userList.map(u => u.id === userObj.id ? { ...u, isActive: nextStatus } : u));
      setUserSuccess(`Successfully ${nextStatus ? 'reactivated' : 'deactivated'} "${userObj.username}"'s account.`);
      setTimeout(() => setUserSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setUserError(err.message || 'Failed to update user status.');
    }
  };

  const handleToggleLockdown = async (nextState) => {
    if (nextState === true) {
      if (!window.confirm('⚠️ CRITICAL WARNING: You are about to lock down the entire KDN Sport Complex website. This blocks all public badminton bookings, gym check-ins, supplement sales, and administrative dashboard access. Proceed?')) {
        return;
      }
    }

    setLockdownLoading(true);
    setLockdownError('');
    setLockdownSuccess('');

    try {
      const result = await api.secret.toggleShutdown(nextState);
      setIsShutdown(result.isShutdown);
      setLockdownSuccess(result.message);
      
      // Dispatch status shift event to immediately update local client layout
      window.dispatchEvent(new CustomEvent('kdn-shutdown-state-changed', {
        detail: { isShutdown: result.isShutdown }
      }));

      setTimeout(() => setLockdownSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setLockdownError(err.message || 'Failed to update site lockdown status.');
    } finally {
      setLockdownLoading(false);
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
        // Filter out default unsplash placeholder images when user uploads custom photos
        const existingImages = (prev.images || []).filter(img => {
          return img && !img.includes('images.unsplash.com');
        });

        const newImages = [...existingImages];
        base64Images.forEach(img => {
          if (!newImages.includes(img)) {
            newImages.push(img);
          }
        });

        // Set the first uploaded image as the main image
        const mainImage = base64Images[0] || newImages[0] || '';
        
        // Ensure mainImage is at index 0 of the images list
        const reorderedImages = [mainImage, ...newImages.filter(img => img !== mainImage)];

        return {
          ...prev,
          images: reorderedImages,
          image: mainImage
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

  const filteredUsers = userList.filter(userObj => {
    const matchesSearch = 
      userObj.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      userObj.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'all' || 
      userObj.role === roleFilter;

    return matchesSearch && matchesRole;
  });

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
        <button
          onClick={() => setActiveTab('flyers')}
          className={`btn ${activeTab === 'flyers' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <ImageIcon size={16} />
          Promotional Flyers ({flyers.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <UsersIcon size={16} />
          User Account Controls
        </button>
        <button
          onClick={() => setActiveTab('lockdown')}
          className={`btn ${activeTab === 'lockdown' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
        >
          <Power size={16} />
          Global Lockdown ({isShutdown ? 'OFFLINE' : 'ONLINE'})
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

        {/* Tab 6: Promotional Flyers */}
        {activeTab === 'flyers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }} className="animate-fade-in">
            {/* Create Flyer Form Card */}
            <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <ImageIcon size={22} />
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Publish New Flyer</h3>
              </div>

              {flyerError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '0.75rem', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  {flyerError}
                </div>
              )}

              {flyerSuccess && (
                <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '0.75rem', borderRadius: '6px', color: '#4ade80', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  {flyerSuccess}
                </div>
              )}

              <form onSubmit={handleSaveFlyer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Flyer Title */}
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Flyer Title / Promotion Name</label>
                  <input 
                    type="text" 
                    disabled={flyerSubmitLoading}
                    placeholder="e.g. 25% Off Gym Memberships!"
                    className="form-input" 
                    value={flyerTitle} 
                    onChange={(e) => setFlyerTitle(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0d0d0f', border: '1px solid var(--border)', color: '#fff', padding: '0.75rem', borderRadius: '6px' }}
                  />
                </div>

                {/* Flyer Link */}
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Redirect Path / Link (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      disabled={flyerSubmitLoading}
                      placeholder="e.g. /gym or /shop"
                      className="form-input" 
                      value={flyerLink} 
                      onChange={(e) => setFlyerLink(e.target.value)}
                      style={{ width: '100%', backgroundColor: '#0d0d0f', border: '1px solid var(--border)', color: '#fff', padding: '0.75rem 0.75rem 0.75rem 2.2rem', borderRadius: '6px' }}
                    />
                    <LinkIcon size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    Internal route where customers go when they click the flyer image.
                  </small>
                </div>

                {/* Flyer Image Selection Toggles */}
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Flyer Image Input Mode</label>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="radio" 
                        name="imgType" 
                        value="url" 
                        checked={flyerImageType === 'url'} 
                        onChange={() => { setFlyerImageType('url'); setFlyerImage(''); }} 
                      />
                      Image URL Link
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="radio" 
                        name="imgType" 
                        value="file" 
                        checked={flyerImageType === 'file'} 
                        onChange={() => { setFlyerImageType('file'); setFlyerImage(''); }} 
                      />
                      Upload Image File
                    </label>
                  </div>

                  {flyerImageType === 'url' ? (
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        disabled={flyerSubmitLoading}
                        placeholder="Paste image web URL..." 
                        className="form-input" 
                        value={flyerImage} 
                        onChange={(e) => setFlyerImage(e.target.value)}
                        style={{ width: '100%', backgroundColor: '#0d0d0f', border: '1px solid var(--border)', color: '#fff', padding: '0.75rem 0.75rem 0.75rem 2.2rem', borderRadius: '6px' }}
                      />
                      <ImageIcon size={14} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                    </div>
                  ) : (
                    <div style={{ 
                      border: '1px dashed var(--border)', 
                      borderRadius: '8px', 
                      padding: '1.5rem', 
                      textAlign: 'center',
                      backgroundColor: 'rgba(255,255,255,0.01)',
                      position: 'relative',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="file" 
                        disabled={flyerSubmitLoading}
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          opacity: 0, 
                          cursor: 'pointer' 
                        }} 
                      />
                      <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                        Click or drag file to upload flyer image
                      </p>
                    </div>
                  )}
                </div>

                {flyerImage && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Flyer Image Preview:</span>
                    <div style={{ 
                      width: '100%', 
                      maxHeight: '180px', 
                      borderRadius: '6px', 
                      border: '1px solid var(--border)', 
                      overflow: 'hidden', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: '#000'
                    }}>
                      <img 
                        src={flyerImage} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
                        onError={() => setFlyerError('Unable to render image. Verify the URL link format.')}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={flyerSubmitLoading}
                  style={{ 
                    marginTop: '1rem', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    fontWeight: 600
                  }}
                >
                  {flyerSubmitLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Uploading & Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Publish Flyer Banner
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Active Flyers List Grid */}
            <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#00e5ff' }}>
                  <Terminal size={20} />
                  <h3 style={{ fontSize: '1.3rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Active Flyers</h3>
                </div>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.2)', color: '#00e5ff', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  {flyers.length} Active
                </span>
              </div>

              {loadingFlyers ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem' }}>Loading active flyers...</span>
                </div>
              ) : flyers.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 0', textAlign: 'center' }}>
                  <ImageIcon size={36} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '1rem', margin: '0 0 0.25rem 0' }}>No Flyers Published</h4>
                    <p className="text-muted" style={{ fontSize: '0.8rem', maxWidth: '280px', margin: 0 }}>
                      Add special offer or discount banners to highlight ongoing promotions on the customer landing page.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '480px', paddingRight: '0.25rem' }}>
                  {flyers.map(flyer => (
                    <div key={flyer.id} style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      backgroundColor: '#0d0d0f', 
                      border: '1px solid var(--border)',
                      alignItems: 'center'
                    }}>
                      <div style={{ 
                        width: '80px', 
                        height: '55px', 
                        borderRadius: '4px', 
                        overflow: 'hidden', 
                        backgroundColor: '#000', 
                        flexShrink: 0,
                        border: '1px solid #1a1a1f'
                      }}>
                        <img src={flyer.image} alt={flyer.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: '0 0 0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {flyer.title}
                        </h4>
                        {flyer.link ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#00e5ff' }}>
                            <LinkIcon size={10} />
                            <span>Link: {flyer.link}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Click Route Set</span>
                        )}
                      </div>

                      <button 
                        onClick={() => handleDeleteFlyer(flyer.id)}
                        style={{ 
                          backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                          border: '1px solid rgba(239, 68, 68, 0.2)', 
                          color: '#ef4444', 
                          padding: '0.5rem', 
                          borderRadius: '6px', 
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: User Account Controls */}
        {activeTab === 'users' && (
          <div className="card animate-fade-in" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '0.5rem' }}>
              <UsersIcon size={24} />
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Registered User Directory</h3>
            </div>

            {userError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '0.75rem', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem' }}>
                {userError}
              </div>
            )}

            {userSuccess && (
              <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '0.75rem', borderRadius: '6px', color: '#4ade80', fontSize: '0.85rem' }}>
                {userSuccess}
              </div>
            )}

            {/* Filter Search Header */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Search Field */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                backgroundColor: '#0d0d0f', 
                border: '1px solid var(--border)', 
                borderRadius: '6px', 
                padding: '0.2rem 0.75rem', 
                gap: '0.5rem',
                minWidth: '280px',
                flex: 1
              }}>
                <Search size={16} style={{ color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search user profile name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    padding: '0.6rem 0',
                    width: '100%',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              {/* Role Selection Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Filter size={14} />
                  <span>Role:</span>
                </div>
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  style={{ 
                    backgroundColor: '#0d0d0f', 
                    border: '1px solid var(--border)', 
                    color: '#fff', 
                    padding: '0.6rem 2rem 0.6rem 0.75rem', 
                    borderRadius: '6px', 
                    fontSize: '0.9rem',
                    cursor: 'pointer' 
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="customer">Customers</option>
                </select>
              </div>

            </div>

            {/* Users Directory Table */}
            {usersLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.9rem' }}>Querying database user profiles...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '5rem 0', textAlign: 'center' }}>
                <UserX size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>No Profiles Found</h4>
                  <p className="text-muted" style={{ fontSize: '0.85rem', maxWidth: '320px', margin: 0 }}>
                    No user accounts matched your search terms or filter selection.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: '#0d0d0f' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: '#141416' }}>
                      <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Username</th>
                      <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email Address</th>
                      <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Account Role</th>
                      <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(userObj => {
                      const isRootAdmin = userObj.email.toLowerCase() === 'admin@kdnsport.com';
                      return (
                        <tr key={userObj.id} style={{ borderBottom: '1px solid #141416', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#101014'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '1rem', color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                            {userObj.username}
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {userObj.email}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {userObj.role === 'admin' ? (
                              <span style={{ 
                                backgroundColor: 'rgba(240, 129, 25, 0.08)', 
                                border: '1px solid rgba(240, 129, 25, 0.2)', 
                                color: 'var(--primary)', 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '9999px', 
                                fontSize: '0.75rem', 
                                fontWeight: 600 
                              }}>
                                Admin Staff
                              </span>
                            ) : (
                              <span style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                                border: '1px solid rgba(255, 255, 255, 0.08)', 
                                color: 'var(--text-muted)', 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '9999px', 
                                fontSize: '0.75rem' 
                              }}>
                                Customer
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {userObj.isActive ? (
                              <span style={{ color: '#4ade80', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                                <Check size={14} /> Active
                              </span>
                            ) : (
                              <span style={{ color: '#f87171', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 500 }}>
                                <UserX size={14} /> Deactivated
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            {isRootAdmin ? (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Root Protected
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleUserStatus(userObj)}
                                style={{
                                  backgroundColor: userObj.isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                  border: userObj.isActive ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)',
                                  color: userObj.isActive ? '#f87171' : '#4ade80',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {userObj.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Global Site Lockdown */}
        {activeTab === 'lockdown' && (
          <div className="card animate-fade-in" style={{ 
            backgroundColor: '#141416', 
            border: '1px solid var(--border)', 
            padding: '2.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '2rem',
            textAlign: 'center' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
              <ShieldAlert size={48} style={{ color: isShutdown ? '#ef4444' : '#22c55e' }} />
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Global Website Shutdown controls</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: '500px', margin: 0, lineHeight: '1.6' }}>
                Manage emergency maintenance triggers. Setting status to Offline immediately blocks customers and normal administrators from accessing public interfaces.
              </p>
            </div>

            {lockdownError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '0.75rem', borderRadius: '6px', color: '#f87171', fontSize: '0.85rem' }}>
                {lockdownError}
              </div>
            )}

            {lockdownSuccess && (
              <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '0.75rem', borderRadius: '6px', color: '#4ade80', fontSize: '0.85rem' }}>
                {lockdownSuccess}
              </div>
            )}

            {/* Current Status Box */}
            <div style={{
              backgroundColor: isShutdown ? 'rgba(239, 68, 68, 0.05)' : 'rgba(34, 197, 94, 0.05)',
              border: isShutdown ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              padding: '2rem',
              width: '100%',
              maxWidth: '480px'
            }}>
              <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                Current Platform Status
              </span>
              <h2 style={{
                fontSize: '2rem',
                fontFamily: 'Outfit',
                fontWeight: 800,
                color: isShutdown ? '#f87171' : '#4ade80',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                margin: '0.5rem 0'
              }}>
                <Power size={24} />
                {isShutdown ? 'OFFLINE (SHUTDOWN)' : 'ONLINE (OPERATIONAL)'}
              </h2>
              <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0, marginTop: '0.75rem', lineHeight: '1.5' }}>
                {isShutdown 
                  ? 'All checkout carts, badminton schedules, physiotherapy forms, and normal dashboards are locked. A maintenance screen is shown instead.'
                  : 'Public pages are operational. Customers can purchase supplements and book slots. Administrators can manage inventories.'
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {isShutdown ? (
                <button
                  onClick={() => handleToggleLockdown(false)}
                  disabled={lockdownLoading}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    backgroundColor: '#22c55e', 
                    borderColor: '#22c55e',
                    color: '#fff',
                    fontWeight: 700
                  }}
                >
                  {lockdownLoading ? 'Deactivating Shutdown...' : 'RESTORE SITE ONLINE'}
                </button>
              ) : (
                <button
                  onClick={() => handleToggleLockdown(true)}
                  disabled={lockdownLoading}
                  className="btn btn-danger"
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    backgroundColor: '#ef4444', 
                    borderColor: '#ef4444',
                    color: '#fff',
                    fontWeight: 700
                  }}
                >
                  {lockdownLoading ? 'Activating Shutdown...' : '🚨 TRIGGER MASTER SHUTDOWN'}
                </button>
              )}
            </div>
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
                        <option value="image">Image Swatches Grid</option>
                        <option value="button">Button Tags Selector</option>
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
                    Gallery Images (Click to set as Main, first is Main):
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
                          boxShadow: idx === 0 ? '0 0 8px var(--primary-glow)' : 'none',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setProductForm(prev => {
                            const selectedImg = prev.images[idx];
                            const filtered = prev.images.filter((_, i) => i !== idx);
                            const updatedImages = [selectedImg, ...filtered];
                            return {
                              ...prev,
                              images: updatedImages,
                              image: selectedImg
                            };
                          });
                        }}
                        title="Click to make this the main product photo"
                      >
                        <img
                          src={img}
                          alt={`Preview ${idx}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
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
