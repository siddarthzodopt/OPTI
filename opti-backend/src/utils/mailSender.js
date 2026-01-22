const { transporter } = require("../config/mail");

const sendMail = async ({ to, subject, html, text }) => {
  const fromName = process.env.MAIL_FROM_NAME || "OPTI";
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

  return await transporter.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendMail };
