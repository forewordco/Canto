/* ═══════════════════════════════════════════════════════════
   DATA CONTEXT — Centralized data layer with auto-save.
   
   Loads all workspace data on mount via batch-load endpoint.
   Tracks dirty state per entity type. Debounced auto-save
   (1200ms) batches all dirty mutations into a single
   batch-save request. Optimistic UI — state updates
   immediately, persistence happens in the background.
   
   Phase 3 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { api } from "./api";
import { waitForServer } from "./api";
import { useAuth } from "./auth";
import { sendNotification } from "./notifications";
import type {
  ProjectData,
  ClientData,
  CalendarEvent,
  WorkspaceDoc,
  TeamMemberInfo,
  NotificationItem,
  TimeBlock,
  WeekSettings,
  ProfileData,
  TaskItem,
  DocFolder,
  Space,
} from "./types";
import type { Recurrence } from "./types";
import { useOnlineStatus, enqueueMutation, readQueue, clearQueue, getQueueSize } from "./offline";

/* ── Recurrence Date Computation ─── */

function computeNextRecurrenceDate(
  currentDate: string,
  recurrence: Recurrence
): string | null {
  try {
    const d = new Date(currentDate);
    if (isNaN(d.getTime())) return null;

    switch (recurrence.frequency) {
      case "daily":
        d.setDate(d.getDate() + 1);
        break;
      case "weekly":
        d.setDate(d.getDate() + 7);
        break;
      case "biweekly":
        d.setDate(d.getDate() + 14);
        break;
      case "monthly":
        d.setMonth(d.getMonth() + 1);
        break;
      default:
        return null;
    }

    // Check end date
    if (recurrence.endDate) {
      const end = new Date(recurrence.endDate);
      if (d > end) return null;
    }

    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

/* ─── Dirty Flags ─── */

type DirtyFlag =
  | "clients"
  | "events"
  | "docs"
  | "profile"
  | "starred"
  | "todayTasks"
  | "timeBlocks"
  | "weekSettings"
  | "notifications"
  | "teamMembers"
  | "spaces";

/* ─── Batch Load Response Shape ─── */

interface BatchLoadResponse {
  projects: Record<string, ProjectData>;
  clients: ClientData[];
  events: CalendarEvent[];
  docs: WorkspaceDoc[];
  profile: ProfileData | null;
  starred: string[];
  todayTasks: string[];
  timeBlocks: TimeBlock[];
  weekSettings: WeekSettings | null;
  notifications: NotificationItem[];
  teamMembers: TeamMemberInfo[];
  spaces: Space[];
}

/* ─── Context Value ─── */

export interface DataContextValue {
  /* ── Loading State ── */
  isLoading: boolean;
  isLoaded: boolean;
  loadError: string | null;

  /* ── Projects ── */
  projects: Record<string, ProjectData>;
  setProject: (name: string, data: ProjectData) => void;
  deleteProject: (name: string) => void;
  /** Update a single task within a project */
  updateTask: (projectName: string, taskId: string, updates: Partial<TaskItem>) => void;
  /** Add a task to a project */
  addTask: (projectName: string, task: TaskItem) => void;
  /** Delete a task from a project */
  deleteTask: (projectName: string, taskId: string) => void;

  /* ── Clients ── */
  clients: ClientData[];
  setClients: (clients: ClientData[]) => void;
  addClient: (client: ClientData) => void;
  updateClient: (clientId: string, updates: Partial<ClientData>) => void;
  deleteClient: (clientId: string) => void;

  /* ── Calendar Events ── */
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;

  /* ── Workspace Docs ── */
  docs: WorkspaceDoc[];
  setDocs: (docs: WorkspaceDoc[]) => void;
  addDoc: (doc: WorkspaceDoc) => void;
  updateDoc: (docId: string, updates: Partial<WorkspaceDoc>) => void;
  deleteDoc: (docId: string) => void;
  docFolders: DocFolder[];
  setDocFolders: (folders: DocFolder[]) => void;

  /* ── Team Members ── */
  teamMembers: TeamMemberInfo[];
  setTeamMembers: (members: TeamMemberInfo[]) => void;
  updateTeamMember: (userId: string, updates: Partial<TeamMemberInfo>) => void;

  /* ── Notifications ── */
  notifications: NotificationItem[];
  setNotifications: (notifications: NotificationItem[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  archiveNotification: (id: string) => void;
  addNotification: (notification: NotificationItem) => void;
  unreadCount: number;

  /* ── Starred ── */
  starred: Set<string>;
  toggleStarred: (id: string) => void;
  isStarred: (id: string) => boolean;

  /* ── Today Tasks ── */
  todayTaskIds: Set<string>;
  toggleToday: (id: string) => void;
  isToday: (id: string) => boolean;

  /* ── Time Blocks ── */
  timeBlocks: TimeBlock[];
  setTimeBlocks: (blocks: TimeBlock[]) => void;
  addTimeBlock: (block: TimeBlock) => void;
  updateTimeBlock: (blockId: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (blockId: string) => void;

  /* ── Week Settings ── */
  weekSettings: WeekSettings | null;
  setWeekSettings: (settings: WeekSettings) => void;

  /* ── Spaces ── */
  spaces: Space[];
  setSpaces: (spaces: Space[]) => void;
  addSpace: (space: Space) => void;
  updateSpace: (spaceId: string, updates: Partial<Space>) => void;
  deleteSpace: (spaceId: string) => void;
  toggleSpaceVisibility: (spaceId: string) => void;
  /** Set of visible space IDs (for filtering) */
  visibleSpaceIds: Set<string>;
  /** Check if an item is visible based on its spaceId */
  isItemVisibleBySpace: (spaceId?: string) => boolean;

  /* ── Actions ── */
  /** Force an immediate save of all dirty data */
  saveNow: () => Promise<void>;
  /** Reload all data from the server */
  reload: () => Promise<void>;
  /** Whether there are unsaved changes */
  hasDirtyData: boolean;
  /** Last save timestamp */
  lastSavedAt: Date | null;
  /** Whether a save is currently in progress */
  isSaving: boolean;
}

const DataContext = createContext<DataContextValue | null>(null);

/* ── Auto-save debounce delay ─── */
const SAVE_DEBOUNCE_MS = 1200;

/* ═══════════════════════════════════════════════════════════
   DATA PROVIDER
   ═══════════════════════════════════════════════════════════ */

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isDevMode, authState, profile: authProfile } = useAuth();

  /* ── Online status for offline queueing ── */
  const isOnline = useOnlineStatus();
  const isOnlineRef = useRef(isOnline);
  isOnlineRef.current = isOnline;
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);
  const [isReplayingSyncs, setIsReplayingSyncs] = useState(false);

  /* ── State ── */
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Data state
  const [projects, setProjects] = useState<Record<string, ProjectData>>({});
  const [clients, setClients] = useState<ClientData[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [docs, setDocs] = useState<WorkspaceDoc[]>([]);
  const [docFolders, setDocFolders] = useState<DocFolder[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [starredArr, setStarredArr] = useState<string[]>([]);
  const [todayArr, setTodayArr] = useState<string[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [weekSettings, setWeekSettings] = useState<WeekSettings | null>(null);
  const [spaces, setSpacesState] = useState<Space[]>([]);

  // Derived sets for O(1) lookups
  const starred = new Set(starredArr);
  const todayTaskIds = new Set(todayArr);
  const unreadCount = notifications.filter((n) => !n.read && !n.archived).length;
  const visibleSpaceIds = new Set(spaces.filter((s) => s.visible).map((s) => s.id));
  const isItemVisibleBySpace = useCallback(
    (spaceId?: string): boolean => {
      // No spaces exist → everything visible
      if (spaces.length === 0) return true;
      // Item has no space → always visible
      if (!spaceId) return true;
      // Check if the item's space is toggled on
      return visibleSpaceIds.has(spaceId);
    },
    [spaces, visibleSpaceIds]
  );

  /* ── Latest-state refs for save (avoids stale closures) ── */
  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const clientsRef = useRef(clients);
  clientsRef.current = clients;
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const teamMembersRef = useRef(teamMembers);
  teamMembersRef.current = teamMembers;
  const notificationsRef = useRef(notifications);
  notificationsRef.current = notifications;
  const starredArrRef = useRef(starredArr);
  starredArrRef.current = starredArr;
  const todayArrRef = useRef(todayArr);
  todayArrRef.current = todayArr;
  const timeBlocksRef = useRef(timeBlocks);
  timeBlocksRef.current = timeBlocks;
  const weekSettingsRef = useRef(weekSettings);
  weekSettingsRef.current = weekSettings;
  const spacesRef = useRef(spaces);
  spacesRef.current = spaces;
  const isDevModeRef = useRef(isDevMode);
  isDevModeRef.current = isDevMode;

  /* ── Dirty Tracking ── */
  const dirtyFlagsRef = useRef(new Set<DirtyFlag>());
  const dirtyProjectsRef = useRef(new Set<string>());
  const deletedProjectsRef = useRef(new Set<string>());
  const initialLoadDoneRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  /* ── Mark dirty and schedule save ── */
  const markDirty = useCallback((flag: DirtyFlag) => {
    if (!initialLoadDoneRef.current) return;
    dirtyFlagsRef.current.add(flag);
    scheduleSave();
  }, []);

  const markProjectDirty = useCallback((projectName: string) => {
    if (!initialLoadDoneRef.current) return;
    dirtyProjectsRef.current.add(projectName);
    scheduleSave();
  }, []);

  /* ── Schedule debounced save ── */
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      performSave();
    }, SAVE_DEBOUNCE_MS);
  }, []);

  /* ── Perform the actual batch save ── */
  const performSave = useCallback(async () => {
    if (savingRef.current) return;
    if (
      dirtyFlagsRef.current.size === 0 &&
      dirtyProjectsRef.current.size === 0 &&
      deletedProjectsRef.current.size === 0
    ) {
      return;
    }

    if (isDevModeRef.current) {
      // In dev mode, just clear dirty flags
      dirtyFlagsRef.current.clear();
      dirtyProjectsRef.current.clear();
      deletedProjectsRef.current.clear();
      return;
    }

    savingRef.current = true;
    setIsSaving(true);

    // Hoist body & saved flags so catch block can access them
    const body: Record<string, any> = {};
    let savedFlags = new Set<DirtyFlag>();
    let savedProjects = new Set<string>();
    let savedDeleted = new Set<string>();

    try {
      // Gather dirty projects from ref
      if (dirtyProjectsRef.current.size > 0) {
        const projectPayload: Record<string, ProjectData> = {};
        const currentProjects = projectsRef.current;
        for (const name of dirtyProjectsRef.current) {
          if (currentProjects[name]) {
            projectPayload[`project:shared:${name}`] = currentProjects[name];
          }
        }
        body.projects = projectPayload;
      }

      // Gather deleted projects
      if (deletedProjectsRef.current.size > 0) {
        body.deletedProjects = Array.from(deletedProjectsRef.current).map(
          (name) => `project:shared:${name}`
        );
      }

      // Gather dirty flags — read from refs
      const flags = dirtyFlagsRef.current;
      if (flags.has("clients")) body.clients = clientsRef.current;
      if (flags.has("events")) body.events = eventsRef.current;
      if (flags.has("docs")) body.docs = docsRef.current;
      if (flags.has("starred")) body.starred = starredArrRef.current;
      if (flags.has("todayTasks")) body.todayTasks = todayArrRef.current;
      if (flags.has("timeBlocks")) body.timeBlocks = timeBlocksRef.current;
      if (flags.has("weekSettings")) body.weekSettings = weekSettingsRef.current;
      if (flags.has("notifications")) body.notifications = notificationsRef.current;
      if (flags.has("teamMembers")) body.teamMembers = teamMembersRef.current;
      if (flags.has("spaces")) body.spaces = spacesRef.current;

      // Clear dirty tracking BEFORE the request (optimistic)
      savedFlags = new Set(dirtyFlagsRef.current);
      savedProjects = new Set(dirtyProjectsRef.current);
      savedDeleted = new Set(deletedProjectsRef.current);
      dirtyFlagsRef.current.clear();
      dirtyProjectsRef.current.clear();
      deletedProjectsRef.current.clear();

      // If offline, queue the mutation for later replay
      if (!isOnlineRef.current) {
        console.log("[Data] Offline — queueing save to IndexedDB");
        await enqueueMutation(body);
        setOfflineQueueSize((prev) => prev + 1);
        setLastSavedAt(new Date());
        return; // Don't try the network request
      }

      const { error } = await api.post("/data/batch-save", body);

      if (error) {
        console.error(`[Data] Batch save failed: ${error}`);
        // If the error looks like a network issue, queue it
        if (error.includes("fetch") || error.includes("network") || error.includes("Failed")) {
          console.log("[Data] Network error — queueing save to IndexedDB");
          await enqueueMutation(body);
          setOfflineQueueSize((prev) => prev + 1);
        } else {
          // Restore dirty flags on failure so next save retries
          for (const f of savedFlags) dirtyFlagsRef.current.add(f);
          for (const p of savedProjects) dirtyProjectsRef.current.add(p);
          for (const d of savedDeleted) deletedProjectsRef.current.add(d);
          scheduleSave(); // Retry after delay
        }
      } else {
        setLastSavedAt(new Date());
        console.log(`[Data] Batch save successful`);
      }
    } catch (err) {
      console.error(`[Data] Save error:`, err);
      // On catch (likely network error), queue the FULL body (not just projects)
      try {
        if (Object.keys(body).length > 0) {
          await enqueueMutation(body);
          setOfflineQueueSize((prev) => prev + 1);
          console.log("[Data] Queued full mutation body to IndexedDB after exception");
        } else {
          // Restore dirty flags so next save retries
          for (const f of savedFlags) dirtyFlagsRef.current.add(f);
          for (const p of savedProjects) dirtyProjectsRef.current.add(p);
          for (const d of savedDeleted) deletedProjectsRef.current.add(d);
          scheduleSave();
        }
      } catch {
        // Last resort: restore dirty flags so data isn't lost
        console.error("[Data] Failed to queue offline mutation — restoring dirty flags");
        for (const f of savedFlags) dirtyFlagsRef.current.add(f);
        for (const p of savedProjects) dirtyProjectsRef.current.add(p);
        for (const d of savedDeleted) deletedProjectsRef.current.add(d);
        scheduleSave();
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, []);

  /* ── Replay offline queue when back online ── */
  useEffect(() => {
    if (!isOnline || isDevMode) return;

    const replayQueue = async () => {
      const queue = await readQueue();
      if (queue.length === 0) return;

      console.log(`[Data] Back online — replaying ${queue.length} queued mutations`);
      setIsReplayingSyncs(true);

      // Merge all queued mutations into one batch
      const mergedBody: Record<string, any> = {};
      for (const mut of queue) {
        const p = mut.payload;
        if (p.projects) {
          mergedBody.projects = { ...(mergedBody.projects || {}), ...(p.projects as Record<string, unknown>) };
        }
        if (p.deletedProjects) {
          mergedBody.deletedProjects = [...(mergedBody.deletedProjects || []), ...(p.deletedProjects as string[])];
        }
        for (const key of ["clients", "events", "docs", "starred", "todayTasks", "timeBlocks", "weekSettings", "notifications", "teamMembers", "profile", "spaces"]) {
          if ((p as any)[key] !== undefined) {
            mergedBody[key] = (p as any)[key];
          }
        }
      }

      try {
        const { error } = await api.post("/data/batch-save", mergedBody);
        if (!error) {
          await clearQueue();
          setOfflineQueueSize(0);
          console.log("[Data] Offline queue replayed and cleared");
        } else {
          console.error("[Data] Offline queue replay failed:", error);
        }
      } catch (err) {
        console.error("[Data] Offline queue replay error:", err);
      } finally {
        setIsReplayingSyncs(false);
      }
    };

    // Small delay to let network stabilize
    const timer = setTimeout(replayQueue, 2500);
    return () => clearTimeout(timer);
  }, [isOnline, isDevMode]);

  // Check initial queue size on mount
  useEffect(() => {
    getQueueSize().then(setOfflineQueueSize).catch(() => {});
  }, []);

  /* ── Load all data ── */
  const loadData = useCallback(async () => {
    if (isDevMode) {
      // Dev mode — load empty data, mark as loaded
      // Seed a default "Personal" space
      setSpacesState([{
        id: "space-personal",
        name: "Personal",
        color: "oklch(0.65 0.16 290)",
        icon: "👤",
        phosphorIcon: "User",
        description: "Your personal workspace",
        order: 0,
        visible: true,
        createdAt: new Date().toISOString(),
      }]);
      setIsLoading(false);
      setIsLoaded(true);
      initialLoadDoneRef.current = true;
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      // Wait for the edge function server to be reachable before making data requests
      await waitForServer();

      // If we have unsaved dirty data, flush it before loading to prevent
      // the load from overwriting in-memory changes with stale server data.
      if (
        initialLoadDoneRef.current &&
        (dirtyFlagsRef.current.size > 0 ||
         dirtyProjectsRef.current.size > 0 ||
         deletedProjectsRef.current.size > 0)
      ) {
        console.log("[Data] Flushing dirty data before reload...");
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }
        await performSave();
      }

      const { data, error } = await api.post<BatchLoadResponse>("/data/batch-load", {});

      if (error) {
        console.error(`[Data] Batch load error: ${error}`);
        setLoadError(error);
        setIsLoading(false);
        return;
      }

      if (data) {
        // Parse projects: keys are "project:shared:<name>", extract name
        const parsedProjects: Record<string, ProjectData> = {};
        for (const [key, value] of Object.entries(data.projects || {})) {
          const name = key.replace("project:shared:", "");
          parsedProjects[name] = value as ProjectData;
        }

        // Safety check: if we already had projects loaded and the server
        // returned zero projects, treat this as a transient load failure
        // to prevent silently wiping the user's in-memory state.
        const prevProjectCount = Object.keys(projectsRef.current).length;
        const newProjectCount = Object.keys(parsedProjects).length;
        if (prevProjectCount > 0 && newProjectCount === 0) {
          console.warn(
            `[Data] Load returned 0 projects but we previously had ${prevProjectCount}. ` +
            `Treating as transient failure — keeping existing data.`
          );
          setLoadError("Server returned empty project list — retrying...");
          setIsLoading(false);
          return;
        }

        // Safety check: same guard for spaces
        const prevSpaceCount = spacesRef.current.length;
        const newSpaces = Array.isArray(data.spaces) ? data.spaces : [];
        if (prevSpaceCount > 0 && newSpaces.length === 0) {
          console.warn(
            `[Data] Load returned 0 spaces but we previously had ${prevSpaceCount}. ` +
            `Treating as transient failure — keeping existing data.`
          );
          setLoadError("Server returned empty spaces list — retrying...");
          setIsLoading(false);
          return;
        }

        setProjects(parsedProjects);
        setClients(Array.isArray(data.clients) ? data.clients : []);
        setEvents(Array.isArray(data.events) ? data.events : []);
        setDocs(Array.isArray(data.docs) ? data.docs : []);
        setTeamMembers(Array.isArray(data.teamMembers) ? data.teamMembers : []);
        setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
        setStarredArr(Array.isArray(data.starred) ? data.starred : []);
        setTodayArr(Array.isArray(data.todayTasks) ? data.todayTasks : []);
        setTimeBlocks(Array.isArray(data.timeBlocks) ? data.timeBlocks : []);
        setWeekSettings(data.weekSettings || null);
        setSpacesState(Array.isArray(data.spaces) ? data.spaces : []);

        // Seed a default "Personal" space if none exist
        const loadedSpaces = Array.isArray(data.spaces) ? data.spaces : [];
        if (loadedSpaces.length === 0) {
          const personalSpace: Space = {
            id: "space-personal",
            name: "Personal",
            color: "oklch(0.65 0.16 290)",
            icon: "👤",
            phosphorIcon: "User",
            description: "Your personal workspace",
            order: 0,
            visible: true,
            createdAt: new Date().toISOString(),
          };
          setSpacesState([personalSpace]);
          // Mark dirty so it persists on first save
          requestAnimationFrame(() => {
            if (initialLoadDoneRef.current) {
              dirtyFlagsRef.current.add("spaces");
              scheduleSave();
            }
          });
        }

        console.log(
          `[Data] Loaded: ${Object.keys(parsedProjects).length} projects, ` +
          `${(data.clients || []).length} clients, ` +
          `${(data.teamMembers || []).length} team members, ` +
          `${(data.docs || []).length} docs`
        );
      }

      setIsLoaded(true);

      // Mark initial load as done AFTER state settles
      // to prevent the auto-save from triggering on mount
      requestAnimationFrame(() => {
        initialLoadDoneRef.current = true;
      });
    } catch (err) {
      console.error(`[Data] Load error:`, err);
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [isDevMode]);

  /* ── Load on mount when authenticated ── */
  const loadRetryRef = useRef(0);
  const loadRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (authState === "authenticated") {
      loadData();
    }
  }, [authState, loadData]);

  // Auto-retry on load failure with exponential backoff (max 3 retries)
  useEffect(() => {
    if (loadError && !isLoading && !isLoaded && loadRetryRef.current < 3) {
      const delay = Math.min(2000 * Math.pow(2, loadRetryRef.current), 15000);
      console.warn(`[Data] Auto-retry ${loadRetryRef.current + 1}/3 in ${delay}ms...`);
      loadRetryTimerRef.current = setTimeout(() => {
        loadRetryRef.current++;
        loadData();
      }, delay);
      return () => {
        if (loadRetryTimerRef.current) clearTimeout(loadRetryTimerRef.current);
      };
    }
    if (isLoaded) {
      loadRetryRef.current = 0; // Reset on success
    }
  }, [loadError, isLoading, isLoaded, loadData]);

  /* ── Cleanup save timer on unmount ── */
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Flush any pending saves
      if (
        dirtyFlagsRef.current.size > 0 ||
        dirtyProjectsRef.current.size > 0 ||
        deletedProjectsRef.current.size > 0
      ) {
        performSave();
      }
    };
  }, []);

  /* ── Save before page unload ── */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        dirtyFlagsRef.current.size > 0 ||
        dirtyProjectsRef.current.size > 0 ||
        deletedProjectsRef.current.size > 0
      ) {
        performSave();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [performSave]);

  /* ═══════════════════════════════════════════════════════════
     ACTION METHODS — Optimistic updates + dirty marking
     ═══════════════════════════════════════════════════════════ */

  /* ── Projects ── */
  const setProject = useCallback(
    (name: string, data: ProjectData) => {
      setProjects((prev) => ({ ...prev, [name]: data }));
      markProjectDirty(name);
    },
    [markProjectDirty]
  );

  const deleteProject = useCallback(
    (name: string) => {
      setProjects((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      deletedProjectsRef.current.add(name);
      dirtyProjectsRef.current.delete(name); // No need to save a deleted project
      scheduleSave();
    },
    [scheduleSave]
  );

  const updateTask = useCallback(
    (projectName: string, taskId: string, updates: Partial<TaskItem>) => {
      // Detect notification-worthy changes before applying updates
      const currentProject = projectsRef.current[projectName];
      const oldTask = currentProject?.tasks.find((t) => t.id === taskId);

      setProjects((prev) => {
        const project = prev[projectName];
        if (!project) return prev;

        const updatedTasks = project.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        );

        // Recurring task: spawn next occurrence when completed
        if (
          updates.completed === true &&
          oldTask &&
          !oldTask.completed &&
          oldTask.recurrence
        ) {
          const nextDate = computeNextRecurrenceDate(
            oldTask.date || new Date().toISOString().slice(0, 10),
            oldTask.recurrence
          );
          if (nextDate) {
            const newTask: TaskItem = {
              ...oldTask,
              id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              completed: false,
              status: "todo",
              date: nextDate,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              comments: [],
              attachments: [],
              subtasks: oldTask.subtasks?.map((s) => ({
                ...s,
                id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                completed: false,
              })),
            };
            updatedTasks.push(newTask);
          }
        }

        return {
          ...prev,
          [projectName]: { ...project, tasks: updatedTasks },
        };
      });
      markProjectDirty(projectName);

      // Fire notifications (non-blocking, fire-and-forget)
      if (oldTask && user) {
        const fromUserName = user.user_metadata?.name || user.email || "Someone";
        const taskTitle = updates.title || oldTask.title;

        // 1. Assignee changed → notify new assignee
        if (updates.assignee && updates.assignee !== oldTask.assignee) {
          sendNotification({
            targetUserId: updates.assignee,
            type: "task_assigned",
            title: `Assigned to you: ${taskTitle}`,
            message: `${fromUserName} assigned you a task in ${projectName}`,
            fromUserName,
            projectName,
            taskId,
            taskTitle,
          }).catch(() => {});
        }

        // 2. Task completed → notify assignee (if different from actor)
        if (updates.completed === true && !oldTask.completed && oldTask.assignee && oldTask.assignee !== user.id) {
          sendNotification({
            targetUserId: oldTask.assignee,
            type: "task_completed",
            title: `Task completed: ${taskTitle}`,
            message: `${fromUserName} completed a task in ${projectName}`,
            fromUserName,
            projectName,
            taskId,
            taskTitle,
          }).catch(() => {});
        }

        // 3. Status changed → notify assignee (if different from actor)
        if (updates.status && updates.status !== oldTask.status && oldTask.assignee && oldTask.assignee !== user.id) {
          sendNotification({
            targetUserId: oldTask.assignee,
            type: "status_changed",
            title: `Status changed: ${taskTitle}`,
            message: `${fromUserName} changed status to "${updates.status}" in ${projectName}`,
            fromUserName,
            projectName,
            taskId,
            taskTitle,
          }).catch(() => {});
        }
      }
    },
    [markProjectDirty, user]
  );

  const addTask = useCallback(
    (projectName: string, task: TaskItem) => {
      setProjects((prev) => {
        const project = prev[projectName];
        if (!project) return prev;
        return {
          ...prev,
          [projectName]: {
            ...project,
            tasks: [...project.tasks, { ...task, createdAt: new Date().toISOString() }],
          },
        };
      });
      markProjectDirty(projectName);
    },
    [markProjectDirty]
  );

  const deleteTask = useCallback(
    (projectName: string, taskId: string) => {
      setProjects((prev) => {
        const project = prev[projectName];
        if (!project) return prev;
        return {
          ...prev,
          [projectName]: {
            ...project,
            tasks: project.tasks.filter((t) => t.id !== taskId),
          },
        };
      });
      markProjectDirty(projectName);
    },
    [markProjectDirty]
  );

  /* ── Clients ── */
  const setClientsAction = useCallback(
    (newClients: ClientData[]) => {
      setClients(newClients);
      markDirty("clients");
    },
    [markDirty]
  );

  const addClient = useCallback(
    (client: ClientData) => {
      setClients((prev) => [...prev, { ...client, createdAt: new Date().toISOString() }]);
      markDirty("clients");
    },
    [markDirty]
  );

  const updateClient = useCallback(
    (clientId: string, updates: Partial<ClientData>) => {
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, ...updates } : c))
      );
      markDirty("clients");
    },
    [markDirty]
  );

  const deleteClient = useCallback(
    (clientId: string) => {
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      markDirty("clients");
    },
    [markDirty]
  );

  /* ── Events ── */
  const setEventsAction = useCallback(
    (newEvents: CalendarEvent[]) => {
      setEvents(newEvents);
      markDirty("events");
    },
    [markDirty]
  );

  const addEvent = useCallback(
    (event: CalendarEvent) => {
      setEvents((prev) => [...prev, event]);
      markDirty("events");
    },
    [markDirty]
  );

  const updateEvent = useCallback(
    (eventId: string, updates: Partial<CalendarEvent>) => {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, ...updates } : e))
      );
      markDirty("events");
    },
    [markDirty]
  );

  const deleteEvent = useCallback(
    (eventId: string) => {
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      markDirty("events");
    },
    [markDirty]
  );

  /* ── Docs ── */
  const setDocsAction = useCallback(
    (newDocs: WorkspaceDoc[]) => {
      setDocs(newDocs);
      markDirty("docs");
    },
    [markDirty]
  );

  const addDoc = useCallback(
    (doc: WorkspaceDoc) => {
      setDocs((prev) => [...prev, doc]);
      markDirty("docs");
    },
    [markDirty]
  );

  const updateDoc = useCallback(
    (docId: string, updates: Partial<WorkspaceDoc>) => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, ...updates, updatedAt: new Date().toISOString() }
            : d
        )
      );
      markDirty("docs");
    },
    [markDirty]
  );

  const deleteDoc = useCallback(
    (docId: string) => {
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      markDirty("docs");
    },
    [markDirty]
  );

  const setDocFoldersAction = useCallback(
    (folders: DocFolder[]) => {
      setDocFolders(folders);
      markDirty("docs"); // Folders are saved alongside docs
    },
    [markDirty]
  );

  /* ── Team Members ── */
  const setTeamMembersAction = useCallback(
    (members: TeamMemberInfo[]) => {
      setTeamMembers(members);
      markDirty("teamMembers");
    },
    [markDirty]
  );

  const updateTeamMember = useCallback(
    (userId: string, updates: Partial<TeamMemberInfo>) => {
      setTeamMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, ...updates } : m))
      );
      markDirty("teamMembers");
    },
    [markDirty]
  );

  /* ── Sync auth profile → teamMembers (keep avatarUrl/displayName/color in sync) ── */
  useEffect(() => {
    if (!authProfile || !user || !initialLoadDoneRef.current) return;
    setTeamMembers((prev) => {
      const idx = prev.findIndex((m) => m.userId === user.id);
      const updates: Partial<TeamMemberInfo> = {
        displayName: authProfile.displayName,
        avatarUrl: authProfile.avatarUrl,
        avatarColor: authProfile.avatarColor,
        email: authProfile.email,
      };
      if (idx >= 0) {
        // Check if anything actually changed to avoid infinite loops
        const existing = prev[idx];
        const changed = Object.entries(updates).some(
          ([k, v]) => (existing as any)[k] !== v
        );
        if (!changed) return prev;
        const next = [...prev];
        next[idx] = { ...existing, ...updates };
        return next;
      } else {
        // Current user not in teamMembers yet — add them
        return [
          ...prev,
          {
            userId: user.id,
            displayName: authProfile.displayName,
            email: authProfile.email,
            avatarUrl: authProfile.avatarUrl,
            avatarColor: authProfile.avatarColor,
            role: authProfile.role,
          } as TeamMemberInfo,
        ];
      }
    });
    markDirty("teamMembers");
  }, [
    authProfile?.displayName,
    authProfile?.avatarUrl,
    authProfile?.avatarColor,
    authProfile?.email,
    user?.id,
  ]);

  /* ── Notifications ── */
  const setNotificationsAction = useCallback(
    (newNotifications: NotificationItem[]) => {
      setNotifications(newNotifications);
      markDirty("notifications");
    },
    [markDirty]
  );

  const markNotificationRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      markDirty("notifications");
    },
    [markDirty]
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markDirty("notifications");
  }, [markDirty]);

  const archiveNotification = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, archived: true } : n))
      );
      markDirty("notifications");
    },
    [markDirty]
  );

  const addNotification = useCallback(
    (notification: NotificationItem) => {
      setNotifications((prev) => [notification, ...prev]);
      markDirty("notifications");
    },
    [markDirty]
  );

  /* ── Starred ─ */
  const toggleStarred = useCallback(
    (id: string) => {
      setStarredArr((prev) => {
        const next = prev.includes(id)
          ? prev.filter((s) => s !== id)
          : [...prev, id];
        return next;
      });
      markDirty("starred");
    },
    [markDirty]
  );

  const isStarred = useCallback((id: string) => starred.has(id), [starred]);

  /* ── Today Tasks ── */
  const toggleToday = useCallback(
    (id: string) => {
      setTodayArr((prev) => {
        return prev.includes(id)
          ? prev.filter((t) => t !== id)
          : [...prev, id];
      });
      markDirty("todayTasks");
    },
    [markDirty]
  );

  const isToday = useCallback((id: string) => todayTaskIds.has(id), [todayTaskIds]);

  /* ── Time Blocks ── */
  const setTimeBlocksAction = useCallback(
    (blocks: TimeBlock[]) => {
      setTimeBlocks(blocks);
      markDirty("timeBlocks");
    },
    [markDirty]
  );

  const addTimeBlock = useCallback(
    (block: TimeBlock) => {
      setTimeBlocks((prev) => [...prev, block]);
      markDirty("timeBlocks");
    },
    [markDirty]
  );

  const updateTimeBlock = useCallback(
    (blockId: string, updates: Partial<TimeBlock>) => {
      setTimeBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
      );
      markDirty("timeBlocks");
    },
    [markDirty]
  );

  const deleteTimeBlock = useCallback(
    (blockId: string) => {
      setTimeBlocks((prev) => prev.filter((b) => b.id !== blockId));
      markDirty("timeBlocks");
    },
    [markDirty]
  );

  /* ── Week Settings ── */
  const setWeekSettingsAction = useCallback(
    (settings: WeekSettings) => {
      setWeekSettings(settings);
      markDirty("weekSettings");
    },
    [markDirty]
  );

  /* ── Spaces ── */
  const setSpacesAction = useCallback(
    (newSpaces: Space[]) => {
      setSpacesState(newSpaces);
      markDirty("spaces");
    },
    [markDirty]
  );

  const addSpaceAction = useCallback(
    (space: Space) => {
      setSpacesState((prev) => [...prev, space].sort((a, b) => a.order - b.order));
      markDirty("spaces");
    },
    [markDirty]
  );

  const updateSpaceAction = useCallback(
    (spaceId: string, updates: Partial<Space>) => {
      setSpacesState((prev) =>
        prev.map((s) => (s.id === spaceId ? { ...s, ...updates } : s))
      );
      markDirty("spaces");
    },
    [markDirty]
  );

  const deleteSpaceAction = useCallback(
    (spaceId: string) => {
      setSpacesState((prev) => prev.filter((s) => s.id !== spaceId));
      // Also clear spaceId from projects that referenced this space
      setProjects((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [name, proj] of Object.entries(next)) {
          if (proj.spaceId === spaceId) {
            next[name] = { ...proj, spaceId: undefined };
            changed = true;
            markProjectDirty(name);
          }
        }
        return changed ? next : prev;
      });
      // Clear spaceId from docs
      setDocs((prev) => {
        const updated = prev.map((d) =>
          d.spaceId === spaceId ? { ...d, spaceId: undefined } : d
        );
        if (updated.some((d, i) => d !== prev[i])) {
          markDirty("docs");
          return updated;
        }
        return prev;
      });
      markDirty("spaces");
    },
    [markDirty, markProjectDirty]
  );

  const toggleSpaceVisibility = useCallback(
    (spaceId: string) => {
      setSpacesState((prev) =>
        prev.map((s) => (s.id === spaceId ? { ...s, visible: !s.visible } : s))
      );
      markDirty("spaces");
    },
    [markDirty]
  );

  /* ── Force Save / Reload ── */
  const saveNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await performSave();
  }, [performSave]);

  const reload = useCallback(async () => {
    // Flush any pending dirty data to the server before reloading
    // to prevent losing in-memory changes.
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (
      dirtyFlagsRef.current.size > 0 ||
      dirtyProjectsRef.current.size > 0 ||
      deletedProjectsRef.current.size > 0
    ) {
      console.log("[Data] Flushing dirty data before explicit reload...");
      await performSave();
    }
    await loadData();
  }, [loadData, performSave]);

  const hasDirtyData =
    dirtyFlagsRef.current.size > 0 ||
    dirtyProjectsRef.current.size > 0 ||
    deletedProjectsRef.current.size > 0;

  /* ═══════════════════════════════════════════════════════════
     CONTEXT VALUE
     ═══════════════════════════════════════════════════════════ */

  const value: DataContextValue = {
    isLoading,
    isLoaded,
    loadError,

    projects,
    setProject,
    deleteProject,
    updateTask,
    addTask,
    deleteTask,

    clients,
    setClients: setClientsAction,
    addClient,
    updateClient,
    deleteClient,

    events,
    setEvents: setEventsAction,
    addEvent,
    updateEvent,
    deleteEvent,

    docs,
    setDocs: setDocsAction,
    addDoc,
    updateDoc,
    deleteDoc,
    docFolders,
    setDocFolders: setDocFoldersAction,

    teamMembers,
    setTeamMembers: setTeamMembersAction,
    updateTeamMember,

    notifications,
    setNotifications: setNotificationsAction,
    markNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
    addNotification,
    unreadCount,

    starred,
    toggleStarred,
    isStarred,

    todayTaskIds,
    toggleToday,
    isToday,

    timeBlocks,
    setTimeBlocks: setTimeBlocksAction,
    addTimeBlock,
    updateTimeBlock,
    deleteTimeBlock,

    weekSettings,
    setWeekSettings: setWeekSettingsAction,

    spaces,
    setSpaces: setSpacesAction,
    addSpace: addSpaceAction,
    updateSpace: updateSpaceAction,
    deleteSpace: deleteSpaceAction,
    toggleSpaceVisibility,
    visibleSpaceIds,
    isItemVisibleBySpace,

    saveNow,
    reload,
    hasDirtyData,
    lastSavedAt,
    isSaving,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

/* ═══════════════════════════════════════════════════════════
   HOOK
   ═══════════════════════════════════════════════════════════ */

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    // During HMR, return a safe fallback like useAuth does
    return {
      isLoading: true,
      isLoaded: false,
      loadError: null,

      projects: {},
      setProject: () => {},
      deleteProject: () => {},
      updateTask: () => {},
      addTask: () => {},
      deleteTask: () => {},

      clients: [],
      setClients: () => {},
      addClient: () => {},
      updateClient: () => {},
      deleteClient: () => {},

      events: [],
      setEvents: () => {},
      addEvent: () => {},
      updateEvent: () => {},
      deleteEvent: () => {},

      docs: [],
      setDocs: () => {},
      addDoc: () => {},
      updateDoc: () => {},
      deleteDoc: () => {},
      docFolders: [],
      setDocFolders: () => {},

      teamMembers: [],
      setTeamMembers: () => {},
      updateTeamMember: () => {},

      notifications: [],
      setNotifications: () => {},
      markNotificationRead: () => {},
      markAllNotificationsRead: () => {},
      archiveNotification: () => {},
      addNotification: () => {},
      unreadCount: 0,

      starred: new Set(),
      toggleStarred: () => {},
      isStarred: () => false,

      todayTaskIds: new Set(),
      toggleToday: () => {},
      isToday: () => false,

      timeBlocks: [],
      setTimeBlocks: () => {},
      addTimeBlock: () => {},
      updateTimeBlock: () => {},
      deleteTimeBlock: () => {},

      weekSettings: null,
      setWeekSettings: () => {},

      spaces: [],
      setSpaces: () => {},
      addSpace: () => {},
      updateSpace: () => {},
      deleteSpace: () => {},
      toggleSpaceVisibility: () => {},
      visibleSpaceIds: new Set(),
      isItemVisibleBySpace: () => true,

      saveNow: async () => {},
      reload: async () => {},
      hasDirtyData: false,
      lastSavedAt: null,
      isSaving: false,
    };
  }
  return ctx;
}

