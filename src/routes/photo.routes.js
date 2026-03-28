const { Router } = require('express');
const requireAuth = require('../middleware/auth');
const {
  readPhotos,
  writePhotos,
  addPhoto,
  deletePhoto,
  updatePhoto,
} = require('../services/photo.service');

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const photos = await readPhotos();
    res.json(photos);
  } catch (error) {
    console.error('Failed to read photos:', error);
    res.status(500).json({ error: 'Failed to load photos' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const photos = await readPhotos();
    const id = String(Date.now());
    const title = req.body.title || 'Untitled';
    const desc = req.body.desc || '';
    const url = req.body.url;

    if (!url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    const photo = {
      id,
      title,
      url,
      desc,
      order: photos.length,
      createdAt: Date.now(),
    };

    await addPhoto(photo);
    res.json(photo);
  } catch (error) {
    console.error('Failed to add photo:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

router.put('/reorder', requireAuth, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order must be an array of photo IDs' });
    }

    const photos = await readPhotos();
    const normalizedOrder = order.map(String);
    const map = new Map(photos.map((p) => [String(p.id), p]));
    const reordered = normalizedOrder.map((id) => map.get(id)).filter(Boolean);

    photos.forEach((p) => {
      if (!normalizedOrder.includes(String(p.id))) reordered.push(p);
    });

    const reorderedWithOrder = reordered.map((photo, index) => ({ ...photo, order: index }));
    await writePhotos(reorderedWithOrder);
    res.json(reorderedWithOrder);
  } catch (error) {
    console.error('Failed to reorder photos:', error);
    res.status(500).json({ error: 'Failed to reorder photos' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  try {
    const photos = await readPhotos();
    const id = String(req.params.id);
    const existing = photos.find((p) => String(p.id) === id);

    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.desc !== undefined) updates.desc = req.body.desc;
    if (req.body.url !== undefined) updates.url = req.body.url;

    await updatePhoto(id, updates);
    res.json({ ...existing, ...updates, id });
  } catch (error) {
    console.error('Failed to update photo:', error);
    res.status(500).json({ error: 'Failed to update photo' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const photos = await readPhotos();
    const id = String(req.params.id);
    const photo = photos.find((p) => String(p.id) === id);

    if (!photo) {
      return res.status(404).json({ error: 'Not found' });
    }

    await deletePhoto(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

module.exports = router;
