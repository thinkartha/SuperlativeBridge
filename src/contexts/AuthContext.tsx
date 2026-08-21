import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { cognitoConfirmSignUp, cognitoSignIn, cognitoSignUp, isCognitoAuthMode } from "@/lib/cognito";
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
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.user || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeToken(token: string) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user: null }));
}

async function loadSession(
  token: string,
  provision?: { name?: string; role?: Role }
): Promise<StoredAuth> {
  storeToken(token);
  try {
    const me = await apiGet<{ user: User }>("/api/auth/me");
    if (me?.user) {
      return { user: me.user, token };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (!message.includes("not provisioned") && !message.includes("404")) {
      throw err;
    }
  }

  const provisioned = await apiPost<AuthResponse>("/api/auth/provision", {
    name: provision?.name,
    role: provision?.role,
  });
  if (!provisioned?.user) {
    throw new Error("Failed to provision your account in the application database.");
  }
  return { user: provisioned.user, token: provisioned.token || token };
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
      if (isCognitoAuthMode) {
        const token = await cognitoSignIn(email, password);
        const session = await loadSession(token, {
          name: email,
        });
        persist(session);
        return session.user;
      }

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
      if (isCognitoAuthMode) {
        await cognitoSignUp({
          email: payload.email,
          password: payload.password,
          name: payload.name,
          role: payload.role,
        });
        throw new Error("CONFIRM_EMAIL");
      }

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

  const confirmSignUp = useCallback(
    async (email: string, code: string) => {
      if (!isCognitoAuthMode) {
        throw new Error("Email confirmation is only required for Cognito auth.");
      }
      await cognitoConfirmSignUp(email, code);
    },
    []
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
      isAuthenticated: !!auth?.token && !!auth?.user,
      loading,
      signIn,
      signUp,
      confirmSignUp,
      signOut,
    }),
    [auth, loading, signIn, signUp, confirmSignUp, signOut]
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

export { isCognitoAuthMode };
