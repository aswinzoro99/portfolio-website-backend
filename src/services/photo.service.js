const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_FILE = path.join(config.dataDir, 'photos.json');

function readPhotos() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch {
    // corrupt or missing file — fall through to default
  }
  return [];
}

function writePhotos(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function seedPhotos() {
  if (readPhotos().length === 0) {
    writePhotos([]);
  }
}

module.exports = { readPhotos, writePhotos, seedPhotos };
