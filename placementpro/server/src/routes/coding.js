const router = require('express').Router();
const { z } = require('zod');
const { Question, CodingSubmission, Bookmark } = require('../models');
const { asyncHandler, ApiError, escapeRegex } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { recordAttempt } = require('../services/progress');
const { annotate } = require('./questions');
router.use(requireAuth);

const HIDE = '-correct -numericAnswer -tolerance -explanation -coding.referenceSolutions -coding.testCases -coding.edgeCases -coding.complexity -coding.top100 -sql';
const listQ = z.object({
  company: z.string().optional(), topic: z.string().optional(), difficulty: z.enum(['easy', 'medium', 'hard']).optional(), language: z.enum(['java', 'c', 'cpp', 'python']).optional(),
  status: z.enum(['solved', 'unsolved', 'attempted']).optional(), bookmarked: z.enum(['true', 'false']).optional(), collection: z.enum(['top100', 'beginner', 'intermediate', 'advanced']).optional(),
  q: z.string().max(100).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(50).default(20),
});

const LEETCODE_MAP = {
  'coding-sum-of-digits': 'https://leetcode.com/problems/add-digits/',
  'coding-prime-check': 'https://leetcode.com/problems/count-primes/',
  'coding-gcd-lcm': 'https://leetcode.com/problems/find-greatest-common-divisor-of-array/',
  'coding-two-sum': 'https://leetcode.com/problems/two-sum/',
  'coding-palindrome-check': 'https://leetcode.com/problems/valid-palindrome/',
  'coding-valid-parentheses': 'https://leetcode.com/problems/valid-parentheses/',
  'coding-binary-search': 'https://leetcode.com/problems/binary-search/',
  'coding-rotate-array': 'https://leetcode.com/problems/rotate-array/',
  'coding-maximum-subarray': 'https://leetcode.com/problems/maximum-subarray/',
  'coding-first-non-repeating-char': 'https://leetcode.com/problems/first-unique-character-in-a-string/',
  'coding-longest-substring-no-repeat': 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
  'coding-subarray-sum-equals-k': 'https://leetcode.com/problems/subarray-sum-equals-k/',
  'coding-coin-change': 'https://leetcode.com/problems/coin-change/',
  'coding-climbing-stairs': 'https://leetcode.com/problems/climbing-stairs/',
  'coding-number-of-islands': 'https://leetcode.com/problems/number-of-islands/',
  'coding-next-greater-element': 'https://leetcode.com/problems/next-greater-element-i/',
  'coding-best-time-to-buy-sell': 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
  'coding-merge-intervals': 'https://leetcode.com/problems/merge-intervals/',
  'coding-single-number': 'https://leetcode.com/problems/single-number/',
  'coding-top-k-largest': 'https://leetcode.com/problems/kth-largest-element-in-an-array/',
  'coding-binary-tree-height': 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
  'coding-activity-selection': 'https://leetcode.com/problems/non-overlapping-intervals/',
  'coding-container-with-most-water': 'https://leetcode.com/problems/container-with-most-water/',
  'coding-spiral-matrix': 'https://leetcode.com/problems/spiral-matrix/',
  'coding-count-subsets-with-sum': 'https://leetcode.com/problems/target-sum/',
};

const withLeetCode = (q) => {
  if (!q) return q;
  const url = q.coding?.leetcodeUrl || LEETCODE_MAP[q.uid] || null;
  return {
    ...q,
    coding: q.coding ? { ...q.coding, leetcodeUrl: url } : { leetcodeUrl: url },
  };
};

