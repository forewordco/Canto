import { useState } from "react";
import {
  Check,
  CaretDown,
  CaretRight,
  CaretLeft,
  Plus,
  MagnifyingGlass,
  DotsThree,
  CalendarBlank,
  Clock,
  ChatText,
  Paperclip,
  Flag,
  Tag,
  Circle,
  CheckCircle,
  ArrowSquareOut,
  DotsSixVertical,
  X,
  LinkSimple,
  At,
  ListChecks,
  ChartBar,
  UsersThree,
  Folder,
  Star,
  Square,
  CheckSquare,
  Diamond,
  Triangle,
  Tray,
  Timer,
  Play,
  Pause,
  Stop,
  Smiley,
  ChatCircle,

  Lightning,
  Minus,
  PaperPlaneTilt,
  TextB,
  TextItalic,
  ThumbsUp,
  ArrowsOut,
  GitBranch,
  CircleHalf,
  PauseCircle,
  Prohibit,
  SquareHalf,
  MinusSquare,
  XSquare,

  FilePdf,
  Table,
  Eye,
  Copy,
  PencilSimple,
  Trash,
  Archive,
  UserPlus,
  FunnelSimple,
  SortAscending,
  Columns,
  Rows,
  TreeStructure,
} from "@phosphor-icons/react";
import imgGalleryThumb from "figma:asset/36678acf3cd584ac8dc9f61ecdb623ed90050e91.png";

/* ─── OKLCH Color Tokens ─── */
const c = {
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
  orange: "oklch(0.78 0.17 55)",
  orangeLight: "oklch(0.78 0.17 55 / 0.12)",
  orangeMid: "oklch(0.55 0.14 55)",
  lime: "oklch(0.8 0.17 125)",
  limeLight: "oklch(0.8 0.17 125 / 0.12)",
  limeMid: "oklch(0.55 0.14 125)",
  emerald: "oklch(0.73 0.15 155)",
  emeraldLight: "oklch(0.73 0.15 155 / 0.12)",
  emeraldMid: "oklch(0.47 0.12 155)",
  cyan: "oklch(0.7 0.15 205)",
  cyanLight: "oklch(0.7 0.15 205 / 0.12)",
  cyanMid: "oklch(0.47 0.12 205)",
  lavender: "oklch(0.7 0.16 300)",
  lavenderLight: "oklch(0.7 0.16 300 / 0.12)",
  lavenderMid: "oklch(0.47 0.14 300)",
  magenta: "oklch(0.7 0.17 330)",
  magentaLight: "oklch(0.7 0.17 330 / 0.12)",
  magentaMid: "oklch(0.47 0.15 330)",
  rose: "oklch(0.7 0.17 350)",
  roseLight: "oklch(0.7 0.17 350 / 0.12)",
  roseMid: "oklch(0.47 0.16 350)",
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.65 0.015 260)",
  border: "oklch(0.92 0.01 260)",
  borderSubtle: "oklch(0.94 0.008 260)",
  bg1: "oklch(0.985 0.003 260)",
  bg2: "oklch(0.97 0.005 260)",
  surface: "white",
};

/* ─── Shared Components ─── */
function Avatar({ initials, bg, size = 24 }: { initials: string; bg: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: bg }}>
      <span style={{ color: "white", fontSize: `${Math.max(size * 0.38, 8)}px`, fontWeight: 600 }}>{initials}</span>
    </div>
  );
}

function SectionTitle({ children, sub }: { children: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>{children}</h2>
      {sub && <p className="mt-0.5" style={{ color: c.text3, fontSize: "13px" }}>{sub}</p>}
    </div>
  );
}

function SubLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 uppercase tracking-wider" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em" }}>{children}</p>
  );
}

