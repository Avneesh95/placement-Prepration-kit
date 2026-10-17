import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { Card, Badge, Btn, Spinner, ErrorBox, PageTitle, Empty, Disclaimer } from '../components/ui';
import { label } from '../lib/format';

export function SqlList() {
  const [topic, setTopic] = useState(''); const [difficulty, setDifficulty] = useState(''); const [status, setStatus] = useState('');
  const list = useGet(`/sql?${new URLSearchParams(Object.entries({ topic, difficulty, status }).filter(([, v]) => v)).toString()}`);
  const all = useGet('/sql'); const topics = [...new Set((all.data?.items || []).map((q) => q.topic))];
  return (
    <div>
      <PageTitle title="SQL Lab" sub="Write real queries against a safe sandbox database." />
      <div className="mb-4"><Disclaimer>Queries run in a throwaway in-memory SQLite database that is read-only and separate from the app’s database. Only <code>SELECT</code>/<code>WITH</code> statements are allowed.</Disclaimer></div>
      <div className="card mb-4 grid gap-2 sm:grid-cols-3">
        <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic"><option value="">All topics</option>{topics.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
        <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty"><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="">Any status</option><option value="unsolved">Unsolved</option><option value="solved">Solved</option></select>
      </div>
      {list.loading ? <Spinner /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? <Empty>No exercises match.</Empty> : (
        <div className="space-y-2">{list.data.items.map((q) => <Link key={q._id} to={`/sql/${q._id}`}><Card className="flex items-center justify-between gap-3 hover:border-brand-500"><div><h3 className="text-[15px] font-semibold">{q.text}</h3><p className="muted">{label(q.topic)}</p></div><div className="flex shrink-0 gap-2">{q.userState.solved ? <Badge tone="green">Solved</Badge> : q.userState.attempted ? <Badge tone="amber">Tried</Badge> : null}<Badge tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'green'}>{q.difficulty}</Badge></div></Card></Link>)}</div>)}
    </div>
  );
}
const Table = ({ columns, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 dark:bg-slate-800"><tr>{columns.map((c) => <th key={c} className="px-3 py-2 font-semibold">{c}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-slate-100 dark:border-slate-800">{r.map((v, j) => <td key={j} className="px-3 py-1.5 font-mono">{v === null ? <i className="text-slate-400">NULL</i> : String(v)}</td>)}</tr>)}</tbody></table></div>
);
export function SqlExercise() {
  const { id } = useParams(); const { data, loading, error, reload } = useGet(`/sql/${id}`);
  const [query, setQuery] = useState(''); const [out, setOut] = useState(null); const [err, setErr] = useState(null); const [verdict, setVerdict] = useState(null); const [rev, setRev] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (data?.recentSubmissions?.[0]) setQuery(data.recentSubmissions[0].query); }, [data]);
  if (loading) return <Spinner />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  const q = data.question;
  const run = async (kind) => {
    setErr(null); setBusy(true); if (kind === 'run') setVerdict(null);
    try { const r = await api.post(`/sql/${id}/${kind}`, { query }); if (kind === 'run') setOut(r); else { setVerdict(r); if (r.columns) setOut(r); reload(); } }
    catch (e) { setErr(e); setOut(null); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <PageTitle title={label(q.topic)} sub={q.difficulty} />
      <Card><p className="text-[15px]">{q.text}</p></Card>
      <Card><h3 className="mb-2 font-semibold">Tables (first rows)</h3><div className="space-y-3">{q.sql.tablesPreview.map((t) => <div key={t.name}><b className="text-sm">{t.name}</b><Table columns={t.columns} rows={t.rows} /></div>)}</div></Card>
      <Card><textarea className="input min-h-[150px] font-mono text-xs" spellCheck={false} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="SELECT …" aria-label="SQL query" />
        <div className="mt-2"><ErrorBox error={err} /></div>
        <div className="mt-3 flex flex-wrap gap-2"><Btn variant="ghost" onClick={() => run('run')} disabled={busy || !query.trim()}>Run</Btn><Btn onClick={() => run('submit')} disabled={busy || !query.trim()}>Submit answer</Btn><Btn variant="ghost" onClick={async () => setRev(await api.post(`/sql/${id}/reveal`))}>Show solution</Btn></div>
        {verdict && <p role="status" className={`mt-3 rounded-xl p-3 text-sm font-semibold ${verdict.correct ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>{verdict.message}</p>}
        {out && <div className="mt-3"><p className="muted mb-1">{out.rowCount} row(s)</p><Table columns={out.columns} rows={out.rows} /></div>}</Card>
      {rev && <Card><h3 className="font-semibold">Reference solution</h3><pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{rev.referenceQuery}</pre><p className="mt-2 text-sm">{rev.explanation}</p><h4 className="mt-3 text-sm font-semibold">Expected output</h4><Table columns={rev.expected.columns} rows={rev.expected.rows} /></Card>}
      {data.recentSubmissions.length > 0 && <Card><h3 className="mb-2 font-semibold">Your attempts</h3><ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">{data.recentSubmissions.map((s) => <li key={s._id} className="flex items-center justify-between py-2"><code className="truncate pr-2 text-xs">{s.query}</code><Badge tone={s.status === 'correct' ? 'green' : 'red'}>{label(s.status)}</Badge></li>)}</ul></Card>}
    </div>
  );
}
