const mongoose = require('mongoose');
const priority = new mongoose.Schema({
  topic: String, subject: String,
  level: { type: String, enum: ['High', 'Medium', 'Low'] },
  reason: String,
  // Evidence is only present when a documented sample exists. Frequency is derived, never stored as a guess.
  evidence: { sampleSize: Number, appearedIn: Number, period: String, sourceNote: String },
  recommendedPracticeCount: Number, estimatedPrepHours: Number,
  lastVerified: { type: Date, default: null },
}, { _id: false });
const patternSchema = new mongoose.Schema({
  company: { type: String, required: true, index: true },
  track: { type: String, required: true },
  assessmentYear: { type: Number, required: true },
  status: { type: String, enum: ['published_pattern', 'preparation_template'], default: 'preparation_template' },
  summary: String,
  sections: [{ name: String, subject: String, topics: [String], questionCount: String, durationMin: Number, notes: String }],
  scoringNotes: String,
  priorities: [priority],
  sourceUrl: { type: String, default: '' },
  sourceRef: { type: mongoose.Schema.Types.ObjectId, ref: 'SourceReference' },
  dateVerified: { type: Date, default: null },
  confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  disclaimer: String,
}, { timestamps: true });
patternSchema.index({ company: 1, track: 1, assessmentYear: 1 }, { unique: true });
module.exports = mongoose.model('CompanyPattern', patternSchema);
