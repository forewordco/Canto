/* ═══════════════════════════════════════════════════════════
   DOC EDITOR FEATURES — Phase D4
   1. useDocHistory  — Undo / Redo with block-level history
   2. blocksToMarkdown — Export to Markdown
   3. FindReplaceBar — Cmd+F search bar overlay
   4. DOC_TEMPLATES  — Document templates for create modal
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  MagnifyingGlass,
  X,
  ArrowDown,
  ArrowUp,
  Swap,
  FileText,
  Notebook,
  VideoCamera,
  FilmScript,
  ListChecks,
  Kanban,
  CalendarBlank,
  Presentation,
} from "@phosphor-icons/react";
import type { DocBlock, DocBlockType, DocType } from "../../lib/types";
import { generateBlockId } from "../DescriptionBlockEditor";

/* ─────────────────────────────────────────────────────────
   1. UNDO / REDO HOOK
   ───────────────────────────────────────────────────────── */

const MAX_HISTORY = 80;

export interface DocHistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => DocBlock[] | null;
  redo: () => DocBlock[] | null;
  push: (blocks: DocBlock[]) => void;
  clear: () => void;
}

export function useDocHistory(initialBlocks: DocBlock[]): DocHistoryState {
  const undoStack = useRef<DocBlock[][]>([]);
  const redoStack = useRef<DocBlock[][]>([]);
  const currentRef = useRef<DocBlock[]>(initialBlocks);
  const [, forceUpdate] = useState(0);

  const push = useCallback((blocks: DocBlock[]) => {
    // Don't push if identical reference
    if (blocks === currentRef.current) return;
    undoStack.current.push(currentRef.current);
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    redoStack.current = [];
    currentRef.current = blocks;
    forceUpdate((c) => c + 1);
  }, []);

  const undo = useCallback((): DocBlock[] | null => {
    if (undoStack.current.length === 0) return null;
    const prev = undoStack.current.pop()!;
    redoStack.current.push(currentRef.current);
    currentRef.current = prev;
    forceUpdate((c) => c + 1);
    return prev;
  }, []);

  const redo = useCallback((): DocBlock[] | null => {
    if (redoStack.current.length === 0) return null;
    const next = redoStack.current.pop()!;
    undoStack.current.push(currentRef.current);
    currentRef.current = next;
    forceUpdate((c) => c + 1);
    return next;
  }, []);

  const clear = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
    forceUpdate((c) => c + 1);
  }, []);

  return {
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    undo,
    redo,
    push,
    clear,
  };
}

/* ─────────────────────────────────────────────────────────
   2. EXPORT TO MARKDOWN
   ───────────────────────────────────────────────────────── */

function blockToMd(block: DocBlock): string {
  const c = block.content || "";
  switch (block.type) {
    case "heading": {
      const prefix = "#".repeat(block.level || 1);
      return `${prefix} ${c}`;
    }
    case "paragraph":
      return c;
    case "bulleted-list":
      return `- ${c}`;
    case "numbered-list":
      return `1. ${c}`;
    case "checklist":
      return `- [${block.checked ? "x" : " "}] ${c}`;
    case "quote":
      return `> ${c}`;
    case "code":
      return `\`\`\`${block.language || ""}\n${c}\n\`\`\``;
    case "divider":
      return "---";
    case "image":
    case "unsplash-image":
      return `![${block.imageAlt || ""}](${block.imageUrl || block.unsplashMeta?.url || ""})`;
    case "callout":
      return `> **${block.calloutIcon === "warning" ? "Warning" : "Note"}:** ${c}`;
    case "toggle":
      return `<details>\n<summary>${c}</summary>\n</details>`;
    case "embed":
      return block.embedUrl || c;
    case "table": {
      if (!block.tableData) return c;
      const { headers, rows } = block.tableData;
      const hLine = `| ${headers.join(" | ")} |`;
      const sep = `| ${headers.map(() => "---").join(" | ")} |`;
      const rLines = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
      return `${hLine}\n${sep}\n${rLines}`;
    }
    case "gallery":
      return (block.galleryImages || [])
        .map((img) => `![${img.photographer}](${img.url})`)
        .join("\n");
    case "group-card":
      return `[Linked Document: ${c || block.linkedDocId || ""}]`;
    // Script types
    case "scene-heading":
      return `**${c.toUpperCase()}**`;
    case "action":
      return c;
    case "character":
      return `**${c.toUpperCase()}**`;
    case "dialogue":
      return `> ${c}`;
    case "parenthetical":
      return `_(${c})_`;
    case "transition":
      return `**${c.toUpperCase()}**`;
    default:
      return c;
  }
}

