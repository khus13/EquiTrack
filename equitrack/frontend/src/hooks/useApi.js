import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useApi(fetcher, deps)
 * Runs `fetcher()` whenever `deps` change and gives you:
 *   { data, loading, error, reload }
 * Stale responses (from an older request) are ignored.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const counter = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    const id = ++counter.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef.current()
      .then((data) => { if (id === counter.current) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (id === counter.current) setState({ data: null, loading: false, error }); });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, deps);

  return { ...state, reload: run };
}

/** Returns `value` only after it stopped changing for `delay` ms (for search boxes). */
export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
