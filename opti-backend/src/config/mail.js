const nodemailer = require("nodemailer");

if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
  console.warn("⚠️ SMTP credentials missing. Check SMTP_USER / SMTP_PASSWORD in .env");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.in",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // ✅ Zoho uses STARTTLS on 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ✅ Fixed sender configuration
const EMAIL_CONFIG = {
  from: {
    name: process.env.SENDER_NAME || "OPTI - Lead Intelligence",
    email: process.env.SMTP_USER, // Always use the authenticated SMTP user
  },
  footer: `
---
Best regards,
${process.env.SENDER_NAME || "OPTI Team"}

This email was sent via OPTI Lead Intelligence Platform
To unsubscribe or manage preferences, please contact us.
  `.trim(),
};

module.exports = { transporter, EMAIL_CONFIG };