const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  tagline: String,
  officialLinks: [{ label: String, url: String }],
  roles: [{ name: String, note: String }],
  eligibility: [String],
  stages: [String],
  technicalInterview: [{ topic: String, points: [String] }],
  hrQuestions: [{ q: String, tip: String }],
  lastMinute: [String],
  patternStatus: { type: String, enum: ['published_pattern', 'preparation_template'], default: 'preparation_template' },
}, { timestamps: true });
module.exports = mongoose.model('Company', companySchema);
