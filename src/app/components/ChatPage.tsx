/* ═══════════════════════════════════════════════════════════
   CHAT PAGE — One-on-one messaging with split-pane layout.
   
   Features:
   - Conversation list with search, unread badges, presence dots
   - Message thread with sender-aligned bubbles, grouping, date separators
   - Reply, react, edit, delete, pin messages
   - Image/file attachments
   - Polling for new messages & conversation updates
   - Mobile: list → thread with back button
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ChatCircle,
  PaperPlaneTilt,
  Plus,
  MagnifyingGlass,
  DotsThree,
  Trash,
  PencilSimple,
  ArrowBendUpLeft,
  PushPin,
  Copy,
  X,
  Smiley,
  File as FileIcon,
  Paperclip,
  ArrowDown,
  BellSlash,
  Bell,
  Archive,
  ArrowCounterClockwise,
  CaretDown,
  CaretLeft,
  CheckSquare,
  Calendar as CalendarIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { api, apiCall } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useData } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { haptic } from "../lib/haptics";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { useDrag, getDragData, hasDragData, formatMention } from "../lib/drag-context";

/* ─── Types ─── */

interface Conversation {
  id: string;
  participants: string[];
  createdAt: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageSenderId: string;
  lastMessageType: string;
  unreadCount?: number;
}

interface TaskCardData {
  taskId: string;
  title: string;
  projectName?: string;
  status?: string;
  date?: string;
}

interface Message {
  id: string;
  convId: string;
  senderId: string;
  text: string;
  type: "text" | "image" | "file" | "system" | "reply" | "task-card";
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
  deleted?: boolean;
  replyTo?: string;
  imageUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  taskCard?: TaskCardData;
  reactions?: { emoji: string; userIds: string[] }[];
}

interface Presence {
  status: "online" | "away" | "offline";
  lastSeen: string | null;
  statusMessage?: string;
}

/* ─── Constants ─── */

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];
const POLL_MESSAGES_MS = 4000;
const POLL_CONVERSATIONS_MS = 12000;
const POLL_PRESENCE_MS = 30000;

/* ─── Helpers ─── */

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return format(d, "h:mm a");
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMMM d, yyyy");
}

