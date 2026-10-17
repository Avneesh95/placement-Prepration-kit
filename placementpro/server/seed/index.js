// Idempotent seeder: `npm run seed`. Upserts by stable keys (uid / slug), so repeated runs never duplicate anything.
const fs = require('fs'); const path = require('path');
const mongoose = require('mongoose');
const { connect } = require('../src/db');
const M = require('../src/models');
const { validateQuestion } = require('./lib/validate');
const { rng, hashStr, shuffle } = require('./lib/generators');
const SLUGS = require('./data/company-slugs');
const { companies } = require('./data/companies');
const topicsData = require('./handwritten/topics');
const faqs = require('./data/faqs');
const mocks = require('./data/mocks');

function loadQuestionFiles() {
  const out = [];
  for (const dir of fs.readdirSync(__dirname)) {
    const full = path.join(__dirname, dir);
    if (!fs.statSync(full).isDirectory() || ['data', 'lib', 'handwritten', 'generated'].includes(dir)) continue;
    for (const f of fs.readdirSync(full).filter((x) => x.endsWith('.json'))) out.push(...JSON.parse(fs.readFileSync(path.join(full, f), 'utf8')));
  }
  return out;
}
function validateAll(questions) {
  const errors = []; const seen = new Set();
  const ctx = { companies: new Set(SLUGS), topics: new Set(topicsData.map((t) => `${t.subject}:${t.slug}`)) };
  const slugs = new Set(); for (const t of topicsData) { if (slugs.has(t.slug)) errors.push(`duplicate topic slug ${t.slug}`); slugs.add(t.slug); }
  for (const q of questions) { if (seen.has(q.uid)) errors.push(`duplicate uid ${q.uid}`); seen.add(q.uid); errors.push(...validateQuestion(q, ctx)); }
  return errors;
}
// Deterministically pick questions for each mock section; round-robin across topics for variety; never reuse a question within a test.
function materialiseMock(m, qmeta) {
  const used = new Set(); const sections = [];
  for (const s of m.sections) {
    let pool = qmeta.filter((q) => q.subject === s.subject && (!s.company || q.companies.includes(s.company)) && (!s.topics || s.topics.includes(q.topic)) && (!s.difficulty || s.difficulty.includes(q.difficulty)) && !used.has(q.uid));
    pool.sort((a, b) => (a.uid < b.uid ? -1 : 1));
    const r = rng(hashStr(`${m.slug}:${s.name}:${s.seed || ''}`));
    const groups = new Map(); for (const q of shuffle(r, pool)) { if (!groups.has(q.topic)) groups.set(q.topic, []); groups.get(q.topic).push(q); }
    const order = shuffle(r, [...groups.keys()]); const picked = [];
    while (picked.length < s.count && order.some((t) => groups.get(t).length)) for (const t of order) { if (picked.length >= s.count) break; const g = groups.get(t); if (g.length) picked.push(g.shift()); }
    if (picked.length < s.count) throw new Error(`Mock ${m.slug} / ${s.name}: only ${picked.length} of ${s.count} questions available`);
    picked.forEach((q) => used.add(q.uid));
    sections.push({ name: s.name, subject: s.subject, durationMin: s.durationMin, questionIds: shuffle(r, picked).map((q) => q._id) });
  }
  return { slug: m.slug, title: m.title, company: m.company, category: m.category, description: m.description, sectionTimed: !!m.sectionTimed, totalDurationMin: m.totalDurationMin, patternStatus: m.patternStatus, instructions: m.instructions, sections, scoring: m.scoring, active: true };
}
// Idempotent upsert without per-document filter scans: one lookup of existing keys, bulk insert for new docs, update-by-_id for existing ones.
async function upsertMany(Model, keyOf, docs, chunk = 200) {
  const existing = new Map((await Model.find({}).lean()).map((r) => [keyOf(r), r._id]));
  const inserts = docs.filter((d) => !existing.has(keyOf(d)));
  const updates = docs.filter((d) => existing.has(keyOf(d)));
  for (let i = 0; i < inserts.length; i += chunk) await Model.insertMany(inserts.slice(i, i + chunk), { ordered: false });
  for (let i = 0; i < updates.length; i += chunk) {
    await Model.bulkWrite(updates.slice(i, i + chunk).map((d) => ({ updateOne: { filter: { _id: existing.get(keyOf(d)) }, update: { $set: d } } })));
  }
  return { inserted: inserts.length, updated: updates.length };
}
async function seed({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const questions = loadQuestionFiles();
  const errors = validateAll(questions);
  if (errors.length) { throw new Error(`Seed validation failed (${errors.length} problems):\n${errors.slice(0, 25).join('\n')}`); }
  const qres = await upsertMany(M.Question, (d) => d.uid, questions.map((q) => ({ ...q, active: true })));
  log('questions', qres);
  const qmeta = await M.Question.find({ active: true }).select('uid subject topic companies difficulty').lean();
  const src = { key: 'original-authoring', title: 'Original practice content authored for PlacementPro', url: '', publisher: 'PlacementPro', kind: 'original_authoring', dateVerified: null, notes: 'Not copied from any exam paper.' };
  const srcDocs = [src, ...companies.filter((c) => c.company.officialLinks[0]).map((c) => ({ key: `official-${c.company.slug}`, title: `${c.company.name} official careers page`, url: c.company.officialLinks[0].url, publisher: c.company.name, kind: 'official_page', dateVerified: null, notes: 'Link recorded for verification. Content NOT yet verified against this page.' }))];
  await upsertMany(M.SourceReference, (d) => d.key, srcDocs);
  const refs = new Map((await M.SourceReference.find({}).lean()).map((r) => [r.key, r._id]));
  await upsertMany(M.Company, (d) => d.slug, companies.map((c) => c.company));
  await upsertMany(M.CompanyPattern, (d) => `${d.company}|${d.track}|${d.assessmentYear}`, companies.flatMap((c) => c.patterns.map((p) => ({ ...p, sourceRef: refs.get(`official-${c.company.slug}`) }))));
  // Worked examples: first two practice questions of each aptitude/reasoning topic (their explanations show the working).
  const byTopic = new Map();
  for (const q of [...qmeta].sort((a, b) => (a.uid < b.uid ? -1 : 1))) { const k = `${q.subject}:${q.topic}`; if (!byTopic.has(k)) byTopic.set(k, []); byTopic.get(k).push(q.uid); }
  await upsertMany(M.Topic, (d) => d.slug, topicsData.map((t) => ({ ...t, solvedExampleUids: ['aptitude', 'reasoning'].includes(t.subject) ? (byTopic.get(`${t.subject}:${t.slug}`) || []).slice(0, 2) : [] })));
  await upsertMany(M.FAQ, (d) => d.slug, faqs.map((f, i) => ({ slug: `faq-${String(i + 1).padStart(3, '0')}`, ...f, order: i })));
  await upsertMany(M.MockTest, (d) => d.slug, mocks.map((m) => materialiseMock(m, qmeta)));
  const counts = { questions: await M.Question.countDocuments(), mockTests: await M.MockTest.countDocuments(), companies: await M.Company.countDocuments(), patterns: await M.CompanyPattern.countDocuments(), topics: await M.Topic.countDocuments(), faqs: await M.FAQ.countDocuments(), sources: await M.SourceReference.countDocuments() };
  log('Seed complete:', counts);
  return counts;
}
module.exports = { seed, loadQuestionFiles, validateAll, materialiseMock };
if (require.main === module) {
  connect().then(() => seed()).then(() => mongoose.disconnect()).catch((e) => { console.error(e.message); process.exit(1); });
}
