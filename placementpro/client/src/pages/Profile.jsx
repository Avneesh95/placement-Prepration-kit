import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Shield, Award, Flame, BookMarked, AlertCircle, BarChart3, Sun, Moon, Laptop, ArrowRight } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Card, Badge, Btn, Progress, Spinner, ErrorBox, PageTitle, Field } from '../components/ui';
import { label, pct, SUBJECTS } from '../lib/format';

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const { setUser, logout } = useAuth();
  const { data, loading, error, reload } = useGet('/profile');
  const companies = useGet('/companies');
  const bms = useGet('/bookmarks');
  const rev = useGet('/progress/revision');

  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      const u = data.user;
      setF({
        name: u.name,
        graduationYear: u.graduationYear,
        branch: u.branch,
        college: u.college || '',
        targetCompanies: u.targetCompanies || [],
        preferredLanguage: u.preferredLanguage,
        dailyStudyHours: u.dailyStudyHours,
        prepStartDate: (u.prepStartDate || '').slice(0, 10),
      });
    }
  }, [data]);

  if (loading || !f) return error ? <ErrorBox error={error} onRetry={reload} /> : <Spinner label="Loading profile…" />;

  const s = data.stats;
  const u = data.user;

  const save = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg('');
    setBusy(true);
    try {
      const r = await api.put('/profile', {
        ...f,
        graduationYear: Number(f.graduationYear),
        dailyStudyHours: Number(f.dailyStudyHours),
      });
      setUser(r.user);
      setMsg('Profile saved.');
      reload();
    } catch (x) {
      setErr(x);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleCo = (c) =>
    setF({
      ...f,
      targetCompanies: f.targetCompanies.includes(c)
        ? f.targetCompanies.filter((x) => x !== c)
        : [...f.targetCompanies, c],
    });

  return (
    <div className="space-y-6">
      <PageTitle
        title="Account & Preparation Profile"
        sub={u.email}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Profile' },
        ]}
        right={
          <Btn variant="ghost" onClick={logout} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40">
            <LogOut className="mr-1.5 h-4 w-4" />
            Log out
          </Btn>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preparation Stats Overview */}
        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h2 className="font-bold text-slate-900 dark:text-white">Preparation Overview</h2>
            </div>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              Batch of {u.graduationYear}
            </span>
          </div>

          <div className="mb-5 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-gray-300">Overall Syllabus Progress</span>
              <span className="text-slate-900 dark:text-white">{pct(s.overallProgress)}</span>
            </div>
            <Progress value={s.overallProgress} tone="accent" />
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
              Subject Mastery
            </div>
            {SUBJECTS.map(([k, n]) => (
              <div key={k} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-gray-300">{n}</span>
                  <span className="text-slate-500 dark:text-gray-400">
                    {s.subjects[k].solved}/{s.subjects[k].total}
                  </span>
                </div>
                <Progress value={s.subjects[k].progress} />
              </div>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs dark:border-gray-800">
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">Questions Attempted</dt>
              <dd className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{s.questionsAttempted}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">Questions Solved</dt>
              <dd className="mt-0.5 text-base font-bold text-emerald-600 dark:text-emerald-400">{s.questionsSolved}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">Average Accuracy</dt>
              <dd className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                {s.questionsAttempted ? pct(s.accuracy) : '—'}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">Mocks Attempted</dt>
              <dd className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{s.mocks.attempted}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">Best / Avg Mock Score</dt>
              <dd className="mt-0.5 text-xs font-bold text-slate-900 dark:text-white">
                {pct(s.mocks.bestPercentage)} / {pct(s.mocks.averagePercentage)}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">Coding Solved</dt>
              <dd className="mt-0.5 text-base font-bold text-brand-600 dark:text-brand-400">
                {s.coding.solved}/{s.coding.total}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">SQL Solved</dt>
              <dd className="mt-0.5 text-base font-bold text-brand-600 dark:text-brand-400">
                {s.sql.solved}/{s.sql.total}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-gray-800/50">
              <dt className="text-slate-500 dark:text-gray-400">Streak (Current / Best)</dt>
              <dd className="mt-0.5 text-base font-bold text-amber-600 dark:text-amber-400">
                {s.streak.current}d ({s.streak.longest}d)
              </dd>
            </div>
          </dl>
        </Card>

        {/* Edit Profile & Settings */}
        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <h2 className="font-bold text-slate-900 dark:text-white">Profile Details</h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-gray-400">Customizes your recommendations</span>
          </div>

          <form onSubmit={save} className="space-y-4">
            <ErrorBox error={err} />

            <Field label="Full Name">
              <input className="input" value={f.name} onChange={set('name')} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Graduation Year">
                <input className="input" type="number" value={f.graduationYear} onChange={set('graduationYear')} />
              </Field>
              <Field label="Daily Study Hours">
                <input
                  className="input"
                  type="number"
                  step="0.5"
                  value={f.dailyStudyHours}
                  onChange={set('dailyStudyHours')}
                />
              </Field>
            </div>

            <Field label="Branch / Degree">
              <input className="input" value={f.branch} onChange={set('branch')} placeholder="e.g. Computer Science" />
            </Field>

            <Field label="College / University">
              <input className="input" value={f.college} onChange={set('college')} placeholder="e.g. SRM Institute" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Preferred Language">
                <select className="input" value={f.preferredLanguage} onChange={set('preferredLanguage')}>
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                  <option value="c">C</option>
                </select>
              </Field>
              <Field label="Preparation Started">
                <input className="input" type="date" value={f.prepStartDate} onChange={set('prepStartDate')} />
              </Field>
            </div>

            <Field label="Target Companies">
              <div className="flex flex-wrap gap-2">
                {companies.data?.items.map((c) => (
                  <button
                    type="button"
                    key={c.slug}
                    onClick={() => toggleCo(c.slug)}
                    aria-pressed={f.targetCompanies.includes(c.slug)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      f.targetCompanies.includes(c.slug)
                        ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Theme Appearance">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['system', 'System', Laptop],
                  ['light', 'Light', Sun],
                  ['dark', 'Dark', Moon],
                ].map(([tVal, tLbl, Icon]) => (
                  <button
                    type="button"
                    key={tVal}
                    onClick={() => setTheme(tVal)}
                    className={`btn !min-h-[38px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                      theme === tVal ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tLbl}</span>
                  </button>
                ))}
              </div>
            </Field>

            <div className="pt-2">
              <Btn className="w-full !min-h-[42px]" disabled={busy}>
                {busy ? 'Saving changes…' : 'Save Changes'}
              </Btn>
              {msg && (
                <p className="mt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400" role="status">
                  ✓ {msg}
                </p>
              )}
            </div>
          </form>
        </Card>
      </div>

      {/* Additional Stats & Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Weak Topics to Improve</h2>
            <span className="text-xs text-slate-500 dark:text-gray-400">&lt;60% accuracy</span>
          </div>
          {s.weakTopics.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-gray-400">
              None detected yet. Weak topics appear after 3 or more attempts with accuracy under 60%.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm dark:divide-gray-800">
              {s.weakTopics.map((t) => (
                <li key={t.subject + t.topic} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">{label(t.topic)}</span>
                    <Badge>{label(t.subject)}</Badge>
                  </div>
                  <Link
                    to={`/practice?subject=${t.subject}&topic=${t.topic}`}
                    className="font-bold text-rose-600 hover:underline dark:text-rose-400"
                  >
                    {pct(t.accuracy)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Daily Practice Activity (14 Days)</h2>
            <span className="text-xs text-slate-500 dark:text-gray-400">{s.weeklyQuestions} this week</span>
          </div>
          <div className="flex items-end gap-1.5 h-24 pt-4" aria-label="Daily questions">
            {s.activity.map((a) => (
              <div key={a.date} title={`${a.date}: ${a.questions} question(s)`} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm bg-brand-600 transition hover:bg-brand-500 dark:bg-brand-500"
                  style={{
                    height: `${Math.min(76, a.questions * 4)}px`,
                    minHeight: a.questions ? 6 : 2,
                    opacity: a.questions ? 1 : 0.25,
                  }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Recently Completed Tests</h2>
            <Link to="/mocks" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
              All Mocks →
            </Link>
          </div>
          {s.recentTests.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-gray-400">No mock tests completed yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm dark:divide-gray-800">
              {s.recentTests.map((t) => (
                <li key={t.attemptId}>
                  <Link
                    to={`/results/${t.attemptId}`}
                    className="flex items-center justify-between py-2.5 transition hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    <span className="font-medium text-slate-900 dark:text-white">{t.title}</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">{pct(t.percentage)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Bookmarked Questions ({bms.data?.items.length ?? 0})
              </h2>
            </div>
            {bms.data?.items.length > 0 && (
              <Link to="/practice?bookmarked=true" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Practice bookmarked →
              </Link>
            )}
          </div>
          {bms.data?.items.length ? (
            <ul className="space-y-2 text-xs">
              {bms.data.items.slice(0, 5).map((q) => (
                <li key={q._id} className="truncate text-slate-700 dark:text-gray-300">
                  • {q.text.split('\n')[0]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Bookmark tough questions while practising to review them later.
            </p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Incorrect Questions to Revise ({rev.data?.items.length ?? 0})
              </h2>
            </div>
            {rev.data?.items.length > 0 && (
              <Link to="/practice?status=incorrect" className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                Revise now →
              </Link>
            )}
          </div>
          {rev.data?.items.length ? (
            <ul className="space-y-2 text-xs">
              {rev.data.items.slice(0, 5).map((r) => (
                <li key={r.question._id} className="truncate text-slate-700 dark:text-gray-300">
                  <span className="font-semibold text-slate-900 dark:text-white">[{label(r.question.topic)}]</span>{' '}
                  {r.question.text.split('\n')[0]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Questions answered incorrectly will be automatically collected here for targeted revision.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