/* ═══════════════════════════════════════════════════════════
   DERIVED DATA HOOKS — Computed views over the data context
   ═══════════════════════════════════════════════════════════ */

/** Get all tasks across all projects, with project name attached (respects space visibility) */
export function useAllTasks(): (TaskItem & { projectName: string })[] {
  const visibleProjects = useVisibleProjects();
  const tasks: (TaskItem & { projectName: string })[] = [];
  for (const [name, project] of Object.entries(visibleProjects)) {
    for (const task of project.tasks || []) {
      tasks.push({ ...task, projectName: name });
    }
  }
  return tasks;
}

/** Get tasks due today or flagged as today */
export function useTodayTasks(): (TaskItem & { projectName: string })[] {
  const { todayTaskIds } = useData();
  const allTasks = useAllTasks();
  const today = new Date().toISOString().split("T")[0];

  return allTasks.filter((task) => {
    if (task.completed) return false;
    if (todayTaskIds.has(task.id)) return true;
    if (task.today) return true;
    // Check if due date is today
    if (task.date) {
      try {
        const d = new Date(task.date);
        if (d.toISOString().split("T")[0] === today) return true;
      } catch {
        // ignore parse errors
      }
    }
    return false;
  });
}

/** Get lineup tasks (flagged with task.lineup) */
export function useLineupTasks(): (TaskItem & { projectName: string })[] {
  const allTasks = useAllTasks();
  return allTasks.filter((task) => task.lineup && !task.completed);
}

