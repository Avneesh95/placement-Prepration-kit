const router = require('express').Router();
const { z } = require('zod');
const { Question, Topic, Company, CompanyPattern, UserProgress } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { annotate } = require('./questions');

router.use(requireAuth);

// GET /api/drill/syllabus - Full hierarchical syllabus with real DB question counts & user completion
router.get('/syllabus', asyncHandler(async (req, res) => {
  const companySlug = req.query.company || '';
  
  // Find all active questions matching company if specified
  const qFilter = { active: true };
  if (companySlug && companySlug !== 'all') {
    qFilter.companies = companySlug;
  }

  const [questions, topics, userProgress] = await Promise.all([
    Question.find(qFilter).select('subject topic difficulty companies type uid').lean(),
    Topic.find().sort({ subject: 1, order: 1 }).lean(),
    UserProgress.find({ user: req.user._id }).select('question subject topic attempts everCorrect lastCorrect').lean(),
  ]);

  const progressByQuestion = new Map(userProgress.map((p) => [String(p.question), p]));

  // Build aggregated topic counts and stats
  const topicMap = new Map();
  for (const t of topics) {
    topicMap.set(`${t.subject}::${t.slug}`, {
      slug: t.slug,
      name: t.title || t.slug,
      subject: t.subject,
      description: t.description || `Comprehensive concepts, formulas and practice problems for ${t.title || t.slug}`,
      totalQuestions: 0,
      attempted: 0,
      solved: 0,
      difficulties: { easy: 0, medium: 0, hard: 0 },
      questionTypes: new Set(),
      started: false,
      completed: false,
    });
  }

  // Count questions and match with user progress
  for (const q of questions) {
    const key = `${q.subject}::${q.topic}`;
    let t = topicMap.get(key);
    if (!t) {
      t = {
        slug: q.topic,
        name: q.topic.replace(/[-_]/g, ' '),
        subject: q.subject,
        description: `Topic coverage for ${q.topic}`,
        totalQuestions: 0,
        attempted: 0,
        solved: 0,
        difficulties: { easy: 0, medium: 0, hard: 0 },
        questionTypes: new Set(),
        started: false,
        completed: false,
      };
      topicMap.set(key, t);
    }
    t.totalQuestions++;
    if (q.difficulty && t.difficulties[q.difficulty] !== undefined) {
      t.difficulties[q.difficulty]++;
    }
    if (q.type) {
      t.questionTypes.add(q.type);
    }

    const up = progressByQuestion.get(String(q._id));
    if (up && up.attempts > 0) {
      t.attempted++;
      if (up.everCorrect) {
        t.solved++;
      }
    }
  }

  // Calculate percentages and status
  const syllabusList = [];
  for (const item of topicMap.values()) {
    if (item.totalQuestions > 0) {
      item.questionTypes = Array.from(item.questionTypes);
      item.accuracy = item.attempted > 0 ? Math.round((item.solved / item.attempted) * 100) : 0;
      item.started = item.attempted > 0;
      item.completed = item.solved >= item.totalQuestions && item.totalQuestions > 0;
      syllabusList.push(item);
    }
  }

  res.json({
    company: companySlug || 'all',
    totalTopics: syllabusList.length,
    syllabus: syllabusList,
  });
}));

// POST /api/drill/create - Build custom drill session based on exact user criteria
const createDrillSchema = z.object({
  company: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'any']).optional(),
  mode: z.enum(['quick', 'topic', 'company', 'weak', 'incorrect', 'bookmarked', 'mixed']).default('quick'),
  count: z.coerce.number().int().min(5).max(50).default(10),
  timed: z.boolean().default(false),
  durationMin: z.coerce.number().int().min(1).max(180).default(15),
});

router.post('/create', asyncHandler(async (req, res) => {
  const p = createDrillSchema.parse(req.body);
  const filter = { active: true };

  if (p.company && p.company !== 'all') {
    filter.companies = p.company;
  }
  if (p.subject && p.subject !== 'all') {
    filter.subject = p.subject;
  }
  if (p.topic && p.topic !== 'all') {
    filter.topic = p.topic;
  }
  if (p.difficulty && p.difficulty !== 'any') {
    filter.difficulty = p.difficulty;
  }

  // Handle drill modes
  if (p.mode === 'incorrect') {
    const wrongProgress = await UserProgress.find({ user: req.user._id, lastCorrect: false }).select('question').lean();
    filter._id = { $in: wrongProgress.map((wp) => wp.question) };
  } else if (p.mode === 'bookmarked') {
    const { Bookmark } = require('../models');
    const marks = await Bookmark.find({ user: req.user._id }).select('question').lean();
    filter._id = { $in: marks.map((m) => m.question) };
  } else if (p.mode === 'weak') {
    const progress = await UserProgress.find({ user: req.user._id }).lean();
    const weakTopics = progress.filter((pr) => pr.attempts >= 2 && !pr.lastCorrect).map((pr) => pr.topic);
    if (weakTopics.length > 0) {
      filter.topic = { $in: weakTopics };
    }
  }

  // Retrieve candidate questions
  let candidateQuestions = await Question.find(filter)
    .select(Question.HIDDEN)
    .limit(p.count * 3)
    .lean();

  if (candidateQuestions.length === 0) {
    throw new ApiError(404, 'NO_QUESTIONS', 'No practice questions matched your drill criteria. Please broaden your selection.');
  }

  // Shuffle candidate pool
  for (let i = candidateQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidateQuestions[i], candidateQuestions[j]] = [candidateQuestions[j], candidateQuestions[i]];
  }

  const selected = candidateQuestions.slice(0, p.count);
  const annotated = await annotate(req.user._id, selected);

  res.json({
    drillId: `drill_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: `${p.company && p.company !== 'all' ? p.company.toUpperCase() + ' ' : ''}${p.mode.toUpperCase()} Drill`,
    mode: p.mode,
    timed: p.timed,
    durationMin: p.durationMin,
    totalQuestions: annotated.length,
    questions: annotated,
    startedAt: new Date(),
  });
}));

module.exports = router;
