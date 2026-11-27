const nodemailer = require('nodemailer');

// More reliable email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // These help avoid spam filters
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"CollabHub" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      // Add these headers to avoid spam
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'CollabHub',
        'X-Originating-IP': '127.0.0.1'
      }
    });
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

// Send verification email with better formatting
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        .warning { color: #ef4444; font-size: 12px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CollabHub</h1>
          <p>Verify Your Email Address</p>
        </div>
        <div class="content">
          <h2>Welcome to CollabHub!</h2>
          <p>Thank you for signing up. Please verify your email address to get started.</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          <p style="font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="background: #e5e7eb; padding: 10px; font-family: monospace; word-break: break-all;">${verificationUrl}</p>
          <p class="warning">⚠️ This link expires in 24 hours.</p>
          <p>If you didn't create an account with CollabHub, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 CollabHub. All rights reserved.</p>
          <p>Need help? Contact us at support@collabhub.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, 'Verify Your CollabHub Account', html);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CollabHub</h1>
          <p>Reset Your Password</p>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Click the button below to create a new password.</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link:</p>
          <div class="code">${resetUrl}</div>
          <p><strong>⚠️ This link expires in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 CollabHub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail(email, 'Reset Your CollabHub Password', html);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };