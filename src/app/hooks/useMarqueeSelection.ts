/* ═══════════════════════════════════════════════════════════
   useMarqueeSelection — Reusable drag-to-select hook
   
   Draws a marquee rectangle and returns which items are selected
   based on AABB intersection with elements matching a data attribute.
   
   Usage:
     const { selectedIds, setSelectedIds, containerRef, marqueeOverlay } = useMarqueeSelection({
       itemAttribute: 'data-selectable-id',
       enabled: true,
     });
   
   Each selectable item needs: <div data-selectable-id="item-123" />
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect, type RefObject } from "react";

interface MarqueeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface UseMarqueeSelectionOptions {
  /** Data attribute on selectable items, e.g. "data-selectable-id" */
  itemAttribute?: string;
  /** Disable marquee selection */
  enabled?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (ids: Set<string>) => void;
  /** Elements/selectors to ignore when starting a drag */
  ignoreSelectors?: string[];
}

interface UseMarqueeSelectionReturn {
  /** Currently selected item IDs */
  selectedIds: Set<string>;
  /** Manually set selected IDs */
  setSelectedIds: (ids: Set<string>) => void;
  /** Ref to attach to the scrollable container */
  containerRef: RefObject<HTMLDivElement | null>;
  /** onMouseDown handler — attach to the container or a wrapper */
  handleMouseDown: (e: React.MouseEvent) => void;
  /** Marquee overlay React element (render inside the container) */
  marqueeOverlay: React.ReactNode;
  /** Whether a marquee drag is currently active */
  isSelecting: boolean;
}

export function useMarqueeSelection({
  itemAttribute = "data-selectable-id",
  enabled = true,
  onSelectionChange,
  ignoreSelectors = [],
}: UseMarqueeSelectionOptions = {}): UseMarqueeSelectionReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedIds, setSelectedIdsState] = useState<Set<string>>(new Set());
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const marqueeState = useRef<{
    active: boolean;
    originX: number;
    originY: number;
    scrollTop: number;
    scrollLeft: number;
    moved: boolean;
  } | null>(null);

  const onSelectionChangeRef = useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;

  const setSelectedIds = useCallback((ids: Set<string>) => {
    setSelectedIdsState(ids);
    onSelectionChangeRef.current?.(ids);
  }, []);

  /* ─── Mouse down: start marquee on empty space ─── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled || e.button !== 0) return;
    const target = e.target as HTMLElement;
    const container = containerRef.current;
    if (!container) return;

    // Don't start on interactive elements
    if (target.closest("button") || target.closest("a") || target.closest("input") || target.closest("textarea") || target.closest("[contenteditable]") || target.closest("select")) return;

    // Don't start on ignored selectors
    for (const sel of ignoreSelectors) {
      if (target.closest(sel)) return;
    }

    // Only start on: the container itself, or empty space within container
    // but NOT on the inner content of a selectable item (allow click-through for navigation)
    const selectableItem = target.closest(`[${itemAttribute}]`);
    if (selectableItem) {
      // If clicking on a selectable item, treat as toggle-select if shift/meta, else skip
      // (The items themselves handle their own click for navigation)
      return;
    }

    e.preventDefault();
    const containerRect = container.getBoundingClientRect();
    const scrollParent = getScrollParent(container);
    marqueeState.current = {
      active: true,
      originX: e.clientX - containerRect.left + container.scrollLeft,
      originY: e.clientY - containerRect.top + (scrollParent?.scrollTop || 0) - (scrollParent === container ? 0 : scrollParent ? scrollParent.getBoundingClientRect().top - containerRect.top : 0),
      scrollTop: scrollParent?.scrollTop || 0,
      scrollLeft: container.scrollLeft,
      moved: false,
    };

    // Clear selection unless shift held
    if (!e.shiftKey && !e.metaKey) {
      setSelectedIds(new Set());
    }
    setMarqueeRect(null);
    setIsSelecting(true);
  }, [enabled, itemAttribute, ignoreSelectors, setSelectedIds]);

  /* ─── Mouse move / mouse up (global listeners) ─── */
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!marqueeState.current?.active) return;
      const container = containerRef.current;
      if (!container) return;

      marqueeState.current.moved = true;
      e.preventDefault();
      window.getSelection()?.removeAllRanges();

      const containerRect = container.getBoundingClientRect();
      const curX = e.clientX - containerRect.left + container.scrollLeft;
      const curY = e.clientY - containerRect.top + container.scrollTop;
      const ox = marqueeState.current.originX;
      const oy = marqueeState.current.originY;
      const rect: MarqueeRect = {
        x: Math.min(ox, curX),
        y: Math.min(oy, curY),
        w: Math.abs(curX - ox),
        h: Math.abs(curY - oy),
      };
      setMarqueeRect(rect);

      // Find intersecting items
      const hitIds = new Set<string>();
      const items = container.querySelectorAll(`[${itemAttribute}]`);
      for (const item of items) {
        const el = item as HTMLElement;
        const id = el.getAttribute(itemAttribute);
        if (!id) continue;
        const bRect = el.getBoundingClientRect();
        const bx = bRect.left - containerRect.left + container.scrollLeft;
        const by = bRect.top - containerRect.top + container.scrollTop;
        const bw = bRect.width;
        const bh = bRect.height;
        // AABB intersection
        if (rect.x < bx + bw && rect.x + rect.w > bx && rect.y < by + bh && rect.y + rect.h > by) {
          hitIds.add(id);
        }
      }
      setSelectedIdsState(hitIds);
      onSelectionChangeRef.current?.(hitIds);
    };

    const handleMouseUp = () => {
      if (marqueeState.current?.active) {
        marqueeState.current = null;
        setMarqueeRect(null);
        setIsSelecting(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled, itemAttribute]);

  /* ─── Click outside to clear ─── */
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent) => {
      if (selectedIds.size === 0) return;
      const container = containerRef.current;
      if (!container) return;
      // If clicking inside the container on empty space (not a selectable item), clear
      if (container.contains(e.target as Node) && !(e.target as HTMLElement).closest(`[${itemAttribute}]`)) {
        // Don't clear if it's the start of a new marquee drag (handled by mousedown)
        return;
      }
      // If clicking outside the container entirely, clear
      if (!container.contains(e.target as Node)) {
        setSelectedIds(new Set());
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [enabled, selectedIds.size, itemAttribute, setSelectedIds]);

  /* ─── Escape to clear ─── */
  useEffect(() => {
    if (!enabled || selectedIds.size === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedIds(new Set());
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, selectedIds.size, setSelectedIds]);

  /* ─── Marquee overlay element ─── */
  const marqueeOverlay = marqueeRect && marqueeRect.w > 2 && marqueeRect.h > 2 ? (
    <div
      className="absolute pointer-events-none rounded-[4px] z-20"
      style={{
        left: marqueeRect.x,
        top: marqueeRect.y,
        width: marqueeRect.w,
        height: marqueeRect.h,
        background: "oklch(0.85 0.025 250 / 0.12)",
        border: "1px solid oklch(0.7 0.035 250 / 0.3)",
      }}
    />
  ) : null;

  return {
    selectedIds,
    setSelectedIds,
    containerRef,
    handleMouseDown,
    marqueeOverlay,
    isSelecting,
  };
}

/* ─── Helper: find scroll parent ─── */
function getScrollParent(el: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current) {
    const overflow = window.getComputedStyle(current).overflowY;
    if (overflow === "auto" || overflow === "scroll") return current;
    current = current.parentElement;
  }
  return null;
}
