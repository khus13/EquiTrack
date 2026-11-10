import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

/**
 * MetaContext: public reference data (campuses, buildings, rooms, categories ...)
 * shared by the directory and forms. Call reload() after editing reference data.
 */
const MetaContext = createContext(null);
const EMPTY = { campuses: [], buildings: [], rooms: [], categories: [], equipment_types: [], damage_types: [], priorities: [], statuses: [] };

export function MetaProvider({ children }) {
  const [meta, setMeta] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try { setMeta(await api.get('/meta')); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ meta, loading, error, reload }), [meta, loading, error, reload]);
  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>;
}

export const useMeta = () => useContext(MetaContext);
