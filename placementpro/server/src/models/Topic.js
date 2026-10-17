const mongoose = require('mongoose');
const s = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  subject: { type: String, required: true, index: true },
  subtopics: [String],
  concept: String,
  formulas: [String],
  shortcuts: [String],
  commonTraps: [String],
  solvedExampleUids: [String],
  order: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('Topic', s);
