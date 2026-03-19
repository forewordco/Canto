/* ===================================================================
   GLOBAL TASK DETAIL — Opens TaskDetailPane from any view as a modal
   overlay without navigating away from the current page.
   =================================================================== */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { TaskDetailPane } from "./TaskDetailPane";
import { useData } from "../lib/data";
import type { TaskItem } from "../lib/types";

interface GlobalTaskDetailContextValue {
  /** Open the task detail pane for a given task ID. Optionally pass projectName for perf. */
  openTaskDetail: (taskId: string, projectName?: string) => void;
  closeTaskDetail: () => void;
  /** Currently open task ID, if any */
  openTaskId: string | null;
}

const GlobalTaskDetailContext = createContext<GlobalTaskDetailContextValue | null>(null);

const NOOP_CONTEXT: GlobalTaskDetailContextValue = {
  openTaskDetail: () => {},
  closeTaskDetail: () => {},
  openTaskId: null,
};

export function useGlobalTaskDetail() {
  const ctx = useContext(GlobalTaskDetailContext);
  // Return safe fallback during hot-reload when context may be temporarily unavailable
  return ctx ?? NOOP_CONTEXT;
}

export function GlobalTaskDetailProvider({ children }: { children: ReactNode }) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [openProjectName, setOpenProjectName] = useState<string | null>(null);

  const openTaskDetail = useCallback((taskId: string, projectName?: string) => {
    setOpenTaskId(taskId);
    setOpenProjectName(projectName || null);
  }, []);

  const closeTaskDetail = useCallback(() => {
    setOpenTaskId(null);
    setOpenProjectName(null);
  }, []);

  return (
    <GlobalTaskDetailContext.Provider value={{ openTaskDetail, closeTaskDetail, openTaskId }}>
      {children}
      <GlobalTaskDetailOverlay
        taskId={openTaskId}
        projectNameHint={openProjectName}
        onClose={closeTaskDetail}
      />
    </GlobalTaskDetailContext.Provider>
  );
}

/* ─── The actual overlay that renders TaskDetailPane ─── */

function GlobalTaskDetailOverlay({
  taskId,
  projectNameHint,
  onClose,
}: {
  taskId: string | null;
  projectNameHint: string | null;
  onClose: () => void;
}) {
  const { projects, updateTask, deleteTask, spaces } = useData();

  // Find the task and its project
  let task: TaskItem | null = null;
  let projectName: string | null = projectNameHint || null;
  let projectColor: string | undefined;
  let projectIcon: string | undefined;
  let projectShortName: string | undefined;

  if (taskId) {
    // If we have a hint, look there first
    if (projectNameHint && projects[projectNameHint]) {
      const found = projects[projectNameHint].tasks?.find((t) => t.id === taskId);
      if (found) {
        task = found;
        projectName = projectNameHint;
        projectColor = projects[projectNameHint].color;
        projectIcon = projects[projectNameHint].phosphorIcon;
        projectShortName = projects[projectNameHint].shortName;
      }
    }
    // Otherwise search all projects
    if (!task) {
      for (const [pName, pData] of Object.entries(projects)) {
        const found = pData.tasks?.find((t) => t.id === taskId);
        if (found) {
          task = found;
          projectName = pName;
          projectColor = pData.color;
          projectIcon = pData.phosphorIcon;
          projectShortName = pData.shortName;
          break;
        }
      }
    }
  }

  const handleUpdate = useCallback(
    (tid: string, updates: Partial<TaskItem>) => {
      if (projectName) {
        updateTask(projectName, tid, updates);
      }
    },
    [projectName, updateTask]
  );

  const handleDelete = useCallback(
    (tid: string) => {
      if (projectName) {
        deleteTask(projectName, tid);
        onClose();
      }
    },
    [projectName, deleteTask, onClose]
  );

  const handleToggleToday = useCallback(
    (tid: string) => {
      if (projectName && task) {
        updateTask(projectName, tid, { today: !task.today });
      }
    },
    [projectName, task, updateTask]
  );

  const handleToggleLineup = useCallback(
    (tid: string) => {
      if (projectName && task) {
        updateTask(projectName, tid, { lineup: !task.lineup });
      }
    },
    [projectName, task, updateTask]
  );

  // Gather team members from the project's space
  const teamMembers = (() => {
    if (!projectName || !projects[projectName]) return [];
    const proj = projects[projectName];
    const space = spaces.find((s) => s.id === proj.spaceId);
    return (space?.members || []).map((m) => ({
      userId: m.userId,
      displayName: m.displayName,
      avatarColor: m.avatarColor,
      avatarUrl: m.avatarUrl,
    }));
  })();

  const allTasks = projectName && projects[projectName] ? projects[projectName].tasks || [] : [];

  return (
    <AnimatePresence>
      {task && projectName && (
        <TaskDetailPane
          key={task.id}
          task={task}
          projectName={projectName}
          projectColor={projectColor}
          projectIcon={projectIcon}
          projectShortName={projectShortName}
          open={!!task}
          onClose={onClose}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          teamMembers={teamMembers}
          allTasks={allTasks}
          isToday={!!task.today}
          onToggleToday={handleToggleToday}
          isLineup={!!task.lineup}
          onToggleLineup={handleToggleLineup}
        />
      )}
    </AnimatePresence>
  );
}