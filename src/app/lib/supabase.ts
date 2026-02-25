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
    },
  });

  globalThis.__supabaseClient = client;
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
