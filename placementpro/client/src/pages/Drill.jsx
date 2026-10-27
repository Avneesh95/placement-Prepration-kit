import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Target,
  Play,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Flame,
  Award,
  Layers,
} from 'lucide-react';
import { useGet } from '../lib/useApi';
import { api } from '../lib/api';
import { PageTitle, Card, Badge, Btn, Spinner, ErrorBox, Empty } from '../components/ui';
import { label, SUBJECTS } from '../lib/format';

export default function Drill() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();

  const selectedCompany = sp.get('company') || 'all';
  const selectedSubject = sp.get('subject') || 'all';

  const [mode, setMode] = useState('quick');
  const [questionCount, setQuestionCount] = useState(10);
  const [isTimed, setIsTimed] = useState(true);
  const [durationMin, setDurationMin] = useState(15);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('any');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const [expandedSubject, setExpandedSubject] = useState(null);

  const companies = useGet('/companies');
  const syllabusData = useGet(`/drill/syllabus?company=${selectedCompany}`);

  const handleStartDrill = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const payload = {
        company: selectedCompany !== 'all' ? selectedCompany : undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        topic: selectedTopic !== 'all' ? selectedTopic : undefined,
        difficulty: selectedDifficulty !== 'any' ? selectedDifficulty : undefined,
        mode,
        count: Number(questionCount),
        timed: isTimed,
        durationMin: Number(durationMin),
      };

      // Navigate to Practice with custom filter query params for seamless unified execution
      const queryParams = new URLSearchParams();
      if (payload.company) queryParams.set('company', payload.company);
      if (payload.subject) queryParams.set('subject', payload.subject);
      if (payload.topic) queryParams.set('topic', payload.topic);
      if (payload.difficulty) queryParams.set('difficulty', payload.difficulty);
      if (mode === 'incorrect') queryParams.set('status', 'incorrect');
      if (mode === 'bookmarked') queryParams.set('bookmarked', 'true');
      
      nav(`/practice?${queryParams.toString()}`);
    } catch (err) {
      setStartError(err.message || 'Failed to start practice drill.');
    } finally {
      setStarting(false);
    }
  };

  const filteredSyllabus = (syllabusData.data?.syllabus || []).filter((item) => {
    if (selectedSubject !== 'all' && item.subject !== selectedSubject) return false;
    return true;
  });

  // Group syllabus by subject
  const syllabusBySubject = filteredSyllabus.reduce((acc, item) => {
    acc[item.subject] = acc[item.subject] || [];
    acc[item.subject].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageTitle
        breadcrumb="Drill Arena"
        title="Drill Engine & Syllabus Explorer"
        sub="Master the exact syllabus topic-by-topic with real database question metrics, exam-pressure timer modes, and customized drills."
      />

      {/* Top Configuration & Launch Control */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-gray-100">
                  Custom Drill Generator
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-gray-400">
                  Select your practice parameters and launch an immediate targeted session.
                </p>
              </div>
            </div>
            <Badge tone="blue">Instant Launch</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Target Company
              </label>
              <select
                className="input text-xs"
                value={selectedCompany}
                onChange={(e) => {
                  const n = new URLSearchParams(sp);
                  if (e.target.value !== 'all') n.set('company', e.target.value);
                  else n.delete('company');
                  setSp(n);
                }}
              >
                <option value="all">All Companies / General</option>
                {companies.data?.items?.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Subject
              </label>
              <select
                className="input text-xs"
                value={selectedSubject}
                onChange={(e) => {
                  const n = new URLSearchParams(sp);
                  if (e.target.value !== 'all') n.set('subject', e.target.value);
                  else n.delete('subject');
                  setSp(n);
                  setSelectedTopic('all');
                }}
              >
                <option value="all">All Subjects</option>
                {SUBJECTS.filter(([s]) => !['coding', 'sql'].includes(s)).map(([s, n]) => (
                  <option key={s} value={s}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Drill Mode
              </label>
              <select
                className="input text-xs"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="quick">⚡ Quick Practice (Mixed)</option>
                <option value="topic">🎯 Topic-Wise Focus</option>
                <option value="weak">🔥 Weak-Area Drill (Past Mistakes)</option>
                <option value="incorrect">↺ Mistakes Revision</option>
                <option value="bookmarked">⭐ Bookmarked Only</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Difficulty
              </label>
              <select
                className="input text-xs"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                <option value="any">Any Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Number of Questions: {questionCount}
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5</span>
                <span>15</span>
                <span>30</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-gray-300">
                Timed Practice Mode
              </label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isTimed}
                    onChange={(e) => setIsTimed(e.target.checked)}
                    className="rounded accent-sky-600"
                  />
                  <span>Enable countdown ({durationMin} min)</span>
                </label>
              </div>
            </div>
          </div>

          {startError && <ErrorBox error={startError} />}

          <div className="pt-2">
            <Btn
              onClick={handleStartDrill}
              disabled={starting}
              className="w-full justify-center !py-2.5 !text-sm !font-bold"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>Launch Practice Drill Now</span>
            </Btn>
          </div>
        </Card>

        {/* Quick Launch Shortcuts */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-500/10 via-white to-sky-500/5 p-4 dark:border-sky-900/30 dark:from-sky-950/40 dark:via-gray-900 dark:to-sky-950/20">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Sparkles className="h-4 w-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Quick Drills</h4>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-gray-400">
              High-impact targeted sessions ready in one click:
            </p>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => nav('/practice?difficulty=hard')}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-left text-xs font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50/50 dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200"
              >
                <span>🔥 Advanced High-Difficulty Drill</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => nav('/practice?status=incorrect')}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-left text-xs font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50/50 dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200"
              >
                <span>↺ Re-attempt Weak Questions</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => nav('/coding')}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-white p-2.5 text-left text-xs font-semibold text-slate-800 shadow-sm transition hover:border-sky-300 hover:bg-sky-50/50 dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200"
              >
                <span>💻 LeetCode Top 25 Challenge Arena</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs dark:border-gray-800 dark:bg-gray-900">
            <h4 className="font-bold text-slate-900 dark:text-gray-100">Syllabus Coverage Summary</h4>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Active Syllabus Topics:</span>
                <span className="font-bold text-slate-900 dark:text-gray-100">
                  {syllabusData.data?.totalTopics || 0}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-gray-400">
                <span>Company Scope:</span>
                <span className="font-bold uppercase text-sky-600 dark:text-sky-400">
                  {selectedCompany}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hierarchical Syllabus Explorer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-gray-100">
              Interactive Syllabus Explorer
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-gray-400">
            Click any topic to view formulas or launch direct drills
          </span>
        </div>

        {syllabusData.loading ? (
          <Spinner label="Loading full syllabus and question counts…" />
        ) : syllabusData.error ? (
          <ErrorBox error={syllabusData.error} onRetry={syllabusData.reload} />
        ) : Object.keys(syllabusBySubject).length === 0 ? (
          <Empty title="No syllabus topics match the selected company" />
        ) : (
          <div className="space-y-4">
            {Object.entries(syllabusBySubject).map(([sub, topicsList]) => (
              <div
                key={sub}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-subtle dark:border-gray-800 dark:bg-gray-900"
              >
                <div
                  className="flex cursor-pointer items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 hover:bg-slate-100/60 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:bg-gray-800/70"
                  onClick={() =>
                    setExpandedSubject(expandedSubject === sub ? null : sub)
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-sky-500/10 px-2 py-0.5 text-xs font-bold uppercase text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                      {label(sub)}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-gray-100">
                      {topicsList.length} Topics
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      expandedSubject === sub ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                <div className="divide-y divide-slate-100 p-2 dark:divide-gray-800">
                  {topicsList.map((t) => (
                    <div
                      key={t.slug}
                      className="flex flex-col justify-between gap-3 p-3 transition hover:bg-slate-50/50 sm:flex-row sm:items-center dark:hover:bg-gray-800/40"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-gray-100">
                            {t.name}
                          </h5>
                          {t.completed && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="h-3 w-3" /> Mastered
                            </span>
                          )}
                          {t.started && !t.completed && (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed">
                          {t.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-gray-400">
                          <span>
                            Available: <b>{t.totalQuestions}</b>
                          </span>
                          <span>•</span>
                          <span>
                            Attempted: <b>{t.attempted}</b>
                          </span>
                          <span>•</span>
                          <span>
                            Solved: <b>{t.solved}</b>
                          </span>
                          {t.attempted > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                Accuracy: {t.accuracy}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => nav(`/topics/${t.slug}`)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                          Formulas
                        </button>
                        <Btn
                          size="sm"
                          onClick={() =>
                            nav(
                              `/practice?subject=${t.subject}&topic=${t.slug}${
                                selectedCompany !== 'all' ? `&company=${selectedCompany}` : ''
                              }`
                            )
                          }
                        >
                          Practice Topic
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
