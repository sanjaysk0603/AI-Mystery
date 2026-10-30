import request from 'supertest';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { compressImage } from '../src/services/storage/compress.js';

const imageStore = {
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteMany: jest.fn(),
};

jest.unstable_mockModule('../src/models/StoredImage.js', () => ({ StoredImage: imageStore }));

const { env } = await import('../src/config/env.js');
env.STORAGE_DRIVER = 'mongo';
const { app } = await import('../src/index.js');
const { cases, users } = await import('../src/data/store.js');
const { removeCaseAssets, saveImage } = await import('../src/services/storage/index.js');

describe('Mongo image storage', () => {
  it('resizes generated art and keeps JPEG data under 150 KB', async () => {
    const original = await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: '#b7a98b' },
    }).png().toBuffer();

    const compressed = await compressImage(original);
    const metadata = await sharp(compressed).metadata();

    expect(metadata.format).toBe('jpeg');
    expect(metadata.width).toBeLessThanOrEqual(800);
    expect(metadata.height).toBeLessThanOrEqual(800);
    expect(compressed.length).toBeLessThanOrEqual(150 * 1024);
  });

  it('serves stored images only to the owning player with cache headers', async () => {
    const payload = { name: 'Image Test', email: 'image-test@example.com', password: 'Password123' };
    const registered = await request(app).post('/api/auth/register').send(payload).expect(201);
    const cookie = registered.headers['set-cookie'][0].split(';')[0];
    const caseId = 'case_image_test';
    const imageId = '65a123456789012345678901';
    const imageData = Buffer.from('compressed jpeg bytes');
    cases.push({ _id: caseId, ownerId: registered.body.user._id });
    imageStore.findById.mockResolvedValue({
      _id: imageId,
      caseId,
      contentType: 'image/jpeg',
      sizeBytes: imageData.length,
      data: imageData,
    });

    await request(app).get(`/api/images/${imageId}`).expect(401);
    const response = await request(app).get(`/api/images/${imageId}`).set('Cookie', cookie).expect(200);
    expect(response.headers['cache-control']).toBe('private, max-age=31536000, immutable');
    expect(response.headers['content-type']).toContain('image/jpeg');

    cases.pop();
    users.pop();
    imageStore.findById.mockReset();
  });

  it('stores compressed image bytes and removes a case\'s images', async () => {
    const imageId = '65a123456789012345678901';
    const imageBytes = Buffer.from('compressed jpeg bytes');
    imageStore.findOneAndUpdate.mockResolvedValue({ _id: imageId });
    imageStore.deleteMany.mockResolvedValue({ deletedCount: 1 });

    const url = await saveImage('cases/case_image_test/photo-1', imageBytes);
    expect(url).toBe(`/api/images/${imageId}`);
    expect(imageStore.findOneAndUpdate).toHaveBeenCalledWith(
      { caseId: 'case_image_test', storageKey: 'cases/case_image_test/photo-1' },
      { $set: { contentType: 'image/jpeg', data: imageBytes, sizeBytes: imageBytes.length } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const priorState = mongoose.connection.readyState;
    mongoose.connection.readyState = 1;
    try {
      await removeCaseAssets('case_image_test');
      expect(imageStore.deleteMany).toHaveBeenCalledWith({ caseId: 'case_image_test' });
    } finally {
      mongoose.connection.readyState = priorState;
      imageStore.findOneAndUpdate.mockReset();
      imageStore.deleteMany.mockReset();
    }
  });
});
