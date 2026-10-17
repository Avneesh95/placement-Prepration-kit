const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError, asyncHandler } = require('../utils/errors');
const { User } = require('../models');

const signToken = (user) => jwt.sign({ sub: String(user._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
const cookieOptions = () => ({ httpOnly: true, sameSite: 'lax', secure: config.isProd, maxAge: config.cookieMaxAgeMs, path: '/' });

const requireAuth = asyncHandler(async (req, _res, next) => {
  let token = req.cookies && req.cookies[config.cookieName];
  const h = req.headers.authorization;
  if (!token && h && h.startsWith('Bearer ')) token = h.slice(7);
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Please log in to continue.');
  let payload;
  try { payload = jwt.verify(token, config.jwtSecret); }
  catch { throw new ApiError(401, 'INVALID_TOKEN', 'Your session has expired. Please log in again.'); }
  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, 'INVALID_TOKEN', 'Account not found. Please log in again.');
  req.user = user;
  next();
});
module.exports = { signToken, cookieOptions, requireAuth };
