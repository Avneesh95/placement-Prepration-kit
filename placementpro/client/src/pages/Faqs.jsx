import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { useGet } from '../lib/useApi';
import { qs } from '../lib/api';
import { Card, Spinner, ErrorBox, PageTitle, Empty } from '../components/ui';
export default function Faqs() {
  const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [open, setOpen] = useState(null);
  const { data, loading, error, reload } = useGet(`/faqs${qs({ q, category: cat })}`); const all = useGet('/faqs');
  return (
    <div>
      <PageTitle title="FAQs" sub="Preparation strategy, exam day and interviews." />
      <input className="input mb-3" placeholder="Search FAQs…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search FAQs" />
      <div className="-mx-4 mb-4 overflow-x-auto px-4"><div className="flex gap-2">{['', ...(all.data?.categories || [])].map((c) => <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${cat === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>{c || 'All'}</button>)}</div></div>
      {loading ? <Spinner /> : error ? <ErrorBox error={error} onRetry={reload} /> : data.items.length === 0 ? <Empty>No FAQs match your search.</Empty> : (
        <div className="space-y-2">{data.items.map((f) => (<Card key={f._id} className="!p-0"><button className="flex w-full items-start justify-between gap-3 p-4 text-left" aria-expanded={open === f._id} onClick={() => setOpen(open === f._id ? null : f._id)}><span className="font-semibold">{f.question}</span><ChevronDown className={`mt-1 h-4 w-4 shrink-0 transition ${open === f._id ? 'rotate-180' : ''}`} /></button>
          {open === f._id && <div className="border-t border-slate-100 px-4 pb-4 pt-3 text-sm dark:border-slate-800"><p className="pre-wrap">{f.answer}</p>{f.links?.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener" className="mt-2 flex items-center gap-1 text-brand-600">{l.label}<ExternalLink className="h-3 w-3" /></a>)}</div>}</Card>))}</div>)}
    </div>
  );
}
