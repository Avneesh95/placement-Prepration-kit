const mongoose = require('mongoose');
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
  query: { type: String, required: true, maxlength: 5000 },
  status: { type: String, enum: ['correct', 'wrong_result', 'error', 'rejected'], required: true },
  message: String,
  rowCount: Number,
  runMs: Number,
}, { timestamps: true });
module.exports = mongoose.model('SQLSubmission', s);
