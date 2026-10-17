import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { CheckCircle2, XCircle, MinusCircle, Clock } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { useTheme } from '../lib/theme';
import { Card, Badge, Spinner, ErrorBox, PageTitle, Btn, Disclaimer } from '../components/ui';
import { label, mmss, pct } from '../lib/format';

const fmtResp = (q) => (q.type === 'numeric' ? String(q.response ?? '—') : q.type === 'sql' || q.type === 'coding' ? (q.response || '—') : (q.response || []).map((i) => q.options[i]).join(', ') || '—');
export default function Result() {
  const { isDark } = useTheme();
  const { id } = useParams(); const { data, loading, error, reload } = useGet(`/attempts/${id}/result`); const [filter, setFilter] = useState('all');
  if (loading) return <Spinner label="Calculating your result…" />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  const r = data.result; const qs = r.questions.filter((q) => filter === 'all' || (filter === 'wrong' ? q.state === 'incorrect' : q.state === 'unanswered'));
  const trend = [...data.comparison.map((c, i) => ({ n: `#${i + 1}`, pct: c.percentage })), { n: 'This', pct: r.percentage }];
  return (
    <div className="space-y-4">
      <PageTitle title="Your result" sub={data.test.title} right={<Link to={`/mocks/${data.test.slug}`} className="btn btn-ghost">Retake</Link>} />
      {data.autoSubmitted && <Disclaimer>This attempt was submitted automatically when the time ran out.</Disclaimer>}
      <Card><div className="flex flex-wrap items-center gap-6"><div><div className="text-4xl font-extrabold text-brand-600">{r.score}<span className="text-xl text-slate-400"> / {r.maxScore}</span></div><div className="muted">{pct(r.percentage)} · accuracy {pct(r.accuracy)}</div></div>
        <div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{r.correct} correct</div><div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-600" />{r.incorrect} wrong</div><div className="flex items-center gap-2"><MinusCircle className="h-4 w-4 text-slate-400" />{r.unanswered} skipped</div><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand-600" />{mmss(r.timeTakenSec)}</div></div></div>
        {r.ungraded > 0 && <p className="muted mt-3">{r.ungraded} coding question(s) are not auto-scored. Compare your code with the reference solution below.</p>}</Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Section-wise score</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.sections.filter((s) => s.max > 0).map((s) => ({ name: s.name.length > 14 ? `${s.name.slice(0, 13)}…` : s.name, pct: s.max ? Math.round((s.score / s.max) * 100) : 0 }))}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <YAxis domain={[0, 100]} fontSize={11} width={30} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#f8fafc' : '#0f172a', borderRadius: '0.75rem' }} />
                <Bar dataKey="pct" fill="#2f6bff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Compared with your previous attempts</h2>
          {data.comparison.length === 0 ? (
            <p className="muted">This is your first attempt at this test. Retake it later to see your trend.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="n" fontSize={11} stroke={isDark ? '#94a3b8' : '#64748b'} />
                  <YAxis domain={[0, 100]} fontSize={11} width={30} stroke={isDark ? '#94a3b8' : '#64748b'} />
                  <Tooltip formatter={(v) => `${v}%`} contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#f8fafc' : '#0f172a', borderRadius: '0.75rem' }} />
                  <Line dataKey="pct" stroke="#f28c28" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
      <Card><h2 className="mb-2 font-semibold">Topic-wise performance</h2><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs text-slate-500"><tr><th className="py-1 pr-3">Topic</th><th className="pr-3">Correct</th><th className="pr-3">Wrong</th><th className="pr-3">Skipped</th><th>Accuracy</th></tr></thead><tbody>{[...r.topics].sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101)).map((t) => <tr key={t.topic} className="border-t border-slate-100 dark:border-slate-800"><td className="py-1.5 pr-3">{label(t.topic)}</td><td>{t.correct}</td><td>{t.incorrect}</td><td>{t.unanswered}</td><td>{pct(t.accuracy)}</td></tr>)}</tbody></table></div></Card>
      {r.slowQuestions.length > 0 && <Card><h2 className="mb-2 font-semibold">Most time-consuming questions</h2><ul className="text-sm">{r.slowQuestions.map((s) => <li key={s.questionId} className="flex justify-between py-1"><span>{label(s.topic)}</span><span className="muted">{mmss(s.timeSpentSec)} (est. {mmss(s.estimatedSeconds)})</span></li>)}</ul></Card>}
      {(data.recommendations.practiceTopics.length > 0 || data.recommendations.nextMock) && <Card><h2 className="mb-2 font-semibold">Recommended next</h2><ul className="space-y-2 text-sm">{data.recommendations.practiceTopics.map((t) => <li key={t.topic} className="flex items-center justify-between gap-2"><span>{label(t.topic)} <span className="muted">— {t.reason}</span></span><Link className="font-semibold text-brand-600" to={`/practice?subject=${t.subject}&topic=${t.topic}`}>Practise</Link></li>)}{data.recommendations.nextMock && <li><Link className="font-semibold text-brand-600" to={`/mocks/${data.recommendations.nextMock.slug}`}>Try next: {data.recommendations.nextMock.title} →</Link></li>}</ul></Card>}
      <div><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Review answers</h2><div className="flex gap-1">{[['all', 'All'], ['wrong', 'Wrong'], ['skipped', 'Skipped']].map(([k, n]) => <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === k ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>{n}</button>)}</div></div>
        <div className="space-y-3">{qs.map((q, i) => (
          <Card key={q.questionId}><div className="mb-1 flex flex-wrap items-center gap-2"><Badge tone={q.state === 'correct' ? 'green' : q.state === 'incorrect' ? 'red' : 'slate'}>{q.state}</Badge><Badge tone="blue">{label(q.topic)}</Badge><span className="muted ml-auto">{q.marks > 0 ? `+${q.marks}` : q.marks}</span></div>
            <p className="pre-wrap text-sm">{q.text}</p>
            {q.options?.length > 0 ? <ul className="mt-2 space-y-1 text-sm">{q.options.map((o, j) => { const ok = q.correct?.includes(j); const mine = Array.isArray(q.response) && q.response.includes(j); return <li key={j} className={`rounded-lg px-2 py-1 ${ok ? 'bg-emerald-50 font-semibold dark:bg-emerald-950' : mine ? 'bg-red-50 dark:bg-red-950' : ''}`}>{String.fromCharCode(65 + j)}. {o}{ok ? ' ✓' : mine ? ' (your answer)' : ''}</li>; })}</ul>
              : <div className="mt-2 text-sm"><p><b>Your answer:</b> <span className="pre-wrap font-mono text-xs">{fmtResp(q)}</span></p>{q.numericAnswer !== undefined && q.numericAnswer !== null && <p><b>Correct answer:</b> {q.numericAnswer}</p>}{q.sqlReference && <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-2 text-xs text-slate-100">{q.sqlReference}</pre>}{q.coding?.referenceSolutions?.java && <pre className="mt-1 max-h-56 overflow-auto rounded-xl bg-slate-900 p-2 text-xs text-slate-100">{q.coding.referenceSolutions.java}</pre>}</div>}
            {q.explanation && <p className="pre-wrap mt-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">{q.explanation}</p>}</Card>))}
          {qs.length === 0 && <Card className="text-center muted">Nothing to show for this filter.</Card>}</div></div>
    </div>
  );
}
