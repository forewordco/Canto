import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import {
  Palette,
  TextT,
  GridFour,
  PuzzlePiece,
  Sparkle,
  CaretLeft,
  CaretRight,
  BookOpen,
  List,
  X,
  Stack,
  Download,
  FigmaLogo,
  FileText,
  Bell,
  Kanban,
  Rocket,
  ListChecks,
  Cube,
  Blueprint,
  House,
  Tray,
  FolderOpen,
  UsersThree,
  CalendarBlank,
  Gear,
  Binoculars,
  MagnifyingGlass,
  SidebarSimple,
  Moon,
  Sun,
  Monitor,
  SignOut,
} from "@phosphor-icons/react";
import { useNavigation, type NavId } from "../lib/navigation";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";

/* ─── Lazy-loaded Brand Guide Pages ─── */
const BrandOverview = lazy(() => import("./BrandOverview").then((m) => ({ default: m.BrandOverview })));
const ColorPalette = lazy(() => import("./ColorPalette").then((m) => ({ default: m.ColorPalette })));
const TypographyGuide = lazy(() => import("./TypographyGuide").then((m) => ({ default: m.TypographyGuide })));
const SpacingLayout = lazy(() => import("./SpacingLayout").then((m) => ({ default: m.SpacingLayout })));
const ComponentShowcase = lazy(() => import("./ComponentShowcase").then((m) => ({ default: m.ComponentShowcase })));
const TasksShowcase = lazy(() => import("./TasksShowcase").then((m) => ({ default: m.TasksShowcase })));
const ProductPatterns = lazy(() => import("./ProductPatterns").then((m) => ({ default: m.ProductPatterns })));
const DocsDesign = lazy(() => import("./DocsDesign").then((m) => ({ default: m.DocsDesign })));
const NotificationsInbox = lazy(() => import("./NotificationsInbox").then((m) => ({ default: m.NotificationsInbox })));
const IconShowcase = lazy(() => import("./IconShowcase").then((m) => ({ default: m.IconShowcase })));
const DownloadAssets = lazy(() => import("./DownloadAssets").then((m) => ({ default: m.DownloadAssets })));
const FigmaSetupGuide = lazy(() => import("./FigmaSetupGuide").then((m) => ({ default: m.FigmaSetupGuide })));
const FigmaLibrary = lazy(() => import("./FigmaLibrary").then((m) => ({ default: m.FigmaLibrary })));
const SampleProject = lazy(() => import("./SampleProject").then((m) => ({ default: m.SampleProject })));
const OriginalProject = lazy(() => import("./OriginalProject").then((m) => ({ default: m.OriginalProject })));
const BuildPlan = lazy(() => import("./BuildPlan").then((m) => ({ default: m.BuildPlan })));

/* ═══════════════════════════════════════════════════════════
   NAV DEFINITIONS
   ═══════════════════════════════════════════════════════════ */

interface NavItem {
  id: NavId;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/** Main app sidebar nav */
const appNavSections: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { id: "home", label: "Home", icon: House },
      { id: "inbox", label: "Inbox", icon: Tray },
      { id: "overview", label: "Projects", icon: FolderOpen },
      { id: "docs", label: "Docs", icon: FileText },
      { id: "calendar", label: "Calendar", icon: CalendarBlank },
    ],
  },
  {
    label: "Manage",
    items: [
      { id: "clients-list", label: "Clients", icon: Binoculars },
      { id: "team", label: "Team", icon: UsersThree },
    ],
  },
  {
    label: "System",
    items: [
      { id: "settings", label: "Settings", icon: Gear },
    ],
  },
];

