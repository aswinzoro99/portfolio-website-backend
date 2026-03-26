const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { seedAdmin } = require('./services/admin.service');
const { seedPhotos } = require('./services/photo.service');
const authRoutes = require('./routes/auth.routes');
const photoRoutes = require('./routes/photo.routes');

if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

seedAdmin();
seedPhotos();

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(config.uploadsDir));

app.use('/api', authRoutes);
app.use('/api/photos', photoRoutes);

module.exports = app;
