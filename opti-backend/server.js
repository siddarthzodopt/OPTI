require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

/* ===============================
   CONFIGURATION
================================ */
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

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
      console.log(`🌐 Frontend URL:      ${process.env.FRONTEND_URL || 'Not configured'}`);
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
