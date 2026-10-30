import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { caseRouter } from './routes/cases.js';
import { errorHandler } from './middleware/error.js';
import { connectStore } from './data/store.js';

export const app = express();
app.set('trust proxy', 1);

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

app.get('/api/health', (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({ ok: databaseReady, database: databaseReady ? 'connected' : 'disconnected' });
});
app.use('/api/auth', authRouter);
app.use('/api/cases', caseRouter);
app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found.' } }));

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
app.use(express.static(clientDist, {
  setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'no-cache');
  },
}));
app.get('*', (_req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (error) => { if (error) next(error); });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  connectStore().then(() => {
    const server = app.listen(env.PORT, () => console.log(`Server listening on port ${env.PORT}`));
    const shutdown = () => server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
  }).catch(() => {
    console.error('Unable to connect to MongoDB. Check MONGODB_URI and ensure the database is available.');
    process.exitCode = 1;
  });
}
