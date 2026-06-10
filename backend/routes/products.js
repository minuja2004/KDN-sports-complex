const express = require('express');
const router = express.Router();
const { Products } = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');

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
  const { name, description, price, image, category, stock } = req.body;

  if (!name || !price || !category || stock === undefined) {
    return res.status(400).json({ message: 'Name, price, category, and stock are required' });
  }

  try {
    const newProduct = await Products.create({
      name,
      description: description || '',
      price: parseFloat(price),
      image: image || 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&auto=format&fit=crop&q=60',
      category,
      stock: parseInt(stock),
      rating: 5.0
    });

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
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
