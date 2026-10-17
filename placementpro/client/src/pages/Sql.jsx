import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Database, Play, CheckCircle2, HelpCircle, Code2 } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { Card, Badge, Btn, Spinner, ErrorBox, PageTitle, Empty, Disclaimer } from '../components/ui';
import { label } from '../lib/format';

export function SqlList() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [status, setStatus] = useState('');
  const list = useGet(`/sql?${new URLSearchParams(Object.entries({ topic, difficulty, status }).filter(([, v]) => v)).toString()}`);
  const all = useGet('/sql');
  const topics = [...new Set((all.data?.items || []).map((q) => q.topic))];

  return (
    <div className="space-y-6">
      <PageTitle
        title="SQL Practice Lab"
        sub="Write and execute real SQL queries against an in-memory SQLite sandbox with instant automated grading."
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'SQL Lab' },
        ]}
      />

      <div className="mb-2">
        <Disclaimer>
          Queries run in a sandboxed, read-only in-memory SQLite database separate from the app’s database. Only <code>SELECT</code> and <code>WITH</code> statements are permitted.
        </Disclaimer>
      </div>

      <Card className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-gray-300">Topic</label>
          <select className="input" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
            <option value="">All topics</option>
            {topics.map((t) => <option key={t} value={t}>{label(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-gray-300">Difficulty</label>
          <select className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Difficulty">
            <option value="">Any difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-gray-300">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">Any status</option>
            <option value="unsolved">Unsolved</option>
            <option value="solved">Solved</option>
          </select>
        </div>
      </Card>

      {list.loading ? (
        <Spinner label="Loading SQL exercises…" />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.reload} />
      ) : list.data.items.length === 0 ? (
        <Empty title="No SQL exercises match your filters">Try selecting a different topic or resetting the filter options.</Empty>
      ) : (
        <div className="grid gap-3">
          {list.data.items.map((q) => (
            <Link key={q._id} to={`/sql/${q._id}`} className="group block">
              <Card hover className="flex items-center justify-between gap-4 transition group-hover:border-brand-500/50">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Database className="h-4 w-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                      {q.text}
                    </h3>
                    {q.sql?.leetcodeUrl && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        LeetCode
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{label(q.topic)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {q.userState.solved ? (
                    <Badge tone="green">Solved</Badge>
                  ) : q.userState.attempted ? (
                    <Badge tone="amber">Tried</Badge>
                  ) : null}
                  <Badge tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'green'}>
                    {q.difficulty}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const Table = ({ columns, rows }) => (
  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <table className="min-w-full text-left text-xs">
      <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
        <tr>
          {columns.map((c) => (
            <th key={c} className="px-3.5 py-2.5 font-bold tracking-wider">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-gray-800/60">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition">
            {r.map((v, j) => (
              <td key={j} className="px-3.5 py-2 font-mono text-slate-800 dark:text-gray-200">
                {v === null ? <i className="text-slate-400 dark:text-gray-500">NULL</i> : String(v)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export function SqlExercise() {
  const { id } = useParams();
  const { data, loading, error, reload } = useGet(`/sql/${id}`);
  const [query, setQuery] = useState('');
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [rev, setRev] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.recentSubmissions?.[0]) setQuery(data.recentSubmissions[0].query);
  }, [data]);

  if (loading) return <Spinner label="Loading SQL exercise…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const q = data.question;

  const run = async (kind) => {
    setErr(null);
    setBusy(true);
    if (kind === 'run') setVerdict(null);
    try {
      const r = await api.post(`/sql/${id}/${kind}`, { query });
      if (kind === 'run') {
        setOut(r);
      } else {
        setVerdict(r);
        if (r.columns) setOut(r);
        reload();
      }
    } catch (e) {
      setErr(e);
      setOut(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title={label(q.topic)}
        sub={`Difficulty: ${q.difficulty}`}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'SQL Lab', to: '/sql' },
          { label: label(q.topic) },
        ]}
        right={
          q.sql?.leetcodeUrl && (
            <a
              href={q.sql.leetcodeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-500/20 dark:text-amber-300"
              title="Practice this exact SQL query on LeetCode"
            >
              <span>Solve on LeetCode</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )
        }
      />

      {/* Problem Statement Card */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">Task</h3>
            <p className="mt-1 text-base font-medium text-slate-900 dark:text-white leading-relaxed">{q.text}</p>
          </div>
        </div>
      </Card>

      {/* Schema / Tables Preview */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Database Schema & Sample Data</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-gray-400">Read-only SQLite sandbox</span>
        </div>
        <div className="space-y-4">
          {q.sql.tablesPreview.map((t) => (
            <div key={t.name} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                  {t.name}
                </span>
                <span className="text-[11px] text-slate-400">({t.rows.length} rows shown)</span>
              </div>
              <Table columns={t.columns} rows={t.rows} />
            </div>
          ))}
        </div>
      </Card>

      {/* SQL Editor Card */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white">Query Editor</h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-gray-400">SQLite 3.x</span>
        </div>

        <textarea
          className="input min-h-[160px] font-mono text-xs leading-relaxed focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-gray-100"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT ..."
          aria-label="SQL query"
        />

        <div className="mt-2">
          <ErrorBox error={err} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Btn variant="ghost" onClick={() => run('run')} disabled={busy || !query.trim()}>
            <Play className="h-3.5 w-3.5 mr-1" />
            Run
          </Btn>
          <Btn onClick={() => run('submit')} disabled={busy || !query.trim()}>
            Submit answer
          </Btn>
          <Btn variant="ghost" onClick={async () => setRev(await api.post(`/sql/${id}/reveal`))}>
            Show solution
          </Btn>
        </div>

        {verdict && (
          <p
            role="status"
            className={`mt-4 rounded-xl p-3 text-sm font-semibold ${
              verdict.correct
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/60 dark:text-red-200 dark:border-red-900'
            }`}
          >
            {verdict.message}
          </p>
        )}

        {out && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                Query Result
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-gray-400">
                {out.rowCount} row(s) returned
              </span>
            </div>
            <Table columns={out.columns} rows={out.rows} />
          </div>
        )}
      </Card>

      {/* Solution Reveal */}
      {rev && (
        <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10">
          <h3 className="font-semibold text-slate-900 dark:text-white">Reference Solution</h3>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-3.5 text-xs font-mono text-slate-100 shadow-inner">
            {rev.referenceQuery}
          </pre>
          <p className="mt-3 text-sm text-slate-700 dark:text-gray-300 leading-relaxed">{rev.explanation}</p>
          <h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
            Expected output
          </h4>
          <div className="mt-1.5">
            <Table columns={rev.expected.columns} rows={rev.expected.rows} />
          </div>
        </Card>
      )}

      {/* Previous Submissions */}
      {data.recentSubmissions.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">Your Submissions</h3>
          <ul className="divide-y divide-slate-100 text-sm dark:divide-gray-800">
            {data.recentSubmissions.map((s) => (
              <li key={s._id} className="flex items-center justify-between py-2.5">
                <code className="truncate pr-3 font-mono text-xs text-slate-700 dark:text-gray-300">
                  {s.query}
                </code>
                <Badge tone={s.status === 'correct' ? 'green' : 'red'}>
                  {label(s.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

