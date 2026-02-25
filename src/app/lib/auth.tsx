import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";
import type { ProfileData } from "./types";
import { kvGet, kvSet } from "./kv";
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
      setAuthState("unconfigured");
      setIsDevMode(true);
      return;
    }

    const supabase = getSupabaseClient();

    // Check existing session
    const initSession = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          // Try to refresh for a fresh JWT
          try {
            const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
            const activeSession = refreshedSession || existingSession;
            setSession(activeSession);
            setUser(activeSession.user);
            await loadProfile(activeSession.user.id, activeSession.user.email || "");
          } catch {
            // Network error during refresh — use existing session (don't sign out)
            setSession(existingSession);
            setUser(existingSession.user);
            await loadProfile(existingSession.user.id, existingSession.user.email || "");
          }
        } else {
          setAuthState("signed-out");
        }
      } catch {
        // Total failure — show sign-in
        setAuthState("signed-out");
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
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

    return () => subscription.unsubscribe();
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
      // Call the server /signup route which uses admin.createUser
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        return { error: error.message };
      }
      // Auto sign-in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { error: "Account created! Please check your email to confirm, then sign in." };
      }
      return { error: null };
    } catch (err) {
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
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
