const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const token = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// Helper to shape user object
const safeUser = u => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, rating: u.rating, savedExperience: u.savedExperience, isVerified: u.isVerified });

exports.register = async (req, res) => {
	try {
		const { name, email, password, phone } = req.body;
		if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required.' });

		// Password: 8-16 chars, letters, number, special char
		if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(password)) return res.status(400).json({ success: false, message: 'Password must be 8-16 chars and include letters, numbers and special characters.' });

		if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ success: false, message: 'An account with this email already exists.' });

		// Create user but do NOT log them in automatically. Generate verification token
		const verificationToken = crypto.randomBytes(24).toString('hex');
		const verificationExpires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

		const u = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), phone, isVerified: false, verificationToken, verificationExpires });

				const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-account?token=${verificationToken}&email=${encodeURIComponent(u.email)}`;
				// Send verification via email and/or SMS
				try {
					const mailer = require('../utils/mailer');
					await mailer.sendEmail({ to: u.email, subject: 'Verify your account', text: `Verify your account: ${link}`, html: `<p>Verify your account: <a href="${link}">${link}</a></p>` });
					if (u.phone && process.env.TWILIO_ACCOUNT_SID) {
						await mailer.sendSms({ to: u.phone, body: `Verify your account: ${link}` });
					}
				} catch (err) {
					console.log('Verification send failed, falling back to console link:', link, err.message || err);
				}

		res.status(201).json({ success: true, message: 'Registration successful. Please check your email or phone for a verification link before logging in.' });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};

exports.verifyAccount = async (req, res) => {
	try {
		const { token, email } = req.body;
		if (!token || !email) return res.status(400).json({ success: false, message: 'Token and email are required.' });
		const u = await User.findOne({ email: email.toLowerCase(), verificationToken: token, verificationExpires: { $gt: Date.now() } });
		if (!u) return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
		u.isVerified = true;
		u.verificationToken = undefined;
		u.verificationExpires = undefined;
		await u.save();
		res.json({ success: true, message: 'Account verified successfully. You may now log in.', user: safeUser(u) });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};

exports.login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const u = await User.findOne({ email: email?.toLowerCase() });
		if (!u || !(await bcrypt.compare(password || '', u.password))) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
		if (!u.isVerified) return res.status(403).json({ success: false, message: 'Account not verified. Please verify your email or phone before login.' });
		res.json({ success: true, message: 'Login successful.', token: token(u._id), user: safeUser(u) });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};

// Forgot password: generate reset token and (placeholder) send link
exports.forgotPassword = async (req, res) => {
	try {
		const { emailOrPhone } = req.body;
		if (!emailOrPhone) return res.status(400).json({ success: false, message: 'Email or phone is required.' });

		const u = await User.findOne({ $or: [{ email: emailOrPhone.toLowerCase() }, { phone: emailOrPhone }] });
		if (!u) return res.status(200).json({ success: true, message: 'If an account matches the provided contact, a reset link has been sent.' });

		const resetToken = crypto.randomBytes(24).toString('hex');
		u.resetPasswordToken = resetToken;
		u.resetPasswordExpires = Date.now() + (60 * 60 * 1000); // 1 hour
		await u.save();

				const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(u.email)}`;
				try {
					const mailer = require('../utils/mailer');
					await mailer.sendEmail({ to: u.email, subject: 'Reset your password', text: `Reset: ${link}`, html: `<p>Reset your password: <a href="${link}">${link}</a></p>` });
					if (u.phone && process.env.TWILIO_ACCOUNT_SID) {
						await mailer.sendSms({ to: u.phone, body: `Reset your password: ${link}` });
					}
				} catch (err) {
					console.log('Reset send failed, falling back to console link:', link, err.message || err);
				}

		res.json({ success: true, message: 'If an account matches the provided contact, a reset link has been sent.' });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const { token, email, password } = req.body;
		if (!token || !email || !password) return res.status(400).json({ success: false, message: 'Token, email and new password are required.' });
		const u = await User.findOne({ email: email.toLowerCase(), resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
		if (!u) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

		// Password validation same as register
		if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(password)) return res.status(400).json({ success: false, message: 'Password must be 8-16 chars and include letters, numbers and special characters.' });

		u.password = await bcrypt.hash(password, 12);
		u.resetPasswordToken = undefined;
		u.resetPasswordExpires = undefined;
		await u.save();
		res.json({ success: true, message: 'Password has been reset. You may now log in with your new password.' });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};
