/* ═══════════════════════════════════════════════════════════
   WEEK VIEW PAGE — Weekly time-block planner.

   Features:
   - 7-day columns (respects weekStart preference)
   - Hour rows with configurable working hours
   - Time blocks placed on the grid, click to create/edit/delete
   - Task picker to assign blocks to tasks
   - Notepad sidebar for weekly notes
   - Working hours settings popover
   - Mobile: horizontal snap scroll, day-at-a-time view
   - Auto-saves via DataProvider

   Phase 8 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  CaretLeft,
  CaretRight,
  Plus,
  X,
  Trash,
  Clock,
  GearSix,
  Notepad,
  CalendarBlank,
  Check,
  PencilSimple,
  SquareHalf,
  Circle,
  Timer,
  ArrowLeft,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData, useAllTasks } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { useAuth } from "../lib/auth";
import { ResponsiveModal } from "./ResponsiveModal";
import type { TimeBlock, WeekSettings, TaskItem } from "../lib/types";
import { Drawer as VaulDrawer } from "vaul";
import { haptic } from "../lib/haptics";

/* ─── Constants ─── */

const DEFAULT_SETTINGS: WeekSettings = {
  workingHoursStart: 8,
  workingHoursEnd: 18,
  hiddenDays: [],
  notepad: "",
};

const HOUR_HEIGHT = 60; // px per hour row

/* ─── Date Helpers ─── */

function getWeekStart(date: Date, weekStart: "sunday" | "monday"): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = weekStart === "monday" ? (day === 0 ? -6 : 1 - day) : -day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

/* ─── Block Colors ─── */

const BLOCK_COLORS = [
  { name: "Coral", value: "oklch(0.7 0.18 25)" },
  { name: "Azure", value: "oklch(0.55 0.2 280)" },
  { name: "Teal", value: "oklch(0.65 0.15 180)" },
  { name: "Gold", value: "oklch(0.85 0.15 85)" },
  { name: "Fuchsia", value: "oklch(0.65 0.18 320)" },
  { name: "Slate", value: "oklch(0.5 0.02 260)" },
];

/* ─── Project Color Map ─── */

