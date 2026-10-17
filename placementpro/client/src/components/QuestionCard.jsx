import { useState, useRef } from 'react';
import { Bookmark, BookmarkCheck, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Card, Badge, Btn, ErrorBox } from './ui';
import { PROVENANCE, label } from '../lib/format';

export default function QuestionCard({ q, onAnswered }) {
  const multi = q.type === 'mcq_multi';
  const numeric = q.type === 'numeric';
  const [sel, setSel] = useState([]);
  const [num, setNum] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bm, setBm] = useState(q.userState?.bookmarked);
  const started = useRef(Date.now());

  const toggle = (i) => {
    if (res) return;
    setSel(multi ? (sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]) : [i]);
  };

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const r = await api.post(`/questions/${q._id}/answer`, {
        response: numeric ? Number(num) : sel,
        timeSpentSec: Math.round((Date.now() - started.current) / 1000),
      });
      setRes(r);
      onAnswered && onAnswered(r);
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  };

  const flip = async () => {
    try {
      if (bm) await api.del(`/bookmarks/${q._id}`);
      else await api.post(`/bookmarks/${q._id}`);
      setBm(!bm);
    } catch (e) {
      setErr(e);
    }
  };

  const prov = PROVENANCE[q.provenance] || PROVENANCE.practice;
  const ready = numeric ? num !== '' && !Number.isNaN(Number(num)) : sel.length > 0;

  return (
    <Card className="transition-all hover:border-slate-300 dark:hover:border-gray-700">
      {/* Top Metadata Badges */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="blue">{label(q.topic)}</Badge>
        <Badge
          tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'green'}
        >
          {q.difficulty}
        </Badge>
        <Badge tone={prov.tone}>{prov.text}</Badge>
        {q.userState?.solved && <Badge tone="green">Solved before</Badge>}

        <button
          type="button"
          className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          onClick={flip}
          aria-label={bm ? 'Remove bookmark' : 'Bookmark question'}
          aria-pressed={!!bm}
          title={bm ? 'Remove bookmark' : 'Bookmark question'}
        >
          {bm ? (
            <BookmarkCheck className="h-5 w-5 text-amber-500 fill-amber-500" />
          ) : (
            <Bookmark className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Question Text */}
      <p className="pre-wrap text-[15px] leading-relaxed text-slate-900 dark:text-gray-100">
        {q.text}
      </p>

      {/* Answer Inputs: Numeric or MCQ */}
      {numeric ? (
        <div className="mt-4">
          <input
            className="input max-w-xs font-mono"
            inputMode="decimal"
            value={num}
            onChange={(e) => !res && setNum(e.target.value)}
            placeholder="Type numeric answer"
            aria-label="Numeric answer"
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5" role={multi ? 'group' : 'radiogroup'}>
          {q.options.map((o, i) => {
            const isCorrect = res && res.correctOptions?.includes(i);
            const isWrong = res && sel.includes(i) && !isCorrect;
            const isChosen = sel.includes(i);

            let btnStyle =
              'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 dark:border-gray-800 dark:bg-gray-900/60 dark:hover:bg-gray-800 text-slate-800 dark:text-gray-200';
            let circleStyle =
              'border-slate-300 text-slate-500 dark:border-gray-700 dark:text-gray-400';

            if (isCorrect) {
              btnStyle =
                'border-emerald-500 bg-emerald-50/80 dark:border-emerald-600 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500 font-medium';
              circleStyle = 'border-emerald-600 bg-emerald-600 text-white';
            } else if (isWrong) {
              btnStyle =
                'border-rose-500 bg-rose-50/80 dark:border-rose-600 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500';
              circleStyle = 'border-rose-600 bg-rose-600 text-white';
            } else if (isChosen) {
              btnStyle =
                'border-brand-600 bg-brand-50/80 dark:border-brand-500 dark:bg-brand-950/50 text-brand-950 dark:text-brand-100 ring-1 ring-brand-600 font-medium';
              circleStyle = 'border-brand-600 bg-brand-600 text-white';
            }

            return (
              <button
                key={i}
                type="button"
                role={multi ? 'checkbox' : 'radio'}
                aria-checked={isChosen}
                onClick={() => toggle(i)}
                className={`flex min-h-[50px] w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${btnStyle}`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-bold transition ${circleStyle}`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="pre-wrap flex-1">{o}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Error Output */}
      <div className="mt-3">
        <ErrorBox error={err} />
      </div>

      {/* Action Buttons */}
      {!res && (
        <div className="mt-4">
          <Btn onClick={submit} disabled={!ready || busy}>
            {busy ? 'Verifying answer…' : 'Check answer'}
          </Btn>
        </div>
      )}

      {/* Verification / Result Panel */}
      {res && (
        <div
          className={`mt-4 rounded-2xl border p-4 text-sm ${
            res.correct
              ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100'
              : 'border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2 font-bold">
            {res.correct ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span>Correct! Well done.</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <span>
                  Not quite{numeric ? ` — Correct answer: ${res.numericAnswer}` : ''}
                </span>
              </>
            )}
          </div>
          <p className="pre-wrap mt-2 text-xs leading-relaxed text-slate-700 dark:text-gray-300">
            {res.explanation}
          </p>
          {res.verificationStatus !== 'verified' && (
            <p className="mt-2 text-[11px] text-slate-500 dark:text-gray-400">
              Source: {res.sourceTitle || 'Original practice question'}.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
