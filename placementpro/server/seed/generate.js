// Regenerates every seed/<company|general>/*.json file. Deterministic. Run: npm run seed:generate
const fs = require('fs'); const path = require('path'); const { spawnSync } = require('child_process');
const initSqlJs = require('sql.js');
const { generateSet } = require('./lib/generators');
const { buildMc, BASE } = require('./lib/build');
const COMPANIES = require('./data/company-slugs');
const { highTopics } = require('./data/companies');
const write = (rel, data) => { const p = path.join(__dirname, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(data, null, 1)); console.log(rel.padEnd(34), data.length); };
const pad = (n) => String(n).padStart(3, '0');
const SERVICE = COMPANIES.filter((c) => c !== 'general-sde');

(async () => {
  for (const c of COMPANIES) {
    const hp = new Set(highTopics(c));
    for (const [subject, file, per, extra] of [['aptitude', 'aptitude', 2, 10], ['reasoning', 'reasoning', 3, 6]]) {
      const qs = generateSet({ company: c, subject, perTopic: per, extra, seedLabel: `${c}:${subject.slice(0, 3)}`, companies: [c] });
      write(`${c}/${file}.json`, qs.map((q) => (hp.has(q.topic) || hp.has(q.topic.split('-')[0]) ? { ...q, provenance: 'high_priority_practice' } : q)));
    }
  }
  const eng = require('./handwritten/english'), rea = require('./handwritten/reasoning'), cs = require('./handwritten/cs');
  const n = {}; const nextN = (k) => (n[k] = (n[k] || 0) + 1);
  write('general/english.json', eng.map((s) => buildMc(s, { uid: `gen-eng-${s.topic}-${pad(nextN('e' + s.topic))}`, companies: COMPANIES, subject: 'english' })));
  write('general/reasoning.json', rea.map((s) => buildMc(s, { uid: `gen-rea-${s.topic}-${pad(nextN('r' + s.topic))}`, companies: COMPANIES, subject: 'reasoning' })));
  write('general/cs-fundamentals.json', cs.map((s) => buildMc(s, { uid: `gen-cs-${s.topic}-${pad(nextN('c' + s.topic))}`, companies: COMPANIES, subject: 'cs' })));

  // Coding: expected outputs for hidden tests come from the Python reference; examples are human-written and must match.
  const getPythonBinary = () => {
    const candidates = ['python', 'python3'];
    for (const name of candidates) {
      const check = spawnSync(name, ['--version'], { encoding: 'utf8', timeout: 20000 });
      if (!check.error && check.status === 0) return name;
      if (check.error && check.error.code !== 'ENOENT') return name;
    }
    throw new Error('Python is required to generate seed data but no python/python3 executable was found on PATH.');
  };
  const PYTHON = getPythonBinary();
  const run = (code, input) => { const r = spawnSync(PYTHON, ['-c', code], { input: input + '\n', encoding: 'utf8', timeout: 10000 }); if (r.status !== 0) throw new Error(`python failed: ${r.stderr || r.error?.message || 'unknown error'}`); return (typeof r.stdout === 'string' ? r.stdout : r.stdout.toString()).trim(); };
  const coding = require('./handwritten/coding').map((p) => {
    for (const ex of p.examples) { const got = run(p.python, ex.input); if (got !== ex.output.trim()) throw new Error(`${p.slug}: example mismatch. input=${JSON.stringify(ex.input)} expected=${JSON.stringify(ex.output)} got=${JSON.stringify(got)}`); }
    const tests = [...p.examples.map((e) => ({ input: e.input, output: e.output.trim(), hidden: false })), ...p.extra.map((i) => ({ input: i, output: run(p.python, i), hidden: true }))];
    const comps = p.difficulty === 'easy' ? SERVICE : p.difficulty === 'medium' ? [...SERVICE, 'general-sde'] : ['general-sde'];
    return { ...BASE, uid: `coding-${p.slug}`, companies: p.difficulty === 'easy' ? [...SERVICE] : comps.filter((c) => c !== 'accenture' || p.difficulty !== 'hard'), subject: 'coding', topic: p.topic, subtopic: p.title, type: 'coding', difficulty: p.difficulty,
      text: `${p.title}: ${p.statement}`, explanation: p.explanation, estimatedSeconds: p.difficulty === 'easy' ? 900 : 1500, tags: [p.topic, p.slug],
      sourceTitle: 'Original practice problem. Company tags reflect difficulty-tier curation, not past papers.',
      coding: { statement: p.statement, constraints: p.constraints, inputFormat: p.inputFormat, outputFormat: p.outputFormat, examples: p.examples, hints: p.hints, edgeCases: p.edgeCases, complexity: p.complexity, referenceSolutions: { java: p.java, python: p.python }, testCases: tests, top100: true } };
  });
  write('general/coding.json', coding);

  // SQL: expected output computed by running the reference query in the same sandbox engine.
  const SQL = require('./handwritten/sql'); const SQLJS = await initSqlJs();
  const sqlDocs = SQL.exercises.map((x, i) => {
    const db = new SQLJS.Database(); db.exec(SQL.SCHEMA); db.exec(SQL.SEED);
    const res = db.exec(x.referenceQuery)[0]; if (!res || !res.values.length) throw new Error(`sql ${x.topic}: empty expected output`);
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")[0].values.map((v) => v[0]);
    const preview = tables.map((t) => { const r = db.exec(`SELECT * FROM ${t} LIMIT 5`)[0]; return { name: t, columns: r.columns, rowsJson: JSON.stringify(r.values) }; });
    db.close();
    return { ...BASE, uid: `sql-${x.topic}-${pad(i + 1)}`, companies: COMPANIES, subject: 'sql', topic: x.topic, difficulty: x.difficulty, type: 'sql', text: x.text, explanation: x.explanation, estimatedSeconds: x.difficulty === 'easy' ? 120 : x.difficulty === 'medium' ? 240 : 360,
      sql: { schemaSql: SQL.SCHEMA, seedSql: SQL.SEED, referenceQuery: x.referenceQuery, orderMatters: x.orderMatters, expected: { columns: res.columns, rowsJson: JSON.stringify(res.values) }, tablesPreview: preview } };
  });
  write('general/sql.json', sqlDocs);
})().catch((e) => { console.error(e); process.exit(1); });
