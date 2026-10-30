import mongoose from 'mongoose';

const storedImageSchema = new mongoose.Schema({
  caseId: { type: String, required: true },
  storageKey: { type: String, required: true },
  contentType: { type: String, enum: ['image/jpeg'], default: 'image/jpeg' },
  data: { type: Buffer, required: true },
  sizeBytes: { type: Number, required: true },
}, { versionKey: false, timestamps: true });

storedImageSchema.index({ caseId: 1, storageKey: 1 }, { unique: true });

export const StoredImage = mongoose.models.StoredImage || mongoose.model('StoredImage', storedImageSchema);
