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

// Frontend URL (set in production)
const FRONTEND_URL = process.env.FRONTEND_URL;

/* ===============================
   MIDDLEWARES
================================ */

// CORS configuration
app.use(
  cors({
    origin: FRONTEND_URL || true, // allow all if not set (dev)
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Simple request logger (PM2 friendly)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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
    message: `Route not found: ${req.method} ${req.url}`,
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
   START SERVER (PRODUCTION SAFE)
================================ */
app.listen(PORT, HOST, () => {
  console.log(`🚀 OPTI Backend running on port ${PORT}`);
});
