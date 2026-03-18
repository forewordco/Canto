/* ═══════════════════════════════════════════════════════════
   HAPTICS — Lightweight haptic feedback utilities.

   Uses the Vibration API when available (Android Chrome,
   some PWA contexts). Falls back silently on unsupported
   platforms (iOS Safari, desktop browsers).

   Phase 11 mobile optimization (P11-7: haptic feedback).
   ═══════════════════════════════════════════════════════════ */

import { useCallback } from "react";

/** Intensity presets (vibration duration in ms) */
const HAPTIC_PATTERNS = {
  /** Light tap — checkbox, toggle, small UI feedback */
  light: [10],
  /** Medium tap — completing a task, long-press trigger */
  medium: [15],
  /** Heavy tap — destructive action confirmation */
  heavy: [25],
  /** Success — task completed, item saved */
  success: [10, 30, 10],
  /** Warning — about to delete, error */
  warning: [15, 50, 15, 50, 15],
  /** Selection — picking an item from a list */
  selection: [8],
} as const;

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

/** Check if vibration is supported */
function canVibrate(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/** Fire a haptic pattern. No-ops silently on unsupported platforms. */
export function haptic(pattern: HapticPattern = "light"): void {
  if (canVibrate()) {
    try {
      navigator.vibrate(HAPTIC_PATTERNS[pattern]);
    } catch {
      // Silently fail
    }
  }
}

/**
 * React hook returning a stable `triggerHaptic` callback.
 * Usage: `const triggerHaptic = useHaptic();`
 *        `triggerHaptic("medium");`
 */
export function useHaptic() {
  return useCallback((pattern: HapticPattern = "light") => {
    haptic(pattern);
  }, []);
}
