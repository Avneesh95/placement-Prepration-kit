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
  const origins = typeof config.clientOrigin === 'string' && config.clientOrigin.includes(',')
    ? config.clientOrigin.split(',').map((s) => s.trim())
    : config.clientOrigin;
  app.use(cors({ origin: origins, credentials: true }));
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
