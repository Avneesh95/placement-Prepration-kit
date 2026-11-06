const router = require('express').Router();
const { z } = require('zod');
const { Question, Topic, Company, SourceReference, User } = require('../models');
const { asyncHandler, ApiError, escapeRegex } = require('../utils/errors');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { validateQuestion } = require('../../seed/lib/validate');
const SLUGS = require('../../seed/data/company-slugs');

router.use(requireAuth);
router.use(requireAdmin);

async function getValidationContext() {
  const topicsData = await Topic.find().select('subject slug').lean();
  return {
    companies: new Set(SLUGS),
    topics: new Set(topicsData.map((t) => `${t.subject}:${t.slug}`)),
  };
}

// GET /api/admin/stats
router.get('/stats', asyncHandler(async (_req, res) => {
  const [total, activeCount, subjectsAgg, difficultiesAgg, provenanceAgg] = await Promise.all([
    Question.countDocuments(),
    Question.countDocuments({ active: true }),
    Question.aggregate([{ $group: { _id: '$subject', count: { $sum: 1 } } }]),
    Question.aggregate([{ $group: { _id: '$difficulty', count: { $sum: 1 } } }]),
    Question.aggregate([{ $group: { _id: '$provenance', count: { $sum: 1 } } }]),
  ]);

  const bySubject = Object.fromEntries(subjectsAgg.map((s) => [s._id, s.count]));
  const byDifficulty = Object.fromEntries(difficultiesAgg.map((d) => [d._id, d.count]));
  const byProvenance = Object.fromEntries(provenanceAgg.map((p) => [p._id, p.count]));

  res.json({
    total,
    active: activeCount,
    bySubject,
    byDifficulty,
    byProvenance,
    verifiedPyqCount: byProvenance['verified_pyq'] || 0,
    practiceCount: (byProvenance['practice'] || 0) + (byProvenance['high_priority_practice'] || 0),
  });
}));

// GET /api/admin/questions
const listSchema = z.object({
  q: z.string().max(100).optional(),
  subject: z.union([z.string(), z.array(z.string())]).optional(),
  topic: z.union([z.string(), z.array(z.string())]).optional(),
  difficulty: z.union([z.string(), z.array(z.string())]).optional(),
  company: z.union([z.string(), z.array(z.string())]).optional(),
  provenance: z.union([z.string(), z.array(z.string())]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function parseMulti(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.flatMap((v) => String(v).split(',')).map((s) => s.trim().toLowerCase()).filter(Boolean);
  return String(val).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}

router.get('/questions', asyncHandler(async (req, res) => {
  const p = listSchema.parse(req.query);
  const f = {};
  const subjects = parseMulti(p.subject);
  const topics = parseMulti(p.topic);
  const difficulties = parseMulti(p.difficulty);
  const companies = parseMulti(p.company);
  const provenances = parseMulti(p.provenance);

  if (subjects.length === 1) f.subject = subjects[0];
  else if (subjects.length > 1) f.subject = { $in: subjects };

  if (topics.length === 1) f.topic = topics[0];
  else if (topics.length > 1) f.topic = { $in: topics };

  if (difficulties.length === 1) f.difficulty = difficulties[0];
  else if (difficulties.length > 1) f.difficulty = { $in: difficulties };

  if (companies.length === 1) f.companies = companies[0];
  else if (companies.length > 1) f.companies = { $in: companies };

  if (provenances.length === 1) f.provenance = provenances[0];
  else if (provenances.length > 1) f.provenance = { $in: provenances };

  if (p.q) {
    const r = escapeRegex(p.q);
    f.$or = [{ text: { $regex: r, $options: 'i' } }, { uid: { $regex: r, $options: 'i' } }];
  }

  const [items, total] = await Promise.all([
    Question.find(f)
      .sort({ createdAt: -1, uid: 1 })
      .skip((p.page - 1) * p.limit)
      .limit(p.limit)
      .lean(),
    Question.countDocuments(f),
  ]);

  res.json({ items, total, page: p.page, limit: p.limit, pages: Math.ceil(total / p.limit) });
}));

// GET /api/admin/questions/:id
router.get('/questions/:id', asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id).lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Question not found.');
  res.json({ question: q });
}));

