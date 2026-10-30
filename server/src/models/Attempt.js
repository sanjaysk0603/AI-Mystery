import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  _id: { type: String },
  caseId: { type: String, required: true },
  playerId: { type: String, required: true },
  startedAt: { type: Date, default: Date.now },
  notebook: { type: String, default: '' },
  pinnedEvidenceIds: { type: [String], default: [] },
  hintsUsed: { type: Number, default: 0 },
  accusation: mongoose.Schema.Types.Mixed,
  result: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
}, { timestamps: true, versionKey: false });

attemptSchema.index({ caseId: 1, playerId: 1 }, { unique: true });
export const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', attemptSchema);
