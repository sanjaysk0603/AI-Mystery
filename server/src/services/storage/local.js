import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';

export async function saveLocal(key, bytes, mimeType) {
  const extension = mimeType === 'image/jpeg' ? '.jpg' : '.png';
  const filename = `${key}${extension}`;
  const root = path.resolve(env.LOCAL_UPLOAD_DIR);
  const destination = path.resolve(root, filename);
  if (!destination.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage key.');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes);
  return `/uploads/${filename.replaceAll(path.sep, '/')}`;
}

export async function removeLocalCase(caseId) {
  if (!/^[a-z0-9_-]+$/i.test(caseId)) throw new Error('Invalid case id.');
  const root = path.resolve(env.LOCAL_UPLOAD_DIR);
  await fs.rm(path.resolve(root, 'cases', caseId), { recursive: true, force: true });
}
