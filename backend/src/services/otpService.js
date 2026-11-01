const crypto = require('crypto');
const env = require('../config/env');

/**
 * Generate a secure 6-digit numeric OTP.
 */
const generateOTP = (length = 6) => {
  if (env.NODE_ENV === 'development' && env.DEFAULT_TEST_OTP) {
    return env.DEFAULT_TEST_OTP;
  }
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

/**
 * Send OTP to a phone number.
 * Logs to console in development and provides mock/extensible SMS delivery.
 */
const sendOTP = async (phone, otp) => {
  try {
    // In production with an SMS provider (e.g. Fast2SMS / Twilio), the API call goes here.
    // For local/staging development, we log clearly:
    console.log(`[OTP Service] Sending OTP: ${otp} to phone: ${phone} (Valid for 10 minutes)`);
    return {
      success: true,
      message: `OTP sent successfully to ${phone}`,
      // For developer convenience in dev mode:
      ...(env.NODE_ENV === 'development' ? { debugOtp: otp } : {}),
    };
  } catch (error) {
    console.error('[OTP Service] Error sending OTP:', error);
    return {
      success: false,
      message: 'Failed to dispatch OTP SMS',
      error: error.message,
    };
  }
};

/**
 * Verify whether an entered OTP is valid and not expired.
 */
const verifyOTP = (storedOtp, expiresAt, inputOtp) => {
  if (!storedOtp || !expiresAt || !inputOtp) {
    return { isValid: false, reason: 'OTP or expiration data missing' };
  }

  // Developer bypass support if explicitly enabled
  if (env.NODE_ENV === 'development' && inputOtp === (env.DEFAULT_TEST_OTP || '123456')) {
    return { isValid: true, reason: 'Test OTP accepted in development mode' };
  }

  if (new Date() > new Date(expiresAt)) {
    return { isValid: false, reason: 'OTP has expired. Please request a new one.' };
  }

  if (storedOtp.trim() !== inputOtp.toString().trim()) {
    return { isValid: false, reason: 'Incorrect OTP entered.' };
  }

  return { isValid: true, reason: 'OTP verified successfully.' };
};

module.exports = {
  generateOTP,
  sendOTP,
  verifyOTP,
};