/** Get upcoming tasks (tasks with future due dates, sorted) */
export function useUpcomingTasks(): (TaskItem & { projectName: string })[] {
  const allTasks = useAllTasks();
  const now = new Date();

  return allTasks
    .filter((task) => {
      if (task.completed) return false;
      if (!task.date) return false;
      try {
        return new Date(task.date) > now;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        return new Date(a.date!).getTime() - new Date(b.date!).getTime();
      } catch {
        return 0;
      }
    });
}

/** Get overdue tasks */
export function useOverdueTasks(): (TaskItem & { projectName: string })[] {
  const allTasks = useAllTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return allTasks.filter((task) => {
    if (task.completed) return false;
    if (!task.date) return false;
    try {
      const d = new Date(task.date);
      d.setHours(0, 0, 0, 0);
      return d < today;
    } catch {
      return false;
    }
  });
}

/** Get a single project by name */
export function useProject(name: string): ProjectData | null {
  const { projects } = useData();
  return projects[name] ?? null;
}

/** Get project names as a sorted array */
export function useProjectNames(): string[] {
  const { projects } = useData();
  return Object.keys(projects).sort((a, b) => a.localeCompare(b));
}

/** Get starred project names (respects space visibility) */
export function useStarredProjects(): string[] {
  const { starred } = useData();
  const visibleProjects = useVisibleProjects();
  return Object.keys(visibleProjects).filter((name) => starred.has(name));
}

