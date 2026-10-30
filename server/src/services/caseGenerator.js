import { GoogleGenAI } from '@google/genai';
import { saveImage } from './storage/index.js';
import { compressImage } from './storage/compress.js';
import { z } from 'zod';
import { env } from '../config/env.js';

const caseBibleSchema = z.object({
  title: z.string(), briefing: z.string().refine((value) => value.trim().split(/\s+/).length >= 150 && value.trim().split(/\s+/).length <= 250, 'Briefing must be 150–250 words.'),
  setting: z.object({ place: z.string(), date: z.string(), timeWindow: z.string() }),
  suspects: z.array(z.object({ id: z.string(), name: z.string(), age: z.number(), role: z.string(), publicBio: z.string(), secret: z.string(), alibi: z.string(), alibiIsTrue: z.boolean(), portraitPrompt: z.string() })).min(3).max(6),
  culpritId: z.string(), motive: z.string(), method: z.string(),
  timeline: z.array(z.object({ time: z.string(), event: z.string(), truth: z.boolean() })),
  keyClues: z.array(z.object({ id: z.string(), description: z.string(), points: z.string(), type: z.enum(['chat', 'photo', 'cctv']) })).min(3),
  redHerrings: z.array(z.object({ id: z.string(), description: z.string(), misdirectsTo: z.string() })).min(2),
  hints: z.array(z.string()).length(3),
});

const evidenceSchema = z.object({
  chats: z.array(z.object({ id: z.string(), title: z.string(), participants: z.array(z.string()), messages: z.array(z.object({ sender: z.string(), text: z.string(), timestamp: z.string(), type: z.enum(['text', 'image', 'voice_note']) })) })).min(3).max(6),
  photos: z.array(z.object({ id: z.string(), caption: z.string(), timestamp: z.string(), location: z.string(), imagePrompt: z.string(), relatedClueId: z.string().optional() })).min(4).max(8),
  cctv: z.array(z.object({ id: z.string(), cameraName: z.string(), location: z.string(), frames: z.array(z.object({ offsetSeconds: z.number(), timestamp: z.string(), imagePrompt: z.string(), caption: z.string() })).min(4).max(8) })).min(2).max(4),
});

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
let imageQuotaPausedUntil = 0;

function logGeminiError(event, error, details = {}) {
  if (process.env.NODE_ENV === 'test') return;
  console.error(JSON.stringify({
    event,
    ...details,
    error: {
      name: error?.name || 'Error',
      message: error?.message || String(error),
      status: error?.status || error?.statusCode || null,
      stack: error?.stack || null,
    },
  }));
}

async function generateJson(prompt, schema, model = env.GEMINI_TEXT_MODEL, timeoutMs = 60_000) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const started = Date.now();
    const modelToUse = attempt < 2 ? env.GEMINI_TEXT_FALLBACK_MODEL : model;
    try {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      const parsed = schema.parse(JSON.parse(response.text));
      console.info(JSON.stringify({ event: 'gemini_call', model: modelToUse, latencyMs: Date.now() - started, attempt: attempt + 1 }));
      return parsed;
    } catch (error) {
      lastError = error;
      logGeminiError('gemini_retry', error, { model: modelToUse, latencyMs: Date.now() - started, attempt: attempt + 1 });
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  throw new Error(`Mystery generation failed: ${lastError?.message || 'unknown error'}`, { cause: lastError });
}

async function generateStoredImage(prompt, key) {
  if (env.GEMINI_IMAGE_MODEL === 'disabled') return { url: null, imageStatus: 'placeholder' };
  if (Date.now() < imageQuotaPausedUntil) return { url: null, imageStatus: 'placeholder' };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const started = Date.now();
    try {
      const response = await ai.models.generateContent({
        model: env.GEMINI_IMAGE_MODEL,
        contents: `Create one fictional, non-identifiable, photorealistic image. Do not include text. ${prompt}`,
        config: { responseModalities: ['IMAGE'], abortSignal: AbortSignal.timeout(120_000) },
      });
      const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
      if (!imagePart) throw new Error('No image returned.');
      const compressed = await compressImage(Buffer.from(imagePart.inlineData.data, 'base64'));
      const url = await saveImage(key, compressed);
      console.info(JSON.stringify({ event: 'gemini_image', model: env.GEMINI_IMAGE_MODEL, latencyMs: Date.now() - started, attempt: attempt + 1 }));
      return { url, imageStatus: 'ready' };
    } catch (error) {
      logGeminiError('gemini_image_retry', error, { model: env.GEMINI_IMAGE_MODEL, attempt: attempt + 1 });
      if (error.status === 429) {
        imageQuotaPausedUntil = Date.now() + (5 * 60 * 1000);
        if (process.env.NODE_ENV !== 'test') console.warn(JSON.stringify({ event: 'gemini_image_quota', model: env.GEMINI_IMAGE_MODEL, cooldownSeconds: 300 }));
        return { url: null, imageStatus: 'placeholder' };
      }
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  return { url: null, imageStatus: 'placeholder' };
}

async function withConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}

