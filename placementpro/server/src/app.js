const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const config = require('./config');
const { notFound, errorHandler } = require('./middleware/error');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  const parseOrigins = () => {
    const raw = typeof config.clientOrigin === 'string'
      ? config.clientOrigin.split(',')
      : Array.isArray(config.clientOrigin)
        ? config.clientOrigin
        : [String(config.clientOrigin)];
    const list = raw.map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
    if (!list.includes('https://helloprep.netlify.app')) {
      list.push('https://helloprep.netlify.app');
    }
    return list;
  };
  const allowedOrigins = parseOrigins();

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api', require('./routes/profile'));
  app.use('/api/companies', require('./routes/companies'));
  const q = require('./routes/questions');
  app.use('/api/questions', q.router);
  app.use('/api/topics', q.topics);
  app.use('/api/bookmarks', q.bookmarks);
  const m = require('./routes/mocks');
  app.use('/api/mocks', m.router);
  app.use('/api/attempts', m.attempts);
  app.use('/api/coding', require('./routes/coding'));
  app.use('/api/sql', require('./routes/sql'));
  app.use('/api/faqs', require('./routes/faqs'));
  app.use('/api/plan', require('./routes/plan'));
  app.use('/api', notFound);

  const dist = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
module.exports = { createApp };
