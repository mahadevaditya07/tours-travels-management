const mongoose = require('mongoose');

const dayChargeSchema = new mongoose.Schema({
  days: { type: Number, required: true, unique: true },
  nights: { type: Number, required: true },
  charge: { type: Number, required: true, default: 0 },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('DayCharge', dayChargeSchema);
