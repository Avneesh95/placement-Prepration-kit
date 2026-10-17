import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Clock, Building2, BookOpen, Timer, ChevronRight, Layers } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { Card, Badge, Spinner, ErrorBox, PageTitle, Disclaimer, Empty, Btn } from '../components/ui';
import { label, SUBJECTS } from '../lib/format';

export function Companies() {
  const { data, loading, error, reload } = useGet('/companies');

  if (loading) return <Spinner label="Loading company recruitment tracks…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageTitle
        title="Company Preparation"
        sub="Targeted preparation templates, syllabus patterns, and practice tracks for top IT & product recruiters."
      />

      <Disclaimer>
        Company patterns here are <b>preparation templates</b> based on historical recruitment formats. None has been verified against an official 2027 notification yet. Always confirm specific requirements on the official careers portal.
      </Disclaimer>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((c) => (
          <Link key={c.slug} to={`/companies/${c.slug}`}>
            <Card hover className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-xs font-extrabold text-white shadow-sm">
                      {c.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </h2>
                      <span className="text-[11px] text-slate-500 dark:text-gray-400">
                        Fresher Track
                      </span>
                    </div>
                  </div>
                  <Badge tone="amber">Template</Badge>
                </div>
                <p className="muted mt-3 text-xs leading-relaxed line-clamp-2">{c.tagline}</p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-gray-800 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span>{c.questionCount} questions</span>
                  <span>·</span>
                  <span>{c.mockCount} mocks</span>
                </div>
                <span className="font-semibold text-brand-600 dark:text-brand-400">View →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

const TABS = ['Overview', 'Pattern', 'Priorities', 'Practice', 'Mocks', 'Interview', 'Revision'];

export function CompanyDetail() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useGet(`/companies/${slug}`);
  const [tab, setTab] = useState('Overview');

  if (loading) return <Spinner label="Loading company track details…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const { company: c, patterns, mocks, questionCounts } = data;
  const p = patterns[0];

  return (
    <div className="space-y-6">
      <PageTitle
        breadcrumb="Company Track"
        title={c.name}
        sub={c.tagline}
        right={
          <Link to={`/mocks?company=${c.slug}`}>
            <Btn size="sm">
              <Timer className="h-4 w-4" />
              <span>Take {c.name} Mock</span>
            </Btn>
          </Link>
        }
      />

      {/* Modern Tabs */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2 border-b border-slate-200 pb-2 dark:border-gray-800" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                tab === t
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800'
              } border border-slate-200/80 dark:border-gray-700/80`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {p && p.status === 'preparation_template' && (
        <Disclaimer>
          <b>Preparation template — not verified.</b> {p.disclaimer} Verification date:{' '}
          <b>{p.dateVerified ? new Date(p.dateVerified).toLocaleDateString() : 'not verified'}</b> ·
          Confidence: <b>{p.confidence}</b>.
        </Disclaimer>
      )}

      {/* Tab 1: Overview */}
      {tab === 'Overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="mb-2.5 text-sm font-bold text-slate-900 dark:text-white">
              Target Roles & Bands
            </h2>
            <ul className="space-y-2 text-xs">
              {c.roles.map((r) => (
                <li key={r.name} className="rounded-xl bg-slate-50 p-2.5 dark:bg-gray-800/50">
                  <span className="font-bold text-slate-900 dark:text-white">{r.name}</span>
                  <p className="muted mt-0.5">{r.note}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-2.5 text-sm font-bold text-slate-900 dark:text-white">
              Typical Eligibility Criteria
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-xs text-slate-700 dark:text-gray-300">
              {c.eligibility.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="mb-2.5 text-sm font-bold text-slate-900 dark:text-white">
              Recruitment Stages
            </h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-700 dark:text-gray-300">
              {c.stages.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ol>
          </Card>

          <Card>
            <h2 className="mb-2.5 text-sm font-bold text-slate-900 dark:text-white">
              Official Reference Sources
            </h2>
            {c.officialLinks.length ? (
              <div className="space-y-2">
                {c.officialLinks.map((l) => (
                  <a
                    key={l.url}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span>{l.label}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted text-xs">
                No single official source: this is an aggregated pattern template.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Pattern */}
      {tab === 'Pattern' &&
        (p ? (
          <div className="space-y-4">
            <Card>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{p.track}</h2>
              <p className="muted mt-1 text-xs">{p.summary}</p>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {p.sections.map((s) => (
                <Card key={s.name}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{s.name}</h3>
                    <Badge tone="blue">{label(s.subject)}</Badge>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-700 dark:text-gray-300">
                    {s.topics.map(label).join(' · ')}
                  </p>
                  <p className="muted mt-1 text-xs">{s.notes}</p>
                </Card>
              ))}
            </div>

            <Card>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Marking & Scoring Notes</h3>
              <p className="muted mt-1 text-xs">{p.scoringNotes}</p>
            </Card>
          </div>
        ) : (
          <Empty title="No pattern recorded">Check back soon as recruitment notifications are published.</Empty>
        ))}

      {/* Tab 3: Priorities */}
      {tab === 'Priorities' &&
        (p ? (
          <div className="space-y-4">
            <Disclaimer>
              Priorities are qualitative study guidance. A percentage is shown only when a documented sample of assessments exists, and it describes that sample, not your exam.
            </Disclaimer>

            <div className="grid gap-3 sm:grid-cols-2">
              {p.priorities.map((x) => (
                <Card key={x.topic} className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{label(x.topic)}</h3>
                        <span className="text-[11px] text-slate-500">{label(x.subject)}</span>
                      </div>
                      <Badge tone={x.level === 'High' ? 'orange' : x.level === 'Medium' ? 'blue' : 'slate'}>
                        {x.level} Priority
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-slate-700 dark:text-gray-300">{x.reason}</p>
                    <p className="muted mt-1 text-xs">{x.observedFrequency ? x.observedFrequency.note : x.evidenceNote}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-gray-800">
                    <span>~{x.recommendedPracticeCount} Qs ({x.estimatedPrepHours} h)</span>
                    <Link
                      className="font-bold text-brand-600 dark:text-brand-400"
                      to={`/practice?company=${c.slug}&subject=${x.subject}&topic=${x.topic}`}
                    >
                      Practise →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Empty title="No priorities recorded">Check other tabs for preparation content.</Empty>
        ))}

      {/* Tab 4: Practice */}
      {tab === 'Practice' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map(([k, name]) => (
            <Link
              key={k}
              to={
                k === 'coding'
                  ? `/coding?company=${c.slug}`
                  : k === 'sql'
                  ? '/sql'
                  : `/practice?company=${c.slug}&subject=${k}`
              }
            >
              <Card hover className="h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{name}</h3>
                    <p className="muted mt-0.5 text-xs">{questionCounts[k] || 0} questions available</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Tab 5: Mocks */}
      {tab === 'Mocks' &&
        (mocks.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {mocks.map((m) => (
              <Link key={m.slug} to={`/mocks/${m.slug}`}>
                <Card hover className="h-full flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{m.title}</h3>
                    <p className="muted mt-1 text-xs">{m.totalDurationMin} min · {m.sectionTimed ? 'Section timed' : 'Flexible timing'}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-brand-600 dark:border-gray-800 dark:text-brand-400">
                    <span>Take Full Mock</span>
                    <span>→</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Empty title="No company mocks yet">Full-length mocks will appear here soon.</Empty>
        ))}

      {/* Tab 6: Interview */}
      {tab === 'Interview' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {c.technicalInterview.map((t) => (
              <Card key={t.topic}>
                <h3 className="font-bold text-slate-900 dark:text-white">{t.topic}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-700 dark:text-gray-300">
                  {t.points.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
          <Card>
            <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">HR & Behavioral Questions</h2>
            <div className="space-y-3">
              {c.hrQuestions.map((h) => (
                <div key={h.q} className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-gray-800/50">
                  <b className="text-slate-900 dark:text-white">{h.q}</b>
                  <p className="muted mt-1">{h.tip}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 7: Revision */}
      {tab === 'Revision' && (
        <Card>
          <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Last-Minute Revision Checklist</h2>
          <ul className="list-disc space-y-2 pl-5 text-xs text-slate-700 dark:text-gray-300">
            {c.lastMinute.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
