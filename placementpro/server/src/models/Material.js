const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['formula_sheet', 'quick_notes', 'mock_test', 'pyq', 'company_guide'],
      required: true,
      index: true,
    },
    subject: {
      type: String,
      enum: ['aptitude', 'reasoning', 'english', 'cs', 'coding', 'sql', 'general'],
      default: 'general',
      index: true,
    },
    topic: { type: String, default: null, index: true },
    companies: { type: [String], default: [] },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'all'], default: 'all' },
    description: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSizeKB: { type: Number, default: 0 },
    pageCount: { type: Number, default: 1 },
    language: { type: String, default: 'English' },
    verificationStatus: {
      type: String,
      enum: ['original_guide', 'verified_pattern', 'practice_model'],
      default: 'original_guide',
    },
    downloadCount: { type: Number, default: 0 },
    tags: [String],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

materialSchema.index({ category: 1, subject: 1 });
materialSchema.index({ companies: 1 });

module.exports = mongoose.model('Material', materialSchema);
