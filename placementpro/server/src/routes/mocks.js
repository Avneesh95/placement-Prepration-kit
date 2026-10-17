const router = require('express').Router();
const { z } = require('zod');
const { MockTest, TestAttempt } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const engine = require('../services/testEngine');
router.use(requireAuth);

const brief = (t) => ({ _id: t._id, slug: t.slug, title: t.title, company: t.company, category: t.category, description: t.description, sectionTimed: t.sectionTimed, totalDurationMin: t.sectionTimed ? t.sections.reduce((a, s) => a + s.durationMin, 0) : t.totalDurationMin, patternStatus: t.patternStatus, questionCount: t.sections.reduce((a, s) => a + s.questionIds.length, 0), sections: t.sections.map((s) => ({ name: s.name, subject: s.subject, durationMin: s.durationMin, questionCount: s.questionIds.length })) });

router.get('/', asyncHandler(async (req, res) => {
  const f = { active: true }; if (req.query.company) f.company = String(req.query.company); if (req.query.category) f.category = String(req.query.category);
  const tests = await MockTest.find(f).sort({ company: 1, slug: 1 }).lean();
  const mine = await TestAttempt.find({ user: req.user._id, test: { $in: tests.map((t) => t._id) } }).select('test status result.percentage').lean();
  res.json({ items: tests.map((t) => {
    const a = mine.filter((m) => String(m.test) === String(t._id)); const done = a.filter((x) => x.status === 'submitted');
    return { ...brief(t), attempts: done.length, bestPercentage: done.length ? Math.max(...done.map((d) => d.result?.percentage ?? 0)) : null, inProgress: a.some((x) => x.status === 'in_progress') };
  }) });
}));

router.get('/attempts/mine', asyncHandler(async (req, res) => {
  const rows = await TestAttempt.find({ user: req.user._id }).sort({ startedAt: -1 }).limit(50).select('test status startedAt submittedAt autoSubmitted result.score result.maxScore result.percentage').lean();
  const tests = await MockTest.find({ _id: { $in: rows.map((r) => r.test) } }).select('title slug').lean(); const m = new Map(tests.map((t) => [String(t._id), t]));
  res.json({ items: rows.map((r) => ({ ...r, test: m.get(String(r.test)) })) });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const t = await MockTest.findOne({ slug: req.params.slug, active: true }).lean();
  if (!t) throw new ApiError(404, 'NOT_FOUND', 'Mock test not found.');
  const inProgress = await TestAttempt.findOne({ user: req.user._id, test: t._id, status: 'in_progress' }).select('_id deadline').lean();
  res.json({ test: { ...brief(t), instructions: t.instructions, scoring: t.scoring }, inProgress: inProgress && inProgress.deadline > new Date() ? { attemptId: inProgress._id, deadline: inProgress.deadline } : null });
}));

router.post('/:slug/start', asyncHandler(async (req, res) => {
  const t = await MockTest.findOne({ slug: req.params.slug, active: true });
  if (!t) throw new ApiError(404, 'NOT_FOUND', 'Mock test not found.');
  const { attempt, resumed } = await engine.startAttempt(req.user, t);
  res.status(resumed ? 200 : 201).json({ attemptId: attempt._id, resumed, deadline: attempt.deadline, serverNow: new Date() });
}));

// ---------- attempts
const attempts = require('express').Router();
attempts.use(requireAuth);
async function own(req) {
  const a = await TestAttempt.findOne({ _id: req.params.id, user: req.user._id });
  if (!a) throw new ApiError(404, 'NOT_FOUND', 'Attempt not found.');   // same response for other users' attempts
  return a;
}
attempts.get('/:id', asyncHandler(async (req, res) => {
  let a = await own(req);
  if (a.status === 'in_progress' && Date.now() >= a.deadline.getTime()) a = await engine.submitAttempt(a._id, req.user._id, { auto: true });
  if (a.status !== 'in_progress') return res.json({ attemptId: a._id, status: a.status === 'submitted' ? 'submitted' : 'submitting', serverNow: new Date() });
  const test = await MockTest.findById(a.test).lean();
  res.json(await engine.buildPayload(a, test));
}));
const saveSchema = z.object({ answers: z.array(z.object({
  questionId: z.string(), response: z.union([z.array(z.number().int()), z.number(), z.string().max(20000), z.null()]).optional(),
  markedForReview: z.boolean().optional(), timeSpentSec: z.number().min(0).max(7200).optional(),
})).max(200) });
attempts.put('/:id/answers', asyncHandler(async (req, res) => {
  const { answers } = saveSchema.parse(req.body);
  const a = await own(req);
  const test = await MockTest.findById(a.test).lean();
  res.json(await engine.saveAnswers(a, test, answers));
}));
attempts.post('/:id/advance-section', asyncHandler(async (req, res) => {
  const a = await own(req);
  if (a.status !== 'in_progress') throw new ApiError(409, 'ALREADY_SUBMITTED', 'This attempt has already been submitted.');
  const test = await MockTest.findById(a.test).lean();
  await engine.advanceSection(a, test);
  res.json(await engine.buildPayload(a, test));
}));
attempts.post('/:id/submit', asyncHandler(async (req, res) => {
  await own(req);
  const done = await engine.submitAttempt(req.params.id, req.user._id, { auto: false });
  res.json({ attemptId: done._id, status: done.status, autoSubmitted: done.autoSubmitted });
}));
attempts.get('/:id/result', asyncHandler(async (req, res) => {
  const a = await own(req);
  if (a.status !== 'submitted') throw new ApiError(403, 'NOT_SUBMITTED', 'Results are available after you submit the test.');
  const test = await MockTest.findById(a.test).lean();
  const prev = await TestAttempt.find({ user: req.user._id, test: a.test, status: 'submitted', _id: { $ne: a._id } }).sort({ submittedAt: 1 }).select('submittedAt result.score result.maxScore result.percentage').lean();
  const weak = (a.result.topics || []).filter((t) => t.incorrect + t.unanswered > 0).sort((x, y) => (x.accuracy ?? 0) - (y.accuracy ?? 0)).slice(0, 3);
  const nextMock = await MockTest.findOne({ company: test.company, slug: { $ne: test.slug }, active: true }).select('slug title').lean();
  res.json({
    attemptId: a._id, test: { title: test.title, slug: test.slug, company: test.company, patternStatus: test.patternStatus }, submittedAt: a.submittedAt, autoSubmitted: a.autoSubmitted, result: a.result,
    comparison: prev.map((p) => ({ attemptId: p._id, submittedAt: p.submittedAt, percentage: p.result?.percentage, score: p.result?.score, maxScore: p.result?.maxScore })),
    recommendations: { practiceTopics: weak.map((t) => ({ subject: t.subject, topic: t.topic, reason: `${t.incorrect} wrong, ${t.unanswered} skipped in this test` })), nextMock },
  });
}));
module.exports = { router, attempts };
