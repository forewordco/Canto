/* ═══════════════════════════════════════════════════════════
   TASK ROW — Reusable task row component.
   
   Features:
   - 5-state circle checkbox (todo/in-progress/completed/hold/blocked)
   - Priority flag icon (urgent/high/medium/low/none)
   - Inline title editing on click/tap
   - Assignee avatar with picker popup
   - Due date badge with date picker
   - Star toggle (today/lineup)
   - Mobile: swipe right to complete, swipe left to delete
   
   Phase 4 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect, memo, useMemo } from "react";
import {
  Circle,
  CircleHalf,
  CheckCircle,
  PauseCircle,
  Prohibit,
  Flag,
  Star,
  CalendarBlank,
  Trash,
  Check,
  ArrowRight,
  Sun,
  X,
  ArrowsClockwise,
  UserCircle,
  DotsThree,
  Queue,
  CaretDown,
  DotsSixVertical,
} from "@phosphor-icons/react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import type { TaskItem, TaskStatus, Priority } from "../lib/types";
import { haptic } from "../lib/haptics";
import { Drawer as VaulDrawer } from "vaul";
import { setDragData, type DragPayload } from "../lib/drag-context";

/* ─── Status Config ─── */

interface StatusInfo {
  icon: React.ElementType;
  color: string;
  nextStatus: TaskStatus;
  label: string;
}

const STATUS_CONFIG: Record<TaskStatus, StatusInfo> = {
  todo: {
    icon: Circle,
    color: "oklch(0.65 0.015 260)",
    nextStatus: "in-progress",
    label: "To Do",
  },
  "in-progress": {
    icon: CircleHalf,
    color: "oklch(0.55 0.2 280)",
    nextStatus: "completed",
    label: "In Progress",
  },
  completed: {
    icon: CheckCircle,
    color: "oklch(0.65 0.15 180)",
    nextStatus: "todo",
    label: "Completed",
  },
  hold: {
    icon: PauseCircle,
    color: "oklch(0.85 0.15 85)",
    nextStatus: "todo",
    label: "On Hold",
  },
};

/* ─── Priority Config ─── */

interface PriorityInfo {
  color: string;
  label: string;
  weight: "fill" | "regular" | "bold";
}

const PRIORITY_CONFIG: Record<Priority, PriorityInfo> = {
  urgent: { color: "oklch(0.7 0.18 25)", label: "Urgent", weight: "fill" },
  high: { color: "oklch(0.72 0.17 55)", label: "High", weight: "fill" },
  medium: { color: "oklch(0.85 0.15 85)", label: "Medium", weight: "fill" },
  low: { color: "oklch(0.65 0.15 180)", label: "Low", weight: "regular" },
  none: { color: "oklch(0.85 0.01 260)", label: "None", weight: "regular" },
};

/* ─── Priority Cycle ─── */

const PRIORITY_CYCLE: Priority[] = ["none", "low", "medium", "high", "urgent"];

/* ─── All Status Options for dropdown ─── */

const STATUS_OPTIONS: { value: TaskStatus; label: string; icon: React.ElementType; color: string }[] = [
  { value: "todo", label: "To Do", icon: Circle, color: "oklch(0.65 0.015 260)" },
  { value: "in-progress", label: "In Progress", icon: CircleHalf, color: "oklch(0.55 0.2 280)" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "oklch(0.65 0.15 180)" },
  { value: "hold", label: "On Hold", icon: PauseCircle, color: "oklch(0.85 0.15 85)" },
];

/* ─── Props ─── */

export interface TaskRowProps {
  task: TaskItem;
  projectName?: string;
  projectColor?: string;
  /** Called when status changes */
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  /** Called when title changes */
  onTitleChange?: (taskId: string, title: string) => void;
  /** Called when priority changes */
  onPriorityChange?: (taskId: string, priority: Priority) => void;
  /** Called when task is deleted */
  onDelete?: (taskId: string) => void;
  /** Called when star/today is toggled */
  onToggleToday?: (taskId: string) => void;
  /** Whether this task is in "today" */
  isToday?: boolean;
  /** Whether this task is starred */
  isStarred?: boolean;
  /** Called when star is toggled */
  onToggleStar?: (taskId: string) => void;
  /** Called when due date changes */
  onDateChange?: (taskId: string, date: string | undefined) => void;
  /** Called when assignee changes */
  onAssigneeChange?: (taskId: string, assignee: string | undefined) => void;
  /** Called when lineup is toggled */
  onToggleLineup?: (taskId: string) => void;
  /** Whether task is in lineup */
  isLineup?: boolean;
  /** Called when task is clicked for detail view */
  onTaskClick?: (taskId: string) => void;
  /** Show project name badge */
  showProject?: boolean;
  /** Compact mode (less padding) */
  compact?: boolean;
  /** Show subtask count */
  subtaskCount?: number;
  subtaskCompleted?: number;
  /** Available team members for assignee picker */
  teamMembers?: { userId: string; displayName: string; avatarColor?: string; avatarUrl?: string }[];
}

