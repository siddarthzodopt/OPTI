const express = require('express');
const { body } = require('express-validator');
const {
  adminLogin,
  userLogin,
  changePassword,
  forgotPassword,
  verifyOTP,
  resetPassword,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Admin login
router.post(
  '/admin/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  adminLogin
);

// User login
router.post(
  '/user/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  userLogin
);

// Change password (protected route)
router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
  ],
  validateRequest,
  changePassword
);

// Forgot password - send OTP
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('userType')
      .isIn(['admin', 'user'])
      .withMessage('User type must be either admin or user'),
  ],
  validateRequest,
  forgotPassword
);

// Verify OTP
router.post(
  '/verify-otp',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
    body('userType')
      .isIn(['admin', 'user'])
      .withMessage('User type must be either admin or user'),
  ],
  validateRequest,
  verifyOTP
);

// Reset password with verified OTP
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
    body('userType')
      .isIn(['admin', 'user'])
      .withMessage('User type must be either admin or user'),
  ],
  validateRequest,
  resetPassword
);

// Logout (protected route)
router.post('/logout', protect, logout);

module.exports = router;
