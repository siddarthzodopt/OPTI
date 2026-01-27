const { verifyToken } = require('../config/jwt');
const Admin = require('../models/Admin');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user/admin still exists
    let user;
    if (decoded.role === 'admin' || decoded.role === 'superadmin') {
      user = await Admin.findById(decoded.id, true);
    } else {
      user = await User.findById(decoded.id, true);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Check if admin is active
    if (user.is_active === false) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated',
      });
    }

    // Check if password was changed after token was issued (for users)
    if (user.password_changed_at) {
      const passwordChanged = User.passwordChangedAfter(
        user.password_changed_at,
        decoded.iat
      );
      
      if (passwordChanged) {
        return res.status(401).json({
          success: false,
          message: 'Password recently changed. Please log in again',
        });
      }
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: error.message,
    });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }
    next();
  };
};

// Check if password needs to be changed
exports.checkPasswordChange = (req, res, next) => {
  if (req.user.must_change_password && req.path !== '/change-password') {
    return res.status(403).json({
      success: false,
      message: 'You must change your password before continuing',
      mustChangePassword: true,
    });
  }
  next();
};
