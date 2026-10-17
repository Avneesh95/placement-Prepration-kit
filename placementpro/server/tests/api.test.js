process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/placementpro_test';
const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../src/app');
const { connect } = require('../src/db');
const M = require('../src/models');
const { seed } = require('../seed/index');

let app; let A; let B; // two agents (separate cookie jars)
const pw = 'Passw0rdOK';
const reg = (agent, n) => agent.post('/api/auth/register').send({ name: `User ${n}`, email: `user${n}@example.com`, password: pw, graduationYear: 2027 });

beforeAll(async () => {
  await connect(); await mongoose.connection.dropDatabase();
  await seed({ quiet: true });
  app = createApp(); A = request.agent(app); B = request.agent(app);
}, 240000);
afterAll(async () => { await mongoose.disconnect(); });

describe('seed integrity', () => {
  test('database counts', async () => {
    expect(await M.Question.countDocuments()).toBeGreaterThanOrEqual(1000);
    expect(await M.MockTest.countDocuments()).toBeGreaterThanOrEqual(20);
    expect(await M.Company.countDocuments()).toBe(10);
    for (const s of ['aptitude', 'reasoning', 'english', 'cs', 'coding', 'sql']) expect(await M.Question.countDocuments({ subject: s })).toBeGreaterThan(10);
  });
  test('every mock test has real, unique questions in each section and a positive duration', async () => {
    const tests = await M.MockTest.find().lean();
    for (const t of tests) {
      expect(t.totalDurationMin).toBeGreaterThan(0);
      const ids = t.sections.flatMap((s) => s.questionIds.map(String));
      expect(ids.length).toBeGreaterThan(0); expect(new Set(ids).size).toBe(ids.length);
      expect(await M.Question.countDocuments({ _id: { $in: ids } })).toBe(ids.length);
    }
  });
  test('no question is labelled verified without evidence', async () => {
    expect(await M.Question.countDocuments({ provenance: 'verified_pyq' })).toBe(0);
    expect(await M.Question.countDocuments({ verificationStatus: 'verified' })).toBe(0);
  });
  test('every company pattern is an unverified template with a disclaimer', async () => {
    for (const p of await M.CompanyPattern.find().lean()) { expect(p.status).toBe('preparation_template'); expect(p.dateVerified).toBeNull(); expect(p.disclaimer).toMatch(/not been verified/); }
  });
});

describe('authentication', () => {
  test('private routes require login', async () => { expect((await request(app).get('/api/profile')).status).toBe(401); });
  test('validation and unique email', async () => {
    expect((await request(app).post('/api/auth/register').send({ name: 'A', email: 'bad', password: '1' })).status).toBe(400);
    expect((await reg(A, 1)).status).toBe(201);
    expect((await reg(request(app), 1)).status).toBe(409);
    expect((await reg(B, 2)).status).toBe(201);
  });
  test('passwords are hashed; defaults to graduation year 2027', async () => {
    const u = await M.User.findOne({ email: 'user1@example.com' }).select('+passwordHash');
    expect(u.passwordHash).not.toContain(pw); expect(u.graduationYear).toBe(2027);
  });
  test('login, wrong password, me, logout', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'user1@example.com', password: 'wrong' })).status).toBe(401);
    const C = request.agent(app);
    expect((await C.post('/api/auth/login').send({ email: 'user1@example.com', password: pw })).status).toBe(200);
    expect((await C.get('/api/auth/me')).body.user.email).toBe('user1@example.com');
    await C.post('/api/auth/logout');
    expect((await C.get('/api/auth/me')).status).toBe(401);
  });
  test('password reset flow', async () => {
    const f = await request(app).post('/api/auth/forgot-password').send({ email: 'user2@example.com' });
    expect(f.body.devResetToken).toBeTruthy();
    expect((await request(app).post('/api/auth/reset-password').send({ token: f.body.devResetToken, password: 'NewPass123' })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: 'user2@example.com', password: 'NewPass123' })).status).toBe(200);
    expect((await request(app).post('/api/auth/reset-password').send({ token: f.body.devResetToken, password: 'Another123' })).status).toBe(400);
  });
});

