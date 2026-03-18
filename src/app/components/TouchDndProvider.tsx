/* ===================================================================
   TOUCH-AWARE DND PROVIDER
   
   Wraps react-dnd's DndProvider with automatic backend selection:
   - Touch devices (mobile/tablet) -> TouchBackend with delay for scroll
   - Desktop -> HTML5Backend
   
   Phase 11 mobile optimization (P11-3).
   =================================================================== */

import { useMemo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

/** Detect if the device supports touch (coarse pointer = finger) */
function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

interface TouchDndProviderProps {
  children: React.ReactNode;
  /** Extra delay before drag starts on touch (ms). Default 200. */
  touchDelay?: number;
}

/**
 * Drop-in replacement for `<DndProvider backend={HTML5Backend}>`.
 * Automatically selects touch backend on mobile/tablet devices.
 */
export function TouchDndProvider({ children, touchDelay = 200 }: TouchDndProviderProps) {
  const isTouch = useMemo(() => isTouchDevice(), []);

  const backendOptions = useMemo(
    () =>
      isTouch
        ? {
            // Delay before drag starts — allows normal scrolling
            delayTouchStart: touchDelay,
            // Enable mouse events for hybrid devices (Surface, iPad + keyboard)
            enableMouseEvents: true,
            // Ignore native HTML5 drag to prevent conflicts
            enableHoverOutsideTarget: true,
          }
        : undefined,
    [isTouch, touchDelay]
  );

  const backend = isTouch ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={backend} options={backendOptions}>
      {children}
    </DndProvider>
  );
}

export { isTouchDevice };
