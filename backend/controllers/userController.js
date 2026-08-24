const User = require('../models/User');

exports.getProfile = async (req, res) => {
	const user = await User.findById(req.user._id).select('-password');
	res.json({ success: true, user });
};

exports.updateProfile = async (req, res) => {
	try {
		const { name, phone, avatar, email } = req.body;

		// Basic validations
		if (name && !/^[A-Za-z\s]+$/.test(name)) return res.status(400).json({ success: false, message: 'Name must contain only letters and spaces.' });
		if (phone && !/^\d{10}$/.test(phone)) return res.status(400).json({ success: false, message: 'Phone must be exactly 10 digits.' });

		// If email is being changed, ensure uniqueness
		if (email) {
			const existing = await User.findOne({ email: email.toLowerCase() });
			if (existing && existing._id.toString() !== req.user._id.toString()) return res.status(409).json({ success: false, message: 'Email already in use.' });
		}

		const updates = { name, phone, avatar };
		if (email) updates.email = email.toLowerCase();

		const u = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
		res.json({ success: true, message: 'Profile updated successfully.', user: u });
	} catch (e) {
		res.status(400).json({ success: false, message: e.message });
	}
};

// Increment savedExperience by 1
exports.saveExperience = async (req, res) => {
	try {
		const u = await User.findById(req.user._id);
		if (!u) return res.status(404).json({ success: false, message: 'User not found.' });
		u.savedExperience = (u.savedExperience || 0) + 1;
		await u.save();
		res.json({ success: true, user: u });
	} catch (e) {
		res.status(400).json({ success: false, message: e.message });
	}
};

// Add a rating and update average
exports.addRating = async (req, res) => {
	try {
		const { rating } = req.body;
		const value = Number(rating);
		if (!value || value < 1 || value > 5) return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

		const u = await User.findById(req.user._id);
		if (!u) return res.status(404).json({ success: false, message: 'User not found.' });

		const currentAvg = u.rating || 0;
		const count = u.ratingCount || 0;
		const newCount = count + 1;
		const newAvg = ((currentAvg * count) + value) / newCount;

		u.rating = newAvg;
		u.ratingCount = newCount;
		await u.save();

		res.json({ success: true, user: u });
	} catch (e) {
		res.status(400).json({ success: false, message: e.message });
	}
};
