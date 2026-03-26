const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../config');
const { readAdmin, writeAdmin, verifyPassword, hashPassword } = require('../services/admin.service');
const { getTransporter } = require('../services/email.service');

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const admin = readAdmin();
  if (!admin) return res.status(500).json({ error: 'Admin not configured' });
  if (username !== admin.username || !verifyPassword(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  const token = jwt.sign({ username: admin.username }, config.jwtSecret, { expiresIn: '2h' });
  res.json({ ok: true, token });
});

router.post('/forgot-password', async (req, res) => {
  const { username } = req.body;
  const admin = readAdmin();
  if (!admin || username !== admin.username) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = uuidv4().slice(0, 8).toUpperCase();
  const expiry = Date.now() + 15 * 60 * 1000;
  admin.resetToken = token;
  admin.resetExpiry = expiry;
  writeAdmin(admin);

  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: `"Akshay Ranjith Portfolio" <noreply@akshayranjith.com>`,
      to: admin.email,
      subject: 'Password Reset Token',
      text: `Your password reset token is: ${token}\n\nThis token expires in 15 minutes.\n\nIf you did not request this, ignore this email.`,
      html: `<div style="font-family:sans-serif;max-width:400px">
        <h2 style="font-weight:400;letter-spacing:.2em;font-size:14px;text-transform:uppercase">Password Reset</h2>
        <p style="color:#555;font-size:13px">Your reset token:</p>
        <div style="background:#f5f5f5;padding:16px;font-size:24px;letter-spacing:.3em;text-align:center;font-weight:500;margin:16px 0">${token}</div>
        <p style="color:#999;font-size:12px">This token expires in 15 minutes. If you did not request this, ignore this email.</p>
      </div>`,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (config.nodeEnv !== 'production') {
      if (previewUrl) console.log('Reset email preview:', previewUrl);
      console.log('Reset token:', token);
    }
    res.json({ message: 'Reset token sent to admin email. Check your inbox.', preview: previewUrl || undefined });
  } catch (err) {
    console.error('Email send failed:', err);
    if (config.nodeEnv !== 'production') {
      console.log('Reset token (fallback):', token);
    }
    res.json({ message: 'Reset token sent to admin email. Check your inbox.' });
  }
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  const admin = readAdmin();
  if (!admin) return res.status(500).json({ error: 'Admin not configured' });
  if (!admin.resetToken || !admin.resetExpiry) {
    return res.status(400).json({ error: 'No reset request found. Request a new one.' });
  }
  if (Date.now() > admin.resetExpiry) {
    admin.resetToken = null;
    admin.resetExpiry = null;
    writeAdmin(admin);
    return res.status(400).json({ error: 'Token expired. Request a new one.' });
  }
  if (token.toUpperCase() !== admin.resetToken) {
    return res.status(400).json({ error: 'Invalid token' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  admin.password = hashPassword(password);
  admin.resetToken = null;
  admin.resetExpiry = null;
  writeAdmin(admin);
  console.log('Admin password has been reset successfully.');
  res.json({ ok: true, message: 'Password reset successful' });
});

module.exports = router;
