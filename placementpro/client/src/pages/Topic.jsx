import { useParams, Link } from 'react-router-dom';
import { useGet } from '../lib/useApi';
import { Card, Spinner, ErrorBox, PageTitle, Badge } from '../components/ui';
export default function Topic() {
  const { slug } = useParams(); const { data, loading, error, reload } = useGet(`/topics/${slug}`);
  if (loading) return <Spinner />; if (error) return <ErrorBox error={error} onRetry={reload} />;
  const { topic: t, solvedExamples } = data;
  return (
    <div className="space-y-4">
      <PageTitle title={t.name} sub={t.concept} right={<Link to={`/practice?subject=${t.subject}&topic=${t.slug}`} className="btn btn-primary">Practise</Link>} />
      {t.formulas.length > 0 && <Card><h2 className="mb-2 font-semibold">Formulas and rules</h2><ul className="list-disc space-y-1 pl-5 text-sm">{t.formulas.map((x) => <li key={x}>{x}</li>)}</ul></Card>}
      {t.shortcuts.length > 0 && <Card><h2 className="mb-2 font-semibold">Shortcuts</h2><ul className="list-disc space-y-1 pl-5 text-sm">{t.shortcuts.map((x) => <li key={x}>{x}</li>)}</ul></Card>}
      {t.commonTraps?.length > 0 && <Card><h2 className="mb-2 font-semibold">Common traps</h2><ul className="list-disc space-y-1 pl-5 text-sm">{t.commonTraps.map((x) => <li key={x}>{x}</li>)}</ul></Card>}
      {solvedExamples.length > 0 && <div className="space-y-3"><h2 className="font-semibold">Solved examples</h2>{solvedExamples.map((e) => (
        <Card key={e._id}><Badge tone="blue">{e.difficulty}</Badge><p className="pre-wrap mt-2 text-[15px]">{e.text}</p>
          {e.options?.length > 0 && <p className="mt-1 text-sm">Answer: <b>{e.options[e.correct[0]]}</b></p>}{e.numericAnswer !== undefined && <p className="mt-1 text-sm">Answer: <b>{e.numericAnswer}</b></p>}
          <p className="pre-wrap mt-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">{e.explanation}</p></Card>))}</div>}
    </div>
  );
}
