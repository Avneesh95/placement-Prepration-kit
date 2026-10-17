import { useParams, Link } from 'react-router-dom';
import { BookOpen, Sparkles, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { Card, Spinner, ErrorBox, PageTitle, Badge, Btn } from '../components/ui';

export default function Topic() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useGet(`/topics/${slug}`);

  if (loading) return <Spinner label="Loading topic concepts…" />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const { topic: t, solvedExamples } = data;

  return (
    <div className="space-y-6">
      <PageTitle
        title={t.name}
        sub={t.concept}
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'Practice', to: '/practice' },
          { label: t.name },
        ]}
        right={
          <Link to={`/practice?subject=${t.subject}&topic=${t.slug}`} className="btn btn-primary inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>Practice Topic</span>
          </Link>
        }
      />

      {t.formulas.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Formulas & Core Rules</h2>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-gray-300">
            {t.formulas.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>
      )}

      {t.shortcuts.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Time-Saving Shortcuts</h2>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-gray-300">
            {t.shortcuts.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>
      )}

      {t.commonTraps?.length > 0 && (
        <Card className="border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Common Traps & Pitfalls</h2>
          </div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700 dark:text-gray-300">
            {t.commonTraps.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Card>
      )}

      {solvedExamples.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">Solved Examples & Walkthroughs</h2>
          </div>
          {solvedExamples.map((e) => (
            <Card key={e._id} className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge tone="blue">{e.difficulty}</Badge>
              </div>
              <p className="pre-wrap text-sm font-medium text-slate-900 dark:text-white leading-relaxed">{e.text}</p>
              {e.options?.length > 0 && (
                <p className="text-xs text-slate-600 dark:text-gray-300">
                  Correct Answer: <b className="text-emerald-600 dark:text-emerald-400">{e.options[e.correct[0]]}</b>
                </p>
              )}
              {e.numericAnswer !== undefined && (
                <p className="text-xs text-slate-600 dark:text-gray-300">
                  Correct Answer: <b className="text-emerald-600 dark:text-emerald-400">{e.numericAnswer}</b>
                </p>
              )}
              {e.explanation && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300">
                  <p className="font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">
                    Step-by-step Explanation
                  </p>
                  <p className="pre-wrap leading-relaxed">{e.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

