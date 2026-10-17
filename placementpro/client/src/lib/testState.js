/** Seconds left until `deadline`, using the server clock offset so a wrong device clock cannot change the timer. */
export const remainingSeconds = (deadline, offsetMs, nowMs = Date.now()) => Math.max(0, Math.floor((new Date(deadline).getTime() - (nowMs + offsetMs)) / 1000));
/** Palette status of a question: answered | marked | visited | fresh */
export function paletteState(a) {
  const has = a && a.response !== undefined && a.response !== null && a.response !== '' && !(Array.isArray(a.response) && a.response.length === 0);
  if (a?.markedForReview) return has ? 'marked-answered' : 'marked';
  if (has) return 'answered';
  return a?.visited ? 'visited' : 'fresh';
}
export const summarise = (questions, answers) => {
  let answered = 0, marked = 0;
  for (const q of questions) { const s = paletteState(answers[q._id]); if (s === 'answered' || s === 'marked-answered') answered++; if (s.startsWith('marked')) marked++; }
  return { total: questions.length, answered, unanswered: questions.length - answered, marked };
};
