const router = require('express').Router();
const { Company, CompanyPattern, Question, MockTest } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);

const SUBJECTS = ['aptitude', 'reasoning', 'english', 'cs', 'coding', 'sql'];

/** Frequency is derived only from a documented sample. Otherwise priority stays qualitative. */
function withFrequency(p) {
  const e = p.evidence;
  const documented = e && e.sampleSize > 0 && e.appearedIn >= 0 && e.appearedIn <= e.sampleSize;
  return {
    ...p,
    observedFrequency: documented ? {
      percent: Math.round((e.appearedIn / e.sampleSize) * 1000) / 10, appearedIn: e.appearedIn, sampleSize: e.sampleSize, period: e.period,
      note: `Seen in ${e.appearedIn} of ${e.sampleSize} documented assessments (${e.period}). This describes that sample only and is not a prediction for your exam.`,
    } : null,
    evidenceNote: documented ? null : 'No documented sample is available, so this is a qualitative priority, not a statistic.',
  };
}

router.get('/', asyncHandler(async (_req, res) => {
  const companies = await Company.find().sort({ order: 1 }).select('slug name tagline patternStatus').lean();
  const out = [];
  for (const c of companies) {
    const [questions, mocks] = await Promise.all([Question.countDocuments({ companies: c.slug, active: true }), MockTest.countDocuments({ company: c.slug, active: true })]);
    out.push({ ...c, questionCount: questions, mockCount: mocks });
  }
  res.json({ items: out });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const company = await Company.findOne({ slug: req.params.slug }).lean();
  if (!company) throw new ApiError(404, 'NOT_FOUND', 'Company not found.');
  const [patterns, mocks, counts] = await Promise.all([
    CompanyPattern.find({ company: company.slug }).lean(),
    MockTest.find({ company: company.slug, active: true }).select('slug title category totalDurationMin sectionTimed patternStatus description sections.name sections.durationMin').lean(),
    Promise.all(SUBJECTS.map((s) => Question.countDocuments({ companies: company.slug, subject: s, active: true }))),
  ]);
  res.json({
    company,
    patterns: patterns.map((p) => ({ ...p, priorities: (p.priorities || []).map(withFrequency) })),
    mocks, questionCounts: Object.fromEntries(SUBJECTS.map((s, i) => [s, counts[i]])),
  });
}));

router.get('/:slug/priorities', asyncHandler(async (req, res) => {
  const patterns = await CompanyPattern.find({ company: req.params.slug }).lean();
  if (!patterns.length) throw new ApiError(404, 'NOT_FOUND', 'No pattern data for this company.');
  const order = { High: 0, Medium: 1, Low: 2 };
  const items = patterns.flatMap((p) => (p.priorities || []).map((x) => ({ ...withFrequency(x), track: p.track })));
  items.sort((a, b) => order[a.level] - order[b.level]);
  res.json({ items });
}));
module.exports = router;
