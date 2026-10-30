import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { caseRouter } from './routes/cases.js';
import { errorHandler } from './middleware/error.js';
import { connectStore } from './data/store.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(mongoSanitize());
app.use(cookieParser());
if (env.STORAGE_DRIVER === 'local') app.use('/uploads', express.static(path.resolve(env.LOCAL_UPLOAD_DIR), { fallthrough: false, maxAge: '1y', immutable: true }));

const generalLimiter = rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false });
app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/cases', caseRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  connectStore().then(() => {
    app.listen(env.PORT, () => console.log(`Server listening on http://localhost:${env.PORT}`));
  }).catch(() => {
    console.error('Unable to connect to MongoDB. Check MONGODB_URI and ensure the database is available.');
    process.exitCode = 1;
  });
}
