import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { attempts, cases, deleteCaseRecords, saveAttemptRecord, saveCaseRecord } from '../data/store.js';
import { requireAuth } from '../middleware/auth.js';
import { generateMysteryCase, validateCaseOutputs, validateSolvability } from '../services/caseGenerator.js';
import { moderateScenario } from '../services/moderation.js';
import { computeScore } from '../services/score.js';
import { removeCaseAssets } from '../services/storage/index.js';
import { createId } from '../utils/id.js';

export const caseRouter = Router();
const creationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, keyGenerator: (req) => req.user._id, standardHeaders: 'draft-7', legacyHeaders: false });

const createCaseSchema = z.object({
  scenario: z.string().min(20).max(1000),
  settings: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    suspectCount: z.number().int().min(3).max(6).default(4),
    language: z.enum(['ta', 'tanglish', 'en']).default('en'),
  }).default({ difficulty: 'medium', suspectCount: 4, language: 'en' }),
});

const accusationSchema = z.object({
  suspectId: z.string().min(1),
  justification: z.string().min(10).max(500),
});

function summaryForCase(entry) {
  const attempt = attempts.find((item) => item.caseId === entry._id && item.playerId === entry.ownerId);
  const status = attempt?.status === 'completed' ? (attempt.result.correct ? 'solved' : 'failed_accusation') : attempt ? 'in_progress' : entry.status;
  return {
    _id: entry._id,
    ownerId: entry.ownerId,
    scenario: entry.scenario,
    status,
    score: attempt?.result?.score ?? null,
    progress: entry.progress,
    title: entry.public?.title || null,
    difficulty: entry.settings?.difficulty || 'medium',
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

function requireReady(record, res) {
  if (record.status === 'ready') return true;
  res.status(409).json({ error: { code: 'CASE_NOT_READY', message: 'This mystery is not ready yet.' } });
  return false;
}

async function generateInBackground(entry) {
  const stages = ['Building the suspects', 'Planting clues', 'Writing the chats', 'Developing the photos', 'Reviewing the footage'];
  try {
    entry.progress = { stage: stages[0], percent: 8 };
    let generated;
    let valid = false;
    for (let bibleAttempt = 0; bibleAttempt < 2 && !valid; bibleAttempt += 1) {
      for (let evidenceAttempt = 0; evidenceAttempt < 2 && !valid; evidenceAttempt += 1) {
        generated = await generateMysteryCase(entry.scenario, entry.settings, entry._id, async (stage, percent) => {
          entry.progress = { stage, percent };
          entry.updatedAt = new Date().toISOString();
          await saveCaseRecord(entry);
        });
        valid = validateCaseOutputs(generated) && await validateSolvability(generated);
      }
    }
    if (!valid) throw new Error('We could not verify this mystery. Please try again.');
    entry.public = generated.public;
    entry.secret = generated.secret;
    entry.status = 'ready';
    entry.progress = { stage: 'Ready', percent: 100 };
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') console.error(JSON.stringify({ event: 'case_generation_failed', caseId: entry._id, error: { message: error?.message || String(error), stack: error?.stack || null } }));
    entry.status = 'failed';
    entry.failureReason = 'We couldn’t finish this mystery. Please try again.';
    entry.progress = { stage: 'Failed', percent: 100 };
  }
  entry.updatedAt = new Date().toISOString();
  await saveCaseRecord(entry);
}

caseRouter.get('/health', (_req, res) => res.json({ ok: true }));

caseRouter.post('/', requireAuth, creationLimiter, async (req, res) => {
  const parsed = createCaseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid case payload.' } });
  }

  const { scenario, settings } = parsed.data;
  const moderation = await moderateScenario(scenario);
  if (!moderation.allowed) {
    const status = moderation.unavailable ? 503 : 400;
    const code = moderation.unavailable ? 'MODERATION_UNAVAILABLE' : 'MODERATION_REJECTED';
    return res.status(status).json({ error: { code, message: moderation.reason } });
  }

  const activeCount = cases.filter((entry) => entry.ownerId === req.user._id && ['generating', 'ready'].includes(entry.status)).length;
  if (activeCount >= Number(process.env.MAX_ACTIVE_CASES_PER_USER || 3)) {
    return res.status(409).json({ error: { code: 'CASE_LIMIT_REACHED', message: 'You have too many active mysteries.' } });
  }

  const caseDocument = {
    _id: createId('case'),
    ownerId: req.user._id,
    scenario,
    settings,
    status: 'generating',
    progress: { stage: 'Building the suspects', percent: 15 },
    public: {},
    secret: null,
    failureReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cases.push(caseDocument);
  await saveCaseRecord(caseDocument);

  void generateInBackground(caseDocument);

  return res.status(202).json({ id: caseDocument._id });
});

caseRouter.get('/', requireAuth, (req, res) => {
  const userCases = cases.filter((entry) => entry.ownerId === req.user._id).map(summaryForCase);
  return res.json({ cases: userCases });
});

caseRouter.get('/:id', requireAuth, (req, res) => {
  const record = cases.find((entry) => entry._id === req.params.id);
  if (!record) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }
  if (record.ownerId !== req.user._id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot access this case.' } });
  }

  const response = { _id: record._id, status: record.status, progress: record.progress, failureReason: record.failureReason };
  if (record.status === 'ready') {
    response.public = record.public;
    response.settings = record.settings;
    response.createdAt = record.createdAt;
  }
  return res.json(response);
});

caseRouter.get('/:id/attempt', requireAuth, async (req, res) => {
  const record = cases.find((entry) => entry._id === req.params.id);
  if (!record || record.ownerId !== req.user._id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }
  if (!requireReady(record, res)) return;

  let attempt = attempts.find((entry) => entry.caseId === req.params.id && entry.playerId === req.user._id);
  if (!attempt) {
    attempt = {
      _id: createId('attempt'),
      caseId: req.params.id,
      playerId: req.user._id,
      startedAt: new Date().toISOString(),
      notebook: '',
      pinnedEvidenceIds: [],
      hintsUsed: 0,
      status: 'in_progress',
    };
    attempts.push(attempt);
    await saveAttemptRecord(attempt);
  }

  return res.json({ attempt });
});

caseRouter.patch('/:id/attempt', requireAuth, async (req, res) => {
  const record = cases.find((entry) => entry._id === req.params.id);
  if (!record || record.ownerId !== req.user._id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }
  if (!requireReady(record, res)) return;
  const attemptPatchSchema = z.object({ notebook: z.string().max(20_000).optional(), pinnedEvidenceIds: z.array(z.string().min(1).max(100)).max(100).optional() }).strict();
  const patch = attemptPatchSchema.safeParse(req.body);
  if (!patch.success) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid attempt update.' } });

  let attempt = attempts.find((entry) => entry.caseId === req.params.id && entry.playerId === req.user._id);
  if (!attempt) {
    attempt = { _id: createId('attempt'), caseId: req.params.id, playerId: req.user._id, startedAt: new Date().toISOString(), notebook: '', pinnedEvidenceIds: [], hintsUsed: 0, status: 'in_progress' };
    attempts.push(attempt);
    await saveAttemptRecord(attempt);
  }

  attempt.notebook = patch.data.notebook ?? attempt.notebook;
  attempt.pinnedEvidenceIds = patch.data.pinnedEvidenceIds ?? attempt.pinnedEvidenceIds;
  await saveAttemptRecord(attempt);
  return res.json({ attempt });
});

caseRouter.post('/:id/hint', requireAuth, async (req, res) => {
  const record = cases.find((entry) => entry._id === req.params.id);
  if (!record || record.ownerId !== req.user._id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }
  if (!requireReady(record, res)) return;

  let attempt = attempts.find((entry) => entry.caseId === req.params.id && entry.playerId === req.user._id);
  if (!attempt) {
    attempt = { _id: createId('attempt'), caseId: req.params.id, playerId: req.user._id, startedAt: new Date().toISOString(), notebook: '', pinnedEvidenceIds: [], hintsUsed: 0, status: 'in_progress' };
    attempts.push(attempt);
    await saveAttemptRecord(attempt);
  }

  if (attempt.hintsUsed >= 3) {
    return res.status(409).json({ error: { code: 'NO_HINTS_LEFT', message: 'You have used all three hints.' } });
  }

  attempt.hintsUsed += 1;
  await saveAttemptRecord(attempt);
  const hint = record.secret?.hints?.[attempt.hintsUsed - 1] || 'No additional hints are available.';
  return res.json({ hint, hintsUsed: attempt.hintsUsed });
});

caseRouter.post('/:id/accuse', requireAuth, async (req, res) => {
  const record = cases.find((entry) => entry._id === req.params.id);
  if (!record || record.ownerId !== req.user._id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }
  if (!requireReady(record, res)) return;

  const parsed = accusationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid accusation payload.' } });
  }

  let attempt = attempts.find((entry) => entry.caseId === req.params.id && entry.playerId === req.user._id);
  if (!attempt) {
    attempt = { _id: createId('attempt'), caseId: req.params.id, playerId: req.user._id, startedAt: new Date().toISOString(), notebook: '', pinnedEvidenceIds: [], hintsUsed: 0, status: 'in_progress' };
    attempts.push(attempt);
    await saveAttemptRecord(attempt);
  }

  if (attempt.accusation) {
    return res.status(409).json({ error: { code: 'ALREADY_ACCUSING', message: 'You have already accused on this case.' } });
  }

  const { suspectId, justification } = parsed.data;
  const correct = suspectId === record.secret?.culpritId;
  const submittedAt = new Date().toISOString();
  const score = computeScore({ isCorrect: correct, hintsUsed: attempt.hintsUsed, startedAt: attempt.startedAt, submittedAt });

  attempt.accusation = { suspectId, justification, submittedAt };
  attempt.result = { correct, score };
  attempt.status = 'completed';
  await saveAttemptRecord(attempt);

  return res.json({
    result: {
      correct,
      score,
      culpritId: record.secret?.culpritId,
      motive: record.secret?.motive,
      method: record.secret?.method,
      timeline: record.secret?.timeline,
      walkthrough: record.secret?.walkthrough,
      suspectId,
    },
  });
});

