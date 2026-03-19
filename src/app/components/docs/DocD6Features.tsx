/* ═══════════════════════════════════════════════════════════
   DOC D6 FEATURES — Phase D6: Collaboration & Focus
   1. Inline Block Comments — per-block comment threads
   2. Recently Viewed — track & show recently opened docs
   3. Document Locking — prevent accidental edits
   4. Focus Mode — distraction-free writing
   5. Word Goal Tracker — set & track word count targets
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ChatCircle,
  ChatCircleDots,
  X,
  PaperPlaneTilt,
  Lock,
  LockOpen,
  Eye,
  Target,
  Check,
  Trash,
  ArrowsIn,
  ArrowsOut,
  Clock,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { DocBlock, WorkspaceDoc } from "../../lib/types";

/* ─────────────────────────────────────────────────────────
   1. INLINE BLOCK COMMENTS
   ───────────────────────────────────────────────────────── */

export interface BlockComment {
  id: string;
  blockId: string;
  docId: string;
  author: string;
  text: string;
  createdAt: string;
  resolved?: boolean;
}

/** In-memory comment store */
const commentStore = new Map<string, BlockComment[]>();

function getCommentsForDoc(docId: string): BlockComment[] {
  return commentStore.get(docId) || [];
}

function addComment(docId: string, comment: BlockComment) {
  const existing = commentStore.get(docId) || [];
  existing.push(comment);
  commentStore.set(docId, existing);
}

function resolveComment(docId: string, commentId: string) {
  const existing = commentStore.get(docId) || [];
  const c = existing.find((x) => x.id === commentId);
  if (c) c.resolved = true;
}

function deleteComment(docId: string, commentId: string) {
  const existing = commentStore.get(docId) || [];
  commentStore.set(
    docId,
    existing.filter((x) => x.id !== commentId)
  );
}

export function useBlockComments(docId: string) {
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate((n) => n + 1), []);

  const comments = useMemo(() => getCommentsForDoc(docId), [docId, forceUpdate]);

  const add = useCallback(
    (blockId: string, text: string, author = "You") => {
      addComment(docId, {
        id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        blockId,
        docId,
        author,
        text,
        createdAt: new Date().toISOString(),
      });
      refresh();
    },
    [docId, refresh]
  );

  const resolve = useCallback(
    (commentId: string) => {
      resolveComment(docId, commentId);
      refresh();
    },
    [docId, refresh]
  );

  const remove = useCallback(
    (commentId: string) => {
      deleteComment(docId, commentId);
      refresh();
    },
    [docId, refresh]
  );

  const getBlockComments = useCallback(
    (blockId: string) => getCommentsForDoc(docId).filter((c) => c.blockId === blockId && !c.resolved),
    [docId, forceUpdate]
  );

  const getBlockCommentCount = useCallback(
    (blockId: string) => getCommentsForDoc(docId).filter((c) => c.blockId === blockId && !c.resolved).length,
    [docId, forceUpdate]
  );

  const totalUnresolved = useMemo(
    () => getCommentsForDoc(docId).filter((c) => !c.resolved).length,
    [docId, forceUpdate]
  );

  return { comments: getCommentsForDoc(docId), add, resolve, remove, getBlockComments, getBlockCommentCount, totalUnresolved };
}

/* ── Comment Thread Popover ── */

interface CommentThreadProps {
  docId: string;
  blockId: string;
  onClose: () => void;
  position: { top: number; left: number };
}

export function CommentThread({ docId, blockId, onClose, position }: CommentThreadProps) {
  const { getBlockComments, add, resolve, remove } = useBlockComments(docId);
  const comments = getBlockComments(blockId);
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!newText.trim()) return;
    add(blockId, newText.trim());
    setNewText("");
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      className="fixed z-[150] w-72 rounded-[10px] border shadow-xl overflow-hidden"
      style={{
        top: Math.min(position.top, window.innerHeight - 300),
        left: Math.min(position.left, window.innerWidth - 300),
        background: "var(--surface-bg)",
        borderColor: "var(--border-default)",
      }}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-1.5">
          <ChatCircleDots className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
            Comments{comments.length > 0 ? ` (${comments.length})` : ""}
          </span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-black/5" style={{ color: "var(--text-quaternary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="max-h-48 overflow-y-auto">
          {comments.map((c) => (
            <div key={c.id} className="px-3 py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>{c.author}</span>
                <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>{formatTime(c.createdAt)}</span>
              </div>
              <p className="mt-0.5" style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {c.text}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => resolve(c.id)}
                  className="flex items-center gap-0.5 text-green-600 hover:text-green-700"
                  style={{ fontSize: "10px" }}
                  title="Resolve"
                >
                  <Check className="w-3 h-3" /> Resolve
                </button>
                <button
                  onClick={() => remove(c.id)}
                  className="flex items-center gap-0.5 hover:text-red-500 ml-2"
                  style={{ fontSize: "10px", color: "var(--text-quaternary)" }}
                  title="Delete"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); if (e.key === "Escape") onClose(); }}
          placeholder="Add a comment…"
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: "12px", color: "var(--text-primary)" }}
        />
        <button
          onClick={handleSubmit}
          disabled={!newText.trim()}
          className="p-1 rounded-[4px] transition-colors hover:bg-black/5 disabled:opacity-30"
          style={{ color: "var(--accent-primary)" }}
        >
          <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Comments Panel (sidebar showing all doc comments) ── */

