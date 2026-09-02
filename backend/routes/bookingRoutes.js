const r = require('express').Router();
const c = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Public: confirm booking using token (no auth required)
r.post('/:bookingId/confirm', c.confirmBooking);

// Protected routes
r.use(protect);
r.post('/', c.createBooking);
r.get('/my-bookings', c.getMyBookings);
r.put('/:id/cancel', c.cancelBooking);

module.exports = r;
