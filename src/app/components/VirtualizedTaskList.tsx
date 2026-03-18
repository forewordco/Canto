/* ===================================================================
   VIRTUALIZED TASK LIST — react-window powered windowed rendering
   for large task lists (50+ items).

   Renders a FixedSizeList when task count exceeds VIRTUALIZE_THRESHOLD,
   otherwise falls back to normal DOM rendering for small lists.

   Improvements (Phase 14):
   - Memoized row renderer to prevent unnecessary re-renders
   - Stable itemData via useMemo to avoid react-window full re-render
   - Auto-sizing height based on container with ResizeObserver
   - Keyboard scrolling support (Page Up/Down, Home/End)
   - Scroll-to-top when task list changes significantly

   Phase 11 of Canto build plan (P11-4).
   =================================================================== */

import { useCallback, useRef, useMemo, useEffect, useState, memo } from "react";
import { FixedSizeList as List } from "react-window";
import { TaskRow } from "./TaskRow";
import type { TaskItem, TaskStatus, Priority } from "../lib/types";

/* ─── Config ─── */
const VIRTUALIZE_THRESHOLD = 40;
const ROW_HEIGHT = 42;
const OVERSCAN_COUNT = 10;

/* ─── Props ─── */

interface VirtualizedTaskListProps {
  tasks: TaskItem[];
  projectName: string;
  projectColor?: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onPriorityChange: (taskId: string, priority: Priority) => void;
  onDelete: (taskId: string) => void;
  onToggleToday: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLineup: (id: string) => void;
  onDateChange: (id: string, date: string | undefined) => void;
  onAssigneeChange: (id: string, assignee: string | undefined) => void;
  onTaskClick: (id: string) => void;
  todayIds: Set<string>;
  starredIds: Set<string>;
  lineupIds: Set<string>;
  /** Max visible height before scrolling (default: 600px) */
  maxHeight?: number;
  compact?: boolean;
  teamMembers?: {
    userId: string;
    displayName: string;
    avatarColor?: string;
    avatarUrl?: string;
  }[];
}

/* ─── Stable item data type (for react-window) ─── */
interface ItemData {
  tasks: TaskItem[];
  projectName: string;
  projectColor?: string;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onTitleChange: (taskId: string, title: string) => void;
  onPriorityChange: (taskId: string, priority: Priority) => void;
  onDelete: (taskId: string) => void;
  onToggleToday: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLineup: (id: string) => void;
  onDateChange: (id: string, date: string | undefined) => void;
  onAssigneeChange: (id: string, assignee: string | undefined) => void;
  onTaskClick: (id: string) => void;
  todayIds: Set<string>;
  starredIds: Set<string>;
  lineupIds: Set<string>;
  compact?: boolean;
  teamMembers?: VirtualizedTaskListProps["teamMembers"];
}

/* ─── Memoized Row renderer ─── */

const VirtualRow = memo(function VirtualRow({
  index,
  style,
  data,
}: {
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}) {
  const task = data.tasks[index];
  if (!task) return null;

  return (
    <div style={style} role="listitem" aria-rowindex={index + 1}>
      <TaskRow
        task={task}
        projectName={data.projectName}
        projectColor={data.projectColor}
        onStatusChange={data.onStatusChange}
        onTitleChange={data.onTitleChange}
        onPriorityChange={data.onPriorityChange}
        onDelete={data.onDelete}
        onToggleToday={data.onToggleToday}
        isToday={data.todayIds.has(task.id)}
        isStarred={data.starredIds.has(task.id)}
        onToggleStar={data.onToggleStar}
        onDateChange={data.onDateChange}
        onAssigneeChange={data.onAssigneeChange}
        onToggleLineup={data.onToggleLineup}
        isLineup={data.lineupIds.has(task.id)}
        onTaskClick={data.onTaskClick}
        compact={data.compact}
        subtaskCount={task.subtasks?.length}
        subtaskCompleted={task.subtasks?.filter((s) => s.completed).length}
        teamMembers={data.teamMembers}
      />
    </div>
  );
});

/* ─── Main Component ─── */

