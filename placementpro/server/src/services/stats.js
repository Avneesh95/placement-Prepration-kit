const { Question, UserProgress, TestAttempt, MockTest, DailyActivity, Bookmark, CodingSubmission, SQLSubmission } = require('../models');
const SUBJECTS = ['aptitude', 'reasoning', 'english', 'coding', 'sql', 'cs'];
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
const dayStr = (d) => d.toISOString().slice(0, 10);

function computeStreak(dates) {
  const set = new Set(dates);
  let cur = new Date(); let streak = 0;
  if (!set.has(dayStr(cur))) cur = new Date(cur.getTime() - 86400000);   // allow "not yet studied today"
  while (set.has(dayStr(cur))) { streak++; cur = new Date(cur.getTime() - 86400000); }
  let longest = 0, run = 0; const sorted = [...set].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (i && (new Date(sorted[i]) - new Date(sorted[i - 1])) === 86400000) run++; else run = 1;
    longest = Math.max(longest, run);
  }
  return { current: streak, longest };
}

async function computeStats(user) {
  const uid = user._id;
  const [progress, activity, attempts, bookmarkCount, totals, codingSolved, sqlSolved] = await Promise.all([
    UserProgress.find({ user: uid }).lean(),
    DailyActivity.find({ user: uid }).sort({ date: 1 }).lean(),
    TestAttempt.find({ user: uid, status: 'submitted' }).select('test submittedAt autoSubmitted result.score result.maxScore result.percentage').sort({ submittedAt: -1 }).lean(),
    Bookmark.countDocuments({ user: uid }),
    Promise.all(SUBJECTS.map((s) => Question.countDocuments({ subject: s, active: true }))),
    CodingSubmission.distinct('question', { user: uid, selfStatus: 'solved' }),
    SQLSubmission.distinct('question', { user: uid, status: 'correct' }),
  ]);
  const totalBySubject = Object.fromEntries(SUBJECTS.map((s, i) => [s, totals[i]]));
  const subjects = {};
  for (const s of SUBJECTS) {
    const rows = progress.filter((p) => p.subject === s);
    const attemptsSum = rows.reduce((a, r) => a + r.attempts, 0), correctSum = rows.reduce((a, r) => a + r.correctCount, 0);
    const solved = rows.filter((r) => r.everCorrect).length;
    subjects[s] = { total: totalBySubject[s], attempted: rows.length, solved, accuracy: pct(correctSum, attemptsSum), progress: pct(solved, totalBySubject[s]), avgTimeSec: attemptsSum ? Math.round(rows.reduce((a, r) => a + r.totalTimeSec, 0) / attemptsSum) : 0 };
  }
  // Weak topics: at least 3 attempts and accuracy below 60%
  const byTopic = new Map();
  for (const p of progress) {
    const k = `${p.subject}::${p.topic}`; const t = byTopic.get(k) || { subject: p.subject, topic: p.topic, attempts: 0, correct: 0 };
    t.attempts += p.attempts; t.correct += p.correctCount; byTopic.set(k, t);
  }
  const topics = [...byTopic.values()].map((t) => ({ ...t, accuracy: pct(t.correct, t.attempts) }));
  const weakTopics = topics.filter((t) => t.attempts >= 3 && t.accuracy < 60).sort((a, b) => a.accuracy - b.accuracy).slice(0, 8);
  const attemptedTotal = progress.length, solvedTotal = progress.filter((p) => p.everCorrect).length;
  const allAttempts = progress.reduce((a, r) => a + r.attempts, 0), allCorrect = progress.reduce((a, r) => a + r.correctCount, 0);
  const pcts = attempts.map((a) => a.result?.percentage ?? 0);
  const testIds = [...new Set(attempts.slice(0, 5).map((a) => String(a.test)))];
  const tests = await MockTest.find({ _id: { $in: testIds } }).select('title slug').lean();
  const tmap = new Map(tests.map((t) => [String(t._id), t]));
  const last14 = Array.from({ length: 14 }, (_, i) => dayStr(new Date(Date.now() - (13 - i) * 86400000)));
  const actMap = new Map(activity.map((a) => [a.date, a]));
  const overall = Math.round(SUBJECTS.reduce((a, s) => a + subjects[s].progress, 0) / SUBJECTS.length * 10) / 10;
  return {
    overallProgress: overall, subjects,
    questionsAttempted: attemptedTotal, questionsSolved: solvedTotal, accuracy: pct(allCorrect, allAttempts),
    mocks: { attempted: attempts.length, bestPercentage: pcts.length ? Math.max(...pcts) : null, averagePercentage: pcts.length ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10 : null },
    coding: { solved: codingSolved.length, total: totalBySubject.coding, completion: pct(codingSolved.length, totalBySubject.coding) },
    sql: { solved: sqlSolved.length, total: totalBySubject.sql, completion: pct(sqlSolved.length, totalBySubject.sql) },
    weakTopics, topicAccuracy: topics.sort((a, b) => a.accuracy - b.accuracy),
    activity: last14.map((d) => ({ date: d, questions: actMap.get(d)?.questions || 0, correct: actMap.get(d)?.correct || 0, minutes: Math.round(actMap.get(d)?.minutes || 0) })),
    weeklyQuestions: last14.slice(7).reduce((a, d) => a + (actMap.get(d)?.questions || 0), 0),
    streak: computeStreak(activity.filter((a) => a.questions > 0).map((a) => a.date)),
    bookmarks: bookmarkCount,
    incorrectToRevise: progress.filter((p) => !p.lastCorrect).length,
    recentTests: attempts.slice(0, 5).map((a) => ({ attemptId: a._id, title: tmap.get(String(a.test))?.title, slug: tmap.get(String(a.test))?.slug, score: a.result?.score, maxScore: a.result?.maxScore, percentage: a.result?.percentage, submittedAt: a.submittedAt })),
  };
}
module.exports = { computeStats, computeStreak, SUBJECTS };
