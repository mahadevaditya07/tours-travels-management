const r = require('express').Router();
const Vehicle = require('../models/Vehicle');

r.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ capacity: 1 });
    res.json({ success: true, vehicles });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = r;
