const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const { z } = require('zod');
const { Material, Company } = require('../models');
const { asyncHandler, ApiError, escapeRegex } = require('../utils/errors');
const { requireAuth } = require('../middleware/auth');
const { PDF_DIR } = require('../services/pdfGenerator');

// Optional authentication: user data is attached if authenticated, but public access is allowed
router.use((req, res, next) => {
  const token = req.cookies?.pp_token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (!token) return next();
  try {
    const jwt = require('jsonwebtoken');
    const config = require('../config');
    const { User } = require('../models');
    const payload = jwt.verify(token, config.jwtSecret);
    User.findById(payload.sub).then((user) => {
      if (user) req.user = user;
      next();
    }).catch(() => next());
  } catch {
    next();
  }
});

// GET /api/materials - Searchable, filterable list of placement materials
const listSchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  difficulty: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get('/', asyncHandler(async (req, res) => {
  const p = listSchema.parse(req.query);
  const filter = { active: true };

  if (p.category && p.category !== 'all') {
    filter.category = p.category;
  }
  if (p.company && p.company !== 'all') {
    filter.companies = p.company;
  }
  if (p.subject && p.subject !== 'all') {
    filter.subject = p.subject;
  }
  if (p.topic && p.topic !== 'all') {
    filter.topic = p.topic;
  }
  if (p.difficulty && p.difficulty !== 'all') {
    filter.difficulty = p.difficulty;
  }
  if (p.q && p.q.trim()) {
    const rx = { $regex: escapeRegex(p.q.trim()), $options: 'i' };
    filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
  }

  const [items, total] = await Promise.all([
    Material.find(filter)
      .sort({ createdAt: -1 })
      .skip((p.page - 1) * p.limit)
      .limit(p.limit)
      .lean(),
    Material.countDocuments(filter),
  ]);

  res.json({
    items,
    page: p.page,
    limit: p.limit,
    total,
    pages: Math.ceil(total / p.limit) || 1,
  });
}));

// GET /api/materials/meta - Categories & counts for easy filter building
router.get('/meta', asyncHandler(async (_req, res) => {
  const materials = await Material.find({ active: true }).select('category subject companies').lean();
  const categories = {};
  const subjects = {};
  const companies = {};

  for (const m of materials) {
    categories[m.category] = (categories[m.category] || 0) + 1;
    subjects[m.subject] = (subjects[m.subject] || 0) + 1;
    for (const c of m.companies || []) {
      companies[c] = (companies[c] || 0) + 1;
    }
  }

  res.json({
    total: materials.length,
    categories,
    subjects,
    companies,
  });
}));

// GET /api/materials/:slug - Get single material details
router.get('/:slug', asyncHandler(async (req, res) => {
  const item = await Material.findOne({ slug: req.params.slug, active: true }).lean();
  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Material not found.');
  }
  res.json({ material: item });
}));

// GET /api/materials/:slug/download - Stream/download the PDF with proper safe headers
router.get('/:slug/download', asyncHandler(async (req, res) => {
  const item = await Material.findOne({ slug: req.params.slug, active: true });
  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Material not found.');
  }

  const filePath = path.join(PDF_DIR, item.fileName);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'FILE_MISSING', 'The requested PDF file is not available on the server.');
  }

  // Increment download counter
  await Material.updateOne({ _id: item._id }, { $inc: { downloadCount: 1 } });

  const safeFilename = encodeURIComponent(item.fileName);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${item.fileName}"; filename*=UTF-8''${safeFilename}`);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}));

// GET /api/materials/:slug/view - Stream inline for in-browser PDF preview
router.get('/:slug/view', asyncHandler(async (req, res) => {
  const item = await Material.findOne({ slug: req.params.slug, active: true });
  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Material not found.');
  }

  const filePath = path.join(PDF_DIR, item.fileName);
  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'FILE_MISSING', 'The requested PDF file is not available on the server.');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${item.fileName}"`);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
}));

module.exports = router;
