const router = require('express').Router();
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { Question, SQLSubmission } = require('../models');
const { asyncHandler, ApiError } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { validateQuery, runInSandbox, gradeSql } = require('../services/sqlRunner');
const { recordAttempt } = require('../services/progress');
const { annotate } = require('./questions');
const config = require('../config');
router.use(requireAuth);
const limiter = config.isTest ? (_q, _s, n) => n() : rateLimit({ windowMs: 60 * 1000, limit: 30, message: { error: { code: 'RATE_LIMITED', message: 'Slow down: 30 query runs per minute.' } } });
const HIDE = Question.HIDDEN;
const parsePreview = (tp = []) => tp.map((t) => ({ name: t.name, columns: t.columns, rows: JSON.parse(t.rowsJson || '[]') }));

const SQL_LEETCODE_MAP = {
  'sql-select-where-001': 'https://leetcode.com/problems/big-countries/',
  'sql-order-distinct-002': 'https://leetcode.com/problems/article-views-i/',
  'sql-aggregates-003': 'https://leetcode.com/problems/average-selling-price/',
  'sql-group-by-004': 'https://leetcode.com/problems/number-of-unique-subjects-taught-by-each-teacher/',
  'sql-having-005': 'https://leetcode.com/problems/classes-more-than-5-students/',
  'sql-inner-join-006': 'https://leetcode.com/problems/combine-two-tables/',
  'sql-left-join-007': 'https://leetcode.com/problems/customer-who-visited-but-did-not-make-any-transactions/',
  'sql-self-join-008': 'https://leetcode.com/problems/employees-earning-more-than-their-managers/',
  'sql-subqueries-009': 'https://leetcode.com/problems/employees-earning-more-than-their-managers/',
  'sql-correlated-subqueries-010': 'https://leetcode.com/problems/department-highest-salary/',
  'sql-case-expressions-011': 'https://leetcode.com/problems/triangle-judgement/',
  'sql-null-handling-012': 'https://leetcode.com/problems/find-customer-referee/',
  'sql-string-date-functions-013': 'https://leetcode.com/problems/user-activity-for-the-past-30-days-i/',
  'sql-duplicates-014': 'https://leetcode.com/problems/duplicate-emails/',
  'sql-second-highest-salary-015': 'https://leetcode.com/problems/second-highest-salary/',
  'sql-nth-highest-salary-016': 'https://leetcode.com/problems/nth-highest-salary/',
  'sql-window-ranking-017': 'https://leetcode.com/problems/rank-scores/',
  'sql-cte-018': 'https://leetcode.com/problems/department-top-three-salaries/',
  'sql-anti-join-019': 'https://leetcode.com/problems/customers-who-never-order/',
  'sql-top-n-020': 'https://leetcode.com/problems/customer-placing-the-largest-number-of-orders/',
  'sql-running-total-021': 'https://leetcode.com/problems/restaurant-growth/',
  'sql-department-top-earner-022': 'https://leetcode.com/problems/department-highest-salary/',
};

const withSqlLeetCode = (q) => {
  if (!q) return q;
  const url = q.sql?.leetcodeUrl || SQL_LEETCODE_MAP[q.uid] || null;
  return {
    ...q,
    sql: q.sql ? { ...q.sql, leetcodeUrl: url } : { leetcodeUrl: url },
  };
};

router.get('/', asyncHandler(async (req, res) => {
  const f = { subject: 'sql', active: true };
  if (req.query.topic) f.topic = String(req.query.topic); if (req.query.difficulty) f.difficulty = String(req.query.difficulty);
  const items = await Question.find(f).select(`${HIDE} -sql.schemaSql -sql.tablesPreview`).sort({ uid: 1 }).lean();
  const subs = await SQLSubmission.find({ user: req.user._id }).select('question status').lean();
  const solved = new Set(subs.filter((s) => s.status === 'correct').map((s) => String(s.question))); const tried = new Set(subs.map((s) => String(s.question)));
  const status = req.query.status;
  const out = items.map((q) => ({ ...q, userState: { solved: solved.has(String(q._id)), attempted: tried.has(String(q._id)) } })).filter((q) => !status || (status === 'solved' ? q.userState.solved : !q.userState.solved));
  res.json({ items: out.map(withSqlLeetCode), total: out.length });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  const q = await Question.findOne({ _id: req.params.id, subject: 'sql', active: true }).select(HIDE).lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Exercise not found.');
  const subs = await SQLSubmission.find({ user: req.user._id, question: q._id }).sort({ createdAt: -1 }).limit(10).lean();
  const ann = (await annotate(req.user._id, [q]))[0]; ann.sql = { ...ann.sql, tablesPreview: parsePreview(ann.sql.tablesPreview) };
  res.json({ question: withSqlLeetCode(ann), recentSubmissions: subs, sandbox: 'Queries run in a throwaway in-memory SQLite database. It is read-only and separate from the application database.' });
}));
const bodyS = z.object({ query: z.string().max(5000) });
// Run (not graded): lets students explore the schema.
router.post('/:id/run', limiter, asyncHandler(async (req, res) => {
  const { query } = bodyS.parse(req.body);
  const q = await Question.findOne({ _id: req.params.id, subject: 'sql', active: true }).lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Exercise not found.');
  const reason = validateQuery(query);
  if (reason) return res.status(400).json({ error: { code: 'QUERY_REJECTED', message: reason } });
  const r = await runInSandbox({ schemaSql: q.sql.schemaSql, seedSql: q.sql.seedSql, query });
  if (!r.ok) return res.status(400).json({ error: { code: r.timedOut ? 'QUERY_TIMEOUT' : 'SQL_ERROR', message: r.error } });
  res.json({ columns: r.columns, rows: r.rows.slice(0, 50), rowCount: r.rows.length, runMs: r.ms });
}));
router.post('/:id/submit', limiter, asyncHandler(async (req, res) => {
  const { query } = bodyS.parse(req.body);
  const q = await Question.findOne({ _id: req.params.id, subject: 'sql', active: true }).lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Exercise not found.');
  const g = await gradeSql(q, query);
  await SQLSubmission.create({ user: req.user._id, question: q._id, query, status: g.status, message: g.message, rowCount: g.rowCount, runMs: g.runMs });
  if (g.status !== 'rejected') await recordAttempt(req.user._id, q, g.status === 'correct', 0);
  res.json({ ...g, correct: g.status === 'correct' });
}));
router.post('/:id/reveal', asyncHandler(async (req, res) => {
  const q = await Question.findOne({ _id: req.params.id, subject: 'sql', active: true }).select('explanation sql.referenceQuery sql.expected').lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Exercise not found.');
  const exp = q.sql && q.sql.expected ? { columns: q.sql.expected.columns || [], rows: JSON.parse(q.sql.expected.rowsJson || '[]') } : { columns: [], rows: [] };
  res.json({ referenceQuery: q.sql?.referenceQuery || '', expected: exp, explanation: q.explanation || '' });
}));
module.exports = router;
