const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const { User } = require('../models');
const config = require('../config');
const { ApiError, asyncHandler } = require('../utils/errors');
const { signToken, cookieOptions, requireAuth } = require('../middleware/auth');

const limiter = config.isTest ? (_q, _s, n) => n() : rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in a few minutes.' } } });
const password = z.string().min(8, 'Use at least 8 characters').max(100).regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number');
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password, graduationYear: z.coerce.number().int().min(2024).max(2035).default(2027),
});
const hash = (t) => crypto.createHash('sha256').update(t).digest('hex');

router.post('/register', limiter, asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  if (await User.findOne({ email: body.email })) throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  const user = await User.create({ name: body.name, email: body.email, graduationYear: body.graduationYear, passwordHash: await bcrypt.hash(body.password, 12) });
  res.cookie(config.cookieName, signToken(user), cookieOptions());
  res.status(201).json({ user: user.toPublic() });
}));

router.post('/login', limiter, asyncHandler(async (req, res) => {
  const { email, password: pw } = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) }).parse(req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(pw, user.passwordHash));
  if (!ok) throw new ApiError(401, 'BAD_CREDENTIALS', 'Email or password is incorrect.');
  res.cookie(config.cookieName, signToken(user), cookieOptions());
  res.json({ user: user.toPublic() });
}));

router.post('/logout', (_req, res) => { res.clearCookie(config.cookieName, { ...cookieOptions(), maxAge: undefined }); res.json({ ok: true }); });
router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toPublic() }));

// Email delivery is not configured in this build. In non-production the reset token is returned so the flow can be tested.
router.post('/forgot-password', limiter, asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
  const user = await User.findOne({ email });
  const out = { message: 'If an account exists for that email, a reset link has been sent.' };
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.resetTokenHash = hash(token); user.resetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();
    if (!config.isProd) out.devResetToken = token;
  }
  res.json(out);
}));

router.post('/reset-password', limiter, asyncHandler(async (req, res) => {
  const { token, password: pw } = z.object({ token: z.string().min(10), password }).parse(req.body);
  const user = await User.findOne({ resetTokenHash: hash(token), resetExpires: { $gt: new Date() } }).select('+resetTokenHash +resetExpires +passwordHash');
  if (!user) throw new ApiError(400, 'BAD_RESET_TOKEN', 'This reset link is invalid or has expired.');
  user.passwordHash = await bcrypt.hash(pw, 12); user.resetTokenHash = undefined; user.resetExpires = undefined;
  await user.save();
  res.json({ message: 'Password updated. You can log in now.' });
}));
module.exports = router;
