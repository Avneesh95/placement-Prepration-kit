import { useState, useRef } from 'react';
import { Bookmark, BookmarkCheck, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Badge, Btn, ErrorBox } from './ui';
import { PROVENANCE, label } from '../lib/format';

export default function QuestionCard({ q, onAnswered }) {
  const multi = q.type === 'mcq_multi'; const numeric = q.type === 'numeric';
  const [sel, setSel] = useState([]); const [num, setNum] = useState(''); const [res, setRes] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  const [bm, setBm] = useState(q.userState?.bookmarked); const started = useRef(Date.now());
  const toggle = (i) => { if (res) return; setSel(multi ? (sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]) : [i]); };
  const submit = async () => {
    setErr(null); setBusy(true);
    try { const r = await api.post(`/questions/${q._id}/answer`, { response: numeric ? Number(num) : sel, timeSpentSec: Math.round((Date.now() - started.current) / 1000) }); setRes(r); onAnswered && onAnswered(r); }
    catch (e) { setErr(e); } finally { setBusy(false); }
  };
  const flip = async () => { try { if (bm) await api.del(`/bookmarks/${q._id}`); else await api.post(`/bookmarks/${q._id}`); setBm(!bm); } catch (e) { setErr(e); } };
  const prov = PROVENANCE[q.provenance] || PROVENANCE.practice;
  const ready = numeric ? num !== '' && !Number.isNaN(Number(num)) : sel.length > 0;
  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Badge tone="blue">{label(q.topic)}</Badge><Badge tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'green'}>{q.difficulty}</Badge>
        <Badge tone={prov.tone}>{prov.text}</Badge>
        {q.userState?.solved && <Badge tone="green">Solved before</Badge>}
        <button className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={flip} aria-label={bm ? 'Remove bookmark' : 'Bookmark question'} aria-pressed={!!bm}>{bm ? <BookmarkCheck className="h-5 w-5 text-accent-500" /> : <Bookmark className="h-5 w-5" />}</button>
      </div>
      <p className="pre-wrap text-[15px] leading-relaxed">{q.text}</p>
      {numeric ? <input className="input mt-3 max-w-xs" inputMode="decimal" value={num} onChange={(e) => !res && setNum(e.target.value)} placeholder="Your answer" aria-label="Numeric answer" />
        : <div className="mt-3 space-y-2" role={multi ? 'group' : 'radiogroup'}>{q.options.map((o, i) => {
          const correct = res && res.correctOptions?.includes(i); const wrong = res && sel.includes(i) && !correct;
          return <button key={i} role={multi ? 'checkbox' : 'radio'} aria-checked={sel.includes(i)} onClick={() => toggle(i)} className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' : wrong ? 'border-red-500 bg-red-50 dark:bg-red-950' : sel.includes(i) ? 'border-brand-500 bg-brand-50 dark:bg-brand-700/20' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold">{String.fromCharCode(65 + i)}</span><span className="pre-wrap">{o}</span></button>; })}</div>}
      <div className="mt-3"><ErrorBox error={err} /></div>
      {!res && <Btn className="mt-3" onClick={submit} disabled={!ready || busy}>{busy ? 'Checking…' : 'Check answer'}</Btn>}
      {res && <div className={`mt-3 rounded-xl p-3 text-sm ${res.correct ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'}`} role="status">
        <div className="flex items-center gap-2 font-semibold">{res.correct ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" />Correct</> : <><XCircle className="h-4 w-4 text-red-600" />Not quite{numeric ? ` — answer: ${res.numericAnswer}` : ''}</>}</div>
        <p className="pre-wrap mt-1">{res.explanation}</p>
        {res.verificationStatus !== 'verified' && <p className="muted mt-1">Source: {res.sourceTitle || 'Original practice question'}.</p>}</div>}
    </Card>
  );
}
