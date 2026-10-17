export class ApiError extends Error {
  constructor(status, code, message, details) { super(message); this.status = status; this.code = code; this.details = details; }
}
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '/api').replace(/\/+$/, '');

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, credentials: 'include', headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const e = data && data.error ? data.error : {};
    throw new ApiError(res.status, e.code || 'ERROR', e.message || 'Something went wrong.', e.details);
  }
  return data;
}
export const api = {
  get: (p) => request('GET', p), post: (p, b = {}) => request('POST', p, b), put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b), del: (p) => request('DELETE', p),
};
export const qs = (o) => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => { if (v !== '' && v !== undefined && v !== null) p.set(k, v); }); const s = p.toString(); return s ? `?${s}` : ''; };
