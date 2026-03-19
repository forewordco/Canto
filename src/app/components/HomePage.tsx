/* ═══════════════════════════════════════════════════════════
   HOME PAGE — Asana-inspired layout with card grid.

   Layout:
   - Clean text header with greeting + inline stats
   - Two-column grid: Today + Lineup (left) / This Week (right)
   - Full-width "My Tasks" section below
   - Completed tasks toggle at bottom

   Phase 4 of Canto build plan.  (rev 2026-03-16)
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useMemo } from "react";
import {
  Sun,
  Moon,
  CaretDown,
  CaretRight,
  CalendarBlank,
  ArrowsClockwise,
  Warning,
  CheckCircle,
  Check,
  Plus,
  FileText,
  NotePencil,
  VideoCamera,
  FilmScript,
  X,
  SlidersHorizontal,
  Gear,
  Queue,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData, useTodayTasks, useLineupTasks, useUpcomingTasks, useOverdueTasks, useAllTasks, useTodayDocs, useLineupDocs } from "../lib/data";
import { useAuth } from "../lib/auth";
import { PullToRefresh } from "./PullToRefresh";
import type { TaskStatus, Priority, TaskItem, CalendarEvent } from "../lib/types";
import type { WorkspaceDoc, DocType } from "../lib/types";
import { HOME_GRADIENTS, PERSONAL_PROJECT, displayProjectName } from "../lib/types";
import { useNavigation } from "../lib/navigation";
import { useGlobalTaskDetail } from "./GlobalTaskDetail";
import { TaskRow } from "./TaskRow";

/* ─── Time-based greeting ─── */

function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour < 5) return { text: "Good evening", icon: Moon };
  if (hour < 12) return { text: "Good morning", icon: Sun };
  if (hour < 17) return { text: "Good afternoon", icon: Sun };
  return { text: "Good evening", icon: Moon };
}

/* ─── Format date for grouping ─── */

function formatDateGroup(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dDate = new Date(d);
    dDate.setHours(0, 0, 0, 0);
    const tomorrowDate = new Date(tomorrow);
    tomorrowDate.setHours(0, 0, 0, 0);

    if (dDate.getTime() === tomorrowDate.getTime()) {
      return "Tomorrow";
    }

    const diff = Math.round(
      (dDate.getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
    );

    if (diff < 7) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      return dayNames[d.getDay()];
    }

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

/* ─── Group upcoming tasks by date ─── */

function groupByDate(
  tasks: (TaskItem & { projectName: string })[]
): { label: string; tasks: (TaskItem & { projectName: string })[] }[] {
  const groups: Record<string, (TaskItem & { projectName: string })[]> = {};
  const groupOrder: string[] = [];

  for (const task of tasks) {
    if (!task.date) continue;
    const label = formatDateGroup(task.date);
    if (!groups[label]) {
      groups[label] = [];
      groupOrder.push(label);
    }
    groups[label].push(task);
  }

  return groupOrder.map((label) => ({ label, tasks: groups[label] }));
}

/* ═══════════════════════════════════════════════════════════
   CARD WRAPPER — Consistent card styling
   ═══════════════════════════════════════════════════════════ */

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[10px] ${className}`}
      style={{
        background: "oklch(1 0 0 / 0.85)",
        border: "1px solid oklch(0.92 0.01 160 / 0.5)",
        boxShadow: "0 1px 3px oklch(0 0 0 / 0.04)",
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD SECTION HEADER — Used inside cards
   ═══════════════════════════════════════════════════════════ */

function CardHeader({
  title,
  icon: Icon,
  iconColor,
  count,
  collapsed,
  onToggle,
  action,
  sublabel,
  sublabelColor,
  badgeBg,
  badgeColor,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  count?: number;
  collapsed?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
  sublabel?: string;
  sublabelColor?: string;
  badgeBg?: string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-[14px] py-[12px]">
      <Icon
        className="w-[18px] h-[18px] shrink-0"
        weight="fill"
        style={{ color: iconColor || "var(--text-tertiary)" }}
      />
      <h3
        style={{
          color: "var(--text-primary)",
          fontSize: "16px",
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      {count !== undefined && (
        <span
          className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full"
          style={{
            background: badgeBg || "oklch(0.92 0.06 155)",
            color: badgeColor || "oklch(0.40 0.12 155)",
            fontSize: "11px",
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
      {sublabel && (
        <span
          className="ml-auto mr-1"
          style={{
            color: sublabelColor || "oklch(0.65 0.12 25)",
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {sublabel}
        </span>
      )}
      {action && <div className="ml-auto">{action}</div>}
      {onToggle && (
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded-[6px] transition-colors hover:bg-black/[0.04]"
          style={{ color: "var(--text-quaternary)" }}
        >
          {collapsed ? (
            <CaretRight className="w-4 h-4" />
          ) : (
            <CaretDown className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   THIS WEEK CARD — Mini calendar with events
   ═══════════════════════════════════════════════════════════ */

function ThisWeekCard({ events }: { events: CalendarEvent[] }) {
  const safeEvents = Array.isArray(events) ? events : [];
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday

  // Get start of the current week (Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - today);
  weekStart.setHours(0, 0, 0, 0);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build the 7 days of this week
  const weekDays = useMemo(() => {
    return DAYS.map((name, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      const dayNum = date.getDate();
      const isToday = i === today;

      // Find events for this day
      const dayEvents = safeEvents
        .filter((e) => e.date === dateStr)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

      return { name, dayNum, isToday, dateStr, events: dayEvents };
    });
  }, [safeEvents, today]);

  // Count total events this week
  const totalEvents = weekDays.reduce((sum, d) => sum + d.events.length, 0);

  // Event colors for variety
  const eventColors = [
    "oklch(0.55 0.2 280)",  // indigo
    "oklch(0.65 0.15 155)", // green
    "oklch(0.7 0.18 25)",   // coral
    "oklch(0.72 0.17 55)",  // orange
    "oklch(0.55 0.15 200)", // blue
  ];

  return (
    <Card className="h-full">
      <CardHeader
        title="This Week"
        icon={CalendarBlank}
        iconColor="oklch(0.7 0.18 25)"
        count={totalEvents}
      />
      <div className="px-4 pb-4 space-y-0">
        {weekDays.map((day, i) => (
          <div key={day.dateStr}>
            {/* Day row */}
            <div className="flex items-start gap-2.5 py-1.5">
              {/* Day number */}
              <div className="w-6 flex items-center justify-center shrink-0">
                {day.isToday ? (
                  <span
                    className="w-6 h-6 rounded-[5px] flex items-center justify-center"
                    style={{
                      background: "oklch(0.7 0.18 25)",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {day.dayNum}
                  </span>
                ) : (
                  <span
                    style={{
                      color: "var(--text-tertiary)",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {day.dayNum}
                  </span>
                )}
              </div>
              {/* Day name */}
              <span
                className="w-7 shrink-0"
                style={{
                  color: day.isToday ? "var(--text-primary)" : "var(--text-tertiary)",
                  fontSize: "12px",
                  fontWeight: day.isToday ? 600 : 500,
                }}
              >
                {day.name}
              </span>
            </div>

            {/* Events for this day */}
            {day.events.length > 0 && (
              <div className="ml-[38px] space-y-1 pb-1">
                {day.events.map((event, eIdx) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 py-0.5"
                  >
                    {/* Color bar */}
                    <div
                      className="w-[3px] h-4 rounded-full shrink-0"
                      style={{
                        background: event.color || eventColors[eIdx % eventColors.length],
                      }}
                    />
                    {/* Title */}
                    <span
                      className="flex-1 truncate"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      {event.title}
                    </span>
                    {/* Time */}
                    {event.startTime && (
                      <span
                        className="shrink-0"
                        style={{
                          color: "var(--text-quaternary)",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        {formatTime12h(event.startTime)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Format 24h time to 12h */
function formatTime12h(time: string): string {
  try {
    const [hStr, mStr] = time.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    const period = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${period}`;
  } catch {
    return time;
  }
}

