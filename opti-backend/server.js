require("dotenv").config();

const app = require("./src/app");
const { connectDB } = require("./src/config/database");

/* ===============================
   CONFIG
================================ */
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

/* ===============================
   GLOBAL ERROR HANDLERS
================================ */

// Sync errors
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION");
  console.error(err);
  process.exit(1);
});

// Async promise errors
process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED PROMISE REJECTION");
  console.error(err);
  shutdown(1);
});

/* ===============================
   SERVER INSTANCE
================================ */
let server;

/* ===============================
   START SERVER
================================ */
async function startServer() {
  try {
    console.log("🔌 Connecting to MySQL database...");
    await connectDB();
    console.log("✅ Database connected");

    server = app.listen(PORT, HOST, () => {
      logStartup();
    });
  } catch (error) {
    console.error("❌ Server startup failed");
    console.error(error);
    process.exit(1);
  }
}

/* ===============================
   GRACEFUL SHUTDOWN
================================ */
function shutdown(exitCode = 0) {
  if (!server) process.exit(exitCode);

  console.log("👋 Shutting down server...");
  server.close(() => {
    console.log("✅ HTTP server closed");
    process.exit(exitCode);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

/* ===============================
   START
================================ */
startServer();

/* ===============================
   LOGGING
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
  console.log(`🗄️  Database:          MySQL (AWS RDS)`);
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
  console.log("✅ Server ready to accept requests");
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
