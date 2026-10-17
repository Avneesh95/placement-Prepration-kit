const mongoose = require('mongoose');
const s = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  company: { type: String, default: 'general', index: true },
  category: { type: String, enum: ['company_full', 'company_sectional', 'general', 'quant', 'reasoning', 'english', 'numerical', 'technical', 'coding', 'sql', 'cs'], required: true },
  description: String,
  sectionTimed: { type: Boolean, default: false },
  totalDurationMin: { type: Number, required: true },
  patternStatus: { type: String, enum: ['published_pattern', 'preparation_template'], default: 'preparation_template' },
  instructions: [String],
  sections: [{
    name: String, subject: String, durationMin: Number,
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  }],
  scoring: { override: { type: Boolean, default: false }, defaultMarks: { type: Number, default: 1 }, defaultNegative: { type: Number, default: 0 }, note: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model('MockTest', s);
