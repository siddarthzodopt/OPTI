const Admin = require('../models/Admin');
const { isStrongPassword, getPasswordErrors } = require('../utils/validators');

// @desc    Register new admin
// @route   POST /api/admin/register
// @access  Public
exports.registerAdmin = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findByEmail(email);

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists',
      });
    }

    // Validate password
    if (!isStrongPassword(password)) {
      const errors = getPasswordErrors(password);
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors,
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
exports.getAdminProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin only)
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Check if new email already exists
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findByEmail(email);
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    // Update admin
    const updatedAdmin = await Admin.update(admin.id, { email });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        admin: updatedAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company plan
// @route   PUT /api/admin/company-plan
// @access  Private (Admin only)
exports.updateCompanyPlan = async (req, res, next) => {
  try {
    const { name, maxUsers, features } = req.body;

    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    const updateData = {};
    if (name) updateData.plan_name = name;
    if (maxUsers) updateData.plan_max_users = maxUsers;
    if (features) updateData.plan_features = features;

    await Admin.update(admin.id, updateData);

    const companyPlan = await Admin.getCompanyPlanWithStats(admin.id);

    res.status(200).json({
      success: true,
      message: 'Company plan updated successfully',
      data: {
        companyPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get company plan details
// @route   GET /api/admin/company-plan
// @access  Private (Admin only)
exports.getCompanyPlan = async (req, res, next) => {
  try {
    const companyPlan = await Admin.getCompanyPlanWithStats(req.user.id);

    if (!companyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        companyPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};
