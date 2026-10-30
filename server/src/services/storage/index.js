import { removeLocalCase, saveLocal } from './local.js';
import { removeS3Case, saveS3 } from './s3.js';
import { env } from '../../config/env.js';

export const saveImage = env.STORAGE_DRIVER === 's3' ? saveS3 : saveLocal;
export const removeCaseAssets = env.STORAGE_DRIVER === 's3' ? removeS3Case : removeLocalCase;
