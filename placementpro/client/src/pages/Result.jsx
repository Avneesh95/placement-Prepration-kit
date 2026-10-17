import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { CheckCircle2, XCircle, MinusCircle, Clock, Trophy, Target, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { useTheme } from '../lib/theme';
import { Card, Badge, Spinner, ErrorBox, PageTitle, Btn, Disclaimer } from '../components/ui';
import { label, mmss, pct } from '../lib/format';

const fmtResp = (q) => (
  q.type === 'numeric'
    ? String(q.response ?? '—')
    : q.type === 'sql' || q.type === 'coding'
    ? (q.response || '—')
    : (q.response || []).map((i) => q.options[i]).join(', ') || '—'
);

export default function Result() {
  const { isDark } = useTheme();
  const { id } = useParams();
  const { data, loading, error, reload } = useGet(`/attempts/${id}/result`);
  const [filter, setFilter] = useState('all');

  if (loading) return <Spinner label="Calculating your result…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const r = data.result;
  const qs = r.questions.filter((q) => filter === 'all' || (filter === 'wrong' ? q.state === 'incorrect' : q.state === 'unanswered'));
  const trend = [...data.comparison.map((c, i) => ({ n: `#${i + 1}`, pct: c.percentage })), { n: 'This', pct: r.percentage }];

  const isPassed = r.percentage >= 60;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Your Result"
        sub={data.test.title}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Mock Tests', to: '/mocks' },
          { label: 'Result' },
        ]}
        right={
          <Link to={`/mocks/${data.test.slug}`} className="btn btn-ghost inline-flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4" />
            <span>Retake Test</span>
          </Link>
        }
      />

      {data.autoSubmitted && (
        <Disclaimer>
          This attempt was submitted automatically when the allotted test duration expired.
        </Disclaimer>
      )}

      {/* Hero Scorecard */}
      <Card className="relative overflow-hidden border-2 border-brand-500/20 bg-gradient-to-br from-white via-brand-50/20 to-brand-50/40 dark:from-[#111827] dark:via-brand-950/20 dark:to-brand-950/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className={`grid h-16 w-16 place-items-center rounded-2xl shadow-inner ${
              isPassed
                ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
            }`}>
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {r.score}
                </span>
                <span className="text-lg font-semibold text-slate-400">/ {r.maxScore} marks</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs font-semibold">
                <span className="text-brand-600 dark:text-brand-400">{pct(r.percentage)} Score</span>
                <span className="text-slate-300 dark:text-gray-700">·</span>
                <span className="text-slate-600 dark:text-gray-300">Accuracy {pct(r.accuracy)}</span>
                <span className="text-slate-300 dark:text-gray-700">·</span>
                <span className={isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {isPassed ? 'Cleared' : 'Needs Practice'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-1/2">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Correct
              </div>
              <div className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-200">{r.correct}</div>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 dark:border-rose-900/40 dark:bg-rose-950/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-rose-700 dark:text-rose-400">
                <XCircle className="h-4 w-4" /> Incorrect
              </div>
              <div className="mt-1 text-xl font-bold text-rose-900 dark:text-rose-200">{r.incorrect}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-gray-400">
                <MinusCircle className="h-4 w-4" /> Skipped
              </div>
              <div className="mt-1 text-xl font-bold text-slate-800 dark:text-gray-200">{r.unanswered}</div>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-3 dark:border-brand-900/40 dark:bg-brand-950/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-brand-700 dark:text-brand-400">
                <Clock className="h-4 w-4" /> Time
              </div>
              <div className="mt-1 text-xl font-bold text-brand-900 dark:text-brand-200">{mmss(r.timeTakenSec)}</div>
            </div>
          </div>
        </div>

        {r.ungraded > 0 && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-gray-800 dark:text-gray-400">
            {r.ungraded} coding question(s) are evaluated on execution; compare your submission against the reference solution below.
          </p>
        )}
      </Card>

      {/* Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Section-wise Performance</h2>
            <span className="text-xs text-slate-500 dark:text-gray-400">Score % per section</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.sections.filter((s) => s.max > 0).map((s) => ({ name: s.name.length > 14 ? `${s.name.slice(0, 13)}…` : s.name, pct: s.max ? Math.round((s.score / s.max) * 100) : 0 }))}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <YAxis domain={[0, 100]} fontSize={11} width={30} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Score']}
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#1f2937' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="pct" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Attempt Comparison Trend</h2>
            <span className="text-xs text-slate-500 dark:text-gray-400">Historical performance</span>
          </div>
          {data.comparison.length === 0 ? (
            <div className="flex h-56 flex-col items-center justify-center text-center">
              <Target className="h-8 w-8 text-slate-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-gray-300">First attempt at this mock</p>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Retake this mock later to observe your score progression over time.</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e2e8f0'} />
                  <XAxis dataKey="n" fontSize={11} stroke={isDark ? '#94a3b8' : '#64748b'} />
                  <YAxis domain={[0, 100]} fontSize={11} width={30} stroke={isDark ? '#94a3b8' : '#64748b'} />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Score']}
                    contentStyle={{
                      backgroundColor: isDark ? '#111827' : '#ffffff',
                      borderColor: isDark ? '#1f2937' : '#e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      borderRadius: '0.75rem',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Line dataKey="pct" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Topic-wise Breakdown */}
      <Card>
        <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Topic-wise Performance</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Topic</th>
                <th className="px-3 font-semibold">Correct</th>
                <th className="px-3 font-semibold">Wrong</th>
                <th className="px-3 font-semibold">Skipped</th>
                <th className="px-3 font-semibold">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-gray-800/60">
              {[...r.topics]
                .sort((a, b) => (a.accuracy ?? 101) - (b.accuracy ?? 101))
                .map((t) => (
                  <tr key={t.topic} className="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{label(t.topic)}</td>
                    <td className="px-3 text-emerald-600 dark:text-emerald-400 font-semibold">{t.correct}</td>
                    <td className="px-3 text-rose-600 dark:text-rose-400 font-semibold">{t.incorrect}</td>
                    <td className="px-3 text-slate-400">{t.unanswered}</td>
                    <td className="px-3 font-bold text-slate-900 dark:text-white">{pct(t.accuracy)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Time-consuming questions & Recommendations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {r.slowQuestions.length > 0 && (
          <Card>
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Most Time-Consuming Questions</h2>
            <ul className="divide-y divide-slate-100 text-sm dark:divide-gray-800">
              {r.slowQuestions.map((s) => (
                <li key={s.questionId} className="flex items-center justify-between py-2.5">
                  <span className="font-medium text-slate-900 dark:text-white">{label(s.topic)}</span>
                  <span className="text-xs text-slate-500 dark:text-gray-400">
                    <b className="text-slate-700 dark:text-gray-300">{mmss(s.timeSpentSec)}</b> (est. {mmss(s.estimatedSeconds)})
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {(data.recommendations.practiceTopics.length > 0 || data.recommendations.nextMock) && (
          <Card className="border-brand-200/80 bg-brand-50/20 dark:border-brand-900/40 dark:bg-brand-950/10">
            <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Recommended Next Steps</h2>
            <ul className="space-y-2.5 text-sm">
              {data.recommendations.practiceTopics.map((t) => (
                <li key={t.topic} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900 dark:text-white">{label(t.topic)}</div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">{t.reason}</div>
                  </div>
                  <Link
                    to={`/practice?subject=${t.subject}&topic=${t.topic}`}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    <span>Practice</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
              {data.recommendations.nextMock && (
                <li className="pt-1">
                  <Link
                    to={`/mocks/${data.recommendations.nextMock.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Try next test: {data.recommendations.nextMock.title} →
                  </Link>
                </li>
              )}
            </ul>
          </Card>
        )}
      </div>

      {/* Question Review Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Review Questions & Answers</h2>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {[
              ['all', 'All Questions'],
              ['wrong', 'Incorrect'],
              ['skipped', 'Skipped'],
            ].map(([k, n]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === k
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {qs.map((q, i) => (
            <Card key={q.questionId} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Badge tone={q.state === 'correct' ? 'green' : q.state === 'incorrect' ? 'red' : 'slate'}>
                    {q.state}
                  </Badge>
                  <Badge tone="blue">{label(q.topic)}</Badge>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                  {q.marks > 0 ? `+${q.marks}` : q.marks} mark{Math.abs(q.marks) === 1 ? '' : 's'}
                </span>
              </div>

              <p className="pre-wrap text-sm font-medium text-slate-900 dark:text-white leading-relaxed">
                {q.text}
              </p>

              {q.options?.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {q.options.map((o, j) => {
                    const ok = q.correct?.includes(j);
                    const mine = Array.isArray(q.response) && q.response.includes(j);
                    return (
                      <li
                        key={j}
                        className={`flex items-start gap-2.5 rounded-xl border p-2.5 transition ${
                          ok
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 font-semibold'
                            : mine
                            ? 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200'
                            : 'border-slate-200 bg-slate-50/50 text-slate-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-700 shadow-xs dark:bg-gray-800 dark:text-gray-300">
                          {String.fromCharCode(65 + j)}
                        </span>
                        <div className="flex-1">
                          {o}
                          {ok && <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">✓ Correct</span>}
                          {mine && !ok && <span className="ml-2 text-rose-600 dark:text-rose-400 font-medium">(your answer)</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900">
                  <p>
                    <b className="text-slate-700 dark:text-gray-300">Your answer:</b>{' '}
                    <span className="pre-wrap font-mono text-xs">{fmtResp(q)}</span>
                  </p>
                  {q.numericAnswer !== undefined && q.numericAnswer !== null && (
                    <p>
                      <b className="text-slate-700 dark:text-gray-300">Correct answer:</b> {q.numericAnswer}
                    </p>
                  )}
                  {q.sqlReference && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reference SQL Query</p>
                      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-2.5 text-xs font-mono text-slate-100">
                        {q.sqlReference}
                      </pre>
                    </div>
                  )}
                  {q.coding?.referenceSolutions?.java && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reference Java Solution</p>
                      <pre className="max-h-56 overflow-auto rounded-xl bg-slate-900 p-2.5 text-xs font-mono text-slate-100">
                        {q.coding.referenceSolutions.java}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {q.explanation && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 text-sm dark:border-gray-800 dark:bg-gray-800/50">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                    Explanation
                  </p>
                  <p className="pre-wrap text-slate-700 dark:text-gray-300 leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </Card>
          ))}

          {qs.length === 0 && (
            <Card className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">
              No questions found for the selected filter.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

