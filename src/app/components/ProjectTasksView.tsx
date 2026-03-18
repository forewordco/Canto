/* ===================================================================
   PROJECT TASKS VIEW — Sectioned task list with drag-and-drop.

   Features:
   - Tasks grouped by section field (collapsible)
   - DnD reordering within and between sections (react-dnd)
   - Multi-select with bulk actions
   - Add task inline at bottom of each section
   - Add/rename/delete sections
   - Clicking a task opens TaskDetailPane

   Phase 5 of Canto build plan (P5-2).
   =================================================================== */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  CaretDown,
  CaretRight,
  DotsThree,
  Trash,
  PencilSimple,
  DotsSixVertical,
  Funnel,
  SortAscending,
  Check,
  X,
  MagnifyingGlass,
  ListBullets,
  CheckSquare,
  Square,
  MinusSquare,
  Lightning,
  Flag,
} from "@phosphor-icons/react";
import { useDrag, useDrop } from "react-dnd";
import { motion, AnimatePresence } from "motion/react";
import { TaskRow } from "./TaskRow";
import type { TaskItem, TaskStatus, Priority } from "../lib/types";
import { TouchDndProvider } from "./TouchDndProvider";
import { VirtualizedTaskList, VIRTUALIZE_THRESHOLD } from "./VirtualizedTaskList";

/* --- Constants --- */

const ITEM_TYPE = "TASK_ROW";
const DEFAULT_SECTION = "Untitled Section";

/* --- DnD Item Interface --- */

interface DragItem {
  taskId: string;
  section: string;
  index: number;
}

/* --- Props --- */

export interface ProjectTasksViewProps {
  tasks: TaskItem[];
  projectName: string;
  projectColor?: string;
  onUpdateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  onAddTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskClick: (taskId: string) => void;
  todayIds: Set<string>;
  starredIds: Set<string>;
  lineupIds: Set<string>;
  onToggleToday: (id: string) => void;
  onToggleStar: (id: string) => void;
  onToggleLineup: (id: string) => void;
  teamMembers?: {
    userId: string;
    displayName: string;
    avatarColor?: string;
    avatarUrl?: string;
  }[];
}

/* === DRAGGABLE TASK ROW WRAPPER === */