interface CommentsPanelProps {
  docId: string;
  onClose: () => void;
  onScrollToBlock?: (blockId: string) => void;
}

export function CommentsPanel({ docId, onClose, onScrollToBlock }: CommentsPanelProps) {
  const { comments, resolve, remove } = useBlockComments(docId);
  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);
  const [showResolved, setShowResolved] = useState(false);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      className="absolute right-0 top-0 bottom-0 w-72 z-30 border-l flex flex-col"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-10 px-3 shrink-0 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-2">
          <ChatCircleDots className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Comments</span>
          {unresolvedComments.length > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1"
              style={{ background: "var(--accent-primary)", color: "white", fontSize: "10px", fontWeight: 600 }}
            >
              {unresolvedComments.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-quaternary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {unresolvedComments.length === 0 && resolvedComments.length === 0 ? (
          <div className="px-3 py-8 text-center" style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>
            No comments yet.
            <br />
            <span style={{ fontSize: "11px" }}>Hover over a block and click the comment icon to add one.</span>
          </div>
        ) : (
          <>
            {unresolvedComments.map((c) => (
              <div
                key={c.id}
                className="px-3 py-2.5 border-b cursor-pointer hover:bg-black/[0.02]"
                style={{ borderColor: "var(--border-subtle)" }}
                onClick={() => onScrollToBlock?.(c.blockId)}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-primary)" }}>{c.author}</span>
                  <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>{formatTime(c.createdAt)}</span>
                </div>
                <p className="mt-0.5" style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>{c.text}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); resolve(c.id); }}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-green-600 hover:bg-green-50"
                    style={{ fontSize: "10px", fontWeight: 500 }}
                  >
                    <Check className="w-3 h-3" /> Resolve
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(c.id); }}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-red-50"
                    style={{ fontSize: "10px", color: "var(--text-quaternary)" }}
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {/* Resolved section */}
            {resolvedComments.length > 0 && (
              <div className="px-3 py-2">
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-quaternary)" }}
                >
                  {showResolved ? "Hide" : "Show"} {resolvedComments.length} resolved
                </button>
                {showResolved && (
                  <div className="mt-2 space-y-1">
                    {resolvedComments.map((c) => (
                      <div key={c.id} className="px-2 py-1.5 rounded-[5px] opacity-60" style={{ background: "var(--neutral-50)" }}>
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />
                          <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textDecoration: "line-through" }}>{c.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   2. RECENTLY VIEWED
   ───────────────────────────────────────────────────────── */

const RECENTLY_VIEWED_KEY = "canto_recently_viewed_docs";
const MAX_RECENT = 12;

export function trackRecentlyViewed(docId: string) {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    let list: { docId: string; viewedAt: string }[] = raw ? JSON.parse(raw) : [];
    list = list.filter((x) => x.docId !== docId);
    list.unshift({ docId, viewedAt: new Date().toISOString() });
    if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
  } catch {}
}

export function getRecentlyViewed(): { docId: string; viewedAt: string }[] {
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [recent, setRecent] = useState<{ docId: string; viewedAt: string }[]>(() => getRecentlyViewed());

  const track = useCallback((docId: string) => {
    trackRecentlyViewed(docId);
    setRecent(getRecentlyViewed());
  }, []);

  return { recent, track };
}

/* ─────────────────────────────────────────────────────────
   3. DOCUMENT LOCKING
   ───────────────────────────────────────────────────────── */

/** In-memory lock store */
const lockStore = new Set<string>();

export function useDocLock(docId: string) {
  const [locked, setLocked] = useState(() => lockStore.has(docId));

  const toggle = useCallback(() => {
    if (lockStore.has(docId)) {
      lockStore.delete(docId);
      setLocked(false);
    } else {
      lockStore.add(docId);
      setLocked(true);
    }
  }, [docId]);

  return { locked, toggle };
}

/* ── Lock Badge ── */

export function LockBadge({ locked }: { locked: boolean }) {
  if (!locked) return null;
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: "oklch(0.85 0.06 55)", fontSize: "10px", fontWeight: 600, color: "oklch(0.45 0.1 55)" }}
    >
      <Lock className="w-3 h-3" weight="fill" />
      Locked
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   4. FOCUS MODE (Zen Mode)
   ───────────────────────────────────────────────────────── */

interface FocusModeOverlayProps {
  active: boolean;
  onExit: () => void;
  children: React.ReactNode;
  wordCount: number;
  wordGoal: number | null;
}

export function FocusModeOverlay({ active, onExit, children, wordCount, wordGoal }: FocusModeOverlayProps) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, onExit]);

  if (!active) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "var(--surface-bg)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Minimal top bar */}
      <div className="flex items-center justify-between px-6 h-10 shrink-0">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>
            {wordCount.toLocaleString()} words
          </span>
          {wordGoal && wordGoal > 0 && (
            <span style={{ fontSize: "12px", color: wordCount >= wordGoal ? "#22c55e" : "var(--text-quaternary)" }}>
              {wordCount >= wordGoal ? "✓ Goal reached!" : `${Math.round((wordCount / wordGoal) * 100)}% of ${wordGoal.toLocaleString()} goal`}
            </span>
          )}
        </div>
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] transition-colors hover:bg-black/5"
          style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500 }}
        >
          <ArrowsIn className="w-3.5 h-3.5" />
          Exit Focus Mode
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto flex justify-center">
        <div className="w-full max-w-2xl px-8 py-8">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   5. WORD GOAL TRACKER
   ───────────────────────────────────────────────────────── */

