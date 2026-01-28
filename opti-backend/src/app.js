const express = require('express');
const cors = require('cors');

/* ===============================
   IMPORT MIDDLEWARE
================================ */
const errorHandler = require('./src/middleware/errorHandler');

/* ===============================
   IMPORT ROUTES
================================ */
// Authentication & User Management Routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Existing Application Routes
const chatRoutes = require('./routes/chat');
const s3ExcelRoutes = require('./routes/s3Excel');
const mailRoutes = require('./routes/mail');

/* ===============================
   EXPRESS APP INITIALIZATION
================================ */
const app = express();

/* ===============================
   CONFIGURATION
================================ */
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ===============================
   MIDDLEWARE SETUP
================================ */

/**
 * CORS Configuration
 * Allows frontend to communicate with backend
 */
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

/**
 * Body Parsers
 * Parse JSON and URL-encoded data
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request Logger
 * Logs all incoming requests with timestamp
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method.padEnd(7);
  console.log(`[${timestamp}] ${method} ${req.originalUrl}`);
  next();
});

/* ===============================
   HEALTH CHECK ROUTES
================================ */

/**
 * Root route
 * Quick check if server is running
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ OPTI Backend is running',
    version: '1.0.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Detailed health check
 * Returns server status and configuration
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend OK ✅',
    server: {
      uptime: Math.floor(process.uptime()),
      environment: NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
    },
    services: {
      database: 'MySQL (AWS)',
      secrets: 'AWS Secrets Manager',
      email: 'Nodemailer',
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * API info route
 * Lists all available API endpoints
 */
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OPTI API v1.0.0',
    endpoints: {
      authentication: {
        adminLogin: 'POST /api/auth/admin/login',
        userLogin: 'POST /api/auth/user/login',
        changePassword: 'POST /api/auth/change-password',
        forgotPassword: 'POST /api/auth/forgot-password',
        verifyOTP: 'POST /api/auth/verify-otp',
        resetPassword: 'POST /api/auth/reset-password',
        logout: 'POST /api/auth/logout',
      },
      admin: {
        register: 'POST /api/admin/register',
        profile: 'GET /api/admin/profile',
        updateProfile: 'PUT /api/admin/profile',
        companyPlan: 'GET /api/admin/company-plan',
        updatePlan: 'PUT /api/admin/company-plan',
      },
      users: {
        create: 'POST /api/users',
        list: 'GET /api/users',
        get: 'GET /api/users/:id',
        update: 'PUT /api/users/:id',
        delete: 'DELETE /api/users/:id',
        toggleStatus: 'PATCH /api/users/:id/toggle-status',
        resetPassword: 'POST /api/users/:id/reset-password',
        myProfile: 'GET /api/users/profile/me',
        updateMyProfile: 'PUT /api/users/profile/me',
      },
      chat: {
        endpoint: '/api/chat',
        description: 'Chat and AI interaction endpoints',
      },
      s3: {
        endpoint: '/api/s3',
        description: 'S3 and Excel file operations',
      },
      mail: {
        endpoint: '/api/mail',
        description: 'Email sending operations',
      },
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

/* ===============================
   API ROUTES
================================ */

/**
 * Authentication & Authorization Routes
 * Handles login, logout, password management
 */
app.use('/api/auth', authRoutes);

/**
 * Admin Management Routes
 * Handles admin registration and profile management
 */
app.use('/api/admin', adminRoutes);

/**
 * User Management Routes
 * Handles CRUD operations for users
 */
app.use('/api/users', userRoutes);

/**
 * Chat Routes
 * Handles chat and AI interactions
 */
app.use('/api/chat', chatRoutes);

/**
 * S3 Excel Routes
 * Handles S3 storage and Excel file operations
 */
app.use('/api/s3', s3ExcelRoutes);

/**
 * Mail Routes
 * Handles email sending operations
 */
app.use('/api/mail', mailRoutes);

/* ===============================
   404 NOT FOUND HANDLER
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    suggestion: 'Check GET /api for available endpoints',
    availableRoutes: [
      '/api/auth',
      '/api/admin',
      '/api/users',
      '/api/chat',
      '/api/s3',
      '/api/mail',
    ],
  });
});

/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use(errorHandler);

/* ===============================
   EXPORT APP
================================ */
module.exports = app;
