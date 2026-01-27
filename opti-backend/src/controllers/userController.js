const User = require('../models/User');
const Admin = require('../models/Admin');
const { generatePassword } = require('../utils/passwordGenerator');
const { sendCredentialsEmail, sendPasswordChangeEmail } = require('../utils/emailService');
const { isStrongPassword, getPasswordErrors } = require('../utils/validators');

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, role, plan } = req.body;

    // Get admin's company plan
    const companyPlan = await Admin.getCompanyPlanWithStats(req.user.id);
    
    // Check if max users limit reached
    if (companyPlan.currentUsers >= companyPlan.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `Maximum user limit (${companyPlan.maxUsers}) reached for ${companyPlan.name} plan`,
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Generate temporary password
    const tempPassword = generatePassword();

    // Create user
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role: role || 'user',
      plan: plan || 'basic',
      createdBy: req.user.id,
    });

    // Send credentials email
    await sendCredentialsEmail(email, name, tempPassword);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        temporaryPassword: tempPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users created by admin
// @route   GET /api/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    const result = await User.findByCreatedBy(req.user.id, {
      search,
      status,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      data: {
        users: result.users,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin only)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user belongs to this admin
    if (user.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, plan } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user belongs to this admin
    if (user.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }

    // Check if new email already exists
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (plan) updateData.plan = plan;

    const updatedUser = await User.update(user.id, updateData);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user belongs to this admin
    if (user.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this user',
      });
    }

    await User.delete(user.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (active/inactive)
// @route   PATCH /api/users/:id/toggle-status
// @access  Private (Admin only)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user belongs to this admin
    if (user.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this user',
      });
    }

    const updatedUser = await User.toggleStatus(user.id);

    res.status(200).json({
      success: true,
      message: `User ${updatedUser.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Private (Admin only)
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user belongs to this admin
    if (user.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reset password for this user',
      });
    }

    // Validate password
    if (!isStrongPassword(newPassword)) {
      const errors = getPasswordErrors(newPassword);
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors,
      });
    }

    // Update password
    await User.update(user.id, {
      password: newPassword,
      must_change_password: false,
    });

    // Send confirmation email
    await sendPasswordChangeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile/me
// @access  Private (User only)
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/profile/me
// @access  Private (User only)
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const updatedUser = await User.update(user.id, { name });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};
