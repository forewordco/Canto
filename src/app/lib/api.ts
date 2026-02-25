/* ═══════════════════════════════════════════════════════════
   API CLIENT — Wraps all server calls with retry logic,
   dual-header auth, and consistent error handling.
   ═══════════════════════════════════════════════════════════ */

import { getSupabaseClient, getAnonKey, getSupabaseUrl } from "./supabase";

/** Maximum number of retries on network errors */
const MAX_RETRIES = 3;

/** Base delay in ms for exponential backoff */
const BASE_DELAY = 500;

/** Edge function path */
const EDGE_FN_PATH = "/functions/v1/server";

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
 * Check if an error is a retryable network error.
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return msg.includes("failed to fetch") || msg.includes("network") || msg.includes("aborted");
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
 */
async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;

  // If token expires in less than 60s, refresh
  const expiresAt = data.session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt - now < 60) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed.session?.access_token ?? data.session.access_token;
  }

  return data.session.access_token;
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
        const supabase = getSupabaseClient();
        await supabase.auth.refreshSession();
        continue; // Retry with fresh token
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

  del: <T = unknown>(route: string, opts?: Omit<ApiOptions, "method">) =>
    apiCall<T>(route, { ...opts, method: "DELETE" }),
};

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
    const supabase = getSupabaseClient();
    await supabase.auth.refreshSession();
    return apiCall<T>(route, { method, body });
  }

  return result;
}
