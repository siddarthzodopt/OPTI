const express = require("express");
const cors = require("cors");
require("dotenv").config();

/* ===============================
   IMPORT MIDDLEWARE
================================ */
const errorHandler = require("./src/middleware/errorHandler");

/* ===============================
   IMPORT ROUTES
================================ */
// Authentication & User Management
const authRoutes = require("./src/routes/auth.routes");
const adminRoutes = require("./src/routes/adminRoutes");
const userRoutes = require("./src/routes/userRoutes");

// Application Routes
const chatRoutes = require("./src/routes/chat");
const s3ExcelRoutes = require("./src/routes/s3Excel");
const mailRoutes = require("./src/routes/mail");

/* ===============================
   APP INITIALIZATION
================================ */
const app = express();

/* ===============================
   CONFIG
================================ */
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

/* ===============================
   MIDDLEWARES
================================ */

// CORS
app.use(
  cors({
    origin: FRONTEND_URL === "*" ? true : FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logger
app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

/* ===============================
   HEALTH & INFO
================================ */

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "✅ OPTI Backend is running",
    version: "1.0.0",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend OK ✅",
    uptime: Math.floor(process.uptime()),
    environment: NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
  });
});

app.get("/api", (_req, res) => {
  res.json({
    success: true,
    message: "OPTI API v1",
    routes: [
      "/api/auth",
      "/api/admin",
      "/api/users",
      "/api/chat",
      "/api/s3",
      "/api/mail",
    ],
  });
});

/* ===============================
   API ROUTES
================================ */

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/s3", s3ExcelRoutes);
app.use("/api/mail", mailRoutes);

/* ===============================
   404 HANDLER
================================ */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    hint: "Check GET /api for available endpoints",
  });
});

/* ===============================
   ERROR HANDLER
================================ */

app.use(errorHandler);

/* ===============================
   START SERVER
================================ */

app.listen(PORT, HOST, () => {
  console.log(`🚀 OPTI Backend running on ${HOST}:${PORT}`);
});
