import { useState, useEffect, useCallback, useRef, lazy, Suspense, Component, type ReactNode } from "react";
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
  DotsThree,
  ArrowLeft,
  WifiSlash,
  ArrowClockwise,
  Briefcase,
  Check,
  Star,
  SkipForward,
  CalendarDots,
  Notepad,
  Timer,
  Notebook,
  CirclesFour,
  SquareHalf,
  ChatCircle,
  PushPin,
  Newspaper,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigation, type NavId, type RightPanelId } from "../lib/navigation";
import { api } from "../lib/api";
import { useTheme } from "../lib/theme";
import { useAuth } from "../lib/auth";
import { CommandPalette } from "./CommandPalette";
import { SidebarTimer, MobileFloatingTimer } from "./FloatingTimer";
import { useData } from "../lib/data";
import { useTodayTasks, useLineupTasks } from "../lib/data";
import { useTodayDocs, useLineupDocs } from "../lib/data";
import { useStarredProjects } from "../lib/data";
import { useNotificationPolling } from "../lib/notifications";
import { ErrorBoundary } from "./ErrorBoundary";
import { SpaceSwitcher } from "./SpaceSwitcher";
import { useOnlineStatus } from "../lib/offline";
import { haptic } from "../lib/haptics";
import { useTimer } from "./FloatingTimer";
import { ProjectIcon } from "./ProjectIcon";
import { UserOrbitMenu } from "./UserOrbitMenu";
import { GlobalTaskDetailProvider } from "./GlobalTaskDetail";
import { DragProvider, useDrag, getDragData, hasDragData, formatMention, type DragPayload } from "../lib/drag-context";
import { ProjectPage } from "./ProjectPage";
import { ProjectsOverview } from "./ProjectsOverview";
import HomePage from "./HomePage";
import {
  HomePageSkeleton,
  ProjectPageSkeleton,
  ProjectListSkeleton,
  DocListSkeleton,
  CalendarSkeleton,
  InboxSkeleton,
  TeamPageSkeleton,
  GenericPageSkeleton,
} from "./LoadingSkeletons";

/* ─── Lazy import with retry ─── */
function lazyRetry<T extends Record<string, any>>(
  factory: () => Promise<T>,
  key: keyof T,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<React.ComponentType<any>> {
  return lazy(() => {
    const attempt = (remaining: number): Promise<{ default: React.ComponentType<any> }> =>
      factory()
        .then((m) => ({ default: m[key] as React.ComponentType<any> }))
        .catch((err) => {
          if (remaining <= 0) {
            // If all retries exhausted and it's a fetch error (stale module URL),
            // force a full page reload to get fresh module URLs
            if (
              err?.message?.includes("Failed to fetch dynamically imported module") ||
              err?.message?.includes("error loading dynamically imported module")
            ) {
              const reloadKey = `lazyRetry_reload_${String(key)}`;
              if (!sessionStorage.getItem(reloadKey)) {
                sessionStorage.setItem(reloadKey, "1");
                console.warn(`[LazyRetry] Forcing page reload for stale module: ${String(key)}`);
                window.location.reload();
              } else {
                sessionStorage.removeItem(reloadKey);
              }
            }
            throw err;
          }
          return new Promise((resolve) =>
            setTimeout(() => resolve(attempt(remaining - 1)), delay)
          );
        });
    return attempt(retries);
  });
}

/* ─── Error boundary for lazy chunks ─── */
class LazyErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Failed to load this section.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
              }}
              className="px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ background: "var(--accent-primary)" }}
            >
              Retry
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

/* ─── Lazy-loaded Brand Guide Pages ─── */
const BrandOverview = lazyRetry(() => import("./brand-guide/BrandOverview"), "BrandOverview");
const ColorPalette = lazyRetry(() => import("./brand-guide/ColorPalette"), "ColorPalette");
const TypographyGuide = lazyRetry(() => import("./brand-guide/TypographyGuide"), "TypographyGuide");
const SpacingLayout = lazyRetry(() => import("./brand-guide/SpacingLayout"), "SpacingLayout");
const ComponentShowcase = lazyRetry(() => import("./brand-guide/ComponentShowcase"), "ComponentShowcase");
const TasksShowcase = lazyRetry(() => import("./brand-guide/TasksShowcase"), "TasksShowcase");
const ProductPatterns = lazyRetry(() => import("./brand-guide/ProductPatterns"), "ProductPatterns");
const DocsDesign = lazyRetry(() => import("./brand-guide/DocsDesign"), "DocsDesign");
const NotificationsInbox = lazyRetry(() => import("./brand-guide/NotificationsInbox"), "NotificationsInbox");
const IconShowcase = lazyRetry(() => import("./brand-guide/IconShowcase"), "IconShowcase");
const DownloadAssets = lazyRetry(() => import("./brand-guide/DownloadAssets"), "DownloadAssets");
const FigmaSetupGuide = lazyRetry(() => import("./brand-guide/FigmaSetupGuide"), "FigmaSetupGuide");
const FigmaLibrary = lazyRetry(() => import("./brand-guide/FigmaLibrary"), "FigmaLibrary");
const SampleProject = lazyRetry(() => import("./brand-guide/SampleProject"), "SampleProject");
const OriginalProject = lazyRetry(() => import("./brand-guide/OriginalProject"), "OriginalProject");
const BuildPlan = lazyRetry(() => import("./brand-guide/BuildPlan"), "BuildPlan");

/* ─── Lazy-loaded App Pages ─── */
const DocsPage = lazyRetry(() => import("./DocsPage"), "DocsPage");
const CalendarPage = lazyRetry(() => import("./CalendarPage"), "CalendarPage");
const WeekViewPage = lazyRetry(() => import("./WeekViewPage"), "WeekViewPage");
const MyTasksPage = lazyRetry(() => import("./MyTasksPage"), "MyTasksPage");
const InboxPage = lazyRetry(() => import("./InboxPage"), "InboxPage");
const TeamPage = lazyRetry(() => import("./TeamPage"), "TeamPage");
const ClientsListPage = lazyRetry(() => import("./ClientsListPage"), "ClientsListPage");
const ClientPage = lazyRetry(() => import("./ClientsListPage"), "ClientPage");
const ProfileSettingsPage = lazyRetry(() => import("./ProfileSettingsPage"), "ProfileSettingsPage");
const SpacesPage = lazyRetry(() => import("./SpacesPage"), "SpacesPage");
const SpaceDetailPage = lazyRetry(() => import("./SpaceDetailPage"), "SpaceDetailPage");
const ChatPage = lazyRetry(() => import("./ChatPage"), "ChatPage");
const UpdatesPage = lazyRetry(() => import("./UpdatesPage"), "UpdatesPage");

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

