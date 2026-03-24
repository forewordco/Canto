/* ═══════════════════════════════════════════════════════════
   WEEK HELPERS — Pure utility functions for the This Week
   time-blocking calendar (Mon–Thu, 4-day grid).
   ═══════════════════════════════════════════════════════════ */

import type { TimeBlock, TimeBlockSaved, TaskItem, ProjectData } from "./types";

/* ─── Constants ─── */

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday"] as const;
export const DAY_ABBR = ["Mon", "Tue", "Wed", "Thu"] as const;
export const DAYS_5 = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
export const DAY_ABBR_5 = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export const SLOT_HEIGHT = 48; // px per 30-min slot
export const DEFAULT_GRID_START = 8; // 8 AM
export const DEFAULT_GRID_END = 17; // 5 PM
export const MIN_BLOCK_DURATION = 30; // minutes
export const SNAP_MINUTES = 30; // grid snapping

/* ─── Date helpers ─── */

/** Get Monday of the week containing `date`. */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Return dates for the week containing `ref`. dayCount = 4 (Mon-Thu) or 5 (Mon-Fri). */
export function getWeekDates(ref: Date = new Date(), dayCount: 4 | 5 = 4): Date[] {
  const mon = getMonday(ref);
  return Array.from({ length: dayCount }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

/** Format a Date as "YYYY-MM-DD". */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" → Date (local midnight). */
export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Is `dateStr` today? */
export function isToday(dateStr: string): boolean {
  return dateStr === toDateStr(new Date());
}

/** Map a dateStr to a dayIndex (0-3) within the given week dates, or -1 if outside. */
export function dateToDayIndex(dateStr: string, weekDates: Date[]): number {
  const dateStrs = weekDates.map(toDateStr);
  return dateStrs.indexOf(dateStr);
}

/** Pretty header: "Mon 24" */
export function formatDayHeader(d: Date): string {
  return `${DAY_ABBR[d.getDay() - 1]} ${d.getDate()}`;
}

/** Format month label: "Mar 2026" */
export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/* ─── Time helpers ─── */

/** Format hour:minute to display string "9:00 AM". */
export function formatTime(hour: number, minute: number = 0): string {
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

/** Convert hour+minute to total minutes from midnight. */
export function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/** Convert total minutes from midnight to { hour, minute }. */
export function fromMinutes(totalMinutes: number): { hour: number; minute: number } {
  return {
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
  };
}

/** Snap a minute value to the nearest SNAP_MINUTES. */
export function snapMinutes(mins: number): number {
  return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES;
}

/** Get grid row position (0-based) for a time within the working hours grid. */
export function timeToGridRow(hour: number, minute: number, gridStart: number): number {
  const totalMins = toMinutes(hour, minute) - toMinutes(gridStart, 0);
  return totalMins / SNAP_MINUTES;
}

/** Get pixel-Y offset for a time within the grid. */
export function timeToPixelY(hour: number, minute: number, gridStart: number): number {
  return timeToGridRow(hour, minute, gridStart) * SLOT_HEIGHT;
}

/** Convert a pixel Y offset back to snapped { hour, minute }. */
export function pixelYToTime(y: number, gridStart: number): { hour: number; minute: number } {
  const slot = Math.round(y / SLOT_HEIGHT);
  const totalMins = toMinutes(gridStart, 0) + slot * SNAP_MINUTES;
  return fromMinutes(Math.max(0, Math.min(totalMins, 23 * 60 + 30)));
}

/** Height in pixels for a duration in minutes. */
export function durationToHeight(durationMinutes: number): number {
  return (durationMinutes / SNAP_MINUTES) * SLOT_HEIGHT;
}

/** Generate hour labels for the grid (e.g. 8, 9, 10, ... 17). */
export function getHourLabels(gridStart: number, gridEnd: number): number[] {
  const labels: number[] = [];
  for (let h = gridStart; h <= gridEnd; h++) {
    labels.push(h);
  }
  return labels;
}

/** Total number of 30-min slots in the grid. */
export function totalGridSlots(gridStart: number, gridEnd: number): number {
  return ((gridEnd - gridStart) * 60) / SNAP_MINUTES;
}

/** Total grid height in pixels. */
export function gridHeight(gridStart: number, gridEnd: number): number {
  return totalGridSlots(gridStart, gridEnd) * SLOT_HEIGHT;
}

/* ─── Time block ID generation ─── */

export function generateBlockId(): string {
  return `tb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ─── Persistence helpers ─── */

/** Strip computed/virtual fields for persistence. */
export function toSavedBlock(block: TimeBlock): TimeBlockSaved {
  return {
    id: block.id,
    taskId: block.taskId,
    projectName: block.projectName,
    customTitle: block.customTitle,
    blockColor: block.blockColor,
    dateStr: block.dateStr,
    startHour: block.startHour,
    startMinute: block.startMinute,
    durationMinutes: block.durationMinutes,
  };
}

/** Hydrate a saved block with computed dayIndex for the current week. */
export function hydrateSavedBlock(saved: TimeBlockSaved, weekDates: Date[]): TimeBlock | null {
  const dayIndex = dateToDayIndex(saved.dateStr, weekDates);
  if (dayIndex < 0) return null; // not in this week
  return {
    ...saved,
    dayIndex,
  };
}

/** Hydrate all saved blocks for a given week, filtering to only those in range. */
export function hydrateBlocksForWeek(
  saved: TimeBlockSaved[],
  weekDates: Date[]
): TimeBlock[] {
  return saved
    .map((s) => hydrateSavedBlock(s, weekDates))
    .filter((b): b is TimeBlock => b !== null);
}

/* ─── Carry-forward logic ─── */

/**
 * Given all persisted blocks and the set of completed task IDs,
 * generate carry-forward virtual blocks for incomplete tasks
 * from past days that haven't been explicitly scheduled today or later.
 */
export function generateCarryForwardBlocks(
  blocks: TimeBlock[],
  completedTaskIds: Set<string>,
  todayDateStr: string,
  weekDates: Date[]
): TimeBlock[] {
  const todayIdx = dateToDayIndex(todayDateStr, weekDates);
  if (todayIdx <= 0) return []; // Monday or not in week — nothing to carry

  // Collect task IDs that are already scheduled today or later
  const scheduledTodayOrLater = new Set<string>();
  for (const b of blocks) {
    if (b.dateStr >= todayDateStr) {
      scheduledTodayOrLater.add(b.taskId);
    }
  }

  // Find blocks from past days whose tasks are incomplete and not rescheduled
  const carryMap = new Map<string, TimeBlock>(); // taskId → latest past block
  for (const b of blocks) {
    if (
      b.dateStr < todayDateStr &&
      !completedTaskIds.has(b.taskId) &&
      !scheduledTodayOrLater.has(b.taskId)
    ) {
      const existing = carryMap.get(b.taskId);
      if (!existing || b.dateStr > existing.dateStr) {
        carryMap.set(b.taskId, b);
      }
    }
  }

  // Create virtual carry-forward blocks placed in the "before hours" bucket for today
  const carried: TimeBlock[] = [];
  for (const [, original] of carryMap) {
    carried.push({
      id: `cf-${original.id}`,
      taskId: original.taskId,
      projectName: original.projectName,
      dateStr: todayDateStr,
      dayIndex: todayIdx,
      startHour: 0,
      startMinute: 0,
      durationMinutes: original.durationMinutes,
      isCarryForward: true,
      carryForwardOf: original.id,
    });
  }

  return carried;
}

/* ─── Collision detection ─── */

/** Check if two time ranges overlap. */
export function blocksOverlap(a: TimeBlock, b: TimeBlock): boolean {
  if (a.dateStr !== b.dateStr) return false;
  const aStart = toMinutes(a.startHour, a.startMinute);
  const aEnd = aStart + a.durationMinutes;
  const bStart = toMinutes(b.startHour, b.startMinute);
  const bEnd = bStart + b.durationMinutes;
  return aStart < bEnd && bStart < aEnd;
}

/** Find blocks that overlap with a given block (excluding itself). */
export function findOverlapping(block: TimeBlock, allBlocks: TimeBlock[]): TimeBlock[] {
  return allBlocks.filter((b) => b.id !== block.id && blocksOverlap(block, b));
}

/* ─── Task lookup helpers ─── */

/** Flatten all tasks from all projects into a single array with projectName attached. */
export function flattenAllTasks(
  projects: Record<string, ProjectData>
): (TaskItem & { projectName: string })[] {
  const result: (TaskItem & { projectName: string })[] = [];
  for (const [name, proj] of Object.entries(projects)) {
    for (const task of proj.tasks) {
      result.push({ ...task, projectName: name });
    }
  }
  return result;
}

/** Get a Set of completed task IDs from all projects. */
export function getCompletedTaskIds(
  projects: Record<string, ProjectData>
): Set<string> {
  const ids = new Set<string>();
  for (const proj of Object.values(projects)) {
    for (const t of proj.tasks) {
      if (t.completed || t.status === "completed") ids.add(t.id);
    }
  }
  return ids;
}

/* ─── "Before hours" / "After hours" bucket helpers ─── */

/** Is a block in the before-hours zone? */
export function isBeforeHours(block: TimeBlock, gridStart: number): boolean {
  return toMinutes(block.startHour, block.startMinute) < toMinutes(gridStart, 0);
}

/** Is a block in the after-hours zone? */
export function isAfterHours(block: TimeBlock, gridEnd: number): boolean {
  return toMinutes(block.startHour, block.startMinute) >= toMinutes(gridEnd, 0);
}

/** Partition blocks for a given day into before/during/after working hours. */
export function partitionBlocksByHours(
  dayBlocks: TimeBlock[],
  gridStart: number,
  gridEnd: number
): { before: TimeBlock[]; during: TimeBlock[]; after: TimeBlock[] } {
  const before: TimeBlock[] = [];
  const during: TimeBlock[] = [];
  const after: TimeBlock[] = [];
  for (const b of dayBlocks) {
    if (isBeforeHours(b, gridStart)) before.push(b);
    else if (isAfterHours(b, gridEnd)) after.push(b);
    else during.push(b);
  }
  return { before, during, after };
}

/* ─── Drag & Drop helpers ─── */

/** DnD item type constants. */
export const DND_TYPES = {
  TASK_CARD: "TASK_CARD",
  TIME_BLOCK: "TIME_BLOCK",
} as const;

export interface DragTaskItem {
  type: typeof DND_TYPES.TASK_CARD;
  taskId: string;
  taskTitle: string;
  projectName: string;
}

export interface DragTimeBlockItem {
  type: typeof DND_TYPES.TIME_BLOCK;
  blockId: string;
  originalDayIndex: number;
  originalStartHour: number;
  originalStartMinute: number;
  durationMinutes: number;
}

/** Create a new TimeBlock from a dropped task. */
export function createBlockFromDrop(
  taskId: string,
  projectName: string,
  dateStr: string,
  dayIndex: number,
  startHour: number,
  startMinute: number,
  durationMinutes: number = 60
): TimeBlock {
  return {
    id: generateBlockId(),
    taskId,
    projectName,
    dateStr,
    dayIndex,
    startHour,
    startMinute,
    durationMinutes,
  };
}