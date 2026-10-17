const { ZodError } = require('zod');
const mongoose = require('mongoose');
const { ApiError } = require('../utils/errors');
const config = require('../config');
const notFound = (req, _res, next) => next(new ApiError(404, 'NOT_FOUND', `No route for ${req.method} ${req.originalUrl}`));
// Consistent shape: { error: { code, message, details? } }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please check the highlighted fields.', details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) } });
  }
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ error: { code: 'BAD_ID', message: 'Invalid identifier.' } });
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } });
  if (err && err.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE', message: 'That record already exists.' } });
  if (err instanceof ApiError) return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Request body is not valid JSON.' } });
  if (!config.isTest) console.error(err);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Something went wrong on our side. Please try again.' } });
};
module.exports = { notFound, errorHandler };
