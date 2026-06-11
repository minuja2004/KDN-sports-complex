import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ShoppingBag, X, CreditCard, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../utils/api';

const Cart = ({ user, cart, updateQuantity, cartTotal, clearCart }) => {
  const navigate = useNavigate();
  
  // Load preset from local storage if exists
  const [shipping, setShipping] = useState(() => {
    const saved = localStorage.getItem('kdn_shipping_preset');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || '',
          street: parsed.street || '',
          city: parsed.city || '',
          state: parsed.state || '',
          postalCode: parsed.postalCode || '',
          otherDetails: parsed.otherDetails || '',
          phone: parsed.phone || ''
        };
      } catch (e) {
        console.error('Failed to parse preset:', e);
      }
    }
    return { name: '', street: '', city: '', state: '', postalCode: '', otherDetails: '', phone: '' };
  });

  const [deliveryMethod, setDeliveryMethod] = useState(() => {
    const saved = localStorage.getItem('kdn_shipping_preset');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.deliveryMethod || 'delivery';
      } catch (e) {
        console.error(e);
      }
    }
    return 'delivery';
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState('');

  // Handle phone changes to force numbers-only and cap at 10 digits
  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Remove non-numbers
    if (val.length <= 10) {
      setShipping(prev => ({ ...prev, phone: val }));
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (shipping.phone.length !== 10) {
      setError('Contact Phone must be exactly 10 digits.');
      return;
    }

    let address = 'Store Pickup (KDN Head Office)';
    if (deliveryMethod === 'delivery') {
      if (!shipping.street || !shipping.city || !shipping.state || !shipping.postalCode) {
        setError('Please complete all delivery address fields (Street, City, State, Postal Code).');
        return;
      }
      address = `${shipping.street}, ${shipping.city}, ${shipping.state}, ${shipping.postalCode}${shipping.otherDetails ? ` (${shipping.otherDetails})` : ''}`;
    }

    if (!shipping.name || !shipping.phone) {
      setError('Please complete all required fields.');
      return;
    }

    setOrderProcessing(true);
    setError('');

    const deliveryCharge = deliveryMethod === 'delivery' ? 300 : 0;
    const orderTotal = cartTotal() + deliveryCharge;

    try {
      const orderPayload = {
        items: cart,
        shippingDetails: {
          name: shipping.name,
          address: address,
          phone: shipping.phone
        },
        paymentMethod: paymentMethod,
        totalAmount: orderTotal
      };

      const result = await api.orders.create(orderPayload);

      // Save to presets for future checkout convenience
      localStorage.setItem('kdn_shipping_preset', JSON.stringify({
        name: shipping.name,
        street: shipping.street,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
        otherDetails: shipping.otherDetails,
        phone: shipping.phone,
        deliveryMethod: deliveryMethod
      }));

      setOrderSuccess(result);
      clearCart();
    } catch (err) {
      setError(err.message || 'Checkout failed. An item in your cart may have run out of stock.');
    } finally {
      setOrderProcessing(false);
    }
  };

  const deliveryCharge = deliveryMethod === 'delivery' ? 300 : 0;
  const orderTotal = cartTotal() + deliveryCharge;

  if (!user) {
    return (
      <div className="container section text-center animate-fade-in" style={{ padding: '6rem 0' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem', backgroundColor: '#141416' }}>
          <ShoppingBag size={48} style={{ color: 'var(--primary)', marginBottom: '1.5rem' }} />
          <h2>Access Denied</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>Please sign in to view your shopping cart.</p>
          <Link to="/login" className="btn btn-primary">Sign In Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/shop" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }} className="nav-link">
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          YOUR <span style={{ color: 'var(--primary)' }}>SHOPPING CART</span>
        </h1>
        <p className="text-muted">Review your items and complete your purchase order.</p>
      </div>

      {orderSuccess ? (
        <div className="card text-center" style={{ padding: '3rem', backgroundColor: '#141416', maxWidth: '600px', margin: '0 auto' }}>
          <CheckCircle size={56} style={{ color: 'var(--success)', marginBottom: '1.5rem' }} />
          <h2 style={{ marginBottom: '1rem' }}>Order Placed Successfully!</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Thank you for your purchase! Your order ID is <strong style={{ color: '#fff' }}>#{orderSuccess.id}</strong>.
            The sports complex administration has received your request and will ship your order soon.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
          </div>
        </div>
      ) : cart.length === 0 ? (
        <div className="card text-center" style={{ padding: '4rem', backgroundColor: '#141416' }}>
          <ShoppingBag size={56} style={{ color: 'var(--border-highlight)', marginBottom: '1.5rem' }} />
          <h3>Your Cart is Empty</h3>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>You haven't added any athletic supplements to your cart yet.</p>
          <Link to="/shop" className="btn btn-primary">Browse Shop</Link>
        </div>
      ) : (
        <div className="grid-3" style={{ alignItems: 'start', gap: '2.5rem' }}>
          {/* Cart Items List - takes 2/3 space */}
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ backgroundColor: '#141416', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                Cart Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', borderBottom: '1px solid #1f1f23', paddingBottom: '1.5rem' }}>
                    <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} />
                    <div style={{ flexGrow: 1 }}>
                      <span className="text-primary" style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.category}</span>
                      <h4 style={{ fontSize: '1.05rem', margin: '0.1rem 0 0.25rem' }}>{item.name}</h4>
                      <span style={{ fontWeight: 600, color: '#fff' }}>රු {item.price.toFixed(2)}</span>
                    </div>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px', padding: '0.4rem 0.6rem', border: '1px solid var(--border)' }}>
                      <button type="button" onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', width: '20px' }}>-</button>
                      <span style={{ fontSize: '0.95rem', width: '20px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', width: '20px' }}>+</button>
                    </div>

                    <button type="button" onClick={() => updateQuantity(item.id, -item.quantity)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Checkout & Summary Form - takes 1/3 space */}
          <div>
            <div className="card card-accent" style={{ backgroundColor: '#141416', position: 'sticky', top: '90px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Order Summary</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Subtotal:</span>
                  <span>රු {cartTotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-muted">Delivery Charge:</span>
                  {deliveryMethod === 'delivery' ? (
                    <span style={{ color: 'var(--primary)' }}>රු 300.00</span>
                  ) : (
                    <span style={{ color: 'var(--success)' }}>Free</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginTop: '0.5rem' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: 'var(--primary)' }}>රු {orderTotal.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleCheckoutSubmit}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fulfillment details</h4>
                
                {/* Delivery Option Selector */}
                <div className="form-group">
                  <label className="form-label">Delivery Option</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button
                      type="button"
                      className={`btn ${deliveryMethod === 'delivery' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
                      onClick={() => setDeliveryMethod('delivery')}
                    >
                      🚚 Delivery
                    </button>
                    <button
                      type="button"
                      className={`btn ${deliveryMethod === 'pickup' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem', borderRadius: '4px' }}
                      onClick={() => setDeliveryMethod('pickup')}
                    >
                      🏢 Store Pickup
                    </button>
                  </div>
                </div>

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

                {deliveryMethod === 'delivery' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Street Address</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={shipping.street}
                        onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={shipping.city}
                        onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                        placeholder="Colombo"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">State / Region</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={shipping.state}
                          onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                          placeholder="Western"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Postal Code</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={shipping.postalCode}
                          onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                          placeholder="00100"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Additional Directions (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={shipping.otherDetails}
                        onChange={(e) => setShipping({ ...shipping, otherDetails: e.target.value })}
                        placeholder="Near clock tower, 2nd floor"
                      />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Collection Location</label>
                    <div style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: '1.4'
                    }}>
                      📍 <strong>KDN Sports Complex Head Office</strong><br/>
                      123 Complex Boulevard, Colombo
                    </div>
                  </div>
                )}

                 <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Contact Phone (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    className="form-input"
                    value={shipping.phone}
                    onChange={handlePhoneChange}
                    placeholder="0771234567"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="form-group" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <label className="form-label">Payment Method</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: paymentMethod === 'card' ? 'rgba(240, 129, 25, 0.1)' : 'var(--bg-surface-elevated)',
                      border: paymentMethod === 'card' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      padding: '1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>💳 Card Payment (Mock Visa/Mastercard)</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure checkout with standard card.</span>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: paymentMethod === 'cod' ? 'rgba(240, 129, 25, 0.1)' : 'var(--bg-surface-elevated)',
                      border: paymentMethod === 'cod' ? '2px solid var(--primary)' : '1px solid var(--border)',
                      padding: '1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.95rem', display: 'block' }}>
                          {deliveryMethod === 'delivery' ? '💵 Cash on Delivery (COD)' : '🏪 Pay on Pickup'}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {deliveryMethod === 'delivery' ? 'Pay with cash upon package arrival.' : 'Pay at the office counter.'}
                        </span>
                      </div>
                    </label>

                    {cart.some(item => item.allowKoko) && (
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: paymentMethod === 'koko' ? 'rgba(240, 129, 25, 0.1)' : 'var(--bg-surface-elevated)',
                        border: paymentMethod === 'koko' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        padding: '1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'koko'}
                          onChange={() => setPaymentMethod('koko')}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>Split with Koko (3 Installments)</strong>
                            <svg viewBox="0 0 135 45" width="48" height="15" style={{ verticalAlign: 'middle' }}>
                              <defs>
                                <pattern id="koko-stripes-cart" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                                  <rect width="4" height="4" fill="#00D2CA" />
                                  <line x1="0" y1="0" x2="0" y2="4" stroke="#0D1B50" strokeWidth="1.2" />
                                </pattern>
                              </defs>
                              <text x="2" y="37" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes-cart)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                              <text x="3" y="36" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes-cart)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                              <text x="4" y="35" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes-cart)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                              <text x="5" y="34" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="#FFAEC9" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                            </svg>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Pay 3 interest-free installments of <strong style={{ color: '#fff' }}>රු {(orderTotal / 3).toFixed(2)}</strong>.
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={orderProcessing}
                >
                  <CreditCard size={16} />
                  {orderProcessing ? 'Securing Stock...' : 'Confirm & Place Order'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