/** Brand guide nav (shown in the hidden panel) */
const brandNavSections: NavSection[] = [
  {
    label: "Brand Guide",
    items: [
      { id: "brand-overview", label: "Overview", icon: BookOpen },
      { id: "brand-colors", label: "Colors", icon: Palette },
      { id: "brand-typography", label: "Typography", icon: TextT },
      { id: "brand-spacing", label: "Spacing & Layout", icon: GridFour },
      { id: "brand-components", label: "Components", icon: PuzzlePiece },
      { id: "brand-tasks", label: "Tasks", icon: ListChecks },
      { id: "brand-patterns", label: "Product Patterns", icon: Stack },
      { id: "brand-docs", label: "Docs Design", icon: FileText },
      { id: "brand-notifications", label: "Notifications", icon: Bell },
      { id: "brand-icons", label: "Iconography", icon: Sparkle },
    ],
  },
  {
    label: "Resources",
    items: [
      { id: "brand-downloads", label: "Download Assets", icon: Download },
      { id: "brand-figma-library", label: "Figma Library", icon: Cube },
      { id: "brand-figma-guide", label: "Figma Guide", icon: FigmaLogo },
      { id: "brand-build-plan", label: "Build Plan", icon: Blueprint },
    ],
  },
  {
    label: "Examples",
    items: [
      { id: "brand-sample-project", label: "Sample Project", icon: Kanban },
      { id: "brand-project-page", label: "Atlas Design System", icon: Rocket },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   BRAND GUIDE PAGE RENDERER
   ═══════════════════════════════════════════════════════════ */

function BrandGuidePage({ nav }: { nav: NavId }) {
  const fallback = (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      {nav === "brand-overview" && <BrandOverview />}
      {nav === "brand-colors" && <ColorPalette />}
      {nav === "brand-typography" && <TypographyGuide />}
      {nav === "brand-spacing" && <SpacingLayout />}
      {nav === "brand-components" && <ComponentShowcase />}
      {nav === "brand-tasks" && <TasksShowcase />}
      {nav === "brand-patterns" && <ProductPatterns />}
      {nav === "brand-docs" && <DocsDesign />}
      {nav === "brand-notifications" && <NotificationsInbox />}
      {nav === "brand-icons" && <IconShowcase />}
      {nav === "brand-downloads" && <DownloadAssets />}
      {nav === "brand-figma-library" && <FigmaLibrary />}
      {nav === "brand-figma-guide" && <FigmaSetupGuide />}
      {nav === "brand-build-plan" && <BuildPlan />}
      {nav === "brand-sample-project" && <SampleProject />}
      {nav === "brand-project-page" && <OriginalProject />}
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP PAGE RENDERER (placeholder stubs for now)
   ═══════════════════════════════════════════════════════════ */

function AppPage({ nav }: { nav: NavId }) {
  const pageStubs: Record<string, { title: string; desc: string; icon: React.ElementType }> = {
    home: { title: "Home", desc: "Your Today tasks, Lineup, and upcoming items will appear here.", icon: House },
    inbox: { title: "Inbox", desc: "Notifications from your team and projects.", icon: Tray },
    overview: { title: "Projects", desc: "Portfolio view of all your projects with status and phase tracking.", icon: FolderOpen },
    docs: { title: "Docs", desc: "Workspace documents, notes, and meeting records.", icon: FileText },
    calendar: { title: "Calendar", desc: "Full calendar view with tasks, events, and Google Calendar integration.", icon: CalendarBlank },
    "clients-list": { title: "Clients", desc: "Client management with contacts, contracts, and satisfaction tracking.", icon: Binoculars },
    team: { title: "Team", desc: "Team members, time tracking, and active timers.", icon: UsersThree },
    settings: { title: "Settings", desc: "Profile, theme, integrations, and notification preferences.", icon: Gear },
    week: { title: "Week View", desc: "Weekly calendar with draggable time blocks.", icon: CalendarBlank },
    project: { title: "Project", desc: "Project detail view with tasks, messages, timeline, and files.", icon: FolderOpen },
    client: { title: "Client", desc: "Client detail page.", icon: Binoculars },
    search: { title: "Search", desc: "Search across projects, tasks, clients, docs, and team.", icon: MagnifyingGlass },
  };

  const stub = pageStubs[nav];
  if (!stub) return null;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md space-y-4">
        <div
          className="w-16 h-16 rounded-[12px] flex items-center justify-center mx-auto"
          style={{ background: "var(--accent-primary-subtle)" }}
        >
          <stub.icon className="w-8 h-8" style={{ color: "var(--accent-primary)" }} />
        </div>
        <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700 }}>{stub.title}</h1>
        <p style={{ color: "var(--text-tertiary)", fontSize: "14px", lineHeight: 1.6 }}>{stub.desc}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px]" style={{ background: "var(--accent-primary-subtle)" }}>
          <Sparkle className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span style={{ color: "var(--accent-primary)", fontSize: "13px", fontWeight: 500 }}>Coming in Phase {nav === "home" ? "4" : nav === "inbox" ? "9" : nav === "overview" ? "6" : nav === "docs" ? "7" : nav === "calendar" ? "8" : nav === "clients-list" ? "10" : nav === "team" ? "10" : nav === "settings" ? "10" : "—"}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-[6px]" style={{ background: "var(--neutral-200)" }} />
      <div className="h-4 w-96 rounded" style={{ background: "var(--neutral-200)" }} />
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-[6px]" style={{ background: "var(--neutral-200)" }} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BRAND GUIDE PANEL (Slide-over)
   ═══════════════════════════════════════════════════════════ */

function BrandGuidePanel() {
  const { brandGuideOpen, setBrandGuideOpen, brandGuideNav, setBrandGuideNav } = useNavigation();
  const [bgCollapsed, setBgCollapsed] = useState(false);

  if (!brandGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={() => setBrandGuideOpen(false)}
      />

      {/* Panel */}
      <div
        className="relative ml-auto flex h-full shadow-2xl"
        style={{ width: "min(1200px, 95vw)" }}
      >
        {/* Brand guide sidebar */}
        <aside
          className={`flex flex-col h-full border-r transition-all duration-200 shrink-0 ${bgCollapsed ? "w-[56px]" : "w-[220px]"}`}
          style={{ background: "var(--sidebar-bg)", borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center justify-between h-12 px-3 border-b" style={{ borderColor: "var(--border-default)" }}>
            {!bgCollapsed && (
              <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>
                Brand Guide
              </span>
            )}
            <button
              onClick={() => setBgCollapsed(!bgCollapsed)}
              className="p-1 rounded hover:bg-black/5 transition-colors"
              style={{ color: "var(--text-tertiary)" }}
            >
              <SidebarSimple className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 py-2 px-1.5 overflow-y-auto">
            {brandNavSections.map((section) => (
              <div key={section.label} className="mb-1.5">
                {!bgCollapsed && (
                  <p
                    className="px-2 py-1 uppercase"
                    style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}
                  >
                    {section.label}
                  </p>
                )}
                {bgCollapsed && section.label !== "Brand Guide" && (
                  <div className="mx-2 my-1.5 h-px" style={{ background: "var(--border-default)" }} />
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = brandGuideNav === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setBrandGuideNav(item.id)}
                          className={`flex items-center gap-2 w-full rounded-[6px] px-2 py-1.5 transition-colors ${bgCollapsed ? "justify-center" : ""} ${isActive ? "" : "hover:bg-black/[0.04]"}`}
                          style={{
                            background: isActive ? "var(--accent-primary-subtle)" : undefined,
                            color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                            fontSize: "13px",
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          {!bgCollapsed && <span className="truncate">{item.label}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Brand guide content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--page-bg)" }}>
          <div className="flex items-center h-12 px-4 border-b justify-between" style={{ borderColor: "var(--border-default)", background: "var(--surface-bg)" }}>
            <div className="flex items-center gap-2">
              <Sparkle className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
              <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>FlowOS Design System</span>
            </div>
            <button
              onClick={() => setBrandGuideOpen(false)}
              className="p-1.5 rounded-[6px] hover:bg-black/5 transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              title="Close (Cmd+Shift+B)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12">
            <Suspense fallback={<LoadingSkeleton />}>
              <BrandGuidePage nav={brandGuideNav} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LAYOUT
   ═══════════════════════════════════════════════════════════ */

export function Layout() {
  const { activeNav, navigate, brandGuideOpen, setBrandGuideOpen } = useNavigation();
  const { theme, setTheme, isDark } = useTheme();
  const { profile, signOut, isDevMode } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keyboard shortcut: Cmd+Shift+B to toggle brand guide
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setBrandGuideOpen(!brandGuideOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [brandGuideOpen, setBrandGuideOpen]);

  const handleNavClick = useCallback((id: NavId) => {
    navigate(id);
    setMobileOpen(false);
  }, [navigate]);

  const nextTheme = () => {
    const cycle: Record<string, "light" | "dark" | "system"> = { light: "dark", dark: "system", system: "light" };
    setTheme(cycle[theme]);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Albert Sans', sans-serif" }}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-40 md:relative md:z-auto flex flex-col h-full border-r transition-all duration-300 ease-in-out
          ${collapsed ? "md:w-[68px]" : "md:w-[252px]"}
          ${mobileOpen ? "w-[252px] translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          background: "var(--sidebar-bg)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between h-14 px-3.5 border-b" style={{ borderColor: "var(--border-default)" }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                style={{ background: "var(--accent-primary)" }}
              >
                <Sparkle className="w-4.5 h-4.5 text-white" weight="fill" />
              </div>
              <span style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
                FlowOS
              </span>
            </div>
          )}
          {collapsed && (
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center mx-auto"
              style={{ background: "var(--accent-primary)" }}
            >
              <Sparkle className="w-4.5 h-4.5 text-white" weight="fill" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            {collapsed ? <CaretRight className="w-4 h-4" /> : <CaretLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-[6px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          {appNavSections.map((section) => (
            <div key={section.label} className="mb-2">
              {!collapsed && (
                <p
                  className="px-2.5 py-1.5 uppercase tracking-wider"
                  style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em" }}
                >
                  {section.label}
                </p>
              )}
              {collapsed && section.label !== "Workspace" && (
                <div className="mx-2 my-2 h-px" style={{ background: "var(--border-default)" }} />
              )}
              <ul className="mt-0.5 space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleNavClick(item.id)}
                        className={`flex items-center gap-2.5 w-full rounded-[6px] px-2.5 py-2 transition-all duration-150 ${collapsed ? "justify-center" : ""} ${isActive ? "" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
                        style={{
                          background: isActive ? "var(--accent-primary-subtle)" : undefined,
                          color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                          fontSize: "14px",
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        <item.icon className="w-[18px] h-[18px] shrink-0" weight={isActive ? "fill" : "regular"} />
                        {!collapsed && <span>{item.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-2.5 border-t space-y-1" style={{ borderColor: "var(--border-default)" }}>
          {/* User profile row */}
          {profile && (
            <div className={`flex items-center gap-2.5 rounded-[6px] px-2.5 py-2 ${collapsed ? "justify-center" : ""}`}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                style={{ background: profile.avatarUrl ? undefined : profile.avatarColor }}
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: "white", fontSize: "11px", fontWeight: 700, textShadow: "0 1px 1px oklch(0 0 0 / 0.1)" }}>
                    {profile.displayName ? profile.displayName.split(/\s+/).map(p => p[0]).join("").toUpperCase().slice(0, 2) : "?"}
                  </span>
                )}
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
                    {profile.displayName || "User"}
                  </p>
                  {isDevMode && (
                    <p className="truncate" style={{ color: "var(--text-quaternary)", fontSize: "10px" }}>Preview Mode</p>
                  )}
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={signOut}
                  className="p-1.5 rounded-[6px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors shrink-0"
                  style={{ color: "var(--text-quaternary)" }}
                  title="Sign out"
                >
                  <SignOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={nextTheme}
            className={`flex items-center gap-2.5 w-full rounded-[6px] px-2.5 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors ${collapsed ? "justify-center" : ""}`}
            style={{ color: "var(--text-tertiary)", fontSize: "13px" }}
            title={`Theme: ${theme}`}
          >
            {theme === "light" ? <Sun className="w-4 h-4" /> : theme === "dark" ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            {!collapsed && <span>{theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System"}</span>}
          </button>

          {/* Brand guide toggle */}
          <button
            onClick={() => setBrandGuideOpen(true)}
            className={`flex items-center gap-2.5 w-full rounded-[6px] px-2.5 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors ${collapsed ? "justify-center" : ""}`}
            style={{ color: "var(--text-tertiary)", fontSize: "13px" }}
            title="Brand Guide (Cmd+Shift+B)"
          >
            <Palette className="w-4 h-4" />
            {!collapsed && <span>Brand Guide</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--page-bg)" }}>
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 border-b" style={{ borderColor: "var(--border-default)", background: "var(--surface-bg)" }}>
          <div className="flex items-center">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-[6px]"
              style={{ color: "var(--text-secondary)" }}
            >
              <List className="w-5 h-5" />
            </button>
            <span className="ml-3" style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
              FlowOS
            </span>
          </div>
          <button
            onClick={() => navigate("search")}
            className="p-2 rounded-[6px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <MagnifyingGlass className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12">
          <AppPage nav={activeNav} />
        </div>
      </main>

      {/* Brand Guide Panel (hidden overlay) */}
      <BrandGuidePanel />
    </div>
  );
}