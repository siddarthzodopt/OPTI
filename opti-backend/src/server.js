const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

/* ===============================
   CONFIG
================================ */
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// Frontend URL (IMPORTANT)
// Example: http://43.205.215.7:3000
const FRONTEND_URL = process.env.FRONTEND_URL;

/* ===============================
   MIDDLEWARES
================================ */

/**
 * ✅ CORS (FINAL, SAFE CONFIG)
 * - Allows browser to reach backend
 * - Prevents silent blocking
 */
app.use(
  cors({
    origin: FRONTEND_URL || "*", // allow all if not set
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logger (PM2 friendly)
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

/* ===============================
   ROUTES
================================ */
const chatRoutes = require("./routes/chat");
const s3ExcelRoutes = require("./routes/s3Excel");
const mailRoutes = require("./routes/mail");

app.use("/api/chat", chatRoutes);
app.use("/api/s3", s3ExcelRoutes);
app.use("/api/mail", mailRoutes);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.status(200).send("✅ OPTI backend running");
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend OK ✅",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ===============================
   404 HANDLER
================================ */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ===============================
   GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, HOST, () => {
  console.log(`🚀 OPTI Backend running on port ${PORT}`);
});
