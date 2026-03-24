import { createContext, useContext, useState, useCallback, useRef, startTransition, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════
   NAVIGATION CONTEXT — State-driven single-page navigation
   No React Router. activeNav string drives all page rendering.
   ═══════════════════════════════════════════════════════════ */

export type NavId =
  // App pages
  | "home"
  | "week"
  | "my-tasks"
  | "calendar"
  | "inbox"
  | "updates"
  | "overview"
  | "project"
  | "spaces"
  | "space-detail"
  | "clients-list"
  | "client"
  | "team"
  | "docs"
  | "chat"
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
  docId?: string;
  spaceId?: string;
  conversationId?: string;
  [key: string]: string | undefined;
}

export type RightPanelId = "search" | "chat" | "calendar" | "notepad";

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
  /** Right-side panel system */
  activeRightPanel: RightPanelId | null;
  setActiveRightPanel: (panel: RightPanelId | null) => void;
  toggleRightPanel: (panel: RightPanelId) => void;
  rightPanelPinned: boolean;
  setRightPanelPinned: (pinned: boolean) => void;
  /** Chat panel aliases (backwards-compat) */
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatPinned: boolean;
  setChatPinned: (pinned: boolean) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeNav, setActiveNav] = useState<NavId>("home");
  const [params, setParams] = useState<NavigationParams>({});
  const [navStack, setNavStack] = useState<{ nav: NavId; params: NavigationParams }[]>([]);
  const [brandGuideOpen, setBrandGuideOpen] = useState(false);
  const [brandGuideNav, setBrandGuideNav] = useState<NavId>("brand-overview");
  
  // Right-side panel system
  const [activeRightPanel, setActiveRightPanelState] = useState<RightPanelId | null>(null);
  const [rightPanelPinned, setRightPanelPinnedState] = useState(() => {
    try { return localStorage.getItem("canto-right-panel-pinned") === "true"; } catch { return false; }
  });
  const setRightPanelPinned = useCallback((v: boolean) => {
    setRightPanelPinnedState(v);
    try { localStorage.setItem("canto-right-panel-pinned", String(v)); } catch {}
  }, []);
  const setActiveRightPanel = useCallback((panel: RightPanelId | null) => {
    startTransition(() => {
      setActiveRightPanelState(panel);
    });
  }, []);
  const toggleRightPanel = useCallback((panel: RightPanelId) => {
    startTransition(() => {
      setActiveRightPanelState((prev) => prev === panel ? null : panel);
    });
  }, []);

  // Backwards-compatible chat aliases
  const chatOpen = activeRightPanel === "chat";
  const setChatOpen = useCallback((open: boolean) => {
    startTransition(() => {
      setActiveRightPanelState(open ? "chat" : null);
    });
  }, []);
  const chatPinned = rightPanelPinned;
  const setChatPinned = setRightPanelPinned;

  const navigate = useCallback((nav: NavId, newParams?: NavigationParams) => {
    startTransition(() => {
      setNavStack((prev) => [...prev, { nav: activeNav, params }]);
      setActiveNav(nav);
      setParams(newParams || {});
    });
  }, [activeNav, params]);

  const goBack = useCallback(() => {
    startTransition(() => {
      setNavStack((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const last = next.pop()!;
        setActiveNav(last.nav);
        setParams(last.params);
        return next;
      });
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
        activeRightPanel,
        setActiveRightPanel,
        toggleRightPanel,
        rightPanelPinned,
        setRightPanelPinned,
        chatOpen,
        setChatOpen,
        chatPinned,
        setChatPinned,
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