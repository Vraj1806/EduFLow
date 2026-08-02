import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AuthUser, LoginInput, RegisterInput } from '@eduflow/shared';
import * as authApi from '../api/auth.ts';

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial /auth/me check is still in flight. */
  initializing: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch the current user from /auth/me (e.g. after a profile update). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore the session on load: if a valid cookie exists, /auth/me returns the user.
  useEffect(() => {
    let cancelled = false;
    authApi
      .getMe()
      .then((current) => {
        if (!cancelled) setUser(current);
      })
      .catch(() => {
        // Not authenticated (or session expired) — leave user as null.
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const current = await authApi.login(input);
    setUser(current);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const current = await authApi.register(input);
    setUser(current);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const current = await authApi.getMe();
    setUser(current);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout, refreshUser }}>
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
