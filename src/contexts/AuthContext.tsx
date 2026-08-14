import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiPost } from "@/lib/api";
import type { AuthResponse, Role, SignUpPayload, User } from "@/types/api";

const AUTH_STORAGE_KEY = "sb_auth";

interface StoredAuth {
  user: User;
  token: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (payload: SignUpPayload) => Promise<User>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuth(readStoredAuth());
    setLoading(false);
  }, []);

  const persist = useCallback((value: StoredAuth | null) => {
    setAuth(value);
    if (value) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiPost<AuthResponse>("/api/auth/signin", { email, password });
      if (!res?.user || !res?.token) {
        throw new Error(
          "The API did not return a valid session. Make sure the backend is running (docker compose up) and reachable."
        );
      }
      persist({ user: res.user, token: res.token });
      return res.user;
    },
    [persist]
  );

  const signUp = useCallback(
    async (payload: SignUpPayload) => {
      const res = await apiPost<AuthResponse>("/api/auth/signup", payload);
      if (!res?.user || !res?.token) {
        throw new Error(
          "The API did not return a valid session. Make sure the backend is running (docker compose up) and reachable."
        );
      }
      persist({ user: res.user, token: res.token });
      return res.user;
    },
    [persist]
  );

  const signOut = useCallback(() => {
    persist(null);
    window.location.href = "/";
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      role: (auth?.user?.role as Role | undefined) ?? null,
      isAuthenticated: !!auth?.token,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [auth, loading, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
