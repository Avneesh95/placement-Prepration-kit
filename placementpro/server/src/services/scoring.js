const { gradeSql } = require('./sqlRunner');

const asArray = (r) => (Array.isArray(r) ? r : r === null || r === undefined || r === '' ? [] : [r]);
const isAnswered = (q, r) => {
  if (q.type === 'numeric') return r !== null && r !== undefined && r !== '' && !Number.isNaN(Number(r));
  if (q.type === 'sql' || q.type === 'coding') return typeof r === 'string' && r.trim().length > 0;
  return asArray(r).length > 0;
};

/** Synchronous grading for objective questions. Returns { state, marks } */
function gradeObjective(q, response) {
  const marks = q.marks ?? 1, neg = q.negativeMarks ?? 0;
  if (!isAnswered(q, response)) return { state: 'unanswered', marks: 0 };
  let ok = false;
  if (q.type === 'mcq_single') ok = asArray(response).length === 1 && q.correct.includes(Number(asArray(response)[0]));
  else if (q.type === 'mcq_multi') {
    const a = [...new Set(asArray(response).map(Number))].sort(); const c = [...q.correct].sort();
    ok = a.length === c.length && a.every((x, i) => x === c[i]);
  } else if (q.type === 'numeric') ok = Math.abs(Number(response) - q.numericAnswer) <= (q.tolerance || 0) + 1e-9;
  return ok ? { state: 'correct', marks } : { state: 'incorrect', marks: -neg };
}

/** Full grading including SQL questions (run in sandbox) and coding (not auto-scored). */
async function gradeQuestion(q, response) {
  if (q.type === 'coding') return { state: isAnswered(q, response) ? 'ungraded' : 'unanswered', marks: 0 };
  if (q.type === 'sql') {
    if (!isAnswered(q, response)) return { state: 'unanswered', marks: 0 };
    const g = await gradeSql(q, response);
    return g.status === 'correct' ? { state: 'correct', marks: q.marks ?? 1, detail: g.message } : { state: 'incorrect', marks: -(q.negativeMarks ?? 0), detail: g.message };
  }
  return gradeObjective(q, response);
}

const round2 = (n) => Math.round(n * 100) / 100;

/** Build the complete result object. `questions` is a Map(idString -> question doc), all computed server-side. */
async function computeResult(test, questions, answers, startedAt, submittedAt) {
  const ansMap = new Map(answers.map((a) => [String(a.question), a]));
  const perQuestion = [], sectionStats = [], topicMap = new Map();
  let total = 0, max = 0, correct = 0, incorrect = 0, unanswered = 0, ungraded = 0;
  for (const sec of test.sections) {
    const s = { name: sec.name, subject: sec.subject, score: 0, max: 0, correct: 0, incorrect: 0, unanswered: 0, timeSpentSec: 0, questions: 0 };
    for (const qid of sec.questionIds) {
      let q = questions.get(String(qid)); if (!q) continue;
      if (test.scoring && test.scoring.override) q = { ...q, marks: test.scoring.defaultMarks, negativeMarks: test.scoring.defaultNegative };
      const a = ansMap.get(String(qid)) || {};
      const g = await gradeQuestion(q, a.response);
      const graded = q.type !== 'coding';
      if (graded) { max += q.marks ?? 1; s.max += q.marks ?? 1; }
      total += g.marks; s.score += g.marks; s.questions += 1; s.timeSpentSec += a.timeSpentSec || 0;
      if (g.state === 'correct') { correct++; s.correct++; } else if (g.state === 'incorrect') { incorrect++; s.incorrect++; }
      else if (g.state === 'unanswered' && graded) { unanswered++; s.unanswered++; } else ungraded++;   // coding is never auto-scored, so it is never "skipped"
      const t = topicMap.get(q.topic) || { topic: q.topic, subject: q.subject, correct: 0, incorrect: 0, unanswered: 0, timeSpentSec: 0 };
      if (g.state === 'correct') t.correct++; else if (g.state === 'incorrect') t.incorrect++; else if (g.state === 'unanswered' && graded) t.unanswered++;
      t.timeSpentSec += a.timeSpentSec || 0; topicMap.set(q.topic, t);
      perQuestion.push({
        questionId: String(qid), section: sec.name, topic: q.topic, subject: q.subject, difficulty: q.difficulty, type: q.type,
        text: q.text, options: q.options, response: a.response ?? null, state: g.state, marks: g.marks,
        correct: q.correct, numericAnswer: q.numericAnswer, explanation: q.explanation,
        coding: q.type === 'coding' ? { referenceSolutions: q.coding?.referenceSolutions, complexity: q.coding?.complexity } : undefined,
        sqlReference: q.type === 'sql' ? q.sql?.referenceQuery : undefined,
        timeSpentSec: a.timeSpentSec || 0, markedForReview: !!a.markedForReview,
        estimatedSeconds: q.estimatedSeconds, provenance: q.provenance,
      });
    }
    s.score = round2(s.score); sectionStats.push(s);
  }
  const attempted = correct + incorrect;
  const topics = [...topicMap.values()].map((t) => ({ ...t, accuracy: t.correct + t.incorrect ? round2((t.correct / (t.correct + t.incorrect)) * 100) : null }));
  return {
    score: round2(total), maxScore: max, percentage: max ? round2((total / max) * 100) : 0,
    correct, incorrect, unanswered, ungraded, attempted,
    accuracy: attempted ? round2((correct / attempted) * 100) : 0,
    timeTakenSec: Math.max(0, Math.round((submittedAt - startedAt) / 1000)),
    sections: sectionStats, topics,
    slowQuestions: perQuestion.filter((p) => p.timeSpentSec > 0).sort((a, b) => b.timeSpentSec - a.timeSpentSec).slice(0, 5).map((p) => ({ questionId: p.questionId, topic: p.topic, timeSpentSec: p.timeSpentSec, estimatedSeconds: p.estimatedSeconds })),
    revision: perQuestion.filter((p) => p.state === 'incorrect' || (p.state === 'unanswered' && p.type !== 'coding')).map((p) => p.questionId),
    questions: perQuestion,
  };
}
module.exports = { gradeObjective, gradeQuestion, computeResult, isAnswered };
