process.env.NODE_ENV = 'test';
const { gradeObjective } = require('../src/services/scoring');
const { validateQuery, runInSandbox, gradeSql } = require('../src/services/sqlRunner');
const { validateQuestion } = require('../seed/lib/validate');
const { computeStreak } = require('../src/services/stats');

describe('scoring', () => {
  const single = { type: 'mcq_single', correct: [2], marks: 2, negativeMarks: 0.5 };
  test('correct / incorrect / unanswered with negative marking', () => {
    expect(gradeObjective(single, [2])).toEqual({ state: 'correct', marks: 2 });
    expect(gradeObjective(single, [1])).toEqual({ state: 'incorrect', marks: -0.5 });
    expect(gradeObjective(single, [])).toEqual({ state: 'unanswered', marks: 0 });
    expect(gradeObjective(single, null).state).toBe('unanswered');
  });
  test('multi-select is all-or-nothing', () => {
    const m = { type: 'mcq_multi', correct: [0, 2], marks: 1, negativeMarks: 0 };
    expect(gradeObjective(m, [2, 0]).state).toBe('correct');
    expect(gradeObjective(m, [0]).state).toBe('incorrect');
    expect(gradeObjective(m, [0, 1, 2]).state).toBe('incorrect');
  });
  test('numeric answers honour tolerance', () => {
    const n = { type: 'numeric', numericAnswer: 10, tolerance: 0.5, marks: 1, negativeMarks: 0 };
    expect(gradeObjective(n, '10.4').state).toBe('correct');
    expect(gradeObjective(n, 11).state).toBe('incorrect');
    expect(gradeObjective(n, '').state).toBe('unanswered');
  });
});

describe('SQL sandbox', () => {
  test('rejects anything that is not a single SELECT/WITH', () => {
    for (const q of ['DROP TABLE employees', 'DELETE FROM employees', 'SELECT 1; DROP TABLE employees', 'PRAGMA table_info(employees)', "ATTACH DATABASE 'x' AS y", 'INSERT INTO departments VALUES (9,\'x\')', 'WITH a AS (SELECT 1) DELETE FROM employees', '']) {
      expect(validateQuery(q)).toBeTruthy();
    }
    expect(validateQuery("SELECT 'DROP' AS word")).toBeNull();
    expect(validateQuery('select * from employees;')).toBeNull();
  });
  test('runs a query in an isolated in-memory database', async () => {
    const r = await runInSandbox({ schemaSql: 'CREATE TABLE t(a INT);', seedSql: 'INSERT INTO t VALUES (1),(2);', query: 'SELECT SUM(a) FROM t' });
    expect(r.ok).toBe(true); expect(r.rows).toEqual([[3]]);
  });
  test('stops runaway queries', async () => {
    const r = await runInSandbox({ schemaSql: '', seedSql: '', query: 'WITH RECURSIVE c(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM c) SELECT COUNT(*) FROM c' });
    expect(r.ok).toBe(false);
  }, 15000);
  test('grades by comparing result sets (order-insensitive when allowed)', async () => {
    const q = { sql: { schemaSql: 'CREATE TABLE t(a INT);', seedSql: 'INSERT INTO t VALUES (3),(1),(2);', orderMatters: false, expected: { columns: ['a'], rowsJson: JSON.stringify([[1], [2], [3]]) } } };
    expect((await gradeSql(q, 'SELECT a FROM t')).status).toBe('correct');
    expect((await gradeSql(q, 'SELECT a FROM t WHERE a > 1')).status).toBe('wrong_result');
    expect((await gradeSql(q, 'SELECT nope FROM t')).status).toBe('error');
  });
});

describe('provenance honesty rules', () => {
  const ctx = { companies: new Set(['tcs']), topics: new Set(['aptitude:percentages']) };
  const base = { uid: 'x', companies: ['tcs'], subject: 'aptitude', topic: 'percentages', type: 'mcq_single', difficulty: 'easy', text: 'What is 10% of 50?', options: ['5', '6'], correct: [0], explanation: '10% of 50 is 50 times 0.1, which is 5.', provenance: 'practice' };
  test('a verified previous-year question needs source, date and year', () => {
    expect(validateQuestion({ ...base, provenance: 'verified_pyq' }, ctx).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, provenance: 'verified_pyq', verificationStatus: 'verified', sourceUrl: 'https://example.com', dateVerified: new Date(), assessmentYear: 2024 }, ctx)).toEqual([]);
  });
  test('memory-based must be unverified; practice cannot claim verified', () => {
    expect(validateQuestion({ ...base, provenance: 'memory_based', verificationStatus: 'verified' }, ctx).length).toBeGreaterThan(0);
    expect(validateQuestion({ ...base, verificationStatus: 'verified' }, ctx).length).toBeGreaterThan(0);
  });
});

test('streak counts consecutive days ending today or yesterday', () => {
  const d = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  expect(computeStreak([d(0), d(1), d(2), d(5)]).current).toBe(3);
  expect(computeStreak([d(1), d(2)]).current).toBe(2);
  expect(computeStreak([d(3)]).current).toBe(0);
});
