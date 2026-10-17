import { useSearchParams, Link } from 'react-router-dom';
import { useGet } from '../lib/useApi';
import { qs } from '../lib/api';
import { Spinner, ErrorBox, PageTitle, Empty, Btn } from '../components/ui';
import QuestionCard from '../components/QuestionCard';
import { SUBJECTS, label } from '../lib/format';

export default function Practice() {
  const [sp, setSp] = useSearchParams();
  const f = { company: sp.get('company') || '', subject: sp.get('subject') || '', topic: sp.get('topic') || '', difficulty: sp.get('difficulty') || '', status: sp.get('status') || '', bookmarked: sp.get('bookmarked') || '', q: sp.get('q') || '', page: sp.get('page') || '1' };
  const meta = useGet('/questions/meta'); const companies = useGet('/companies');
  const list = useGet(`/questions${qs({ ...f, limit: 10 })}`);
  const set = (k, v) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k !== 'page') n.delete('page'); if (k === 'subject') n.delete('topic'); setSp(n); };
  const topics = f.subject && meta.data ? Object.keys(meta.data.subjects[f.subject]?.topics || {}).sort() : [];
  const practiceSubjects = SUBJECTS.filter(([k]) => !['coding', 'sql'].includes(k));
  return (
    <div>
      <PageTitle title="Practice" sub="Topic-wise questions with explanations. Answers are checked on the server." />
      <div className="card mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input sm:col-span-2" placeholder="Search questions…" value={f.q} onChange={(e) => set('q', e.target.value)} aria-label="Search" />
        <select className="input" value={f.subject} onChange={(e) => set('subject', e.target.value)} aria-label="Subject"><option value="">All subjects</option>{practiceSubjects.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        <select className="input" value={f.topic} onChange={(e) => set('topic', e.target.value)} disabled={!f.subject} aria-label="Topic"><option value="">All topics</option>{topics.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select>
        <select className="input" value={f.company} onChange={(e) => set('company', e.target.value)} aria-label="Company"><option value="">All companies</option>{companies.data?.items.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select className="input" value={f.difficulty} onChange={(e) => set('difficulty', e.target.value)} aria-label="Difficulty"><option value="">Any difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
        <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)} aria-label="Status"><option value="">Any status</option><option value="unsolved">Unsolved</option><option value="solved">Solved</option><option value="incorrect">To revise (last wrong)</option></select>
        <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={f.bookmarked === 'true'} onChange={(e) => set('bookmarked', e.target.checked ? 'true' : '')} className="h-4 w-4" />Bookmarked only</label>
      </div>
      {f.topic && <p className="mb-3 text-sm"><Link className="text-brand-600" to={`/topics/${f.topic}`}>Read the concept, formulas and shortcuts for {label(f.topic)} →</Link></p>}
      {list.loading ? <Spinner /> : list.error ? <ErrorBox error={list.error} onRetry={list.reload} /> : list.data.items.length === 0 ? <Empty>No questions match these filters.</Empty> : (
        <div className="space-y-4">
          <p className="muted">{list.data.total} questions · page {list.data.page} of {list.data.pages}</p>
          {list.data.items.map((q) => <QuestionCard key={q._id} q={q} />)}
          <div className="flex items-center justify-between"><Btn variant="ghost" disabled={list.data.page <= 1} onClick={() => set('page', String(list.data.page - 1))}>Previous</Btn><Btn variant="ghost" disabled={list.data.page >= list.data.pages} onClick={() => set('page', String(list.data.page + 1))}>Next</Btn></div>
        </div>)}
    </div>
  );
}
