const express = require('express');
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

// Register
router.post('/register', register);

// Login
router.post('/login', login);

// Forgot password - sends reset link to email
router.post('/forgot-password', forgotPassword);

// Reset password
router.post('/reset-password', resetPassword);

module.exports = router;