import { computeScore } from '../src/services/score.js';

describe('computeScore', () => {
  const start = new Date('2026-01-01T12:00:00.000Z');

  it('subtracts 100 per hint and one point per minute after ten minutes', () => {
    const submitted = new Date(start.getTime() + (15 * 60_000));
    expect(computeScore({ isCorrect: true, hintsUsed: 2, startedAt: start, submittedAt: submitted })).toBe(795);
  });

  it('keeps a correct score at or above 100 and gives wrong accusations zero', () => {
    const submitted = new Date(start.getTime() + (720 * 60_000));
    expect(computeScore({ isCorrect: true, hintsUsed: 3, startedAt: start, submittedAt: submitted })).toBe(100);
    expect(computeScore({ isCorrect: false, hintsUsed: 0, startedAt: start, submittedAt: start })).toBe(0);
  });
});
