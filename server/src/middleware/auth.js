import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { users } from '../data/store.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = users.find((candidate) => candidate._id === payload.sub);
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Session invalid.' } });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token.' } });
  }
}
