const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  graduationYear: { type: Number, default: 2027, min: 2024, max: 2035 },
  branch: { type: String, default: 'Computer Science & Engineering', trim: true, maxlength: 80 },
  college: { type: String, default: '', trim: true, maxlength: 120 },
  targetCompanies: { type: [String], default: [] },
  preferredLanguage: { type: String, enum: ['java', 'c', 'cpp', 'python'], default: 'java' },
  prepStartDate: { type: Date, default: Date.now },
  dailyStudyHours: { type: Number, default: 3, min: 0.5, max: 16 },
  examDate: { type: Date, default: null },
  resetTokenHash: { type: String, select: false },
  resetExpires: { type: Date, select: false },
}, { timestamps: true });
userSchema.methods.toPublic = function () {
  const o = this.toObject();
  delete o.passwordHash; delete o.resetTokenHash; delete o.resetExpires; delete o.__v;
  return o;
};
module.exports = mongoose.model('User', userSchema);
