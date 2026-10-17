import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, RefreshCw, Calendar, Clock, Sparkles, BookOpen } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { Card, Badge, Btn, Progress, Spinner, ErrorBox, PageTitle, Field } from '../components/ui';
import { label } from '../lib/format';

const taskLink = (t) =>
  t.kind === 'mock'
    ? t.topic && t.topic !== 'general'
      ? `/mocks/${t.topic}-full-1`
      : '/mocks/general-placement-1'
    : t.kind === 'review'
    ? '/practice?status=incorrect'
    : t.subject === 'coding'
    ? `/coding?topic=${t.topic}`
    : t.subject === 'sql'
    ? '/sql'
    : `/practice?subject=${t.subject}&topic=${t.topic}`;

export default function StudyPlan() {
  const { data, loading, error, reload } = useGet('/plan');
  const companies = useGet('/companies');
  const [form, setForm] = useState({
    durationDays: 30,
    dailyHours: 3,
    proficiency: 'intermediate',
    language: 'java',
    targetCompanies: [],
    examDate: '',
  });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState(null);
  const [week, setWeek] = useState(1);
  const [edit, setEdit] = useState(false);

  const cur = view || data;

  if (loading) return <Spinner label="Loading study plan…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const create = async (e) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      setView(
        await api.post('/plan', {
          ...form,
          durationDays: Number(form.durationDays),
          examDate: form.examDate || undefined,
        })
      );
      setEdit(false);
    } catch (x) {
      setErr(x);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (t) => {
    try {
      setView(await api.patch(`/plan/tasks/${t._id}`, { done: !t.done }));
    } catch (x) {
      setErr(x);
    }
  };

  const resched = async () => {
    try {
      setView(await api.post('/plan/reschedule'));
    } catch (x) {
      setErr(x);
    }
  };

  const toggleCo = (s) =>
    setForm({
      ...form,
      targetCompanies: form.targetCompanies.includes(s)
        ? form.targetCompanies.filter((x) => x !== s)
        : [...form.targetCompanies, s],
    });

  if (!cur?.plan || edit) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageTitle
          title="Personalized Study Plan"
          sub="Build an intelligent, day-by-day roadmap tailored to your target companies, daily hours, and actual weak topics."
          crumbs={[
            { label: 'Dashboard', to: '/' },
            { label: 'Study Plan' },
          ]}
        />
        <form onSubmit={create} className="card space-y-5">
          <ErrorBox error={err} />

          <Field label="Plan Duration">
            <div className="grid grid-cols-3 gap-3">
              {[30, 60, 90].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setForm({ ...form, durationDays: d })}
                  className={`btn !min-h-[44px] text-sm font-semibold ${
                    Number(form.durationDays) === d ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </Field>

          <Field label={`Daily study time: ${form.dailyHours} hours`}>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={form.dailyHours}
              onChange={(e) => setForm({ ...form, dailyHours: Number(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>1 hr/day</span>
              <span>5 hrs/day</span>
              <span>10 hrs/day</span>
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Current proficiency">
              <select
                className="input"
                value={form.proficiency}
                onChange={(e) => setForm({ ...form, proficiency: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </Field>

            <Field label="Preferred language">
              <select
                className="input"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              >
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
              </select>
            </Field>
          </div>

          <Field label="Target companies">
            <div className="flex flex-wrap gap-2">
              {companies.data?.items.map((c) => (
                <button
                  type="button"
                  key={c.slug}
                  onClick={() => toggleCo(c.slug)}
                  aria-pressed={form.targetCompanies.includes(c.slug)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    form.targetCompanies.includes(c.slug)
                      ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Target exam date (optional)">
            <input
              className="input"
              type="date"
              value={form.examDate}
              onChange={(e) => setForm({ ...form, examDate: e.target.value })}
            />
          </Field>

          <Btn className="w-full !min-h-[44px]" disabled={busy}>
            <Sparkles className="mr-2 h-4 w-4" />
            {busy ? 'Building your plan…' : 'Generate Personalized Plan'}
          </Btn>

          <p className="text-center text-xs text-slate-500 dark:text-gray-400">
            Subjects with lower accuracy receive extra foundational drill tasks. Accurate but slow subjects receive timed mock drills.
          </p>
        </form>
      </div>
    );
  }

  const tasks = cur.plan.tasks;
  const weekTasks = tasks.filter((t) => Math.floor((t.day - 1) / 7) + 1 === week);
  const days = [...new Set(weekTasks.map((t) => t.day))];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Personalized Study Plan"
        sub={`${cur.plan.durationDays}-day plan · ${cur.plan.dailyHours} h/day · ${cur.completion}% complete`}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Study Plan' },
        ]}
        right={
          <Btn variant="ghost" onClick={() => setEdit(true)}>
            Edit Goals
          </Btn>
        }
      />

      <ErrorBox error={err} />

      {/* Progress card */}
      <Card>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-900 dark:text-white">Overall Plan Completion</span>
          <span className="font-bold text-brand-600 dark:text-brand-400">{cur.completion}%</span>
        </div>
        <Progress value={cur.completion} tone="accent" />
        {cur.overdue > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            <span className="font-medium">{cur.overdue} task(s) were missed or are behind schedule.</span>
            <Btn variant="ghost" size="sm" onClick={resched} className="!h-8 text-xs font-semibold">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reschedule Missed
            </Btn>
          </div>
        )}
      </Card>

      {/* Week Selector Bar */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2">
          {cur.weeks.map((w) => (
            <button
              key={w.week}
              onClick={() => setWeek(w.week)}
              className={`min-w-[100px] shrink-0 rounded-xl border p-3 text-left transition ${
                week === w.week
                  ? 'border-brand-600 bg-brand-50 shadow-xs dark:border-brand-500 dark:bg-brand-950/40'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700'
              }`}
            >
              <div className={`text-xs font-bold ${week === w.week ? 'text-brand-700 dark:text-brand-300' : 'text-slate-800 dark:text-gray-200'}`}>
                Week {w.week}
              </div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">
                {w.done}/{w.total} · {w.percent}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Tasks List */}
      <div className="space-y-4">
        {days.map((d) => {
          const dayDate = weekTasks.find((t) => t.day === d)?.date;
          return (
            <Card key={d} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white">Day {d}</h3>
                </div>
                {dayDate && <span className="text-xs text-slate-500 dark:text-gray-400">{dayDate}</span>}
              </div>

              <ul className="divide-y divide-slate-100 dark:divide-gray-800">
                {weekTasks
                  .filter((t) => t.day === d)
                  .map((t) => (
                    <li key={t._id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-1">
                      <button
                        onClick={() => toggle(t)}
                        className="mt-0.5 shrink-0 transition hover:scale-110"
                        aria-label={t.done ? 'Mark not done' : 'Mark done'}
                        aria-pressed={t.done}
                      >
                        {t.done ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400 hover:text-slate-600 dark:text-gray-500" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <Link
                          to={taskLink(t)}
                          className={`text-sm font-semibold transition hover:text-brand-600 dark:hover:text-brand-400 ${
                            t.done ? 'text-slate-400 line-through dark:text-gray-500' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {t.title}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t.minutes} min
                          </span>
                          <span>·</span>
                          <span>
                            {t.targetCount}{' '}
                            {t.kind === 'coding' || t.kind === 'sql'
                              ? 'problem(s)'
                              : t.kind === 'mock'
                              ? 'test'
                              : 'questions'}
                          </span>
                          {t.originalDate && t.originalDate !== t.date && (
                            <span className="rounded bg-amber-500/10 px-1 text-[10px] text-amber-700 dark:text-amber-400">
                              Rescheduled
                            </span>
                          )}
                        </div>
                        {t.reason && (
                          <p className="mt-1 text-xs text-slate-400 dark:text-gray-500 leading-normal">{t.reason}</p>
                        )}
                      </div>

                      <Badge tone="slate" className="shrink-0">
                        {label(t.kind)}
                      </Badge>
                    </li>
                  ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

