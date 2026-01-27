const Admin = require('../models/Admin');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const { generateOTP } = require('../utils/passwordGenerator');
const { sendOTPEmail, sendPasswordChangeEmail } = require('../utils/emailService');
const { isStrongPassword, getPasswordErrors } = require('../utils/validators');

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findByEmail(email, true);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await Admin.comparePassword(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if admin is active
    if (!admin.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Update last login
    await Admin.update(admin.id, { last_login: new Date() });

    // Generate tokens
    const token = await generateToken(admin.id, admin.role);
    const refreshToken = await generateRefreshToken(admin.id);

    // Save refresh token
    await Admin.update(admin.id, { refresh_token: refreshToken });

    // Get updated admin without password
    const updatedAdmin = await Admin.findById(admin.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: updatedAdmin,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User login
// @route   POST /api/auth/user/login
// @access  Public
exports.userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email, true);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Update last login
    await User.update(user.id, { last_login: new Date() });

    // Generate tokens
    const token = await generateToken(user.id, user.role);
    const refreshToken = await generateRefreshToken(user.id);

    // Save refresh token
    await User.update(user.id, { refresh_token: refreshToken });

    // Get updated user without password
    const updatedUser = await User.findById(user.id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: updatedUser,
        token,
        refreshToken,
        mustChangePassword: updatedUser.must_change_password,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password (for first-time users)
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id, true);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check current password
    const isMatch = await User.comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Validate new password
    if (!isStrongPassword(newPassword)) {
      const errors = getPasswordErrors(newPassword);
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors,
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Update password
    await User.update(user.id, {
      password: newPassword,
      must_change_password: false,
    });

    // Send confirmation email
    await sendPasswordChangeEmail(user.email, user.name);

    // Generate new tokens
    const token = await generateToken(user.id, user.role);
    const refreshToken = await generateRefreshToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, userType } = req.body;

    // Check if user/admin exists
    let user;
    if (userType === 'admin') {
      user = await Admin.findByEmail(email);
    } else {
      user = await User.findByEmail(email);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP
    await OTP.create({
      email,
      otp,
      userType,
    });

    // Send OTP via email
    await sendOTPEmail(email, otp);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp, userType } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findByEmailAndOTP(email, otp, userType);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
    }

    // Check if OTP is expired
    if (OTP.isExpired(otpRecord.expires_at)) {
      await OTP.deleteById(otpRecord.id);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    // Mark OTP as verified
    await OTP.markAsVerified(otpRecord.id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword, confirmPassword, userType } = req.body;

    // Check if OTP was verified
    const otpRecord = await OTP.findVerified(email, userType);

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify OTP first',
      });
    }

    // Validate new password
    if (!isStrongPassword(newPassword)) {
      const errors = getPasswordErrors(newPassword);
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors,
      });
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Find and update user/admin
    let user;
    if (userType === 'admin') {
      user = await Admin.findByEmail(email);
      if (user) {
        await Admin.update(user.id, { password: newPassword });
      }
    } else {
      user = await User.findByEmail(email);
      if (user) {
        await User.update(user.id, {
          password: newPassword,
          must_change_password: false,
        });
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete OTP record
    await OTP.deleteById(otpRecord.id);

    // Send confirmation email
    await sendPasswordChangeEmail(user.email, user.name || 'Admin');

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      await Admin.update(req.user.id, { refresh_token: null });
    } else {
      await User.update(req.user.id, { refresh_token: null });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
