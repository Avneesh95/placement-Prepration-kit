const { MockTest, TestAttempt, Question } = require('../models');
const { ApiError } = require('../utils/errors');
const { computeResult } = require('./scoring');
const { recordAttempt } = require('./progress');

const totalMin = (t) => (t.sectionTimed ? t.sections.reduce((a, s) => a + (s.durationMin || 0), 0) : t.totalDurationMin);

function sectionIndexAt(attempt, now = Date.now()) {
  if (!attempt.sectionDeadlines || !attempt.sectionDeadlines.length) return null;
  const i = attempt.sectionDeadlines.findIndex((d) => now < new Date(d).getTime());
  return i === -1 ? attempt.sectionDeadlines.length - 1 : i;
}

async function startAttempt(user, test) {
  const existing = await TestAttempt.findOne({ user: user._id, test: test._id, status: 'in_progress' });
  if (existing) {
    if (Date.now() >= existing.deadline.getTime()) await submitAttempt(existing._id, user._id, { auto: true });
    else return { attempt: existing, resumed: true };
  }
  const startedAt = new Date();
  let cursor = startedAt.getTime();
  const sectionDeadlines = test.sectionTimed ? test.sections.map((s) => new Date((cursor += s.durationMin * 60000))) : [];
  const deadline = new Date(startedAt.getTime() + totalMin(test) * 60000);
  const attempt = await TestAttempt.create({ user: user._id, test: test._id, startedAt, deadline, sectionDeadlines, answers: [] });
  return { attempt, resumed: false };
}

async function loadQuestions(ids) {
  const docs = await Question.find({ _id: { $in: ids } }).lean();
  return new Map(docs.map((d) => [String(d._id), d]));
}

/** Question payload for a running attempt: answer keys are never included. */
async function buildPayload(attempt, test) {
  const now = Date.now();
  const idx = test.sectionTimed ? sectionIndexAt(attempt, now) : null;
  const visible = test.sections.map((s, i) => ({ s, i })).filter(({ i }) => idx === null || i <= idx);
  const ids = visible.flatMap(({ s }) => s.questionIds);
  const docs = await Question.find({ _id: { $in: ids } }).select(Question.HIDDEN).lean();
  const map = new Map(docs.map((d) => [String(d._id), d]));
  const answers = Object.fromEntries(attempt.answers.map((a) => [String(a.question), { response: a.response, markedForReview: a.markedForReview, visited: a.visited, timeSpentSec: a.timeSpentSec }]));
  return {
    attemptId: attempt._id, status: attempt.status,
    test: { id: test._id, slug: test.slug, title: test.title, company: test.company, sectionTimed: test.sectionTimed, instructions: test.instructions, scoring: test.scoring, patternStatus: test.patternStatus },
    startedAt: attempt.startedAt, deadline: attempt.deadline, serverNow: new Date(now),
    sectionDeadlines: attempt.sectionDeadlines, currentSection: idx,
    sections: visible.map(({ s, i }) => ({
      index: i, name: s.name, subject: s.subject, durationMin: s.durationMin,
      locked: idx !== null && i < idx,
      questions: s.questionIds.map((id) => map.get(String(id))).filter(Boolean).map((q) => ({
        _id: q._id, type: q.type, text: q.text, options: q.options, topic: q.topic, difficulty: q.difficulty, marks: q.marks, negativeMarks: q.negativeMarks,
        sql: q.sql ? { schemaSql: q.sql.schemaSql, tablesPreview: (q.sql.tablesPreview || []).map((t) => ({ name: t.name, columns: t.columns, rows: JSON.parse(t.rowsJson || '[]') })) } : undefined,
        coding: q.coding ? { statement: q.coding.statement, constraints: q.coding.constraints, inputFormat: q.coding.inputFormat, outputFormat: q.coding.outputFormat, examples: q.coding.examples } : undefined,
      })),
    })),
    answers,
  };
}

