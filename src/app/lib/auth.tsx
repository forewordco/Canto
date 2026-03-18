import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getSupabaseClient, isSupabaseConfigured, hasStoredSession, clearStoredSession, readStoredSession } from "./supabase";
import type { ProfileData } from "./types";
import { kvGet, kvSet } from "./kv";
import { api } from "./api";
import { waitForServer } from "./api";
import type { Session, User, AuthChangeEvent } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════════════════
   AUTH CONTEXT — Session management, profile loading,
   onboarding state, and sign-out.
   ═══════════════════════════════════════════════════════════ */

export type AuthState =
  | "loading"       // Initial session check in progress
  | "signed-out"    // No session
  | "onboarding"    // Signed in but profile.onboardingComplete === false
  | "authenticated" // Signed in + onboarding complete
  | "unconfigured"; // Supabase not configured (dev/preview mode)

interface AuthContextValue {
  authState: AuthState;
  session: Session | null;
  user: User | null;
  profile: ProfileData | null;
  /** Sign in with email/password */
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Sign up with email/password */
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Complete onboarding and save profile */
  completeOnboarding: (profile: ProfileData) => Promise<{ error: string | null }>;
  /** Update profile data */
  updateProfile: (updates: Partial<ProfileData>) => Promise<{ error: string | null }>;
  /** Skip auth (for dev/preview mode) */
  skipAuth: () => void;
  /** Whether running in dev mode without Supabase */
  isDevMode: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Timeout wrapper for async operations to prevent indefinite hangs */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[Auth] ${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

/** Default profile for new users */
function createDefaultProfile(email: string): ProfileData {
  return {
    displayName: "",
    email,
    avatarColor: "oklch(0.82 0.12 25)",
    onboardingComplete: false,
    theme: "light",
    weekStart: "monday",
    dateFormat: "mdy",
    notifyInbox: true,
    notifyTaskAssigned: true,
    notifyTaskCompleted: true,
    notifyComments: true,
    notifyUpdates: true,
    notifyMentions: true,
    notifyDesktop: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);

  /* ─── Load profile from KV ─── */
  const loadProfile = useCallback(async (userId: string, email: string) => {
    try {
      const existing = await kvGet<ProfileData>(`profile:${userId}`);
      if (existing) {
        setProfile(existing);
        setAuthState(existing.onboardingComplete ? "authenticated" : "onboarding");
      } else {
        // New user — create default profile
        const defaultProfile = createDefaultProfile(email);
        setProfile(defaultProfile);
        setAuthState("onboarding");
      }
    } catch {
      // Network error — use cached or default
      const defaultProfile = createDefaultProfile(email);
      setProfile(defaultProfile);
      setAuthState("onboarding");
    }
  }, []);

  /* ─── Initial session check ─── */
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log("[Auth] Supabase not configured — entering dev/preview mode");
      setAuthState("unconfigured");
      setIsDevMode(true);
      return;
    }

    const supabase = getSupabaseClient();
    let cancelled = false;

    // Read session directly from localStorage (sync, no network calls).
    // We use skipAutoInitialize on the Supabase client to prevent
    // the constructor from triggering _recoverAndRefresh() which hangs
    // in sandboxed environments. This means we handle session recovery ourselves.
    const storedSession = readStoredSession();

    if (storedSession) {
      console.log("[Auth] Found stored session, using directly without network verification");
      // Check if the session looks expired (with 60s margin)
      const expiresAt = storedSession.expires_at ? storedSession.expires_at * 1000 : Infinity;
      const isExpired = expiresAt - Date.now() < 60000;

      if (isExpired) {
        console.log("[Auth] Stored session is expired — clearing and showing sign-in");
        clearStoredSession();
        setAuthState("signed-out");
      } else {
        // Use the stored session directly — avoid getSession() which hangs
        setSession(storedSession as any);
        setUser(storedSession.user);
        loadProfile(storedSession.user.id, storedSession.user.email || "");
      }
    } else {
      console.log("[Auth] No stored session — showing sign-in immediately");
      setAuthState("signed-out");
    }

    // Listen for auth state changes (sign-in, sign-out, token refresh).
    // IMPORTANT: Set up listener BEFORE calling initialize() so that
    // initializePromise is still null — onAuthStateChange internally
    // awaits initializePromise, and if it's already set (and hanging),
    // the INITIAL_SESSION callback would never fire.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        if (cancelled) return;

        // Ignore INITIAL_SESSION — we already handled it synchronously above
        if (event === "INITIAL_SESSION" as any) return;

        if (event === "SIGNED_OUT" || !newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthState("signed-out");
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setSession(newSession);
          setUser(newSession.user);

          if (event === "SIGNED_IN") {
            await loadProfile(newSession.user.id, newSession.user.email || "");
          }
        }
      }
    );

    // Kick off initialize() in the background (non-blocking).
    // This sets up the internal auth state and auto-refresh ticker.
    // We don't await it — if it hangs, we've already set the UI state above.
    // Wait for the server to be ready before calling initialize() to prevent
    // AuthRetryableFetchError from network calls to an unready server.
    waitForServer()
      .then(() => supabase.auth.initialize())
      .catch((err: any) => {
        console.warn("[Auth] Background initialize failed (non-fatal):", err);
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  /* ─── Sign In ─── */
  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  /* ─── Sign Up ─── */
  const signUp = useCallback(async (email: string, password: string) => {
    try {
      // Use the server /signup route which uses admin.createUser with email_confirm: true
      const { data, error: serverError } = await api.post<{ user: { id: string; email: string } }>(
        "/signup",
        { email, password },
        { skipAuth: true }
      );

      if (serverError) {
        console.log(`[Auth] Server signup error: ${serverError}`);
        return { error: serverError };
      }

      // Auto sign-in after successful signup
      const supabase = getSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        console.log(`[Auth] Auto sign-in after signup failed: ${signInError.message}`);
        return { error: `Account created but sign-in failed: ${signInError.message}. Please sign in manually.` };
      }

      return { error: null };
    } catch (err) {
      console.log(`[Auth] Signup unexpected error: ${err}`);
      return { error: err instanceof Error ? err.message : "Signup failed" };
    }
  }, []);

  /* ─── Sign Out ─── */
  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setAuthState("signed-out");
  }, []);

  /* ─── Complete Onboarding ─── */
  const completeOnboarding = useCallback(async (newProfile: ProfileData) => {
    const finalProfile = { ...newProfile, onboardingComplete: true };

    if (user) {
      try {
        await kvSet(`profile:${user.id}`, finalProfile);

        // Also create a team-member entry
        await kvSet(`team-member:${user.id}`, {
          userId: user.id,
          displayName: finalProfile.displayName,
          email: finalProfile.email,
          avatarUrl: finalProfile.avatarUrl,
          avatarColor: finalProfile.avatarColor,
          role: finalProfile.role,
        });
      } catch {
        // Allow offline onboarding — will sync later
      }
    }

    setProfile(finalProfile);
    setAuthState("authenticated");
    return { error: null };
  }, [user]);

  /* ─── Update Profile ─── */
  const updateProfile = useCallback(async (updates: Partial<ProfileData>) => {
    const updated = { ...profile!, ...updates };
    setProfile(updated);

    if (user) {
      try {
        await kvSet(`profile:${user.id}`, updated);
        // Keep team-member KV entry in sync
        await kvSet(`team-member:${user.id}`, {
          userId: user.id,
          displayName: updated.displayName,
          email: updated.email,
          avatarUrl: updated.avatarUrl,
          avatarColor: updated.avatarColor,
          role: updated.role,
        });
      } catch {
        return { error: "Failed to save profile" };
      }
    }
    return { error: null };
  }, [profile, user]);

  /* ─── Skip Auth (dev mode) ─── */
  const skipAuth = useCallback(() => {
    const devProfile: ProfileData = {
      displayName: "Developer",
      email: "dev@flowos.app",
      avatarColor: "oklch(0.82 0.12 25)",
      onboardingComplete: true,
      theme: "light",
      weekStart: "monday",
      dateFormat: "mdy",
    };
    setProfile(devProfile);
    setIsDevMode(true);
    setAuthState("authenticated");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,
        session,
        user,
        profile,
        signIn,
        signUp,
        signOut,
        completeOnboarding,
        updateProfile,
        skipAuth,
        isDevMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // During HMR / React Fast Refresh, the context can briefly be null.
    // Return a safe fallback instead of throwing to avoid blank-screen crashes.
    return {
      authState: "loading" as AuthState,
      session: null,
      user: null,
      profile: null,
      signIn: async () => ({ error: "Auth not ready" }),
      signUp: async () => ({ error: "Auth not ready" }),
      signOut: async () => {},
      completeOnboarding: async () => ({ error: "Auth not ready" }),
      updateProfile: async () => ({ error: "Auth not ready" }),
      skipAuth: () => {},
      isDevMode: false,
    };
  }
  return ctx;
}