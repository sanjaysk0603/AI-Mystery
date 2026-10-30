export function computeScore({ isCorrect, hintsUsed, startedAt, submittedAt }) {
  if (!isCorrect) {
    return 0;
  }

  const started = new Date(startedAt).getTime();
  const submitted = new Date(submittedAt).getTime();
  const elapsedMinutes = Math.max(0, Math.floor((submitted - started) / 60000));
  const timePenalty = Math.max(0, elapsedMinutes - 10);
  const hintPenalty = hintsUsed * 100;

  return Math.max(100, 1000 - hintPenalty - timePenalty);
}
