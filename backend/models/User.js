const mongoose = require('mongoose');

const s = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true, lowercase: true },
	password: { type: String, required: true },
	phone: { type: String, default: '' },
	role: { type: String, enum: ['user', 'admin'], default: 'user' },
	avatar: { type: String, default: '' },
	rating: { type: Number, default: 4.9 },
	ratingCount: { type: Number, default: 0 },
	savedExperience: { type: Number, default: 12 },
}, { timestamps: true });

module.exports = mongoose.model('User', s);
