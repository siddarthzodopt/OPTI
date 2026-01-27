const express = require('express');
const { body, param } = require('express-validator');
const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getUserProfile,
  updateUserProfile,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

// User profile routes (protected, user can access their own profile)
router.get('/profile/me', protect, getUserProfile);

router.put(
  '/profile/me',
  protect,
  [body('name').notEmpty().withMessage('Name is required')],
  validateRequest,
  updateUserProfile
);

// Admin-only routes for user management
router.post(
  '/',
  protect,
  restrictTo('admin', 'superadmin'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin'),
    body('plan')
      .optional()
      .isIn(['free', 'basic', 'premium', 'enterprise'])
      .withMessage('Invalid plan type'),
  ],
  validateRequest,
  createUser
);

router.get('/', protect, restrictTo('admin', 'superadmin'), getAllUsers);

router.get(
  '/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  [param('id').isInt().withMessage('Invalid user ID')],
  validateRequest,
  getUser
);

router.put(
  '/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  [
    param('id').isInt().withMessage('Invalid user ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('role')
      .optional()
      .isIn(['user', 'admin'])
      .withMessage('Role must be either user or admin'),
    body('plan')
      .optional()
      .isIn(['free', 'basic', 'premium', 'enterprise'])
      .withMessage('Invalid plan type'),
  ],
  validateRequest,
  updateUser
);

router.delete(
  '/:id',
  protect,
  restrictTo('admin', 'superadmin'),
  [param('id').isInt().withMessage('Invalid user ID')],
  validateRequest,
  deleteUser
);

router.patch(
  '/:id/toggle-status',
  protect,
  restrictTo('admin', 'superadmin'),
  [param('id').isInt().withMessage('Invalid user ID')],
  validateRequest,
  toggleUserStatus
);

router.post(
  '/:id/reset-password',
  protect,
  restrictTo('admin', 'superadmin'),
  [
    param('id').isInt().withMessage('Invalid user ID'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
  ],
  validateRequest,
  resetUserPassword
);

module.exports = router;
