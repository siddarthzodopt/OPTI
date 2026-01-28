const express = require("express");
const cors = require("cors");

const app = express();

/* ===============================
   MIDDLEWARES
================================ */
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   ROUTES (MATCH ACTUAL FILE NAMES)
================================ */
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const chatRoutes = require("./routes/chat");
const s3ExcelRoutes = require("./routes/s3Excel");
const mailRoutes = require("./routes/mail");

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
   HEALTH CHECK
================================ */
app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "OK" });
});

module.exports = app;
