import { useState } from "react";
import {
  Compass, Star, DotsThree, CaretDown, CaretRight,
  Circle, CheckCircle, Plus, Eye,
  CalendarBlank, Lightning, ArrowUp, Minus,
  Fire, LinkSimple, Folder, FileText, FigmaLogo,
  PencilSimple, Code, TestTube, Rocket,
  ListBullets, Kanban,
  SortAscending, Funnel,
  ChatText,
  ShareNetwork, Gear, CalendarDots, Browsers, ChatCircle,
  ArrowSquareOut, SidebarSimple,
  Timer, Clock,
  X, Smiley, PaperPlaneTilt, At,
  Play, Pause, Stop,
  TextB, TextItalic, ListNumbers,
} from "@phosphor-icons/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

/* ── OKLCH tokens ── */
const k = {
  bg: "oklch(0.99 0.002 260)",
  sidebar: "oklch(0.985 0.004 260)",
  card: "oklch(1 0 0)",
  fg: "oklch(0.2 0.02 260)",
  fg2: "oklch(0.35 0.02 260)",
  fg3: "oklch(0.5 0.02 260)",
  fg4: "oklch(0.6 0.02 260)",
  fg5: "oklch(0.72 0.01 260)",
  border: "oklch(0.92 0.01 260)",
  borderSoft: "oklch(0.95 0.005 260)",
  muted: "oklch(0.94 0.008 260)",
  coral: "oklch(0.7 0.18 25)",
  coralSoft: "oklch(0.7 0.18 25 / 0.08)",
  indigo: "oklch(0.55 0.2 280)",
  indigoSoft: "oklch(0.55 0.2 280 / 0.08)",
  teal: "oklch(0.65 0.15 180)",
  tealSoft: "oklch(0.65 0.15 180 / 0.08)",
  gold: "oklch(0.78 0.15 85)",
  goldSoft: "oklch(0.78 0.15 85 / 0.1)",
  green: "oklch(0.7 0.17 150)",
  greenSoft: "oklch(0.7 0.17 150 / 0.08)",
  orange: "oklch(0.75 0.15 55)",
  orangeSoft: "oklch(0.75 0.15 55 / 0.1)",
  purple: "oklch(0.6 0.2 300)",
  purpleSoft: "oklch(0.6 0.2 300 / 0.08)",
};