describe('profile, companies and practice', () => {
  test('profile update persists and ignores unknown companies', async () => {
    const r = await A.put('/api/profile').send({ college: 'ABC Institute', targetCompanies: ['tcs', 'nope'], dailyStudyHours: 4 });
    expect(r.status).toBe(200); expect(r.body.user.targetCompanies).toEqual(['tcs']);
    expect((await A.put('/api/profile').send({ role: 'admin' })).status).toBe(400);
    expect((await A.get('/api/profile')).body.user.college).toBe('ABC Institute');
  });
  test('company list and company-specific filtering', async () => {
    expect((await A.get('/api/companies')).body.items).toHaveLength(10);
    const r = await A.get('/api/questions?company=infosys&subject=aptitude&limit=50');
    expect(r.body.total).toBeGreaterThan(30);
    expect(r.body.items.every((q) => q.companies.includes('infosys'))).toBe(true);
  });
  test('company priorities are qualitative when no documented sample exists', async () => {
    const r = await A.get('/api/companies/tcs/priorities');
    expect(r.body.items.length).toBeGreaterThan(3);
    for (const p of r.body.items) { expect(p.observedFrequency).toBeNull(); expect(p.evidenceNote).toMatch(/qualitative/); }
  });
  test('observed frequency is computed only from a documented sample', async () => {
    await M.CompanyPattern.updateOne({ company: 'wipro' }, { $set: { 'priorities.0.evidence': { sampleSize: 20, appearedIn: 12, period: '2022-2024 (test fixture)' } } });
    const r = await A.get('/api/companies/wipro/priorities');
    const withF = r.body.items.filter((p) => p.observedFrequency);
    expect(withF).toHaveLength(1); expect(withF[0].observedFrequency.percent).toBe(60); expect(withF[0].observedFrequency.note).toMatch(/not a prediction/);
  });
  test('question payloads never include answers; practice grading and progress persist', async () => {
    const list = await A.get('/api/questions?subject=aptitude&type=mcq_single&limit=5');
    for (const q of list.body.items) { expect(q.correct).toBeUndefined(); expect(q.explanation).toBeUndefined(); }
    const q = await M.Question.findById(list.body.items[0]._id).lean();
    const wrong = [0, 1, 2, 3].find((i) => !q.correct.includes(i));
    const bad = await A.post(`/api/questions/${q._id}/answer`).send({ response: [wrong] });
    expect(bad.body.correct).toBe(false); expect(bad.body.explanation).toBeTruthy();
    const good = await A.post(`/api/questions/${q._id}/answer`).send({ response: q.correct });
    expect(good.body.correct).toBe(true);
    const st = (await A.get('/api/profile')).body.stats;
    expect(st.questionsAttempted).toBe(1); expect(st.questionsSolved).toBe(1); expect(st.accuracy).toBe(50); expect(st.streak.current).toBe(1);
  });
  test('progress is isolated per user', async () => { expect((await B.get('/api/profile')).body.stats.questionsAttempted).toBe(0); });
  test('bookmarks add, filter and remove', async () => {
    const q = (await A.get('/api/questions?subject=english&limit=1')).body.items[0];
    expect((await A.post(`/api/bookmarks/${q._id}`)).status).toBe(201);
    expect((await A.get('/api/questions?bookmarked=true')).body.total).toBe(1);
    expect((await B.get('/api/bookmarks')).body.items).toHaveLength(0);
    await A.delete(`/api/bookmarks/${q._id}`);
    expect((await A.get('/api/bookmarks')).body.items).toHaveLength(0);
  });
  test('topic content and FAQ search', async () => {
    const t = await A.get('/api/topics/percentages');
    expect(t.body.topic.formulas.length).toBeGreaterThan(0); expect(t.body.solvedExamples.length).toBeGreaterThan(0);
    const f = await A.get('/api/faqs?q=syllabus');
    expect(f.body.total).toBeGreaterThan(0);
    expect((await A.get('/api/faqs?category=SQL%20and%20DBMS')).body.items.every((x) => x.category === 'SQL and DBMS')).toBe(true);
  });
});

