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

router.get('/', asyncHandler(async (req, res) => {
  const f = { subject: 'sql', active: true };
  if (req.query.topic) f.topic = String(req.query.topic); if (req.query.difficulty) f.difficulty = String(req.query.difficulty);
  const items = await Question.find(f).select(`${HIDE} -sql.schemaSql -sql.tablesPreview`).sort({ uid: 1 }).lean();
  const subs = await SQLSubmission.find({ user: req.user._id }).select('question status').lean();
  const solved = new Set(subs.filter((s) => s.status === 'correct').map((s) => String(s.question))); const tried = new Set(subs.map((s) => String(s.question)));
  const status = req.query.status;
  const out = items.map((q) => ({ ...q, userState: { solved: solved.has(String(q._id)), attempted: tried.has(String(q._id)) } })).filter((q) => !status || (status === 'solved' ? q.userState.solved : !q.userState.solved));
  res.json({ items: out, total: out.length });
}));
router.get('/:id', asyncHandler(async (req, res) => {
  const q = await Question.findOne({ _id: req.params.id, subject: 'sql', active: true }).select(HIDE).lean();
  if (!q) throw new ApiError(404, 'NOT_FOUND', 'Exercise not found.');
  const subs = await SQLSubmission.find({ user: req.user._id, question: q._id }).sort({ createdAt: -1 }).limit(10).lean();
  const ann = (await annotate(req.user._id, [q]))[0]; ann.sql = { ...ann.sql, tablesPreview: parsePreview(ann.sql.tablesPreview) };
  res.json({ question: ann, recentSubmissions: subs, sandbox: 'Queries run in a throwaway in-memory SQLite database. It is read-only and separate from the application database.' });
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
