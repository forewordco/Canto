/* ═══════════════════════════════════════════════════════════
   CALENDAR PAGE — Full month/day calendar view.

   Features:
   - Month grid with today highlight and dot indicators
   - Tasks and events shown per day (grouped by project color)
   - Click/tap day → slide-up day detail panel
   - Navigation: prev/next month, jump to today
   - "Week View" toggle link → navigates to week page
   - Mobile: compact grid with bottom sheet day detail
   - Desktop: side panel for selected day

   Phase 8 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Plus,
  Clock,
  MapPin,
  Circle,
  CheckCircle,
  X,
  DotsThree,
  Trash,
  PencilSimple,
  Rows,
  GridFour,
  ArrowRight,
  Users,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData, useAllTasks } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { useAuth } from "../lib/auth";
import type { TaskItem, CalendarEvent } from "../lib/types";
import { ResponsiveModal } from "./ResponsiveModal";
import { Drawer as VaulDrawer } from "vaul";
import { haptic } from "../lib/haptics";

/* ─── Date Helpers ─── */

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function getWeekDays(weekStart: "sunday" | "monday"): string[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (weekStart === "monday") {
    return [...days.slice(1), days[0]];
  }
  return days;
}

function getCalendarDays(month: Date, weekStart: "sunday" | "monday"): Date[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const startDay = start.getDay();
  const offset = weekStart === "monday" ? (startDay === 0 ? 6 : startDay - 1) : startDay;

  const days: Date[] = [];

  // Previous month padding
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - i - 1);
    days.push(d);
  }

  // Current month
  for (let i = 1; i <= end.getDate(); i++) {
    days.push(new Date(month.getFullYear(), month.getMonth(), i));
  }

  // Next month padding (fill to 42 = 6 weeks)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(end.getFullYear(), end.getMonth() + 1, i));
  }

  return days;
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDayHeader(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function parseDateSafe(s: string | undefined): Date | null {
  if (!s) return null;
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

/* ─── Project Color Map ─── */

function useProjectColorMap(): Record<string, string> {
  const { projects } = useData();
  const map: Record<string, string> = {};
  for (const [name, project] of Object.entries(projects)) {
    map[name] = project.color || "oklch(0.65 0.015 260)";
  }
  return map;
}

/* ─── Day Items Type ─── */

interface DayItem {
  type: "task" | "event";
  id: string;
  title: string;
  time?: string;
  color: string;
  completed?: boolean;
  projectName?: string;
  location?: string;
  isAllDay?: boolean;
  attendees?: string[];
}

/* ═══════════════════════════════════════════════════════════
   ADD EVENT MODAL
   ═══════════════════════════════════════════════════════════ */

function AddEventModal({
  date,
  onClose,
  onAdd,
}: {
  date: Date;
  onClose: () => void;
  onAdd: (event: CalendarEvent) => void;
}) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!title.trim()) return;
    const event: CalendarEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      date: date.toISOString().split("T")[0],
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      location: location.trim() || undefined,
      isAllDay: allDay,
    };
    onAdd(event);
    onClose();
  };

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title="New Event"
      description={formatDayHeader(date)}
    >
      <div className="space-y-3">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Event title"
          className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none transition-colors"
          style={{
            background: "var(--neutral-100)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="accent-[oklch(0.7_0.18_25)]"
          />
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>All day</span>
        </label>

        {!allDay && (
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="px-3 py-2 rounded-[6px] text-[13px] outline-none"
              style={{
                background: "var(--neutral-100)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
            <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>to</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="px-3 py-2 rounded-[6px] text-[13px] outline-none"
              style={{
                background: "var(--neutral-100)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
              }}
            />
          </div>
        )}

        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location (optional)"
          className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none transition-colors"
          style={{
            background: "var(--neutral-100)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-80"
          style={{
            color: "var(--text-secondary)",
            background: "var(--neutral-100)",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-[6px] text-[13px] font-medium text-white transition-colors hover:opacity-90"
          style={{ background: "oklch(0.7 0.18 25)" }}
        >
          Add Event
        </button>
      </div>
    </ResponsiveModal>
  );
}

/* ═══════════════════════════════════════════════════════════
   DAY DETAIL PANEL
   ═══════════════════════════════════════════════════════════ */

function DayDetailPanel({
  date,
  items,
  onClose,
  onAddEvent,
  onToggleTask,
  onDeleteEvent,
  isMobile,
}: {
  date: Date;
  items: DayItem[];
  onClose: () => void;
  onAddEvent: () => void;
  onToggleTask: (projectName: string, taskId: string) => void;
  onDeleteEvent: (eventId: string) => void;
  isMobile: boolean;
}) {
  const tasks = items.filter((i) => i.type === "task");
  const events = items.filter((i) => i.type === "event");

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div>
          <h3 style={{ color: "var(--text-primary)", fontSize: "15px", fontWeight: 600 }}>
            {formatDayHeader(date)}
          </h3>
          <p style={{ color: "var(--text-tertiary)", fontSize: "12px", marginTop: "2px" }}>
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onAddEvent}
            className="p-1.5 rounded-[6px] transition-colors hover:opacity-80"
            style={{ color: "oklch(0.7 0.18 25)" }}
            title="Add event"
          >
            <Plus size={18} weight="bold" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] transition-colors hover:opacity-80"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarBlank size={32} style={{ color: "var(--text-quaternary)" }} />
            <p style={{ color: "var(--text-tertiary)", fontSize: "13px", marginTop: "8px" }}>
              Nothing scheduled
            </p>
            <button
              onClick={onAddEvent}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-90"
              style={{ color: "oklch(0.7 0.18 25)", background: "oklch(0.7 0.18 25 / 0.1)" }}
            >
              <Plus size={14} weight="bold" />
              Add event
            </button>
          </div>
        )}

        {events.length > 0 && (
          <div className="space-y-1 mb-3">
            <p style={{ color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Events
            </p>
            {events.map((evt) => (
              <div
                key={evt.id}
                className="group flex items-start gap-2.5 px-2.5 py-2 rounded-[6px] transition-colors"
                style={{ background: "var(--neutral-50)" }}
              >
                <div
                  className="w-1 rounded-full mt-1 shrink-0"
                  style={{ background: evt.color, height: "32px" }}
                />
                <div className="flex-1 min-w-0">
                  <p style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
                    {evt.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {evt.time && (
                      <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                        <Clock size={12} />
                        {evt.time}
                      </span>
                    )}
                    {evt.isAllDay && (
                      <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>All day</span>
                    )}
                    {evt.location && (
                      <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                        <MapPin size={12} />
                        {evt.location}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDeleteEvent(evt.id)}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="space-y-1">
            <p style={{ color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Tasks
            </p>
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] transition-colors cursor-pointer hover:bg-black/[0.02]"
              >
                <button
                  onClick={() => task.projectName && onToggleTask(task.projectName, task.id)}
                  className="shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle size={18} weight="fill" style={{ color: "oklch(0.65 0.15 180)" }} />
                  ) : (
                    <Circle size={18} style={{ color: task.color }} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      color: task.completed ? "var(--text-tertiary)" : "var(--text-primary)",
                      fontSize: "13px",
                      fontWeight: 500,
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </p>
                  {task.projectName && (
                    <p style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
                      {task.projectName}
                    </p>
                  )}
                </div>
                {task.time && (
                  <span className="flex items-center gap-1 shrink-0" style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                    <Clock size={12} />
                    {task.time}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <VaulDrawer.Root open={true} onOpenChange={(v) => !v && onClose()}>
        <VaulDrawer.Portal>
          <VaulDrawer.Overlay
            className="fixed inset-0 z-40 bg-black/30"
            style={{ backdropFilter: "blur(2px)" }}
          />
          <VaulDrawer.Content
            className="fixed z-40 inset-x-0 bottom-0 flex flex-col rounded-t-[16px] overflow-hidden"
            style={{
              background: "var(--surface-bg)",
              maxHeight: "65vh",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--neutral-300)" }} />
            </div>
            <VaulDrawer.Title className="sr-only">{formatDayHeader(date)}</VaulDrawer.Title>
            {content}
          </VaulDrawer.Content>
        </VaulDrawer.Portal>
      </VaulDrawer.Root>
    );
  }

  return (
    <motion.div
      className="rounded-[8px] overflow-hidden h-full"
      style={{
        background: "var(--surface-bg)",
        border: "1px solid #eef0f4",
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {content}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR PAGE — Main Export
   ═══════════════════════════════════════════════════════════ */

export function CalendarPage() {
  const { events, addEvent, deleteEvent, updateTask, loadError, reload } = useData();
  const { profile } = useAuth();
  const { navigate } = useNavigation();
  const allTasks = useAllTasks();
  const projectColors = useProjectColorMap();
  const weekStart = profile?.weekStart || "monday";

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addEventDate, setAddEventDate] = useState<Date | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const calendarDays = useMemo(() => getCalendarDays(currentMonth, weekStart), [currentMonth, weekStart]);
  const weekDayNames = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Build day → items map
  const dayItemsMap = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    const getKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    // Add tasks
    for (const task of allTasks) {
      const d = parseDateSafe(task.date);
      if (!d) continue;
      const key = getKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        type: "task",
        id: task.id,
        title: task.title,
        time: task.dueTime || task.startTime,
        color: projectColors[task.projectName] || "oklch(0.65 0.015 260)",
        completed: task.completed,
        projectName: task.projectName,
      });
    }

    // Add events
    const safeEvents = Array.isArray(events) ? events : [];
    for (const evt of safeEvents) {
      const d = parseDateSafe(evt.date);
      if (!d) continue;
      const key = getKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        type: "event",
        id: evt.id,
        title: evt.title,
        time: evt.startTime && evt.endTime ? `${evt.startTime} – ${evt.endTime}` : evt.startTime,
        color: evt.color || "oklch(0.55 0.2 280)",
        location: evt.location,
        isAllDay: evt.isAllDay,
        attendees: evt.attendees,
      });
    }

    return map;
  }, [allTasks, events, projectColors]);

  const getDayItems = (d: Date): DayItem[] => {
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    return dayItemsMap.get(key) || [];
  };

  const selectedDayItems = selectedDate ? getDayItems(selectedDate) : [];

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const handleToggleTask = (projectName: string, taskId: string) => {
    const task = allTasks.find((t) => t.id === taskId && t.projectName === projectName);
    if (task) {
      haptic("light");
      updateTask(projectName, taskId, { completed: !task.completed, status: task.completed ? "todo" : "completed" });
    }
  };

  const todayInView = currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear();

  /* ── Data load error fallback ── */
  if (loadError && events.length === 0 && allTasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto"
            style={{ background: "oklch(0.95 0.04 60)" }}
          >
            <Warning className="w-6 h-6" style={{ color: "oklch(0.7 0.15 60)" }} weight="fill" />
          </div>
          <div>
            <h3
              className="mb-1"
              style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}
            >
              Unable to load calendar
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
              {loadError}
            </p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
            style={{
              background: "var(--accent-primary)",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <ArrowClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-4 md:px-6 pt-4 md:pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700 }}>
              Calendar
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("week")}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)", background: "var(--neutral-100)" }}
            >
              <Rows size={14} />
              Week View
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${todayInView ? "opacity-50" : "hover:opacity-80"}`}
              style={{ color: "oklch(0.7 0.18 25)", background: "oklch(0.7 0.18 25 / 0.1)" }}
            >
              Today
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="p-2 rounded-[6px] transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <h2 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 600 }}>
            {formatMonthYear(currentMonth)}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-[6px] transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </div>
      </div>

      {/* Calendar Grid + Detail Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid */}
        <div className={`flex-1 flex flex-col px-2 md:px-4 pb-2 overflow-y-auto ${selectedDate && !isMobile ? "max-w-[calc(100%-320px)]" : ""}`}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekDayNames.map((day) => (
              <div
                key={day}
                className="text-center py-1.5"
                style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 600 }}
              >
                {isMobile ? day.charAt(0) : day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 flex-1 gap-px rounded-[8px] overflow-hidden" style={{ background: "var(--border-subtle)" }}>
            {calendarDays.map((day, i) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isTodayCell = isToday(day);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const items = getDayItems(day);
              const taskCount = items.filter((it) => it.type === "task" && !it.completed).length;
              const eventCount = items.filter((it) => it.type === "event").length;
              const completedCount = items.filter((it) => it.type === "task" && it.completed).length;

              // Unique colors for dot indicators
              const dotColors = [...new Set(items.slice(0, 4).map((it) => it.color))];

              return (
                <button
                  key={i}
                  onClick={() => {
                    haptic("selection");
                    setSelectedDate(isSelected ? null : day);
                  }}
                  className="relative flex flex-col items-center transition-colors group"
                  style={{
                    background: isSelected
                      ? "oklch(0.7 0.18 25 / 0.06)"
                      : "var(--surface-bg)",
                    minHeight: isMobile ? "48px" : "80px",
                    padding: isMobile ? "4px 2px" : "6px",
                  }}
                >
                  {/* Date number */}
                  <span
                    className="flex items-center justify-center rounded-full transition-colors"
                    style={{
                      width: isMobile ? "28px" : "28px",
                      height: isMobile ? "28px" : "28px",
                      fontSize: isMobile ? "13px" : "13px",
                      fontWeight: isTodayCell ? 700 : 500,
                      color: isTodayCell
                        ? "white"
                        : isCurrentMonth
                        ? "var(--text-primary)"
                        : "var(--text-quaternary)",
                      background: isTodayCell
                        ? "oklch(0.7 0.18 25)"
                        : isSelected
                        ? "oklch(0.7 0.18 25 / 0.12)"
                        : "transparent",
                    }}
                  >
                    {day.getDate()}
                  </span>

                  {/* Dot indicators (mobile) */}
                  {isMobile && dotColors.length > 0 && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {dotColors.slice(0, 3).map((color, j) => (
                        <div
                          key={j}
                          className="rounded-full"
                          style={{ width: "4px", height: "4px", background: color }}
                        />
                      ))}
                      {dotColors.length > 3 && (
                        <span style={{ fontSize: "8px", color: "var(--text-quaternary)" }}>+</span>
                      )}
                    </div>
                  )}

                  {/* Item previews (desktop) */}
                  {!isMobile && items.length > 0 && (
                    <div className="w-full mt-1 space-y-0.5 overflow-hidden flex-1">
                      {items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-1 px-1 py-0.5 rounded text-left truncate"
                          style={{
                            fontSize: "10px",
                            color: isCurrentMonth ? "var(--text-secondary)" : "var(--text-quaternary)",
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: item.color,
                              opacity: item.completed ? 0.4 : 1,
                            }}
                          />
                          <span
                            className="truncate"
                            style={{
                              textDecoration: item.completed ? "line-through" : "none",
                              opacity: item.completed ? 0.5 : 1,
                            }}
                          >
                            {item.title}
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <span
                          className="block px-1 text-left"
                          style={{ fontSize: "10px", color: "var(--text-quaternary)" }}
                        >
                          +{items.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Day Detail Panel */}
        {!isMobile && (
          <AnimatePresence>
            {selectedDate && (
              <div className="w-[320px] shrink-0 pl-2 pr-4 pb-2">
                <DayDetailPanel
                  date={selectedDate}
                  items={selectedDayItems}
                  onClose={() => setSelectedDate(null)}
                  onAddEvent={() => setAddEventDate(selectedDate)}
                  onToggleTask={handleToggleTask}
                  onDeleteEvent={deleteEvent}
                  isMobile={false}
                />
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Mobile Day Detail Bottom Sheet */}
      {isMobile && selectedDate && (
        <DayDetailPanel
          date={selectedDate}
          items={selectedDayItems}
          onClose={() => setSelectedDate(null)}
          onAddEvent={() => setAddEventDate(selectedDate)}
          onToggleTask={handleToggleTask}
          onDeleteEvent={deleteEvent}
          isMobile={true}
        />
      )}

      {/* Mobile bottom bar: Week View toggle */}
      {isMobile && !selectedDate && (
        <div className="shrink-0 px-4 pb-3 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => navigate("week")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-90"
            style={{ color: "var(--text-secondary)", background: "var(--neutral-100)" }}
          >
            <Rows size={16} />
            Switch to Week View
          </button>
        </div>
      )}

      {/* Add Event Modal */}
      <AnimatePresence>
        {addEventDate && (
          <AddEventModal
            date={addEventDate}
            onClose={() => setAddEventDate(null)}
            onAdd={addEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default CalendarPage;