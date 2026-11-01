const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

if (env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(env.SMTP_PORT, 10) || 587,
    secure: env.SMTP_PORT == 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

/**
 * Send an email using configured transporter or log gracefully in development.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: `"${env.APP_NAME || 'Pan India E-Commerce'}" <${env.FROM_EMAIL || 'no-reply@appecom.in'}>`,
    to,
    subject,
    text: text || '',
    html: html || '',
  };

  if (!transporter) {
    console.log(`[Email Service (Mock)] To: ${to} | Subject: ${subject}`);
    return { success: true, mock: true, message: 'Email logged in console (SMTP not configured)' };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Service] Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user.
 */
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: `Welcome to ${env.APP_NAME || 'Pan India Store'}!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2874F0;">Welcome to ${env.APP_NAME || 'Pan India Store'}, ${user.name}!</h2>
        <p>Your account has been created successfully. Explore millions of products delivered right to your doorstep across India.</p>
        <p>Happy Shopping!<br/>Team ${env.APP_NAME || 'Pan India Store'}</p>
      </div>
    `,
  });
};

/**
 * Send order confirmation email.
 */
const sendOrderConfirmationEmail = async (user, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name} (${item.variant?.size || ''} ${item.variant?.color || ''})</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">x ${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join('');

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed: #${order.orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #388E3C;">Order Confirmed!</h2>
        <p>Dear ${user.name}, thank you for your order. We have received your order <strong>#${order.orderId}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <thead>
            <tr style="background: #f7f7f7;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: left;">Qty</th>
              <th style="padding: 8px; text-align: left;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <h3 style="margin-top: 20px;">Total Amount: ₹${order.pricing.grandTotal}</h3>
        <p>Delivery to: ${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pinCode}</p>
      </div>
    `,
  });
};

/**
 * Send password reset OTP or link email.
 */
const sendPasswordResetEmail = async (user, resetOtp) => {
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Password Reset Code</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Use the verification code below to complete the reset process:</p>
        <h1 style="color: #2874F0; letter-spacing: 4px;">${resetOtp}</h1>
        <p>This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
};

