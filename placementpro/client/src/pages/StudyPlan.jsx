import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, RefreshCw } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { Card, Badge, Btn, Progress, Spinner, ErrorBox, PageTitle, Field } from '../components/ui';
import { label } from '../lib/format';

const taskLink = (t) => t.kind === 'mock' ? (t.topic && t.topic !== 'general' ? `/mocks/${t.topic}-full-1` : '/mocks/general-placement-1') : t.kind === 'review' ? '/practice?status=incorrect' : t.subject === 'coding' ? `/coding?topic=${t.topic}` : t.subject === 'sql' ? '/sql' : `/practice?subject=${t.subject}&topic=${t.topic}`;
export default function StudyPlan() {
  const { data, loading, error, reload } = useGet('/plan'); const companies = useGet('/companies');
  const [form, setForm] = useState({ durationDays: 30, dailyHours: 3, proficiency: 'intermediate', language: 'java', targetCompanies: [], examDate: '' }); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false); const [view, setView] = useState(null); const [week, setWeek] = useState(1); const [edit, setEdit] = useState(false);
  const cur = view || data;
  if (loading) return <Spinner />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  const create = async (e) => { e.preventDefault(); setErr(null); setBusy(true); try { setView(await api.post('/plan', { ...form, durationDays: Number(form.durationDays), examDate: form.examDate || undefined })); setEdit(false); } catch (x) { setErr(x); } finally { setBusy(false); } };
  const toggle = async (t) => { try { setView(await api.patch(`/plan/tasks/${t._id}`, { done: !t.done })); } catch (x) { setErr(x); } };
  const resched = async () => { try { setView(await api.post('/plan/reschedule')); } catch (x) { setErr(x); } };
  const toggleCo = (s) => setForm({ ...form, targetCompanies: form.targetCompanies.includes(s) ? form.targetCompanies.filter((x) => x !== s) : [...form.targetCompanies, s] });
  if (!cur?.plan || edit) return (
    <div className="mx-auto max-w-xl"><PageTitle title="Study plan" sub="A day-by-day plan built from your goals and your actual performance." />
      <form onSubmit={create} className="card space-y-4"><ErrorBox error={err} />
        <Field label="Plan length"><div className="grid grid-cols-3 gap-2">{[30, 60, 90].map((d) => <button type="button" key={d} onClick={() => setForm({ ...form, durationDays: d })} className={`btn ${Number(form.durationDays) === d ? 'btn-primary' : 'btn-ghost'}`}>{d} days</button>)}</div></Field>
        <Field label={`Daily study time: ${form.dailyHours} hours`}><input type="range" min="1" max="10" step="0.5" value={form.dailyHours} onChange={(e) => setForm({ ...form, dailyHours: Number(e.target.value) })} className="w-full" /></Field>
        <Field label="Current proficiency"><select className="input" value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: e.target.value })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></Field>
        <Field label="Preferred language"><select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}><option value="java">Java</option><option value="python">Python</option><option value="cpp">C++</option><option value="c">C</option></select></Field>
        <Field label="Target companies"><div className="flex flex-wrap gap-2">{companies.data?.items.map((c) => <button type="button" key={c.slug} onClick={() => toggleCo(c.slug)} aria-pressed={form.targetCompanies.includes(c.slug)} className={`rounded-full border px-3 py-1.5 text-sm ${form.targetCompanies.includes(c.slug) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>{c.name}</button>)}</div></Field>
        <Field label="Exam date (optional)"><input className="input" type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} /></Field>
        <Btn className="w-full" disabled={busy}>{busy ? 'Building your plan…' : 'Generate plan'}</Btn><p className="muted">Subjects where your accuracy is lower get more time. Slow-but-accurate subjects get timed practice.</p></form></div>
  );
  const tasks = cur.plan.tasks; const weekTasks = tasks.filter((t) => Math.floor((t.day - 1) / 7) + 1 === week); const days = [...new Set(weekTasks.map((t) => t.day))];
  return (
    <div className="space-y-4">
      <PageTitle title="Study plan" sub={`${cur.plan.durationDays}-day plan · ${cur.plan.dailyHours} h/day · ${cur.completion}% complete`} right={<Btn variant="ghost" onClick={() => setEdit(true)}>New plan</Btn>} />
      <ErrorBox error={err} />
      <Card><Progress value={cur.completion} tone="accent" />{cur.overdue > 0 && <div className="mt-3 flex items-center justify-between gap-2 text-sm"><span>{cur.overdue} task(s) were missed.</span><Btn variant="ghost" onClick={resched}><RefreshCw className="h-4 w-4" />Reschedule</Btn></div>}</Card>
      <div className="-mx-4 overflow-x-auto px-4"><div className="flex gap-2">{cur.weeks.map((w) => <button key={w.week} onClick={() => setWeek(w.week)} className={`min-w-[88px] rounded-xl border px-3 py-2 text-left text-xs ${week === w.week ? 'border-brand-600 bg-brand-50 dark:bg-brand-700/20' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}><b>Week {w.week}</b><div className="muted">{w.done}/{w.total} · {w.percent}%</div></button>)}</div></div>
      <div className="space-y-3">{days.map((d) => (<Card key={d}><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Day {d}</h3><span className="muted">{weekTasks.find((t) => t.day === d).date}</span></div>
        <ul className="space-y-1">{weekTasks.filter((t) => t.day === d).map((t) => (<li key={t._id} className="flex items-start gap-2">
          <button onClick={() => toggle(t)} className="mt-1 shrink-0" aria-label={t.done ? 'Mark not done' : 'Mark done'} aria-pressed={t.done}>{t.done ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-400" />}</button>
          <div className="min-w-0 flex-1"><Link to={taskLink(t)} className={`text-sm font-medium ${t.done ? 'text-slate-400 line-through' : ''}`}>{t.title}</Link><div className="muted">{t.minutes} min · {t.targetCount} {t.kind === 'coding' || t.kind === 'sql' ? 'problem(s)' : t.kind === 'mock' ? 'test' : 'questions'}{t.originalDate && t.originalDate !== t.date ? ' · rescheduled' : ''}</div><div className="text-xs text-slate-400">{t.reason}</div></div><Badge tone="slate">{label(t.kind)}</Badge></li>))}</ul></Card>))}</div>
    </div>
  );
}
