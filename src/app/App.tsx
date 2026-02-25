import { NavigationProvider } from "./lib/navigation";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider, useAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { OAuthCallback, hasOAuthCallback } from "./components/OAuthCallback";
import { Toaster } from "sonner";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";

/*
 * FlowOS — Project management for creative/production teams.
 *
 * Architecture:
 * - Single-page app with state-driven navigation (no React Router)
 * - AuthProvider manages session lifecycle, profile loading, onboarding gate
 * - NavigationProvider manages activeNav string + nav stack
 * - ThemeProvider handles light/dark/system theme
 * - Layout renders the sidebar + main content + brand guide panel
 * - Supabase singleton client on globalThis (see lib/supabase.ts)
 */

/** Loading screen shown during initial session check */
function LoadingScreen() {
  return (
    <div
      className="flex items-center justify-center min-h-screen w-full"
      style={{
        background: "oklch(0.985 0.005 260)",
        fontFamily: "'Albert Sans', sans-serif",
      }}
    >
      <div className="text-center space-y-4">
        <div
          className="w-14 h-14 rounded-[14px] flex items-center justify-center mx-auto shadow-lg"
          style={{
            background: "oklch(0.7 0.18 25)",
            boxShadow: "0 4px 16px oklch(0.7 0.18 25 / 0.25)",
          }}
        >
          <Sparkle className="w-7 h-7 text-white" weight="fill" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <CircleNotch
            className="w-4 h-4 animate-spin"
            style={{ color: "oklch(0.6 0.02 260)" }}
          />
          <span
            style={{
              color: "oklch(0.5 0.02 260)",
              fontSize: "14px",
            }}
          >
            Loading FlowOS...
          </span>
        </div>
      </div>
    </div>
  );
}

/** Auth gate — routes to the correct screen based on auth state */
function AuthGate() {
  const { authState } = useAuth();

  // Handle OAuth callback URLs
  if (hasOAuthCallback()) {
    return <OAuthCallback onComplete={() => window.location.replace(window.location.origin)} />;
  }

  switch (authState) {
    case "loading":
      return <LoadingScreen />;

    case "signed-out":
      return <AuthScreen />;

    case "unconfigured":
      // Show auth screen which has a "skip to preview" button
      return <AuthScreen />;

    case "onboarding":
      return <OnboardingScreen />;

    case "authenticated":
      return (
        <NavigationProvider>
          <Layout />
        </NavigationProvider>
      );
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
        <Toaster position="bottom-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}
