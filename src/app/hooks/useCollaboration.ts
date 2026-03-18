/* ═══════════════════════════════════════════════════════════
   USE COLLABORATION — Supabase Realtime hook for document
   collaboration (D12). Provides:
   - Document-scoped Realtime channel
   - Broadcast block/title/meta operations
   - Presence tracking (who's viewing)
   - Remote cursor/focus tracking
   - Connection status
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";
import type { DocBlock, WorkspaceDoc } from "../lib/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

/* ─── Types ─── */
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface CollabUser {
  id: string;
  name: string;
  color: string;
  avatarUrl?: string;
  /** Which block the user is currently focused on */
  focusedBlockId?: string;
  /** Last seen timestamp */
  lastSeen: number;
}

export type CollabOperation =
  | { type: "block_update"; blockId: string; updates: Partial<DocBlock>; ts: number }
  | { type: "block_insert"; block: DocBlock; afterBlockId: string | null; ts: number }
  | { type: "block_delete"; blockId: string; ts: number }
  | { type: "blocks_reorder"; blockIds: string[]; ts: number }
  | { type: "title_change"; title: string; ts: number }
  | { type: "meta_change"; updates: Partial<WorkspaceDoc>; ts: number };

interface UseCollaborationOptions {
  /** Document ID to collaborate on */
  docId: string;
  /** Current user identity */
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  /** Callback when a remote operation arrives */
  onRemoteOperation?: (op: CollabOperation, senderId: string) => void;
  /** Whether collab is enabled (false disables the channel) */
  enabled?: boolean;
}

interface UseCollaborationReturn {
  /** Current connection status */
  status: ConnectionStatus;
  /** List of collaborators currently viewing the document */
  collaborators: CollabUser[];
  /** Send a block update to remote collaborators */
  broadcastBlockUpdate: (blockId: string, updates: Partial<DocBlock>) => void;
  /** Send a block insertion */
  broadcastBlockInsert: (block: DocBlock, afterBlockId: string | null) => void;
  /** Send a block deletion */
  broadcastBlockDelete: (blockId: string) => void;
  /** Send a block reorder */
  broadcastBlocksReorder: (blockIds: string[]) => void;
  /** Send a title change */
  broadcastTitleChange: (title: string) => void;
  /** Send a metadata change */
  broadcastMetaChange: (updates: Partial<WorkspaceDoc>) => void;
  /** Update which block we're focused on */
  updateFocusedBlock: (blockId: string | null) => void;
}

/* ─── User Color Palette ─── */
const COLLAB_COLORS = [
  "oklch(0.65 0.2 25)",   // red
  "oklch(0.65 0.18 145)", // green
  "oklch(0.6 0.2 260)",   // blue
  "oklch(0.65 0.2 300)",  // purple
  "oklch(0.7 0.18 50)",   // orange
  "oklch(0.65 0.18 180)", // teal
  "oklch(0.6 0.2 330)",   // pink
  "oklch(0.7 0.16 85)",   // yellow
];

function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length];
}

