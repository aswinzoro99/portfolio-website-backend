const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { seedAdmin } = require('./services/admin.service');
const authRoutes = require('./routes/auth.routes');
const photoRoutes = require('./routes/photo.routes');

seedAdmin().catch((error) => {
  console.error('Failed to seed admin account:', error);
});

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
      ],
      connectSrc: [
        "'self'",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://*.googleapis.com",
        "https://*.firebaseio.com",
        "https://www.gstatic.com",
      ],
    },
  },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/login', authLimiter);
app.use('/api/forgot-password', authLimiter);

app.use('/api', authRoutes);
app.use('/api/photos', photoRoutes);

module.exports = app;
