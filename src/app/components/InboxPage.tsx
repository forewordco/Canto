/* ═══════════════════════════════════════════════════════════
   INBOX PAGE — Notification list with full functionality.

   Features:
   - Grouped by date (Today, Yesterday, This Week, Older)
   - Filter tabs: All, Unread, Archived
   - Mark read / mark all read
   - Archive / archive all
   - Click to navigate to relevant task/project
   - Notification type icons with color coding
   - Desktop notification permission request
   - Empty states per filter
   - Mobile-optimized layout

   Phase 9 of Canto build plan.
   Updated: force recompile
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCircle,
  Checks,
  Archive,
  Eye,
  X,
  SquareHalf,
  ChatText,
  At,
  UserCircle,
  CalendarBlank,
  Paperclip,
  Heart,
  PencilSimple,
  Plus,
  UserPlus,
  ArrowsClockwise,
  CircleHalf,
  Desktop,
  BellSimple,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { useGlobalTaskDetail } from "./GlobalTaskDetail";
import {
  NOTIF_TYPE_INFO,
  formatNotifTime,
  getNotifDateGroup,
  useDesktopNotificationPermission,
} from "../lib/notifications";
import type { NotificationItem, NotificationType } from "../lib/types";
import { ListToolbar } from "./ListToolbar";

/* ─── Filter Types ─── */

type InboxFilter = "all" | "unread" | "archived";

/* ─── Notification Type Icons ─── */

function NotifTypeIcon({
  type,
  size = 18,
}: {
  type: NotificationType;
  size?: number;
}) {
  const info = NOTIF_TYPE_INFO[type];
  const color = info?.color || "oklch(0.65 0.015 260)";

  const iconMap: Record<string, React.ElementType> = {
    mention: At,
    task_assigned: UserCircle,
    task_unassigned: UserCircle,
    task_completed: CheckCircle,
    comment: ChatText,
    status_update: ArrowsClockwise,
    project_shared: SquareHalf,
    due_date_changed: CalendarBlank,
    status_changed: CircleHalf,
    subtask_completed: Check,
    task_added: Plus,
    collaborator_added: UserPlus,
    task_liked: Heart,
    task_description_changed: PencilSimple,
    attachment_added: Paperclip,
  };

  const Icon = iconMap[type] || Bell;

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
      style={{ background: `${color}15` }}
    >
      <Icon size={size} style={{ color }} weight="bold" />
    </div>
  );
}

/* ─── Notification Row ─── */

function NotificationRow({
  notif,
  onMarkRead,
  onArchive,
  onNavigate,
}: {
  notif: NotificationItem;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onNavigate: (notif: NotificationItem) => void;
}) {
  const typeInfo = NOTIF_TYPE_INFO[notif.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -60, height: 0 }}
      className="group relative"
    >
      <button
        onClick={() => onNavigate(notif)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-[8px]"
        style={{
          background: notif.read ? "transparent" : "oklch(0.55 0.2 280 / 0.03)",
        }}
      >
        {/* Unread dot */}
        {!notif.read && (
          <div
            className="absolute left-1 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full"
            style={{ background: "oklch(0.55 0.2 280)" }}
          />
        )}

        {/* Type icon */}
        <NotifTypeIcon type={notif.type} />

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-[13px] leading-snug"
              style={{
                color: notif.read
                  ? "var(--text-secondary)"
                  : "var(--text-primary)",
                fontWeight: notif.read ? 400 : 500,
              }}
            >
              {notif.title}
            </p>
            <span
              className="text-[11px] shrink-0 mt-0.5"
              style={{ color: "var(--text-quaternary)" }}
            >
              {formatNotifTime(notif.createdAt)}
            </span>
          </div>

          {notif.message && (
            <p
              className="text-[12px] mt-0.5 line-clamp-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              {notif.message}
            </p>
          )}

          {/* Meta: project + task info */}
          <div className="flex items-center gap-2 mt-1">
            {notif.projectName && (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: "var(--text-quaternary)" }}
              >
                <SquareHalf size={11} />
                {notif.projectName}
              </span>
            )}
            {notif.taskTitle && (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: "var(--text-quaternary)" }}
              >
                <Check size={11} />
                {notif.taskTitle}
              </span>
            )}
            {notif.fromUserName && (
              <span
                className="text-[11px]"
                style={{ color: "var(--text-quaternary)" }}
              >
                from {notif.fromUserName}
              </span>
            )}
          </div>
        </div>
      </button>

      {/* Hover actions */}
      <div
        className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "var(--surface-bg)" }}
      >
        {!notif.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notif.id);
            }}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.05]"
            style={{ color: "var(--text-tertiary)" }}
            title="Mark as read"
          >
            <Eye size={14} />
          </button>
        )}
        {!notif.archived && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive(notif.id);
            }}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.05]"
            style={{ color: "var(--text-tertiary)" }}
            title="Archive"
          >
            <Archive size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INBOX PAGE — Main Export
   ═══════════════════════════════════════════════════════════ */

