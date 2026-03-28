const multer = require('multer');
const config = require('../config');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: config.uploadMaxSize },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

module.exports = upload;
