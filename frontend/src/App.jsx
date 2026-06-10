import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MaintenanceMode from './components/MaintenanceMode';
import Home from './pages/Home';
import Gym from './pages/Gym';
import Badminton from './pages/Badminton';
import Physio from './pages/Physio';
import Shop from './pages/Shop';
import Cart from './pages/Cart';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SecretGatekeeper from './pages/SecretGatekeeper';
import { api } from './utils/api';

// Inner wrapper to access route location
const AppContent = ({ user, onLogin, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isShutdown, setIsShutdown] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Lifted Cart State with LocalStorage persistence
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('kdn_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('kdn_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    if (!user) {
      alert('Please sign in to add items to your shopping cart.');
      navigate('/login');
      return false;
    }

    if (product.stock <= 0) {
      alert('Sorry, this product is currently out of stock.');
      return false;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert(`Sorry, only ${product.stock} units are available in stock.`);
        return false;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    return true;
  };

  const updateQuantity = (id, delta) => {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== id));
      return;
    }

    if (newQty > item.stock) {
      alert(`Sorry, only ${item.stock} units are available in stock.`);
      return;
    }

    setCart(cart.map(c => c.id === id ? { ...c, quantity: newQty } : c));
  };

  const clearCart = () => setCart([]);
  const cartTotal = () => cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  useEffect(() => {
    checkSiteStatus();

    // Listeners for global API shutdown events
    const handleMaintenanceTriggered = () => {
      setIsShutdown(true);
    };

    const handleShutdownChange = (e) => {
      setIsShutdown(e.detail.isShutdown);
    };

    window.addEventListener('kdn-maintenance-triggered', handleMaintenanceTriggered);
    window.addEventListener('kdn-shutdown-state-changed', handleShutdownChange);

    return () => {
      window.removeEventListener('kdn-maintenance-triggered', handleMaintenanceTriggered);
      window.removeEventListener('kdn-shutdown-state-changed', handleShutdownChange);
    };
  }, []);

  const checkSiteStatus = async () => {
    try {
      const data = await api.secret.checkShutdown();
      setIsShutdown(data.isShutdown);
    } catch (err) {
      console.error('Failed to connect to backend for status check:', err.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (checkingStatus) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#a1a1aa' }}>
        <p>Connecting to KDN Complex portal...</p>
      </div>
    );
  }

  // If the site is shut down and the user is NOT visiting the secret url, show maintenance screen
  const isSecretRoute = location.pathname === '/secret-gatekeeper';
  if (isShutdown && !isSecretRoute) {
    return <MaintenanceMode />;
  }

  return (
    <div className="app-container">
      <Navbar user={user} onLogout={onLogout} cart={cart} cartTotal={cartTotal} />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gym" element={<Gym user={user} />} />
          <Route path="/badminton" element={<Badminton user={user} />} />
          <Route path="/physio" element={<Physio user={user} />} />
          <Route path="/shop" element={<Shop user={user} addToCart={addToCart} />} />
          <Route path="/cart" element={<Cart user={user} cart={cart} updateQuantity={updateQuantity} cartTotal={cartTotal} clearCart={clearCart} />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login onLoginSuccess={onLogin} />} 
          />
          <Route 
            path="/admin" 
            element={<AdminDashboard user={user} onLoginSuccess={onLogin} />} 
          />
          <Route path="/secret-gatekeeper" element={<SecretGatekeeper />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('kdn_token');
    if (token) {
      // Validate token on reload
      api.auth.getProfile()
        .then(userData => setUser(userData))
        .catch(() => {
          localStorage.removeItem('kdn_token');
          setUser(null);
        });
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('kdn_token');
    setUser(null);
  };

  return (
    <Router>
      <AppContent user={user} onLogin={handleLogin} onLogout={handleLogout} />
    </Router>
  );
};

export default App;
