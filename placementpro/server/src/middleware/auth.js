const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError, asyncHandler } = require('../utils/errors');
const { User } = require('../models');

const signToken = (user) => jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
const cookieOptions = () => {
  const isCrossSite = config.isProd || process.env.COOKIE_SAMESITE === 'none';
  return {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || (isCrossSite ? 'none' : 'lax'),
    secure: isCrossSite,
    maxAge: config.cookieMaxAgeMs,
    path: '/',
  };
};

const requireAuth = asyncHandler(async (req, _res, next) => {
  let token = null;
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) {
    token = h.slice(7);
  } else if (req.cookies && req.cookies[config.cookieName]) {
    token = req.cookies[config.cookieName];
  }
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
  let payload;
  try { payload = jwt.verify(token, config.jwtSecret); }
  catch { throw new ApiError(401, 'INVALID_TOKEN', 'Your session has expired. Please log in again.'); }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'INVALID_TOKEN', 'Account not found. Please log in again.');
  req.user = user;
  next();
});

const requireAdmin = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw new ApiError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
  const isAdmin = req.user.role === 'admin' ||
    req.user.email === 'admin@placementpro.com' ||
    req.user.email === 'admin@prepo.com' ||
    (process.env.ADMIN_EMAIL && req.user.email === process.env.ADMIN_EMAIL);
  if (!isAdmin) {
    throw new ApiError(403, 'FORBIDDEN', 'Administrator privileges required.');
  }
  next();
});

module.exports = { signToken, cookieOptions, requireAuth, requireAdmin };
