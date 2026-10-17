import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from './api';
const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/auth/me').then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const login = useCallback(async (email, password) => { const r = await api.post('/auth/login', { email, password }); setUser(r.user); }, []);
  const register = useCallback(async (body) => { const r = await api.post('/auth/register', body); setUser(r.user); }, []);
  const logout = useCallback(async () => { await api.post('/auth/logout'); setUser(null); }, []);
  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
export function Protected({ children }) {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <div className="p-10 text-center muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}
