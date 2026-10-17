const mongoose = require('mongoose');
const SUBJECTS = ['aptitude', 'reasoning', 'english', 'cs', 'coding', 'sql'];
const PROVENANCE = ['verified_pyq', 'official_sample', 'memory_based', 'practice', 'high_priority_practice'];
const s = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  companies: { type: [String], default: [], index: true },
  assessmentYear: { type: Number, default: null },
  subject: { type: String, enum: SUBJECTS, required: true, index: true },
  topic: { type: String, required: true, index: true },
  subtopic: String,
  type: { type: String, enum: ['mcq_single', 'mcq_multi', 'numeric', 'sql', 'coding'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
  text: { type: String, required: true },
  options: [String],
  correct: { type: [Number], default: undefined },          // option indexes (mcq)
  numericAnswer: Number, tolerance: { type: Number, default: 0 },
  explanation: { type: String, default: '' },
  provenance: { type: String, enum: PROVENANCE, default: 'practice', index: true },
  sourceTitle: String, sourceUrl: String,
  verificationStatus: { type: String, enum: ['verified', 'unverified', 'original'], default: 'original' },
  dateVerified: { type: Date, default: null },
  marks: { type: Number, default: 1 }, negativeMarks: { type: Number, default: 0 },
  estimatedSeconds: { type: Number, default: 60 },
  tags: [String],
  // Coding problems (practice interface only; not auto-judged)
  coding: {
    statement: String, constraints: [String], inputFormat: String, outputFormat: String,
    examples: [{ input: String, output: String, explanation: String }],
    hints: [String], edgeCases: [String], complexity: String,
    referenceSolutions: { java: String, python: String },
    testCases: [{ input: String, output: String, hidden: Boolean }],
    top100: Boolean,
    leetcodeUrl: String,
  },
  // SQL exercises (executed in an isolated in-memory SQLite sandbox)
  sql: {
    schemaSql: String, seedSql: String, referenceQuery: String, orderMatters: { type: Boolean, default: false },
    // Row data is stored as JSON text so the schema works on any MongoDB-compatible server (nested arrays are not universally supported).
    expected: { columns: [String], rowsJson: String },
    tablesPreview: [{ name: String, columns: [String], rowsJson: String }],
    leetcodeUrl: String,
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });
s.index({ subject: 1, topic: 1, difficulty: 1 });
s.statics.SUBJECTS = SUBJECTS; s.statics.PROVENANCE = PROVENANCE;
// Fields that must never reach a client before the answer is revealed.
s.statics.HIDDEN = '-correct -numericAnswer -tolerance -explanation -coding.referenceSolutions -coding.testCases -coding.hints -coding.edgeCases -coding.complexity -sql.referenceQuery -sql.expected -sql.seedSql';
module.exports = mongoose.model('Question', s);
