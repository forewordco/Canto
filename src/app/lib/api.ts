/* ═══════════════════════════════════════════════════════════
   API CLIENT — Wraps all server calls with retry logic,
   dual-header auth, and consistent error handling.
   ═══════════════════════════════════════════════════════════ */

import { getSupabaseClient, getAnonKey, getSupabaseUrl, readStoredSession } from "./supabase";

/** Maximum number of retries on network errors */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff */
const BASE_DELAY = 500;

/** Edge function path */
const EDGE_FN_PATH = "/functions/v1/make-server-a038f2e0";

/** Whether the server has been confirmed reachable at least once */
let _serverConfirmedReady = false;

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Skip auth (for public routes) */
  skipAuth?: boolean;
  /** Custom timeout in ms (default 30s) */
  timeout?: number;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Check if an error is an abort (signal cancelled / timeout).
 */
function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return msg.includes("aborted") || msg.includes("abort");
  }
  return false;
}

/**
 * Check if an error is a retryable network error.
 */
function isRetryableError(error: unknown): boolean {
  // Abort errors are NOT retryable — they mean the request was intentionally cancelled
  if (isAbortError(error)) return false;
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network");
  }
  return false;
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get a fresh access token, refreshing if needed.
 * Returns null if not authenticated.
 * 
 * IMPORTANT: We read from localStorage directly instead of calling
 * supabase.auth.getSession() because getSession() awaits initialize(),
 * which can hang indefinitely in sandboxed/iframe environments.
 */
async function getAccessToken(): Promise<string | null> {
  // First, try to read from the stored session synchronously
  const stored = readStoredSession();
  if (!stored) return null;

  // Check if token is close to expiry (within 60s)
  const expiresAt = stored.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now < 60 && expiresAt > 0) {
    // Try refreshing, but don't hang if it fails
    try {
      const supabase = getSupabaseClient();
      const { data: refreshed } = await Promise.race([
        supabase.auth.refreshSession(),
        new Promise<{ data: { session: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 5000)
        ),
      ]);
      if (refreshed.session?.access_token) {
        return refreshed.session.access_token;
      }
    } catch {
      // Fall through to use existing token
    }
  }

  return stored.access_token;
}

/**
 * Safely attempt to refresh the session with a timeout.
 * refreshSession() internally awaits initialize() which can hang.
 */
async function safeRefreshSession(): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await Promise.race([
      supabase.auth.refreshSession(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("refresh timed out")), 5000)
      ),
    ]);
  } catch {
    // Silently fail — the caller will handle missing/expired tokens
  }
}

/**
 * Build the full URL for an API route.
 */
function buildUrl(route: string): string {
  const base = getSupabaseUrl();
  const path = route.startsWith("/") ? route : `/${route}`;
  return `${base}${EDGE_FN_PATH}${path}`;
}

/**
 * Core API call with retry logic and dual-header auth.
 *
 * Authorization: Bearer <anonKey>  — for the Edge Function gateway
 * X-User-Token: <accessToken>      — for per-user auth in the server
 */
export async function apiCall<T = unknown>(
  route: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, skipAuth = false, timeout = 30000 } = options;

  // On the very first API call, ensure the server is reachable.
  // This prevents a burst of "Failed to fetch" errors during cold start.
  if (!_serverConfirmedReady) {
    try {
      await waitForServer();
    } catch {
      // Proceed anyway — the request itself will surface the error
    }
    _serverConfirmedReady = true;
  }

  let lastError: string = "Unknown error";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Build headers
      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAnonKey()}`,
        ...headers,
      };

      // Add user token if authenticated
      if (!skipAuth) {
        const token = await getAccessToken();
        if (token) {
          reqHeaders["X-User-Token"] = token;
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(buildUrl(route), {
        method,
        headers: reqHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 — try refreshing token once
      if (response.status === 401 && !skipAuth && attempt < MAX_RETRIES) {
        await safeRefreshSession();
        continue; // Retry with fresh token
      }

      // Handle 503 — transient server error, retry with backoff
      if (response.status === 503 && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(`[API] 503 Service Unavailable, retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms`);
        await sleep(delay);
        continue;
      }

      // Parse response
      let data: T | null = null;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const json = await response.json();
        data = json as T;
      }

      if (!response.ok) {
        return {
          data: null,
          error: (data as any)?.error || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      return { data, error: null, status: response.status };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);

      // Only retry on network errors
      if (isRetryableError(err) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, attempt);
        console.warn(`[API] Retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms — ${lastError}`);
        await sleep(delay);
        continue;
      }

      // Non-retryable error, bail
      break;
    }
  }

  return { data: null, error: lastError, status: 0 };
}

/* ─── Convenience methods ─── */

export const api = {
  get: <T = unknown>(route: string, opts?: Omit<ApiOptions, "method">) =>
    apiCall<T>(route, { ...opts, method: "GET" }),

  post: <T = unknown>(route: string, body?: unknown, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiCall<T>(route, { ...opts, method: "POST", body }),

  put: <T = unknown>(route: string, body?: unknown, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiCall<T>(route, { ...opts, method: "PUT", body }),

  patch: <T = unknown>(route: string, body?: unknown, opts?: Omit<ApiOptions, "method" | "body">) =>
    apiCall<T>(route, { ...opts, method: "PATCH", body }),

  del: <T = unknown>(route: string, opts?: Omit<ApiOptions, "method">) =>
    apiCall<T>(route, { ...opts, method: "DELETE" }),
};

/* ─── Server readiness check ─── */

/** Singleton promise so multiple callers don't trigger parallel health checks */
let _serverReadyPromise: Promise<void> | null = null;

/**
 * Wait for the edge function server to be reachable.
 * Pings /health with exponential backoff. Resolves once the server responds,
 * or after max attempts (to let the real request surface the error).
 */
export function waitForServer(): Promise<void> {
  if (_serverReadyPromise) return _serverReadyPromise;

  _serverReadyPromise = (async () => {
    const MAX_HEALTH_ATTEMPTS = 10;
    const HEALTH_BASE_DELAY = 600;

    for (let i = 0; i < MAX_HEALTH_ATTEMPTS; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(buildUrl("/health"), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getAnonKey()}`,
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`[API] Server ready (attempt ${i + 1})`);
          _serverConfirmedReady = true;
          // Small buffer to let all routes finish registering after health responds
          await sleep(150);
          return;
        }
      } catch {
        // Server not ready yet
      }

      if (i < MAX_HEALTH_ATTEMPTS - 1) {
        const delay = Math.min(HEALTH_BASE_DELAY * Math.pow(1.5, i), 8000);
        console.log(`[API] Server not ready, retrying in ${Math.round(delay)}ms (attempt ${i + 1}/${MAX_HEALTH_ATTEMPTS})`);
        await sleep(delay);
      }
    }

    console.warn("[API] Server readiness check exhausted — proceeding anyway");
  })();

  return _serverReadyPromise;
}

/* ─── Save-with-auth wrapper ─── */

/**
 * Wrapper for save operations that automatically retries with a
 * refreshed token on 401 or network errors.
 */
export async function saveWithAuth<T = unknown>(
  route: string,
  body: unknown,
  method: "POST" | "PUT" | "PATCH" = "POST"
): Promise<ApiResponse<T>> {
  const result = await apiCall<T>(route, { method, body });

  if (result.status === 401) {
    // Try one more time with refreshed session
    await safeRefreshSession();
    return apiCall<T>(route, { method, body });
  }

  return result;
}