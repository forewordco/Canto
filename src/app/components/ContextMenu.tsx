/* ===================================================================
   CONTEXT MENU — Reusable right-click / long-press context menu.

   Renders a positioned floating menu at cursor/touch position.
   Supports separators, icons, danger items, and keyboard dismiss.

   Phase 14-3 of Canto build plan.
   =================================================================== */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

/* ─── Types ─── */

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number } | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/* ─── Component ─── */

export function ContextMenu({ items, position, onSelect, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Adjust position to stay within viewport
  const adjustedPosition = useCallback(() => {
    if (!position) return { x: 0, y: 0 };
    const menuWidth = 200;
    const menuHeight = items.filter((i) => !i.separator).length * 32 + items.filter((i) => i.separator).length * 9 + 8;
    const x = Math.min(position.x, window.innerWidth - menuWidth - 8);
    const y = Math.min(position.y, window.innerHeight - menuHeight - 8);
    return { x: Math.max(4, x), y: Math.max(4, y) };
  }, [position, items]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!position) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [position, onClose]);

  const pos = adjustedPosition();

  return (
    <AnimatePresence>
      {position && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.1 }}
          className="fixed z-[9999] py-1 rounded-[8px] min-w-[180px] max-w-[240px]"
          style={{
            left: `${pos.x}px`,
            top: `${pos.y}px`,
            background: "var(--surface-bg)",
            border: "1px solid #e1e5eb",
            boxShadow: "0 8px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {items.map((item) => {
            if (item.separator) {
              return (
                <div
                  key={item.id}
                  className="mx-2 my-1"
                  style={{ height: "1px", background: "var(--border-default)" }}
                />
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.disabled) return;
                  onSelect(item.id);
                  onClose();
                }}
                disabled={item.disabled}
                className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors ${
                  item.disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                }`}
                style={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: item.danger
                    ? "oklch(0.7 0.18 25)"
                    : item.disabled
                    ? "var(--text-quaternary)"
                    : "var(--text-primary)",
                }}
              >
                {item.icon && (
                  <span className="w-4 h-4 flex items-center justify-center shrink-0" style={{ opacity: 0.8 }}>
                    {item.icon}
                  </span>
                )}
                {item.label}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Hook for context menu state ─── */

export function useContextMenu() {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);

  const open = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPosition({ x: e.clientX, y: e.clientY });
    setTargetId(id);
  }, []);

  const close = useCallback(() => {
    setPosition(null);
    setTargetId(null);
  }, []);

  return { position, targetId, open, close };
}