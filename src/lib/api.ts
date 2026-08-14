export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "";

const AUTH_STORAGE_KEY = "sb_auth";

interface StoredAuth {
  user?: unknown;
  token?: string;
}

function getToken(): string | undefined {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed.token;
  } catch {
    return undefined;
  }
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }
  // If API_BASE_URL is absolute, url.toString() will be correct.
  // If it's relative (e.g. "/api" or ""), return path+search only.
  if (/^https?:\/\//.test(API_BASE_URL)) {
    return url.toString();
  }
  return `${url.pathname}${url.search}`;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options?: { params?: Record<string, unknown>; body?: unknown }
): Promise<T> {
  const url = buildUrl(path, options?.params);
  const token = getToken();

  const headers: Record<string, string> = {};
  if (options?.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && String((data as { error: unknown }).error)) ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  if (!isJson) {
    throw new Error(
      `The API returned a non-JSON response for ${method} ${path}. Is the backend running and VITE_API_BASE_URL set correctly?`
    );
  }


  return data as T;
}

export function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>("GET", path, { params });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, { body });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, { body });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, { body });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}
