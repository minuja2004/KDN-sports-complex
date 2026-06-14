import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Terminal, Cpu, Database, ShieldAlert, Activity, ArrowLeft, 
  Trash2, Plus, Upload, Link as LinkIcon, AlertTriangle, Check, 
  Image as ImageIcon, Loader2, Users as UsersIcon, UserX, Search, Filter, Power 
} from 'lucide-react';
import { api } from '../utils/api';

const SuperAdminPortal = () => {
  const navigate = useNavigate();

  // Authentication & Session
  const [hasSecretToken, setHasSecretToken] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard', 'flyers', 'users', 'lockdown'

  // Flyers Form States
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [image, setImage] = useState('');
  const [imageType, setImageType] = useState('url'); // 'url' or 'file'

  // Users Management States
  const [userList, setUserList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Site Lockdown States
  const [isShutdown, setIsShutdown] = useState(false);
  const [lockdownLoading, setLockdownLoading] = useState(false);

  // Flyers Data & Status States
  const [flyers, setFlyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const secretToken = localStorage.getItem('kdn_secret_token');
    if (!secretToken) {
      setHasSecretToken(false);
      setLoading(false);
      return;
    }
    setHasSecretToken(true);

    // Fetch flyers and site status on component mount
    fetchFlyers();
    fetchLockdownStatus();
  }, []);

  // Fetch users when the users tab is launched
  useEffect(() => {
    if (activeSection === 'users') {
      fetchUsers();
    }
  }, [activeSection]);

  const fetchFlyers = async () => {
    setLoading(true);
    try {
      const data = await api.flyers.getAll();
      setFlyers(data);
    } catch (err) {
      console.error('Failed to retrieve flyers:', err);
      setError('Error loading flyers database. Ensure the server is online.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLockdownStatus = async () => {
    try {
      const data = await api.secret.checkShutdown();
      setIsShutdown(data.isShutdown);
    } catch (err) {
      console.error('Failed to load site lockdown status:', err);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await api.secret.getUsers();
      setUserList(data);
    } catch (err) {
      console.error('Failed to retrieve users:', err);
      setError('Error loading user directory database.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (limit to 5MB for safety)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file is too large. Max size is 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFlyer = async (e) => {
    e.preventDefault();
    if (!title) {
      setError('Flyer title is required.');
      return;
    }
    if (!image) {
      setError('Please provide a flyer image (upload file or paste URL).');
      return;
    }

    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title,
        image,
        link
      };
      
      const newFlyer = await api.flyers.create(payload);
      setFlyers([newFlyer, ...flyers]);
      
      // Reset Form
      setTitle('');
      setLink('');
      setImage('');
      setSuccess('Promotional flyer saved and published successfully!');
      
      // Clear success alert after 4s
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while saving the flyer.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteFlyer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flyer? This action cannot be undone.')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await api.flyers.delete(id);
      setFlyers(flyers.filter(f => f.id !== id));
      setSuccess('Flyer removed successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error deleting the flyer.');
    }
  };

  const handleToggleUserStatus = async (userObj) => {
    const nextStatus = !userObj.isActive;
    const confirmMsg = nextStatus 
      ? `Are you sure you want to reactivate the account for "${userObj.username}" (${userObj.email})?`
      : `Are you sure you want to deactivate the account for "${userObj.username}" (${userObj.email})? Deactivated users cannot log in or perform administrative tasks.`;
      
    if (!window.confirm(confirmMsg)) return;

    setError('');
    setSuccess('');

    try {
      await api.secret.updateUserStatus(userObj.id, nextStatus);
      setUserList(userList.map(u => u.id === userObj.id ? { ...u, isActive: nextStatus } : u));
      setSuccess(`Successfully ${nextStatus ? 'reactivated' : 'deactivated'} "${userObj.username}"'s account.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update user status.');
    }
  };

  const handleToggleLockdown = async (nextState) => {
    if (nextState === true) {
      if (!window.confirm('⚠️ CRITICAL WARNING: You are about to lock down the entire KDN Sport Complex website. This blocks all public badminton bookings, gym check-ins, supplement sales, and administrative dashboard access. Proceed?')) {
        return;
      }
    }

    setLockdownLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await api.secret.toggleShutdown(nextState);
      setIsShutdown(result.isShutdown);
      setSuccess(result.message);
      
      // Dispatch status shift event to immediately update local client layout
      window.dispatchEvent(new CustomEvent('kdn-shutdown-state-changed', {
        detail: { isShutdown: result.isShutdown }
      }));

      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update site lockdown status.');
    } finally {
      setLockdownLoading(false);
    }
  };

  // Filtered users for table
  const filteredUsers = userList.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      roleFilter === 'all' || 
      user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (!hasSecretToken && !loading) {
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
    <div className="container section animate-fade-in" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      
      {/* Breadcrumb / Back button */}
      <div style={{ marginBottom: '2.5rem' }}>
        {activeSection === 'dashboard' ? (
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: 'var(--text-muted)', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '0.95rem' 
            }} 
            className="nav-link"
          >
            <ArrowLeft size={16} />
            Back to Main Site
          </button>
        ) : (
          <button 
            onClick={() => {
              setActiveSection('dashboard');
              setError('');
              setSuccess('');
            }} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: '#00e5ff', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '0.95rem' 
            }} 
            className="nav-link"
          >
            <ArrowLeft size={16} />
            Back to Console Dashboard
          </button>
        )}
      </div>

      {/* Main Console Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Header Block */}
        <div className="card" style={{ 
          backgroundColor: '#141416', 
          padding: '2.5rem', 
          border: '1px solid var(--border)',
          borderLeft: activeSection === 'dashboard' ? '4px solid #00e5ff' : '4px solid var(--primary)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Futuristic ambient background glow */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            backgroundColor: activeSection === 'dashboard' ? 'rgba(0, 229, 255, 0.05)' : 'rgba(240, 129, 25, 0.05)',
            filter: 'blur(40px)',
            borderRadius: '50%',
            zIndex: 0
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              backgroundColor: activeSection === 'dashboard' ? 'rgba(0, 229, 255, 0.08)' : 'rgba(240, 129, 25, 0.08)',
              border: activeSection === 'dashboard' ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid rgba(240, 129, 25, 0.2)',
              color: activeSection === 'dashboard' ? '#00e5ff' : 'var(--primary)'
            }}>
              <Terminal size={32} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', letterSpacing: '-0.02em', color: '#fff', margin: 0, textTransform: 'uppercase' }}>
                {activeSection === 'dashboard' 
                  ? 'Developer Super Admin Console' 
                  : activeSection === 'flyers'
                    ? 'Console / Flyer Advertisements'
                    : activeSection === 'users'
                      ? 'Console / User Account Controls'
                      : 'Console / Global Site Lockdown'
                }
              </h1>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Active Path: <code style={{ color: activeSection === 'dashboard' ? '#00e5ff' : 'var(--primary)', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{window.location.pathname}{activeSection !== 'dashboard' ? ` > ${activeSection}` : ''}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: '8px', color: '#f87171', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', padding: '1rem', borderRadius: '8px', color: '#4ade80', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Check size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* Session Security Warning */}
        {!hasSecretToken && (
          <div style={{ 
            backgroundColor: 'rgba(245, 158, 11, 0.05)', 
            border: '1px solid rgba(245, 158, 11, 0.2)', 
            borderLeft: '4px solid #f59e0b',
            padding: '1.5rem', 
            borderRadius: '8px', 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1rem',
            alignItems: 'flex-start'
          }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <ShieldAlert size={24} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <div>
                <h4 style={{ color: '#fff', fontSize: '1rem', margin: 0, fontFamily: 'Outfit', fontWeight: 600 }}>Master Session Token Missing</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  You are viewing the super admin portal in <strong>Read-Only Mode</strong>. To edit settings or trigger a site lockdown, please authenticate at the security gatekeeper.
                </p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/secret-gatekeeper')} 
              className="btn btn-outline" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}
            >
              Go to Gatekeeper Control
            </button>
          </div>
        )}

        {/* VIEW 1: Main Dashboard Console Grid */}
        {activeSection === 'dashboard' && (
          <div className="grid-3" style={{ gap: '1.5rem', marginTop: '0.5rem' }}>
            
            {/* Active Flyer Advertisements Module Launcher */}
            <div className="card" style={{ 
              backgroundColor: '#141416', 
              border: '1px solid var(--border)', 
              borderLeft: '4px solid #00e5ff',
              padding: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#00e5ff' }}>
                  <ImageIcon size={22} />
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Flyer Advertisements</h3>
                </div>
                <span style={{ fontSize: '0.75rem', marginLeft: 'auto', backgroundColor: 'rgba(0, 229, 255, 0.08)', border: '1px solid rgba(0, 229, 255, 0.2)', color: '#00e5ff', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  {flyers.length} Active
                </span>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Manage homepage slide banners, publish discount offers, and configure redirect link paths for customer call-to-actions.
              </p>

              <button 
                onClick={() => setActiveSection('flyers')}
                className="btn btn-primary"
                style={{ 
                  marginTop: 'auto',
                  backgroundColor: '#00e5ff',
                  borderColor: '#00e5ff',
                  color: '#000',
                  fontWeight: 700,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1rem'
                }}
              >
                Launch Flyer Module
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>

            {/* Active User Account Controls Module Launcher */}
            <div className="card" style={{ 
              backgroundColor: '#141416', 
              border: '1px solid var(--border)', 
              borderLeft: '4px solid #00e5ff',
              padding: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#00e5ff' }}>
                  <UsersIcon size={22} />
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>User Account Controls</h3>
                </div>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Audit registered customer profiles, list administrative staff members, and toggle account activation status (deactivate users/admins).
              </p>

              <button 
                onClick={() => setActiveSection('users')}
                className="btn btn-primary"
                style={{ 
                  marginTop: 'auto',
                  backgroundColor: '#00e5ff',
                  borderColor: '#00e5ff',
                  color: '#000',
                  fontWeight: 700,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1rem'
                }}
              >
                Manage User Directory
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>

            {/* Active Global Site Lockdown Launcher */}
            <div className="card" style={{ 
              backgroundColor: '#141416', 
              border: '1px solid var(--border)', 
              borderLeft: '4px solid #00e5ff',
              padding: '2rem', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#00e5ff' }}>
                  <Power size={22} />
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Global Site Lockdown</h3>
                </div>
                <span style={{ 
                  fontSize: '0.75rem', 
                  marginLeft: 'auto', 
                  backgroundColor: isShutdown ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)', 
                  border: isShutdown ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)', 
                  color: isShutdown ? '#ef4444' : '#22c55e', 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '9999px',
                  fontWeight: 600 
                }}>
                  {isShutdown ? 'OFFLINE' : 'ONLINE'}
                </span>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Disconnect the public system. Triggering lockdown locks all customers and normal admins out of the site, presenting a maintenance notice.
              </p>

              <button 
                onClick={() => setActiveSection('lockdown')}
                className="btn btn-primary"
                style={{ 
                  marginTop: 'auto',
                  backgroundColor: '#00e5ff',
                  borderColor: '#00e5ff',
                  color: '#000',
                  fontWeight: 700,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem 1rem'
                }}
              >
                Manage Lockdown State
                <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>

          </div>
        )}

        {/* VIEW 2: Promotional Flyers Sub-Section */}
        {activeSection === 'flyers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }} className="animate-fade-in">
            
            {/* Create Flyer Form Card */}
            <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', height: 'fit-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                <ImageIcon size={22} />
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Publish New Flyer</h3>
              </div>

              <form onSubmit={handleSaveFlyer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Flyer Title */}
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Flyer Title / Promotion Name</label>
                  <input 
                    type="text" 
                    disabled={!hasSecretToken || submitLoading}
                    placeholder="e.g. 25% Off Gym Memberships!"
                    className="form-input" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#0d0d0f', border: '1px solid var(--border)', color: '#fff', padding: '0.75rem', borderRadius: '6px' }}
                  />
                </div>

                {/* Flyer Link */}
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block' }}>Redirect Path / Link (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      disabled={!hasSecretToken || submitLoading}
                      placeholder="e.g. /gym or /shop"
                      className="form-input" 
                      value={link} 
                      onChange={(e) => setLink(e.target.value)}
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
                        checked={imageType === 'url'} 
                        onChange={() => { setImageType('url'); setImage(''); }} 
                      />
                      Image URL Link
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="radio" 
                        name="imgType" 
                        value="file" 
                        checked={imageType === 'file'} 
                        onChange={() => { setImageType('file'); setImage(''); }} 
                      />
                      Upload Image File
                    </label>
                  </div>

                  {imageType === 'url' ? (
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        disabled={!hasSecretToken || submitLoading}
                        placeholder="Paste image web URL..." 
                        className="form-input" 
                        value={image} 
                        onChange={(e) => setImage(e.target.value)}
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
                        disabled={!hasSecretToken || submitLoading}
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

                {image && (
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
                        src={image} 
                        alt="Preview" 
                        style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain' }}
                        onError={() => setError('Unable to render image. Verify the URL link format.')}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={!hasSecretToken || submitLoading}
                  style={{ 
                    marginTop: '1rem', 
                    backgroundColor: hasSecretToken ? 'var(--primary)' : '#1e1e24', 
                    borderColor: hasSecretToken ? 'var(--primary)' : 'var(--border)',
                    color: hasSecretToken ? '#000' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    fontWeight: 600,
                    opacity: hasSecretToken ? 1 : 0.6
                  }}
                >
                  {submitLoading ? (
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

              {loading ? (
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
                        disabled={!hasSecretToken}
                        title={hasSecretToken ? "Delete Flyer" : "Write Permissions Required"}
                        style={{ 
                          backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                          border: '1px solid rgba(239, 68, 68, 0.2)', 
                          color: '#ef4444', 
                          padding: '0.5rem', 
                          borderRadius: '6px', 
                          cursor: hasSecretToken ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: hasSecretToken ? 1 : 0.4
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

        {/* VIEW 3: User Accounts Controls Directory */}
        {activeSection === 'users' && (
          <div className="card animate-fade-in" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '0.5rem' }}>
              <UsersIcon size={24} />
              <h3 style={{ fontSize: '1.4rem', fontFamily: 'Outfit', fontWeight: 600, color: '#fff', margin: 0 }}>Registered User Directory</h3>
            </div>

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
                    {filteredUsers.map(user => {
                      const isRootAdmin = user.email.toLowerCase() === 'minuja.work@gmail.com';
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid #141416', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#101014'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '1rem', color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                            {user.username}
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {user.email}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {user.role === 'admin' ? (
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
                            {user.isActive ? (
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
                                onClick={() => handleToggleUserStatus(user)}
                                disabled={!hasSecretToken}
                                style={{
                                  backgroundColor: user.isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                  border: user.isActive ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(34, 197, 94, 0.2)',
                                  color: user.isActive ? '#f87171' : '#4ade80',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: hasSecretToken ? 'pointer' : 'not-allowed',
                                  fontWeight: 600,
                                  opacity: hasSecretToken ? 1 : 0.4,
                                  transition: 'all 0.2s'
                                }}
                              >
                                {user.isActive ? 'Deactivate Account' : 'Reactivate Account'}
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

        {/* VIEW 4: Global Site Lockdown controls */}
        {activeSection === 'lockdown' && (
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
                  disabled={!hasSecretToken || lockdownLoading}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    backgroundColor: '#22c55e', 
                    borderColor: '#22c55e',
                    color: '#fff',
                    fontWeight: 700,
                    opacity: hasSecretToken ? 1 : 0.4,
                    cursor: hasSecretToken ? 'pointer' : 'not-allowed'
                  }}
                >
                  {lockdownLoading ? 'Deactivating Shutdown...' : 'RESTORE SITE ONLINE'}
                </button>
              ) : (
                <button
                  onClick={() => handleToggleLockdown(true)}
                  disabled={!hasSecretToken || lockdownLoading}
                  className="btn btn-danger"
                  style={{ 
                    width: '100%', 
                    padding: '1rem', 
                    backgroundColor: '#ef4444', 
                    borderColor: '#ef4444',
                    color: '#fff',
                    fontWeight: 700,
                    opacity: hasSecretToken ? 1 : 0.4,
                    cursor: hasSecretToken ? 'pointer' : 'not-allowed'
                  }}
                >
                  {lockdownLoading ? 'Activating Shutdown...' : '🚨 TRIGGER MASTER SHUTDOWN'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Existing System Modules (Locked for maintaining original integrity) */}
        {activeSection === 'dashboard' && (
          <div className="grid-3" style={{ gap: '1.5rem', marginTop: '1rem' }}>
            {/* Database Module */}
            <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <Database size={20} />
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', fontWeight: 600 }}>Database Maintenance</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Tools to clean, backup, sync collections, and reset fallback JSON databases.
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 'auto' }}>
                Module locked (Awaiting Directives)
              </span>
            </div>

            {/* System Analytics Module */}
            <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <Activity size={20} />
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', fontWeight: 600 }}>System Health Logs</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Real-time API latency trackers, server uptime monitoring, and active traffic sockets.
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 'auto' }}>
                Module locked (Awaiting Directives)
              </span>
            </div>

            {/* Security & Access Module */}
            <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <ShieldAlert size={20} />
                <h3 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', fontWeight: 600 }}>Access Controllers</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Global rate limit rules, developer IP whitelist configurations, and security audits.
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 'auto' }}>
                Module locked (Awaiting Directives)
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SuperAdminPortal;
