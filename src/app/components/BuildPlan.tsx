import { useState, useMemo } from "react";
import {
  CaretDown,
  CaretRight,
  CheckCircle,
  Circle,
  CircleHalf,
  Warning,
  Prohibit,
  Flag,
  Clock,
  Lightning,
  Rocket,
  Stack,
  Database,
  Shield,
  Palette,
  Globe,
  Desktop,
  DeviceMobile,
  Bell,
  Plugs,
  Users as UsersIcon,
  Kanban,
  MagnifyingGlass,
  FileText,
  ChatText,
  CalendarBlank,
  Tray,
  Gear,
  PaperPlaneTilt,
  ArrowsClockwise,
  CloudArrowUp,
  Timer,
  ListChecks,
  GitBranch,
  Package,
  Code,
  TreeStructure,
  Sparkle,
  Eye,
  WifiSlash,
  HandGrabbing,
  Swatches,
  ArrowSquareOut,
  Info,
  FigmaLogo,
  PaintBrush,
  Wrench,
  Browsers,
  CheckSquare,
} from "@phosphor-icons/react";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

type Status = "done" | "in-progress" | "planned" | "blocked" | "deferred";
type Priority = "critical" | "high" | "medium" | "low";

interface BuildItem {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  effort: string; // e.g. "2-3 days", "1 week"
  dependencies?: string[];
  tags?: string[];
  notes?: string;
  subitems?: { title: string; status: Status }[];
}

interface Phase {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  colorLight: string;
  colorMid: string;
  timeEstimate: string;
  items: BuildItem[];
}

/* ═══════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════ */

const c = {
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.65 0.015 260)",
  border: "oklch(0.92 0.01 260)",
  bg1: "oklch(0.99 0.002 260)",
  bg2: "oklch(0.97 0.005 260)",
  surface: "white",
  coral: "oklch(0.7 0.18 25)",
  coralLight: "oklch(0.7 0.18 25 / 0.1)",
  coralMid: "oklch(0.55 0.18 25)",
  indigo: "oklch(0.55 0.2 280)",
  indigoLight: "oklch(0.55 0.2 280 / 0.1)",
  indigoMid: "oklch(0.45 0.17 280)",
  teal: "oklch(0.65 0.15 180)",
  tealLight: "oklch(0.65 0.15 180 / 0.1)",
  tealMid: "oklch(0.45 0.12 180)",
  gold: "oklch(0.85 0.15 85)",
  goldLight: "oklch(0.85 0.15 85 / 0.15)",
  goldMid: "oklch(0.55 0.12 85)",
  emerald: "oklch(0.73 0.15 155)",
  emeraldLight: "oklch(0.73 0.15 155 / 0.12)",
  emeraldMid: "oklch(0.47 0.12 155)",
  lavender: "oklch(0.7 0.16 300)",
  lavenderLight: "oklch(0.7 0.16 300 / 0.12)",
  lavenderMid: "oklch(0.47 0.14 300)",
};

/* ═══════════════════════════════════════════════════════════
   STATUS / PRIORITY HELPERS
   ═══════════════════════════════════════════════════════════ */

const statusConfig: Record<Status, { icon: React.ElementType; color: string; label: string; bg: string }> = {
  done: { icon: CheckCircle, color: c.tealMid, label: "Done", bg: c.tealLight },
  "in-progress": { icon: CircleHalf, color: c.indigoMid, label: "In Progress", bg: c.indigoLight },
  planned: { icon: Circle, color: c.text4, label: "Planned", bg: c.bg2 },
  blocked: { icon: Prohibit, color: c.coralMid, label: "Blocked", bg: c.coralLight },
  deferred: { icon: Warning, color: c.goldMid, label: "Deferred", bg: c.goldLight },
};

const priorityConfig: Record<Priority, { color: string; label: string }> = {
  critical: { color: c.coral, label: "Critical" },
  high: { color: "oklch(0.72 0.17 55)", label: "High" },
  medium: { color: c.gold, label: "Medium" },
  low: { color: c.teal, label: "Low" },
};

/* ═══════════════════════════════════════════════════════════
   PHASE DATA — THE COMPLETE BUILD PLAN
   ═══════════════════════════════════════════════════════════ */

