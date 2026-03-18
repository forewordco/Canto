/**
 * Canto — Inner Application Shell
 *
 * This module contains the real app: providers, auth gate, and layout.
 * It's loaded dynamically by App.tsx so that any import-time errors
 * are caught and displayed as a diagnostic message.
 * @version rebuild
 */

import { NavigationProvider } from "./lib/navigation";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider, useAuth } from "./lib/auth";
import { DataProvider } from "./lib/data";
import { Layout } from "./components/Layout";
import { AuthScreen } from "./components/AuthScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { OAuthCallback, hasOAuthCallback } from "./components/OAuthCallback";
import { Toaster } from "sonner";
import { Sparkle, CircleNotch } from "@phosphor-icons/react";
import { ScreenReaderAnnouncer } from "./components/ScreenReaderAnnouncer";
import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { registerServiceWorker } from "./lib/push";

/* ─── Check if we're on a published page ─── */
function getPublishedSlug(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/^#\/published\/(.+)$/);
  return match ? match[1] : null;
}

const PublishedViewer = lazy(() => import("./components/PublishedViewer"));

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
            Loading Canto...
          </span>
        </div>
      </div>
    </div>
  );
}

/** Auth gate — routes to the correct screen based on auth state */
function AuthGate() {
  const { authState } = useAuth();

  console.log("[Canto] AuthGate render, authState:", authState);

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
      return <AuthScreen />;

    case "onboarding":
      return <OnboardingScreen />;

    case "authenticated":
      return (
        <NavigationProvider>
          <DataProvider>
            <Layout />
          </DataProvider>
        </NavigationProvider>
      );
  }
}

export default function AppInner() {
  console.log("[Canto] AppInner render");

  // Register service worker on startup (non-blocking)
  useEffect(() => {
    registerServiceWorker().catch(() => {});
  }, []);

  // Wingdings Easter Egg (P14-6) — Cmd+Alt+Shift+K toggles all fonts to Wingdings
  const [wingdings, setWingdings] = useState(false);
  const wingdingsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setWingdings((prev) => {
          const next = !prev;
          if (next) {
            document.documentElement.style.setProperty("--font-override", "Wingdings, Webdings, Symbol, sans-serif");
            // Auto-disable after 5 minutes
            wingdingsTimerRef.current = setTimeout(() => {
              setWingdings(false);
              document.documentElement.style.removeProperty("--font-override");
            }, 5 * 60 * 1000);
          } else {
            document.documentElement.style.removeProperty("--font-override");
            if (wingdingsTimerRef.current) {
              clearTimeout(wingdingsTimerRef.current);
              wingdingsTimerRef.current = null;
            }
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (wingdingsTimerRef.current) clearTimeout(wingdingsTimerRef.current);
    };
  }, []);

  // Apply wingdings font-family override via a style tag
  useEffect(() => {
    if (wingdings) {
      const style = document.createElement("style");
      style.id = "wingdings-easter-egg";
      style.textContent = `* { font-family: Wingdings, Webdings, Symbol, sans-serif !important; }`;
      document.head.appendChild(style);
      return () => { style.remove(); };
    } else {
      document.getElementById("wingdings-easter-egg")?.remove();
    }
  }, [wingdings]);

  // Inject PWA manifest and Apple meta tags
  useEffect(() => {
    // Manifest link
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = "/manifest.json";
      document.head.appendChild(link);
    }

    // Apple-specific PWA meta tags
    const appleMeta = [
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Canto" },
      { name: "theme-color", content: "#E8604C" },
    ];
    for (const { name, content } of appleMeta) {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement("meta");
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    }

    // Apple touch icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement("link");
      link.rel = "apple-touch-icon";
      link.href = "/icons/icon.svg";
      document.head.appendChild(link);
    }
  }, []);

  // Check for published page route (no auth needed)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(getPublishedSlug);

  useEffect(() => {
    const handleHashChange = () => {
      setPublishedSlug(getPublishedSlug());
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Published pages bypass auth entirely
  if (publishedSlug) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PublishedViewer slug={publishedSlug} />
        <Toaster position="bottom-right" />
      </Suspense>
    );
  }

  return (
    <ThemeProvider>
      <ScreenReaderAnnouncer>
        <AuthProvider>
          <AuthGate />
          <Toaster position="bottom-right" />
        </AuthProvider>
      </ScreenReaderAnnouncer>
    </ThemeProvider>
  );
}