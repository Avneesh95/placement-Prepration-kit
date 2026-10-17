import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, ListChecks, PlayCircle, Timer, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { Card, Badge, Btn, Spinner, ErrorBox, PageTitle, Disclaimer, Empty } from '../components/ui';
import { label, pct } from '../lib/format';

const CATS = [
  ['', 'All Tests'],
  ['company_full', 'Company Full-Length'],
  ['company_sectional', 'Sectionals'],
  ['general', 'General TCS/Aptitude'],
  ['quant', 'Quantitative'],
  ['reasoning', 'Reasoning'],
  ['english', 'Verbal / English'],
  ['technical', 'Technical / CS'],
  ['coding', 'Coding Tests'],
];

export function MockList() {
  const [cat, setCat] = useState('');
  const { data, loading, error, reload } = useGet(`/mocks${cat ? `?category=${cat}` : ''}`);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Timed Mock Tests"
        sub="Full-length company patterns and sectional speed tests with server-backed timers and detailed analytics."
      />

      {/* Category Pills */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2 pb-2">
          {CATS.map(([k, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => setCat(k)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                cat === k
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800'
              } border border-slate-200/80 dark:border-gray-700/80`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading mock tests…" />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <Empty title="No mock tests in this category">Try selecting All Tests above.</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((m) => (
            <Link key={m.slug} to={`/mocks/${m.slug}`}>
              <Card hover className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
                      {m.title}
                    </h2>
                    {m.inProgress ? (
                      <Badge tone="orange">In Progress</Badge>
                    ) : m.category.startsWith('company') ? (
                      <Badge tone="amber">Template</Badge>
                    ) : null}
                  </div>
                  <p className="muted mt-2 text-xs line-clamp-2 leading-relaxed">{m.description}</p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 dark:border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {m.totalDurationMin} min
                    </span>
                    <span className="flex items-center gap-1">
                      <ListChecks className="h-3.5 w-3.5 text-slate-400" />
                      {m.questionCount} Qs
                    </span>
                    {m.attempts > 0 && (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Best: {pct(m.bestPercentage)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function MockIntro() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { data, loading, error, reload } = useGet(`/mocks/${slug}`);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner label="Loading mock exam details…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const t = data.test;

  const start = async () => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post(`/mocks/${slug}/start`);
      nav(`/attempt/${r.attemptId}`);
    } catch (e) {
      setErr(e);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageTitle breadcrumb="Mock Exam Overview" title={t.title} sub={t.description} />

      {t.patternStatus === 'preparation_template' && t.category.startsWith('company') && (
        <Disclaimer>
          This is a <b>preparation template</b> based on past patterns. Question counts, time limits, and negative marking are practice benchmarks.
        </Disclaimer>
      )}

      {/* 3 Metric counters */}
      <Card>
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-gray-800 text-center">
          <div className="px-2">
            <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
              {t.totalDurationMin}
            </div>
            <div className="muted mt-0.5 text-xs">Total Minutes</div>
          </div>
          <div className="px-2">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t.questionCount}
            </div>
            <div className="muted mt-0.5 text-xs">Questions</div>
          </div>
          <div className="px-2">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t.scoring.override ? `−${t.scoring.defaultNegative}` : '0'}
            </div>
            <div className="muted mt-0.5 text-xs">Negative / Wrong</div>
          </div>
        </div>
      </Card>

      {/* Sections breakdown */}
      <Card>
        <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Section Breakdown</h2>
        <ul className="divide-y divide-slate-100 text-xs dark:divide-gray-800">
          {t.sections.map((s) => (
            <li key={s.name} className="flex items-center justify-between py-2.5">
              <span className="font-semibold text-slate-800 dark:text-gray-200">{s.name}</span>
              <span className="text-slate-500 dark:text-gray-400">
                {s.questionCount} Qs {t.sectionTimed ? `· ${s.durationMin} min` : ''}
              </span>
            </li>
          ))}
        </ul>
        {t.sectionTimed && (
          <p className="muted mt-3 text-xs">
            Sections are sequentially timed. Once time expires or you advance, previous sections are locked.
          </p>
        )}
      </Card>

      {/* Instructions */}
      <Card>
        <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Important Instructions</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-xs text-slate-700 dark:text-gray-300">
          {t.instructions.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        {t.scoring.note && <p className="muted mt-2 text-xs">{t.scoring.note}</p>}
      </Card>

      <ErrorBox error={err} />

      <Btn size="lg" className="w-full text-base" onClick={start} disabled={busy}>
        <PlayCircle className="h-5 w-5" />
        <span>{data.inProgress ? 'Resume In-Progress Test' : 'Start Mock Test Now'}</span>
      </Btn>
    </div>
  );
}
