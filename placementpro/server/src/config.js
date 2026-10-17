require('dotenv').config();
const isProd = process.env.NODE_ENV === 'production';
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production');
}
module.exports = {
  isProd,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/placementpro',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me-please-0000',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  cookieName: 'pp_token',
  cookieMaxAgeMs: 12 * 60 * 60 * 1000,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173,https://helloprep.netlify.app',
  sqlTimeoutMs: Number(process.env.SQL_TIMEOUT_MS) || 3000,
};
