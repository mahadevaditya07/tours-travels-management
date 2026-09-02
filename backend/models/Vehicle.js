const mongoose = require('mongoose');

const s = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  mileage: { type: Number },
  costPerKm: { type: Number, required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', s);
