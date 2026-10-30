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
  GEMINI_IMAGE_MODEL: z.string().min(1),
  MAX_ACTIVE_CASES_PER_USER: z.coerce.number().int().default(3),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_UPLOAD_DIR: z.string().default('./uploads'),
  AWS_REGION: z.string().default(''),
  AWS_S3_BUCKET: z.string().default(''),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Missing or invalid env vars: ${parsed.error.issues.map((issue) => issue.path.join('.')).join(', ')}`);
}

export const env = parsed.data;
env.GEMINI_TEXT_FALLBACK_MODEL ||= env.GEMINI_TEXT_MODEL;

if (env.NODE_ENV === 'production' && env.JWT_SECRET.length < 32) {
  throw new Error('Invalid env var JWT_SECRET: production secrets must be at least 32 characters.');
}

if (env.STORAGE_DRIVER === 's3' && (!env.AWS_REGION || !env.AWS_S3_BUCKET || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY)) {
  throw new Error('STORAGE_DRIVER=s3 requires AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.');
}