function biblePrompt(scenario, settings) {
  return `Create the CASE BIBLE for a fair, solvable, fully fictional detective mystery. Return one JSON object and no markdown.\n
Required JSON shape (include every field):\n{
  "title":"string",
  "briefing":"150-250 words",
  "setting":{"place":"fictional place","date":"YYYY-MM-DD","timeWindow":"HH:mm-HH:mm"},
  "suspects":[{"id":"s1","name":"string","age":30,"role":"string","publicBio":"string","secret":"string","alibi":"string","alibiIsTrue":true,"portraitPrompt":"ordinary fictional portrait, no identifiable real person"}],
  "culpritId":"one suspect id",
  "motive":"string","method":"string",
  "timeline":[{"time":"HH:mm","event":"string","truth":true}],
  "keyClues":[{"id":"k1","description":"string","points":"culprit suspect id","type":"chat"}],
  "redHerrings":[{"id":"r1","description":"string","misdirectsTo":"innocent suspect id"}],
  "hints":["hint 1","hint 2","hint 3"]
}\n
Scenario: ${scenario}\nDifficulty: ${settings.difficulty}. Return exactly ${settings.suspectCount} suspects, with IDs s1 through s${settings.suspectCount}; use exactly three hints.\nRules: there is exactly one culprit. Every innocent suspect has a verifiable true alibi or an explicit innocent explanation. Include at least three key clues that jointly identify the culprit, and at least two red herrings. Every key clue's points field must be the culprit's valid suspect ID; clue type must be chat, photo, or cctv. All references and timestamps must be consistent. The briefing must be 150-250 words. Use fictional names and places. Keep a cozy-to-noir tone, with no graphic violence, actionable crime instructions, real-person likenesses, or real cases.`;
}

function evidencePrompt(bible) {
  return `Write only the player-visible EVIDENCE for this fictional mystery. Return one JSON object and no markdown, with exactly these top-level keys and fields:\n{
  "chats":[{"id":"chat-1","title":"string","participants":["exact suspect name"],"messages":[{"sender":"exact suspect name","text":"string","timestamp":"HH:mm","type":"text"}]}],
  "photos":[{"id":"photo-1","caption":"string","timestamp":"HH:mm","location":"string","imagePrompt":"ordinary fictional phone photo, no readable text or identifiable real people","relatedClueId":"k1"}],
  "cctv":[{"id":"camera-1","cameraName":"string","location":"string","frames":[{"offsetSeconds":0,"timestamp":"HH:mm","imagePrompt":"fictional low-quality CCTV frame, no readable text or identifiable real people","caption":"string"}]}]
}\n
Generate 3-6 chats, 4-8 photos, and 2-4 CCTV cameras. Each camera needs 4-8 chronologically ordered frames. Include each key clue in the evidence type assigned in the bible; captions or chat text must state any information that could be missed in an image. Keep every timestamp consistent with the case timeline. Add believable irrelevant chat banter. Use the exact suspect names and preserve the evidence ID formats shown. Never reveal the culprit, motive, method, secret, or solution in player-visible text.\nCASE BIBLE: ${JSON.stringify(bible)}`;
}

