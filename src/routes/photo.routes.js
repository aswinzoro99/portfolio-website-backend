const { Router } = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const requireAuth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { readPhotos, writePhotos } = require('../services/photo.service');

const router = Router();

router.get('/', (_req, res) => {
  res.json(readPhotos());
});

router.post('/', requireAuth, upload.single('image'), (req, res) => {
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

router.put('/:id', requireAuth, upload.single('image'), (req, res) => {
  const photos = readPhotos();
  const idx = photos.findIndex((p) => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  if (req.body.title !== undefined) photos[idx].title = req.body.title;
  if (req.body.desc !== undefined) photos[idx].desc = req.body.desc;

  if (req.file) {
    if (photos[idx].url.startsWith('/uploads/')) {
      const old = path.join(config.uploadsDir, path.basename(photos[idx].url));
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    photos[idx].url = '/uploads/' + req.file.filename;
  }

  writePhotos(photos);
  res.json(photos[idx]);
});

router.delete('/:id', requireAuth, (req, res) => {
  let photos = readPhotos();
  const photo = photos.find((p) => p.id === Number(req.params.id));
  if (!photo) return res.status(404).json({ error: 'Not found' });

  if (photo.url.startsWith('/uploads/')) {
    const fp = path.join(config.uploadsDir, path.basename(photo.url));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  photos = photos.filter((p) => p.id !== Number(req.params.id));
  writePhotos(photos);
  res.json({ ok: true });
});

module.exports = router;
