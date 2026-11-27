const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerUser,
  verifyEmail,
  loginUser,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  createAdmin,
  getMe
} = require('../controllers/authController');

// Public routes
router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/create-admin', createAdmin);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/2fa/enable', protect, enableTwoFactor);
router.post('/2fa/verify', protect, verifyTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);

module.exports = router;