/** Get workspace docs flagged for Today (respects space visibility) */
export function useTodayDocs(): WorkspaceDoc[] {
  const { docs, isItemVisibleBySpace } = useData();
  return docs.filter((d) => d.today && isItemVisibleBySpace(d.spaceId));
}

/** Get workspace docs flagged for Lineup (respects space visibility) */
export function useLineupDocs(): WorkspaceDoc[] {
  const { docs, isItemVisibleBySpace } = useData();
  return docs.filter((d) => d.lineup && isItemVisibleBySpace(d.spaceId));
}

/* ═══════════════════════════════════════════════════════════
   SPACE-FILTERED HOOKS — Pre-filtered by visible spaces
   ═══════════════════════════════════════════════════════════ */

/** Get projects filtered by visible spaces */
export function useVisibleProjects(): Record<string, ProjectData> {
  const { projects, isItemVisibleBySpace } = useData();
  const result: Record<string, ProjectData> = {};
  for (const [name, proj] of Object.entries(projects)) {
    if (isItemVisibleBySpace(proj.spaceId)) {
      result[name] = proj;
    }
  }
  return result;
}

/** Get visible project names as a sorted array */
export function useVisibleProjectNames(): string[] {
  const visible = useVisibleProjects();
  return Object.keys(visible).sort((a, b) => a.localeCompare(b));
}

/** Get docs filtered by visible spaces */
export function useVisibleDocs(): WorkspaceDoc[] {
  const { docs, isItemVisibleBySpace } = useData();
  return docs.filter((d) => isItemVisibleBySpace(d.spaceId));
}

/** Get all tasks filtered by visible spaces */
export function useVisibleTasks(): (TaskItem & { projectName: string })[] {
  const { isItemVisibleBySpace } = useData();
  const visibleProjects = useVisibleProjects();
  const tasks: (TaskItem & { projectName: string })[] = [];
  for (const [name, project] of Object.entries(visibleProjects)) {
    for (const task of project.tasks || []) {
      tasks.push({ ...task, projectName: name });
    }
  }
  return tasks;
}