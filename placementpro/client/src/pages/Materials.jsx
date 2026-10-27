import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Eye,
  Search,
  Filter,
  Building2,
  BookOpen,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  X,
  FileCode,
  FileSpreadsheet,
  GraduationCap,
} from 'lucide-react';
import { useGet } from '../lib/useApi';
import { qs } from '../lib/api';
import { PageTitle, Card, Badge, Btn, Spinner, ErrorBox, Empty } from '../components/ui';
import { label, SUBJECTS } from '../lib/format';

const CATEGORIES = [
  { key: 'all', label: 'All Resources' },
  { key: 'formula_sheet', label: 'Important Formula Sheets' },
  { key: 'quick_notes', label: 'Quick Revision Notes' },
  { key: 'mock_test', label: 'Solved Mock Papers' },
  { key: 'company_guide', label: 'Company Guides & Patterns' },
];

export default function Materials() {
  const [sp, setSp] = useSearchParams();

  const f = {
    category: sp.get('category') || 'all',
    company: sp.get('company') || 'all',
    subject: sp.get('subject') || 'all',
    q: sp.get('q') || '',
    page: sp.get('page') || '1',
  };

  const [previewMaterial, setPreviewMaterial] = useState(null);

  const meta = useGet('/materials/meta');
  const companies = useGet('/companies');
  const materials = useGet(`/materials${qs({ ...f, limit: 12 })}`);

  const setFilter = (k, v) => {
    const n = new URLSearchParams(sp);
    if (v && v !== 'all') n.set(k, v);
    else n.delete(k);
    if (k !== 'page') n.delete('page');
    setSp(n);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        breadcrumb="Resource Center"
        title="Download Material & Study Notes"
        sub="Verified high-yield formula handbooks, quick revision summaries, topic cheat sheets, and solved practice papers in PDF format."
      />

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3 dark:border-gray-800">
        {CATEGORIES.map((cat) => {
          const active = f.category === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setFilter('category', cat.key)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-[#0c0e14] dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 border border-slate-200/80 dark:border-gray-800'
              }`}
            >
              {cat.label}
              {meta.data?.categories?.[cat.key] ? (
                <span className="ml-1.5 opacity-80">({meta.data.categories[cat.key]})</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Modern Filter Card */}
      <div className="card space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 text-xs"
              placeholder="Search formula sheets, notes, topics, keywords…"
              value={f.q}
              onChange={(e) => setFilter('q', e.target.value)}
              aria-label="Search resources"
            />
          </div>

          <select
            className="input text-xs"
            value={f.company}
            onChange={(e) => setFilter('company', e.target.value)}
            aria-label="Filter by Company"
          >
            <option value="all">All Companies</option>
            {companies.data?.items?.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="input text-xs"
            value={f.subject}
            onChange={(e) => setFilter('subject', e.target.value)}
            aria-label="Filter by Subject"
          >
            <option value="all">All Subjects</option>
            {SUBJECTS.map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Grid View */}
      {materials.loading ? (
        <Spinner label="Loading materials library…" />
      ) : materials.error ? (
        <ErrorBox error={materials.error} onRetry={materials.reload} />
      ) : materials.data?.items?.length === 0 ? (
        <Empty
          icon={BookOpen}
          title="No materials match your filters"
        >
          Try clearing filters or searching with different terms.
        </Empty>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
            <span>
              Showing <b>{materials.data?.items?.length}</b> of <b>{materials.data?.total}</b> resources
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {materials.data?.items?.map((m) => {
              return (
                <div
                  key={m._id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-all hover:border-sky-300 hover:shadow-hover dark:border-[#1f2430] dark:bg-[#0c0e14]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                        <FileText className="h-3 w-3" />
                        {m.category.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-gray-500">
                        {m.fileSizeKB} KB
                      </span>
                    </div>

                    <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-gray-100">
                      {m.title}
                    </h3>

                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-gray-400">
                      {m.description}
                    </p>

                    {m.companies?.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {m.companies.slice(0, 3).map((comp) => (
                          <span
                            key={comp}
                            className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-gray-800 dark:text-gray-300"
                          >
                            {comp}
                          </span>
                        ))}
                        {m.companies.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{m.companies.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setPreviewMaterial(m)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-gray-800 dark:bg-[#131926] dark:text-gray-200 dark:hover:bg-gray-800 transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-sky-500" />
                      <span>Preview</span>
                    </button>

                    <a
                      href={`/api/materials/${m.slug}/download`}
                      download={m.fileName}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2 text-xs font-bold text-white shadow-sm shadow-sky-500/25 hover:bg-sky-600 active:bg-sky-700 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded In-App PDF Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-[#0c0e14]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-gray-100">
                    {previewMaterial.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">
                    {previewMaterial.fileName} • {previewMaterial.fileSizeKB} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/api/materials/${previewMaterial.slug}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open in tab</span>
                </a>
                <a
                  href={`/api/materials/${previewMaterial.slug}/download`}
                  download={previewMaterial.fileName}
                  className="inline-flex items-center gap-1 rounded-xl bg-sky-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(null)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF iframe */}
            <div className="flex-1 bg-slate-100 dark:bg-[#07080c]">
              <iframe
                src={`/api/materials/${previewMaterial.slug}/view`}
                title={previewMaterial.title}
                className="h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
