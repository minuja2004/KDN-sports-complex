const express = require('express');
const router = express.Router();
const { Bookings } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// GET /api/bookings - Get all bookings, or filter by date
router.get('/', (req, res) => {
  const { date } = query = req.query;
  try {
    const filter = date ? { date } : {};
    const list = Bookings.find(filter);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving bookings', error: err.message });
  }
});

// POST /api/bookings - Book a badminton court slot (requires login)
router.post('/', verifyToken, (req, res) => {
  const { court, date, slot, userName, userEmail } = req.body;

  if (!court || !date || !slot) {
    return res.status(400).json({ message: 'Court, date, and slot are required' });
  }

  try {
    // Check if court slot is already booked for this date
    const isBooked = Bookings.findOne({ court, date, slot });
    if (isBooked) {
      return res.status(400).json({ message: `Court ${court} is already booked for ${slot} on ${date}.` });
    }

    const newBooking = Bookings.create({
      court,
      date,
      slot,
      userId: req.user.id,
      userName: userName || req.user.username,
      userEmail: userEmail || req.user.email,
      paymentStatus: 'Pending', // Default status, user can update on mock checkout
      status: 'Confirmed'
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ message: 'Error creating booking', error: err.message });
  }
});

// PUT /api/bookings/:id/pay - Log mock payment completion
router.put('/:id/pay', verifyToken, (req, res) => {
  const { id } = req.params;
  try {
    const booking = Bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership or admin role
    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = Bookings.findByIdAndUpdate(id, { paymentStatus: 'Paid' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error processing payment', error: err.message });
  }
});

// DELETE /api/bookings/:id - Cancel a booking
router.delete('/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  try {
    const booking = Bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Allow user to cancel their own booking, or admin to cancel any booking
    if (booking.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    Bookings.deleteOne({ id });
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling booking', error: err.message });
  }
});

module.exports = router;