describe('mock tests', () => {
  const answerAll = async (attempt, mode) => {
    const test = await M.MockTest.findById(attempt.test).lean();
    const ids = test.sections.flatMap((s) => s.questionIds);
    const qs = await M.Question.find({ _id: { $in: ids } }).lean();
    return qs.filter((q) => ['mcq_single', 'mcq_multi'].includes(q.type)).map((q, i) => ({ questionId: String(q._id), response: mode === 'right' ? q.correct : [[0, 1, 2, 3].find((x) => !q.correct.includes(x))], timeSpentSec: 20 + i }));
  };
  test('payload hides answer keys; results are locked until submission; refresh resumes the same attempt', async () => {
    const s = await A.post('/api/mocks/general-placement-1/start');
    expect(s.status).toBe(201);
    const p = await A.get(`/api/attempts/${s.body.attemptId}`);
    const flat = JSON.stringify(p.body);
    expect(flat).not.toMatch(/"correct"|"explanation"|numericAnswer|referenceSolutions|referenceQuery/);
    expect(p.body.sections.flatMap((x) => x.questions).length).toBeGreaterThan(20);
    expect((await A.get(`/api/attempts/${s.body.attemptId}/result`)).status).toBe(403);
    const again = await A.post('/api/mocks/general-placement-1/start');
    expect(again.status).toBe(200); expect(again.body.resumed).toBe(true); expect(again.body.attemptId).toBe(s.body.attemptId);
    expect(new Date(again.body.deadline).getTime()).toBe(new Date(s.body.deadline).getTime());   // timer cannot be reset
  });
  test('autosave, duplicate submit safety and backend-computed result (no negative marking)', async () => {
    const attemptId = (await A.post('/api/mocks/general-placement-1/start')).body.attemptId;
    const doc = await M.TestAttempt.findById(attemptId).lean();
    const rights = await answerAll(doc, 'right');
    const half = rights.slice(0, 10);
    expect((await A.put(`/api/attempts/${attemptId}/answers`).send({ answers: half })).body.saved).toBe(10);
    const reloaded = await A.get(`/api/attempts/${attemptId}`);
    expect(Object.keys(reloaded.body.answers)).toHaveLength(10);
    const [s1, s2] = await Promise.all([A.post(`/api/attempts/${attemptId}/submit`), A.post(`/api/attempts/${attemptId}/submit`)]);
    expect([s1.status, s2.status]).toEqual([200, 200]);
    const r = await A.get(`/api/attempts/${attemptId}/result`);
    expect(r.body.result.correct).toBe(10); expect(r.body.result.incorrect).toBe(0); expect(r.body.result.score).toBe(10);
    expect(r.body.result.questions.every((q) => q.explanation)).toBe(true);
    expect((await A.put(`/api/attempts/${attemptId}/answers`).send({ answers: half })).status).toBe(409);
    expect(await M.UserProgress.countDocuments({ user: (await M.User.findOne({ email: 'user1@example.com' }))._id })).toBeGreaterThan(10);
  });
  test('negative marking applies when the test overrides scoring', async () => {
    const attemptId = (await A.post('/api/mocks/general-placement-2/start')).body.attemptId;   // 0.25 negative
    const doc = await M.TestAttempt.findById(attemptId).lean();
    const wrongs = (await answerAll(doc, 'wrong')).slice(0, 8); const rights = (await answerAll(doc, 'right')).slice(8, 12);
    await A.put(`/api/attempts/${attemptId}/answers`).send({ answers: [...wrongs, ...rights] });
    await A.post(`/api/attempts/${attemptId}/submit`);
    const r = (await A.get(`/api/attempts/${attemptId}/result`)).body.result;
    expect(r.incorrect).toBe(8); expect(r.correct).toBe(4); expect(r.score).toBe(2);   // 4 − 8×0.25
    expect(r.sections.length).toBe(4); expect(r.topics.length).toBeGreaterThan(3);
  });
  test('time running out auto-submits, even with the browser closed (sweeper) and on next access', async () => {
    const eng = require('../src/services/testEngine');
    const a1 = (await A.post('/api/mocks/quant-1/start')).body.attemptId;
    await M.TestAttempt.updateOne({ _id: a1 }, { $set: { deadline: new Date(Date.now() - 1000) } });
    expect(await eng.sweepExpired()).toBeGreaterThanOrEqual(1);
    const r1 = await A.get(`/api/attempts/${a1}/result`);
    expect(r1.status).toBe(200); expect(r1.body.autoSubmitted).toBe(true);
    const a2 = (await A.post('/api/mocks/english-1/start')).body.attemptId;
    await M.TestAttempt.updateOne({ _id: a2 }, { $set: { deadline: new Date(Date.now() - 1000) } });
    expect((await A.put(`/api/attempts/${a2}/answers`).send({ answers: [] })).body.error.code).toBe('TIME_UP');
    expect((await A.get(`/api/attempts/${a2}/result`)).body.autoSubmitted).toBe(true);
  });
  test('section-timed tests reveal and accept answers only for the current section', async () => {
    const start = await A.post('/api/mocks/tcs-full-1/start');
    const p = (await A.get(`/api/attempts/${start.body.attemptId}`)).body;
    expect(p.currentSection).toBe(0); expect(p.sections).toHaveLength(1);
    const test = await M.MockTest.findOne({ slug: 'tcs-full-1' }).lean();
    const later = String(test.sections[1].questionIds[0]);
    const r = await A.put(`/api/attempts/${start.body.attemptId}/answers`).send({ answers: [{ questionId: later, response: [0] }] });
    expect(r.body.rejected[0].reason).toBe('SECTION_LOCKED');
    const adv = await A.post(`/api/attempts/${start.body.attemptId}/advance-section`);
    expect(adv.body.currentSection).toBe(1); expect(adv.body.sections.find((s) => s.index === 0).locked).toBe(true);
  });
  test('other users cannot read, write or submit someone else\'s attempt', async () => {
    const id = (await A.post('/api/mocks/reasoning-1/start')).body.attemptId;
    expect((await B.get(`/api/attempts/${id}`)).status).toBe(404);
    expect((await B.put(`/api/attempts/${id}/answers`).send({ answers: [] })).status).toBe(404);
    expect((await B.post(`/api/attempts/${id}/submit`)).status).toBe(404);
    expect((await B.get(`/api/attempts/${id}/result`)).status).toBe(404);
  });
  test('SQL mock questions are graded by executing the answer', async () => {
    const id = (await A.post('/api/mocks/sql-assessment-1/start')).body.attemptId;
    const doc = await M.TestAttempt.findById(id).lean(); const test = await M.MockTest.findById(doc.test).lean();
    const qs = await M.Question.find({ _id: { $in: test.sections[0].questionIds } }).lean();
    await A.put(`/api/attempts/${id}/answers`).send({ answers: [{ questionId: String(qs[0]._id), response: qs[0].sql.referenceQuery }, { questionId: String(qs[1]._id), response: 'SELECT 1' }] });
    await A.post(`/api/attempts/${id}/submit`);
    const r = (await A.get(`/api/attempts/${id}/result`)).body.result;
    expect(r.correct).toBe(1); expect(r.incorrect).toBe(1); expect(r.score).toBe(2);
  });
});