function placeholder(label, id) {
  const safeLabel = String(label).replace(/[&<>"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520"><rect width="800" height="520" fill="#171714"/><path d="M0 420 210 210l130 130 145-180 315 260v100H0Z" fill="#332a1b"/><text x="40" y="470" fill="#d7b36c" font-family="serif" font-size="25">${safeLabel.slice(0, 80)}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}#${id}`;
}

/** Generate and validate the text-only case data before image work starts. */
export async function generateMysteryText(scenario, settings, onProgress = async () => {}) {
  const bible = await generateJson(biblePrompt(scenario, settings), caseBibleSchema);
  if (bible.suspects.length !== Number(settings.suspectCount || 4) || !bible.suspects.some((suspect) => suspect.id === bible.culpritId)) throw new Error('Generated case did not match the requested suspect count.');
  if (bible.keyClues.filter((clue) => clue.points === bible.culpritId).length < 3) throw new Error('Generated clues do not support the intended solution.');
  await onProgress('Planting clues', 22);
  const evidence = await generateJson(evidencePrompt(bible), evidenceSchema);
  await onProgress('Writing the chats', 42);
  return { bible, evidence };
}

/** Generate a mystery and player-facing evidence, keeping the solution separate. */
export async function generateMysteryCase(scenario, settings, caseId = `temporary-${Date.now()}`, onProgress = async () => {}) {
  const { bible, evidence } = await generateMysteryText(scenario, settings, onProgress);
  await onProgress('Developing the photos', 55);
  const portraitImages = await withConcurrency(bible.suspects, 3, (suspect) => generateStoredImage(suspect.portraitPrompt, `cases/${caseId}/portrait-${suspect.id}`));
  const photoImages = await withConcurrency(evidence.photos, 3, (photo) => generateStoredImage(photo.imagePrompt, `cases/${caseId}/photo-${photo.id}`));
  await onProgress('Reviewing the footage', 78);
  const frameJobs = evidence.cctv.flatMap((camera) => camera.frames.map((frame, index) => ({ camera, frame, index })));
  const frameImages = await withConcurrency(frameJobs, 3, ({ camera, frame, index }) => generateStoredImage(frame.imagePrompt, `cases/${caseId}/frame-${camera.id}-${index}`));

  const publicData = {
    title: bible.title,
    briefing: bible.briefing,
    setting: bible.setting,
    suspects: bible.suspects.map(({ id, name, age, role, publicBio }, index) => ({ id, name, age, role, publicBio, portraitUrl: portraitImages[index].url || placeholder(`${name} · portrait`, id), imageStatus: portraitImages[index].imageStatus })),
    chats: evidence.chats,
    photos: evidence.photos.map(({ imagePrompt, ...photo }, index) => ({ ...photo, imageUrl: photoImages[index].url || placeholder(photo.caption, photo.id), imageStatus: photoImages[index].imageStatus })),
    cctv: evidence.cctv.map((camera) => ({ ...camera, frames: camera.frames.map(({ imagePrompt, ...frame }, index) => {
      const image = frameImages[frameJobs.findIndex((job) => job.camera.id === camera.id && job.index === index)];
      return { ...frame, imageUrl: image.url || placeholder(frame.caption, camera.id), imageStatus: image.imageStatus };
    }) })),
  };
  const secret = {
    culpritId: bible.culpritId, motive: bible.motive, method: bible.method, timeline: bible.timeline,
    keyClues: bible.keyClues, redHerrings: bible.redHerrings, hints: bible.hints,
    suspectSecrets: bible.suspects.map(({ id, secret: suspectSecret, alibi, alibiIsTrue }) => ({ id, secret: suspectSecret, alibi, alibiIsTrue })),
    walkthrough: `${bible.motive} ${bible.method} The decisive evidence is identified in the clue descriptions: ${bible.keyClues.map((clue) => `${clue.id} (${clue.description})`).join('; ')}.`,
  };
  return { public: publicData, secret };
}

export function validateCaseOutputs(caseData) {
  const data = caseData?.public;
  return Boolean(data && caseData.secret && data.suspects.length >= 3 && data.chats.length >= 3 && data.photos.length >= 4 && data.cctv.length >= 2 && caseData.secret.hints.length === 3);
}

export async function validateSolvability(caseData) {
  const answerSchema = z.object({ culpritId: z.string(), citedEvidenceIds: z.array(z.string()) });
  const safeEvidence = {
    briefing: caseData.public.briefing,
    suspects: caseData.public.suspects.map(({ id, name, age, role, publicBio }) => ({ id, name, age, role, publicBio })),
    chats: caseData.public.chats,
    photos: caseData.public.photos.map(({ id, caption, timestamp, location }) => ({ id, caption, timestamp, location })),
    cctv: caseData.public.cctv.map(({ id, cameraName, location, frames }) => ({ id, cameraName, location, frames: frames.map(({ timestamp, caption }) => ({ timestamp, caption })) })),
  };
  const judgment = await generateJson(`Solve this fictional case using only visible evidence. Return JSON {"culpritId":"...","citedEvidenceIds":["..."]}. Cite at least two evidence IDs.\n${JSON.stringify(safeEvidence)}`, answerSchema);
  return judgment.culpritId === caseData.secret.culpritId && new Set(judgment.citedEvidenceIds).size >= 2;
}