function DraggableTaskRow({
  task,
  section,
  index,
  onMove,
  ...rowProps
}: {
  task: TaskItem;
  section: string;
  index: number;
  onMove: (
    dragId: string,
    fromSection: string,
    fromIndex: number,
    toSection: string,
    toIndex: number
  ) => void;
} & Omit<React.ComponentProps<typeof TaskRow>, "task">) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: (): DragItem => ({ taskId: task.id, section, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: ITEM_TYPE,
    hover(item, monitor) {
      if (!ref.current) return;
      if (item.taskId === task.id) return;

      const hoverRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverRect.bottom - hoverRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverRect.top;

      // Only move when cursor crosses the middle
      if (item.index < index && hoverClientY < hoverMiddleY) return;
      if (item.index > index && hoverClientY > hoverMiddleY) return;

      onMove(item.taskId, item.section, item.index, section, index);
      item.index = index;
      item.section = section;
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className="transition-opacity"
    >
      <TaskRow task={task} {...rowProps} />
    </div>
  );
}

/* === SECTION HEADER === */

function SectionHeader({
  title,
  count,
  completedCount,
  collapsed,
  onToggle,
  onRename,
  onDelete,
  onAddTask,
  color,
}: {
  title: string;
  count: number;
  completedCount: number;
  collapsed: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddTask: () => void;
  color?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div
      className="flex items-center gap-2 py-2 px-1 group/section"
      style={{ borderBottom: "1px solid var(--border-default)" }}
    >
      <button
        onClick={onToggle}
        className="shrink-0 p-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04]"
        style={{ color: color || "var(--text-tertiary)" }}
      >
        {collapsed ? (
          <CaretRight className="w-3.5 h-3.5" />
        ) : (
          <CaretDown className="w-3.5 h-3.5" />
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={() => {
            if (editVal.trim() && editVal.trim() !== title) {
              onRename(editVal.trim());
            }
            setEditing(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") {
              setEditVal(title);
              setEditing(false);
            }
          }}
          className="flex-1 bg-transparent outline-none min-w-0 uppercase"
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: color || "var(--text-primary)",
            letterSpacing: "0.04em",
          }}
        />
      ) : (
        <span
          className="flex-1 min-w-0 truncate cursor-pointer uppercase"
          onClick={() => {
            setEditVal(title);
            setEditing(true);
          }}
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: color || "var(--text-primary)",
            letterSpacing: "0.04em",
          }}
        >
          {title}
        </span>
      )}

      {/* Task count */}
      <span
        className="shrink-0 px-1.5 py-0.5 rounded-[4px]"
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--text-quaternary)",
          background: "var(--neutral-100)",
        }}
      >
        {completedCount}/{count}
      </span>

      {/* Add task */}
      <button
        onClick={onAddTask}
        className="shrink-0 p-1 rounded-[4px] opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-black/[0.04]"
        style={{ color: "var(--text-quaternary)" }}
        title="Add task to this section"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Section menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="shrink-0 p-1 rounded-[4px] opacity-0 group-hover/section:opacity-100 transition-opacity hover:bg-black/[0.04]"
          style={{ color: "var(--text-quaternary)" }}
        >
          <DotsThree className="w-3.5 h-3.5" weight="bold" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full right-0 mt-1 py-1 rounded-[8px] z-50 min-w-[140px]"
              style={{
                background: "var(--surface-bg)",
                border: "1px solid var(--border-default)",
                boxShadow: "var(--shadow-popup)",
              }}
            >
              <button
                onClick={() => {
                  setEditVal(title);
                  setEditing(true);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                style={{ fontSize: "13px", color: "var(--text-secondary)" }}
              >
                <PencilSimple className="w-3.5 h-3.5" />
                Rename
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                style={{ fontSize: "13px", color: "oklch(0.7 0.18 25)" }}
              >
                <Trash className="w-3.5 h-3.5" />
                Delete section
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* === INLINE ADD TASK === */

function InlineAddTask({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center border border-dashed shrink-0"
        style={{ borderColor: "var(--neutral-400)" }}
      >
        <Plus
          className="w-3 h-3"
          style={{ color: "var(--text-quaternary)" }}
        />
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) {
            onAdd(value.trim());
            setValue("");
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={() => {
          if (value.trim()) {
            onAdd(value.trim());
          }
          onCancel();
        }}
        placeholder="Add a task..."
        className="flex-1 bg-transparent outline-none"
        style={{
          fontSize: "13px",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}

/* === MAIN COMPONENT === */

function ProjectTasksViewInner({
  tasks,
  projectName,
  projectColor,
  onUpdateTask,
  onAddTask,
  onDeleteTask,
  onTaskClick,
  todayIds,
  starredIds,
  lineupIds,
  onToggleToday,
  onToggleStar,
  onToggleLineup,
  teamMembers = [],
}: ProjectTasksViewProps) {
  // Collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  // Which section is in "add task" mode
  const [addingToSection, setAddingToSection] = useState<string | null>(null);
  // Search/filter
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);
  const allTaskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const toggleSelect = useCallback(
    (taskId: string, e?: React.MouseEvent) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        // Shift+click for range select
        if (e?.shiftKey && lastClickedRef.current) {
          const lastIdx = allTaskIds.indexOf(lastClickedRef.current);
          const currIdx = allTaskIds.indexOf(taskId);
          if (lastIdx !== -1 && currIdx !== -1) {
            const [start, end] = lastIdx < currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
            for (let i = start; i <= end; i++) {
              next.add(allTaskIds[i]);
            }
            return next;
          }
        }

        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
      lastClickedRef.current = taskId;
    },
    [allTaskIds]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allTaskIds));
  }, [allTaskIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Escape to clear selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedIds.size > 0) clearSelection();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds.size, clearSelection]);

  // Bulk actions
  const handleBulkComplete = useCallback(() => {
    for (const id of selectedIds) {
      onUpdateTask(id, { status: "completed" as TaskStatus, completed: true });
    }
    clearSelection();
  }, [selectedIds, onUpdateTask, clearSelection]);

  const handleBulkDelete = useCallback(() => {
    for (const id of selectedIds) {
      onDeleteTask(id);
    }
    clearSelection();
  }, [selectedIds, onDeleteTask, clearSelection]);

  const handleBulkPriority = useCallback(
    (priority: Priority) => {
      for (const id of selectedIds) {
        onUpdateTask(id, { priority });
      }
      clearSelection();
    },
    [selectedIds, onUpdateTask, clearSelection]
  );

  const handleBulkStatus = useCallback(
    (status: TaskStatus) => {
      for (const id of selectedIds) {
        onUpdateTask(id, { status, completed: status === "completed" });
      }
      clearSelection();
    },
    [selectedIds, onUpdateTask, clearSelection]
  );

  const selectMode = selectedIds.size > 0;

  // Derive sections from tasks
  const sections = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    const uncompleted = tasks.filter((t) => t.status !== "completed");
    const completed = tasks.filter((t) => t.status === "completed");

    for (const task of uncompleted) {
      const sec = task.section || DEFAULT_SECTION;
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(task);
    }

    // If no sections exist, create a default one
    if (map.size === 0 && completed.length === 0) {
      map.set(DEFAULT_SECTION, []);
    }

    return {
      active: Array.from(map.entries()).map(([name, items]) => ({
        name,
        tasks: items,
        completedCount: items.filter((t) => t.status === "completed").length,
      })),
      completed,
    };
  }, [tasks]);

  // Filter tasks by search
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return {
      active: sections.active.map((s) => ({
        ...s,
        tasks: s.tasks.filter((t) => t.title.toLowerCase().includes(q)),
      })),
      completed: sections.completed.filter((t) =>
        t.title.toLowerCase().includes(q)
      ),
    };
  }, [sections, searchQuery]);

  const [showCompleted, setShowCompleted] = useState(false);

  const toggleSection = useCallback((name: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleMoveTask = useCallback(
    (
      dragId: string,
      fromSection: string,
      fromIndex: number,
      toSection: string,
      toIndex: number
    ) => {
      if (fromSection !== toSection) {
        onUpdateTask(dragId, { section: toSection === DEFAULT_SECTION ? undefined : toSection });
      }
    },
    [onUpdateTask]
  );

  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      onUpdateTask(taskId, { status, completed: status === "completed" });
    },
    [onUpdateTask]
  );

  const handleTitleChange = useCallback(
    (taskId: string, title: string) => {
      onUpdateTask(taskId, { title });
    },
    [onUpdateTask]
  );

  const handlePriorityChange = useCallback(
    (taskId: string, priority: Priority) => {
      onUpdateTask(taskId, { priority });
    },
    [onUpdateTask]
  );

  const handleDateChange = useCallback(
    (taskId: string, date: string | undefined) => {
      onUpdateTask(taskId, { date });
    },
    [onUpdateTask]
  );

  const handleAssigneeChange = useCallback(
    (taskId: string, assignee: string | undefined) => {
      onUpdateTask(taskId, { assignee });
    },
    [onUpdateTask]
  );

  const handleAddTaskToSection = useCallback(
    (section: string, title: string) => {
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        completed: false,
        status: "todo",
        section: section === DEFAULT_SECTION ? undefined : section,
        priority: "none",
        createdAt: new Date().toISOString(),
      };
      onAddTask(newTask);
    },
    [onAddTask]
  );

  const handleRenameSection = useCallback(
    (oldName: string, newName: string) => {
      // Update all tasks in this section
      for (const task of tasks) {
        if ((task.section || DEFAULT_SECTION) === oldName) {
          onUpdateTask(task.id, {
            section: newName === DEFAULT_SECTION ? undefined : newName,
          });
        }
      }
    },
    [tasks, onUpdateTask]
  );

  const handleDeleteSection = useCallback(
    (sectionName: string) => {
      // Move tasks to default section
      for (const task of tasks) {
        if ((task.section || DEFAULT_SECTION) === sectionName) {
          onUpdateTask(task.id, { section: undefined });
        }
      }
    },
    [tasks, onUpdateTask]
  );

  const handleAddSection = useCallback(() => {
    const name = `Section ${sections.active.length + 1}`;
    // Create a placeholder task to form the section
    setAddingToSection(name);
    // Just create the section by opening the add-task inline
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }, [sections.active.length]);

  return (
    <div className="space-y-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between py-2 mb-2">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em" }}>TASKS</span>
          <span
            className="px-1.5 py-0.5 rounded"
            style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 600 }}
          >
            {tasks.length}
          </span>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{
              color: showSearch
                ? "var(--accent-primary)"
                : "var(--text-tertiary)",
              fontSize: "12px",
            }}
          >
            <MagnifyingGlass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
            {tasks.filter(t => t.completed).length}/{tasks.length} done
          </span>
          <button
            onClick={handleAddSection}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-tertiary)", fontSize: "12px" }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add section</span>
          </button>
        </div>
      </div>

      {/* Column headers — matching brand guide */}
      <div className="hidden sm:flex items-stretch border-b" style={{ borderColor: "var(--border-default)", background: "var(--neutral-50)" }}>
        <span className="flex-1 flex items-center px-3 py-1.5 border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>TASK</span>
        <div className="shrink-0 grid items-stretch" style={{ gridTemplateColumns: "80px 64px 72px 40px 28px" }}>
          <span className="flex items-center justify-center border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>STATUS</span>
          <span className="flex items-center justify-center border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>PRIORITY</span>
          <span className="flex items-center justify-center border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>DUE</span>
          <span className="flex items-center justify-center" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>OWNER</span>
          <span />
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-[8px]" style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}>
              <MagnifyingGlass
                className="w-4 h-4 shrink-0"
                style={{ color: "var(--text-quaternary)" }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter tasks..."
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: "13px",
                  color: "var(--text-primary)",
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded"
                  style={{ color: "var(--text-quaternary)" }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sections */}
      {filteredSections.active.map((section) => {
        const isCollapsed = collapsedSections.has(section.name);
        return (
          <div key={section.name} className="mb-4">
            <SectionHeader
              title={section.name}
              count={section.tasks.length}
              completedCount={section.completedCount}
              collapsed={isCollapsed}
              onToggle={() => toggleSection(section.name)}
              onRename={(name) => handleRenameSection(section.name, name)}
              onDelete={() => handleDeleteSection(section.name)}
              onAddTask={() => setAddingToSection(section.name)}
              color={projectColor}
            />

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="py-0.5">
                    {section.tasks.length === 0 &&
                      addingToSection !== section.name && (
                        <div
                          className="text-center py-6 rounded-[6px]"
                          style={{
                            color: "var(--text-quaternary)",
                            fontSize: "13px",
                          }}
                        >
                          No tasks in this section
                        </div>
                      )}

                    {section.tasks.map((task, idx) => (
                      <div key={task.id} className="flex items-center group/selectable"
                        onTouchStart={(e) => {
                          const timer = setTimeout(() => {
                            if (!selectMode) {
                              toggleSelect(task.id);
                              if (navigator.vibrate) navigator.vibrate(15);
                            }
                          }, 600);
                          (e.currentTarget as any)._lpTimer = timer;
                          (e.currentTarget as any)._lpMoved = false;
                        }}
                        onTouchMove={(e) => {
                          (e.currentTarget as any)._lpMoved = true;
                          clearTimeout((e.currentTarget as any)._lpTimer);
                        }}
                        onTouchEnd={(e) => {
                          clearTimeout((e.currentTarget as any)._lpTimer);
                        }}
                      >
                        {/* Selection checkbox — visible on hover or in select mode */}
                        <button
                          onClick={(e) => toggleSelect(task.id, e)}
                          className={`shrink-0 w-5 h-5 flex items-center justify-center transition-all ${
                            selectMode ? "opacity-100 w-5 mr-0.5" : "opacity-0 w-0 mr-0 group-hover/selectable:opacity-60 group-hover/selectable:w-5 group-hover/selectable:mr-0.5"
                          }`}
                          style={{ color: selectedIds.has(task.id) ? "var(--accent-primary)" : "var(--text-quaternary)" }}
                          aria-label={`Select ${task.title}`}
                        >
                          {selectedIds.has(task.id) ? (
                            <CheckSquare className="w-4 h-4" weight="fill" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className={`flex-1 min-w-0 ${selectedIds.has(task.id) ? "ring-1 ring-[var(--accent-primary)] rounded-[6px]" : ""}`}>
                          <DraggableTaskRow
                            task={task}
                            section={section.name}
                            index={idx}
                            onMove={handleMoveTask}
                            projectName={projectName}
                            projectColor={projectColor}
                            onStatusChange={handleStatusChange}
                            onTitleChange={handleTitleChange}
                            onPriorityChange={handlePriorityChange}
                            onDelete={onDeleteTask}
                            onToggleToday={onToggleToday}
                            isToday={todayIds.has(task.id)}
                            isStarred={starredIds.has(task.id)}
                            onToggleStar={onToggleStar}
                            onDateChange={handleDateChange}
                            onAssigneeChange={handleAssigneeChange}
                            onToggleLineup={onToggleLineup}
                            isLineup={lineupIds.has(task.id)}
                            onTaskClick={onTaskClick}
                            subtaskCount={task.subtasks?.length}
                            subtaskCompleted={
                              task.subtasks?.filter((s) => s.completed).length
                            }
                            teamMembers={teamMembers}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Inline add task */}
                    {addingToSection === section.name ? (
                      <InlineAddTask
                        onAdd={(title) => {
                          handleAddTaskToSection(section.name, title);
                        }}
                        onCancel={() => setAddingToSection(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setAddingToSection(section.name)}
                        className="flex items-center gap-2 w-full rounded-[6px] px-3 py-2 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] group"
                        style={{
                          color: "var(--text-quaternary)",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          className="w-[18px] h-[18px] rounded-full flex items-center justify-center border border-dashed transition-colors group-hover:border-solid"
                          style={{ borderColor: "var(--neutral-400)" }}
                        >
                          <span style={{ fontSize: "14px", lineHeight: 1 }}>
                            +
                          </span>
                        </span>
                        <span className="group-hover:text-[var(--text-tertiary)] transition-colors">
                          Add task...
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Completed tasks (collapsible) */}
      {filteredSections.completed.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 py-2 px-1 w-full"
            style={{ color: "var(--text-tertiary)" }}
          >
            {showCompleted ? (
              <CaretDown className="w-3.5 h-3.5" />
            ) : (
              <CaretRight className="w-3.5 h-3.5" />
            )}
            <span style={{ fontSize: "13px", fontWeight: 600 }}>
              Completed
            </span>
            <span
              className="px-1.5 py-0.5 rounded-[4px]"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-quaternary)",
                background: "var(--neutral-100)",
              }}
            >
              {filteredSections.completed.length}
            </span>
          </button>

          <AnimatePresence>
            {showCompleted && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <VirtualizedTaskList
                  tasks={filteredSections.completed}
                  projectName={projectName}
                  projectColor={projectColor}
                  onStatusChange={handleStatusChange}
                  onTitleChange={handleTitleChange}
                  onPriorityChange={handlePriorityChange}
                  onDelete={onDeleteTask}
                  onToggleToday={onToggleToday}
                  onToggleStar={onToggleStar}
                  onToggleLineup={onToggleLineup}
                  onDateChange={handleDateChange}
                  onAssigneeChange={handleAssigneeChange}
                  onTaskClick={onTaskClick}
                  todayIds={todayIds}
                  starredIds={starredIds}
                  lineupIds={lineupIds}
                  compact
                  teamMembers={teamMembers}
                  maxHeight={480}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-[12px] shadow-xl"
            style={{
              background: "var(--surface-bg)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 8px 32px oklch(0 0 0 / 0.12), 0 2px 8px oklch(0 0 0 / 0.06)",
            }}
          >
            {/* Selection info */}
            <div className="flex items-center gap-2 pr-2 border-r" style={{ borderColor: "var(--border-default)" }}>
              <button
                onClick={selectedIds.size === allTaskIds.length ? clearSelection : selectAll}
                className="p-1 rounded-[4px] hover:bg-black/[0.04] transition-colors"
                style={{ color: "var(--accent-primary)" }}
                aria-label={selectedIds.size === allTaskIds.length ? "Deselect all" : "Select all"}
              >
                {selectedIds.size === allTaskIds.length ? (
                  <MinusSquare className="w-4 h-4" weight="fill" />
                ) : (
                  <CheckSquare className="w-4 h-4" />
                )}
              </button>
              <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap" }}>
                {selectedIds.size} selected
              </span>
            </div>

            {/* Bulk actions */}
            <button
              onClick={handleBulkComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
              style={{ color: "oklch(0.65 0.18 155)", fontSize: "12px", fontWeight: 500 }}
              title="Complete selected"
            >
              <Check className="w-3.5 h-3.5" weight="bold" />
              <span className="hidden sm:inline">Complete</span>
            </button>

            <button
              onClick={() => handleBulkPriority("high")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
              style={{ color: "oklch(0.72 0.17 55)", fontSize: "12px", fontWeight: 500 }}
              title="Set high priority"
            >
              <Flag className="w-3.5 h-3.5" weight="fill" />
              <span className="hidden sm:inline">High</span>
            </button>

            <button
              onClick={() => handleBulkStatus("in-progress")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
              style={{ color: "var(--accent-primary)", fontSize: "12px", fontWeight: 500 }}
              title="Set In Progress"
            >
              <Lightning className="w-3.5 h-3.5" weight="fill" />
              <span className="hidden sm:inline">In Progress</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
              style={{ color: "oklch(0.7 0.18 25)", fontSize: "12px", fontWeight: 500 }}
              title="Delete selected"
            >
              <Trash className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            {/* Close */}
            <button
              onClick={clearSelection}
              className="p-1.5 rounded-[6px] hover:bg-black/[0.04] transition-colors ml-1"
              style={{ color: "var(--text-quaternary)" }}
              title="Clear selection (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Wrap with DndProvider */

export function ProjectTasksView(props: ProjectTasksViewProps) {
  return (
    <TouchDndProvider>
      <ProjectTasksViewInner {...props} />
    </TouchDndProvider>
  );
}

export default ProjectTasksView;