function useProjectColorMap(): Record<string, string> {
  const { projects } = useData();
  const map: Record<string, string> = {};
  for (const [name, project] of Object.entries(projects)) {
    map[name] = project.color || "oklch(0.65 0.015 260)";
  }
  return map;
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS POPOVER
   ═══════════════════════════════════════════════════════════ */

function SettingsPopover({
  settings,
  onUpdate,
  onClose,
}: {
  settings: WeekSettings;
  onUpdate: (s: WeekSettings) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(settings.workingHoursStart);
  const [end, setEnd] = useState(settings.workingHoursEnd);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleToggleDay = (dayIndex: number) => {
    const hidden = settings.hiddenDays || [];
    const next = hidden.includes(dayIndex)
      ? hidden.filter((d) => d !== dayIndex)
      : [...hidden, dayIndex];
    onUpdate({ ...settings, hiddenDays: next });
  };

  const handleApply = () => {
    onUpdate({ ...settings, workingHoursStart: start, workingHoursEnd: end });
    onClose();
  };

  return (
    <motion.div
      className="absolute top-full right-0 mt-2 z-50 w-72 rounded-[8px] overflow-hidden"
      style={{ background: "var(--surface-bg)", boxShadow: "var(--shadow-popup)", border: "1px solid var(--border-default)" }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>Week Settings</h4>
          <button onClick={onClose} className="p-1" style={{ color: "var(--text-tertiary)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Working Hours */}
        <div className="space-y-2">
          <label style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>Working Hours</label>
          <div className="flex items-center gap-2">
            <select
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
              className="flex-1 px-2 py-1.5 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{formatHour(i)}</option>
              ))}
            </select>
            <span style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>to</span>
            <select
              value={end}
              onChange={(e) => setEnd(Number(e.target.value))}
              className="flex-1 px-2 py-1.5 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{formatHour(i)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hidden Days */}
        <div className="space-y-2">
          <label style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500 }}>Show Days</label>
          <div className="flex gap-1">
            {dayNames.map((name, i) => {
              const hidden = (settings.hiddenDays || []).includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleToggleDay(i)}
                  className="flex-1 py-1.5 rounded-[6px] text-[11px] font-medium transition-colors"
                  style={{
                    background: hidden ? "var(--neutral-100)" : "oklch(0.7 0.18 25 / 0.1)",
                    color: hidden ? "var(--text-quaternary)" : "oklch(0.7 0.18 25)",
                    textDecoration: hidden ? "line-through" : "none",
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleApply}
          className="w-full py-2 rounded-[6px] text-[13px] font-medium text-white transition-colors hover:opacity-90"
          style={{ background: "oklch(0.7 0.18 25)" }}
        >
          Apply
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BLOCK EDITOR MODAL — Create/Edit time block
   ═══════════════════════════════════════════════════════════ */

function BlockEditorModal({
  block,
  dayIndex,
  startHour,
  onSave,
  onDelete,
  onClose,
}: {
  block?: TimeBlock;
  dayIndex: number;
  startHour: number;
  onSave: (block: Omit<TimeBlock, "id"> & { id?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const allTasks = useAllTasks();
  const projectColors = useProjectColorMap();
  const [title, setTitle] = useState(block?.taskTitle || "");
  const [notes, setNotes] = useState(block?.notes || "");
  const [blockStart, setBlockStart] = useState(block?.startHour ?? startHour);
  const [blockEnd, setBlockEnd] = useState(block?.endHour ?? Math.min(startHour + 1, 24));
  const [color, setColor] = useState(block?.color || BLOCK_COLORS[0].value);
  const [selectedTaskId, setSelectedTaskId] = useState(block?.taskId || "");
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter tasks for picker
  const filteredTasks = useMemo(() => {
    if (!taskSearch) return allTasks.filter((t) => !t.completed).slice(0, 20);
    const q = taskSearch.toLowerCase();
    return allTasks.filter((t) => !t.completed && (t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q))).slice(0, 20);
  }, [allTasks, taskSearch]);

  const handleSelectTask = (task: TaskItem & { projectName: string }) => {
    setSelectedTaskId(task.id);
    setTitle(task.title);
    setColor(projectColors[task.projectName] || BLOCK_COLORS[0].value);
    setShowTaskPicker(false);
    setTaskSearch("");
  };

  const handleSave = () => {
    if (!title.trim() && !selectedTaskId) return;
    onSave({
      id: block?.id,
      dayIndex,
      startHour: blockStart,
      endHour: blockEnd,
      taskId: selectedTaskId || undefined,
      taskTitle: title.trim() || "Untitled block",
      projectName: selectedTaskId ? allTasks.find((t) => t.id === selectedTaskId)?.projectName : undefined,
      color,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title={block ? "Edit Block" : "New Time Block"}
    >
      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Title</label>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="What are you working on?"
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
            style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Link to task */}
        <div>
          <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Link to task</label>
          {selectedTaskId ? (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)" }}
            >
              <Circle size={14} style={{ color }} />
              <span className="flex-1 text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{title}</span>
              <button onClick={() => { setSelectedTaskId(""); setTitle(""); }} style={{ color: "var(--text-tertiary)" }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={taskSearch}
                onChange={(e) => { setTaskSearch(e.target.value); setShowTaskPicker(true); }}
                onFocus={() => setShowTaskPicker(true)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
                style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
              <AnimatePresence>
                {showTaskPicker && (
                  <motion.div
                    className="absolute top-full left-0 right-0 mt-1 z-10 rounded-[6px] overflow-hidden max-h-[200px] overflow-y-auto"
                    style={{ background: "var(--surface-bg)", boxShadow: "var(--shadow-popup)", border: "1px solid var(--border-default)" }}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                  >
                    {filteredTasks.length === 0 ? (
                      <p className="p-3 text-center" style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>No tasks found</p>
                    ) : (
                      filteredTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleSelectTask(task)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-black/[0.03]"
                        >
                          <Circle size={12} style={{ color: projectColors[task.projectName] || "var(--text-quaternary)" }} />
                          <span className="flex-1 truncate text-[13px]" style={{ color: "var(--text-primary)" }}>{task.title}</span>
                          <span className="text-[11px] shrink-0" style={{ color: "var(--text-quaternary)" }}>{task.projectName}</span>
                        </button>
                      ))
                    )}
                    <button
                      onClick={() => setShowTaskPicker(false)}
                      className="w-full px-3 py-2 text-[12px] text-center transition-colors hover:bg-black/[0.03]"
                      style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-subtle)" }}
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Time Range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Start</label>
            <select
              value={blockStart}
              onChange={(e) => setBlockStart(Number(e.target.value))}
              className="w-full px-2 py-2 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{formatHour(i)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>End</label>
            <select
              value={blockEnd}
              onChange={(e) => setBlockEnd(Number(e.target.value))}
              className="w-full px-2 py-2 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            >
              {Array.from({ length: 24 }, (_, i) => i + 1).filter((h) => h > blockStart).map((h) => (
                <option key={h} value={h}>{formatHour(h === 24 ? 0 : h)}{h === 24 ? " (midnight)" : ""}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Color</label>
          <div className="flex gap-2">
            {BLOCK_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-transform"
                style={{
                  background: c.value,
                  transform: color === c.value ? "scale(1.15)" : "scale(1)",
                  boxShadow: color === c.value ? `0 0 0 2px var(--surface-bg), 0 0 0 4px ${c.value}` : "none",
                }}
              >
                {color === c.value && <Check size={14} weight="bold" className="text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={2}
            className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none resize-none"
            style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        {onDelete ? (
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--text-danger)", background: "oklch(0.7 0.18 25 / 0.06)" }}
          >
            <Trash size={14} />
            Delete
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[6px] text-[13px] font-medium"
            style={{ color: "var(--text-secondary)", background: "var(--neutral-100)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-[6px] text-[13px] font-medium text-white hover:opacity-90"
            style={{ background: "oklch(0.7 0.18 25)" }}
          >
            {block ? "Save" : "Add Block"}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOTEPAD SIDEBAR
   ═══════════════════════════════════════════════════════════ */

function NotepadSidebar({
  value,
  onChange,
  onClose,
  isMobile,
}: {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  isMobile: boolean;
}) {
  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <Notepad size={18} style={{ color: "oklch(0.7 0.18 25)" }} />
          <h4 style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>Weekly Notepad</h4>
        </div>
        <button onClick={onClose} className="p-1" style={{ color: "var(--text-tertiary)" }}>
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Jot down notes, priorities, or reminders for this week..."
          className="w-full h-full resize-none outline-none text-[14px] leading-relaxed"
          style={{ color: "var(--text-primary)", background: "transparent" }}
        />
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
              height: "55vh",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--neutral-300)" }} />
            </div>
            <VaulDrawer.Title className="sr-only">Weekly Notepad</VaulDrawer.Title>
            {content}
          </VaulDrawer.Content>
        </VaulDrawer.Portal>
      </VaulDrawer.Root>
    );
  }

  return (
    <motion.div
      className="w-[280px] shrink-0 rounded-[8px] overflow-hidden h-full"
      style={{ background: "var(--surface-bg)", border: "1px solid var(--border-subtle)" }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {content}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WEEK VIEW PAGE — Main Export
   ═══════════════════════════════════════════════════════════ */

export function WeekViewPage() {
  const { timeBlocks, addTimeBlock, updateTimeBlock, deleteTimeBlock, weekSettings, setWeekSettings, loadError, reload } = useData();
  const { profile } = useAuth();
  const { navigate } = useNavigation();
  const weekStartPref = profile?.weekStart || "monday";
  const settings = weekSettings || DEFAULT_SETTINGS;

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date(), weekStartPref));
  const [showSettings, setShowSettings] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{ block?: TimeBlock; dayIndex: number; startHour: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileDay, setMobileDay] = useState(0); // 0-6 for mobile day-at-a-time
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll to working hours start on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = settings.workingHoursStart * HOUR_HEIGHT - 20;
    }
  }, [settings.workingHoursStart]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const visibleDays = useMemo(() => {
    const hidden = new Set(settings.hiddenDays || []);
    return weekDays.map((d, i) => ({ date: d, index: i, hidden: hidden.has(d.getDay()) })).filter((d) => !d.hidden);
  }, [weekDays, settings.hiddenDays]);

  const hoursRange = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i);
  }, []);

  // Group blocks by dayIndex
  const blocksByDay = useMemo(() => {
    const map = new Map<number, TimeBlock[]>();
    for (const block of timeBlocks) {
      if (!map.has(block.dayIndex)) map.set(block.dayIndex, []);
      map.get(block.dayIndex)!.push(block);
    }
    return map;
  }, [timeBlocks]);

  const handleUpdateSettings = useCallback(
    (s: WeekSettings) => {
      setWeekSettings(s);
    },
    [setWeekSettings]
  );

  const handleNotepadChange = useCallback(
    (text: string) => {
      setWeekSettings({ ...settings, notepad: text });
    },
    [settings, setWeekSettings]
  );

  const handleSaveBlock = useCallback(
    (data: Omit<TimeBlock, "id"> & { id?: string }) => {
      if (data.id) {
        updateTimeBlock(data.id, data);
      } else {
        const newBlock: TimeBlock = {
          ...data,
          id: `tb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        };
        addTimeBlock(newBlock);
      }
    },
    [addTimeBlock, updateTimeBlock]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      deleteTimeBlock(blockId);
    },
    [deleteTimeBlock]
  );

  const goToThisWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date(), weekStartPref));
  };

  const isThisWeek = isSameDay(currentWeekStart, getWeekStart(new Date(), weekStartPref));

  // For mobile: the visible day dates
  const mobileDayDate = visibleDays[mobileDay]?.date || weekDays[0];
  const mobileDayIndex = visibleDays[mobileDay]?.index ?? 0;

  /* ── Data load error fallback ── */
  if (loadError && timeBlocks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto" style={{ background: "oklch(0.95 0.04 60)" }}>
            <Warning className="w-6 h-6" style={{ color: "oklch(0.7 0.15 60)" }} weight="fill" />
          </div>
          <div>
            <h3 className="mb-1" style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}>Unable to load week view</h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>{loadError}</p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
            style={{ background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500 }}
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700 }}>
              Week View
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("calendar")}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)", background: "var(--neutral-100)" }}
            >
              <CalendarBlank size={14} />
              Calendar
            </button>
            <button
              onClick={() => setShowNotepad(!showNotepad)}
              className="p-2 rounded-[6px] transition-colors hover:opacity-80"
              style={{
                color: showNotepad ? "oklch(0.7 0.18 25)" : "var(--text-tertiary)",
                background: showNotepad ? "oklch(0.7 0.18 25 / 0.1)" : "transparent",
              }}
              title="Notepad"
            >
              <Notepad size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-[6px] transition-colors hover:opacity-80"
                style={{ color: "var(--text-tertiary)" }}
                title="Settings"
              >
                <GearSix size={18} />
              </button>
              <AnimatePresence>
                {showSettings && (
                  <SettingsPopover
                    settings={settings}
                    onUpdate={handleUpdateSettings}
                    onClose={() => setShowSettings(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}
            className="p-2 rounded-[6px] transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <CaretLeft size={20} weight="bold" />
          </button>
          <div className="flex items-center gap-3">
            <h2 style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}>
              {formatWeekRange(currentWeekStart)}
            </h2>
            <button
              onClick={goToThisWeek}
              className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors ${isThisWeek ? "opacity-40" : "hover:opacity-80"}`}
              style={{ color: "oklch(0.7 0.18 25)", background: "oklch(0.7 0.18 25 / 0.1)" }}
            >
              This Week
            </button>
          </div>
          <button
            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            className="p-2 rounded-[6px] transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <CaretRight size={20} weight="bold" />
          </button>
        </div>

        {/* Mobile: Day Tabs */}
        {isMobile && (
          <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
            {visibleDays.map((vd, idx) => {
              const isTodayTab = isToday(vd.date);
              const isActive = mobileDay === idx;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    haptic("selection");
                    setMobileDay(idx);
                  }}
                  className="flex flex-col items-center px-3 py-1.5 rounded-[8px] shrink-0 transition-colors"
                  style={{
                    background: isActive ? "oklch(0.7 0.18 25 / 0.1)" : "transparent",
                    minWidth: "48px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 500, color: isActive ? "oklch(0.7 0.18 25)" : "var(--text-tertiary)" }}>
                    {formatDayLabel(vd.date)}
                  </span>
                  <span
                    className="flex items-center justify-center rounded-full mt-0.5"
                    style={{
                      width: "28px",
                      height: "28px",
                      fontSize: "14px",
                      fontWeight: isTodayTab ? 700 : 500,
                      color: isTodayTab ? "white" : isActive ? "oklch(0.7 0.18 25)" : "var(--text-primary)",
                      background: isTodayTab ? "oklch(0.7 0.18 25)" : "transparent",
                    }}
                  >
                    {vd.date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Time Grid + Notepad */}
      <div className="flex-1 flex overflow-hidden">
        {/* Time Grid */}
        <div className="flex-1 overflow-auto" ref={scrollRef}>
          {/* Desktop: Full week grid */}
          {!isMobile ? (
            <div className="min-w-[600px]">
              {/* Day headers */}
              <div className="flex sticky top-0 z-10" style={{ background: "var(--surface-bg)", borderBottom: "1px solid var(--border-subtle)" }}>
                {/* Time gutter */}
                <div className="w-14 shrink-0" />
                {visibleDays.map((vd) => {
                  const td = isToday(vd.date);
                  return (
                    <div
                      key={vd.index}
                      className="flex-1 text-center py-2"
                      style={{ borderLeft: "1px solid var(--border-subtle)" }}
                    >
                      <span style={{ fontSize: "11px", fontWeight: 500, color: td ? "oklch(0.7 0.18 25)" : "var(--text-tertiary)" }}>
                        {formatDayLabel(vd.date)}
                      </span>
                      <div className="flex items-center justify-center mt-0.5">
                        <span
                          className="flex items-center justify-center rounded-full"
                          style={{
                            width: "28px",
                            height: "28px",
                            fontSize: "14px",
                            fontWeight: td ? 700 : 500,
                            color: td ? "white" : "var(--text-primary)",
                            background: td ? "oklch(0.7 0.18 25)" : "transparent",
                          }}
                        >
                          {vd.date.getDate()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hour rows */}
              <div className="relative">
                {hoursRange.map((hour) => {
                  const isWorkingHour = hour >= settings.workingHoursStart && hour < settings.workingHoursEnd;
                  return (
                    <div
                      key={hour}
                      className="flex"
                      style={{ height: `${HOUR_HEIGHT}px`, background: isWorkingHour ? "var(--surface-bg)" : "var(--neutral-50)" }}
                    >
                      {/* Time label */}
                      <div
                        className="w-14 shrink-0 text-right pr-2 pt-0 -translate-y-2.5"
                        style={{ fontSize: "11px", color: "var(--text-quaternary)", fontWeight: 500 }}
                      >
                        {hour > 0 ? formatHour(hour) : ""}
                      </div>

                      {/* Day columns */}
                      {visibleDays.map((vd) => (
                        <div
                          key={vd.index}
                          className="flex-1 relative cursor-pointer group"
                          style={{ borderLeft: "1px solid var(--border-subtle)", borderTop: "1px solid var(--border-subtle)" }}
                          onClick={() => setEditingBlock({ dayIndex: vd.index, startHour: hour })}
                        >
                          {/* Hover indicator */}
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            style={{ background: "oklch(0.7 0.18 25 / 0.03)" }}
                          >
                            <Plus size={14} style={{ color: "oklch(0.7 0.18 25 / 0.4)" }} />
                          </div>

                          {/* Time blocks */}
                          {(blocksByDay.get(vd.index) || [])
                            .filter((b) => b.startHour === hour)
                            .map((block) => {
                              const duration = block.endHour - block.startHour;
                              return (
                                <div
                                  key={block.id}
                                  className="absolute inset-x-1 rounded-[4px] px-2 py-1 cursor-pointer overflow-hidden z-10 hover:opacity-90 transition-opacity"
                                  style={{
                                    top: "1px",
                                    height: `${duration * HOUR_HEIGHT - 3}px`,
                                    background: `${block.color || BLOCK_COLORS[0].value}`,
                                    opacity: 0.85,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBlock({ block, dayIndex: vd.index, startHour: block.startHour });
                                  }}
                                >
                                  <p className="text-white text-[11px] font-semibold truncate leading-tight">
                                    {block.taskTitle || "Untitled"}
                                  </p>
                                  {duration >= 1.5 && block.projectName && (
                                    <p className="text-white/70 text-[10px] truncate mt-0.5">
                                      {block.projectName}
                                    </p>
                                  )}
                                  {duration >= 2 && (
                                    <p className="text-white/60 text-[10px] mt-0.5">
                                      {formatHour(block.startHour)} – {formatHour(block.endHour)}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      ))}
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {isThisWeek && (() => {
                  const now = new Date();
                  const currentHour = now.getHours() + now.getMinutes() / 60;
                  const todayDayIdx = visibleDays.findIndex((vd) => isToday(vd.date));
                  if (todayDayIdx === -1) return null;
                  const colWidth = `calc((100% - 56px) / ${visibleDays.length})`;
                  const left = `calc(56px + ${todayDayIdx} * ${colWidth})`;
                  return (
                    <div
                      className="absolute pointer-events-none z-20"
                      style={{
                        top: `${currentHour * HOUR_HEIGHT}px`,
                        left,
                        width: colWidth,
                        height: "2px",
                        background: "oklch(0.7 0.18 25)",
                      }}
                    >
                      <div
                        className="absolute -left-1.5 -top-[3px] w-2 h-2 rounded-full"
                        style={{ background: "oklch(0.7 0.18 25)" }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            /* Mobile: Single day view */
            <div>
              <div className="relative">
                {hoursRange.map((hour) => {
                  const isWorkingHour = hour >= settings.workingHoursStart && hour < settings.workingHoursEnd;
                  return (
                    <div
                      key={hour}
                      className="flex"
                      style={{ height: `${HOUR_HEIGHT}px`, background: isWorkingHour ? "var(--surface-bg)" : "var(--neutral-50)" }}
                    >
                      <div
                        className="w-12 shrink-0 text-right pr-2 -translate-y-2.5"
                        style={{ fontSize: "11px", color: "var(--text-quaternary)", fontWeight: 500 }}
                      >
                        {hour > 0 ? formatHour(hour) : ""}
                      </div>
                      <div
                        className="flex-1 relative"
                        style={{ borderLeft: "1px solid var(--border-subtle)", borderTop: "1px solid var(--border-subtle)" }}
                        onClick={() => setEditingBlock({ dayIndex: mobileDayIndex, startHour: hour })}
                      >
                        {/* Blocks for this day */}
                        {(blocksByDay.get(mobileDayIndex) || [])
                          .filter((b) => b.startHour === hour)
                          .map((block) => {
                            const duration = block.endHour - block.startHour;
                            return (
                              <div
                                key={block.id}
                                className="absolute inset-x-1 rounded-[4px] px-2 py-1.5 cursor-pointer overflow-hidden z-10"
                                style={{
                                  top: "1px",
                                  height: `${duration * HOUR_HEIGHT - 3}px`,
                                  background: block.color || BLOCK_COLORS[0].value,
                                  opacity: 0.85,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingBlock({ block, dayIndex: mobileDayIndex, startHour: block.startHour });
                                }}
                              >
                                <p className="text-white text-[12px] font-semibold truncate">
                                  {block.taskTitle || "Untitled"}
                                </p>
                                {duration >= 1 && (
                                  <p className="text-white/70 text-[11px] mt-0.5">
                                    {formatHour(block.startHour)} – {formatHour(block.endHour)}
                                  </p>
                                )}
                                {duration >= 2 && block.projectName && (
                                  <p className="text-white/60 text-[10px] mt-0.5 truncate">
                                    {block.projectName}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}

                {/* Current time indicator for mobile */}
                {isToday(mobileDayDate) && (() => {
                  const now = new Date();
                  const currentHour = now.getHours() + now.getMinutes() / 60;
                  return (
                    <div
                      className="absolute pointer-events-none z-20"
                      style={{
                        top: `${currentHour * HOUR_HEIGHT}px`,
                        left: "48px",
                        right: 0,
                        height: "2px",
                        background: "oklch(0.7 0.18 25)",
                      }}
                    >
                      <div
                        className="absolute -left-1.5 -top-[3px] w-2 h-2 rounded-full"
                        style={{ background: "oklch(0.7 0.18 25)" }}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Notepad Sidebar (Desktop) */}
        {!isMobile && (
          <AnimatePresence>
            {showNotepad && (
              <div className="pl-2 pr-4 pb-2">
                <NotepadSidebar
                  value={settings.notepad || ""}
                  onChange={handleNotepadChange}
                  onClose={() => setShowNotepad(false)}
                  isMobile={false}
                />
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Mobile: Notepad Bottom Sheet */}
      {isMobile && showNotepad && (
        <NotepadSidebar
          value={settings.notepad || ""}
          onChange={handleNotepadChange}
          onClose={() => setShowNotepad(false)}
          isMobile={true}
        />
      )}

      {/* Mobile bottom bar: Calendar toggle */}
      {isMobile && !showNotepad && (
        <div className="shrink-0 px-4 pb-3 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button
            onClick={() => navigate("calendar")}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-90"
            style={{ color: "var(--text-secondary)", background: "var(--neutral-100)" }}
          >
            <CalendarBlank size={16} />
            Switch to Calendar
          </button>
        </div>
      )}

      {/* Block Editor Modal */}
      <AnimatePresence>
        {editingBlock && (
          <BlockEditorModal
            block={editingBlock.block}
            dayIndex={editingBlock.dayIndex}
            startHour={editingBlock.startHour}
            onSave={handleSaveBlock}
            onDelete={editingBlock.block ? () => handleDeleteBlock(editingBlock.block!.id) : undefined}
            onClose={() => setEditingBlock(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default WeekViewPage;