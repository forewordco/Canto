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
  User,
  Clock,
  ChatText,
  Paperclip,
  Flag,
  Tag,
  Circle,
  CheckCircle,
  ArrowSquareOut,
  X,
  Hash,
  LinkSimple,
  At,
  ListChecks,
  ChartBar,
  UsersThree,
  Folder,
  FlagPennant,
  Star,
  Square,
  CheckSquare,
  Diamond,
  Triangle,
  Tray,
  Envelope,
  EnvelopeOpen,
  ArrowBendUpLeft,
  ArrowBendUpRight,
  Archive,
  Trash,
  Prohibit,
  PauseCircle,
  Warning,
  PaperPlaneRight,
  Timer,
  Play,
  Pause,
  Stop,
  Smiley,
  ChatCircle,
  ArrowUp,
  Fire,
  Lightning,
  Minus,
  PaperPlaneTilt,
  TextB,
  TextItalic,
  ListNumbers,
  ListBullets,
  PushPin,
  ThumbsUp,
  ArrowsOut,
  ArrowLineRight,
  GitBranch,
  SidebarSimple,
  CircleHalf,
  FilePdf,
  Table,
} from "@phosphor-icons/react";
import imgGalleryThumb from "figma:asset/36678acf3cd584ac8dc9f61ecdb623ed90050e91.png";

/* ─── Helpers ─── */
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

function SectionLabel({ children }: { children: string }) {
  return (
    null
  );
}

function Avatar({ initials, bg, size = 24 }: { initials: string; bg: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: bg }}>
      <span style={{ color: "white", fontSize: `${Math.max(size * 0.38, 8)}px`, fontWeight: 600 }}>{initials}</span>
    </div>
  );
}

