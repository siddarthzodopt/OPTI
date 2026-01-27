const jwt = require('jsonwebtoken');
const { getJWTSecrets } = require('./secretsManager');

let jwtConfig = null;

// Initialize JWT config
const initJWTConfig = async () => {
  if (!jwtConfig) {
    jwtConfig = await getJWTSecrets();
  }
  return jwtConfig;
};

// Generate JWT token
const generateToken = async (id, role) => {
  const config = await initJWTConfig();
  return jwt.sign(
    { id, role },
    config.jwt_secret,
    { expiresIn: config.jwt_expire }
  );
};

// Generate refresh token
const generateRefreshToken = async (id) => {
  const config = await initJWTConfig();
  return jwt.sign(
    { id },
    config.jwt_refresh_secret,
    { expiresIn: config.jwt_refresh_expire }
  );
};

// Verify token
const verifyToken = async (token) => {
  const config = await initJWTConfig();
  try {
    return jwt.verify(token, config.jwt_secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
  const config = await initJWTConfig();
  try {
    return jwt.verify(token, config.jwt_refresh_secret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};
