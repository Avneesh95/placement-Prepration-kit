import { useEffect, useState, useCallback } from 'react';
import { api } from './api';
/** Loads GET `path`; returns {data, error, loading, reload}. */
export function useGet(path) {
  const [state, set] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    if (!path) return;
    set((s) => ({ ...s, loading: true, error: null }));
    api.get(path).then((data) => set({ data, error: null, loading: false })).catch((error) => set({ data: null, error, loading: false }));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
