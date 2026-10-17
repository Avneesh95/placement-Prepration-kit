const mongoose = require('mongoose');
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  subject: String, topic: String,
  attempts: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  lastCorrect: { type: Boolean, default: false },
  everCorrect: { type: Boolean, default: false },
  totalTimeSec: { type: Number, default: 0 },
  lastAttemptAt: Date,
}, { timestamps: true });
s.index({ user: 1, question: 1 }, { unique: true });
s.index({ user: 1, subject: 1 });
module.exports = mongoose.model('UserProgress', s);