/* ── Avatars ── */
const avatars = [
  { name: "Nina Alvarez", role: "Design Lead", src: "https://images.unsplash.com/photo-1758598304332-94b40ce7c7b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHNtaWxpbmclMjBoZWFkc2hvdCUyMG5hdHVyYWx8ZW58MXx8fHwxNzcxOTAwNDY2fDA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "James Okoro", role: "Engineer", src: "https://images.unsplash.com/photo-1764084051438-369ad6a09334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBzbWlsaW5nJTIwcHJvZmVzc2lvbmFsJTIwY2FzdWFsJTIwaGVhZHNob3R8ZW58MXx8fHwxNzcxOTAwNDY3fDA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Mei Chen", role: "Developer", src: "https://images.unsplash.com/photo-1573497620166-aef748c8c792?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHNvZnR3YXJlJTIwZGV2ZWxvcGVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcxOTAwNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Andre Duval", role: "Designer", src: "https://images.unsplash.com/photo-1603207757545-de4fffdb404c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjcmVhdGl2ZSUyMGRpcmVjdG9yJTIwcHJvZmVzc2lvbmFsJTIwcGhvdG98ZW58MXx8fHwxNzcxOTAwNDY4fDA&ixlib=rb-4.1.0&q=80&w=1080" },
  { name: "Sara Lindgren", role: "QA Lead", src: "https://images.unsplash.com/photo-1712174766230-cb7304feaafe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2R1Y3QlMjBtYW5hZ2VyJTIwdGVjaCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MTkwMDQ2OHww&ixlib=rb-4.1.0&q=80&w=1080" },
];

/* ── Resources ── */
const resources = [
  { icon: FigmaLogo, label: "Atlas Component Library", sub: "Figma \u00b7 84 frames", color: k.purple },
  { icon: FileText, label: "Design Principles Doc", sub: "Notion \u00b7 Updated 2d ago", color: k.indigo },
  { icon: LinkSimple, label: "Storybook Preview", sub: "atlas-ds.vercel.app", color: k.teal },
  { icon: Folder, label: "Brand Assets", sub: "Drive \u00b7 142 files", color: k.gold },
  { icon: Code, label: "GitHub Repo", sub: "github.com/atlas-ds", color: k.fg3 },
];

/* ── Timeline milestones ── */
const timeline = [
  { label: "Kickoff", date: "Jan 6", done: true, active: false },
  { label: "Alpha", date: "Feb 24", done: true, active: false },
  { label: "Beta", date: "Mar 17", done: false, active: true },
  { label: "v1.0 Release", date: "Apr 18", done: false, active: false },
];

/* ── Tasks ── */
interface Task {
  name: string;
  subtasks?: string;
  priority: "urgent" | "high" | "medium" | "low";
  assigneeIdx?: number;
  date?: string;
  comments?: number;
  tags?: { label: string; color: string; bg: string }[];
  logged?: string;
  estimate?: string;
  tracking?: boolean;
}

interface TaskGroup {
  label: string;
  color: string;
  icon: typeof PencilSimple;
  tasks: Task[];
}

const taskGroups: TaskGroup[] = [
  {
    label: "FOUNDATIONS",
    color: k.coral,
    icon: PencilSimple,
    tasks: [
      { name: "Color token scale \u2014 light mode", subtasks: "12/12", priority: "high", assigneeIdx: 0, logged: "6h 30m", estimate: "6h", tags: [{ label: "Done", color: k.green, bg: k.greenSoft }] },
      { name: "Color token scale \u2014 dark mode", subtasks: "8/12", priority: "high", assigneeIdx: 0, date: "Mar 1", comments: 4, logged: "4h 15m", estimate: "8h", tracking: true },
      { name: "Typography scale & line-height", subtasks: "6/6", priority: "medium", assigneeIdx: 3, logged: "3h 10m", estimate: "4h", tags: [{ label: "Done", color: k.green, bg: k.greenSoft }] },
      { name: "Spacing & sizing primitives", subtasks: "4/4", priority: "medium", assigneeIdx: 3, logged: "2h 45m", estimate: "3h", tags: [{ label: "Done", color: k.green, bg: k.greenSoft }] },
      { name: "Elevation & shadow tokens", subtasks: "0/3", priority: "low", date: "Mar 5", estimate: "3h" },
      { name: "Motion & easing definitions", subtasks: "0/4", priority: "low", date: "Mar 8", estimate: "5h" },
    ],
  },
  {
    label: "COMPONENTS",
    color: k.indigo,
    icon: Code,
    tasks: [
      { name: "Button \u2014 all variants & sizes", subtasks: "5/5", priority: "urgent", assigneeIdx: 2, logged: "8h 20m", estimate: "8h", tags: [{ label: "Done", color: k.green, bg: k.greenSoft }] },
      { name: "Input, Select, Checkbox, Radio", subtasks: "7/12", priority: "urgent", assigneeIdx: 2, date: "Mar 3", comments: 7, logged: "14h 20m", estimate: "20h", tracking: true, tags: [{ label: "In Progress", color: k.indigo, bg: k.indigoSoft }] },
      { name: "Modal & Dialog system", subtasks: "2/6", priority: "high", assigneeIdx: 1, date: "Mar 10", comments: 2, logged: "3h 50m", estimate: "12h" },
      { name: "Toast & notification patterns", subtasks: "0/4", priority: "high", assigneeIdx: 1, date: "Mar 12", estimate: "6h" },
      { name: "Data table with sorting & filters", subtasks: "0/9", priority: "medium", date: "Mar 18", estimate: "16h" },
      { name: "Navigation \u2014 sidebar, tabs, breadcrumb", subtasks: "1/6", priority: "medium", assigneeIdx: 2, date: "Mar 14", logged: "2h 10m", estimate: "10h", tags: [{ label: "In Progress", color: k.indigo, bg: k.indigoSoft }] },
      { name: "Avatar, Badge, Tag, Tooltip", subtasks: "3/8", priority: "low", assigneeIdx: 2, date: "Mar 20", logged: "1h 30m", estimate: "8h" },
    ],
  },
  {
    label: "TESTING & DOCS",
    color: k.teal,
    icon: TestTube,
    tasks: [
      { name: "Accessibility audit \u2014 WCAG 2.2 AA", subtasks: "0/14", priority: "high", assigneeIdx: 4, date: "Mar 22", logged: "1h 20m", estimate: "14h" },
      { name: "Visual regression test suite", subtasks: "0/8", priority: "medium", assigneeIdx: 1, date: "Mar 25", estimate: "10h" },
      { name: "Storybook stories \u2014 all components", subtasks: "4/24", priority: "medium", assigneeIdx: 2, date: "Mar 28", logged: "5h 40m", estimate: "24h", tags: [{ label: "In Progress", color: k.indigo, bg: k.indigoSoft }] },
      { name: "Migration guide for consumers", subtasks: "0/5", priority: "low", assigneeIdx: 4, date: "Apr 1", estimate: "4h" },
      { name: "Contribution guidelines", subtasks: "0/3", priority: "low", date: "Apr 5", estimate: "3h" },
    ],
  },
  {
    label: "RELEASE",
    color: k.gold,
    icon: Rocket,
    tasks: [
      { name: "Package build & publish pipeline", subtasks: "0/4", priority: "high", assigneeIdx: 1, date: "Apr 8", estimate: "8h" },
      { name: "Changelog & versioning setup", subtasks: "0/2", priority: "medium", date: "Apr 10", estimate: "2h" },
      { name: "Launch announcement & demo", subtasks: "0/3", priority: "medium", assigneeIdx: 4, date: "Apr 18", estimate: "6h", tags: [{ label: "Milestone", color: k.gold, bg: k.goldSoft }] },
    ],
  },
];

const priorityConfig = {
  urgent: { icon: Fire, color: k.coral, bg: k.coralSoft },
  high: { icon: ArrowUp, color: k.orange, bg: k.orangeSoft },
  medium: { icon: Minus, color: k.fg4, bg: k.muted },
  low: { icon: Lightning, color: k.fg5, bg: k.borderSoft },
};

const viewTabs = [
  { label: "Overview", icon: Browsers },
  { label: "List", icon: ListBullets },
  { label: "Board", icon: Kanban },
  { label: "Timeline", icon: CalendarDots },
  { label: "Messages", icon: ChatCircle },
];

/* ── Subtask detail data (per-task mock) ── */
interface SubtaskDetail {
  name: string;
  done: boolean;
  priority: "urgent" | "high" | "medium" | "low";
  assigneeIdx?: number;
  date?: string;
  logged?: string;
  estimate?: string;
}

interface CommentData {
  authorIdx: number;
  text: string;
  time: string;
  reactions?: { emoji: string; count: number }[];
  reply?: { authorIdx: number; text: string; time: string };
}

const taskSubtasks: Record<string, SubtaskDetail[]> = {
  "Color token scale \u2014 dark mode": [
    { name: "Define neutral scale (gray-50 \u2192 gray-950)", done: true, priority: "high", assigneeIdx: 0, logged: "45m", estimate: "1h" },
    { name: "Define primary accent hues", done: true, priority: "high", assigneeIdx: 0, logged: "30m", estimate: "30m" },
    { name: "Define semantic colors (success, warning, error)", done: true, priority: "medium", assigneeIdx: 0, date: "Feb 28", logged: "40m", estimate: "45m" },
    { name: "Map surface & background tokens", done: true, priority: "medium", assigneeIdx: 3, logged: "25m", estimate: "30m" },
    { name: "Map border & divider tokens", done: true, priority: "medium", assigneeIdx: 3, logged: "20m", estimate: "20m" },
    { name: "Map text foreground tokens", done: true, priority: "high", assigneeIdx: 0, logged: "35m", estimate: "30m" },
    { name: "Elevation & overlay tokens", done: true, priority: "low", assigneeIdx: 3, logged: "15m", estimate: "20m" },
    { name: "Focus ring & selection colors", done: true, priority: "medium", assigneeIdx: 0, logged: "25m", estimate: "30m" },
    { name: "Contrast ratio audit (WCAG AA)", done: false, priority: "high", assigneeIdx: 4, date: "Mar 1", estimate: "1h 30m" },
    { name: "Dark mode toggle transition tokens", done: false, priority: "low", assigneeIdx: 3, date: "Mar 1", estimate: "45m" },
    { name: "Document color usage guidelines", done: false, priority: "low", date: "Mar 2", estimate: "1h" },
    { name: "Create Figma color style library", done: false, priority: "medium", assigneeIdx: 0, date: "Mar 2", estimate: "1h" },
  ],
  "Input, Select, Checkbox, Radio": [
    { name: "Input \u2014 default, focus, error, disabled states", done: true, priority: "urgent", assigneeIdx: 2, logged: "2h 30m", estimate: "3h" },
    { name: "Input \u2014 sizes (sm, md, lg)", done: true, priority: "high", assigneeIdx: 2, logged: "1h 45m", estimate: "2h" },
    { name: "Input \u2014 with prefix/suffix icons", done: true, priority: "medium", assigneeIdx: 2, logged: "1h 20m", estimate: "1h 30m" },
    { name: "Select \u2014 single select with dropdown", done: true, priority: "urgent", assigneeIdx: 2, logged: "3h", estimate: "3h" },
    { name: "Select \u2014 multi-select with tags", done: true, priority: "high", assigneeIdx: 2, date: "Mar 2", logged: "2h 45m", estimate: "3h" },
    { name: "Checkbox \u2014 all states + indeterminate", done: true, priority: "high", assigneeIdx: 2, logged: "1h 10m", estimate: "1h" },
    { name: "Radio \u2014 group + individual states", done: true, priority: "high", assigneeIdx: 2, logged: "1h 50m", estimate: "2h" },
    { name: "Switch / Toggle component", done: false, priority: "urgent", assigneeIdx: 2, date: "Mar 3", estimate: "2h" },
    { name: "Textarea \u2014 auto-resize variant", done: false, priority: "medium", assigneeIdx: 2, date: "Mar 3", estimate: "1h 30m" },
    { name: "Form field wrapper + validation", done: false, priority: "high", assigneeIdx: 1, date: "Mar 4", estimate: "2h" },
    { name: "Date picker integration", done: false, priority: "medium", date: "Mar 5", estimate: "3h" },
    { name: "Accessibility audit for all form fields", done: false, priority: "high", assigneeIdx: 4, date: "Mar 5", estimate: "2h" },
  ],
};

const taskComments: Record<string, CommentData[]> = {
  "Color token scale \u2014 dark mode": [
    {
      authorIdx: 0, time: "2 hours ago",
      text: "I\u2019ve mapped all the neutral scales. The dark mode grays use a blue-shifted base hue at OKLCH h=260 for consistency with the light theme.",
      reactions: [{ emoji: "\ud83d\udc4d", count: 2 }],
      reply: { authorIdx: 3, text: "Nice \u2014 the blue shift looks much more natural than pure gray. Can we also add a `gray-925` step for the deepest surfaces?", time: "1 hour ago" },
    },
    {
      authorIdx: 4, time: "45 min ago",
      text: "Heads up \u2014 the contrast ratio on `text-secondary` against `surface-elevated` is only 3.8:1 right now. We need at least 4.5:1 for AA compliance. @Nina can you bump the lightness?",
    },
    {
      authorIdx: 3, time: "20 min ago",
      text: "I\u2019ve started on the elevation tokens. Using OKLCH alpha channels for the overlay layers \u2014 much cleaner than the hex approach.",
      reactions: [{ emoji: "\ud83d\udd25", count: 1 }, { emoji: "\ud83d\udc40", count: 1 }],
    },
  ],
  "Input, Select, Checkbox, Radio": [
    {
      authorIdx: 2, time: "3 hours ago",
      text: "All basic input states are done. The focus ring uses `oklch(0.55 0.2 280 / 0.25)` with a 2px offset \u2014 matches our brand indigo.",
      reactions: [{ emoji: "\u2705", count: 3 }],
      reply: { authorIdx: 1, text: "The focus styles look solid. Make sure we also handle the `:focus-visible` vs `:focus` distinction for keyboard-only users.", time: "2 hours ago" },
    },
    {
      authorIdx: 1, time: "1 hour ago",
      text: "The multi-select tag overflow is clipping on mobile. We might need a \u201c+3 more\u201d pill when tags exceed the input width. @Mei can you take a look?",
      reactions: [{ emoji: "\ud83d\udc4d", count: 1 }],
    },
    {
      authorIdx: 4, time: "30 min ago",
      text: "I ran an initial accessibility pass on Checkbox and Radio \u2014 screen reader announcements are working correctly. Will do a full audit after Switch is implemented.",
    },
  ],
};

/* Fallback subtasks for tasks without specific detail data */
function generateFallbackSubtasks(task: Task): SubtaskDetail[] {
  if (!task.subtasks) return [];
  const match = task.subtasks.match(/(\d+)\/(\d+)/);
  if (!match) return [];
  const [, doneStr, totalStr] = match;
  const doneCount = parseInt(doneStr);
  const total = parseInt(totalStr);
  const names = [
    "Define requirements", "Create initial draft", "Design mockups", "Implement core logic",
    "Write unit tests", "Code review", "Update documentation", "QA validation",
    "Accessibility check", "Performance audit", "Stakeholder review", "Final polish",
    "Integration testing", "Deploy to staging",
  ];
  return Array.from({ length: total }, (_, i) => ({
    name: names[i % names.length],
    done: i < doneCount,
    priority: (["medium", "high", "medium", "low"] as const)[i % 4],
    assigneeIdx: task.assigneeIdx,
    ...(i >= doneCount && i < doneCount + 2 ? { date: task.date } : {}),
  }));
}

/* Helper to parse time strings like "4h 15m" to minutes */
function parseTimeToMin(t: string): number {
  let m = 0;
  const hrs = t.match(/(\d+)h/);
  const mins = t.match(/(\d+)m/);
  if (hrs) m += parseInt(hrs[1]) * 60;
  if (mins) m += parseInt(mins[1]);
  return m || 1;
}

/* ── Task Detail Pane ── */
function TaskDetailPane({
  task,
  group,
  done,
  onToggle,
  onClose,
}: {
  task: Task;
  group: TaskGroup;
  done: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const [timerRunning, setTimerRunning] = useState(!!task.tracking);
  const [completedSubs, setCompletedSubs] = useState<Set<number>>(() => {
    const subs = taskSubtasks[task.name] || generateFallbackSubtasks(task);
    return new Set(subs.map((s, i) => (s.done ? i : -1)).filter((i) => i >= 0));
  });

  const pri = priorityConfig[task.priority];
  const subtasks = taskSubtasks[task.name] || generateFallbackSubtasks(task);
  const comments = taskComments[task.name] || [];

  const toggleSub = (idx: number) => {
    setCompletedSubs((p) => {
      const n = new Set(p);
      n.has(idx) ? n.delete(idx) : n.add(idx);
      return n;
    });
  };

  const subsDone = completedSubs.size;
  const subsPct = subtasks.length ? Math.round((subsDone / subtasks.length) * 100) : 0;

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 w-[380px] overflow-y-auto"
      style={{ background: k.card, borderLeft: `1px solid ${k.border}` }}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${k.borderSoft}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <group.icon size={13} weight="bold" style={{ color: group.color }} />
            <span style={{ fontSize: "11px", fontWeight: 600, color: group.color, letterSpacing: "0.03em" }}>{group.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded hover:bg-black/[0.04] transition-colors">
              <DotsThree size={16} style={{ color: k.fg4 }} />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-black/[0.04] transition-colors">
              <X size={14} style={{ color: k.fg4 }} />
            </button>
          </div>
        </div>

        {/* Task title */}
        <div className="flex items-start gap-2.5">
          <button onClick={onToggle} className="shrink-0 mt-0.5 flex items-center justify-center w-5 h-5">
            {done ? (
              <CheckCircle weight="fill" size={20} style={{ color: k.green }} />
            ) : (
              <Circle size={20} style={{ color: "oklch(0.85 0.01 260)" }} />
            )}
          </button>
          <h2
            className={done ? "line-through" : ""}
            style={{ fontSize: "16px", fontWeight: 600, color: done ? k.fg5 : k.fg, lineHeight: 1.35 }}
          >
            {task.name}
          </h2>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 ml-[30px]" style={{ fontSize: "12px" }}>
          {task.assigneeIdx !== undefined && (
            <div className="flex items-center gap-1.5 px-2 py-[3px] rounded-md" style={{ background: k.muted }}>
              <ImageWithFallback src={avatars[task.assigneeIdx].src} alt={avatars[task.assigneeIdx].name} className="w-4 h-4 rounded-full object-cover" />
              <span style={{ color: k.fg2, fontWeight: 500 }}>{avatars[task.assigneeIdx].name.split(" ")[0]}</span>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 py-[3px] rounded-md" style={{ background: pri.bg }}>
            <pri.icon size={11} weight="bold" style={{ color: pri.color }} />
            <span style={{ color: pri.color, fontWeight: 500, textTransform: "capitalize" }}>{task.priority}</span>
          </div>
          {task.date && (
            <div className="flex items-center gap-1 px-2 py-[3px] rounded-md" style={{ background: k.muted }}>
              <CalendarBlank size={12} style={{ color: k.fg4 }} />
              <span style={{ color: k.fg3 }}>{task.date}</span>
            </div>
          )}
          {task.tags?.map((tag) => (
            <span key={tag.label} className="px-2 py-[3px] rounded-full" style={{ fontSize: "11px", fontWeight: 600, color: tag.color, background: tag.bg }}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* Time Tracking */}
      <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${k.borderSoft}` }}>
        <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>TIME TRACKING</span>
        <div className="mt-2 rounded-lg px-3.5 py-3" style={{ background: k.bg, border: `1px solid ${k.borderSoft}` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {timerRunning && <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: k.coral }} />}
                <span style={{ fontSize: "18px", fontWeight: 700, color: timerRunning ? k.coral : k.fg, fontVariantNumeric: "tabular-nums" }}>
                  {task.logged || "0h 0m"}
                </span>
              </div>
              {task.estimate && (
                <span style={{ fontSize: "11px", color: k.fg5, marginTop: 2, display: "block" }}>of {task.estimate} estimated</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {timerRunning ? (
                <>
                  <button onClick={() => setTimerRunning(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/[0.04]" style={{ background: k.muted }}>
                    <Pause size={14} weight="fill" style={{ color: k.fg3 }} />
                  </button>
                  <button onClick={() => setTimerRunning(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.coralSoft }}>
                    <Stop size={14} weight="fill" style={{ color: k.coral }} />
                  </button>
                </>
              ) : (
                <button onClick={() => setTimerRunning(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:opacity-90" style={{ background: k.coral, color: "white", fontSize: "12px", fontWeight: 600 }}>
                  <Play size={12} weight="fill" /> Start
                </button>
              )}
            </div>
          </div>
          {task.estimate && (
            <div className="mt-2.5 h-[3px] rounded-full overflow-hidden" style={{ background: k.border }}>
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min(100, (parseTimeToMin(task.logged || "0h") / parseTimeToMin(task.estimate)) * 100)}%`,
                background: timerRunning ? k.coral : k.indigo,
              }} />
            </div>
          )}
        </div>
      </div>

      {/* Subtasks */}
      <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${k.borderSoft}` }}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>SUBTASKS</span>
            <span className="px-1.5 py-[1px] rounded" style={{ background: k.muted, fontSize: "10px", fontWeight: 600, color: k.fg4 }}>
              {subsDone}/{subtasks.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-[3px] rounded-full overflow-hidden" style={{ background: k.border }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${subsPct}%`, background: group.color }} />
            </div>
            <button className="p-0.5 rounded hover:bg-black/[0.04] transition-colors"><Plus size={12} style={{ color: k.fg5 }} /></button>
          </div>
        </div>

        <div>
          {subtasks.map((sub, idx) => {
            const isDone = completedSubs.has(idx);
            const sp = priorityConfig[sub.priority];
            return (
              <div
                key={idx}
                className="group/sub flex items-center gap-2 py-[7px] hover:bg-black/[0.01] transition-colors rounded-md px-1 -mx-1"
                style={{ borderBottom: idx < subtasks.length - 1 ? `1px solid ${k.borderSoft}` : "none" }}
              >
                <button onClick={() => toggleSub(idx)} className="shrink-0 flex items-center justify-center w-[18px] h-[18px]">
                  {isDone ? <CheckCircle weight="fill" size={16} style={{ color: k.green }} /> : <Circle size={16} style={{ color: "oklch(0.85 0.01 260)" }} />}
                </button>
                <div className="w-[16px] h-[16px] rounded flex items-center justify-center shrink-0" style={{ background: sp.bg }}>
                  <sp.icon size={9} weight="bold" style={{ color: sp.color }} />
                </div>
                <span className={`flex-1 min-w-0 truncate ${isDone ? "line-through" : ""}`} style={{ fontSize: "12px", color: isDone ? k.fg5 : k.fg }}>
                  {sub.name}
                </span>
                {sub.logged && (
                  <span className="shrink-0 hidden group-hover/sub:flex items-center gap-0.5" style={{ fontSize: "10px", color: k.fg5 }}>
                    <Timer size={10} /> {sub.logged}
                  </span>
                )}
                {sub.date && <span className="shrink-0" style={{ fontSize: "10px", color: k.fg5 }}>{sub.date}</span>}
                {sub.assigneeIdx !== undefined ? (
                  <ImageWithFallback src={avatars[sub.assigneeIdx].src} alt={avatars[sub.assigneeIdx].name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 opacity-0 group-hover/sub:opacity-100" style={{ border: "1.5px dashed oklch(0.88 0.01 260)" }}>
                    <Plus size={8} style={{ color: k.fg5 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button className="flex items-center gap-1.5 mt-1.5 py-1.5 w-full hover:bg-black/[0.015] transition-colors rounded" style={{ color: k.fg5, fontSize: "11px" }}>
          <Plus size={11} /> Add subtask
        </button>
      </div>

      {/* Comments */}
      <div className="px-5 py-3.5 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>COMMENTS</span>
          {comments.length > 0 && (
            <span className="px-1.5 py-[1px] rounded" style={{ background: k.muted, fontSize: "10px", fontWeight: 600, color: k.fg4 }}>{comments.length}</span>
          )}
        </div>

        {comments.length === 0 && (
          <div className="py-6 text-center">
            <ChatCircle size={24} style={{ color: k.fg5 }} className="mx-auto mb-2" />
            <p style={{ color: k.fg5, fontSize: "12px" }}>No comments yet</p>
          </div>
        )}

        <div>
          {comments.map((comment, cidx) => {
            const author = avatars[comment.authorIdx];
            return (
              <div key={cidx} className="py-3" style={{ borderBottom: cidx < comments.length - 1 ? `1px solid ${k.borderSoft}` : "none" }}>
                <div className="flex gap-2.5">
                  <ImageWithFallback src={author.src} alt={author.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span style={{ color: k.fg, fontSize: "12px", fontWeight: 600 }}>{author.name}</span>
                      <span style={{ color: k.fg5, fontSize: "10px" }}>{comment.time}</span>
                    </div>
                    <p className="mt-1" style={{ color: k.fg2, fontSize: "12px", lineHeight: 1.55 }}>
                      {comment.text.split(/(@\w+)/g).map((part, pi) =>
                        part.startsWith("@") ? (
                          <span key={pi} style={{ color: k.indigo, fontWeight: 500 }}>{part}</span>
                        ) : (
                          <span key={pi}>{part}</span>
                        )
                      )}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {comment.reactions?.map((r, ri) => (
                        <span key={ri} className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full" style={{ background: k.coralSoft, fontSize: "11px" }}>
                          <span>{r.emoji}</span> <span style={{ color: k.fg3 }}>{r.count}</span>
                        </span>
                      ))}
                      <button className="flex items-center gap-0.5 px-1.5 py-[2px] rounded-full hover:bg-black/[0.03]" style={{ color: k.fg5, fontSize: "10px" }}>
                        <Smiley size={11} />
                      </button>
                      <button className="flex items-center gap-0.5 px-1.5 py-[2px] rounded-full hover:bg-black/[0.03]" style={{ color: k.fg5, fontSize: "10px" }}>
                        <ChatCircle size={11} /> Reply
                      </button>
                    </div>
                    {comment.reply && (
                      <div className="mt-2.5 ml-0.5 pl-3 border-l-2" style={{ borderColor: k.border }}>
                        <div className="flex gap-2.5">
                          <ImageWithFallback src={avatars[comment.reply.authorIdx].src} alt={avatars[comment.reply.authorIdx].name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span style={{ color: k.fg, fontSize: "11px", fontWeight: 600 }}>{avatars[comment.reply.authorIdx].name}</span>
                              <span style={{ color: k.fg5, fontSize: "10px" }}>{comment.reply.time}</span>
                            </div>
                            <p className="mt-0.5" style={{ color: k.fg2, fontSize: "11px", lineHeight: 1.5 }}>{comment.reply.text}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comment input */}
        <div className="mt-2 rounded-lg border overflow-hidden" style={{ borderColor: k.border }}>
          <div className="flex items-start gap-2.5 px-3 py-2.5">
            <ImageWithFallback src={avatars[0].src} alt={avatars[0].name} className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5" />
            <input placeholder="Write a comment..." className="flex-1 bg-transparent outline-none" style={{ fontSize: "12px", color: k.fg }} />
          </div>
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: k.bg, borderTop: `1px solid ${k.borderSoft}` }}>
            <div className="flex items-center gap-0.5">
              <button className="p-1 rounded hover:bg-black/[0.04]"><TextB size={13} style={{ color: k.fg5 }} /></button>
              <button className="p-1 rounded hover:bg-black/[0.04]"><TextItalic size={13} style={{ color: k.fg5 }} /></button>
              <button className="p-1 rounded hover:bg-black/[0.04]"><ListNumbers size={13} style={{ color: k.fg5 }} /></button>
              <button className="p-1 rounded hover:bg-black/[0.04]"><At size={13} style={{ color: k.fg5 }} /></button>
              <button className="p-1 rounded hover:bg-black/[0.04]"><Smiley size={13} style={{ color: k.fg5 }} /></button>
            </div>
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-md" style={{ background: k.coral, color: "white", fontSize: "11px", fontWeight: 600 }}>
              <PaperPlaneTilt size={11} weight="fill" /> Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ════════════════════════════════════════════════════ */
export function OriginalProject() {
  const [activeTab, setActiveTab] = useState("List");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(
    new Set([
      "Color token scale \u2014 light mode",
      "Typography scale & line-height",
      "Spacing & sizing primitives",
      "Button \u2014 all variants & sizes",
    ])
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(taskGroups.map((g) => g.label))
  );
  const [detailOpen, setDetailOpen] = useState(true);
  const [selectedTask, setSelectedTask] = useState<{ task: Task; group: TaskGroup } | null>(null);

  const toggle = (name: string) =>
    setCompletedTasks((p) => {
      const n = new Set(p);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const toggleGroup = (label: string) =>
    setExpandedGroups((p) => {
      const n = new Set(p);
      n.has(label) ? n.delete(label) : n.add(label);
      return n;
    });

  const totalTasks = taskGroups.reduce((a, g) => a + g.tasks.length, 0);
  const doneCount = completedTasks.size;
  const pct = Math.round((doneCount / totalTasks) * 100);

  const sectionProgress = (tasks: Task[]) => {
    const d = tasks.filter((t) => completedTasks.has(t.name)).length;
    return { done: d, total: tasks.length, pct: tasks.length ? Math.round((d / tasks.length) * 100) : 0 };
  };

  return (
    <div className="-mx-6 md:-mx-10 -my-8 md:-my-12 flex flex-col h-screen" style={{ background: k.bg }}>

      {/* ═══════ HEADER ═══════ */}
      <div className="shrink-0" style={{ borderBottom: `1px solid ${k.border}` }}>

        {/* Title row */}
        <div className="px-6 lg:px-8 pt-4 pb-2.5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${k.coral}, oklch(0.6 0.22 35))` }}
              >
                <Compass size={18} weight="fill" style={{ color: "white" }} />
              </div>
              <h1 className="truncate" style={{ fontSize: "20px", fontWeight: 700, color: k.fg, lineHeight: 1.25 }}>
                Atlas Design System
              </h1>
              <button className="shrink-0 p-0.5 rounded hover:bg-black/[0.04] transition-colors">
                <Star size={15} style={{ color: k.fg5 }} />
              </button>
              <div className="flex items-center gap-1.5 px-2 py-[3px] rounded-full shrink-0" style={{ background: k.greenSoft }}>
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: k.green }} />
                <span style={{ fontSize: "11px", fontWeight: 600, color: k.green }}>On track</span>
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center -space-x-1.5">
                {avatars.slice(0, 4).map((a, i) => (
                  <ImageWithFallback key={a.name} src={a.src} alt={a.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-white" style={{ zIndex: 4 - i }} />
                ))}
                <div className="w-6 h-6 rounded-full flex items-center justify-center ring-2 ring-white" style={{ background: k.muted, fontSize: "9px", fontWeight: 600, color: k.fg4, zIndex: 0 }}>+1</div>
              </div>
              <button className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-lg hover:bg-black/[0.03] transition-colors" style={{ border: `1px solid ${k.border}`, fontSize: "12px", color: k.fg3, fontWeight: 500 }}>
                <ShareNetwork size={13} weight="bold" /> Share
              </button>
              <button className="p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors">
                <Gear size={16} style={{ color: k.fg4 }} />
              </button>
              <button
                onClick={() => setDetailOpen((p) => !p)}
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: detailOpen ? k.coralSoft : "transparent" }}
                title={detailOpen ? "Hide details" : "Show details"}
              >
                <SidebarSimple size={16} weight={detailOpen ? "fill" : "regular"} style={{ color: detailOpen ? k.coral : k.fg4, transform: "scaleX(-1)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar + metadata */}
        <div className="px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div className="flex gap-0 -mb-px">
              {viewTabs.map((tab) => {
                const isActive = activeTab === tab.label;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className="flex items-center gap-1.5 px-3.5 py-2 transition-colors relative"
                    style={{
                      fontSize: "13px",
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? k.coral : k.fg4,
                    }}
                  >
                    <tab.icon size={15} weight={isActive ? "bold" : "regular"} />
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full" style={{ background: k.coral }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Inline metadata chips */}
            <div className="hidden md:flex items-center gap-2.5 pb-2" style={{ fontSize: "12px" }}>
              <div className="flex items-center gap-1.5">
                <ImageWithFallback src={avatars[0].src} alt={avatars[0].name} className="w-[15px] h-[15px] rounded-full object-cover" />
                <span style={{ color: k.fg3 }}>{avatars[0].name}</span>
              </div>
              <span style={{ color: k.border }}>|</span>
              <div className="flex items-center gap-1">
                <div className="w-[5px] h-[5px] rounded-full" style={{ background: k.orange }} />
                <span style={{ color: k.fg4 }}>High</span>
              </div>
              <span style={{ color: k.border }}>|</span>
              <div className="flex items-center gap-1.5">
                <div className="w-12 h-[4px] rounded-full overflow-hidden" style={{ background: k.border }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: k.coral }} />
                </div>
                <span style={{ fontWeight: 600, color: k.fg3 }}>{pct}%</span>
              </div>
              <span style={{ color: k.border }}>|</span>
              <span style={{ color: k.fg4 }}>Due Apr 18</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ BODY ═══════ */}
      <div className="flex flex-1 min-h-0">

        {/* ── MAIN: Task list ── */}
        <main className="flex-1 min-w-0 overflow-y-auto">

          {/* Tasks toolbar */}
          <div
            className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 lg:px-8 py-2.5"
            style={{ background: k.bg, borderBottom: `1px solid ${k.borderSoft}` }}
          >
            <div className="flex items-center gap-2.5">
              <span style={{ fontSize: "11px", fontWeight: 700, color: k.fg3, letterSpacing: "0.06em" }}>TASKS</span>
              <span
                className="px-1.5 py-[2px] rounded"
                style={{ background: k.muted, fontSize: "11px", fontWeight: 600, color: k.fg4 }}
              >
                {totalTasks}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/[0.03] transition-colors" style={{ color: k.fg4, fontSize: "12px" }}>
                <SortAscending size={13} /> Sort
              </button>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/[0.03] transition-colors" style={{ color: k.fg4, fontSize: "12px" }}>
                <Funnel size={13} /> Filter
              </button>
              <div className="h-4 w-px mx-0.5" style={{ background: k.border }} />
              <span style={{ color: k.fg4, fontSize: "12px" }}>{doneCount}/{totalTasks} done</span>
            </div>
          </div>

          <div className="px-6 lg:px-8">
            {/* Column headers */}
            <div className="flex items-center gap-2.5 py-2" style={{ borderBottom: `1px solid ${k.border}` }}>
              <div className="w-5" />
              <div className="w-5" />
              <div className="w-5" />
              <span className="flex-1" style={{ fontSize: "11px", fontWeight: 600, color: k.fg5 }}>Task name</span>
              <span className="w-14 text-center hidden sm:block" style={{ fontSize: "11px", fontWeight: 600, color: k.fg5 }}>Subtasks</span>
              <span className="w-[72px] text-center hidden lg:block" style={{ fontSize: "11px", fontWeight: 600, color: k.fg5 }}>Time</span>
              <span className="w-20 text-center hidden md:block" style={{ fontSize: "11px", fontWeight: 600, color: k.fg5 }}>Due</span>
              <span className="w-7 hidden md:block" />
              <span className="w-7" />
            </div>

            {/* Task groups */}
            <div>
              {taskGroups.map((group) => {
                const isOpen = expandedGroups.has(group.label);
                const prog = sectionProgress(group.tasks);
                return (
                  <div key={group.label}>
                    <button
                      onClick={() => toggleGroup(group.label)}
                      className="flex items-center gap-2 w-full py-2.5"
                      style={{ borderBottom: `1px solid ${k.borderSoft}` }}
                    >
                      <CaretDown
                        size={12}
                        weight="bold"
                        style={{
                          color: k.fg5,
                          transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform 150ms",
                        }}
                      />
                      <group.icon size={14} weight="bold" style={{ color: group.color }} />
                      <span style={{ fontSize: "11px", fontWeight: 700, color: group.color, letterSpacing: "0.04em" }}>
                        {group.label}
                      </span>
                      <span style={{ fontSize: "11px", color: k.fg5, fontWeight: 500 }}>
                        {prog.done}/{prog.total}
                      </span>
                      <div className="w-14 h-[3px] rounded-full overflow-hidden" style={{ background: k.border }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${prog.pct}%`, background: group.color }} />
                      </div>
                    </button>

                    {isOpen && group.tasks.map((task) => {
                      const done = completedTasks.has(task.name);
                      const pri = priorityConfig[task.priority];
                      return (
                        <div
                          key={task.name}
                          className="group flex items-center gap-2.5 py-[9px] hover:bg-black/[0.012] transition-colors cursor-pointer"
                          style={{
                            borderBottom: `1px solid ${k.borderSoft}`,
                            background: selectedTask?.task.name === task.name ? k.coralSoft : undefined,
                          }}
                          onClick={() => setSelectedTask({ task, group })}
                        >
                          <div className="w-5" />
                          <button onClick={(e) => { e.stopPropagation(); toggle(task.name); }} className="shrink-0 flex items-center justify-center w-5 h-5">
                            {done ? (
                              <CheckCircle weight="fill" size={18} style={{ color: k.green }} />
                            ) : (
                              <Circle size={18} style={{ color: "oklch(0.85 0.01 260)" }} />
                            )}
                          </button>
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                            style={{ background: pri.bg }}
                            title={task.priority}
                          >
                            <pri.icon size={11} weight="bold" style={{ color: pri.color }} />
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`truncate ${done ? "line-through" : ""}`}
                              style={{ fontSize: "13px", color: done ? k.fg5 : k.fg, fontWeight: 400 }}
                            >
                              {task.name}
                            </span>
                            {task.tags?.map((tag) => (
                              <span
                                key={tag.label}
                                className="shrink-0 px-1.5 py-[2px] rounded-full"
                                style={{ fontSize: "10px", fontWeight: 600, color: tag.color, background: tag.bg }}
                              >
                                {tag.label}
                              </span>
                            ))}
                            {task.comments ? (
                              <span className="shrink-0 flex items-center gap-0.5" style={{ color: k.fg5, fontSize: "11px" }}>
                                <ChatText size={12} /> {task.comments}
                              </span>
                            ) : null}
                          </div>
                          <span className="w-14 text-center hidden sm:block" style={{ fontSize: "12px", color: k.fg5 }}>
                            {task.subtasks || "\u2014"}
                          </span>
                          {/* Time tracking */}
                          <span className="w-[72px] hidden lg:flex items-center justify-center gap-1 shrink-0">
                            {task.tracking ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-full" style={{ background: k.coralSoft, fontSize: "10px", fontWeight: 600, color: k.coral }}>
                                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: k.coral }} />
                                {task.logged}
                              </span>
                            ) : task.logged ? (
                              <span className="inline-flex items-center gap-0.5" style={{ fontSize: "11px", color: k.fg4, fontVariantNumeric: "tabular-nums" }}>
                                <Timer size={11} style={{ color: k.fg5 }} />
                                {task.logged}
                              </span>
                            ) : task.estimate ? (
                              <span style={{ fontSize: "11px", color: k.fg5, fontVariantNumeric: "tabular-nums" }}>
                                {task.estimate}
                              </span>
                            ) : (
                              <span style={{ color: k.fg5, fontSize: "11px" }}>{"\u2014"}</span>
                            )}
                          </span>
                          <span className="w-20 text-center hidden md:flex items-center justify-center gap-1" style={{ fontSize: "12px", color: k.fg4 }}>
                            {task.date ? (
                              <><CalendarBlank size={12} style={{ color: k.fg5 }} />{task.date}</>
                            ) : (
                              <span style={{ color: k.fg5 }}>{"\u2014"}</span>
                            )}
                          </span>
                          <button className="w-7 justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
                            <Eye size={14} style={{ color: k.fg5 }} />
                          </button>
                          {task.assigneeIdx !== undefined ? (
                            <ImageWithFallback
                              src={avatars[task.assigneeIdx].src}
                              alt={avatars[task.assigneeIdx].name}
                              className="w-6 h-6 rounded-full object-cover shrink-0 ring-2 ring-white"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ border: "1.5px dashed oklch(0.88 0.01 260)" }}>
                              <Plus size={10} style={{ color: k.fg5 }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              <button
                className="flex items-center gap-2 mt-1 py-2.5 w-full hover:bg-black/[0.015] transition-colors rounded"
                style={{ color: k.fg5, fontSize: "12px" }}
              >
                <div className="w-5" />
                <Plus size={13} />
                Add task
              </button>
            </div>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        {detailOpen && selectedTask && (
          <TaskDetailPane
            key={selectedTask.task.name}
            task={selectedTask.task}
            group={selectedTask.group}
            done={completedTasks.has(selectedTask.task.name)}
            onToggle={() => toggle(selectedTask.task.name)}
            onClose={() => setSelectedTask(null)}
          />
        )}
        {detailOpen && !selectedTask && (
          <aside
            className="hidden lg:flex flex-col shrink-0 w-[272px] overflow-y-auto"
            style={{ background: k.sidebar, borderLeft: `1px solid ${k.border}` }}
          >
            {/* Status + progress header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>PROJECT DETAILS</span>
                <button
                  onClick={() => setDetailOpen(false)}
                  className="p-0.5 rounded hover:bg-black/[0.04] transition-colors"
                  title="Close panel"
                >
                  <CaretRight size={12} style={{ color: k.fg5 }} />
                </button>
              </div>

              {/* Progress ring-style bar */}
              <div className="rounded-xl px-3.5 py-3" style={{ background: k.card, border: `1px solid ${k.borderSoft}` }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative w-10 h-10 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" stroke={k.border} />
                      <circle
                        cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                        stroke={k.coral}
                        strokeLinecap="round"
                        strokeDasharray={`${pct * 0.942} 100`}
                        className="transition-all duration-700"
                      />
                    </svg>
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ fontSize: "10px", fontWeight: 700, color: k.fg2 }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: k.fg }}>
                      {doneCount} of {totalTasks}
                    </p>
                    <p style={{ fontSize: "11px", color: k.fg4 }}>tasks completed</p>
                  </div>
                </div>
                <div className="flex gap-1.5" style={{ fontSize: "10px" }}>
                  {taskGroups.map((g) => {
                    const p = sectionProgress(g.tasks);
                    return (
                      <div key={g.label} className="flex-1">
                        <div className="h-[3px] rounded-full overflow-hidden mb-1" style={{ background: k.border }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%`, background: g.color }} />
                        </div>
                        <span style={{ color: k.fg5 }}>{p.done}/{p.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mx-4 h-px" style={{ background: k.border }} />

            {/* Time tracking summary */}
            <div className="px-4 py-3">
              <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>TIME TRACKED</span>
              <div className="mt-2 flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Timer size={13} weight="bold" style={{ color: k.coral }} />
                  <span style={{ fontSize: "16px", fontWeight: 700, color: k.fg }}>53h 30m</span>
                </div>
                <span style={{ fontSize: "11px", color: k.fg5 }}>/ 161h est.</span>
              </div>
              <div className="mt-2 h-[4px] rounded-full overflow-hidden" style={{ background: k.border }}>
                <div className="h-full rounded-full" style={{ width: "33%", background: k.coral }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span style={{ fontSize: "10px", color: k.fg5 }}>33% of estimate</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded-full" style={{ background: k.greenSoft, fontSize: "10px", fontWeight: 600, color: k.green }}>
                  On pace
                </span>
              </div>
            </div>

            <div className="mx-4 h-px" style={{ background: k.border }} />

            {/* Metadata */}
            <div className="px-4 py-3 flex flex-col gap-2.5" style={{ fontSize: "12px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>DETAILS</span>
              {([
                { label: "Owner", node: (
                  <div className="flex items-center gap-1.5">
                    <ImageWithFallback src={avatars[0].src} alt={avatars[0].name} className="w-[16px] h-[16px] rounded-full object-cover" />
                    <span style={{ color: k.fg, fontWeight: 500 }}>{avatars[0].name}</span>
                  </div>
                )},
                { label: "Team", node: <span style={{ color: k.fg }}>Design Systems</span> },
                { label: "Priority", node: (
                  <div className="flex items-center gap-1.5">
                    <div className="w-[5px] h-[5px] rounded-full" style={{ background: k.orange }} />
                    <span style={{ color: k.orange, fontWeight: 500 }}>High</span>
                  </div>
                )},
                { label: "Due", node: <span style={{ color: k.fg }}>Apr 18, 2026</span> },
                { label: "Created", node: <span style={{ color: k.fg4 }}>Jan 6, 2026</span> },
              ] as { label: string; node: React.ReactNode }[]).map(({ label, node }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="shrink-0" style={{ color: k.fg5, width: 52 }}>{label}</span>
                  {node}
                </div>
              ))}
            </div>

            <div className="mx-4 h-px" style={{ background: k.border }} />

            {/* Timeline */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2.5">
                <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>TIMELINE</span>
                <span style={{ fontSize: "10px", color: k.fg5 }}>Jan – Apr 2026</span>
              </div>
              <div className="flex flex-col">
                {timeline.map((m, i) => {
                  const isActive = m.active;
                  const isLast = i === timeline.length - 1;
                  return (
                    <div key={m.label} className="flex gap-2.5" style={{ minHeight: isLast ? "auto" : 28 }}>
                      <div className="flex flex-col items-center">
                        <div
                          className="shrink-0 flex items-center justify-center"
                          style={{
                            width: isActive ? 14 : 10,
                            height: isActive ? 14 : 10,
                            borderRadius: "50%",
                            background: m.done ? k.green : "white",
                            border: m.done ? `2px solid ${k.green}` : `2px solid ${isActive ? k.coral : k.border}`,
                            boxShadow: isActive ? `0 0 0 3px ${k.coralSoft}` : "none",
                            marginTop: isActive ? 0 : 2,
                          }}
                        >
                          {m.done && <CheckCircle weight="fill" size={10} style={{ color: "white" }} />}
                          {isActive && <div className="w-[3px] h-[3px] rounded-full" style={{ background: k.coral }} />}
                        </div>
                        {!isLast && (
                          <div className="flex-1 w-[1.5px] mt-0.5" style={{ background: m.done ? k.green : k.border }} />
                        )}
                      </div>
                      <div className="flex items-center justify-between flex-1 pt-px">
                        <span style={{
                          fontSize: "12px",
                          fontWeight: isActive ? 600 : m.done ? 500 : 400,
                          color: isActive ? k.coral : m.done ? k.fg : k.fg4,
                          lineHeight: 1,
                        }}>
                          {m.label}
                        </span>
                        <span style={{
                          fontSize: "11px",
                          color: isActive ? k.coral : k.fg5,
                          fontWeight: isActive ? 500 : 400,
                          lineHeight: 1,
                        }}>
                          {m.date}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mx-4 h-px" style={{ background: k.border }} />

            {/* Resources */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>RESOURCES</span>
                <button className="p-0.5 rounded hover:bg-black/[0.04] transition-colors">
                  <Plus size={11} style={{ color: k.fg5 }} />
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {resources.map((r) => (
                  <button
                    key={r.label}
                    className="flex items-center gap-2.5 px-2 py-[6px] rounded-md hover:bg-black/[0.025] transition-colors w-full text-left group"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                      style={{ background: `color-mix(in oklch, ${r.color} 10%, transparent)` }}
                    >
                      <r.icon weight="duotone" size={13} style={{ color: r.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate" style={{ fontSize: "12px", fontWeight: 500, color: k.fg, lineHeight: 1.3 }}>
                        {r.label}
                      </p>
                      <p className="truncate" style={{ fontSize: "10px", color: k.fg5, lineHeight: 1.2, marginTop: "1px" }}>
                        {r.sub}
                      </p>
                    </div>
                    <ArrowSquareOut size={12} style={{ color: k.fg5 }} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-4 h-px" style={{ background: k.border }} />

            {/* Members */}
            <div className="px-4 py-3 pb-6">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "10px", fontWeight: 700, color: k.fg4, letterSpacing: "0.06em" }}>MEMBERS</span>
                <button className="p-0.5 rounded hover:bg-black/[0.04] transition-colors">
                  <Plus size={11} style={{ color: k.fg5 }} />
                </button>
              </div>
              <div className="flex flex-col gap-0.5">
                {avatars.map((a) => (
                  <div key={a.name} className="flex items-center gap-2.5 px-2 py-[5px] rounded-md hover:bg-black/[0.02] transition-colors cursor-pointer">
                    <ImageWithFallback src={a.src} alt={a.name} className="w-[22px] h-[22px] rounded-full object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate" style={{ fontSize: "12px", fontWeight: 500, color: k.fg, lineHeight: 1.2 }}>{a.name}</p>
                      <p className="truncate" style={{ fontSize: "10px", color: k.fg5, lineHeight: 1.2 }}>{a.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}