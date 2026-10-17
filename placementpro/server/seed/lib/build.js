const { rng, hashStr, shuffle } = require('./generators');
const BASE = { provenance: 'practice', verificationStatus: 'original', sourceTitle: 'Original practice question (authored for PlacementPro)', dateVerified: null, marks: 1, negativeMarks: 0 };
function buildMc(spec, { uid, companies, subject }) {
  const r = rng(hashStr(uid));
  const correctList = spec.multi ? spec.corrects : [spec.correct];
  const opts = shuffle(r, [...correctList, ...spec.wrongs]);
  return { ...BASE, uid, companies, subject, topic: spec.topic, difficulty: spec.difficulty, type: spec.multi ? 'mcq_multi' : 'mcq_single', text: spec.multi ? `${spec.text}\n(Select all that apply.)` : spec.text,
    options: opts, correct: correctList.map((c) => opts.indexOf(c)).sort((a, b) => a - b), explanation: spec.explanation, estimatedSeconds: spec.seconds };
}
module.exports = { buildMc, BASE };
