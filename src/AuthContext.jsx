import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then((d) => setUser(d.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => { const d = await api.login(email, password); setUser(d.user); }, []);
  const register = useCallback(async (p) => { const d = await api.register(p); setUser(d.user); }, []);
  const logout = useCallback(async () => { await api.logout().catch(() => {}); setUser(null); }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
