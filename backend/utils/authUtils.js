const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Generate random token
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Generate 2FA secret
const generateTwoFactorSecret = (email) => {
  return speakeasy.generateSecret({
    name: `CollabHub (${email})`,
    length: 20
  });
};

// Generate QR code for 2FA
const generateQRCode = async (secret) => {
  return await QRCode.toDataURL(secret.otpauth_url);
};

// Verify 2FA token
const verifyTwoFactorToken = (secret, token) => {
  if (!secret) return false;
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
};

module.exports = {
  generateRandomToken,
  generateTwoFactorSecret,
  generateQRCode,
  verifyTwoFactorToken
};