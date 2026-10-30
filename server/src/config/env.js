import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_TEXT_MODEL: z.string().min(1),
  GEMINI_TEXT_FALLBACK_MODEL: z.string().min(1).optional(),
  GEMINI_IMAGE_MODEL: z.string().transform((model) => model.trim() || 'disabled').default('disabled'),
  MAX_ACTIVE_CASES_PER_USER: z.coerce.number().int().default(3),
  STORAGE_DRIVER: z.enum(['local', 'mongo']).optional(),
  LOCAL_UPLOAD_DIR: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Missing or invalid env vars: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
}

export const env = parsed.data;
env.GEMINI_TEXT_FALLBACK_MODEL ||= env.GEMINI_TEXT_MODEL;
env.STORAGE_DRIVER ||= env.NODE_ENV === 'production' ? 'mongo' : 'local';

if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 32) {
  throw new Error('Invalid env var JWT_SECRET: production secrets must be at least 32 characters.');
}
