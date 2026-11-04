/**
 * Validation utilities for Pan India E-Commerce
 */

/**
 * Validate 6-digit Indian PIN Code
 * Indian pincodes are 6 digits, first digit is 1-9
 */
export const validatePincode = (pincode) => {
  if (!pincode) return { isValid: false, message: 'PIN code is required' };
  const cleaned = pincode.toString().trim();
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  if (!pincodeRegex.test(cleaned)) {
    return {
      isValid: false,
      message: 'Enter a valid 6-digit Indian PIN code (e.g. 110001)',
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Validate 10-digit Indian Mobile Number
 * Starts with 6, 7, 8, or 9
 */
export const validateIndianMobile = (mobile) => {
  if (!mobile) return { isValid: false, message: 'Mobile number is required' };
  const cleaned = mobile.toString().replace(/[^0-9]/g, '');
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(cleaned)) {
    return {
      isValid: false,
      message: 'Enter a valid 10-digit Indian mobile number',
    };
  }
  return { isValid: true, message: '', cleaned };
};

/**
 * Validate Email address
 */
export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'Email is required' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Enter a valid email address' };
  }
  return { isValid: true, message: '' };
};

/**
 * Validate Name
 */
export const validateName = (name, fieldName = 'Name') => {
  if (!name || name.trim().length < 2) {
    return { isValid: false, message: `${fieldName} must be at least 2 characters` };
  }
  return { isValid: true, message: '' };
};

/**
 * Validate OTP
 */
export const validateOTP = (otp, length = 6) => {
  if (!otp) return { isValid: false, message: 'OTP is required' };
  const cleaned = otp.toString().trim();
  const otpRegex = new RegExp(`^\\d{${length}}$`);
  if (!otpRegex.test(cleaned)) {
    return { isValid: false, message: `Enter a valid ${length}-digit OTP` };
  }
  return { isValid: true, message: '' };
};

/**
 * Validate Address Fields
 */
export const validateAddress = (address) => {
  const errors = {};

  const nameVal = validateName(address.fullName, 'Full name');
  if (!nameVal.isValid) errors.fullName = nameVal.message;

  const mobileVal = validateIndianMobile(address.mobileNumber);
  if (!mobileVal.isValid) errors.mobileNumber = mobileVal.message;

  const pinVal = validatePincode(address.pincode);
  if (!pinVal.isValid) errors.pincode = pinVal.message;

  if (!address.streetAddress || address.streetAddress.trim().length < 5) {
    errors.streetAddress = 'House No., Building, Street is required (min 5 chars)';
  }

  if (!address.city || address.city.trim().length < 2) {
    errors.city = 'City / District is required';
  }

  if (!address.state || address.state.trim().length < 2) {
    errors.state = 'State is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate Password
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password) return { isValid: false, message: 'Password is required' };
  if (password.length < minLength) {
    return { isValid: false, message: `Password must be at least ${minLength} characters` };
  }
  return { isValid: true, message: '' };
};

export default {
  validatePincode,
  validateIndianMobile,
  validateEmail,
  validateName,
  validateOTP,
  validateAddress,
  validatePassword,
};

