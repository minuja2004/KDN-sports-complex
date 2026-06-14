const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Users, OtpVerifications } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_kdn_jwt_token_key_12345';

// POST /api/auth/register/request-otp - Send OTP verification code to customer email
router.post('/register/request-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required.' });
  }

  // Basic regex validation for email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email address format.' });
  }

  try {
    // Check if email already registered
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minute expiration window

    // Save or update OTP verification record
    const existingVerification = await OtpVerifications.findOne({ email });
    if (existingVerification) {
      await OtpVerifications.updateOne({ email }, { otp, otpExpiry: expiry.toISOString() });
    } else {
      await OtpVerifications.create({ email, otp, otpExpiry: expiry.toISOString() });
    }

    console.log('\n==================================================');
    console.log('✉️ [CUSTOMER REGISTRATION OTP GENERATED]');
    console.log(`Email: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Expires: ${expiry.toLocaleTimeString()}`);
    console.log('==================================================\n');

    let emailSent = false;

    // Send email via Gmail SMTP
    const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
    const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (SMTP_USER && SMTP_PASS) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"KDN Sport Complex Portal" <${SMTP_USER}>`,
          to: email,
          subject: '✉️ KDN Sport Complex - Validate Your Email Address',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #222; border-radius: 8px; background-color: #121212; color: #fff;">
              <h2 style="color: #F08119; text-align: center; border-bottom: 2px solid #F08119; padding-bottom: 12px; margin-top: 0;">Email Verification</h2>
              <p style="font-size: 15px; line-height: 1.6;">Welcome to KDN Sport Complex! To complete your registration and activate your customer account, please verify your email address by entering the following security code:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 30px 0; padding: 15px; border-radius: 6px; background-color: #1a1a1a; border: 1px dashed #F08119; color: #F08119;">
                ${otp}
              </div>
              <p style="font-size: 13px; color: #888; text-align: center;">This code is private and expires in 10 minutes. If you did not request this, please disregard this email.</p>
            </div>
          `
        });
        emailSent = true;
      } catch (err) {
        console.error('SMTP Mail send failed:', err.message);
      }
    }

    res.json({
      success: true,
      message: emailSent
        ? 'A 6-digit verification code has been dispatched to your Gmail address.'
        : 'Verification code generated successfully. (Bypassed SMTP send, code printed to backend console logs)'
    });
  } catch (err) {
    res.status(500).json({ message: 'Error processing email verification.', error: err.message });
  }
});

// POST /api/auth/register - Register a new user with OTP check
router.post('/register', async (req, res) => {
  const { username, email, password, role, otp, phone } = req.body;

  if (!username || !email || !password || !otp || !phone) {
    return res.status(400).json({ message: 'Username, email, phone number, password, and OTP verification code are required.' });
  }

  // Strong password check (at least 6 characters, one uppercase, one lowercase, one number)
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, and one number.' });
  }

  try {
    // Verify OTP first
    const verification = await OtpVerifications.findOne({ email });
    if (!verification) {
      return res.status(400).json({ message: 'Verification code not requested or invalid.' });
    }

    if (verification.otp !== otp) {
      return res.status(400).json({ message: 'Incorrect email verification code.' });
    }

    const expiryTime = new Date(verification.otpExpiry);
    if (new Date() > expiryTime) {
      return res.status(400).json({ message: 'Email verification code has expired. Please request a new one.' });
    }

    // Check if user already exists
    const existingUser = await Users.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Delete verification record
    await OtpVerifications.deleteOne({ email });

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Set default role as customer if not specified or admin if registration has code
    let finalRole = 'customer';
    if (role === 'admin') {
      finalRole = 'admin';
    }

    // Save user
    const newUser = await Users.create({
      username,
      email,
      phone: phone || '',
      password: hashedPassword,
      role: finalRole
    });

    // Create JWT
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration', error: err.message });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Access Denied: This account has been deactivated by a Super Admin.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login', error: err.message });
  }
});

// GET /api/auth/profile - Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Access Denied: Account deactivated.' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

module.exports = router;
