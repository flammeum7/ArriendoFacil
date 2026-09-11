import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import client, { setAccessToken } from '../api/client';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.post('/auth/refresh');
        const token = data?.data?.accessToken;
        if (token) {
          setAccessToken(token);
          const me = await authApi.me();
          setUser(me.data.data.user);
        }
      } catch (e) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (e) { /* ignorar */ }
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = { user, setUser, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
