const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const token = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.register = async (req, res) => {
	try {
		const { name, email, password, phone } = req.body;
		if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required.' });

		// Password: 8-16 chars, letters, number, special char
		if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(password)) return res.status(400).json({ success: false, message: 'Password must be 8-16 chars and include letters, numbers and special characters.' });

		if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

		const u = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), phone });
		res.status(201).json({ success: true, message: 'Registration successful.', token: token(u._id), user: { id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, rating: u.rating, savedExperience: u.savedExperience } });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const u = await User.findOne({ email: email?.toLowerCase() });
		if (!u || !(await bcrypt.compare(password || '', u.password))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
		res.json({ success: true, message: 'Login successful.', token: token(u._id), user: { id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, rating: u.rating, savedExperience: u.savedExperience } });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};
