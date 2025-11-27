/**
 * Email Service
 * Handles sending emails for registration approvals, rejections, and password resets
 * 
 * NOTE: This is a placeholder implementation. In production, integrate with:
 * - SMTP (Gmail, SendGrid, AWS SES, etc.)
 * - Email templates with HTML formatting
 * - Retry logic and error handling
 */

const nodemailer = require('nodemailer');

// Configure transporter based on environment variables
let transporter = null;

function initializeTransporter() {
  if (transporter) return transporter;

  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailHost || !emailPort || !emailUser || !emailPass) {
    console.warn('[EMAIL] SMTP configuration incomplete. Email sending will use mock mode.');
    // Return mock transporter for development
    return {
      sendMail: async (options) => {
        console.log('[EMAIL - MOCK MODE]', {
          from: options.from,
          to: options.to,
          subject: options.subject,
          text: options.text ? options.text.substring(0, 200) : ''
        });
        return { messageId: `mock-${Date.now()}` };
      }
    };
  }

  try {
    transporter = nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailPort === 465, // true for 465, false for other ports
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    console.log('[EMAIL] SMTP transporter initialized successfully');
    return transporter;
  } catch (err) {
    console.error('[EMAIL] Failed to initialize transporter:', err.message);
    // Return mock transporter on failure
    return {
      sendMail: async (options) => {
        console.log('[EMAIL - FALLBACK MOCK MODE]', options.subject, 'to', options.to);
        return { messageId: `mock-${Date.now()}` };
      }
    };
  }
}

/**
 * Send registration approval email
 * @param {string} email - User email address
 * @param {string} name - User name
 * @returns {Promise<boolean>} - Success status
 */
async function sendApprovalEmail(email, name) {
  try {
    const transport = initializeTransporter();

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>Great news! Your registration has been approved by our admin team.</p>
              <p>Your account is now active and you can log in to start using the canteen ordering system.</p>
              <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Log In Now</a>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2025 JCKL Academy Canteen System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await transport.sendMail({
      from: process.env.EMAIL_USER || 'noreply@jckl-academy.local',
      to: email,
      subject: 'Account Approved - Welcome to JCKL Canteen',
      text: `Hi ${name},\n\nGreat news! Your registration has been approved by our admin team. You can now log in to the system.`,
      html: htmlContent,
    });

    console.log(`[EMAIL] Approval email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send approval email to ${email}:`, err.message);
    return false;
  }
}

/**
 * Send registration rejection email
 * @param {string} email - User email address
 * @param {string} name - User name
 * @param {string} reason - Rejection reason (optional)
 * @returns {Promise<boolean>} - Success status
 */
async function sendRejectionEmail(email, name, reason = '') {
  try {
    const transport = initializeTransporter();

    const reasonText = reason ? `\n\nReason: ${reason}` : '';

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .reason { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Status Update</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We regret to inform you that your registration has been reviewed and cannot be approved at this time.</p>
              ${reason ? `<div class="reason"><strong>Reason:</strong> ${reason}</div>` : ''}
              <p>Please review your information and consider reapplying, or contact us if you believe this is an error.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/register" class="button">Reapply</a>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2025 JCKL Academy Canteen System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await transport.sendMail({
      from: process.env.EMAIL_USER || 'noreply@jckl-academy.local',
      to: email,
      subject: 'Registration Status - JCKL Canteen',
      text: `Hi ${name},\n\nWe regret to inform you that your registration has been reviewed and cannot be approved at this time.${reasonText}`,
      html: htmlContent,
    });

    console.log(`[EMAIL] Rejection email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send rejection email to ${email}:`, err.message);
    return false;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email address
 * @param {string} name - User name
 * @param {string} resetToken - Reset token
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordResetEmail(email, name, resetToken) {
  try {
    const transport = initializeTransporter();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: white; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #2196F3; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background-color: #ffe0e0; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>
              <p>We received a request to reset your password. Click the button below to proceed:</p>
              <a href="${resetUrl}" class="button">Reset Password</a>
              <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 24 hours. If you did not request a password reset, please ignore this email or contact support.
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2025 JCKL Academy Canteen System</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await transport.sendMail({
      from: process.env.EMAIL_USER || 'noreply@jckl-academy.local',
      to: email,
      subject: 'Password Reset Request - JCKL Canteen',
      text: `Hi ${name},\n\nClick here to reset your password: ${resetUrl}\n\nThis link expires in 24 hours.`,
      html: htmlContent,
    });

    console.log(`[EMAIL] Password reset email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send password reset email to ${email}:`, err.message);
    return false;
  }
}

module.exports = {
  sendApprovalEmail,
  sendRejectionEmail,
  sendPasswordResetEmail,
  initializeTransporter,
};
