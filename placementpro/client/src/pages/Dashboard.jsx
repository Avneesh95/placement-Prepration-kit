import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Flame, Target, Trophy, CheckCircle2, Circle } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Card, Badge, Progress, Spinner, ErrorBox, PageTitle, Btn } from '../components/ui';
import { label, pct, SUBJECTS } from '../lib/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const prof = useGet('/profile'); const plan = useGet('/plan');
  if (prof.loading) return <Spinner />;
  if (prof.error) return <ErrorBox error={prof.error} onRetry={prof.reload} />;
  const s = prof.data.stats;
  const toggle = async (t) => { await api.patch(`/plan/tasks/${t._id}`, { done: !t.done }); plan.reload(); };
  const today = plan.data?.today || [];
  const fresh = s.questionsAttempted === 0 && s.mocks.attempted === 0;
  return (
    <div className="space-y-5">
      <PageTitle title={`Hi ${user.name.split(' ')[0]} 👋`} sub={fresh ? 'Start with a company page or a practice set — your progress will appear here.' : `${s.weeklyQuestions} questions in the last 7 days`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><div className="flex items-center gap-2 text-accent-600"><Flame className="h-4 w-4" /><span className="muted">Study streak</span></div><div className="mt-1 text-2xl font-bold">{s.streak.current} <span className="text-sm font-medium text-slate-500">days</span></div></Card>
        <Card><div className="flex items-center gap-2 text-brand-600"><Target className="h-4 w-4" /><span className="muted">Accuracy</span></div><div className="mt-1 text-2xl font-bold">{s.questionsAttempted ? pct(s.accuracy) : '—'}</div></Card>
        <Card><div className="flex items-center gap-2 text-brand-600"><CheckCircle2 className="h-4 w-4" /><span className="muted">Solved</span></div><div className="mt-1 text-2xl font-bold">{s.questionsSolved}</div></Card>
        <Card><div className="flex items-center gap-2 text-accent-600"><Trophy className="h-4 w-4" /><span className="muted">Best mock</span></div><div className="mt-1 text-2xl font-bold">{pct(s.mocks.bestPercentage)}</div></Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Today’s plan</h2><Link to="/plan" className="text-sm text-brand-600">Open planner</Link></div>
          {!plan.data?.plan ? <div className="space-y-3"><p className="muted">No study plan yet. Generate a 30, 60 or 90-day plan based on your goals.</p><Link to="/plan"><Btn>Create my plan</Btn></Link></div>
            : today.length === 0 ? <p className="muted">Nothing scheduled today. Check the planner for upcoming tasks.</p>
            : <ul className="space-y-2">{today.map((t) => (
              <li key={t._id}><button onClick={() => toggle(t)} className="flex w-full items-start gap-3 rounded-xl p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                {t.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />}
                <span className={t.done ? 'text-slate-400 line-through' : ''}>{t.title}<span className="muted block">{t.minutes} min · {t.targetCount} {t.kind === 'mock' ? 'test' : 'item(s)'}</span></span></button></li>))}</ul>}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Subject progress</h2>
          <div className="space-y-3">{SUBJECTS.map(([k, name]) => { const x = s.subjects[k]; return (
            <div key={k}><div className="mb-1 flex justify-between text-sm"><span>{name}</span><span className="muted">{x.solved}/{x.total} solved{x.attempted ? ` · ${pct(x.accuracy)} accuracy` : ''}</span></div><Progress value={x.progress} /></div>); })}</div>
          <p className="muted mt-3">Overall progress: <b>{pct(s.overallProgress)}</b></p>
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Last 14 days</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.activity.map((a) => ({ ...a, day: a.date.slice(8) }))}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(47,107,255,.15)' : 'rgba(47,107,255,.08)' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="questions" fill="#2f6bff" radius={[4, 4, 0, 0]} name="Questions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Needs attention</h2>
          {s.weakTopics.length === 0 ? <p className="muted">Weak areas show up once you have attempted a few questions in a topic.</p>
            : <ul className="space-y-2">{s.weakTopics.slice(0, 5).map((t) => <li key={t.subject + t.topic} className="flex items-center justify-between gap-2"><span>{label(t.topic)} <Badge tone="slate">{label(t.subject)}</Badge></span><Link className="text-sm text-brand-600" to={`/practice?subject=${t.subject}&topic=${t.topic}`}>{pct(t.accuracy)} · Practise</Link></li>)}</ul>}
          {s.incorrectToRevise > 0 && <Link to="/practice?status=incorrect" className="mt-3 block text-sm text-brand-600">{s.incorrectToRevise} incorrect question(s) to revise →</Link>}
        </Card>
      </div>
      {s.recentTests.length > 0 && <Card><h2 className="mb-2 font-semibold">Recent mock tests</h2><ul className="divide-y divide-slate-100 dark:divide-slate-800">{s.recentTests.map((t) => <li key={t.attemptId}><Link to={`/results/${t.attemptId}`} className="flex items-center justify-between py-2"><span>{t.title}</span><Badge tone="blue">{t.score}/{t.maxScore} · {pct(t.percentage)}</Badge></Link></li>)}</ul></Card>}
    </div>
  );
}
