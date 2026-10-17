import { Loader2, AlertCircle } from 'lucide-react';
export const Card = ({ className = '', children, ...p }) => <div className={`card ${className}`} {...p}>{children}</div>;
export const Btn = ({ variant = 'primary', className = '', children, ...p }) => <button className={`btn btn-${variant} ${className}`} {...p}>{children}</button>;
const TONES = { slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200', blue: 'bg-brand-50 text-brand-700 dark:bg-brand-700/30 dark:text-brand-100', green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200', amber: 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200', red: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200', orange: 'bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200' };
export const Badge = ({ tone = 'slate', children }) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
export const Progress = ({ value = 0, tone = 'brand' }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
    <div className={`h-full rounded-full ${tone === 'accent' ? 'bg-accent-500' : 'bg-brand-600'}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);
export const Spinner = ({ label = 'Loading…' }) => <div className="flex items-center justify-center gap-2 p-8 text-slate-500" role="status"><Loader2 className="h-5 w-5 animate-spin" /> {label}</div>;
export const ErrorBox = ({ error, onRetry }) => error ? (
  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200" role="alert">
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><div className="flex-1">{error.message || String(error)}{onRetry && <button className="ml-2 font-semibold underline" onClick={onRetry}>Retry</button>}</div>
  </div>) : null;
export const Empty = ({ children }) => <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">{children}</div>;
export const Field = ({ label, error, children }) => (
  <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>
);
export const PageTitle = ({ title, sub, right }) => (
  <div className="mb-4 flex items-start justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight">{title}</h1>{sub && <p className="muted mt-0.5">{sub}</p>}</div>{right}</div>
);
export const Disclaimer = ({ children }) => <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-100">{children}</div>;
