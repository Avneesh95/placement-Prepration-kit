const router = require('express').Router();
const { z } = require('zod');
const { Question, Topic, Bookmark, UserProgress } = require('../models');
const { asyncHandler, ApiError, escapeRegex } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { gradeObjective } = require('../services/scoring');
const { recordAttempt } = require('../services/progress');
router.use(requireAuth);

const PUBLIC = Question.HIDDEN;

async function annotate(userId, items) {
  const ids = items.map((q) => q._id);
  const [prog, marks] = await Promise.all([UserProgress.find({ user: userId, question: { $in: ids } }).lean(), Bookmark.find({ user: userId, question: { $in: ids } }).lean()]);
  const pm = new Map(prog.map((p) => [String(p.question), p])); const bm = new Set(marks.map((b) => String(b.question)));
  return items.map((q) => { const p = pm.get(String(q._id)); return { ...q, userState: { attempted: !!p, solved: !!p?.everCorrect, lastCorrect: p ? p.lastCorrect : null, attempts: p?.attempts || 0, bookmarked: bm.has(String(q._id)) } }; });
}

const listQuery = z.object({
  company: z.string().optional(), subject: z.string().optional(), topic: z.string().optional(), difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  type: z.string().optional(), provenance: z.string().optional(), q: z.string().max(100).optional(),
  status: z.enum(['solved', 'unsolved', 'attempted', 'incorrect']).optional(), bookmarked: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20),
});

async function buildFilter(userId, p, base = {}) {
  const f = { active: true, ...base };
  if (p.company) f.companies = p.company;
  if (p.subject) f.subject = p.subject;
  if (p.topic) f.topic = p.topic;
  if (p.difficulty) f.difficulty = p.difficulty;
  if (p.type) f.type = p.type;
  if (p.provenance) f.provenance = p.provenance;
  if (p.q) f.text = { $regex: escapeRegex(p.q), $options: 'i' };
  const idConds = [];
  if (p.status) {
    const rows = await UserProgress.find({ user: userId }).select('question everCorrect lastCorrect').lean();
    const solved = rows.filter((r) => r.everCorrect).map((r) => r.question), attempted = rows.map((r) => r.question), wrong = rows.filter((r) => !r.lastCorrect).map((r) => r.question);
    if (p.status === 'solved') idConds.push({ $in: solved }); else if (p.status === 'attempted') idConds.push({ $in: attempted });
    else if (p.status === 'incorrect') idConds.push({ $in: wrong }); else idConds.push({ $nin: solved });
  }
  if (p.bookmarked === 'true') idConds.push({ $in: (await Bookmark.find({ user: userId }).select('question').lean()).map((b) => b.question) });
  if (idConds.length === 1) f._id = idConds[0];
  else if (idConds.length > 1) f.$and = idConds.map((c) => ({ _id: c }));
  return f;
}

router.get('/meta', asyncHandler(async (_req, res) => {
  const qs = await Question.find({ active: true }).select('subject topic companies difficulty provenance').lean();
  const subjects = {}, provenance = {}, companies = {};
  for (const q of qs) {
    subjects[q.subject] = subjects[q.subject] || { count: 0, topics: {} };
    subjects[q.subject].count++; subjects[q.subject].topics[q.topic] = (subjects[q.subject].topics[q.topic] || 0) + 1;
    provenance[q.provenance] = (provenance[q.provenance] || 0) + 1;
    for (const c of q.companies) companies[c] = (companies[c] || 0) + 1;
  }
  res.json({ total: qs.length, subjects, provenance, companies });
}));

router.get('/', asyncHandler(async (req, res) => {
  const p = listQuery.parse(req.query);
  const filter = await buildFilter(req.user._id, p);
  const [items, total] = await Promise.all([
    Question.find(filter).select(PUBLIC).sort({ uid: 1 }).skip((p.page - 1) * p.limit).limit(p.limit).lean(),
    Question.countDocuments(filter),
  ]);
  res.json({ items: await annotate(req.user._id, items), page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id).select(PUBLIC).lean();
  if (!q || !q.active) throw new ApiError(404, 'NOT_FOUND', 'Question not found.');
  res.json({ question: (await annotate(req.user._id, [q]))[0] });
}));

// Practice answer: graded on the server, explanation revealed only after answering.
router.post('/:id/answer', asyncHandler(async (req, res) => {
  const body = z.object({ response: z.union([z.array(z.number().int()), z.number(), z.string()]), timeSpentSec: z.number().min(0).max(3600).optional() }).parse(req.body);
  const q = await Question.findById(req.params.id).lean();
  if (!q || !q.active) throw new ApiError(404, 'NOT_FOUND', 'Question not found.');
  if (!['mcq_single', 'mcq_multi', 'numeric'].includes(q.type)) throw new ApiError(400, 'WRONG_ENDPOINT', 'Use the Coding Arena or SQL Lab for this question type.');
  const g = gradeObjective(q, body.response);
  if (g.state === 'unanswered') throw new ApiError(400, 'NO_ANSWER', 'Select an answer first.');
  await recordAttempt(req.user._id, q, g.state === 'correct', body.timeSpentSec);
  res.json({ correct: g.state === 'correct', correctOptions: q.correct, numericAnswer: q.numericAnswer, explanation: q.explanation, provenance: q.provenance, sourceTitle: q.sourceTitle, sourceUrl: q.sourceUrl, verificationStatus: q.verificationStatus });
}));

// ---- Topics (concepts, formulas, shortcuts)
const topics = require('express').Router();
topics.get('/', asyncHandler(async (req, res) => {
  const f = req.query.subject ? { subject: String(req.query.subject) } : {};
  res.json({ items: await Topic.find(f).sort({ subject: 1, order: 1 }).select('-solvedExampleUids').lean() });
}));
topics.get('/:slug', asyncHandler(async (req, res) => {
  const t = await Topic.findOne({ slug: req.params.slug }).lean();
  if (!t) throw new ApiError(404, 'NOT_FOUND', 'Topic not found.');
  const ex = await Question.find({ uid: { $in: t.solvedExampleUids || [] } }).select('text options correct numericAnswer explanation difficulty type').lean();
  res.json({ topic: t, solvedExamples: ex });
}));

// ---- Bookmarks
const bookmarks = require('express').Router();
bookmarks.get('/', asyncHandler(async (req, res) => {
  const rows = await Bookmark.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  const qs = await Question.find({ _id: { $in: rows.map((r) => r.question) } }).select(PUBLIC).lean();
  res.json({ items: await annotate(req.user._id, qs) });
}));
bookmarks.post('/:questionId', asyncHandler(async (req, res) => {
  if (!(await Question.exists({ _id: req.params.questionId }))) throw new ApiError(404, 'NOT_FOUND', 'Question not found.');
  await Bookmark.findOneAndUpdate({ user: req.user._id, question: req.params.questionId }, { $setOnInsert: { user: req.user._id, question: req.params.questionId } }, { upsert: true });
  res.status(201).json({ bookmarked: true });
}));
bookmarks.delete('/:questionId', asyncHandler(async (req, res) => {
  await Bookmark.deleteOne({ user: req.user._id, question: req.params.questionId });
  res.json({ bookmarked: false });
}));
module.exports = { router, topics, bookmarks, annotate, buildFilter, PUBLIC };
