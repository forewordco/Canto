/* ═══════════════════════════════════════════════════════════
   DOC D5 FEATURES — Phase D5: Document Intelligence & Polish
   1. Version History panel — auto-snapshot, view & restore
   2. Import from Markdown — parse .md into DocBlock[]
   3. Keyboard Shortcuts Panel
   4. Reading time + char count for status bar
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ClockCounterClockwise,
  ArrowCounterClockwise,
  X,
  Keyboard,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { DocBlock } from "../../lib/types";
import { generateBlockId } from "../DescriptionBlockEditor";

/* ─────────────────────────────────────────────────────────
   1. VERSION HISTORY
   ───────────────────────────────────────────────────────── */

export interface DocVersion {
  id: string;
  timestamp: string; // ISO
  label?: string;
  blockCount: number;
  wordCount: number;
  blocks: DocBlock[];
}

const MAX_VERSIONS = 30;
const AUTO_SAVE_INTERVAL = 60_000; // ms between auto-snapshots
const MIN_CHANGE_THRESHOLD = 3; // minimum block content changes to trigger auto-save

/** In-memory version store keyed by docId */
const versionStore = new Map<string, DocVersion[]>();

export function getVersions(docId: string): DocVersion[] {
  return versionStore.get(docId) || [];
}

export function saveVersion(
  docId: string,
  blocks: DocBlock[],
  label?: string
): DocVersion {
  const versions = versionStore.get(docId) || [];
  const wordCount = blocks.reduce(
    (acc, b) => acc + (b.content?.split(/\s+/).filter(Boolean).length || 0),
    0
  );
  const version: DocVersion = {
    id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    label,
    blockCount: blocks.length,
    wordCount,
    blocks: JSON.parse(JSON.stringify(blocks)), // deep clone
  };
  versions.push(version);
  if (versions.length > MAX_VERSIONS) versions.shift();
  versionStore.set(docId, versions);
  return version;
}

/** Hook: auto-save versions periodically when content changes */
export function useAutoVersioning(
  docId: string,
  blocks: DocBlock[],
  enabled = true
) {
  const lastSavedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const serialize = useCallback(
    (b: DocBlock[]) => b.map((bl) => `${bl.id}:${bl.type}:${bl.content}`).join("|"),
    []
  );

  useEffect(() => {
    if (!enabled) return;
    // Save initial version if none exists
    const existing = getVersions(docId);
    if (existing.length === 0 && blocks.length > 0) {
      saveVersion(docId, blocks, "Initial");
      lastSavedRef.current = serialize(blocks);
    }
  }, [docId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const current = serialize(blocks);
      if (current !== lastSavedRef.current) {
        // Count how many blocks changed
        const oldParts = new Set(lastSavedRef.current.split("|"));
        const newParts = current.split("|");
        const changed = newParts.filter((p) => !oldParts.has(p)).length;
        if (changed >= MIN_CHANGE_THRESHOLD || lastSavedRef.current === "") {
          saveVersion(docId, blocks);
          lastSavedRef.current = current;
        }
      }
    }, AUTO_SAVE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [docId, blocks, enabled, serialize]);

  /** Manual save */
  const saveNow = useCallback(
    (label?: string) => {
      const v = saveVersion(docId, blocks, label);
      lastSavedRef.current = serialize(blocks);
      return v;
    },
    [docId, blocks, serialize]
  );

  return { saveNow, versions: getVersions(docId) };
}

/* ── Version History Panel ── */

interface VersionHistoryPanelProps {
  docId: string;
  currentBlocks: DocBlock[];
  onRestore: (blocks: DocBlock[]) => void;
  onClose: () => void;
  onSaveNow: (label?: string) => void;
}

