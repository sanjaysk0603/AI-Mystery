import mongoose from 'mongoose';
import { Attempt } from '../models/Attempt.js';
import { Case } from '../models/Case.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export const users = [];
export const cases = [];
export const attempts = [];

/** Connect and hydrate the in-process indexes before accepting traffic. */
export async function connectStore() {
  await mongoose.connect(env.MONGODB_URI);
  const [savedUsers, savedCases, savedAttempts] = await Promise.all([
    User.find().select('+passwordHash').lean(),
    Case.find().select('+secret').lean(),
    Attempt.find().lean(),
  ]);
  users.push(...savedUsers);
  cases.push(...savedCases);
  attempts.push(...savedAttempts);
}

export async function saveUserRecord(record) {
  if (mongoose.connection.readyState !== 1) return;
  await User.replaceOne({ _id: record._id }, record, { upsert: true, runValidators: true });
}

export async function saveCaseRecord(record) {
  if (mongoose.connection.readyState !== 1) return;
  await Case.replaceOne({ _id: record._id }, record, { upsert: true, runValidators: true });
}

export async function saveAttemptRecord(record) {
  if (mongoose.connection.readyState !== 1) return;
  await Attempt.replaceOne({ _id: record._id }, record, { upsert: true, runValidators: true });
}

export async function deleteCaseRecords(caseId) {
  if (mongoose.connection.readyState !== 1) return;
  await Promise.all([Case.deleteOne({ _id: caseId }), Attempt.deleteMany({ caseId })]);
}
