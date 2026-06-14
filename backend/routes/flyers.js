const express = require('express');
const router = express.Router();
const { Flyers } = require('../config/db');
const cloudinary = require('../config/cloudinary');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_kdn_jwt_token_key_12345';
const SECRET_ADMIN_EMAIL = process.env.SECRET_ADMIN_EMAIL || 'workzeez2026@gmail.com';

// Custom middleware to verify the Developer Super Admin token
const verifySecretAdminToken = async (req, res, next) => {
  // If in local development, bypass token verification for ease of use
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Admin authorization token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'secret_admin' && decoded.email === SECRET_ADMIN_EMAIL) {
      req.secretAdmin = decoded;
      return next();
    } else if (decoded.role === 'admin') {
      const { Users } = require('../config/db');
      const user = await Users.findById(decoded.id);
      if (user && user.role === 'admin' && user.isActive !== false) {
        req.secretAdmin = { email: user.email, role: 'admin', id: user.id };
        return next();
      }
    }
    return res.status(403).json({ message: 'Forbidden: Invalid admin credentials.' });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired admin session.' });
  }
};

// GET /api/flyers - Get all promotional flyers (Public)
router.get('/', async (req, res) => {
  try {
    const list = await Flyers.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving flyers', error: err.message });
  }
});

// POST /api/flyers - Create a new flyer (Requires Secret Admin Token)
router.post('/', verifySecretAdminToken, async (req, res) => {
  const { title, image, link } = req.body;

  if (!title || !image) {
    return res.status(400).json({ message: 'Title and flyer image are required.' });
  }

  try {
    let imageUrl = image;

    // Upload to Cloudinary if it is a base64 image and Cloudinary is configured
    if (image.startsWith('data:image/')) {
      if (cloudinary.isConfigured) {
        const uploadedUrl = await cloudinary.uploadImage(image);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
    }

    const newFlyer = await Flyers.create({
      title,
      image: imageUrl,
      link: link || ''
    });

    res.status(201).json(newFlyer);
  } catch (err) {
    res.status(500).json({ message: 'Error creating flyer', error: err.message });
  }
});

// DELETE /api/flyers/:id - Delete a flyer (Requires Secret Admin Token)
router.delete('/:id', verifySecretAdminToken, async (req, res) => {
  const { id } = req.params;

  try {
    const flyer = await Flyers.findById(id);
    if (!flyer) {
      return res.status(404).json({ message: 'Flyer not found.' });
    }

    await Flyers.deleteOne({ id });
    res.json({ message: 'Flyer deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting flyer', error: err.message });
  }
});

module.exports = router;
