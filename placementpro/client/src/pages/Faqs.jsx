import { useState } from 'react';
import { ChevronDown, ExternalLink, Search, HelpCircle } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { qs } from '../lib/api';
import { Card, Spinner, ErrorBox, PageTitle, Empty } from '../components/ui';

export default function Faqs() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [open, setOpen] = useState(null);
  const { data, loading, error, reload } = useGet(`/faqs${qs({ q, category: cat })}`);
  const all = useGet('/faqs');

  return (
    <div className="space-y-6">
      <PageTitle
        title="Frequently Asked Questions"
        sub="Placement preparation guidelines, company patterns, test taking strategies, and interview advice."
        crumbs={[
          { label: 'Dashboard', to: '/' },
          { label: 'FAQs' },
        ]}
      />

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          className="input !pl-10 !py-2.5"
          placeholder="Search questions or keywords…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search FAQs"
        />
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2">
          {['', ...(all.data?.categories || [])].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                cat === c
                  ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
              }`}
            >
              {c || 'All Categories'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner label="Loading FAQs…" />
      ) : error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : data.items.length === 0 ? (
        <Empty title="No questions found">Try searching with a different term or clearing your category filter.</Empty>
      ) : (
        <div className="space-y-3">
          {data.items.map((f) => (
            <Card key={f._id} className="!p-0 overflow-hidden transition hover:border-slate-300 dark:hover:border-gray-700">
              <button
                className="flex w-full items-start justify-between gap-3 p-4 text-left font-semibold text-slate-900 transition hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                aria-expanded={open === f._id}
                onClick={() => setOpen(open === f._id ? null : f._id)}
              >
                <span className="text-sm">{f.question}</span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                    open === f._id ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
                  }`}
                />
              </button>
              {open === f._id && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-4 pt-3 text-sm text-slate-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300">
                  <p className="pre-wrap leading-relaxed">{f.answer}</p>
                  {f.links?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-200/60 pt-2.5 dark:border-gray-800">
                      {f.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
                        >
                          <span>{l.label}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

