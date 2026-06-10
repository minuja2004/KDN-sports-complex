const express = require('express');
const router = express.Router();
const { GymMembers } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// GET /api/gym/member - Get active gym membership details for logged-in user
router.get('/member', verifyToken, async (req, res) => {
  try {
    const member = await GymMembers.findOne({ userId: req.user.id });
    if (!member) {
      return res.status(404).json({ message: 'No gym membership found for this user.' });
    }
    res.json(member);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving gym profile', error: err.message });
  }
});

// GET /api/gym/all - Admin: view all registered gym members
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const list = await GymMembers.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving gym members list', error: err.message });
  }
});

// POST /api/gym/register - Register gym membership
router.post('/register', verifyToken, async (req, res) => {
  const { tier, price, paymentStatus } = req.body;

  if (!tier || !price) {
    return res.status(400).json({ message: 'Tier and price are required' });
  }

  try {
    // Check if user already has gym membership
    const existing = await GymMembers.findOne({ userId: req.user.id });
    
    const startDate = new Date();
    const endDate = new Date();
    
    if (tier.toLowerCase() === 'monthly') {
      endDate.setMonth(startDate.getMonth() + 1);
    } else if (tier.toLowerCase() === 'quarterly') {
      endDate.setMonth(startDate.getMonth() + 3);
    } else if (tier.toLowerCase() === 'annual') {
      endDate.setFullYear(startDate.getFullYear() + 1);
    } else {
      endDate.setMonth(startDate.getMonth() + 1); // default 1 month
    }

    const membershipData = {
      userId: req.user.id,
      userName: req.user.username,
      userEmail: req.user.email,
      tier,
      price: parseFloat(price),
      paymentStatus: paymentStatus || 'Paid', // default paid for demo checkout
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'Active'
    };

    let result;
    if (existing) {
      // Renew or update existing membership
      result = await GymMembers.findByIdAndUpdate(existing.id, membershipData);
    } else {
      // Create new membership
      result = await GymMembers.create(membershipData);
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error registering gym membership', error: err.message });
  }
});

// PUT /api/gym/member/:id/status - Admin: update payment/status/details
router.put('/member/:id/status', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, status, tier, price, startDate, endDate } = req.body;
  
  try {
    const member = await GymMembers.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Gym member not found' });
    }

    const updated = await GymMembers.findByIdAndUpdate(id, {
      paymentStatus: paymentStatus || member.paymentStatus,
      status: status || member.status,
      tier: tier || member.tier,
      price: price !== undefined ? parseFloat(price) : member.price,
      startDate: startDate || member.startDate,
      endDate: endDate || member.endDate
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating membership details', error: err.message });
  }
});

// DELETE /api/gym/member/:id - Admin: Delete gym member registration
router.delete('/member/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const member = await GymMembers.findById(id);
    if (!member) {
      return res.status(404).json({ message: 'Gym member not found' });
    }
    
    await GymMembers.deleteOne({ id });
    res.json({ message: 'Gym member deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting gym member', error: err.message });
  }
});

module.exports = router;
