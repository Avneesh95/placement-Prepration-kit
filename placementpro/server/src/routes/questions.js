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
  const [prog, marks] = await Promise.all([
    UserProgress.find({ user: userId, question: { $in: ids } }).lean(),
    Bookmark.find({ user: userId, question: { $in: ids } }).lean(),
  ]);
  const pm = new Map(prog.map((p) => [String(p.question), p]));
  const bm = new Set(marks.map((b) => String(b.question)));

  // For questions already attempted by this user, fetch answer & explanation so solved questions are complete on revisit
  const attemptedIds = items
    .filter((q) => {
      const p = pm.get(String(q._id));
      return p && (p.everCorrect || p.attempts > 0);
    })
    .map((q) => q._id);

  let fullMap = new Map();
  if (attemptedIds.length) {
    const fullDocs = await Question.find({ _id: { $in: attemptedIds } })
      .select('correct numericAnswer explanation sourceTitle sourceUrl verificationStatus')
      .lean();
    fullMap = new Map(fullDocs.map((d) => [String(d._id), d]));
  }

  return items.map((q) => {
    const p = pm.get(String(q._id));
    const full = fullMap.get(String(q._id));
    return {
      ...q,
      userState: {
        attempted: !!p,
        solved: !!p?.everCorrect,
        lastCorrect: p ? p.lastCorrect : null,
        attempts: p?.attempts || 0,
        bookmarked: bm.has(String(q._id)),
        lastResponse: p?.lastResponse ?? null,
        previousResult: full
          ? {
              correct: !!p.lastCorrect,
              correctOptions: full.correct,
              numericAnswer: full.numericAnswer,
              explanation: full.explanation,
              sourceTitle: full.sourceTitle,
              sourceUrl: full.sourceUrl,
              verificationStatus: full.verificationStatus,
            }
          : null,
      },
    };
  });
}

const listQuery = z.object({
  company: z.union([z.string(), z.array(z.string())]).optional(),
  companies: z.union([z.string(), z.array(z.string())]).optional(),
  subject: z.union([z.string(), z.array(z.string())]).optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  topic: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.union([z.string(), z.array(z.string())]).optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  provenance: z.union([z.string(), z.array(z.string())]).optional(),
  q: z.string().max(100).optional(),
  status: z.union([z.string(), z.array(z.string())]).optional(),
  bookmarked: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function parseMultiParam(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.flatMap((v) => String(v).split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  return String(val).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

async function buildFilter(userId, p, base = {}) {
  const f = { active: true, ...base };
  const subjects = parseMultiParam(p.subject || p.category);
  const companies = parseMultiParam(p.company || p.companies);
  const difficulties = parseMultiParam(p.difficulty);
  const topics = parseMultiParam(p.topic);
  const types = parseMultiParam(p.type);
  const provenances = parseMultiParam(p.provenance);

  if (companies.length === 1) f.companies = companies[0];
  else if (companies.length > 1) f.companies = { $in: companies };

  if (subjects.length === 1) f.subject = subjects[0];
  else if (subjects.length > 1) f.subject = { $in: subjects };

  if (topics.length === 1) f.topic = topics[0];
  else if (topics.length > 1) f.topic = { $in: topics };

  if (difficulties.length === 1) f.difficulty = difficulties[0];
  else if (difficulties.length > 1) f.difficulty = { $in: difficulties };

  if (types.length === 1) f.type = types[0];
  else if (types.length > 1) f.type = { $in: types };

  if (provenances.length === 1) f.provenance = provenances[0];
  else if (provenances.length > 1) f.provenance = { $in: provenances };

  if (p.q) f.text = { $regex: escapeRegex(p.q), $options: 'i' };

  const idConds = [];
  const statuses = parseMultiParam(p.status);
  if (statuses.length > 0) {
    const rows = await UserProgress.find({ user: userId }).select('question everCorrect lastCorrect attempts').lean();
    const solvedSet = new Set(rows.filter((r) => r.everCorrect).map((r) => String(r.question)));
    const attemptedSet = new Set(rows.map((r) => String(r.question)));
    const wrongSet = new Set(rows.filter((r) => !r.lastCorrect).map((r) => String(r.question)));

    // Combine multiple status selections with OR logic
    const matchedIdSets = [];
    let includeUnsolved = false;

    for (const st of statuses) {
      if (st === 'solved') matchedIdSets.push(solvedSet);
      else if (st === 'attempted') matchedIdSets.push(attemptedSet);
      else if (st === 'incorrect') matchedIdSets.push(wrongSet);
      else if (st === 'unsolved') includeUnsolved = true;
    }

    if (includeUnsolved && matchedIdSets.length === 0) {
      idConds.push({ $nin: Array.from(solvedSet) });
    } else if (matchedIdSets.length > 0 && !includeUnsolved) {
      const unionSet = new Set();
      matchedIdSets.forEach((s) => s.forEach((id) => unionSet.add(id)));
      idConds.push({ $in: Array.from(unionSet) });
    } else if (matchedIdSets.length > 0 && includeUnsolved) {
      // If user wants both solved and unsolved, that covers all questions!
    }
  }

  if (p.bookmarked === 'true') {
    const marks = await Bookmark.find({ user: userId }).select('question').lean();
    idConds.push({ $in: [...new Set(marks.map((b) => String(b.question)))] });
  }

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
  await recordAttempt(req.user._id, q, g.state === 'correct', body.timeSpentSec, body.response);
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
