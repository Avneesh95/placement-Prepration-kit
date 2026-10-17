const router = require('express').Router();
const { FAQ } = require('../models');
const { asyncHandler, escapeRegex } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
router.use(requireAuth);
router.get('/', asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.category) f.category = String(req.query.category);
  if (req.query.company) f.company = String(req.query.company);
  if (req.query.q) { const r = { $regex: escapeRegex(String(req.query.q).slice(0, 100)), $options: 'i' }; f.$or = [{ question: r }, { answer: r }]; }
  const items = await FAQ.find(f).sort({ category: 1, order: 1 }).lean();
  const categories = [...new Set((await FAQ.find().select('category').lean()).map((x) => x.category))];
  res.json({ items, categories, total: items.length });
}));
module.exports = router;
