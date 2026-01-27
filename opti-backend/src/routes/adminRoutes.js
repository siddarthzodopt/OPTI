const express = require('express');
const { body } = require('express-validator');
const {
  registerAdmin,
  getAdminProfile,
  updateAdminProfile,
  getCompanyPlan,
  updateCompanyPlan,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// Register admin (public route)
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('confirmPassword').notEmpty().withMessage('Confirm password is required'),
  ],
  validateRequest,
  registerAdmin
);

// Admin profile routes (protected, admin only)
router.get('/profile', protect, restrictTo('admin', 'superadmin'), getAdminProfile);

router.put(
  '/profile',
  protect,
  restrictTo('admin', 'superadmin'),
  [body('email').optional().isEmail().withMessage('Please provide a valid email')],
  validateRequest,
  updateAdminProfile
);

// Company plan routes (protected, admin only)
router.get('/company-plan', protect, restrictTo('admin', 'superadmin'), getCompanyPlan);

router.put(
  '/company-plan',
  protect,
  restrictTo('admin', 'superadmin'),
  [
    body('name').optional().notEmpty().withMessage('Plan name cannot be empty'),
    body('maxUsers').optional().isInt({ min: 1 }).withMessage('Max users must be at least 1'),
    body('features').optional().isArray().withMessage('Features must be an array'),
  ],
  validateRequest,
  updateCompanyPlan
);

module.exports = router;