router.get('/', asyncHandler(async (req, res) => {
  const p = listQ.parse(req.query);
  const f = { subject: 'coding', active: true };
  if (p.company) f.companies = p.company; if (p.topic) f.topic = p.topic; if (p.difficulty) f.difficulty = p.difficulty;
  if (p.q) f.text = { $regex: escapeRegex(p.q), $options: 'i' };
  if (p.collection === 'top100') f['coding.top100'] = true;
  if (p.collection === 'beginner') f.difficulty = 'easy'; if (p.collection === 'intermediate') f.difficulty = 'medium'; if (p.collection === 'advanced') f.difficulty = 'hard';
  const subs = await CodingSubmission.find({ user: req.user._id }).select('question selfStatus language').lean();
  const attempted = [...new Set(subs.map((s) => String(s.question)))], solved = [...new Set(subs.filter((s) => s.selfStatus === 'solved').map((s) => String(s.question)))];
  const conds = [];
  if (p.status === 'solved') conds.push({ _id: { $in: solved } }); if (p.status === 'attempted') conds.push({ _id: { $in: attempted } }); if (p.status === 'unsolved') conds.push({ _id: { $nin: solved } });
  if (p.language) conds.push({ _id: { $in: [...new Set(subs.filter((s) => s.language === p.language).map((s) => String(s.question)))] } });
  if (p.bookmarked === 'true') conds.push({ _id: { $in: (await Bookmark.find({ user: req.user._id }).select('question').lean()).map((b) => b.question) } });
  if (conds.length) f.$and = conds;
  const [items, total] = await Promise.all([Question.find(f).select(`${HIDE} -coding.hints -coding.examples`).sort({ uid: 1 }).skip((p.page - 1) * p.limit).limit(p.limit).lean(), Question.countDocuments(f)]);
  const ann = await annotate(req.user._id, items);
  const sm = new Set(solved), am = new Set(attempted);
  res.json({ items: ann.map((q) => withLeetCode({ ...q, userState: { ...q.userState, solved: sm.has(String(q._id)), attempted: am.has(String(q._id)) } })), page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit),
    note: 'Code is not executed on the server. Statuses reflect your own self-assessment.' });
}));

router.get('/daily', asyncHandler(async (req, res) => {
  const all = await Question.find({ subject: 'coding', active: true }).select('_id uid').sort({ uid: 1 }).lean();
  if (!all.length) throw new ApiError(404, 'NOT_FOUND', 'No coding problems available.');
  const d = Math.floor(Date.now() / 86400000);
  const pick = all[(d * 7 + 3) % all.length];
  const q = await Question.findById(pick._id).select(HIDE).lean();
  res.json({ question: withLeetCode((await annotate(req.user._id, [q]))[0]) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const q = await Question.findOne({ _id: req.params.id, subject: 'coding', active: true }).select(HIDE).lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Problem not found.');
  const last = await CodingSubmission.findOne({ user: req.user._id, question: q._id }).sort({ createdAt: -1 }).lean();
  res.json({ question: withLeetCode((await annotate(req.user._id, [q]))[0]), lastSubmission: last, judging: { enabled: false, message: 'Practice interface: your code is saved but not executed. Compare with the reference solution and mark your own result.' } });
}));

router.post('/:id/submissions', asyncHandler(async (req, res) => {
  const b = z.object({ language: z.enum(['java', 'c', 'cpp', 'python']), code: z.string().min(1).max(20000), selfStatus: z.enum(['attempted', 'solved', 'needs_revision']).default('attempted'), timeSpentSec: z.number().min(0).max(36000).optional(), notes: z.string().max(1000).optional() }).parse(req.body);
  const q = await Question.findOne({ _id: req.params.id, subject: 'coding', active: true }).lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Problem not found.');
  const sub = await CodingSubmission.create({ ...b, user: req.user._id, question: q._id, judged: false });
  await recordAttempt(req.user._id, q, b.selfStatus === 'solved', b.timeSpentSec || 0);
  res.status(201).json({ submission: sub });
}));
router.get('/:id/submissions', asyncHandler(async (req, res) => {
  res.json({ items: await CodingSubmission.find({ user: req.user._id, question: req.params.id }).sort({ createdAt: -1 }).limit(30).lean() });
}));
router.post('/:id/reveal', asyncHandler(async (req, res) => {
  const q = await Question.findOne({ _id: req.params.id, subject: 'coding', active: true }).select('explanation coding.referenceSolutions coding.edgeCases coding.complexity coding.testCases').lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Problem not found.');
  res.json({ explanation: q.explanation, referenceSolutions: q.coding.referenceSolutions, edgeCases: q.coding.edgeCases, complexity: q.coding.complexity, sampleTests: (q.coding.testCases || []).filter((t) => !t.hidden) });
}));
module.exports = router;
