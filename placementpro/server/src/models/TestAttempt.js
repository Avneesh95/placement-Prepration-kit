const mongoose = require('mongoose');
const answer = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  response: mongoose.Schema.Types.Mixed,   // array of option indexes | number | string
  markedForReview: { type: Boolean, default: false },
  timeSpentSec: { type: Number, default: 0 },
  visited: { type: Boolean, default: false },
}, { _id: false });
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', required: true, index: true },
  status: { type: String, enum: ['in_progress', 'submitting', 'submitted'], default: 'in_progress', index: true },
  startedAt: { type: Date, required: true },
  deadline: { type: Date, required: true },
  sectionDeadlines: [Date],
  answers: [answer],
  submittedAt: Date,
  autoSubmitted: { type: Boolean, default: false },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });
s.index({ user: 1, test: 1, status: 1 });
module.exports = mongoose.model('TestAttempt', s);
