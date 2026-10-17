const mongoose = require('mongoose');
const { mongoUri } = require('./config');

let lastDbError = null;

async function connect(uri = mongoUri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    lastDbError = null;
    return mongoose.connection;
  } catch (err) {
    lastDbError = err.message || String(err);
    throw err;
  }
}

module.exports = {
  connect,
  disconnect: () => mongoose.disconnect(),
  getDbError: () => lastDbError,
};
