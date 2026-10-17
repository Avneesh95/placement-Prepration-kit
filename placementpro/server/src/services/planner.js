const { Topic, Question } = require('../models');
const { computeStats } = require('./stats');

const BASE_SHARE = { aptitude: 24, reasoning: 14, english: 10, coding: 24, sql: 10, cs: 18 };
const MIN_PER_Q = { aptitude: 1.5, reasoning: 1.5, english: 1, cs: 1, coding: 25, sql: 8 };
const PROF_WEAKNESS = { beginner: 0.7, intermediate: 0.5, advanced: 0.3 };
const addDays = (s, n) => new Date(new Date(`${s}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);
const label = (s) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

async function topicsBySubject(subject) {
  const defined = await Topic.find({ subject }).sort({ order: 1 }).lean();
  const inUse = await Question.distinct('topic', { subject, active: true });
  const names = defined.map((t) => t.slug).filter((s) => inUse.includes(s));
  for (const t of inUse.sort()) if (!names.includes(t)) names.push(t);
  return names;
}

/** Builds a plan using actual performance: weaker subjects get a larger share of daily minutes. */
async function generatePlan(user, opts) {
  const stats = await computeStats(user);
  const hours = opts.dailyHours || user.dailyStudyHours || 3;
  const dailyMinutes = Math.round(hours * 60);
  const base = PROF_WEAKNESS[opts.proficiency] ?? 0.5;
  const subjects = Object.keys(BASE_SHARE);
  const weights = {}, reasons = {};
  for (const s of subjects) {
    const st = stats.subjects[s];
    const hasData = st.attempted >= 5;
    const weakness = hasData ? 1 - st.accuracy / 100 : base;
    let w = BASE_SHARE[s] * (0.6 + weakness);
    reasons[s] = hasData ? (st.accuracy < 60 ? `Your ${s} accuracy is ${st.accuracy}% — extra practice assigned.` : st.accuracy >= 75 && st.avgTimeSec > MIN_PER_Q[s] * 60 * 1.2 ? `Accuracy is strong (${st.accuracy}%) but solving is slow — do timed sets.` : `Maintaining ${s} (accuracy ${st.accuracy}%).`) : `No ${s} history yet — balanced starter allocation.`;
    if (hasData && st.accuracy >= 75 && st.avgTimeSec > MIN_PER_Q[s] * 60 * 1.2) w *= 1.15;
    weights[s] = w;
  }
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  const share = Object.fromEntries(subjects.map((s) => [s, weights[s] / sum]));
  const topicLists = {};
  for (const s of subjects) {
    const weak = stats.weakTopics.filter((t) => t.subject === s).map((t) => t.topic);
    const all = await topicsBySubject(s);
    topicLists[s] = [...weak, ...all.filter((t) => !weak.includes(t))];
  }
  const cursor = Object.fromEntries(subjects.map((s) => [s, 0]));
  const deficit = Object.fromEntries(subjects.map((s) => [s, 0]));
  const startDate = todayStr();
  const tasks = [];
  const firstCompany = (opts.targetCompanies && opts.targetCompanies[0]) || null;
  for (let day = 1; day <= opts.durationDays; day++) {
    const date = addDays(startDate, day - 1);
    const lastDays = day > opts.durationDays - 2;
    if (day % 7 === 0 && !lastDays) {
      tasks.push({ day, date, originalDate: date, kind: 'mock', subject: 'mixed', topic: firstCompany || 'general', title: firstCompany ? `Full-length ${label(firstCompany)} mock` : 'Full-length general mock', targetCount: 1, minutes: Math.min(dailyMinutes, 120), reason: 'Weekly checkpoint: timed full mock, then review every mistake.' });
      tasks.push({ day, date, originalDate: date, kind: 'review', subject: 'mixed', topic: 'mock-review', title: 'Review mock mistakes and re-solve incorrect questions', targetCount: 1, minutes: Math.max(30, dailyMinutes - 120), reason: 'Mistake review is where mock tests pay off.' });
      continue;
    }
    let remaining = dailyMinutes;
    const picked = {};
    while (remaining >= 25) {
      for (const s of subjects) deficit[s] += share[s] * 30;
      const s = subjects.filter((x) => !(picked[x] && picked[x] >= 2)).sort((a, b) => deficit[b] - deficit[a])[0];
      const chunk = s === 'coding' ? Math.min(remaining, 45) : Math.min(remaining, 30);
      deficit[s] -= 30; picked[s] = (picked[s] || 0) + 1;
      const list = topicLists[s]; const topic = list.length ? list[cursor[s]++ % list.length] : 'mixed';
      const count = Math.max(1, Math.round(chunk / MIN_PER_Q[s]));
      const kind = lastDays ? 'revise' : s === 'coding' ? 'coding' : s === 'sql' ? 'sql' : 'practice';
      tasks.push({ day, date, originalDate: date, kind, subject: s, topic, title: `${lastDays ? 'Revise' : 'Practice'} ${label(topic)} (${s})`, targetCount: count, minutes: chunk, reason: reasons[s] });
      remaining -= chunk;
    }
  }
  return { tasks, startDate, share };
}

/** Moves incomplete past-due tasks to today and the following days (max 3 per day). */
function rescheduleMissed(plan) {
  const today = todayStr();
  const missed = plan.tasks.filter((t) => !t.done && t.date < today);
  let offset = 0, inDay = 0;
  for (const t of missed) {
    t.date = addDays(today, offset);
    t.rescheduledFrom = undefined;
    if (++inDay >= 3) { inDay = 0; offset++; }
  }
  return missed.length;
}

function weeklySummary(plan) {
  const weeks = [];
  for (const t of plan.tasks) {
    const w = Math.floor((t.day - 1) / 7);
    weeks[w] = weeks[w] || { week: w + 1, total: 0, done: 0 };
    weeks[w].total++; if (t.done) weeks[w].done++;
  }
  return weeks.filter(Boolean).map((w) => ({ ...w, percent: Math.round((w.done / w.total) * 100) }));
}
module.exports = { generatePlan, rescheduleMissed, weeklySummary, todayStr };
