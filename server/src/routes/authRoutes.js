const express = require('express');
const {
  registerUser,
  registerVendor,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
  login,
  logout,
  getMe,
} = require('../controllers/authController');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');
const {
  registrationLimiter,
  loginLimiter,
  otpLimiter,
  resendOtpLimiter,
} = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/user/register', registrationLimiter, registerUser);
router.post('/vendor/register', registrationLimiter, registerVendor);
router.post('/verify-email', otpLimiter, verifyEmail);
router.post('/resend-otp', resendOtpLimiter, resendOtp);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);
router.post('/login', loginLimiter, login);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

router.get('/admin-check', authMiddleware, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access granted.' });
});

module.exports = router;
