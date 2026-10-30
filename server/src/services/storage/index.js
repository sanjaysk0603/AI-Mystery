import mongoose from 'mongoose';
import { StoredImage } from '../../models/StoredImage.js';
import { env } from '../../config/env.js';
import { saveLocal, removeLocalCase } from './local.js';

const MAX_IMAGE_BYTES = 150 * 1024;

export async function saveImage(key, bytes) {
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error('Refusing to store an image larger than 150 KB.');
  if (env.STORAGE_DRIVER === 'local') return saveLocal(key, bytes, 'image/jpeg');

  const [collection, caseId] = key.split('/');
  if (collection !== 'cases' || !caseId || !/^case_[a-z0-9_-]+$/i.test(caseId)) {
    throw new Error('Invalid image storage key.');
  }

  const image = await StoredImage.findOneAndUpdate(
    { caseId, storageKey: key },
    { $set: { contentType: 'image/jpeg', data: bytes, sizeBytes: bytes.length } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  return `/api/images/${image._id}`;
}

export async function removeCaseAssets(caseId) {
  if (!/^case_[a-z0-9_-]+$/i.test(caseId)) throw new Error('Invalid case id.');
  if (env.STORAGE_DRIVER === 'local') return removeLocalCase(caseId);
  if (mongoose.connection.readyState === 1) await StoredImage.deleteMany({ caseId });
}