/** Main app sidebar nav — two clean groups, no section labels */
const sidebarNavGroups: NavItem[][] = [
  [
    { id: "home", label: "Home", icon: House },
    { id: "week", label: "This Week", icon: CalendarDots },
    { id: "my-tasks", label: "My Tasks", icon: ListChecks },
    { id: "calendar", label: "Calendar", icon: CalendarBlank },
    { id: "inbox", label: "Inbox", icon: Bell },
  ],
  [
    { id: "updates", label: "Updates", icon: Newspaper },
    { id: "overview", label: "Projects", icon: SquareHalf },
    { id: "docs", label: "Docs", icon: Notebook },
  ],
];

/** Flat list for AppPage lookups (keep old appNavSections for brand guide / AppPage stubs) */
const appNavSections: NavSection[] = [
  {
    label: "Workspace",
    items: [
      { id: "home", label: "Home", icon: House },
      { id: "inbox", label: "Inbox", icon: Tray },
      { id: "updates", label: "Updates", icon: Newspaper },
      { id: "overview", label: "Projects", icon: SquareHalf },
      { id: "docs", label: "Docs", icon: Notebook },
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

/** Bottom tab bar items (mobile) — 5 tabs */
const BOTTOM_TABS: NavItem[] = [
  { id: "home", label: "Home", icon: House },
  { id: "overview", label: "Projects", icon: SquareHalf },
  { id: "inbox", label: "Inbox", icon: Tray },
  { id: "docs", label: "Docs", icon: Notebook },
];

/** "More" menu items — everything not in bottom tabs */
const MORE_ITEMS: NavItem[] = [
  { id: "calendar", label: "Calendar", icon: CalendarBlank },
  { id: "clients-list", label: "Clients", icon: Binoculars },
  { id: "team", label: "Team", icon: UsersThree },
  { id: "settings", label: "Settings", icon: Gear },
];

/** Brand guide nav */
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

/* ─── Chat redirect: if someone lands on nav="chat", auto-open the panel ─── */
function ChatPageRedirect() {
  const { setChatOpen, navigate } = useNavigation();
  useEffect(() => {
    setChatOpen(true);
    navigate("home");
  }, []);
  return null;
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP PAGE RENDERER (placeholder stubs)
   ═══════════════════════════════════════════════════════════ */

function AppPage({ nav }: { nav: NavId }) {
  const pageStubs: Record<string, { title: string; desc: string; icon: React.ElementType; phase: string }> = {
    home: { title: "Home", desc: "Your Today tasks, Lineup, and upcoming items will appear here.", icon: House, phase: "4" },
    inbox: { title: "Inbox", desc: "Notifications from your team and projects.", icon: Tray, phase: "9" },
    overview: { title: "Projects", desc: "Portfolio view of all your projects with status and phase tracking.", icon: SquareHalf, phase: "6" },
    docs: { title: "Docs", desc: "Workspace documents, notes, and meeting records.", icon: Notebook, phase: "7" },
    calendar: { title: "Calendar", desc: "Full calendar view with tasks, events, and Google Calendar integration.", icon: CalendarBlank, phase: "8" },
    "clients-list": { title: "Clients", desc: "Client management with contacts, contracts, and satisfaction tracking.", icon: Binoculars, phase: "10" },
    team: { title: "Team", desc: "Team members, time tracking, and active timers.", icon: UsersThree, phase: "10" },
    settings: { title: "Settings", desc: "Profile, theme, integrations, and notification preferences.", icon: Gear, phase: "10" },
    week: { title: "This Week", desc: "4-day time-blocking planner with drag-and-drop scheduling.", icon: CalendarDots, phase: "8" },
    "my-tasks": { title: "My Tasks", desc: "All tasks assigned to you, grouped by project.", icon: ListChecks, phase: "4" },
    project: { title: "Project", desc: "Project detail view with tasks, messages, timeline, and files.", icon: SquareHalf, phase: "5" },
    client: { title: "Client", desc: "Client detail page.", icon: Binoculars, phase: "10" },
    search: { title: "Search", desc: "Search across projects, tasks, clients, docs, and team.", icon: MagnifyingGlass, phase: "2" },
    spaces: { title: "Spaces", desc: "Manage your workspace spaces — organize projects, docs, and tasks into teams and categories.", icon: CirclesFour, phase: "11" },
    "space-detail": { title: "Space", desc: "Space detail view.", icon: CirclesFour, phase: "11" },
    chat: { title: "Chat", desc: "One-on-one messaging with your team.", icon: ChatCircle, phase: "13" },
    updates: { title: "Updates", desc: "Social-style news feed for team updates.", icon: Newspaper, phase: "15" },
  };

  const stub = pageStubs[nav];
  if (!stub) return null;

  // Render real pages for implemented phases
  if (nav === "home") {
    return (
      <ErrorBoundary section="Home">
        <HomePage />
      </ErrorBoundary>
    );
  }
  if (nav === "project") {
    return (
      <ErrorBoundary section="Project">
        <Suspense fallback={<ProjectPageSkeleton />}>
          <ProjectPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "overview") {
    return (
      <ErrorBoundary section="Projects Overview">
        <Suspense fallback={<ProjectListSkeleton />}>
          <ProjectsOverview />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "docs") {
    return (
      <ErrorBoundary section="Docs">
        <Suspense fallback={<DocListSkeleton />}>
          <DocsPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "calendar") {
    return (
      <ErrorBoundary section="Calendar">
        <Suspense fallback={<CalendarSkeleton />}>
          <CalendarPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "week") {
    return (
      <ErrorBoundary section="Week View">
        <Suspense fallback={<CalendarSkeleton />}>
          <WeekViewPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "my-tasks") {
    return (
      <ErrorBoundary section="My Tasks">
        <Suspense fallback={<HomePageSkeleton />}>
          <MyTasksPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "inbox") {
    return (
      <ErrorBoundary section="Inbox">
        <Suspense fallback={<InboxSkeleton />}>
          <InboxPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "team") {
    return (
      <ErrorBoundary section="Team">
        <Suspense fallback={<TeamPageSkeleton />}>
          <TeamPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "clients-list") {
    return (
      <ErrorBoundary section="Clients">
        <Suspense fallback={<GenericPageSkeleton />}>
          <ClientsListPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "client") {
    return (
      <ErrorBoundary section="Client Detail">
        <Suspense fallback={<GenericPageSkeleton />}>
          <ClientPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "settings") {
    return (
      <ErrorBoundary section="Settings">
        <Suspense fallback={<GenericPageSkeleton />}>
          <ProfileSettingsPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "spaces") {
    return (
      <ErrorBoundary section="Spaces">
        <Suspense fallback={<GenericPageSkeleton />}>
          <SpacesPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "space-detail") {
    return (
      <ErrorBoundary section="Space Detail">
        <Suspense fallback={<GenericPageSkeleton />}>
          <SpaceDetailPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "updates") {
    return (
      <ErrorBoundary section="Updates">
        <Suspense fallback={<GenericPageSkeleton />}>
          <UpdatesPage />
        </Suspense>
      </ErrorBoundary>
    );
  }
  if (nav === "chat") {
    // Chat is now a sidebar panel — show a redirect hint
    return <ChatPageRedirect />;
  }

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
          <span style={{ color: "var(--accent-primary)", fontSize: "13px", fontWeight: 500 }}>Coming in Phase {stub.phase}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOBILE "MORE" MENU SHEET
   ══════════════════════════════════════════════════════════ */

function MoreMenu({
  open,
  onClose,
  onSelect,
  activeNav,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: NavId) => void;
  activeNav: NavId;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        className="absolute bottom-0 left-0 right-0 rounded-t-[16px] overflow-hidden"
        style={{
          background: "var(--surface-bg)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.1)",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 350 }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--neutral-300)" }} />
        </div>

        <div className="px-4 pb-4 space-y-1">
          <p
            className="px-3 py-2 uppercase"
            style={{
              color: "var(--text-quaternary)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            More
          </p>
          {MORE_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
                className="flex items-center gap-3 w-full rounded-[8px] px-3 py-3 transition-colors"
                style={{
                  background: isActive ? "var(--accent-primary-subtle)" : "transparent",
                  color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontSize: "15px",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                <item.icon className="w-5 h-5" weight={isActive ? "fill" : "regular"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
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
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setBrandGuideOpen(false)}
      />

      {/* Panel */}
      <motion.div
        className="relative ml-auto flex h-full shadow-2xl"
        style={{ width: "min(1200px, 95vw)" }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Brand guide sidebar */}
        <aside
          className={`hidden md:flex flex-col h-full border-r transition-all duration-200 shrink-0 ${bgCollapsed ? "w-[56px]" : "w-[220px]"}`}
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
              <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>Canto Design System</span>
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
            <LazyErrorBoundary>
              <Suspense fallback={<GenericPageSkeleton />}>
                <BrandGuidePage nav={brandGuideNav} />
              </Suspense>
            </LazyErrorBoundary>
          </div>
        </main>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   RIGHT-SIDE PANEL SYSTEM — Gmail-style icon rail + slide-out panels
   ══════════════════════════════════════════════════���════════ */

const DEFAULT_RIGHT_PANEL_WIDTH = 380;
const ICON_RAIL_WIDTH = 44;
const DEFAULT_LEFT_SIDEBAR_WIDTH = 252;

/* ═══════════════════════════════════════════════════════════
   RESIZABLE PANEL HOOK — drag handle for sidebar/panel resize
   ═══════════════════════════════════════════════════════════ */

function useResizablePanel({
  storageKey,
  defaultWidth,
  minWidth,
  maxWidth,
  side,
}: {
  storageKey: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  side: "left" | "right";
}) {
  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) return parsed;
      }
    } catch {}
    return defaultWidth;
  });
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startXRef.current;
      const newWidth =
        side === "left"
          ? startWidthRef.current + dx
          : startWidthRef.current - dx;
      const clamped = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minWidth, maxWidth, side]);

  // Persist when dragging stops
  useEffect(() => {
    if (isDragging) return;
    try { localStorage.setItem(storageKey, String(width)); } catch {}
  }, [width, isDragging, storageKey]);

  const resetToDefault = useCallback(() => {
    setWidth(defaultWidth);
    try { localStorage.setItem(storageKey, String(defaultWidth)); } catch {}
  }, [defaultWidth, storageKey]);

  return { width, isDragging, handleMouseDown, resetToDefault };
}

/** Resize drag handle bar */
function ResizeHandle({
  side,
  onMouseDown,
  isDragging,
  onDoubleClick,
}: {
  side: "left" | "right";
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  onDoubleClick?: () => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      className={`absolute top-0 bottom-0 z-10 hidden md:flex items-center justify-center group ${
        side === "left" ? "right-0 translate-x-1/2" : "left-0 -translate-x-1/2"
      }`}
      style={{ width: "9px", cursor: "col-resize" }}
    >
      <div
        className="h-full transition-all duration-150"
        style={{
          width: isDragging ? "3px" : "1px",
          borderRadius: "1px",
          background: isDragging ? "var(--accent-primary)" : "transparent",
        }}
      />
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div
          className="h-full"
          style={{
            width: isDragging ? "3px" : "2px",
            borderRadius: "1px",
            background: "var(--accent-primary)",
            opacity: isDragging ? 1 : 0.5,
          }}
        />
      </div>
    </div>
  );
}

/** Panel metadata for the icon rail */
const RIGHT_PANEL_ITEMS: {
  id: RightPanelId;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
}[] = [
  { id: "search", label: "Search", icon: MagnifyingGlass, shortcut: "⌘⇧F" },
  { id: "chat", label: "Chat", icon: ChatCircle, shortcut: "⌘⇧M" },
  { id: "calendar", label: "Calendar", icon: CalendarBlank, shortcut: "⌘⇧K" },
  { id: "notepad", label: "Notepad", icon: Notepad, shortcut: "⌘⇧N" },
];

/** Panels that accept drag drops */
const DROPPABLE_PANELS = new Set<RightPanelId>(["chat", "calendar", "notepad"]);

/** Right-side icon rail — always visible on desktop */
function RightIconRail() {
  const { activeRightPanel, toggleRightPanel, setActiveRightPanel } = useNavigation();
  const { dragging, enqueueDrop } = useDrag();
  const [dragOverId, setDragOverId] = useState<RightPanelId | null>(null);

  return (
    <div
      className="hidden md:flex flex-col items-center py-3 gap-1 shrink-0 border-l h-full"
      style={{
        width: `${ICON_RAIL_WIDTH}px`,
        background: "var(--surface-bg)",
        borderColor: "var(--border-default)",
      }}
    >
      {RIGHT_PANEL_ITEMS.map((item) => {
        const isActive = activeRightPanel === item.id;
        const isDroppable = DROPPABLE_PANELS.has(item.id);
        const isDragOver = dragOverId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => toggleRightPanel(item.id)}
            onDragOver={(e) => {
              if (!isDroppable) return;
              if (!hasDragData(e) && !dragging) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDragOverId(item.id);
            }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverId(null);
              if (!isDroppable) return;
              const payload = getDragData(e) || dragging;
              if (payload) {
                // Open the panel and enqueue the drop
                setActiveRightPanel(item.id);
                enqueueDrop(item.id, payload);
              }
            }}
            className={`w-[34px] h-[34px] flex items-center justify-center rounded-[8px] transition-all duration-150 relative group ${
              !isActive && !isDragOver ? "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]" : ""
            }`}
            style={{
              background: isDragOver
                ? "var(--accent-primary)"
                : isActive
                ? "var(--accent-primary-subtle)"
                : undefined,
              color: isDragOver
                ? "#fff"
                : isActive
                ? "var(--accent-primary)"
                : "var(--text-tertiary)",
              boxShadow: isDragOver ? "0 0 0 2px var(--accent-primary)" : undefined,
              transform: isDragOver ? "scale(1.15)" : undefined,
            }}
            title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}${isDroppable && dragging ? " — Drop to add" : ""}`}
          >
            <item.icon
              size={18}
              weight={isActive || isDragOver ? "fill" : "regular"}
            />
            {/* Tooltip */}
            <div
              className="absolute right-full mr-2 px-2 py-1 rounded-[6px] text-[11px] font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150"
              style={{
                background: "var(--text-primary)",
                color: "var(--surface-bg)",
              }}
            >
              {item.label}{item.shortcut ? ` ${item.shortcut}` : ""}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Search Panel Content ─── */
function SearchPanelContent() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus search input when panel opens
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="px-3 py-3">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
          style={{
            background: "var(--input-bg, var(--page-bg))",
            border: "1px solid var(--border-default)",
          }}
        >
          <MagnifyingGlass size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, docs..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-0.5" style={{ color: "var(--text-quaternary)" }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-3">
        {!query ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <MagnifyingGlass size={32} style={{ color: "var(--text-quaternary)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              Search across your workspace
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {["My tasks", "Due this week", "Unassigned", "Recent docs"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-[12px] font-medium mb-3" style={{ color: "var(--text-tertiary)" }}>
              Results for "{query}"
            </p>
            <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
              Search results will appear here as you type.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Calendar Panel Content ─── */
function CalendarPanelContent() {
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = today.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const { pendingDrop, consumeDrop, dragging } = useDrag();
  const { timer, start: startTimer } = useTimer();
  const [dropHighlight, setDropHighlight] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState<{ id: string; title: string; projectName?: string; time: string; color: string; taskId: string; tracking: boolean }[]>(() => {
    try {
      const saved = localStorage.getItem("canto-calendar-blocks");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveBlocks = useCallback((blocks: typeof timeBlocks) => {
    setTimeBlocks(blocks);
    try { localStorage.setItem("canto-calendar-blocks", JSON.stringify(blocks)); } catch {}
  }, []);

  const addTimeBlock = useCallback((payload: DragPayload) => {
    // Snap to next 30-minute slot
    const now = new Date();
    const mins = now.getMinutes();
    const next30 = mins < 30 ? 30 : 60;
    const slotTime = new Date(now);
    if (next30 === 60) {
      slotTime.setHours(slotTime.getHours() + 1, 0, 0, 0);
    } else {
      slotTime.setMinutes(30, 0, 0);
    }
    const timeStr = slotTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const colors = ["#6366F1", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6", "#EF4444"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const block = {
      id: payload.id + "-" + Date.now(),
      title: payload.title,
      projectName: payload.projectName,
      time: timeStr,
      color,
      taskId: payload.id,
      tracking: false,
    };
    const updated = [...timeBlocks, block];
    saveBlocks(updated);

    // Auto-start time tracking
    if (!timer.isRunning) {
      startTimer(payload.id, payload.title, payload.projectName || "");
      // Mark this block as tracking
      saveBlocks(updated.map((b) => b.id === block.id ? { ...b, tracking: true } : b));
    }
  }, [timeBlocks, saveBlocks, timer, startTimer]);

  // Consume pending drops from icon rail
  useEffect(() => {
    if (pendingDrop?.target === "calendar") {
      const drop = consumeDrop();
      if (drop) addTimeBlock(drop.payload);
    }
  }, [pendingDrop]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHighlight(false);
    const payload = getDragData(e) || dragging;
    if (!payload) return;
    addTimeBlock(payload);
  };

  const removeBlock = (blockId: string) => {
    saveBlocks(timeBlocks.filter((b) => b.id !== blockId));
  };

  // Generate days for current month mini-calendar
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Mock upcoming items
  const upcomingItems = [
    { time: "9:00 AM", title: "Team standup", color: "#6366F1" },
    { time: "11:30 AM", title: "Design review", color: "#F59E0B" },
    { time: "2:00 PM", title: "Sprint planning", color: "#10B981" },
    { time: "4:30 PM", title: "1:1 with manager", color: "#EC4899" },
  ];

  // Merge fixed schedule + time blocks for today
  const allItems = [
    ...upcomingItems.map((i) => ({ ...i, isBlock: false as const, id: i.title })),
    ...timeBlocks.map((b) => ({ ...b, isBlock: true as const })),
  ];

  return (
    <div
      className="flex flex-col h-full overflow-y-auto"
      onDragOver={(e) => {
        if (hasDragData(e) || dragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDropHighlight(true);
        }
      }}
      onDragLeave={() => setDropHighlight(false)}
      onDrop={handleDrop}
      style={{
        outline: dropHighlight ? "2px solid var(--accent-primary)" : undefined,
        outlineOffset: "-2px",
      }}
    >
      {/* Mini calendar */}
      <div className="px-3 py-3">
        <p className="text-[13px] font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {monthName}
        </p>
        <div className="grid grid-cols-7 gap-px">
          {dayNames.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-medium py-1"
              style={{ color: "var(--text-quaternary)" }}
            >
              {d}
            </div>
          ))}
          {calendarDays.map((day, i) => {
            const isToday = day === today.getDate();
            return (
              <div
                key={i}
                className={`text-center text-[11px] py-1 rounded-[4px] ${
                  day ? "cursor-pointer hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" : ""
                }`}
                style={{
                  background: isToday ? "var(--accent-primary)" : undefined,
                  color: isToday ? "#fff" : day ? "var(--text-secondary)" : "transparent",
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {day || "."}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-3 h-px" style={{ background: "var(--border-default)" }} />

      {/* Drop hint */}
      {dropHighlight && (
        <div className="px-3 py-2 text-[11px] font-medium flex items-center gap-1.5" style={{ color: "var(--accent-primary)", background: "var(--accent-primary-subtle)" }}>
          <CalendarBlank size={13} weight="bold" />
          Drop to create time block & start tracking
        </div>
      )}

      {/* Today's schedule */}
      <div className="px-3 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-tertiary)" }}>
          Today's schedule
        </p>
        <div className="space-y-1.5">
          {allItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] cursor-pointer group"
            >
              <div className="w-[3px] h-[24px] rounded-full shrink-0" style={{ background: item.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                    {item.time}
                  </p>
                  {item.isBlock && "projectName" in item && item.projectName && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[3px]" style={{ background: "var(--accent-primary-subtle)", color: "var(--accent-primary)" }}>
                      {item.projectName}
                    </span>
                  )}
                  {item.isBlock && "tracking" in item && item.tracking && timer.isRunning && timer.taskId === item.taskId && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium" style={{ background: "#10B98120", color: "#10B981" }}>
                      Tracking
                    </span>
                  )}
                </div>
              </div>
              {item.isBlock && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeBlock(item.id); }}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-[4px] transition-all hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                  style={{ color: "var(--text-quaternary)" }}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Notepad Panel Content ─── */
function NotepadPanelContent() {
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem("canto-notepad") || ""; } catch { return ""; }
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pendingDrop, consumeDrop, dragging } = useDrag();
  const [dropHighlight, setDropHighlight] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Consume pending drops from icon rail
  useEffect(() => {
    if (pendingDrop?.target === "notepad") {
      const drop = consumeDrop();
      if (drop) {
        const mention = formatMention(drop.payload);
        const updated = notes ? notes + "\n" + mention + " " : mention + " ";
        setNotes(updated);
        try { localStorage.setItem("canto-notepad", updated); } catch {}
        // Focus at end
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = updated.length;
            textareaRef.current.selectionEnd = updated.length;
          }
        }, 50);
      }
    }
  }, [pendingDrop]);

  const handleChange = (value: string) => {
    setNotes(value);
    // Debounced save to localStorage
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      try { localStorage.setItem("canto-notepad", value); } catch {}
    }, 500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHighlight(false);
    const payload = getDragData(e) || dragging;
    if (!payload) return;
    const mention = formatMention(payload);
    // Insert at cursor or append
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? notes.length;
      const updated = notes.slice(0, start) + mention + " " + notes.slice(start);
      handleChange(updated);
      setTimeout(() => {
        ta.focus();
        ta.selectionStart = start + mention.length + 1;
        ta.selectionEnd = start + mention.length + 1;
      }, 20);
    } else {
      handleChange(notes ? notes + "\n" + mention + " " : mention + " ");
    }
  };

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={(e) => {
        if (hasDragData(e) || dragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDropHighlight(true);
        }
      }}
      onDragLeave={() => setDropHighlight(false)}
      onDrop={handleDrop}
      style={{
        outline: dropHighlight ? "2px solid var(--accent-primary)" : undefined,
        outlineOffset: "-2px",
        borderRadius: "0 0 8px 8px",
      }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
        <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </span>
        <button
          onClick={() => { setNotes(""); try { localStorage.removeItem("canto-notepad"); } catch {} }}
          className="text-[11px] px-2 py-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{ color: "var(--text-tertiary)" }}
        >
          Clear
        </button>
      </div>

      {/* Drop hint */}
      {dropHighlight && (
        <div className="px-3 py-2 text-[11px] font-medium" style={{ color: "var(--accent-primary)", background: "var(--accent-primary-subtle)" }}>
          Drop to mention in your notes
        </div>
      )}

      {/* Text area */}
      <textarea
        ref={textareaRef}
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Quick notes, scratch pad, ideas...&#10;&#10;Your notes are saved automatically to this browser.&#10;&#10;Tip: Drag tasks or resources here to add mentions."
        className="flex-1 resize-none outline-none px-3 py-3 text-[13px] leading-relaxed bg-transparent"
        style={{
          color: "var(--text-primary)",
          fontFamily: "'Albert Sans', sans-serif",
        }}
      />
    </div>
  );
}

/** The panel labels & icons map */
const PANEL_META: Record<RightPanelId, { label: string; icon: React.ElementType }> = {
  search: { label: "Search", icon: MagnifyingGlass },
  chat: { label: "Chat", icon: ChatCircle },
  calendar: { label: "Calendar", icon: CalendarBlank },
  notepad: { label: "Notepad", icon: Notepad },
};

function RightSidePanel({
  rightPanelWidth,
  isRightDragging,
  handleRightResizeDown,
  resetRightWidth,
}: {
  rightPanelWidth: number;
  isRightDragging: boolean;
  handleRightResizeDown: (e: React.MouseEvent) => void;
  resetRightWidth: () => void;
}) {
  const {
    activeRightPanel,
    setActiveRightPanel,
    rightPanelPinned,
    setRightPanelPinned,
  } = useNavigation();
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activeRightPanel) {
      setRendered(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 300);
      return () => clearTimeout(t);
    }
  }, [activeRightPanel]);

  if (!rendered) return null;

  const meta = activeRightPanel ? PANEL_META[activeRightPanel] : null;
  const PanelIcon = meta?.icon || MagnifyingGlass;

  return (
    <>
      {/* Backdrop — only when NOT pinned */}
      {!rightPanelPinned && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{
            background: "rgba(0,0,0,0.2)",
            opacity: visible ? 1 : 0,
          }}
          onClick={() => setActiveRightPanel(null)}
        />
      )}

      {/* Panel — offset by icon rail on md+, full-width on mobile */}
      <div
        className={`fixed top-0 bottom-0 right-0 md:right-[44px] z-50 flex flex-col ease-out ${
          isRightDragging ? "" : "transition-transform duration-300"
        }`}
        style={{
          width: `min(${rightPanelWidth}px, 100vw)`,
          background: "var(--surface-bg)",
          borderLeft: "1px solid var(--border-default)",
          boxShadow: rightPanelPinned ? "none" : "-4px 0 24px rgba(0,0,0,0.08)",
          transform: visible ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Resize handle on left edge */}
        <ResizeHandle side="right" onMouseDown={handleRightResizeDown} isDragging={isRightDragging} onDoubleClick={resetRightWidth} />
        {/* Toolbar */}
        <div
          className="flex items-center justify-between h-[48px] px-3 border-b shrink-0"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-2">
            <PanelIcon size={18} weight="fill" style={{ color: "var(--accent-primary)" }} />
            <span className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {meta?.label}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setRightPanelPinned(!rightPanelPinned)}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
              style={{ color: rightPanelPinned ? "var(--accent-primary)" : "var(--text-tertiary)" }}
              title={rightPanelPinned ? "Unpin panel" : "Pin panel"}
            >
              <PushPin size={15} weight={rightPanelPinned ? "fill" : "regular"} style={rightPanelPinned ? { transform: "rotate(45deg)" } : undefined} />
            </button>
            <button
              onClick={() => setActiveRightPanel(null)}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
              style={{ color: "var(--text-tertiary)" }}
              title="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 min-h-0">
          {activeRightPanel === "chat" && (
            <ErrorBoundary section="Chat">
              <Suspense fallback={<GenericPageSkeleton />}>
                <ChatPage panelMode />
              </Suspense>
            </ErrorBoundary>
          )}
          {activeRightPanel === "search" && <SearchPanelContent />}
          {activeRightPanel === "calendar" && <CalendarPanelContent />}
          {activeRightPanel === "notepad" && <NotepadPanelContent />}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   SWIPE HOOK — Touch-based sidebar open on tablet
   ═══════════════════════════════════════════════════════════ */

function useSwipeToOpen(onOpen: () => void, enabled: boolean) {
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only trigger from the left edge (first 24px)
      if (touch.clientX < 24) {
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
      }
    };

    const handleEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      const dt = Date.now() - touchStartRef.current.t;
      touchStartRef.current = null;

      // Swipe right from edge: >60px horizontal, <40px vertical, <300ms
      if (dx > 60 && dy < 40 && dt < 300) {
        onOpen();
      }
    };

    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchend", handleEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [onOpen, enabled]);
}

/* ═══════════════════════════════════════════════════════════
   PAGE TRANSITION WRAPPER
   ═══════════════════════════════════════════════════════════ */

function PageTransition({
  navId,
  direction,
  children,
}: {
  navId: string;
  direction: "push" | "pop";
  children: React.ReactNode;
}) {
  return (
    <motion.div
      key={navId}
      initial={{
        opacity: 0,
        x: direction === "push" ? 60 : -60,
      }}
      animate={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: direction === "push" ? -30 : 30,
      }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 350,
        mass: 0.8,
      }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR NAV CONTENT — Asana-style clean layout
   ═══════════════════════════════════════════════════════════ */

/** Shared nav button renderer */
function SidebarNavButton({
  item,
  isActive,
  onClick,
  badge,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full rounded-[8px] transition-all duration-150 ${ isActive ? "" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]" } px-[12px] py-[5px]`}
      style={{
        background: isActive ? "var(--accent-primary-subtle)" : undefined,
        color: isActive ? "var(--accent-primary)" : "var(--text-primary)",
        fontSize: "14px",
        fontWeight: isActive ? 600 : 400,
      }}
    >
      <item.icon
        className="w-[20px] h-[20px] shrink-0"
        weight={isActive ? "fill" : "regular"}
        style={{ color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)" }}
      />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {badge}
    </button>
  );
}

function SidebarNavContent({
  activeNav,
  unreadCount,
  onNavClick,
  onSearchClick,
}: {
  activeNav: NavId;
  unreadCount: number;
  onNavClick: (id: NavId) => void;
  onSearchClick: () => void;
}) {
  const starredProjects = useStarredProjects();
  const { navigate } = useNavigation();
  const { projects } = useData();

  // Updates unread count
  const [updatesUnread, setUpdatesUnread] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const fetchUnread = async () => {
      try {
        const res = await api.get<{ unreadCount: number }>("/updates/unread-count");
        if (!cancelled && res.data) {
          setUpdatesUnread(res.data.unreadCount);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeNav]); // re-fetch when nav changes (e.g. leaving updates page marks items read)

  /* ─── Group 1: Today, Upcoming, Inbox ─── */
  const group1: NavItem[] = [
    { id: "home", label: "Today", icon: CalendarBlank },
    { id: "week", label: "This Week", icon: CalendarDots },
    { id: "my-tasks", label: "My Tasks", icon: ListChecks },
    { id: "inbox", label: "Inbox", icon: Bell },
  ];

  /* ─── Group 2: Updates, Projects, Docs ─── */
  const group2: NavItem[] = [
    { id: "updates", label: "Updates", icon: Newspaper },
    { id: "overview", label: "Projects", icon: SquareHalf },
    { id: "docs", label: "Docs", icon: Notebook },
  ];

  return (
    <>
      {/* Group 1: Today, Upcoming, Inbox */}
      <ul className="space-y-0.5">
        {group1.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <li key={item.id}>
              <SidebarNavButton
                item={item}
                isActive={isActive}
                onClick={() => onNavClick(item.id)}
                badge={
                  item.id === "inbox" && unreadCount > 0 ? (
                    <span
                      className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-bold text-white shrink-0"
                      style={{ background: "oklch(0.65 0.2 25)" }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : undefined
                }
              />
            </li>
          );
        })}
      </ul>

      {/* Divider */}
      <div className="mx-3 my-3 h-px" style={{ background: "var(--border-default)" }} />

      {/* Group 2: Updates, Projects, Docs */}
      <ul className="space-y-0.5">
        {group2.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <li key={item.id}>
              <SidebarNavButton
                item={item}
                isActive={isActive}
                onClick={() => onNavClick(item.id)}
                badge={
                  item.id === "updates" && updatesUnread > 0 ? (
                    <span
                      className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white shrink-0"
                      style={{ background: "var(--accent-primary)" }}
                    >
                      {updatesUnread > 99 ? "99+" : updatesUnread}
                    </span>
                  ) : undefined
                }
              />
            </li>
          );
        })}
      </ul>

      {/* Divider */}
      <div className="mx-3 my-3 h-px" style={{ background: "var(--border-default)" }} />

      {/* FAVORITES section */}
      <div className="px-3 mb-2">
        <div className="flex items-center gap-1.5 mx-[0px] mt-[8px] mb-[0px] px-[2px] pt-[8px] pb-[0px]">
          <Star
            className="w-3 h-3"
            weight="fill"
            style={{ color: "var(--text-quaternary)" }}
          />
          <span
            className="font-semibold uppercase tracking-wider text-[10px]"
            style={{ color: "var(--text-quaternary)" }}
          >
            Favorites
          </span>
        </div>
      </div>

      {starredProjects.length > 0 ? (
        <ul className="space-y-0.5">
          {starredProjects.map((projectName) => {
            const proj = projects[projectName];
            return (
              <li key={projectName}>
                <button
                  onClick={() => {
                    navigate("project", { projectId: projectName });
                  }}
                  className={`flex items-center gap-2.5 w-full rounded-[8px] px-3 py-[7px] transition-all duration-150 ${
                    activeNav === "project" ? "" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  }`}
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: 400,
                  }}
                >
                  <ProjectIcon
                    phosphorIcon={proj?.phosphorIcon}
                    color={proj?.color}
                    iconUrl={proj?.iconUrl}
                    size="xs"
                  />
                  <span className="flex-1 text-left truncate">{proj?.shortName || projectName}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p
          className="px-[15px] py-[4px]"
          style={{ color: "var(--text-quaternary)", fontSize: "12px" }}
        >
          Star a project to pin it here
        </p>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR FOOTER
   ═══════════════════════════════════════════════════════════ */

function SidebarFooter({ onNavClick, activeNav }: { onNavClick: (id: NavId) => void; activeNav: NavId }) {
  const { spaces } = useData();
  const spaceList = Object.values(spaces || {}).filter((s: any) => s?.visible !== false).slice(0, 4);
  const isSpacesActive = activeNav === "spaces" || activeNav === "space-detail";

  // Default dot colors if no spaces exist
  const dotColors = spaceList.length > 0
    ? spaceList.map((s: any) => s.color || "oklch(0.65 0.015 260)")
    : ["oklch(0.7 0.18 25)", "oklch(0.55 0.2 280)", "oklch(0.85 0.15 85)", "oklch(0.65 0.15 180)"];

  return (
    <div
      className="px-2.5 py-2.5 border-t"
      style={{ borderColor: "var(--border-default)" }}
    >
      <button
        onClick={() => onNavClick("spaces" as NavId)}
        className={`flex items-center gap-3 w-full rounded-[8px] px-[12px] py-[8px] transition-all duration-150 ${
          isSpacesActive ? "" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        }`}
        style={{
          background: isSpacesActive ? "var(--accent-primary-subtle)" : undefined,
          color: isSpacesActive ? "var(--accent-primary)" : "var(--text-primary)",
          fontSize: "14px",
          fontWeight: isSpacesActive ? 600 : 400,
        }}
      >
        <CirclesFour
          className="w-[20px] h-[20px] shrink-0"
          weight={isSpacesActive ? "fill" : "regular"}
          style={{ color: isSpacesActive ? "var(--accent-primary)" : "var(--text-tertiary)" }}
        />
        <span className="flex-1 text-left">Spaces</span>
        <div className="flex items-center gap-[3px] shrink-0">
          {dotColors.slice(0, 4).map((color: string, i: number) => (
            <div
              key={i}
              className="w-[6px] h-[6px] rounded-full"
              style={{ background: color }}
            />
          ))}
        </div>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN LAYOUT
   ══════════════════════════════════════════════════════════ */

export function Layout() {
  const { activeNav, navigate, goBack, canGoBack, navStack, brandGuideOpen, setBrandGuideOpen, chatOpen, setChatOpen, chatPinned, activeRightPanel, setActiveRightPanel, toggleRightPanel, rightPanelPinned } = useNavigation();
  const { theme, setTheme } = useTheme();
  const { profile, signOut, isDevMode } = useAuth();
  const { unreadCount, loadError, isLoaded, reload } = useData();
  useNotificationPolling(); // Start background polling
  const isOnline = useOnlineStatus();
  const collapsed = false;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [navDirection, setNavDirection] = useState<"push" | "pop">("push");
  const prevNavRef = useRef(activeNav);
  const mainRef = useRef<HTMLElement>(null);

  // Resizable left sidebar
  const {
    width: leftSidebarWidth,
    isDragging: isLeftDragging,
    handleMouseDown: handleLeftResizeDown,
    resetToDefault: resetLeftWidth,
  } = useResizablePanel({
    storageKey: "canto-left-sidebar-width",
    defaultWidth: DEFAULT_LEFT_SIDEBAR_WIDTH,
    minWidth: 200,
    maxWidth: 400,
    side: "left",
  });

  // Resizable right panel
  const {
    width: rightPanelWidth,
    isDragging: isRightDragging,
    handleMouseDown: handleRightResizeDown,
    resetToDefault: resetRightWidth,
  } = useResizablePanel({
    storageKey: "canto-right-panel-width",
    defaultWidth: DEFAULT_RIGHT_PANEL_WIDTH,
    minWidth: 280,
    maxWidth: 600,
    side: "right",
  });

  // Track nav direction for page transitions
  useEffect(() => {
    if (activeNav !== prevNavRef.current) {
      // If navStack shrunk, we popped; otherwise pushed
      setNavDirection(navStack.length < (prevNavRef.current ? navStack.length + 1 : 0) ? "pop" : "push");
      prevNavRef.current = activeNav;
      // Scroll to top on nav change
      mainRef.current?.scrollTo({ top: 0 });
    }
  }, [activeNav, navStack.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd+K — command palette (only without Shift, so ⌘⇧K can be calendar)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
      // Cmd+Shift+B — brand guide
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setBrandGuideOpen(!brandGuideOpen);
      }
      // Cmd+Shift+F — toggle search panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleRightPanel("search");
      }
      // Cmd+Shift+M — toggle chat panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleRightPanel("chat");
      }
      // Cmd+Shift+K — toggle calendar panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleRightPanel("calendar");
      }
      // Cmd+Shift+N — toggle notepad panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        toggleRightPanel("notepad");
      }
      // Escape — close right panel
      if (e.key === "Escape" && activeRightPanel) {
        e.preventDefault();
        setActiveRightPanel(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [brandGuideOpen, setBrandGuideOpen, activeRightPanel, toggleRightPanel, setActiveRightPanel]);

  // Android hardware back button
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      if (canGoBack) {
        e.preventDefault();
        goBack();
        // Re-push state so back button keeps working
        window.history.pushState(null, "");
      }
    };
    // Push initial state entry
    window.history.pushState(null, "");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [canGoBack, goBack]);

  // Swipe to open sidebar on tablet
  useSwipeToOpen(
    useCallback(() => setMobileOpen(true), []),
    true
  );

  const handleNavClick = useCallback((id: NavId, params?: Record<string, string>) => {
    haptic("selection");
    // Chat always opens as a panel, never as a page
    if (id === "chat") {
      setChatOpen(true);
      setMobileOpen(false);
      setMoreOpen(false);
      return;
    }
    setNavDirection("push");
    navigate(id, params);
    setMobileOpen(false);
    setMoreOpen(false);
  }, [navigate, setChatOpen]);

  const handleGoBack = useCallback(() => {
    haptic("light");
    setNavDirection("pop");
    goBack();
  }, [goBack]);

  const nextTheme = () => {
    haptic("light");
    const cycle: Record<string, "light" | "dark" | "system"> = { light: "dark", dark: "system", system: "light" };
    setTheme(cycle[theme]);
  };

  // Is "More" tab active? (any nav that's in MORE_ITEMS, or chat panel is open)
  const isMoreActive = MORE_ITEMS.some((m) => m.id === activeNav && m.id !== "chat");

  // Is this a drill-down page (project detail, client detail, etc.)?
  const isDrillDown = ["project", "client", "space-detail"].includes(activeNav);

  return (
    <DragProvider>
    <GlobalTaskDetailProvider>
    <div className="flex h-screen w-full overflow-hidden" style={{ fontFamily: "'Albert Sans', sans-serif" }}>
      {/* Dynamic spacing for resizable sidebars + icon rail + pinned panel */}
      <style>{`
        @media (min-width: 768px) {
          .canto-main-col {
            padding-left: ${leftSidebarWidth}px !important;
            padding-right: ${
              activeRightPanel && rightPanelPinned
                ? rightPanelWidth + ICON_RAIL_WIDTH
                : ICON_RAIL_WIDTH
            }px !important;
            ${isLeftDragging || isRightDragging ? "" : "transition: padding-left 150ms ease, padding-right 300ms ease;"}
          }
          .canto-left-sidebar {
            width: ${leftSidebarWidth}px !important;
          }
        }
      `}</style>
      {/* ═══ SIDEBAR (desktop + tablet overlay) ═══ */}

      {/* Sidebar backdrop (tablet/mobile) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          canto-left-sidebar fixed z-40 overflow-hidden
          inset-y-0 left-0
          ${mobileOpen ? "w-[280px] translate-x-0" : "-translate-x-full md:translate-x-0"}
          md:border-r
        `}
        style={{
          background: "var(--sidebar-bg)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* Resize handle on right edge */}
        <ResizeHandle side="left" onMouseDown={handleLeftResizeDown} isDragging={isLeftDragging} onDoubleClick={resetLeftWidth} />

        {/* Inner wrapper */}
        <div className="w-full flex flex-col h-full shrink-0">
          {/* Profile header — avatar with orbit + search */}
          <div className="flex items-center justify-between pl-[10px] pr-[8px] pt-[12px] pb-[10px]">
            <UserOrbitMenu onNavClick={(id, params) => handleNavClick(id as NavId, params)} />

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setCmdkOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                title="Search (⌘K)"
              >
                <MagnifyingGlass className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => setMobileOpen(false)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-[6px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-1 px-2.5 overflow-y-auto overflow-x-hidden" aria-label="Main navigation">
            <SidebarNavContent
              activeNav={activeNav}
              unreadCount={unreadCount}
              onNavClick={handleNavClick}
              onSearchClick={() => setCmdkOpen(true)}
            />
          </nav>

          {/* Footer — dual mode: collapsed = vertical icon stack, expanded = full row */}
          <SidebarFooter onNavClick={handleNavClick} activeNav={activeNav} />
        </div>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="canto-main-col flex-1 flex flex-col min-w-0">
        {/* Desktop header bar */}
        

        {/* Mobile header */}
        <header
          className="md:hidden flex items-center justify-between h-14 px-4 border-b shrink-0"
          style={{ borderColor: "var(--border-default)", background: "var(--surface-bg)" }}
        >
          <div className="flex items-center gap-2">
            {canGoBack && isDrillDown ? (
              <button
                onClick={handleGoBack}
                className="flex items-center justify-center w-8 h-8 rounded-[6px] -ml-1"
                style={{ color: "var(--text-secondary)" }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center justify-center w-8 h-8 rounded-[6px] -ml-1"
                style={{ color: "var(--text-secondary)" }}
              >
                <List className="w-5 h-5" />
              </button>
            )}
            <span style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
              {isDrillDown ? "Back" : "Canto"}
            </span>
          </div>
          <button
            onClick={() => setCmdkOpen(true)}
            className="p-2 rounded-[6px]"
            style={{ color: "var(--text-tertiary)" }}
          >
            <MagnifyingGlass className="w-5 h-5" />
          </button>
        </header>

        {/* Page content with transitions */}
        <main ref={mainRef} className="flex-1 overflow-y-auto" style={{ background: "var(--page-bg)" }}>
          {/* Connection error banner */}
          {loadError && !isLoaded && (
            <div
              className="flex items-center justify-between gap-3 px-4 py-2.5 border-b"
              style={{
                background: "oklch(0.96 0.02 25)",
                borderColor: "oklch(0.9 0.04 25)",
                color: "oklch(0.45 0.12 25)",
                fontSize: "13px",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <WifiSlash className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Connection issue — retrying automatically
                </span>
              </div>
              <button
                onClick={() => reload()}
                className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] shrink-0 font-medium transition-colors hover:bg-black/[0.05]"
                style={{ fontSize: "12px" }}
              >
                <ArrowClockwise className="w-3.5 h-3.5" />
                Retry now
              </button>
            </div>
          )}
          {/* Offline indicator banner */}
          {!isOnline && (
            <div
              className="flex items-center justify-center gap-2 px-4 py-2 border-b"
              style={{
                background: "oklch(0.92 0.06 85)",
                borderColor: "oklch(0.88 0.08 85)",
                color: "oklch(0.4 0.1 85)",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              <WifiSlash className="w-4 h-4 shrink-0" />
              <span>You're offline — changes will sync when you reconnect</span>
            </div>
          )}
          <div className={activeNav === "project" ? "" : "px-4 sm:px-6 md:px-10 py-6 md:py-10 pb-28 md:pb-10"}>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition navId={activeNav} direction={navDirection}>
                <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-40" /></div>}>
                  <AppPage nav={activeNav} />
                </Suspense>
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>

        {/* ═══ MOBILE BOTTOM TAB BAR ══ */}
        <div className="md:hidden shrink-0" style={{ background: "var(--surface-bg)" }}>
          {/* Floating timer above tabs */}
          <MobileFloatingTimer />

          <nav
            className="flex items-stretch border-t"
            style={{
              borderColor: "var(--border-default)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              height: "56px",
            }}
            aria-label="Bottom navigation"
            role="tablist"
          >
            {BOTTOM_TABS.map((tab) => {
              const isActive = activeNav === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavClick(tab.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative"
                  style={{
                    color: isActive ? "var(--accent-primary)" : "var(--text-quaternary)",
                  }}
                >
                  {isActive && (
                    <div
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-b-full"
                      style={{ background: "var(--accent-primary)" }}
                    />
                  )}
                  <div className="relative">
                    <tab.icon className="w-5 h-5" weight={isActive ? "fill" : "regular"} />
                    {/* Unread badge dot for Inbox tab */}
                    {tab.id === "inbox" && unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ background: "oklch(0.7 0.18 25)" }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400 }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* More tab */}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative"
              style={{
                color: isMoreActive ? "var(--accent-primary)" : "var(--text-quaternary)",
              }}
            >
              {isMoreActive && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-b-full"
                  style={{ background: "var(--accent-primary)" }}
                />
              )}
              <DotsThree className="w-5 h-5" weight={isMoreActive ? "bold" : "regular"} />
              <span style={{ fontSize: "10px", fontWeight: isMoreActive ? 600 : 400 }}>
                More
              </span>
            </button>
          </nav>
        </div>
      </div>{/* end main content column */}

      {/* Right Icon Rail (desktop) — fixed position, z-50 to stay above panel backdrop */}
      <div className="hidden md:flex fixed top-0 right-0 bottom-0 z-50">
        <RightIconRail />
      </div>

      {/* ═══ OVERLAYS ═══ */}

      {/* Command Palette */}
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />

      {/* More Menu (mobile) */}
      <AnimatePresence>
        {moreOpen && (
          <MoreMenu
            open={moreOpen}
            onClose={() => setMoreOpen(false)}
            onSelect={handleNavClick}
            activeNav={activeNav}
          />
        )}
      </AnimatePresence>

      {/* Brand Guide Panel */}
      <AnimatePresence>
        <BrandGuidePanel />
      </AnimatePresence>

      {/* Right Side Panel (Search / Chat / Calendar / Notepad) */}
      <RightSidePanel
        rightPanelWidth={rightPanelWidth}
        isRightDragging={isRightDragging}
        handleRightResizeDown={handleRightResizeDown}
        resetRightWidth={resetRightWidth}
      />

      {/* AI Chat Panel removed — AI is docs-only */}
    </div>
    </GlobalTaskDetailProvider>
    </DragProvider>
  );
}