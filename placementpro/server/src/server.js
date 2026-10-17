const { createApp } = require('./app');
const { connect } = require('./db');
const config = require('./config');
const { sweepExpired } = require('./services/testEngine');
const { Question } = require('./models');
const { seed } = require('../seed/index');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`PlacementPro API listening on :${config.port}`);
});

let sweeperStarted = false;
async function onConnected() {
  console.log('MongoDB connected successfully.');
  if (!sweeperStarted) {
    sweeperStarted = true;
    setInterval(() => sweepExpired().catch((e) => console.error('sweep failed', e.message)), 30000).unref();
  }
  try {
    const count = await Question.countDocuments();
    if (count === 0) {
      console.log('Database is empty. Automatically seeding initial questions, mock tests, and companies...');
      await seed({ quiet: false });
      console.log('Automatic seeding completed.');
    }
  } catch (err) {
    console.error('Auto-seed check/execution failed:', err.message);
  }
}

function connectWithRetry() {
  connect()
    .then(onConnected)
    .catch((e) => {
      console.error('MongoDB connection failed, retrying in 5s:', e.message);
      setTimeout(connectWithRetry, 5000);
    });
}
connectWithRetry();
