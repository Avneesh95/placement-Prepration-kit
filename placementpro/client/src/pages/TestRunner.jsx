import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Flag, ChevronLeft, ChevronRight, Grid3x3, X, Timer, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { Btn, Spinner, ErrorBox, Badge } from '../components/ui';
import ThemeToggle from '../components/ThemeToggle';
import { mmss, label } from '../lib/format';
import { remainingSeconds, paletteState, summarise } from '../lib/testState';

const PALETTE = { answered: 'bg-brand-600 text-white border-brand-600', 'marked-answered': 'bg-brand-600 text-white border-accent-500 ring-2 ring-accent-500', marked: 'bg-white text-slate-800 border-accent-500 ring-2 ring-accent-500 dark:bg-slate-900 dark:text-slate-100', visited: 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-200', fresh: 'bg-white text-slate-600 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700' };

export default function TestRunner() {
  const { id } = useParams(); const nav = useNavigate();
  const [data, setData] = useState(null); const [error, setError] = useState(null); const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0); const [now, setNow] = useState(Date.now()); const [showPalette, setShowPalette] = useState(false); const [confirm, setConfirm] = useState(false);
  const [saveState, setSaveState] = useState('saved'); const [submitting, setSubmitting] = useState(false);
  const offset = useRef(0); const dirty = useRef(new Set()); const inflight = useRef(false); const timer = useRef(null); const qStart = useRef(Date.now()); const answersRef = useRef({}); const finished = useRef(false);
  answersRef.current = answers;

  const goResult = useCallback(() => { finished.current = true; nav(`/results/${id}`, { replace: true }); }, [id, nav]);
  const applyPayload = useCallback((p) => {
    offset.current = new Date(p.serverNow).getTime() - Date.now();
    setData(p); setAnswers((prev) => ({ ...p.answers, ...Object.fromEntries(Object.entries(prev).filter(([k]) => dirty.current.has(k))) }));
  }, []);
  const load = useCallback(async () => {
    try { const p = await api.get(`/attempts/${id}`); if (p.status && p.status !== 'in_progress') return goResult(); applyPayload(p); } catch (e) { setError(e); }
  }, [id, applyPayload, goResult]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const questions = useMemo(() => (data ? data.sections.flatMap((s) => s.questions.map((q) => ({ ...q, sectionIndex: s.index, sectionName: s.name, locked: s.locked }))) : []), [data]);
  const q = questions[idx];

  const flush = useCallback(async () => {
    if (inflight.current || dirty.current.size === 0) return;
    inflight.current = true; const ids = [...dirty.current]; setSaveState('saving');
    try {
      const body = ids.map((k) => { const a = answersRef.current[k] || {}; return { questionId: k, response: a.response === undefined ? null : a.response, markedForReview: !!a.markedForReview, timeSpentSec: Math.round(a.timeSpentSec || 0) }; });
      await api.put(`/attempts/${id}/answers`, { answers: body }); ids.forEach((k) => dirty.current.delete(k)); setSaveState(dirty.current.size ? 'saving' : 'saved');
    } catch (e) {
      if (e.code === 'TIME_UP' || e.code === 'ALREADY_SUBMITTED') return goResult();
      setSaveState('error');
    } finally { inflight.current = false; if (dirty.current.size && !finished.current) { clearTimeout(timer.current); timer.current = setTimeout(flush, 2500); } }
  }, [id, goResult]);
  const markDirty = useCallback((qid) => { dirty.current.add(qid); setSaveState('saving'); clearTimeout(timer.current); timer.current = setTimeout(flush, 700); }, [flush]);

  const patch = (qid, change) => setAnswers((a) => ({ ...a, [qid]: { ...a[qid], ...change } }));
  const leaveQuestion = useCallback(() => { // add elapsed time to the question being left
    if (!q) return; const secs = (Date.now() - qStart.current) / 1000; qStart.current = Date.now();
    setAnswers((a) => ({ ...a, [q._id]: { ...a[q._id], visited: true, timeSpentSec: (a[q._id]?.timeSpentSec || 0) + secs } })); markDirty(q._id);
  }, [q, markDirty]);
  const go = (n) => { if (n < 0 || n >= questions.length || n === idx) return; leaveQuestion(); setIdx(n); setShowPalette(false); };
  useEffect(() => { if (q && !answers[q._id]?.visited) { patch(q._id, { visited: true }); } }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const setResp = (resp) => { if (!q || q.locked) return; patch(q._id, { response: resp }); markDirty(q._id); };
  const choose = (i) => { const cur = answers[q._id]?.response || []; if (q.type === 'mcq_multi') setResp(cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]); else setResp([i]); };
  const toggleMark = () => { patch(q._id, { markedForReview: !answers[q._id]?.markedForReview }); markDirty(q._id); };
  const clear = () => setResp(q.type === 'numeric' || q.type === 'sql' || q.type === 'coding' ? '' : []);

  const submit = useCallback(async () => {
    if (submitting) return; setSubmitting(true); clearTimeout(timer.current);
    try { if (q) leaveQuestion(); await new Promise((r) => setTimeout(r, 50)); dirty.current.size && (await flush()); await api.post(`/attempts/${id}/submit`); goResult(); }
    catch (e) { setError(e); setSubmitting(false); setConfirm(false); }
  }, [submitting, q, leaveQuestion, flush, id, goResult]);

  const left = data ? remainingSeconds(data.deadline, offset.current, now) : 0;
  const secEnd = data && data.sectionTimed && data.currentSection !== null ? data.sectionDeadlines[data.currentSection] : null;
  const secLeft = secEnd ? remainingSeconds(secEnd, offset.current, now) : null;
  useEffect(() => { if (data && left === 0 && !finished.current) submit(); }, [left, data]); // eslint-disable-line
  useEffect(() => { if (data && secLeft === 0 && left > 0) { const t = setTimeout(load, 1200); return () => clearTimeout(t); } return undefined; }, [secLeft]); // eslint-disable-line
  useEffect(() => { if (data && data.sections.length) setIdx((i) => Math.min(i, questions.length - 1)); }, [data]); // eslint-disable-line
  useEffect(() => { const h = () => dirty.current.size && flush(); window.addEventListener('visibilitychange', h); window.addEventListener('pagehide', h); return () => { window.removeEventListener('visibilitychange', h); window.removeEventListener('pagehide', h); }; }, [flush]);

  const advance = async () => { try { leaveQuestion(); await flush(); const p = await api.post(`/attempts/${id}/advance-section`); applyPayload(p); const flat = p.sections.flatMap((sec) => sec.questions.map(() => sec.index)); setIdx(Math.max(0, flat.findIndex((si) => si === p.currentSection))); qStart.current = Date.now(); } catch (e) { setError(e); } };

  if (error && !data) return <div className="mx-auto max-w-md p-6"><ErrorBox error={error} onRetry={load} /></div>;
  if (!data) return <Spinner label="Loading your test…" />;
  const ans = q ? answers[q._id] || {} : {}; const sum = summarise(questions.filter((x) => !x.locked), answers);
  const lowTime = left <= 300;
  const PaletteGrid = () => (
    <div><div className="grid grid-cols-6 gap-2 sm:grid-cols-5">{questions.map((x, i) => <button key={x._id} onClick={() => go(i)} disabled={x.locked} aria-label={`Question ${i + 1}: ${paletteState(answers[x._id])}`} className={`grid h-10 place-items-center rounded-lg border text-sm font-semibold disabled:opacity-40 ${PALETTE[paletteState(answers[x._id])]} ${i === idx ? 'outline outline-2 outline-offset-2 outline-brand-500' : ''}`}>{i + 1}</button>)}</div>
      <dl className="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-500"><dt>Answered</dt><dd className="text-right font-semibold">{sum.answered}</dd><dt>Not answered</dt><dd className="text-right font-semibold">{sum.unanswered}</dd><dt>Marked for review</dt><dd className="text-right font-semibold">{sum.marked}</dd></dl></div>
  );
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="safe-top sticky top-0 z-20 border-b border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{data.test.title}</div><div className="truncate text-xs text-slate-500">{q?.sectionName}{secLeft !== null ? ` · section ${mmss(secLeft)}` : ''}</div></div>
          <div className={`flex items-center gap-1 rounded-xl px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${lowTime ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-200' : 'bg-slate-100 dark:bg-slate-800'}`} role="timer" aria-label="Time remaining" aria-live="off"><Timer className="h-4 w-4" />{mmss(left)}</div>
          <ThemeToggle />
          <button className="btn btn-ghost !px-3 lg:hidden" onClick={() => setShowPalette(true)} aria-label="Open question palette"><Grid3x3 className="h-4 w-4" /></button>
          <Btn variant="accent" onClick={() => setConfirm(true)}>Submit</Btn>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-4 p-3">
        <main className="min-w-0 flex-1 pb-24">
          {error && <div className="mb-3"><ErrorBox error={error} /></div>}
          {q ? (<div className="card">
            <div className="mb-2 flex items-center gap-2 text-xs"><b>Q{idx + 1}</b><Badge tone="blue">{label(q.topic)}</Badge><span className="ml-auto text-slate-500">+{q.marks}{q.negativeMarks ? ` / −${q.negativeMarks}` : ''}</span></div>
            {q.locked && <div className="mb-2 flex items-center gap-2 rounded-xl bg-amber-50 p-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100"><AlertTriangle className="h-4 w-4" />This section has ended. Answers are locked.</div>}
            <p className="pre-wrap text-[15px] leading-relaxed">{q.type === 'coding' ? q.coding.statement : q.text}</p>
            {q.type === 'coding' && <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800"><b>Input:</b> {q.coding.inputFormat}<br /><b>Output:</b> {q.coding.outputFormat}</div>}
            {q.type === 'sql' && <div className="mt-2 space-y-2 text-xs">{q.sql.tablesPreview.map((t) => <div key={t.name}><b>{t.name}</b> ({t.columns.join(', ')})</div>)}</div>}
            {(q.type === 'mcq_single' || q.type === 'mcq_multi') && <div className="mt-3 space-y-2" role={q.type === 'mcq_multi' ? 'group' : 'radiogroup'} aria-label="Options">{q.options.map((o, i) => { const on = (ans.response || []).includes(i); return (
              <button key={i} role={q.type === 'mcq_multi' ? 'checkbox' : 'radio'} aria-checked={on} disabled={q.locked} onClick={() => choose(i)} className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm ${on ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/20' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold ${on ? 'border-brand-600 bg-brand-600 text-white' : ''}`}>{String.fromCharCode(65 + i)}</span><span className="pre-wrap">{o}</span></button>); })}
              {q.type === 'mcq_multi' && <p className="muted">Select all that apply.</p>}</div>}
            {q.type === 'numeric' && <input className="input mt-3 max-w-xs" inputMode="decimal" disabled={q.locked} value={ans.response ?? ''} onChange={(e) => setResp(e.target.value === '' ? '' : e.target.value)} placeholder="Type your answer" aria-label="Numeric answer" />}
            {(q.type === 'sql' || q.type === 'coding') && <textarea className="input mt-3 min-h-[200px] font-mono text-xs" spellCheck={false} disabled={q.locked} value={ans.response || ''} onChange={(e) => setResp(e.target.value)} placeholder={q.type === 'sql' ? 'Write a SELECT query…' : '// Your solution (not auto-scored)'} aria-label="Answer editor" />}
          </div>) : <div className="card text-center muted">No questions available in this section.</div>}
        </main>
        <aside className="hidden w-64 shrink-0 lg:block"><div className="card sticky top-20"><h2 className="mb-3 text-sm font-semibold">Question palette</h2><PaletteGrid />
          <p className={`mt-3 text-xs ${saveState === 'error' ? 'text-red-600' : 'text-slate-500'}`} role="status">{saveState === 'saved' ? 'All answers saved' : saveState === 'saving' ? 'Saving…' : 'Could not save. Retrying…'}</p>
          {data.sectionTimed && <Btn variant="ghost" className="mt-3 w-full" onClick={advance}>End this section</Btn>}</div></aside>
      </div>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2">
          <Btn variant="ghost" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous question"><ChevronLeft className="h-4 w-4" />Prev</Btn>
          <Btn variant="ghost" onClick={toggleMark} disabled={!q || q.locked} aria-pressed={!!ans.markedForReview}><Flag className={`h-4 w-4 ${ans.markedForReview ? 'fill-accent-500 text-accent-500' : ''}`} /><span className="hidden sm:inline">{ans.markedForReview ? 'Unmark' : 'Mark for review'}</span></Btn>
          <Btn variant="ghost" onClick={clear} disabled={!q || q.locked} className="hidden sm:inline-flex">Clear</Btn>
          <span className={`ml-auto text-xs lg:hidden ${saveState === 'error' ? 'text-red-600' : 'text-slate-500'}`}>{saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Retrying…'}</span>
          <Btn onClick={() => go(idx + 1)} disabled={idx >= questions.length - 1} aria-label="Next question">Next<ChevronRight className="h-4 w-4" /></Btn>
        </div>
      </footer>
      {showPalette && <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Question palette"><div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowPalette(false)} />
        <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-slate-900"><div className="mb-3 flex items-center justify-between"><b>Question palette</b><button onClick={() => setShowPalette(false)} aria-label="Close palette"><X className="h-5 w-5" /></button></div><PaletteGrid />
          {data.sectionTimed && <Btn variant="ghost" className="mt-3 w-full" onClick={() => { setShowPalette(false); advance(); }}>End this section</Btn>}</div></div>}
      {confirm && <div className="fixed inset-0 z-50 grid place-items-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="sc"><div className="absolute inset-0 bg-slate-900/60" onClick={() => !submitting && setConfirm(false)} />
        <div className="card relative w-full max-w-sm"><h2 id="sc" className="text-lg font-bold">Submit test?</h2>
          <p className="mt-2 text-sm">You have answered <b>{sum.answered}</b> of <b>{sum.total}</b> questions{sum.marked ? `, with ${sum.marked} marked for review` : ''}. You cannot change answers after submitting.</p>
          <div className="mt-4 flex gap-2"><Btn variant="ghost" className="flex-1" onClick={() => setConfirm(false)} disabled={submitting}>Keep working</Btn><Btn className="flex-1" onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</Btn></div></div></div>}
    </div>
  );
}