/* ─── Mini Calendar ─── */
function MiniCalendar() {
  const [selectedDay, setSelectedDay] = useState(25);
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = 25;
  const cells: (number | null)[] = [];
  for (let d = 1; d <= 28; d++) cells.push(d);
  return (
    <div className="w-full max-w-[240px]">
      <div className="flex items-center justify-between mb-2">
        <button className="p-1 rounded hover:bg-black/[0.04]"><CaretLeft className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
        <span style={{ color: c.text1, fontSize: "13px", fontWeight: 600 }}>Feb 2026</span>
        <button className="p-1 rounded hover:bg-black/[0.04]"><CaretRight className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {dayLabels.map((d) => (
          <div key={d} className="h-7 flex items-center justify-center" style={{ color: c.text4, fontSize: "10px", fontWeight: 500 }}>{d}</div>
        ))}
        {cells.map((day, i) => (
          <button
            key={i}
            onClick={() => day && setSelectedDay(day)}
            className="h-7 w-7 mx-auto flex items-center justify-center rounded-[6px] transition-colors"
            style={{
              background: day === selectedDay ? c.coral : day === today && day !== selectedDay ? c.coralLight : "transparent",
              color: day === selectedDay ? "white" : day === today ? c.coralMid : c.text2,
              fontSize: "11px",
              fontWeight: day === today || day === selectedDay ? 600 : 400,
            }}
          >
            {day ?? ""}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button className="flex-1 py-1 rounded-[6px] text-center" style={{ background: c.coral, color: "white", fontSize: "11px", fontWeight: 500 }}>Set Date</button>
        <button className="flex-1 py-1 rounded-[6px] text-center border" style={{ borderColor: c.border, color: c.text3, fontSize: "11px", fontWeight: 500 }}>Clear</button>
      </div>
    </div>
  );
}

/* ─── Icon State Type ─── */
type IconState = "open" | "in-progress" | "hold" | "blocked" | "done";

/* ─── State Colors ─── */
const stateColors = {
  open: "oklch(0.8 0.01 260)",
  "in-progress": c.indigo,
  hold: c.gold,
  blocked: c.coral,
  done: c.teal,
};

/* ─── Data ─── */
const tasks = [
  { id: 1, title: "Design new dashboard layout", type: "task" as const, iconState: "in-progress" as IconState, assignee: "SC", assigneeBg: c.coral, priority: "High", priorityColor: c.coralLight, priorityFg: c.coralMid, status: "In Progress", statusColor: c.indigoLight, statusFg: c.indigoMid, dueDate: "Feb 26", project: "Website Redesign", subtasks: "3/5", comments: 4, attachments: 2, done: false },
  { id: 2, title: "Write API documentation", type: "subtask" as const, iconState: "open" as IconState, assignee: "JM", assigneeBg: c.indigo, priority: "Med", priorityColor: c.goldLight, priorityFg: c.goldMid, status: "To Do", statusColor: `oklch(0.94 0.008 260)`, statusFg: c.text3, dueDate: "Mar 1", project: "Backend v2", subtasks: "0/3", comments: 1, attachments: 0, done: false },
  { id: 3, title: "Fix navigation accessibility", type: "subtask" as const, iconState: "in-progress" as IconState, assignee: "LP", assigneeBg: c.teal, priority: "High", priorityColor: c.coralLight, priorityFg: c.coralMid, status: "In Review", statusColor: c.goldLight, statusFg: c.goldMid, dueDate: "Feb 24", project: "Website Redesign", subtasks: "2/2", comments: 7, attachments: 1, done: false },
  { id: 4, title: "Update onboarding emails", type: "subtask" as const, iconState: "done" as IconState, assignee: "AK", assigneeBg: c.gold, priority: "Low", priorityColor: c.tealLight, priorityFg: c.tealMid, status: "Done", statusColor: c.tealLight, statusFg: c.tealMid, dueDate: "Feb 20", project: "Growth", subtasks: "4/4", comments: 2, attachments: 0, done: true },
  { id: 5, title: "Beta launch readiness", type: "milestone" as const, iconState: "in-progress" as IconState, assignee: "BK", assigneeBg: "oklch(0.6 0.15 320)", priority: "High", priorityColor: c.coralLight, priorityFg: c.coralMid, status: "In Progress", statusColor: c.indigoLight, statusFg: c.indigoMid, dueDate: "Feb 28", project: "Backend v2", subtasks: "1/4", comments: 0, attachments: 3, done: false },
  { id: 6, title: "Q1 revenue target", type: "goal" as const, iconState: "in-progress" as IconState, assignee: "SC", assigneeBg: c.coral, priority: "Med", priorityColor: c.goldLight, priorityFg: c.goldMid, status: "In Progress", statusColor: c.indigoLight, statusFg: c.indigoMid, dueDate: "Mar 31", project: "Growth", subtasks: "2/6", comments: 3, attachments: 1, done: false },
];

const kanbanCols = [
  { title: "To Do", color: c.text4, items: [tasks[1]] },
  { title: "In Progress", color: c.indigo, items: [tasks[0], tasks[4], tasks[5]] },
  { title: "In Review", color: c.gold, items: [tasks[2]] },
  { title: "Done", color: c.teal, items: [tasks[3]] },
];

/* ─── Task Icon Helper ─── */
function TaskIcon({ type, state, size = "w-4 h-4" }: { type: string; state: IconState; size?: string }) {
  const color = stateColors[state];

  // Milestone, goal, email — open uses regular weight, done uses filled
  if (type === "milestone") return <Diamond weight={state === "done" ? "fill" : "regular"} className={size} style={{ color }} />;
  if (type === "goal") return <Triangle weight={state === "done" ? "fill" : "regular"} className={size} style={{ color }} />;
  if (type === "email") return <Tray weight={state === "done" ? "fill" : "regular"} className={size} style={{ color }} />;

  // Task (circle-based)
  if (type === "task") {
    switch (state) {
      case "done":        return <CheckCircle weight="fill" className={size} style={{ color }} />;
      case "in-progress": return <CircleHalf weight="fill" className={size} style={{ color }} />;
      case "hold":        return <PauseCircle weight="fill" className={size} style={{ color }} />;
      case "blocked":     return <Prohibit weight="bold" className={size} style={{ color }} />;
      default:            return <Circle className={size} style={{ color }} />;
    }
  }

  // Subtask (square-based)
  switch (state) {
    case "done":        return <CheckSquare weight="fill" className={size} style={{ color }} />;
    case "in-progress": return <SquareHalf weight="fill" className={size} style={{ color }} />;
    case "hold":        return <MinusSquare weight="fill" className={size} style={{ color }} />;
    case "blocked":     return <XSquare weight="fill" className={size} style={{ color }} />;
    default:            return <Square className={size} style={{ color }} />;
  }
}

/* ─── Priority Icon Helper ─── */
function PriorityIcon({ level, className = "w-3 h-3" }: { level: string; className?: string }) {
  switch (level) {
    case "Urgent": return <Flag weight="fill" className={className} />;
    case "High":   return <Flag weight="fill" className={className} />;
    case "Med":    return <Flag weight="fill" className={className} />;
    case "Low":    return <Flag weight="fill" className={className} />;
    default:       return <Flag className={className} />;
  }
}

/* ═══════════════════════════════════════ */
/*              MAIN EXPORT               */
/* ═══════════════════════════════════════ */
export function TasksShowcase() {
  const [expandedTask, setExpandedTask] = useState<number | null>(1);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; taskId: number } | null>(null);
  const [selectedView, setSelectedView] = useState<"list" | "board" | "timeline">("list");
  const [activeFilters, setActiveFilters] = useState<string[]>(["Status", "Priority"]);

  const handleContextMenu = (e: React.MouseEvent, taskId: number) => {
    e.preventDefault();
    setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 220), y: Math.min(e.clientY, window.innerHeight - 380), taskId });
  };

  return (
    <div className="space-y-8" onClick={() => contextMenu && setContextMenu(null)}>
      {/* ── Page Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.coral }} />
          <p style={{ color: c.coralMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>TASKS</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Task System</h1>
        <p className="mt-2 max-w-2xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          The complete task management design system — types, list views, detail panes, subtask hierarchies, kanban boards, context menus, progress tracking, filters, and bulk actions.
        </p>
      </div>

      {/* ═══════════ 1. TASK TYPES & SHAPES ═══════════ */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Task Types &amp; Shapes</h2>
          <span className="px-1.5 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>Legend</span>
        </div>
        <div className="px-4 py-4">
          <p className="mb-4" style={{ color: c.text3, fontSize: "13px", lineHeight: 1.5 }}>
            Each work item uses a distinct shape. Tasks and subtasks have five icon states that map to workflow status. Milestones, goals, and emails use a simpler open/done pair.
          </p>

          {/* ── Task & Subtask: Full 5-state icon rows ── */}
          <div className="space-y-3 mb-5">
            {([
              { type: "task", label: "Task", desc: "Standard work item (circle-based)" },
              { type: "subtask", label: "Subtask", desc: "Child of a task (square-based)" },
            ] as const).map((row) => (
              <div key={row.type} className="rounded-[6px] border px-4 py-3.5" style={{ background: c.bg1, borderColor: c.borderSubtle }}>
                <div className="flex items-center gap-2 mb-3">
                  <TaskIcon type={row.type} state="open" size="w-4.5 h-4.5" />
                  <span style={{ color: c.text1, fontSize: "13px", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: c.text4, fontSize: "11px" }}>— {row.desc}</span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {([
                    { state: "open" as IconState, label: "Open", desc: "Not started", bg: "transparent", borderCol: c.border },
                    { state: "in-progress" as IconState, label: "In-Progress", desc: "Actively working", bg: c.indigoLight, borderCol: "transparent" },
                    { state: "hold" as IconState, label: "On Hold", desc: "Paused", bg: c.goldLight, borderCol: "transparent" },
                    { state: "blocked" as IconState, label: "Blocked", desc: "Dependency wait", bg: c.coralLight, borderCol: "transparent" },
                    { state: "done" as IconState, label: "Done", desc: "Completed", bg: c.tealLight, borderCol: "transparent" },
                  ]).map((s) => (
                    <div key={s.state} className="flex flex-col items-center text-center rounded-[6px] px-2 py-3 border" style={{ background: s.bg, borderColor: s.borderCol }}>
                      <TaskIcon type={row.type} state={s.state} size="w-6 h-6" />
                      <span className="mt-1.5 block" style={{ color: stateColors[s.state], fontSize: "11px", fontWeight: 600 }}>{s.label}</span>
                      <span className="block" style={{ color: c.text4, fontSize: "9px" }}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* ── Milestone, Goal, Email: simple open/done ── */}
          <SubLabel>OTHER WORK ITEM TYPES</SubLabel>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { type: "milestone" as const, label: "Milestone", desc: "Key deliverable" },
              { type: "goal" as const, label: "Goal", desc: "Strategic objective" },
              { type: "email" as const, label: "Email", desc: "Inbox item" },
            ].map((t) => (
              <div key={t.label} className="rounded-[6px] px-3 py-2.5" style={{ background: c.bg1 }}>
                <div className="flex items-center gap-4 mb-1">
                  <div className="flex items-center gap-1.5">
                    <TaskIcon type={t.type} state="open" size="w-4.5 h-4.5" />
                    <span style={{ color: c.text4, fontSize: "9px" }}>Open</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TaskIcon type={t.type} state="done" size="w-4.5 h-4.5" />
                    <span style={{ color: c.text4, fontSize: "9px" }}>Done</span>
                  </div>
                </div>
                <p style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>{t.label}</p>
                <p style={{ color: c.text4, fontSize: "10px" }}>{t.desc}</p>
              </div>
            ))}
          </div>

          {/* Status + Priority rows */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SubLabel>STATUS PIPELINE</SubLabel>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Backlog", color: c.text4 },
                  { label: "To Do", color: c.cyan },
                  { label: "In Progress", color: c.indigo },
                  { label: "In Review", color: c.lavender },
                  { label: "Done", color: c.teal },
                  { label: "Archived", color: c.bg2 },
                ].map((s) => (
                  <span key={s.label} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: `${s.color}15`, fontSize: "11px", fontWeight: 500, color: s.color === c.bg2 ? c.text4 : s.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color === c.bg2 ? c.text4 : s.color }} />
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <SubLabel>PRIORITY LEVELS</SubLabel>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Urgent", icon: Flag, weight: "fill" as const, bg: c.coralLight, fg: c.coralMid },
                  { label: "High", icon: Flag, weight: "fill" as const, bg: c.orangeLight, fg: c.orangeMid },
                  { label: "Medium", icon: Flag, weight: "fill" as const, bg: c.goldLight, fg: c.goldMid },
                  { label: "Low", icon: Flag, weight: "fill" as const, bg: c.tealLight, fg: c.tealMid },
                  { label: "None", icon: Flag, weight: "regular" as const, bg: c.bg2, fg: c.text4 },
                ].map((p) => (
                  <span key={p.label} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px]" style={{ background: p.bg, color: p.fg, fontSize: "11px", fontWeight: 500 }}>
                    <p.icon weight={p.weight} className="w-3 h-3" /> {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 2. VIEW SWITCHER + FILTERS ═══════════ */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>View Switcher &amp; Filters</h2>
        </div>
        <div className="px-4 py-4 space-y-4">
          {/* View tabs */}
          <div>
            <SubLabel>VIEW MODES</SubLabel>
            <div className="inline-flex items-center rounded-[6px] border overflow-hidden" style={{ borderColor: c.border }}>
              {([
                { key: "list" as const, icon: Rows, label: "List" },
                { key: "board" as const, icon: Columns, label: "Board" },
                { key: "timeline" as const, icon: ChartBar, label: "Timeline" },
              ]).map((v) => (
                <button
                  key={v.key}
                  onClick={() => setSelectedView(v.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border-r last:border-r-0 transition-colors"
                  style={{
                    borderColor: c.border,
                    background: selectedView === v.key ? c.coralLight : "transparent",
                    color: selectedView === v.key ? c.coralMid : c.text3,
                    fontSize: "12px",
                    fontWeight: selectedView === v.key ? 500 : 400,
                  }}
                >
                  <v.icon className="w-3.5 h-3.5" /> {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter bar */}
          <div>
            <SubLabel>ACTIVE FILTERS</SubLabel>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border" style={{ borderColor: c.border, color: c.text3, fontSize: "12px" }}>
                <FunnelSimple className="w-3.5 h-3.5" /> Filter
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border" style={{ borderColor: c.border, color: c.text3, fontSize: "12px" }}>
                <SortAscending className="w-3.5 h-3.5" /> Sort
              </button>
              <div className="w-px h-5" style={{ background: c.border }} />
              {activeFilters.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "11px", fontWeight: 500 }}>
                  {f}
                  <button onClick={() => setActiveFilters(activeFilters.filter(x => x !== f))} className="hover:bg-black/[0.04] rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {activeFilters.length > 0 && (
                <button onClick={() => setActiveFilters([])} className="px-1.5 py-0.5 rounded hover:bg-black/[0.04]" style={{ color: c.text4, fontSize: "11px" }}>Clear all</button>
              )}
            </div>
          </div>

          {/* Grouping / layout options */}
          <div>
            <SubLabel>GROUP BY</SubLabel>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["None", "Status", "Priority", "Assignee", "Project", "Due Date"].map((g, i) => (
                <button key={g} className="px-2.5 py-1 rounded-[6px] transition-colors" style={{
                  background: i === 1 ? c.coralLight : "transparent",
                  color: i === 1 ? c.coralMid : c.text3,
                  fontSize: "11px",
                  fontWeight: i === 1 ? 500 : 400,
                  border: i === 1 ? "none" : `1px solid ${c.borderSubtle}`,
                }}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 3. TASK LIST ═══════════ */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Task List</h2>
            <span className="px-1.5 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px", fontWeight: 500 }}>{tasks.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded-[6px] flex items-center gap-1 hover:bg-black/[0.03]" style={{ color: c.text3, fontSize: "12px" }}>
              <MagnifyingGlass className="w-3 h-3" /> Filter
            </button>
            <button className="px-2.5 py-1 rounded-[6px] flex items-center gap-1 hover:bg-black/[0.03]" style={{ color: c.text3, fontSize: "12px" }}>
              Sort <CaretDown className="w-3 h-3" />
            </button>
            <button className="px-2.5 py-1 rounded-[6px] flex items-center gap-1" style={{ background: c.coral, color: "white", fontSize: "12px", fontWeight: 500 }}>
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex items-stretch border-b" style={{ borderColor: c.border, background: c.bg1 }}>
          <span className="flex-1 flex items-center px-4 py-1.5 border-r" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: c.borderSubtle }}>TASK</span>
          <div className="shrink-0 grid items-stretch" style={{ gridTemplateColumns: "80px 64px 72px 40px 28px" }}>
            <span className="flex items-center justify-center border-r" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: c.borderSubtle }}>STATUS</span>
            <span className="flex items-center justify-center border-r" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: c.borderSubtle }}>PRIORITY</span>
            <span className="flex items-center justify-center border-r" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: c.borderSubtle }}>DUE</span>
            <span className="flex items-center justify-center" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>OWNER</span>
            <span />
          </div>
        </div>

        {/* Task rows */}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-stretch border-b hover:bg-black/[0.015] transition-colors cursor-pointer group"
            style={{ borderColor: c.border }}
            onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
            onContextMenu={(e) => handleContextMenu(e, task.id)}
          >
            <div className="flex-1 flex items-center gap-2 px-4 py-1.5 border-r min-w-0" style={{ borderColor: c.borderSubtle }}>
              <button onClick={(e) => e.stopPropagation()} className="shrink-0">
                <TaskIcon type={task.type} state={task.iconState} />
              </button>
              <p className="truncate" style={{ color: task.done ? c.text4 : c.text1, fontSize: "13px", fontWeight: 400, textDecoration: task.done ? "line-through" : "none" }}>{task.title}</p>
              <span className="shrink-0 flex items-center gap-0.5" style={{ color: c.text4, fontSize: "10px" }}><Folder className="w-2.5 h-2.5" />{task.project}</span>
              {task.subtasks && (
                <span className="shrink-0 inline-flex items-center gap-1" style={{ fontSize: "10px", color: c.text4 }}>
                  <span className="relative w-7 h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.93 0.008 260)" }}>
                    <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(parseInt(task.subtasks.split("/")[0]) / parseInt(task.subtasks.split("/")[1])) * 100}%`, background: parseInt(task.subtasks.split("/")[0]) === parseInt(task.subtasks.split("/")[1]) ? c.teal : c.indigo }} />
                  </span>
                  {task.subtasks}
                </span>
              )}
              {task.comments > 0 && <span className="shrink-0 inline-flex items-center gap-0.5" style={{ color: c.text4, fontSize: "10px" }}><ChatText className="w-2.5 h-2.5" />{task.comments}</span>}
            </div>
            <div className="shrink-0 grid items-stretch" style={{ gridTemplateColumns: "80px 64px 72px 40px 28px" }}>
              <span className="flex items-center justify-center border-r" style={{ borderColor: c.borderSubtle }}><span className="px-2 py-0.5 rounded-full" style={{ background: task.statusColor, color: task.statusFg, fontSize: "10px", fontWeight: 500 }}>{task.status}</span></span>
              <span className="flex items-center justify-center border-r" style={{ borderColor: c.borderSubtle }}><span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: task.priorityColor, color: task.priorityFg, fontSize: "10px", fontWeight: 500 }}><PriorityIcon level={task.priority} className="w-2.5 h-2.5" />{task.priority}</span></span>
              <span className="flex items-center justify-center gap-1 border-r" style={{ color: c.text3, fontSize: "11px", borderColor: c.borderSubtle }}><CalendarBlank className="w-3 h-3" />{task.dueDate}</span>
              <div className="flex items-center justify-center"><Avatar initials={task.assignee} bg={task.assigneeBg} size={22} /></div>
              <button onClick={(e) => e.stopPropagation()} className="flex items-center justify-center p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/[0.04]">
                <DotsThree className="w-3.5 h-3.5" style={{ color: c.text4 }} />
              </button>
            </div>
          </div>
        ))}

        {/* Add task row */}
        <button className="flex items-center gap-2 w-full px-4 py-2 hover:bg-black/[0.015] transition-colors" style={{ color: c.text4, fontSize: "12px" }}>
          <Plus className="w-3.5 h-3.5" /> Add task...
        </button>
      </section>

      {/* ═══════════ 4. RIGHT-CLICK CONTEXT MENU ═══════════ */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <SectionTitle sub="Right-click any task row above to see this live, or view the static reference below.">Right-Click Context Menu</SectionTitle>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Static menu preview */}
          <div className="w-[220px] rounded-[6px] border shadow-xl overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
            {[
              { icon: Eye, label: "Open task", shortcut: "Enter", sep: false },
              { icon: PencilSimple, label: "Edit title", shortcut: "F2", sep: false },
              { icon: Copy, label: "Duplicate", shortcut: "Ctrl+D", sep: false },
              { icon: LinkSimple, label: "Copy link", shortcut: "Ctrl+L", sep: true },
              { icon: UserPlus, label: "Assign to...", shortcut: "", sep: false },
              { icon: Flag, label: "Set priority", shortcut: "", sep: false },
              { icon: CalendarBlank, label: "Set due date", shortcut: "", sep: false },
              { icon: Tag, label: "Add label", shortcut: "L", sep: false },
              { icon: GitBranch, label: "Add subtask", shortcut: "Ctrl+Shift+N", sep: true },
              { icon: ArrowSquareOut, label: "Move to...", shortcut: "", sep: false },
              { icon: Archive, label: "Archive", shortcut: "", sep: true },
              { icon: Trash, label: "Delete", shortcut: "Del", sep: false, danger: true },
            ].map((item, i) => (
              <div key={i}>
                {item.sep && i > 0 && <div className="mx-2 my-1 h-px" style={{ background: c.border }} />}
                <button className={`flex items-center gap-2.5 w-full px-3 py-[6px] text-left transition-colors ${i === 0 ? "bg-black/[0.02]" : "hover:bg-black/[0.02]"}`}>
                  <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: (item as any).danger ? c.coralMid : c.text3 }} />
                  <span className="flex-1" style={{ color: (item as any).danger ? c.coralMid : c.text2, fontSize: "12px" }}>{item.label}</span>
                  {item.shortcut && <kbd className="px-1 py-0.5 rounded" style={{ background: c.bg2, color: c.text4, fontSize: "9px", fontFamily: "monospace" }}>{item.shortcut}</kbd>}
                </button>
              </div>
            ))}
          </div>

          {/* Menu states */}
          <div className="flex-1 space-y-4">
            <div>
              <SubLabel>SUBMENU — SET PRIORITY</SubLabel>
              <div className="w-[180px] rounded-[6px] border shadow-lg overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
                {[
                  { icon: Flag, label: "Urgent", color: c.coral, bg: c.coralLight, weight: "fill" as const },
                  { icon: Flag, label: "High", color: c.orange, bg: c.orangeLight, weight: "fill" as const },
                  { icon: Flag, label: "Medium", color: c.goldMid, bg: c.goldLight, weight: "fill" as const },
                  { icon: Flag, label: "Low", color: c.tealMid, bg: c.tealLight, weight: "fill" as const },
                  { icon: Flag, label: "None", color: c.text4, bg: c.bg2, weight: "regular" as const },
                ].map((p) => (
                  <button key={p.label} className="flex items-center gap-2.5 w-full px-3 py-[6px] hover:bg-black/[0.02] text-left">
                    <span className="w-5 h-5 rounded-[6px] flex items-center justify-center" style={{ background: p.bg }}>
                      <p.icon weight={p.weight} className="w-3 h-3" style={{ color: p.color }} />
                    </span>
                    <span style={{ color: c.text2, fontSize: "12px" }}>{p.label}</span>
                    {p.label === "High" && <Check className="w-3 h-3 ml-auto" style={{ color: c.coral }} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SubLabel>SUBMENU — SET STATUS (TASK)</SubLabel>
              <div className="w-[200px] rounded-[6px] border shadow-lg overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
                {([
                  { state: "open" as IconState, label: "Open" },
                  { state: "in-progress" as IconState, label: "In-Progress" },
                  { state: "hold" as IconState, label: "On Hold" },
                  { state: "blocked" as IconState, label: "Blocked" },
                  { state: "done" as IconState, label: "Done" },
                ]).map((s) => (
                  <button key={s.state} className="flex items-center gap-2.5 w-full px-3 py-[6px] hover:bg-black/[0.02] text-left">
                    <TaskIcon type="task" state={s.state} />
                    <span style={{ color: c.text2, fontSize: "12px" }}>{s.label}</span>
                    {s.state === "in-progress" && <Check className="w-3 h-3 ml-auto" style={{ color: c.coral }} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SubLabel>SUBMENU — SET STATUS (SUBTASK)</SubLabel>
              <div className="w-[200px] rounded-[6px] border shadow-lg overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
                {([
                  { state: "open" as IconState, label: "Open" },
                  { state: "in-progress" as IconState, label: "In-Progress" },
                  { state: "hold" as IconState, label: "On Hold" },
                  { state: "blocked" as IconState, label: "Blocked" },
                  { state: "done" as IconState, label: "Done" },
                ]).map((s) => (
                  <button key={s.state} className="flex items-center gap-2.5 w-full px-3 py-[6px] hover:bg-black/[0.02] text-left">
                    <TaskIcon type="subtask" state={s.state} />
                    <span style={{ color: c.text2, fontSize: "12px" }}>{s.label}</span>
                    {s.state === "open" && <Check className="w-3 h-3 ml-auto" style={{ color: c.coral }} />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SubLabel>SUBMENU — ASSIGN TO</SubLabel>
              <div className="w-[200px] rounded-[6px] border shadow-lg overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
                <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: c.border }}>
                  <MagnifyingGlass className="w-3 h-3" style={{ color: c.text4 }} />
                  <input type="text" placeholder="Search people..." className="flex-1 outline-none bg-transparent" style={{ fontSize: "12px", color: c.text1 }} />
                </div>
                {[
                  { initials: "SC", name: "Sarah Chen", bg: c.coral, selected: true },
                  { initials: "JM", name: "Jake Martinez", bg: c.indigo, selected: false },
                  { initials: "LP", name: "Lena Park", bg: c.teal, selected: false },
                  { initials: "AK", name: "Arun Kumar", bg: c.gold, selected: false },
                ].map((p) => (
                  <button key={p.initials} className="flex items-center gap-2.5 w-full px-3 py-[6px] hover:bg-black/[0.02] text-left">
                    <Avatar initials={p.initials} bg={p.bg} size={20} />
                    <span className="flex-1" style={{ color: c.text2, fontSize: "12px" }}>{p.name}</span>
                    {p.selected && <Check className="w-3 h-3" style={{ color: c.coral }} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 5. TASK DETAIL PANE ═══════════ */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Task Detail Pane</h2>
          <span className="px-1.5 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>ClickUp-style</span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "12px", color: c.text4 }}>Website Redesign</span>
            <span style={{ fontSize: "12px", color: c.text4 }}>/</span>
            <span style={{ fontSize: "12px", color: c.text4 }}>Sprint 4</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              { icon: ThumbsUp, title: "Like" },
              { icon: Paperclip, title: "Attach" },
              { icon: GitBranch, title: "Subtasks" },
              { icon: LinkSimple, title: "Copy link" },
              { icon: ArrowsOut, title: "Full screen" },
              { icon: DotsThree, title: "More" },
            ].map((btn) => (
              <button key={btn.title} className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title={btn.title}>
                <btn.icon className="w-4 h-4" style={{ color: c.text4 }} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row" style={{ minHeight: "680px" }}>
          {/* Left column */}
          <div className="flex-1 min-w-0 md:border-r overflow-y-auto" style={{ borderColor: c.border }}>
            <div className="px-6 py-5">
              {/* Status row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1" style={{ background: "oklch(0.88 0.08 195)", border: "1px solid oklch(0.7 0.12 195)" }}>
                    <CircleHalf className="w-4 h-4" style={{ color: "oklch(0.35 0.08 195)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "oklch(0.35 0.08 195)" }}>In-Progress</span>
                  </div>
                  <div className="inline-flex items-center rounded-full py-1 px-2.5" style={{ background: c.indigoLight }}>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: c.indigoMid }}>Pre-Production</span>
                  </div>
                  <Flag className="w-4 h-4" style={{ color: c.text4 }} />
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex items-center gap-1 px-2 py-1" style={{ background: c.bg1, border: `1px solid ${c.border}` }}>
                    <CalendarBlank className="w-3.5 h-3.5" style={{ color: c.text4 }} />
                    <span style={{ fontSize: "13px", color: c.text3 }}> Start </span>
                    <span style={{ fontSize: "13px", color: c.text4 }}>→</span>
                    <CalendarBlank className="w-3.5 h-3.5" style={{ color: c.text4 }} />
                    <span style={{ fontSize: "13px", color: c.text3 }}> Feb 26</span>
                  </div>
                  <Avatar initials="SC" bg={c.coral} size={22} />
                </div>
              </div>

              {/* Title */}
              <h3 style={{ color: c.text1, fontSize: "20px", fontWeight: 600, lineHeight: 1.3 }}>Design new dashboard layout</h3>

              {/* Description */}
              <div className="mt-2 mb-5" style={{ color: c.text2, fontSize: "13px", lineHeight: 1.7 }}>
                <p>
                  Create a new dashboard layout that provides a clear overview of <span style={{ fontWeight: 600, color: c.text1 }}>project progress</span>, team activity, and upcoming deadlines.
                </p>
                <ul className="mt-2 ml-4 space-y-0.5" style={{ listStyleType: "disc" }}>
                  <li>Widget-based layout with <span style={{ color: c.indigoMid, fontWeight: 500 }}>drag-and-drop</span> reordering</li>
                  <li>Real-time activity feed in the right rail</li>
                  <li>Support for <span style={{ fontWeight: 600, color: c.text1 }}>dark mode</span> variant</li>
                </ul>
              </div>

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Subtasks</span>
                  <span style={{ fontSize: "12px", color: c.text4 }}>3 of 5</span>
                </div>
                <div className="flex-1 h-1 rounded-full overflow-hidden mb-2" style={{ background: c.bg2 }}>
                  <div className="h-full rounded-full" style={{ width: "60%", background: c.indigo }} />
                </div>
                {([
                  { label: "Wireframe layout options", state: "done" as IconState, assignee: "SC", bg: c.coral },
                  { label: "Design high-fidelity mockups", state: "done" as IconState, assignee: "SC", bg: c.coral },
                  { label: "Prototype micro-interactions", state: "done" as IconState, assignee: "JM", bg: c.indigo },
                  { label: "Get stakeholder feedback", state: "in-progress" as IconState, assignee: "SC", bg: c.coral },
                  { label: "Awaiting vendor assets", state: "blocked" as IconState, assignee: "AK", bg: c.gold },
                ]).map((st) => (
                  <div key={st.label} className="flex items-center gap-2 py-[7px]" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                    <TaskIcon type="subtask" state={st.state} />
                    <span className={`flex-1 min-w-0 truncate ${st.state === "done" ? "line-through" : ""}`} style={{ fontSize: "13px", color: st.state === "done" ? c.text4 : st.state === "blocked" ? c.coralMid : c.text2 }}>{st.label}</span>
                    <Avatar initials={st.assignee} bg={st.bg} size={20} />
                  </div>
                ))}
                <button className="flex items-center gap-1.5 mt-1 py-1.5 rounded-[6px] hover:bg-black/[0.02]" style={{ color: c.text4, fontSize: "12px" }}>
                  <Plus className="w-3 h-3" /> Add Task
                </button>
              </div>

              {/* Attachments */}
              <div className="mt-6">
                <span style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Attachments</span>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  <button className="flex-1 min-w-0 flex items-center gap-2.5 pl-[7px] pr-4 py-[7px] rounded-[6px] border hover:shadow-sm transition-all" style={{ borderColor: c.border, background: c.surface }}>
                    <img src={imgGalleryThumb} alt="Gallery" className="w-9 h-9 rounded-[6px] object-cover shrink-0" />
                    <div className="text-left">
                      <span className="block" style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>Image Gallery</span>
                      <span className="block" style={{ color: c.text4, fontSize: "11px", fontWeight: 500 }}>7 images</span>
                    </div>
                  </button>
                  <button className="flex-1 min-w-0 flex items-center gap-2.5 pl-[7px] pr-4 py-[7px] rounded-[6px] border hover:shadow-sm transition-all" style={{ borderColor: c.border, background: c.surface }}>
                    <div className="w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: "oklch(0.6 0.22 25 / 0.08)" }}>
                      <FilePdf size={18} style={{ color: "oklch(0.55 0.22 25)" }} />
                    </div>
                    <span style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>Brand Guide.pdf</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Activity */}
          <div className="flex flex-col md:w-[380px] shrink-0" style={{ background: c.bg1 }}>
            <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "14px", fontWeight: 600, color: c.text1 }}>Activity</span>
                <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]"><MagnifyingGlass className="w-4 h-4" style={{ color: c.text4 }} /></button>
              </div>
              <div className="space-y-1">
                {[
                  { user: "Lena Kim", action: 'completed subtask "Prototype micro-interactions"', time: "45 min ago" },
                  { user: "Sarah Chen", action: "changed status from To Do to In Progress", time: "3 hours ago" },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.text4 }} />
                    <div>
                      <span style={{ fontSize: "12px", color: c.text2 }}>
                        <span style={{ fontWeight: 600, color: c.text1 }}>{log.user}</span> {log.action}
                      </span>
                      <span className="block" style={{ fontSize: "11px", color: c.text4 }}>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {[
                { initials: "JM", bg: c.indigo, name: "Jake Martinez", time: "1 hour ago", text: "Looks great! Can we bump the CTA contrast slightly?" },
                { initials: "SC", bg: c.coral, name: "Sarah Chen", time: "2 hours ago", text: "I've updated the wireframes with the new sidebar layout. Can everyone review?" },
              ].map((comment, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Avatar initials={comment.initials} bg={comment.bg} size={22} />
                    <span style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>{comment.name}</span>
                    <span style={{ color: c.text4, fontSize: "11px" }}>{comment.time}</span>
                  </div>
                  <p className="ml-[28px]" style={{ color: c.text2, fontSize: "13px", lineHeight: 1.6 }}>{comment.text}</p>
                  {i === 1 && (
                    <div className="flex items-center gap-2 mt-1.5 ml-[28px]">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: c.coralLight, fontSize: "11px" }}>
                        <span style={{ fontSize: "12px" }}>👍</span> <span style={{ color: c.text3 }}>2</span>
                      </span>
                      <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: c.text3, fontSize: "11px" }}>
                        <Smiley className="w-3 h-3" /> React
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Comment input */}
            <div className="px-4 py-3 border-t" style={{ background: c.bg1, borderColor: c.border }}>
              <div className="rounded-[6px] border overflow-hidden" style={{ borderColor: c.border, background: c.surface }}>
                <div className="px-3 py-2">
                  <p style={{ fontSize: "13px", color: "oklch(0.2 0.02 260 / 0.5)" }}>Write a comment...</p>
                </div>
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-t" style={{ borderColor: c.borderSubtle }}>
                  <button className="p-1 rounded-[6px] hover:bg-black/[0.04]"><TextB className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
                  <button className="p-1 rounded-[6px] hover:bg-black/[0.04]"><TextItalic className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
                  <button className="p-1 rounded-[6px] hover:bg-black/[0.04]"><At className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
                  <button className="p-1 rounded-[6px] hover:bg-black/[0.04]"><Smiley className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
                  <button className="p-1 rounded-[6px] hover:bg-black/[0.04]"><Paperclip className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
                  <div className="flex-1" />
                  <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]">
                    <PaperPlaneTilt weight="fill" className="w-3.5 h-3.5" style={{ color: c.text4 }} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 6. SUBTASK HIERARCHY ═══════════ */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Subtask Hierarchy</h2>
            <TreeStructure className="w-4 h-4" style={{ color: c.text4 }} />
          </div>
          <span className="px-1.5 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>Nested</span>
        </div>
        <div className="px-4 py-4">
          <p className="mb-4" style={{ color: c.text3, fontSize: "13px" }}>Multi-level task nesting with indented child items and progress rollup.</p>

          {/* Parent task */}
          <div className="space-y-0">
            {/* Level 0 - Parent */}
            <div className="flex items-center gap-2 py-2 px-1" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
              <button className="p-0.5"><CaretDown className="w-3 h-3" style={{ color: c.text4 }} /></button>
              <TaskIcon type="task" state="in-progress" />
              <span style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>Redesign onboarding flow</span>
              <span className="ml-auto px-2 py-0.5 rounded-full" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "10px", fontWeight: 500 }}>In Progress</span>
              <span style={{ color: c.text4, fontSize: "10px" }}>2/5</span>
              <Avatar initials="SC" bg={c.coral} size={20} />
            </div>

            {/* Level 1 children */}
            {([
              { title: "User research interviews", state: "done" as IconState, assignee: "LP", bg: c.teal, hasChildren: false },
              { title: "Design wireframes", state: "done" as IconState, assignee: "SC", bg: c.coral, hasChildren: true },
              { title: "Build prototype", state: "in-progress" as IconState, assignee: "JM", bg: c.indigo, hasChildren: true },
              { title: "Waiting on API contract", state: "blocked" as IconState, assignee: "BK", bg: "oklch(0.6 0.15 320)", hasChildren: false },
              { title: "Usability testing", state: "hold" as IconState, assignee: "AK", bg: c.gold, hasChildren: false },
            ]).map((child) => (
              <div key={child.title}>
                <div className="flex items-center gap-2 py-2 pl-8 pr-1" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                  {child.hasChildren
                    ? <button className="p-0.5"><CaretDown className="w-3 h-3" style={{ color: c.text4 }} /></button>
                    : <span className="w-4" />}
                  <TaskIcon type="subtask" state={child.state} />
                  <span className={child.state === "done" ? "line-through" : ""} style={{ color: child.state === "done" ? c.text4 : child.state === "blocked" ? c.coralMid : c.text2, fontSize: "13px" }}>{child.title}</span>
                  {child.state === "blocked" && <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.coralLight, color: c.coralMid, fontSize: "9px", fontWeight: 600 }}>Blocked</span>}
                  {child.state === "hold" && <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.goldLight, color: c.goldMid, fontSize: "9px", fontWeight: 600 }}>On Hold</span>}
                  <span className="ml-auto" />
                  <Avatar initials={child.assignee} bg={child.bg} size={18} />
                </div>

                {/* Level 2 grandchildren */}
                {child.hasChildren && (
                  <div>
                    {(child.title === "Design wireframes" ? [
                      { title: "Mobile screens", state: "done" as IconState },
                      { title: "Desktop screens", state: "done" as IconState },
                    ] : [
                      { title: "Component library setup", state: "in-progress" as IconState },
                      { title: "Animation specs", state: "open" as IconState },
                      { title: "Responsive breakpoints", state: "open" as IconState },
                    ]).map((gc) => (
                      <div key={gc.title} className="flex items-center gap-2 py-[6px] pl-16 pr-1" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                        <span className="w-4" />
                        <TaskIcon type="subtask" state={gc.state} size="w-3.5 h-3.5" />
                        <span className={gc.state === "done" ? "line-through" : ""} style={{ color: gc.state === "done" ? c.text4 : gc.state === "in-progress" ? c.text2 : c.text3, fontSize: "12px" }}>{gc.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button className="flex items-center gap-1.5 py-2 pl-8 hover:bg-black/[0.02] w-full" style={{ color: c.text4, fontSize: "12px" }}>
              <Plus className="w-3 h-3" /> Add subtask
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ 7. KANBAN BOARD ═══════════ */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.bg1, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border, background: c.surface }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Kanban Board</h2>
          <div className="flex items-center gap-1">
            <button className="px-2 py-0.5 rounded text-center" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>Group by: Status</button>
          </div>
        </div>
        <div className="flex gap-3 p-4 overflow-x-auto">
          {kanbanCols.map((col) => (
            <div key={col.title} className="min-w-[200px] flex-1">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span style={{ color: c.text2, fontSize: "12px", fontWeight: 600 }}>{col.title}</span>
                  <span className="px-1 rounded" style={{ background: c.bg2, color: c.text4, fontSize: "10px" }}>{col.items.length}</span>
                </div>
                <button className="p-0.5 rounded hover:bg-black/[0.04]"><Plus className="w-3 h-3" style={{ color: c.text4 }} /></button>
              </div>
              <div className="space-y-2">
                {col.items.map((task) => (
                  <div key={task.id} className="rounded-[6px] border p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow" style={{ background: c.surface, borderColor: c.border }}>
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <p style={{ color: c.text1, fontSize: "12px", fontWeight: 500, lineHeight: 1.4 }}>{task.title}</p>
                      <DotsSixVertical className="w-3 h-3 shrink-0 mt-0.5 opacity-0" style={{ color: c.text4 }} />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{ background: task.priorityColor, color: task.priorityFg, fontSize: "9px", fontWeight: 600 }}><PriorityIcon level={task.priority} className="w-2.5 h-2.5" />{task.priority}</span>
                      <span className="flex items-center gap-0.5" style={{ color: c.text4, fontSize: "10px" }}><CalendarBlank className="w-2.5 h-2.5" />{task.dueDate}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: c.border }}>
                      <div className="flex items-center gap-2">
                        {task.comments > 0 && <span className="flex items-center gap-0.5" style={{ color: c.text4, fontSize: "10px" }}><ChatText className="w-2.5 h-2.5" />{task.comments}</span>}
                        {task.attachments > 0 && <span className="flex items-center gap-0.5" style={{ color: c.text4, fontSize: "10px" }}><Paperclip className="w-2.5 h-2.5" />{task.attachments}</span>}
                        <span style={{ color: c.text4, fontSize: "10px" }}>{task.subtasks}</span>
                      </div>
                      <Avatar initials={task.assignee} bg={task.assigneeBg} size={18} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ 8. TASK PROGRESS & METRICS ═══════════ */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <SectionTitle sub="Multiple progress visualization styles for tasks and projects.">Task Progress &amp; Metrics</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Linear bars */}
          <div>
            <SubLabel>LINEAR PROGRESS</SubLabel>
            <div className="space-y-2.5">
              {[
                { label: "Design", pct: 85, color: c.coral },
                { label: "Development", pct: 42, color: c.indigo },
                { label: "Testing", pct: 15, color: c.teal },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span style={{ color: c.text2, fontSize: "11px" }}>{bar.label}</span>
                    <span style={{ color: c.text3, fontSize: "10px", fontWeight: 600 }}>{bar.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.bg2 }}>
                    <div className="h-full rounded-full" style={{ width: `${bar.pct}%`, background: bar.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Circular rings */}
          <div>
            <SubLabel>CIRCULAR</SubLabel>
            <div className="flex items-center gap-4">
              {[
                { pct: 75, color: c.coral, label: "Sprint" },
                { pct: 42, color: c.indigo, label: "Quarter" },
                { pct: 90, color: c.teal, label: "Phase" },
              ].map((ring) => {
                const r = 22;
                const circ = 2 * Math.PI * r;
                const offset = circ * (1 - ring.pct / 100);
                return (
                  <div key={ring.label} className="flex flex-col items-center gap-1">
                    <div className="relative w-14 h-14">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r={r} fill="none" stroke={c.bg2} strokeWidth="4" />
                        <circle cx="28" cy="28" r={r} fill="none" stroke={ring.color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center" style={{ color: c.text1, fontSize: "12px", fontWeight: 700 }}>{ring.pct}%</span>
                    </div>
                    <span style={{ color: c.text3, fontSize: "10px" }}>{ring.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Steps */}
          <div>
            <SubLabel>STEPS</SubLabel>
            <div className="space-y-1.5">
              {[
                { label: "Planning", done: true, current: false },
                { label: "Design", done: true, current: false },
                { label: "Development", done: false, current: true },
                { label: "Testing", done: false, current: false },
                { label: "Launch", done: false, current: false },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                    background: step.done ? c.teal : step.current ? c.coral : c.bg2,
                    border: !step.done && !step.current ? `1.5px solid ${c.border}` : "none"
                  }}>
                    {step.done ? <Check className="w-2.5 h-2.5 text-white" /> :
                     step.current ? <span style={{ color: "white", fontSize: "9px", fontWeight: 700 }}>{i + 1}</span> :
                     <span style={{ color: c.text4, fontSize: "9px", fontWeight: 500 }}>{i + 1}</span>}
                  </div>
                  <span style={{ color: step.done ? c.text4 : step.current ? c.text1 : c.text3, fontSize: "12px", fontWeight: step.current ? 500 : 400 }}>{step.label}</span>
                  {step.current && <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.coralLight, color: c.coralMid, fontSize: "9px", fontWeight: 600 }}>Active</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 9. BULK ACTIONS BAR ═══════════ */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <SectionTitle sub="Appears when multiple tasks are selected via checkboxes.">Bulk Actions Bar</SectionTitle>

        <div className="rounded-[6px] border px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ background: c.bg1, borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <CheckSquare weight="fill" className="w-4 h-4" style={{ color: c.coral }} />
            <span style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>3 tasks selected</span>
          </div>
          <div className="w-px h-5" style={{ background: c.border }} />
          {[
            { icon: UserPlus, label: "Assign" },
            { icon: Flag, label: "Priority" },
            { icon: CalendarBlank, label: "Due Date" },
            { icon: Tag, label: "Label" },
            { icon: ArrowSquareOut, label: "Move" },
            { icon: Archive, label: "Archive" },
          ].map((action) => (
            <button key={action.label} className="flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-black/[0.04] transition-colors" style={{ color: c.text3, fontSize: "12px" }}>
              <action.icon className="w-3.5 h-3.5" /> {action.label}
            </button>
          ))}
          <div className="flex-1" />
          <button className="flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-black/[0.04] transition-colors" style={{ color: c.coralMid, fontSize: "12px" }}>
            <Trash className="w-3.5 h-3.5" /> Delete
          </button>
          <button className="p-1 rounded-[6px] hover:bg-black/[0.04]" style={{ color: c.text4 }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ═══════════ 10. TASK CREATION ═══════════ */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Task Creation Form</h2>
          <p className="mt-0.5" style={{ color: c.text3, fontSize: "13px" }}>Inline new-task form with field pickers.</p>
        </div>
        <div className="px-5 py-5">
          <div className="max-w-lg space-y-4">
            {/* Title */}
            <div>
              <label style={{ color: c.text2, fontSize: "12px", fontWeight: 500 }}>Task name</label>
              <input type="text" placeholder="What needs to be done?" className="w-full mt-1 px-3 py-2 rounded-[6px] border outline-none" style={{ borderColor: c.border, fontSize: "13px", color: c.text1 }} />
            </div>

            {/* Description */}
            <div>
              <label style={{ color: c.text2, fontSize: "12px", fontWeight: 500 }}>Description</label>
              <textarea placeholder="Add details..." rows={2} className="w-full mt-1 px-3 py-2 rounded-[6px] border outline-none resize-none" style={{ borderColor: c.border, fontSize: "13px", color: c.text1 }} />
            </div>

            {/* Field pickers row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border hover:bg-black/[0.02]" style={{ borderColor: c.border, color: c.text3, fontSize: "12px" }}>
                <UsersThree className="w-3.5 h-3.5" /> Assignee
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border hover:bg-black/[0.02]" style={{ borderColor: c.border, color: c.text3, fontSize: "12px" }}>
                <CalendarBlank className="w-3.5 h-3.5" /> Due date
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border hover:bg-black/[0.02]" style={{ borderColor: c.border, color: c.text3, fontSize: "12px" }}>
                <Flag className="w-3.5 h-3.5" /> Priority
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border hover:bg-black/[0.02]" style={{ borderColor: c.border, color: c.text3, fontSize: "12px" }}>
                <Tag className="w-3.5 h-3.5" /> Labels
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border hover:bg-black/[0.02]" style={{ borderColor: c.border, color: c.text3, fontSize: "12px" }}>
                <Folder className="w-3.5 h-3.5" /> Project
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button className="px-4 py-1.5 rounded-[6px]" style={{ background: c.coral, color: "white", fontSize: "13px", fontWeight: 500 }}>Create Task</button>
              <button className="px-4 py-1.5 rounded-[6px] border" style={{ borderColor: c.border, color: c.text3, fontSize: "13px" }}>Cancel</button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 11. DATE PICKER + QUICK SELECT ═══════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
          <SectionTitle sub="Inline calendar widget.">Date Picker</SectionTitle>
          <MiniCalendar />
        </section>

        <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
          <SectionTitle sub="Preset date shortcuts.">Quick Date Select</SectionTitle>
          <div className="space-y-1">
            {[
              { label: "Today", sub: "Feb 25", icon: Clock, color: c.teal },
              { label: "Tomorrow", sub: "Feb 26", icon: CalendarBlank, color: c.indigo },
              { label: "Next Week", sub: "Mar 4", icon: CalendarBlank, color: c.gold },
              { label: "In 2 Weeks", sub: "Mar 11", icon: CalendarBlank, color: c.text3 },
              { label: "No Date", sub: "Remove due date", icon: X, color: c.text4 },
            ].map((preset) => (
              <button key={preset.label} className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-[6px] hover:bg-black/[0.03] transition-colors text-left">
                <preset.icon className="w-3.5 h-3.5" style={{ color: preset.color }} />
                <span className="flex-1" style={{ color: c.text2, fontSize: "12px", fontWeight: 500 }}>{preset.label}</span>
                <span style={{ color: c.text4, fontSize: "11px" }}>{preset.sub}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t" style={{ borderColor: c.border }}>
            <p className="mb-1.5" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>WITH TIME</p>
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Feb 26, 2026" className="flex-1 px-2.5 py-1 rounded-[6px] border outline-none" style={{ borderColor: c.border, fontSize: "12px", color: c.text1 }} />
              <input type="text" placeholder="5:00 PM" className="w-20 px-2.5 py-1 rounded-[6px] border outline-none" style={{ borderColor: c.border, fontSize: "12px", color: c.text1 }} />
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════ 12. KEYBOARD SHORTCUTS REFERENCE ═══════════ */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <SectionTitle sub="Keyboard shortcuts for power users.">Task Keyboard Shortcuts</SectionTitle>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Navigation",
              shortcuts: [
                { keys: "J / K", desc: "Next / previous task" },
                { keys: "Enter", desc: "Open task detail" },
                { keys: "Esc", desc: "Close detail pane" },
                { keys: "G then B", desc: "Go to board view" },
              ],
            },
            {
              title: "Actions",
              shortcuts: [
                { keys: "Ctrl+N", desc: "Create new task" },
                { keys: "Ctrl+D", desc: "Duplicate task" },
                { keys: "Ctrl+Shift+N", desc: "Add subtask" },
                { keys: "Del", desc: "Delete task" },
              ],
            },
            {
              title: "Quick Edit",
              shortcuts: [
                { keys: "F2", desc: "Edit title" },
                { keys: "L", desc: "Add label" },
                { keys: "P", desc: "Set priority" },
                { keys: "D", desc: "Set due date" },
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <SubLabel>{group.title.toUpperCase()}</SubLabel>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5 px-2 rounded-[6px] hover:bg-black/[0.02]">
                    <span style={{ color: c.text2, fontSize: "12px" }}>{s.desc}</span>
                    <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: c.border, color: c.text3, fontSize: "10px", fontFamily: "monospace", background: c.bg1 }}>{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ FLOATING CONTEXT MENU ═══════════ */}
      {contextMenu && (
        <div
          className="fixed z-50 w-[210px] rounded-[6px] border shadow-xl overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x, background: c.surface, borderColor: c.border }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { icon: Eye, label: "Open task", sep: false },
            { icon: PencilSimple, label: "Edit title", sep: false },
            { icon: Copy, label: "Duplicate", sep: false },
            { icon: LinkSimple, label: "Copy link", sep: true },
            { icon: UserPlus, label: "Assign to...", sep: false },
            { icon: Flag, label: "Set priority", sep: false },
            { icon: CalendarBlank, label: "Set due date", sep: false },
            { icon: Tag, label: "Add label", sep: true },
            { icon: ArrowSquareOut, label: "Move to...", sep: false },
            { icon: Archive, label: "Archive", sep: true },
            { icon: Trash, label: "Delete", sep: false, danger: true },
          ].map((item, i) => (
            <div key={i}>
              {item.sep && i > 0 && <div className="mx-2 my-1 h-px" style={{ background: c.border }} />}
              <button
                onClick={() => setContextMenu(null)}
                className="flex items-center gap-2.5 w-full px-3 py-[6px] text-left transition-colors hover:bg-black/[0.03]"
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: (item as any).danger ? c.coralMid : c.text3 }} />
                <span style={{ color: (item as any).danger ? c.coralMid : c.text2, fontSize: "12px" }}>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
