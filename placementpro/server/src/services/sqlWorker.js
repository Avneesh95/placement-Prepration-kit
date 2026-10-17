// Runs inside a worker thread: fresh in-memory SQLite per run, no file or network access.
const { parentPort, workerData } = require('worker_threads');
const initSqlJs = require('sql.js');
(async () => {
  const t0 = Date.now();
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.exec(workerData.schemaSql || '');
    if (workerData.seedSql) db.exec(workerData.seedSql);
    const res = db.exec(workerData.query);
    const last = res.length ? res[res.length - 1] : { columns: [], values: [] };
    db.close();
    parentPort.postMessage({ ok: true, columns: last.columns, rows: last.values.slice(0, 500), ms: Date.now() - t0 });
  } catch (e) {
    parentPort.postMessage({ ok: false, error: String(e.message || e), ms: Date.now() - t0 });
  }
})();
