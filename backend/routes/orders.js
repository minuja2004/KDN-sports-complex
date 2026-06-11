const express = require('express');
const router = express.Router();
const { Orders, Products } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// GET /api/orders/my-orders - Get logged-in user's orders
router.get('/my-orders', verifyToken, async (req, res) => {
  try {
    const userOrders = await Orders.find({ userId: req.user.id });
    res.json(userOrders);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving your orders', error: err.message });
  }
});

// GET /api/orders/all - Admin: view all store orders
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const list = await Orders.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving orders list', error: err.message });
  }
});

// POST /api/orders - Checkout a cart (requires login)
router.post('/', verifyToken, async (req, res) => {
  const { items, shippingDetails, totalAmount, paymentMethod } = req.body;

  if (!items || !items.length || !shippingDetails || !totalAmount) {
    return res.status(400).json({ message: 'Missing order details (items, shipping address, and total amount).' });
  }

  try {
    const processedItems = [];
    
    // First pass: validate stock for all items
    for (const item of items) {
      const actualProductId = item.productId || (item.id && item.id.includes('-') ? item.id.split('-')[0] : item.id);
      const product = await Products.findById(actualProductId);
      if (!product) {
        return res.status(404).json({ message: `Product "${item.name}" not found.` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for "${product.name}". Only ${product.stock} units left.` });
      }
      processedItems.push({
        id: product.id,
        name: item.name || product.name,
        price: item.price !== undefined ? parseFloat(item.price) : product.price,
        quantity: item.quantity,
        image: item.image || product.image,
        selectedOption: item.selectedOption || null
      });
    }

    // Second pass: deduct stock
    for (const item of items) {
      const actualProductId = item.productId || (item.id && item.id.includes('-') ? item.id.split('-')[0] : item.id);
      const product = await Products.findById(actualProductId);
      if (product) {
        await Products.findByIdAndUpdate(actualProductId, {
          stock: product.stock - item.quantity
        });
      }
    }

    // Create order record
    const newOrder = await Orders.create({
      userId: req.user.id,
      userName: req.user.username,
      userEmail: req.user.email,
      items: processedItems,
      shippingDetails,
      totalAmount: parseFloat(totalAmount),
      paymentMethod: paymentMethod || 'card',
      paymentStatus: (paymentMethod === 'cod') ? 'Pending' : 'Paid',
      orderStatus: 'Pending'
    });

    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: 'Error processing order checkout', error: err.message });
  }
});

// PUT /api/orders/:id/status - Admin: update order shipping/fulfillment status
router.put('/:id/status', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  try {
    const order = await Orders.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updated = await Orders.findByIdAndUpdate(id, {
      orderStatus: orderStatus || order.orderStatus,
      paymentStatus: paymentStatus || order.paymentStatus
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating order status', error: err.message });
  }
});

// DELETE /api/orders/:id - Admin: Cancel and delete order
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Orders.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    await Orders.deleteOne({ id });
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting order', error: err.message });
  }
});

module.exports = router;
