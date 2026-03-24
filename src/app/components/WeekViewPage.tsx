/* ═══════════════════════════════════════════════════════════
   THIS WEEK PAGE — 4-day (Mon–Thu) time-blocking calendar.
   With drag-to-create, inline personal blocks, and type icons.

   Features:
   - 4-day columns (Mon–Thu) with configurable working hours
   - Drag tasks from sidebar onto the grid to create time blocks
   - Drag existing blocks to reschedule
   - Resize blocks by dragging bottom edge
   - Tasks sidebar (left) with Today/Lineup/My Tasks tabs
   - Carry-forward blocks for incomplete past-day tasks
   - Before/after hours overflow buckets
   - Current time indicator
   - Click to create blocks, click blocks to edit
   - Week navigation (prev/next)

   Phase 5 — Canto build plan.
   – Configurable 4/5-day week, stats bar, block colors,
     keyboard shortcuts, duplicate blocks, per-day totals.
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import {
  CaretLeft,
  CaretRight,
  X,
  Trash,
  GearSix,
  ArrowClockwise,
  Warning,
  Clock,
  MagnifyingGlass,
  SidebarSimple,
  DotsSixVertical,
  Circle,
  Diamond,
  Tray,
  Copy,
  Palette,
  Sun,
  SkipForward,
} from "@phosphor-icons/react";
import { AnimatePresence } from "motion/react";
import { useDrag, useDrop } from "react-dnd";
import { useData, useAllTasks, useTodayTasks, useLineupTasks } from "../lib/data";
import { ResponsiveModal } from "./ResponsiveModal";
import { TouchDndProvider } from "./TouchDndProvider";
import { useGlobalTaskDetail } from "./GlobalTaskDetail";
import type { TimeBlock, WeekSettings, TaskItem } from "../lib/types";
import { haptic } from "../lib/haptics";
import {
  DAYS,
  DAY_ABBR,
  DAYS_5,
  DAY_ABBR_5,
  SLOT_HEIGHT,
  DEFAULT_GRID_START,
  DEFAULT_GRID_END,
  SNAP_MINUTES,
  getWeekDates,
  toDateStr,
  isToday,
  dateToDayIndex,
  formatTime,
  toMinutes,
  fromMinutes,
  snapMinutes,
  timeToPixelY,
  pixelYToTime,
  durationToHeight,
  getHourLabels,
  gridHeight,
  generateBlockId,
  toSavedBlock,
  hydrateBlocksForWeek,
  generateCarryForwardBlocks,
  partitionBlocksByHours,
  DND_TYPES,
  createBlockFromDrop,
  formatMonthYear,
  getMonday,
  totalGridSlots,
} from "../lib/week-helpers";
import type { DragTaskItem, DragTimeBlockItem } from "../lib/week-helpers";

/* ─── Hex color palette (motion-safe, no oklch) ─── */

const HEX = {
  coral: "#d4654a",
  azure: "#4a6fd4",
  teal: "#3da89a",
  gold: "#c4a834",
  fuchsia: "#b44aa0",
  slate: "#6b7280",
  red: "#ef4444",
  text1: "#1a1d23",
  text2: "#4b5058",
  text3: "#6b7280",
  text4: "#9ca3af",
  white: "#ffffff",
  todayBg: "#eef4ff",
  hoverSlot: "rgba(59,130,246,0.04)",
  carryBg: "#fef3c7",
  carryBorder: "#f59e0b",
};

/** Map project color strings to safe hex approximations for motion elements */
const PROJECT_HEX_FALLBACK = [
  "#d4654a", "#4a6fd4", "#3da89a", "#c4a834", "#b44aa0",
  "#6366f1", "#14b8a6", "#f97316", "#ec4899", "#8b5cf6",
];

function projectColorToHex(color: string | undefined, projectName: string): string {
  if (!color) {
    // Deterministic color by project name hash
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) hash = (hash * 31 + projectName.charCodeAt(i)) | 0;
    return PROJECT_HEX_FALLBACK[Math.abs(hash) % PROJECT_HEX_FALLBACK.length];
  }
  // If it's already hex, return it
  if (color.startsWith("#")) return color;
  // For oklch or other formats, hash the string
  let hash = 0;
  for (let i = 0; i < color.length; i++) hash = (hash * 31 + color.charCodeAt(i)) | 0;
  return PROJECT_HEX_FALLBACK[Math.abs(hash) % PROJECT_HEX_FALLBACK.length];
}

/* ─── Hooks ─── */

function useProjectColorMap(): Record<string, string> {
  const { projects } = useData();
  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const [name, project] of Object.entries(projects)) {
      map[name] = projectColorToHex(project.color, name);
    }
    return map;
  }, [projects]);
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/* ─── Format helpers ─── */

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function formatWeekLabel(weekDates: Date[]): string {
  const first = weekDates[0];
  const last = weekDates[weekDates.length - 1];
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const fStr = first.toLocaleDateString("en-US", opts);
  const lStr = last.toLocaleDateString("en-US", opts);
  return `${fStr} – ${lStr}, ${last.getFullYear()}`;
}

/* ═══════════════════════════════════════════════════════════
   DRAGGABLE TASK CARD — in the tasks sidebar
   ═══════════════════════════════════════════════════════════ */

/** Pick the right icon for a task based on type. */
function TaskTypeIcon({ task, projectName, size = 14 }: { task: TaskItem; projectName: string; size?: number }) {
  if (task.milestone) return <Diamond size={size} weight="fill" style={{ color: HEX.gold }} />;
  if (projectName.toLowerCase() === "inbox") return <Tray size={size} style={{ color: HEX.text3 }} />;
  return <Circle size={size} style={{ color: HEX.text4 }} />;
}

