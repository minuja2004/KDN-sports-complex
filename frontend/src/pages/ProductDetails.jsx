import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { ArrowLeft, Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const ProductDetails = ({ user, addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [addedSuccessProductId, setAddedSuccessProductId] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    setActiveImage(null);
    fetchProductDetails();
  }, [id]);

  const displayImage = activeImage || (product ? (product.images && product.images[0]) || product.image : '');

  const fetchProductDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.products.getDetails(id);
      setProduct(data);

      // Fetch all products to construct related suggestions
      try {
        const allProducts = await api.products.getAll();
        const filtered = allProducts.filter(p => p.id !== id);
        const sameCategory = filtered.filter(p => p.category === data.category);
        const otherCategories = filtered.filter(p => p.category !== data.category);
        setSuggestedProducts([...sameCategory, ...otherCategories].slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch suggested products:', err.message);
      }
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

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (!product || !product.images || product.images.length === 0) return;
    const currentIndex = product.images.indexOf(displayImage);
    let newIndex = currentIndex - 1;
    if (newIndex < 0) {
      newIndex = product.images.length - 1;
    }
    setActiveImage(product.images[newIndex]);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (!product || !product.images || product.images.length === 0) return;
    const currentIndex = product.images.indexOf(displayImage);
    let newIndex = currentIndex + 1;
    if (newIndex >= product.images.length) {
      newIndex = 0;
    }
    setActiveImage(product.images[newIndex]);
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
          
          <div className="details-image-container">
            <img
              src={displayImage}
              alt={product.name}
            />
            {product.images && product.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="details-nav-arrow details-nav-arrow-left"
                  onClick={handlePrevImage}
                  title="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  className="details-nav-arrow details-nav-arrow-right"
                  onClick={handleNextImage}
                  title="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails gallery */}
          {product.images && product.images.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginTop: '1.25rem', 
              justifyContent: 'center', 
              position: 'relative', 
              zIndex: 2,
              flexWrap: 'wrap'
            }}>
              {product.images.map((img, idx) => {
                const isActive = img === displayImage;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    onMouseEnter={() => setActiveImage(img)}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                      boxShadow: isActive ? '0 0 10px var(--primary-glow)' : 'none',
                      cursor: 'pointer',
                      padding: 0,
                      backgroundColor: 'transparent',
                      transition: 'transform 0.2s, border-color 0.2s'
                    }}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                );
              })}
            </div>
          )}
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

              <div style={{ display: 'flex', gap: '0.5rem', flexGrow: 1 }}>
                <button
                  type="button"
                  onClick={() => {
                    let success = false;
                    for (let i = 0; i < quantity; i++) {
                      success = addToCart(product);
                      if (!success) break;
                    }
                    if (success) navigate('/cart');
                  }}
                  className="btn btn-primary"
                  style={{ flex: '3', padding: '0.75rem 1.5rem', fontWeight: 'bold' }}
                >
                  Buy Now
                </button>
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className={`btn ${addedSuccess ? 'btn-success-added' : 'btn-outline'}`}
                  style={{ flex: '1', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Add to Cart"
                >
                  {addedSuccess ? (
                    <CheckCircle size={18} />
                  ) : (
                    <ShoppingCart size={18} />
                  )}
                </button>
              </div>
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

      {/* Suggested Products Section */}
      {suggestedProducts.length > 0 && (
        <div style={{ marginTop: '5rem', borderTop: '1px solid var(--border)', paddingTop: '3rem', zIndex: 1, position: 'relative' }}>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginBottom: '2rem', textAlign: 'center', color: '#fff' }}>
            SUGGESTED <span style={{ color: 'var(--primary)' }}>SUPPLEMENTS</span>
          </h2>
          
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            {suggestedProducts.map(p => (
              <div 
                key={p.id} 
                className="card card-accent" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  backgroundColor: '#141416',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => {
                  setQuantity(1); // Reset details page quantity
                  navigate(`/shop/product/${p.id}`);
                }}
              >
                <div>
                  <div className="product-image-wrapper">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="main-image"
                    />
                    {p.images && p.images.length > 1 && (
                      <img
                        src={p.images[1]}
                        alt={p.name}
                        className="hover-image"
                      />
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                    <span className="text-primary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {p.category.replace('-', ' ')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#fbbf24' }}>★ {p.rating.toFixed(1)}</span>
                  </div>

                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#fff' }}>{p.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.5', marginBottom: '1.5rem', minHeight: '40px' }}>
                    {p.description.length > 80 ? p.description.substring(0, 80) + '...' : p.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>රු {p.price.toFixed(2)}</span>
                    <span style={{ fontSize: '0.75rem', color: p.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                      {p.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  {p.allowKoko && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px', 
                      fontSize: '0.75rem', 
                      color: '#a0aec0', 
                      marginTop: '-0.5rem', 
                      marginBottom: '1rem',
                      flexWrap: 'wrap'
                    }}>
                      <span>or 3 X <strong style={{ color: '#fff' }}>රු {(p.price / 3).toFixed(2)}</strong> with</span>
                      <svg viewBox="0 0 135 45" width="48" height="15" style={{ verticalAlign: 'middle', marginLeft: '2px', marginRight: '2px' }}>
                        <defs>
                          <pattern id={`koko-stripes-${p.id}`} width="4" height="4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                            <rect width="4" height="4" fill="#00D2CA" />
                            <line x1="0" y1="0" x2="0" y2="4" stroke="#0D1B50" strokeWidth="1.2" />
                          </pattern>
                        </defs>
                        <text x="2" y="37" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill={`url(#koko-stripes-${p.id})`} stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                        <text x="3" y="36" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill={`url(#koko-stripes-${p.id})`} stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                        <text x="4" y="35" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill={`url(#koko-stripes-${p.id})`} stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                        <text x="5" y="34" fontFamily="'Arial Black', Impact, sans-serif" fontSize="32" fontWeight="900" fill="#FFAEC9" stroke="#0D1B50" strokeWidth="1.5" strokeLinejoin="round">KOKO</text>
                      </svg>
                      <span 
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          backgroundColor: '#2d3748', 
                          color: '#a0aec0', 
                          fontSize: '8px', 
                          fontWeight: 'bold', 
                          cursor: 'help' 
                        }} 
                        title="Split your bill into 3 interest-free installments with Koko"
                      >
                        i
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const success = addToCart(p);
                        if (success) navigate('/cart');
                      }}
                      className="btn btn-primary"
                      style={{ flex: '3', padding: '0.45rem', fontSize: '0.85rem' }}
                      disabled={p.stock <= 0}
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={() => {
                        const success = addToCart(p);
                        if (success) {
                          setAddedSuccessProductId(p.id);
                          setTimeout(() => setAddedSuccessProductId(null), 1500);
                        }
                      }}
                      className={`btn ${addedSuccessProductId === p.id ? 'btn-success-added' : 'btn-outline'}`}
                      style={{ flex: '1', padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={p.stock <= 0}
                      title="Add to Cart"
                    >
                      {addedSuccessProductId === p.id ? (
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
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
