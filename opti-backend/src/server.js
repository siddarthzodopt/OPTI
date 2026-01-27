const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

/* ===============================
   CONFIG
================================ */
const PORT = process.env.PORT || 5000;

// ✅ Frontend URL (optional). If not set, allow all (dev)
const FRONTEND_URL = process.env.FRONTEND_URL || null;

/* ===============================
   MIDDLEWARES
================================ */
app.use(
  cors({
    origin: FRONTEND_URL ? [FRONTEND_URL] : true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ Simple request logger
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

/* ===============================
   ROUTES
================================ */
const chatRoutes = require("./routes/chat");
const s3ExcelRoutes = require("./routes/s3Excel");
const mailRoutes = require("./routes/mail"); // ✅ add this if you created mail routes

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
    time: new Date().toISOString(),
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
   START SERVER
================================ */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});

