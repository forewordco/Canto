/* ═══════════════════════════════════════════════════════════
   NOTIFICATION POLLING — Client-side polling with exponential
   backoff, Web Notification API integration, and unread badge.

   Phase 9 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useEffect, useRef, useCallback, useState } from "react";
import { api } from "./api";
import { waitForServer } from "./api";
import { useAuth } from "./auth";
import { useData } from "./data";
import type { NotificationItem, NotificationType } from "./types";

/* ─── Constants ─── */

const BASE_POLL_INTERVAL = 30_000; // 30 seconds
const MAX_POLL_INTERVAL = 120_000; // 2 minutes
const BACKOFF_MULTIPLIER = 2;

/* ─── Notification Type Metadata ─── */

export interface NotifTypeInfo {
  icon: string; // emoji fallback for desktop notifications
  label: string;
  color: string;
}

export const NOTIF_TYPE_INFO: Record<NotificationType, NotifTypeInfo> = {
  mention: { icon: "@", label: "Mentioned you", color: "oklch(0.55 0.2 280)" },
  task_assigned: { icon: "👤", label: "Assigned to you", color: "oklch(0.55 0.2 280)" },
  task_unassigned: { icon: "👤", label: "Unassigned from task", color: "oklch(0.65 0.015 260)" },
  task_completed: { icon: "✓", label: "Task completed", color: "oklch(0.65 0.15 180)" },
  comment: { icon: "💬", label: "New comment", color: "oklch(0.55 0.2 280)" },
  status_update: { icon: "📊", label: "Status updated", color: "oklch(0.85 0.15 85)" },
  project_shared: { icon: "📁", label: "Project shared", color: "oklch(0.65 0.18 320)" },
  due_date_changed: { icon: "📅", label: "Due date changed", color: "oklch(0.85 0.15 85)" },
  status_changed: { icon: "🔄", label: "Status changed", color: "oklch(0.85 0.15 85)" },
  subtask_completed: { icon: "✓", label: "Subtask completed", color: "oklch(0.65 0.15 180)" },
  task_added: { icon: "➕", label: "Task added", color: "oklch(0.55 0.2 280)" },
  collaborator_added: { icon: "👥", label: "Collaborator added", color: "oklch(0.65 0.18 320)" },
  task_liked: { icon: "❤️", label: "Task liked", color: "oklch(0.7 0.18 25)" },
  task_description_changed: { icon: "📝", label: "Description updated", color: "oklch(0.65 0.015 260)" },
  attachment_added: { icon: "📎", label: "Attachment added", color: "oklch(0.65 0.015 260)" },
};

/* ─── Desktop Notification Permission ─── */

export function useDesktopNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as NotificationPermission;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return "denied" as NotificationPermission;
    }
  }, []);

  return { permission, requestPermission };
}

function showDesktopNotification(notif: NotificationItem) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  try {
    const typeInfo = NOTIF_TYPE_INFO[notif.type] || { icon: "🔔", label: "Notification" };
    const n = new Notification(notif.title, {
      body: notif.message || typeInfo.label,
      icon: undefined, // Canto icon could go here
      tag: notif.id, // Prevents duplicate notifications
      silent: false,
    });

    // Auto-close after 5s
    setTimeout(() => n.close(), 5000);
  } catch (err) {
    console.warn("[Notifications] Desktop notification error:", err);
  }
}

/* ─── Send Notification Helper ─── */

export interface SendNotifPayload {
  targetUserId: string;
  type: NotificationType;
  title: string;
  message?: string;
  fromUserName?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
}

