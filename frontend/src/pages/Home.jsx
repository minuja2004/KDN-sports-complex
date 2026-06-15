import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dumbbell, Calendar, Activity, ShoppingBag, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

const Counter = ({ target, suffix = '', duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let startTime = null;
    const targetValue = parseInt(target, 10);
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTime = null;
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / duration, 1);
            
            // Quadratic ease-out easing function
            const easeOutQuad = percentage * (2 - percentage);
            setCount(Math.floor(easeOutQuad * targetValue));

            if (percentage < 1) {
              animationFrameId = requestAnimationFrame(animate);
            } else {
              setCount(targetValue);
            }
          };
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Reset count to 0 when component scrolls out of viewport
          setCount(0);
          if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
      observer.disconnect();
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target, duration]);

  return (
    <span ref={elementRef}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [flyers, setFlyers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const autoPlayRef = useRef();

  useEffect(() => {
    // Fetch active promotional flyers
    api.flyers.getAll()
      .then(data => setFlyers(data))
      .catch(err => console.error('Failed to load flyers:', err));

    // Fetch active products
    api.products.getAll()
      .then(data => {
        setProducts(data);
        setProductsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load products:', err);
        setProductsLoading(false);
      });
  }, []);

  const defaultSlides = [
    {
      id: 'default-1',
      title: "UNLEASH YOUR ATHLETIC POTENTIAL",
      subtitle: "KDN SPORT COMPLEX",
      description: "Experience Colombo's premium sports hub. Access our state-of-the-art gym, book tournament-grade badminton courts, and consult expert physical therapists.",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1600&auto=format&fit=crop&q=80",
      link: "/gym",
      btnText: "Join Gym Membership"
    },
    {
      id: 'default-2',
      title: "TOURNAMENT-GRADE BADMINTON ARENA",
      subtitle: "BWF SPECIFICATIONS",
      description: "Book BWF-standard double-cushioned courts featuring synthetic anti-slip flooring and anti-glare LED lighting.",
      image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1600&auto=format&fit=crop&q=80",
      link: "/badminton",
      btnText: "Book Court Slot"
    },
    {
      id: 'default-3',
      title: "PREMIUM NUTRITION & SUPPLEMENTS",
      subtitle: "100% AUTHENTIC STORE",
      description: "Shop premium whey isolate proteins, pre-workouts, creatine, and post-workout recovery matrices.",
      image: "https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=1600&auto=format&fit=crop&q=80",
      link: "/shop",
      btnText: "Shop Supplements"
    }
  ];

  const activeSlides = flyers.length > 0 ? flyers : defaultSlides;

  const nextSlide = () => {
    setCurrentSlide(prev => (prev === activeSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  // Setup auto-play interval callback pointer
  useEffect(() => {
    autoPlayRef.current = nextSlide;
  });

  useEffect(() => {
    if (activeSlides.length <= 1 || isHovering) return;
    
    const play = () => {
      autoPlayRef.current();
    };

    const interval = setInterval(play, 5000);
    return () => clearInterval(interval);
  }, [activeSlides, isHovering]);

  return (
    <div className="animate-fade-in">
      {/* Hero Flyer Advertisement Carousel */}
      <section 
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: 'relative',
          width: '100%',
          height: '520px',
          overflow: 'hidden',
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid var(--border)'
        }}
      >
        {activeSlides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div 
              key={slide.id}
              onClick={() => slide.link && navigate(slide.link)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                pointerEvents: isActive ? 'auto' : 'none',
                cursor: slide.link ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {/* Background Slide Image */}
              <img 
                src={slide.image} 
                alt={slide.title} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  zIndex: 1,
                  transform: isActive ? 'scale(1)' : 'scale(1.05)',
                  transition: 'transform 6s ease-out'
                }}
              />

              {/* HSL Premium Dark Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(to right, rgba(10, 10, 12, 0.95) 0%, rgba(10, 10, 12, 0.65) 45%, rgba(10, 10, 12, 0.3) 100%)',
                zIndex: 2
              }} />

              {/* Content Box */}
              <div className="container" style={{ position: 'relative', zIndex: 3, padding: '0 2rem' }}>
                <div style={{
                  maxWidth: '650px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  transform: isActive ? 'translateY(0)' : 'translateY(25px)',
                  transition: 'transform 0.6s ease-out 0.2s'
                }}>
                  <span style={{
                    alignSelf: 'flex-start',
                    color: 'var(--primary)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    display: 'inline-block',
                    border: '1px solid rgba(240, 129, 25, 0.3)',
                    padding: '0.35rem 1rem',
                    borderRadius: '9999px',
                    backgroundColor: 'rgba(240, 129, 25, 0.05)'
                  }}>
                    {slide.subtitle || "KDN COMPLEX PROMOTION"}
                  </span>
                  
                  <h1 style={{
                    fontFamily: 'Outfit',
                    fontSize: '3.5rem',
                    fontWeight: 800,
                    lineHeight: '1.15',
                    letterSpacing: '-0.02em',
                    color: '#fff',
                    margin: 0
                  }}>
                    {slide.title}
                  </h1>

                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    margin: 0,
                    maxWidth: '550px'
                  }}>
                    {slide.description || "Experience exclusive events, member perks, and targeted fitness packages designed to unlock your potential."}
                  </p>

                  {slide.link && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className="btn btn-primary" style={{ padding: '0.8rem 1.75rem', fontSize: '0.95rem' }}>
                        {slide.btnText || "Claim Offer Now"}
                        <ArrowRight size={16} style={{ marginLeft: '0.4rem' }} />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Navigation Arrows */}
        {activeSlides.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              style={{
                position: 'absolute',
                left: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.3s ease, background-color 0.2s, transform 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.5)'}
            >
              <ChevronLeft size={22} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              style={{
                position: 'absolute',
                right: '2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: isHovering ? 1 : 0,
                transition: 'opacity 0.3s ease, background-color 0.2s, transform 0.2s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0,0,0,0.5)'}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Indicators */}
        {activeSlides.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.6rem',
            zIndex: 10
          }}>
            {activeSlides.map((_, index) => (
              <button 
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentSlide(index); }}
                style={{
                  width: index === currentSlide ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  border: 'none',
                  backgroundColor: index === currentSlide ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'width 0.3s ease, background-color 0.3s'
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured Products Section */}
      <section className="section" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', marginBottom: '1rem' }}>
              OUR PREMIUM <span style={{ color: 'var(--primary)' }}>PRODUCTS</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Explore our selection of top-quality sports nutrition, supplements, and wellness items.
            </p>
          </div>

          {productsLoading ? (
            <div className="text-center" style={{ padding: '3rem 0' }}>
              <p className="text-muted">Loading featured supplements...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="card text-center" style={{ padding: '3rem', backgroundColor: '#141416' }}>
              <p className="text-muted">No products available in the store yet.</p>
            </div>
          ) : (
            <div className="grid-3" style={{ gap: '2rem' }}>
              {products.slice(0, 3).map(product => (
                <div 
                  key={product.id} 
                  className="card card-accent" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    backgroundColor: '#141416', 
                    cursor: 'pointer', 
                    transition: 'transform 0.2s, box-shadow 0.2s' 
                  }}
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

                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{product.name}</h3>
                    <p className="text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.5', marginBottom: '1.5rem', minHeight: '50px' }}>
                      {product.description}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                        {product.isMultipleOption && product.selections && product.selections.length > 0
                          ? `From රු ${Math.min(...product.selections.map(s => s.price)).toFixed(2)}`
                          : `රු ${product.price.toFixed(2)}`}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: product.stock > 0 ? 'var(--success)' : 'var(--error)' }}>
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    {product.allowKoko && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '0.8rem', 
                        color: '#a0aec0', 
                        marginTop: '-0.5rem', 
                        marginBottom: '1rem' 
                      }}>
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
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/shop/product/${product.id}`);
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem' }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link to="/shop" className="btn btn-outline" style={{ padding: '0.75rem 2rem', fontSize: '0.9rem' }}>
              View Full Store Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Info Stats Banner */}
      <section style={{ backgroundColor: '#141416', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '5rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
            <h2 style={{ color: 'var(--primary)', fontSize: '4.5rem', fontFamily: 'Montserrat, var(--font-display)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              <Counter target="1200" suffix="+" />
            </h2>
            <p style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem', lineHeight: 1.5, maxWidth: '160px', opacity: 0.9 }}>
              Active Gym Members
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
            <h2 style={{ color: 'var(--primary)', fontSize: '4.5rem', fontFamily: 'Montserrat, var(--font-display)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              <Counter target="3" />
            </h2>
            <p style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem', lineHeight: 1.5, maxWidth: '160px', opacity: 0.9 }}>
              International Grade Courts
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
            <h2 style={{ color: 'var(--primary)', fontSize: '4.5rem', fontFamily: 'Montserrat, var(--font-display)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              <Counter target="50" suffix="+" />
            </h2>
            <p style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem', lineHeight: 1.5, maxWidth: '160px', opacity: 0.9 }}>
              Supplements Cataloged
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '200px' }}>
            <h2 style={{ color: 'var(--primary)', fontSize: '4.5rem', fontFamily: 'Montserrat, var(--font-display)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              <Counter target="4" />
            </h2>
            <p style={{ color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: '0.5rem', lineHeight: 1.5, maxWidth: '160px', opacity: 0.9 }}>
              Resident Doctors & Physios
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
