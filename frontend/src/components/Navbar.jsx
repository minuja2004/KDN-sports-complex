import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Dumbbell, Calendar, Activity, ShoppingBag, Lock, LogIn, LogOut, LayoutDashboard } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container nav-wrapper">
        <Link to="/" className="nav-logo">
          {/* Custom SVG Sports Ring resembling KDN's logo theme */}
          <svg width="24" height="24" viewBox="0 0 24 24" className="logo-icon-svg">
            <polygon points="12,2 22,12 12,22 2,12" />
            <polygon points="12,6 18,12 12,18 6,12" fill="#000" />
          </svg>
          KDN<span>SPORT</span>
        </Link>

        <ul className="nav-links">
          <li>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/gym" className={`nav-link ${isActive('/gym') ? 'active' : ''}`}>
              <Dumbbell size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Gym
            </Link>
          </li>
          <li>
            <Link to="/badminton" className={`nav-link ${isActive('/badminton') ? 'active' : ''}`}>
              <Calendar size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Badminton
            </Link>
          </li>
          <li>
            <Link to="/physio" className={`nav-link ${isActive('/physio') ? 'active' : ''}`}>
              <Activity size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Physiotherapy
            </Link>
          </li>
          <li>
            <Link to="/shop" className={`nav-link ${isActive('/shop') ? 'active' : ''}`}>
              <ShoppingBag size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Shop
            </Link>
          </li>

          {user && user.role === 'admin' && (
            <li>
              <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} style={{ color: '#F08119', fontWeight: 'bold' }}>
                <LayoutDashboard size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Admin Panel
              </Link>
            </li>
          )}

          {user ? (
            <li style={{ marginLeft: '1rem' }}>
              <button onClick={handleLogoutClick} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <LogOut size={14} />
                Logout ({user.username})
              </button>
            </li>
          ) : (
            <li style={{ marginLeft: '1rem' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                <LogIn size={14} />
                Sign In
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
