const PROV = ['verified_pyq', 'official_sample', 'memory_based', 'practice', 'high_priority_practice'];
const SUBJ = ['aptitude', 'reasoning', 'english', 'cs', 'coding', 'sql'];
const TYPES = ['mcq_single', 'mcq_multi', 'numeric', 'sql', 'coding'];
const DIFF = ['easy', 'medium', 'hard'];
function validateQuestion(q, { companies, topics }) {
  const e = []; const id = q.uid || '(no uid)'; const bad = (m) => e.push(`${id}: ${m}`);
  if (!q.uid) bad('missing uid');
  if (!SUBJ.includes(q.subject)) bad(`bad subject ${q.subject}`);
  if (!TYPES.includes(q.type)) bad(`bad type ${q.type}`);
  if (!DIFF.includes(q.difficulty)) bad(`bad difficulty ${q.difficulty}`);
  if (!PROV.includes(q.provenance)) bad(`bad provenance ${q.provenance}`);
  if (!q.text || q.text.length < 10) bad('text too short');
  if (!q.explanation || q.explanation.length < 10) bad('missing explanation');
  if (!Array.isArray(q.companies) || !q.companies.length || q.companies.some((c) => !companies.has(c))) bad(`bad companies ${JSON.stringify(q.companies)}`);
  if (!topics.has(`${q.subject}:${q.topic}`)) bad(`topic "${q.topic}" has no Topic entry for subject ${q.subject}`);
  if (q.type === 'mcq_single' || q.type === 'mcq_multi') {
    if (!Array.isArray(q.options) || q.options.length < 2) bad('needs 2+ options');
    else {
      if (new Set(q.options).size !== q.options.length) bad('duplicate options');
      if (!Array.isArray(q.correct) || !q.correct.length || q.correct.some((i) => !Number.isInteger(i) || i < 0 || i >= q.options.length)) bad('invalid correct index');
      if (q.type === 'mcq_single' && q.correct && q.correct.length !== 1) bad('single-select must have exactly 1 correct');
    }
  }
  if (q.type === 'numeric' && !Number.isFinite(q.numericAnswer)) bad('numeric answer missing');
  if (q.type === 'coding') {
    const c = q.coding || {};
    if (!c.statement || !c.examples || !c.examples.length) bad('coding needs statement and examples');
    if (!c.referenceSolutions || !c.referenceSolutions.java || !c.referenceSolutions.python) bad('coding needs java+python reference solutions');
    if (!c.testCases || c.testCases.length < 4) bad('coding needs 4+ test cases');
    if (!c.hints || !c.hints.length || !c.edgeCases || !c.edgeCases.length || !c.complexity) bad('coding needs hints, edge cases and complexity');
  }
  if (q.type === 'sql') {
    const s = q.sql || {};
    if (!s.schemaSql || !s.seedSql || !s.referenceQuery) bad('sql needs schema, seed and reference query');
    if (!s.expected || !s.expected.columns || !s.expected.rowsJson || !JSON.parse(s.expected.rowsJson).length) bad('sql expected output is empty');
  }
  // Provenance honesty rules
  if (q.provenance === 'verified_pyq' && !(q.sourceUrl && q.dateVerified && q.verificationStatus === 'verified' && q.assessmentYear)) bad('verified_pyq requires sourceUrl, dateVerified, assessmentYear and verificationStatus=verified');
  if (q.provenance === 'official_sample' && !q.sourceUrl) bad('official_sample requires sourceUrl');
  if (q.provenance === 'memory_based' && q.verificationStatus !== 'unverified') bad('memory_based must be marked unverified');
  if (q.verificationStatus === 'verified' && !['verified_pyq', 'official_sample'].includes(q.provenance)) bad('only verified_pyq / official_sample may be verified');
  return e;
}
module.exports = { validateQuestion, PROV };
