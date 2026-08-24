const r = require('express').Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

r.use(protect);
r.get('/profile', c.getProfile);
r.put('/profile', c.updateProfile);

// POST to increment saved experiences
r.post('/profile/save', c.saveExperience);

// POST to add a rating (body: { rating: number })
r.post('/profile/rate', c.addRating);

module.exports = r;
