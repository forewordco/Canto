import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { ThemeMode } from "./types";

/* ═══════════════════════════════════════════════════════════
   THEME CONTEXT — Light / Dark / System + Accent Color
   Applies data-theme attribute, .dark class, and accent
   CSS custom property overrides on <html>.
   ═══════════════════════════════════════════════════════════ */

/* ─── Accent Color Presets (from brand guide palette) ─── */

export type AccentId = "coral" | "mustard" | "teal" | "azure" | "fuchsia";

export interface AccentPreset {
  id: AccentId;
  label: string;
  /** Preview swatch color (light mode, used in the picker) */
  swatch: string;
  /** CSS overrides for light mode */
  light: Record<string, string>;
  /** CSS overrides for dark mode */
  dark: Record<string, string>;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: "coral",
    label: "Coral",
    swatch: "oklch(0.70 0.18 25)",
    light: {
      "--accent-primary": "oklch(0.70 0.18 25)",
      "--accent-primary-subtle": "oklch(0.7 0.18 25 / 0.1)",
      "--border-focus": "oklch(0.7 0.18 25 / 0.4)",
      "--ring": "oklch(0.7 0.18 25 / 0.3)",
      "--primary": "oklch(0.70 0.18 25)",
      "--sidebar-primary": "oklch(0.70 0.18 25)",
      "--sidebar-ring": "oklch(0.7 0.18 25 / 0.3)",
    },
    dark: {
      "--accent-primary": "oklch(0.72 0.16 25)",
      "--accent-primary-subtle": "oklch(0.72 0.16 25 / 0.15)",
      "--border-focus": "oklch(0.7 0.18 25 / 0.4)",
      "--ring": "oklch(0.7 0.18 25 / 0.3)",
      "--primary": "oklch(0.72 0.16 25)",
      "--sidebar-primary": "oklch(0.72 0.16 25)",
      "--sidebar-ring": "oklch(0.7 0.18 25 / 0.3)",
    },
  },
  {
    id: "mustard",
    label: "Gold",
    swatch: "oklch(0.80 0.14 85)",
    light: {
      "--accent-primary": "oklch(0.78 0.14 85)",
      "--accent-primary-subtle": "oklch(0.85 0.15 85 / 0.15)",
      "--border-focus": "oklch(0.78 0.14 85 / 0.45)",
      "--ring": "oklch(0.78 0.14 85 / 0.35)",
      "--primary": "oklch(0.78 0.14 85)",
      "--sidebar-primary": "oklch(0.78 0.14 85)",
      "--sidebar-ring": "oklch(0.78 0.14 85 / 0.35)",
    },
    dark: {
      "--accent-primary": "oklch(0.82 0.13 85)",
      "--accent-primary-subtle": "oklch(0.82 0.13 85 / 0.15)",
      "--border-focus": "oklch(0.82 0.13 85 / 0.4)",
      "--ring": "oklch(0.82 0.13 85 / 0.3)",
      "--primary": "oklch(0.82 0.13 85)",
      "--sidebar-primary": "oklch(0.82 0.13 85)",
      "--sidebar-ring": "oklch(0.82 0.13 85 / 0.3)",
    },
  },
  {
    id: "teal",
    label: "Teal",
    swatch: "oklch(0.65 0.15 180)",
    light: {
      "--accent-primary": "oklch(0.65 0.15 180)",
      "--accent-primary-subtle": "oklch(0.65 0.15 180 / 0.1)",
      "--border-focus": "oklch(0.65 0.15 180 / 0.4)",
      "--ring": "oklch(0.65 0.15 180 / 0.3)",
      "--primary": "oklch(0.65 0.15 180)",
      "--sidebar-primary": "oklch(0.65 0.15 180)",
      "--sidebar-ring": "oklch(0.65 0.15 180 / 0.3)",
    },
    dark: {
      "--accent-primary": "oklch(0.72 0.13 172)",
      "--accent-primary-subtle": "oklch(0.72 0.13 172 / 0.15)",
      "--border-focus": "oklch(0.72 0.13 172 / 0.4)",
      "--ring": "oklch(0.72 0.13 172 / 0.3)",
      "--primary": "oklch(0.72 0.13 172)",
      "--sidebar-primary": "oklch(0.72 0.13 172)",
      "--sidebar-ring": "oklch(0.72 0.13 172 / 0.3)",
    },
  },
  {
    id: "azure",
    label: "Indigo",
    swatch: "oklch(0.55 0.20 280)",
    light: {
      "--accent-primary": "oklch(0.55 0.20 280)",
      "--accent-primary-subtle": "oklch(0.55 0.2 280 / 0.1)",
      "--border-focus": "oklch(0.55 0.2 280 / 0.4)",
      "--ring": "oklch(0.55 0.2 280 / 0.3)",
      "--primary": "oklch(0.55 0.20 280)",
      "--sidebar-primary": "oklch(0.55 0.20 280)",
      "--sidebar-ring": "oklch(0.55 0.2 280 / 0.3)",
    },
    dark: {
      "--accent-primary": "oklch(0.68 0.16 260)",
      "--accent-primary-subtle": "oklch(0.68 0.16 260 / 0.15)",
      "--border-focus": "oklch(0.68 0.16 260 / 0.4)",
      "--ring": "oklch(0.68 0.16 260 / 0.3)",
      "--primary": "oklch(0.68 0.16 260)",
      "--sidebar-primary": "oklch(0.68 0.16 260)",
      "--sidebar-ring": "oklch(0.68 0.16 260 / 0.3)",
    },
  },
  {
    id: "fuchsia",
    label: "Fuchsia",
    swatch: "oklch(0.65 0.18 320)",
    light: {
      "--accent-primary": "oklch(0.65 0.18 320)",
      "--accent-primary-subtle": "oklch(0.65 0.18 320 / 0.1)",
      "--border-focus": "oklch(0.65 0.18 320 / 0.4)",
      "--ring": "oklch(0.65 0.18 320 / 0.3)",
      "--primary": "oklch(0.65 0.18 320)",
      "--sidebar-primary": "oklch(0.65 0.18 320)",
      "--sidebar-ring": "oklch(0.65 0.18 320 / 0.3)",
    },
    dark: {
      "--accent-primary": "oklch(0.72 0.14 320)",
      "--accent-primary-subtle": "oklch(0.72 0.14 320 / 0.15)",
      "--border-focus": "oklch(0.72 0.14 320 / 0.4)",
      "--ring": "oklch(0.72 0.14 320 / 0.3)",
      "--primary": "oklch(0.72 0.14 320)",
      "--sidebar-primary": "oklch(0.72 0.14 320)",
      "--sidebar-ring": "oklch(0.72 0.14 320 / 0.3)",
    },
  },
];

