const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { sendCancellationNotification } = require('../controllers/bookingController');

router.use(protect);
router.use(adminOnly);

router.get('/dashboard', async (req, res) => {
  try {
    const [users, bookings, vehicles] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }),
      Booking.find().sort({ createdAt: -1 }).limit(50),
      Vehicle.find().sort({ costPerKm: 1 }),
    ]);

    const summary = {
      totalUsers: users.length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'Pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'Confirmed').length,
      cancelledBookings: bookings.filter(b => b.status === 'Cancelled').length,
      activeVehicles: vehicles.length,
    };

    res.json({
      success: true,
      summary,
      users,
      bookings,
      vehicles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/pricing/:vehicleId', async (req, res) => {
  try {
    const { costPerKm } = req.body;
    const value = Number(costPerKm);

    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ success: false, message: 'Price per kilometer must be a valid positive number.' });
    }

    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    vehicle.costPerKm = value;
    await vehicle.save();

    res.json({ success: true, message: 'Vehicle price updated.', vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/bookings/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    booking.status = 'Cancelled';
    await booking.save();
    await sendCancellationNotification(booking);
    res.json({ success: true, message: 'Booking cancelled by admin. A cancellation notice with details has been sent to the customer.', booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/seed-admin', async (req, res) => {
  try {
    const { email = (process.env.ADMIN_EMAIL || 'admin@tours.com').toLowerCase(), password = process.env.ADMIN_PASSWORD || 'Admin@123' } = req.body || {};
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(200).json({ success: true, message: 'Admin already exists.', user: existing });
    }

    const admin = await User.create({
      name: 'System Admin',
      email,
      password: await bcrypt.hash(password, 12),
      phone: '9999999999',
      role: 'admin',
      isVerified: true,
    });

    res.status(201).json({ success: true, message: 'Admin account created.', user: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
