/* ═══════════════════════════════════════════════════════════
   INTEGRATIONS CLIENT — Frontend API client for external
   service connections. Phase 12 of Canto build plan.
   
   P12-1: Google Calendar
   P12-2: Gmail
   P12-3: Frame.io
   P12-4: Asana Import
   P12-6: Craft Import
   ═══════════════════════════════════════════════════════════ */

import { api } from "./api";

/* ─── Types ─── */

export interface IntegrationStatus {
  google: {
    connected: boolean;
    hasClientCredentials: boolean;
    scopes: string[];
    email: string | null;
  };
  frameio: {
    connected: boolean;
    accountName: string | null;
  };
  asana: {
    connected: boolean;
    userName: string | null;
    workspaceName: string | null;
  };
  craft: {
    connected: boolean;
  };
}

export interface GCalCalendar {
  id: string;
  summary: string;
  description: string;
  primary: boolean;
  backgroundColor: string;
  accessRole: string;
  selected: boolean;
}

export interface GCalEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  isAllDay: boolean;
  attendees: string[];
  htmlLink: string;
  status: string;
  calendarId: string;
}

export interface GmailEmail {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc: string;
  date: string;
  snippet: string;
  labelIds: string[];
}

export interface GmailTaskExtraction {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string | null;
  tags: string[];
  gmailMessageId: string;
  gmailThreadId: string;
  gmailFrom: string;
  gmailDate: string;
  gmailSubject: string;
}

export interface FrameIoTeam {
  id: string;
  name: string;
  memberCount: number;
}

export interface FrameIoProject {
  id: string;
  name: string;
  insertedAt: string;
  itemCount: number;
}

export interface FrameIoAsset {
  id: string;
  name: string;
  type: "file" | "folder" | "version_stack";
  label: string;
  itemCount: number;
  fileSize: number;
  thumbnailUrl: string;
  insertedAt: string;
  commentCount: number;
}

export interface FrameIoComment {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  insertedAt: string;
  completed: boolean;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  isOrganization: boolean;
}

export interface AsanaProject {
  gid: string;
  name: string;
  color: string;
  icon: string;
  archived: boolean;
  statusType: string;
  statusTitle: string;
}

export interface AsanaImportResult {
  project: {
    name: string;
    description: string;
    status: string;
    tasks: any[];
    members: { name: string; email: string }[] | string[];
    sections: string[];
    importSource: string;
    importedAt: string;
    asanaProjectGid: string;
    asanaColor: string;
    asanaIcon: string;
    stats: AsanaImportStats;
  };
}

export interface AsanaImportStats {
  tasks: number;
  subtasks: number;
  comments: number;
  attachments: number;
  dependencies: number;
  sections: number;
  members: number;
}

export interface AsanaProjectPreview {
  gid: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
  modifiedAt: string;
  statusType: string;
  statusTitle: string;
  totalTasks: number;
  sections: { gid: string; name: string; taskCount: number }[];
  members: { name: string; email: string }[];
  customFields: { name: string; type: string }[];
}

export interface AsanaDeepImportOptions {
  includeComments: boolean;
  includeAttachments: boolean;
  includeDependencies: boolean;
  includeCustomFields: boolean;
}

export interface AsanaBatchImportResult {
  projects: AsanaImportResult["project"][];
  errors: { gid: string; error: string }[];
  total: number;
}

/* ═══════════════════════════════════════════════════════════
   STATUS & DISCONNECT
   ═══════════════════════════════════════════════════════════ */

export async function getIntegrationStatus(): Promise<IntegrationStatus | null> {
  const { data, error } = await api.get<IntegrationStatus>("/integrations/status");
  if (error) {
    console.error("[Integrations] Status check failed:", error);
    return null;
  }
  return data;
}

export async function disconnectIntegration(service: string): Promise<boolean> {
  const { error } = await api.post("/integrations/disconnect", { service });
  if (error) {
    console.error(`[Integrations] Disconnect ${service} failed:`, error);
    return false;
  }
  return true;
}

/* ═══════════════════════════════════════════════════════════
   GOOGLE OAUTH (shared for GCal & Gmail)
   ═══════════════════════════════════════════════════════════ */

export async function getGoogleAuthUrl(type: "gcal" | "gmail" = "gcal"): Promise<{ authUrl: string; state: string } | null> {
  const { data, error } = await api.get<{ authUrl: string; state: string }>(
    `/integrations/google/auth-url?type=${type}`
  );
  if (error) {
    console.error("[Google] Auth URL failed:", error);
    return null;
  }
  return data;
}

