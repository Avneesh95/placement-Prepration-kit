import { useSearchParams, Link } from 'react-router-dom';
import { Search, Sparkles, Filter, Bookmark, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { qs } from '../lib/api';
import { Spinner, ErrorBox, PageTitle, Empty, Btn, Badge } from '../components/ui';
import QuestionCard from '../components/QuestionCard';
import { SUBJECTS, label } from '../lib/format';

export default function Practice() {
  const [sp, setSp] = useSearchParams();
  const f = {
    company: sp.get('company') || '',
    subject: sp.get('subject') || '',
    topic: sp.get('topic') || '',
    difficulty: sp.get('difficulty') || '',
    status: sp.get('status') || '',
    bookmarked: sp.get('bookmarked') || '',
    q: sp.get('q') || '',
    page: sp.get('page') || '1',
  };

  const meta = useGet('/questions/meta');
  const companies = useGet('/companies');
  const list = useGet(`/questions${qs({ ...f, limit: 10 })}`);

  const set = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== 'page') n.delete('page');
    if (k === 'subject') n.delete('topic');
    setSp(n);
  };

  const topics =
    f.subject && meta.data ? Object.keys(meta.data.subjects[f.subject]?.topics || {}).sort() : [];
  const practiceSubjects = SUBJECTS.filter(([k]) => !['coding', 'sql'].includes(k));

  const isMistakesMode = f.status === 'incorrect';
  const isBookmarksMode = f.bookmarked === 'true';

  return (
    <div className="space-y-6">
      <PageTitle
        breadcrumb={isMistakesMode ? 'Revision' : isBookmarksMode ? 'Saved' : 'Practice Bank'}
        title={
          isMistakesMode
            ? 'Mistakes & Revision'
            : isBookmarksMode
            ? 'Bookmarked Questions'
            : 'Practice Questions'
        }
        sub={
          isMistakesMode
            ? 'Review and re-attempt questions you previously answered incorrectly.'
            : isBookmarksMode
            ? 'All questions you have flagged for extra practice and revision.'
            : 'Topic-wise practice questions with instant server verification and detailed step-by-step solutions.'
        }
      />

      {/* Modern Filter Card */}
      <div className="card space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 text-xs"
              placeholder="Search questions or keywords…"
              value={f.q}
              onChange={(e) => set('q', e.target.value)}
              aria-label="Search questions"
            />
          </div>

          <select
            className="input text-xs"
            value={f.subject}
            onChange={(e) => set('subject', e.target.value)}
            aria-label="Subject"
          >
            <option value="">All Subjects</option>
            {practiceSubjects.map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>

          <select
            className="input text-xs"
            value={f.topic}
            onChange={(e) => set('topic', e.target.value)}
            disabled={!f.subject}
            aria-label="Topic"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>

          <select
            className="input text-xs"
            value={f.company}
            onChange={(e) => set('company', e.target.value)}
            aria-label="Company"
          >
            <option value="">All Companies</option>
            {companies.data?.items.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input text-xs"
            value={f.difficulty}
            onChange={(e) => set('difficulty', e.target.value)}
            aria-label="Difficulty"
          >
            <option value="">Any Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            className="input text-xs"
            value={f.status}
            onChange={(e) => set('status', e.target.value)}
            aria-label="Status"
          >
            <option value="">Any Status</option>
            <option value="unsolved">Unsolved</option>
            <option value="solved">Solved</option>
            <option value="incorrect">To Revise (Last Wrong)</option>
          </select>

          <label className="flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
            <input
              type="checkbox"
              checked={f.bookmarked === 'true'}
              onChange={(e) => set('bookmarked', e.target.checked ? 'true' : '')}
              className="h-4 w-4 rounded accent-brand-600"
            />
            <Bookmark className="h-3.5 w-3.5 text-amber-500" />
            <span>Bookmarked only</span>
          </label>
        </div>

        {/* Selected Topic Shortcut Banner */}
        {f.topic && (
          <div className="flex items-center justify-between rounded-xl bg-brand-50/80 p-3 text-xs font-medium text-brand-900 dark:bg-brand-950/40 dark:text-brand-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <span>
                Want to revise formulas and shortcuts for <b>{label(f.topic)}</b>?
              </span>
            </div>
            <Link
              className="font-bold text-brand-600 hover:underline dark:text-brand-400"
              to={`/topics/${f.topic}`}
            >
              Read Concepts →
            </Link>
          </div>
        )}
      </div>

      {/* Question Results List */}
      {list.loading ? (
        <Spinner label="Loading questions…" />
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.reload} />
      ) : list.data.items.length === 0 ? (
        <Empty icon={BookOpen} title="No questions match these filters">
          Try clearing some filters or searching with different terms.
        </Empty>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
            <span>
              Showing <b>{list.data.total}</b> questions
            </span>
            <span>
              Page {list.data.page} of {list.data.pages}
            </span>
          </div>

          <div className="space-y-4">
            {list.data.items.map((q) => (
              <QuestionCard key={q._id} q={q} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-gray-800">
            <Btn
              variant="ghost"
              size="sm"
              disabled={list.data.page <= 1}
              onClick={() => set('page', String(list.data.page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </Btn>
            <span className="text-xs font-semibold text-slate-600 dark:text-gray-300">
              Page {list.data.page} of {list.data.pages}
            </span>
            <Btn
              variant="ghost"
              size="sm"
              disabled={list.data.page >= list.data.pages}
              onClick={() => set('page', String(list.data.page + 1))}
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