export function blocksToMarkdown(title: string, blocks: DocBlock[]): string {
  const lines: string[] = [`# ${title}`, ""];
  for (const block of blocks) {
    lines.push(blockToMd(block));
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function downloadMarkdown(title: string, blocks: DocBlock[]) {
  const md = blocksToMarkdown(title, blocks);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9 -]/g, "").trim() || "document"}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────
   3. FIND & REPLACE BAR
   ───────────────────────────────────────────────────────── */

interface FindReplaceBarProps {
  blocks: DocBlock[];
  onClose: () => void;
  onHighlightBlock: (blockId: string) => void;
  onReplaceInBlock: (blockId: string, search: string, replacement: string, all?: boolean) => void;
  onReplaceAll: (search: string, replacement: string) => void;
}

interface SearchMatch {
  blockId: string;
  blockIndex: number;
  count: number; // number of matches in this block
}

export function FindReplaceBar({
  blocks,
  onClose,
  onHighlightBlock,
  onReplaceInBlock,
  onReplaceAll,
}: FindReplaceBarProps) {
  const [search, setSearch] = useState("");
  const [replacement, setReplacement] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  // Find all matches
  const matches: SearchMatch[] = [];
  if (search) {
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
    blocks.forEach((block, idx) => {
      if (!block.content) return;
      const m = block.content.match(regex);
      if (m && m.length > 0) {
        matches.push({ blockId: block.id, blockIndex: idx, count: m.length });
      }
    });
  }

  const totalMatches = matches.reduce((sum, m) => sum + m.count, 0);
  const safeIdx = matches.length > 0 ? currentMatchIdx % matches.length : 0;
  const currentMatch = matches[safeIdx] || null;

  // Navigate to match
  useEffect(() => {
    if (currentMatch) {
      onHighlightBlock(currentMatch.blockId);
    }
  }, [currentMatch?.blockId, safeIdx]);

  const goNext = () => setCurrentMatchIdx((i) => (matches.length > 0 ? (i + 1) % matches.length : 0));
  const goPrev = () => setCurrentMatchIdx((i) => (matches.length > 0 ? (i - 1 + matches.length) % matches.length : 0));

  const handleReplace = () => {
    if (!currentMatch || !search) return;
    onReplaceInBlock(currentMatch.blockId, search, replacement);
    // Stay at same index (the match disappears, next one slides in)
  };

  const handleReplaceAll = () => {
    if (!search) return;
    onReplaceAll(search, replacement);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goNext();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [matches.length]);

  return (
    <div
      className="absolute top-0 right-0 z-30 flex flex-col gap-1.5 p-2.5 rounded-bl-[8px] shadow-lg border-b border-l"
      style={{
        background: "var(--surface-bg)",
        borderColor: "var(--border-default)",
        minWidth: "340px",
      }}
    >
      {/* Search row */}
      <div className="flex items-center gap-1.5">
        <MagnifyingGlass className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentMatchIdx(0); }}
          placeholder="Find in document..."
          className="flex-1 min-w-0 px-2 py-1 rounded-[5px] outline-none"
          style={{
            background: "var(--neutral-50)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            fontSize: "13px",
          }}
          onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--accent-primary-subtle)")}
          onBlur={(e) => (e.target.style.boxShadow = "none")}
        />
        <span className="text-[11px] shrink-0 tabular-nums" style={{ color: "var(--text-quaternary)", minWidth: "44px", textAlign: "center" }}>
          {search ? `${matches.length > 0 ? safeIdx + 1 : 0}/${totalMatches}` : ""}
        </span>
        <button onClick={goPrev} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-tertiary)" }} title="Previous (Shift+Enter)">
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={goNext} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-tertiary)" }} title="Next (Enter)">
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className="px-1.5 py-0.5 rounded-[4px] text-[11px] font-mono font-bold transition-colors"
          style={{
            color: caseSensitive ? "var(--accent-primary)" : "var(--text-quaternary)",
            background: caseSensitive ? "var(--accent-primary-subtle)" : "transparent",
          }}
          title="Match case"
        >
          Aa
        </button>
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="p-1 rounded-[4px] hover:bg-black/[0.04]"
          style={{ color: showReplace ? "var(--accent-primary)" : "var(--text-quaternary)" }}
          title="Toggle Replace"
        >
          <Swap className="w-3.5 h-3.5" />
        </button>
        <button onClick={onClose} className="p-1 rounded-[4px] hover:bg-black/[0.04]" style={{ color: "var(--text-quaternary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-1.5 pl-5">
          <input
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replace with..."
            className="flex-1 min-w-0 px-2 py-1 rounded-[5px] outline-none"
            style={{
              background: "var(--neutral-50)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: "13px",
            }}
            onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--accent-primary-subtle)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
          />
          <button
            onClick={handleReplace}
            disabled={!currentMatch || !search}
            className="px-2 py-1 rounded-[5px] text-[12px] font-medium transition-colors hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--accent-primary)", color: "white" }}
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={!search || totalMatches === 0}
            className="px-2 py-1 rounded-[5px] text-[12px] font-medium transition-colors hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--neutral-200)", color: "var(--text-secondary)" }}
          >
            All
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   4. DOCUMENT TEMPLATES
   ───────────────────────────────────────────────────────── */

