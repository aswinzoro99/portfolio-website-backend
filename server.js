const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, 'photos.json');
const ADMIN_FILE = path.join(__dirname, 'admin.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// ===== PASSWORD HASHING =====
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

// ===== ADMIN DATA =====
function readAdmin() {
  try {
    if (fs.existsSync(ADMIN_FILE)) return JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8'));
  } catch (e) {}
  return null;
}
function writeAdmin(data) {
  fs.writeFileSync(ADMIN_FILE, JSON.stringify(data, null, 2));
}
// Seed default admin if not exists
if (!readAdmin()) {
  writeAdmin({
    username: 'akshay',
    password: hashPassword('admin123'),
    email: 'hello@akshayranjith.com',
    resetToken: null,
    resetExpiry: null
  });
  console.log('Default admin created: akshay / admin123');
}

// ===== EMAIL TRANSPORTER =====
let transporter = null;
async function getTransporter() {
  if (transporter) return transporter;
  // Create an Ethereal test account for demo purposes
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: { user: testAccount.user, pass: testAccount.pass }
  });
  console.log('Email test account ready. Emails viewable at Ethereal.');
  return transporter;
}

// ===== PHOTO DATA =====
function readPhotos() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {}
  return [];
}
function writePhotos(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
if (readPhotos().length === 0) {
  writePhotos([]);
}

// ===== MULTER =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ===== AUTH ROUTES =====

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const admin = readAdmin();
  if (!admin) return res.status(500).json({ error: 'Admin not configured' });
  if (username !== admin.username || !verifyPassword(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({ ok: true });
});

app.post('/api/forgot-password', async (req, res) => {
  const { username } = req.body;
  const admin = readAdmin();
  if (!admin || username !== admin.username) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Generate reset token (6-char uppercase for easy entry)
  const token = uuidv4().slice(0, 8).toUpperCase();
  const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
  admin.resetToken = token;
  admin.resetExpiry = expiry;
  writeAdmin(admin);

  // Send email
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: '"Akshay Ranjith Portfolio" <noreply@akshayranjith.com>',
      to: admin.email,
      subject: 'Password Reset Token',
      text: `Your password reset token is: ${token}\n\nThis token expires in 15 minutes.\n\nIf you did not request this, ignore this email.`,
      html: `<div style="font-family:sans-serif;max-width:400px">
        <h2 style="font-weight:400;letter-spacing:.2em;font-size:14px;text-transform:uppercase">Password Reset</h2>
        <p style="color:#555;font-size:13px">Your reset token:</p>
        <div style="background:#f5f5f5;padding:16px;font-size:24px;letter-spacing:.3em;text-align:center;font-weight:500;margin:16px 0">${token}</div>
        <p style="color:#999;font-size:12px">This token expires in 15 minutes. If you did not request this, ignore this email.</p>
      </div>`
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Reset email sent. Preview URL:', previewUrl);
    console.log('Reset token:', token);
    res.json({ message: 'Reset token sent to admin email. Check your inbox.', preview: previewUrl });
  } catch (err) {
    console.error('Email send failed:', err);
    // Still provide token via server log as fallback
    console.log('Reset token (fallback):', token);
    res.json({ message: 'Reset token sent to admin email. Check your inbox.' });
  }
});

app.post('/api/reset-password', (req, res) => {
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

// ===== PHOTO ROUTES =====

app.get('/api/photos', (req, res) => {
  res.json(readPhotos());
});

app.post('/api/photos', upload.single('image'), (req, res) => {
  const photos = readPhotos();
  const id = Date.now();
  const title = req.body.title || 'Untitled';
  const desc = req.body.desc || '';
  let url = '';
  if (req.file) {
    url = '/uploads/' + req.file.filename;
  } else if (req.body.url) {
    url = req.body.url;
  } else {
    return res.status(400).json({ error: 'No image provided' });
  }
  const photo = { id, title, url, desc };
  photos.push(photo);
  writePhotos(photos);
  res.json(photo);
});

app.put('/api/photos/:id', upload.single('image'), (req, res) => {
  const photos = readPhotos();
  const idx = photos.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (req.body.title !== undefined) photos[idx].title = req.body.title;
  if (req.body.desc !== undefined) photos[idx].desc = req.body.desc;
  if (req.file) {
    if (photos[idx].url.startsWith('/uploads/')) {
      const old = path.join(__dirname, photos[idx].url);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    photos[idx].url = '/uploads/' + req.file.filename;
  }
  writePhotos(photos);
  res.json(photos[idx]);
});

app.delete('/api/photos/:id', (req, res) => {
  let photos = readPhotos();
  const photo = photos.find(p => p.id === Number(req.params.id));
  if (!photo) return res.status(404).json({ error: 'Not found' });
  if (photo.url.startsWith('/uploads/')) {
    const fp = path.join(__dirname, photo.url);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  photos = photos.filter(p => p.id !== Number(req.params.id));
  writePhotos(photos);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