/* ─── Context ─── */

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  accent: AccentId;
  setAccent: (accent: AccentId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
  setTheme: () => {},
  accent: "coral",
  setAccent: () => {},
});

const THEME_KEY = "canto-theme";
const ACCENT_KEY = "canto-accent";

function getSystemPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyThemeClass(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

function applyAccentVars(accentId: AccentId, isDark: boolean) {
  const preset = ACCENT_PRESETS.find((p) => p.id === accentId) || ACCENT_PRESETS[0];
  const vars = isDark ? preset.dark : preset.light;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    // Migrate old key
    const old = localStorage.getItem("flowos-theme");
    if (old && !localStorage.getItem(THEME_KEY)) {
      localStorage.setItem(THEME_KEY, old);
      localStorage.removeItem("flowos-theme");
    }
    return (localStorage.getItem(THEME_KEY) as ThemeMode) || "light";
  });

  const [isDark, setIsDark] = useState(() => {
    if (theme === "system") return getSystemPreference();
    return theme === "dark";
  });

  const [accent, setAccentState] = useState<AccentId>(() => {
    if (typeof window === "undefined") return "coral";
    return (localStorage.getItem(ACCENT_KEY) as AccentId) || "coral";
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const setAccent = useCallback((newAccent: AccentId) => {
    setAccentState(newAccent);
    localStorage.setItem(ACCENT_KEY, newAccent);
  }, []);

  // Apply theme class changes
  useEffect(() => {
    const dark = theme === "dark" || (theme === "system" && getSystemPreference());
    setIsDark(dark);
    applyThemeClass(dark);
    applyAccentVars(accent, dark);
  }, [theme, accent]);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      applyThemeClass(e.matches);
      applyAccentVars(accent, e.matches);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, accent]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