async function saveAnswers(attemptDoc, test, updates) {
  if (attemptDoc.status !== 'in_progress') throw new ApiError(409, 'ALREADY_SUBMITTED', 'This attempt has already been submitted.');
  if (Date.now() >= attemptDoc.deadline.getTime()) {
    await submitAttempt(attemptDoc._id, attemptDoc.user, { auto: true });
    throw new ApiError(409, 'TIME_UP', 'Time is up. Your test was submitted automatically.');
  }
  const idx = test.sectionTimed ? sectionIndexAt(attemptDoc) : null;
  const allowed = new Set(test.sections.filter((_, i) => idx === null || i === idx).flatMap((s) => s.questionIds.map(String)));
  const known = new Set(test.sections.flatMap((s) => s.questionIds.map(String)));
  const rejected = [];
  for (let attemptNo = 0; attemptNo < 3; attemptNo++) {
    const doc = attemptNo === 0 ? attemptDoc : await TestAttempt.findById(attemptDoc._id);
    if (doc.status !== 'in_progress') throw new ApiError(409, 'ALREADY_SUBMITTED', 'This attempt has already been submitted.');
    const map = new Map(doc.answers.map((a) => [String(a.question), a.toObject ? a.toObject() : a]));
    for (const u of updates) {
      if (!known.has(String(u.questionId))) { rejected.push({ questionId: u.questionId, reason: 'NOT_IN_TEST' }); continue; }
      if (!allowed.has(String(u.questionId))) { rejected.push({ questionId: u.questionId, reason: 'SECTION_LOCKED' }); continue; }
      const prev = map.get(String(u.questionId)) || { question: u.questionId, response: null, markedForReview: false, timeSpentSec: 0, visited: false };
      if ('response' in u) prev.response = u.response;
      if ('markedForReview' in u) prev.markedForReview = !!u.markedForReview;
      if (u.timeSpentSec != null) prev.timeSpentSec = Math.max(prev.timeSpentSec || 0, Math.min(Math.round(u.timeSpentSec), 7200));
      prev.visited = true;
      map.set(String(u.questionId), prev);
    }
    doc.answers = [...map.values()];
    try { await doc.save(); return { saved: updates.length - rejected.length, rejected, serverNow: new Date() }; }
    catch (e) { if (e.name !== 'VersionError' || attemptNo === 2) throw e; }
  }
}

async function advanceSection(attempt, test) {
  if (!test.sectionTimed) throw new ApiError(400, 'NOT_SECTIONED', 'This test is not section-timed.');
  const idx = sectionIndexAt(attempt);
  const now = Date.now();
  if (idx >= test.sections.length - 1) throw new ApiError(400, 'LAST_SECTION', 'You are in the last section. Submit the test to finish.');
  let cursor = now;
  const ds = test.sections.map((s, i) => (i < idx ? attempt.sectionDeadlines[i] : i === idx ? new Date(now) : new Date((cursor += s.durationMin * 60000))));
  attempt.sectionDeadlines = ds; attempt.deadline = ds[ds.length - 1];
  await attempt.save();
  return attempt;
}

/** Idempotent: concurrent/duplicate submits all return the same stored result. */
async function submitAttempt(attemptId, userId, { auto = false } = {}) {
  const claimed = await TestAttempt.findOneAndUpdate({ _id: attemptId, user: userId, status: 'in_progress' }, { $set: { status: 'submitting' } }, { new: true });
  if (!claimed) {
    for (let i = 0; i < 20; i++) {
      const cur = await TestAttempt.findOne({ _id: attemptId, user: userId });
      if (!cur) throw new ApiError(404, 'NOT_FOUND', 'Attempt not found.');
      if (cur.status === 'submitted') return cur;
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new ApiError(409, 'SUBMIT_IN_PROGRESS', 'Submission is still being processed. Please refresh in a moment.');
  }
  try {
    const test = await MockTest.findById(claimed.test).lean();
    const qmap = await loadQuestions(test.sections.flatMap((s) => s.questionIds));
    const expired = Date.now() >= claimed.deadline.getTime();
    const submittedAt = expired ? claimed.deadline : new Date();
    const result = await computeResult(test, qmap, claimed.answers, claimed.startedAt, submittedAt);
    for (const q of result.questions) {
      if (q.state === 'correct' || q.state === 'incorrect') await recordAttempt(userId, qmap.get(q.questionId), q.state === 'correct', q.timeSpentSec);
    }
    return await TestAttempt.findOneAndUpdate({ _id: attemptId }, { $set: { status: 'submitted', submittedAt, autoSubmitted: auto || expired, result } }, { new: true });
  } catch (e) {
    await TestAttempt.updateOne({ _id: attemptId, status: 'submitting' }, { $set: { status: 'in_progress' } });   // allow retry
    throw e;
  }
}

async function sweepExpired() {
  const due = await TestAttempt.find({ status: 'in_progress', deadline: { $lte: new Date() } }).limit(50).select('_id user');
  for (const a of due) { try { await submitAttempt(a._id, a.user, { auto: true }); } catch (e) { /* retried next sweep */ } }
  return due.length;
}
module.exports = { startAttempt, buildPayload, saveAnswers, advanceSection, submitAttempt, sweepExpired, sectionIndexAt };
