const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const crypto = require('crypto');

exports.createBooking = async (req, res) => {
  try {
    const b = req.body;
    const t = b.tour ? await Tour.findById(b.tour).catch(() => null) : null;

    if (!b.name || !b.email || !b.phone || !b.startLocation || !b.destination || !b.travelDate || !b.members || !b.vehicle || b.totalPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking details.' });
    }

    // Server-side vehicle capacity and rate lookup using Vehicle model
    const Vehicle = require('../models/Vehicle');
    let vehicleDoc = null;
    if (b.vehicle) {
      // Try to find by name first, then id
      vehicleDoc = await Vehicle.findOne({ $or: [{ name: b.vehicle }, { id: b.vehicle }] }).catch(() => null);
    }

    if (vehicleDoc) {
      const maxPassengers = Math.max(0, vehicleDoc.capacity - 1);
      if (Number(b.members) > maxPassengers) {
        return res.status(400).json({ success: false, message: `Selected vehicle ${vehicleDoc.name} supports maximum ${maxPassengers} passengers.` });
      }
    }

    // Create booking as Pending until user confirms their email/phone
    const confirmationToken = crypto.randomBytes(20).toString('hex');
    const confirmationExpires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    const bookingData = {
      user: req.user._id,
      tour: t?._id,
      tourName: t?.title || b.tourName,
      name: b.name,
      email: b.email,
      phone: b.phone,
      startLocation: b.startLocation,
      destination: b.destination,
      stops: b.stops || [],
      travelDate: b.travelDate,
      members: b.members,
      vehicle: b.vehicle,
      distance: b.distance || 0,
      basePrice: (b.basePrice !== undefined ? b.basePrice : (t?.price || 0)),
      vehicleCost: Math.max(0, Number(b.totalPrice) - (t?.price || 0)),
      totalPrice: Number(b.totalPrice),
      status: 'Pending',
      confirmationToken,
      confirmationExpires
    };

    const x = await Booking.create(bookingData);

    const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-booking?token=${confirmationToken}&bookingId=${x._id}`;
    try {
      const mailer = require('../utils/mailer');
      await mailer.sendEmail({ to: x.email, subject: 'Confirm your booking', text: `Confirm booking: ${link}`, html: `<p>Confirm your booking: <a href="${link}">${link}</a></p>` });
      if (x.phone && process.env.TWILIO_ACCOUNT_SID) {
        await mailer.sendSms({ to: x.phone, body: `Confirm your booking: ${link}` });
      }
    } catch (err) {
      console.log('Booking confirmation send failed, fallback link:', link, err.message || err);
    }

    res.status(201).json({ success: true, message: 'Booking created. A confirmation link has been sent to the provided contact. Please verify to confirm the booking.', booking: x });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('tour', 'title destination image price').sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const b = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!b) return res.status(404).json({ success: false, message: 'Booking not found.' });
    b.status = 'Cancelled';
    await b.save();
    res.json({ success: true, message: 'Booking cancelled.', booking: b });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required.' });

    const b = await Booking.findOne({ _id: bookingId, confirmationToken: token, confirmationExpires: { $gt: Date.now() } });
    if (!b) return res.status(400).json({ success: false, message: 'Invalid or expired confirmation token.' });
    b.status = 'Confirmed';
    b.confirmationToken = undefined;
    b.confirmationExpires = undefined;
    await b.save();
    res.json({ success: true, message: 'Booking confirmed.', booking: b });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
