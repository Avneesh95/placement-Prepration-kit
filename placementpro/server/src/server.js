const { createApp } = require('./app');
const { connect } = require('./db');
const config = require('./config');
const { sweepExpired } = require('./services/testEngine');
const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`PlacementPro API listening on :${config.port}`);
});

let sweeperStarted = false;
function connectWithRetry() {
  connect()
    .then(() => {
      console.log('MongoDB connected successfully.');
      if (!sweeperStarted) {
        sweeperStarted = true;
        setInterval(() => sweepExpired().catch((e) => console.error('sweep failed', e.message)), 30000).unref();
      }
    })
    .catch((e) => {
      console.error('MongoDB connection failed, retrying in 5s:', e.message);
      setTimeout(connectWithRetry, 5000);
    });
}
connectWithRetry();
