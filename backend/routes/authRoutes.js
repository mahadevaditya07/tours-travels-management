const r = require('express').Router();
const c = require('../controllers/authController');

r.post('/register', c.register);
r.post('/login', c.login);

// Verification and password reset
r.post('/verify-account', c.verifyAccount);
r.post('/forgot-password', c.forgotPassword);
r.post('/reset-password', c.resetPassword);

module.exports = r;
