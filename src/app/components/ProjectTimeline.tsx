/* ===================================================================
   PROJECT TIMELINE — Gantt-style horizontal timeline for tasks.

   Shows tasks with start/due dates as horizontal bars along a
   time axis. Milestones shown as diamonds. Color-coded by status.
   
   Phase 5-5 of Canto build plan.
   =================================================================== */

import { useState, useMemo, useRef, useCallback } from "react";
import {
  CaretLeft,
  CaretRight,
  Diamond,
  CalendarBlank,
  Circle,
  CircleHalf,
  CheckCircle,
  PauseCircle,
  Flag,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import type { TaskItem, TaskStatus, TimelineDate } from "../lib/types";

/* ─── Constants ─── */

const DAY_WIDTH = 32; // px per day
const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 52;
const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "oklch(0.65 0.015 260)",
  "in-progress": "oklch(0.55 0.2 280)",
  completed: "oklch(0.65 0.15 180)",
  hold: "oklch(0.85 0.15 85)",
};

const MILESTONE_TYPES: Record<string, string> = {
  shoot: "oklch(0.55 0.2 280)",
  round1: "oklch(0.72 0.17 55)",
  final: "oklch(0.65 0.15 180)",
  travel: "oklch(0.7 0.18 25)",
};

/* ─── Helpers ─── */

