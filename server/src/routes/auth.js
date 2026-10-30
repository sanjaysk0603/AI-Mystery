import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { users } from '../data/store.js';
import { saveUserRecord } from '../data/store.js';
import { env } from '../config/env.js';
import { createId } from '../utils/id.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function createToken(user) {
  return jwt.sign({ sub: user._id }, env.JWT_SECRET, { expiresIn: '7d' });
}

function sessionCookieOptions() {
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
}

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid registration payload.' } });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  const existingUser = users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ error: { code: 'USER_EXISTS', message: 'An account already exists with that email.' } });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    _id: createId('user'),
    name,
    email: normalizedEmail,
    passwordHash,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUserRecord(user);

  const token = createToken(user);
  res.cookie('token', token, sessionCookieOptions());
  return res.status(201).json({ user: { _id: user._id, name: user.name, email: user.email } });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid login payload.' } });
  }

  const { email, password } = parsed.data;
  const user = users.find((candidate) => candidate.email === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' } });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' } });
  }

  const token = createToken(user);
  res.cookie('token', token, sessionCookieOptions());
  return res.json({ user: { _id: user._id, name: user.name, email: user.email } });
});

authRouter.post('/logout', requireAuth, (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  return res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req, res) => {
  return res.json({ user: { _id: req.user._id, name: req.user.name, email: req.user.email } });
});