// POST /api/admin/questions
router.post('/questions', asyncHandler(async (req, res) => {
  const data = req.body;
  if (!data.uid) {
    data.uid = `admin-${data.subject || 'q'}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const ctx = await getValidationContext();
  const errors = validateQuestion(data, ctx);
  if (errors.length) {
    throw new ApiError(400, 'VALIDATION_FAILED', `Validation error: ${errors.join('; ')}`);
  }

  const exists = await Question.findOne({ uid: data.uid });
  if (exists) throw new ApiError(409, 'UID_EXISTS', `Question with UID '${data.uid}' already exists.`);

  const doc = await Question.create(data);
  res.status(201).json({ ok: true, question: doc });
}));

// PUT /api/admin/questions/:id
router.put('/questions/:id', asyncHandler(async (req, res) => {
  const existing = await Question.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'NOT_FOUND', 'Question not found.');

  const update = { ...existing.toObject(), ...req.body, _id: existing._id };
  const ctx = await getValidationContext();
  const errors = validateQuestion(update, ctx);
  if (errors.length) {
    throw new ApiError(400, 'VALIDATION_FAILED', `Validation error: ${errors.join('; ')}`);
  }

  const updated = await Question.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  res.json({ ok: true, question: updated });
}));

// DELETE /api/admin/questions/:id
router.delete('/questions/:id', asyncHandler(async (req, res) => {
  const doc = await Question.findByIdAndDelete(req.params.id);
  if (!doc) throw new ApiError(404, 'NOT_FOUND', 'Question not found.');
  res.json({ ok: true, deletedId: req.params.id });
}));

// POST /api/admin/questions/bulk
router.post('/questions/bulk', asyncHandler(async (req, res) => {
  const { questions } = z.object({ questions: z.array(z.record(z.any())).min(1).max(500) }).parse(req.body);
  const ctx = await getValidationContext();

  const errors = [];
  const valid = [];
  const seenUids = new Set();

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.uid) {
      q.uid = `bulk-${q.subject || 'q'}-${Date.now()}-${i}`;
    }
    if (seenUids.has(q.uid)) {
      errors.push(`Row ${i + 1}: duplicate UID '${q.uid}' within import batch.`);
      continue;
    }
    seenUids.add(q.uid);

    const errs = validateQuestion(q, ctx);
    if (errs.length) {
      errors.push(`Row ${i + 1} (${q.uid}): ${errs.join(', ')}`);
    } else {
      valid.push(q);
    }
  }

  if (errors.length > 0 && valid.length === 0) {
    return res.status(400).json({ error: { code: 'BULK_VALIDATION_FAILED', message: `${errors.length} questions failed validation.`, details: errors } });
  }

  const existingDocs = await Question.find({ uid: { $in: valid.map((v) => v.uid) } }).select('uid').lean();
  const existingSet = new Set(existingDocs.map((d) => d.uid));
  const toInsert = valid.filter((v) => !existingSet.has(v.uid));
  const toUpdate = valid.filter((v) => existingSet.has(v.uid));

  let insertedCount = 0;
  if (toInsert.length > 0) {
    const resInsert = await Question.insertMany(toInsert, { ordered: false });
    insertedCount = resInsert.length;
  }

  let updatedCount = 0;
  for (const u of toUpdate) {
    await Question.updateOne({ uid: u.uid }, { $set: u });
    updatedCount++;
  }

  res.json({
    ok: true,
    totalReceived: questions.length,
    inserted: insertedCount,
    updated: updatedCount,
    validationErrors: errors,
  });
}));

// GET /api/admin/duplicates
router.get('/duplicates', asyncHandler(async (_req, res) => {
  const questions = await Question.find({ active: true }).select('uid text subject topic difficulty').lean();
  const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80);

  const groups = new Map();
  for (const q of questions) {
    const norm = normalize(q.text);
    if (!groups.has(norm)) groups.set(norm, []);
    groups.get(norm).push(q);
  }

  const duplicates = [];
  for (const [normKey, items] of groups.entries()) {
    if (items.length > 1) {
      duplicates.push({
        normalizedKey: normKey,
        count: items.length,
        questions: items,
      });
    }
  }

  res.json({
    duplicateGroupsCount: duplicates.length,
    duplicates: duplicates.slice(0, 50),
  });
}));

// POST /api/admin/validate (dry run)
router.post('/validate', asyncHandler(async (req, res) => {
  const ctx = await getValidationContext();
  const errors = validateQuestion(req.body, ctx);
  res.json({ valid: errors.length === 0, errors });
}));

module.exports = router;
