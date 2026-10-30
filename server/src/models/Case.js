import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  _id: { type: String },
  ownerId: { type: String, required: true, index: true },
  scenario: { type: String, required: true },
  settings: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['generating', 'ready', 'failed'], required: true },
  progress: mongoose.Schema.Types.Mixed,
  failureReason: String,
  public: mongoose.Schema.Types.Mixed,
  secret: { type: mongoose.Schema.Types.Mixed, select: false },
}, { timestamps: true, versionKey: false });

caseSchema.index({ ownerId: 1, createdAt: -1 });
export const Case = mongoose.models.Case || mongoose.model('Case', caseSchema);
