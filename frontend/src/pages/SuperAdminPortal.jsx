import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Cpu, Database, ShieldAlert, Activity, ArrowLeft } from 'lucide-react';

const SuperAdminPortal = () => {
  const navigate = useNavigate();

  return (
    <div className="container section animate-fade-in" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
      {/* Breadcrumb / Back button */}
      <div style={{ marginBottom: '2.5rem' }}>
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
      </div>

      {/* Main Console Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Header Block */}
        <div className="card" style={{ 
          backgroundColor: '#141416', 
          padding: '2.5rem', 
          border: '1px solid var(--border)',
          borderLeft: '4px solid #00e5ff', // Neon Cyan Developer Accent
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
            backgroundColor: 'rgba(0, 229, 255, 0.05)',
            filter: 'blur(40px)',
            borderRadius: '50%',
            zIndex: 0
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
            <div style={{ 
              display: 'inline-flex', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              backgroundColor: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              color: '#00e5ff'
            }}>
              <Terminal size={32} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
                DEVELOPER SUPER ADMIN CONSOLE
              </h1>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Active System URL: <code style={{ color: '#00e5ff', backgroundColor: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{window.location.pathname}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Console Content Grid */}
        <div className="grid-3" style={{ gap: '1.5rem' }}>
          
          {/* Database Module */}
          <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.6 }}>
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
          <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.6 }}>
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
          <div className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.6 }}>
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

        {/* Central Terminal / Placeholder Dashboard */}
        <div className="card" style={{ 
          backgroundColor: '#0d0d0f', 
          border: '1px solid #1a1a1f', 
          padding: '2.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '260px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '1.25rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 229, 255, 0.03)',
            border: '1px dashed rgba(0, 229, 255, 0.15)',
            color: '#00e5ff',
            marginBottom: '1.25rem'
          }}>
            <Cpu size={36} />
          </div>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#fff', marginBottom: '0.5rem' }}>
            Console Core Ready
          </h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', maxWidth: '460px', lineHeight: '1.6' }}>
            The Developer Super Admin Panel has been instantiated successfully at this unique URL. Provide maintainer instructions to populate this portal with system controls.
          </p>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminPortal;
