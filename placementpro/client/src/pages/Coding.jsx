import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Lightbulb,
  ExternalLink,
  Code2,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api, qs } from '../lib/api';
import {
  Card,
  Badge,
  Btn,
  Spinner,
  ErrorBox,
  PageTitle,
  Empty,
  Disclaimer,
} from '../components/ui';
import { label } from '../lib/format';

export function CodingList() {
  const [sp, setSp] = useSearchParams();
  const f = {
    company: sp.get('company') || '',
    topic: sp.get('topic') || '',
    difficulty: sp.get('difficulty') || '',
    language: sp.get('language') || '',
    status: sp.get('status') || '',
    bookmarked: sp.get('bookmarked') || '',
    collection: sp.get('collection') || '',
    q: sp.get('q') || '',
    page: sp.get('page') || '1',
  };

  const list = useGet(`/coding${qs({ ...f, limit: 12 })}`);
  const daily = useGet('/coding/daily');
  const companies = useGet('/companies');
  const topics = useGet('/topics?subject=coding');

  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== 'page') n.delete('page');
    setSp(n);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Coding Arena"
        sub="Practice foundational fresher coding problems, then benchmark against official offline-tested Java and Python reference solutions."
      />

      <Disclaimer>
        <b>Practice interface, not an automated online judge.</b> Your code is saved to your personal history. Offline-tested reference solutions (Java & Python) are provided for self-comparison. Mark your results honestly.
      </Disclaimer>

      {/* Daily Challenge Highlight */}
      {daily.data && (
        <Link to={`/coding/${daily.data.question._id}`}>
          <Card hover className="border-amber-400/40 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="orange">Daily Challenge</Badge>
                <span className="text-xs text-slate-500 dark:text-gray-400">
                  {label(daily.data.question.topic)} · {daily.data.question.difficulty}
                </span>
              </div>
              {daily.data.question.coding?.leetcodeUrl && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span>Solve on LeetCode</span>
                  <ExternalLink className="h-3 w-3" />
                </span>
              )}
            </div>
            <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
              {daily.data.question.subtopic}
            </h2>
          </Card>
        </Link>
      )}

      {/* Filter Toolbar */}
      <div className="card space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 text-xs"
              placeholder="Search problems by name…"
              value={f.q}
              onChange={(e) => set('q', e.target.value)}
              aria-label="Search"
            />
          </div>

          <select
            className="input text-xs"
            value={f.collection}
            onChange={(e) => set('collection', e.target.value)}
            aria-label="Collection"
          >
            <option value="">All Collections</option>
            <option value="top100">Core Fresher Set</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <select
            className="input text-xs"
            value={f.topic}
            onChange={(e) => set('topic', e.target.value)}
            aria-label="Topic"
          >
            <option value="">All Topics</option>
            {topics.data?.items.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            className="input text-xs"
            value={f.company}
            onChange={(e) => set('company', e.target.value)}
            aria-label="Company"
          >
            <option value="">All Companies</option>
            {companies.data?.items.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input text-xs"
            value={f.difficulty}
            onChange={(e) => set('difficulty', e.target.value)}
            aria-label="Difficulty"
          >
            <option value="">Any Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="input text-xs"
            value={f.status}
            onChange={(e) => set('status', e.target.value)}
            aria-label="Status"
          >
            <option value="">Any Status</option>
            <option value="unsolved">Unsolved</option>
            <option value="attempted">Attempted</option>
            <option value="solved">Solved</option>
          </select>

          <select
            className="input text-xs"
            value={f.language}
            onChange={(e) => set('language', e.target.value)}
            aria-label="Language used"
          >
            <option value="">Any Language</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>
        </div>
      </div>

      {/* Problem Listing */}
      {list.loading ? (
        <Spinner label="Loading coding problems…" />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.reload} />
      ) : list.data.items.length === 0 ? (
        <Empty icon={Code2} title="No problems match these filters">
          Try expanding your search criteria or resetting filters.
        </Empty>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2.5">
            {list.data.items.map((q) => (
              <Link key={q._id} to={`/coding/${q._id}`}>
                <Card hover className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {q.subtopic}
                      </h3>
                      {q.coding?.leetcodeUrl && (
                        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          LeetCode
                        </span>
                      )}
                    </div>
                    <p className="muted mt-0.5 text-xs">{label(q.topic)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {q.userState.solved ? (
                      <Badge tone="green">Solved</Badge>
                    ) : q.userState.attempted ? (
                      <Badge tone="amber">Attempted</Badge>
                    ) : null}
                    <Badge
                      tone={
                        q.difficulty === 'hard'
                          ? 'red'
                          : q.difficulty === 'medium'
                          ? 'amber'
                          : 'green'
                      }
                    >
                      {q.difficulty}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-gray-800">
            <Btn
              variant="ghost"
              size="sm"
              disabled={list.data.page <= 1}
              onClick={() => set('page', String(list.data.page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Btn>
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">
              {list.data.total} problems · Page {list.data.page} of {list.data.pages}
            </span>
            <Btn
              variant="ghost"
              size="sm"
              disabled={list.data.page >= list.data.pages}
              onClick={() => set('page', String(list.data.page + 1))}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export function CodingProblem() {
  const { id } = useParams();
  const { data, loading, error, reload } = useGet(`/coding/${id}`);
  const subs = useGet(`/coding/${id}/submissions`);

  const [lang, setLang] = useState('java');
  const [code, setCode] = useState('');
  const [self, setSelf] = useState('attempted');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(null);
  const [rev, setRev] = useState(null);
  const [hint, setHint] = useState(0);
  const [bm, setBm] = useState(false);
  const [t0] = useState(Date.now());

  useEffect(() => {
    if (data) {
      setBm(!!data.question.userState?.bookmarked);
      if (data.lastSubmission) {
        setLang(data.lastSubmission.language);
        setCode(data.lastSubmission.code);
      }
    }
  }, [data]);

  if (loading) return <Spinner label="Loading problem statement and editor…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const q = data.question;
  const c = q.coding;

  const save = async () => {
    setErr(null);
    setMsg('');
    try {
      await api.post(`/coding/${id}/submissions`, {
        language: lang,
        code,
        selfStatus: self,
        timeSpentSec: Math.round((Date.now() - t0) / 1000),
      });
      setMsg('Saved to your personal submission history.');
      subs.reload();
    } catch (e) {
      setErr(e);
    }
  };

  const reveal = async () => {
    try {
      setRev(await api.post(`/coding/${id}/reveal`));
    } catch (e) {
      setErr(e);
    }
  };

  const flip = async () => {
    if (bm) await api.del(`/bookmarks/${id}`);
    else await api.post(`/bookmarks/${id}`);
    setBm(!bm);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        breadcrumb={`${label(q.topic)} · ${q.difficulty}`}
        title={q.subtopic}
        right={
          <div className="flex items-center gap-2">
            {c?.leetcodeUrl && (
              <a
                href={c.leetcodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-700 shadow-sm transition hover:bg-amber-500/20 dark:text-amber-300"
                title="Practice this exact problem on LeetCode"
              >
                <span>Solve on LeetCode</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-subtle hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={flip}
              aria-label={bm ? 'Remove bookmark' : 'Bookmark'}
            >
              {bm ? (
                <BookmarkCheck className="h-5 w-5 text-amber-500 fill-amber-500" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </button>
          </div>
        }
      />

      {/* Problem Statement Card */}
      <Card>
        <p className="pre-wrap text-[15px] leading-relaxed text-slate-900 dark:text-gray-100">
          {c.statement}
        </p>

        <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
          Constraints
        </h3>
        <ul className="mt-1 list-disc pl-5 text-xs text-slate-700 dark:text-gray-300">
          {c.constraints.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-gray-800/60">
            <b className="text-slate-900 dark:text-white">Input Format</b>
            <p className="muted mt-1">{c.inputFormat}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-gray-800/60">
            <b className="text-slate-900 dark:text-white">Output Format</b>
            <p className="muted mt-1">{c.outputFormat}</p>
          </div>
        </div>

        {c.examples.map((e, i) => (
          <div key={i} className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-gray-800/60">
            <b className="text-slate-900 dark:text-white">Example {i + 1}</b>
            <pre className="mt-1 overflow-x-auto font-mono text-[11px] text-slate-700 dark:text-gray-300">
              {`Input:\n${e.input}\n\nOutput:\n${e.output}`}
            </pre>
            {e.explanation && <p className="muted mt-1.5">{e.explanation}</p>}
          </div>
        ))}
      </Card>

      {/* Progressive Hints Card */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Progressive Hints</span>
          </h3>
          {hint < c.hints.length && (
            <Btn variant="ghost" size="sm" onClick={() => setHint(hint + 1)}>
              Reveal Hint {hint + 1} of {c.hints.length}
            </Btn>
          )}
        </div>
        {hint === 0 ? (
          <p className="muted mt-2 text-xs">
            Try drafting your approach first. Hints can be unlocked step-by-step if you get stuck.
          </p>
        ) : (
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-slate-700 dark:text-gray-300">
            {c.hints.slice(0, hint).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        )}
      </Card>

      {/* Code Editor Card */}
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <select
              className="input !h-9 !w-auto text-xs font-semibold"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              aria-label="Programming Language"
            >
              <option value="java">Java 17</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ 20</option>
              <option value="c">C 11</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Self-assessment:</span>
            <select
              className="input !h-9 !w-auto text-xs"
              value={self}
              onChange={(e) => setSelf(e.target.value)}
              aria-label="Self assessment"
            >
              <option value="attempted">I attempted it</option>
              <option value="solved">I solved it correctly</option>
              <option value="needs_revision">Needs more practice</option>
            </select>
          </div>
        </div>

        <textarea
          className="input min-h-[260px] font-mono text-xs leading-relaxed"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`// Write your ${label(lang)} solution here.\n// Your solution is saved to your personal history.`}
          aria-label="Code editor"
        />

        <div className="mt-2">
          <ErrorBox error={err} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Btn size="sm" onClick={save} disabled={!code.trim()}>
            Save Submission
          </Btn>
          <Btn size="sm" variant="ghost" onClick={reveal}>
            Show Reference Solution & Analysis
          </Btn>
        </div>
        {msg && <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400" role="status">{msg}</p>}
      </Card>

      {/* Revealed Solution & Analysis Card */}
      {rev && (
        <Card className="border-brand-500/30">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Reference Solution & Complexity Analysis
          </h3>
          <p className="pre-wrap mt-2 text-xs leading-relaxed text-slate-700 dark:text-gray-300">
            {rev.explanation}
          </p>
          <p className="mt-2 text-xs font-mono font-semibold text-brand-600 dark:text-brand-400">
            Time & Space Complexity: {rev.complexity}
          </p>

          <h4 className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500">
            Edge Cases Checked
          </h4>
          <ul className="mt-1 list-disc pl-5 text-xs text-slate-700 dark:text-gray-300">
            {rev.edgeCases.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>

          {['java', 'python'].map((l) => (
            <div key={l} className="mt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-400">
                {label(l)} Verified Solution
              </span>
              <pre className="mt-1.5 overflow-x-auto rounded-2xl bg-slate-950 p-4 font-mono text-xs text-slate-100 shadow-inner">
                {rev.referenceSolutions[l]}
              </pre>
            </div>
          ))}
        </Card>
      )}

      {/* Submission History */}
      {subs.data?.items.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
            Past Attempts ({subs.data.items.length})
          </h3>
          <ul className="divide-y divide-slate-100 text-xs dark:divide-gray-800">
            {subs.data.items.map((s) => (
              <li key={s._id} className="flex items-center justify-between py-2.5">
                <span className="text-slate-600 dark:text-gray-400">
                  {new Date(s.createdAt).toLocaleString()} · {label(s.language)}
                </span>
                <Badge tone={s.selfStatus === 'solved' ? 'green' : 'amber'}>
                  {label(s.selfStatus)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
