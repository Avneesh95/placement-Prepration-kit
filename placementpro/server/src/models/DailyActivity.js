const mongoose = require('mongoose');
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },   // YYYY-MM-DD (UTC)
  questions: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  minutes: { type: Number, default: 0 },
}, { timestamps: true });
s.index({ user: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('DailyActivity', s);
