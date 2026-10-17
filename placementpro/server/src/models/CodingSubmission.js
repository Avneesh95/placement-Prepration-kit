const mongoose = require('mongoose');
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
  language: { type: String, enum: ['java', 'c', 'cpp', 'python'], required: true },
  code: { type: String, required: true, maxlength: 20000 },
  // Code is NOT executed. Status is the student's own self-assessment.
  judged: { type: Boolean, default: false },
  selfStatus: { type: String, enum: ['attempted', 'solved', 'needs_revision'], default: 'attempted' },
  timeSpentSec: { type: Number, default: 0 },
  notes: { type: String, maxlength: 1000 },
}, { timestamps: true });
module.exports = mongoose.model('CodingSubmission', s);
