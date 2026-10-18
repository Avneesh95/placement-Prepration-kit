import { Loader2, AlertCircle } from 'lucide-react';

export const Card = ({ className = '', hover = false, children, ...p }) => (
  <div
    className={`card ${hover ? 'hover:-translate-y-0.5 hover:shadow-hover hover:border-brand-500/50 cursor-pointer' : ''} ${className}`}
    {...p}
  >
    {children}
  </div>
);

export const Btn = ({ variant = 'primary', size = 'md', className = '', children, ...p }) => {
  const sizes = {
    sm: 'min-h-[34px] px-3 text-xs',
    md: 'min-h-[42px] px-4 text-sm',
    lg: 'min-h-[48px] px-5 text-base',
  };
  return (
    <button className={`btn btn-${variant} ${sizes[size] || sizes.md} ${className}`} {...p}>
      {children}
    </button>
  );
};

const TONES = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  blue: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/60',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
  amber: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
  red: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/60',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60',
};

export const Badge = ({ tone = 'slate', className = '', children }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone] || TONES.slate} ${className}`}>
    {children}
  </span>
);

export const CircularGauge = ({
  value = 0,
  max = 100,
  size = 130,
  strokeWidth = 14,
  strokeColor = '#ffffff',
  trackColor = 'rgba(255, 255, 255, 0.22)',
  textColor = 'text-white',
  unit = '',
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const numVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const progress = Math.min(100, Math.max(0, (numVal / max) * 100));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform drop-shadow-sm">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={`text-2xl font-black tracking-tight leading-none ${textColor}`}>
          {value}
        </span>
        {unit && (
          <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80 ${textColor}`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export const Progress = ({ value = 0, tone = 'brand', height = 'h-2', className = '' }) => {
  const tones = {
    brand: 'bg-brand-600',
    accent: 'bg-amber-500',
    success: 'bg-emerald-600',
  };
  const val = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800 ${height} ${className}`}
      role="progressbar"
      aria-valuenow={val}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${tones[tone] || tones.brand}`}
        style={{ width: `${val}%` }}
      />
    </div>
  );
};

export const Spinner = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 p-12 text-slate-500 dark:text-gray-400 ${className}`} role="status">
    <Loader2 className="h-6 w-6 animate-spin text-brand-600 dark:text-brand-400" />
    <span className="text-xs font-medium">{label}</span>
  </div>
);

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-gray-800 ${className}`} />
);

export const ErrorBox = ({ error, onRetry }) =>
  error ? (
    <div
      className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
      <div className="flex-1">
        <div className="font-semibold">Something went wrong</div>
        <p className="mt-0.5 text-xs opacity-90">{error.message || String(error)}</p>
        {onRetry && (
          <button
            type="button"
            className="mt-2 text-xs font-semibold underline hover:no-underline"
            onClick={onRetry}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  ) : null;

export const Empty = ({ icon: Icon, title, children }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-10 text-center dark:border-gray-800 dark:bg-gray-900/40">
    {Icon && (
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400">
        <Icon className="h-6 w-6" />
      </div>
    )}
    {title && <h3 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{title}</h3>}
    <p className="muted mt-1 text-xs">{children}</p>
  </div>
);

export const Field = ({ label, error, hint, children }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-300">
      <span>{label}</span>
      {hint && <span className="font-normal text-slate-400">{hint}</span>}
    </span>
    {children}
    {error && <span className="mt-1.5 block text-xs font-medium text-rose-600 dark:text-rose-400">{error}</span>}
  </label>
);

export const PageTitle = ({ title, sub, breadcrumb, right }) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      {breadcrumb && (
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          {breadcrumb}
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
        {title}
      </h1>
      {sub && <p className="muted mt-1 text-sm">{sub}</p>}
    </div>
    {right && <div className="flex flex-wrap items-center gap-2">{right}</div>}
  </div>
);

export const Disclaimer = ({ children }) => (
  <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
    {children}
  </div>
);
