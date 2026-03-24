/* ═══════════════════════════════════════════════════════════
   MY TASKS PAGE — All incomplete tasks grouped by project.
   Standalone page accessible from sidebar navigation.
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useMemo } from "react";
import {
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  X,
  CheckCircle,
  ListChecks,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData, useAllTasks } from "../lib/data";
import { useAuth } from "../lib/auth";
import { useNavigation } from "../lib/navigation";
import { useGlobalTaskDetail } from "./GlobalTaskDetail";
import { TaskRow } from "./TaskRow";
import { displayProjectName } from "../lib/types";
import type { TaskStatus, Priority, TaskItem } from "../lib/types";

/* ─── Main Component ─── */

export default function MyTasksPage() {
  const {
    projects,
    todayTaskIds,
    toggleToday,
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

  // Handlers
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

  const handleToggleComplete = useCallback(
    (taskId: string) => {
      const found = findProjectForTask(taskId);
      if (found) {
        const isCompleted = found[1].completed;
        dataUpdateTask(found[0], taskId, {
          completed: !isCompleted,
          status: isCompleted ? "todo" : "completed",
          updatedAt: new Date().toISOString(),
        });
      }
    },
    [findProjectForTask, dataUpdateTask]
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
                <div key={group.name} className="mb-1">
                  {/* Project header */}
                  <button
                    onClick={() => toggleProjectCollapse(group.name)}
                    className="flex items-center gap-2 w-full px-5 py-1.5 hover:bg-black/[0.02] transition-colors"
                  >
                    {collapsed ? (
                      <CaretRight size={12} style={{ color: "var(--text-quaternary)" }} />
                    ) : (
                      <CaretDown size={12} style={{ color: "var(--text-quaternary)" }} />
                    )}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: projects[group.name]?.color || "var(--neutral-400)" }}
                    />
                    <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                      {displayProjectName(group.name)}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                      {group.tasks.length}
                    </span>
                  </button>
                  {!collapsed && (
                    <div className="px-3">
                      {group.tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          projectName={task.projectName}
                          projectColor={projectColorsFlat[task.projectName]}
                          isToday={todayTaskIds?.has(task.id)}
                          isLineup={lineupIds.has(task.id)}
                          onStatusChange={handleStatusChange}
                          onTitleChange={handleTitleChange}
                          onPriorityChange={handlePriorityChange}
                          onDateChange={handleDateChange}
                          onAssigneeChange={handleAssigneeChange}
                          onDelete={handleDelete}
                          onToggleToday={(id) => toggleToday(id)}
                          onToggleLineup={handleToggleLineup}
                          onTaskClick={(taskId) => {
                            const t = myTasks.find((x) => x.id === taskId);
                            if (t) handleClickTask(t as TaskItem & { projectName: string });
                          }}
                          compact
                          subtaskCount={task.subtasks?.length || 0}
                          subtaskCompleted={task.subtasks?.filter((s) => s.completed).length || 0}
                          teamMembers={teamMembersList}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Completed section */}
        {myCompletedTasks.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 w-full px-5 py-2.5 hover:bg-black/[0.02] transition-colors"
            >
              <CheckCircle size={14} style={{ color: "var(--text-quaternary)" }} />
              <span className="text-[12px] font-medium" style={{ color: "var(--text-quaternary)" }}>
                {showCompleted ? "Hide" : "Show"} {myCompletedTasks.length} completed task{myCompletedTasks.length !== 1 ? "s" : ""}
              </span>
            </button>
            {showCompleted && (
              <div className="px-3 pb-3">
                {myCompletedTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    showProject
                    projectName={(task as any).projectName}
                    projectColor={projectColorsFlat[(task as any).projectName]}
                    onStatusChange={handleStatusChange}
                    onTitleChange={handleTitleChange}
                    onPriorityChange={handlePriorityChange}
                    onDateChange={handleDateChange}
                    onAssigneeChange={handleAssigneeChange}
                    onDelete={handleDelete}
                    onTaskClick={(taskId) => {
                      const t = myCompletedTasks.find((x) => x.id === taskId);
                      if (t) handleClickTask(t as TaskItem & { projectName: string });
                    }}
                    compact
                    teamMembers={teamMembersList}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