/* ═══════════════════════════════════════════════════════════
   STATUS CHECKBOX — with right-click dropdown
   ═══════════════════════════════════════════════════════════ */

function StatusCheckbox({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          haptic("light");
          onChange(config.nextStatus);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="shrink-0 p-1.5 -m-1 rounded-full transition-transform active:scale-90 group/check"
        title={`${config.label} — Click to cycle, right-click for all options`}
        aria-label={`Task status: ${config.label}. Click to change.`}
        role="checkbox"
        aria-checked={status === "completed"}
      >
        <Icon
          className="w-[18px] h-[18px] transition-colors"
          weight={status === "completed" ? "fill" : status === "todo" ? "regular" : "fill"}
          style={{ color: config.color }}
        />
      </button>

      {/* Status dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 py-1 rounded-[8px] shadow-lg z-50 min-w-[140px]"
            style={{
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-popup)",
            }}
          >
            {STATUS_OPTIONS.map((opt) => {
              const OptIcon = opt.icon;
              const isActive = status === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? opt.color : "var(--text-secondary)",
                  }}
                >
                  <OptIcon
                    className="w-4 h-4"
                    weight={opt.value === "completed" || isActive ? "fill" : "regular"}
                    style={{ color: opt.color }}
                  />
                  {opt.label}
                  {isActive && (
                    <Check className="w-3 h-3 ml-auto" style={{ color: opt.color }} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRIORITY FLAG — with dropdown picker
   ═══════════════════════════════════════════════════════════ */

function PriorityFlag({
  priority,
  onChange,
}: {
  priority: Priority;
  onChange: (priority: Priority) => void;
}) {
  const config = PRIORITY_CONFIG[priority];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const cycleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIdx = PRIORITY_CYCLE.indexOf(priority);
    const nextIdx = (currentIdx + 1) % PRIORITY_CYCLE.length;
    onChange(PRIORITY_CYCLE[nextIdx]);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={cycleNext}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className={`shrink-0 p-1 rounded-[4px] transition-all ${
          priority === "none"
            ? "opacity-0 group-hover/row:opacity-100"
            : "hover:bg-black/[0.04]"
        }`}
        title={priority === "none" ? "Set priority" : `${config.label} priority — Click to cycle, right-click for all`}
        aria-label={`Priority: ${config.label}. Click to change.`}
      >
        <Flag className="w-3.5 h-3.5" style={{ color: config.color }} weight={config.weight} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 py-1 rounded-[8px] shadow-lg z-50 min-w-[130px]"
            style={{
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-popup)",
            }}
          >
            {PRIORITY_CYCLE.slice().reverse().map((p) => {
              const pc = PRIORITY_CONFIG[p];
              const isActive = priority === p;
              return (
                <button
                  key={p}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(p);
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{
                    fontSize: "13px",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? pc.color : "var(--text-secondary)",
                  }}
                >
                  <Flag className="w-3.5 h-3.5" style={{ color: pc.color }} weight={pc.weight} />
                  {pc.label}
                  {isActive && (
                    <Check className="w-3 h-3 ml-auto" style={{ color: pc.color }} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DUE DATE BADGE — with inline date picker
   ═══════════════════════════════════════════════════════════ */

function DueDateBadge({
  date,
  onChange,
}: {
  date?: string;
  onChange?: (date: string | undefined) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  // Sync input with current date
  useEffect(() => {
    if (pickerOpen && date) {
      try {
        const d = new Date(date);
        setInputValue(d.toISOString().split("T")[0]);
      } catch {
        setInputValue("");
      }
    } else if (pickerOpen) {
      setInputValue(new Date().toISOString().split("T")[0]);
    }
  }, [pickerOpen, date]);

  useEffect(() => {
    if (pickerOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [pickerOpen]);

  let displayDate = "";
  let isOverdue = false;
  let isDueToday = false;

  if (date) {
    try {
      const d = new Date(date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const dDate = new Date(d);
      dDate.setHours(0, 0, 0, 0);

      const diff = dDate.getTime() - now.getTime();
      const days = Math.round(diff / (1000 * 60 * 60 * 24));

      if (days < 0) {
        isOverdue = true;
        displayDate = days === -1 ? "Yesterday" : `${Math.abs(days)}d overdue`;
      } else if (days === 0) {
        isDueToday = true;
        displayDate = "Today";
      } else if (days === 1) {
        displayDate = "Tomorrow";
      } else if (days < 7) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        displayDate = dayNames[d.getDay()];
      } else {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        displayDate = `${months[d.getMonth()]} ${d.getDate()}`;
      }
    } catch {
      displayDate = date;
    }
  }

  const color = isOverdue
    ? "oklch(0.7 0.18 25)"
    : isDueToday
    ? "oklch(0.55 0.2 280)"
    : "oklch(0.5 0.02 260)";

  const bgColor = isOverdue
    ? "oklch(0.7 0.18 25 / 0.08)"
    : isDueToday
    ? "oklch(0.55 0.2 280 / 0.08)"
    : "transparent";

  const handleDateSubmit = useCallback(() => {
    if (inputValue) {
      try {
        const d = new Date(inputValue + "T12:00:00");
        if (!isNaN(d.getTime())) {
          onChange?.(d.toISOString());
        }
      } catch { /* ignore */ }
    }
    setPickerOpen(false);
  }, [inputValue, onChange]);

  const handleQuickDate = useCallback((offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(12, 0, 0, 0);
    onChange?.(d.toISOString());
    setPickerOpen(false);
  }, [onChange]);

  if (!date && !onChange) return null;

  return (
    <div className="relative" ref={pickerRef}>
      {date ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onChange) setPickerOpen(!pickerOpen);
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] shrink-0 transition-colors hover:bg-black/[0.04]"
          style={{ color, background: bgColor, fontSize: "11px", fontWeight: 500 }}
        >
          <CalendarBlank className="w-3 h-3" />
          {displayDate}
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPickerOpen(!pickerOpen);
          }}
          className="shrink-0 p-1 rounded-[4px] opacity-0 group-hover/row:opacity-100 transition-opacity"
          title="Set due date"
        >
          <CalendarBlank className="w-3.5 h-3.5" style={{ color: "oklch(0.85 0.01 260)" }} />
        </button>
      )}

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 p-2 rounded-[8px] shadow-lg z-50 min-w-[180px]"
            style={{
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-popup)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick date buttons */}
            <div className="space-y-0.5 mb-2">
              {[
                { label: "Today", offset: 0 },
                { label: "Tomorrow", offset: 1 },
                { label: "Next Week", offset: 7 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleQuickDate(opt.offset)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-[4px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  <CalendarBlank className="w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="h-px mb-2" style={{ background: "var(--border-subtle)" }} />

            {/* Date input */}
            <div className="flex items-center gap-1.5">
              <input
                ref={inputRef}
                type="date"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDateSubmit();
                  if (e.key === "Escape") setPickerOpen(false);
                }}
                className="flex-1 min-w-0 rounded-[4px] px-2 py-1 text-xs outline-none"
                style={{
                  background: "var(--neutral-100)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  fontFamily: "'Albert Sans', sans-serif",
                }}
              />
              <button
                onClick={handleDateSubmit}
                className="p-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
                style={{ color: "var(--accent-primary)" }}
              >
                <Check className="w-3.5 h-3.5" weight="bold" />
              </button>
            </div>

            {/* Remove date */}
            {date && (
              <>
                <div className="h-px my-2" style={{ background: "var(--border-subtle)" }} />
                <button
                  onClick={() => {
                    onChange?.(undefined);
                    setPickerOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-[4px] text-left transition-colors hover:bg-black/[0.04]"
                  style={{ fontSize: "12px", color: "oklch(0.7 0.18 25)" }}
                >
                  <X className="w-3.5 h-3.5" />
                  Remove date
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ASSIGNEE AVATAR — with picker popup
   ═══════════════════════════════════════════════════════════ */

function AssigneeAvatar({
  name,
  color,
  avatarUrl,
  onChange,
  teamMembers,
}: {
  name?: string;
  color?: string;
  avatarUrl?: string;
  onChange?: (assignee: string | undefined) => void;
  teamMembers?: { userId: string; displayName: string; avatarColor?: string; avatarUrl?: string }[];
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");

  // Close on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  const filteredMembers = useMemo(() => {
    if (!teamMembers) return [];
    if (!search) return teamMembers;
    const q = search.toLowerCase();
    return teamMembers.filter((m) => m.displayName.toLowerCase().includes(q));
  }, [teamMembers, search]);

  const initials = name
    ? name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  if (!name && !onChange) return null;

  return (
    <div className="relative" ref={pickerRef}>
      {name ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onChange) {
              setSearch("");
              setPickerOpen(!pickerOpen);
            }
          }}
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-110 overflow-hidden"
          style={{ background: color || "oklch(0.82 0.12 25)" }}
          title={name}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span
              style={{
                color: "white",
                fontSize: "8px",
                fontWeight: 700,
                lineHeight: 1,
                textShadow: "0 0.5px 1px oklch(0 0 0 / 0.15)",
              }}
            >
              {initials}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSearch("");
            setPickerOpen(!pickerOpen);
          }}
          className="shrink-0 p-1 rounded-[4px] opacity-0 group-hover/row:opacity-100 transition-opacity"
          title="Assign"
        >
          <UserCircle className="w-3.5 h-3.5" style={{ color: "oklch(0.85 0.01 260)" }} />
        </button>
      )}

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 rounded-[8px] shadow-lg z-50 min-w-[180px] max-h-[220px] overflow-hidden flex flex-col"
            style={{
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-popup)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="p-1.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full rounded-[4px] px-2 py-1 text-xs outline-none"
                style={{
                  background: "var(--neutral-100)",
                  color: "var(--text-primary)",
                  fontFamily: "'Albert Sans', sans-serif",
                }}
              />
            </div>

            <div className="overflow-y-auto py-1">
              {/* Unassign option */}
              {name && (
                <button
                  onClick={() => {
                    onChange?.(undefined);
                    setPickerOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ fontSize: "12px", color: "oklch(0.7 0.18 25)" }}
                >
                  <X className="w-3.5 h-3.5" />
                  Unassign
                </button>
              )}

              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  const isActive = name === member.displayName;
                  const mi = member.displayName
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <button
                      key={member.userId}
                      onClick={() => {
                        onChange?.(member.displayName);
                        setPickerOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      style={{
                        fontSize: "12px",
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ background: member.avatarColor || "oklch(0.82 0.12 25)" }}
                      >
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span style={{ color: "white", fontSize: "7px", fontWeight: 700 }}>{mi}</span>
                        )}
                      </div>
                      <span className="truncate">{member.displayName}</span>
                      {isActive && <Check className="w-3 h-3 ml-auto shrink-0" style={{ color: "var(--accent-primary)" }} />}
                    </button>
                  );
                })
              ) : (
                <div
                  className="px-3 py-4 text-center"
                  style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
                >
                  {teamMembers && teamMembers.length > 0 ? "No matches" : "No team members"}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SWIPE THRESHOLD
   ═══════════════════════════════════════════════════════════ */

const SWIPE_COMPLETE_THRESHOLD = 80;
const SWIPE_DELETE_THRESHOLD = -80;

/* ══════════════════════════════════════════════════════════
   TASK ROW COMPONENT
   ══════════════════════════════════════════════════════════ */

export const TaskRow = memo(function TaskRow({
  task,
  projectName,
  projectColor,
  onStatusChange,
  onTitleChange,
  onPriorityChange,
  onDelete,
  onToggleToday,
  isToday: isTodayProp = false,
  isStarred = false,
  onToggleStar,
  onDateChange,
  onAssigneeChange,
  onToggleLineup,
  isLineup = false,
  onTaskClick,
  showProject = false,
  compact = false,
  subtaskCount,
  subtaskCompleted,
  teamMembers,
}: TaskRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [bottomSheet, setBottomSheet] = useState(false);
  const [longPressing, setLongPressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchMoved = useRef(false);

  // Swipe state
  const x = useMotionValue(0);
  const swipeBg = useTransform(x, [-100, 0, 100], [
    "oklch(0.7 0.18 25 / 0.15)",
    "transparent",
    "oklch(0.65 0.15 180 / 0.15)",
  ]);

  // Focus input when editing starts
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Close context menu on outside click / escape
  useEffect(() => {
    if (!ctxMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtxMenu(null);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtxMenu(null);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ctxMenu]);

  const handleTitleClick = useCallback(() => {
    if (task.status === "completed") return;
    setEditValue(task.title);
    setEditing(true);
  }, [task.title, task.status]);

  const handleTitleSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onTitleChange?.(task.id, trimmed);
    }
    setEditing(false);
  }, [editValue, task.id, task.title, onTitleChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleTitleSubmit();
      } else if (e.key === "Escape") {
        setEditValue(task.title);
        setEditing(false);
      }
    },
    [handleTitleSubmit, task.title]
  );

  const handleDragEnd = useCallback(
    (_: any, info: { offset: { x: number } }) => {
      if (info.offset.x > SWIPE_COMPLETE_THRESHOLD) {
        haptic("success");
        if (task.status === "completed") {
          onStatusChange?.(task.id, "todo");
        } else {
          onStatusChange?.(task.id, "completed");
        }
      } else if (info.offset.x < SWIPE_DELETE_THRESHOLD) {
        haptic("warning");
        onDelete?.(task.id);
      }
    },
    [task.id, task.status, onStatusChange, onDelete]
  );

  const isCompleted = task.status === "completed";

  /* ── Status pill helpers ── */
  const statusLabel = STATUS_CONFIG[task.status]?.label || "To Do";
  const statusColor = STATUS_CONFIG[task.status]?.color || "var(--text-quaternary)";

  return (
    <div
      className="relative overflow-x-clip"
      ref={rowRef}
    >
      {/* Swipe background indicators (mobile only) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-5 pointer-events-none md:hidden"
        style={{ background: swipeBg }}
      >
        <div className="flex items-center gap-2" style={{ color: "oklch(0.65 0.15 180)" }}>
          <Check className="w-5 h-5" weight="bold" />
        </div>
        <div className="flex items-center gap-2" style={{ color: "oklch(0.7 0.18 25)" }}>
          <Trash className="w-5 h-5" weight="bold" />
        </div>
      </motion.div>

      {/* Row content — motion handles swipe gestures on mobile */}
      <motion.div
        className="group/row flex items-stretch transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015] cursor-default"
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        onTouchStart={(e) => {
          touchMoved.current = false;
          setLongPressing(false);
          // Start visual feedback after a short threshold (100ms confirms intent)
          longPressStartTimer.current = setTimeout(() => {
            if (!touchMoved.current) {
              setLongPressing(true);
              haptic("light");
            }
          }, 100);
          longPressTimer.current = setTimeout(() => {
            if (!touchMoved.current) {
              setLongPressing(false);
              setBottomSheet(true);
              haptic("medium");
            }
          }, 500);
        }}
        onTouchMove={() => {
          touchMoved.current = true;
          setLongPressing(false);
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          if (longPressStartTimer.current) {
            clearTimeout(longPressStartTimer.current);
            longPressStartTimer.current = null;
          }
        }}
        onTouchEnd={() => {
          setLongPressing(false);
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
          if (longPressStartTimer.current) {
            clearTimeout(longPressStartTimer.current);
            longPressStartTimer.current = null;
          }
        }}
        style={{
          x,
          background: "var(--surface-bg)",
          opacity: isCompleted ? 0.55 : 1,
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        {/* ── LEFT: Task name cell ── */}
        <div
          className={`flex-1 flex items-center gap-2 min-w-0 border-r ${compact ? "px-2 py-1.5 sm:py-1.5" : "px-3 py-2.5 sm:py-[7px]"}`}
          style={{ borderColor: "var(--border-subtle)" }}
        >
          {/* Drag handle — stops pointer propagation so Motion doesn't capture */}
          <div
            draggable
            onPointerDown={(e) => e.stopPropagation()}
            onDragStart={(e) => {
              e.stopPropagation();
              const payload: DragPayload = {
                type: "task",
                id: task.id,
                title: task.title,
                projectName: projectName,
                taskDate: task.date,
                taskStatus: task.status,
              };
              setDragData(e, payload);
              if (rowRef.current) {
                e.dataTransfer.setDragImage(rowRef.current, 40, 20);
              }
            }}
            className="hidden md:flex items-center justify-center shrink-0 w-[16px] h-[16px] opacity-0 group-hover/row:opacity-100 transition-opacity cursor-grab active:cursor-grabbing -ml-1 mr-[-4px]"
            style={{ color: "var(--text-quaternary)" }}
            title="Drag to sidebar panels"
          >
            <DotsSixVertical size={14} weight="bold" />
          </div>

          {/* Status checkbox */}
          <StatusCheckbox
            status={task.status}
            onChange={(s) => onStatusChange?.(task.id, s)}
          />

          {/* Title + inline meta */}
          <div
            className="flex-1 min-w-0 flex items-center gap-1.5"
            onClick={() => !editing && onTaskClick?.(task.id)}
            style={{ cursor: onTaskClick ? "pointer" : undefined }}
          >
            {editing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 bg-transparent outline-none border-none"
                style={{
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 400,
                  fontFamily: "'Albert Sans', sans-serif",
                  padding: 0,
                  margin: 0,
                }}
              />
            ) : (
              <span
                onDoubleClick={handleTitleClick}
                onClick={(e) => {
                  if (!onTaskClick) {
                    e.stopPropagation();
                    handleTitleClick();
                  }
                }}
                className={`truncate ${isCompleted ? "line-through" : ""}`}
                style={{
                  color: isCompleted ? "var(--text-quaternary)" : "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 400,
                  cursor: onTaskClick ? "pointer" : "text",
                }}
              >
                {task.title}
              </span>
            )}

            {/* Project badge (inline) */}
            {showProject && projectName && (
              <span
                className="shrink-0 inline-flex items-center gap-1 truncate max-w-[120px]"
                style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 500 }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: projectColor || "var(--neutral-400)" }} />
                {projectName}
              </span>
            )}

            {/* Subtask progress */}
            {subtaskCount !== undefined && subtaskCount > 0 && (
              <span className="shrink-0 inline-flex items-center gap-1" style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
                <span className="relative w-7 h-1 rounded-full overflow-hidden" style={{ background: "var(--neutral-200)" }}>
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${((subtaskCompleted || 0) / subtaskCount) * 100}%`,
                      background: (subtaskCompleted || 0) === subtaskCount ? "oklch(0.65 0.15 180)" : "oklch(0.55 0.2 280)",
                    }}
                  />
                </span>
                {subtaskCompleted || 0}/{subtaskCount}
              </span>
            )}

            {/* Recurrence indicator */}
            {task.recurrence && (
              <span
                className="shrink-0 inline-flex items-center gap-0.5"
                style={{ color: "var(--text-quaternary)", fontSize: "10px" }}
                title={`Repeats ${task.recurrence.frequency}`}
              >
                <ArrowsClockwise className="w-3 h-3" />
              </span>
            )}

            {/* Blocked indicator */}
            {(task.blockedBy?.length ?? 0) > 0 && !isCompleted && (
              <span
                className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.5 rounded-[3px]"
                style={{
                  background: "oklch(0.7 0.18 25 / 0.08)",
                  color: "oklch(0.7 0.18 25)",
                  fontSize: "9px",
                  fontWeight: 600,
                }}
                title={`Blocked by ${task.blockedBy!.length} task(s)`}
              >
                Blocked
              </span>
            )}
          </div>

          {/* Inline hover-reveal Today/Lineup toggle buttons */}
          <div className="hidden sm:flex items-center gap-0.5 shrink-0 ml-auto mr-1">
            {onToggleToday && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleToday(task.id); }}
                className={`p-0.5 rounded-[4px] transition-all duration-150 ${
                  isTodayProp
                    ? "opacity-100"
                    : "opacity-0 group-hover/row:opacity-40 hover:!opacity-80"
                }`}
                style={{
                  color: isTodayProp ? "#F59E0B" : "var(--text-quaternary)",
                  background: isTodayProp ? "rgba(245, 158, 11, 0.1)" : undefined,
                }}
                title={isTodayProp ? "Remove from Today" : "Add to Today"}
              >
                <Sun className="w-3.5 h-3.5" weight={isTodayProp ? "fill" : "regular"} />
              </button>
            )}
            {onToggleLineup && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleLineup(task.id); }}
                className={`p-0.5 rounded-[4px] transition-all duration-150 ${
                  isLineup
                    ? "opacity-100"
                    : "opacity-0 group-hover/row:opacity-40 hover:!opacity-80"
                }`}
                style={{
                  color: isLineup ? "#3B82F6" : "var(--text-quaternary)",
                  background: isLineup ? "rgba(59, 130, 246, 0.1)" : undefined,
                }}
                title={isLineup ? "Remove from Lineup" : "Add to Lineup"}
              >
                <Queue className="w-3.5 h-3.5" weight={isLineup ? "fill" : "regular"} />
              </button>
            )}
          </div>
        </div>

        {/* ─ RIGHT: Columnar metadata cells (hidden on very small mobile) ── */}
        <div className="hidden sm:grid items-stretch shrink-0" style={{ gridTemplateColumns: "80px 64px 72px 40px 28px" }}>
          {/* Status cell */}
          <div className="flex items-center justify-center border-r" style={{ borderColor: "var(--border-subtle)" }}>
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                background: `${statusColor}15`,
                color: statusColor,
                fontSize: "10px",
                fontWeight: 500,
              }}
            >
              {statusLabel}
            </span>
          </div>

          {/* Priority cell */}
          <div className="flex items-center justify-center border-r" style={{ borderColor: "var(--border-subtle)" }}>
            <PriorityFlag
              priority={task.priority || "none"}
              onChange={(p) => onPriorityChange?.(task.id, p)}
            />
          </div>

          {/* Due date cell */}
          <div className="flex items-center justify-center border-r" style={{ borderColor: "var(--border-subtle)" }}>
            <DueDateBadge
              date={task.date}
              onChange={onDateChange ? (d) => onDateChange(task.id, d) : undefined}
            />
          </div>

          {/* Assignee cell */}
          <div className="flex items-center justify-center">
            <AssigneeAvatar
              name={task.assignee}
              color={
                task.assignee && teamMembers
                  ? teamMembers.find((m) => m.displayName === task.assignee)?.avatarColor
                  : undefined
              }
              avatarUrl={
                task.assignee && teamMembers
                  ? teamMembers.find((m) => m.displayName === task.assignee)?.avatarUrl
                  : undefined
              }
              onChange={onAssigneeChange ? (a) => onAssigneeChange(task.id, a) : undefined}
              teamMembers={teamMembers}
            />
          </div>

          {/* More / actions cell */}
          <div className="flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setCtxMenu({ x: rect.left, y: rect.bottom });
              }}
              className="p-0.5 rounded opacity-0 group-hover/row:opacity-100 hover:bg-black/[0.04]"
            >
              <DotsThree className="w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
            </button>
          </div>
        </div>

        {/* ── MOBILE: compact right-side actions (visible on sm-down) ── */}
        <div className="flex sm:hidden items-center gap-0.5 shrink-0 px-2">
          <PriorityFlag
            priority={task.priority || "none"}
            onChange={(p) => onPriorityChange?.(task.id, p)}
          />
          <DueDateBadge
            date={task.date}
            onChange={onDateChange ? (d) => onDateChange(task.id, d) : undefined}
          />
          <AssigneeAvatar
            name={task.assignee}
            color={
              task.assignee && teamMembers
                ? teamMembers.find((m) => m.displayName === task.assignee)?.avatarColor
                : undefined
            }
            avatarUrl={
              task.assignee && teamMembers
                ? teamMembers.find((m) => m.displayName === task.assignee)?.avatarUrl
                : undefined
            }
            onChange={onAssigneeChange ? (a) => onAssigneeChange(task.id, a) : undefined}
            teamMembers={teamMembers}
          />
        </div>
      </motion.div>

      {/* Context menu */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            ref={ctxRef}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
            className="fixed py-1 rounded-[8px] shadow-lg z-[9999] min-w-[180px]"
            style={{
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "var(--shadow-popup)",
              left: `${Math.min(ctxMenu.x, window.innerWidth - 200)}px`,
              top: `${Math.min(ctxMenu.y, window.innerHeight - 200)}px`,
            }}
          >
            {/* Open detail */}
            {onTaskClick && (
              <button
                onClick={() => { setCtxMenu(null); onTaskClick(task.id); }}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                style={{ fontSize: "13px", color: "var(--text-primary)" }}
              >
                <ArrowRight className="w-4 h-4" style={{ color: "var(--text-quaternary)" }} />
                Open task
              </button>
            )}

            {/* Separator after Open */}
            {onTaskClick && <div className="mx-2 my-1" style={{ height: "1px", background: "var(--border-default)" }} />}

            <button
              onClick={() => { setCtxMenu(null); onToggleToday?.(task.id); }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: "13px", color: isTodayProp ? "#F59E0B" : "var(--text-secondary)" }}
            >
              <Sun className="w-4 h-4" weight={isTodayProp ? "fill" : "regular"} style={isTodayProp ? { color: "#F59E0B" } : undefined} />
              {isTodayProp ? "Remove from Today" : "Add to Today"}
            </button>

            <button
              onClick={() => { setCtxMenu(null); onToggleLineup?.(task.id); }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: "13px", color: isLineup ? "#3B82F6" : "var(--text-secondary)" }}
            >
              <Queue className="w-4 h-4" weight={isLineup ? "fill" : "regular"} style={isLineup ? { color: "#3B82F6" } : undefined} />
              {isLineup ? "Remove from Lineup" : "Add to Lineup"}
            </button>

            <button
              onClick={() => { setCtxMenu(null); onToggleStar?.(task.id); }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: "13px", color: isStarred ? "oklch(0.85 0.15 85)" : "var(--text-secondary)" }}
            >
              <Star className="w-4 h-4" weight={isStarred ? "fill" : "regular"} style={isStarred ? { color: "oklch(0.85 0.15 85)" } : undefined} />
              {isStarred ? "Unstar" : "Star"}
            </button>

            {/* Separator */}
            <div className="mx-2 my-1" style={{ height: "1px", background: "var(--border-default)" }} />

            <button
              onClick={() => { setCtxMenu(null); onDelete?.(task.id); }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: "13px", color: "oklch(0.7 0.18 25)" }}
            >
              <Trash className="w-4 h-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet (long-press context menu) — vaul Drawer */}
      <VaulDrawer.Root open={bottomSheet} onOpenChange={(v) => !v && setBottomSheet(false)}>
        <VaulDrawer.Portal>
          <VaulDrawer.Overlay
            className="fixed inset-0 z-[9999] bg-black/40"
            style={{ backdropFilter: "blur(2px)" }}
          />
          <VaulDrawer.Content
            className="fixed z-[9999] inset-x-0 bottom-0 rounded-t-[16px] overflow-hidden"
            style={{
              background: "var(--surface-bg)",
              paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--neutral-300)" }} />
            </div>

            <VaulDrawer.Title className="sr-only">{task.title}</VaulDrawer.Title>

            {/* Task title header */}
            <div className="px-4 pb-2 mb-1" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <p className="truncate" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
                {task.title}
              </p>
            </div>

            {/* Actions */}
            <div className="py-1">
              {onTaskClick && (
                <button
                  onClick={() => { setBottomSheet(false); onTaskClick(task.id); }}
                  className="flex items-center gap-3 w-full px-5 py-3 text-left active:bg-black/[0.04]"
                  style={{ fontSize: "15px", color: "var(--text-primary)", minHeight: "48px" }}
                >
                  <ArrowRight className="w-5 h-5" style={{ color: "var(--text-quaternary)" }} />
                  Open task
                </button>
              )}

              <button
                onClick={() => { setBottomSheet(false); haptic("light"); onToggleToday?.(task.id); }}
                className="flex items-center gap-3 w-full px-5 py-3 text-left active:bg-black/[0.04]"
                style={{ fontSize: "15px", color: isTodayProp ? "#F59E0B" : "var(--text-primary)", minHeight: "48px" }}
              >
                <Sun className="w-5 h-5" weight={isTodayProp ? "fill" : "regular"} style={isTodayProp ? { color: "#F59E0B" } : undefined} />
                {isTodayProp ? "Remove from Today" : "Add to Today"}
              </button>

              <button
                onClick={() => { setBottomSheet(false); haptic("light"); onToggleLineup?.(task.id); }}
                className="flex items-center gap-3 w-full px-5 py-3 text-left active:bg-black/[0.04]"
                style={{ fontSize: "15px", color: isLineup ? "#3B82F6" : "var(--text-primary)", minHeight: "48px" }}
              >
                <Queue className="w-5 h-5" weight={isLineup ? "fill" : "regular"} style={isLineup ? { color: "#3B82F6" } : undefined} />
                {isLineup ? "Remove from Lineup" : "Add to Lineup"}
              </button>

              <button
                onClick={() => { setBottomSheet(false); haptic("light"); onToggleStar?.(task.id); }}
                className="flex items-center gap-3 w-full px-5 py-3 text-left active:bg-black/[0.04]"
                style={{ fontSize: "15px", color: isStarred ? "oklch(0.85 0.15 85)" : "var(--text-primary)", minHeight: "48px" }}
              >
                <Star className="w-5 h-5" weight={isStarred ? "fill" : "regular"} style={isStarred ? { color: "oklch(0.85 0.15 85)" } : undefined} />
                {isStarred ? "Unstar" : "Star"}
              </button>

              {/* Separator */}
              <div className="mx-4 my-1" style={{ height: "1px", background: "var(--border-default)" }} />

              <button
                onClick={() => { setBottomSheet(false); haptic("warning"); onDelete?.(task.id); }}
                className="flex items-center gap-3 w-full px-5 py-3 text-left active:bg-black/[0.04]"
                style={{ fontSize: "15px", color: "oklch(0.7 0.18 25)", minHeight: "48px" }}
              >
                <Trash className="w-5 h-5" />
                Delete
              </button>
            </div>

            {/* Cancel */}
            <div className="px-4 pt-1">
              <button
                onClick={() => setBottomSheet(false)}
                className="w-full py-3 rounded-[8px] text-center active:bg-black/[0.04]"
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  background: "var(--neutral-100)",
                  minHeight: "48px",
                }}
              >
                Cancel
              </button>
            </div>
          </VaulDrawer.Content>
        </VaulDrawer.Portal>
      </VaulDrawer.Root>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   TASK LIST — Group of task rows with add-task
   ═══════════════════════════════════════════════════════════ */

export function TaskList({
  tasks,
  projectName,
  projectColor,
  onStatusChange,
  onTitleChange,
  onPriorityChange,
  onDelete,
  onToggleToday,
  onToggleStar,
  onDateChange,
  onAssigneeChange,
  onToggleLineup,
  onTaskClick,
  todayIds,
  starredIds,
  lineupIds,
  showProject = false,
  compact = false,
  emptyMessage = "No tasks",
  onAddTask,
  teamMembers,
}: {
  tasks: (TaskItem & { projectName?: string })[];
  projectName?: string;
  projectColor?: string;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onTitleChange?: (taskId: string, title: string) => void;
  onPriorityChange?: (taskId: string, priority: Priority) => void;
  onDelete?: (taskId: string) => void;
  onToggleToday?: (taskId: string) => void;
  onToggleStar?: (taskId: string) => void;
  onDateChange?: (taskId: string, date: string | undefined) => void;
  onAssigneeChange?: (taskId: string, assignee: string | undefined) => void;
  onToggleLineup?: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  todayIds?: Set<string>;
  starredIds?: Set<string>;
  lineupIds?: Set<string>;
  showProject?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  onAddTask?: () => void;
  teamMembers?: { userId: string; displayName: string; avatarColor?: string }[];
}) {
  if (tasks.length === 0 && !onAddTask) {
    return (
      <div
        className="flex items-center justify-center py-8 rounded-[6px]"
        style={{ color: "var(--text-quaternary)", fontSize: "13px" }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TaskRow
              task={task}
              projectName={task.projectName || projectName}
              projectColor={projectColor}
              onStatusChange={onStatusChange}
              onTitleChange={onTitleChange}
              onPriorityChange={onPriorityChange}
              onDelete={onDelete}
              onToggleToday={onToggleToday}
              isToday={todayIds?.has(task.id)}
              isStarred={starredIds?.has(task.id)}
              onToggleStar={onToggleStar}
              onDateChange={onDateChange}
              onAssigneeChange={onAssigneeChange}
              onToggleLineup={onToggleLineup}
              isLineup={lineupIds?.has(task.id)}
              onTaskClick={onTaskClick}
              showProject={showProject}
              compact={compact}
              subtaskCount={task.subtasks?.length}
              subtaskCompleted={task.subtasks?.filter((s) => s.completed).length}
              teamMembers={teamMembers}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add task button */}
      {onAddTask && (
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 w-full rounded-[6px] px-3 py-2 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] group"
          style={{ color: "var(--text-quaternary)", fontSize: "13px" }}
        >
          <span
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center border border-dashed transition-colors group-hover:border-solid"
            style={{ borderColor: "var(--neutral-400)" }}
          >
            <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span>
          </span>
          <span className="group-hover:text-[var(--text-tertiary)] transition-colors">
            Add task...
          </span>
        </button>
      )}
    </div>
  );
}

export default TaskRow;