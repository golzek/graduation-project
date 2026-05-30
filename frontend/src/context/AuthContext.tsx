import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type UserRole = 'student' | 'teacher' | 'admin' | 'moderator' | 'super_admin';

export interface AuthUser {
  id: string; name: string; email: string;
  role: UserRole; avatarUrl: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string, referralToken?: string) => Promise<void>;
  login:    (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  handleGoogleCallback: (params: URLSearchParams) => void;
  logout:   () => void;
  hasRole:  (...roles: UserRole[]) => boolean;
  isSuperAdmin: boolean;
}

const API = process.env.REACT_APP_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({ message: 'Помилка' })); throw new Error(e.message); }
  return res.json();
}

const Tokens = {
  getAccess:   () => localStorage.getItem('accessToken'),
  getRefresh:  () => localStorage.getItem('refreshToken'),
  set: (a: string, r: string) => { localStorage.setItem('accessToken', a); localStorage.setItem('refreshToken', r); },
  clear: () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); },
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!Tokens.getAccess()) { setLoading(false); return; }
      try {
        setUser(await apiFetch<AuthUser>('/auth/me'));
      } catch {
        try {
          const rt = Tokens.getRefresh();
          if (!rt) throw new Error();
          const { accessToken } = await apiFetch<{ accessToken: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: rt }) });
          localStorage.setItem('accessToken', accessToken);
          setUser(await apiFetch<AuthUser>('/auth/me'));
        } catch { Tokens.clear(); }
      } finally { setLoading(false); }
    })();
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, referralToken?: string) => {
    const d = await apiFetch<any>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, ...(referralToken ? { referralToken } : {}) }) });
    Tokens.set(d.accessToken, d.refreshToken); setUser(d.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const d = await apiFetch<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    Tokens.set(d.accessToken, d.refreshToken); setUser(d.user);
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${API}/auth/google`;
  }, []);

  const handleGoogleCallback = useCallback((params: URLSearchParams) => {
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userStr      = params.get('user');
    if (!accessToken || !refreshToken || !userStr) return;
    Tokens.set(accessToken, refreshToken);
    setUser(JSON.parse(userStr));
  }, []);

  const logout  = useCallback(() => { Tokens.clear(); setUser(null); }, []);
  const hasRole = useCallback((...roles: UserRole[]) => !!user && roles.includes(user.role), [user]);
  const isSuperAdmin = !!user && user.role === 'super_admin';

  return (
      <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, register, login, loginWithGoogle, handleGoogleCallback, logout, hasRole, isSuperAdmin }}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}

export { apiFetch };