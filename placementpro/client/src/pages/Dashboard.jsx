import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Card, Badge, Progress, Spinner, ErrorBox, Btn, Disclaimer, CircularGauge } from '../components/ui';
import { label, pct, SUBJECTS } from '../lib/format';

const TOP_COMPANIES = [
  { slug: 'tcs', name: 'TCS', badge: 'bg-blue-600', status: 'ready', questions: 120 },
  { slug: 'infosys', name: 'Infosys', badge: 'bg-sky-600', status: 'ready', questions: 95 },
  { slug: 'wipro', name: 'Wipro', badge: 'bg-purple-600', status: 'progress', questions: 80 },
  { slug: 'accenture', name: 'Accenture', badge: 'bg-violet-600', status: 'ready', questions: 110 },
  { slug: 'capgemini', name: 'Capgemini', badge: 'bg-cyan-600', status: 'progress', questions: 75 },
  { slug: 'cognizant', name: 'Cognizant', badge: 'bg-blue-800', status: 'ready', questions: 85 },
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

  const primaryContinueRoute =
    today.length > 0 && !today[0].done
      ? '/plan'
      : s.weakTopics?.length > 0
      ? `/practice?subject=${s.weakTopics[0].subject}&topic=${s.weakTopics[0].topic}`
      : '/practice';

  // Prepare chart data for the smooth multi-layer wave chart (matching the UI screenshot)
  const chartData = (s.activity || []).slice(-7).map((a, idx) => {
    const d = new Date(a.date);
    const dateLabel = isNaN(d) ? `Day ${idx + 1}` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const qCount = a.questions || 0;
    return {
      name: dateLabel,
      questions: qCount,
      accuracy: Math.min(100, Math.max(20, Math.round(qCount * 6 + 40))),
      streak: (idx + 1) * 3,
    };
  });

  // Custom Tooltip styled like the floating dark card in the uploaded UI screenshot
  const CustomWaveTooltip = ({ active, payload, label: xLabel }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-2xl border border-sky-400/30 bg-[#171f30] p-3 text-xs text-white shadow-2xl backdrop-blur-md">
          <div className="font-bold text-sky-400 mb-1">{xLabel}</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-sky-400" /> Questions:
              </span>
              <span className="font-bold text-white">{payload[0]?.value || 0}</span>
            </div>
            {payload[1] && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-orange-500" /> Focus Score:
                </span>
                <span className="font-bold text-orange-400">{payload[1].value}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-7">
      {/* 1. TOP HEADER / HERO GREETING (Matching UI Screenshot) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400">
            <Sparkles className="h-3 w-3" />
            <span>Placement Season 2027</span>
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Overview
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
            Welcome back, <b className="text-slate-800 dark:text-gray-200">{firstName}</b>. Track your real-time preparation progress and readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={primaryContinueRoute}>
            <Btn variant="primary" className="!rounded-full shadow-md shadow-sky-500/25">
              <PlayCircle className="h-4 w-4" />
              <span>Continue Prep</span>
            </Btn>
          </Link>
          <Link to="/mocks">
            <Btn variant="accent" className="!rounded-full shadow-md shadow-orange-500/25">
              <Timer className="h-4 w-4" />
              <span>Take a Mock Test</span>
            </Btn>
          </Link>
        </div>
      </div>

      {/* 2. MAIN CENTER HERO: MULTI-LAYER WAVE CHART + RIGHT ACTIVITY PANEL */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left 8 Cols: Smooth Flowing Wave Area Chart + 3 Circular Cards */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="relative overflow-hidden !p-6 border-sky-100 bg-white shadow-card dark:border-[#222d44] dark:bg-[#171f30]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Activity & Mastery Trend
                </h2>
                <p className="text-xs text-slate-400 dark:text-gray-500">
                  Daily question volume and focus trend over time
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Skyblue Practice
                </span>
                <span className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400">
                  <span className="h-2 w-2 rounded-full bg-orange-500" /> Orange Focus
                </span>
              </div>
            </div>

            {/* Smooth Multi-Layer Wave Chart (Matching UI Screenshot) */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    {/* Sky Blue Wave Gradient */}
                    <linearGradient id="skyWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
                    </linearGradient>
                    {/* Orange Wave Gradient */}
                    <linearGradient id="orangeWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0.02} />
                    </linearGradient>
                    {/* Indigo Wave Gradient */}
                    <linearGradient id="indigoWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="name"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomWaveTooltip />} />

                  {/* Layer 1: Indigo Wave */}
                  <Area
                    type="monotone"
                    dataKey="streak"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#indigoWave)"
                  />
                  {/* Layer 2: Orange Wave */}
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#f97316"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#orangeWave)"
                  />
                  {/* Layer 3: Sky Blue Wave */}
                  <Area
                    type="monotone"
                    dataKey="questions"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#skyWave)"
                    activeDot={{ r: 6, fill: '#ffffff', stroke: '#0ea5e9', strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 3. THE 3 ICONIC CIRCULAR GAUGE CARDS (From UI Screenshot) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Card 1: Vibrant Orange / Coral Gradient Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff5722] via-[#f97316] to-[#ea580c] p-6 text-white shadow-xl shadow-orange-500/20 transition-transform duration-200 hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <CircularGauge
                  value={s.questionsAttempted}
                  max={1000}
                  unit="ATTEMPTED"
                  strokeColor="#ffffff"
                  trackColor="rgba(255, 255, 255, 0.28)"
                  textColor="text-white"
                  size={120}
                  strokeWidth={13}
                />
                <div className="mt-4">
                  <h3 className="text-lg font-bold tracking-tight text-white">Questions</h3>
                  <p className="mt-0.5 text-xs text-white/80 font-medium">
                    {s.questionsSolved} solved · {pct(s.accuracy)} accuracy
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Vibrant Purple / Periwinkle Gradient Card (From UI Screenshot) */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#8b5cf6] p-6 text-white shadow-xl shadow-indigo-500/20 transition-transform duration-200 hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <CircularGauge
                  value={s.streak.current}
                  max={30}
                  unit="DAYS"
                  strokeColor="#ffffff"
                  trackColor="rgba(255, 255, 255, 0.28)"
                  textColor="text-white"
                  size={120}
                  strokeWidth={13}
                />
                <div className="mt-4">
                  <h3 className="text-lg font-bold tracking-tight text-white">Study Streak</h3>
                  <p className="mt-0.5 text-xs text-white/80 font-medium">
                    Best streak: {s.streak.longest} consecutive days
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Vibrant Sky Blue / Cyan Gradient Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] p-6 text-white shadow-xl shadow-sky-500/20 transition-transform duration-200 hover:-translate-y-1">
              <div className="flex flex-col items-center text-center">
                <CircularGauge
                  value={pct(s.overallProgress)}
                  max={100}
                  unit="SYLLABUS"
                  strokeColor="#ffffff"
                  trackColor="rgba(255, 255, 255, 0.28)"
                  textColor="text-white"
                  size={120}
                  strokeWidth={13}
                />
                <div className="mt-4">
                  <h3 className="text-lg font-bold tracking-tight text-white">Overall Prep</h3>
                  <p className="mt-0.5 text-xs text-white/80 font-medium">
                    1,055 questions · 108 topics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Online / Target Company Tracker (Matching UI Screenshot Right Panel) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="!p-5 border-sky-100 bg-white shadow-card dark:border-[#222d44] dark:bg-[#171f30]">
            <div className="mb-4 flex items-center justify-between border-b border-sky-50 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-gray-200">
                  Target Companies
                </h2>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Patterns
              </span>
            </div>

            <div className="space-y-3">
              {TOP_COMPANIES.map((c) => {
                const apiData = allCompanies.find((item) => item.slug === c.slug);
                const qCount = apiData?.questionCount || c.questions;
                const isReady = c.status === 'ready';

                return (
                  <Link key={c.slug} to={`/companies/${c.slug}`} className="group block">
                    <div className="flex items-center justify-between rounded-xl p-2.5 transition hover:bg-sky-50/60 dark:hover:bg-gray-800/60">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`grid h-9 w-9 place-items-center rounded-xl ${c.badge} text-xs font-black text-white shadow-xs`}
                          >
                            {c.name.slice(0, 3)}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-[#171f30] ${
                              isReady ? 'bg-emerald-500' : 'bg-orange-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-400">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-gray-500">
                            {qCount} Questions · Pattern ready
                          </div>
                        </div>
                      </div>

                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-sky-50 dark:border-gray-800">
              <Link
                to="/companies"
                className="flex items-center justify-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                <span>View all 10 companies</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>

          {/* Quick Labs Access */}
          <Card className="!p-4 bg-gradient-to-br from-white to-sky-50/50 dark:from-[#171f30] dark:to-[#131926] border-sky-100 dark:border-[#222d44]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Coding & SQL Arena</span>
              </div>
              <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                LeetCode Links
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Link to="/coding" className="flex-1">
                <Btn size="sm" variant="primary" className="w-full !rounded-xl !text-xs">
                  Coding Arena
                </Btn>
              </Link>
              <Link to="/sql" className="flex-1">
                <Btn size="sm" variant="ghost" className="w-full !rounded-xl !text-xs">
                  SQL Lab
                </Btn>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 4. TODAY'S ACTION & SUBJECT MASTERY BREAKDOWN */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Tasks */}
        <Card className="border-sky-100 dark:border-[#222d44]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Today’s Action Plan
              </h2>
              <p className="muted text-xs">
                {today.length > 0
                  ? `${today.filter((t) => t.done).length} of ${today.length} targets completed`
                  : 'Structured daily steps towards placement readiness'}
              </p>
            </div>
            <Link
              to="/plan"
              className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
            >
              <span>Planner</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!plan.data?.plan ? (
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-6 text-center dark:border-gray-800 dark:bg-gray-800/30">
              <CalendarCheck className="mx-auto h-8 w-8 text-sky-500" />
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                No active study plan generated
              </h3>
              <p className="muted mt-1 text-xs max-w-sm mx-auto">
                Build a tailored 30, 60, or 90-day plan that adapts automatically to your weak subjects.
              </p>
              <Link to="/plan" className="mt-4 inline-block">
                <Btn size="sm" variant="primary">Generate Study Plan</Btn>
              </Link>
            </div>
          ) : today.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-sky-200 p-6 text-center dark:border-gray-800">
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
                    className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-sky-200 hover:bg-sky-50/40 dark:border-gray-800 dark:hover:bg-gray-800/50"
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

        {/* Subject Mastery Overview */}
        <Card className="border-sky-100 dark:border-[#222d44]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Subject Mastery
            </h2>
            <Link to="/practice" className="text-xs font-bold text-sky-600 hover:underline dark:text-sky-400">
              Practice Arena →
            </Link>
          </div>

          <div className="space-y-3.5">
            {SUBJECTS.map(([k, n]) => {
              const subStat = s.subjects[k] || { solved: 0, total: 100, progress: 0 };
              return (
                <div key={k} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-gray-300">{n}</span>
                    <span className="text-slate-400 dark:text-gray-500">
                      {subStat.solved} / {subStat.total} solved ({subStat.progress}%)
                    </span>
                  </div>
                  <Progress value={subStat.progress} height="h-2" />
                </div>
              );
            })}
          </div>

          {s.weakTopics?.length > 0 && (
            <div className="mt-5 rounded-2xl border border-orange-200/80 bg-orange-50/50 p-3.5 dark:border-orange-900/40 dark:bg-orange-950/20">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-700 dark:text-orange-400">
                <RotateCcw className="h-4 w-4" />
                <span>Recommended Revision: {label(s.weakTopics[0].topic)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-gray-300">
                Accuracy is currently {pct(s.weakTopics[0].accuracy)}. Solve a few practice drills to master this area.
              </p>
              <Link
                to={`/practice?subject=${s.weakTopics[0].subject}&topic=${s.weakTopics[0].topic}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline dark:text-orange-400"
              >
                <span>Drill {label(s.weakTopics[0].topic)}</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
