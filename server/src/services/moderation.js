import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const moderationResult = z.object({ allowed: z.boolean() });

const blockedPatterns = [
  'celebrity',
  'public figure',
  'real person',
  'sexual',
  'terrorism',
  'bomb',
  'weapon',
  'graphic gore',
  'hack a bank',
  'bank robbery',
];

function logModerationError(error, model, attempt) {
  if (process.env.NODE_ENV === 'test') return;
  console.error(JSON.stringify({
    event: 'gemini_moderation_error', model, attempt,
    error: {
      name: error?.name || 'Error',
      message: error?.message || String(error),
      status: error?.status || error?.statusCode || null,
      stack: error?.stack || null,
    },
  }));
}

export async function moderateScenario(scenario) {
  const clean = String(scenario || '').trim();
  if (!clean || clean.length < 20) {
    return { allowed: false, reason: 'Please provide a longer scenario with more detail.' };
  }

  const lower = clean.toLowerCase();
  if (blockedPatterns.some((pattern) => lower.includes(pattern))) {
    return { allowed: false, reason: 'Please rewrite the scenario without real people or actionable crime details.' };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const model = attempt === 0 ? env.GEMINI_TEXT_MODEL : env.GEMINI_TEXT_FALLBACK_MODEL;
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Review this proposed mystery scenario. Block sexual content, sexual violence, graphic gore, harm involving minors, terrorism, real-world crime instructions, hate, named identifiable real people (including public figures), and real incidents presented as a game. Allow fictional, harmless puzzles such as misplaced objects, event mix-ups, scheduling confusion, and cozy fictional mysteries. Real place names may be used as neutral settings; reject allegations about real people or organizations. Return JSON with an allowed boolean only.\nScenario: ${clean}`,
        config: { responseMimeType: 'application/json', abortSignal: AbortSignal.timeout(12_000) },
      });
      const result = moderationResult.parse(JSON.parse(response.text));
      return result.allowed
        ? { allowed: true, reason: 'Scenario passed moderation.' }
        : { allowed: false, reason: 'Please rewrite the scenario without real people or unsafe content.' };
    } catch (error) {
      logModerationError(error, model, attempt + 1);
      if (attempt < 1) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  return { allowed: false, unavailable: true, reason: 'We could not review that scenario right now. Please try again shortly.' };
}

