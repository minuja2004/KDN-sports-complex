const express = require('express');
const router = express.Router();
const { Bookings } = require('../config/db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// GET /api/physio - Admin: retrieve all physiotherapy bookings
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const list = await Bookings.find({ type: 'physio' });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving physiotherapy bookings', error: err.message });
  }
});

// GET /api/physio/my - Get current user's physiotherapy bookings
router.get('/my', verifyToken, async (req, res) => {
  try {
    const list = await Bookings.find({ type: 'physio', userId: req.user.id });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving your therapy bookings', error: err.message });
  }
});

// POST /api/physio - Book a physiotherapy session (requires login)
router.post('/', verifyToken, async (req, res) => {
  const { date, timeSlot, therapist, condition, userName, userEmail, userPhone } = req.body;

  if (!date || !timeSlot || !condition) {
    return res.status(400).json({ message: 'Date, time slot, and condition description are required.' });
  }

  try {
    // Check if therapist is already booked for this slot on this date
    if (therapist) {
      const isBooked = await Bookings.findOne({ type: 'physio', date, slot: timeSlot, therapist });
      if (isBooked) {
        return res.status(400).json({ message: `${therapist} is already booked for ${timeSlot} on ${date}.` });
      }
    }

    const newBooking = await Bookings.create({
      type: 'physio', // Demarcates it as a physiotherapy session
      date,
      slot: timeSlot,
      therapist: therapist || 'Any Available Therapist',
      condition,
      userId: req.user.id,
      userName: userName || req.user.username,
      userEmail: userEmail || req.user.email,
      userPhone: userPhone || '',
      paymentStatus: 'Pending',
      status: 'Pending' // Requires admin approval
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ message: 'Error booking physiotherapy session', error: err.message });
  }
});

// PUT /api/physio/:id/status - Admin: approve/complete/cancel therapy booking
router.put('/:id/status', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus, therapist } = req.body;

  try {
    const booking = await Bookings.findById(id);
    if (!booking || booking.type !== 'physio') {
      return res.status(404).json({ message: 'Physiotherapy booking not found.' });
    }

    const updated = await Bookings.findByIdAndUpdate(id, {
      status: status || booking.status,
      paymentStatus: paymentStatus || booking.paymentStatus,
      therapist: therapist || booking.therapist
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating session status', error: err.message });
  }
});

module.exports = router;
