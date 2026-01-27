const createTransporter = require('../config/email');
const { getEmailCredentials } = require('../config/secretsManager');

// Send email utility
const sendEmail = async (options) => {
  try {
    const transporter = await createTransporter();
    const emailConfig = await getEmailCredentials();

    const mailOptions = {
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Send user credentials email
const sendCredentialsEmail = async (email, name, password) => {
  const subject = 'Your OPTI Account Credentials';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .credentials { background-color: #fff; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to OPTI!</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>Your account has been created successfully. Here are your login credentials:</p>
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          <p><strong>Important:</strong> You will be required to change your password on first login for security reasons.</p>
          <p>Please keep these credentials secure and do not share them with anyone.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} OPTI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// Send OTP email
const sendOTPEmail = async (email, otp) => {
  const subject = 'Your OPTI Password Reset OTP';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .otp-box { background-color: #fff; padding: 20px; text-align: center; border: 2px dashed #2196F3; margin: 20px 0; }
        .otp { font-size: 32px; font-weight: bold; color: #2196F3; letter-spacing: 5px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .warning { color: #f44336; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>We received a request to reset your password. Use the OTP below to complete the password reset process:</p>
          <div class="otp-box">
            <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
            <p class="otp">${otp}</p>
            <p style="margin: 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
          </div>
          <p class="warning">⚠️ If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <p>This OTP will expire in 10 minutes for security reasons.</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} OPTI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

// Send password change confirmation email
const sendPasswordChangeEmail = async (email, name) => {
  const subject = 'Your OPTI Password Has Been Changed';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .success-box { background-color: #E8F5E9; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .warning { color: #f44336; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✓ Password Changed Successfully</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <div class="success-box">
            <p style="margin: 0;"><strong>✓ Your password has been changed successfully.</strong></p>
          </div>
          <p>Your account password was changed on ${new Date().toLocaleString()}.</p>
          <p class="warning">⚠️ If you did not make this change, please contact our support team immediately.</p>
          <p>For security reasons, we recommend:</p>
          <ul>
            <li>Using a unique password for your OPTI account</li>
            <li>Not sharing your password with anyone</li>
            <li>Changing your password regularly</li>
          </ul>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
          <p>&copy; ${new Date().getFullYear()} OPTI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({ to: email, subject, html });
};

module.exports = {
  sendCredentialsEmail,
  sendOTPEmail,
  sendPasswordChangeEmail,
};