const DraggableTaskCard = memo(function DraggableTaskCard({
  task,
  projectName,
  projectColor,
}: {
  task: TaskItem;
  projectName: string;
  projectColor: string;
}) {
  const [{ isDragging }, dragRef] = useDrag<DragTaskItem, unknown, { isDragging: boolean }>(() => ({
    type: DND_TYPES.TASK_CARD,
    item: { type: DND_TYPES.TASK_CARD, taskId: task.id, taskTitle: task.title, projectName },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [task.id, task.title, projectName]);

  return (
    <div
      ref={dragRef as any}
      className="group/task flex items-center gap-2 px-3 py-1.5 cursor-grab active:cursor-grabbing transition-colors hover:bg-black/[0.03]"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="shrink-0 flex items-center justify-center w-4 h-4">
        <TaskTypeIcon task={task} projectName={projectName} size={12} />
      </div>
      <p className="text-[12px] font-medium truncate flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>
        {task.title}
      </p>
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: projectColor }} />
      <DotsSixVertical size={12} className="shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity" style={{ color: "var(--text-quaternary)" }} />
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   TASKS SIDEBAR — Collapsible left panel with draggable tasks
   ═══════════════════════════════════════════════════════════ */

type SidebarTab = "today" | "lineup";

const SIDEBAR_TABS: { key: SidebarTab; label: string; Icon: typeof Sun }[] = [
  { key: "today", label: "Today", Icon: Sun },
  { key: "lineup", label: "Lineup", Icon: SkipForward },
];

function TasksSidebar({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const todayTasks = useTodayTasks();
  const lineupTasks = useLineupTasks();
  const projectColors = useProjectColorMap();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<SidebarTab>("today");

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    const source = tab === "today" ? todayTasks : lineupTasks;

    return source
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q))
      .slice(0, 80);
  }, [todayTasks, lineupTasks, search, tab]);

  if (!open) return null;

  return (
    <div
      className="w-[260px] shrink-0 flex flex-col h-full overflow-hidden"
      style={{ borderRight: "1px solid var(--border-subtle)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Tasks</span>
        <button onClick={onToggle} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-tertiary)" }}>
          <SidebarSimple size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-2 py-1.5 gap-0.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {SIDEBAR_TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          const count = key === "today" ? todayTasks.length : key === "lineup" ? lineupTasks.length : 0;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] font-medium transition-colors"
              style={{
                color: active ? HEX.azure : "var(--text-tertiary)",
                background: active ? "rgba(74,111,212,0.08)" : "transparent",
              }}
            >
              <Icon size={12} weight={active ? "fill" : "regular"} />
              {label}
              {count > 0 && (
                <span className="text-[10px] ml-0.5 opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-2 px-2 py-1 rounded-[5px]" style={{ background: "var(--neutral-100)" }}>
          <MagnifyingGlass size={12} style={{ color: "var(--text-quaternary)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            className="flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-0.5" style={{ color: "var(--text-quaternary)" }}>
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto py-0.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
              {tab === "today" ? "No tasks marked for today" : "No tasks in lineup"}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              projectName={task.projectName}
              projectColor={projectColors[task.projectName] || HEX.slate}
            />
          ))
        )}
      </div>
    </div>
  );
}



/* ═══════════════════════════════════════════════════════════
   TIME BLOCK ON GRID — Rendered block with drag support
   ═══════════════════════════════════════════════════════════ */

const GridTimeBlock = memo(function GridTimeBlock({
  block,
  gridStart,
  color,
  taskTitle,
  onEdit,
  onDelete,
  onResize,
  onResizeTop,
  onOpenTask,
  onDuplicate,
}: {
  block: TimeBlock;
  gridStart: number;
  color: string;
  taskTitle: string;
  onEdit: (block: TimeBlock) => void;
  onDelete: (blockId: string) => void;
  onResize: (blockId: string, newDuration: number) => void;
  onResizeTop: (blockId: string, newStartHour: number, newStartMinute: number, newDuration: number) => void;
  onOpenTask: (taskId: string, projectName: string) => void;
  onDuplicate?: (block: TimeBlock) => void;
}) {
  const top = timeToPixelY(block.startHour, block.startMinute, gridStart);
  const height = durationToHeight(block.durationMinutes);
  const isCarry = block.isCarryForward;

  const [{ isDragging }, dragRef] = useDrag<DragTimeBlockItem, unknown, { isDragging: boolean }>(() => ({
    type: DND_TYPES.TIME_BLOCK,
    item: {
      type: DND_TYPES.TIME_BLOCK,
      blockId: block.id,
      originalDayIndex: block.dayIndex,
      originalStartHour: block.startHour,
      originalStartMinute: block.startMinute,
      durationMinutes: block.durationMinutes,
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: !isCarry,
  }), [block]);

  // Resize handle — track whether resize happened to suppress click
  const resizeRef = useRef(false);
  const didResizeRef = useRef(false);
  const startYRef = useRef(0);
  const startDurRef = useRef(0);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = true;
    didResizeRef.current = false;
    startYRef.current = e.clientY;
    startDurRef.current = block.durationMinutes;

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      didResizeRef.current = true;
      const dy = ev.clientY - startYRef.current;
      const dSlots = Math.round(dy / SLOT_HEIGHT);
      const newDur = Math.max(SNAP_MINUTES, startDurRef.current + dSlots * SNAP_MINUTES);
      onResize(block.id, newDur);
    };
    const onUp = () => {
      resizeRef.current = false;
      setTimeout(() => { didResizeRef.current = false; }, 50);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [block.id, block.durationMinutes, onResize]);

  // Top resize handler — adjusts start time and duration together
  const handleResizeTopStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = true;
    didResizeRef.current = false;
    startYRef.current = e.clientY;
    const origStartMins = toMinutes(block.startHour, block.startMinute);
    const origEndMins = origStartMins + block.durationMinutes;

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      didResizeRef.current = true;
      const dy = ev.clientY - startYRef.current;
      const dSlots = Math.round(dy / SLOT_HEIGHT);
      const newStartMins = Math.max(0, origStartMins + dSlots * SNAP_MINUTES);
      const newDur = Math.max(SNAP_MINUTES, origEndMins - newStartMins);
      const { hour, minute } = fromMinutes(newStartMins);
      onResizeTop(block.id, hour, minute, newDur);
    };
    const onUp = () => {
      resizeRef.current = false;
      setTimeout(() => { didResizeRef.current = false; }, 50);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [block.id, block.startHour, block.startMinute, block.durationMinutes, onResizeTop]);

  const endTime = fromMinutes(toMinutes(block.startHour, block.startMinute) + block.durationMinutes);
  const timeLabel = `${formatTime(block.startHour, block.startMinute)} – ${formatTime(endTime.hour, endTime.minute)}`;
  const displayTitle = block.customTitle || taskTitle || "Untitled";

  return (
    <div
      ref={dragRef as any}
      className="absolute inset-x-1 rounded-[5px] overflow-hidden cursor-pointer group/block z-10"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 24)}px`,
        background: isCarry ? HEX.carryBg : color,
        border: isCarry ? `1.5px dashed ${HEX.carryBorder}` : "none",
        opacity: isDragging ? 0.3 : 1,
        transition: "opacity 120ms",
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (didResizeRef.current) return;
        if (block.taskId) {
          onOpenTask(block.taskId, block.projectName);
        } else {
          onEdit(block);
        }
      }}
    >
      <div className="px-2 py-1 h-full flex flex-col overflow-hidden">
        <p
          className="text-[11px] font-semibold truncate leading-tight"
          style={{ color: isCarry ? "#92400e" : "#fff" }}
        >
          {isCarry ? "↻ " : ""}
          {displayTitle}
        </p>
        {height >= 40 && (
          <p className="text-[10px] truncate mt-0.5" style={{ color: isCarry ? "#b45309" : "rgba(255,255,255,0.7)" }}>
            {block.projectName}
          </p>
        )}
        {height >= 64 && (
          <p className="text-[9px] mt-auto" style={{ color: isCarry ? "#b45309" : "rgba(255,255,255,0.6)" }}>
            {timeLabel}
          </p>
        )}
      </div>

      {/* Top resize handle — hover only */}
      {!isCarry && height >= 36 && (
        <div
          className="absolute top-0 left-0 right-0 h-[14px] cursor-ns-resize z-20 flex items-center justify-center rounded-t-[5px] opacity-0 group-hover/block:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to top, transparent, rgba(0,0,0,0.15))" }}
          onMouseDown={handleResizeTopStart}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-[3px]">
            <div className="w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
            <div className="w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
            <div className="w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
          </div>
        </div>
      )}
      {!isCarry && height < 36 && (
        <div
          className="absolute top-0 left-0 right-0 h-[6px] cursor-ns-resize z-20 rounded-t-[5px] opacity-0 group-hover/block:opacity-100 transition-opacity"
          onMouseDown={handleResizeTopStart}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Action buttons */}
      {!isCarry && (
        <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
          {onDuplicate && (
            <button
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.3)" }}
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(block);
                haptic("light");
              }}
              title="Duplicate to next day"
            >
              <Copy size={10} weight="bold" style={{ color: "#fff" }} />
            </button>
          )}
          <button
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
              haptic("light");
            }}
            title="Remove from schedule"
          >
            <X size={10} weight="bold" style={{ color: "#fff" }} />
          </button>
        </div>
      )}

      {/* Bottom resize handle — hover only */}
      {!isCarry && height >= 36 && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[14px] cursor-ns-resize z-20 flex items-center justify-center rounded-b-[5px] opacity-0 group-hover/block:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.15))" }}
          onMouseDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-[3px]">
            <div className="w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
            <div className="w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
            <div className="w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.7)" }} />
          </div>
        </div>
      )}
      {!isCarry && height < 36 && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[6px] cursor-ns-resize z-20 rounded-b-[5px] opacity-0 group-hover/block:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   DAY COLUMN — Single day in the grid with drop target
   ═══════════════════════════════════════════════════════════ */

function DayColumn({
  dayIndex,
  dateStr,
  date,
  dayLabel,
  blocks,
  gridStart,
  gridEnd,
  projectColors,
  taskMap,
  onCreateBlock,
  onEditBlock,
  onDeleteBlock,
  onMoveBlock,
  onResizeBlock,
  onResizeTopBlock,
  onOpenTask,
  onDuplicateBlock,
}: {
  dayIndex: number;
  dateStr: string;
  date: Date;
  dayLabel: string;
  blocks: TimeBlock[];
  gridStart: number;
  gridEnd: number;
  projectColors: Record<string, string>;
  taskMap: Map<string, { title: string; projectName: string }>;
  onCreateBlock: (dayIndex: number, dateStr: string, startHour: number, startMinute: number, taskId?: string, projectName?: string, customTitle?: string, durationMinutes?: number) => void;
  onEditBlock: (block: TimeBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, newDayIndex: number, newDateStr: string, startHour: number, startMinute: number) => void;
  onResizeBlock: (blockId: string, newDuration: number) => void;
  onResizeTopBlock: (blockId: string, newStartHour: number, newStartMinute: number, newDuration: number) => void;
  onOpenTask: (taskId: string, projectName: string) => void;
  onDuplicateBlock?: (block: TimeBlock) => void;
}) {
  const columnRef = useRef<HTMLDivElement>(null);
  const today = isToday(dateStr);
  const height = gridHeight(gridStart, gridEnd);
  const hours = getHourLabels(gridStart, gridEnd);

  // Partition blocks
  const { before, during, after } = useMemo(
    () => partitionBlocksByHours(blocks, gridStart, gridEnd),
    [blocks, gridStart, gridEnd]
  );

  // Hover preview state for drag-and-drop
  const [dropPreview, setDropPreview] = useState<{ top: number; height: number; label: string } | null>(null);

  // Hover slot for mouse (non-drag) — shows which slot would be created on click
  const [hoverSlot, setHoverSlot] = useState<{ top: number; label: string } | null>(null);

  // Drop target
  const [{ isOver, canDrop }, dropRef] = useDrop<DragTaskItem | DragTimeBlockItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: [DND_TYPES.TASK_CARD, DND_TYPES.TIME_BLOCK],
    drop: (item, monitor) => {
      setDropPreview(null);
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !columnRef.current) return;
      const rect = columnRef.current.getBoundingClientRect();
      const y = clientOffset.y - rect.top;
      const { hour, minute } = pixelYToTime(y, gridStart);

      if (item.type === DND_TYPES.TASK_CARD) {
        onCreateBlock(dayIndex, dateStr, hour, minute, item.taskId, item.projectName);
      } else if (item.type === DND_TYPES.TIME_BLOCK) {
        onMoveBlock(item.blockId, dayIndex, dateStr, hour, minute);
      }
    },
    hover: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !columnRef.current) {
        setDropPreview(null);
        return;
      }
      const rect = columnRef.current.getBoundingClientRect();
      const y = clientOffset.y - rect.top;
      const { hour, minute } = pixelYToTime(y, gridStart);
      const dur = item.type === DND_TYPES.TIME_BLOCK ? (item as DragTimeBlockItem).durationMinutes : 60;
      const previewTop = timeToPixelY(hour, minute, gridStart);
      const previewHeight = durationToHeight(dur);
      const endTime = fromMinutes(toMinutes(hour, minute) + dur);
      const label = `${formatTime(hour, minute)} – ${formatTime(endTime.hour, endTime.minute)}`;
      setDropPreview({ top: previewTop, height: previewHeight, label });
    },
    collect: (monitor) => {
      if (!monitor.isOver()) {
        // Clear preview when not hovering
        setDropPreview(null);
      }
      return {
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      };
    },
  }), [dayIndex, dateStr, gridStart, onCreateBlock, onMoveBlock]);

  // Inline personal block creation
  const [inlineCreate, setInlineCreate] = useState<{ top: number; height: number; startHour: number; startMinute: number; durationMinutes: number } | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const commitInline = useCallback(() => {
    if (inlineCreate && inlineTitle.trim()) {
      onCreateBlock(dayIndex, dateStr, inlineCreate.startHour, inlineCreate.startMinute, undefined, undefined, inlineTitle.trim(), inlineCreate.durationMinutes);
      haptic("light");
    }
    setInlineCreate(null);
    setInlineTitle("");
  }, [inlineCreate, inlineTitle, dayIndex, dateStr, onCreateBlock]);

  const cancelInline = useCallback(() => {
    setInlineCreate(null);
    setInlineTitle("");
  }, []);

  useEffect(() => {
    if (inlineCreate) {
      setTimeout(() => inlineInputRef.current?.focus(), 0);
    }
  }, [inlineCreate]);

  // Drag-to-create state
  const dragCreateRef = useRef<{ startY: number; startSlotMins: number; active: boolean } | null>(null);
  const [dragRange, setDragRange] = useState<{ top: number; height: number; label: string } | null>(null);

  const handleGridMouseDown = useCallback((e: React.MouseEvent) => {
    if (inlineCreate) return; // don't start new drag while editing
    if (!columnRef.current) return;
    const rect = columnRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const { hour, minute } = pixelYToTime(y, gridStart);
    const slotMins = toMinutes(hour, minute);
    dragCreateRef.current = { startY: e.clientY, startSlotMins: slotMins, active: false };
  }, [gridStart, inlineCreate]);

  const handleGridMouseMove2 = useCallback((e: React.MouseEvent) => {
    // Also update hover slot
    if (!columnRef.current) return;
    const rect = columnRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const { hour, minute } = pixelYToTime(y, gridStart);
    const top = timeToPixelY(hour, minute, gridStart);
    const label = formatTime(hour, minute);
    setHoverSlot({ top, label });

    // Drag-to-create
    if (!dragCreateRef.current) return;
    const dy = Math.abs(e.clientY - dragCreateRef.current.startY);
    if (dy > 8) dragCreateRef.current.active = true;
    if (!dragCreateRef.current.active) return;

    const currentMins = toMinutes(hour, minute);
    const startMins = dragCreateRef.current.startSlotMins;
    const topMins = Math.min(startMins, currentMins);
    const botMins = Math.max(startMins, currentMins) + SNAP_MINUTES;
    const pxTop = timeToPixelY(fromMinutes(topMins).hour, fromMinutes(topMins).minute, gridStart);
    const pxHeight = durationToHeight(botMins - topMins);
    const endT = fromMinutes(botMins);
    const topT = fromMinutes(topMins);
    const rangeLabel = `${formatTime(topT.hour, topT.minute)} – ${formatTime(endT.hour, endT.minute)}`;
    setDragRange({ top: pxTop, height: pxHeight, label: rangeLabel });
    setHoverSlot(null);
  }, [gridStart]);

  const handleGridMouseUp = useCallback((e: React.MouseEvent) => {
    if (!dragCreateRef.current || !columnRef.current) {
      dragCreateRef.current = null;
      return;
    }
    if (dragCreateRef.current.active && dragRange) {
      // Drag-to-create: open inline input at the dragged range
      const rect = columnRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const { hour, minute } = pixelYToTime(y, gridStart);
      const currentMins = toMinutes(hour, minute);
      const startMins = dragCreateRef.current.startSlotMins;
      const topMins = Math.min(startMins, currentMins);
      const botMins = Math.max(startMins, currentMins) + SNAP_MINUTES;
      const pxTop = timeToPixelY(fromMinutes(topMins).hour, fromMinutes(topMins).minute, gridStart);
      const pxHeight = durationToHeight(botMins - topMins);
      const topT = fromMinutes(topMins);
      setInlineCreate({ top: pxTop, height: pxHeight, startHour: topT.hour, startMinute: topT.minute, durationMinutes: botMins - topMins });
      setDragRange(null);
    } else {
      // Simple click: create 30-min personal block
      const rect = columnRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const { hour, minute } = pixelYToTime(y, gridStart);
      const pxTop = timeToPixelY(hour, minute, gridStart);
      setInlineCreate({ top: pxTop, height: SLOT_HEIGHT, startHour: hour, startMinute: minute, durationMinutes: SNAP_MINUTES });
      setDragRange(null);
    }
    dragCreateRef.current = null;
  }, [gridStart, dragRange]);

  const handleMouseLeave2 = useCallback(() => {
    setHoverSlot(null);
    if (dragCreateRef.current?.active) {
      // Cancel drag if mouse leaves
      setDragRange(null);
      dragCreateRef.current = null;
    }
  }, []);

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    if (!today) return;
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [today]);

  const currentTimeY = today
    ? timeToPixelY(now.getHours(), now.getMinutes(), gridStart)
    : -1;

  return (
    <div className="flex-1 flex flex-col min-w-[140px]" style={{ borderLeft: "1px solid var(--border-subtle)" }}>
      {/* Day header */}
      <div
        className="flex items-center justify-center gap-1.5 py-2 shrink-0 sticky top-0 z-10"
        style={{
          background: "var(--surface-bg)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span
          className="text-[12px] font-medium"
          style={{ color: today ? HEX.azure : "var(--text-tertiary)" }}
        >
          {dayLabel}
        </span>
        <span
          className="flex items-center justify-center rounded-full"
          style={{
            width: today ? "26px" : "auto",
            height: today ? "26px" : "auto",
            fontSize: "14px",
            fontWeight: today ? 700 : 500,
            color: today ? "#fff" : "var(--text-primary)",
            background: today ? HEX.azure : "transparent",
          }}
        >
          {date.getDate()}
        </span>
        {(() => {
          const dayMins = blocks.reduce((s, b) => s + (b.isCarryForward ? 0 : b.durationMinutes), 0);
          if (dayMins === 0) return null;
          const hrs = Math.round(dayMins / 60 * 10) / 10;
          return (
            <span className="text-[10px] font-medium" style={{ color: "var(--text-quaternary)" }}>
              {hrs}h
            </span>
          );
        })()}
      </div>

      {/* Before-hours bucket */}
      {before.length > 0 && (
        <div className="px-1 py-1 space-y-1" style={{ background: "var(--neutral-50)", borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-[9px] px-1 font-medium uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>Before {formatHour(gridStart)}</p>
          {before.map((b) => {
            const info = taskMap.get(b.taskId);
            return (
              <div
                key={b.id}
                className="px-2 py-1 rounded-[4px] text-[11px] font-medium truncate cursor-pointer hover:opacity-80"
                style={{
                  background: b.isCarryForward ? HEX.carryBg : (projectColors[b.projectName] || HEX.slate),
                  color: b.isCarryForward ? "#92400e" : "#fff",
                  border: b.isCarryForward ? `1px dashed ${HEX.carryBorder}` : "none",
                }}
                onClick={() => onEditBlock(b)}
              >
                {b.isCarryForward ? "↻ " : ""}{info?.title || "Untitled"}
              </div>
            );
          })}
        </div>
      )}

      {/* Grid area */}
      <div
        ref={(node) => {
          (columnRef as any).current = node;
          (dropRef as any)(node);
        }}
        className="relative flex-1 cursor-crosshair"
        style={{
          height: `${height}px`,
          minHeight: `${height}px`,
        }}
        onMouseDown={handleGridMouseDown}
        onMouseMove={handleGridMouseMove2}
        onMouseUp={handleGridMouseUp}
        onMouseLeave={handleMouseLeave2}
      >
        {/* Half-hour grid lines */}
        {hours.map((h) => (
          <div key={h}>
            <div
              className="absolute left-0 right-0"
              style={{
                top: `${timeToPixelY(h, 0, gridStart)}px`,
                height: "1px",
                background: "var(--border-subtle)",
              }}
            />
            <div
              className="absolute left-0 right-0"
              style={{
                top: `${timeToPixelY(h, 30, gridStart)}px`,
                height: "1px",
                background: "var(--border-subtle)",
                opacity: 0.4,
              }}
            />
          </div>
        ))}

        {/* Time blocks */}
        {during.map((b) => {
          const info = taskMap.get(b.taskId);
          return (
            <GridTimeBlock
              key={b.id}
              block={b}
              gridStart={gridStart}
              color={b.projectName === "Personal" ? (b.blockColor || HEX.teal) : (projectColors[b.projectName] || HEX.slate)}
              taskTitle={b.customTitle || info?.title || b.projectName || "Untitled"}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
              onResize={onResizeBlock}
              onResizeTop={onResizeTopBlock}
              onOpenTask={onOpenTask}
              onDuplicate={onDuplicateBlock}
            />
          );
        })}

        {/* Current time line */}
        {today && currentTimeY >= 0 && currentTimeY <= height && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-20"
            style={{ top: `${currentTimeY}px` }}
          >
            <div className="absolute -left-[4px] -top-[4px] w-[9px] h-[9px] rounded-full" style={{ background: HEX.coral }} />
            <div className="h-[2px]" style={{ background: HEX.coral }} />
          </div>
        )}

        {/* Drop preview — precise landing zone during drag */}
        {dropPreview && isOver && (
          <div
            className="absolute left-1 right-1 rounded-[5px] pointer-events-none z-30"
            style={{
              top: `${dropPreview.top}px`,
              height: `${Math.max(dropPreview.height, 24)}px`,
              background: "rgba(74,111,212,0.10)",
              border: "2px dashed rgba(74,111,212,0.45)",
            }}
          >
            <div className="px-2 py-1 flex items-center gap-1">
              <Clock size={10} style={{ color: HEX.azure }} />
              <span className="text-[10px] font-semibold" style={{ color: HEX.azure }}>
                {dropPreview.label}
              </span>
            </div>
          </div>
        )}

        {/* Hover slot preview — subtle 30-min slot indicator on mouse hover (not during drag) */}
        {!isOver && !dragRange && !inlineCreate && hoverSlot && (
          <div
            className="absolute left-1 right-1 rounded-[4px] pointer-events-none"
            style={{
              top: `${hoverSlot.top}px`,
              height: `${SLOT_HEIGHT}px`,
              background: "rgba(74,111,212,0.04)",
              border: "1px dashed rgba(74,111,212,0.18)",
              zIndex: 5,
            }}
          >
            <div className="px-2 flex items-center h-full">
              <span className="text-[10px] font-medium" style={{ color: "rgba(74,111,212,0.45)" }}>
                {hoverSlot.label}
              </span>
            </div>
          </div>
        )}

        {/* Drag-to-create range preview */}
        {dragRange && (
          <div
            className="absolute left-1 right-1 rounded-[5px] pointer-events-none z-30"
            style={{
              top: `${dragRange.top}px`,
              height: `${Math.max(dragRange.height, 24)}px`,
              background: "rgba(61,168,154,0.12)",
              border: "2px dashed rgba(61,168,154,0.5)",
            }}
          >
            <div className="px-2 py-1 flex items-center gap-1">
              <Clock size={10} style={{ color: HEX.teal }} />
              <span className="text-[10px] font-semibold" style={{ color: HEX.teal }}>
                {dragRange.label}
              </span>
            </div>
          </div>
        )}

        {/* Inline personal block creation */}
        {inlineCreate && (
          <div
            className="absolute left-1 right-1 rounded-[5px] z-40 overflow-hidden"
            style={{
              top: `${inlineCreate.top}px`,
              height: `${Math.max(inlineCreate.height, SLOT_HEIGHT)}px`,
              background: HEX.teal,
              boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="px-2 py-1.5 h-full flex flex-col">
              <input
                ref={inlineInputRef}
                value={inlineTitle}
                onChange={(e) => setInlineTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitInline();
                  if (e.key === "Escape") cancelInline();
                }}
                onBlur={() => {
                  if (inlineTitle.trim()) commitInline();
                  else cancelInline();
                }}
                placeholder="Type a title..."
                className="bg-transparent text-[12px] font-semibold outline-none placeholder:text-white/50 w-full"
                style={{ color: "#fff" }}
              />
              <span className="text-[9px] mt-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
                {formatTime(inlineCreate.startHour, inlineCreate.startMinute)} – {formatTime(
                  fromMinutes(toMinutes(inlineCreate.startHour, inlineCreate.startMinute) + inlineCreate.durationMinutes).hour,
                  fromMinutes(toMinutes(inlineCreate.startHour, inlineCreate.startMinute) + inlineCreate.durationMinutes).minute
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* After-hours bucket */}
      {after.length > 0 && (
        <div className="px-1 py-1 space-y-1" style={{ background: "var(--neutral-50)", borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-[9px] px-1 font-medium uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>After {formatHour(gridEnd)}</p>
          {after.map((b) => {
            const info = taskMap.get(b.taskId);
            return (
              <div
                key={b.id}
                className="px-2 py-1 rounded-[4px] text-[11px] font-medium truncate cursor-pointer hover:opacity-80"
                style={{
                  background: projectColors[b.projectName] || HEX.slate,
                  color: "#fff",
                }}
                onClick={() => onEditBlock(b)}
              >
                {info?.title || "Untitled"}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BLOCK EDITOR MODAL — Create / edit time blocks
   ═══════════════════════════════════════════════════════════ */

function BlockEditorModal({
  block,
  dayIndex,
  startHour,
  startMinute,
  onSave,
  onDelete,
  onClose,
}: {
  block?: TimeBlock;
  dayIndex: number;
  startHour: number;
  startMinute: number;
  onSave: (data: { taskId: string; projectName: string; customTitle?: string; blockColor?: string; startHour: number; startMinute: number; durationMinutes: number; id?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const allTasks = useAllTasks();
  const projectColors = useProjectColorMap();
  const PERSONAL_COLORS = [
    { hex: HEX.teal, label: "Teal" },
    { hex: HEX.azure, label: "Blue" },
    { hex: HEX.coral, label: "Coral" },
    { hex: HEX.gold, label: "Gold" },
    { hex: HEX.fuchsia, label: "Fuchsia" },
    { hex: HEX.slate, label: "Slate" },
    { hex: "#6366f1", label: "Indigo" },
    { hex: "#14b8a6", label: "Cyan" },
    { hex: "#f97316", label: "Orange" },
    { hex: "#ec4899", label: "Pink" },
  ];
  const isTaskBlock = block ? !!block.taskId : false;
  const [mode, setMode] = useState<"task" | "personal">(isTaskBlock ? "task" : "personal");
  const [customTitle, setCustomTitle] = useState(block?.customTitle || "");
  const [blockColor, setBlockColor] = useState(block?.blockColor || HEX.teal);
  const [selectedTaskId, setSelectedTaskId] = useState(block?.taskId || "");
  const [selectedProject, setSelectedProject] = useState(block?.projectName || "");
  const [bStart, setBStart] = useState(block ? toMinutes(block.startHour, block.startMinute) : toMinutes(startHour, startMinute));
  const [bEnd, setBEnd] = useState(
    block
      ? toMinutes(block.startHour, block.startMinute) + block.durationMinutes
      : toMinutes(startHour, startMinute) + 60
  );
  const [taskSearch, setTaskSearch] = useState("");
  const [showPicker, setShowPicker] = useState(!block);
  const inputRef = useRef<HTMLInputElement>(null);
  const personalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "personal") personalInputRef.current?.focus();
    else inputRef.current?.focus();
  }, [mode]);

  const filteredTasks = useMemo(() => {
    const q = taskSearch.toLowerCase();
    return allTasks
      .filter((t) => !t.completed && t.status !== "completed")
      .filter((t) => !q || t.title.toLowerCase().includes(q) || t.projectName.toLowerCase().includes(q))
      .slice(0, 25);
  }, [allTasks, taskSearch]);

  const selectedTask = useMemo(() => allTasks.find((t) => t.id === selectedTaskId), [allTasks, selectedTaskId]);

  const handleSelectTask = (task: TaskItem & { projectName: string }) => {
    setSelectedTaskId(task.id);
    setSelectedProject(task.projectName);
    setShowPicker(false);
    setTaskSearch("");
  };

  const canSave = mode === "personal" ? customTitle.trim().length > 0 : !!selectedTaskId;

  const handleSave = () => {
    if (!canSave) return;
    const s = fromMinutes(bStart);
    const duration = Math.max(SNAP_MINUTES, bEnd - bStart);
    if (mode === "personal") {
      onSave({
        id: block?.id,
        taskId: "",
        projectName: "Personal",
        customTitle: customTitle.trim(),
        blockColor,
        startHour: s.hour,
        startMinute: s.minute,
        durationMinutes: duration,
      });
    } else {
      onSave({
        id: block?.id,
        taskId: selectedTaskId,
        projectName: selectedProject,
        startHour: s.hour,
        startMinute: s.minute,
        durationMinutes: duration,
      });
    }
    onClose();
  };

  // Generate time options (every 30 min)
  const timeOptions = useMemo(() => {
    const opts: { value: number; label: string }[] = [];
    for (let m = 0; m < 24 * 60; m += 30) {
      const { hour, minute } = fromMinutes(m);
      opts.push({ value: m, label: formatTime(hour, minute) });
    }
    return opts;
  }, []);

  return (
    <ResponsiveModal open={true} onClose={onClose} title={block ? "Edit Block" : "New Time Block"}>
      <div className="space-y-3">
        {/* Mode tabs */}
        <div className="flex rounded-[6px] p-0.5" style={{ background: "var(--neutral-100)" }}>
          <button
            onClick={() => setMode("task")}
            className="flex-1 py-1.5 rounded-[5px] text-[12px] font-medium transition-colors"
            style={{
              background: mode === "task" ? "var(--surface-bg)" : "transparent",
              color: mode === "task" ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: mode === "task" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Link Task
          </button>
          <button
            onClick={() => setMode("personal")}
            className="flex-1 py-1.5 rounded-[5px] text-[12px] font-medium transition-colors"
            style={{
              background: mode === "personal" ? "var(--surface-bg)" : "transparent",
              color: mode === "personal" ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: mode === "personal" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
            }}
          >
            Personal Block
          </button>
        </div>

        {/* Personal title input + color picker */}
        {mode === "personal" && (
          <div className="space-y-3">
            <div>
              <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Title</label>
              <input
                ref={personalInputRef}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder="e.g. Lunch, Focus time, Gym..."
                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
                style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>
                <Palette size={13} /> Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PERSONAL_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setBlockColor(c.hex)}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: c.hex,
                      outline: blockColor === c.hex ? `2px solid ${c.hex}` : "none",
                      outlineOffset: "2px",
                    }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Task selection */}
        {mode === "task" && (
        <div>
          <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Task</label>
          {selectedTaskId && selectedTask ? (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)" }}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: projectColors[selectedProject] || HEX.slate }} />
              <span className="flex-1 text-[13px] truncate" style={{ color: "var(--text-primary)" }}>
                {selectedTask.title}
              </span>
              <span className="text-[11px] shrink-0" style={{ color: "var(--text-quaternary)" }}>{selectedProject}</span>
              <button onClick={() => { setSelectedTaskId(""); setShowPicker(true); }} style={{ color: "var(--text-tertiary)" }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                ref={inputRef}
                value={taskSearch}
                onChange={(e) => { setTaskSearch(e.target.value); setShowPicker(true); }}
                onFocus={() => setShowPicker(true)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
                style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
              {showPicker && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 z-10 rounded-[6px] overflow-hidden max-h-[200px] overflow-y-auto"
                  style={{ background: "var(--surface-bg)", boxShadow: "var(--shadow-popup)", border: "1px solid var(--border-default)" }}
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
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: projectColors[task.projectName] || HEX.slate }} />
                        <span className="flex-1 truncate text-[13px]" style={{ color: "var(--text-primary)" }}>{task.title}</span>
                        <span className="text-[11px] shrink-0" style={{ color: "var(--text-quaternary)" }}>{task.projectName}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Time range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>Start</label>
            <select
              value={bStart}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBStart(v);
                if (v >= bEnd) setBEnd(v + SNAP_MINUTES);
              }}
              className="w-full px-2 py-2 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            >
              {timeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block mb-1" style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 500 }}>End</label>
            <select
              value={bEnd}
              onChange={(e) => setBEnd(Number(e.target.value))}
              className="w-full px-2 py-2 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            >
              {timeOptions.filter((o) => o.value > bStart).map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration display */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-[6px]" style={{ background: "var(--neutral-50)" }}>
          <Clock size={14} style={{ color: "var(--text-quaternary)" }} />
          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            {Math.round((bEnd - bStart) / 60 * 10) / 10}h ({bEnd - bStart} min)
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        {onDelete ? (
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors hover:opacity-80"
            style={{ color: HEX.red, background: "rgba(239,68,68,0.08)" }}
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
            disabled={!canSave}
            className="px-4 py-2 rounded-[6px] text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-40"
            style={{ background: HEX.azure }}
          >
            {block ? "Save" : "Add Block"}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
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
  const gridStart = settings.gridStartHour ?? DEFAULT_GRID_START;
  const gridEnd = settings.gridEndHour ?? DEFAULT_GRID_END;
  const [start, setStart] = useState(gridStart);
  const [end, setEnd] = useState(gridEnd);
  const [dc, setDc] = useState<4 | 5>(settings.dayCount ?? 4);
  const [stats, setStats] = useState(settings.showStats !== false);

  const handleApply = () => {
    onUpdate({ ...settings, gridStartHour: start, gridEndHour: end, dayCount: dc, showStats: stats });
    onClose();
  };

  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 w-72 rounded-[8px] overflow-hidden"
      style={{ background: "var(--surface-bg)", boxShadow: "var(--shadow-popup)", border: "1px solid var(--border-default)" }}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>Settings</h4>
          <button onClick={onClose} className="p-1" style={{ color: "var(--text-tertiary)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Day count */}
        <div>
          <label className="block mb-1.5" style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>Week Layout</label>
          <div className="flex rounded-[6px] p-0.5" style={{ background: "var(--neutral-100)" }}>
            <button
              onClick={() => setDc(4)}
              className="flex-1 py-1.5 rounded-[5px] text-[12px] font-medium transition-colors"
              style={{
                background: dc === 4 ? "var(--surface-bg)" : "transparent",
                color: dc === 4 ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: dc === 4 ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              Mon – Thu
            </button>
            <button
              onClick={() => setDc(5)}
              className="flex-1 py-1.5 rounded-[5px] text-[12px] font-medium transition-colors"
              style={{
                background: dc === 5 ? "var(--surface-bg)" : "transparent",
                color: dc === 5 ? "var(--text-primary)" : "var(--text-tertiary)",
                boxShadow: dc === 5 ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              Mon – Fri
            </button>
          </div>
        </div>

        {/* Working hours */}
        <div>
          <label className="block mb-1.5" style={{ fontSize: "11px", color: "var(--text-tertiary)", fontWeight: 500 }}>Working Hours</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <select
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-[6px] text-[13px] outline-none"
                style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{formatHour(i)}</option>
                ))}
              </select>
            </div>
            <span className="self-center text-[12px]" style={{ color: "var(--text-quaternary)" }}>to</span>
            <div className="flex-1">
              <select
                value={end}
                onChange={(e) => setEnd(Number(e.target.value))}
                className="w-full px-2 py-1.5 rounded-[6px] text-[13px] outline-none"
                style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).filter((h) => h > start).map((h) => (
                  <option key={h} value={h}>{formatHour(h === 24 ? 0 : h)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Show weekly stats</span>
          <button
            onClick={() => setStats(!stats)}
            className="w-8 h-[18px] rounded-full relative transition-colors"
            style={{ background: stats ? HEX.azure : "var(--neutral-200)" }}
          >
            <div
              className="absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all"
              style={{ left: stats ? "16px" : "2px", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
            />
          </button>
        </label>

        {/* Keyboard shortcuts hint */}
        <div className="pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <p className="text-[10px] font-medium mb-1.5" style={{ color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Keyboard Shortcuts</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              ["← →", "Navigate weeks"],
              ["T", "Jump to today"],
              ["S", "Tasks sidebar"],
            ].map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5">
                <kbd className="px-1 py-0.5 rounded text-[9px] font-mono font-semibold" style={{ background: "var(--neutral-100)", color: "var(--text-tertiary)", border: "1px solid var(--border-subtle)" }}>{key}</kbd>
                <span className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleApply}
          className="w-full px-3 py-2 rounded-[6px] text-[13px] font-medium text-white hover:opacity-90"
          style={{ background: HEX.azure }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   WEEK VIEW PAGE — Main Export
   ═══════════════════════════════════════════════════════════ */

export function WeekViewPage() {
  const {
    timeBlocks,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,
    weekSettings,
    setWeekSettings,
    projects,
    loadError,
    reload,
  } = useData();
  const allTasks = useAllTasks();
  const projectColors = useProjectColorMap();
  const isMobile = useIsMobile();
  const { openTaskDetail } = useGlobalTaskDetail();

  const settings = weekSettings || {};
  const gridStart = settings.gridStartHour ?? DEFAULT_GRID_START;
  const gridEnd = settings.gridEndHour ?? DEFAULT_GRID_END;
  const dayCount: 4 | 5 = settings.dayCount ?? 4;
  const showStats = settings.showStats !== false; // default true
  const dayAbbrs = dayCount === 5 ? DAY_ABBR_5 : DAY_ABBR;

  // State
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week
  const [showTasksSidebar, setShowTasksSidebar] = useState(!isMobile);
  const [showSettings, setShowSettings] = useState(false);
  const [editingBlock, setEditingBlock] = useState<{
    block?: TimeBlock;
    dayIndex: number;
    startHour: number;
    startMinute: number;
    dateStr: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Week dates
  const baseMonday = useMemo(() => getMonday(new Date()), []);
  const weekDates = useMemo(() => {
    const ref = new Date(baseMonday);
    ref.setDate(ref.getDate() + weekOffset * 7);
    return getWeekDates(ref, dayCount);
  }, [baseMonday, weekOffset, dayCount]);

  const weekDateStrs = useMemo(() => weekDates.map(toDateStr), [weekDates]);
  const isThisWeek = weekOffset === 0;

  // Hydrate blocks for current week
  const hydratedBlocks = useMemo(() => {
    // timeBlocks from data layer are stored as saved blocks (no dayIndex)
    // We need to hydrate them with computed dayIndex
    return (timeBlocks || [])
      .map((b: any) => {
        const dayIndex = weekDateStrs.indexOf(b.dateStr);
        if (dayIndex < 0) return null;
        return { ...b, dayIndex };
      })
      .filter(Boolean) as TimeBlock[];
  }, [timeBlocks, weekDateStrs]);

  // Carry-forward blocks
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const completedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const proj of Object.values(projects)) {
      for (const t of (proj as any).tasks || []) {
        if (t.completed || t.status === "completed") ids.add(t.id);
      }
    }
    return ids;
  }, [projects]);

  const carryForwardBlocks = useMemo(
    () => isThisWeek ? generateCarryForwardBlocks(hydratedBlocks, completedIds, todayStr, weekDates) : [],
    [isThisWeek, hydratedBlocks, completedIds, todayStr, weekDates]
  );

  const allBlocks = useMemo(() => [...hydratedBlocks, ...carryForwardBlocks], [hydratedBlocks, carryForwardBlocks]);

  // Group blocks by dayIndex
  const blocksByDay = useMemo(() => {
    const map = new Map<number, TimeBlock[]>();
    for (let i = 0; i < dayCount; i++) map.set(i, []);
    for (const b of allBlocks) {
      const arr = map.get(b.dayIndex);
      if (arr) arr.push(b);
    }
    return map;
  }, [allBlocks, dayCount]);

  // Task lookup map: taskId → { title, projectName }
  const taskMap = useMemo(() => {
    const m = new Map<string, { title: string; projectName: string }>();
    for (const t of allTasks) {
      m.set(t.id, { title: t.title, projectName: t.projectName });
    }
    return m;
  }, [allTasks]);

  // Scroll to working hours on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (gridStart - (gridStart > 0 ? 1 : 0)) * SLOT_HEIGHT * 2 - 10;
    }
  }, [gridStart]);

  /* ─── Handlers ─── */

  const handleCreateBlock = useCallback(
    (dayIndex: number, dateStr: string, startHour: number, startMinute: number, taskId?: string, projectName?: string, customTitle?: string, durationMinutes?: number) => {
      if (customTitle) {
        // Inline personal block creation
        const block: TimeBlock = {
          id: generateBlockId(),
          taskId: "",
          projectName: "Personal",
          customTitle,
          dateStr,
          dayIndex,
          startHour,
          startMinute,
          durationMinutes: durationMinutes || SNAP_MINUTES,
        };
        addTimeBlock(block);
        haptic("light");
      } else if (taskId && projectName) {
        // Direct creation from drag-drop
        const block: TimeBlock = {
          id: generateBlockId(),
          taskId,
          projectName,
          dateStr,
          dayIndex,
          startHour,
          startMinute,
          durationMinutes: 60,
        };
        addTimeBlock(block);
        haptic("light");
      } else {
        // Open modal
        setEditingBlock({ dayIndex, startHour, startMinute, dateStr });
      }
    },
    [addTimeBlock]
  );

  const handleMoveBlock = useCallback(
    (blockId: string, newDayIndex: number, newDateStr: string, startHour: number, startMinute: number) => {
      updateTimeBlock(blockId, { dateStr: newDateStr, dayIndex: newDayIndex, startHour, startMinute });
      haptic("light");
    },
    [updateTimeBlock]
  );

  const handleResizeBlock = useCallback(
    (blockId: string, newDuration: number) => {
      updateTimeBlock(blockId, { durationMinutes: newDuration });
    },
    [updateTimeBlock]
  );

  const handleResizeTopBlock = useCallback(
    (blockId: string, newStartHour: number, newStartMinute: number, newDuration: number) => {
      updateTimeBlock(blockId, { startHour: newStartHour, startMinute: newStartMinute, durationMinutes: newDuration });
    },
    [updateTimeBlock]
  );

  const handleSaveBlock = useCallback(
    (data: { taskId: string; projectName: string; customTitle?: string; blockColor?: string; startHour: number; startMinute: number; durationMinutes: number; id?: string }) => {
      if (data.id) {
        updateTimeBlock(data.id, data);
      } else if (editingBlock) {
        const block: TimeBlock = {
          id: generateBlockId(),
          taskId: data.taskId,
          projectName: data.projectName,
          customTitle: data.customTitle,
          blockColor: data.blockColor,
          dateStr: editingBlock.dateStr,
          dayIndex: editingBlock.dayIndex,
          startHour: data.startHour,
          startMinute: data.startMinute,
          durationMinutes: data.durationMinutes,
        };
        addTimeBlock(block);
      }
    },
    [addTimeBlock, updateTimeBlock, editingBlock]
  );

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      deleteTimeBlock(blockId);
    },
    [deleteTimeBlock]
  );

  const handleEditBlock = useCallback(
    (block: TimeBlock) => {
      if (block.isCarryForward) return; // Can't edit carry-forward
      setEditingBlock({
        block,
        dayIndex: block.dayIndex,
        startHour: block.startHour,
        startMinute: block.startMinute,
        dateStr: block.dateStr,
      });
    },
    []
  );

  const handleDuplicateBlock = useCallback(
    (block: TimeBlock) => {
      // Duplicate to next day if possible
      const nextDayIndex = block.dayIndex + 1;
      if (nextDayIndex >= dayCount) return;
      const nextDateStr = weekDateStrs[nextDayIndex];
      if (!nextDateStr) return;
      const newBlock: TimeBlock = {
        id: generateBlockId(),
        taskId: block.taskId,
        projectName: block.projectName,
        customTitle: block.customTitle,
        blockColor: block.blockColor,
        dateStr: nextDateStr,
        dayIndex: nextDayIndex,
        startHour: block.startHour,
        startMinute: block.startMinute,
        durationMinutes: block.durationMinutes,
      };
      addTimeBlock(newBlock);
      haptic("light");
    },
    [dayCount, weekDateStrs, addTimeBlock]
  );

  const handleUpdateSettings = useCallback(
    (s: WeekSettings) => setWeekSettings(s),
    [setWeekSettings]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setWeekOffset((o) => o - 1); }
      if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setWeekOffset((o) => o + 1); }
      if (e.key === "t" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setWeekOffset(0); }
      if (e.key === "s" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); setShowTasksSidebar((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ─── Error fallback ─── */

  if (loadError && timeBlocks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto" style={{ background: "#fef3c7" }}>
            <Warning className="w-6 h-6" style={{ color: "#d97706" }} weight="fill" />
          </div>
          <div>
            <h3 className="mb-1" style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}>Unable to load week view</h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>{loadError}</p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
            style={{ background: HEX.azure, color: "#fff", fontSize: "13px", fontWeight: 500 }}
          >
            <ArrowClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Weekly stats
  const weeklyStats = useMemo(() => {
    const totalMinutes = allBlocks.reduce((sum, b) => sum + (b.isCarryForward ? 0 : b.durationMinutes), 0);
    const byProject: Record<string, number> = {};
    const byDay: Record<number, number> = {};
    for (let i = 0; i < dayCount; i++) byDay[i] = 0;
    for (const b of allBlocks) {
      if (b.isCarryForward) continue;
      byProject[b.projectName] = (byProject[b.projectName] || 0) + b.durationMinutes;
      byDay[b.dayIndex] = (byDay[b.dayIndex] || 0) + b.durationMinutes;
    }
    const projectBreakdown = Object.entries(byProject)
      .map(([name, mins]) => ({ name, mins, hours: Math.round(mins / 60 * 10) / 10 }))
      .sort((a, b) => b.mins - a.mins)
      .slice(0, 6);
    return { totalMinutes, totalHours: Math.round(totalMinutes / 60 * 10) / 10, projectBreakdown, byDay };
  }, [allBlocks, dayCount]);

  const hourLabels = getHourLabels(gridStart, gridEnd);
  const gHeight = gridHeight(gridStart, gridEnd);

  return (
    <TouchDndProvider>
      <div className="h-full flex flex-col">
        {/* ── Header ── */}
        <div
          className="shrink-0 flex items-center gap-3 py-2.5 p-[10px]"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h1 className="text-[15px] font-semibold shrink-0" style={{ color: "var(--text-primary)" }}>
            This Week
          </h1>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-1 rounded-[4px] hover:bg-black/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <CaretLeft size={14} weight="bold" />
            </button>
            <span className="text-[13px] font-medium px-1 min-w-[150px] text-center" style={{ color: "var(--text-secondary)" }}>
              {formatWeekLabel(weekDates)}
            </span>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="p-1 rounded-[4px] hover:bg-black/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
            >
              <CaretRight size={14} weight="bold" />
            </button>
            {!isThisWeek && (
              <button
                onClick={() => setWeekOffset(0)}
                className="ml-1 px-2 py-0.5 rounded-[4px] text-[11px] font-medium hover:opacity-80"
                style={{ color: HEX.azure, background: "rgba(74,111,212,0.08)" }}
              >
                Today
              </button>
            )}
          </div>
          {showStats && weeklyStats.totalMinutes > 0 && (
            <span className="text-[11px] shrink-0 hidden md:inline" style={{ color: "var(--text-quaternary)" }}>
              {weeklyStats.totalHours}h scheduled
            </span>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowTasksSidebar(!showTasksSidebar)}
              className="hidden md:inline-flex p-1.5 rounded-[4px] hover:bg-black/[0.04]"
              style={{ color: showTasksSidebar ? HEX.azure : "var(--text-quaternary)" }}
              title="Tasks (S)"
            >
              <SidebarSimple size={16} />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-[4px] hover:bg-black/[0.04]"
                style={{ color: "var(--text-quaternary)" }}
                title="Settings"
              >
                <GearSix size={16} />
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

        {/* ── Main content: sidebars + grid ── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Tasks Sidebar */}
          {!isMobile && showTasksSidebar && (
            <TasksSidebar open={showTasksSidebar} onToggle={() => setShowTasksSidebar(false)} />
          )}

          {/* Center: Time Grid */}
          <div className="flex-1 overflow-auto" ref={scrollRef}>
            <div className="flex min-w-[500px]" style={{ height: `${gHeight + 60}px` }}>
              {/* Time gutter */}
              <div className="w-14 shrink-0 relative">
                {/* Spacer for header alignment */}
                <div className="h-[40px] sticky top-0 z-10" style={{ background: "var(--surface-bg)" }} />
                {hourLabels.map((h) => (
                  <div
                    key={h}
                    className="absolute right-2 -translate-y-2"
                    style={{
                      top: `${timeToPixelY(h, 0, gridStart) + 40}px`,
                      fontSize: "11px",
                      color: "var(--text-quaternary)",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatHour(h)}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDates.map((date, i) => (
                <DayColumn
                  key={i}
                  dayIndex={i}
                  dateStr={weekDateStrs[i]}
                  date={date}
                  dayLabel={dayAbbrs[i]}
                  blocks={blocksByDay.get(i) || []}
                  gridStart={gridStart}
                  gridEnd={gridEnd}
                  projectColors={projectColors}
                  taskMap={taskMap}
                  onCreateBlock={handleCreateBlock}
                  onEditBlock={handleEditBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onMoveBlock={handleMoveBlock}
                  onResizeBlock={handleResizeBlock}
                  onResizeTopBlock={handleResizeTopBlock}
                  onOpenTask={openTaskDetail}
                  onDuplicateBlock={handleDuplicateBlock}
                />
              ))}
            </div>
          </div>

        </div>

        {/* ── Block Editor Modal ── */}
        <AnimatePresence>
          {editingBlock && (
            <BlockEditorModal
              block={editingBlock.block}
              dayIndex={editingBlock.dayIndex}
              startHour={editingBlock.startHour}
              startMinute={editingBlock.startMinute}
              onSave={handleSaveBlock}
              onDelete={editingBlock.block ? () => handleDeleteBlock(editingBlock.block!.id) : undefined}
              onClose={() => setEditingBlock(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </TouchDndProvider>
  );
}

export default WeekViewPage;