/** In-memory goal store keyed by docId */
const goalStore = new Map<string, number>();

export function useWordGoal(docId: string) {
  const [goal, setGoalState] = useState<number | null>(() => goalStore.get(docId) ?? null);

  const setGoal = useCallback(
    (value: number | null) => {
      if (value === null || value <= 0) {
        goalStore.delete(docId);
        setGoalState(null);
      } else {
        goalStore.set(docId, value);
        setGoalState(value);
      }
    },
    [docId]
  );

  return { goal, setGoal };
}

interface WordGoalPopoverProps {
  docId: string;
  wordCount: number;
  onClose: () => void;
}

export function WordGoalPopover({ docId, wordCount, onClose }: WordGoalPopoverProps) {
  const { goal, setGoal } = useWordGoal(docId);
  const [input, setInput] = useState(goal?.toString() || "");

  const handleSave = () => {
    const num = parseInt(input);
    if (num > 0) setGoal(num);
    else setGoal(null);
    onClose();
  };

  const presets = [500, 1000, 2000, 5000];
  const progress = goal && goal > 0 ? Math.min(1, wordCount / goal) : 0;

  return (
    <motion.div
      className="absolute right-0 top-full mt-1 w-64 rounded-[10px] border shadow-xl z-50 overflow-hidden"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.12 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Target className="w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>Word Goal</span>
        </div>

        {/* Progress bar */}
        {goal && goal > 0 && (
          <div className="mb-2">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress * 100}%`,
                  background: progress >= 1 ? "#22c55e" : "var(--accent-primary)",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
                {wordCount.toLocaleString()} / {goal.toLocaleString()}
              </span>
              <span style={{ fontSize: "10px", color: progress >= 1 ? "#22c55e" : "var(--text-quaternary)", fontWeight: 500 }}>
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        )}

        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter word goal…"
          className="w-full px-2.5 py-1.5 rounded-[5px] outline-none"
          style={{ fontSize: "12px", background: "var(--neutral-50)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
          autoFocus
        />

        {/* Presets */}
        <div className="flex items-center gap-1.5 mt-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => { setInput(p.toString()); setGoal(p); onClose(); }}
              className="px-2 py-0.5 rounded-[4px] transition-colors hover:bg-black/5"
              style={{
                fontSize: "11px",
                color: goal === p ? "var(--accent-primary)" : "var(--text-quaternary)",
                fontWeight: goal === p ? 600 : 400,
                border: `1px solid ${goal === p ? "var(--accent-primary)" : "var(--border-default)"}`,
              }}
            >
              {p >= 1000 ? `${p / 1000}k` : p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-3 py-2">
        {goal && (
          <button
            onClick={() => { setGoal(null); onClose(); }}
            className="px-2 py-1 rounded-[5px] text-red-500 hover:bg-red-50"
            style={{ fontSize: "11px", fontWeight: 500 }}
          >
            Clear
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-2.5 py-1 rounded-[5px] text-white"
          style={{ background: "var(--accent-primary)", fontSize: "11px", fontWeight: 500 }}
        >
          Set Goal
        </button>
      </div>
    </motion.div>
  );
}

/* ── Word Goal Bar (inline in status area) ── */

interface WordGoalBarProps {
  wordCount: number;
  goal: number | null;
}

export function WordGoalBar({ wordCount, goal }: WordGoalBarProps) {
  if (!goal || goal <= 0) return null;
  const progress = Math.min(1, wordCount / goal);
  const done = progress >= 1;

  return (
    <div className="inline-flex items-center gap-2" title={`${wordCount} / ${goal} words`}>
      <Target className="w-3.5 h-3.5" style={{ color: done ? "#22c55e" : "var(--text-quaternary)" }} />
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${progress * 100}%`, background: done ? "#22c55e" : "var(--accent-primary)" }}
        />
      </div>
      <span style={{ fontSize: "11px", color: done ? "#22c55e" : "var(--text-quaternary)", fontWeight: done ? 600 : 400 }}>
        {done ? "✓" : `${Math.round(progress * 100)}%`}
      </span>
    </div>
  );
}
