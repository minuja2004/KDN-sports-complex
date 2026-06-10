import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { ShoppingCart, ShoppingBag, Search, Filter, X, CreditCard, ChevronRight, CheckCircle, Package } from 'lucide-react';

const Shop = ({ user }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // E-commerce state
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shipping, setShipping] = useState({ name: '', address: '', phone: '' });
  const [orderProcessing, setOrderProcessing] = useState(false);
  
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const data = await api.orders.getMyOrders();
      setMyOrders(data);
    } catch (err) {
      console.error('Failed to load user orders:', err.message);
    }
  };

  // Add item to cart
  const addToCart = (product) => {
    if (!user) {
      alert('Please sign in to add items to your shopping cart.');
      navigate('/login');
      return;
    }

    if (product.stock <= 0) {
      alert('Sorry, this product is currently out of stock.');
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert(`Sorry, only ${product.stock} units are available in stock.`);
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setCartOpen(true);
  };

  // Modify cart quantity
  const updateQuantity = (id, delta) => {
    const item = cart.find(c => c.id === id);
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

  // Calculate cart total
  const cartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Trigger Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCartOpen(false);
    setCheckoutOpen(true);
    setError('');
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!shipping.name || !shipping.address || !shipping.phone) {
      setError('Please complete all shipping details.');
      return;
    }

    setOrderProcessing(true);
    setError('');

    try {
      const orderPayload = {
        items: cart,
        shippingDetails: shipping,
        totalAmount: cartTotal()
      };

      const result = await api.orders.create(orderPayload);
      setOrderSuccess(result);
      setCart([]);
      setCheckoutOpen(false);
      setShipping({ name: '', address: '', phone: '' });
      await fetchProducts(); // Reload products to update stocks
      await fetchUserOrders(); // Reload user order history
    } catch (err) {
      setError(err.message || 'Checkout failed. An item in your cart may have run out of stock.');
    } finally {
      setOrderProcessing(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container section animate-fade-in" style={{ position: 'relative' }}>
      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
          KDN NUTRITION & <span style={{ color: 'var(--primary)' }}>SUPPLEMENT STORE</span>
        </h1>
        <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Fuel your body with premium athletic supplements. Standard genuine products.
        </p>
      </div>

      {/* Cart button floating top-right */}
      {user && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <button onClick={() => setCartOpen(true)} className="btn btn-secondary" style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ShoppingCart size={18} style={{ color: 'var(--primary)' }} />
            <span>View Cart</span>
            {cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '0.15rem 0.45rem',
                borderRadius: '50%'
              }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Checkout Success Message */}
      {orderSuccess && (
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
          <CheckCircle size={24} />
          <div>
            <strong style={{ display: 'block', color: '#fff' }}>Order Placed Successfully! (Order ID: #{orderSuccess.id})</strong>
            Your items are paid, stock is secured, and order is processing. See transaction log below.
            <button onClick={() => setOrderSuccess(null)} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer', marginLeft: '1rem', fontSize: '0.85rem' }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Filters & Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search supplements (whey, creatine, pre-workout...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'protein', 'pre-workout', 'creatine', 'recovery', 'vitamins'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`btn ${categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', textTransform: 'capitalize' }}
            >
              {cat.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="text-center" style={{ padding: '3rem 0' }}>
          <p className="text-muted">Loading supplements catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem', backgroundColor: '#141416' }}>
          <ShoppingBag size={36} style={{ color: 'var(--border-highlight)', marginBottom: '1rem' }} />
          <h3>No Products Found</h3>
          <p className="text-muted">No items matched your search filters. Try looking for another category.</p>
        </div>
      ) : (
        <div className="grid-3" style={{ marginBottom: '4rem' }}>
          {filteredProducts.map(product => (
            <div key={product.id} className="card card-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#141416' }}>
              <div>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem', border: '1px solid var(--border)' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <span className="text-primary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {product.category.replace('-', ' ')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>★ {product.rating.toFixed(1)}</span>
                </div>

                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '1.5rem', minHeight: '50px' }}>
                  {product.description}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>${product.price.toFixed(2)}</span>
                  <span style={{ fontSize: '0.75rem', color: product.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(product)}
                  className="btn btn-outline"
                  style={{ width: '100%' }}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart size={14} />
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart Slider Drawer */}
      {cartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '100%',
          maxWidth: '450px',
          height: '100%',
          backgroundColor: '#141416',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {/* Header */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={20} style={{ color: 'var(--primary)' }} />
              Shopping Cart
            </h3>
            <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '1.5rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '4rem' }}>
                <ShoppingBag size={48} style={{ color: 'var(--border)', marginBottom: '1rem' }} />
                <p>Your shopping cart is empty.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #1f1f23', paddingBottom: '1rem' }}>
                    <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                      <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>${item.price.toFixed(2)}</span>
                    </div>
                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '4px', padding: '0.25rem' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', color: '#fff', width: '24px', height: '24px', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '0.85rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', color: '#fff', width: '24px', height: '24px', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Checkout action */}
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Cart Total:</span>
              <strong style={{ fontSize: '1.4rem', color: '#fff' }}>${cartTotal().toFixed(2)}</strong>
            </div>

            <button
              onClick={handleOpenCheckout}
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={cart.length === 0}
            >
              Proceed to Checkout
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Info Modal */}
      {checkoutOpen && (
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
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '0.5rem' }}>Fulfillment Address</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Confirm your shipping details to complete payment checkout.
            </p>

            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span>Order Total:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>${cartTotal().toFixed(2)}</strong>
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit}>
              <div className="form-group">
                <label className="form-label">Recipient Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={shipping.name}
                  onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Delivery Address</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={shipping.address}
                  onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                  placeholder="Street Address, City"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={shipping.phone}
                  onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  placeholder="+94 77 123 4567"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={orderProcessing}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={orderProcessing}
                >
                  {orderProcessing ? 'Securing Stock...' : 'Confirm Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User's past Store Orders */}
      {user && (
        <div style={{ marginTop: '4.5rem' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            My Supplement Purchases
          </h2>

          {myOrders.length === 0 ? (
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>You have no past purchases recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {myOrders.map(order => (
                <div key={order.id} className="card" style={{ backgroundColor: '#141416', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>ORDER ID</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>#{order.id}</h4>
                    </div>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>PURCHASE DATE</span>
                      <span style={{ fontSize: '0.9rem', color: '#fff' }}>{order.createdAt.split('T')[0]}</span>
                    </div>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>TOTAL AMOUNT</span>
                      <span style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>STATUS</span>
                      <span className={`badge ${
                        order.orderStatus === 'Pending' ? 'badge-pending' :
                        order.orderStatus === 'Shipped' ? 'badge-info' : 'badge-success'
                      }`}>{order.orderStatus}</span>
                    </div>
                  </div>

                  <div>
                    <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Items</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#fff' }}>
                          <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>x{item.quantity}</span></span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop;
