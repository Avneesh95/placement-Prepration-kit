const { UserProgress, DailyActivity } = require('../models');
const today = () => new Date().toISOString().slice(0, 10);

async function recordAttempt(userId, q, correct, timeSec = 0) {
  const t = Math.max(0, Math.min(Number(timeSec) || 0, 3600));
  const set = { subject: q.subject, topic: q.topic, lastCorrect: correct, lastAttemptAt: new Date() };
  if (correct) set.everCorrect = true;
  await UserProgress.findOneAndUpdate(
    { user: userId, question: q._id },
    { $set: set, $inc: { attempts: 1, correctCount: correct ? 1 : 0, totalTimeSec: t }, $setOnInsert: { user: userId, question: q._id } },
    { upsert: true },
  );
  await DailyActivity.findOneAndUpdate(
    { user: userId, date: today() },
    { $inc: { questions: 1, correct: correct ? 1 : 0, minutes: t / 60 }, $setOnInsert: { user: userId, date: today() } },
    { upsert: true },
  );
}
module.exports = { recordAttempt, today };
