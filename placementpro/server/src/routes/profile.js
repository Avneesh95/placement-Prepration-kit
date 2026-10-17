const router = require('express').Router();
const { z } = require('zod');
const { Company, Question, UserProgress } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { computeStats } = require('../services/stats');

router.use(requireAuth);
const update = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  graduationYear: z.coerce.number().int().min(2024).max(2035).optional(),
  branch: z.string().trim().max(80).optional(),
  college: z.string().trim().max(120).optional(),
  targetCompanies: z.array(z.string()).max(10).optional(),
  preferredLanguage: z.enum(['java', 'c', 'cpp', 'python']).optional(),
  prepStartDate: z.coerce.date().optional(),
  dailyStudyHours: z.coerce.number().min(0.5).max(16).optional(),
  examDate: z.union([z.coerce.date(), z.null()]).optional(),
}).strict();

router.get('/profile', asyncHandler(async (req, res) => res.json({ user: req.user.toPublic(), stats: await computeStats(req.user) })));
router.put('/profile', asyncHandler(async (req, res) => {
  const body = update.parse(req.body);
  if (body.targetCompanies) {
    const valid = (await Company.find({ slug: { $in: body.targetCompanies } }).select('slug').lean()).map((c) => c.slug);
    body.targetCompanies = [...new Set(body.targetCompanies.filter((c) => valid.includes(c)))];
  }
  Object.assign(req.user, body); await req.user.save();
  res.json({ user: req.user.toPublic() });
}));
router.get('/progress/summary', asyncHandler(async (req, res) => res.json({ stats: await computeStats(req.user) })));
router.get('/progress/revision', asyncHandler(async (req, res) => {
  const rows = await UserProgress.find({ user: req.user._id, lastCorrect: false }).sort({ lastAttemptAt: -1 }).limit(100).lean();
  const qs = await Question.find({ _id: { $in: rows.map((r) => r.question) } }).select(Question.HIDDEN).lean();
  const m = new Map(qs.map((q) => [String(q._id), q]));
  res.json({ items: rows.map((r) => ({ attempts: r.attempts, lastAttemptAt: r.lastAttemptAt, question: m.get(String(r.question)) })).filter((r) => r.question) });
}));
module.exports = router;