export async function sendNotification(payload: SendNotifPayload): Promise<boolean> {
  try {
    const { error } = await api.post("/notifications/send", payload);
    if (error) {
      console.error(`[Notifications] Send failed: ${error}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Notifications] Send error:`, err);
    return false;
  }
}

export async function sendBulkNotifications(
  notifications: SendNotifPayload[]
): Promise<boolean> {
  if (notifications.length === 0) return true;
  try {
    const { error } = await api.post("/notifications/send-bulk", { notifications });
    if (error) {
      console.error(`[Notifications] Bulk send failed: ${error}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Notifications] Bulk send error:`, err);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════
   POLLING HOOK
   ═══════════════════════════════════════════════════════════ */

interface PollResponse {
  unreadCount: number;
  newItems: NotificationItem[];
  total: number;
}

export function useNotificationPolling() {
  const { authState, isDevMode } = useAuth();
  const { addNotification, setNotifications } = useData();
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalRef = useRef(BASE_POLL_INTERVAL);
  const lastPollTimeRef = useRef<string | null>(null);
  const consecutiveFailsRef = useRef(0);
  const mountedRef = useRef(true);
  const [polledUnreadCount, setPolledUnreadCount] = useState<number | null>(null);

  const poll = useCallback(async () => {
    if (!mountedRef.current) return;
    if (isDevMode) return;

    try {
      const since = lastPollTimeRef.current || "";
      const { data, error } = await api.get<PollResponse>(
        `/notifications/poll${since ? `?since=${encodeURIComponent(since)}` : ""}`
      );

      if (!mountedRef.current) return; // Component unmounted during fetch

      if (error) {
        // Silently ignore abort/signal errors — they happen naturally during
        // component unmount or when the page is backgrounded
        const lowerError = error.toLowerCase();
        if (lowerError.includes("abort") || lowerError.includes("signal") || lowerError.includes("failed to fetch")) {
          // Backoff on network errors but don't spam console
          consecutiveFailsRef.current++;
          currentIntervalRef.current = Math.min(
            BASE_POLL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, consecutiveFailsRef.current),
            MAX_POLL_INTERVAL
          );
          return;
        }
        console.warn(`[Notifications] Poll error: ${error}`);
        consecutiveFailsRef.current++;
        // Exponential backoff on failure
        currentIntervalRef.current = Math.min(
          BASE_POLL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, consecutiveFailsRef.current),
          MAX_POLL_INTERVAL
        );
        return;
      }

      // Reset backoff on success
      consecutiveFailsRef.current = 0;
      currentIntervalRef.current = BASE_POLL_INTERVAL;

      if (data) {
        setPolledUnreadCount(data.unreadCount);

        // Show desktop notifications for truly new items
        if (data.newItems && data.newItems.length > 0 && lastPollTimeRef.current) {
          for (const item of data.newItems) {
            addNotification(item);
            showDesktopNotification(item);
          }
        }
      }

      lastPollTimeRef.current = new Date().toISOString();
    } catch (err) {
      // Silently ignore abort errors
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof TypeError && err.message.toLowerCase().includes("abort")) return;
      if (!mountedRef.current) return;
      console.warn(`[Notifications] Poll exception:`, err);
      consecutiveFailsRef.current++;
      currentIntervalRef.current = Math.min(
        BASE_POLL_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, consecutiveFailsRef.current),
        MAX_POLL_INTERVAL
      );
    }
  }, [isDevMode, addNotification]);

  const schedulePoll = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }
    intervalRef.current = setTimeout(() => {
      poll().finally(() => {
        if (mountedRef.current) {
          schedulePoll();
        }
      });
    }, currentIntervalRef.current);
  }, [poll]);

  useEffect(() => {
    mountedRef.current = true;

    if (authState === "authenticated" && !isDevMode) {
      // Wait for server readiness, then start polling
      const initTimer = setTimeout(async () => {
        if (!mountedRef.current) return;
        try {
          await waitForServer();
        } catch {
          // Proceed anyway
        }
        if (!mountedRef.current) return;
        // Additional grace period after server ready for data layer to settle
        await new Promise(r => setTimeout(r, 2000));
        if (!mountedRef.current) return;
        lastPollTimeRef.current = new Date().toISOString();
        poll().then(() => {
          if (mountedRef.current) schedulePoll();
        });
      }, 8000); // Wait 8s after auth before first poll (was 5s)

      return () => {
        clearTimeout(initTimer);
        mountedRef.current = false;
        if (intervalRef.current) {
          clearTimeout(intervalRef.current);
        }
      };
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [authState, isDevMode, poll, schedulePoll]);

  return { polledUnreadCount };
}

/* ─── Date Formatting for Inbox ─── */

export function formatNotifTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function getNotifDateGroup(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const notifDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.floor((today.getTime() - notifDate.getTime()) / 86400000);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "This Week";
    if (diffDays < 30) return "This Month";
    return "Older";
  } catch {
    return "Older";
  }
}