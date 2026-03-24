/* ═══════════════════════════════════════════════════════════
   MY TASKS PAGE — All incomplete tasks grouped by project.
   Standalone page accessible from sidebar navigation.
   Matches the look and behavior of ProjectTasksView.
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  X,
  ListChecks,
  CheckSquare,
  Square,
  MinusSquare,
  Check,
  Flag,
  Lightning,
  Trash,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData, useAllTasks } from "../lib/data";
import { useAuth } from "../lib/auth";
import { useNavigation } from "../lib/navigation";
import { useGlobalTaskDetail } from "./GlobalTaskDetail";
import { TaskRow } from "./TaskRow";
import { VirtualizedTaskList, VIRTUALIZE_THRESHOLD } from "./VirtualizedTaskList";
import { displayProjectName } from "../lib/types";
import type { TaskStatus, Priority, TaskItem } from "../lib/types";

/* ─── Main Component ─── */

export default function MyTasksPage() {
  const {
    projects,
    todayTaskIds,
    toggleToday,
    starred,
    toggleStarred,
    updateTask: dataUpdateTask,
    deleteTask: dataDeleteTask,
    teamMembers,
  } = useData();
  const { profile } = useAuth();
  const { navigate } = useNavigation();
  const { openTaskDetail } = useGlobalTaskDetail();
  const allTasks = useAllTasks();

  const [search, setSearch] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);

  const userId = profile?.userId;

  // My incomplete tasks
  const myTasks = useMemo(() => {
    const q = search.toLowerCase();
    return allTasks.filter((t) => {
      if (t.completed) return false;
      if (userId && t.assignee && t.assignee !== userId) return false;
      if (q && !t.title.toLowerCase().includes(q) && !(t as any).projectName?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allTasks, userId, search]);

  // My completed tasks
  const myCompletedTasks = useMemo(() => {
    const q = search.toLowerCase();
    return allTasks.filter((t) => {
      if (!t.completed) return false;
      if (userId && t.assignee && t.assignee !== userId) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allTasks, userId, search]);

  // Group by project
  const tasksByProject = useMemo(() => {
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

  // All task IDs for multi-select
  const allTaskIds = useMemo(() => myTasks.map((t) => t.id), [myTasks]);

  // Lineup IDs
  const lineupIds = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTasks) {
      if ((t as any).lineup) set.add(t.id);
    }
    return set;
  }, [allTasks]);

  // Team members for pickers
  const teamMembersList = useMemo(
    () => teamMembers.map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      avatarColor: m.avatarColor,
      avatarUrl: m.avatarUrl,
    })),
    [teamMembers]
  );

  // Project colors
  const projectColorsFlat = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [name, proj] of Object.entries(projects)) {
      map[name] = proj.color;
    }
    return map;
  }, [projects]);

  // Helper to find project for task
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

  // Multi-select handlers
  const toggleSelect = useCallback(
    (taskId: string, e?: React.MouseEvent) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
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

  const selectMode = selectedIds.size > 0;

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
      const found = findProjectForTask(id);
      if (found) dataUpdateTask(found[0], id, { status: "completed" as TaskStatus, completed: true });
    }
    clearSelection();
  }, [selectedIds, findProjectForTask, dataUpdateTask, clearSelection]);

  const handleBulkDelete = useCallback(() => {
    for (const id of selectedIds) {
      const found = findProjectForTask(id);
      if (found) dataDeleteTask(found[0], id);
    }
    clearSelection();
  }, [selectedIds, findProjectForTask, dataDeleteTask, clearSelection]);

  const handleBulkPriority = useCallback(
    (priority: Priority) => {
      for (const id of selectedIds) {
        const found = findProjectForTask(id);
        if (found) dataUpdateTask(found[0], id, { priority });
      }
      clearSelection();
    },
    [selectedIds, findProjectForTask, dataUpdateTask, clearSelection]
  );

  const handleBulkStatus = useCallback(
    (status: TaskStatus) => {
      for (const id of selectedIds) {
        const found = findProjectForTask(id);
        if (found) dataUpdateTask(found[0], id, { status, completed: status === "completed" });
      }
      clearSelection();
    },
    [selectedIds, findProjectForTask, dataUpdateTask, clearSelection]
  );

  // Task handlers
  const handleStatusChange = useCallback(
    (taskId: string, status: TaskStatus) => {
      const found = findProjectForTask(taskId);
      if (found) dataUpdateTask(found[0], taskId, { status, completed: status === "completed" });
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleTitleChange = useCallback(
    (taskId: string, title: string) => {
      const found = findProjectForTask(taskId);
      if (found) dataUpdateTask(found[0], taskId, { title });
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handlePriorityChange = useCallback(
    (taskId: string, priority: Priority) => {
      const found = findProjectForTask(taskId);
      if (found) dataUpdateTask(found[0], taskId, { priority });
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleDateChange = useCallback(
    (taskId: string, date: string | undefined) => {
      const found = findProjectForTask(taskId);
      if (found) dataUpdateTask(found[0], taskId, { date });
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleAssigneeChange = useCallback(
    (taskId: string, assignee: string | undefined) => {
      const found = findProjectForTask(taskId);
      if (found) dataUpdateTask(found[0], taskId, { assignee });
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleToggleLineup = useCallback(
    (taskId: string) => {
      const found = findProjectForTask(taskId);
      if (found) dataUpdateTask(found[0], taskId, { lineup: !found[1].lineup });
    },
    [findProjectForTask, dataUpdateTask]
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      const found = findProjectForTask(taskId);
      if (found) dataDeleteTask(found[0], taskId);
    },
    [findProjectForTask, dataDeleteTask]
  );

  const handleClickTask = useCallback(
    (task: TaskItem & { projectName?: string }) => {
      const projectName = task.projectName || findProjectForTask(task.id)?.[0];
      if (projectName) openTaskDetail(task.id, projectName);
    },
    [openTaskDetail, findProjectForTask]
  );

  const toggleProjectCollapse = useCallback((name: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ background: "var(--surface-bg)" }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <ListChecks size={20} weight="duotone" style={{ color: "var(--text-tertiary)" }} />
        <h1 className="text-[17px] font-semibold" style={{ color: "var(--text-primary)" }}>
          My Tasks
        </h1>
        <span
          className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[12px] font-bold"
          style={{ background: "var(--neutral-100)", color: "var(--text-tertiary)" }}
        >
          {myTasks.length}
        </span>
        <div className="flex-1" />
        {/* Search */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] w-[220px]"
          style={{ background: "var(--neutral-100)" }}
        >
          <MagnifyingGlass size={14} style={{ color: "var(--text-quaternary)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="p-0.5" style={{ color: "var(--text-quaternary)" }}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Column headers — matching ProjectTasksView */}
      <div className="hidden sm:flex items-stretch border-b mx-3" style={{ borderColor: "var(--border-default)", background: "var(--neutral-50)" }}>
        <span className="flex-1 flex items-center px-3 py-1.5 border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>TASK</span>
        <div className="shrink-0 grid items-stretch" style={{ gridTemplateColumns: "80px 64px 72px 40px 28px" }}>
          <span className="flex items-center justify-center border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>STATUS</span>
          <span className="flex items-center justify-center border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>PRIORITY</span>
          <span className="flex items-center justify-center border-r" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em", borderColor: "var(--border-subtle)" }}>DUE</span>
          <span className="flex items-center justify-center" style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>OWNER</span>
          <span />
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {tasksByProject.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <ListChecks size={40} weight="thin" style={{ color: "var(--text-quaternary)", opacity: 0.5 }} />
            <p className="mt-3 text-[14px] font-medium" style={{ color: "var(--text-tertiary)" }}>
              {search ? "No tasks match your search" : "No tasks assigned to you"}
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--text-quaternary)" }}>
              {search ? "Try a different search term" : "Tasks you create or are assigned will appear here"}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {tasksByProject.map((group) => {
              const collapsed = collapsedProjects.has(group.name);
              return (
                <div key={group.name} className="mb-4">
                  {/* Project header — styled like ProjectTasksView section header */}
                  <div
                    className="flex items-center gap-2 py-2 px-4 group/section"
                    style={{ borderBottom: "1px solid var(--border-default)" }}
                  >
                    <button
                      onClick={() => toggleProjectCollapse(group.name)}
                      className="shrink-0 p-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04]"
                      style={{ color: projects[group.name]?.color || "var(--text-tertiary)" }}
                    >
                      {collapsed ? (
                        <CaretRight className="w-3.5 h-3.5" />
                      ) : (
                        <CaretDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: projects[group.name]?.color || "var(--neutral-400)" }}
                    />
                    <span
                      className="flex-1 min-w-0 truncate uppercase"
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: projects[group.name]?.color || "var(--text-primary)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {displayProjectName(group.name)}
                    </span>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded-[4px]"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-quaternary)",
                        background: "var(--neutral-100)",
                      }}
                    >
                      {group.tasks.length}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="py-0.5 px-3">
                          {group.tasks.map((task) => (
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
                              {/* Selection checkbox */}
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
                                <TaskRow
                                  key={task.id}
                                  task={task}
                                  projectName={task.projectName}
                                  projectColor={projectColorsFlat[task.projectName]}
                                  isToday={todayTaskIds?.has(task.id)}
                                  isStarred={starred.has(task.id)}
                                  isLineup={lineupIds.has(task.id)}
                                  onStatusChange={handleStatusChange}
                                  onTitleChange={handleTitleChange}
                                  onPriorityChange={handlePriorityChange}
                                  onDateChange={handleDateChange}
                                  onAssigneeChange={handleAssigneeChange}
                                  onDelete={handleDelete}
                                  onToggleToday={(id) => toggleToday(id)}
                                  onToggleStar={(id) => toggleStarred(id)}
                                  onToggleLineup={handleToggleLineup}
                                  onTaskClick={(taskId) => {
                                    const t = myTasks.find((x) => x.id === taskId);
                                    if (t) handleClickTask(t as TaskItem & { projectName: string });
                                  }}
                                  subtaskCount={task.subtasks?.length || 0}
                                  subtaskCompleted={task.subtasks?.filter((s) => s.completed).length || 0}
                                  teamMembers={teamMembersList}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed section */}
        {myCompletedTasks.length > 0 && (
          <div className="mt-6 px-3">
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
                {myCompletedTasks.length}
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
                  {myCompletedTasks.length >= VIRTUALIZE_THRESHOLD ? (
                    <VirtualizedTaskList
                      tasks={myCompletedTasks}
                      projectName=""
                      onStatusChange={handleStatusChange}
                      onTitleChange={handleTitleChange}
                      onPriorityChange={handlePriorityChange}
                      onDelete={handleDelete}
                      onToggleToday={(id) => toggleToday(id)}
                      onToggleStar={(id) => toggleStarred(id)}
                      onToggleLineup={handleToggleLineup}
                      onDateChange={handleDateChange}
                      onAssigneeChange={handleAssigneeChange}
                      onTaskClick={(taskId) => {
                        const t = myCompletedTasks.find((x) => x.id === taskId);
                        if (t) handleClickTask(t as TaskItem & { projectName: string });
                      }}
                      todayIds={todayTaskIds || new Set()}
                      starredIds={starred}
                      lineupIds={lineupIds}
                      compact
                      teamMembers={teamMembersList}
                      maxHeight={480}
                    />
                  ) : (
                    myCompletedTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        showProject
                        projectName={(task as any).projectName}
                        projectColor={projectColorsFlat[(task as any).projectName]}
                        isStarred={starred.has(task.id)}
                        onStatusChange={handleStatusChange}
                        onTitleChange={handleTitleChange}
                        onPriorityChange={handlePriorityChange}
                        onDateChange={handleDateChange}
                        onAssigneeChange={handleAssigneeChange}
                        onDelete={handleDelete}
                        onToggleStar={(id) => toggleStarred(id)}
                        onTaskClick={(taskId) => {
                          const t = myCompletedTasks.find((x) => x.id === taskId);
                          if (t) handleClickTask(t as TaskItem & { projectName: string });
                        }}
                        compact
                        teamMembers={teamMembersList}
                      />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

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
