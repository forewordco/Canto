import { useState, useEffect, useCallback, useRef } from "react";
import {
  Timer,
  Play,
  Stop,
  X,
  Clock,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";

/* ═══════════════════════════════════════════════════════════
   FLOATING TIMER — Persistent time tracker
   Desktop: Compact row in sidebar footer
   Mobile: Floating pill anchored above bottom tabs
   ═══════════════════════════════════════════════════════════ */

interface TimerState {
  isRunning: boolean;
  taskId: string | null;
  taskTitle: string;
  projectName: string;
  startedAt: number | null; // epoch ms
  elapsed: number; // seconds accumulated before current run
}

const INITIAL_STATE: TimerState = {
  isRunning: false,
  taskId: null,
  taskTitle: "",
  projectName: "",
  startedAt: null,
  elapsed: 0,
};

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Desktop timer for sidebar footer */
export function SidebarTimer({ collapsed }: { collapsed: boolean }) {
  const { timer, currentElapsed, start, stop, reset } = useTimer();

  if (!timer.isRunning && timer.elapsed === 0) {
    // No active timer — show start button
    return (
      <button
        onClick={() =>
          start("demo-task", "Quick timer", "General")
        }
        className={`flex items-center gap-2.5 w-full rounded-[6px] px-2.5 py-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors ${collapsed ? "justify-center" : ""}`}
        style={{ color: "var(--text-tertiary)", fontSize: "13px" }}
        title="Start timer"
      >
        <Timer className="w-4 h-4 shrink-0" />
        {!collapsed && <span>Start Timer</span>}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-[6px] px-2.5 py-2 ${collapsed ? "justify-center flex-col gap-1" : ""}`}
      style={{
        background: "var(--accent-primary-subtle)",
      }}
    >
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: timer.isRunning
            ? "oklch(0.65 0.18 155)"
            : "oklch(0.7 0.18 25)",
          animation: timer.isRunning ? "pulse 2s infinite" : undefined,
        }}
      />

      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p
            className="truncate"
            style={{
              color: "var(--accent-primary)",
              fontSize: "13px",
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(currentElapsed)}
          </p>
          <p
            className="truncate"
            style={{
              color: "var(--text-tertiary)",
              fontSize: "11px",
            }}
          >
            {timer.taskTitle || "Timer"}
          </p>
        </div>
      )}

      {collapsed && (
        <span
          style={{
            color: "var(--accent-primary)",
            fontSize: "10px",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(currentElapsed)}
        </span>
      )}

      <div className={`flex items-center ${collapsed ? "gap-0" : "gap-0.5"}`}>
        {timer.isRunning ? (
          <button
            onClick={stop}
            className="p-1 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "oklch(0.7 0.18 25)" }}
            title="Stop"
          >
            <Stop className="w-3.5 h-3.5" weight="fill" />
          </button>
        ) : (
          <button
            onClick={() =>
              start(
                timer.taskId || "demo-task",
                timer.taskTitle || "Timer",
                timer.projectName || ""
              )
            }
            className="p-1 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "oklch(0.65 0.18 155)" }}
            title="Resume"
          >
            <Play className="w-3.5 h-3.5" weight="fill" />
          </button>
        )}

        {!collapsed && (
          <button
            onClick={reset}
            className="p-1 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-quaternary)" }}
            title="Discard"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Mobile floating timer pill — shown above bottom tabs */
export function MobileFloatingTimer() {
  const { timer, currentElapsed, start, stop, reset } = useTimer();
  const [expanded, setExpanded] = useState(false);

  // Don't render if no timer active
  if (!timer.isRunning && timer.elapsed === 0) return null;

  return (
    <div
      className="mx-3 mb-2 rounded-[10px] overflow-hidden shadow-lg"
      style={{
        background: "var(--surface-bg)",
        border: "1px solid var(--border-default)",
        boxShadow: "0 4px 16px oklch(0 0 0 / 0.08), 0 1px 4px oklch(0 0 0 / 0.04)",
      }}
    >
      {/* Timer bar */}
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            background: timer.isRunning
              ? "oklch(0.65 0.18 155)"
              : "oklch(0.7 0.18 25)",
            animation: timer.isRunning ? "pulse 2s infinite" : undefined,
          }}
        />

        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2">
            <span
              style={{
                color: "var(--accent-primary)",
                fontSize: "15px",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatTime(currentElapsed)}
            </span>
            <span
              className="truncate"
              style={{
                color: "var(--text-tertiary)",
                fontSize: "12px",
              }}
            >
              {timer.taskTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {timer.isRunning ? (
            <button
              onClick={stop}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: "oklch(0.7 0.18 25 / 0.1)",
                color: "oklch(0.7 0.18 25)",
              }}
            >
              <Stop className="w-4 h-4" weight="fill" />
            </button>
          ) : (
            <button
              onClick={() =>
                start(
                  timer.taskId || "demo-task",
                  timer.taskTitle || "Timer",
                  timer.projectName || ""
                )
              }
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: "oklch(0.65 0.18 155 / 0.1)",
                color: "oklch(0.65 0.18 155)",
              }}
            >
              <Play className="w-4 h-4" weight="fill" />
            </button>
          )}
          <button
            onClick={reset}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{
              color: "var(--text-quaternary)",
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className="px-3.5 pb-3 pt-1 border-t"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
            <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
              {timer.projectName || "No project"}
            </span>
          </div>
          <p
            className="mt-1"
            style={{
              color: "var(--text-quaternary)",
              fontSize: "11px",
            }}
          >
            Started {timer.startedAt ? new Date(timer.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TIMER HOOK — Shared timer state (singleton via module scope)
   In a real app this would use a context + persist to KV.
   ═══════════════════════════════════════════════════════════ */

// Module-level state so all instances share the same timer
let globalTimer: TimerState = { ...INITIAL_STATE };
let listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function useTimer() {
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to global timer changes
  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Tick every second when running
  useEffect(() => {
    if (globalTimer.isRunning) {
      intervalRef.current = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [globalTimer.isRunning]);

  const currentElapsed = globalTimer.isRunning && globalTimer.startedAt
    ? globalTimer.elapsed + Math.floor((Date.now() - globalTimer.startedAt) / 1000)
    : globalTimer.elapsed;

  const start = useCallback((taskId: string, taskTitle: string, projectName: string) => {
    globalTimer = {
      ...globalTimer,
      isRunning: true,
      taskId,
      taskTitle,
      projectName,
      startedAt: Date.now(),
    };
    notifyListeners();
  }, []);

  const stop = useCallback(() => {
    if (globalTimer.isRunning && globalTimer.startedAt) {
      const additionalSeconds = Math.floor((Date.now() - globalTimer.startedAt) / 1000);
      globalTimer = {
        ...globalTimer,
        isRunning: false,
        elapsed: globalTimer.elapsed + additionalSeconds,
        startedAt: null,
      };
    } else {
      globalTimer = { ...globalTimer, isRunning: false, startedAt: null };
    }
    notifyListeners();
  }, []);

  const reset = useCallback(() => {
    globalTimer = { ...INITIAL_STATE };
    notifyListeners();
  }, []);

  return { timer: globalTimer, currentElapsed, start, stop, reset };
}

export { useTimer, formatTime };