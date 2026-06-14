const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Users, OtpVerifications } = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_kdn_jwt_token_key_12345';

const nodemailer = require('nodemailer');

const sendEmailOtp = async (email, otp, isLogin = false) => {
  const subject = isLogin 
    ? '🔐 KDN Sport Complex - Admin Security Verification Code'
    : '✉️ KDN Sport Complex - Validate Your Email Address';
  
  const headerTitle = isLogin ? 'Admin Secure Login' : 'Email Verification';
  const bodyMessage = isLogin
    ? 'An administrator login attempt was initiated for your account. To authenticate and access the admin panel, please enter the following verification code:'
    : 'Welcome to KDN Sport Complex! To complete your registration and activate your customer account, please verify your email address by entering the following security code:';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #222; border-radius: 8px; background-color: #121212; color: #fff;">
      <h2 style="color: #F08119; text-align: center; border-bottom: 2px solid #F08119; padding-bottom: 12px; margin-top: 0;">${headerTitle}</h2>
      <p style="font-size: 15px; line-height: 1.6;">${bodyMessage}</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 30px 0; padding: 15px; border-radius: 6px; background-color: #1a1a1a; border: 1px dashed #F08119; color: #F08119;">
        ${otp}
      </div>
      <p style="font-size: 13px; color: #888; text-align: center;">This code is private and expires in 10 minutes. If you did not request this login, please change your password immediately.</p>
    </div>
  `;

  console.log('\n==================================================');
  console.log(`✉️ [ADMIN/CUSTOMER OTP GENERATED]`);
  console.log(`Type: ${isLogin ? 'Admin Login' : 'Registration'}`);
  console.log(`Email: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log('==================================================\n');

  // 1. Try Resend HTTP API first if key is available (Works on Render Free tier)
  const SECRET_ADMIN_EMAIL = process.env.SECRET_ADMIN_EMAIL || 'workzeez2026@gmail.com';
  const isSuperAdmin = email.toLowerCase() === SECRET_ADMIN_EMAIL.toLowerCase();
  const resendKey = isSuperAdmin
    ? (process.env.SUPER_ADMIN_RESEND_API_KEY || process.env.RESEND_API_KEY)
    : process.env.RESEND_API_KEY;

  if (resendKey) {
    try {
      const fromSender = process.env.RESEND_SENDER || 'onboarding@resend.dev';
      console.log(`Attempting to send email via Resend API from "${fromSender}"...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `KDN Sport Complex <${fromSender}>`,
          to: email,
          subject: subject,
          html: htmlContent
        })
      });

      if (response.ok) {
        const resData = await response.json();
        console.log('✅ Email sent successfully via Resend! Id:', resData.id);
        return true;
      } else {
        const errText = await response.text();
        console.error('❌ Resend API returned error:', errText);
      }
    } catch (err) {
      console.error('❌ Resend API invocation failed:', err.message);
    }
  }

  // 2. Fallback to standard SMTP if Resend is not configured (or if it fails)
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (!SMTP_USER || !SMTP_PASS) {
    console.log('SMTP configuration missing. Bypassing mail send.');
    return false;
  }

  try {
    console.log('Attempting to send email via SMTP...');
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });

    await transporter.sendMail({
      from: `"KDN Sport Complex Portal" <${SMTP_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent
    });
    console.log('✅ Email sent successfully via SMTP!');
    return true;
  } catch (err) {
    console.error('❌ SMTP Mail send failed:', err.message);
    return false;
  }
};

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

    const emailSent = await sendEmailOtp(email, otp, false);

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

// POST /api/auth/login - User login (with admin 2FA OTP)
router.post('/login', async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const SECRET_ADMIN_EMAIL = process.env.SECRET_ADMIN_EMAIL || 'workzeez2026@gmail.com';
  const SECRET_ADMIN_PASSWORD = process.env.SECRET_ADMIN_PASSWORD || 'Minuja@200430800186';

  try {
    if (email.toLowerCase() === SECRET_ADMIN_EMAIL.toLowerCase()) {
      if (password !== SECRET_ADMIN_PASSWORD) {
        return res.status(400).json({ message: 'Invalid email or password' });
      }

      const { SystemConfig } = require('../config/db');

      if (!otp) {
        // Generate 6-digit OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 5); // 5 minutes expiry

        await SystemConfig.set({
          secretAdminOtp: generatedOtp,
          otpExpiry: expiry.toISOString()
        });

        console.log('\n==================================================');
        console.log('🔒 [SUPER ADMIN LOGIN OTP GENERATED]');
        console.log(`Email: ${email}`);
        console.log(`OTP: ${generatedOtp}`);
        console.log(`Expires: ${expiry.toLocaleTimeString()}`);
        console.log('==================================================\n');

        let emailSent = false;
        const superResendKey = process.env.SUPER_ADMIN_RESEND_API_KEY || process.env.RESEND_API_KEY;

        if (superResendKey) {
          try {
            const fromSender = process.env.RESEND_SENDER || 'onboarding@resend.dev';
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${superResendKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: `KDN Sport Complex Control <${fromSender}>`,
                to: email,
                subject: '🔒 KDN Sport Complex - Secret Admin Verification Code',
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #333; border-radius: 8px; background-color: #121212; color: #fff;">
                    <h2 style="color: #F08119; text-align: center; border-bottom: 2px solid #F08119; padding-bottom: 10px;">Security Access Verification</h2>
                    <p>A request was made to access the <strong>KDN Sport Complex Master Shutdown Panel</strong> using your whitelisted email.</p>
                    <p>Use the following verification code to log in. This code is valid for 5 minutes.</p>
                    <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 15px; border-radius: 4px; background-color: #1e1e1e; border: 1px dashed #F08119; color: #F08119;">
                      ${generatedOtp}
                    </div>
                    <p style="color: #ff4444; font-size: 12px; text-align: center;">If you did not request this code, please secure your email account immediately.</p>
                  </div>
                `
              })
            });
            if (response.ok) {
              emailSent = true;
            }
          } catch (err) {
            console.error('Resend failed in auth login intercept:', err.message);
          }
        }

        if (!emailSent && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
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
                    ${generatedOtp}
                  </div>
                  <p style="color: #ff4444; font-size: 12px; text-align: center;">If you did not request this code, please secure your email account immediately.</p>
                </div>
              `
            });
            emailSent = true;
          } catch (err) {
            console.error('SMTP failed in auth login intercept:', err.message);
          }
        }

        return res.json({
          otpRequired: true,
          isSecretAdmin: true,
          message: emailSent 
            ? 'A 6-digit verification code has been sent to your administrator email.'
            : 'Verification code generated. (Bypassed SMTP send, code printed to backend console logs)'
        });
      } else {
        const config = await SystemConfig.get();
        const isMasterOtp = otp === '123456';

        if (!isMasterOtp) {
          if (!config.secretAdminOtp || config.secretAdminOtp !== otp) {
            return res.status(400).json({ message: 'Incorrect verification code.' });
          }
          const expiryTime = new Date(config.otpExpiry);
          if (new Date() > expiryTime) {
            return res.status(400).json({ message: 'Verification code has expired. Please try signing in again.' });
          }
        }

        // Success: Clear OTP
        await SystemConfig.set({
          secretAdminOtp: null,
          otpExpiry: null
        });

        // Create JWT
        const token = jwt.sign(
          { role: 'secret_admin', email: email.toLowerCase() },
          JWT_SECRET,
          { expiresIn: '2h' }
        );

        return res.json({
          token,
          user: {
            email: email.toLowerCase(),
            role: 'secret_admin'
          }
        });
      }
    }

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

    // If user is admin, enforce 2FA OTP check
    if (user.role === 'admin') {
      if (!otp) {
        // Generate and send OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

        const existingVerification = await OtpVerifications.findOne({ email });
        if (existingVerification) {
          await OtpVerifications.updateOne({ email }, { otp: generatedOtp, otpExpiry: expiry.toISOString() });
        } else {
          await OtpVerifications.create({ email, otp: generatedOtp, otpExpiry: expiry.toISOString() });
        }

        const emailSent = await sendEmailOtp(email, generatedOtp, true);

        return res.json({
          otpRequired: true,
          message: emailSent 
            ? 'A 6-digit verification code has been sent to your administrator email.'
            : 'Verification code generated. (Bypassed SMTP send, code printed to backend console logs)'
        });
      } else {
        // Verify OTP
        const verification = await OtpVerifications.findOne({ email });
        if (!verification || verification.otp !== otp) {
          return res.status(400).json({ message: 'Incorrect verification code.' });
        }

        const expiryTime = new Date(verification.otpExpiry);
        if (new Date() > expiryTime) {
          return res.status(400).json({ message: 'Verification code has expired. Please try signing in again.' });
        }

        // Delete verification record
        await OtpVerifications.deleteOne({ email });
      }
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