/** Open Google OAuth popup and listen for callback */
export function openGoogleOAuthPopup(
  authUrl: string,
  onSuccess: (data: any) => void,
  onError: (error: string) => void
): void {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    authUrl,
    "google-oauth",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;

    const { type, success, error, email } = event.data || {};
    if (type === "oauth-callback-gcal" || type === "oauth-callback-gmail") {
      window.removeEventListener("message", handleMessage);
      if (success) {
        onSuccess({ email, type: type.replace("oauth-callback-", "") });
      } else {
        onError(error || "OAuth callback failed");
      }
    }
    if (type === "oauth-error") {
      window.removeEventListener("message", handleMessage);
      onError(event.data.error || "OAuth error");
    }
  };

  window.addEventListener("message", handleMessage);

  // Poll for popup closure
  const interval = setInterval(() => {
    if (popup?.closed) {
      clearInterval(interval);
      // Give a brief delay for message handling
      setTimeout(() => {
        window.removeEventListener("message", handleMessage);
      }, 1000);
    }
  }, 500);
}

/* ═══════════════════════════════════════════════════════════
   GOOGLE CALENDAR (P12-1)
   ═══════════════════════════════════════════════════════════ */

export async function getGCalCalendars(): Promise<GCalCalendar[]> {
  const { data, error } = await api.get<{ calendars: GCalCalendar[] }>("/integrations/gcal/calendars");
  if (error) {
    console.error("[GCal] Calendar list failed:", error);
    return [];
  }
  return data?.calendars || [];
}

export async function getGCalEvents(params: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
}): Promise<GCalEvent[]> {
  const queryParams = new URLSearchParams();
  if (params.calendarId) queryParams.set("calendarId", params.calendarId);
  if (params.timeMin) queryParams.set("timeMin", params.timeMin);
  if (params.timeMax) queryParams.set("timeMax", params.timeMax);

  const { data, error } = await api.get<{ events: GCalEvent[] }>(
    `/integrations/gcal/events?${queryParams.toString()}`
  );
  if (error) {
    console.error("[GCal] Events fetch failed:", error);
    return [];
  }
  return data?.events || [];
}

export async function createGCalEvent(event: {
  calendarId?: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
}): Promise<{ id: string; htmlLink: string } | null> {
  const { data, error } = await api.post<{ id: string; htmlLink: string }>(
    "/integrations/gcal/events",
    event
  );
  if (error) {
    console.error("[GCal] Create event failed:", error);
    return null;
  }
  return data;
}

export async function syncGCalEvents(params: {
  calendarIds?: string[];
  daysAhead?: number;
}): Promise<{ events: any[]; syncedAt: string } | null> {
  const { data, error } = await api.post<{ events: any[]; syncedAt: string }>(
    "/integrations/gcal/sync",
    params,
    { timeout: 30000 }
  );
  if (error) {
    console.error("[GCal] Sync failed:", error);
    return null;
  }
  return data;
}

/* ═══════════════════════════════════════════════════════════
   GMAIL (P12-2)
   ═══════════════════════════════════════════════════════════ */

export async function getGmailStarred(maxResults = 20): Promise<GmailEmail[]> {
  const { data, error } = await api.get<{ emails: GmailEmail[] }>(
    `/integrations/gmail/starred?maxResults=${maxResults}`
  );
  if (error) {
    console.error("[Gmail] Starred fetch failed:", error);
    return [];
  }
  return data?.emails || [];
}

export async function extractTaskFromEmail(email: {
  subject: string;
  from: string;
  snippet: string;
  date: string;
  threadId: string;
  messageId: string;
}): Promise<GmailTaskExtraction | null> {
  const { data, error } = await api.post<GmailTaskExtraction>(
    "/integrations/gmail/email-to-task",
    email,
    { timeout: 20000 }
  );
  if (error) {
    console.error("[Gmail] Email-to-task failed:", error);
    return null;
  }
  return data;
}

export async function unstarEmail(messageId: string): Promise<boolean> {
  const { error } = await api.post("/integrations/gmail/unstar", { messageId });
  if (error) {
    console.error("[Gmail] Unstar failed:", error);
    return false;
  }
  return true;
}

/* ═══════════════════════════════════════════════════════════
   FRAME.IO (P12-3)
   ═══════════════════════════════════════════════════════════ */

export async function connectFrameIo(token: string): Promise<{ accountName: string } | null> {
  const { data, error } = await api.post<{ success: boolean; accountName: string }>(
    "/integrations/frameio/connect",
    { token }
  );
  if (error) {
    console.error("[Frame.io] Connect failed:", error);
    return null;
  }
  return data ? { accountName: data.accountName } : null;
}

export async function getFrameIoTeams(): Promise<FrameIoTeam[]> {
  const { data, error } = await api.get<{ teams: FrameIoTeam[] }>("/integrations/frameio/teams");
  if (error) {
    console.error("[Frame.io] Teams failed:", error);
    return [];
  }
  return data?.teams || [];
}

export async function getFrameIoProjects(teamId: string): Promise<FrameIoProject[]> {
  const { data, error } = await api.get<{ projects: FrameIoProject[] }>(
    `/integrations/frameio/projects?teamId=${teamId}`
  );
  if (error) {
    console.error("[Frame.io] Projects failed:", error);
    return [];
  }
  return data?.projects || [];
}

