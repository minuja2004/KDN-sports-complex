import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Phone, MapPin, Mail, ShieldAlert } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#0e0e10', borderTop: '1px solid #27272a', padding: '4rem 0 2rem 0', color: '#a1a1aa' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.4rem', fontFamily: 'Outfit', fontWeight: 800, marginBottom: '1rem' }}>
              KDN<span style={{ color: '#F08119' }}>SPORT</span> COMPLEX
            </h3>
            <p style={{ maxWidth: '400px', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              A world-class athletic complex housing a premium gym facility, high-standard badminton courts, nutritional supplement storefront, and expert sports physiotherapy center.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} style={{ color: '#F08119' }} />
                <span>+94 11 234 5678</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} style={{ color: '#F08119' }} />
                <span>contact@kdnsport.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} style={{ color: '#F08119' }} />
                <span>120 Sport Complex Road, Colombo, Sri Lanka</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.2rem' }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><Link to="/" style={{ hover: { color: '#fff' } }}>Home Overview</Link></li>
              <li><Link to="/gym">Gym Memberships</Link></li>
              <li><Link to="/badminton">Badminton Booking</Link></li>
              <li><Link to="/physio">Physiotherapy Care</Link></li>
              <li><Link to="/shop">Supplement Shop</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#fff', fontSize: '1rem', fontFamily: 'Outfit', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.2rem' }}>
              Opening Hours
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li><strong style={{ color: '#fff' }}>Weekdays:</strong> 5:00 AM - 11:00 PM</li>
              <li><strong style={{ color: '#fff' }}>Saturdays:</strong> 6:00 AM - 10:00 PM</li>
              <li><strong style={{ color: '#fff' }}>Sundays:</strong> 6:00 AM - 8:00 PM</li>
              <li><strong style={{ color: '#fff' }}>Physio Clinic:</strong> 8:00 AM - 6:00 PM Daily</li>
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1f1f23', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
          <p>© {new Date().getFullYear()} KDN Sport Complex. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/secret-gatekeeper" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#27272a', transition: 'color 0.2s' }} title="Secret Gateway Lock">
              <Lock size={12} />
              <span>Gatekeeper Control</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
