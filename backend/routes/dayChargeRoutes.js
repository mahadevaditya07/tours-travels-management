const express = require('express');
const router = express.Router();
const DayCharge = require('../models/DayCharge');

// GET /api/day-charges - Public endpoint for fetching configured stay charges
router.get('/', async (req, res) => {
  try {
    const charges = await DayCharge.find().sort({ days: 1 });
    res.json({ success: true, dayCharges: charges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
