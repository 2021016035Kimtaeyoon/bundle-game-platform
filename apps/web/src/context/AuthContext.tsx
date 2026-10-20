import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, setAccessToken } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  isOrganizer: boolean;
  points: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  username: string;
  phone?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function handleForcedLogout() {
      setUser(null);
    }
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    api
      .post('/api/auth/refresh', { refreshToken })
      .then(async (response) => {
        setAccessToken(response.data.accessToken);
        const me = await api.get('/api/users/me');
        setUser(me.data.user);
      })
      .catch(() => {
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password });
    setAccessToken(response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser(response.data.user);
  }

  async function signup(payload: SignupPayload) {
    const response = await api.post('/api/auth/signup', payload);
    setAccessToken(response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser(response.data.user);
  }

  function logout() {
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  async function refreshUser() {
    const me = await api.get('/api/users/me');
    setUser(me.data.user);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