/* ─── Hook ─── */
export function useCollaboration({
  docId,
  userId,
  userName,
  userAvatarUrl,
  onRemoteOperation,
  enabled = true,
}: UseCollaborationOptions): UseCollaborationReturn {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [collaborators, setCollaborators] = useState<CollabUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRemoteOpRef = useRef(onRemoteOperation);
  onRemoteOpRef.current = onRemoteOperation;

  // Debounce refs for broadcasting
  const focusDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const broadcastDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingBroadcasts = useRef<CollabOperation[]>([]);

  const myColor = useMemo(() => getUserColor(userId), [userId]);

  // Channel lifecycle
  useEffect(() => {
    if (!enabled || !docId || !isSupabaseConfigured()) {
      setStatus("disconnected");
      setCollaborators([]);
      return;
    }

    const supabase = getSupabaseClient();
    const channelName = `doc:${docId}`;
    setStatus("connecting");

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: userId },
        broadcast: { self: false },
      },
    });

    // Presence: track who's viewing
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState();
      const users: CollabUser[] = [];
      for (const [key, entries] of Object.entries(presenceState)) {
        if (key === userId) continue; // skip self
        const entry = (entries as any[])[0];
        if (entry) {
          users.push({
            id: key,
            name: entry.name || "Anonymous",
            color: entry.color || getUserColor(key),
            avatarUrl: entry.avatarUrl,
            focusedBlockId: entry.focusedBlockId,
            lastSeen: entry.lastSeen || Date.now(),
          });
        }
      }
      setCollaborators(users);
    });

    // Broadcast: listen for remote operations
    channel.on("broadcast", { event: "op" }, ({ payload }) => {
      if (!payload || payload.senderId === userId) return;
      const op = payload.operation as CollabOperation;
      if (op) {
        onRemoteOpRef.current?.(op, payload.senderId);
      }
    });

    // Focus updates via broadcast
    channel.on("broadcast", { event: "focus" }, ({ payload }) => {
      if (!payload || payload.senderId === userId) return;
      setCollaborators((prev) =>
        prev.map((c) =>
          c.id === payload.senderId
            ? { ...c, focusedBlockId: payload.blockId || undefined }
            : c
        )
      );
    });

    // Subscribe
    channel
      .subscribe(async (channelStatus) => {
        if (channelStatus === "SUBSCRIBED") {
          setStatus("connected");
          // Track our presence
          await channel.track({
            name: userName,
            color: myColor,
            avatarUrl: userAvatarUrl,
            focusedBlockId: null,
            lastSeen: Date.now(),
          });
        } else if (channelStatus === "CLOSED" || channelStatus === "CHANNEL_ERROR") {
          setStatus("disconnected");
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setStatus("disconnected");
      setCollaborators([]);
    };
  }, [docId, userId, userName, userAvatarUrl, myColor, enabled]);

  // Broadcast helper — batches operations with 50ms debounce
  const broadcast = useCallback((op: CollabOperation) => {
    const ch = channelRef.current;
    if (!ch || status !== "connected") return;

    ch.httpSend("op", {
      senderId: userId,
      operation: op,
    });
  }, [status, userId]);

  const broadcastBlockUpdate = useCallback(
    (blockId: string, updates: Partial<DocBlock>) => {
      broadcast({ type: "block_update", blockId, updates, ts: Date.now() });
    },
    [broadcast]
  );

  const broadcastBlockInsert = useCallback(
    (block: DocBlock, afterBlockId: string | null) => {
      broadcast({ type: "block_insert", block, afterBlockId, ts: Date.now() });
    },
    [broadcast]
  );

  const broadcastBlockDelete = useCallback(
    (blockId: string) => {
      broadcast({ type: "block_delete", blockId, ts: Date.now() });
    },
    [broadcast]
  );

  const broadcastBlocksReorder = useCallback(
    (blockIds: string[]) => {
      broadcast({ type: "blocks_reorder", blockIds, ts: Date.now() });
    },
    [broadcast]
  );

  const broadcastTitleChange = useCallback(
    (title: string) => {
      broadcast({ type: "title_change", title, ts: Date.now() });
    },
    [broadcast]
  );

  const broadcastMetaChange = useCallback(
    (updates: Partial<WorkspaceDoc>) => {
      broadcast({ type: "meta_change", updates, ts: Date.now() });
    },
    [broadcast]
  );

  // Focus tracking — debounced to 100ms
  const updateFocusedBlock = useCallback(
    (blockId: string | null) => {
      if (focusDebounceRef.current) clearTimeout(focusDebounceRef.current);
      focusDebounceRef.current = setTimeout(() => {
        const ch = channelRef.current;
        if (!ch || status !== "connected") return;
        ch.httpSend("focus", { senderId: userId, blockId });
        // Also update presence
        ch.track({
          name: userName,
          color: myColor,
          avatarUrl: userAvatarUrl,
          focusedBlockId: blockId,
          lastSeen: Date.now(),
        });
      }, 100);
    },
    [status, userId, userName, myColor, userAvatarUrl]
  );

  return {
    status,
    collaborators,
    broadcastBlockUpdate,
    broadcastBlockInsert,
    broadcastBlockDelete,
    broadcastBlocksReorder,
    broadcastTitleChange,
    broadcastMetaChange,
    updateFocusedBlock,
  };
}