const phases: Phase[] = [
  {
    id: "p0",
    number: 0,
    title: "Foundation & Architecture",
    subtitle: "Core infrastructure, singleton client, KV schema, project scaffolding",
    icon: TreeStructure,
    color: c.coral,
    colorLight: c.coralLight,
    colorMid: c.coralMid,
    timeEstimate: "3-5 days",
    items: [
      {
        id: "p0-1",
        title: "Remove React Router, implement state-driven navigation",
        description: "Replace RouterProvider/createBrowserRouter with a single activeNav string in App.tsx. All page components render conditionally based on activeNav. No URL changes — purely in-memory state.",
        status: "done",
        priority: "critical",
        effort: "1 day",
        tags: ["architecture", "breaking-change"],
        subitems: [
          { title: "Create NavigationContext with activeNav, setActiveNav, navStack (for back button)", status: "done" },
          { title: "Remove react-router imports from all files", status: "done" },
          { title: "Convert Layout.tsx sidebar NavLinks to state-driven buttons", status: "done" },
          { title: "Implement navStack for push/pop navigation (mobile back button)", status: "done" },
          { title: "Delete routes.ts", status: "done" },
        ],
      },
      {
        id: "p0-2",
        title: "Singleton Supabase client on globalThis",
        description: "Create a single createClient instance stored on globalThis.__supabaseClient to prevent multiple GoTrueClient warnings. Used by all components and the API client.",
        status: "done",
        priority: "critical",
        effort: "0.5 days",
        tags: ["supabase", "architecture"],
        subitems: [
          { title: "Create /src/app/lib/supabase.ts with singleton pattern", status: "done" },
          { title: "Create /src/app/lib/api.ts with retry logic (exponential backoff)", status: "done" },
          { title: "Dual-header pattern: Authorization + X-User-Token", status: "done" },
        ],
      },
      {
        id: "p0-3",
        title: "KV store utility & server scaffold",
        description: "Build the kv_store.tsx utility with get/set/del/mget/mdel/getByPrefix operations. Scaffold the Hono server entry point at /supabase/functions/server/index.tsx.",
        status: "done",
        priority: "critical",
        effort: "1-2 days",
        tags: ["supabase", "backend"],
        subitems: [
          { title: "KV table schema (key TEXT PK, value JSONB, updated_at TIMESTAMPTZ)", status: "done" },
          { title: "kv_store.tsx utility functions", status: "done" },
          { title: "Hono server with CORS, auth middleware, health check", status: "done" },
          { title: "Blob storage bucket creation (make-*-attachments)", status: "done" },
          { title: "File upload/download routes with signed URLs", status: "done" },
        ],
      },
      {
        id: "p0-4",
        title: "TypeScript interfaces & constants",
        description: "Define all data model interfaces (TaskItem, SubTask, ProjectData, ProfileData, etc.) in a shared types.ts file. Define constants (PERSONAL_PROJECT, production phases, project types).",
        status: "done",
        priority: "critical",
        effort: "0.5 days",
        tags: ["types"],
      },
      {
        id: "p0-5",
        title: "Theme system with OKLCH palette",
        description: "Migrate existing theme.css to the full harmonized OKLCH palette (5 hues × 9 steps + warm neutral scale). Implement ThemeContext with light/dark/system support. Wire up CSS custom properties for all semantic tokens.",
        status: "done",
        priority: "critical",
        effort: "1 day",
        tags: ["design-system", "theme"],
        notes: "Existing brand guide OKLCH tokens are the source of truth. Expand to cover dark mode semantic tokens.",
        subitems: [
          { title: "Light mode semantic tokens (backgrounds, text, borders, accents, shadows)", status: "done" },
          { title: "Dark mode semantic tokens", status: "done" },
          { title: "ThemeContext provider with localStorage persistence", status: "done" },
          { title: "data-theme attribute + .dark class on <html>", status: "done" },
          { title: "prefers-color-scheme media query listener for 'system' mode", status: "done" },
        ],
      },
      {
        id: "p0-6",
        title: "Brand Guide as hidden section",
        description: "Wrap existing brand guide pages (BrandOverview, ColorPalette, TypographyGuide, etc.) into a BrandGuidePanel accessible via Cmd+Shift+B or Settings > Brand Guide. Remove from main navigation — it becomes a dev/design tool overlay.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["design-system", "architecture"],
        subitems: [
          { title: "Create BrandGuidePanel container with slide-over or modal UI", status: "done" },
          { title: "Move all brand guide components into /src/app/components/brand-guide/ subfolder", status: "planned" },
          { title: "Add Cmd+Shift+B keyboard shortcut to toggle", status: "done" },
          { title: "Add 'Brand Guide' link in Settings page", status: "done" },
          { title: "Remove brand guide items from main sidebar nav", status: "done" },
        ],
      },
    ],
  },
  {
    id: "p1",
    number: 1,
    title: "Authentication & Onboarding",
    subtitle: "Login, signup, session management, profile setup",
    icon: Shield,
    color: c.indigo,
    colorLight: c.indigoLight,
    colorMid: c.indigoMid,
    timeEstimate: "2-3 days",
    items: [
      {
        id: "p1-1",
        title: "AuthScreen component",
        description: "Email/password login and signup forms with branded logo. Signup calls /signup server route (admin.createUser with email_confirm: true). Auto-link Asana placeholder team members on signup.",
        status: "done",
        priority: "critical",
        effort: "1 day",
        tags: ["auth", "ui"],
        subitems: [
          { title: "Login form with email/password", status: "done" },
          { title: "Signup form with validation", status: "done" },
          { title: "Server /signup route with admin.createUser", status: "done" },
          { title: "Error handling & loading states", status: "done" },
          { title: "Auto-link Asana placeholders by email", status: "planned" },
        ],
      },
      {
        id: "p1-2",
        title: "Session management",
        description: "getSession() on mount → refreshSession() for fresh JWT. Network error fallback to cached tokens. onAuthStateChange listener. saveWithAuth wrapper for 401 retry.",
        status: "done",
        priority: "critical",
        effort: "1 day",
        tags: ["auth"],
        subitems: [
          { title: "Session check + refresh flow in App.tsx", status: "done" },
          { title: "saveWithAuth wrapper with token refresh on 401", status: "done" },
          { title: "Graceful network error handling (don't sign out)", status: "done" },
          { title: "TOKEN_REFRESHED / SIGNED_OUT event listeners", status: "done" },
        ],
      },
      {
        id: "p1-3",
        title: "OnboardingScreen",
        description: "Post-signup flow: display name, avatar color selection (14 pastel colors), optional profile photo upload with image crop modal. Sets profile.onboardingComplete = true.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["auth", "ui"],
      },
      {
        id: "p1-5",
        title: "Auth loading fix (navigatorLock hang)",
        description: "Fixed @supabase/auth-js@2.98.0 navigatorLock hanging in sandboxed/iframe environments. supabase.ts uses skipAutoInitialize + readStoredSession(). auth.tsx eliminates getSession() calls, reads session synchronously from localStorage, sets up onAuthStateChange before calling initialize() as non-blocking background task. api.ts uses readStoredSession() with safeRefreshSession() wrapped in 5-second Promise.race timeouts.",
        status: "done",
        priority: "critical",
        effort: "1.5 days",
        tags: ["auth", "bugfix", "architecture"],
        subitems: [
          { title: "skipAutoInitialize: true in Supabase client config", status: "done" },
          { title: "readStoredSession() utility to bypass getSession()", status: "done" },
          { title: "Non-blocking initialize() via background Promise", status: "done" },
          { title: "safeRefreshSession() with 5s Promise.race timeout", status: "done" },
          { title: "Eliminate all getSession() calls from auth.tsx", status: "done" },
        ],
      },
      {
        id: "p1-4",
        title: "Google OAuth callback handler",
        description: "Detect ?code=&state= in URL when window.opener exists. Exchange code via server, post message back. Gmail callbacks use gmail- prefixed state.",
        status: "done",
        priority: "medium",
        effort: "0.5 days",
        tags: ["auth", "integration"],
        dependencies: ["p1-2"],
      },
    ],
  },
  {
    id: "p2",
    number: 2,
    title: "Core App Shell & Navigation",
    subtitle: "Sidebar, bottom tabs, responsive layout, command palette",
    icon: Stack,
    color: c.teal,
    colorLight: c.tealLight,
    colorMid: c.tealMid,
    timeEstimate: "3-4 days",
    items: [
      {
        id: "p2-1",
        title: "Responsive sidebar / bottom tab navigation",
        description: "Desktop: collapsible left sidebar (68px/252px). Tablet: swipe-in overlay with backdrop. Mobile: bottom tab bar (Home, Projects, Inbox, Docs, More) with safe-area-inset-bottom.",
        status: "done",
        priority: "critical",
        effort: "1.5 days",
        tags: ["layout", "responsive"],
        subitems: [
          { title: "Desktop sidebar with collapse/expand (pinned state)", status: "done" },
          { title: "Tablet overlay sidebar with gesture support", status: "done" },
          { title: "Mobile bottom tab bar (56px, 5 tabs)", status: "done" },
          { title: "'More' hamburger menu for secondary sections", status: "done" },
          { title: "Active indicator styling per breakpoint", status: "done" },
        ],
      },
      {
        id: "p2-2",
        title: "Search overlay (Cmd+K)",
        description: "Command palette searching across projects, tasks, clients, docs, team members. Desktop: centered popover. Mobile: full-screen overlay with recent searches.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["search", "ui"],
        dependencies: ["p0-1"],
        notes: "Uses cmdk package already installed.",
      },
      {
        id: "p2-3",
        title: "Page transition animations",
        description: "Horizontal slide animations (push/pop) for drill-down navigation on mobile. Back arrow in top-left header. Android hardware back button handling.",
        status: "done",
        priority: "medium",
        effort: "0.5 days",
        tags: ["animation", "mobile"],
        dependencies: ["p0-1"],
      },
      {
        id: "p2-4",
        title: "Time tracking floating timer",
        description: "Persistent timer in sidebar (desktop) or status bar (mobile). Start/stop per task. Stores TimeEntry with duration calculation. In native app, shows in system tray.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["timer", "ui"],
      },
    ],
  },
  {
    id: "p3",
    number: 3,
    title: "Data Layer & Auto-Save",
    subtitle: "Server routes, data loading, auto-save with dirty tracking",
    icon: Database,
    color: c.emerald,
    colorLight: c.emeraldLight,
    colorMid: c.emeraldMid,
    timeEstimate: "4-5 days",
    items: [
      {
        id: "p3-1",
        title: "Server CRUD routes for all KV schemas",
        description: "Hono routes for projects, clients, events, docs, profiles, starred items, today tasks, time blocks, week settings, notifications, team members.",
        status: "done",
        priority: "critical",
        effort: "2 days",
        tags: ["backend", "api"],
        subitems: [
          { title: "Project routes (CRUD + per-project keys + migration from legacy bulk key)", status: "done" },
          { title: "Client routes (shared workspace key)", status: "done" },
          { title: "Calendar event routes", status: "done" },
          { title: "Docs routes (shared workspace)", status: "done" },
          { title: "Profile routes (per-user)", status: "done" },
          { title: "Starred / Today / Lineup routes (per-user)", status: "done" },
          { title: "Time blocks & week settings routes (per-user)", status: "done" },
          { title: "Team member routes", status: "done" },
          { title: "Notification routes (CRUD + mark-read + archive)", status: "done" },
        ],
      },
      {
        id: "p3-2",
        title: "Auto-save system with dirty tracking",
        description: "Debounced saves (1200ms) with dirtyProjectsRef Set and deletedProjectsRef. Object reference comparison. initialLoadDone ref prevents save-on-mount. saveWithAuth wrapper.",
        status: "done",
        priority: "critical",
        effort: "1.5 days",
        tags: ["data", "architecture"],
        dependencies: ["p3-1"],
      },
      {
        id: "p3-3",
        title: "Data loading & caching layer",
        description: "Load all user data on app mount (profile, projects, clients, docs, events, starred, today, team). Cache in React state. Optimistic UI updates.",
        status: "done",
        priority: "critical",
        effort: "1 day",
        tags: ["data"],
        dependencies: ["p3-1"],
      },
      {
        id: "p3-4",
        title: "Offline queue & sync",
        description: "For native/PWA: queue mutations in IndexedDB when offline. Sync when connectivity resumes. Show offline indicator in header. Implemented via IndexedDB in /src/app/lib/offline.ts, integrated into performSave in data.tsx, with offline banner in Layout.tsx.",
        status: "done",
        priority: "low",
        effort: "2 days",
        tags: ["offline", "pwa"],
        dependencies: ["p3-2"],
      },
    ],
  },
  {
    id: "p4",
    number: 4,
    title: "Home & My Tasks",
    subtitle: "Today, Lineup, upcoming tasks, gradient headers, GCal events",
    icon: Lightning,
    color: c.lavender,
    colorLight: c.lavenderLight,
    colorMid: c.lavenderMid,
    timeEstimate: "3-4 days",
    items: [
      {
        id: "p4-1",
        title: "Home page with Today / Lineup sections",
        description: "Today: manually flagged tasks (todayTaskIds Set) + due-today. Lineup: flagged via task.lineup. Shows subtask entries and workspace docs. Gradient header presets.",
        status: "done",
        priority: "critical",
        effort: "1.5 days",
        tags: ["page", "ui"],
        subitems: [
          { title: "Today section with task list", status: "done" },
          { title: "Lineup section with task list", status: "done" },
          { title: "Upcoming section with date grouping", status: "done" },
          { title: "Gradient header presets (emerald, ocean, violet, sunbeam, coral, slate)", status: "done" },
          { title: "Subtask entries in Today/Lineup", status: "done" },
          { title: "Workspace doc entries in Today/Lineup", status: "planned" },
        ],
      },
      {
        id: "p4-2",
        title: "Task row component with inline editing",
        description: "Reusable task row: checkbox (5-state circle icons), title inline edit, assignee avatar, due date, priority flag, status badge, star toggle. Swipe actions on mobile.",
        status: "done",
        priority: "critical",
        effort: "1.5 days",
        tags: ["component", "ui"],
        subitems: [
          { title: "Circle-based 5-state checkbox (open/in-progress/on-hold/blocked/done)", status: "done" },
          { title: "Priority flag icon (urgent/high/medium/low/none)", status: "done" },
          { title: "Inline title editing on click/tap", status: "done" },
          { title: "Assignee avatar with picker popup", status: "done" },
          { title: "Due date badge with date picker", status: "done" },
          { title: "Star toggle for today/lineup", status: "done" },
          { title: "Mobile: swipe right (complete/today), swipe left (delete/edit/move)", status: "done" },
        ],
      },
      {
        id: "p4-3",
        title: "Pull-to-refresh on mobile",
        description: "Pull-to-refresh gesture on scrollable list views (Home, Projects, Inbox, Docs). Native-feeling spring animation.",
        status: "done",
        priority: "medium",
        effort: "0.5 days",
        tags: ["mobile", "gesture"],
      },
    ],
  },
  {
    id: "p5",
    number: 5,
    title: "Project Views",
    subtitle: "Task list, Kanban board, timeline, files, overview dashboard",
    icon: Kanban,
    color: c.coral,
    colorLight: c.coralLight,
    colorMid: c.coralMid,
    timeEstimate: "6-8 days",
    items: [
      {
        id: "p5-1",
        title: "Project page shell with tabbed sub-views",
        description: "Header with project icon, name, status badge, star toggle. Tabs: Tasks (list/board), Messages, Calendar, Files, Overview. Tab persistence per project.",
        status: "done",
        priority: "critical",
        effort: "1 day",
        tags: ["page", "ui"],
      },
      {
        id: "p5-2",
        title: "Task list view with sections & drag-and-drop",
        description: "Grouped by sections with collapsible headers. DnD reordering (react-dnd). Multi-select with bulk actions. Add task inline at bottom of section.",
        status: "done",
        priority: "critical",
        effort: "2 days",
        tags: ["task-list", "dnd"],
        dependencies: ["p4-2"],
        subitems: [
          { title: "Section grouping with add/rename/delete/collapse", status: "done" },
          { title: "Drag-and-drop reorder within and between sections", status: "done" },
          { title: "Mobile: long-press to initiate drag (touch-backend)", status: "planned" },
          { title: "Multi-select zone with bulk complete/move/delete/priority/status", status: "done" },
          { title: "Inline 'Add task' at section bottom", status: "done" },
        ],
      },
      {
        id: "p5-3",
        title: "Kanban board view",
        description: "Columns by status (or custom sections). Drag cards between columns. Mobile: horizontal scroll with snap-to-column.",
        status: "done",
        priority: "high",
        effort: "1.5 days",
        tags: ["kanban", "dnd"],
        dependencies: ["p5-2"],
      },
      {
        id: "p5-4",
        title: "Task Detail Pane (ClickUp-style modal)",
        description: "Two-column layout: left = title, description (block editor), subtasks, attachments, comments, time tracking. Right sidebar = metadata (assignee, dates, priority, status, phase, tags, dependencies). Mobile: full-screen bottom sheet, metadata as collapsible accordion.",
        status: "done",
        priority: "critical",
        effort: "3 days",
        tags: ["task-detail", "ui"],
        dependencies: ["p4-2"],
        subitems: [
          { title: "Left column: editable title, status/priority badges", status: "done" },
          { title: "Block-based description editor (DescriptionBlockEditor)", status: "done" },
          { title: "Subtask list with nested subtask support and DnD", status: "done" },
          { title: "Attachments section with file upload to Supabase Storage", status: "done" },
          { title: "Comments section with author avatars and send", status: "done" },
          { title: "Time tracking entries display", status: "done" },
          { title: "Right sidebar: all metadata property rows", status: "done" },
          { title: "Assignee picker popup with team search", status: "done" },
          { title: "Date picker with recurrence config", status: "done" },
          { title: "Dependencies editor (blockedBy/blocking with task search)", status: "done" },
          { title: "Mobile: vaul Drawer bottom sheet, vertical stacking", status: "done" },
        ],
      },
      {
        id: "p5-5",
        title: "Project timeline / calendar sub-view",
        description: "Gantt-style horizontal timeline with scrollable day grid, week headers, today marker, weekend shading, status-colored task bars, milestone diamonds, assignee avatars, undated task notice.",
        status: "done",
        priority: "medium",
        effort: "1.5 days",
        tags: ["timeline", "ui"],
      },
      {
        id: "p5-6",
        title: "Project files & attachments view",
        description: "Gallery grid of project attachments with type badges (image/video/link/document/gallery/travel), thumbnails, image preview modal, search + type filter pills, add form, remove via menu, travel budget breakdown. Responsive 1-3 column grid.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["files", "ui"],
      },
      {
        id: "p5-7",
        title: "Project overview / dashboard",
        description: "Status updates editor with rich text. Production phase & project type selectors. Project stats (completion %, overdue tasks, recent activity).",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["dashboard", "ui"],
      },
      {
        id: "p5-8",
        title: "Messages (notes/meetings) sub-view",
        description: "Project notes and meeting notes with type badges (note/meeting/standup/brainstorm), attendee avatars, content preview, inline add, search/filter, 2-column card grid, delete via menu.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["notes", "ui"],
      },
    ],
  },
  {
    id: "p6",
    number: 6,
    title: "Portfolio & Project Management",
    subtitle: "Overview page, project CRUD, creation wizard, status tracking",
    icon: Rocket,
    color: c.indigo,
    colorLight: c.indigoLight,
    colorMid: c.indigoMid,
    timeEstimate: "2-3 days",
    items: [
      {
        id: "p6-1",
        title: "Overview / Portfolio page",
        description: "Grid/list of all projects with status, phase, type filters. Add/edit/delete/archive/unarchive/rename/duplicate/export/import. Project creation wizard.",
        status: "done",
        priority: "critical",
        effort: "2 days",
        tags: ["page", "ui"],
        subitems: [
          { title: "Project card grid with status/phase badges", status: "done" },
          { title: "Filter bar: status, phase, type, client", status: "done" },
          { title: "Context menu: rename, duplicate, archive, delete, export", status: "done" },
          { title: "Project creation wizard (name, client, type, phase, icon, banner)", status: "done" },
          { title: "Import project from JSON", status: "done" },
          { title: "Mobile: single-column card layout, filters in collapsible drawer", status: "done" },
        ],
      },
      {
        id: "p6-2",
        title: "Star / favorite projects",
        description: "Star toggle on project cards and sidebar. Starred projects appear at top of sidebar and overview.",
        status: "done",
        priority: "medium",
        effort: "0.5 days",
        tags: ["feature"],
      },
    ],
  },
  {
    id: "p7",
    number: 7,
    title: "Block Editor & Documents",
    subtitle: "Rich text editor, document system, folders, publishing",
    icon: FileText,
    color: c.teal,
    colorLight: c.tealLight,
    colorMid: c.tealMid,
    timeEstimate: "5-7 days",
    items: [
      {
        id: "p7-1",
        title: "DescriptionBlockEditor component",
        description: "Block-based editor supporting paragraph, heading (h1-h3), bulleted/numbered/checklist lists, quotes, code blocks, dividers, image blocks. Used in task descriptions and docs.",
        status: "done",
        priority: "critical",
        effort: "3 days",
        tags: ["editor", "component"],
        subitems: [
          { title: "Block type selector (slash command or toolbar)", status: "done" },
          { title: "Paragraph, Heading (h1-h3)", status: "done" },
          { title: "Bulleted list, Numbered list", status: "done" },
          { title: "Checklist with toggle", status: "done" },
          { title: "Quote block", status: "done" },
          { title: "Code block with monospace font", status: "done" },
          { title: "Divider", status: "done" },
          { title: "Image block (upload to Supabase Storage)", status: "done" },
          { title: "Keyboard shortcuts (Cmd+B/I/U, Enter to new block, Tab to indent)", status: "done" },
          { title: "Block reorder via drag or keyboard", status: "done" },
        ],
      },
      {
        id: "p7-2",
        title: "DocsPage — workspace document management",
        description: "Folders, multiple doc types (doc, note, meeting, script/screenplay). Document list with search and filters. Block-based editing in a detail view.",
        status: "done",
        priority: "high",
        effort: "2 days",
        tags: ["page", "docs"],
        dependencies: ["p7-1"],
        subitems: [
          { title: "Folder tree sidebar", status: "done" },
          { title: "Document list with type icons", status: "done" },
          { title: "Doc type: standard document", status: "done" },
          { title: "Doc type: meeting notes with attendees + GCal link", status: "done" },
          { title: "Doc type: screenplay with scene headings, action, dialogue", status: "done" },
          { title: "Search and filter docs", status: "done" },
        ],
      },
      {
        id: "p7-3",
        title: "Publishing system",
        description: "Publish projects and docs with unique slugs for public viewing (no auth required). Support update and unpublish. Server routes for publish/unpublish, Globe/GlobeX icons in DocsPage.tsx, public viewer at PublishedViewer.tsx rendered via #/published/:slug hash route in AppInner.tsx.",
        status: "done",
        priority: "low",
        effort: "1 day",
        tags: ["feature", "backend"],
        dependencies: ["p7-2"],
      },
      {
        id: "p7-4",
        title: "MentionInput component",
        description: "@-mention autocomplete in comment textarea. Detects @ trigger, shows filtered dropdown of team members with avatar, arrow-key navigation, Tab/Enter to insert. Integrated into TaskDetailPane comments with mention extraction and mention IDs.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["component"],
      },
    ],
  },
  {
    id: "p8",
    number: 8,
    title: "Calendar & Week View",
    subtitle: "Full calendar, weekly time blocks, Google Calendar integration",
    icon: CalendarBlank,
    color: c.gold,
    colorLight: c.goldLight,
    colorMid: c.goldMid,
    timeEstimate: "3-4 days",
    items: [
      {
        id: "p8-1",
        title: "CalendarPage — full calendar view",
        description: "Month/week/day views. Shows tasks, events, and GCal events. Tap day to see task list on mobile. Dot indicators on month view.",
        status: "done",
        priority: "high",
        effort: "2 days",
        tags: ["page", "calendar"],
      },
      {
        id: "p8-2",
        title: "WeekView — weekly time blocks",
        description: "Drag tasks into time slots. Working hours configuration. Notepad. Saved per-user with auto-save. Mobile: horizontal scroll with snap per day or day-at-a-time view.",
        status: "done",
        priority: "high",
        effort: "1.5 days",
        tags: ["page", "calendar"],
      },
    ],
  },
  {
    id: "p9",
    number: 9,
    title: "Notification System",
    subtitle: "15 types, polling, native/web/PWA notifications, inbox page",
    icon: Bell,
    color: c.coral,
    colorLight: c.coralLight,
    colorMid: c.coralMid,
    timeEstimate: "3-4 days",
    items: [
      {
        id: "p9-1",
        title: "InboxPage — notification list",
        description: "Lists notifications with mark-read, mark-all-read, archive. Click navigates to relevant task/project. Grouped by date. Unread indicator on sidebar/tab.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["page", "notifications"],
      },
      {
        id: "p9-2",
        title: "Server-side notification generation (sendNotif)",
        description: "Centralized sendNotif() that resolves displayName→userId via teamMembers. Filters self-notifications. Stores per-user in KV (capped 200). Triggered on all 15 event types.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["backend", "notifications"],
      },
      {
        id: "p9-3",
        title: "Client-side polling with exponential backoff",
        description: "Poll every 30s (30→60→120s on failures). Desktop: Web Notification API with permission request. Clicking navigates to item. Unread badge count.",
        status: "done",
        priority: "high",
        effort: "0.5 days",
        tags: ["notifications"],
        dependencies: ["p9-2"],
      },
      {
        id: "p9-4",
        title: "PWA push notifications",
        description: "Push API + service worker for background delivery (Android, iOS 16.4+). Store push subscription per-user. VAPID keys auto-generated server-side using Web Crypto API (P-256/ECDSA), stored in KV, fetched dynamically by push.ts via GET /push/vapid-public-key. POST /push/send endpoint with full VAPID JWT signing. Toggle in ProfileSettingsPage.tsx.",
        status: "done",
        priority: "low",
        effort: "1.5 days",
        tags: ["pwa", "notifications"],
        dependencies: ["p9-2", "p11-1"],
      },
    ],
  },
  {
    id: "p10",
    number: 10,
    title: "Team, Clients & Settings",
    subtitle: "Team page, client management, user settings, integrations UI",
    icon: UsersIcon,
    color: c.emerald,
    colorLight: c.emeraldLight,
    colorMid: c.emeraldMid,
    timeEstimate: "3-4 days",
    items: [
      {
        id: "p10-1",
        title: "TeamPage",
        description: "Team members list/grid loaded from server. Time tracking entries. Active timers. Mobile: card layout replacing table rows. Email invitations via Resend.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["page", "team"],
      },
      {
        id: "p10-2",
        title: "ClientsListPage & ClientPage",
        description: "Clients list (grid/card). Client detail: contacts, projects, meetings, contracts, satisfaction rating, files. Mobile: card-based layout.",
        status: "done",
        priority: "high",
        effort: "1.5 days",
        tags: ["page", "clients"],
      },
      {
        id: "p10-3",
        title: "ProfileSettingsPage",
        description: "Profile editing, avatar upload with crop modal, theme selection, notification preferences, integration connections, data management. All settings auto-saved.",
        status: "done",
        priority: "high",
        effort: "1.5 days",
        tags: ["page", "settings"],
        subitems: [
          { title: "Profile section (name, email, role, department, timezone, bio)", status: "done" },
          { title: "Avatar upload with image crop modal", status: "done" },
          { title: "Theme selector (light/dark/system)", status: "done" },
          { title: "Notification preferences (per-type toggles)", status: "done" },
          { title: "Integration connections UI (GCal, Gmail, Frame.io, Asana, Craft)", status: "done" },
          { title: "Week start, date format, compact mode toggles", status: "done" },
          { title: "Data export/import section", status: "done" },
        ],
      },
    ],
  },
  {
    id: "p11",
    number: 11,
    title: "Mobile & PWA",
    subtitle: "Responsive breakpoints, touch optimization, service worker, manifest",
    icon: DeviceMobile,
    color: c.lavender,
    colorLight: c.lavenderLight,
    colorMid: c.lavenderMid,
    timeEstimate: "5-7 days",
    items: [
      {
        id: "p11-1",
        title: "PWA setup (manifest, service worker, icons)",
        description: "Web App Manifest (/public/manifest.json) with sparkle-branded SVG icon (/public/icons/icon.svg), display: standalone, theme_color. Service worker (/public/sw.js) pre-caches app shell with network-first for API, cache-first for assets. Apple meta tags injected at startup in AppInner.tsx. SW registration in push.ts with MIME-type probe to skip in unsupported environments.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["pwa"],
      },
      {
        id: "p11-2",
        title: "Touch optimization pass",
        description: "44px minimum touch targets. Replace hover-only interactions with tap/long-press. Swipe gestures on task rows. Long-press context menus. Camera capture for file inputs.",
        status: "done",
        priority: "high",
        effort: "2 days",
        tags: ["mobile", "touch"],
        subitems: [
          { title: "Audit all interactive elements for 44px min tap target", status: "done" },
          { title: "Swipe gestures on task rows (right: complete, left: actions)", status: "done" },
          { title: "Long-press to trigger context menus (action sheets)", status: "done" },
          { title: "Long-press to enter multi-select mode", status: "done" },
          { title: "react-dnd-touch-backend for drag-and-drop", status: "done" },
          { title: "Native date/time inputs on mobile (browser-native on touch)", status: "done" },
          { title: "Camera capture via input capture attribute", status: "done" },
        ],
      },
      {
        id: "p11-3",
        title: "Mobile component adaptations",
        description: "Task detail → bottom sheet. Search → full-screen overlay. Kanban → horizontal scroll with snap. Tables → card layouts. Modals → bottom sheets (vaul). Filters → collapsible drawers.",
        status: "done",
        priority: "high",
        effort: "2 days",
        tags: ["mobile", "responsive"],
        subitems: [
          { title: "Task detail pane → full-screen on mobile (inset-0)", status: "done" },
          { title: "Command palette → full-screen overlay on mobile with close button", status: "done" },
          { title: "Kanban board → horizontal scroll with snap-center columns (75vw)", status: "done" },
          { title: "Bottom tab bar with safe-area-inset padding", status: "done" },
          { title: "Context menus → spring-animated bottom sheet on mobile", status: "done" },
          { title: "ResponsiveModal component (vaul drawer on mobile, dialog on desktop)", status: "done" },
          { title: "FilterDrawer component (inline on desktop, bottom sheet on mobile)", status: "done" },
          { title: "TouchDndProvider auto-selects HTML5/Touch backend by device", status: "done" },
        ],
      },
      {
        id: "p11-4",
        title: "Performance optimization for mobile",
        description: "React.lazy for heavy components. Virtualized lists (react-window). Image optimization (srcset, WebP, lazy load). Reduced motion support. Debounced scroll handlers.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["performance", "mobile"],
        subitems: [
          { title: "Reduced motion support (prefers-reduced-motion CSS)", status: "done" },
          { title: "Touch optimization CSS (longpress, no-context-menu)", status: "done" },
          { title: "React.lazy for heavy components (all pages in Layout.tsx)", status: "done" },
          { title: "Virtualized lists (react-window) — VirtualizedTaskList.tsx with memoized rows, stable itemData, itemKey, keyboard nav, ARIA", status: "done" },
          { title: "Image lazy loading (CSS prefers-reduced-motion)", status: "done" },
        ],
      },
    ],
  },
  {
    id: "p12",
    number: 12,
    title: "Integrations",
    subtitle: "Google Calendar, Gmail, Frame.io, Asana, Craft, Gemini AI",
    icon: Plugs,
    color: c.gold,
    colorLight: c.goldLight,
    colorMid: c.goldMid,
    timeEstimate: "8-12 days",
    items: [
      {
        id: "p12-1",
        title: "Google Calendar integration",
        description: "OAuth2 flow with popup window, token storage with auto-refresh in KV, calendar selection UI, event CRUD proxy routes, sync endpoint. Server routes in integrations.tsx, frontend client in integrations.ts, GoogleCalendarDialog with connect/calendar-picker/sync flow.",
        status: "done",
        priority: "high",
        effort: "2 days",
        tags: ["integration", "backend"],
      },
      {
        id: "p12-2",
        title: "Gmail integration",
        description: "Shared Google OAuth2 with GCal. Starred email fetcher via Gmail API. AI-powered email-to-task extraction using Gemini. GmailDialog with starred email list, extract button, AI task preview, and create-task flow. Unstar API.",
        status: "done",
        priority: "medium",
        effort: "2 days",
        tags: ["integration", "backend", "ai"],
        dependencies: ["p12-1", "p12-5"],
      },
      {
        id: "p12-3",
        title: "Frame.io integration",
        description: "Developer token auth with /me validation. Server proxy routes for teams, projects, assets (folder nav), comments. FrameIoDialog with token input, breadcrumb file browser, thumbnails, comment counts.",
        status: "done",
        priority: "medium",
        effort: "1.5 days",
        tags: ["integration", "backend"],
      },
      {
        id: "p12-4",
        title: "Asana import",
        description: "PAT auth with /users/me validation. Workspace browser, project selector (Asana color mapping), full import: tasks, sections, subtasks, assignees, tags, due dates. AsanaImportDialog wizard with 5-step flow.",
        status: "done",
        priority: "medium",
        effort: "2 days",
        tags: ["integration", "backend"],
      },
      {
        id: "p12-5",
        title: "Gemini AI service",
        description: "Fully wired Gemini AI service. Model fallback chain. Routes: /project-image, /unsplash-search, /gmail-extract, /summarize. Sparkle button in DescriptionBlockEditor.tsx, floating AI chat panel in AiChatPanel.tsx, toast notifications via sonner. In-memory cache (5-min TTL). Rate limit handling with retry-after.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["integration", "ai", "backend"],
      },
      {
        id: "p12-6",
        title: "Craft import",
        description: "Dual import modes: Markdown (paste/upload .md) and JSON (upload .json). Server-side markdown-to-blocks parser. Craft block-type mapping. CraftImportDialog with mode selector and file upload.",
        status: "done",
        priority: "low",
        effort: "2 days",
        tags: ["integration", "backend"],
      },
    ],
  },
  {
    id: "p13",
    number: 13,
    title: "Desktop (Electron / Tauri)",
    subtitle: "Native Mac app, notifications, tray, auto-update, deep links",
    icon: Desktop,
    color: c.indigo,
    colorLight: c.indigoLight,
    colorMid: c.indigoMid,
    timeEstimate: "5-7 days",
    items: [
      {
        id: "p13-1",
        title: "Electron shell setup",
        description: "Main process, preload script with contextBridge, BrowserWindow loading the web app. CSP for Supabase + Unsplash. Universal binary (arm64 + x86_64).",
        status: "planned",
        priority: "medium",
        effort: "1.5 days",
        tags: ["desktop", "electron"],
      },
      {
        id: "p13-2",
        title: "Native macOS notifications",
        description: "Electron Notification API for all 15 notification types. Click brings app to foreground and navigates. Dock badge for unread count. Notification grouping.",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["desktop", "notifications"],
      },
      {
        id: "p13-3",
        title: "Native menus, tray, shortcuts",
        description: "macOS menu bar (File, Edit, View, Window, Help + app items). System tray with active timer. Global shortcuts (Cmd+Shift+N). Touch Bar controls.",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["desktop"],
      },
      {
        id: "p13-4",
        title: "Auto-update & deep linking",
        description: "electron-updater with GitHub Releases feed. Custom URL scheme (app://task/<id>). Window state persistence (size, position, maximized).",
        status: "planned",
        priority: "low",
        effort: "1 day",
        tags: ["desktop"],
      },
      {
        id: "p13-5",
        title: "Code signing & distribution",
        description: "Sign and notarize for Gatekeeper. electron-builder producing .dmg and .app. App icon (.icns all sizes). About panel branding.",
        status: "planned",
        priority: "low",
        effort: "0.5 days",
        tags: ["desktop", "deploy"],
      },
    ],
  },
  {
    id: "p14",
    number: 14,
    title: "Advanced Features & Polish",
    subtitle: "Recurring tasks, dependencies, context menus, easter eggs, email invites",
    icon: Sparkle,
    color: c.coral,
    colorLight: c.coralLight,
    colorMid: c.coralMid,
    timeEstimate: "4-6 days",
    items: [
      {
        id: "p14-1",
        title: "Recurring tasks",
        description: "On completion, auto-spawn next occurrence (daily/weekly/biweekly/monthly) via computeNextRecurrenceDate() in data.tsx. Proper date arithmetic with end-date checking. Recurrence indicator (ArrowsClockwise) on task rows. Subtasks reset on spawn.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["feature"],
      },
      {
        id: "p14-2",
        title: "Bidirectional dependencies",
        description: "blockedBy/blocking arrays with bidirectional sync in dependency editor. 'Blocked' pill indicator on task rows for tasks with uncompleted blockers. Dependency visualization in TaskDetailPane right sidebar with inline search.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["feature"],
      },
      {
        id: "p14-3",
        title: "Context menus (right-click / long-press)",
        description: "Right-click context menu on TaskRow (fixed position, viewport clamping, Escape/click-outside dismiss). Actions: Open task, Today, Lineup, Star, Delete. Dots-three button also opens it. Reusable ContextMenu component created.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["ui", "mobile"],
      },
      {
        id: "p14-4",
        title: "Image crop modal",
        description: "Drag-to-reposition and zoom modal for avatar and banner uploads. Circular and rectangular crop shapes, rule-of-thirds grid overlay, zoom slider, reset. Canvas-based crop output. Wired into AvatarEditor in ProfileSettingsPage.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["component", "ui"],
      },
      {
        id: "p14-5",
        title: "Email invitations",
        description: "Team invites via Resend API. Branded HTML email template. Server route /invite with invite:<email> KV key. Accept invite on signup.",
        status: "planned",
        priority: "low",
        effort: "0.5 days",
        tags: ["feature", "backend"],
      },
      {
        id: "p14-6",
        title: "Wingdings Easter Egg",
        description: "Cmd+Alt+Shift+K toggles all fonts to Wingdings for 5 minutes. Auto-disables after timeout. Style injection via dynamic style tag in AppInner.tsx.",
        status: "done",
        priority: "low",
        effort: "0.5 days",
        tags: ["fun"],
      },
    ],
  },
  {
    id: "p15",
    number: 15,
    title: "Design Pixel-Match & Polish",
    subtitle: "Figma brand guide alignment, project page redesign, component polish",
    icon: PaintBrush,
    color: c.coral,
    colorLight: c.coralLight,
    colorMid: c.coralMid,
    timeEstimate: "4-6 days",
    items: [
      {
        id: "p15-1",
        title: "ProjectPage two-column pixel-match redesign",
        description: "Full rewrite of ProjectPage.tsx to match Figma brand guide. Two-column layout: 65% scrollable content + 35% full-bleed cover image panel. Inline InlineTaskRow components, section headers with colored accent underlines, tags row, resources row, milestones card, status badge dropdown.",
        status: "done",
        priority: "critical",
        effort: "2 days",
        tags: ["design", "page", "pixel-match"],
        subitems: [
          { title: "Two-column layout (65/35 split) with sticky cover image", status: "done" },
          { title: "Title row with project icon, star toggle, caret, status badge", status: "done" },
          { title: "Description + milestones card side-by-side", status: "done" },
          { title: "Tags row with pill badges and + button", status: "done" },
          { title: "Resources row with typed icons and links", status: "done" },
          { title: "Status badge dropdown with color-coded options", status: "done" },
          { title: "Cover image kebab menu overlay", status: "done" },
          { title: "FABs: search, add (coral gradient), help (indigo)", status: "done" },
        ],
      },
      {
        id: "p15-2",
        title: "InlineTaskRow brand-guide styling",
        description: "Redesigned task row: 14px/500 weight task name, colored section headers with 2px accent underlines, hover action icons (Today/SunDim, Lineup/Queue, Watch/Eye), photo-capable assignee avatars, subtask counter styling.",
        status: "done",
        priority: "high",
        effort: "0.5 days",
        tags: ["design", "component", "pixel-match"],
        subitems: [
          { title: "Task name 14px / fontWeight 500", status: "done" },
          { title: "Section headers with colored bottom accent border (2px)", status: "done" },
          { title: "Three hover action icons: SunDim, Queue, Eye", status: "done" },
          { title: "Assignee avatar supports avatarUrl photo (ImageWithFallback)", status: "done" },
          { title: "Sort/Filter buttons as bordered rounded-full pills", status: "done" },
        ],
      },
      {
        id: "p15-3",
        title: "Cover image panel always-visible",
        description: "Fixed the right column hiding when no bannerImage/sidebarBgImage is set. Now always renders on lg+: with image shows full-bleed photo + kebab; without image shows project-color gradient placeholder with 'Add cover' button.",
        status: "done",
        priority: "high",
        effort: "0.5 days",
        tags: ["design", "bugfix"],
      },
      {
        id: "p15-4",
        title: "TaskRow popup clipping fix",
        description: "Fixed popup clipping in TaskRow.tsx by changing overflow-hidden to overflow-x-clip. Horizontal swipe overflow is still clipped but vertical popups (assignee search dropdown) extend freely.",
        status: "done",
        priority: "medium",
        effort: "0.5 hours",
        tags: ["bugfix", "ui"],
      },
      {
        id: "p15-5",
        title: "Project header action buttons wiring",
        description: "Three action buttons removed from project header to match Figma (Flag/red #FA6863, Today/Sun/orange #F59145, Lineup/Queue/purple #6159E1) — still need wiring if re-added. Today calls toggleToday, Lineup connects to handleToggleLineup, Flag needs flagged state.",
        status: "planned",
        priority: "medium",
        effort: "0.5 days",
        tags: ["feature", "design"],
        notes: "Deferred — buttons were removed from header per Figma. Can be re-added as row-level hover actions (already done in P15-2 for Today/Lineup).",
      },
      {
        id: "p15-6",
        title: "Kanban board view implementation",
        description: "Implement the Board tab in ProjectPage. Columns by status (To Do, In Progress, On Hold, Done). Drag cards between columns using react-dnd. Mobile: horizontal scroll with snap-to-column. Cards show task title, priority accent, tags, due date, subtask count, and assignee avatar.",
        status: "done",
        priority: "high",
        effort: "1.5 days",
        tags: ["kanban", "dnd", "design"],
        dependencies: ["p5-3"],
      },
      {
        id: "p15-7",
        title: "Task Detail Pane remaining features",
        description: "All TaskDetailPane features wired: block-based description editor, file attachments with Supabase Storage upload/download/delete, full comments system, time tracking with FloatingTimer integration, dependency editor with bidirectional blockedBy/blocking and inline search.",
        status: "done",
        priority: "high",
        effort: "3 days",
        tags: ["task-detail", "feature"],
        dependencies: ["p5-4", "p7-1"],
        subitems: [
          { title: "DescriptionBlockEditor integration in task detail", status: "done" },
          { title: "File attachments with upload to Supabase Storage, download links, and delete", status: "done" },
          { title: "Comments section with author avatars, timestamps, and send button", status: "done" },
          { title: "Time tracking entries display and start/stop (integrated with FloatingTimer)", status: "done" },
          { title: "Dependencies editor (blockedBy/blocking with inline search, bidirectional linking)", status: "done" },
        ],
      },
      {
        id: "p15-8",
        title: "Notification wiring into user actions",
        description: "Wire sendNotification() calls into task assignment, comment creation, status changes, task completion, and @mention events. Triggers added in data layer updateTask() and TaskDetailPane comment submission.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["notifications", "feature"],
        dependencies: ["p9-2"],
        subitems: [
          { title: "Notify on task assignment change", status: "done" },
          { title: "Notify on comment added", status: "done" },
          { title: "Notify on task status change", status: "done" },
          { title: "Notify on task completion", status: "done" },
          { title: "Notify on @mention in comment or description", status: "done" },
        ],
      },
    ],
  },
  {
    id: "p16",
    number: 16,
    title: "Hardening & Quality",
    subtitle: "Error boundaries, loading states, empty states, accessibility, testing",
    icon: Wrench,
    color: c.teal,
    colorLight: c.tealLight,
    colorMid: c.tealMid,
    timeEstimate: "3-5 days",
    items: [
      {
        id: "p16-1",
        title: "Error boundaries & fallbacks",
        description: "React error boundaries around each major section (Home, Projects, Docs, Calendar, Inbox). Graceful fallback UI with retry button. Console error logging with contextual info. ErrorBoundary component created with branded UI, expandable error details, and Try Again button.",
        status: "done",
        priority: "high",
        effort: "1 day",
        tags: ["quality", "error-handling"],
      },
      {
        id: "p16-2",
        title: "Empty states for all views",
        description: "Reusable EmptyState component with branded icon rings, CTA buttons, compact/default/full variants. Preset components for projects, tasks, docs, calendar, inbox, team, clients, comments, attachments, search. Motion-animated entry.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["design", "ux"],
      },
      {
        id: "p16-3",
        title: "Loading skeleton states",
        description: "Content-shaped pulse skeletons for Home, Project, ProjectList, DocList, Calendar, Inbox, Team pages. Each matches the real page layout. Wired into all Suspense fallbacks in Layout.tsx, replacing generic spinners.",
        status: "done",
        priority: "medium",
        effort: "1 day",
        tags: ["design", "ux"],
      },
      {
        id: "p16-4",
        title: "Accessibility audit",
        description: "ARIA labels on interactive elements (status checkbox, priority flag, task detail drawer). Role attributes on navigation, tab bar, dialog panels. aria-modal and aria-label on TaskDetailPane drawer. Keyboard navigation improvements (Escape to close, Enter to submit in dependency search).",
        status: "done",
        priority: "medium",
        effort: "1.5 days",
        tags: ["a11y", "quality"],
        subitems: [
          { title: "ARIA labels on buttons, inputs, and custom controls (status checkbox, priority flag, dep search)", status: "done" },
          { title: "role=dialog, aria-modal, aria-label on TaskDetailPane drawer", status: "done" },
          { title: "role=tablist and aria-label on sidebar nav and mobile bottom bar", status: "done" },
          { title: "Keyboard nav: Escape to clear multi-select, close dep search, close modals", status: "done" },
          { title: "Screen reader live regions for toast/status updates", status: "done" },
          { title: "OKLCH color contrast check (WCAG AA)", status: "done" },
        ],
      },
      {
        id: "p16-5",
        title: "Data validation & sanitization",
        description: "Validation utility (/src/app/lib/validation.ts) with MAX_LENGTHS, FILE_LIMITS, sanitizeText, enforceMaxLength, and validators for tasks, projects, comments, emails, files, URLs, dates, passwords. Wired into TaskDetailPane comments (maxLength enforcement) and file uploads (size/count validation).",
        status: "done",
        priority: "high",
        effort: "0.5 days",
        tags: ["security", "quality"],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function BuildPlan() {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(["p15"]));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"phases" | "flat" | "dependencies">("phases");

  const togglePhase = (id: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPhases(new Set(phases.map((p) => p.id)));
    setExpandedItems(new Set(phases.flatMap((p) => p.items.map((i) => i.id))));
  };

  const collapseAll = () => {
    setExpandedPhases(new Set());
    setExpandedItems(new Set());
  };

  // Stats
  const allItems = phases.flatMap((p) => p.items);
  const totalItems = allItems.length;
  const stats = useMemo(() => {
    const byStatus: Record<Status, number> = { done: 0, "in-progress": 0, planned: 0, blocked: 0, deferred: 0 };
    const byPriority: Record<Priority, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    let totalSubitems = 0;
    for (const item of allItems) {
      byStatus[item.status]++;
      byPriority[item.priority]++;
      if (item.subitems) totalSubitems += item.subitems.length;
    }
    return { byStatus, byPriority, totalSubitems };
  }, []);

  // Estimated total effort
  const totalWeeks = "14-20 weeks";

  // Filter
  const filteredPhases = useMemo(() => {
    return phases.map((phase) => ({
      ...phase,
      items: phase.items.filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) return false;
        if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.tags?.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      }),
    })).filter((p) => p.items.length > 0);
  }, [statusFilter, priorityFilter, searchQuery]);

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.coral }} />
          <p style={{ color: c.coralMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>BUILD PLAN</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
          Canto — Complete Build Plan
        </h1>
        <p className="mt-2 max-w-3xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Full-featured, Asana-inspired project management app for creative/production teams. React + Tailwind v4 + Supabase backend. Single-page architecture with state-driven navigation. Native Mac desktop app (Electron) + responsive PWA. This plan covers <strong>{totalItems} work items</strong> across <strong>{phases.length} phases</strong> with an estimated <strong>{totalWeeks}</strong> of development. <strong>Phases 0–11 and 16 are complete</strong>. Phase 12 integrations + Gemini AI fully wired. Phase 14 recurring tasks, dependencies, context menus, image crop modal, and Wingdings Easter Egg are done. Phase 15 design polish is nearly complete. @mention notifications are now wired.
        </p>
      </div>

      {/* ── Architecture summary ── */}
      <div className="rounded-[6px] border p-4" style={{ borderColor: "oklch(0.55 0.2 280 / 0.2)", background: "oklch(0.55 0.2 280 / 0.05)" }}>
        <div className="flex items-center gap-2 mb-3">
          <TreeStructure className="w-4 h-4" style={{ color: c.indigoMid }} />
          <p style={{ color: c.indigoMid, fontSize: "13px", fontWeight: 600 }}>Architecture Overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Frontend", desc: "React 18 + Tailwind v4, single-page (no router), state-driven nav via activeNav string", icon: Code },
            { label: "Backend", desc: "Hono edge function → Supabase KV store. Dual-header auth (anon key + user JWT)", icon: Database },
            { label: "Desktop", desc: "Electron wrapper for macOS. Native notifications, tray, global shortcuts, auto-update", icon: Desktop },
            { label: "Mobile", desc: "Responsive PWA. Bottom tabs, touch gestures, push notifications, offline queue", icon: DeviceMobile },
          ].map((a) => (
            <div key={a.label} className="flex gap-2.5">
              <a.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.indigoMid }} />
              <div>
                <p style={{ color: "oklch(0.3 0.1 280)", fontSize: "12px", fontWeight: 600 }}>{a.label}</p>
                <p style={{ color: "oklch(0.45 0.08 280)", fontSize: "11px", lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Total Items", value: totalItems, color: c.text1 },
          { label: "Done", value: stats.byStatus.done, color: c.tealMid },
          { label: "In Progress", value: stats.byStatus["in-progress"], color: c.indigoMid },
          { label: "Planned", value: stats.byStatus.planned, color: c.text4 },
          { label: "Critical", value: stats.byPriority.critical, color: c.coralMid },
          { label: "Sub-items", value: stats.totalSubitems, color: c.text3 },
          { label: "Phases", value: phases.length, color: c.lavenderMid },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[6px] border p-2.5" style={{ borderColor: c.border, background: c.surface }}>
            <p style={{ color: stat.color, fontSize: "20px", fontWeight: 700 }}>{stat.value}</p>
            <p style={{ color: c.text4, fontSize: "10px" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Filters & controls ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: c.text4 }} />
          <input
            type="text"
            placeholder="Search items, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-[6px] border"
            style={{ borderColor: c.border, fontSize: "12px", color: c.text1, background: c.surface }}
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
          className="px-3 py-2 rounded-[6px] border"
          style={{ borderColor: c.border, fontSize: "12px", color: c.text2, background: c.surface }}
        >
          <option value="all">All Statuses</option>
          <option value="done">Done</option>
          <option value="in-progress">In Progress</option>
          <option value="planned">Planned</option>
          <option value="blocked">Blocked</option>
          <option value="deferred">Deferred</option>
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as Priority | "all")}
          className="px-3 py-2 rounded-[6px] border"
          style={{ borderColor: c.border, fontSize: "12px", color: c.text2, background: c.surface }}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={expandAll} className="px-2.5 py-1.5 rounded-[6px] border hover:bg-black/[0.03] transition-colors" style={{ borderColor: c.border, fontSize: "11px", color: c.text3 }}>Expand All</button>
          <button onClick={collapseAll} className="px-2.5 py-1.5 rounded-[6px] border hover:bg-black/[0.03] transition-colors" style={{ borderColor: c.border, fontSize: "11px", color: c.text3 }}>Collapse All</button>
        </div>
      </div>

      {/* ── Phase list ── */}
      <div className="space-y-3">
        {filteredPhases.map((phase) => {
          const isExpanded = expandedPhases.has(phase.id);
          const doneCount = phase.items.filter((i) => i.status === "done").length;
          const pct = phase.items.length > 0 ? Math.round((doneCount / phase.items.length) * 100) : 0;

          return (
            <div key={phase.id} className="rounded-[6px] border overflow-hidden" style={{ borderColor: c.border, background: c.surface }}>
              {/* Phase header */}
              <button
                onClick={() => togglePhase(phase.id)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors hover:bg-black/[0.015]"
              >
                {isExpanded ? <CaretDown className="w-3.5 h-3.5 shrink-0" style={{ color: c.text4 }} /> : <CaretRight className="w-3.5 h-3.5 shrink-0" style={{ color: c.text4 }} />}

                <span
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0"
                  style={{ background: phase.colorLight }}
                >
                  <phase.icon className="w-4 h-4" style={{ color: phase.colorMid }} />
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded" style={{ background: phase.colorLight, color: phase.colorMid, fontSize: "10px", fontWeight: 700 }}>
                      Phase {phase.number}
                    </span>
                    <span style={{ color: c.text1, fontSize: "14px", fontWeight: 600 }}>{phase.title}</span>
                  </div>
                  <p className="mt-0.5 truncate" style={{ color: c.text4, fontSize: "11px" }}>{phase.subtitle}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p style={{ color: c.text4, fontSize: "10px" }}>{phase.timeEstimate}</p>
                    <p style={{ color: c.text4, fontSize: "10px" }}>{doneCount}/{phase.items.length} done</p>
                  </div>
                  {/* Progress bar */}
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: c.bg2 }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? c.teal : phase.color }} />
                  </div>
                </div>
              </button>

              {/* Phase items */}
              {isExpanded && (
                <div className="border-t" style={{ borderColor: c.border }}>
                  {phase.items.map((item, idx) => {
                    const isItemExpanded = expandedItems.has(item.id);
                    const sc = statusConfig[item.status];
                    const StatusIcon = sc.icon;
                    const pc = priorityConfig[item.priority];

                    return (
                      <div key={item.id} className={idx < phase.items.length - 1 ? "border-b" : ""} style={{ borderColor: c.border }}>
                        {/* Item row */}
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-black/[0.015]"
                        >
                          {isItemExpanded ? <CaretDown className="w-3 h-3 shrink-0" style={{ color: c.text4 }} /> : <CaretRight className="w-3 h-3 shrink-0" style={{ color: c.text4 }} />}

                          <StatusIcon className="w-4 h-4 shrink-0" style={{ color: sc.color }} weight={item.status === "done" ? "fill" : item.status === "in-progress" ? "fill" : "regular"} />

                          <span className="flex-1 min-w-0 truncate" style={{ color: item.status === "done" ? c.text4 : c.text1, fontSize: "13px", fontWeight: 500, textDecoration: item.status === "done" ? "line-through" : "none" }}>
                            {item.title}
                          </span>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Tags */}
                            {item.tags?.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-full" style={{ background: c.bg2, color: c.text4, fontSize: "9px" }}>{tag}</span>
                            ))}
                            {/* Priority */}
                            <Flag className="w-3.5 h-3.5" weight="fill" style={{ color: pc.color }} />
                            {/* Effort */}
                            <span className="flex items-center gap-1" style={{ color: c.text4, fontSize: "10px" }}>
                              <Clock className="w-3 h-3" />
                              {item.effort}
                            </span>
                            {/* Subitems count */}
                            {item.subitems && (
                              <span className="flex items-center gap-0.5" style={{ color: c.text4, fontSize: "10px" }}>
                                <ListChecks className="w-3 h-3" />
                                {item.subitems.filter((s) => s.status === "done").length}/{item.subitems.length}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Item detail */}
                        {isItemExpanded && (
                          <div className="px-4 pb-4 ml-7 mr-4 space-y-3">
                            {/* Description */}
                            <p style={{ color: c.text3, fontSize: "12px", lineHeight: 1.65 }}>{item.description}</p>

                            {/* Meta row */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1 px-2 py-1 rounded-[6px]" style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 500 }}>
                                <StatusIcon className="w-3 h-3" weight={item.status === "done" || item.status === "in-progress" ? "fill" : "regular"} />
                                {sc.label}
                              </span>
                              <span className="flex items-center gap-1 px-2 py-1 rounded-[6px]" style={{ background: c.bg2, fontSize: "11px", fontWeight: 500 }}>
                                <Flag className="w-3 h-3" weight="fill" style={{ color: pc.color }} />
                                <span style={{ color: c.text3 }}>{pc.label}</span>
                              </span>
                              <span className="flex items-center gap-1 px-2 py-1 rounded-[6px]" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>
                                <Clock className="w-3 h-3" />
                                {item.effort}
                              </span>
                              {item.dependencies && item.dependencies.length > 0 && (
                                <span className="flex items-center gap-1 px-2 py-1 rounded-[6px]" style={{ background: c.goldLight, color: c.goldMid, fontSize: "11px" }}>
                                  <GitBranch className="w-3 h-3" />
                                  Depends on: {item.dependencies.join(", ")}
                                </span>
                              )}
                            </div>

                            {/* Tags */}
                            {item.tags && (
                              <div className="flex flex-wrap gap-1">
                                {item.tags.map((tag) => (
                                  <span key={tag} className="px-2 py-0.5 rounded-full" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "10px", fontWeight: 500 }}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Notes */}
                            {item.notes && (
                              <div className="flex gap-2 p-2.5 rounded-[6px]" style={{ background: c.goldLight }}>
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: c.goldMid }} />
                                <p style={{ color: c.goldMid, fontSize: "11px", lineHeight: 1.5 }}>{item.notes}</p>
                              </div>
                            )}

                            {/* Subitems */}
                            {item.subitems && item.subitems.length > 0 && (
                              <div className="space-y-1">
                                <p style={{ color: c.text4, fontSize: "10px", fontWeight: 600 }}>SUB-ITEMS</p>
                                {item.subitems.map((sub, si) => {
                                  const ssc = statusConfig[sub.status];
                                  const SubIcon = ssc.icon;
                                  return (
                                    <div key={si} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-black/[0.015]">
                                      <SubIcon className="w-3.5 h-3.5 shrink-0" weight={sub.status === "done" || sub.status === "in-progress" ? "fill" : "regular"} style={{ color: ssc.color }} />
                                      <span style={{ color: sub.status === "done" ? c.text4 : c.text2, fontSize: "12px", textDecoration: sub.status === "done" ? "line-through" : "none" }}>
                                        {sub.title}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Key decisions & notes ── */}
      <section className="rounded-[6px] border p-5" style={{ borderColor: c.border, background: c.surface }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Key Architecture Decisions</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            {
              title: "No React Router",
              desc: "Single-page architecture using an activeNav string. All navigation is in-memory state changes. No URL routing. This simplifies the Electron/PWA packaging and avoids React Router dependency issues.",
              icon: TreeStructure,
            },
            {
              title: "KV-Only Storage",
              desc: "No custom SQL tables — everything uses the kv_store utility (get/set/del/mget/mdel/getByPrefix). Per-project keys with migration from legacy bulk key. Simple, scalable, and easy to reason about.",
              icon: Database,
            },
            {
              title: "Dual-Header Auth",
              desc: "Authorization: Bearer ${anonKey} for the Edge Function gateway + X-User-Token: ${accessToken} for per-user auth. Server reads the user token via supabase.auth.getUser(accessToken).",
              icon: Shield,
            },
            {
              title: "Brand Guide Hidden Inside",
              desc: "The existing brand guide (12+ pages) becomes a hidden dev/design tool accessible via Cmd+Shift+B or Settings. Not part of the main navigation. Serves as the single source of truth for all styling.",
              icon: FigmaLogo,
            },
            {
              title: "Singleton Supabase Client",
              desc: "createClient stored on globalThis to prevent multiple GoTrueClient instances. Shared across all components and the API client module.",
              icon: Code,
            },
            {
              title: "Mobile-First Responsive",
              desc: "Three layout tiers: desktop (≥1024px) with full sidebar, tablet (768-1023px) with overlay sidebar, mobile (<768px) with bottom tab bar. All components adapt with vaul bottom sheets on mobile.",
              icon: DeviceMobile,
            },
          ].map((decision) => (
            <div key={decision.title} className="p-3 rounded-[6px]" style={{ background: c.bg2 }}>
              <div className="flex items-center gap-2 mb-1">
                <decision.icon className="w-3.5 h-3.5" style={{ color: c.coralMid }} />
                <p style={{ color: c.text2, fontSize: "12px", fontWeight: 600 }}>{decision.title}</p>
              </div>
              <p style={{ color: c.text4, fontSize: "11px", lineHeight: 1.55 }}>{decision.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dependency graph summary ── */}
      <section className="rounded-[6px] border p-5" style={{ borderColor: c.border, background: c.surface }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Critical Path</h2>
        <p className="mt-1 mb-4" style={{ color: c.text4, fontSize: "12px" }}>The dependency chain that determines the minimum build timeline.</p>
        <div className="flex items-center gap-0 flex-wrap">
          {[
            { label: "P0: Foundation", sub: "3-5d ✓", color: c.teal },
            { label: "P1: Auth", sub: "2-3d ✓", color: c.teal },
            { label: "P3: Data Layer", sub: "4-5d ✓", color: c.teal },
            { label: "P4: Home / Tasks", sub: "3-4d ✓", color: c.teal },
            { label: "P5: Projects", sub: "6-8d ✓", color: c.teal },
            { label: "P7: Editor / Docs", sub: "5-7d ✓", color: c.teal },
            { label: "P9: Notifications", sub: "3-4d ✓", color: c.teal },
            { label: "P15: Polish", sub: "4-6d ✓", color: c.teal },
            { label: "P16: Quality", sub: "3-5d ✓", color: c.teal },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="px-3 py-2 rounded-[6px] border" style={{ borderColor: step.color, background: `${step.color}15` }}>
                <p style={{ color: step.color, fontSize: "11px", fontWeight: 600 }}>{step.label}</p>
                <p style={{ color: c.text4, fontSize: "9px" }}>{step.sub}</p>
              </div>
              {i < 8 && <CaretRight className="w-3 h-3 mx-1 shrink-0" style={{ color: c.text4 }} />}
            </div>
          ))}
        </div>
        <p className="mt-3" style={{ color: c.text3, fontSize: "12px" }}>
          Phases 0-11 and 16 are <strong>complete</strong>. P15 (Design Polish) is nearly complete. Remaining work: <strong>P12 (Integrations: GCal, Gmail, Frame.io, Asana, Craft)</strong>, <strong>P13 (Desktop/Electron)</strong>, and a few P14/P15 items. Phase 12-13 can be parallelized.
        </p>
      </section>

      {/* ── Tech stack reference ── */}
      <section className="rounded-[6px] border p-5" style={{ borderColor: c.border, background: c.surface }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Tech Stack Summary</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { cat: "Core", items: "React 18, Tailwind v4, TypeScript, Vite" },
            { cat: "Backend", items: "Hono (edge function), Supabase (auth, KV, storage)" },
            { cat: "State", items: "React useState/useRef, no external state lib" },
            { cat: "UI", items: "Radix UI (full set), cmdk, vaul, sonner, embla-carousel" },
            { cat: "DnD", items: "react-dnd + html5-backend + touch-backend" },
            { cat: "Animation", items: "motion (Motion), CSS transitions" },
            { cat: "Charts", items: "Recharts" },
            { cat: "Dates", items: "date-fns, react-day-picker@8" },
            { cat: "Icons", items: "@phosphor-icons/react (primary)" },
            { cat: "Forms", items: "react-hook-form@7.55.0" },
            { cat: "Fonts", items: "Albert Sans (primary), Courier Prime (code/scripts)" },
            { cat: "Desktop", items: "Electron + electron-builder (or Tauri)" },
            { cat: "PWA", items: "Service worker, Web App Manifest, Push API" },
            { cat: "AI", items: "Gemini (project images, email extraction, summarize)" },
            { cat: "Integrations", items: "Google Calendar, Gmail, Frame.io, Asana, Craft" },
          ].map((s) => (
            <div key={s.cat} className="flex gap-2 p-2 rounded" style={{ background: c.bg2 }}>
              <Package className="w-3 h-3 shrink-0 mt-0.5" style={{ color: c.text4 }} />
              <div>
                <p style={{ color: c.text2, fontSize: "11px", fontWeight: 600 }}>{s.cat}</p>
                <p style={{ color: c.text4, fontSize: "10px", lineHeight: 1.5 }}>{s.items}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