describe('Coding Arena, SQL Lab, plan', () => {
  test('coding: list hides solutions; submit is not judged; reveal gives reference solutions', async () => {
    const list = await A.get('/api/coding?difficulty=easy&limit=5');
    expect(list.body.items.length).toBeGreaterThan(0); expect(JSON.stringify(list.body)).not.toMatch(/referenceSolutions|testCases/);
    const id = list.body.items[0]._id;
    const detail = await A.get(`/api/coding/${id}`);
    expect(detail.body.judging.enabled).toBe(false); expect(detail.body.question.coding.hints.length).toBeGreaterThan(0); expect(detail.body.question.coding.referenceSolutions).toBeUndefined();
    const sub = await A.post(`/api/coding/${id}/submissions`).send({ language: 'java', code: 'class Main{}', selfStatus: 'solved' });
    expect(sub.status).toBe(201); expect(sub.body.submission.judged).toBe(false);
    expect((await A.get('/api/coding?status=solved')).body.total).toBe(1);
    expect((await B.get(`/api/coding/${id}/submissions`)).body.items).toHaveLength(0);
    const rev = await A.post(`/api/coding/${id}/reveal`);
    expect(rev.body.referenceSolutions.java).toContain('class Main');
    expect((await A.get('/api/coding/daily')).body.question._id).toBeTruthy();
  });
  test('SQL Lab: correct query passes, wrong fails, destructive queries are refused, answer hidden until reveal', async () => {
    const q = await M.Question.findOne({ subject: 'sql', topic: 'group-by' }).lean();
    const d = await A.get(`/api/sql/${q._id}`);
    expect(d.body.question.sql.tablesPreview.length).toBeGreaterThan(2); expect(JSON.stringify(d.body)).not.toMatch(/referenceQuery|rowsJson/);
    expect((await A.post(`/api/sql/${q._id}/submit`).send({ query: q.sql.referenceQuery })).body.correct).toBe(true);
    expect((await A.post(`/api/sql/${q._id}/submit`).send({ query: 'SELECT dept_id, 0 FROM employees' })).body.correct).toBe(false);
    const evil = await A.post(`/api/sql/${q._id}/submit`).send({ query: 'DROP TABLE employees' });
    expect(evil.body.status).toBe('rejected');
    expect((await A.post(`/api/sql/${q._id}/run`).send({ query: 'DELETE FROM employees' })).status).toBe(400);
    expect((await A.post(`/api/sql/${q._id}/run`).send({ query: 'SELECT COUNT(*) FROM employees' })).body.rows).toEqual([[10]]);
    expect((await A.get('/api/profile')).body.stats.sql.solved).toBe(1);
    expect((await A.post(`/api/sql/${q._id}/reveal`)).body.referenceQuery).toBeTruthy();
  });
  test('study plan: generated, task completion, reschedule of missed tasks', async () => {
    const r = await A.post('/api/plan').send({ durationDays: 30, dailyHours: 3, targetCompanies: ['tcs'], proficiency: 'beginner', language: 'java' });
    expect(r.status).toBe(201);
    const subjects = new Set(r.body.plan.tasks.map((t) => t.subject));
    for (const s of ['aptitude', 'reasoning', 'english', 'coding', 'sql', 'cs']) expect(subjects.has(s)).toBe(true);
    expect(r.body.plan.tasks.some((t) => t.kind === 'mock')).toBe(true);
    const t = r.body.today[0];
    const done = await A.patch(`/api/plan/tasks/${t._id}`).send({ done: true });
    expect(done.body.completion).toBeGreaterThan(0);
    const plan = await M.StudyPlan.findOne({ user: (await M.User.findOne({ email: 'user1@example.com' }))._id });
    plan.tasks[1].date = '2020-01-01'; plan.tasks[1].done = false; await plan.save();
    const rs = await A.post('/api/plan/reschedule');
    expect(rs.body.moved).toBeGreaterThanOrEqual(1);
    expect((await B.get('/api/plan')).body.plan).toBeNull();
  });
  test('planner responds to weak performance (low SQL accuracy gets more SQL time)', async () => {
    const { generatePlan } = require('../src/services/planner');
    const u = await M.User.findOne({ email: 'user2@example.com' });
    const qs = await M.Question.find({ subject: 'sql' }).limit(6).lean();
    for (const q of qs) await M.UserProgress.create({ user: u._id, question: q._id, subject: 'sql', topic: q.topic, attempts: 3, correctCount: 0, lastCorrect: false });
    const weak = await generatePlan(u, { durationDays: 30, dailyHours: 3, proficiency: 'intermediate', targetCompanies: [] });
    const fresh = await generatePlan({ ...u.toObject(), _id: new mongoose.Types.ObjectId() }, { durationDays: 30, dailyHours: 3, proficiency: 'intermediate', targetCompanies: [] });
    const mins = (p) => p.tasks.filter((t) => t.subject === 'sql').reduce((a, t) => a + t.minutes, 0);
    expect(mins(weak)).toBeGreaterThan(mins(fresh));
  });
  test('consistent error shape', async () => {
    const r = await A.get('/api/questions/not-an-id'); expect(r.status).toBe(400); expect(r.body.error.code).toBe('BAD_ID');
    expect((await A.get('/api/nope')).body.error.code).toBe('NOT_FOUND');
  });
});

describe('result tallies', () => {
  test('unattempted coding questions are "not auto-scored", never "skipped"', async () => {
    const id = (await A.post('/api/mocks/coding-assessment-1/start')).body.attemptId;
    await A.post(`/api/attempts/${id}/submit`);
    const r = (await A.get(`/api/attempts/${id}/result`)).body.result;
    expect(r.unanswered).toBe(0); expect(r.ungraded).toBe(3); expect(r.maxScore).toBe(0); expect(r.revision).toEqual([]);
  });
});
