const path = require('path');
const crypto = require('crypto');

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 8080,

  jwtSecret: process.env.JWT_SECRET || (isProduction
    ? (() => { throw new Error('JWT_SECRET is required in production'); })()
    : crypto.randomBytes(32).toString('hex')),

  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || '',

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },

  adminEmail: process.env.ADMIN_EMAIL || 'akshay1996ranjith@gmail.com',

  dataDir: path.resolve(process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data')),
  uploadsDir: path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', 'uploads')),

  uploadMaxSize: 20 * 1024 * 1024,
});

module.exports = config;