export interface DocTemplate {
  id: string;
  label: string;
  description: string;
  type: DocType;
  icon: React.ElementType;
  color: string;
  blocks: DocBlock[];
}

function tBlock(type: DocBlockType, content: string, extra?: Partial<DocBlock>): DocBlock {
  return { id: generateBlockId(), type, content, ...extra };
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "blank",
    label: "Blank Document",
    description: "Start from scratch",
    type: "doc",
    icon: FileText,
    color: "#64748B",
    blocks: [tBlock("paragraph", "")],
  },
  {
    id: "project-brief",
    label: "Project Brief",
    description: "Goals, scope, timeline, and stakeholders",
    type: "doc",
    icon: Kanban,
    color: "#3B82F6",
    blocks: [
      tBlock("heading", "Project Overview", { level: 2 }),
      tBlock("paragraph", "Describe the project purpose and background."),
      tBlock("heading", "Goals & Objectives", { level: 2 }),
      tBlock("checklist", "Define primary goal", { checked: false }),
      tBlock("checklist", "Identify success metrics", { checked: false }),
      tBlock("checklist", "Align stakeholders", { checked: false }),
      tBlock("heading", "Scope", { level: 2 }),
      tBlock("paragraph", "What is in scope and out of scope for this project."),
      tBlock("heading", "Timeline", { level: 2 }),
      tBlock("table", "", {
        tableData: {
          headers: ["Milestone", "Date", "Owner"],
          rows: [
            ["Kickoff", "", ""],
            ["First Draft", "", ""],
            ["Review", "", ""],
            ["Launch", "", ""],
          ],
        },
      }),
      tBlock("heading", "Stakeholders", { level: 2 }),
      tBlock("bulleted-list", "Project Lead:"),
      tBlock("bulleted-list", "Designer:"),
      tBlock("bulleted-list", "Engineering:"),
    ],
  },
  {
    id: "meeting-notes",
    label: "Meeting Notes",
    description: "Agenda, notes, and action items",
    type: "meeting",
    icon: VideoCamera,
    color: "#F59145",
    blocks: [
      tBlock("heading", "Agenda", { level: 2 }),
      tBlock("numbered-list", "Topic 1"),
      tBlock("numbered-list", "Topic 2"),
      tBlock("numbered-list", "Topic 3"),
      tBlock("divider", ""),
      tBlock("heading", "Discussion Notes", { level: 2 }),
      tBlock("paragraph", ""),
      tBlock("divider", ""),
      tBlock("heading", "Action Items", { level: 2 }),
      tBlock("checklist", "Action item 1 — @owner", { checked: false }),
      tBlock("checklist", "Action item 2 — @owner", { checked: false }),
      tBlock("checklist", "Action item 3 — @owner", { checked: false }),
      tBlock("heading", "Decisions Made", { level: 2 }),
      tBlock("bulleted-list", ""),
    ],
  },
  {
    id: "weekly-status",
    label: "Weekly Status Update",
    description: "Progress, blockers, and next steps",
    type: "doc",
    icon: CalendarBlank,
    color: "#22C55E",
    blocks: [
      tBlock("callout", "Week of [date]", { calloutColor: "#22C55E", calloutIcon: "calendar" }),
      tBlock("heading", "Completed This Week", { level: 2 }),
      tBlock("checklist", "", { checked: true }),
      tBlock("heading", "In Progress", { level: 2 }),
      tBlock("bulleted-list", ""),
      tBlock("heading", "Blockers", { level: 2 }),
      tBlock("callout", "List any blockers or risks here.", { calloutColor: "#EF4444", calloutIcon: "warning" }),
      tBlock("heading", "Next Week", { level: 2 }),
      tBlock("bulleted-list", ""),
    ],
  },
  {
    id: "task-tracker",
    label: "Task Tracker",
    description: "Track tasks with status table",
    type: "doc",
    icon: ListChecks,
    color: "#8B5CF6",
    blocks: [
      tBlock("heading", "Task Tracker", { level: 2 }),
      tBlock("paragraph", "Use this table to track the status of tasks and assignments."),
      tBlock("table", "", {
        tableData: {
          headers: ["Task", "Assignee", "Status", "Due Date"],
          rows: [
            ["", "", "To Do", ""],
            ["", "", "In Progress", ""],
            ["", "", "Done", ""],
          ],
        },
      }),
      tBlock("divider", ""),
      tBlock("heading", "Notes", { level: 2 }),
      tBlock("paragraph", ""),
    ],
  },
  {
    id: "creative-brief",
    label: "Creative Brief",
    description: "For design and creative projects",
    type: "doc",
    icon: Presentation,
    color: "#EC4899",
    blocks: [
      tBlock("heading", "Creative Brief", { level: 1 }),
      tBlock("heading", "Background", { level: 2 }),
      tBlock("paragraph", "What is the context for this project?"),
      tBlock("heading", "Objective", { level: 2 }),
      tBlock("paragraph", "What should this creative accomplish?"),
      tBlock("heading", "Target Audience", { level: 2 }),
      tBlock("paragraph", "Who are we speaking to?"),
      tBlock("heading", "Key Message", { level: 2 }),
      tBlock("paragraph", "What is the single most important message?"),
      tBlock("heading", "Tone & Style", { level: 2 }),
      tBlock("bulleted-list", "Tone:"),
      tBlock("bulleted-list", "Visual Style:"),
      tBlock("bulleted-list", "References:"),
      tBlock("heading", "Deliverables", { level: 2 }),
      tBlock("checklist", "", { checked: false }),
      tBlock("heading", "Timeline", { level: 2 }),
      tBlock("paragraph", ""),
    ],
  },
  {
    id: "script-template",
    label: "Script Template",
    description: "Scene headings, dialogue, and action",
    type: "script",
    icon: FilmScript,
    color: "#8B5CF6",
    blocks: [
      tBlock("scene-heading", "INT. LOCATION - DAY"),
      tBlock("action", "Description of the scene and setting."),
      tBlock("character", "CHARACTER NAME"),
      tBlock("dialogue", "Character dialogue goes here."),
      tBlock("action", ""),
      tBlock("transition", "CUT TO:"),
      tBlock("scene-heading", "EXT. LOCATION - NIGHT"),
      tBlock("action", ""),
    ],
  },
  {
    id: "daily-journal",
    label: "Daily Journal",
    description: "Gratitude, reflections, and goals",
    type: "note",
    icon: Notebook,
    color: "#F59E0B",
    blocks: [
      tBlock("callout", "Daily Journal Entry", { calloutColor: "#F59E0B", calloutIcon: "star" }),
      tBlock("heading", "Grateful For", { level: 2 }),
      tBlock("bulleted-list", ""),
      tBlock("heading", "Today's Focus", { level: 2 }),
      tBlock("checklist", "Top priority", { checked: false }),
      tBlock("checklist", "Secondary goal", { checked: false }),
      tBlock("heading", "Reflections", { level: 2 }),
      tBlock("paragraph", ""),
      tBlock("heading", "Tomorrow", { level: 2 }),
      tBlock("paragraph", ""),
    ],
  },
];