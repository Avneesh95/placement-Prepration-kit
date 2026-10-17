export const label = (s = '') => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const mmss = (sec) => { const s = Math.max(0, Math.floor(sec)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const r = s % 60; const p = (n) => String(n).padStart(2, '0'); return h ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`; };
export const pct = (n) => (n === null || n === undefined ? '—' : `${Math.round(n * 10) / 10}%`);
export const PROVENANCE = {
  verified_pyq: { text: 'Verified previous-year', tone: 'green' }, official_sample: { text: 'Official sample', tone: 'green' },
  memory_based: { text: 'Memory-based (unverified)', tone: 'amber' }, practice: { text: 'Practice question', tone: 'slate' }, high_priority_practice: { text: 'High-priority practice', tone: 'blue' },
};
export const SUBJECTS = [['aptitude', 'Aptitude'], ['reasoning', 'Reasoning'], ['english', 'English'], ['cs', 'CS Fundamentals'], ['coding', 'Coding'], ['sql', 'SQL']];
