import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { ShoppingCart, ShoppingBag, Search, Filter, X, CreditCard, ChevronRight, CheckCircle, Package } from 'lucide-react';

const Shop = ({ user, cart = [], addToCart }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [addedProductId, setAddedProductId] = useState(null);

  const handleAddClick = (product) => {
    const success = addToCart(product);
    if (success) {
      setAddedProductId(product.id);
      if (window.addedBtnTimeout) {
        clearTimeout(window.addedBtnTimeout);
      }
      window.addedBtnTimeout = setTimeout(() => {
        setAddedProductId(null);
      }, 1500);
    }
  };

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
          <button onClick={() => navigate('/cart')} className="btn btn-secondary" style={{ position: 'relative', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
        <div className="product-grid" style={{ marginBottom: '4rem' }}>
          {filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="card card-accent" 
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', backgroundColor: '#141416', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => navigate(`/shop/product/${product.id}`)}
            >
              <div>
                <div className="product-image-wrapper">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="main-image"
                  />
                  {product.images && product.images.length > 1 && (
                    <img
                      src={product.images[1]}
                      alt={product.name}
                      className="hover-image"
                    />
                  )}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <span className="text-primary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {product.category.replace('-', ' ')}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>★ {product.rating.toFixed(1)}</span>
                </div>

                <h3 style={{ 
                  fontFamily: 'Outfit', 
                  fontSize: '1.2rem', 
                  marginBottom: '0.5rem', 
                  height: '28px',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere'
                }} title={product.name}>{product.name}</h3>
                
                <p className="text-muted" style={{ 
                  fontSize: '0.8rem', 
                  lineHeight: '1.5', 
                  marginBottom: '1.5rem', 
                  height: '36px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-all',
                  overflowWrap: 'anywhere'
                }}>
                  {product.description}
                </p>
              </div>

              <div>
                <div className="price-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                    {product.isMultipleOption && product.selections && product.selections.length > 0
                      ? `From රු ${Math.min(...product.selections.map(s => s.price)).toFixed(2)}`
                      : `රු ${product.price.toFixed(2)}`}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: product.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="koko-installment-row" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '0.8rem', 
                  color: '#a0aec0', 
                  marginTop: '-0.5rem', 
                  marginBottom: '1rem',
                  height: '18px',
                  visibility: product.allowKoko ? 'visible' : 'hidden'
                }}>
                  {product.allowKoko ? (
                    <>
                      <span>
                        or 3 X <strong style={{ color: '#fff' }}>
                          {product.isMultipleOption && product.selections && product.selections.length > 0
                            ? `From රු ${(Math.min(...product.selections.map(s => s.price)) / 3).toFixed(2)}`
                            : `රු ${(product.price / 3).toFixed(2)}`}
                        </strong> with
                      </span>
                      <svg viewBox="0 0 135 45" width="55" height="18" style={{ verticalAlign: 'middle', marginLeft: '3px', marginRight: '3px' }}>
                        <defs>
                          <pattern id="koko-stripes" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                            <rect width="4" height="4" fill="#00D2CA" />
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#0D1B50" strokeWidth="1.2" />
                          </pattern>
                        </defs>
                        <text x="2" y="37" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                        <text x="3" y="36" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                        <text x="4" y="35" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                        <text x="5" y="34" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="#FFAEC9" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                      </svg>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '14px', 
                          height: '14px', 
                          borderRadius: '50%', 
                          backgroundColor: '#2d3748', 
                          color: '#a0aec0', 
                          fontSize: '9px', 
                          fontWeight: 'bold', 
                          cursor: 'help' 
                        }} 
                        title="Split your bill into 3 interest-free installments with Koko"
                      >
                        i
                      </span>
                    </>
                  ) : null}
                </div>

                <div className="product-card-actions" style={{ display: 'flex', gap: '0.5rem', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      if (product.isMultipleOption) {
                        navigate(`/shop/product/${product.id}`);
                      } else {
                        const success = addToCart(product);
                        if (success) navigate('/cart');
                      }
                    }}
                    className="btn btn-primary"
                    style={{ flex: '3', padding: '0.55rem', fontSize: '0.85rem' }}
                    disabled={product.stock <= 0}
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => {
                      if (product.isMultipleOption) {
                        navigate(`/shop/product/${product.id}`);
                      } else {
                        handleAddClick(product);
                      }
                    }}
                    className={`btn ${addedProductId === product.id ? 'btn-success-added' : 'btn-outline'}`}
                    style={{ flex: '1', padding: '0.55rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    disabled={product.stock <= 0}
                    title="Add to Cart"
                  >
                    {addedProductId === product.id ? (
                      <CheckCircle size={16} />
                    ) : (
                      <ShoppingCart size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                      <span style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>රු {order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.8rem', display: 'block' }}>PAYMENT METHOD</span>
                      <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                        {order.paymentMethod === 'cod' ? (order.shippingDetails.address.includes('Store Pickup') ? 'Pay on Pickup' : 'Cash on Delivery') :
                         order.paymentMethod === 'koko' ? 'Koko BNPL' : 'Card Payment'}
                      </span>
                      <span style={{ fontSize: '0.75rem', marginLeft: '8px', verticalAlign: 'middle' }} className={`badge ${order.paymentStatus === 'Paid' ? 'badge-success' : 'badge-pending'}`}>
                        {order.paymentStatus}
                      </span>
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
                          <span>රු {(item.price * item.quantity).toFixed(2)}</span>
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
