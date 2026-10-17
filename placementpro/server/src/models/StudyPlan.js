const mongoose = require('mongoose');
const task = new mongoose.Schema({
  day: { type: Number, required: true },
  date: { type: String, required: true },
  originalDate: String,
  kind: { type: String, enum: ['practice', 'revise', 'coding', 'sql', 'mock', 'review'], default: 'practice' },
  subject: String, topic: String,
  title: String, targetCount: Number, minutes: Number,
  reason: String,
  done: { type: Boolean, default: false },
  doneAt: Date,
});
const s = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  durationDays: { type: Number, enum: [30, 60, 90], required: true },
  startDate: { type: String, required: true },
  dailyHours: Number,
  targetCompanies: [String],
  language: String,
  proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  examDate: String,
  tasks: [task],
}, { timestamps: true });
module.exports = mongoose.model('StudyPlan', s);
