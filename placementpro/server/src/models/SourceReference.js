const mongoose = require('mongoose');
const s = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  url: { type: String, default: '' },
  publisher: String,
  kind: { type: String, enum: ['official_page', 'official_sample', 'candidate_reports', 'original_authoring', 'textbook_reference'], default: 'original_authoring' },
  dateVerified: { type: Date, default: null },
  notes: String,
}, { timestamps: true });
module.exports = mongoose.model('SourceReference', s);