/* ═══════════════════════════════════════════════════════════
   QUICK ADD TASK — Inline add task with project selector
   ═══════════════════════════════════════════════════════════ */

function QuickAddTask({
  projects,
  onAdd,
}: {
  projects: Record<string, { color: string }>;
  onAdd: (projectName: string, title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projectDropdown, setProjectDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const projectNames = useMemo(
    () => Object.keys(projects).sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const handleOpen = useCallback(() => {
    setOpen(true);
    setTitle("");
    setSelectedProject(projectNames[0] || "");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [projectNames]);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) {
      setOpen(false);
      return;
    }
    const proj = selectedProject || projectNames[0] || PERSONAL_PROJECT;
    onAdd(proj, trimmed);
    setTitle("");
    inputRef.current?.focus();
  }, [title, selectedProject, projectNames, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [handleSubmit]
  );

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 w-full rounded-[6px] py-2.5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] group px-[6px] py-[10px]"
        style={{ color: "var(--text-quaternary)", fontSize: "13px" }}
      >
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center border border-dashed transition-colors group-hover:border-solid"
          style={{ borderColor: "var(--neutral-400)" }}
        >
          <Plus className="w-3 h-3" />
        </span>
        <span className="group-hover:text-[var(--text-tertiary)] transition-colors">
          Add a task...
        </span>
      </button>
    );
  }

  return (
    <div
      className="rounded-[8px] border p-2"
      style={{
        background: "var(--surface-bg)",
        borderColor: "var(--accent-primary)",
        boxShadow: "0 0 0 1px var(--accent-primary)",
      }}
    >
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (!title.trim()) {
              setTimeout(() => setOpen(false), 150);
            }
          }}
          placeholder="Task name..."
          className="flex-1 min-w-0 bg-transparent outline-none border-none"
          style={{
            color: "var(--text-primary)",
            fontSize: "14px",
            fontFamily: "'Albert Sans', sans-serif",
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="px-3 py-1 rounded-[6px] transition-all text-white disabled:opacity-40"
          style={{
            background: "var(--accent-primary)",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          Add
        </button>
      </div>

      {/* Project selector */}
      {projectNames.length > 0 && (
        <div className="mt-2 relative" ref={dropdownRef}>
          <button
            onClick={() => setProjectDropdown(!projectDropdown)}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
            style={{
              fontSize: "11px",
              color: "var(--text-tertiary)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: selectedProject && projects[selectedProject]
                  ? projects[selectedProject].color
                  : "var(--neutral-400)",
              }}
            />
            <span className="truncate max-w-[140px]">
              {selectedProject ? displayProjectName(selectedProject) : "Select project"}
            </span>
            <CaretDown className="w-3 h-3" />
          </button>

          <AnimatePresence>
            {projectDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute left-0 bottom-full mb-1 py-1 rounded-[8px] shadow-lg z-30 min-w-[160px] max-h-[200px] overflow-y-auto"
                style={{
                  background: "var(--surface-bg)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "var(--shadow-popup)",
                }}
              >
                {projectNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedProject(name);
                      setProjectDropdown(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                    style={{
                      fontSize: "12px",
                      fontWeight: selectedProject === name ? 500 : 400,
                      color: selectedProject === name ? "var(--accent-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: projects[name]?.color || "var(--neutral-400)" }}
                    />
                    <span className="truncate">{displayProjectName(name)}</span>
                    {selectedProject === name && (
                      <Check className="w-3 h-3 ml-auto shrink-0" style={{ color: "var(--accent-primary)" }} />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMPTY SECTION STATE
   ═══════════════════════════════════════════════════════════ */

function EmptyCardState({ message }: { message?: string }) {
  return (
    <p
      className="pl-[18px] pr-[16px] pt-[0px] pb-[16px]"
      style={{
        color: "var(--text-quaternary)",
        fontSize: "13px",
        fontStyle: "italic",
      }}
    >
      {message || "All clear for now"}
    </p>
  );
}

/* ═══════════════════════════════════════════════════════════
   DOC ENTRY ROW — Workspace doc entry for Today/Lineup sections
   ═══════════════════════════════════════════════════════════ */

const DOC_TYPE_ICONS: Record<DocType, React.ElementType> = {
  doc: FileText,
  note: NotePencil,
  meeting: VideoCamera,
  script: FilmScript,
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  doc: "oklch(0.55 0.2 280)",
  note: "oklch(0.72 0.17 55)",
  meeting: "oklch(0.7 0.18 25)",
  script: "oklch(0.65 0.15 180)",
};

const DOC_TYPE_LABELS: Record<DocType, string> = {
  doc: "Document",
  note: "Note",
  meeting: "Meeting",
  script: "Script",
};

function DocEntryRow({
  doc,
  onRemove,
  onOpen,
  flagType,
}: {
  doc: WorkspaceDoc;
  onRemove: (docId: string) => void;
  onOpen: (docId: string) => void;
  flagType: "today" | "lineup";
}) {
  const Icon = DOC_TYPE_ICONS[doc.type] || FileText;
  const color = DOC_TYPE_COLORS[doc.type] || "var(--text-tertiary)";
  const label = DOC_TYPE_LABELS[doc.type] || "Document";
  const hasCover = !!doc.coverImage;

  return (
    <div
      className="group/doc flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] cursor-pointer"
      onClick={() => onOpen(doc.id)}
    >
      {/* Cover image thumbnail or type icon */}
      {hasCover ? (
        <div
          className="w-8 h-8 rounded-[5px] shrink-0 overflow-hidden"
          style={{
            backgroundImage: `url(${doc.coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: doc.coverImageY != null ? `center ${doc.coverImageY}%` : "center",
          }}
        />
      ) : (
        <div
          className="w-8 h-8 flex items-center justify-center shrink-0 rounded-[5px]"
          style={{ background: `${color}12` }}
        >
          <Icon className="w-4 h-4" weight="fill" style={{ color }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span
          className="block truncate"
          style={{
            color: "var(--text-primary)",
            fontSize: "13px",
            fontWeight: 450,
            lineHeight: "1.3",
          }}
        >
          {doc.title || "Untitled"}
        </span>
        {doc.projectName && (
          <span
            className="block truncate"
            style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 400, lineHeight: "1.3" }}
          >
            {displayProjectName(doc.projectName)}
          </span>
        )}
      </div>
      <span
        className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
        style={{
          background: `${color}10`,
          color,
          fontSize: "10px",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(doc.id);
        }}
        className="shrink-0 p-1 rounded-[4px] opacity-0 group-hover/doc:opacity-100 transition-opacity hover:bg-black/[0.06]"
        title={`Remove from ${flagType === "today" ? "Today" : "Lineup"}`}
      >
        <X className="w-3 h-3" style={{ color: "var(--text-quaternary)" }} />
      </button>
    </div>
  );
}

function DocEntryList({
  docs,
  onRemove,
  onOpen,
  flagType,
}: {
  docs: WorkspaceDoc[];
  onRemove: (docId: string) => void;
  onOpen: (docId: string) => void;
  flagType: "today" | "lineup";
}) {
  if (docs.length === 0) return null;
  return (
    <div className="space-y-0">
      <AnimatePresence initial={false}>
        {docs.map((doc) => (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DocEntryRow doc={doc} onRemove={onRemove} onOpen={onOpen} flagType={flagType} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SIMPLIFIED HOME TASK ROW — Lightweight row for home dashboard
   Matches reference: ○ Title  [Project pill]  Date  ☀ ☰
   ═══════════════════════════════════════════════════════════ */

/** Format date as short string like "Mar. 1, 2026" */
function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    const MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
    return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

function HomeTaskList({
  tasks,
  showProject = false,
  todayIds,
  lineupIds,
  onToggleComplete,
  onToggleToday,
  onToggleLineup,
  onStatusChange,
  onTitleChange,
  onPriorityChange,
  onDateChange,
  onAssigneeChange,
  onDelete,
  projectColors,
  emptyMessage = "No tasks",
  onClickTask,
  showCompletedDivider = false,
  teamMembers,
}: {
  tasks: (TaskItem & { projectName?: string })[];
  showProject?: boolean;
  todayIds?: Set<string>;
  lineupIds?: Set<string>;
  onToggleComplete?: (taskId: string) => void;
  onToggleToday?: (taskId: string) => void;
  onToggleLineup?: (taskId: string) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTitleChange?: (taskId: string, title: string) => void;
  onPriorityChange?: (taskId: string, priority: Priority) => void;
  onDateChange?: (taskId: string, date: string | undefined) => void;
  onAssigneeChange?: (taskId: string, assignee: string | undefined) => void;
  onDelete?: (taskId: string) => void;
  projectColors?: Record<string, string>;
  emptyMessage?: string;
  onClickTask?: (task: TaskItem & { projectName?: string }) => void;
  showCompletedDivider?: boolean;
  teamMembers?: { userId: string; displayName: string; avatarColor?: string; avatarUrl?: string }[];
}) {
  if (tasks.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-6 rounded-[6px]"
        style={{ color: "var(--text-quaternary)", fontSize: "13px" }}
      >
        {emptyMessage}
      </div>
    );
  }

  const incompleteTasks = showCompletedDivider ? tasks.filter((t) => !t.completed && t.status !== "completed") : tasks;
  const completedTasks = showCompletedDivider ? tasks.filter((t) => t.completed || t.status === "completed") : [];

  const renderRow = (task: (TaskItem & { projectName?: string })) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
    >
      <TaskRow
        task={task}
        showProject={showProject}
        projectName={task.projectName}
        projectColor={
          task.projectName && projectColors
            ? projectColors[task.projectName]
            : undefined
        }
        isToday={todayIds?.has(task.id)}
        isLineup={lineupIds?.has(task.id)}
        onStatusChange={onStatusChange}
        onTitleChange={onTitleChange}
        onPriorityChange={onPriorityChange}
        onDateChange={onDateChange}
        onAssigneeChange={onAssigneeChange}
        onDelete={onDelete}
        onToggleToday={onToggleToday}
        onToggleLineup={onToggleLineup}
        onTaskClick={(taskId) => {
          const t = tasks.find((x) => x.id === taskId);
          if (t) onClickTask?.(t);
        }}
        compact
        subtaskCount={task.subtasks?.length || 0}
        subtaskCompleted={task.subtasks?.filter((s) => s.completed).length || 0}
        teamMembers={teamMembers}
      />
    </motion.div>
  );

  return (
    <div>
      <AnimatePresence initial={false}>
        {incompleteTasks.map(renderRow)}
      </AnimatePresence>
      {showCompletedDivider && completedTasks.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 mt-1">
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
            <span style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 500 }}>
              {completedTasks.length} completed
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
          </div>
          <AnimatePresence initial={false}>
            {completedTasks.map(renderRow)}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════════════════════ */

export function HomePage() {
  const {
    projects,
    todayTaskIds,
    starred,
    toggleToday,
    toggleStarred,
    updateTask: dataUpdateTask,
    addTask: dataAddTask,
    deleteTask: dataDeleteTask,
    isLoading,
    reload,
    isSaving,
    lastSavedAt,
    teamMembers,
    updateDoc,
    events,
    loadError,
  } = useData();
  const { profile, updateProfile } = useAuth();
  const { navigate } = useNavigation();
  const { openTaskDetail } = useGlobalTaskDetail();

  const allTasks = useAllTasks();
  const todayTasks = useTodayTasks();
  const lineupTasks = useLineupTasks();
  const upcomingTasks = useUpcomingTasks();
  const overdueTasks = useOverdueTasks();
  const todayDocs = useTodayDocs();
  const lineupDocs = useLineupDocs();

  // Section collapse state
  const [todayCollapsed, setTodayCollapsed] = useState(false);
  const [lineupCollapsed, setLineupCollapsed] = useState(false);
  const [upcomingCollapsed, setUpcomingCollapsed] = useState(false);
  const [overdueCollapsed, setOverdueCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);
  const [showCompletedMyTasks, setShowCompletedMyTasks] = useState(false);

  // Gradient
  const currentGradientId = profile?.homeGradient || "emerald";
  const currentGradient =
    HOME_GRADIENTS.find((g) => g.id === currentGradientId)?.gradient ||
    HOME_GRADIENTS[0].gradient;

  const handleChangeGradient = useCallback(
    (id: string) => {
      updateProfile({ homeGradient: id });
    },
    [updateProfile]
  );

  // Team members for pickers
  const teamMembersList = useMemo(
    () =>
      teamMembers.map((m) => ({
        userId: m.userId,
        displayName: m.displayName,
        avatarColor: m.avatarColor,
        avatarUrl: m.avatarUrl,
      })),
    [teamMembers]
  );

  // Compute lineupIds set for TaskRow
  const lineupIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTasks) {
      if (t.lineup) set.add(t.id);
    }
    return set;
  }, [allTasks]);

  // Completed today
  const completedToday = useMemo(() => {
    const todayDate = new Date().toISOString().split("T")[0];
    return allTasks.filter((t) => {
      if (!t.completed) return false;
      if (t.updatedAt) {
        try {
          return t.updatedAt.split("T")[0] === todayDate;
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [allTasks]);

  // "My Tasks" — all incomplete tasks assigned to current user or unassigned
  const myTasks = useMemo(() => {
    const userId = profile?.userId;
    return allTasks.filter((t) => {
      if (t.completed) return false;
      // Show tasks assigned to me or unassigned
      if (userId && t.assignee && t.assignee !== userId) return false;
      return true;
    });
  }, [allTasks, profile?.userId]);

  // My completed tasks
  const myCompletedTasks = useMemo(() => {
    const userId = profile?.userId;
    return allTasks.filter((t) => {
      if (!t.completed) return false;
      if (userId && t.assignee && t.assignee !== userId) return false;
      return true;
    });
  }, [allTasks, profile?.userId]);

  // Group my tasks by project
  const myTasksByProject = useMemo(() => {
    const groups: Record<string, (TaskItem & { projectName: string })[]> = {};
    const order: string[] = [];
    for (const task of myTasks) {
      const pName = (task as any).projectName || "Personal";
      if (!groups[pName]) {
        groups[pName] = [];
        order.push(pName);
      }
      groups[pName].push(task as TaskItem & { projectName: string });
    }
    return order.map((name) => ({ name, tasks: groups[name] }));
  }, [myTasks]);

  // In-progress count
  const inProgressCount = useMemo(
    () => allTasks.filter((t) => !t.completed && t.status === "in-progress").length,
    [allTasks]
  );

  // Helper: find the project that owns a task
  const findProjectForTask = useCallback(
    (taskId: string): [string, TaskItem] | null => {
      for (const [pName, pData] of Object.entries(projects)) {
        const task = pData.tasks?.find((t) => t.id === taskId);
        if (task) return [pName, task];
      }
      return null;
    },
    [projects]
  );

  // Task actions
  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      const found = findProjectForTask(taskId);
      if (found) {
        dataUpdateTask(found[0], taskId, {
          status,
          completed: status === "completed",
        });
      }
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleTitleChange = useCallback(
    (taskId: string, title: string) => {
      const found = findProjectForTask(taskId);
      if (found) {
        dataUpdateTask(found[0], taskId, { title });
      }
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handlePriorityChange = useCallback(
    (taskId: string, priority: Priority) => {
      const found = findProjectForTask(taskId);
      if (found) {
        dataUpdateTask(found[0], taskId, { priority });
      }
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleDateChange = useCallback(
    (taskId: string, date: string | undefined) => {
      const found = findProjectForTask(taskId);
      if (found) {
        dataUpdateTask(found[0], taskId, { date });
      }
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleAssigneeChange = useCallback(
    (taskId: string, assignee: string | undefined) => {
      const found = findProjectForTask(taskId);
      if (found) {
        dataUpdateTask(found[0], taskId, { assignee });
      }
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleToggleLineup = useCallback(
    (taskId: string) => {
      const found = findProjectForTask(taskId);
      if (found) {
        dataUpdateTask(found[0], taskId, { lineup: !found[1].lineup });
      }
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      const found = findProjectForTask(taskId);
      if (found) {
        dataDeleteTask(found[0], taskId);
      }
    },
    [findProjectForTask, dataDeleteTask]
  );

  const handleQuickAdd = useCallback(
    (projectName: string, title: string) => {
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        completed: false,
        status: "todo",
        today: true,
        priority: "none",
        createdAt: new Date().toISOString(),
      };
      dataAddTask(projectName, newTask);
      toggleToday(newTask.id);
    },
    [dataAddTask, toggleToday]
  );

  // Doc actions
  const handleRemoveTodayDoc = useCallback(
    (docId: string) => {
      updateDoc(docId, { today: false });
    },
    [updateDoc]
  );

  const handleRemoveLineupDoc = useCallback(
    (docId: string) => {
      updateDoc(docId, { lineup: false });
    },
    [updateDoc]
  );

  const handleOpenDoc = useCallback(
    (docId: string) => {
      navigate("docs", { docId });
    },
    [navigate]
  );

  // Open task detail overlay in-place (no navigation)
  const handleClickTask = useCallback(
    (task: TaskItem & { projectName?: string }) => {
      const projectName = task.projectName || findProjectForTask(task.id)?.[0];
      if (projectName) {
        openTaskDetail(task.id, projectName);
      }
    },
    [openTaskDetail, findProjectForTask]
  );

  // Project color map for TaskList
  const projectColorMap = useMemo(() => {
    const map: Record<string, { color: string }> = {};
    for (const [name, proj] of Object.entries(projects)) {
      map[name] = { color: proj.color };
    }
    return map;
  }, [projects]);

  // Flat project color map for HomeTaskList
  const projectColorsFlat = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [name, proj] of Object.entries(projects)) {
      map[name] = proj.color;
    }
    return map;
  }, [projects]);

  // Toggle complete for simplified home rows
  const handleToggleComplete = useCallback(
    (taskId: string) => {
      const found = findProjectForTask(taskId);
      if (found) {
        const isCompleted = found[1].status === "completed" || found[1].completed;
        dataUpdateTask(found[0], taskId, {
          status: isCompleted ? "todo" : "completed",
          completed: !isCompleted,
        });
      }
    },
    [findProjectForTask, dataUpdateTask]
  );

  // Format today's date for header
  const todayDate = useMemo(() => {
    const now = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return `${dayNames[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }, []);

  const { text: greeting } = getGreeting();
  const firstName = profile?.displayName?.split(" ")[0] || "there";

  // Gradient picker state
  const [pickerOpen, setPickerOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-16 rounded-[10px]" style={{ background: "var(--neutral-200)" }} />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            <div className="h-32 rounded-[10px]" style={{ background: "var(--neutral-200)" }} />
            <div className="h-28 rounded-[10px]" style={{ background: "var(--neutral-200)" }} />
          </div>
          <div className="h-64 rounded-[10px]" style={{ background: "var(--neutral-200)" }} />
        </div>
        <div className="h-48 rounded-[10px]" style={{ background: "var(--neutral-200)" }} />
      </div>
    );
  }

  /* ─── Data load error fallback ─── */
  if (loadError && Object.keys(projects).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center max-w-sm space-y-4">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto"
            style={{ background: "oklch(0.7 0.18 25 / 0.1)" }}
          >
            <Warning className="w-6 h-6" weight="fill" style={{ color: "oklch(0.7 0.18 25)" }} />
          </div>
          <div>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "4px",
              }}
            >
              Couldn't load your data
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-tertiary)",
                lineHeight: 1.5,
              }}
            >
              {loadError}
            </p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] transition-colors hover:brightness-95"
            style={{
              background: "oklch(0.7 0.18 25)",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <ArrowsClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={reload}>
      <div
        className="min-h-screen -mx-4 sm:-mx-6 md:-mx-10 -mt-6 md:-mt-10 px-5 sm:px-7 md:px-11 pt-6 md:pt-10 pb-8 md:pb-10"
        style={{
          background: "linear-gradient(160deg, oklch(0.97 0.03 160) 0%, oklch(0.98 0.015 160) 40%, oklch(0.99 0.005 200) 100%)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6 md:mb-8">
          <div>
            <h1
              style={{
                color: "var(--text-primary)",
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              {greeting}, {firstName}
            </h1>
            <p
              className="mt-1 flex items-center flex-wrap gap-x-1"
              style={{
                color: "var(--text-tertiary)",
                fontSize: "13px",
                fontWeight: 400,
              }}
            >
              <span>{todayDate}</span>
              <span style={{ color: "var(--text-quaternary)" }}>·</span>
              <span>{todayTasks.length} today</span>
              <span style={{ color: "var(--text-quaternary)" }}>·</span>
              <span>{lineupTasks.length + lineupDocs.length} in lineup</span>
              <span style={{ color: "var(--text-quaternary)" }}>·</span>
              <span>{inProgressCount} in progress</span>
            </p>
          </div>

          {/* Gradient picker button */}
          <div className="relative">
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              className="p-2 rounded-[8px] transition-colors hover:bg-black/[0.05]"
              title="Change theme"
            >
              <Gear className="w-5 h-5" style={{ color: "var(--text-tertiary)" }} weight="fill" />
            </button>
            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-full mt-2 p-2 rounded-[8px] shadow-lg z-20 flex gap-1.5"
                  style={{
                    background: "var(--surface-bg)",
                    border: "1px solid var(--border-default)",
                    boxShadow: "var(--shadow-popup)",
                  }}
                >
                  {HOME_GRADIENTS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => {
                        handleChangeGradient(g.id);
                        setPickerOpen(false);
                      }}
                      className="w-7 h-7 rounded-[6px] transition-transform hover:scale-110 ring-2 ring-transparent hover:ring-white/50"
                      style={{ background: g.gradient }}
                      title={g.name}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Save indicator */}
        {(isSaving || lastSavedAt) && (
          <div className="flex items-center gap-1.5 mb-4">
            {isSaving ? (
              <>
                <ArrowsClockwise
                  className="w-3 h-3 animate-spin"
                  style={{ color: "var(--text-quaternary)" }}
                />
                <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>
                  Saving...
                </span>
              </>
            ) : lastSavedAt ? (
              <>
                <Check className="w-3 h-3" style={{ color: "var(--accent-success)" }} />
                <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>
                  Saved
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* ── Today + Lineup cards ── */}
        <div className="space-y-4 mb-4">
          {/* Today card */}
          <Card>
            <CardHeader
              title="Today"
              icon={Sun}
              iconColor="#F59E0B"
              count={todayTasks.length + todayDocs.length}
              badgeBg="#FEF3C7"
              badgeColor="#B45309"
              collapsed={todayCollapsed}
              onToggle={() => setTodayCollapsed(!todayCollapsed)}
            />
            {!todayCollapsed && (
              <>
                {(todayTasks.length > 0 || todayDocs.length > 0) ? (
                  <div className="px-2 pb-2">
                    <HomeTaskList
                      tasks={todayTasks}
                      showProject
                      onToggleComplete={handleToggleComplete}
                      onToggleToday={(id) => toggleToday(id)}
                      onToggleLineup={handleToggleLineup}
                      onStatusChange={handleStatusChange}
                      onTitleChange={handleTitleChange}
                      onPriorityChange={handlePriorityChange}
                      onDateChange={handleDateChange}
                      onAssigneeChange={handleAssigneeChange}
                      onDelete={handleDelete}
                      todayIds={todayTaskIds}
                      lineupIds={lineupIds}
                      projectColors={projectColorsFlat}
                      onClickTask={handleClickTask}
                      teamMembers={teamMembersList}
                      showCompletedDivider
                    />
                    <DocEntryList
                      docs={todayDocs}
                      onRemove={handleRemoveTodayDoc}
                      onOpen={handleOpenDoc}
                      flagType="today"
                    />
                  </div>
                ) : (
                  <EmptyCardState />
                )}

                <div className="px-2 pb-2">
                  <QuickAddTask
                    projects={projectColorMap}
                    onAdd={handleQuickAdd}
                  />
                </div>
              </>
            )}
          </Card>

          {/* Lineup card */}
          <Card>
            <CardHeader
              title="Lineup"
              icon={Queue}
              iconColor="#3B82F6"
              count={lineupTasks.length + lineupDocs.length}
              badgeBg="#EFF6FF"
              badgeColor="#1D4ED8"
              collapsed={lineupCollapsed}
              onToggle={() => setLineupCollapsed(!lineupCollapsed)}
              sublabel="Team Queue"
              sublabelColor="#3B82F6"
            />
            {!lineupCollapsed && (
              <>
                {(lineupTasks.length > 0 || lineupDocs.length > 0) ? (
                  <div className="px-2 pb-2">
                    <HomeTaskList
                      tasks={lineupTasks}
                      showProject
                      onToggleComplete={handleToggleComplete}
                      onToggleToday={(id) => toggleToday(id)}
                      onToggleLineup={handleToggleLineup}
                      onStatusChange={handleStatusChange}
                      onTitleChange={handleTitleChange}
                      onPriorityChange={handlePriorityChange}
                      onDateChange={handleDateChange}
                      onAssigneeChange={handleAssigneeChange}
                      onDelete={handleDelete}
                      todayIds={todayTaskIds}
                      lineupIds={lineupIds}
                      projectColors={projectColorsFlat}
                      onClickTask={handleClickTask}
                      teamMembers={teamMembersList}
                      showCompletedDivider
                    />
                    <DocEntryList
                      docs={lineupDocs}
                      onRemove={handleRemoveLineupDoc}
                      onOpen={handleOpenDoc}
                      flagType="lineup"
                    />
                  </div>
                ) : (
                  <EmptyCardState />
                )}
              </>
            )}
          </Card>
        </div>

        {/* ── My Tasks — Full width ── */}
        <Card className="mb-4">
          <div className="flex items-center gap-2 px-4 py-3">
            <SlidersHorizontal
              className="w-[18px] h-[18px] shrink-0"
              weight="fill"
              style={{ color: "var(--text-tertiary)" }}
            />
            <h3
              style={{
                color: "var(--text-primary)",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              My Tasks
            </h3>
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full"
              style={{
                background: "oklch(0.92 0.06 155)",
                color: "oklch(0.40 0.12 155)",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {myTasks.length}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
                style={{ color: "var(--text-quaternary)" }}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
                style={{ color: "var(--text-quaternary)" }}
              >
                <CaretDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {myTasks.length > 0 ? (
            <div className="px-2 pb-2">
              {myTasksByProject.map((group) => (
                <div key={group.name}>
                  {/* Project section label */}
                  <div className="flex items-center gap-2 px-2 pt-2 pb-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: projects[group.name]?.color || "var(--neutral-400)",
                      }}
                    />
                    <span
                      style={{
                        color: "var(--text-tertiary)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {displayProjectName(group.name)}
                    </span>
                  </div>
                  <HomeTaskList
                    tasks={group.tasks}
                    onToggleComplete={handleToggleComplete}
                    onToggleToday={(id) => toggleToday(id)}
                    onToggleLineup={handleToggleLineup}
                    onStatusChange={handleStatusChange}
                    onTitleChange={handleTitleChange}
                    onPriorityChange={handlePriorityChange}
                    onDateChange={handleDateChange}
                    onAssigneeChange={handleAssigneeChange}
                    onDelete={handleDelete}
                    todayIds={todayTaskIds}
                    lineupIds={lineupIds}
                    projectColors={projectColorsFlat}
                    onClickTask={handleClickTask}
                    teamMembers={teamMembersList}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyCardState message="No tasks assigned to you" />
          )}

          {/* Show completed toggle */}
          {myCompletedTasks.length > 0 && (
            <div className="border-t" style={{ borderColor: "oklch(0.92 0.01 160 / 0.5)" }}>
              <button
                onClick={() => setShowCompletedMyTasks(!showCompletedMyTasks)}
                className="w-full py-3 text-center transition-colors hover:bg-black/[0.02]"
                style={{
                  color: "var(--text-quaternary)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                {showCompletedMyTasks ? "Hide" : "Show"} {myCompletedTasks.length} completed task{myCompletedTasks.length !== 1 ? "s" : ""}
              </button>
              {showCompletedMyTasks && (
                <div className="px-2 pb-2">
                  <HomeTaskList
                    tasks={myCompletedTasks}
                    showProject
                    onToggleComplete={handleToggleComplete}
                    onStatusChange={handleStatusChange}
                    onTitleChange={handleTitleChange}
                    onPriorityChange={handlePriorityChange}
                    onDateChange={handleDateChange}
                    onAssigneeChange={handleAssigneeChange}
                    onDelete={handleDelete}
                    todayIds={todayTaskIds}
                    lineupIds={lineupIds}
                    projectColors={projectColorsFlat}
                    onClickTask={handleClickTask}
                    teamMembers={teamMembersList}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ── Upcoming section ── */}
        {upcomingTasks.length > 0 && (
          <Card className="mb-4">
            <CardHeader
              title="Upcoming"
              icon={CalendarBlank}
              iconColor="oklch(0.55 0.2 280)"
              count={upcomingTasks.length}
              collapsed={upcomingCollapsed}
              onToggle={() => setUpcomingCollapsed(!upcomingCollapsed)}
            />
            {!upcomingCollapsed && (
              <div className="px-2 pb-2 space-y-3">
                {groupByDate(upcomingTasks).map((group) => (
                  <div key={group.label}>
                    <p
                      className="mb-1.5 pl-2"
                      style={{
                        color: "var(--text-tertiary)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {group.label}
                    </p>
                    <HomeTaskList
                      tasks={group.tasks}
                      showProject
                      onToggleComplete={handleToggleComplete}
                      onToggleToday={(id) => toggleToday(id)}
                      onToggleLineup={handleToggleLineup}
                      onStatusChange={handleStatusChange}
                      onTitleChange={handleTitleChange}
                      onPriorityChange={handlePriorityChange}
                      onDateChange={handleDateChange}
                      onAssigneeChange={handleAssigneeChange}
                      onDelete={handleDelete}
                      todayIds={todayTaskIds}
                      lineupIds={lineupIds}
                      projectColors={projectColorsFlat}
                      onClickTask={handleClickTask}
                      teamMembers={teamMembersList}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Completed Today ── */}
        {completedToday.length > 0 && (
          <Card>
            <CardHeader
              title="Completed Today"
              icon={CheckCircle}
              iconColor="oklch(0.65 0.15 180)"
              count={completedToday.length}
              collapsed={completedCollapsed}
              onToggle={() => setCompletedCollapsed(!completedCollapsed)}
            />
            {!completedCollapsed && (
              <div className="px-2 pb-2">
                <HomeTaskList
                  tasks={completedToday}
                  showProject
                  onToggleComplete={handleToggleComplete}
                  onStatusChange={handleStatusChange}
                  onTitleChange={handleTitleChange}
                  onPriorityChange={handlePriorityChange}
                  onDateChange={handleDateChange}
                  onAssigneeChange={handleAssigneeChange}
                  onDelete={handleDelete}
                  todayIds={todayTaskIds}
                  lineupIds={lineupIds}
                  projectColors={projectColorsFlat}
                  onClickTask={handleClickTask}
                  teamMembers={teamMembersList}
                />
              </div>
            )}
          </Card>
        )}
      </div>
    </PullToRefresh>
  );
}

export default HomePage;