export function VersionHistoryPanel({
  docId,
  currentBlocks,
  onRestore,
  onClose,
  onSaveNow,
}: VersionHistoryPanelProps) {
  const versions = getVersions(docId);
  const [previewVersion, setPreviewVersion] = useState<DocVersion | null>(null);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
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
          <ClockCounterClockwise className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Version History</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-quaternary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Save Now */}
      <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
        <button
          onClick={() => onSaveNow("Manual save")}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] transition-colors hover:opacity-90"
          style={{ background: "var(--accent-primary)", color: "white", fontSize: "12px", fontWeight: 500 }}
        >
          Save Current Version
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {versions.length === 0 ? (
          <div className="px-3 py-8 text-center" style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>
            No versions saved yet.
            <br />
            <span style={{ fontSize: "11px" }}>Versions are auto-saved every minute when you make changes.</span>
          </div>
        ) : (
          [...versions].reverse().map((v, idx) => {
            const isCurrent = idx === 0;
            const isPreview = previewVersion?.id === v.id;
            return (
              <div
                key={v.id}
                className="px-3 py-2.5 border-b cursor-pointer transition-colors"
                style={{
                  borderColor: "var(--border-subtle)",
                  background: isPreview ? "var(--accent-primary-subtle)" : "transparent",
                }}
                onClick={() => setPreviewVersion(isPreview ? null : v)}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {v.label || (isCurrent ? "Current" : `Version ${versions.length - idx}`)}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
                    {formatTime(v.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                    {v.blockCount} blocks
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                    {v.wordCount} words
                  </span>
                </div>
                {isPreview && !isCurrent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(v.blocks);
                      setPreviewVersion(null);
                    }}
                    className="mt-2 flex items-center gap-1 px-2 py-1 rounded-[5px] transition-colors hover:opacity-90"
                    style={{ background: "#3B82F6", color: "white", fontSize: "11px", fontWeight: 500 }}
                  >
                    <ArrowCounterClockwise className="w-3 h-3" />
                    Restore This Version
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   2. IMPORT FROM MARKDOWN
   ───────────────────────────────────────────────────────── */

export function markdownToBlocks(md: string): DocBlock[] {
  const lines = md.split("\n");
  const blocks: DocBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        id: generateBlockId(),
        type: "code",
        content: codeLines.join("\n"),
        language: lang || undefined,
      });
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        id: generateBlockId(),
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      i++;
      continue;
    }

    // Divider
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ id: generateBlockId(), type: "divider", content: "" });
      i++;
      continue;
    }

    // Checklist
    const checkMatch = trimmed.match(/^-\s+\[([ xX])\]\s+(.*)$/);
    if (checkMatch) {
      blocks.push({
        id: generateBlockId(),
        type: "checklist",
        content: checkMatch[2],
        checked: checkMatch[1].toLowerCase() === "x",
      });
      i++;
      continue;
    }

    // Bulleted list
    if (/^[-*+]\s+/.test(trimmed)) {
      blocks.push({
        id: generateBlockId(),
        type: "bulleted-list",
        content: trimmed.replace(/^[-*+]\s+/, ""),
      });
      i++;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numMatch) {
      blocks.push({
        id: generateBlockId(),
        type: "numbered-list",
        content: numMatch[1],
      });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      blocks.push({
        id: generateBlockId(),
        type: "quote",
        content: trimmed.slice(2),
      });
      i++;
      continue;
    }

    // Image
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({
        id: generateBlockId(),
        type: "image",
        content: imgMatch[1],
        imageUrl: imgMatch[2],
        imageAlt: imgMatch[1],
      });
      i++;
      continue;
    }

    // Table
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const parseRow = (r: string) =>
        r.split("|").slice(1, -1).map((c) => c.trim());
      const headers = parseRow(trimmed);
      i++; // skip separator line
      if (i < lines.length && lines[i].trim().includes("---")) i++;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        rows.push(parseRow(lines[i].trim()));
        i++;
      }
      blocks.push({
        id: generateBlockId(),
        type: "table",
        content: "",
        tableData: { headers, rows },
      });
      continue;
    }

    // Paragraph (default)
    blocks.push({
      id: generateBlockId(),
      type: "paragraph",
      content: trimmed,
    });
    i++;
  }

  return blocks.length > 0 ? blocks : [{ id: generateBlockId(), type: "paragraph", content: "" }];
}

/* ── Import from Markdown Modal ── */

interface ImportMarkdownModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (title: string, blocks: DocBlock[]) => void;
}

