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
  const streakData = computeStreak(activity.filter((a) => a.questions > 0).map((a) => a.date));

  // Gamification: XP & Levels derived from real student effort
  // 15 XP per solved question, 5 XP per attempt, 50 XP per mock test submitted, 20 XP per active study day
  const xp = (solvedTotal * 15) + (attemptedTotal * 5) + (attempts.length * 50) + (activity.length * 20);
  const LEVELS = [
    { level: 1, title: 'Beginner Explorer', minXp: 0, maxXp: 200 },
    { level: 2, title: 'Skill Seeker', minXp: 200, maxXp: 500 },
    { level: 3, title: 'Practice Ranger', minXp: 500, maxXp: 1200 },
    { level: 4, title: 'Exam Challenger', minXp: 1200, maxXp: 2500 },
    { level: 5, title: 'Placement Champion', minXp: 2500, maxXp: 100000 },
  ];
  const currentLvl = LEVELS.find((l) => xp >= l.minXp && xp < l.maxXp) || LEVELS[LEVELS.length - 1];
  const nextLvlXp = currentLvl.maxXp;
  const levelProgress = Math.min(100, Math.round(((xp - currentLvl.minXp) / (currentLvl.maxXp - currentLvl.minXp)) * 100));

  // Badges calculation
  const badges = [];
  if (attemptedTotal > 0) badges.push({ id: 'first_drill', title: 'First Drill', icon: '🎯', desc: 'Completed first practice attempt' });
  if (solvedTotal >= 25) badges.push({ id: 'solver_25', title: 'Skill Builder', icon: '⚡', desc: 'Solved 25+ verified questions' });
  if (solvedTotal >= 100) badges.push({ id: 'solver_100', title: 'Master Mind', icon: '🏆', desc: 'Solved 100+ questions' });
  if (streakData.current >= 3 || streakData.longest >= 3) badges.push({ id: 'streak_3', title: '3-Day Fire', icon: '🔥', desc: 'Maintained 3+ days practice streak' });
  if (streakData.current >= 7 || streakData.longest >= 7) badges.push({ id: 'streak_7', title: 'Seven-Day Streak', icon: '👑', desc: '7 days consecutive preparation' });
  if (attempts.length >= 1) badges.push({ id: 'mock_finisher', title: 'Mock Finisher', icon: '🛡️', desc: 'Completed a full timed company test' });
  if (bookmarkCount >= 5) badges.push({ id: 'curator', title: 'Curator', icon: '⭐', desc: 'Saved 5+ key questions for revision' });

  // Daily Quest derived from today's actual activity
  const todayAct = actMap.get(dayStr(new Date())) || { questions: 0, correct: 0 };
  const dailyQuests = [
    { id: 'solve_10', title: 'Solve 10 Questions Today', current: todayAct.questions, target: 10, rewardXp: 50, completed: todayAct.questions >= 10 },
    { id: 'correct_5', title: 'Answer 5 Questions Correctly', current: todayAct.correct, target: 5, rewardXp: 40, completed: todayAct.correct >= 5 },
    { id: 'mock_or_drill', title: 'Complete 1 Mock or Drill Session', current: Math.min(1, attempts.length > 0 ? 1 : (todayAct.questions >= 5 ? 1 : 0)), target: 1, rewardXp: 60, completed: attempts.length > 0 || todayAct.questions >= 5 },
  ];

  return {
    overallProgress: overall, subjects,
    questionsAttempted: attemptedTotal, questionsSolved: solvedTotal, accuracy: pct(allCorrect, allAttempts),
    gamification: {
      xp,
      level: currentLvl.level,
      title: currentLvl.title,
      nextLevelXp: nextLvlXp,
      progressPct: levelProgress,
      badges,
      dailyQuests,
    },
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
