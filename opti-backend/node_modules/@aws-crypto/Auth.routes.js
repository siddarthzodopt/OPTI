const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory storage (replace with database in production)
let users = [];
let userCredentials = {};

/* ===============================================
   HELPER FUNCTIONS
================================================ */

// Generate temporary password
function generateTempPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = 'Opti';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + '!';
}

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP with expiration (5 minutes)
const otpStore = new Map();

function storeOTP(email, otp) {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
}

function verifyOTP(email, otp) {
  const stored = otpStore.get(email);
  if (!stored) return false;
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return false;
  }
  return stored.otp === otp;
}

/* ===============================================
   ADMIN REGISTRATION
================================================ */

router.post('/admin/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }

    // Check if admin already exists
    if (users.find(u => u.email === email && u.role === 'admin')) {
      return res.status(409).json({ 
        error: 'Admin account already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = {
      id: uuidv4(),
      email,
      role: 'admin',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    };

    // Store credentials
    userCredentials[email] = {
      hashedPassword,
      mustChangePassword: false
    };

    users.push(admin);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: admin.id, 
        email: admin.email, 
        role: admin.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Admin account created successfully',
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        plan: admin.plan,
        status: admin.status
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================================
   LOGIN (ADMIN & USERS)
================================================ */

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(403).json({ 
        error: 'Your account has been deactivated. Please contact your administrator.' 
      });
    }

    // Get user credentials
    const credentials = userCredentials[email];
    if (!credentials) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, credentials.hashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Check if password reset is required (for new users)
    if (credentials.mustChangePassword) {
      const resetToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          type: 'password-reset' 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        mustChangePassword: true,
        resetToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          plan: user.plan
        },
        message: 'Password reset required'
      });
    }

    // Generate JWT token for normal login
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================================
   CREATE USER (ADMIN ONLY)
================================================ */

router.post('/users/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role = 'user', plan = 'basic' } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Check if user already exists
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ 
        error: 'A user with this email already exists' 
      });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Hash password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new user
    const newUser = {
      id: uuidv4(),
      name,
      email,
      role,
      plan,
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    };

    // Store user credentials with flag to change password
    userCredentials[email] = {
      hashedPassword,
      mustChangePassword: true
    };

    // Add user to database
    users.push(newUser);

    // Send email with temporary password (if email service is configured)
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to OPTI - Your Account Details',
        html: `
          <h2>Welcome to OPTI!</h2>
          <p>Your account has been created by an administrator.</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p>Please log in and change your password immediately.</p>
          <p>For security reasons, you will be required to change your password on first login.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        plan: newUser.plan,
        status: newUser.status
      },
      tempPassword // Return temp password to admin
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================================
   RESET PASSWORD (FIRST LOGIN)
================================================ */

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, currentPassword, newPassword } = req.body;

    // Validation
    if (!resetToken || !currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.type !== 'password-reset') {
        return res.status(403).json({ error: 'Invalid reset token' });
      }
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired reset token' });
    }

    // Find user
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user credentials
    const credentials = userCredentials[user.email];
    if (!credentials) {
      return res.status(404).json({ error: 'User credentials not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, credentials.hashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, credentials.hashedPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        error: 'New password must be different from current password' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update credentials
    userCredentials[user.email] = {
      hashedPassword,
      mustChangePassword: false
    };

    // Update last login
    user.lastLogin = new Date();

    // Generate new JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Password reset successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================================
   FORGOT PASSWORD - SEND OTP
================================================ */

router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        message: 'If the email exists, an OTP has been sent' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    storeOTP(email, otp);

    // Send OTP via email
    try {
      await sendEmail({
        to: email,
        subject: 'OPTI - Password Reset OTP',
        html: `
          <h2>Password Reset Request</h2>
          <p>Your OTP for password reset is:</p>
          <h1 style="color: #7c88ff; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.status(200).json({ 
      message: 'OTP sent successfully to your email' 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================================
   FORGOT PASSWORD - VERIFY OTP
================================================ */

router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({ 
        error: 'Email and OTP are required' 
      });
    }

    // Verify OTP
    if (!verifyOTP(email, otp)) {
      return res.status(401).json({ 
        error: 'Invalid or expired OTP' 
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        type: 'forgot-password-reset' 
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Remove OTP after successful verification
    otpStore.delete(email);

    res.status(200).json({
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================================
   FORGOT PASSWORD - RESET PASSWORD
================================================ */

router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    // Validation
    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match' 
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.type !== 'forgot-password-reset') {
        return res.status(403).json({ error: 'Invalid reset token' });
      }
    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired reset token' });
    }

    // Find user
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update credentials
    userCredentials[user.email] = {
      hashedPassword,
      mustChangePassword: false
    };

    res.status(200).json({
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ===============================================
   VERIFY TOKEN
================================================ */

router.get('/verify', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.plan,
      status: user.status
    }
  });
});

/* ===============================================
   LOGOUT
================================================ */

router.post('/logout', authenticateToken, (req, res) => {
  // In a production app with token blacklist, add token to blacklist here
  res.status(200).json({ message: 'Logout successful' });
});

/* ===============================================
   INITIALIZE DEFAULT ADMIN
================================================ */

async function initializeDefaultAdmin() {
  const adminEmail = 'admin@opti.com';
  const adminPassword = 'Admin123!';
  
  if (users.length === 0) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = {
      id: uuidv4(),
      name: 'Admin User',
      email: adminEmail,
      role: 'admin',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    };
    
    users.push(admin);
    userCredentials[adminEmail] = {
      hashedPassword,
      mustChangePassword: false
    };
    
    console.log('✅ Default admin user created');
    console.log('📧 Email: admin@opti.com');
    console.log('🔑 Password: Admin123!');
  }
}

// Initialize on module load
initializeDefaultAdmin();

module.exports = router;
