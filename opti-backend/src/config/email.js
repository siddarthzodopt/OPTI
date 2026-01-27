const nodemailer = require('nodemailer');
const { getEmailCredentials } = require('./secretsManager');

let emailConfig = null;

// Initialize email config
const initEmailConfig = async () => {
  if (!emailConfig) {
    emailConfig = await getEmailCredentials();
  }
  return emailConfig;
};

// Create email transporter
const createTransporter = async () => {
  const config = await initEmailConfig();
  
  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
};

module.exports = createTransporter;
