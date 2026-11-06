import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from './api';

/**
 * Loads GET `path`; returns { data, error, loading, isFetching, reload }.
 * - Eliminates infinite loading when path is falsy by resolving loading to false.
 * - Cancels stale responses using sequence tracking to eliminate race conditions.
 * - Safely prevents state updates after unmount.
 * - Retains existing data during background re-fetching for seamless pagination & filtering.
 */
export function useGet(path) {
  const [state, set] = useState({
    data: null,
    error: null,
    loading: !!path,
    isFetching: !!path,
  });

  const reqIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const load = useCallback(() => {
    if (!path) {
      if (isMountedRef.current) {
        set({ data: null, error: null, loading: false, isFetching: false });
      }
      return;
    }

    const currentReqId = ++reqIdRef.current;
    if (isMountedRef.current) {
      set((s) => ({
        ...s,
        loading: s.data === null, // only true on initial empty load
        isFetching: true,
        error: null,
      }));
    }

    api
      .get(path)
      .then((data) => {
        if (isMountedRef.current && currentReqId === reqIdRef.current) {
          set({ data, error: null, loading: false, isFetching: false });
        }
      })
      .catch((error) => {
        if (isMountedRef.current && currentReqId === reqIdRef.current) {
          set((s) => ({
            data: s.data,
            error,
            loading: false,
            isFetching: false,
          }));
        }
      });
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