function parseDate(d: string | undefined): Date | null {
  if (!d) return null;
  try {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMonthDay(d: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

/* ─── Props ─── */

interface ProjectTimelineProps {
  tasks: TaskItem[];
  timelineDates?: TimelineDate[];
  projectColor?: string;
  onTaskClick?: (taskId: string) => void;
  teamMembers?: { userId: string; displayName: string; avatarColor?: string }[];
}

/* ─── Timeline Bar ─── */

function TimelineBar({
  task,
  startDay,
  durationDays,
  onClick,
  teamMembers,
}: {
  task: TaskItem;
  startDay: number;
  durationDays: number;
  onClick?: () => void;
  teamMembers?: { userId: string; displayName: string; avatarColor?: string }[];
}) {
  const color = STATUS_COLORS[task.status] || STATUS_COLORS.todo;
  const assigneeMember = task.assignee
    ? teamMembers?.find((m) => m.displayName === task.assignee)
    : undefined;

  if (task.milestone) {
    return (
      <div
        className="absolute flex items-center justify-center cursor-pointer group/bar"
        style={{
          left: `${startDay * DAY_WIDTH + DAY_WIDTH / 2 - 8}px`,
          top: "50%",
          transform: "translateY(-50%)",
        }}
        onClick={onClick}
        title={task.title}
      >
        <Diamond
          className="w-4 h-4"
          weight="fill"
          style={{ color: "oklch(0.72 0.17 55)" }}
        />
      </div>
    );
  }

  const barWidth = Math.max(durationDays * DAY_WIDTH, DAY_WIDTH);

  return (
    <div
      className="absolute flex items-center rounded-[4px] cursor-pointer hover:brightness-110 transition-all group/bar overflow-hidden"
      style={{
        left: `${startDay * DAY_WIDTH}px`,
        top: "50%",
        transform: "translateY(-50%)",
        width: `${barWidth}px`,
        height: "22px",
        background: `${color}22`,
        border: `1px solid ${color}55`,
      }}
      onClick={onClick}
      title={task.title}
    >
      {/* Fill bar */}
      <div
        className="absolute inset-y-0 left-0 rounded-l-[3px]"
        style={{
          width: task.status === "completed" ? "100%" : task.status === "in-progress" ? "50%" : "0%",
          background: `${color}40`,
        }}
      />
      {/* Label */}
      <span
        className="relative z-10 truncate px-1.5"
        style={{
          fontSize: "10px",
          fontWeight: 500,
          color,
          whiteSpace: "nowrap",
        }}
      >
        {task.title}
      </span>
      {/* Assignee avatar */}
      {assigneeMember && barWidth > 60 && (
        <div
          className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
          style={{ background: assigneeMember.avatarColor || "oklch(0.82 0.12 25)" }}
        >
          <span style={{ color: "white", fontSize: "6px", fontWeight: 700 }}>
            {assigneeMember.displayName.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function ProjectTimeline({
  tasks,
  timelineDates,
  projectColor,
  onTaskClick,
  teamMembers,
}: ProjectTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute date range from tasks
  const { timelineTasks, rangeStart, rangeEnd, totalDays } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Filter tasks with at least a date
    const withDates = tasks.filter((t) => t.date || t.startDate);

    let earliest = new Date(now);
    earliest.setDate(earliest.getDate() - 7); // Start 1 week before today
    let latest = new Date(now);
    latest.setDate(latest.getDate() + 30); // End 30 days from now

    for (const t of withDates) {
      const start = parseDate(t.startDate) || parseDate(t.date);
      const end = parseDate(t.date) || start;
      if (start && start < earliest) earliest = new Date(start);
      if (end && end > latest) latest = new Date(end);
    }

    // Add padding
    earliest.setDate(earliest.getDate() - 3);
    latest.setDate(latest.getDate() + 7);

    const rStart = startOfWeek(earliest);
    const total = daysBetween(rStart, latest) + 7;

    return {
      timelineTasks: withDates,
      rangeStart: rStart,
      rangeEnd: latest,
      totalDays: total,
    };
  }, [tasks]);

  // Generate week/day grid
  const weeks = useMemo(() => {
    const result: { date: Date; label: string }[] = [];
    const d = new Date(rangeStart);
    while (d <= rangeEnd) {
      result.push({ date: new Date(d), label: formatMonthDay(d) });
      d.setDate(d.getDate() + 7);
    }
    return result;
  }, [rangeStart, rangeEnd]);

  // Today marker
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(rangeStart, today);

  // Scroll navigation
  const scrollBy = useCallback(
    (dir: number) => {
      scrollRef.current?.scrollBy({ left: dir * DAY_WIDTH * 7, behavior: "smooth" });
    },
    []
  );

  // Tasks without dates (shown in a "No dates" section)
  const undatedTasks = tasks.filter((t) => !t.date && !t.startDate && !t.completed);

  return (
    <div className="space-y-3">
      {/* Timeline header controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarBlank className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em" }}>
            TIMELINE
          </span>
          <span
            className="px-1.5 py-0.5 rounded"
            style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 600 }}
          >
            {timelineTasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollBy(-1)}
            className="p-1.5 rounded-[6px] hover:bg-black/[0.04] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <CaretLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              if (scrollRef.current) {
                const todayPx = todayOffset * DAY_WIDTH - scrollRef.current.clientWidth / 2;
                scrollRef.current.scrollTo({ left: todayPx, behavior: "smooth" });
              }
            }}
            className="px-2 py-1 rounded-[6px] hover:bg-black/[0.04] transition-colors"
            style={{ color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 500 }}
          >
            Today
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="p-1.5 rounded-[6px] hover:bg-black/[0.04] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <CaretRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Milestone dates from project */}
      {timelineDates && timelineDates.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {timelineDates.map((td, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 rounded-[6px]"
              style={{
                background: `${MILESTONE_TYPES[td.type] || "var(--neutral-400)"}12`,
                border: `1px solid ${MILESTONE_TYPES[td.type] || "var(--neutral-400)"}30`,
              }}
            >
              <Diamond
                className="w-3 h-3"
                weight="fill"
                style={{ color: MILESTONE_TYPES[td.type] || "var(--neutral-400)" }}
              />
              <span style={{ fontSize: "11px", fontWeight: 500, color: MILESTONE_TYPES[td.type] || "var(--text-tertiary)" }}>
                {td.label}
                {td.endLabel && ` — ${td.endLabel}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Timeline chart */}
      <div
        className="rounded-[8px] overflow-hidden"
        style={{ border: "1px solid var(--border-default)", background: "var(--surface-bg)" }}
      >
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden"
          style={{ maxHeight: `${HEADER_HEIGHT + (timelineTasks.length + 1) * ROW_HEIGHT + 8}px` }}
        >
          <div style={{ width: `${totalDays * DAY_WIDTH}px`, minWidth: "100%" }}>
            {/* Week header */}
            <div
              className="sticky top-0 z-10 flex"
              style={{
                height: `${HEADER_HEIGHT}px`,
                borderBottom: "1px solid var(--border-default)",
                background: "var(--neutral-50)",
              }}
            >
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-end pb-1.5 px-1 shrink-0"
                  style={{
                    width: `${7 * DAY_WIDTH}px`,
                    borderRight: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", letterSpacing: "0.03em" }}>
                    {week.label}
                  </span>
                  {/* Day cells */}
                  <div className="flex mt-0.5">
                    {Array.from({ length: 7 }).map((_, d) => {
                      const dayDate = new Date(week.date);
                      dayDate.setDate(dayDate.getDate() + d);
                      const isToday = dayDate.toDateString() === today.toDateString();
                      const isWeekend = d === 0 || d === 6;
                      return (
                        <div
                          key={d}
                          className="flex items-center justify-center"
                          style={{
                            width: `${DAY_WIDTH}px`,
                            height: "16px",
                          }}
                        >
                          <span
                            className={`w-4 h-4 flex items-center justify-center rounded-full ${isToday ? "font-bold" : ""}`}
                            style={{
                              fontSize: "8px",
                              color: isToday
                                ? "white"
                                : isWeekend
                                ? "var(--text-quaternary)"
                                : "var(--text-tertiary)",
                              background: isToday ? (projectColor || "var(--accent-primary)") : "transparent",
                            }}
                          >
                            {dayDate.getDate()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Task rows */}
            <div className="relative">
              {/* Today line */}
              {todayOffset >= 0 && todayOffset <= totalDays && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{
                    left: `${todayOffset * DAY_WIDTH + DAY_WIDTH / 2}px`,
                    width: "1px",
                    background: projectColor || "var(--accent-primary)",
                    opacity: 0.5,
                  }}
                />
              )}

              {/* Weekend shading */}
              {weeks.map((week, i) => (
                <div key={`weekend-${i}`}>
                  {/* Saturday */}
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: `${(daysBetween(rangeStart, week.date) + 6) * DAY_WIDTH}px`,
                      width: `${DAY_WIDTH}px`,
                      background: "oklch(0 0 0 / 0.015)",
                    }}
                  />
                  {/* Sunday */}
                  <div
                    className="absolute top-0 bottom-0 pointer-events-none"
                    style={{
                      left: `${daysBetween(rangeStart, week.date) * DAY_WIDTH}px`,
                      width: `${DAY_WIDTH}px`,
                      background: "oklch(0 0 0 / 0.015)",
                    }}
                  />
                </div>
              ))}

              {timelineTasks.map((task, idx) => {
                const taskStart = parseDate(task.startDate) || parseDate(task.date)!;
                const taskEnd = parseDate(task.date) || taskStart;
                const startDay = daysBetween(rangeStart, taskStart);
                const duration = Math.max(daysBetween(taskStart, taskEnd), 1);

                return (
                  <div
                    key={task.id}
                    className="relative border-b"
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <TimelineBar
                      task={task}
                      startDay={startDay}
                      durationDays={duration}
                      onClick={() => onTaskClick?.(task.id)}
                      teamMembers={teamMembers}
                    />
                  </div>
                );
              })}

              {/* Empty state */}
              {timelineTasks.length === 0 && (
                <div
                  className="flex items-center justify-center py-12"
                  style={{ color: "var(--text-quaternary)", fontSize: "13px" }}
                >
                  No tasks with dates to display
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Undated tasks notice */}
      {undatedTasks.length > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
          style={{
            background: "var(--neutral-50)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <CalendarBlank className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
          <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            {undatedTasks.length} task{undatedTasks.length !== 1 ? "s" : ""} without dates
          </span>
        </div>
      )}
    </div>
  );
}