function formatConvTime(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════ */

export function ChatPage({ panelMode = false }: { panelMode?: boolean }) {
  const { profile } = useAuth();
  const { teamMembers } = useData();
  const { params } = useNavigation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(params.conversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [presences, setPresences] = useState<Record<string, Presence>>({});
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [userPrefs, setUserPrefs] = useState<{ mutedConvs: string[]; archivedConvs: string[] }>({ mutedConvs: [], archivedConvs: [] });
  const [showArchived, setShowArchived] = useState(false);
  const [convContextMenu, setConvContextMenu] = useState<{ convId: string; x: number; y: number } | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedConvIds, setPinnedConvIds] = useState<string[]>([]);

  const safeTeam = teamMembers ?? [];

  // Get user display info
  const getUserInfo = useCallback((uid: string) => {
    const member = safeTeam.find((m) => m.userId === uid);
    return {
      name: member?.displayName || "Unknown",
      avatar: member?.avatarUrl,
      color: member?.avatarColor || "#8B5CF6",
      email: member?.email || "",
    };
  }, [safeTeam]);

  // Get the other participant in a conversation
  const getOtherUser = useCallback((conv: Conversation) => {
    // We need the current user's ID. Since we may not have it directly,
    // we'll use the profile info to match against team members
    const me = safeTeam.find((m) => m.email === profile?.email);
    const myId = me?.userId || "";
    const otherId = conv.participants.find((p) => p !== myId) || conv.participants[0];
    return { id: otherId, ...getUserInfo(otherId) };
  }, [safeTeam, profile, getUserInfo]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data, error } = await api.get<{ conversations: Conversation[] }>("/chat/conversations");
    if (error) {
      // Suppress transient cold-start and auth-init errors
      const lower = error.toLowerCase();
      if (!lower.includes("failed to fetch") && !lower.includes("auth")) {
        console.error("[Chat] Load conversations error:", error);
      }
      setLoading(false);
      return;
    }
    if (data?.conversations) {
      setConversations(data.conversations);
    }
    setLoading(false);
  }, []);

  // Load pinned messages for active conversation (must be above loadMessages)
  const loadPins = useCallback(async (convId: string) => {
    const { data } = await api.get<{ pins: Message[] }>(`/chat/conversations/${convId}/pins`);
    if (data?.pins) setPinnedMessages(data.pins);
    else setPinnedMessages([]);
  }, []);

  // Load messages for active conversation (initial load — shows spinner, replaces all)
  const loadMessages = useCallback(async (convId: string) => {
    setMessagesLoading(true);
    const { data, error } = await api.get<{ messages: Message[]; hasMore: boolean }>(
      `/chat/conversations/${convId}/messages?limit=50`
    );
    if (error) {
      console.error("[Chat] Load messages error:", error);
      setMessagesLoading(false);
      return;
    }
    if (data?.messages) {
      setMessages(data.messages);
      setHasMoreMessages(data.hasMore || false);
    }
    setMessagesLoading(false);

    // Mark as read & load pins
    api.post(`/chat/conversations/${convId}/read`);
    loadPins(convId);
  }, [loadPins]);

  // Poll for new messages only (no spinner, append new messages, preserve history)
  const pollMessages = useCallback(async (convId: string) => {
    const { data } = await api.get<{ messages: Message[]; hasMore: boolean }>(
      `/chat/conversations/${convId}/messages?limit=50`
    );
    if (!data?.messages) return;

    setMessages((prev) => {
      // If user hasn't loaded older messages (≤50 msgs), just replace
      if (prev.length <= 50) return data.messages;

      // User has loaded older messages — preserve them and merge in latest
      const latestIds = new Set(data.messages.map((m) => m.id));
      const olderKept = prev.filter((m) => !latestIds.has(m.id));
      // Merge: keep older loaded messages + latest from server (already sorted)
      const combined = [...olderKept, ...data.messages];
      // Sort by createdAt to maintain order
      combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return combined;
    });

    // Mark as read
    api.post(`/chat/conversations/${convId}/read`);
  }, []);

  // Update presence
  const updatePresence = useCallback(async () => {
    await api.post("/chat/presence", { status: "online" });
  }, []);

  // Load presences for conversation participants
  const loadPresences = useCallback(async () => {
    const allUserIds = new Set<string>();
    conversations.forEach((c) => c.participants.forEach((p) => allUserIds.add(p)));
    if (allUserIds.size === 0) return;

    const { data } = await api.post<{ presences: Record<string, Presence> }>(
      "/chat/presence/batch",
      { userIds: Array.from(allUserIds) }
    );
    if (data?.presences) {
      setPresences(data.presences);
    }
  }, [conversations]);

  // Load user prefs (muted/archived/pinned)
  const loadUserPrefs = useCallback(async () => {
    const { data } = await api.get<{ prefs: any }>("/chat/user-prefs");
    if (data?.prefs) {
      setUserPrefs({
        mutedConvs: data.prefs.mutedConvs || [],
        archivedConvs: data.prefs.archivedConvs || [],
      });
      setPinnedConvIds(data.prefs.pinnedConvs || []);
    }
  }, []);

  // Toggle pin conversation (local-only for now)
  const togglePinConv = useCallback(async (convId: string) => {
    setPinnedConvIds((prev) => {
      const next = prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId];
      // Persist to server best-effort
      api.post("/chat/user-prefs", { pinnedConvs: next });
      return next;
    });
    haptic("light");
  }, []);

  // Toggle mute conversation
  const toggleMute = useCallback(async (convId: string) => {
    const isMuted = userPrefs.mutedConvs.includes(convId);
    try {
      await apiCall(`/chat/conversations/${convId}`, {
        method: "PATCH",
        body: { muted: !isMuted },
      });
      setUserPrefs((prev) => ({
        ...prev,
        mutedConvs: isMuted
          ? prev.mutedConvs.filter((id) => id !== convId)
          : [...prev.mutedConvs, convId],
      }));
      toast.success(isMuted ? "Unmuted" : "Muted");
    } catch (err) {
      console.error("[Chat] Toggle mute error:", err);
      toast.error("Failed to update mute");
    }
  }, [userPrefs.mutedConvs]);

  // Toggle archive conversation
  const toggleArchive = useCallback(async (convId: string) => {
    const isArchived = userPrefs.archivedConvs.includes(convId);
    try {
      await apiCall(`/chat/conversations/${convId}`, {
        method: "PATCH",
        body: { archived: !isArchived },
      });
      setUserPrefs((prev) => ({
        ...prev,
        archivedConvs: isArchived
          ? prev.archivedConvs.filter((id) => id !== convId)
          : [...prev.archivedConvs, convId],
      }));
      toast.success(isArchived ? "Unarchived" : "Archived");
      if (!isArchived && convId === activeConvId) {
        setActiveConvId(null);
      }
    } catch (err) {
      console.error("[Chat] Toggle archive error:", err);
      toast.error("Failed to update archive");
    }
  }, [userPrefs.archivedConvs, activeConvId]);

  // Pin/unpin message
  const togglePin = useCallback(async (msgId: string) => {
    if (!activeConvId) return;
    const isPinned = pinnedMessages.some((m) => m.id === msgId);
    try {
      if (isPinned) {
        await api.del(`/chat/conversations/${activeConvId}/pins/${msgId}`);
        setPinnedMessages((prev) => prev.filter((m) => m.id !== msgId));
        toast.success("Unpinned");
      } else {
        await api.post(`/chat/conversations/${activeConvId}/pins/${msgId}`);
        const msg = messages.find((m) => m.id === msgId);
        if (msg) setPinnedMessages((prev) => [...prev, msg]);
        toast.success("Pinned");
      }
    } catch (err) {
      console.error("[Chat] Toggle pin error:", err);
      toast.error("Failed to update pin");
    }
  }, [activeConvId, pinnedMessages, messages]);

  // Load more (older) messages — scroll position preserved in MessageThread
  const loadMoreMessages = useCallback(async () => {
    if (!activeConvId || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0]?.id;
    try {
      const { data } = await api.get<{ messages: Message[]; hasMore: boolean }>(
        `/chat/conversations/${activeConvId}/messages?limit=50&before=${oldestId}`
      );
      if (data?.messages?.length) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore ?? false);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error("[Chat] Load more error:", err);
    }
    setLoadingMore(false);
  }, [activeConvId, loadingMore, messages]);

  // Close conversation context menu
  useEffect(() => {
    if (!convContextMenu) return;
    const handler = () => setConvContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [convContextMenu]);

  // Initial load — guarded behind auth
  useEffect(() => {
    if (!profile?.email) return;
    loadConversations();
    updatePresence();
    loadUserPrefs();
  }, [profile?.email, loadConversations, updatePresence, loadUserPrefs]);

  // Poll conversations — guarded behind auth
  useEffect(() => {
    if (!profile?.email) return;
    const interval = setInterval(loadConversations, POLL_CONVERSATIONS_MS);
    return () => clearInterval(interval);
  }, [profile?.email, loadConversations]);

  // Load messages on conversation change, then poll for updates
  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);
    const interval = setInterval(() => pollMessages(activeConvId), POLL_MESSAGES_MS);
    return () => clearInterval(interval);
  }, [activeConvId, loadMessages, pollMessages]);

  // Poll presence — guarded behind auth + conversations
  useEffect(() => {
    if (!profile?.email || conversations.length === 0) return;
    loadPresences();
    const interval = setInterval(loadPresences, POLL_PRESENCE_MS);
    return () => clearInterval(interval);
  }, [profile?.email, conversations.length, loadPresences]);

  // Heartbeat presence — guarded behind auth
  useEffect(() => {
    if (!profile?.email) return;
    const interval = setInterval(updatePresence, 60000);
    return () => clearInterval(interval);
  }, [profile?.email, updatePresence]);

  // Send message
  const sendMessage = useCallback(async (text: string, opts?: { replyTo?: string; type?: string; imageUrl?: string; fileName?: string; fileUrl?: string; taskCard?: TaskCardData }) => {
    if (!activeConvId) return;
    const { data, error } = await api.post<{ message: Message }>(
      `/chat/conversations/${activeConvId}/messages`,
      { text, ...opts }
    );
    if (error) {
      toast.error("Failed to send message");
      return;
    }
    if (data?.message) {
      setMessages((prev) => [...prev, data.message]);
    }
  }, [activeConvId]);

  // Create new conversation
  const createConversation = useCallback(async (otherUserId: string) => {
    const { data, error } = await api.post<{ conversation: Conversation; existing: boolean }>(
      "/chat/conversations",
      { otherUserId }
    );
    if (error) {
      toast.error("Failed to create conversation");
      return;
    }
    if (data?.conversation) {
      if (!data.existing) {
        setConversations((prev) => [data.conversation, ...prev]);
      }
      setActiveConvId(data.conversation.id);
      setShowNewChat(false);
    }
  }, []);

  // React to message
  const reactToMessage = useCallback(async (msgId: string, emoji: string) => {
    if (!activeConvId) return;
    const { data } = await apiCall<{ message: Message }>(
      `/chat/conversations/${activeConvId}/messages/${msgId}`,
      { method: "PATCH", body: { reaction: emoji } }
    );
    // Optimistically update
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId && data?.message ? data.message : m))
    );
  }, [activeConvId]);

  // Edit message
  const editMessage = useCallback(async (msgId: string, text: string) => {
    if (!activeConvId) return;
    await apiCall(`/chat/conversations/${activeConvId}/messages/${msgId}`, {
      method: "PATCH",
      body: { text },
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, text, editedAt: new Date().toISOString() } : m))
    );
  }, [activeConvId]);

  // Delete message
  const deleteMessage = useCallback(async (msgId: string) => {
    if (!activeConvId) return;
    await api.del(`/chat/conversations/${activeConvId}/messages/${msgId}`);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, deleted: true, text: "" } : m))
    );
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Filter conversations by search and split active/archived
  const { activeConvs, archivedConvs } = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = q
      ? conversations.filter((c) => {
          const other = getOtherUser(c);
          return other.name.toLowerCase().includes(q) || other.email.toLowerCase().includes(q);
        })
      : conversations;
    return {
      activeConvs: filtered.filter((c) => !userPrefs.archivedConvs.includes(c.id)),
      archivedConvs: filtered.filter((c) => userPrefs.archivedConvs.includes(c.id)),
    };
  }, [conversations, search, getOtherUser, userPrefs.archivedConvs]);

  const displayConvs = showArchived ? archivedConvs : activeConvs;

  // In panel mode, use the panel's own container width instead of 100vw for sliding
  const slideUnit = panelMode ? "100%" : "100vw";

  return (
    <div className={panelMode ? "h-full" : "max-w-[1200px] mx-auto -mx-4 sm:-mx-6 md:-mx-10 -my-6 md:-my-10"}>
      <div
        className={panelMode
          ? "h-full overflow-hidden flex flex-col"
          : "h-[calc(100vh-56px)] md:h-[calc(100vh-0px)] overflow-hidden rounded-none md:rounded-[0px] md:flex"
        }
        style={{ background: "var(--surface-bg)" }}
      >
        {/* ── Sliding track: In panel mode, always slides (no md:contents split).
               In page mode, desktop uses md:contents for split-pane layout. ── */}
        <div
          className={panelMode ? "flex h-full flex-1 min-h-0" : "flex h-full md:contents"}
          style={{
            transition: "transform 350ms cubic-bezier(0.32, 0.72, 0, 1)",
            transform: activeConvId ? `translateX(-${slideUnit})` : "translateX(0)",
          }}
        >
        {/* ── Conversation List ── */}
        <div
          className={panelMode
            ? "w-full shrink-0 flex flex-col"
            : "w-screen shrink-0 md:w-[340px] md:order-2 flex flex-col md:border-l border-r md:border-r-0"
          }
          style={{ borderColor: panelMode ? undefined : "var(--border-default)" }}
        >
          {/* Header — hidden in panel mode since ChatPanel provides its own toolbar */}
          {!panelMode && (
            <div className="flex items-center justify-between px-4 h-[56px] shrink-0 border-b" style={{ borderColor: "var(--border-default)" }}>
              <div className="flex items-center gap-2">
                <ChatCircle size={22} weight="fill" style={{ color: "var(--accent-primary)" }} />
                <h1 className="text-[18px] font-bold" style={{ color: "var(--text-primary)" }}>Chat</h1>
              </div>
              <button
                onClick={() => { setShowNewChat(true); haptic("light"); }}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                style={{ color: "var(--text-tertiary)" }}
                title="New conversation"
              >
                <Plus size={18} weight="bold" />
              </button>
            </div>
          )}
          {/* Panel mode: compact new-chat button row */}
          {panelMode && (
            <div className="flex items-center justify-end px-3 py-1.5 shrink-0">
              <button
                onClick={() => { setShowNewChat(true); haptic("light"); }}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                style={{ color: "var(--text-tertiary)" }}
                title="New conversation"
              >
                <Plus size={16} weight="bold" />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="px-3 py-2">
            <div
              className="flex items-center gap-2 px-3 h-[36px] rounded-[8px]"
              style={{ background: "var(--neutral-100)" }}
            >
              <MagnifyingGlass size={15} style={{ color: "var(--text-quaternary)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="flex-1 bg-transparent outline-none text-[13px]"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
          </div>

          {/* ── Pinned conversations (avatar circles) ── */}
          {(() => {
            const pinnedConvs = conversations.filter((c) => pinnedConvIds.includes(c.id));
            if (pinnedConvs.length === 0) return null;
            return (
              <div className="px-3 pt-1 pb-2 border-b" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                  {pinnedConvs.map((conv) => {
                    const other = getOtherUser(conv);
                    const presence = presences[other.id];
                    const isActive = conv.id === activeConvId;
                    const unread = conv.unreadCount || 0;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => { setActiveConvId(conv.id); setShowPinnedPanel(false); haptic("selection"); }}
                        className="flex flex-col items-center gap-1 shrink-0 group/pin"
                      >
                        <div className="relative">
                          <div
                            className="w-[52px] h-[52px] rounded-full flex items-center justify-center overflow-hidden transition-all"
                            style={{
                              background: other.color,
                              boxShadow: isActive ? "0 0 0 2px var(--accent-primary)" : undefined,
                            }}
                          >
                            {other.avatar ? (
                              <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-[16px] font-bold">
                                {other.name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                              </span>
                            )}
                          </div>
                          {presence?.status === "online" && (
                            <div
                              className="absolute bottom-0 right-0 w-[13px] h-[13px] rounded-full border-[2.5px]"
                              style={{ background: "#22C55E", borderColor: "var(--surface-bg)" }}
                            />
                          )}
                          {unread > 0 && (
                            <div
                              className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ background: "#EF4444" }}
                            >
                              {unread > 9 ? "9+" : unread}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium truncate max-w-[56px]" style={{ color: isActive ? "var(--accent-primary)" : "var(--text-tertiary)" }}>
                          {other.name.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Archive toggle */}
          {archivedConvs.length > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 w-full px-4 py-2 text-[12px] font-medium transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              style={{ color: "var(--text-quaternary)", borderBottom: "1px solid var(--border-default)" }}
            >
              <Archive size={14} />
              {showArchived ? "Back to active" : `Archived (${archivedConvs.length})`}
              <CaretDown size={10} className={`ml-auto transition-transform ${showArchived ? "rotate-180" : ""}`} />
            </button>
          )}

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
              </div>
            ) : displayConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <ChatCircle size={40} weight="thin" style={{ color: "var(--text-quaternary)" }} />
                <p className="mt-3 text-[14px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  {showArchived ? "No archived conversations" : conversations.length === 0 ? "No conversations yet" : "No results"}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--text-quaternary)" }}>
                  {conversations.length === 0 ? "Start a conversation with a team member" : showArchived ? "Archived chats will appear here" : "Try a different search"}
                </p>
                {conversations.length === 0 && (
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="mt-4 px-4 py-2 rounded-[8px] text-[13px] font-semibold text-white"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    <Plus size={14} weight="bold" className="inline mr-1" />
                    New Chat
                  </button>
                )}
              </div>
            ) : (
              displayConvs.map((conv) => {
                const other = getOtherUser(conv);
                const presence = presences[other.id];
                const isActive = conv.id === activeConvId;
                const unread = conv.unreadCount || 0;
                const isMuted = userPrefs.mutedConvs.includes(conv.id);
                const isPinned = pinnedConvIds.includes(conv.id);

                return (
                  <button
                    key={conv.id}
                    onClick={() => { setActiveConvId(conv.id); setShowPinnedPanel(false); haptic("selection"); }}
                    onContextMenu={(e) => { e.preventDefault(); setConvContextMenu({ convId: conv.id, x: e.clientX, y: e.clientY }); }}
                    className="flex items-center gap-3 w-full px-4 py-3 transition-colors text-left"
                    style={{
                      background: isActive ? "var(--accent-primary-subtle)" : undefined,
                    }}
                  >
                    {/* Avatar with presence dot */}
                    <div className="relative shrink-0">
                      <div
                        className="w-[42px] h-[42px] rounded-full flex items-center justify-center overflow-hidden"
                        style={{ background: other.color, opacity: isMuted ? 0.6 : 1 }}
                      >
                        {other.avatar ? (
                          <img src={other.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-[14px] font-bold">
                            {other.name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                          </span>
                        )}
                      </div>
                      {presence?.status === "online" && (
                        <div
                          className="absolute bottom-0 right-0 w-[12px] h-[12px] rounded-full border-2"
                          style={{ background: "#22C55E", borderColor: isActive ? "var(--accent-primary-subtle)" : "var(--surface-bg)" }}
                        />
                      )}
                    </div>

                    {/* Name + preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <span
                            className="truncate text-[14px]"
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: unread > 0 ? 600 : 500,
                            }}
                          >
                            {other.name}
                          </span>
                          {isMuted && <BellSlash size={12} style={{ color: "var(--text-quaternary)" }} />}
                          {isPinned && <PushPin size={11} weight="fill" style={{ color: "var(--text-quaternary)" }} />}
                        </span>
                        <span
                          className="text-[11px] shrink-0 tabular-nums"
                          style={{ color: "var(--text-quaternary)" }}
                        >
                          {conv.lastMessageAt && formatConvTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span
                          className="truncate text-[12px]"
                          style={{
                            color: unread > 0 && !isMuted ? "var(--text-secondary)" : "var(--text-quaternary)",
                            fontWeight: unread > 0 && !isMuted ? 500 : 400,
                          }}
                        >
                          {conv.lastMessagePreview || "No messages yet"}
                        </span>
                        {unread > 0 && (
                          <span
                            className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: isMuted ? "var(--text-quaternary)" : "var(--accent-primary)" }}
                          >
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Message Thread ── */}
        <div className={panelMode
          ? "w-full shrink-0 flex flex-col min-w-0 min-h-0"
          : "w-screen shrink-0 md:w-0 md:flex-1 md:order-1 flex flex-col min-w-0"
        }>
          {activeConv ? (
            <MessageThread
              key={activeConv.id}
              conv={activeConv}
              messages={messages}
              loading={messagesLoading}
              presences={presences}
              getUserInfo={getUserInfo}
              getOtherUser={getOtherUser}
              onSend={sendMessage}
              onReact={reactToMessage}
              onEdit={editMessage}
              onDelete={deleteMessage}
              onBack={() => setActiveConvId(null)}
              pinnedMessages={pinnedMessages}
              showPinnedPanel={showPinnedPanel}
              onTogglePinnedPanel={() => setShowPinnedPanel(!showPinnedPanel)}
              onTogglePin={togglePin}
              hasMore={hasMoreMessages}
              loadingMore={loadingMore}
              onLoadMore={loadMoreMessages}
              isMuted={userPrefs.mutedConvs.includes(activeConv.id)}
              onToggleMute={() => toggleMute(activeConv.id)}
              onArchive={() => toggleArchive(activeConv.id)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <ChatCircle size={56} weight="thin" style={{ color: "var(--text-quaternary)" }} />
              <p className="text-[15px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                Select a conversation
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
                Or start a new one with the + button
              </p>
            </div>
          )}
        </div>
        </div>{/* close sliding track */}
      </div>

      {/* ── Conversation Context Menu ── */}
      {convContextMenu && createPortal(
        <div
          className="fixed z-[9999] w-[190px] py-1 rounded-[10px] border overflow-hidden"
          style={{
            top: Math.min(convContextMenu.y, window.innerHeight - 160),
            left: Math.min(convContextMenu.x, window.innerWidth - 210),
            background: "var(--surface-bg)",
            borderColor: "var(--border-default)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ConvCtxItem
            icon={PushPin}
            label={pinnedConvIds.includes(convContextMenu.convId) ? "Unpin" : "Pin to top"}
            onClick={() => { togglePinConv(convContextMenu.convId); setConvContextMenu(null); }}
          />
          <ConvCtxItem
            icon={userPrefs.mutedConvs.includes(convContextMenu.convId) ? Bell : BellSlash}
            label={userPrefs.mutedConvs.includes(convContextMenu.convId) ? "Unmute" : "Mute"}
            onClick={() => { toggleMute(convContextMenu.convId); setConvContextMenu(null); }}
          />
          <ConvCtxItem
            icon={userPrefs.archivedConvs.includes(convContextMenu.convId) ? ArrowCounterClockwise : Archive}
            label={userPrefs.archivedConvs.includes(convContextMenu.convId) ? "Unarchive" : "Archive"}
            onClick={() => { toggleArchive(convContextMenu.convId); setConvContextMenu(null); }}
          />
        </div>,
        document.body
      )}

      {/* ── New Chat Modal ── */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            teamMembers={safeTeam}
            conversations={conversations}
            getOtherUser={getOtherUser}
            onSelect={createConversation}
            onClose={() => setShowNewChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ChatPage;

/* ═══════════════════════════════════════════════════════════
   MESSAGE THREAD
   ═══════════════════════════════════════════════════════════ */

function MessageThread({
  conv,
  messages,
  loading,
  presences,
  getUserInfo,
  getOtherUser,
  onSend,
  onReact,
  onEdit,
  onDelete,
  onBack,
  pinnedMessages,
  showPinnedPanel,
  onTogglePinnedPanel,
  onTogglePin,
  hasMore,
  loadingMore,
  onLoadMore,
  isMuted,
  onToggleMute,
  onArchive,
}: {
  conv: Conversation;
  messages: Message[];
  loading: boolean;
  presences: Record<string, Presence>;
  getUserInfo: (uid: string) => { name: string; avatar?: string; color: string; email: string };
  getOtherUser: (conv: Conversation) => { id: string; name: string; avatar?: string; color: string };
  onSend: (text: string, opts?: any) => Promise<void>;
  onReact: (msgId: string, emoji: string) => Promise<void>;
  onEdit: (msgId: string, text: string) => Promise<void>;
  onDelete: (msgId: string) => Promise<void>;
  onBack: () => void;
  pinnedMessages: Message[];
  showPinnedPanel: boolean;
  onTogglePinnedPanel: () => void;
  onTogglePin: (msgId: string) => Promise<void>;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => Promise<void>;
  isMuted: boolean;
  onToggleMute: () => void;
  onArchive: () => void;
}) {
  const { profile } = useAuth();
  const { teamMembers } = useData();
  const me = (teamMembers ?? []).find((m) => m.email === profile?.email);
  const myId = me?.userId || "";

  const other = getOtherUser(conv);
  const otherPresence = presences[other.id];

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const [composerDropHighlight, setComposerDropHighlight] = useState(false);
  const { pendingDrop, consumeDrop, dragging } = useDrag();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMsgCount = useRef(0);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNearBottom = useRef(true);

  // Consume pending drag-drops — auto-send task card
  useEffect(() => {
    if (pendingDrop?.target === "chat") {
      const drop = consumeDrop();
      if (drop) {
        const { payload } = drop;
        if (payload.type === "task") {
          onSend(payload.title, {
            type: "task-card",
            taskCard: { taskId: payload.id, title: payload.title, projectName: payload.projectName, status: payload.taskStatus, date: payload.taskDate },
          } as any);
        } else {
          const mention = formatMention(payload);
          setInput((prev) => prev ? prev + " " + mention + " " : mention + " ");
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    }
  }, [pendingDrop]);

  // Auto-scroll on new messages (only if user was near bottom — skip for "load older")
  useEffect(() => {
    if (messages.length > prevMsgCount.current && isNearBottom.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
    prevMsgCount.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [loading, conv.id]);

  // Track scroll position for FAB and auto-scroll logic
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollFab(distFromBottom > 200);
    isNearBottom.current = distFromBottom < 120;
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  // Poll typing indicators
  useEffect(() => {
    if (!conv.id) return;
    let mounted = true;
    const poll = async () => {
      const { data } = await api.get<{ typingUsers: string[] }>(`/chat/typing/${conv.id}`);
      if (mounted && data?.typingUsers) setTypingUsers(data.typingUsers);
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => { mounted = false; clearInterval(interval); };
  }, [conv.id]);

  // Send typing indicator on input change
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    api.post("/chat/typing", { convId: conv.id, isTyping });
  }, [conv.id]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    // Debounced typing indicator
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    sendTypingIndicator(true);
    typingTimeout.current = setTimeout(() => sendTypingIndicator(false), 4000);
  }, [sendTypingIndicator]);

  // Wrap onLoadMore to preserve scroll position
  const handleLoadMore = useCallback(async () => {
    const el = scrollRef.current;
    if (!el) return;
    const prevHeight = el.scrollHeight;
    const prevScroll = el.scrollTop;
    await onLoadMore();
    // After React re-renders, restore scroll position
    requestAnimationFrame(() => {
      const newHeight = el.scrollHeight;
      el.scrollTop = prevScroll + (newHeight - prevHeight);
    });
  }, [onLoadMore]);

  // Clear typing on send
  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !editingMsg) return;

    // Clear typing indicator
    sendTypingIndicator(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    if (editingMsg) {
      await onEdit(editingMsg.id, text);
      setEditingMsg(null);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      return;
    }

    setInput("");
    setReplyTo(null);
    if (inputRef.current) inputRef.current.style.height = "auto";
    await onSend(text, replyTo ? { replyTo: replyTo.id, type: "reply" } : undefined);
    haptic("light");
  }, [input, editingMsg, replyTo, onEdit, onSend, sendTypingIndicator]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleContextMenu = useCallback((e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ msg, x: e.clientX, y: e.clientY });
  }, []);

  // Group messages by date and sender
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: (Message & { showAvatar: boolean; showName: boolean })[] }[] = [];
    let currentDate = "";
    let lastSenderId = "";
    let lastTime = 0;

    for (const msg of messages) {
      const msgDate = formatDateSeparator(msg.createdAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [] });
        lastSenderId = "";
        lastTime = 0;
      }

      const timeDiff = new Date(msg.createdAt).getTime() - lastTime;
      const sameGroup = msg.senderId === lastSenderId && timeDiff < 120_000; // 2 min

      groups[groups.length - 1].messages.push({
        ...msg,
        showAvatar: !sameGroup,
        showName: !sameGroup,
      });

      lastSenderId = msg.senderId;
      lastTime = new Date(msg.createdAt).getTime();
    }

    return groups;
  }, [messages]);

  // File/Image upload handler
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size must be under 10MB");
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload via existing attachment endpoint
      const { data: uploadData, error } = await api.post<{ url: string; path: string }>("/storage/attachment", {
        base64,
        contentType: file.type,
        fileName: file.name,
      });

      if (error || !uploadData?.url) {
        toast.error("Upload failed");
        setUploading(false);
        return;
      }

      const isImage = file.type.startsWith("image/");

      await onSend(isImage ? "" : file.name, {
        type: isImage ? "image" : "file",
        imageUrl: isImage ? uploadData.url : undefined,
        fileUrl: uploadData.url,
        fileName: file.name,
        fileSize: file.size,
      });

      haptic("light");
    } catch (err) {
      console.error("[Chat] File upload error:", err);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onSend]);

  const [fullPanelDragOver, setFullPanelDragOver] = useState(false);

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={(e) => {
        if (dragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setFullPanelDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setFullPanelDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setFullPanelDragOver(false);
        setComposerDropHighlight(false);
        const payload = getDragData(e) || dragging;
        if (payload) {
          if (payload.type === "task") {
            onSend(payload.title, {
              type: "task-card",
              taskCard: { taskId: payload.id, title: payload.title, projectName: payload.projectName, status: payload.taskStatus, date: payload.taskDate },
            } as any);
          } else {
            const mention = formatMention(payload);
            setInput((prev) => prev ? prev + " " + mention + " " : mention + " ");
            setTimeout(() => inputRef.current?.focus(), 20);
          }
        }
      }}
    >
      {/* Full-panel drop overlay */}
      {fullPanelDragOver && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-[8px] pointer-events-none"
          style={{
            background: "rgba(99, 102, 241, 0.08)",
            border: "2px dashed var(--accent-primary)",
          }}
        >
          <CheckSquare size={32} weight="duotone" style={{ color: "var(--accent-primary)", marginBottom: 8 }} />
          <span className="text-[14px] font-semibold" style={{ color: "var(--accent-primary)" }}>
            Drop task to share in chat
          </span>
        </div>
      )}
      {/* Header — iMessage style: back arrow, centered avatar + name */}
      <div
        className="relative flex items-center px-3 h-[56px] shrink-0 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        {/* Back button — left */}
        <button
          onClick={onBack}
          className="flex items-center gap-0 -ml-1 px-1 py-1 rounded-[6px] active:opacity-60 transition-opacity z-10"
          style={{ color: "var(--accent-primary)" }}
        >
          <CaretLeft size={22} weight="bold" />
        </button>

        {/* Centered avatar + name */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative">
            <div
              className="w-[30px] h-[30px] rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: other.color }}
            >
              {other.avatar ? (
                <img src={other.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-[10px] font-bold">
                  {other.name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              )}
            </div>
            {otherPresence?.status === "online" && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-[9px] h-[9px] rounded-full border-[1.5px]"
                style={{ background: "#22C55E", borderColor: "var(--surface-bg)" }}
              />
            )}
          </div>
          <p className="text-[11px] font-semibold mt-0.5 flex items-center gap-1" style={{ color: "var(--text-primary)" }}>
            {other.name}
            {isMuted && <BellSlash size={9} style={{ color: "var(--text-quaternary)" }} />}
          </p>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-0.5 ml-auto z-10">
          {pinnedMessages.length > 0 && (
            <button
              onClick={onTogglePinnedPanel}
              className={`flex items-center gap-1 px-2 h-7 rounded-[6px] text-[11px] font-medium transition-colors ${showPinnedPanel ? "bg-black/[0.06] dark:bg-white/[0.06]" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
              style={{ color: showPinnedPanel ? "var(--accent-primary)" : "var(--text-tertiary)" }}
              title="Pinned messages"
            >
              <PushPin size={13} weight={showPinnedPanel ? "fill" : "regular"} />
              <span>{pinnedMessages.length}</span>
            </button>
          )}
          <button
            onClick={onToggleMute}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-tertiary)" }}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <BellSlash size={15} /> : <Bell size={15} />}
          </button>
        </div>
      </div>

      {/* Pinned messages panel */}
      {showPinnedPanel && pinnedMessages.length > 0 && (
        <div
          className="border-b"
          style={{ borderColor: "var(--border-default)", background: "var(--neutral-50)" }}
        >
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <PushPin size={13} weight="fill" style={{ color: "var(--accent-primary)" }} />
                <span className="text-[12px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Pinned Messages ({pinnedMessages.length})
                </span>
              </div>
              <button
                onClick={onTogglePinnedPanel}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                style={{ color: "var(--text-quaternary)" }}
              >
                <X size={12} />
              </button>
            </div>
            <div className="max-h-[160px] overflow-y-auto space-y-1.5">
              {pinnedMessages.map((pin) => {
                const sender = getUserInfo(pin.senderId);
                return (
                  <div
                    key={pin.id}
                    className="flex items-start gap-2 px-2 py-1.5 rounded-[6px] group"
                    style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}
                  >
                    <div
                      className="w-[20px] h-[20px] rounded-[5px] flex items-center justify-center shrink-0 overflow-hidden mt-0.5"
                      style={{ background: sender.color }}
                    >
                      {sender.avatar ? (
                        <img src={sender.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[7px] font-bold">
                          {sender.name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>{sender.name}</p>
                      <p className="text-[12px] line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {pin.deleted ? "Deleted message" : pin.text || (pin.type === "image" ? "Image" : pin.fileName || "File")}
                      </p>
                    </div>
                    <button
                      onClick={() => onTogglePin(pin.id)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center shrink-0 hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                      style={{ color: "var(--text-quaternary)" }}
                      title="Unpin"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{ background: "var(--page-bg)" }}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }} />
          </div>
        ) : (
          <>
            {/* Load older messages */}
            {hasMore && (
              <div className="flex justify-center py-3">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06] disabled:opacity-40"
                  style={{ color: "var(--text-tertiary)", border: "1px solid var(--border-default)", background: "var(--surface-bg)" }}
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3 h-3 rounded-full border-[1.5px] border-t-transparent animate-spin" style={{ borderColor: "var(--text-quaternary)", borderTopColor: "transparent" }} />
                      Loading…
                    </>
                  ) : (
                    <>
                      <ArrowCounterClockwise size={12} />
                      Load older messages
                    </>
                  )}
                </button>
              </div>
            )}
          {groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator — centered pill */}
              <div className="flex justify-center my-4">
                <span
                  className="text-[11px] font-medium px-3 py-1 rounded-full"
                  style={{ color: "var(--text-quaternary)", background: "var(--neutral-100)" }}
                >
                  {group.date}
                </span>
              </div>

              {group.messages.map((msg, msgIdx) => {
                if (msg.type === "system") {
                  return (
                    <div key={msg.id} className="text-center py-2">
                      <span className="text-[11px] px-3 py-1 rounded-full" style={{ color: "var(--text-quaternary)", background: "var(--neutral-100)" }}>
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                const isMine = msg.senderId === myId;
                const isGroupHead = msg.showAvatar;
                // Determine if this is the last message in a consecutive run from same sender
                const nextMsg = group.messages[msgIdx + 1];
                const isGroupTail = !nextMsg || nextMsg.senderId !== msg.senderId || nextMsg.type === "system" || (new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) > 120_000;

                // Bubble corner radii — iMessage style
                const bubbleRadius = isMine
                  ? `18px ${isGroupHead ? "18px" : "6px"} ${isGroupTail ? "4px" : "6px"} 18px`
                  : `${isGroupHead ? "18px" : "6px"} 18px 18px ${isGroupTail ? "4px" : "6px"}`;

                return (
                  <div
                    key={msg.id}
                    className={`group/msg relative flex ${isMine ? "justify-end" : "justify-start"} ${isGroupHead ? "mt-2" : "mt-[2px]"}`}
                    onContextMenu={(e) => handleContextMenu(e, msg)}
                  >
                    {/* Hover action toolbar */}
                    {!msg.deleted && (
                      <div
                        className={`absolute ${isMine ? "left-0" : "right-0"} top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center rounded-[6px] border z-10`}
                        style={{
                          background: "var(--surface-bg)",
                          borderColor: "var(--border-default)",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                      >
                        <button
                          onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.05] rounded-l-[5px]"
                          style={{ color: "var(--text-quaternary)" }}
                        >
                          <Smiley size={13} />
                        </button>
                        <button
                          onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                          style={{ color: "var(--text-quaternary)" }}
                        >
                          <ArrowBendUpLeft size={13} />
                        </button>
                        <button
                          onClick={(e) => handleContextMenu(e, msg)}
                          className="w-6 h-6 flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.05] rounded-r-[5px]"
                          style={{ color: "var(--text-quaternary)" }}
                        >
                          <DotsThree size={13} weight="bold" />
                        </button>
                      </div>
                    )}

                    {/* Quick reaction picker */}
                    {showReactions === msg.id && (
                      <div
                        className={`absolute ${isMine ? "right-0" : "left-0"} -top-10 flex items-center gap-0.5 px-2 py-1 rounded-full z-20`}
                        style={{
                          background: "var(--surface-bg)",
                          border: "1px solid var(--border-default)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      >
                        {QUICK_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => { onReact(msg.id, emoji); setShowReactions(null); }}
                            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-transform hover:scale-125 text-[16px]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className="max-w-[75%] min-w-0">
                      {/* Reply preview */}
                      {msg.replyTo && (() => {
                        const replied = messages.find((m) => m.id === msg.replyTo);
                        if (!replied) return null;
                        const repliedUser = getUserInfo(replied.senderId);
                        return (
                          <div
                            className={`flex items-center gap-1.5 text-[11px] mb-1 pl-2 border-l-2 py-0.5 ${isMine ? "ml-auto" : ""}`}
                            style={{
                              color: "var(--text-quaternary)",
                              borderLeftColor: repliedUser.color,
                              maxWidth: "90%",
                            }}
                          >
                            <span className="font-semibold" style={{ color: "var(--text-tertiary)" }}>{repliedUser.name}</span>
                            <span className="truncate">{replied.deleted ? "Deleted message" : replied.text || (replied.type === "image" ? "Image" : replied.fileName || "File")}</span>
                          </div>
                        );
                      })()}

                      {msg.deleted ? (
                        <div
                          className="px-3.5 py-2 text-[13px] italic"
                          style={{
                            color: "var(--text-quaternary)",
                            background: "var(--neutral-100)",
                            borderRadius: bubbleRadius,
                          }}
                        >
                          This message was deleted
                        </div>
                      ) : (
                        <>
                          {/* Image — no bubble wrapper */}
                          {msg.type === "image" && msg.imageUrl && (
                            <button
                              onClick={() => setLightboxUrl(msg.imageUrl!)}
                              className="group/thumb relative overflow-hidden mb-0.5 cursor-pointer transition-shadow hover:shadow-md"
                              style={{ borderRadius: bubbleRadius, width: "200px", height: "200px" }}
                            >
                              <img src={msg.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.25)" }}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3h5v2H5v3H3V3zm9 0h5v5h-2V5h-3V3zM3 12h2v3h3v2H3v-5zm12 3h-3v2h5v-5h-2v3z" fill="white"/></svg>
                              </div>
                            </button>
                          )}

                          {/* File card */}
                          {msg.type === "file" && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3.5 py-2.5 mb-0.5 transition-colors"
                              style={{
                                borderRadius: bubbleRadius,
                                background: isMine ? "var(--accent-primary)" : "var(--neutral-100)",
                                color: isMine ? "white" : "var(--text-primary)",
                              }}
                            >
                              <FileIcon size={18} style={{ opacity: 0.8 }} />
                              <div className="min-w-0">
                                <span className="text-[13px] font-medium block truncate">{msg.fileName || "File"}</span>
                                {msg.fileSize && (
                                  <span className="text-[10px]" style={{ opacity: 0.7 }}>
                                    {msg.fileSize > 1_000_000 ? `${(msg.fileSize / 1_000_000).toFixed(1)} MB` : `${Math.round(msg.fileSize / 1000)} KB`}
                                  </span>
                                )}
                              </div>
                            </a>
                          )}

                          {/* Task card */}
                          {msg.type === "task-card" && msg.taskCard && (
                            <div
                              className="flex items-start gap-2.5 px-3.5 py-2.5 mb-0.5 border text-left transition-all hover:shadow-md group/taskcard cursor-default"
                              style={{
                                borderRadius: bubbleRadius,
                                borderColor: "var(--border-default)",
                                background: "var(--surface-secondary)",
                              }}
                            >
                              <div
                                className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center shrink-0 mt-0.5"
                                style={{ background: "var(--accent-primary)", color: "#fff" }}
                              >
                                <CheckSquare size={14} weight="fill" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[13px] font-semibold block truncate group-hover/taskcard:underline" style={{ color: "var(--text-primary)" }}>
                                  {msg.taskCard.title}
                                </span>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {msg.taskCard.projectName && (
                                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[4px]" style={{ color: "var(--accent-primary)", background: "var(--accent-primary-subtle)" }}>
                                      {msg.taskCard.projectName}
                                    </span>
                                  )}
                                  {msg.taskCard.status && (
                                    <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{msg.taskCard.status}</span>
                                  )}
                                  {msg.taskCard.date && (
                                    <span className="flex items-center gap-0.5 text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                                      <CalendarIcon size={10} />{msg.taskCard.date}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Text bubble */}
                          {msg.text && msg.type !== "task-card" && msg.type !== "image" && msg.type !== "file" && (
                            <div
                              className="px-3.5 py-2 text-[14px] leading-[1.45] whitespace-pre-wrap break-words"
                              style={{
                                borderRadius: bubbleRadius,
                                background: isMine ? "var(--accent-primary)" : "var(--neutral-100)",
                                color: isMine ? "white" : "var(--text-primary)",
                              }}
                            >
                              {msg.text}
                              {msg.editedAt && (
                                <span className="text-[9px] ml-1.5" style={{ opacity: 0.6 }}>(edited)</span>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {/* Reactions */}
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={`flex flex-wrap items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                          {msg.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => onReact(msg.id, r.emoji)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                              style={{
                                background: r.userIds.includes(myId) ? "var(--accent-primary-subtle)" : "var(--neutral-100)",
                                border: r.userIds.includes(myId) ? "1px solid var(--accent-primary)" : "1px solid var(--border-default)",
                              }}
                            >
                              {r.emoji}
                              <span className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>{r.userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Timestamp — shown on group tail */}
                      {isGroupTail && (
                        <p className={`text-[10px] mt-0.5 ${isMine ? "text-right" : "text-left"}`} style={{ color: "var(--text-quaternary)" }}>
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          </>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 px-3 pb-3 pt-2" style={{ background: "var(--page-bg)" }}>
        {/* Reply preview */}
        {replyTo && (
          <div
            className="flex items-center gap-2 px-3.5 py-2 mb-2 rounded-[12px] mx-0.5"
            style={{ background: "var(--neutral-100)" }}
          >
            <ArrowBendUpLeft size={14} style={{ color: "var(--accent-primary)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold" style={{ color: "var(--accent-primary)" }}>
                Replying to {getUserInfo(replyTo.senderId).name}
              </p>
              <p className="text-[12px] truncate" style={{ color: "var(--text-quaternary)" }}>
                {replyTo.text}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-0.5 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.06]" style={{ color: "var(--text-quaternary)" }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* Edit indicator */}
        {editingMsg && (
          <div
            className="flex items-center gap-2 px-3.5 py-2 mb-2 rounded-[12px] mx-0.5"
            style={{ background: "#FEF3C7" }}
          >
            <PencilSimple size={14} style={{ color: "#D97706" }} />
            <p className="flex-1 text-[12px]" style={{ color: "#92400E" }}>
              Editing message
            </p>
            <button onClick={() => { setEditingMsg(null); setInput(""); }} className="p-0.5 rounded-full hover:bg-black/[0.06]" style={{ color: "#92400E" }}>
              <X size={13} />
            </button>
          </div>
        )}

        <div
          className="flex items-end gap-1.5 rounded-[22px] pl-2 pr-1.5 py-1.5"
          style={{
            background: "var(--neutral-100)",
            boxShadow: composerDropHighlight ? "0 0 0 2px var(--accent-primary)" : undefined,
          }}
          onDragOver={(e) => {
            if (hasDragData(e) || dragging) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setComposerDropHighlight(true);
            }
          }}
          onDragLeave={() => setComposerDropHighlight(false)}
          onDrop={(e) => {
            e.preventDefault();
            setComposerDropHighlight(false);
            const payload = getDragData(e) || dragging;
            if (payload) {
              if (payload.type === "task") {
                onSend(payload.title, {
                  type: "task-card",
                  taskCard: { taskId: payload.id, title: payload.title, projectName: payload.projectName, status: payload.taskStatus, date: payload.taskDate },
                } as any);
              } else {
                const mention = formatMention(payload);
                setInput((prev) => prev ? prev + " " + mention + " " : mention + " ");
                setTimeout(() => inputRef.current?.focus(), 20);
              }
            }
          }}
        >
          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-40"
            style={{ color: "var(--text-tertiary)" }}
            title="Attach file"
          >
            {uploading ? (
              <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--text-quaternary)", borderTopColor: "transparent" }} />
            ) : (
              <Plus size={20} weight="bold" />
            )}
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-[14px] leading-[1.5] max-h-[120px] py-[7px]"
            style={{ color: "var(--text-primary)" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() && !editingMsg}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 transition-all disabled:opacity-20"
            style={{ background: "var(--accent-primary)", color: "white" }}
          >
            <PaperPlaneTilt size={16} weight="fill" className="translate-x-[0.5px]" />
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 mt-1.5 px-2">
            {typingUsers.map((uid) => {
              const user = getUserInfo(uid);
              return (
                <div key={uid} className="flex items-center gap-1.5">
                  <div
                    className="w-[14px] h-[14px] rounded-full flex items-center justify-center overflow-hidden"
                    style={{ background: user.color }}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-[6px] font-bold">
                        {user.name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                    {user.name.split(" ")[0]} is typing
                  </span>
                  <span className="flex gap-[2px]">
                    <span className="w-[3px] h-[3px] rounded-full animate-bounce" style={{ background: "var(--text-quaternary)", animationDelay: "0ms" }} />
                    <span className="w-[3px] h-[3px] rounded-full animate-bounce" style={{ background: "var(--text-quaternary)", animationDelay: "150ms" }} />
                    <span className="w-[3px] h-[3px] rounded-full animate-bounce" style={{ background: "var(--text-quaternary)", animationDelay: "300ms" }} />
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && createPortal(
        <div
          className="fixed z-[9999] w-[180px] py-1 rounded-[10px] border overflow-hidden"
          style={{
            top: Math.min(contextMenu.y, window.innerHeight - 200),
            left: Math.min(contextMenu.x, window.innerWidth - 200),
            background: "var(--surface-bg)",
            borderColor: "var(--border-default)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CtxItem icon={ArrowBendUpLeft} label="Reply" onClick={() => { setReplyTo(contextMenu.msg); setContextMenu(null); inputRef.current?.focus(); }} />
          <CtxItem icon={Copy} label="Copy text" onClick={() => { navigator.clipboard.writeText(contextMenu.msg.text); toast.success("Copied"); setContextMenu(null); }} />
          <CtxItem
            icon={PushPin}
            label={pinnedMessages.some((m) => m.id === contextMenu.msg.id) ? "Unpin" : "Pin"}
            onClick={() => { onTogglePin(contextMenu.msg.id); setContextMenu(null); }}
          />
          {contextMenu.msg.senderId === myId && (
            <>
              <CtxItem icon={PencilSimple} label="Edit" onClick={() => { setEditingMsg(contextMenu.msg); setInput(contextMenu.msg.text); setContextMenu(null); inputRef.current?.focus(); }} />
              <div className="my-1 mx-2 h-px" style={{ background: "var(--border-default)" }} />
              <CtxItem icon={Trash} label="Delete" danger onClick={() => { onDelete(contextMenu.msg.id); setContextMenu(null); }} />
            </>
          )}
        </div>,
        document.body
      )}

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollFab && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-6 z-10"
          >
            <button
              onClick={scrollToBottom}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
              style={{ background: "var(--surface-bg)", color: "var(--text-tertiary)", border: "1px solid var(--border-default)" }}
            >
              <ArrowDown size={16} weight="bold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Image lightbox ─── */}
      {lightboxUrl && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)" }} />
          {/* Close button */}
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
            style={{ color: "white" }}
          >
            <X size={20} weight="bold" />
          </button>
          {/* Image */}
          <img
            src={lightboxUrl}
            alt=""
            className="relative z-10 max-w-[90vw] max-h-[85vh] rounded-[10px] shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}

/* ─── Context menu item ─── */
function CtxItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-[7px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
      style={{ fontSize: "13px", color: danger ? "oklch(0.6 0.2 25)" : "var(--text-secondary)" }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function ConvCtxItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-3 py-[7px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
      style={{ fontSize: "13px", color: "var(--text-secondary)" }}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   NEW CHAT MODAL
   ══════════════════════════════��════════════════════════════ */

function NewChatModal({
  teamMembers,
  conversations,
  getOtherUser,
  onSelect,
  onClose,
}: {
  teamMembers: any[];
  conversations: Conversation[];
  getOtherUser: (conv: Conversation) => any;
  onSelect: (userId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return teamMembers
      .filter((m) => !m.isPlaceholder)
      .filter((m) => {
        if (!q) return true;
        return m.displayName.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
      });
  }, [teamMembers, search]);

  const seedTestUser = useCallback(async () => {
    setSeeding(true);
    try {
      const testUsers = [
        { name: "Alex Rivera", email: "alex.rivera@flowos-test.dev" },
        { name: "Jordan Chen", email: "jordan.chen@flowos-test.dev" },
        { name: "Sam Patel", email: "sam.patel@flowos-test.dev" },
      ];
      // Pick one that doesn't already exist as a team member
      const existingEmails = new Set(teamMembers.map((m) => m.email?.toLowerCase()));
      const available = testUsers.filter((u) => !existingEmails.has(u.email));
      const pick = available.length > 0 ? available[0] : testUsers[0];

      const { data, error } = await api.post<{ user: any }>("/chat/seed-test-user", {
        name: pick.name,
        email: pick.email,
      });
      if (error || !data?.user) {
        toast.error("Failed to create test user");
      } else {
        toast.success(`Created test user: ${data.user.name}`);
        // Reload the page data so the new team member appears
        window.location.reload();
      }
    } catch (err) {
      console.error("[Chat] Seed test user error:", err);
      toast.error("Failed to create test user");
    }
    setSeeding(false);
  }, [teamMembers]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-[400px] mx-4"
      >
        <div
          className="rounded-[14px] border overflow-hidden"
          style={{
            background: "var(--surface-bg)",
            borderColor: "var(--border-default)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h3 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            New Conversation
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "var(--text-tertiary)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 px-3 h-[36px] rounded-[8px]" style={{ background: "var(--neutral-100)" }}>
            <MagnifyingGlass size={15} style={{ color: "var(--text-quaternary)" }} />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members…"
              className="flex-1 bg-transparent outline-none text-[13px]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Member list */}
        <div className="max-h-[300px] overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[13px]" style={{ color: "var(--text-quaternary)" }}>
                No team members found
              </p>
              <button
                onClick={seedTestUser}
                disabled={seeding}
                className="mt-3 px-4 py-2 rounded-[8px] text-[12px] font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ background: "var(--accent-primary)" }}
              >
                {seeding ? "Creating…" : "+ Create Test User"}
              </button>
            </div>
          ) : (
            filtered.map((member) => (
              <button
                key={member.userId}
                onClick={() => onSelect(member.userId)}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[8px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              >
                <div
                  className="w-[36px] h-[36px] rounded-full flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: member.avatarColor || "#8B5CF6" }}
                >
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-[12px] font-bold">
                      {member.displayName.split(/\s+/).map((p: string) => p[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[14px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {member.displayName}
                  </p>
                  {member.email && (
                    <p className="text-[11px] truncate" style={{ color: "var(--text-quaternary)" }}>
                      {member.email}
                    </p>
                  )}
                </div>
                {member.role && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] shrink-0" style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}>
                    {member.role}
                  </span>
                )}
              </button>
            ))
          )}

          {/* Seed test user link */}
          <div className="mt-2 pt-2 border-t text-center" style={{ borderColor: "var(--border-default)" }}>
            <button
              onClick={seedTestUser}
              disabled={seeding}
              className="text-[11px] font-medium transition-opacity disabled:opacity-50 hover:underline"
              style={{ color: "var(--text-quaternary)" }}
            >
              {seeding ? "Creating…" : "+ Add a test user for chat"}
            </button>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
}