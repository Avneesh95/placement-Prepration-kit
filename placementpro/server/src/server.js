const { createApp } = require('./app');
const { connect } = require('./db');
const config = require('./config');
const { sweepExpired } = require('./services/testEngine');
(async () => {
  await connect();
  const app = createApp();
  app.listen(config.port, () => console.log(`PlacementPro API listening on :${config.port}`));
  // Safety net: auto-submit attempts whose server deadline passed even if the browser is closed.
  setInterval(() => sweepExpired().catch((e) => console.error('sweep failed', e.message)), 30000).unref();
})().catch((e) => { console.error('Failed to start:', e.message); process.exit(1); });
