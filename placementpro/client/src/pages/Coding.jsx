import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Lightbulb } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api, qs } from '../lib/api';
import { Card, Badge, Btn, Spinner, ErrorBox, PageTitle, Empty, Disclaimer } from '../components/ui';
import { label } from '../lib/format';

export function CodingList() {
  const [sp, setSp] = useSearchParams();
  const f = { company: sp.get('company') || '', topic: sp.get('topic') || '', difficulty: sp.get('difficulty') || '', language: sp.get('language') || '', status: sp.get('status') || '', bookmarked: sp.get('bookmarked') || '', collection: sp.get('collection') || '', q: sp.get('q') || '', page: sp.get('page') || '1' };
  const list = useGet(`/coding${qs({ ...f, limit: 12 })}`); const daily = useGet('/coding/daily'); const companies = useGet('/companies'); const topics = useGet('/topics?subject=coding');
  const set = (k, v) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); setSp(n); };
  return (
    <div>
      <PageTitle title="Coding Arena" sub="Practise problems, then compare with reference solutions." />
      <div className="mb-4"><Disclaimer><b>Practice interface, not an online judge.</b> Your code is saved but never executed. Reference solutions (Java and Python) were checked offline against the test cases. Mark your own result honestly.</Disclaimer></div>
      {daily.data && <Link to={`/coding/${daily.data.question._id}`}><Card className="mb-4 border-accent-500/40 hover:border-accent-500"><Badge tone="orange">Daily challenge</Badge><h2 className="mt-2 font-semibold">{daily.data.question.subtopic}</h2><p className="muted">{label(daily.data.question.topic)} · {daily.data.question.difficulty}</p></Card></Link>}
      <div className="card mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input sm:col-span-2" placeholder="Search problems…" value={f.q} onChange={(e) => set('q', e.target.value)} aria-label="Search" />
        <select className="input" value={f.collection} onChange={(e) => set('collection', e.target.value)} aria-label="Collection"><option value="">All problems</option><option value="top100">Core fresher set</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
        <select className="input" value={f.topic} onChange={(e) => set('topic', e.target.value)} aria-label="Topic"><option value="">All topics</option>{topics.data?.items.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select>
        <select className="input" value={f.company} onChange={(e) => set('company', e.target.value)} aria-label="Company"><option value="">All companies</option>{companies.data?.items.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select className="input" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value)} aria-label="Difficulty"><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)} aria-label="Status"><option value="">Any status</option><option value="unsolved">Unsolved</option><option value="attempted">Attempted</option><option value="solved">Solved</option></select>
        <select className="input" value={f.language} onChange={(e) => set('language', e.target.value)} aria-label="Language used"><option value="">Any language used</option><option value="java">Java</option><option value="python">Python</option><option value="cpp">C++</option><option value="c">C</option></select>
      </div>
      {list.loading ? <Spinner /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? <Empty>No problems match these filters.</Empty> : (
        <div className="space-y-2">{list.data.items.map((q) => (
          <Link key={q._id} to={`/coding/${q._id}`}><Card className="flex items-center justify-between gap-3 hover:border-brand-500"><div><h3 className="font-semibold">{q.subtopic}</h3><p className="muted">{label(q.topic)}</p></div>
            <div className="flex shrink-0 items-center gap-2">{q.userState.solved ? <Badge tone="green">Solved</Badge> : q.userState.attempted ? <Badge tone="amber">Attempted</Badge> : null}<Badge tone={q.difficulty === 'hard' ? 'red' : q.difficulty === 'medium' ? 'amber' : 'green'}>{q.difficulty}</Badge></div></Card></Link>))}
          <div className="flex items-center justify-between pt-2"><Btn variant="ghost" disabled={list.data.page <= 1} onClick={() => set('page', String(list.data.page - 1))}>Previous</Btn><span className="muted">{list.data.total} problems</span><Btn variant="ghost" disabled={list.data.page >= list.data.pages} onClick={() => set('page', String(list.data.page + 1))}>Next</Btn></div></div>)}
    </div>
  );
}
export function CodingProblem() {
  const { id } = useParams(); const { data, loading, error, reload } = useGet(`/coding/${id}`); const subs = useGet(`/coding/${id}/submissions`);
  const [lang, setLang] = useState('java'); const [code, setCode] = useState(''); const [self, setSelf] = useState('attempted'); const [msg, setMsg] = useState(''); const [err, setErr] = useState(null); const [rev, setRev] = useState(null); const [hint, setHint] = useState(0); const [bm, setBm] = useState(false); const [t0] = useState(Date.now());
  useEffect(() => { if (data) { setBm(!!data.question.userState?.bookmarked); if (data.lastSubmission) { setLang(data.lastSubmission.language); setCode(data.lastSubmission.code); } } }, [data]);
  if (loading) return <Spinner />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  const q = data.question; const c = q.coding;
  const save = async () => { setErr(null); setMsg(''); try { await api.post(`/coding/${id}/submissions`, { language: lang, code, selfStatus: self, timeSpentSec: Math.round((Date.now() - t0) / 1000) }); setMsg('Saved to your submission history. Your code was not executed.'); subs.reload(); } catch (e) { setErr(e); } };
  const reveal = async () => { try { setRev(await api.post(`/coding/${id}/reveal`)); } catch (e) { setErr(e); } };
  const flip = async () => { if (bm) await api.del(`/bookmarks/${id}`); else await api.post(`/bookmarks/${id}`); setBm(!bm); };
  return (
    <div className="space-y-4">
      <PageTitle title={q.subtopic} sub={`${label(q.topic)} · ${q.difficulty}`} right={<button className="rounded-lg p-2" onClick={flip} aria-label={bm ? 'Remove bookmark' : 'Bookmark'}>{bm ? <BookmarkCheck className="text-accent-500" /> : <Bookmark />}</button>} />
      <Card><p className="pre-wrap">{c.statement}</p>
        <h3 className="mt-3 text-sm font-semibold">Constraints</h3><ul className="list-disc pl-5 text-sm">{c.constraints.map((x) => <li key={x}>{x}</li>)}</ul>
        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><div><b>Input</b><p className="muted">{c.inputFormat}</p></div><div><b>Output</b><p className="muted">{c.outputFormat}</p></div></div>
        {c.examples.map((e, i) => <div key={i} className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><b>Example {i + 1}</b><pre className="mt-1 overflow-x-auto font-mono text-xs">{`Input:\n${e.input}\nOutput:\n${e.output}`}</pre>{e.explanation && <p className="muted mt-1">{e.explanation}</p>}</div>)}</Card>
      <Card><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-accent-500" />Hints</h3>{hint < c.hints.length && <Btn variant="ghost" onClick={() => setHint(hint + 1)}>Show hint {hint + 1}</Btn>}</div>
        {hint === 0 ? <p className="muted mt-1">Try the problem first. Hints reveal one at a time.</p> : <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{c.hints.slice(0, hint).map((h) => <li key={h}>{h}</li>)}</ol>}</Card>
      <Card><div className="mb-2 flex flex-wrap gap-2"><select className="input w-auto" value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language"><option value="java">Java</option><option value="python">Python</option><option value="cpp">C++</option><option value="c">C</option></select>
        <select className="input w-auto" value={self} onChange={(e) => setSelf(e.target.value)} aria-label="My result"><option value="attempted">I attempted it</option><option value="solved">I solved it</option><option value="needs_revision">Needs revision</option></select></div>
        <textarea className="input min-h-[240px] font-mono text-xs" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} placeholder="// Write your solution here. It is saved, not executed." aria-label="Code editor" />
        <div className="mt-2"><ErrorBox error={err} /></div>
        <div className="mt-3 flex flex-wrap gap-2"><Btn onClick={save} disabled={!code.trim()}>Save submission</Btn><Btn variant="ghost" onClick={reveal}>Show reference solution</Btn></div>{msg && <p className="muted mt-2" role="status">{msg}</p>}</Card>
      {rev && <Card><h3 className="font-semibold">Reference solution and analysis</h3><p className="pre-wrap mt-1 text-sm">{rev.explanation}</p><p className="muted mt-1">Complexity: {rev.complexity}</p>
        <h4 className="mt-3 text-sm font-semibold">Edge cases</h4><ul className="list-disc pl-5 text-sm">{rev.edgeCases.map((x) => <li key={x}>{x}</li>)}</ul>
        {['java', 'python'].map((l) => <div key={l} className="mt-3"><b className="text-sm">{label(l)}</b><pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{rev.referenceSolutions[l]}</pre></div>)}</Card>}
      {subs.data?.items.length > 0 && <Card><h3 className="mb-2 font-semibold">Submission history</h3><ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">{subs.data.items.map((s) => <li key={s._id} className="flex items-center justify-between py-2"><span>{new Date(s.createdAt).toLocaleString()} · {label(s.language)}</span><Badge tone={s.selfStatus === 'solved' ? 'green' : 'amber'}>{label(s.selfStatus)}</Badge></li>)}</ul></Card>}
    </div>
  );
}
