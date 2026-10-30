import { Router } from 'express';
import mongoose from 'mongoose';
import { cases } from '../data/store.js';
import { StoredImage } from '../models/StoredImage.js';
import { requireAuth } from '../middleware/auth.js';

export const imageRouter = Router();

imageRouter.get('/:id', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Image not found.' } });
  }

  const image = await StoredImage.findById(req.params.id);
  if (!image) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Image not found.' } });
  }

  const ownedCase = cases.find((entry) => entry._id === image.caseId && entry.ownerId === req.user._id);
  if (!ownedCase) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Image not found.' } });
  }

  res.set({
    'Cache-Control': 'private, max-age=31536000, immutable',
    'Content-Type': image.contentType,
    'Content-Length': String(image.sizeBytes),
    'X-Content-Type-Options': 'nosniff',
  });
  return res.send(image.data);
});
