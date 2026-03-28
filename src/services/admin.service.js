const crypto = require('crypto');
const config = require('../config');
const { db } = require('./firebase.service');

const ADMIN_COLLECTION = 'admin';
const ADMIN_DOC_ID = 'default';

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

async function readAdmin() {
  const doc = await db.collection(ADMIN_COLLECTION).doc(ADMIN_DOC_ID).get();
  if (!doc.exists) return null;
  return doc.data();
}

async function writeAdmin(data) {
  await db.collection(ADMIN_COLLECTION).doc(ADMIN_DOC_ID).set(data);
}

async function seedAdmin() {
  const existingAdmin = await readAdmin();
  if (existingAdmin) return;

  const defaultPassword = config.adminDefaultPassword;
  if (!defaultPassword) {
    console.error('No admin account found. Set ADMIN_DEFAULT_PASSWORD env var to create one on startup.');
    return;
  }

  await writeAdmin({
    username: 'akshay',
    password: hashPassword(defaultPassword),
    email: config.adminEmail,
    resetToken: null,
    resetExpiry: null,
  });
  console.log('Default admin created (username: akshay). Change the password after first login.');
}

module.exports = { hashPassword, verifyPassword, readAdmin, writeAdmin, seedAdmin };
