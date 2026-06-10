const express = require('express');
const router = express.Router();
const { Products } = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

// GET /api/products - Get all supplements catalog
router.get('/', async (req, res) => {
  try {
    const list = await Products.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving products', error: err.message });
  }
});

// GET /api/products/:id - Get specific product details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving product', error: err.message });
  }
});

// POST /api/products - Admin: Create new product listing
router.post('/', verifyAdmin, async (req, res) => {
  const { name, description, price, image, category, stock, allowKoko } = req.body;

  if (!name || !price || !category || stock === undefined) {
    return res.status(400).json({ message: 'Name, price, category, and stock are required' });
  }

  try {
    let imageUrl = image || 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&auto=format&fit=crop&q=60';

    // Intercept base64 and upload to Cloudinary if configured
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      if (cloudinary.isConfigured) {
        const uploadedUrl = await cloudinary.uploadImage(imageUrl);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
    }

    const newProduct = await Products.create({
      name,
      description: description || '',
      price: parseFloat(price),
      image: imageUrl,
      category,
      stock: parseInt(stock),
      rating: 5.0,
      allowKoko: allowKoko === true || allowKoko === 'true'
    });

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

// PUT /api/products/:id - Admin: Edit product details
router.put('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, category, stock, allowKoko } = req.body;

  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let imageUrl = image;

    // Intercept base64 and upload to Cloudinary if configured
    if (imageUrl && imageUrl.startsWith('data:image/')) {
      if (cloudinary.isConfigured) {
        const uploadedUrl = await cloudinary.uploadImage(imageUrl);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
    }

    const updated = await Products.findByIdAndUpdate(id, {
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      image: imageUrl || product.image,
      category: category || product.category,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      allowKoko: allowKoko !== undefined ? (allowKoko === true || allowKoko === 'true') : product.allowKoko
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// DELETE /api/products/:id - Admin: Delete product listing
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Products.deleteOne({ id });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

module.exports = router;
