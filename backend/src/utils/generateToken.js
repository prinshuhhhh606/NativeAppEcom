/**
 * JWT Access and Refresh Token Generator
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateAccessToken = (userId, role = 'customer', expiresIn = env.JWT.ACCESS_EXPIRES_IN) => {
  return jwt.sign(
    { id: userId, role },
    env.JWT.ACCESS_SECRET,
    { expiresIn: expiresIn || '30d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    env.JWT.REFRESH_SECRET,
    { expiresIn: env.JWT.REFRESH_EXPIRES_IN }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT.ACCESS_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT.REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

