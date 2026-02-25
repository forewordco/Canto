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
        status: "in-progress",
        priority: "critical",
        effort: "1-2 days",
        tags: ["supabase", "backend"],
        subitems: [
          { title: "KV table schema (key TEXT PK, value JSONB, updated_at TIMESTAMPTZ)", status: "done" },
          { title: "kv_store.tsx utility functions", status: "done" },
          { title: "Hono server with CORS, auth middleware, health check", status: "planned" },
          { title: "Blob storage bucket creation (make-*-attachments)", status: "planned" },
          { title: "File upload/download routes with signed URLs", status: "planned" },
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
          { title: "Server /signup route with admin.createUser", status: "planned" },
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
        status: "planned",
        priority: "critical",
        effort: "1.5 days",
        tags: ["layout", "responsive"],
        subitems: [
          { title: "Desktop sidebar with collapse/expand (pinned state)", status: "planned" },
          { title: "Tablet overlay sidebar with gesture support", status: "planned" },
          { title: "Mobile bottom tab bar (56px, 5 tabs)", status: "planned" },
          { title: "'More' hamburger menu for secondary sections", status: "planned" },
          { title: "Active indicator styling per breakpoint", status: "planned" },
        ],
      },
      {
        id: "p2-2",
        title: "Search overlay (Cmd+K)",
        description: "Command palette searching across projects, tasks, clients, docs, team members. Desktop: centered popover. Mobile: full-screen overlay with recent searches.",
        status: "planned",
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
        status: "planned",
        priority: "medium",
        effort: "0.5 days",
        tags: ["animation", "mobile"],
        dependencies: ["p0-1"],
      },
      {
        id: "p2-4",
        title: "Time tracking floating timer",
        description: "Persistent timer in sidebar (desktop) or status bar (mobile). Start/stop per task. Stores TimeEntry with duration calculation. In native app, shows in system tray.",
        status: "planned",
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
        status: "planned",
        priority: "critical",
        effort: "2 days",
        tags: ["backend", "api"],
        subitems: [
          { title: "Project routes (CRUD + per-project keys + migration from legacy bulk key)", status: "planned" },
          { title: "Client routes (shared workspace key)", status: "planned" },
          { title: "Calendar event routes", status: "planned" },
          { title: "Docs routes (shared workspace)", status: "planned" },
          { title: "Profile routes (per-user)", status: "planned" },
          { title: "Starred / Today / Lineup routes (per-user)", status: "planned" },
          { title: "Time blocks & week settings routes (per-user)", status: "planned" },
          { title: "Team member routes", status: "planned" },
          { title: "Notification routes (CRUD + mark-read + archive)", status: "planned" },
        ],
      },
      {
        id: "p3-2",
        title: "Auto-save system with dirty tracking",
        description: "Debounced saves (1200ms) with dirtyProjectsRef Set and deletedProjectsRef. Object reference comparison. initialLoadDone ref prevents save-on-mount. saveWithAuth wrapper.",
        status: "planned",
        priority: "critical",
        effort: "1.5 days",
        tags: ["data", "architecture"],
        dependencies: ["p3-1"],
      },
      {
        id: "p3-3",
        title: "Data loading & caching layer",
        description: "Load all user data on app mount (profile, projects, clients, docs, events, starred, today, team). Cache in React state. Optimistic UI updates.",
        status: "planned",
        priority: "critical",
        effort: "1 day",
        tags: ["data"],
        dependencies: ["p3-1"],
      },
      {
        id: "p3-4",
        title: "Offline queue & sync",
        description: "For native/PWA: queue mutations in IndexedDB when offline. Sync when connectivity resumes. Show offline indicator in header.",
        status: "planned",
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
        status: "planned",
        priority: "critical",
        effort: "1.5 days",
        tags: ["page", "ui"],
        subitems: [
          { title: "Today section with task list", status: "planned" },
          { title: "Lineup section with task list", status: "planned" },
          { title: "Upcoming section with date grouping", status: "planned" },
          { title: "Gradient header presets (emerald, ocean, violet, sunbeam, coral, slate)", status: "planned" },
          { title: "Subtask entries in Today/Lineup", status: "planned" },
          { title: "Workspace doc entries in Today/Lineup", status: "planned" },
        ],
      },
      {
        id: "p4-2",
        title: "Task row component with inline editing",
        description: "Reusable task row: checkbox (5-state circle icons), title inline edit, assignee avatar, due date, priority flag, status badge, star toggle. Swipe actions on mobile.",
        status: "planned",
        priority: "critical",
        effort: "1.5 days",
        tags: ["component", "ui"],
        subitems: [
          { title: "Circle-based 5-state checkbox (open/in-progress/on-hold/blocked/done)", status: "planned" },
          { title: "Priority flag icon (urgent/high/medium/low/none)", status: "planned" },
          { title: "Inline title editing on click/tap", status: "planned" },
          { title: "Assignee avatar with picker popup", status: "planned" },
          { title: "Due date badge with date picker", status: "planned" },
          { title: "Star toggle for today/lineup", status: "planned" },
          { title: "Mobile: swipe right (complete/today), swipe left (delete/edit/move)", status: "planned" },
        ],
      },
      {
        id: "p4-3",
        title: "Pull-to-refresh on mobile",
        description: "Pull-to-refresh gesture on scrollable list views (Home, Projects, Inbox, Docs). Native-feeling spring animation.",
        status: "planned",
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
        status: "planned",
        priority: "critical",
        effort: "1 day",
        tags: ["page", "ui"],
      },
      {
        id: "p5-2",
        title: "Task list view with sections & drag-and-drop",
        description: "Grouped by sections with collapsible headers. DnD reordering (react-dnd). Multi-select with bulk actions. Add task inline at bottom of section.",
        status: "planned",
        priority: "critical",
        effort: "2 days",
        tags: ["task-list", "dnd"],
        dependencies: ["p4-2"],
        subitems: [
          { title: "Section grouping with add/rename/delete/collapse", status: "planned" },
          { title: "Drag-and-drop reorder within and between sections", status: "planned" },
          { title: "Mobile: long-press to initiate drag (touch-backend)", status: "planned" },
          { title: "Multi-select zone with bulk complete/move/delete/priority/status", status: "planned" },
          { title: "Inline 'Add task' at section bottom", status: "planned" },
        ],
      },
      {
        id: "p5-3",
        title: "Kanban board view",
        description: "Columns by status (or custom sections). Drag cards between columns. Mobile: horizontal scroll with snap-to-column.",
        status: "planned",
        priority: "high",
        effort: "1.5 days",
        tags: ["kanban", "dnd"],
        dependencies: ["p5-2"],
      },
      {
        id: "p5-4",
        title: "Task Detail Pane (ClickUp-style modal)",
        description: "Two-column layout: left = title, description (block editor), subtasks, attachments, comments, time tracking. Right sidebar = metadata (assignee, dates, priority, status, phase, tags, dependencies). Mobile: full-screen bottom sheet, metadata as collapsible accordion.",
        status: "planned",
        priority: "critical",
        effort: "3 days",
        tags: ["task-detail", "ui"],
        dependencies: ["p4-2"],
        subitems: [
          { title: "Left column: editable title, status/priority badges", status: "planned" },
          { title: "Block-based description editor (DescriptionBlockEditor)", status: "planned" },
          { title: "Subtask list with nested subtask support and DnD", status: "planned" },
          { title: "Attachments section with file upload to Supabase Storage", status: "planned" },
          { title: "Comments section with @mention support", status: "planned" },
          { title: "Time tracking entries display", status: "planned" },
          { title: "Right sidebar: all metadata property rows", status: "planned" },
          { title: "Assignee picker popup with team search", status: "planned" },
          { title: "Date picker with recurrence config", status: "planned" },
          { title: "Dependencies editor (blockedBy/blocking with task search)", status: "planned" },
          { title: "Mobile: vaul Drawer bottom sheet, vertical stacking", status: "planned" },
        ],
      },
      {
        id: "p5-5",
        title: "Project timeline / calendar sub-view",
        description: "Timeline dates with assignee avatars and date range pickers. Visual timeline bar chart showing shoots, rounds, milestones.",
        status: "planned",
        priority: "medium",
        effort: "1.5 days",
        tags: ["timeline", "ui"],
      },
      {
        id: "p5-6",
        title: "Project files & attachments view",
        description: "Gallery view of project attachments (images, videos, links, documents). Support for 'gallery' and 'travel' attachment types with TravelItem budgets.",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["files", "ui"],
      },
      {
        id: "p5-7",
        title: "Project overview / dashboard",
        description: "Status updates editor with rich text. Production phase & project type selectors. Project stats (completion %, overdue tasks, recent activity).",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["dashboard", "ui"],
      },
      {
        id: "p5-8",
        title: "Messages (notes/meetings) sub-view",
        description: "List of project notes and meeting notes. Meeting notes with attendees and GCal linking. Rich text editing with block editor.",
        status: "planned",
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
        status: "planned",
        priority: "critical",
        effort: "2 days",
        tags: ["page", "ui"],
        subitems: [
          { title: "Project card grid with status/phase badges", status: "planned" },
          { title: "Filter bar: status, phase, type, client", status: "planned" },
          { title: "Context menu: rename, duplicate, archive, delete, export", status: "planned" },
          { title: "Project creation wizard (name, client, type, phase, icon, banner)", status: "planned" },
          { title: "Import project from JSON", status: "planned" },
          { title: "Mobile: single-column card layout, filters in collapsible drawer", status: "planned" },
        ],
      },
      {
        id: "p6-2",
        title: "Star / favorite projects",
        description: "Star toggle on project cards and sidebar. Starred projects appear at top of sidebar and overview.",
        status: "planned",
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
        status: "planned",
        priority: "critical",
        effort: "3 days",
        tags: ["editor", "component"],
        subitems: [
          { title: "Block type selector (slash command or toolbar)", status: "planned" },
          { title: "Paragraph, Heading (h1-h3)", status: "planned" },
          { title: "Bulleted list, Numbered list", status: "planned" },
          { title: "Checklist with toggle", status: "planned" },
          { title: "Quote block", status: "planned" },
          { title: "Code block with monospace font", status: "planned" },
          { title: "Divider", status: "planned" },
          { title: "Image block (upload to Supabase Storage)", status: "planned" },
          { title: "Keyboard shortcuts (Cmd+B/I/U, Enter to new block, Tab to indent)", status: "planned" },
          { title: "Block reorder via drag or keyboard", status: "planned" },
        ],
      },
      {
        id: "p7-2",
        title: "DocsPage — workspace document management",
        description: "Folders, multiple doc types (doc, note, meeting, script/screenplay). Document list with search and filters. Block-based editing in a detail view.",
        status: "planned",
        priority: "high",
        effort: "2 days",
        tags: ["page", "docs"],
        dependencies: ["p7-1"],
        subitems: [
          { title: "Folder tree sidebar", status: "planned" },
          { title: "Document list with type icons", status: "planned" },
          { title: "Doc type: standard document", status: "planned" },
          { title: "Doc type: meeting notes with attendees + GCal link", status: "planned" },
          { title: "Doc type: screenplay with scene headings, action, dialogue", status: "planned" },
          { title: "Search and filter docs", status: "planned" },
        ],
      },
      {
        id: "p7-3",
        title: "Publishing system",
        description: "Publish projects and docs with unique slugs for public viewing (no auth required). Support update and unpublish.",
        status: "planned",
        priority: "low",
        effort: "1 day",
        tags: ["feature", "backend"],
        dependencies: ["p7-2"],
      },
      {
        id: "p7-4",
        title: "MentionInput component",
        description: "@-mention of people, tasks, projects, meetings, clients with autocomplete dropdown. Used in comments, descriptions, and docs.",
        status: "planned",
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
        status: "planned",
        priority: "high",
        effort: "2 days",
        tags: ["page", "calendar"],
      },
      {
        id: "p8-2",
        title: "WeekView — weekly time blocks",
        description: "Drag tasks into time slots. Working hours configuration. Notepad. Saved per-user with auto-save. Mobile: horizontal scroll with snap per day or day-at-a-time view.",
        status: "planned",
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
        status: "planned",
        priority: "high",
        effort: "1 day",
        tags: ["page", "notifications"],
      },
      {
        id: "p9-2",
        title: "Server-side notification generation (sendNotif)",
        description: "Centralized sendNotif() that resolves displayName→userId via teamMembers. Filters self-notifications. Stores per-user in KV (capped 200). Triggered on all 15 event types.",
        status: "planned",
        priority: "high",
        effort: "1 day",
        tags: ["backend", "notifications"],
      },
      {
        id: "p9-3",
        title: "Client-side polling with exponential backoff",
        description: "Poll every 30s (30→60→120s on failures). Desktop: Web Notification API with permission request. Clicking navigates to item. Unread badge count.",
        status: "planned",
        priority: "high",
        effort: "0.5 days",
        tags: ["notifications"],
        dependencies: ["p9-2"],
      },
      {
        id: "p9-4",
        title: "PWA push notifications",
        description: "Push API + service worker for background delivery (Android, iOS 16.4+). Store push subscription per-user. Server sends via web-push library. iOS fallback to polling.",
        status: "planned",
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
        status: "planned",
        priority: "high",
        effort: "1 day",
        tags: ["page", "team"],
      },
      {
        id: "p10-2",
        title: "ClientsListPage & ClientPage",
        description: "Clients list (grid/card). Client detail: contacts, projects, meetings, contracts, satisfaction rating, files. Mobile: card-based layout.",
        status: "planned",
        priority: "high",
        effort: "1.5 days",
        tags: ["page", "clients"],
      },
      {
        id: "p10-3",
        title: "ProfileSettingsPage",
        description: "Profile editing, avatar upload with crop modal, theme selection, notification preferences, integration connections, data management. All settings auto-saved.",
        status: "planned",
        priority: "high",
        effort: "1.5 days",
        tags: ["page", "settings"],
        subitems: [
          { title: "Profile section (name, email, role, department, timezone, bio)", status: "planned" },
          { title: "Avatar upload with image crop modal", status: "planned" },
          { title: "Theme selector (light/dark/system)", status: "planned" },
          { title: "Notification preferences (per-type toggles)", status: "planned" },
          { title: "Integration connections UI (GCal, Gmail, Frame.io, Asana, Craft)", status: "planned" },
          { title: "Week start, date format, compact mode toggles", status: "planned" },
          { title: "Data export/import section", status: "planned" },
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
        description: "Web App Manifest with icons, display: standalone, theme_color. Service worker for offline caching (network-first for API, cache-first for assets). iOS-specific meta tags and splash screens.",
        status: "planned",
        priority: "high",
        effort: "1 day",
        tags: ["pwa"],
      },
      {
        id: "p11-2",
        title: "Touch optimization pass",
        description: "44px minimum touch targets. Replace hover-only interactions with tap/long-press. Swipe gestures on task rows. Long-press context menus. Camera capture for file inputs.",
        status: "planned",
        priority: "high",
        effort: "2 days",
        tags: ["mobile", "touch"],
        subitems: [
          { title: "Audit all interactive elements for 44px min tap target", status: "planned" },
          { title: "Swipe gestures on task rows (right: complete, left: actions)", status: "planned" },
          { title: "Long-press to trigger context menus (action sheets)", status: "planned" },
          { title: "Long-press to enter multi-select mode", status: "planned" },
          { title: "react-dnd-touch-backend for drag-and-drop", status: "planned" },
          { title: "Native date/time inputs on mobile", status: "planned" },
          { title: "Camera capture via input capture attribute", status: "planned" },
        ],
      },
      {
        id: "p11-3",
        title: "Mobile component adaptations",
        description: "Task detail → bottom sheet. Search → full-screen overlay. Kanban → horizontal scroll with snap. Tables → card layouts. Modals → bottom sheets (vaul). Filters → collapsible drawers.",
        status: "planned",
        priority: "high",
        effort: "2 days",
        tags: ["mobile", "responsive"],
      },
      {
        id: "p11-4",
        title: "Performance optimization for mobile",
        description: "React.lazy for heavy components. Virtualized lists (react-window). Image optimization (srcset, WebP, lazy load). Reduced motion support. Debounced scroll handlers.",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["performance", "mobile"],
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
        description: "OAuth2 flow, token storage with auto-refresh, calendar selection, event CRUD. useGoogleCalendar() hook. Server sub-router at /google.",
        status: "planned",
        priority: "high",
        effort: "2 days",
        tags: ["integration", "backend"],
      },
      {
        id: "p12-2",
        title: "Gmail integration",
        description: "OAuth2 flow, starred-email-to-task pipeline using Gemini AI. /sync-starred endpoint. Auto-poll every 3 minutes. Complete/uncomplete tasks syncs star state.",
        status: "planned",
        priority: "medium",
        effort: "2 days",
        tags: ["integration", "backend", "ai"],
        dependencies: ["p12-1", "p12-5"],
      },
      {
        id: "p12-3",
        title: "Frame.io integration",
        description: "Developer token auth. Proxy routes for teams, projects, assets, comments. FrameIoPanel component with file browser, video player, comment threads.",
        status: "planned",
        priority: "medium",
        effort: "1.5 days",
        tags: ["integration", "backend"],
      },
      {
        id: "p12-4",
        title: "Asana import",
        description: "PAT auth. Workspace/project browser. Full import: tasks, subtasks, comments, sections, milestones, custom fields, assignees. AsanaImportDialog wizard. Auto-link members on signup.",
        status: "planned",
        priority: "medium",
        effort: "2 days",
        tags: ["integration", "backend"],
      },
      {
        id: "p12-5",
        title: "Gemini AI service",
        description: "Model fallback chain. Routes: /project-image, /unsplash-search, /gmail-extract, /summarize. In-memory cache (5-min TTL). Rate limit handling with retry-after.",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["integration", "ai", "backend"],
      },
      {
        id: "p12-6",
        title: "Craft import",
        description: "API token auth. Space/document browser. Block-type mapping to DocBlock format. Batch import with progress. CraftImportDialog wizard. Conflict detection on re-import.",
        status: "planned",
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
        description: "On completion, auto-spawn next occurrence (daily/weekly/biweekly/monthly). Proper date arithmetic. End-date checking. Recurrence indicator on task rows.",
        status: "planned",
        priority: "high",
        effort: "1 day",
        tags: ["feature"],
      },
      {
        id: "p14-2",
        title: "Bidirectional dependencies",
        description: "blockedBy/blocking arrays. Automatic inverse sync. Dependency visualization in task detail. Blocked status indicator on task rows.",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["feature"],
      },
      {
        id: "p14-3",
        title: "Context menus (right-click / long-press)",
        description: "Radix context-menu on tasks, projects, sidebar items. Actions: open, duplicate, delete, star, archive, export. Mobile: long-press triggers bottom sheet action menu.",
        status: "planned",
        priority: "medium",
        effort: "1 day",
        tags: ["ui", "mobile"],
      },
      {
        id: "p14-4",
        title: "Image crop modal",
        description: "For avatar and banner uploads. Drag-to-reposition, zoom. Outputs cropped blob for upload to Supabase Storage.",
        status: "planned",
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
        description: "Cmd+Alt+Shift+K toggles all fonts to Wingdings for 5 minutes.",
        status: "planned",
        priority: "low",
        effort: "0.5 days",
        tags: ["fun"],
      },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function BuildPlan() {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(["p0"]));
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
  const totalWeeks = "12-16 weeks";

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
          FlowOS — Complete Build Plan
        </h1>
        <p className="mt-2 max-w-3xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Full-featured, Asana-inspired project management app for creative/production teams. React + Tailwind v4 + Supabase backend. Single-page architecture with state-driven navigation. Native Mac desktop app (Electron) + responsive PWA. This plan covers <strong>{totalItems} work items</strong> across <strong>{phases.length} phases</strong> with an estimated <strong>{totalWeeks}</strong> of development.
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
            { label: "P0: Foundation", sub: "3-5d", color: c.coral },
            { label: "P1: Auth", sub: "2-3d", color: c.indigo },
            { label: "P3: Data Layer", sub: "4-5d", color: c.emerald },
            { label: "P4: Home / Tasks", sub: "3-4d", color: c.lavender },
            { label: "P5: Projects", sub: "6-8d", color: c.coral },
            { label: "P7: Editor / Docs", sub: "5-7d", color: c.teal },
            { label: "P9: Notifications", sub: "3-4d", color: c.coral },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="px-3 py-2 rounded-[6px] border" style={{ borderColor: step.color, background: `${step.color}15` }}>
                <p style={{ color: step.color, fontSize: "11px", fontWeight: 600 }}>{step.label}</p>
                <p style={{ color: c.text4, fontSize: "9px" }}>{step.sub}</p>
              </div>
              {i < 6 && <CaretRight className="w-3 h-3 mx-1 shrink-0" style={{ color: c.text4 }} />}
            </div>
          ))}
        </div>
        <p className="mt-3" style={{ color: c.text3, fontSize: "12px" }}>
          Critical path minimum: <strong>~26-36 working days</strong> (5-7 weeks). Phases 2, 6, 8, 10, 11, 12, 13, 14 can be parallelized or built incrementally.
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
