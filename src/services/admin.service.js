const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const ADMIN_FILE = path.join(config.dataDir, 'admin.json');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === test;
}

function readAdmin() {
  try {
    if (fs.existsSync(ADMIN_FILE)) {
      return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
    }
  } catch {
    // corrupt or missing file — fall through to default
  }
  return null;
}

function writeAdmin(data) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(data, null, 2));
}

function seedAdmin() {
  if (!readAdmin()) {
    writeAdmin({
      username: 'akshay',
      password: hashPassword('admin123'),
      email: config.adminEmail,
      resetToken: null,
      resetExpiry: null,
    });
    console.log('Default admin created: akshay / admin123');
  }
}

module.exports = { hashPassword, verifyPassword, readAdmin, writeAdmin, seedAdmin };
