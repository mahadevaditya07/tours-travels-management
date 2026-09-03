const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const crypto = require('crypto');

const buildBookingDetailsText = (booking) => {
  return [
    `Booking ID: ${booking.bookingId}`,
    `Tour: ${booking.tourName || 'Custom trip'}`,
    `Travel Date: ${new Date(booking.travelDate).toLocaleDateString()}`,
    `From: ${booking.startLocation}`,
    `To: ${booking.destination}`,
    `Passengers: ${booking.members}`,
    `Total Price: ₹${Number(booking.totalPrice || 0).toLocaleString('en-IN')}`,
    `Status: Cancelled`,
  ].join('\n');
};

const sendCancellationNotification = async (booking) => {
  if (!booking || !booking.email) return;

  const detailText = buildBookingDetailsText(booking);
  const detailHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
      <h2 style="margin-bottom: 12px;">Booking Cancelled</h2>
      <p>Your booking has been cancelled successfully.</p>
      <p><strong>Booking details:</strong></p>
      <ul>
        <li><strong>Booking ID:</strong> ${booking.bookingId}</li>
        <li><strong>Tour:</strong> ${booking.tourName || 'Custom trip'}</li>
        <li><strong>Travel Date:</strong> ${new Date(booking.travelDate).toLocaleDateString()}</li>
        <li><strong>From:</strong> ${booking.startLocation}</li>
        <li><strong>To:</strong> ${booking.destination}</li>
        <li><strong>Passengers:</strong> ${booking.members}</li>
        <li><strong>Total Price:</strong> ₹${Number(booking.totalPrice || 0).toLocaleString('en-IN')}</li>
      </ul>
    </div>
  `;

  try {
    const mailer = require('../utils/mailer');
    await mailer.sendEmail({
      to: booking.email,
      subject: 'Your booking has been cancelled',
      text: `Your booking has been cancelled.\n\n${detailText}`,
      html: detailHtml,
    });

    if (booking.phone && process.env.TWILIO_ACCOUNT_SID) {
      await mailer.sendSms({
        to: booking.phone,
        body: `Your booking has been cancelled. ${booking.tourName || 'Trip'} on ${new Date(booking.travelDate).toLocaleDateString()}. Booking ID: ${booking.bookingId}`,
      });
    }
  } catch (err) {
    console.log('Failed sending booking cancellation notification:', err.message || err);
  }
};

exports.createBooking = async (req, res) => {
  try {
    const b = req.body;
    const t = b.tour
      ? await Tour.findById(b.tour).catch(() => null)
      : null;

    // Required fields
    if (
      !b.name ||
      !b.email ||
      !b.phone ||
      !b.startLocation ||
      !b.destination ||
      !b.travelDate ||
      !b.members ||
      !b.vehicle ||
      b.totalPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required booking details.'
      });
    }

    // --------------------------------------------------
    // BOOKING DATE VALIDATION
    // Booking date MUST be after today
    // --------------------------------------------------
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const travelDate = new Date(b.travelDate);
    travelDate.setHours(0, 0, 0, 0);

    if (isNaN(travelDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid travel date.'
      });
    }

    if (travelDate <= today) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be after today.'
      });
    }

    // --------------------------------------------------
    // VEHICLE CAPACITY CHECK
    // --------------------------------------------------
    const Vehicle = require('../models/Vehicle');

    let vehicleDoc = null;

    if (b.vehicle) {
      vehicleDoc = await Vehicle.findOne({
        $or: [
          { name: b.vehicle },
          { id: b.vehicle }
        ]
      }).catch(() => null);
    }

    if (vehicleDoc) {
      const maxPassengers = Math.max(0, vehicleDoc.capacity - 1);

      if (Number(b.members) > maxPassengers) {
        return res.status(400).json({
          success: false,
          message: `Selected vehicle ${vehicleDoc.name} supports maximum ${maxPassengers} passengers.`
        });
      }
    }

    // --------------------------------------------------
    // CREATE BOOKING
    // --------------------------------------------------
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

    // Send a confirmation link (user must confirm to activate booking)
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

    console.log('Booking confirmation link (debug):', link);

    const mailerConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    const debug = (!mailerConfigured && !smsConfigured) ? { confirmationLink: link } : undefined;

    res.status(201).json({ success: true, message: 'Booking created. A confirmation link has been sent to the provided contact. Please verify to confirm the booking.', booking: x, debug });

  } catch (e) {
    console.error('Create booking error:', e);

    res.status(400).json({
      success: false,
      message: e.message
    });
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
    await sendCancellationNotification(b);
    res.json({ success: true, message: 'Booking cancelled. A cancellation notice with details has been sent to your email/phone.', booking: b });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

exports.sendCancellationNotification = sendCancellationNotification;

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
    // Send confirmation email/SMS with booking details
    try {
      const mailer = require('../utils/mailer');
      const details = `Booking ID: ${b.bookingId}\nTour: ${b.tourName || 'N/A'}\nDate: ${b.travelDate}\nFrom: ${b.startLocation}\nTo: ${b.destination}\nPassengers: ${b.members}\nTotal: ${b.totalPrice}`;
      const html = `<h3>Your booking is confirmed</h3><p>${details.replace(/\n/g,'<br/>')}</p>`;
      await mailer.sendEmail({ to: b.email, subject: 'Your booking is confirmed', text: details, html });
      if (b.phone && process.env.TWILIO_ACCOUNT_SID) {
        await mailer.sendSms({ to: b.phone, body: `Your booking is confirmed. ${b.tourName || ''} on ${b.travelDate}. Booking ID: ${b.bookingId}` });
      }
    } catch (err) {
      console.log('Failed sending booking confirmation notification:', err.message || err);
    }

    res.json({ success: true, message: 'Booking confirmed.', booking: b });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};