export function InboxPage() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    archiveNotification,
    unreadCount,
    loadError,
    reload,
  } = useData();
  const { navigate } = useNavigation();
  const { openTaskDetail } = useGlobalTaskDetail();
  const { permission, requestPermission } = useDesktopNotificationPermission();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [inboxSearch, setInboxSearch] = useState("");
  const [showPermBanner, setShowPermBanner] = useState(
    typeof Notification !== "undefined" && Notification.permission === "default"
  );

  // Filter notifications
  const filteredNotifs = useMemo(() => {
    let list = [...notifications];
    switch (filter) {
      case "unread":
        list = list.filter((n) => !n.read && !n.archived);
        break;
      case "archived":
        list = list.filter((n) => n.archived);
        break;
      case "all":
      default:
        list = list.filter((n) => !n.archived);
        break;
    }
    if (inboxSearch.trim()) {
      const q = inboxSearch.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message?.toLowerCase().includes(q) ||
          n.projectName?.toLowerCase().includes(q) ||
          n.taskTitle?.toLowerCase().includes(q)
      );
    }
    // Sort by createdAt descending
    list.sort((a, b) => {
      try {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch {
        return 0;
      }
    });
    return list;
  }, [notifications, filter, inboxSearch]);

  // Group by date
  const groupedNotifs = useMemo(() => {
    const groups: { label: string; items: NotificationItem[] }[] = [];
    const groupMap = new Map<string, NotificationItem[]>();
    const order = ["Today", "Yesterday", "This Week", "This Month", "Older"];

    for (const notif of filteredNotifs) {
      const group = getNotifDateGroup(notif.createdAt);
      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(notif);
    }

    for (const label of order) {
      const items = groupMap.get(label);
      if (items && items.length > 0) {
        groups.push({ label, items });
      }
    }

    return groups;
  }, [filteredNotifs]);

  const handleNavigate = useCallback(
    (notif: NotificationItem) => {
      // Mark as read
      if (!notif.read) {
        markNotificationRead(notif.id);
      }

      // Open task detail in-place, or navigate to project if no task
      if (notif.projectName && notif.taskId) {
        openTaskDetail(notif.taskId, notif.projectName);
      } else if (notif.projectName) {
        navigate("project", { projectId: notif.projectName });
      }
    },
    [markNotificationRead, navigate, openTaskDetail]
  );

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead();
  }, [markAllNotificationsRead]);

  const handleArchiveAll = useCallback(() => {
    for (const notif of filteredNotifs) {
      if (!notif.archived) {
        archiveNotification(notif.id);
      }
    }
  }, [filteredNotifs, archiveNotification]);

  const handleRequestPermission = useCallback(async () => {
    await requestPermission();
    setShowPermBanner(false);
  }, [requestPermission]);

  const filterCounts = useMemo(() => {
    const all = notifications.filter((n) => !n.archived).length;
    const unread = notifications.filter((n) => !n.read && !n.archived).length;
    const archived = notifications.filter((n) => n.archived).length;
    return { all, unread, archived };
  }, [notifications]);

  /* ── Data load error fallback ── */
  if (loadError && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto" style={{ background: "oklch(0.95 0.04 60)" }}>
            <Warning className="w-6 h-6" style={{ color: "oklch(0.7 0.15 60)" }} weight="fill" />
          </div>
          <div>
            <h3 className="mb-1" style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}>Unable to load inbox</h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>{loadError}</p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
            style={{ background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500 }}
          >
            <ArrowClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1
            style={{
              color: "var(--text-primary)",
              fontSize: "24px",
              fontWeight: 700,
            }}
          >
            Inbox
          </h1>
          {unreadCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white"
              style={{ background: "oklch(0.7 0.18 25)" }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {/* Toolbar + Bulk actions */}
        <div className="flex items-center gap-2">
          <ListToolbar
            searchValue={inboxSearch}
            onSearchChange={setInboxSearch}
            searchPlaceholder="Search inbox…"
            hideSort
            hideFilter
            hideGroup
            hideOptions
          />
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors hover:opacity-80"
              style={{
                color: "oklch(0.55 0.2 280)",
                background: "oklch(0.55 0.2 280 / 0.08)",
              }}
            >
              <Checks size={14} />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
          {filteredNotifs.length > 0 && filter !== "archived" && (
            <button
              onClick={handleArchiveAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors hover:opacity-80"
              style={{
                color: "var(--text-tertiary)",
                background: "var(--neutral-100)",
              }}
            >
              <Archive size={14} />
              <span className="hidden sm:inline">Archive all</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop Notification Permission Banner */}
      <AnimatePresence>
        {showPermBanner && permission === "default" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-[8px]"
              style={{
                background: "oklch(0.55 0.2 280 / 0.06)",
                border: "1px solid oklch(0.55 0.2 280 / 0.15)",
              }}
            >
              <Desktop
                size={20}
                style={{ color: "oklch(0.55 0.2 280)" }}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  Enable desktop notifications
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Get notified when teammates assign tasks, leave comments, or
                  update projects.
                </p>
              </div>
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-white shrink-0 hover:opacity-90 transition-opacity"
                style={{ background: "oklch(0.55 0.2 280)" }}
              >
                Enable
              </button>
              <button
                onClick={() => setShowPermBanner(false)}
                className="p-1 shrink-0"
                style={{ color: "var(--text-quaternary)" }}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div
        className="flex items-center gap-1 mb-4 pb-2"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        {(
          [
            { id: "all" as InboxFilter, label: "All", count: filterCounts.all },
            {
              id: "unread" as InboxFilter,
              label: "Unread",
              count: filterCounts.unread,
            },
            {
              id: "archived" as InboxFilter,
              label: "Archived",
              count: filterCounts.archived,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className="relative px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors"
            style={{
              color:
                filter === tab.id
                  ? "oklch(0.7 0.18 25)"
                  : "var(--text-tertiary)",
              background:
                filter === tab.id ? "oklch(0.7 0.18 25 / 0.08)" : "transparent",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className="ml-1.5 text-[11px]"
                style={{
                  color:
                    filter === tab.id
                      ? "oklch(0.7 0.18 25)"
                      : "var(--text-quaternary)",
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifs.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="space-y-4">
          {groupedNotifs.map((group) => (
            <div key={group.label}>
              {/* Group header */}
              <div className="flex items-center gap-2 px-4 mb-1">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{
                    color: "var(--text-quaternary)",
                    letterSpacing: "0.06em",
                  }}
                >
                  {group.label}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border-subtle)" }}
                />
              </div>

              {/* Items */}
              <AnimatePresence mode="popLayout">
                {group.items.map((notif) => (
                  <NotificationRow
                    key={notif.id}
                    notif={notif}
                    onMarkRead={markNotificationRead}
                    onArchive={archiveNotification}
                    onNavigate={handleNavigate}
                  />
                ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Empty States ─── */

function EmptyState({ filter }: { filter: InboxFilter }) {
  const messages: Record<
    InboxFilter,
    { title: string; desc: string; icon: React.ElementType }
  > = {
    all: {
      title: "All caught up",
      desc: "You have no notifications. When teammates assign tasks, leave comments, or update projects, they'll show up here.",
      icon: BellSimple,
    },
    unread: {
      title: "No unread notifications",
      desc: "You've read all your notifications. Nice work staying on top of things!",
      icon: Checks,
    },
    archived: {
      title: "No archived notifications",
      desc: "Archived notifications will appear here. Archive items you've already dealt with.",
      icon: Archive,
    },
  };

  const { title, desc, icon: Icon } = messages[filter];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div
        className="w-16 h-16 rounded-[14px] flex items-center justify-center mb-4"
        style={{ background: "var(--neutral-100)" }}
      >
        <Icon size={28} style={{ color: "var(--text-quaternary)" }} />
      </div>
      <h3
        className="text-[16px] font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>
      <p
        className="text-[13px] max-w-sm leading-relaxed"
        style={{ color: "var(--text-tertiary)" }}
      >
        {desc}
      </p>
    </div>
  );
}

export default InboxPage;