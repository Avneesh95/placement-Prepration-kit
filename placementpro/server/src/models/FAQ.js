const mongoose = require('mongoose');
const s = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true },
  company: { type: String, default: null },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  links: [{ label: String, url: String }],
  order: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model('FAQ', s);
