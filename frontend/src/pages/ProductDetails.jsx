import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { ArrowLeft, Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, AlertTriangle } from 'lucide-react';

const ProductDetails = ({ user, addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.products.getDetails(id);
      setProduct(data);
    } catch (err) {
      console.error('Failed to load product details:', err.message);
      setError('Product not found or failed to load details.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && product && newQty <= product.stock) {
      setQuantity(newQty);
    }
  };

  const handleAddToCartClick = () => {
    if (!product) return;
    
    // Add product to cart with the specified quantity
    let success = false;
    for (let i = 0; i < quantity; i++) {
      success = addToCart(product);
      if (!success) break;
    }

    if (success) {
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="container section text-center" style={{ padding: '6rem 0' }}>
        <p className="text-muted">Loading supplement details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container section text-center animate-fade-in" style={{ padding: '6rem 0' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem', backgroundColor: '#141416' }}>
          <AlertTriangle size={48} style={{ color: 'var(--error)', marginBottom: '1.5rem' }} />
          <h2>Product Not Found</h2>
          <p className="text-muted" style={{ marginBottom: '2rem' }}>The requested supplement item does not exist or has been removed from the storefront.</p>
          <Link to="/shop" className="btn btn-primary">Back to Shop Catalog</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container section animate-fade-in">
      {/* Back button & Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={() => navigate('/shop')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.95rem' }} className="nav-link">
          <ArrowLeft size={16} />
          Back to Shop Catalog
        </button>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <Link to="/shop" style={{ color: 'var(--text-muted)' }}>Shop</Link> &gt; <span style={{ textTransform: 'capitalize' }}>{product.category}</span> &gt; <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{product.name}</span>
        </div>
      </div>

      {/* Main product columns */}
      <div className="grid-2" style={{ gap: '3.5rem', alignItems: 'start' }}>
        {/* Left Column: Premium Glow Image */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '-15px',
            right: '15px',
            bottom: '15px',
            backgroundColor: 'rgba(240, 129, 25, 0.1)',
            filter: 'blur(25px)',
            zIndex: 0,
            borderRadius: '12px'
          }}></div>
          
          <img
            src={product.image}
            alt={product.name}
            style={{
              width: '100%',
              maxHeight: '480px',
              objectFit: 'cover',
              borderRadius: '8px',
              border: '2px solid var(--border-highlight)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              position: 'relative',
              zIndex: 1
            }}
          />
        </div>

        {/* Right Column: Details & Actions */}
        <div className="card" style={{ backgroundColor: '#141416', padding: '2.5rem', border: '1px solid var(--border)' }}>
          {/* Category & Rating */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              {product.category.replace('-', ' ')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24', fontSize: '0.95rem' }}>
              <Star size={16} fill="#fbbf24" />
              <span>{product.rating.toFixed(1)} Ratings</span>
            </div>
          </div>

          {/* Product Title */}
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', marginBottom: '1rem', color: '#fff', lineHeight: '1.2' }}>
            {product.name}
          </h1>

          {/* Price & Stock status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)' }}>
              රු {product.price.toFixed(2)}
            </div>
            <div>
              <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {/* Koko BNPL logic line */}
          {product.allowKoko && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.9rem', 
              color: '#a0aec0', 
              marginTop: '-0.75rem', 
              marginBottom: '1.5rem',
              flexWrap: 'wrap'
            }}>
              <span>or 3 X <strong style={{ color: '#fff' }}>රු {(product.price / 3).toFixed(2)}</strong> with</span>
              <svg viewBox="0 0 135 45" width="55" height="18" style={{ verticalAlign: 'middle', marginLeft: '3px', marginRight: '3px' }}>
                <defs>
                  <pattern id="koko-stripes-details" width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                    <rect width="4" height="4" fill="#00D2CA" />
                    <line x1="0" y1="0" x2="0" y2="4" stroke="#0D1B50" strokeWidth="1.2" />
                  </pattern>
                </defs>
                <text x="2" y="37" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes-details)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                <text x="3" y="36" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes-details)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                <text x="4" y="35" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="url(#koko-stripes-details)" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
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
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.5rem' }}>Product Overview</h3>
            <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
              {product.description || 'No detailed description available for this supplement.'}
            </p>
          </div>

          {/* Quantity selector & Add to cart button */}
          {product.stock > 0 ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '6px', padding: '0.5rem 0.8rem', border: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  onClick={() => handleQuantityChange(-1)} 
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', width: '25px', fontWeight: 'bold' }}
                >-</button>
                <span style={{ fontSize: '1.05rem', width: '30px', textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => handleQuantityChange(1)} 
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', width: '25px', fontWeight: 'bold' }}
                >+</button>
              </div>

              <button
                onClick={handleAddToCartClick}
                className={`btn ${addedSuccess ? 'btn-success-added' : 'btn-primary'}`}
                style={{ flexGrow: 1, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 'bold' }}
              >
                <ShoppingCart size={18} />
                {addedSuccess ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            </div>
          ) : (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', padding: '1rem', borderRadius: '6px', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
              🚫 This product is currently unavailable to order.
            </div>
          )}

          {/* Product trust factors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
              <span>100% Genuine athletic supplements directly imported.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Truck size={18} style={{ color: 'var(--primary)' }} />
              <span>Deliver within 2-3 business days islandwide (Delivery Fee: රු 300.00).</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <RotateCcw size={18} style={{ color: 'var(--primary)' }} />
              <span>Easy refunds if packaging or seal is found damaged.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
