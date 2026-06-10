import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Calendar, Activity, ShoppingBag, ArrowRight, CheckCircle } from 'lucide-react';

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #0f0f12 0%, #1c1c22 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '7rem 0 6rem 0',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240, 129, 25, 0.08) 0%, rgba(0,0,0,0) 70%)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240, 129, 25, 0.05) 0%, rgba(0,0,0,0) 70%)',
          zIndex: 1
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <span style={{
            color: 'var(--primary)',
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            display: 'inline-block',
            marginBottom: '1rem',
            border: '1px solid rgba(240, 129, 25, 0.3)',
            padding: '0.35rem 1rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(240, 129, 25, 0.05)'
          }}>
            Welcome to KDN Sport Complex
          </span>
          <h1 style={{
            fontFamily: 'Outfit',
            fontSize: '4rem',
            fontWeight: 800,
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
            maxWidth: '900px',
            margin: '0 auto 1.5rem auto'
          }}>
            UNLEASH YOUR ATHLETIC <span style={{ color: 'var(--primary)' }}>POTENTIAL</span>
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            maxWidth: '650px',
            margin: '0 auto 2.5rem auto',
            lineHeight: '1.6'
          }}>
            Experience Colombo's premium sports hub. Access our state-of-the-art gym, book tournament-grade badminton courts, purchase elite supplements, and consult expert physical therapists.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Link to="/badminton" className="btn btn-primary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Book Badminton Court
              <ArrowRight size={18} />
            </Link>
            <Link to="/gym" className="btn btn-secondary" style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
              Join Gym Membership
            </Link>
          </div>
        </div>
      </section>

      {/* Facilities Cards */}
      <section className="section" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2.2rem', marginBottom: '1rem' }}>
              OUR PREMIUM <span style={{ color: 'var(--primary)' }}>DEPARTMENTS</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
              Select any of our core units below to book sessions, register memberships, or shop athletic supplies.
            </p>
          </div>

          <div className="grid-2">
            {/* Gym */}
            <div className="card card-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
              <div>
                <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(240, 129, 25, 0.1)', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                  <Dumbbell size={24} />
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', marginBottom: '0.75rem' }}>KDN Elite Gym</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Modern cardiovascular equipment, extensive free-weight zones, expert strength coaches, and tailored training plans. Join today with direct payment logging.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>Free professional body fat analysis</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>Personal training & customized nutrition plans</span>
                  </div>
                </div>
              </div>
              <Link to="/gym" className="btn btn-outline" style={{ width: '100%' }}>
                View Memberships
              </Link>
            </div>

            {/* Badminton */}
            <div className="card card-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
              <div>
                <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(240, 129, 25, 0.1)', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                  <Calendar size={24} />
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Badminton Arena</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Three premium non-slip synthetic courts matching BWF specifications. Perfect for recreational doubles, advanced play, or friendly leagues.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>Double-cushion underlay to protect joints</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>Vibrant anti-glare LED overhead court lighting</span>
                  </div>
                </div>
              </div>
              <Link to="/badminton" className="btn btn-outline" style={{ width: '100%' }}>
                Book Court Slot
              </Link>
            </div>

            {/* Physiotherapy */}
            <div className="card card-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
              <div>
                <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(240, 129, 25, 0.1)', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                  <Activity size={24} />
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Physiotherapy Center</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Injury diagnosis, rehabilitation therapy, post-surgical care, and sports massage. Get back to peak fitness under the supervision of licensed physiotherapists.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>Personalized injury recovery regimens</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>Electrotherapy & deep tissue trigger sessions</span>
                  </div>
                </div>
              </div>
              <Link to="/physio" className="btn btn-outline" style={{ width: '100%' }}>
                Schedule Consultation
              </Link>
            </div>

            {/* Shop */}
            <div className="card card-accent" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
              <div>
                <div style={{ display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(240, 129, 25, 0.1)', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                  <ShoppingBag size={24} />
                </div>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Nutrition Store</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                  Fully stocked supplement and health shop. High-quality protein powders, energetic pre-workouts, pure creatine, joint aids, and performance vitamins.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>100% genuine imported global supplements</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#fff' }}>
                    <CheckCircle size={14} style={{ color: 'var(--primary)' }} />
                    <span>Fast checkout and checkout order tracking</span>
                  </div>
                </div>
              </div>
              <Link to="/shop" className="btn btn-outline" style={{ width: '100%' }}>
                Browse Supplements
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Info Stats Banner */}
      <section style={{ backgroundColor: '#141416', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '4rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem', textAlign: 'center' }}>
          <div>
            <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontFamily: 'Outfit', fontWeight: 800 }}>1,200+</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Active Gym Members</p>
          </div>
          <div>
            <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontFamily: 'Outfit', fontWeight: 800 }}>3</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>International-grade Courts</p>
          </div>
          <div>
            <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontFamily: 'Outfit', fontWeight: 800 }}>50+</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Supplements Cataloged</p>
          </div>
          <div>
            <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', fontFamily: 'Outfit', fontWeight: 800 }}>4</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>Resident Doctors & Physios</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
