import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flag, ChevronLeft, ChevronRight, Grid3x3, X, Timer, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Btn, Spinner, ErrorBox, Badge, Card } from '../components/ui';
import ThemeToggle from '../components/ThemeToggle';
import { mmss, label } from '../lib/format';
import { remainingSeconds, paletteState, summarise } from '../lib/testState';

const PALETTE = {
  answered: 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-500/25',
  'marked-answered': 'bg-brand-500 text-white border-orange-500 ring-2 ring-orange-500',
  marked: 'bg-white text-slate-800 border-orange-500 ring-2 ring-orange-500 dark:bg-gray-800 dark:text-gray-100',
  visited: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900',
  fresh: 'bg-white text-slate-600 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
};

export default function TestRunner() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [showPalette, setShowPalette] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saveState, setSaveState] = useState('saved');
  const [submitting, setSubmitting] = useState(false);

  const offset = useRef(0);
  const dirty = useRef(new Set());
  const inflight = useRef(false);
  const timer = useRef(null);
  const qStart = useRef(Date.now());
  const answersRef = useRef({});
  const finished = useRef(false);
  answersRef.current = answers;

  const goResult = useCallback(() => {
    finished.current = true;
    nav(`/results/${id}`, { replace: true });
  }, [id, nav]);

  const applyPayload = useCallback((p) => {
    offset.current = new Date(p.serverNow).getTime() - Date.now();
    setData(p);
    setAnswers((prev) => ({
      ...p.answers,
      ...Object.fromEntries(Object.entries(prev).filter(([k]) => dirty.current.has(k))),
    }));
  }, []);

  const load = useCallback(async () => {
    try {
      const p = await api.get(`/attempts/${id}`);
      if (p.status && p.status !== 'in_progress') return goResult();
      applyPayload(p);
    } catch (e) {
      setError(e);
    }
  }, [id, applyPayload, goResult]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const questions = useMemo(
    () =>
      data
        ? data.sections.flatMap((s) =>
            s.questions.map((q) => ({
              ...q,
              sectionIndex: s.index,
              sectionName: s.name,
              locked: s.locked,
            }))
          )
        : [],
    [data]
  );
  const q = questions[idx];

  const flush = useCallback(async () => {
    if (inflight.current || dirty.current.size === 0) return;
    inflight.current = true;
    const ids = [...dirty.current];
    setSaveState('saving');
    try {
      const body = ids.map((k) => {
        const a = answersRef.current[k] || {};
        return {
          questionId: k,
          response: a.response === undefined ? null : a.response,
          markedForReview: !!a.markedForReview,
          timeSpentSec: Math.round(a.timeSpentSec || 0),
        };
      });
      await api.put(`/attempts/${id}/answers`, { answers: body });
      ids.forEach((k) => dirty.current.delete(k));
      setSaveState(dirty.current.size ? 'saving' : 'saved');
    } catch (e) {
      if (e.code === 'TIME_UP' || e.code === 'ALREADY_SUBMITTED') return goResult();
      setSaveState('error');
    } finally {
      inflight.current = false;
      if (dirty.current.size && !finished.current) {
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, 2500);
      }
    }
  }, [id, goResult]);

  const markDirty = useCallback(
    (qid) => {
      dirty.current.add(qid);
      setSaveState('saving');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 700);
    },
    [flush]
  );

  const patch = (qid, change) => setAnswers((a) => ({ ...a, [qid]: { ...a[qid], ...change } }));
  const leaveQuestion = useCallback(() => {
    if (!q) return;
    const secs = (Date.now() - qStart.current) / 1000;
    qStart.current = Date.now();
    setAnswers((a) => ({
      ...a,
      [q._id]: { ...a[q._id], visited: true, timeSpentSec: (a[q._id]?.timeSpentSec || 0) + secs },
    }));
    markDirty(q._id);
  }, [q, markDirty]);

  const go = (n) => {
    if (n < 0 || n >= questions.length || n === idx) return;
    leaveQuestion();
    setIdx(n);
    setShowPalette(false);
  };

  useEffect(() => {
    if (q && !answers[q._id]?.visited) {
      patch(q._id, { visited: true });
    }
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const setResp = (resp) => {
    if (!q || q.locked) return;
    patch(q._id, { response: resp });
    markDirty(q._id);
  };

  const choose = (i) => {
    const cur = answers[q._id]?.response || [];
    if (q.type === 'mcq_multi')
      setResp(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]);
    else setResp([i]);
  };

  const toggleMark = () => {
    patch(q._id, { markedForReview: !answers[q._id]?.markedForReview });
    markDirty(q._id);
  };

  const clear = () =>
    setResp(q.type === 'numeric' || q.type === 'sql' || q.type === 'coding' ? '' : []);

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    clearTimeout(timer.current);
    try {
      if (q) leaveQuestion();
      await new Promise((r) => setTimeout(r, 50));
      dirty.current.size && (await flush());
      await api.post(`/attempts/${id}/submit`);
      goResult();
    } catch (e) {
      setError(e);
      setSubmitting(false);
      setConfirm(false);
    }
  }, [submitting, q, leaveQuestion, flush, id, goResult]);

  const left = data ? remainingSeconds(data.deadline, offset.current, now) : 0;
  const secEnd =
    data && data.sectionTimed && data.currentSection !== null
      ? data.sectionDeadlines[data.currentSection]
      : null;
  const secLeft = secEnd ? remainingSeconds(secEnd, offset.current, now) : null;

  useEffect(() => {
    if (data && left === 0 && !finished.current) submit();
  }, [left, data]); // eslint-disable-line

  useEffect(() => {
    if (data && secLeft === 0 && left > 0) {
      const t = setTimeout(load, 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [secLeft]); // eslint-disable-line

  useEffect(() => {
    if (data && data.sections.length) setIdx((i) => Math.min(i, questions.length - 1));
  }, [data]); // eslint-disable-line

  useEffect(() => {
    const h = () => dirty.current.size && flush();
    window.addEventListener('visibilitychange', h);
    window.addEventListener('pagehide', h);
    return () => {
      window.removeEventListener('visibilitychange', h);
      window.removeEventListener('pagehide', h);
    };
  }, [flush]);

  const advance = async () => {
    try {
      leaveQuestion();
      await flush();
      const p = await api.post(`/attempts/${id}/advance-section`);
      applyPayload(p);
      const flat = p.sections.flatMap((sec) => sec.questions.map(() => sec.index));
      setIdx(Math.max(0, flat.findIndex((si) => si === p.currentSection)));
      qStart.current = Date.now();
    } catch (e) {
      setError(e);
    }
  };

  if (error && !data)
    return (
      <div className="mx-auto max-w-md p-6">
        <ErrorBox error={error} onRetry={load} />
      </div>
    );
  if (!data) return <Spinner label="Setting up your test environment…" />;

  const ans = q ? answers[q._id] || {} : {};
  const sum = summarise(
    questions.filter((x) => !x.locked),
    answers
  );
  const lowTime = left <= 300;

  const PaletteGrid = () => (
    <div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-5">
        {questions.map((x, i) => (
          <button
            key={x._id}
            type="button"
            onClick={() => go(i)}
            disabled={x.locked}
            aria-label={`Question ${i + 1}: ${paletteState(answers[x._id])}`}
            className={`grid h-9 place-items-center rounded-xl border text-xs font-bold transition disabled:opacity-30 ${
              PALETTE[paletteState(answers[x._id])]
            } ${i === idx ? 'outline outline-2 outline-offset-2 outline-brand-600' : ''}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-gray-800">
        <dt>Answered</dt>
        <dd className="text-right font-bold text-emerald-600 dark:text-emerald-400">{sum.answered}</dd>
        <dt>Not answered</dt>
        <dd className="text-right font-bold text-slate-600 dark:text-gray-400">{sum.unanswered}</dd>
        <dt>Marked for review</dt>
        <dd className="text-right font-bold text-amber-600 dark:text-amber-400">{sum.marked}</dd>
      </dl>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[#f0f6ff] dark:bg-[#101624]">
      {/* Top Distraction-Free Header */}
      <header className="safe-top sticky top-0 z-20 border-b border-[#e0edfb] bg-white/95 backdrop-blur-md px-4 py-2.5 dark:border-[#1e273a] dark:bg-[#131926]/95">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {data.test.title}
            </div>
            <div className="truncate text-xs text-slate-500 dark:text-gray-400">
              {q?.sectionName}
              {secLeft !== null ? ` · section remaining ${mmss(secLeft)}` : ''}
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-base font-bold tabular-nums shadow-sm ${
              lowTime
                ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200'
                : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100'
            }`}
            role="timer"
            aria-label="Time remaining"
            aria-live="off"
          >
            <Timer className="h-4 w-4" />
            {mmss(left)}
          </div>

          <ThemeToggle className="!min-h-[38px] !h-9 !w-9 !p-0 !rounded-xl" />

          <button
            type="button"
            className="btn btn-ghost !px-3 lg:hidden"
            onClick={() => setShowPalette(true)}
            aria-label="Open question palette"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>

          <Btn variant="accent" size="sm" onClick={() => setConfirm(true)}>
            Submit
          </Btn>
        </div>
      </header>

      {/* Main Exam Body */}
      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-6 p-4 md:py-6">
        <main className="min-w-0 flex-1 pb-24">
          {error && (
            <div className="mb-4">
              <ErrorBox error={error} />
            </div>
          )}

          {q ? (
            <Card className="shadow-md">
              <div className="mb-3 flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Q{idx + 1}</span>
                <Badge tone="blue">{label(q.topic)}</Badge>
                <span className="ml-auto font-medium text-slate-500">
                  +{q.marks}
                  {q.negativeMarks ? ` / −${q.negativeMarks}` : ''}
                </span>
              </div>

              {q.locked && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>This section has ended. Answers are locked.</span>
                </div>
              )}

              <p className="pre-wrap text-[15px] leading-relaxed text-slate-900 dark:text-gray-100">
                {q.type === 'coding' ? q.coding.statement : q.text}
              </p>

              {q.type === 'coding' && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-mono dark:bg-gray-800/80">
                  <b>Input:</b> {q.coding.inputFormat}
                  <br />
                  <b>Output:</b> {q.coding.outputFormat}
                </div>
              )}

              {q.type === 'sql' && (
                <div className="mt-3 space-y-2 text-xs">
                  {q.sql.tablesPreview.map((t) => (
                    <div key={t.name} className="rounded-lg bg-slate-50 p-2 dark:bg-gray-800">
                      <b>{t.name}</b> ({t.columns.join(', ')})
                    </div>
                  ))}
                </div>
              )}

              {(q.type === 'mcq_single' || q.type === 'mcq_multi') && (
                <div
                  className="mt-4 space-y-2.5"
                  role={q.type === 'mcq_multi' ? 'group' : 'radiogroup'}
                  aria-label="Options"
                >
                  {q.options.map((o, i) => {
                    const on = (ans.response || []).includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        role={q.type === 'mcq_multi' ? 'checkbox' : 'radio'}
                        aria-checked={on}
                        disabled={q.locked}
                        onClick={() => choose(i)}
                        className={`flex min-h-[50px] w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
                          on
                            ? 'border-brand-600 bg-brand-50/80 dark:border-brand-500 dark:bg-brand-950/40 text-brand-950 dark:text-brand-100 ring-1 ring-brand-600 font-medium'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span
                          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${
                            on
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 text-slate-500 dark:border-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="pre-wrap flex-1">{o}</span>
                      </button>
                    );
                  })}
                  {q.type === 'mcq_multi' && (
                    <p className="muted text-xs">Select all options that apply.</p>
                  )}
                </div>
              )}

              {q.type === 'numeric' && (
                <input
                  className="input mt-4 max-w-xs font-mono"
                  inputMode="decimal"
                  disabled={q.locked}
                  value={ans.response ?? ''}
                  onChange={(e) => setResp(e.target.value === '' ? '' : e.target.value)}
                  placeholder="Type your numeric answer"
                  aria-label="Numeric answer"
                />
              )}

              {(q.type === 'sql' || q.type === 'coding') && (
                <textarea
                  className="input mt-4 min-h-[200px] font-mono text-xs"
                  spellCheck={false}
                  disabled={q.locked}
                  value={ans.response || ''}
                  onChange={(e) => setResp(e.target.value)}
                  placeholder={
                    q.type === 'sql'
                      ? 'Write a SELECT query…'
                      : '// Your solution (practice mode, not auto-scored)'
                  }
                  aria-label="Answer editor"
                />
              )}
            </Card>
          ) : (
            <Card className="text-center muted">No questions available in this section.</Card>
          )}
        </main>

        {/* Desktop Palette Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="card sticky top-20">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Question Palette
            </h2>
            <PaletteGrid />
            <p
              className={`mt-4 text-xs font-medium ${
                saveState === 'error' ? 'text-rose-600' : 'text-slate-500'
              }`}
              role="status"
            >
              {saveState === 'saved'
                ? '✓ All answers saved'
                : saveState === 'saving'
                ? 'Saving…'
                : 'Could not save. Retrying…'}
            </p>
            {data.sectionTimed && (
              <Btn variant="ghost" size="sm" className="mt-3 w-full" onClick={advance}>
                End This Section
              </Btn>
            )}
          </div>
        </aside>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md dark:border-gray-800 dark:bg-[#111827]/95">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <Btn
            variant="ghost"
            size="sm"
            onClick={() => go(idx - 1)}
            disabled={idx === 0}
            aria-label="Previous question"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Prev</span>
          </Btn>

          <Btn
            variant="ghost"
            size="sm"
            onClick={toggleMark}
            disabled={!q || q.locked}
            aria-pressed={!!ans.markedForReview}
          >
            <Flag
              className={`h-4 w-4 ${
                ans.markedForReview ? 'fill-amber-500 text-amber-500' : ''
              }`}
            />
            <span className="hidden sm:inline">
              {ans.markedForReview ? 'Unmark' : 'Mark for Review'}
            </span>
          </Btn>

          <Btn
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={!q || q.locked}
            className="hidden sm:inline-flex"
          >
            Clear Response
          </Btn>

          <span
            className={`ml-auto text-xs font-medium lg:hidden ${
              saveState === 'error' ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Retrying…'}
          </span>

          <Btn
            size="sm"
            onClick={() => go(idx + 1)}
            disabled={idx >= questions.length - 1}
            aria-label="Next question"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Btn>
        </div>
      </footer>

      {/* Mobile Question Palette Modal Drawer */}
      {showPalette && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Question palette"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
          <div className="safe-top fixed inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl dark:bg-[#111827]">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-gray-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Question Palette
              </span>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-gray-800"
                onClick={() => setShowPalette(false)}
                aria-label="Close palette"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <PaletteGrid />
            {data.sectionTimed && (
              <Btn
                variant="ghost"
                className="mt-4 w-full"
                onClick={() => {
                  setShowPalette(false);
                  advance();
                }}
              >
                End This Section
              </Btn>
            )}
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="sc"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => !submitting && setConfirm(false)}
          />
          <div className="card relative w-full max-w-sm shadow-2xl">
            <h2 id="sc" className="text-lg font-bold text-slate-900 dark:text-white">
              Submit test?
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-gray-300">
              You have answered <b>{sum.answered}</b> of <b>{sum.total}</b> questions
              {sum.marked ? `, with ${sum.marked} marked for review` : ''}. Once submitted,
              you cannot change your answers.
            </p>
            <div className="mt-5 flex gap-2.5">
              <Btn
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => setConfirm(false)}
                disabled={submitting}
              >
                Keep working
              </Btn>
              <Btn
                size="sm"
                className="flex-1"
                onClick={submit}
                disabled={submitting}
              >
                {submitting ? 'Submitting…' : 'Submit'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
