/* ═══════════════════════════════════════════════════════════
   PULL TO REFRESH — Mobile-native pull-to-refresh gesture.
   
   Shows a spring-animated spinner when the user pulls down
   on the content. Triggers onRefresh callback on release.
   Only active on touch devices (mobile/tablet).
   
   Phase 4 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, type ReactNode } from "react";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { motion } from "motion/react";

const PULL_THRESHOLD = 70;
const MAX_PULL = 120;

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || refreshing) return;

      // Only trigger when scrolled to top
      const scrollParent = containerRef.current?.closest("[data-scroll]") || containerRef.current?.parentElement;
      if (scrollParent && scrollParent.scrollTop > 5) return;

      touchStartY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [disabled, refreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || disabled || refreshing) return;

      const dy = e.touches[0].clientY - touchStartY.current;

      if (dy <= 0) {
        setPullDistance(0);
        return;
      }

      // Dampened pull with logarithmic resistance
      const dampened = Math.min(MAX_PULL, dy * 0.5);
      setPullDistance(dampened);
    },
    [disabled, refreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(PULL_THRESHOLD * 0.6); // Hold at indicator position

      try {
        await onRefresh();
      } catch (err) {
        console.error("[PullToRefresh] Error:", err);
      }

      setRefreshing(false);
    }

    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const showIndicator = pullDistance > 10 || refreshing;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            height: `${pullDistance}px`,
            transition: pulling.current ? "none" : "height 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          <motion.div
            animate={{
              rotate: refreshing ? 360 : progress * 270,
              scale: refreshing ? 1 : 0.5 + progress * 0.5,
              opacity: refreshing ? 1 : Math.min(1, progress * 1.5),
            }}
            transition={
              refreshing
                ? { rotate: { duration: 0.8, repeat: Infinity, ease: "linear" } }
                : { duration: 0 }
            }
          >
            <ArrowsClockwise
              className="w-5 h-5"
              weight="bold"
              style={{
                color: progress >= 1 || refreshing
                  ? "var(--accent-primary)"
                  : "var(--text-quaternary)",
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: showIndicator && !refreshing ? undefined : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;