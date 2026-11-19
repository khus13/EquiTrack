import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useApi.js';

/**
 * useListQuery(defaults)
 * Keeps list filters (search, page, sort ...) in the URL (?q=lamp&page=2) so that
 * pages are bookmarkable and the Back button works.
 *
 *   const { query, setQuery } = useListQuery({ status: '', page: 1 });
 *   setQuery({ status: 'Solved' })   // changing a filter resets to page 1 automatically
 */
export function useListQuery(defaults = {}) {
  const [sp, setSp] = useSearchParams();

  const query = useMemo(() => {
    const q = { ...defaults };
    Object.keys(defaults).forEach((k) => {
      const v = sp.get(k);
      if (v !== null) q[k] = k === 'page' ? Math.max(1, parseInt(v, 10) || 1) : v;
    });
    return q;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const setQuery = useCallback((patch) => {
    const next = { ...query, ...patch };
    if (!('page' in patch)) next.page = 1;          // any filter change -> back to page 1
    const out = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined && String(v) !== String(defaults[k] ?? '')) out.set(k, v);
    });
    setSp(out, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, setSp]);

  const reset = useCallback(() => setSp(new URLSearchParams(), { replace: true }), [setSp]);
  return { query, setQuery, reset };
}

/**
 * useSearchBox(query, setQuery)
 * A search text box that updates the URL query (?q=) 350 ms after you stop typing.
 *   const [text, setText] = useSearchBox(query, setQuery);
 *   <input value={text} onChange={(e) => setText(e.target.value)} />
 */
export function useSearchBox(query, setQuery, key = 'q') {
  const [text, setText] = useState(query[key] || '');
  const debounced = useDebounce(text);

  // typing -> URL
  useEffect(() => {
    if (debounced !== (query[key] || '')) setQuery({ [key]: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // URL changed from outside (Reset button, Back button) -> update the box
  useEffect(() => {
    if ((query[key] || '') !== debounced) setText(query[key] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query[key]]);

  return [text, setText];
}
