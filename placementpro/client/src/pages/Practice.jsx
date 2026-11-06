import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Filter,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RotateCcw,
  SlidersHorizontal,
  X,
  Loader2,
} from 'lucide-react';
import { useGet } from '../lib/useApi';
import { qs } from '../lib/api';
import {
  Spinner,
  ErrorBox,
  PageTitle,
  Empty,
  Btn,
  QuestionCardSkeleton,
} from '../components/ui';
import QuestionCard from '../components/QuestionCard';
import { MultiSelect, FilterChips } from '../components/MultiSelect';
import { SUBJECTS, label } from '../lib/format';

function parseArrayParam(val) {
  if (!val) return [];
  return String(val).split(',').map((s) => s.trim()).filter(Boolean);
}

export default function Practice() {
  const [sp, setSp] = useSearchParams();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Parse multi-select filter values from URL params
  const f = {
    company: parseArrayParam(sp.get('company')),
    subject: parseArrayParam(sp.get('subject')),
    topic: parseArrayParam(sp.get('topic')),
    difficulty: parseArrayParam(sp.get('difficulty')),
    status: parseArrayParam(sp.get('status')),
    bookmarked: sp.get('bookmarked') || '',
    q: sp.get('q') || '',
    page: sp.get('page') || '1',
  };

  const meta = useGet('/questions/meta');
  const companies = useGet('/companies');

  // Query string for backend questions endpoint
  const queryStr = qs({
    company: f.company,
    subject: f.subject,
    topic: f.topic,
    difficulty: f.difficulty,
    status: f.status,
    bookmarked: f.bookmarked,
    q: f.q,
    page: f.page,
    limit: 10,
  });

  const list = useGet(`/questions${queryStr}`);

  // General setter for updating filter state
  const setFilter = (key, val) => {
    const next = new URLSearchParams(sp);
    if (Array.isArray(val)) {
      if (val.length > 0) next.set(key, val.join(','));
      else next.delete(key);
    } else if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    if (key !== 'page') next.delete('page');
    setSp(next);
  };

  // Remove single filter item from active chips
  const removeFilterValue = (group, val) => {
    if (group === 'bookmarked') {
      setFilter('bookmarked', '');
    } else if (group === 'q') {
      setFilter('q', '');
    } else if (Array.isArray(f[group])) {
      setFilter(group, f[group].filter((x) => x !== val));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (f.status.includes('incorrect') && sp.get('status') === 'incorrect') {
      // keep revision status if opened via mistakes menu
    }
    setSp(next);
  };

  const practiceSubjects = SUBJECTS.filter(([k]) => !['coding', 'sql'].includes(k));

  // Compute available topics based on selected subjects
  const availableTopics = useMemo(() => {
    if (!meta.data?.subjects) return [];
    let topicsMap = {};
    if (f.subject.length > 0) {
      f.subject.forEach((s) => {
        const subTopics = meta.data.subjects[s]?.topics || {};
        topicsMap = { ...topicsMap, ...subTopics };
      });
    } else {
      Object.values(meta.data.subjects).forEach((s) => {
        topicsMap = { ...topicsMap, ...(s.topics || {}) };
      });
    }
    return Object.entries(topicsMap)
      .map(([slug, count]) => ({
        value: slug,
        label: label(slug),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [meta.data, f.subject]);

  const subjectOptions = practiceSubjects.map(([k, n]) => ({
    value: k,
    label: n,
    count: meta.data?.subjects?.[k]?.count,
  }));

  const companyOptions = (companies.data?.items || []).map((c) => ({
    value: c.slug,
    label: c.name,
  }));

  const difficultyOptions = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
  ];

  const statusOptions = [
    { value: 'unsolved', label: 'Unsolved' },
    { value: 'solved', label: 'Solved' },
    { value: 'incorrect', label: 'To Revise (Last Wrong)' },
  ];

  // Active filter chips list
  const activeChips = useMemo(() => {
    const chips = [];
    f.subject.forEach((s) => {
      const found = subjectOptions.find((o) => o.value === s);
      chips.push({ group: 'subject', groupLabel: 'Subject', value: s, label: found?.label || s });
    });
    f.topic.forEach((t) => {
      chips.push({ group: 'topic', groupLabel: 'Topic', value: t, label: label(t) });
    });
    f.difficulty.forEach((d) => {
      chips.push({ group: 'difficulty', groupLabel: 'Difficulty', value: d, label: d.toUpperCase() });
    });
    f.company.forEach((c) => {
      const found = companyOptions.find((o) => o.value === c);
      chips.push({ group: 'company', groupLabel: 'Company', value: c, label: found?.label || c.toUpperCase() });
    });
    f.status.forEach((st) => {
      const found = statusOptions.find((o) => o.value === st);
      chips.push({ group: 'status', groupLabel: 'Status', value: st, label: found?.label || st });
    });
    if (f.bookmarked === 'true') {
      chips.push({ group: 'bookmarked', groupLabel: 'Flag', value: 'true', label: 'Bookmarked' });
    }
    if (f.q) {
      chips.push({ group: 'q', groupLabel: 'Search', value: f.q, label: `"${f.q}"` });
    }
    return chips;
  }, [f, subjectOptions, companyOptions]);

  const isMistakesMode = f.status.includes('incorrect');
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
        right={
          <div className="flex items-center gap-2">
            {activeChips.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn btn-ghost !h-9 text-xs text-slate-500 hover:text-rose-600 dark:text-gray-400"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset filters
              </button>
            )}
            {/* Mobile Filter Drawer Button */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="sm:hidden btn btn-secondary !h-9 !px-3 text-xs flex items-center gap-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-sky-500" />
              <span>Filters {activeChips.length > 0 && `(${activeChips.length})`}</span>
            </button>
          </div>
        }
      />

      {/* Desktop / Tablet Filters Card */}
      <div className="card space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9 text-xs"
              placeholder="Search questions or keywords…"
              value={f.q}
              onChange={(e) => setFilter('q', e.target.value)}
              aria-label="Search questions"
            />
          </div>

          {/* Multi-Select: Subject */}
          <MultiSelect
            label="Subject"
            options={subjectOptions}
            selected={f.subject}
            onChange={(val) => setFilter('subject', val)}
          />

          {/* Multi-Select: Topic */}
          <MultiSelect
            label="Topic"
            options={availableTopics}
            selected={f.topic}
            onChange={(val) => setFilter('topic', val)}
          />

          {/* Multi-Select: Company */}
          <MultiSelect
            label="Company"
            options={companyOptions}
            selected={f.company}
            onChange={(val) => setFilter('company', val)}
          />

          {/* Multi-Select: Difficulty */}
          <MultiSelect
            label="Difficulty"
            options={difficultyOptions}
            selected={f.difficulty}
            onChange={(val) => setFilter('difficulty', val)}
          />
        </div>

        {/* Secondary Row: Status & Bookmark */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-gray-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-Select: Status */}
            <div className="w-44">
              <MultiSelect
                label="Status"
                options={statusOptions}
                selected={f.status}
                onChange={(val) => setFilter('status', val)}
              />
            </div>

            {/* Bookmarked Only Toggle */}
            <label className="flex min-h-[38px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              <input
                type="checkbox"
                checked={f.bookmarked === 'true'}
                onChange={(e) => setFilter('bookmarked', e.target.checked ? 'true' : '')}
                className="h-4 w-4 rounded accent-sky-600"
              />
              <Bookmark className="h-3.5 w-3.5 text-amber-500" />
              <span>Bookmarked only</span>
            </label>
          </div>

          {list.isFetching && !list.loading && (
            <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Updating results…</span>
            </div>
          )}
        </div>

        {/* Filter Chips Row */}
        <FilterChips
          chips={activeChips}
          onRemove={removeFilterValue}
          onClearAll={clearAllFilters}
        />

        {/* Selected Topic Shortcut Banner */}
        {f.topic.length === 1 && (
          <div className="flex items-center justify-between rounded-xl bg-sky-50/80 p-3 text-xs font-medium text-sky-950 dark:bg-sky-950/40 dark:text-sky-200">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>
                Want to revise formulas and shortcuts for <b>{label(f.topic[0])}</b>?
              </span>
            </div>
            <Link
              className="font-bold text-sky-600 hover:underline dark:text-sky-400"
              to={`/topics/${f.topic[0]}`}
            >
              Read Concepts →
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white p-5 shadow-2xl dark:bg-gray-900">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filter Questions</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-gray-300 block mb-1">Subject</label>
                <MultiSelect
                  label="Subject"
                  options={subjectOptions}
                  selected={f.subject}
                  onChange={(val) => setFilter('subject', val)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-gray-300 block mb-1">Topic</label>
                <MultiSelect
                  label="Topic"
                  options={availableTopics}
                  selected={f.topic}
                  onChange={(val) => setFilter('topic', val)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-gray-300 block mb-1">Company</label>
                <MultiSelect
                  label="Company"
                  options={companyOptions}
                  selected={f.company}
                  onChange={(val) => setFilter('company', val)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-gray-300 block mb-1">Difficulty</label>
                <MultiSelect
                  label="Difficulty"
                  options={difficultyOptions}
                  selected={f.difficulty}
                  onChange={(val) => setFilter('difficulty', val)}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-gray-300 block mb-1">Status</label>
                <MultiSelect
                  label="Status"
                  options={statusOptions}
                  selected={f.status}
                  onChange={(val) => setFilter('status', val)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-gray-800 flex items-center gap-2">
              <button
                type="button"
                onClick={clearAllFilters}
                className="btn btn-ghost w-1/2 text-xs"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="btn btn-primary w-1/2 text-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Results List */}
      {list.loading && !list.data ? (
        <div className="space-y-4">
          <QuestionCardSkeleton />
          <QuestionCardSkeleton />
          <QuestionCardSkeleton />
        </div>
      ) : list.error ? (
        <ErrorBox error={list.error} onRetry={list.reload} />
      ) : !list.data?.items || list.data.items.length === 0 ? (
        <Empty icon={BookOpen} title="No questions match these filters">
          Try clearing some filters or searching with different terms.
        </Empty>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
            <span>
              Showing <b>{list.data.total}</b> questions matching your filters
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
          {list.data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200/80 pt-4 dark:border-gray-800">
              <Btn
                variant="ghost"
                size="sm"
                disabled={list.data.page <= 1 || list.isFetching}
                onClick={() => setFilter('page', String(list.data.page - 1))}
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
                disabled={list.data.page >= list.data.pages || list.isFetching}
                onClick={() => setFilter('page', String(list.data.page + 1))}
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Btn>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
