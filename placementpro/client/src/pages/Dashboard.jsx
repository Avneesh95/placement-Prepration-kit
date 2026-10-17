import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Flame,
  Target,
  Trophy,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Building2,
  BookOpen,
  Timer,
  RotateCcw,
  Code2,
  Database,
  Briefcase,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Card, Badge, Progress, Spinner, ErrorBox, Btn, Disclaimer } from '../components/ui';
import { label, pct, SUBJECTS } from '../lib/format';

const TOP_COMPANIES = [
  { slug: 'tcs', name: 'TCS', color: 'from-blue-600 to-indigo-700', badge: 'bg-blue-600' },
  { slug: 'infosys', name: 'Infosys', color: 'from-sky-500 to-blue-600', badge: 'bg-sky-600' },
  { slug: 'wipro', name: 'Wipro', color: 'from-purple-600 to-indigo-800', badge: 'bg-purple-600' },
  { slug: 'accenture', name: 'Accenture', color: 'from-violet-600 to-purple-700', badge: 'bg-violet-600' },
  { slug: 'capgemini', name: 'Capgemini', color: 'from-cyan-600 to-blue-700', badge: 'bg-cyan-600' },
  { slug: 'cognizant', name: 'Cognizant', color: 'from-blue-700 to-slate-800', badge: 'bg-blue-800' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const prof = useGet('/profile');
  const plan = useGet('/plan');
  const companiesRes = useGet('/companies');

  if (prof.loading) return <Spinner label="Loading your personalized dashboard…" />;
  if (prof.error) return <ErrorBox error={prof.error} onRetry={prof.reload} />;

  const s = prof.data.stats;
  const today = plan.data?.today || [];
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const allCompanies = companiesRes.data?.items || [];

  const toggleTask = async (t) => {
    try {
      await api.patch(`/plan/tasks/${t._id}`, { done: !t.done });
      plan.reload();
    } catch {}
  };

  // Determine smart primary continue route
  const primaryContinueRoute =
    today.length > 0 && !today[0].done
      ? '/plan'
      : s.weakTopics?.length > 0
      ? `/practice?subject=${s.weakTopics[0].subject}&topic=${s.weakTopics[0].topic}`
      : '/practice';

  return (
    <div className="space-y-8">
      {/* 1. WELCOME HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Placement Season 2027 Preparation</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              Welcome back, {firstName} 👋
            </h1>
            <p className="mt-2 text-sm text-blue-100 sm:text-base leading-relaxed">
              {s.questionsAttempted === 0
                ? 'Kickstart your fresher placement journey today. Practice targeted company patterns and take full-length timed mocks.'
                : `You’ve completed ${s.questionsAttempted} questions so far with ${pct(s.accuracy)} accuracy. Keep building your daily momentum!`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to={primaryContinueRoute}>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-md transition hover:bg-blue-50 active:scale-95"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Continue Preparation</span>
              </button>
            </Link>
            <Link to="/mocks">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20 active:scale-95"
              >
                <Timer className="h-4 w-4" />
                <span>Take a Mock Test</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS OVERVIEW — 5 METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {/* Questions Attempted */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Attempted
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-brand-600 dark:bg-blue-950/60 dark:text-brand-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {s.questionsAttempted}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {s.questionsSolved}
              </span>{' '}
              solved
            </div>
          </div>
        </Card>

        {/* Mock Tests Completed */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Mocks Taken
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Timer className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {s.mocks.attempted}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              {s.mocks.attempted > 0 ? `Avg ${pct(s.mocks.averagePercentage)}` : 'No tests yet'}
            </div>
          </div>
        </Card>

        {/* Average Score / Accuracy */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Accuracy
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {s.questionsAttempted ? pct(s.accuracy) : '—'}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              {s.questionsAttempted > 0 ? 'Across all subjects' : 'Solve to measure'}
            </div>
          </div>
        </Card>

        {/* Study Streak */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Study Streak
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {s.streak.current}{' '}
              <span className="text-xs font-medium text-slate-500">days</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-gray-400">
              Best streak: {s.streak.longest} d
            </div>
          </div>
        </Card>

        {/* Overall Progress */}
        <Card className="col-span-2 flex flex-col justify-between sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Overall Prep
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {pct(s.overallProgress)}
              </span>
              <span className="text-xs text-slate-400">1,055 total Qs</span>
            </div>
            <div className="mt-2">
              <Progress value={s.overallProgress} height="h-2" />
            </div>
          </div>
        </Card>
      </div>

      {/* 3. CONTINUE PREPARATION & TODAY'S PLAN */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Tasks */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Today’s Study Action
              </h2>
              <p className="muted text-xs">
                {today.length > 0
                  ? `${today.filter((t) => t.done).length} of ${today.length} items completed today`
                  : 'Structured daily targets to keep you consistent'}
              </p>
            </div>
            <Link
              to="/plan"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <span>Planner</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!plan.data?.plan ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center dark:border-gray-800 dark:bg-gray-800/30">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                No active study plan generated
              </h3>
              <p className="muted mt-1 text-xs max-w-sm mx-auto">
                Create a customized 30, 60, or 90-day plan that adapts automatically to your weak subjects.
              </p>
              <Link to="/plan" className="mt-4 inline-block">
                <Btn size="sm">Generate My Study Plan</Btn>
              </Link>
            </div>
          ) : today.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-gray-800">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-gray-200">
                All caught up for today!
              </h3>
              <p className="muted mt-1 text-xs">
                Check upcoming days in your study plan or practice specific topics.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {today.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    onClick={() => toggleTask(t)}
                    className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-slate-200 hover:bg-slate-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    {t.done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300 dark:text-gray-600" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold ${t.done ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-gray-200'}`}>
                        {t.title}
                      </span>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
                        <span>{t.minutes} min</span>
                        <span>·</span>
                        <span>{t.targetCount} {t.kind === 'mock' ? 'test' : 'questions'}</span>
                        <Badge tone={t.kind === 'mock' ? 'orange' : t.kind === 'coding' ? 'blue' : 'slate'}>
                          {label(t.kind)}
                        </Badge>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Quick Launch & Revision */}
        <div className="space-y-4">
          <Card className="border-brand-500/30 bg-gradient-to-br from-white to-blue-50/40 dark:from-gray-900 dark:to-gray-900/60">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              <Code2 className="h-4 w-4" />
              <span>Coding & SQL Labs</span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
              Practise with LeetCode Links
            </h3>
            <p className="muted mt-1 text-xs">
              Every coding problem and SQL exercise now includes an official LeetCode link for hands-on practice.
            </p>
            <div className="mt-4 flex gap-2">
              <Link to="/coding" className="flex-1">
                <Btn size="sm" variant="primary" className="w-full">
                  Coding Arena
                </Btn>
              </Link>
              <Link to="/sql" className="flex-1">
                <Btn size="sm" variant="ghost" className="w-full">
                  SQL Lab
                </Btn>
              </Link>
            </div>
          </Card>

          {s.incorrectToRevise > 0 ? (
            <Card className="border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <RotateCcw className="h-4 w-4" />
                <span>Mistakes to Revise</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-700 dark:text-gray-300">
                You have <b className="text-amber-700 dark:text-amber-300">{s.incorrectToRevise}</b> incorrect question(s) waiting for revision.
              </p>
              <Link to="/practice?status=incorrect" className="mt-3 block">
                <Btn size="sm" variant="ghost" className="w-full !border-amber-300 dark:!border-amber-800">
                  Revise Mistakes Now →
                </Btn>
              </Link>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Clean Revision Queue</span>
              </div>
              <p className="muted mt-1 text-xs">
                No unresolved mistakes. Bookmark challenging problems during practice to review them here.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* 4. COMPANY PREPARATION SECTION */}
      <div>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Company-Wise Preparation
              </h2>
            </div>
            <p className="muted text-xs">
              Curated preparation tracks based on historical recruitment patterns.
            </p>
          </div>
          <Link
            to="/companies"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <span>All 10 Companies</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mb-3">
          <Disclaimer>
            Company modules are <b>curated preparation templates</b> designed for 2027 tier readiness. Always verify specific job notices on official company portals.
          </Disclaimer>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOP_COMPANIES.map((co) => {
            const apiData = allCompanies.find((c) => c.slug === co.slug);
            const qCount = apiData?.questionCount || 40;
            const mCount = apiData?.mockCount || 2;
            return (
              <Link key={co.slug} to={`/companies/${co.slug}`}>
                <Card hover className="h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-10 w-10 place-items-center rounded-xl ${co.badge} text-xs font-extrabold text-white shadow-sm`}
                        >
                          {co.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {co.name}
                          </h3>
                          <span className="text-[11px] text-slate-500 dark:text-gray-400">
                            2027 Fresher Pattern
                          </span>
                        </div>
                      </div>
                      <Badge tone="blue">Template</Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-gray-800 dark:text-gray-300">
                        Aptitude
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-gray-800 dark:text-gray-300">
                        Reasoning
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-gray-800 dark:text-gray-300">
                        Verbal
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-gray-800 dark:text-gray-300">
                        Coding
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-gray-800 dark:text-gray-400">
                    <span>
                      {qCount} Qs · {mCount} Mocks
                    </span>
                    <span className="font-semibold text-brand-600 group-hover:underline dark:text-brand-400">
                      Start Prep →
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. PERFORMANCE & ANALYTICS SECTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Activity Chart */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Activity (Last 14 Days)
              </h2>
              <p className="muted text-xs">Consistent daily practice accelerates test performance</p>
            </div>
            <Badge tone="blue">{s.weeklyQuestions} this week</Badge>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.activity.map((a) => ({ ...a, day: a.date.slice(8) }))}>
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  stroke={isDark ? '#94a3b8' : '#64748b'}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(37,99,235,.15)' : 'rgba(37,99,235,.08)' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#111827' : '#ffffff',
                    borderColor: isDark ? '#1f2937' : '#e2e8f0',
                    color: isDark ? '#f9fafb' : '#111827',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="questions" fill="#2563eb" radius={[4, 4, 0, 0]} name="Questions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subject-Wise Mastery Progress */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Subject-Wise Progress
              </h2>
              <p className="muted text-xs">Core syllabus completion across CSE placement areas</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Avg: <b>{pct(s.overallProgress)}</b>
            </span>
          </div>

          <div className="space-y-3">
            {SUBJECTS.map(([k, name]) => {
              const x = s.subjects[k];
              return (
                <div key={k}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-gray-300">{name}</span>
                    <span className="text-slate-500 dark:text-gray-400">
                      {x.solved}/{x.total} solved
                      {x.attempted ? ` · ${pct(x.accuracy)} acc` : ''}
                    </span>
                  </div>
                  <Progress value={x.progress} height="h-2" />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 6. WEAK AREAS & RECENT MOCK RESULTS */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weak Topics Needing Attention */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Topics Needing Attention
              </h2>
              <p className="muted text-xs">Focus your revision where accuracy is below 60%</p>
            </div>
          </div>

          {s.weakTopics.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-gray-800">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-500" />
              <p className="mt-2 text-xs text-slate-600 dark:text-gray-400">
                No weak areas identified yet! Attempt more questions across all topics to see insights.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-gray-800 text-xs">
              {s.weakTopics.slice(0, 5).map((t) => (
                <li key={t.subject + t.topic} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-gray-200">
                      {label(t.topic)}
                    </div>
                    <span className="text-[11px] text-slate-400">{label(t.subject)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {pct(t.accuracy)}
                    </span>
                    <Link
                      to={`/practice?subject=${t.subject}&topic=${t.topic}`}
                      className="rounded-lg bg-brand-50 px-2.5 py-1 font-semibold text-brand-600 hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300"
                    >
                      Practise →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Recent Mock Test Attempts */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Mock Tests
              </h2>
              <p className="muted text-xs">Detailed sectional breakdowns and answer reviews</p>
            </div>
            <Link to="/mocks" className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              All Mocks →
            </Link>
          </div>

          {s.recentTests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-gray-800">
              <Timer className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-2 text-xs text-slate-600 dark:text-gray-400">
                You haven&apos;t taken a mock test yet. Test your exam stamina with a 60-min paper!
              </p>
              <Link to="/mocks" className="mt-3 inline-block">
                <Btn size="sm" variant="ghost">Browse Mocks</Btn>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-gray-800 text-xs">
              {s.recentTests.map((t) => (
                <li key={t.attemptId} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-semibold text-slate-800 dark:text-gray-200">
                      {t.title}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Score: {t.score} / {t.maxScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={t.percentage >= 70 ? 'green' : t.percentage >= 40 ? 'amber' : 'red'}>
                      {pct(t.percentage)}
                    </Badge>
                    <Link
                      to={`/results/${t.attemptId}`}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
