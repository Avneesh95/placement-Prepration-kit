const { createApp } = require('./app');
const { connect } = require('./db');
const config = require('./config');
const { sweepExpired } = require('./services/testEngine');
const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`PlacementPro API listening on :${config.port}`);
});

connect()
  .then(() => {
    console.log('MongoDB connected successfully.');
    setInterval(() => sweepExpired().catch((e) => console.error('sweep failed', e.message)), 30000).unref();
  })
  .catch((e) => {
    console.error('Initial MongoDB connection error:', e.message);
  });
