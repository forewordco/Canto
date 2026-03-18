/* ═══════════════════════════════════════════════════════════
   KV STORE CLIENT — Client-side API for the server KV store.
   The actual KV table lives in Supabase; these functions
   call the Hono edge function which wraps kv_store operations.
   ═══════════════════════════════════════════════════════════ */

import { api } from "./api";

/* ─── Key Schema Documentation ─── */
/*
  Per-project:       project:shared:<projectName>
  (migrated from:    projects:shared bulk key, projects:<userId>)

  Shared workspace:  clients:shared
                     events:shared
                     docs:shared

  Per-user:          starred:<userId>
                     profile:<userId>
                     today:<userId>
                     timeblocks:<userId>
                     weekSettings:<userId>
                     notifications:<userId>

  Team:              team-member:<userId>
                     team-member:asana-<email>  (Asana placeholders)

  Integrations:      gcal-tokens:<userId>
                     gcal-settings:<userId>
                     gmail-tokens:<userId>
                     gmail-synced:<userId>
                     frameio-token:<userId>
                     asana-pat:<userId>
                     craft-token:<userId>

  Publishing:        published:<slug>
                     publish-map:<type>:<id>

  Invites:           invite:<email>

  Push subs:         push-sub:<userId>
*/

/* ─── KV API Methods ─── */

/** Get a single value by key */
export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const { data, error } = await api.get<{ value: T }>(`/kv/${encodeURIComponent(key)}`);
  if (error || !data) return null;
  return data.value;
}

/** Set a single key-value pair */
export async function kvSet<T = unknown>(key: string, value: T): Promise<boolean> {
  const { error } = await api.post("/kv", { key, value });
  return !error;
}

/** Delete a single key */
export async function kvDel(key: string): Promise<boolean> {
  const { error } = await api.del(`/kv/${encodeURIComponent(key)}`);
  return !error;
}

/** Get multiple values by keys */
export async function kvMget<T = unknown>(keys: string[]): Promise<Record<string, T>> {
  const { data, error } = await api.post<Record<string, T>>("/kv/mget", { keys });
  if (error || !data) return {};
  return data;
}

/** Delete multiple keys */
export async function kvMdel(keys: string[]): Promise<boolean> {
  const { error } = await api.post("/kv/mdel", { keys });
  return !error;
}

/** Set multiple key-value pairs */
export async function kvMset(entries: { key: string; value: unknown }[]): Promise<boolean> {
  const { error } = await api.post("/kv/mset", { entries });
  return !error;
}

/** Get all values matching a key prefix */
export async function kvGetByPrefix<T = unknown>(prefix: string): Promise<Record<string, T>> {
  const { data, error } = await api.get<Record<string, T>>(
    `/kv/prefix/${encodeURIComponent(prefix)}`
  );
  if (error || !data) return {};
  return data;
}

/* ─── Typed Helpers for Common Operations ─── */

import type {
  ProjectData,
  ClientData,
  CalendarEvent,
  ProfileData,
  TeamMemberInfo,
  NotificationItem,
  TimeBlock,
  WeekSettings,
  WorkspaceDoc,
} from "./types";

/** Load a single project */
export async function loadProject(projectName: string): Promise<ProjectData | null> {
  return kvGet<ProjectData>(`project:shared:${projectName}`);
}

/** Save a single project */
export async function saveProject(projectName: string, data: ProjectData): Promise<boolean> {
  return kvSet(`project:shared:${projectName}`, data);
}

/** Load all projects (by prefix scan) */
export async function loadAllProjects(): Promise<Record<string, ProjectData>> {
  return kvGetByPrefix<ProjectData>("project:shared:");
}

/** Load shared clients */
export async function loadClients(): Promise<ClientData[]> {
  const data = await kvGet<ClientData[]>("clients:shared");
  return data || [];
}

/** Save shared clients */
export async function saveClients(clients: ClientData[]): Promise<boolean> {
  return kvSet("clients:shared", clients);
}

/** Load calendar events */
export async function loadEvents(): Promise<CalendarEvent[]> {
  const data = await kvGet<CalendarEvent[]>("events:shared");
  return data || [];
}

/** Load user profile */
export async function loadProfile(userId: string): Promise<ProfileData | null> {
  return kvGet<ProfileData>(`profile:${userId}`);
}

/** Save user profile */
export async function saveProfile(userId: string, profile: ProfileData): Promise<boolean> {
  return kvSet(`profile:${userId}`, profile);
}

/** Load team members (by prefix scan) */
export async function loadTeamMembers(): Promise<TeamMemberInfo[]> {
  const data = await kvGetByPrefix<TeamMemberInfo>("team-member:");
  return Object.values(data);
}

/** Load user notifications */
export async function loadNotifications(userId: string): Promise<NotificationItem[]> {
  const data = await kvGet<NotificationItem[]>(`notifications:${userId}`);
  return data || [];
}

/** Load user time blocks */
export async function loadTimeBlocks(userId: string): Promise<TimeBlock[]> {
  const data = await kvGet<TimeBlock[]>(`timeblocks:${userId}`);
  return data || [];
}

/** Load user week settings */
export async function loadWeekSettings(userId: string): Promise<WeekSettings | null> {
  return kvGet<WeekSettings>(`weekSettings:${userId}`);
}

/** Load workspace docs */
export async function loadDocs(): Promise<WorkspaceDoc[]> {
  const data = await kvGet<WorkspaceDoc[]>("docs:shared");
  return data || [];
}

/** Load user starred items */
export async function loadStarred(userId: string): Promise<string[]> {
  const data = await kvGet<string[]>(`starred:${userId}`);
  return data || [];
}

/** Load user today task IDs */
export async function loadTodayTasks(userId: string): Promise<string[]> {
  const data = await kvGet<string[]>(`today:${userId}`);
  return data || [];
}