require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const shutdownMiddleware = require('./middleware/shutdown');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // Allow all origins for development ease
  credentials: true
}));

// Parsing requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply Site Shutdown Control Middleware globally
app.use(shutdownMiddleware);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/gym', require('./routes/gym'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/physio', require('./routes/physio'));
app.use('/api/secret', require('./routes/secretAdmin'));

// Public healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start Express Server
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 KDN Sport Complex Server running on port ${PORT}`);
  console.log(`Admin Whitelist Email: ${process.env.SECRET_ADMIN_EMAIL || 'secretadmin@kdnsport.com'}`);
  console.log(`Verify site online status at: http://localhost:${PORT}/api/secret/status`);
  console.log('==================================================');
});
