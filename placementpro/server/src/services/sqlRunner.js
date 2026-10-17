const path = require('path');
const { Worker } = require('worker_threads');
const config = require('../config');

const BLOCKED = /\b(attach|detach|pragma|insert|update|delete|drop|alter|create|replace|vacuum|reindex|analyze|load_extension|savepoint|begin|commit|rollback|truncate|grant)\b/i;

/** Returns null if the query is allowed, otherwise a human-readable rejection reason. */
function validateQuery(query) {
  if (typeof query !== 'string' || !query.trim()) return 'Enter a query to run.';
  if (query.length > 5000) return 'Query is too long (5000 characters max).';
  let q = query.replace(/--.*$/gm, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  q = q.replace(/'(?:[^']|'')*'/g, "''").replace(/"(?:[^"]|"")*"/g, '""');   // ignore string literals
  q = q.trim().replace(/;\s*$/, '');
  if (q.includes(';')) return 'Only a single statement can be run.';
  if (!/^(select|with)\b/i.test(q)) return 'Only SELECT queries (optionally starting with WITH) are allowed in SQL Lab.';
  const m = q.match(BLOCKED);
  if (m) return `The keyword "${m[0].toUpperCase()}" is not allowed in SQL Lab. This sandbox is read-only.`;
  return null;
}

function runInSandbox({ schemaSql, seedSql, query }) {
  return new Promise((resolve) => {
    const worker = new Worker(path.join(__dirname, 'sqlWorker.js'), {
      workerData: { schemaSql, seedSql, query },
      resourceLimits: { maxOldGenerationSizeMb: 160, maxYoungGenerationSizeMb: 32 },
    });
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } };
    const timer = setTimeout(() => { worker.terminate(); done({ ok: false, timedOut: true, error: 'Query took too long and was stopped.' }); }, config.sqlTimeoutMs);
    worker.once('message', (m) => { done(m); worker.terminate(); });
    worker.once('error', (e) => done({ ok: false, error: String(e.message || e) }));
    worker.once('exit', () => done({ ok: false, error: 'Sandbox stopped unexpectedly.' }));
  });
}

const norm = (v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v === undefined ? null : v);
const rowKey = (r) => JSON.stringify(r.map(norm));

function sameResult(actual, expected, orderMatters) {
  if (actual.columns.length !== expected.columns.length) return false;
  if (actual.rows.length !== expected.rows.length) return false;
  const a = actual.rows.map(rowKey), e = expected.rows.map(rowKey);
  if (!orderMatters) { a.sort(); e.sort(); }
  return a.every((x, i) => x === e[i]);
}

/** Execute a student's query and compare with the stored expected output of the exercise. */
async function gradeSql(question, query) {
  const reason = validateQuery(query);
  if (reason) return { status: 'rejected', message: reason };
  const sql = question.sql || {};
  const r = await runInSandbox({ schemaSql: sql.schemaSql, seedSql: sql.seedSql, query });
  if (!r.ok) return { status: 'error', message: r.error, runMs: r.ms };
  const expected = sql.expected ? { columns: sql.expected.columns, rows: JSON.parse(sql.expected.rowsJson || '[]') } : { columns: [], rows: [] };
  const correct = sameResult({ columns: r.columns, rows: r.rows }, expected, sql.orderMatters);
  return {
    status: correct ? 'correct' : 'wrong_result',
    message: correct ? 'Output matches the expected result.' : 'Your query ran, but the output does not match the expected result.',
    columns: r.columns, rows: r.rows.slice(0, 50), rowCount: r.rows.length, runMs: r.ms,
  };
}
module.exports = { validateQuery, runInSandbox, gradeSql, sameResult };
