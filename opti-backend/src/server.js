require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./src/config/database');

/* ===============================
   EXPRESS APP INITIALIZATION
================================ */
const app = express();

/* ===============================
   CONFIGURATION
================================ */
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_URL = process.env.FRONTEND_URL || '*';
const NODE_ENV = process.env.NODE_ENV || 'development';

/* ===============================
   MIDDLEWARE SETUP
================================ */

// CORS Configuration
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logger (Development & Production)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

/* ===============================
   ROUTES SETUP
================================ */

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');
const chatRoutes = require('./routes/chat');
const s3ExcelRoutes = require('./routes/s3Excel');
const mailRoutes = require('./routes/mail');

// Health check routes
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ OPTI Backend is running',
    version: '1.0.0',
    environment: NODE_ENV,
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend OK ✅',
    database: 'MySQL (AWS)',
    secrets: 'AWS Secrets Manager',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/s3', s3ExcelRoutes);
app.use('/api/mail', mailRoutes);

/* ===============================
   404 NOT FOUND HANDLER
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
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
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);
  
  // MySQL/Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry - resource already exists',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference - related resource not found',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token - please login again',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired - please login again',
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  // AWS Secrets Manager errors
  if (err.name === 'ResourceNotFoundException') {
    return res.status(500).json({
      success: false,
      message: 'Configuration error - please contact administrator',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ===============================
   UNCAUGHT EXCEPTION HANDLER
================================ */
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  process.exit(1);
});

/* ===============================
   SERVER STARTUP
================================ */
const startServer = async () => {
  try {
    // Connect to MySQL Database
    console.log('🔌 Connecting to MySQL database...');
    await connectDB();

    // Start Express Server
    const server = app.listen(PORT, HOST, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║                                                  ║');
      console.log('║        🚀 OPTI BACKEND SERVER RUNNING           ║');
      console.log('║                                                  ║');
      console.log('╚══════════════════════════════════════════════════╝');
      console.log('');
      console.log(`📍 Server URL:        http://${HOST}:${PORT}`);
      console.log(`🌍 Environment:       ${NODE_ENV}`);
      console.log(`🗄️  Database:          MySQL (AWS)`);
      console.log(`🔐 Secrets:           AWS Secrets Manager`);
      console.log(`🌐 Frontend URL:      ${FRONTEND_URL}`);
      console.log(`📡 Health Check:      http://${HOST}:${PORT}/health`);
      console.log('');
      console.log('Available API Routes:');
      console.log('  • POST   /api/auth/admin/login');
      console.log('  • POST   /api/auth/user/login');
      console.log('  • POST   /api/admin/register');
      console.log('  • GET    /api/users');
      console.log('  • POST   /api/users');
      console.log('  • POST   /api/chat');
      console.log('  • GET    /api/s3');
      console.log('  • POST   /api/mail');
      console.log('');
      console.log('✅ Server ready to accept requests!');
      console.log('');
    });

    // Graceful Shutdown Handlers
    process.on('unhandledRejection', (err) => {
      console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
      console.error('Error:', err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed. Process terminated.');
      });
    });

    process.on('SIGINT', () => {
      console.log('\n👋 SIGINT received. Shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed. Process terminated.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();

/* ===============================
   PROCESS INFO (OPTIONAL)
================================ */
if (NODE_ENV === 'development') {
  console.log('\n📊 Process Info:');
  console.log(`  • Node Version:    ${process.version}`);
  console.log(`  • Platform:        ${process.platform}`);
  console.log(`  • PID:             ${process.pid}`);
  console.log(`  • Memory Usage:    ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log('');
}

module.exports = app;
