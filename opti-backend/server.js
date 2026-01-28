"use strict";

require("dotenv").config();

const app = require("./src/app");
const { connectDB } = require("./src/config/database");

/* ===============================
   CONFIGURATION
================================ */
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

/* ===============================
   SERVER STATE
================================ */
let server;
let isShuttingDown = false;

/* ===============================
   GLOBAL ERROR HANDLERS
================================ */

// Synchronous errors
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION");
  console.error(err.stack || err);
  process.exit(1); // Exit code must be a number
});

// Async promise errors
process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED PROMISE REJECTION");
  console.error(err.stack || err);
  gracefulShutdown(1);
});

/* ===============================
   START SERVER
================================ */
async function startServer() {
  try {
    console.log("🔌 Connecting to MySQL database...");
    await connectDB();
    console.log("✅ Database connected");

    server = app.listen(PORT, HOST, logStartup);
  } catch (error) {
    console.error("❌ Server startup failed");
    console.error(error.stack || error);
    process.exit(1);
  }
}

/* ===============================
   GRACEFUL SHUTDOWN
================================ */
function gracefulShutdown(exitCode = 0) {
  // Ensure exitCode is a number
  const numericExitCode = typeof exitCode === 'number' ? exitCode : 0;
  
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("👋 Graceful shutdown initiated...");

  if (!server) {
    process.exit(numericExitCode);
    return;
  }

  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(numericExitCode);
  });

  // Force exit if stuck (PM2 safety)
  setTimeout(() => {
    console.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

/* ===============================
   SIGNAL HANDLERS
================================ */
// PM2 / Docker / Kubernetes signals
process.on("SIGTERM", () => {
  console.log("📡 SIGTERM received");
  gracefulShutdown(0);
});

// Ctrl+C signal
process.on("SIGINT", () => {
  console.log("📡 SIGINT received");
  gracefulShutdown(0);
});

/* ===============================
   START SERVER
================================ */
startServer();

/* ===============================
   STARTUP LOGGING
================================ */
function logStartup() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║                                                  ║");
  console.log("║        🚀 OPTI BACKEND SERVER RUNNING           ║");
  console.log("║                                                  ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  console.log(`📍 Server URL:        http://${HOST}:${PORT}`);
  console.log(`🌍 Environment:       ${NODE_ENV}`);
  console.log(`🗄️  Database:          MySQL (AWS)`);
  console.log(`🔐 Secrets:           AWS Secrets Manager`);
  console.log(`🌐 Frontend URL:      ${process.env.FRONTEND_URL || "Not configured"}`);
  console.log(`📡 Health Check:      http://${HOST}:${PORT}/health`);
  console.log("");
  console.log("Available API Routes:");
  console.log("  • POST   /api/auth/admin/login");
  console.log("  • POST   /api/auth/user/login");
  console.log("  • POST   /api/admin/register");
  console.log("  • GET    /api/users");
  console.log("  • POST   /api/users");
  console.log("  • POST   /api/chat");
  console.log("  • GET    /api/s3");
  console.log("  • POST   /api/mail");
  console.log("");
  console.log("✅ Server ready to accept requests!");
  console.log("");

  if (NODE_ENV === "development") {
    console.log("📊 Process Info:");
    console.log(`  • Node Version:    ${process.version}`);
    console.log(`  • Platform:        ${process.platform}`);
    console.log(`  • PID:             ${process.pid}`);
    console.log(
      `  • Memory Usage:    ${Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024
      )} MB`
    );
    console.log("");
  }
}

module.exports = app;
