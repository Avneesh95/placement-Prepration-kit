import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

/**
 * Reusable Multi-Select Dropdown with checkboxes, count badges, and internal search.
 *
 * Props:
 * - label: String (e.g. "Category", "Difficulty", "Company", "Topic")
 * - options: Array<{ value: string, label: string, count?: number }>
 * - selected: Array<string>
 * - onChange: (newSelected: Array<string>) => void
 * - placeholder?: string
 * - disabled?: boolean
 */
export function MultiSelect({
  label,
  options = [],
  selected = [],
  onChange,
  placeholder = 'Select…',
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  const toggleOption = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((x) => x !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredOptions = query
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.value.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`input flex w-full items-center justify-between gap-2 text-left text-xs font-medium transition ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300 dark:hover:border-gray-600'
        } ${selected.length > 0 ? 'border-sky-300 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected.length === 0 ? (
            <span className="text-slate-400 dark:text-gray-500">{label || placeholder}</span>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-gray-100">
              {label}: <span className="text-sky-600 dark:text-sky-400">{selected.length} selected</span>
            </span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-sky-500 px-1 text-[10px] font-bold text-white">
              {selected.length}
            </span>
          )}
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-64 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-gray-800 dark:bg-[#121826] animate-in fade-in-50 zoom-in-95">
          {/* Header with Quick Actions */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-gray-800 text-[11px]">
            <span className="font-bold text-slate-700 dark:text-gray-300">{label}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
              >
                Select all
              </button>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-semibold text-rose-500 hover:underline dark:text-rose-400"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Search when more than 6 options */}
          {options.length > 6 && (
            <div className="relative my-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-8 pr-2 text-xs focus:border-sky-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800/80 dark:focus:bg-gray-800"
                placeholder={`Search ${label.toLowerCase()}…`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 py-1 text-xs">
            {filteredOptions.length === 0 ? (
              <p className="py-3 text-center text-xs text-slate-400 dark:text-gray-500">No matching options</p>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-sky-50 font-semibold text-sky-950 dark:bg-sky-950/40 dark:text-sky-100'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded border transition ${
                          isChecked
                            ? 'border-sky-600 bg-sky-600 text-white dark:border-sky-500 dark:bg-sky-500'
                            : 'border-slate-300 bg-white dark:border-gray-600 dark:bg-gray-800'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {typeof opt.count === 'number' && (
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 shrink-0">
                        {opt.count}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renders dismissible chips for each selected active filter item.
 */
export function FilterChips({ chips = [], onRemove, onClearAll }) {
  if (!chips || chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400 mr-1">
        Active Filters ({chips.length}):
      </span>
      {chips.map((chip) => (
        <span
          key={`${chip.group}-${chip.value}`}
          className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-800 dark:border-sky-800/80 dark:bg-sky-950/40 dark:text-sky-300"
        >
          <span className="opacity-70">{chip.groupLabel || chip.group}:</span>
          <span className="font-semibold">{chip.label || chip.value}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.group, chip.value)}
            className="rounded-full p-0.5 text-sky-600 hover:bg-sky-200/60 hover:text-sky-900 dark:text-sky-400 dark:hover:bg-sky-900/60 dark:hover:text-sky-200"
            aria-label={`Remove filter ${chip.label || chip.value}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
