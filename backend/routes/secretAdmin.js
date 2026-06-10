const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { SystemConfig } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_kdn_jwt_token_key_12345';
const SECRET_ADMIN_EMAIL = process.env.SECRET_ADMIN_EMAIL || 'secretadmin@kdnsport.com';

// Middleware to verify secret admin token
const verifySecretAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Secret Admin authorization token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'secret_admin' || decoded.email !== SECRET_ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden: Invalid secret admin credentials.' });
    }
    req.secretAdmin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired secret admin session.' });
  }
};

// GET /api/secret/status - Check if site is currently shut down (Public)
router.get('/status', (req, res) => {
  try {
    const config = SystemConfig.get();
    res.json({ isShutdown: config.isShutdown });
  } catch (err) {
    res.status(500).json({ isShutdown: false });
  }
});

// POST /api/secret/request-otp - Send OTP to secret admin email
router.post('/request-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  if (email.toLowerCase() !== SECRET_ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ message: 'Access Denied: Email is not whitelisted as a Secret Admin.' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 5); // 5 minute expiry

  // Store in SystemConfig
  SystemConfig.set({
    secretAdminOtp: otp,
    otpExpiry: expiry.toISOString()
  });

  console.log('\n==================================================');
  console.log('🔒 [SECRET ADMIN OTP GENERATED]');
  console.log(`Email: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log(`Expires: ${expiry.toLocaleTimeString()}`);
  console.log('==================================================\n');

  let emailSent = false;

  // Try sending via SMTP if config exists
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"KDN Sport Complex Control" <${process.env.SMTP_USER}>`,
        to: email,
        subject: '🔒 KDN Sport Complex - Secret Admin Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #333; border-radius: 8px; background-color: #121212; color: #fff;">
            <h2 style="color: #F08119; text-align: center; border-bottom: 2px solid #F08119; padding-bottom: 10px;">Security Access Verification</h2>
            <p>A request was made to access the <strong>KDN Sport Complex Master Shutdown Panel</strong> using your whitelisted email.</p>
            <p>Use the following verification code to log in. This code is valid for 5 minutes.</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 15px; border-radius: 4px; background-color: #1e1e1e; border: 1px dashed #F08119; color: #F08119;">
              ${otp}
            </div>
            <p style="color: #ff4444; font-size: 12px; text-align: center;">If you did not request this code, please secure your email account immediately.</p>
          </div>
        `
      });
      emailSent = true;
    } catch (err) {
      console.error('SMTP Mail send failed. Falling back to local console print only.', err.message);
    }
  }

  res.json({
    success: true,
    message: emailSent 
      ? 'A verification code has been dispatched to your Gmail address.'
      : 'Verification code generated. Since SMTP is not configured, the code was logged to your backend server console for local testing.'
  });
});

// POST /api/secret/verify-otp - Validate code and login
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP code are required.' });
  }

  try {
    const config = SystemConfig.get();

    if (email.toLowerCase() !== SECRET_ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ message: 'Access Denied.' });
    }

    if (!config.secretAdminOtp || config.secretAdminOtp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code.' });
    }

    const expiryTime = new Date(config.otpExpiry);
    if (new Date() > expiryTime) {
      return res.status(400).json({ message: 'Verification code has expired.' });
    }

    // Success: Clear OTP credentials
    SystemConfig.set({
      secretAdminOtp: null,
      otpExpiry: null
    });

    // Create Secret Admin Access Token
    const token = jwt.sign(
      { role: 'secret_admin', email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      success: true,
      token,
      message: 'Master authentication successful.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error checking OTP', error: err.message });
  }
});

// POST /api/secret/toggle-shutdown - Turn site on/off (Requires Secret Admin Token)
router.post('/toggle-shutdown', verifySecretAdminToken, (req, res) => {
  const { shutdown } = req.body;

  if (shutdown === undefined) {
    return res.status(400).json({ message: 'Shutdown state parameter is required (true/false).' });
  }

  try {
    const currentConfig = SystemConfig.get();
    const isOffline = shutdown === true;

    SystemConfig.set({
      isShutdown: isOffline
    });

    console.log(`\n==================================================`);
    console.log(`🚨 [SITE STATUS SHIFT]`);
    console.log(`State: ${isOffline ? 'OFFLINE (SHUT DOWN)' : 'ONLINE (OPERATIONAL)'}`);
    console.log(`Action By: Secret Admin (${req.secretAdmin.email})`);
    console.log(`==================================================\n`);

    res.json({
      success: true,
      isShutdown: isOffline,
      message: isOffline 
        ? 'Website has been successfully SHUT DOWN. All public and normal admin interfaces are now offline.' 
        : 'Website has been successfully restored. All services are back online.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating site shutdown state.', error: err.message });
  }
});

module.exports = router;
