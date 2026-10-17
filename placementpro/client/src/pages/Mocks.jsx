import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Clock, ListChecks, PlayCircle } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { Card, Badge, Btn, Spinner, ErrorBox, PageTitle, Disclaimer } from '../components/ui';
import { label, pct } from '../lib/format';
const CATS = [['', 'All'], ['company_full', 'Company full-length'], ['company_sectional', 'Sectional'], ['general', 'General'], ['quant', 'Quant'], ['reasoning', 'Reasoning'], ['english', 'English'], ['numerical', 'Numerical'], ['technical', 'Technical'], ['cs', 'CS'], ['sql', 'SQL'], ['coding', 'Coding']];
export function MockList() {
  const [cat, setCat] = useState(''); const { data, loading, error, reload } = useGet(`/mocks${cat ? `?category=${cat}` : ''}`);
  return (
    <div>
      <PageTitle title="Mock Tests" sub="Server-timed tests with section rules and full analysis." />
      <div className="-mx-4 mb-4 overflow-x-auto px-4"><div className="flex gap-2">{CATS.map(([k, n]) => <button key={k} onClick={() => setCat(k)} className={`whitespace-nowrap rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-800 ${cat === k ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>{n}</button>)}</div></div>
      {loading ? <Spinner /> : error ? <ErrorBox error={error} onRetry={reload} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.items.map((m) => (
          <Link key={m.slug} to={`/mocks/${m.slug}`}><Card className="h-full hover:border-brand-500">
            <div className="flex items-start justify-between gap-2"><h2 className="font-semibold leading-snug">{m.title}</h2>{m.inProgress && <Badge tone="orange">In progress</Badge>}</div>
            <p className="muted mt-1 line-clamp-2">{m.description}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.totalDurationMin} min</span><span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{m.questionCount} questions</span>{m.attempts > 0 && <span>Best {pct(m.bestPercentage)}</span>}</div>
            {m.category.startsWith('company') && <div className="mt-2"><Badge tone="amber">Template</Badge></div>}</Card></Link>))}</div>)}
    </div>
  );
}
export function MockIntro() {
  const { slug } = useParams(); const nav = useNavigate(); const { data, loading, error, reload } = useGet(`/mocks/${slug}`); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  if (loading) return <Spinner />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  const t = data.test;
  const start = async () => { setBusy(true); setErr(null); try { const r = await api.post(`/mocks/${slug}/start`); nav(`/attempt/${r.attemptId}`); } catch (e) { setErr(e); setBusy(false); } };
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageTitle title={t.title} sub={t.description} />
      {t.patternStatus === 'preparation_template' && t.category.startsWith('company') && <Disclaimer>This is a <b>preparation template</b>, not a confirmed exam pattern. Section counts, timing and marking are practice settings.</Disclaimer>}
      <Card><div className="grid grid-cols-3 gap-3 text-center"><div><div className="text-2xl font-bold">{t.totalDurationMin}</div><div className="muted">minutes</div></div><div><div className="text-2xl font-bold">{t.questionCount}</div><div className="muted">questions</div></div><div><div className="text-2xl font-bold">{t.scoring.override ? `−${t.scoring.defaultNegative}` : '0'}</div><div className="muted">negative / wrong</div></div></div></Card>
      <Card><h2 className="mb-2 font-semibold">Sections</h2><ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">{t.sections.map((s) => <li key={s.name} className="flex justify-between py-2"><span>{s.name}</span><span className="muted">{s.questionCount} questions{t.sectionTimed ? ` · ${s.durationMin} min` : ''}</span></li>)}</ul>
        {t.sectionTimed && <p className="muted mt-2">Sections are timed one after another. Once a section ends you cannot go back to it.</p>}
        {t.sections.some((s) => s.subject === 'coding') && <p className="muted mt-2">Coding questions are not auto-scored. Reference solutions appear after submission.</p>}</Card>
      <Card><h2 className="mb-2 font-semibold">Instructions</h2><ul className="list-disc space-y-1 pl-5 text-sm">{t.instructions.map((i) => <li key={i}>{i}</li>)}</ul>{t.scoring.note && <p className="muted mt-2">{t.scoring.note}</p>}</Card>
      <ErrorBox error={err} />
      <Btn className="w-full" onClick={start} disabled={busy}><PlayCircle className="h-4 w-4" />{data.inProgress ? 'Resume test' : 'Start test'}</Btn>
    </div>
  );
}