export function VirtualizedTaskList(props: VirtualizedTaskListProps) {
  const { tasks, maxHeight = 600 } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const prevTaskCountRef = useRef(tasks.length);

  // Measure container width for the list
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Scroll to top when task list changes significantly (e.g. filter change)
  useEffect(() => {
    const diff = Math.abs(tasks.length - prevTaskCountRef.current);
    if (diff > 5 && listRef.current) {
      listRef.current.scrollToItem(0, "start");
    }
    prevTaskCountRef.current = tasks.length;
  }, [tasks.length]);

  const shouldVirtualize = tasks.length >= VIRTUALIZE_THRESHOLD;

  // Clamp list height to content or maxHeight
  const listHeight = useMemo(() => {
    const contentHeight = tasks.length * ROW_HEIGHT;
    return Math.min(contentHeight, maxHeight);
  }, [tasks.length, maxHeight]);

  // Stable itemData to prevent react-window from re-rendering all rows
  // when parent re-renders. Only changes when actual data changes.
  const itemData: ItemData = useMemo(
    () => ({
      tasks: props.tasks,
      projectName: props.projectName,
      projectColor: props.projectColor,
      onStatusChange: props.onStatusChange,
      onTitleChange: props.onTitleChange,
      onPriorityChange: props.onPriorityChange,
      onDelete: props.onDelete,
      onToggleToday: props.onToggleToday,
      onToggleStar: props.onToggleStar,
      onToggleLineup: props.onToggleLineup,
      onDateChange: props.onDateChange,
      onAssigneeChange: props.onAssigneeChange,
      onTaskClick: props.onTaskClick,
      todayIds: props.todayIds,
      starredIds: props.starredIds,
      lineupIds: props.lineupIds,
      compact: props.compact,
      teamMembers: props.teamMembers,
    }),
    [
      props.tasks,
      props.projectName,
      props.projectColor,
      props.onStatusChange,
      props.onTitleChange,
      props.onPriorityChange,
      props.onDelete,
      props.onToggleToday,
      props.onToggleStar,
      props.onToggleLineup,
      props.onDateChange,
      props.onAssigneeChange,
      props.onTaskClick,
      props.todayIds,
      props.starredIds,
      props.lineupIds,
      props.compact,
      props.teamMembers,
    ]
  );

  // Keyboard navigation for the virtualized list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!listRef.current) return;

      const pageSize = Math.floor(listHeight / ROW_HEIGHT);

      switch (e.key) {
        case "Home":
          e.preventDefault();
          listRef.current.scrollToItem(0, "start");
          break;
        case "End":
          e.preventDefault();
          listRef.current.scrollToItem(tasks.length - 1, "end");
          break;
        case "PageUp":
          e.preventDefault();
          // Approximate page up
          listRef.current.scrollTo(
            Math.max(0, (listRef.current.state as any).scrollOffset - pageSize * ROW_HEIGHT)
          );
          break;
        case "PageDown":
          e.preventDefault();
          listRef.current.scrollTo(
            (listRef.current.state as any).scrollOffset + pageSize * ROW_HEIGHT
          );
          break;
      }
    },
    [listHeight, tasks.length]
  );

  if (!shouldVirtualize) {
    // Fallback: render all rows normally for small lists
    return (
      <div ref={containerRef} role="list" aria-label={`${tasks.length} tasks`}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            projectName={props.projectName}
            projectColor={props.projectColor}
            onStatusChange={props.onStatusChange}
            onTitleChange={props.onTitleChange}
            onPriorityChange={props.onPriorityChange}
            onDelete={props.onDelete}
            onToggleToday={props.onToggleToday}
            isToday={props.todayIds.has(task.id)}
            isStarred={props.starredIds.has(task.id)}
            onToggleStar={props.onToggleStar}
            onDateChange={props.onDateChange}
            onAssigneeChange={props.onAssigneeChange}
            onToggleLineup={props.onToggleLineup}
            isLineup={props.lineupIds.has(task.id)}
            onTaskClick={props.onTaskClick}
            compact={props.compact}
            subtaskCount={task.subtasks?.length}
            subtaskCompleted={task.subtasks?.filter((s) => s.completed).length}
            teamMembers={props.teamMembers}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="list"
      aria-label={`${tasks.length} tasks (virtualized)`}
      aria-rowcount={tasks.length}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none"
    >
      {containerWidth > 0 && (
        <List
          ref={listRef}
          height={listHeight}
          width={containerWidth}
          itemCount={tasks.length}
          itemSize={ROW_HEIGHT}
          itemData={itemData}
          overscanCount={OVERSCAN_COUNT}
          style={{ overflowX: "hidden" }}
          itemKey={(index, data) => data.tasks[index]?.id || index}
        >
          {VirtualRow}
        </List>
      )}

      {/* Virtualization indicator */}
      <div
        className="flex items-center justify-center py-1.5"
        style={{ fontSize: "11px", color: "var(--text-quaternary)" }}
      >
        Showing {tasks.length} tasks (virtualized)
      </div>
    </div>
  );
}

export { VIRTUALIZE_THRESHOLD };