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

		// Create user and mark verified immediately (no verification required)
		const u = await User.create({ name, email: email.toLowerCase(), password: await bcrypt.hash(password, 12), phone, isVerified: true });

		res.status(201).json({ success: true, message: 'Registration successful. You may now log in.' });
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
		// Previously required verification; now allow login without verification.
		res.json({ success: true, message: 'Login successful.', token: token(u._id), user: safeUser(u) });
	} catch (e) {
		res.status(500).json({ success: false, message: e.message });
	}
};

// Forgot password: generate reset token and (placeholder) send link
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const contact = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: contact });

    // Don't reveal whether the email exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password` +
      `?token=${encodeURIComponent(resetToken)}` +
      `&email=${encodeURIComponent(user.email)}`;

    const mailer = require("../utils/mailer");

    await mailer.sendEmail({
      to: user.email,
      subject: "Tours & Travels - Password Reset",

      text: `
Hello ${user.name},

We received a request to reset your Tours & Travels password.

Click the link below to reset your password:

${resetLink}

This link is valid for 15 minutes.

If you did not request a password reset, please ignore this email.

Regards,
Tours & Travels Management
`,

      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Tours & Travels Management</h2>

          <p>Hello <strong>${user.name}</strong>,</p>

          <p>
            We received a request to reset your Tours & Travels password.
          </p>

          <p>
            Click the button below to reset your password:
          </p>

          <p>
            <a
              href="${resetLink}"
              style="
                display:inline-block;
                padding:12px 20px;
                background:#007bff;
                color:white;
                text-decoration:none;
                border-radius:6px;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This link is valid for <strong>15 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset, please ignore this email.
          </p>

          <p>
            Regards,<br>
            <strong>Tours & Travels Management</strong>
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send password reset email.",
    });
  }
};
// Reset password using the email reset link
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token, email and new password are required.'
      });
    }

    // Same password rules as registration
    if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be 8-16 chars and include letters, numbers and special characters.'
      });
    }

    const u = await User.findOne({
      email: String(email).trim().toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!u) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link.'
      });
    }

    // Hash new password
    u.password = await bcrypt.hash(password, 12);

    // Remove used reset token
    u.resetPasswordToken = undefined;
    u.resetPasswordExpires = undefined;

    await u.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in.'
    });

  } catch (error) {
    console.error('Reset password error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to reset password.'
    });
  }
};