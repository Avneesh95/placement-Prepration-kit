import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Clock } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { Card, Badge, Spinner, ErrorBox, PageTitle, Disclaimer, Empty } from '../components/ui';
import { label, SUBJECTS } from '../lib/format';

export function Companies() {
  const { data, loading, error, reload } = useGet('/companies');
  if (loading) return <Spinner />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  return (
    <div>
      <PageTitle title="Companies" sub="Separate preparation space for each recruiter." />
      <Disclaimer>Company patterns here are <b>preparation templates</b> based on historical formats. None has been verified against a 2027 notification. Always confirm on the official careers page.</Disclaimer>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((c) => (
          <Link key={c.slug} to={`/companies/${c.slug}`}><Card className="h-full transition hover:border-brand-500">
            <div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{c.name}</h2><Badge tone="amber">Template</Badge></div>
            <p className="muted mt-1">{c.tagline}</p>
            <div className="mt-3 flex gap-2 text-xs text-slate-500"><span>{c.questionCount} questions</span>·<span>{c.mockCount} mock tests</span></div>
          </Card></Link>))}
      </div>
    </div>
  );
}
const TABS = ['Overview', 'Pattern', 'Priorities', 'Practice', 'Mocks', 'Interview', 'Revision'];
export function CompanyDetail() {
  const { slug } = useParams(); const { data, loading, error, reload } = useGet(`/companies/${slug}`); const [tab, setTab] = useState('Overview');
  if (loading) return <Spinner />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { company: c, patterns, mocks, questionCounts } = data; const p = patterns[0];
  return (
    <div>
      <PageTitle title={c.name} sub={c.tagline} />
      <div className="-mx-4 mb-4 overflow-x-auto px-4"><div className="flex gap-2" role="tablist">{TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'} border border-slate-200 dark:border-slate-800`}>{t}</button>)}</div></div>
      {p && p.status === 'preparation_template' && <div className="mb-4"><Disclaimer><b>Preparation template — not verified.</b> {p.disclaimer} Verification date: <b>{p.dateVerified ? new Date(p.dateVerified).toLocaleDateString() : 'not verified'}</b> · Confidence: <b>{p.confidence}</b>.</Disclaimer></div>}
      {tab === 'Overview' && <div className="grid gap-4 md:grid-cols-2">
        <Card><h2 className="mb-2 font-semibold">Roles</h2><ul className="space-y-1 text-sm">{c.roles.map((r) => <li key={r.name}><b>{r.name}</b> — <span className="muted">{r.note}</span></li>)}</ul></Card>
        <Card><h2 className="mb-2 font-semibold">Eligibility</h2><ul className="list-disc space-y-1 pl-5 text-sm">{c.eligibility.map((e) => <li key={e}>{e}</li>)}</ul></Card>
        <Card><h2 className="mb-2 font-semibold">Recruitment stages</h2><ol className="list-decimal space-y-1 pl-5 text-sm">{c.stages.map((e) => <li key={e}>{e}</li>)}</ol></Card>
        <Card><h2 className="mb-2 font-semibold">Official sources</h2>{c.officialLinks.length ? c.officialLinks.map((l) => <a key={l.url} className="flex items-center gap-1 text-sm text-brand-600" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}<ExternalLink className="h-3 w-3" /></a>) : <p className="muted">No single official source: this is a general template.</p>}</Card>
      </div>}
      {tab === 'Pattern' && (p ? <div className="space-y-3"><Card><h2 className="font-semibold">{p.track}</h2><p className="muted mt-1">{p.summary}</p></Card>
        {p.sections.map((s) => <Card key={s.name}><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{s.name}</h3><Badge tone="blue">{label(s.subject)}</Badge></div><p className="mt-1 text-sm">{s.topics.map(label).join(' · ')}</p><p className="muted mt-1">{s.notes}</p></Card>)}
        <Card><h3 className="font-semibold">Scoring</h3><p className="muted mt-1">{p.scoringNotes}</p></Card></div> : <Empty>No pattern recorded.</Empty>)}
      {tab === 'Priorities' && (p ? <div className="space-y-3"><Disclaimer>Priorities are qualitative study guidance. A percentage is shown only when a documented sample of assessments exists, and it describes that sample, not your exam.</Disclaimer>
        {p.priorities.map((x) => <Card key={x.topic}><div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{label(x.topic)}</h3><Badge tone="slate">{label(x.subject)}</Badge></div><Badge tone={x.level === 'High' ? 'orange' : x.level === 'Medium' ? 'blue' : 'slate'}>{x.level}</Badge></div>
          <p className="mt-2 text-sm">{x.reason}</p>
          <p className="muted mt-1">{x.observedFrequency ? x.observedFrequency.note : x.evidenceNote}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span>Practise ~{x.recommendedPracticeCount} questions</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />~{x.estimatedPrepHours} h</span><span>Last verified: {x.lastVerified ? new Date(x.lastVerified).toLocaleDateString() : 'never'}</span>
            <Link className="font-semibold text-brand-600" to={`/practice?company=${c.slug}&subject=${x.subject}&topic=${x.topic}`}>Practise →</Link></div></Card>)}</div> : <Empty>No priorities recorded.</Empty>)}
      {tab === 'Practice' && <div className="grid gap-3 sm:grid-cols-2">{SUBJECTS.map(([k, name]) => <Link key={k} to={k === 'coding' ? `/coding?company=${c.slug}` : k === 'sql' ? '/sql' : `/practice?company=${c.slug}&subject=${k}`}><Card className="hover:border-brand-500"><div className="flex justify-between"><b>{name}</b><span className="muted">{questionCounts[k]} questions</span></div></Card></Link>)}</div>}
      {tab === 'Mocks' && (mocks.length ? <div className="grid gap-3 sm:grid-cols-2">{mocks.map((m) => <Link key={m.slug} to={`/mocks/${m.slug}`}><Card className="h-full hover:border-brand-500"><h3 className="font-semibold">{m.title}</h3><p className="muted mt-1">{m.totalDurationMin} min{m.sectionTimed ? ' · section timed' : ''}</p></Card></Link>)}</div> : <Empty>No mocks yet.</Empty>)}
      {tab === 'Interview' && <div className="space-y-3">{c.technicalInterview.map((t) => <Card key={t.topic}><h3 className="font-semibold">{t.topic}</h3><ul className="mt-1 list-disc pl-5 text-sm">{t.points.map((x) => <li key={x}>{x}</li>)}</ul></Card>)}
        <h2 className="pt-2 font-semibold">HR questions</h2>{c.hrQuestions.map((h) => <Card key={h.q}><b>{h.q}</b><p className="muted mt-1">{h.tip}</p></Card>)}</div>}
      {tab === 'Revision' && <Card><h2 className="mb-2 font-semibold">Last-minute revision guide</h2><ul className="list-disc space-y-1 pl-5 text-sm">{c.lastMinute.map((x) => <li key={x}>{x}</li>)}</ul></Card>}
    </div>
  );
}
