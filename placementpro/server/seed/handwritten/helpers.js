// mc: single-correct MCQ. Correct answer is listed first; position is shuffled deterministically at build time.
const mc = (topic, difficulty, text, correct, wrongs, explanation, seconds = 45) => ({ topic, difficulty, text, correct, wrongs, explanation, seconds, multi: false });
const ms = (topic, difficulty, text, corrects, wrongs, explanation, seconds = 60) => ({ topic, difficulty, text, corrects, wrongs, explanation, seconds, multi: true });
module.exports = { mc, ms };
