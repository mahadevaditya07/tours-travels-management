const Booking = require('../models/Booking');
const Tour = require('../models/Tour');

exports.createBooking = async (req, res) => {
  try {
    const b = req.body;
    const t = b.tour ? await Tour.findById(b.tour).catch(() => null) : null;

    if (!b.name || !b.email || !b.phone || !b.startLocation || !b.destination || !b.travelDate || !b.members || !b.vehicle || b.totalPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking details.' });
    }

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
      // Auto-confirm bookings per user request
      status: 'Confirmed'
    };

    const x = await Booking.create(bookingData);

    res.status(201).json({ success: true, message: 'Booking successful.', booking: x });
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
