import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { ThemeMode } from "./types";

/* ═══════════════════════════════════════════════════════════
   THEME CONTEXT — Light / Dark / System theme management
   Applies data-theme attribute and .dark class to <html>.
   ═══════════════════════════════════════════════════════════ */

interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
  setTheme: () => {},
});

const STORAGE_KEY = "flowos-theme";

function getSystemPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "light";
  });

  const [isDark, setIsDark] = useState(() => {
    if (theme === "system") return getSystemPreference();
    return theme === "dark";
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
  }, []);

  // Apply theme changes
  useEffect(() => {
    const dark = theme === "dark" || (theme === "system" && getSystemPreference());
    setIsDark(dark);
    applyTheme(dark);
  }, [theme]);

  // Listen for system preference changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
      applyTheme(e.matches);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
