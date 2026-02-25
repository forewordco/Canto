import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════
   NAVIGATION CONTEXT — State-driven single-page navigation
   No React Router. activeNav string drives all page rendering.
   ═══════════════════════════════════════════════════════════ */

export type NavId =
  // App pages
  | "home"
  | "week"
  | "calendar"
  | "inbox"
  | "overview"
  | "project"
  | "clients-list"
  | "client"
  | "team"
  | "docs"
  | "settings"
  | "search"
  // Brand guide (hidden, accessible via Cmd+Shift+B or settings)
  | "brand-overview"
  | "brand-colors"
  | "brand-typography"
  | "brand-spacing"
  | "brand-components"
  | "brand-tasks"
  | "brand-patterns"
  | "brand-docs"
  | "brand-notifications"
  | "brand-icons"
  | "brand-downloads"
  | "brand-figma-library"
  | "brand-figma-guide"
  | "brand-build-plan"
  | "brand-sample-project"
  | "brand-project-page";

export interface NavigationParams {
  projectId?: string;
  clientId?: string;
  taskId?: string;
  [key: string]: string | undefined;
}

interface NavigationContextValue {
  activeNav: NavId;
  params: NavigationParams;
  navStack: { nav: NavId; params: NavigationParams }[];
  navigate: (nav: NavId, params?: NavigationParams) => void;
  goBack: () => void;
  canGoBack: boolean;
  /** Brand guide panel visibility */
  brandGuideOpen: boolean;
  setBrandGuideOpen: (open: boolean) => void;
  brandGuideNav: NavId;
  setBrandGuideNav: (nav: NavId) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeNav, setActiveNav] = useState<NavId>("home");
  const [params, setParams] = useState<NavigationParams>({});
  const [navStack, setNavStack] = useState<{ nav: NavId; params: NavigationParams }[]>([]);
  const [brandGuideOpen, setBrandGuideOpen] = useState(false);
  const [brandGuideNav, setBrandGuideNav] = useState<NavId>("brand-overview");

  const navigate = useCallback((nav: NavId, newParams?: NavigationParams) => {
    setNavStack((prev) => [...prev, { nav: activeNav, params }]);
    setActiveNav(nav);
    setParams(newParams || {});
  }, [activeNav, params]);

  const goBack = useCallback(() => {
    setNavStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;
      setActiveNav(last.nav);
      setParams(last.params);
      return next;
    });
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeNav,
        params,
        navStack,
        navigate,
        goBack,
        canGoBack: navStack.length > 0,
        brandGuideOpen,
        setBrandGuideOpen,
        brandGuideNav,
        setBrandGuideNav,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within NavigationProvider");
  return ctx;
}