export async function getFrameIoAssets(params: {
  projectId?: string;
  assetId?: string;
}): Promise<FrameIoAsset[]> {
  const qp = new URLSearchParams();
  if (params.projectId) qp.set("projectId", params.projectId);
  if (params.assetId) qp.set("assetId", params.assetId);

  const { data, error } = await api.get<{ assets: FrameIoAsset[] }>(
    `/integrations/frameio/assets?${qp.toString()}`
  );
  if (error) {
    console.error("[Frame.io] Assets failed:", error);
    return [];
  }
  return data?.assets || [];
}

export async function getFrameIoComments(assetId: string): Promise<FrameIoComment[]> {
  const { data, error } = await api.get<{ comments: FrameIoComment[] }>(
    `/integrations/frameio/comments?assetId=${assetId}`
  );
  if (error) {
    console.error("[Frame.io] Comments failed:", error);
    return [];
  }
  return data?.comments || [];
}

/* ═══════════════════════════════════════════════════════════
   ASANA IMPORT (P12-4)
   ═══════════════════════════════════════════════════════════ */

export async function connectAsana(token: string): Promise<{ userName: string; email: string } | null> {
  const { data, error } = await api.post<{ success: boolean; userName: string; email: string }>(
    "/integrations/asana/connect",
    { token }
  );
  if (error) {
    console.error("[Asana] Connect failed:", error);
    return null;
  }
  return data ? { userName: data.userName, email: data.email } : null;
}

export async function getAsanaWorkspaces(): Promise<AsanaWorkspace[]> {
  const { data, error } = await api.get<{ workspaces: AsanaWorkspace[] }>("/integrations/asana/workspaces");
  if (error) {
    console.error("[Asana] Workspaces failed:", error);
    return [];
  }
  return data?.workspaces || [];
}

export async function getAsanaProjects(workspaceGid: string): Promise<AsanaProject[]> {
  const { data, error } = await api.get<{ projects: AsanaProject[] }>(
    `/integrations/asana/projects?workspaceGid=${workspaceGid}`
  );
  if (error) {
    console.error("[Asana] Projects failed:", error);
    return [];
  }
  return data?.projects || [];
}

export async function importAsanaProject(projectGid: string, workspaceName?: string): Promise<AsanaImportResult | null> {
  const { data, error } = await api.post<AsanaImportResult>(
    "/integrations/asana/import",
    { projectGid, workspaceName },
    { timeout: 60000 }
  );
  if (error) {
    console.error("[Asana] Import failed:", error);
    return null;
  }
  return data;
}

export async function getAsanaProjectPreview(projectGid: string): Promise<AsanaProjectPreview | null> {
  const { data, error } = await api.get<{ preview: AsanaProjectPreview }>(
    `/integrations/asana/project-preview?projectGid=${projectGid}`
  );
  if (error) {
    console.error("[Asana] Project preview failed:", error);
    return null;
  }
  return data?.preview || null;
}

export async function deepImportAsanaProject(
  projectGid: string,
  options: AsanaDeepImportOptions
): Promise<AsanaImportResult | null> {
  const { data, error } = await api.post<AsanaImportResult>(
    "/integrations/asana/deep-import",
    { projectGid, options },
    { timeout: 120000 }
  );
  if (error) {
    console.error("[Asana] Deep import failed:", error);
    return null;
  }
  return data;
}

export async function batchImportAsanaProjects(
  projectGids: string[],
  options: AsanaDeepImportOptions
): Promise<AsanaBatchImportResult | null> {
  const { data, error } = await api.post<AsanaBatchImportResult>(
    "/integrations/asana/batch-import",
    { projectGids, options },
    { timeout: 300000 }
  );
  if (error) {
    console.error("[Asana] Batch import failed:", error);
    return null;
  }
  return data;
}

/* ═══════════════════════════════════════════════════════════
   CRAFT IMPORT (P12-6)
   ═══════════════════════════════════════════════════════════ */

export async function importCraftMarkdown(params: {
  markdown: string;
  title?: string;
  sourceName?: string;
}): Promise<any | null> {
  const { data, error } = await api.post<{ doc: any }>(
    "/integrations/craft/import-markdown",
    params,
    { timeout: 15000 }
  );
  if (error) {
    console.error("[Craft] Markdown import failed:", error);
    return null;
  }
  return data?.doc || null;
}

export async function importCraftJson(documents: any[]): Promise<any[] | null> {
  const { data, error } = await api.post<{ docs: any[] }>(
    "/integrations/craft/import-json",
    { documents },
    { timeout: 30000 }
  );
  if (error) {
    console.error("[Craft] JSON import failed:", error);
    return null;
  }
  return data?.docs || null;
}