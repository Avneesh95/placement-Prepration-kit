const mongoose = require('mongoose');
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
}, { timestamps: true });
s.index({ user: 1, question: 1 }, { unique: true });
module.exports = mongoose.model('Bookmark', s);
