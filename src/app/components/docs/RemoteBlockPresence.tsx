/* ===================================================================
   REMOTE BLOCK PRESENCE — Shows colored indicator next to blocks
   that remote collaborators are currently editing (D12).
   =================================================================== */

import { motion, AnimatePresence } from "motion/react";
import type { CollabUser } from "../../hooks/useCollaboration";

interface RemoteBlockPresenceProps {
  /** Collaborators currently focused on this block */
  usersOnBlock: CollabUser[];
}

export function RemoteBlockPresence({ usersOnBlock }: RemoteBlockPresenceProps) {
  if (usersOnBlock.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -4 }}
        transition={{ duration: 0.15 }}
        className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 items-center"
      >
        {usersOnBlock.slice(0, 3).map((user) => (
          <div key={user.id} className="relative group/presence">
            <div
              className="w-2.5 h-2.5 rounded-full transition-transform hover:scale-150"
              style={{ background: user.color }}
            />
            {/* Name tooltip */}
            <div
              className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-[4px] whitespace-nowrap pointer-events-none opacity-0 group-hover/presence:opacity-100 transition-opacity z-50"
              style={{
                background: "oklch(0.18 0.01 260)",
                fontSize: "10px",
                fontWeight: 600,
                color: "white",
              }}
            >
              {user.name}
            </div>
          </div>
        ))}
        {usersOnBlock.length > 3 && (
          <span
            style={{
              fontSize: "8px",
              fontWeight: 700,
              color: "var(--text-quaternary)",
            }}
          >
            +{usersOnBlock.length - 3}
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Utility: get collaborators focused on a specific block.
 */
export function getCollabsOnBlock(blockId: string, collaborators: CollabUser[]): CollabUser[] {
  return collaborators.filter((c) => c.focusedBlockId === blockId);
}

/**
 * Colored left border for blocks with remote collaborators.
 */
export function getRemoteBlockBorderStyle(usersOnBlock: CollabUser[]): React.CSSProperties | undefined {
  if (usersOnBlock.length === 0) return undefined;
  const color = usersOnBlock[0].color;
  return {
    borderLeft: `2px solid ${color}`,
    paddingLeft: "6px",
    marginLeft: "-8px",
    transition: "border-color 0.2s, padding-left 0.2s",
  };
}