export function ImportMarkdownModal({ open, onClose, onImport }: ImportMarkdownModalProps) {
  const [mdText, setMdText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setMdText(text || "");
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!mdText.trim()) return;
    const blocks = markdownToBlocks(mdText);
    // Extract title from first heading
    const firstHeading = blocks.find((b) => b.type === "heading");
    const title = firstHeading?.content || fileName?.replace(/\.md$/i, "") || "Imported Document";
    // Remove first heading if it was the title
    const finalBlocks = firstHeading && blocks[0]?.id === firstHeading.id ? blocks.slice(1) : blocks;
    onImport(title, finalBlocks.length > 0 ? finalBlocks : [{ id: generateBlockId(), type: "paragraph", content: "" }]);
    setMdText("");
    setFileName(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative w-full max-w-lg mx-4 rounded-[12px] border shadow-xl overflow-hidden"
        style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-default)" }}>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Import from Markdown</span>
          <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-quaternary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* File upload */}
          <div>
            <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt" onChange={handleFile} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] border-2 border-dashed transition-colors hover:border-blue-400"
              style={{ borderColor: "var(--border-default)", color: "var(--text-tertiary)", fontSize: "13px" }}
            >
              {fileName ? (
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{fileName}</span>
              ) : (
                "Choose a .md file or paste below"
              )}
            </button>
          </div>

          {/* Textarea */}
          <textarea
            value={mdText}
            onChange={(e) => setMdText(e.target.value)}
            placeholder="Or paste your Markdown here..."
            className="w-full h-40 px-3 py-2 rounded-[6px] outline-none resize-none font-mono"
            style={{
              background: "var(--neutral-50)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: "12px",
              lineHeight: 1.5,
            }}
            onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--accent-primary-subtle)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />

          {mdText && (
            <div style={{ fontSize: "11px", color: "var(--text-quaternary)" }}>
              Preview: {markdownToBlocks(mdText).length} blocks will be imported
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t" style={{ borderColor: "var(--border-default)" }}>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-[6px] transition-colors hover:bg-black/5"
            style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!mdText.trim()}
            className="px-4 py-1.5 rounded-[6px] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--accent-primary)", fontSize: "13px", fontWeight: 500 }}
          >
            Import
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   3. KEYBOARD SHORTCUTS PANEL
   ───────────────────────────────────────────────────────── */

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
      { keys: ["⌘", "F"], description: "Find & Replace" },
      { keys: ["⌘", "K"], description: "Command Palette" },
      { keys: ["⌘", "/"], description: "Keyboard Shortcuts" },
      { keys: ["Esc"], description: "Close panel / Go back" },
    ],
  },
  {
    title: "Text Formatting",
    shortcuts: [
      { keys: ["⌘", "B"], description: "Bold" },
      { keys: ["⌘", "I"], description: "Italic" },
      { keys: ["⌘", "U"], description: "Underline" },
      { keys: ["⌘", "⇧", "S"], description: "Strikethrough" },
    ],
  },
  {
    title: "Block Editor",
    shortcuts: [
      { keys: ["/"], description: "Slash commands" },
      { keys: ["Enter"], description: "New block" },
      { keys: ["Backspace"], description: "Delete empty block & merge" },
      { keys: ["Tab"], description: "Indent block" },
      { keys: ["⇧", "Tab"], description: "Outdent block" },
      { keys: ["⌘", "⇧", "↑"], description: "Move block up" },
      { keys: ["⌘", "⇧", "↓"], description: "Move block down" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate between blocks" },
      { keys: ["⌘", "↑"], description: "Jump to top" },
      { keys: ["⌘", "↓"], description: "Jump to bottom" },
    ],
  },
];

interface KeyboardShortcutsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsPanel({ open, onClose }: KeyboardShortcutsPanelProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        className="relative w-full max-w-md mx-4 rounded-[12px] border shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
        style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border-default)" }}>
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Keyboard Shortcuts</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-quaternary)" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <div
                className="mb-2"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-quaternary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {group.title}
              </div>
              <div className="space-y-1">
                {group.shortcuts.map((s) => (
                  <div key={s.description} className="flex items-center justify-between py-1">
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.description}</span>
                    <div className="flex items-center gap-0.5">
                      {s.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-[4px] border"
                          style={{
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "var(--text-secondary)",
                            background: "var(--neutral-50)",
                            borderColor: "var(--border-default)",
                            fontFamily: "system-ui, sans-serif",
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   4. READING TIME + CHAR COUNT (for status bar)
   ───────────────────────────────────────────────────────── */

const WORDS_PER_MINUTE = 238;

export function computeDocStats(blocks: DocBlock[]) {
  const text = blocks.map((b) => b.content || "").join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, "").length;
  const readingTimeMin = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  const paragraphs = blocks.filter(
    (b) => b.type === "paragraph" && b.content?.trim()
  ).length;
  const headings = blocks.filter((b) => b.type === "heading").length;
  const images = blocks.filter(
    (b) => b.type === "image" || b.type === "unsplash-image" || b.type === "gallery"
  ).length;

  return {
    words,
    chars,
    charsNoSpaces,
    readingTimeMin,
    paragraphs,
    headings,
    images,
    blockCount: blocks.length,
  };
}