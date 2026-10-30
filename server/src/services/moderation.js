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

export async function moderateScenario(scenario) {
  const clean = String(scenario || '').trim();
  if (!clean || clean.length < 20) {
    return { allowed: false, reason: 'Please provide a longer scenario with more detail.' };
  }

  const lower = clean.toLowerCase();
  if (blockedPatterns.some((pattern) => lower.includes(pattern))) {
    return { allowed: false, reason: 'Please rewrite the scenario without real people or actionable crime details.' };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const model = attempt < 2 ? env.GEMINI_TEXT_FALLBACK_MODEL : env.GEMINI_TEXT_MODEL;
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Review this proposed fictional mystery scenario. Block sexual content, sexual violence, graphic gore, harm involving minors, terrorism, real-world crime instructions, hate, and named identifiable real people (including public figures). Only allow cozy-to-noir fictional theft, fraud, sabotage, disappearance, or cheating scenarios. Return JSON with an allowed boolean only.\nScenario: ${clean}`,
        config: { responseMimeType: 'application/json', abortSignal: AbortSignal.timeout(60_000) },
      });
      const result = moderationResult.parse(JSON.parse(response.text));
      return result.allowed
        ? { allowed: true, reason: 'Scenario passed moderation.' }
        : { allowed: false, reason: 'Please rewrite the scenario without real people or unsafe content.' };
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') console.warn(JSON.stringify({ event: 'gemini_moderation_retry', model, attempt: attempt + 1, status: error.status || null }));
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  return { allowed: false, unavailable: true, reason: 'We could not review that scenario right now. Please try again shortly.' };
}

