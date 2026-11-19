import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setCsrfToken } from '../lib/api.js';

/**
 * AuthContext: who is logged in?  Available anywhere with  const { user, login, logout } = useAuth();
 * On start it asks the server (GET /auth/me) so a page refresh keeps you logged in (PHP session cookie).
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);   // false until the first /auth/me answer arrives
  const [bootError, setBootError] = useState(null);

  const boot = useCallback(async () => {
    setBootError(null);
    try {
      const data = await api.get('/auth/me');
      setCsrfToken(data.csrf_token);
      setUser(data.user);
    } catch (e) {
      setBootError(e.message);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { boot(); }, [boot]);

  // api.js fires this when any request gets 401 (session expired)
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('equitrack:unauthorized', onExpired);
    return () => window.removeEventListener('equitrack:unauthorized', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (values) => {
    const data = await api.post('/auth/register', values);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore - we clear the UI anyway */ }
    setUser(null);
  }, []);

  /** Used after profile edits / account deletion. */
  const replaceUser = useCallback((u) => setUser(u), []);

  const value = useMemo(
    () => ({ user, ready, bootError, retryBoot: boot, login, register, logout, replaceUser }),
    [user, ready, bootError, boot, login, register, logout, replaceUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
