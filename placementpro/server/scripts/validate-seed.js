// Offline seed validation: schema/provenance rules, then compiles and runs every Java and Python reference solution
// against every example and generated test. Run: npm run seed:validate
const fs = require('fs'); const os = require('os'); const path = require('path'); const { spawnSync } = require('child_process');
const { loadQuestionFiles, validateAll } = require('../seed/index');

function normalizeText(value) {
  if (typeof value === 'undefined' || value === null) return '';
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function readStdout(result) {
  if (!result || typeof result.stdout === 'undefined') return '';
  return normalizeText(typeof result.stdout === 'string' ? result.stdout : result.stdout.toString());
}

function readStderr(result) {
  if (!result || typeof result.stderr === 'undefined') return '';
  return normalizeText(typeof result.stderr === 'string' ? result.stderr : result.stderr.toString());
}

function getPythonBinary() {
  const candidates = ['python', 'python3'];
  for (const name of candidates) {
    const check = spawnSync(name, ['--version'], { encoding: 'utf8', timeout: 20000 });
    if (!check.error && check.status === 0) return name;
    if (check.error && check.error.code !== 'ENOENT') return name;
  }
  return 'python';
}

const PYTHON = getPythonBinary();
const qs = loadQuestionFiles();
const errors = validateAll(qs);
const by = {}; for (const q of qs) by[q.subject] = (by[q.subject] || 0) + 1;
console.log('Questions by subject:', by, 'total', qs.length);
const prov = {}; for (const q of qs) prov[q.provenance] = (prov[q.provenance] || 0) + 1; console.log('By provenance:', prov);
let ran = 0;
for (const q of qs.filter((x) => x.type === 'coding')) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pp-'));
  fs.writeFileSync(path.join(dir, 'Main.java'), q.coding.referenceSolutions.java);
  const c = spawnSync('javac', ['Main.java'], { cwd: dir, encoding: 'utf8' });
  if (c.status !== 0) { errors.push(`${q.uid}: Java compile failed: ${readStderr(c).slice(0, 200)}`); continue; }
  for (const t of q.coding.testCases) {
    const j = spawnSync('java', ['-Xss64m', '-cp', dir, 'Main'], { input: t.input + '\n', encoding: 'utf8', timeout: 20000 });
    const p = spawnSync(PYTHON, ['-c', q.coding.referenceSolutions.python], { input: t.input + '\n', encoding: 'utf8', timeout: 20000 });
    ran++;
    const expected = normalizeText((t.output || '')).trim();
    const jOut = readStdout(j).trim(); const pOut = readStdout(p).trim();
    if (jOut !== expected) errors.push(`${q.uid}: Java output differs on ${JSON.stringify(t.input)} expected ${JSON.stringify(t.output)} got ${JSON.stringify(jOut)} ${readStderr(j).slice(0, 100)}`);
    if (p.error || p.status !== 0) errors.push(`${q.uid}: Python execution failed on ${JSON.stringify(t.input)}: ${readStderr(p).slice(0, 200) || p.error?.message || 'unknown error'}`);
    else if (pOut !== expected) errors.push(`${q.uid}: Python output differs on ${JSON.stringify(t.input)} expected ${JSON.stringify(expected)} got ${JSON.stringify(pOut)}`);
  }
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(`Executed ${ran} coding test runs (Java and Python each).`);
if (errors.length) { console.error(`\n${errors.length} PROBLEMS:\n` + errors.join('\n')); process.exit(1); }
console.log('Seed validation passed.');
