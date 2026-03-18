/* ===================================================================
   KANBAN BOARD — Drag-and-drop board view for project tasks.

   Columns by status (To Do, In Progress, On Hold, Done).
   Cards show task title, assignee, priority, due date, subtask count.
   Uses react-dnd for drag-and-drop between columns.
   OKLCH palette · Albert Sans · 6px radius · Phosphor icons.
   =================================================================== */

import { useState, useCallback, useRef, forwardRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { TouchDndProvider } from "./TouchDndProvider";
import {
  Circle,
  CircleHalf,
  CheckCircle,
  Pause,
  UserCircle,
  Flag,
  Plus,
  DotsThree,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { TaskItem, TaskStatus, TeamMemberInfo } from "../lib/types";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { haptic } from "../lib/haptics";

/* ── OKLCH brand palette (shared) ── */

const c = {
  bg: "oklch(0.99 0.002 260)",
  card: "oklch(1 0 0)",
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.6 0.02 260)",
  border: "oklch(0.92 0.01 260)",
  borderLight: "oklch(0.95 0.005 260)",
  coral: "oklch(0.7 0.18 25)",
  indigo: "oklch(0.55 0.2 280)",
  teal: "oklch(0.65 0.15 180)",
  gold: "oklch(0.78 0.15 85)",
  green: "oklch(0.7 0.17 150)",
  orange: "oklch(0.75 0.15 55)",
  purple: "oklch(0.6 0.2 300)",
};

/* ── Column definitions ── */

interface ColumnDef {
  id: TaskStatus;
  label: string;
  color: string;
  icon: React.ElementType;
  iconWeight: "regular" | "fill" | "bold";
}

const COLUMNS: ColumnDef[] = [
  { id: "todo", label: "To Do", color: c.text4, icon: Circle, iconWeight: "regular" },
  { id: "in-progress", label: "In Progress", color: c.indigo, icon: CircleHalf, iconWeight: "fill" },
  { id: "hold", label: "On Hold", color: c.orange, icon: Pause, iconWeight: "fill" },
  { id: "completed", label: "Done", color: c.green, icon: CheckCircle, iconWeight: "fill" },
];

/* ── Priority color map ── */

const PRIORITY_COLORS: Record<string, string> = {
  urgent: c.coral,
  high: c.orange,
  medium: c.gold,
  low: c.teal,
  none: "transparent",
};

/* ── DnD item type ── */

const ITEM_TYPE = "KANBAN_CARD";

interface DragItem {
  taskId: string;
  fromStatus: TaskStatus;
}

/* ── Kanban Card ── */

const KanbanCard = forwardRef<HTMLDivElement, {
  task: TaskItem;
  teamMembers: TeamMemberInfo[];
  onClick: (id: string) => void;
}>(function KanbanCard({ task, teamMembers, onClick }, forwardedRef) {
  const innerRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: (): DragItem => {
      haptic("medium");
      return { taskId: task.id, fromStatus: task.status };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(innerRef);

  // Assignee
  const assigneeMember = task.assignee
    ? teamMembers.find((m) => m.userId === task.assignee)
    : null;
  const assigneeInitial = assigneeMember
    ? assigneeMember.displayName.charAt(0).toUpperCase()
    : null;
  const assigneeColor = assigneeMember?.avatarColor || c.coral;
  const assigneePhoto = assigneeMember?.avatarUrl || null;

  // Subtask counter
  const subtaskTotal = task.subtasks?.length || 0;
  const subtaskDone = task.subtasks?.filter((s) => s.completed).length || 0;

  // Priority
  const pColor = PRIORITY_COLORS[task.priority || "none"];
  const showPriority = task.priority && task.priority !== "none";

  // Tags
  const firstTag = task.tags?.[0] || null;

  return (
    <motion.div
      ref={(node: HTMLDivElement | null) => {
        innerRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick(task.id)}
      className="rounded-[6px] p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      {/* Priority accent bar */}
      {showPriority && (
        <div
          className="h-[2px] rounded-full mb-2 -mt-0.5"
          style={{ background: pColor, width: "24px" }}
        />
      )}

      {/* Task title */}
      <p
        className={`leading-snug ${task.completed ? "line-through" : ""}`}
        style={{
          color: task.completed ? c.text4 : c.text1,
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {task.title || "Untitled task"}
      </p>

      {/* Tags */}
      {firstTag && (
        <span
          className="inline-block mt-1.5 px-1.5 py-[1px] rounded"
          style={{
            background: "oklch(0.94 0.005 260)",
            color: c.text3,
            fontSize: "10px",
            fontWeight: 500,
          }}
        >
          {firstTag}
        </span>
      )}

      {/* Bottom row: date, subtasks, assignee */}
      <div className="flex items-center gap-1.5 mt-2.5">
        {/* Due date */}
        {task.date && (
          <span
            className="px-1.5 py-[2px] rounded text-nowrap"
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: c.text4,
              background: c.borderLight,
            }}
          >
            {task.date}
          </span>
        )}

        {/* Subtask count */}
        {subtaskTotal > 0 && (
          <span style={{ fontSize: "10px", color: c.text4 }}>
            {subtaskDone}/{subtaskTotal}
          </span>
        )}

        {/* Priority flag */}
        {showPriority && (
          <Flag size={11} weight="fill" style={{ color: pColor }} />
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Assignee */}
        {assigneePhoto ? (
          <div
            className="w-5 h-5 rounded-full overflow-hidden shrink-0"
            style={{ background: assigneeColor }}
          >
            <ImageWithFallback
              src={assigneePhoto}
              alt={assigneeMember?.displayName || ""}
              className="w-full h-full object-cover"
            />
          </div>
        ) : assigneeInitial ? (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `color-mix(in oklch, ${assigneeColor} 15%, transparent)`,
              color: assigneeColor,
              fontSize: "9px",
              fontWeight: 600,
            }}
          >
            {assigneeInitial}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
});
KanbanCard.displayName = "KanbanCard";

/* ── Kanban Column ── */

function KanbanColumn({
  column,
  tasks,
  teamMembers,
  onDropTask,
  onClickTask,
  onAddTask,
}: {
  column: ColumnDef;
  tasks: TaskItem[];
  teamMembers: TeamMemberInfo[];
  onDropTask: (taskId: string, toStatus: TaskStatus) => void;
  onClickTask: (id: string) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      if (item.fromStatus !== column.id) {
        onDropTask(item.taskId, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  drop(ref);

  const ColIcon = column.icon;
  const isDropTarget = isOver && canDrop;

  return (
    <div
      ref={ref}
      className="flex flex-col min-w-[75vw] sm:min-w-[240px] max-w-[300px] flex-1 rounded-lg transition-colors snap-center sm:snap-align-none"
      style={{
        background: isDropTarget
          ? `color-mix(in oklch, ${column.color} 6%, ${c.bg})`
          : c.bg,
        border: isDropTarget
          ? `1.5px dashed ${column.color}`
          : `1.5px dashed transparent`,
      }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 pt-2 pb-1.5">
        <ColIcon
          size={14}
          weight={column.iconWeight}
          style={{ color: column.color }}
        />
        <span
          style={{
            color: c.text2,
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {column.label}
        </span>
        <span
          className="px-1.5 py-[1px] rounded-full"
          style={{
            background: `color-mix(in oklch, ${column.color} 10%, transparent)`,
            color: column.color,
            fontSize: "10px",
            fontWeight: 600,
          }}
        >
          {tasks.length}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => onAddTask(column.id)}
          className="p-0.5 rounded hover:bg-black/[0.04] transition-colors"
        >
          <Plus size={13} style={{ color: c.text4 }} />
        </button>
        <button className="p-0.5 rounded hover:bg-black/[0.04] transition-colors">
          <DotsThree size={13} weight="bold" style={{ color: c.text4 }} />
        </button>
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2 space-y-1.5 min-h-[80px]">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              onClick={onClickTask}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div
            className="flex items-center justify-center py-6 rounded-[6px]"
            style={{
              border: `1px dashed ${c.borderLight}`,
            }}
          >
            <span style={{ color: c.text4, fontSize: "11px" }}>
              Drop tasks here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Kanban Board ── */

export function KanbanBoard({
  tasks,
  teamMembers,
  onUpdateTask,
  onAddTask,
  onClickTask,
}: {
  tasks: TaskItem[];
  teamMembers: TeamMemberInfo[];
  onUpdateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  onAddTask: (task: TaskItem) => void;
  onClickTask: (id: string) => void;
}) {
  const handleDropTask = useCallback(
    (taskId: string, toStatus: TaskStatus) => {
      haptic("success");
      onUpdateTask(taskId, {
        status: toStatus,
        completed: toStatus === "completed",
      });
    },
    [onUpdateTask]
  );

  const handleAddTask = useCallback(
    (status: TaskStatus) => {
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title: "",
        completed: status === "completed",
        status,
        priority: "none",
      };
      onAddTask(newTask);
      haptic("light");
    },
    [onAddTask]
  );

  // Group tasks by status
  const columnTasks: Record<TaskStatus, TaskItem[]> = {
    todo: [],
    "in-progress": [],
    hold: [],
    completed: [],
  };

  for (const task of tasks) {
    const status = task.status || "todo";
    if (columnTasks[status]) {
      columnTasks[status].push(task);
    } else {
      columnTasks.todo.push(task);
    }
  }

  return (
    <TouchDndProvider>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory md:snap-none">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={columnTasks[col.id]}
            teamMembers={teamMembers}
            onDropTask={handleDropTask}
            onClickTask={onClickTask}
            onAddTask={handleAddTask}
          />
        ))}
      </div>
    </TouchDndProvider>
  );
}