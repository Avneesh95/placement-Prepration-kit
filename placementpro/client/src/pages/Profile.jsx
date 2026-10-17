import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Card, Badge, Btn, Progress, Spinner, ErrorBox, PageTitle, Field } from '../components/ui';
import { label, pct, SUBJECTS } from '../lib/format';

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const { setUser, logout } = useAuth(); const { data, loading, error, reload } = useGet('/profile'); const companies = useGet('/companies'); const bms = useGet('/bookmarks'); const rev = useGet('/progress/revision');
  const [f, setF] = useState(null); const [msg, setMsg] = useState(''); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) { const u = data.user; setF({ name: u.name, graduationYear: u.graduationYear, branch: u.branch, college: u.college || '', targetCompanies: u.targetCompanies || [], preferredLanguage: u.preferredLanguage, dailyStudyHours: u.dailyStudyHours, prepStartDate: (u.prepStartDate || '').slice(0, 10) }); } }, [data]);
  if (loading || !f) return error ? <ErrorBox error={error} onRetry={reload} /> : <Spinner />;
  const s = data.stats; const u = data.user;
  const save = async (e) => { e.preventDefault(); setErr(null); setMsg(''); setBusy(true); try { const r = await api.put('/profile', { ...f, graduationYear: Number(f.graduationYear), dailyStudyHours: Number(f.dailyStudyHours) }); setUser(r.user); setMsg('Profile saved.'); reload(); } catch (x) { setErr(x); } finally { setBusy(false); } };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleCo = (c) => setF({ ...f, targetCompanies: f.targetCompanies.includes(c) ? f.targetCompanies.filter((x) => x !== c) : [...f.targetCompanies, c] });
  return (
    <div className="space-y-4">
      <PageTitle title="Profile" sub={u.email} right={<Btn variant="ghost" onClick={logout}>Log out</Btn>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-3 font-semibold">Preparation overview</h2><div className="mb-3"><div className="mb-1 flex justify-between text-sm"><span>Overall progress</span><b>{pct(s.overallProgress)}</b></div><Progress value={s.overallProgress} tone="accent" /></div>
          <div className="space-y-3">{SUBJECTS.map(([k, n]) => <div key={k}><div className="mb-1 flex justify-between text-sm"><span>{n}</span><span className="muted">{s.subjects[k].solved}/{s.subjects[k].total}</span></div><Progress value={s.subjects[k].progress} /></div>)}</div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm"><dt className="muted">Attempted</dt><dd className="text-right font-semibold">{s.questionsAttempted}</dd><dt className="muted">Solved</dt><dd className="text-right font-semibold">{s.questionsSolved}</dd><dt className="muted">Accuracy</dt><dd className="text-right font-semibold">{s.questionsAttempted ? pct(s.accuracy) : '—'}</dd><dt className="muted">Mocks attempted</dt><dd className="text-right font-semibold">{s.mocks.attempted}</dd><dt className="muted">Best / average mock</dt><dd className="text-right font-semibold">{pct(s.mocks.bestPercentage)} / {pct(s.mocks.averagePercentage)}</dd><dt className="muted">Coding solved</dt><dd className="text-right font-semibold">{s.coding.solved}/{s.coding.total}</dd><dt className="muted">SQL solved</dt><dd className="text-right font-semibold">{s.sql.solved}/{s.sql.total}</dd><dt className="muted">Streak (best)</dt><dd className="text-right font-semibold">{s.streak.current} ({s.streak.longest})</dd><dt className="muted">Questions this week</dt><dd className="text-right font-semibold">{s.weeklyQuestions}</dd></dl></Card>
        <Card><h2 className="mb-3 font-semibold">Edit profile</h2><form onSubmit={save} className="space-y-3"><ErrorBox error={err} />
          <Field label="Name"><input className="input" value={f.name} onChange={set('name')} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Graduation year"><input className="input" type="number" value={f.graduationYear} onChange={set('graduationYear')} /></Field><Field label="Daily study hours"><input className="input" type="number" step="0.5" value={f.dailyStudyHours} onChange={set('dailyStudyHours')} /></Field></div>
          <Field label="Branch"><input className="input" value={f.branch} onChange={set('branch')} /></Field><Field label="College"><input className="input" value={f.college} onChange={set('college')} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Preferred language"><select className="input" value={f.preferredLanguage} onChange={set('preferredLanguage')}><option value="java">Java</option><option value="python">Python</option><option value="cpp">C++</option><option value="c">C</option></select></Field><Field label="Preparation started"><input className="input" type="date" value={f.prepStartDate} onChange={set('prepStartDate')} /></Field></div>
          <Field label="Target companies"><div className="flex flex-wrap gap-2">{companies.data?.items.map((c) => <button type="button" key={c.slug} onClick={() => toggleCo(c.slug)} aria-pressed={f.targetCompanies.includes(c.slug)} className={`rounded-full border px-3 py-1.5 text-sm ${f.targetCompanies.includes(c.slug) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>{c.name}</button>)}</div></Field>
          <Field label="Theme appearance">
            <div className="grid grid-cols-3 gap-2">
              {[['system', 'System (Auto)'], ['light', 'Light'], ['dark', 'Dark']].map(([tVal, tLbl]) => (
                <button
                  type="button"
                  key={tVal}
                  onClick={() => setTheme(tVal)}
                  className={`btn !min-h-[38px] text-xs font-semibold ${theme === tVal ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {tLbl}
                </button>
              ))}
            </div>
          </Field>
          <Btn disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Btn>{msg && <p className="muted" role="status">{msg}</p>}</form></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-2 font-semibold">Weak areas</h2>{s.weakTopics.length === 0 ? <p className="muted">None yet. Weak topics appear after 3+ attempts with accuracy under 60%.</p> : <ul className="space-y-2 text-sm">{s.weakTopics.map((t) => <li key={t.subject + t.topic} className="flex justify-between"><span>{label(t.topic)} <Badge>{label(t.subject)}</Badge></span><Link to={`/practice?subject=${t.subject}&topic=${t.topic}`} className="text-brand-600">{pct(t.accuracy)}</Link></li>)}</ul>}</Card>
        <Card><h2 className="mb-2 font-semibold">Daily activity (14 days)</h2><div className="flex items-end gap-1" aria-label="Daily questions">{s.activity.map((a) => <div key={a.date} title={`${a.date}: ${a.questions}`} className="flex-1"><div className="rounded-t bg-brand-600" style={{ height: `${Math.min(80, a.questions * 4)}px`, minHeight: a.questions ? 4 : 2, opacity: a.questions ? 1 : 0.2 }} /></div>)}</div></Card>
        <Card><h2 className="mb-2 font-semibold">Recently completed tests</h2>{s.recentTests.length === 0 ? <p className="muted">No tests completed yet.</p> : <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">{s.recentTests.map((t) => <li key={t.attemptId}><Link to={`/results/${t.attemptId}`} className="flex justify-between py-2"><span>{t.title}</span><b>{pct(t.percentage)}</b></Link></li>)}</ul>}</Card>
        <Card><h2 className="mb-2 font-semibold">Bookmarks ({bms.data?.items.length ?? 0})</h2>{bms.data?.items.length ? <ul className="space-y-2 text-sm">{bms.data.items.slice(0, 6).map((q) => <li key={q._id} className="truncate">{q.text.split('\n')[0]}</li>)}</ul> : <p className="muted">Bookmark questions while practising to collect them here.</p>}{bms.data?.items.length > 0 && <Link className="mt-2 block text-sm text-brand-600" to="/practice?bookmarked=true">Practise bookmarked →</Link>}</Card>
        <Card className="lg:col-span-2"><h2 className="mb-2 font-semibold">Incorrect questions to revise ({rev.data?.items.length ?? 0})</h2>{rev.data?.items.length ? <><ul className="space-y-2 text-sm">{rev.data.items.slice(0, 5).map((r) => <li key={r.question._id} className="truncate">{label(r.question.topic)} — {r.question.text.split('\n')[0]}</li>)}</ul><Link className="mt-2 block text-sm text-brand-600" to="/practice?status=incorrect">Revise now →</Link></> : <p className="muted">Questions you get wrong will be listed here for revision.</p>}</Card>
      </div>
    </div>
  );
}
