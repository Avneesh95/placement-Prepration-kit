const mongoose = require('mongoose');
const { mongoUri } = require('./config');
async function connect(uri = mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}
module.exports = { connect, disconnect: () => mongoose.disconnect() };