caseRouter.get('/:id/result', requireAuth, (req, res) => {
  const record = cases.find((entry) => entry._id === req.params.id);
  if (!record || record.ownerId !== req.user._id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }

  const attempt = attempts.find((entry) => entry.caseId === req.params.id && entry.playerId === req.user._id);
  if (!attempt || !attempt.result) {
    return res.status(409).json({ error: { code: 'RESULT_NOT_READY', message: 'The case has not been resolved yet.' } });
  }

  return res.json({ attempt, result: { ...attempt.result, secret: record.secret } });
});

caseRouter.post('/:id/retry', requireAuth, async (req, res) => {
  const record = cases.find((entry) => entry._id === req.params.id);
  if (!record || record.ownerId !== req.user._id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }

  if (record.status !== 'failed') return res.status(409).json({ error: { code: 'CASE_NOT_FAILED', message: 'Only failed cases can be retried.' } });
  record.status = 'generating';
  record.failureReason = null;
  record.progress = { stage: 'Building the suspects', percent: 5 };
  await saveCaseRecord(record);
  void generateInBackground(record);
  return res.status(202).json({ id: record._id });
});

caseRouter.delete('/:id', requireAuth, async (req, res) => {
  const index = cases.findIndex((entry) => entry._id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found.' } });
  }
  if (cases[index].ownerId !== req.user._id) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot delete this case.' } });
  }

  await deleteCaseRecords(req.params.id);
  await removeCaseAssets(req.params.id);
  attempts.splice(0, attempts.length, ...attempts.filter((item) => item.caseId !== req.params.id));
  cases.splice(index, 1);
  return res.json({ ok: true });
});