/* ─── Mini Calendar ─── */
function MiniCalendar() {
  const [month] = useState(1); // Feb
  const [selectedDay, setSelectedDay] = useState(23);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysInMonth = 28;
  const startDow = 0; // Feb 2026 starts on Sunday
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = 23;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full max-w-[260px]">
      <div className="flex items-center justify-between mb-2">
        <button className="p-1 rounded hover:bg-black/[0.04]"><CaretLeft className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
        <span style={{ color: c.text1, fontSize: "13px", fontWeight: 600 }}>{monthNames[month]} 2026</span>
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
            disabled={!day}
            className="h-7 w-7 mx-auto flex items-center justify-center rounded-[6px] transition-colors"
            style={{
              background: day === selectedDay ? c.coral : day === today && day !== selectedDay ? c.coralLight : "transparent",
              color: day === selectedDay ? "white" : day === today ? c.coralMid : day ? c.text2 : "transparent",
              fontSize: "11px",
              fontWeight: day === today || day === selectedDay ? 600 : 400,
              cursor: day ? "pointer" : "default",
            }}
          >
            {day ?? ""}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button className="flex-1 py-1 rounded-[6px] text-center" style={{ background: c.coral, color: "white", fontSize: "11px", fontWeight: 500 }}>
          Set Date
        </button>
        <button className="flex-1 py-1 rounded-[6px] text-center border" style={{ borderColor: c.border, color: c.text3, fontSize: "11px", fontWeight: 500 }}>
          Clear
        </button>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export function ProductPatterns() {
  const [expandedTask, setExpandedTask] = useState<number | null>(1);
  const [showTaskSidebar, setShowTaskSidebar] = useState(true);

  const tasks = [
    { id: 1, title: "Design new dashboard layout", type: "task" as const, assignee: "SC", assigneeBg: c.coral, priority: "High", priorityColor: c.coralLight, priorityFg: c.coralMid, status: "In Progress", statusColor: c.indigoLight, statusFg: c.indigoMid, dueDate: "Feb 26", project: "Website Redesign", subtasks: "3/5", comments: 4, attachments: 2, done: false },
    { id: 2, title: "Write API documentation", type: "subtask" as const, assignee: "JM", assigneeBg: c.indigo, priority: "Med", priorityColor: c.goldLight, priorityFg: c.goldMid, status: "To Do", statusColor: `oklch(0.94 0.008 260)`, statusFg: c.text3, dueDate: "Mar 1", project: "Backend v2", subtasks: "0/3", comments: 1, attachments: 0, done: false },
    { id: 3, title: "Fix navigation accessibility", type: "subtask" as const, assignee: "LP", assigneeBg: c.teal, priority: "High", priorityColor: c.coralLight, priorityFg: c.coralMid, status: "In Review", statusColor: c.goldLight, statusFg: c.goldMid, dueDate: "Feb 24", project: "Website Redesign", subtasks: "2/2", comments: 7, attachments: 1, done: false },
    { id: 4, title: "Update onboarding emails", type: "subtask" as const, assignee: "AK", assigneeBg: c.gold, priority: "Low", priorityColor: c.tealLight, priorityFg: c.tealMid, status: "Done", statusColor: c.tealLight, statusFg: c.tealMid, dueDate: "Feb 20", project: "Growth", subtasks: "4/4", comments: 2, attachments: 0, done: true },
    { id: 5, title: "Beta launch readiness", type: "milestone" as const, assignee: "BK", assigneeBg: "oklch(0.6 0.15 320)", priority: "High", priorityColor: c.coralLight, priorityFg: c.coralMid, status: "In Progress", statusColor: c.indigoLight, statusFg: c.indigoMid, dueDate: "Feb 28", project: "Backend v2", subtasks: "1/4", comments: 0, attachments: 3, done: false },
    { id: 6, title: "Q1 revenue target", type: "goal" as const, assignee: "SC", assigneeBg: c.coral, priority: "Med", priorityColor: c.goldLight, priorityFg: c.goldMid, status: "In Progress", statusColor: c.indigoLight, statusFg: c.indigoMid, dueDate: "Mar 31", project: "Growth", subtasks: "2/6", comments: 3, attachments: 1, done: false },
    { id: 7, title: "Vendor contract renewal — reply needed", type: "email" as const, assignee: "AK", assigneeBg: c.gold, priority: "High", priorityColor: c.coralLight, priorityFg: c.coralMid, status: "Needs Reply", statusColor: c.lavenderLight, statusFg: c.lavenderMid, dueDate: "Mar 1", project: "Operations", subtasks: null, comments: 2, attachments: 1, done: false },
  ];

  const projects = [
    { name: "Website Redesign", progress: 68, tasks: 24, completed: 16, members: ["SC", "LP", "JM"], color: c.coral, status: "On Track" },
    { name: "Backend v2", progress: 42, tasks: 18, completed: 7, members: ["JM", "BK"], color: c.indigo, status: "At Risk" },
    { name: "Growth Experiments", progress: 85, tasks: 12, completed: 10, members: ["AK", "SC"], color: c.teal, status: "On Track" },
  ];

  const activities = [
    { user: "SC", userBg: c.coral, action: "completed", target: "Design review for homepage", time: "2m ago", icon: CheckCircle, iconColor: c.teal },
    { user: "JM", userBg: c.indigo, action: "commented on", target: "API documentation", time: "15m ago", icon: ChatText, iconColor: c.indigo },
    { user: "LP", userBg: c.teal, action: "moved", target: "Nav accessibility → In Review", time: "1h ago", icon: ArrowSquareOut, iconColor: c.gold },
    { user: "AK", userBg: c.gold, action: "created", target: "Email template draft", time: "3h ago", icon: Plus, iconColor: c.coral },
    { user: "BK", userBg: "oklch(0.6 0.15 320)", action: "attached 3 files to", target: "Performance audit", time: "5h ago", icon: Paperclip, iconColor: c.text3 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.indigo }} />
          <p style={{ color: c.indigoMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>PRODUCT PATTERNS</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Product Patterns</h1>
        <p className="mt-2 max-w-2xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Asana-inspired compound components — task detail panes, date pickers, project overviews, and activity feeds.
        </p>
      </div>

      {/* ──────── BREADCRUMBS ──────── */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Breadcrumbs</h2>
        <p className="mt-0.5 mb-3" style={{ color: c.text3, fontSize: "13px" }}>Contextual navigation hierarchy.</p>

        <div className="flex items-center gap-1 flex-wrap" style={{ fontSize: "12px" }}>
          {["My Workspace", "Website Redesign", "Sprint 4", "Design Tasks"].map((crumb, i, arr) => (
            <span key={crumb} className="flex items-center gap-1">
              <button className="px-1.5 py-0.5 rounded hover:bg-black/[0.04] transition-colors"
                style={{ color: i === arr.length - 1 ? c.text1 : c.text3, fontWeight: i === arr.length - 1 ? 500 : 400 }}>
                {crumb}
              </button>
              {i < arr.length - 1 && <CaretRight className="w-3 h-3" style={{ color: c.text4 }} />}
            </span>
          ))}
        </div>
      </section>

      {/* ──────── TASK TYPES ──────── */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Task Types &amp; Shapes</h2>
          </div>
          <span className="px-1.5 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>Legend</span>
        </div>
        <div className="px-4 py-4">
          <p className="mb-3" style={{ color: c.text3, fontSize: "13px", lineHeight: 1.5 }}>
            Each work item type uses a distinct shape for quick visual recognition. Shapes change color on completion.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
            {[
              { icon: Circle, label: "Task", desc: "Standard work item", color: c.text4 },
              { icon: Square, label: "Subtask", desc: "Child of a task", color: c.text4 },
              { icon: Diamond, label: "Milestone", desc: "Key deliverable", color: c.text4 },
              { icon: Triangle, label: "Goal", desc: "Strategic objective", color: c.text4 },
              { icon: Tray, label: "Email", desc: "Inbox item", color: c.text4 },
            ].map((t) => (
              <div key={t.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-[6px]" style={{ background: c.bg1 }}>
                <t.icon className="w-5 h-5 shrink-0" style={{ color: t.color }} />
                <div>
                  <p style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>{t.label}</p>
                  <p style={{ color: c.text4, fontSize: "10px" }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Email Inbox Pattern ── */}
          <SectionLabel>EMAIL INBOX</SectionLabel>
          <div className="rounded-[6px] border overflow-hidden" style={{ borderColor: c.border }}>
            {/* Inbox toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: c.border, background: c.bg1 }}>
              <div className="flex items-center gap-2">
                <Tray className="w-4 h-4" style={{ color: c.indigo }} />
                <span style={{ color: c.text1, fontSize: "13px", fontWeight: 600 }}>Inbox</span>
                <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.coralLight, color: c.coralMid, fontSize: "10px", fontWeight: 600 }}>6</span>
              </div>
              <div className="flex items-center gap-1">
                {[
                  { label: "All", active: true },
                  { label: "Unread", active: false },
                  { label: "Flagged", active: false },
                ].map((tab) => (
                  <button key={tab.label} className="px-2 py-0.5 rounded-[6px]" style={{
                    background: tab.active ? c.indigoLight : "transparent",
                    color: tab.active ? c.indigoMid : c.text4,
                    fontSize: "11px",
                    fontWeight: tab.active ? 500 : 400,
                  }}>{tab.label}</button>
                ))}
              </div>
            </div>

            {/* Column headers */}
            <div className="flex items-stretch border-b" style={{ borderColor: c.border, background: c.bg1 }}>
              <span className="flex-1 flex items-center px-3 py-1 border-r" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: c.borderSubtle }}>MESSAGE</span>
              <div className="shrink-0 grid items-stretch" style={{ gridTemplateColumns: "80px 64px 60px 28px" }}>
                <span className="flex items-center justify-center border-r" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: c.borderSubtle }}>STATUS</span>
                <span className="flex items-center justify-center border-r" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: c.borderSubtle }}>FROM</span>
                <span className="flex items-center justify-center" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>TIME</span>
                <span />
              </div>
            </div>

            {/* Email rows */}
            {[
              { id: 1, subject: "Re: Q1 budget approval needed", from: "SC", fromBg: c.coral, time: "9:12 AM", status: "In Progress", statusColor: c.indigoLight, statusFg: c.indigoMid, unread: true, flagged: true, hasReply: true, snippet: "I've attached the updated figures..." },
              { id: 2, subject: "Deployment pipeline blocked — staging env", from: "BK", fromBg: "oklch(0.6 0.15 320)", time: "8:45 AM", status: "Blocked", statusColor: c.coralLight, statusFg: c.coralMid, unread: true, flagged: false, hasReply: false, snippet: "CI/CD failing on staging after the infra..." },
              { id: 3, subject: "Design review: new component library", from: "LP", fromBg: c.teal, time: "Yest.", status: "On Hold", statusColor: c.goldLight, statusFg: c.goldMid, unread: false, flagged: true, hasReply: true, snippet: "Pausing until we finalize the color tokens..." },
              { id: 4, subject: "Sprint retro notes — Feb 20", from: "JM", fromBg: c.indigo, time: "Yest.", status: "Done", statusColor: c.tealLight, statusFg: c.tealMid, unread: false, flagged: false, hasReply: false, snippet: "Action items from the retro are captured..." },
              { id: 5, subject: "Vendor contract renewal — action required", from: "AK", fromBg: c.gold, time: "Feb 21", status: "Needs Reply", statusColor: c.lavenderLight, statusFg: c.lavenderMid, unread: true, flagged: true, hasReply: false, snippet: "The renewal deadline is March 1, please..." },
              { id: 6, subject: "Weekly analytics digest", from: "SYS", fromBg: c.text4, time: "Feb 20", status: "Archived", statusColor: c.bg2, statusFg: c.text4, unread: false, flagged: false, hasReply: false, snippet: "Your weekly dashboard metrics summary..." },
            ].map((email) => (
              <div
                key={email.id}
                className="flex items-stretch border-b last:border-b-0 hover:bg-black/[0.015] transition-colors cursor-pointer group"
                style={{ borderColor: c.border, background: email.unread ? "oklch(0.55 0.2 280 / 0.03)" : "transparent" }}
              >
                <div className="flex-1 flex items-center gap-2 px-3 py-2 border-r min-w-0" style={{ borderColor: c.borderSubtle }}>
                  {/* Email icon */}
                  <div className="shrink-0">
                    {email.status === "Done" || email.status === "Archived" ? (
                      <EnvelopeOpen className="w-4 h-4" style={{ color: email.status === "Done" ? c.teal : c.text4 }} />
                    ) : (
                      <Envelope className="w-4 h-4" style={{ color: email.unread ? c.indigo : "oklch(0.8 0.01 260)" }} />
                    )}
                  </div>
                  {/* Unread dot */}
                  {email.unread && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.indigo }} />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ color: email.unread ? c.text1 : c.text3, fontSize: "13px", fontWeight: email.unread ? 500 : 400 }}>{email.subject}</p>
                    <p className="truncate" style={{ color: c.text4, fontSize: "11px" }}>{email.snippet}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {email.flagged && <Flag className="w-3 h-3" style={{ color: c.coral }} />}
                    {email.hasReply && <ArrowBendUpLeft className="w-3 h-3" style={{ color: c.text4 }} />}
                  </div>
                </div>
                <div className="shrink-0 grid items-stretch" style={{ gridTemplateColumns: "80px 64px 60px 28px" }}>
                  <span className="flex items-center justify-center border-r" style={{ borderColor: c.borderSubtle }}>
                    <span className="px-2 py-0.5 rounded-full" style={{ background: email.statusColor, color: email.statusFg, fontSize: "10px", fontWeight: 500, whiteSpace: "nowrap" }}>{email.status}</span>
                  </span>
                  <span className="flex items-center justify-center border-r" style={{ borderColor: c.borderSubtle }}>
                    <Avatar initials={email.from} bg={email.fromBg} size={20} />
                  </span>
                  <span className="flex items-center justify-center" style={{ color: c.text4, fontSize: "11px" }}>{email.time}</span>
                  <button onClick={(e) => e.stopPropagation()} className="flex items-center justify-center p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/[0.04]">
                    <DotsThree className="w-3.5 h-3.5" style={{ color: c.text4 }} />
                  </button>
                </div>
              </div>
            ))}

            {/* Inbox actions bar */}
            <div className="flex items-center gap-1 px-3 py-2 border-t" style={{ borderColor: c.border, background: c.bg1 }}>
              {[
                { icon: ArrowBendUpLeft, label: "Reply" },
                { icon: ArrowBendUpRight, label: "Forward" },
                { icon: Archive, label: "Archive" },
                { icon: PauseCircle, label: "Hold" },
                { icon: Prohibit, label: "Block" },
                { icon: Trash, label: "Delete" },
              ].map((action) => (
                <button key={action.label} className="flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-black/[0.04] transition-colors" style={{ color: c.text3, fontSize: "11px" }}>
                  <action.icon className="w-3 h-3" /> {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status legend for email */}
          <div className="mt-4">
            <SectionLabel>EMAIL STATUS STATES</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "In Progress", bg: c.indigoLight, fg: c.indigoMid, desc: "Being handled" },
                { label: "Blocked", bg: c.coralLight, fg: c.coralMid, desc: "Waiting on dependency" },
                { label: "On Hold", bg: c.goldLight, fg: c.goldMid, desc: "Paused intentionally" },
                { label: "Needs Reply", bg: c.lavenderLight, fg: c.lavenderMid, desc: "Awaiting your response" },
                { label: "Done", bg: c.tealLight, fg: c.tealMid, desc: "Completed / resolved" },
                { label: "Archived", bg: c.bg2, fg: c.text4, desc: "Filed for reference" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-[6px] border" style={{ borderColor: c.borderSubtle }}>
                  <span className="px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg, fontSize: "10px", fontWeight: 500 }}>{s.label}</span>
                  <span style={{ color: c.text4, fontSize: "10px" }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────── TASK LIST ──────── */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Task List</h2>
            <span className="px-1.5 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px", fontWeight: 500 }}>
              {tasks.length}
            </span>
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

        {/* Section divider */}
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
          >
            <div className="flex-1 flex items-center gap-2 px-4 py-1.5 border-r min-w-0" style={{ borderColor: c.borderSubtle }}>
              <button onClick={(e) => { e.stopPropagation(); }} className="shrink-0 flex items-center justify-center">
                {task.done ? (
                  task.type === "subtask" ? <CheckSquare className="w-4 h-4" style={{ color: c.teal }} /> :
                  task.type === "milestone" ? <Diamond className="w-4 h-4" style={{ color: c.teal }} /> :
                  task.type === "goal" ? <Triangle className="w-4 h-4" style={{ color: c.teal }} /> :
                  task.type === "email" ? <EnvelopeOpen className="w-4 h-4" style={{ color: c.teal }} /> :
                  <CheckCircle className="w-4 h-4" style={{ color: c.teal }} />
                ) : (
                  task.type === "subtask" ? <Square className="w-4 h-4" style={{ color: "oklch(0.8 0.01 260)" }} /> :
                  task.type === "milestone" ? <Diamond className="w-4 h-4" style={{ color: "oklch(0.8 0.01 260)" }} /> :
                  task.type === "goal" ? <Triangle className="w-4 h-4" style={{ color: "oklch(0.8 0.01 260)" }} /> :
                  task.type === "email" ? <Tray className="w-4 h-4" style={{ color: "oklch(0.8 0.01 260)" }} /> :
                  <Circle className="w-4 h-4" style={{ color: "oklch(0.8 0.01 260)" }} />
                )}
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
              <span className="flex items-center justify-center border-r" style={{ borderColor: c.borderSubtle }}><span className="px-1.5 py-0.5 rounded" style={{ background: task.priorityColor, color: task.priorityFg, fontSize: "10px", fontWeight: 500 }}>{task.priority}</span></span>
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

      {/* ──────── TASK DETAIL PANE ──────── */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        {/* Section title */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Task Detail Pane</h2>
        </div>

        {/* ── Top toolbar breadcrumb bar ── */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "12px", color: c.text4 }}>Website Redesign</span>
            <span style={{ fontSize: "12px", color: c.text4 }}>/</span>
            <span style={{ fontSize: "12px", color: c.text4 }}>Sprint 4</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Like"><ThumbsUp className="w-4 h-4" style={{ color: c.text4 }} /></button>
            <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Attach"><Paperclip className="w-4 h-4" style={{ color: c.text4 }} /></button>
            <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Subtasks"><GitBranch className="w-4 h-4" style={{ color: c.text4 }} /></button>
            <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Copy link"><LinkSimple className="w-4 h-4" style={{ color: c.text4 }} /></button>
            <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Full screen"><ArrowsOut className="w-4 h-4" style={{ color: c.text4 }} /></button>
            <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="More actions"><DotsThree className="w-4 h-4" style={{ color: c.text4 }} /></button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row" style={{ minHeight: "750px" }}>
          {/* ── Left column: task details ── */}
          <div className="flex-1 min-w-0 md:border-r overflow-y-auto" style={{ borderColor: c.border }}>
            <div className="px-6 py-5">
              {/* Status badges + date row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  {/* In-Progress badge */}
                  <div className="inline-flex items-center gap-1 rounded-[6px] px-[8px] py-[4px]" style={{ background: "oklch(0.88 0.08 195)", border: "1px solid oklch(0.7 0.12 195)" }}>
                    <CircleHalf className="w-4 h-4" style={{ color: "oklch(0.35 0.08 195)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "oklch(0.35 0.08 195)" }}>In-Progress</span>
                  </div>
                  {/* Pre-Production pill */}
                  <div className="inline-flex items-center rounded-full py-[4px] px-[10px]" style={{ background: c.indigoLight }}><span style={{ fontSize: "12px", fontWeight: 500, color: c.indigoMid }}>Pre-Production</span></div>
                  {/* Flag icon */}
                  <Flag className="w-[17px] h-[17px]" style={{ color: c.text4 }} />
                </div>
                <div className="flex items-center gap-2.5">
                  {/* Date range */}
                  <div className="inline-flex items-center gap-[5px] px-2 py-1" style={{ background: c.bg1, border: `1px solid ${c.border}` }}>
                    <CalendarBlank className="w-3.5 h-3.5" style={{ color: c.text4 }} />
                    <span style={{ fontSize: "13px", color: c.text3 }}> Start </span>
                    <span style={{ fontSize: "13px", color: c.text4 }}>→</span>
                    <CalendarBlank className="w-3.5 h-3.5" style={{ color: c.text4 }} />
                    <span style={{ fontSize: "13px", color: c.text3 }}> Feb 26</span>
                  </div>
                  {/* Assignee avatar */}
                  <Avatar initials="SC" bg={c.coral} size={22} />
                </div>
              </div>

              {/* Task title */}
              <h3 style={{ color: c.text1, fontSize: "20px", fontWeight: 600, lineHeight: 1.3 }}>Design new dashboard layout</h3>

              {/* ── Description ── */}
              <div className="mt-2 mb-5" style={{ color: c.text2, fontSize: "13px", lineHeight: 1.7 }}>
                <p>
                  Create a new dashboard layout that provides a clear overview of <span style={{ fontWeight: 600, color: c.text1 }}>project progress</span>, team activity, and upcoming deadlines. Reference the Asana-style grid layout for inspiration.
                </p>
                <p className="mt-3">Key requirements:</p>
                <ul className="mt-1 ml-4 space-y-0.5" style={{ listStyleType: "disc" }}>
                  <li>Widget-based layout with <span style={{ color: c.indigoMid, fontWeight: 500 }}>drag-and-drop</span> reordering</li>
                  <li>Real-time activity feed in the right rail</li>
                  <li>Support for <span style={{ fontWeight: 600, color: c.text1 }}>dark mode</span> variant</li>
                  <li>Responsive breakpoints: desktop, tablet, mobile</li>
                </ul>
              </div>

              {/* ── Subtasks ── */}
              <div>
                <div className="flex items-center justify-between mb-[5px]">
                  <span style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Subtasks</span>
                  <span style={{ fontSize: "12px", color: c.text4 }}>3 of 5</span>
                </div>

                <div>
                  {([
                    { label: "Wireframe layout options", done: true, assignee: "SC", assigneeBg: c.coral },
                    { label: "Design high-fidelity mockups", done: true, assignee: "SC", assigneeBg: c.coral },
                    { label: "Prototype micro-interactions", done: true, assignee: "JM", assigneeBg: c.indigo },
                    { label: "Get stakeholder feedback", done: false, assignee: "SC", assigneeBg: c.coral },
                  ] as const).map((st) => (
                    <div key={st.label} className="flex items-center gap-2 py-[7px]" style={{ borderBottom: `1px solid ${c.borderSubtle}` }}>
                      {st.done
                        ? <CheckSquare weight="fill" className="w-4 h-4 shrink-0" style={{ color: "oklch(0.6 0.15 165)" }} />
                        : <Square className="w-4 h-4 shrink-0" style={{ color: c.text4 }} />}
                      <span className={`flex-1 min-w-0 truncate ${st.done ? "line-through" : ""}`} style={{ fontSize: "13px", color: st.done ? c.text4 : c.text2 }}>
                        {st.label}
                      </span>
                      <Avatar initials={st.assignee} bg={st.assigneeBg!} size={20} />
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-1.5 mt-1 py-1.5 rounded-[6px] hover:bg-black/[0.02]" style={{ color: c.text4, fontSize: "12px" }}>
                  <Plus className="w-3 h-3" /> Add Task
                </button>
              </div>

              {/* ── Attachments (inline in task body) ── */}
              <div className="mt-6">
                <span style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Attachments</span>
                <div className="flex flex-wrap gap-2.5 mt-2">
                  {/* Image Gallery chip */}
                  <button className="flex-1 min-w-0 flex items-center gap-2.5 pl-[7px] pr-4 py-[7px] rounded-[6px] border hover:shadow-sm transition-all" style={{ borderColor: c.border, background: c.surface }}>
                    <img src={imgGalleryThumb} alt="Gallery" className="w-9 h-9 rounded-[6px] object-cover shrink-0" />
                    <div className="text-left">
                      <span className="block" style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>Image Gallery</span>
                      <span className="block" style={{ color: c.text4, fontSize: "11px", fontWeight: 500 }}>7 images</span>
                    </div>
                  </button>

                  {/* Travel Details chip */}
                  <button className="flex-1 min-w-0 flex items-center gap-2.5 pl-[7px] pr-4 py-[7px] rounded-[6px] border hover:shadow-sm transition-all" style={{ borderColor: c.border, background: c.surface }}>
                    <div className="w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: "oklch(0.85 0.1 170 / 0.25)" }}>
                      <Table size={18} style={{ color: "oklch(0.4 0.1 170)" }} />
                    </div>
                    <div className="text-left">
                      <span className="block" style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>Travel Details</span>
                      <span className="block" style={{ color: c.text4, fontSize: "11px", fontWeight: 500 }}>6 items · $5,840.41</span>
                    </div>
                  </button>

                  {/* Brand Guide.pdf chip */}
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

          {/* ── Right column: Activity ── */}
          <div className="flex flex-col md:w-[400px] shrink-0" style={{ background: c.bg1 }}>
            {/* Activity header + log entries */}
            <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "14px", fontWeight: 600, color: c.text1 }}>Activity</span>
                <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]"><MagnifyingGlass className="w-4 h-4" style={{ color: c.text4 }} /></button>
              </div>
              {/* Log entries */}
              <div className="space-y-1">
                <div className="flex items-start gap-3.5">
                  <div className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.text4 }} />
                  <div>
                    <span style={{ fontSize: "12px", color: c.text2 }}>
                      <span style={{ fontWeight: 600, color: c.text1 }}>Lena Kim</span> completed subtask "Prototype micro-interactions"
                    </span>
                    <span className="block" style={{ fontSize: "11px", color: c.text4 }}>45 min ago</span>
                  </div>
                </div>
                <div className="flex items-start gap-3.5">
                  <div className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.text4 }} />
                  <div>
                    <span style={{ fontSize: "12px", color: c.text2 }}>
                      <span style={{ fontWeight: 600, color: c.text1 }}>Sarah Chen</span> changed status from To Do to In Progress
                    </span>
                    <span className="block" style={{ fontSize: "11px", color: c.text4 }}>3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable comment thread */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
              {/* Jake Martinez comment */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Avatar initials="JM" bg={c.indigo} size={22} />
                  <span style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>Jake Martinez</span>
                  <span style={{ color: c.text4, fontSize: "11px" }}>1 hour ago</span>
                </div>
                <p className="ml-[28px]" style={{ color: c.text2, fontSize: "13px", lineHeight: 1.6 }}>
                  Looks great! One small note — can we bump the CTA contrast slightly? The collapsed sidebar variant would be nice to explore.
                </p>
              </div>

              {/* Sarah Chen comment */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Avatar initials="SC" bg={c.coral} size={22} />
                  <span style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>Sarah Chen</span>
                  <span style={{ color: c.text4, fontSize: "11px" }}>2 hours ago</span>
                </div>
                <p className="ml-[28px]" style={{ color: c.text2, fontSize: "12px", lineHeight: 1.5 }}>
                  I've updated the wireframes with the new sidebar layout. The hero section now uses the illustration style from the brand guide. Can everyone take a look before our review tomorrow?
                </p>
                <div className="flex items-center gap-2 mt-1.5 ml-[28px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: c.coralLight, fontSize: "11px" }}>
                    <span style={{ fontSize: "12px" }}>👍</span> <span style={{ color: c.text3 }}>2</span>
                  </span>
                  <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: c.text3, fontSize: "11px" }}>
                    <Smiley className="w-3 h-3" /> React
                  </button>
                  <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: c.text3, fontSize: "11px" }}>
                    <ChatCircle className="w-3 h-3" /> Reply
                  </button>
                </div>
              </div>

              {/* Jake Martinez comment */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Avatar initials="JM" bg={c.indigo} size={22} />
                  <span style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>Jake Martinez</span>
                  <span style={{ color: c.text4, fontSize: "11px" }}>1 hour ago</span>
                </div>
                <p className="ml-[28px]" style={{ color: c.text2, fontSize: "13px", lineHeight: 1.6 }}>
                  Looks great! One small note — can we bump the CTA contrast slightly? The collapsed sidebar variant would be nice to explore.
                </p>
              </div>

              {/* Sarah Chen comment */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Avatar initials="SC" bg={c.coral} size={22} />
                  <span style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>Sarah Chen</span>
                  <span style={{ color: c.text4, fontSize: "11px" }}>2 hours ago</span>
                </div>
                <p className="ml-[28px]" style={{ color: c.text2, fontSize: "12px", lineHeight: 1.5 }}>
                  I've updated the wireframes with the new sidebar layout. The hero section now uses the illustration style from the brand guide. Can everyone take a look before our review tomorrow?
                </p>
                <div className="flex items-center gap-2 mt-1.5 ml-[28px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: c.coralLight, fontSize: "11px" }}>
                    <span style={{ fontSize: "12px" }}>👍</span> <span style={{ color: c.text3 }}>2</span>
                  </span>
                  <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: c.text3, fontSize: "11px" }}>
                    <Smiley className="w-3 h-3" /> React
                  </button>
                  <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: c.text3, fontSize: "11px" }}>
                    <ChatCircle className="w-3 h-3" /> Reply
                  </button>
                </div>
              </div>
            </div>

            {/* Comment input at bottom */}
            <div className="px-4 py-3 border-t" style={{ background: c.bg1, borderColor: c.border }}>
              <div className="rounded-[6px] border overflow-hidden" style={{ borderColor: c.border, background: c.surface }}>
                <div className="px-3 py-2">
                  <p style={{ fontSize: "13px", color: "oklch(0.2 0.02 260 / 0.5)" }}>Mention @Brain to create, find, ask anything</p>
                </div>
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-t" style={{ borderColor: c.borderSubtle }}>
                  <button className="p-1 rounded-[6px] hover:bg-black/[0.04]"><Plus className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
                  <button className="px-2.5 py-0.5 rounded-[6px] flex items-center gap-1 border" style={{ borderColor: c.border, fontSize: "12px", fontWeight: 500, color: c.text2 }}>
                    <ChatCircle className="w-3 h-3" /> Comment <CaretDown className="w-2.5 h-2.5" style={{ color: c.text4 }} />
                  </button>
                  <div className="w-px h-3.5 mx-1" style={{ background: c.border }} />
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

      {/* ──────── DATE PICKER ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Date Picker</h2>
          <p className="mt-0.5 mb-3" style={{ color: c.text3, fontSize: "13px" }}>Inline calendar widget.</p>
          <MiniCalendar />
        </section>

        {/* Due date presets */}
        <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Quick Date Select</h2>
          <p className="mt-0.5 mb-3" style={{ color: c.text3, fontSize: "13px" }}>Preset date shortcuts.</p>

          <div className="space-y-1">
            {[
              { label: "Today", sub: "Feb 23", icon: Clock, color: c.teal },
              { label: "Tomorrow", sub: "Feb 24", icon: CalendarBlank, color: c.indigo },
              { label: "Next Week", sub: "Mar 2", icon: CalendarBlank, color: c.gold },
              { label: "In 2 Weeks", sub: "Mar 9", icon: CalendarBlank, color: c.text3 },
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

      {/* ──────── PROJECT OVERVIEW ──────── */}
      <section>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Project Overview</h2>
        <p className="mt-0.5 mb-3" style={{ color: c.text3, fontSize: "13px" }}>Dashboard-style project cards.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {projects.map((proj) => (
            <div key={proj.name} className="rounded-[6px] border p-4 hover:shadow-sm transition-shadow" style={{ background: c.surface, borderColor: c.border }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: proj.color }} />
                  <h4 style={{ color: c.text1, fontSize: "14px", fontWeight: 600 }}>{proj.name}</h4>
                </div>
                <span className="px-1.5 py-0.5 rounded-full" style={{
                  background: proj.status === "On Track" ? c.tealLight : c.coralLight,
                  color: proj.status === "On Track" ? c.tealMid : c.coralMid,
                  fontSize: "10px", fontWeight: 500
                }}>{proj.status}</span>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: c.text3, fontSize: "11px" }}>Progress</span>
                  <span style={{ color: c.text2, fontSize: "11px", fontWeight: 600 }}>{proj.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: c.bg2 }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${proj.progress}%`, background: proj.color }} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-[6px] p-2" style={{ background: c.bg1 }}>
                  <p style={{ color: c.text4, fontSize: "10px" }}>Total Tasks</p>
                  <p style={{ color: c.text1, fontSize: "18px", fontWeight: 700 }}>{proj.tasks}</p>
                </div>
                <div className="rounded-[6px] p-2" style={{ background: c.bg1 }}>
                  <p style={{ color: c.text4, fontSize: "10px" }}>Completed</p>
                  <p style={{ color: c.text1, fontSize: "18px", fontWeight: 700 }}>{proj.completed}</p>
                </div>
              </div>

              {/* Team */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {proj.members.map((m, i) => (
                    <Avatar key={i} initials={m} bg={[c.coral, c.indigo, c.teal, c.gold][i % 4]} size={22} />
                  ))}
                </div>
                <button className="flex items-center gap-0.5 px-2 py-0.5 rounded hover:bg-black/[0.04]" style={{ color: c.text3, fontSize: "11px" }}>
                  View <ArrowSquareOut className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────── MILESTONE TIMELINE ──────── */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Milestone Timeline</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Project milestones and deliverables.</p>

        <div className="relative ml-3">
          <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: c.border }} />
          {[
            { title: "Project Kickoff", date: "Feb 3", status: "done", desc: "Requirements gathered and team assigned" },
            { title: "Design Phase Complete", date: "Feb 17", status: "done", desc: "All mockups approved by stakeholders" },
            { title: "Development Sprint 1", date: "Feb 28", status: "current", desc: "Core features and API integration" },
            { title: "QA & Testing", date: "Mar 10", status: "upcoming", desc: "Full regression and accessibility audit" },
            { title: "Launch", date: "Mar 20", status: "upcoming", desc: "Production deployment and monitoring" },
          ].map((ms, i) => (
            <div key={ms.title} className="relative flex gap-3 pb-4 last:pb-0">
              <div className="relative z-10 mt-0.5 shrink-0">
                {ms.status === "done" ? (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: c.teal }}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                ) : ms.status === "current" ? (
                  <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: c.coral, background: c.surface }}>
                    <div className="w-1.5 h-1.5 rounded-full m-[3px]" style={{ background: c.coral }} />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: c.border, background: c.surface }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ color: ms.status === "upcoming" ? c.text4 : c.text1, fontSize: "13px", fontWeight: 500 }}>{ms.title}</span>
                  {ms.status === "current" && <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.coralLight, color: c.coralMid, fontSize: "9px", fontWeight: 600 }}>Current</span>}
                </div>
                <p style={{ color: c.text4, fontSize: "11px" }}>{ms.date} &middot; {ms.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────── ACTIVITY FEED ──────── */}
      <section className="rounded-[6px] border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Activity Feed</h2>
          <button className="px-2 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>All Activity</button>
        </div>
        <div>
          {activities.map((act, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-2.5 border-b last:border-b-0 hover:bg-black/[0.01]" style={{ borderColor: c.border }}>
              <Avatar initials={act.user} bg={act.userBg} size={24} />
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "12px", lineHeight: 1.5 }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>{act.user}</span>
                  <span style={{ color: c.text3 }}> {act.action} </span>
                  <span style={{ color: c.text2, fontWeight: 500 }}>{act.target}</span>
                </p>
                <span style={{ color: c.text4, fontSize: "10px" }}>{act.time}</span>
              </div>
              <act.icon className="w-3.5 h-3.5 mt-1 shrink-0" style={{ color: act.iconColor }} />
            </div>
          ))}
        </div>
      </section>

      {/* ──────── COMMAND PALETTE ──────── */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Command Palette</h2>
        <p className="mt-0.5 mb-3" style={{ color: c.text3, fontSize: "13px" }}>Quick search and action launcher.</p>

        <div className="max-w-lg mx-auto rounded-[6px] border shadow-lg overflow-hidden" style={{ borderColor: c.border }}>
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: c.border }}>
            <MagnifyingGlass className="w-4 h-4" style={{ color: c.text4 }} />
            <input type="text" placeholder="Search tasks, projects, or type a command..." className="flex-1 outline-none bg-transparent" style={{ fontSize: "13px", color: c.text1 }} />
            <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: c.border, color: c.text4, fontSize: "10px", fontFamily: "monospace" }}>ESC</kbd>
          </div>
          <div>
            <p className="px-3 pt-2 pb-1" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>RECENT</p>
            {[
              { icon: CheckCircle, label: "Design new dashboard layout", sub: "Website Redesign", color: c.coral },
              { icon: Folder, label: "Backend v2", sub: "Project", color: c.indigo },
              { icon: UsersThree, label: "Team standup notes", sub: "General", color: c.teal },
            ].map((item, i) => (
              <button key={i} className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-black/[0.03] transition-colors text-left" style={{ background: i === 0 ? "oklch(0.97 0.005 260)" : "transparent" }}>
                <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                <span className="flex-1 truncate" style={{ color: c.text2, fontSize: "12px" }}>{item.label}</span>
                <span style={{ color: c.text4, fontSize: "10px" }}>{item.sub}</span>
              </button>
            ))}
            <p className="px-3 pt-2 pb-1" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>ACTIONS</p>
            {[
              { icon: Plus, label: "Create new task", shortcut: "Ctrl+N" },
              { icon: MagnifyingGlass, label: "Search everything", shortcut: "Ctrl+K" },
              { icon: ChartBar, label: "View analytics", shortcut: "Ctrl+A" },
            ].map((item) => (
              <button key={item.label} className="flex items-center gap-2.5 w-full px-3 py-1.5 hover:bg-black/[0.03] transition-colors text-left">
                <item.icon className="w-3.5 h-3.5" style={{ color: c.text4 }} />
                <span className="flex-1" style={{ color: c.text2, fontSize: "12px" }}>{item.label}</span>
                <kbd className="px-1 py-0.5 rounded border" style={{ borderColor: c.border, color: c.text4, fontSize: "9px", fontFamily: "monospace" }}>{item.shortcut}</kbd>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t flex items-center gap-3" style={{ borderColor: c.border, background: c.bg1 }}>
            {[
              { label: "Navigate", keys: "↑↓" },
              { label: "Open", keys: "↵" },
              { label: "Close", keys: "Esc" },
            ].map((hint) => (
              <span key={hint.label} className="flex items-center gap-1" style={{ color: c.text4, fontSize: "10px" }}>
                <kbd className="px-1 rounded" style={{ background: c.bg2, fontSize: "9px", fontFamily: "monospace" }}>{hint.keys}</kbd>
                {hint.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ──────── PROGRESS INDICATORS ──────── */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Progress Indicators</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Different styles for showing completion.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Linear */}
          <div>
            <SectionLabel>LINEAR</SectionLabel>
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

          {/* Circular */}
          <div>
            <SectionLabel>CIRCULAR</SectionLabel>
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

          {/* Step */}
          <div>
            <SectionLabel>STEPS</SectionLabel>
            <div className="space-y-1.5">
              {[
                { label: "Planning", done: true },
                { label: "Design", done: true },
                { label: "Development", done: false, current: true },
                { label: "Testing", done: false },
                { label: "Launch", done: false },
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

      {/* ──────── NOTIFICATION PANEL ──────── */}
      <section className="rounded-[6px] border overflow-hidden max-w-sm" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: c.border }}>
          <span style={{ color: c.text1, fontSize: "14px", fontWeight: 600 }}>Notifications</span>
          <div className="flex items-center gap-1">
            <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.coralLight, color: c.coralMid, fontSize: "10px", fontWeight: 600 }}>4 new</span>
            <button className="px-1.5 py-0.5 rounded hover:bg-black/[0.04]" style={{ color: c.text4, fontSize: "10px" }}>Mark all read</button>
          </div>
        </div>
        {[
          { user: "SC", bg: c.coral, text: "assigned you a task", target: "Design review", time: "2m", unread: true },
          { user: "JM", bg: c.indigo, text: "commented", target: "API docs", time: "15m", unread: true },
          { user: "LP", bg: c.teal, text: "completed", target: "Nav fix", time: "1h", unread: false },
          { user: "AK", bg: c.gold, text: "mentioned you in", target: "Sprint retro", time: "3h", unread: false },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-2 px-3 py-2 border-b last:border-b-0 hover:bg-black/[0.01]"
            style={{ borderColor: c.border, background: n.unread ? "oklch(0.7 0.18 25 / 0.02)" : "transparent" }}>
            <Avatar initials={n.user} bg={n.bg} size={22} />
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: "11px", lineHeight: 1.5 }}>
                <span style={{ color: c.text1, fontWeight: 500 }}>{n.user}</span>
                <span style={{ color: c.text3 }}> {n.text} </span>
                <span style={{ color: c.text2, fontWeight: 500 }}>{n.target}</span>
              </p>
              <span style={{ color: c.text4, fontSize: "10px" }}>{n.time} ago</span>
            </div>
            {n.unread && <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: c.coral }} />}
          </div>
        ))}
      </section>

      {/* ──────── COLOR-CODED LABELS ──────── */}
      <section className="rounded-[6px] p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Color-Coded Labels</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Full-spectrum tags, categories, and project labels using the expanded OKLCH palette.</p>

        <div className="space-y-4">
          <div>
            <SectionLabel>PROJECT LABELS</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Design", bg: c.coralLight, fg: c.coralMid },
                { label: "Backend", bg: c.indigoLight, fg: c.indigoMid },
                { label: "QA", bg: c.tealLight, fg: c.tealMid },
                { label: "Planning", bg: c.goldLight, fg: c.goldMid },
                { label: "Infra", bg: c.orangeLight, fg: c.orangeMid },
                { label: "Growth", bg: c.limeLight, fg: c.limeMid },
                { label: "Platform", bg: c.emeraldLight, fg: c.emeraldMid },
                { label: "Data", bg: c.cyanLight, fg: c.cyanMid },
                { label: "Research", bg: c.lavenderLight, fg: c.lavenderMid },
                { label: "Branding", bg: c.magentaLight, fg: c.magentaMid },
                { label: "Content", bg: c.roseLight, fg: c.roseMid },
              ].map((tag) => (
                <span key={tag.label} className="px-2.5 py-1 rounded-full" style={{ background: tag.bg, color: tag.fg, fontSize: "11px", fontWeight: 500 }}>
                  {tag.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>PRIORITY SYSTEM</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Urgent", bg: c.coralLight, fg: c.coralMid, dot: c.coral },
                { label: "High", bg: c.orangeLight, fg: c.orangeMid, dot: c.orange },
                { label: "Medium", bg: c.goldLight, fg: c.goldMid, dot: c.gold },
                { label: "Low", bg: c.tealLight, fg: c.tealMid, dot: c.teal },
                { label: "None", bg: "oklch(0.94 0.008 260)", fg: c.text3, dot: c.text4 },
              ].map((p) => (
                <span key={p.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-[6px]" style={{ background: p.bg, color: p.fg, fontSize: "11px", fontWeight: 500 }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.dot }} />
                  {p.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>TEAM AVATARS</SectionLabel>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { name: "Design", initials: "DS", bg: c.coral },
                { name: "Engineering", initials: "EN", bg: c.indigo },
                { name: "Product", initials: "PM", bg: c.teal },
                { name: "Marketing", initials: "MK", bg: c.gold },
                { name: "DevOps", initials: "DO", bg: c.orange },
                { name: "Analytics", initials: "AN", bg: c.cyan },
                { name: "Research", initials: "UX", bg: c.lavender },
                { name: "Creative", initials: "CR", bg: c.magenta },
                { name: "Growth", initials: "GR", bg: c.emerald },
                { name: "Content", initials: "CT", bg: c.rose },
                { name: "QA", initials: "QA", bg: c.lime },
              ].map((team) => (
                <div key={team.name} className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] hover:bg-black/[0.02] transition-colors">
                  <Avatar initials={team.initials} bg={team.bg} size={24} />
                  <span style={{ color: c.text2, fontSize: "11px", fontWeight: 500 }}>{team.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>STATUS PIPELINE</SectionLabel>
            <div className="flex items-center gap-0.5 overflow-x-auto">
              {[
                { label: "Backlog", color: c.text4, count: 12 },
                { label: "To Do", color: c.cyan, count: 8 },
                { label: "In Progress", color: c.indigo, count: 5 },
                { label: "In Review", color: c.lavender, count: 3 },
                { label: "Testing", color: c.gold, count: 2 },
                { label: "Approved", color: c.emerald, count: 4 },
                { label: "Done", color: c.teal, count: 18 },
              ].map((status, i) => (
                <div key={status.label} className="flex items-center gap-2 px-3 py-2 rounded-[6px] flex-1 min-w-[100px]" style={{ background: `${status.color}10` }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: status.color }} />
                  <div className="min-w-0">
                    <p className="truncate" style={{ color: c.text2, fontSize: "11px", fontWeight: 500 }}>{status.label}</p>
                    <p style={{ color: c.text4, fontSize: "10px" }}>{status.count} tasks</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}