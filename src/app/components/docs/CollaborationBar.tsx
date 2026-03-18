/* ===================================================================
   COLLABORATION BAR — Shows connected collaborators, connection
   status, and share action in the document editor header (D12).
   =================================================================== */

import {
  WifiHigh,
  WifiSlash,
  CircleNotch,
  Users,
  ShareNetwork,
  Eye,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import type { CollabUser, ConnectionStatus } from "../../hooks/useCollaboration";

interface CollaborationBarProps {
  status: ConnectionStatus;
  collaborators: CollabUser[];
  onShare?: () => void;
}

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; icon: React.ElementType }> = {
  connected: { label: "Live", color: "oklch(0.65 0.2 145)", icon: WifiHigh },
  connecting: { label: "Connecting", color: "oklch(0.7 0.16 85)", icon: CircleNotch },
  disconnected: { label: "Offline", color: "oklch(0.55 0 0)", icon: WifiSlash },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CollaborationBar({ status, collaborators, onShare }: CollaborationBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = STATUS_CONFIG[status];
  const visibleCount = Math.min(collaborators.length, 4);
  const overflow = collaborators.length - visibleCount;

  return (
    <div className="flex items-center gap-1.5">
      {/* Collaborator avatars */}
      {collaborators.length > 0 && (
        <div
          className="relative flex items-center"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex -space-x-1.5">
            {collaborators.slice(0, visibleCount).map((user) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="relative"
                title={user.name}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover"
                    style={{ border: `2px solid ${user.color}` }}
                  />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{
                      background: user.color,
                      border: "2px solid white",
                      fontSize: "9px",
                      fontWeight: 700,
                      color: "white",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                )}
                {/* Active editing indicator */}
                {user.focusedBlockId && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                    style={{
                      background: user.color,
                      border: "1.5px solid white",
                    }}
                  />
                )}
              </motion.div>
            ))}
            {overflow > 0 && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  background: "var(--neutral-200)",
                  border: "2px solid white",
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                }}
              >
                +{overflow}
              </div>
            )}
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full right-0 mt-2 z-50 rounded-[8px] shadow-xl py-2 px-1 min-w-[180px]"
                style={{
                  background: "oklch(0.18 0.01 260)",
                  border: "1px solid oklch(0.28 0.01 260)",
                }}
              >
                <p
                  className="px-2.5 pb-1.5 mb-1"
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "oklch(0.55 0 0)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid oklch(0.25 0.01 260)",
                  }}
                >
                  <Users className="w-3 h-3 inline mr-1 -mt-0.5" />
                  {collaborators.length} collaborator{collaborators.length !== 1 ? "s" : ""}
                </p>
                {collaborators.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 px-2.5 py-1">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: user.color }}
                    />
                    <span
                      className="truncate"
                      style={{ fontSize: "12px", color: "oklch(0.85 0 0)", fontWeight: 500 }}
                    >
                      {user.name}
                    </span>
                    {user.focusedBlockId && (
                      <Eye
                        className="w-3 h-3 shrink-0 ml-auto"
                        style={{ color: user.color }}
                        weight="bold"
                      />
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Connection status indicator */}
      <div
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
        style={{ background: `color-mix(in oklch, ${config.color} 12%, transparent)` }}
        title={`Status: ${config.label}`}
      >
        <config.icon
          className={`w-3 h-3 ${status === "connecting" ? "animate-spin" : ""}`}
          style={{ color: config.color }}
          weight="bold"
        />
        <span style={{ fontSize: "10px", fontWeight: 600, color: config.color }}>
          {config.label}
        </span>
      </div>

      {/* Share button */}
      {onShare && (
        <button
          onClick={onShare}
          className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04]"
          style={{ color: "var(--text-quaternary)" }}
          title="Share document"
        >
          <ShareNetwork className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
