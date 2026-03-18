/* ═══════════════════════════════════════════════════════════
   SINGLETON SUPABASE CLIENT
   Stored on globalThis to prevent multiple GoTrueClient instances.
   ═══════════════════════════════════════════════════════════ */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Extend globalThis type
declare global {
  var __supabaseClient: SupabaseClient | undefined;
  var __supabaseUrl: string | undefined;
  var __supabaseAnonKey: string | undefined;
  var __supabaseLockFixed: boolean | undefined;
}

/**
 * Environment configuration.
 * In production, these come from actual env vars.
 * In development/preview, they can be set via the init function.
 */
const getConfig = () => ({
  url: globalThis.__supabaseUrl || import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: globalThis.__supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || "",
});

/**
 * Initialize the Supabase client config before first use.
 * Call this once in App.tsx with your project credentials.
 */
export function initSupabase(url: string, anonKey: string) {
  // Only reset the client if the config actually changed
  if (globalThis.__supabaseUrl === url && globalThis.__supabaseAnonKey === anonKey) {
    return;
  }
  globalThis.__supabaseUrl = url;
  globalThis.__supabaseAnonKey = anonKey;
  // Reset client so it picks up new config
  globalThis.__supabaseClient = undefined;
}

/**
 * Get the singleton Supabase client.
 * Creates it on first call, returns the same instance thereafter.
 */
export function getSupabaseClient(): SupabaseClient {
  // Force recreate if the client was created before the no-op lock fix
  if (globalThis.__supabaseClient && !globalThis.__supabaseLockFixed) {
    console.log("[Supabase] Recreating client with no-op lock fix");
    globalThis.__supabaseClient = undefined;
  }

  if (globalThis.__supabaseClient) {
    return globalThis.__supabaseClient;
  }

  const { url, anonKey } = getConfig();

  if (!url || !anonKey) {
    console.warn(
      "[Supabase] No URL or anon key configured. Call initSupabase() or set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY."
    );
    // Return a dummy client that won't crash but won't work
    // This allows the app to render in preview/dev without Supabase
  }

  const client = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder", {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // We handle OAuth callbacks manually
      // Bypass the Web Locks API (navigator.locks) which can hang indefinitely
      // in sandboxed/iframe environments or after HMR reloads due to orphaned locks.
      // This no-op lock is safe for single-tab apps.
      lock: async (_name: string, _acquireTimeout: number, fn: (...args: any[]) => Promise<any>) => {
        return await fn();
      },
      // Prevent the constructor from auto-calling initialize() which triggers
      // _recoverAndRefresh() → network calls that hang in sandboxed environments.
      // We'll call initialize() ourselves with a timeout in auth.tsx.
      // @ts-ignore – internal option not in public types
      skipAutoInitialize: true,
    },
  });

  globalThis.__supabaseClient = client;
  globalThis.__supabaseLockFixed = true;
  return client;
}

/**
 * Check if Supabase is properly configured (not placeholder values).
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getConfig();
  return !!(url && anonKey && !url.includes("placeholder"));
}

/**
 * Get the public anon key (used in Authorization header for edge function gateway).
 */
export function getAnonKey(): string {
  return getConfig().anonKey;
}

/**
 * Get the Supabase project URL (base URL for edge functions).
 */
export function getSupabaseUrl(): string {
  return getConfig().url;
}

/**
 * Get the Supabase auth storage key for direct localStorage checks.
 */
export function getAuthStorageKey(): string {
  const { url } = getConfig();
  // Supabase stores sessions under sb-<project-ref>-auth-token
  try {
    const projectRef = new URL(url).hostname.split(".")[0];
    return `sb-${projectRef}-auth-token`;
  } catch {
    return "sb-unknown-auth-token";
  }
}

/**
 * Check if there's a stored session in localStorage (sync, no network calls).
 */
export function hasStoredSession(): boolean {
  try {
    const key = getAuthStorageKey();
    const stored = localStorage.getItem(key);
    return stored !== null && stored !== "null" && stored !== "";
  } catch {
    return false;
  }
}

/**
 * Clear any stale session data from localStorage.
 */
export function clearStoredSession(): void {
  try {
    const key = getAuthStorageKey();
    localStorage.removeItem(key);
    localStorage.removeItem(key + "-user");
  } catch {
    // Ignore storage errors
  }
}

/**
 * Read the stored session directly from localStorage (sync, no network).
 * Returns the parsed session object or null.
 */
export function readStoredSession(): { access_token: string; refresh_token: string; expires_at?: number; user: any } | null {
  try {
    const key = getAuthStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw || raw === "null") return null;
    const parsed = JSON.parse(raw);
    // Supabase stores it as the session object directly
    if (parsed && parsed.access_token && parsed.user) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}