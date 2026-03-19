/* ===================================================================
   DESCRIPTION BLOCK EDITOR — Block-based rich text editor.

   Supports: paragraph, heading (h1-h3), bulleted/numbered/checklist,
   quote, code, divider, image, callout, toggle, table, embed blocks.
   
   Slash command menu, markdown shortcuts, block decorations,
   color overrides, font style overrides, AI rewrite.
   =================================================================== */

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  memo,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import {
  TextAa,
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  Code,
  Minus,
  Image as ImageIcon,
  Plus,
  DotsSixVertical,
  Trash,
  CheckSquareOffset,
  Sparkle,
  CircleNotch,
  Info,
  CaretRight,
  Table as TableIcon,
  YoutubeLogo,
  X,
  Lightbulb,
  Warning,
  Star,
  Lightning,
  FilmScript,
  ChatCentered,
  UserCircle,
  ArrowRight,
  TextT,
  SquaresFour,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { DocBlock, DocBlockType, WorkspaceDoc, UnsplashImageMeta } from "../lib/types";
import { rewriteText, type RewriteStyle } from "../lib/ai";
import { toast } from "sonner";
import { SelectionToolbar } from "./docs/SelectionToolbar";
import { UnsplashSearchModal } from "./docs/UnsplashSearchModal";
import { GroupCard, type GroupCardStyle } from "./docs/GroupCard";
import { RemoteBlockPresence, getCollabsOnBlock, getRemoteBlockBorderStyle } from "./docs/RemoteBlockPresence";
import type { CollabUser } from "../hooks/useCollaboration";
import type { MentionItem } from "./MentionInput";
import { createPortal } from "react-dom";

/* ─── AI Slash Command Types ─── */
export type AiSlashAction = "ai-write" | "ai-summarize" | "ai-brainstorm" | "ai-outline" | "ai-continue" | "ai-edit" | "ai-improve" | "ai-longer" | "ai-shorter" | "ai-fix" | "ai-action-items";

/* ─── ID Generator ─── */
let blockIdCounter = 0;
export function generateBlockId(): string {
  return `blk_${Date.now()}_${++blockIdCounter}_${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Block Type Metadata ─── */
interface BlockTypeMeta {
  type: DocBlockType;
  label: string;
  description: string;
  icon: React.ElementType;
  level?: number;
  shortcut?: string;
  category?: string;
}

const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: "paragraph", label: "Text", description: "Plain text block", icon: TextAa, shortcut: "/text", category: "Text" },
  { type: "heading", label: "Heading 1", description: "Large section heading", icon: TextHOne, level: 1, shortcut: "/h1", category: "Text" },
  { type: "heading", label: "Heading 2", description: "Medium section heading", icon: TextHTwo, level: 2, shortcut: "/h2", category: "Text" },
  { type: "heading", label: "Heading 3", description: "Small section heading", icon: TextHThree, level: 3, shortcut: "/h3", category: "Text" },
  { type: "bulleted-list", label: "Bulleted List", description: "Unordered list", icon: ListBullets, shortcut: "/bullet", category: "Lists" },
  { type: "numbered-list", label: "Numbered List", description: "Ordered list", icon: ListNumbers, shortcut: "/number", category: "Lists" },
  { type: "checklist", label: "Checklist", description: "Toggleable checklist", icon: CheckSquare, shortcut: "/check", category: "Lists" },
  { type: "toggle", label: "Toggle", description: "Collapsible section", icon: CaretRight, shortcut: "/toggle", category: "Lists" },
  { type: "quote", label: "Quote", description: "Blockquote", icon: Quotes, shortcut: "/quote", category: "Rich" },
  { type: "callout", label: "Callout", description: "Highlighted callout box", icon: Info, shortcut: "/callout", category: "Rich" },
  { type: "code", label: "Code Block", description: "Monospace code", icon: Code, shortcut: "/code", category: "Rich" },
  { type: "divider", label: "Divider", description: "Horizontal rule", icon: Minus, shortcut: "/divider", category: "Rich" },
  { type: "image", label: "Image", description: "Image block", icon: ImageIcon, shortcut: "/image", category: "Media" },
  { type: "unsplash-image", label: "Unsplash Image", description: "Photo with attribution", icon: ImageIcon, shortcut: "/unsplash", category: "Media" },
  { type: "gallery", label: "Gallery", description: "Multi-image gallery", icon: ImageIcon, shortcut: "/gallery", category: "Media" },
  { type: "embed", label: "Video / Embed", description: "YouTube or video embed", icon: YoutubeLogo, shortcut: "/embed", category: "Media" },
  { type: "table", label: "Table", description: "Editable table", icon: TableIcon, shortcut: "/table", category: "Data" },
  { type: "group-card", label: "Nested Doc", description: "Embed a linked document card", icon: SquaresFour, shortcut: "/nested", category: "Rich" },
  { type: "paragraph", label: "AI Write", description: "Generate content from prompt", icon: Sparkle, shortcut: "/ai-write", category: "AI" },
  { type: "paragraph", label: "AI Summarize", description: "Summarize document content", icon: Sparkle, shortcut: "/ai-summarize", category: "AI" },
  { type: "paragraph", label: "AI Brainstorm", description: "Brainstorm ideas", icon: Sparkle, shortcut: "/ai-brainstorm", category: "AI" },
  { type: "paragraph", label: "AI Outline", description: "Create document outline", icon: Sparkle, shortcut: "/ai-outline", category: "AI" },
  { type: "paragraph", label: "AI Continue", description: "Continue writing from here", icon: Sparkle, shortcut: "/ai-continue", category: "AI" },
  { type: "paragraph", label: "AI Edit", description: "Edit/revise selected text", icon: Sparkle, shortcut: "/ai-edit", category: "AI" },
  { type: "paragraph", label: "AI Improve", description: "Improve writing clarity & tone", icon: Sparkle, shortcut: "/ai-improve", category: "AI" },
  { type: "paragraph", label: "AI Longer", description: "Expand content with more detail", icon: Sparkle, shortcut: "/ai-longer", category: "AI" },
  { type: "paragraph", label: "AI Shorter", description: "Condense content to be concise", icon: Sparkle, shortcut: "/ai-shorter", category: "AI" },
  { type: "paragraph", label: "AI Fix Grammar", description: "Fix spelling & grammar", icon: Sparkle, shortcut: "/ai-fix", category: "AI" },
  { type: "paragraph", label: "AI Action Items", description: "Extract actionable tasks", icon: Sparkle, shortcut: "/ai-action-items", category: "AI" },
];

/* ─── Screenplay Block Types (shown only in script mode) ─── */
const SCRIPT_BLOCK_TYPES: BlockTypeMeta[] = [
  { type: "scene-heading", label: "Scene Heading", description: "INT./EXT. location", icon: FilmScript, shortcut: "/scene", category: "Script" },
  { type: "action", label: "Action", description: "Scene description", icon: TextAa, shortcut: "/action", category: "Script" },
  { type: "character", label: "Character", description: "Character name (uppercase)", icon: UserCircle, shortcut: "/char", category: "Script" },
  { type: "dialogue", label: "Dialogue", description: "Character dialogue", icon: ChatCentered, shortcut: "/dialogue", category: "Script" },
  { type: "parenthetical", label: "Parenthetical", description: "Delivery direction", icon: TextT, shortcut: "/paren", category: "Script" },
  { type: "transition", label: "Transition", description: "CUT TO, FADE OUT", icon: ArrowRight, shortcut: "/trans", category: "Script" },
];

/* ─── Callout Presets ─── */
const CALLOUT_PRESETS = [
  { icon: "info", color: "#3B82F6", label: "Info" },
  { icon: "lightbulb", color: "#F59E0B", label: "Tip" },
  { icon: "warning", color: "#EF4444", label: "Warning" },
  { icon: "star", color: "#8B5CF6", label: "Note" },
  { icon: "lightning", color: "#10B981", label: "Success" },
];

const CALLOUT_ICON_MAP: Record<string, React.ElementType> = {
  info: Info,
  lightbulb: Lightbulb,
  warning: Warning,
  star: Star,
  lightning: Lightning,
};

/* ─── Decoration / Color / Font helpers ─── */
const BLOCK_COLORS = [
  { value: "#FA6863", label: "Coral" },
  { value: "#F59145", label: "Orange" },
  { value: "#EAB308", label: "Gold" },
  { value: "#22C55E", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#64748B", label: "Slate" },
];

const FONT_STYLES: { value: DocBlock["fontStyle"]; label: string; family: string }[] = [
  { value: "system", label: "System", family: "'Albert Sans', sans-serif" },
  { value: "serif", label: "Serif", family: "Georgia, serif" },
  { value: "mono", label: "Mono", family: "'Courier Prime', monospace" },
  { value: "round", label: "Round", family: "'Nunito', sans-serif" },
];

function getFontFamily(style?: DocBlock["fontStyle"]): string {
  return FONT_STYLES.find((f) => f.value === style)?.family || FONT_STYLES[0].family;
}

/* ─── Props ─── */
interface DescriptionBlockEditorProps {
  blocks: DocBlock[];
  onChange: (blocks: DocBlock[]) => void;
  placeholder?: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** ClassName for the inner content wrapper (blocks list). Outer container stays full width for marquee. */
  contentClassName?: string;
  /** Script mode: show screenplay elements */
  scriptMode?: boolean;
  /** Callback when block is updated (for collaboration) */
  onBlockUpdate?: (blockId: string, updates: Partial<DocBlock>) => void;
  /** Known characters for autocomplete (script mode) */
  knownCharacters?: string[];
  /** Known locations for autocomplete (script mode) */
  knownLocations?: string[];
  /** Whether AI features (rewrite, slash commands) are enabled. Default true. */
  enableAi?: boolean;
  /** Callback when AI slash command is triggered */
  onAiAction?: (action: AiSlashAction, afterBlockId: string) => void;
  /** Resolve a linked doc ID to WorkspaceDoc (for group-card blocks) */
  resolveDoc?: (docId: string) => WorkspaceDoc | null;
  /** Navigate into a nested/linked document */
  onNavigateDoc?: (docId: string) => void;
  /** Create a nested doc and return its ID. Optional blocks to seed the doc with. */
  onCreateNestedDoc?: (parentBlockId: string, seedBlocks?: DocBlock[]) => string | null;
  /** Remote collaborators currently in the document (D12) */
  collaborators?: CollabUser[];
  /** Called when block focus changes (for collaboration presence tracking) */
  onBlockFocus?: (blockId: string | null) => void;
  /** Mention items for @-mention autocomplete in blocks */
  mentionItems?: MentionItem[];
  /** All docs available for linking (group-card blocks) */
  allDocs?: WorkspaceDoc[];
}

/* ─── Helper: read text from contenteditable element ─── */
function readElText(el: HTMLElement): string {
  return (el.textContent ?? "").replace(/\n$/, "").replace(/\u00A0/g, " ");
}

/** Read the HTML content from a contenteditable, preserving inline formatting */
function readElHtml(el: HTMLElement): string {
  const html = el.innerHTML;
  // If it's just plain text (no HTML tags), return text to keep storage lean
  if (!/<[a-z][\s\S]*>/i.test(html)) return readElText(el);
  // Normalize non-breaking spaces
  return html.replace(/&nbsp;/g, " ").replace(/\u00A0/g, " ");
}

/** Check if content contains HTML formatting */
function hasHtmlFormatting(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content);
}

/* ─── Helper: place cursor at end of contenteditable ─── */
function placeCursorAtEnd(el: HTMLElement) {
  const s = window.getSelection();
  if (!s) return;
  s.selectAllChildren(el);
  s.collapseToEnd();
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function DescriptionBlockEditor({
  blocks,
  onChange,
  placeholder = "Type '/' for commands...",
  readOnly = false,
  autoFocus = false,
  className = "",
  contentClassName = "",
  scriptMode = false,
  knownCharacters = [],
  knownLocations = [],
  enableAi = true,
  onAiAction,
  resolveDoc,
  onNavigateDoc,
  onCreateNestedDoc,
  collaborators = [],
  onBlockFocus,
  mentionItems = [],
  allDocs = [],
}: DescriptionBlockEditorProps) {
  const [focusedBlockId, setFocusedBlockIdRaw] = useState<string | null>(null);
  const setFocusedBlockId = useCallback((id: string | null) => {
    setFocusedBlockIdRaw(id);
    onBlockFocus?.(id);
  }, [onBlockFocus]);
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [slashMenuBlockId, setSlashMenuBlockId] = useState<string | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set());
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const editingBlockIdRef = useRef<string | null>(null);
  editingBlockIdRef.current = editingBlockId;
  const selectedBlockIdsRef = useRef<Set<string>>(new Set());
  selectedBlockIdsRef.current = selectedBlockIds;
  const suppressNextClick = useRef(false);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<string[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteBlockId, setAutocompleteBlockId] = useState<string | null>(null);
  const [unsplashModal, setUnsplashModal] = useState<{ mode: "single" | "multi"; blockId: string } | null>(null);
  const [lightbox, setLightbox] = useState<{ images: UnsplashImageMeta[]; index: number } | null>(null);
  /* ─── @Mention state ─── */
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionBlockId, setMentionBlockId] = useState<string | null>(null);
  const mentionOpenRef = useRef(false);
  mentionOpenRef.current = mentionOpen;
  const lastClickedBlockIdx = useRef<number | null>(null);
  const blockRefs = useRef<Map<string, HTMLElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  /* ─── Marquee selection state (unified — works from anywhere) ─── */
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const marqueeState = useRef<{
    active: boolean;
    originX: number;
    originY: number;
    clientOriginX: number;
    clientOriginY: number;
    scrollTop: number;
    moved: boolean;
    clickedBlockId: string | null;
    clickedBlockIdx: number | null;
    shiftKey: boolean;
    metaOrCtrlKey: boolean;
  } | null>(null);
  const blocksListRef = useRef<HTMLDivElement>(null);

  const blocksRef = useRef<DocBlock[]>(blocks);
  blocksRef.current = blocks;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastSyncedContentMap = useRef<Map<string, string>>(new Map());
  const autocompleteOpenRef = useRef(false);
  autocompleteOpenRef.current = autocompleteOpen;

  const fallbackBlock = useRef<DocBlock>({ id: generateBlockId(), type: "paragraph", content: "" });
  const safeBlocks = blocks.length === 0 ? [fallbackBlock.current] : blocks;

  /* ─── Filtered slash menu items ─── */
  const filteredSlashItems = useMemo(() => {
    let items: BlockTypeMeta[];
    if (scriptMode) {
      // Script mode: Script category first, then general block types (no embed/table/gallery)
      const general = BLOCK_TYPES.filter((bt) => !["embed", "table", "gallery"].includes(bt.type));
      items = [...SCRIPT_BLOCK_TYPES, ...general];
    } else {
      items = BLOCK_TYPES;
    }
    if (!enableAi) items = items.filter((bt) => bt.category !== "AI");
    if (!slashQuery) return items;
    const q = slashQuery.toLowerCase();
    return items.filter(
      (bt) =>
        bt.label.toLowerCase().includes(q) ||
        bt.description.toLowerCase().includes(q) ||
        (bt.shortcut && bt.shortcut.toLowerCase().includes("/" + q))
    );
  }, [slashQuery, scriptMode, enableAi]);

  /* ─── Filtered mention items ─── */
  const filteredMentionItems = useMemo(() => {
    if (!mentionQuery) return mentionItems.slice(0, 8);
    const q = mentionQuery.toLowerCase();
    return mentionItems.filter((m) => m.label.toLowerCase().includes(q)).slice(0, 8);
  }, [mentionQuery, mentionItems]);

  /* ─── Block Operations ─── */
  const getBlocks = useCallback(() => {
    const b = blocksRef.current;
    return b.length === 0 ? [fallbackBlock.current] : b;
  }, []);

  const emitChange = useCallback((newBlocks: DocBlock[]) => {
    onChangeRef.current(newBlocks);
  }, []);

  const updateBlock = useCallback(
    (blockId: string, updates: Partial<DocBlock>) => {
      const cur = getBlocks();
      emitChange(cur.map((b) => (b.id === blockId ? { ...b, ...updates } : b)));
    },
    [getBlocks, emitChange]
  );

  /* ─── Debounced content-only update (perf: avoids re-render per keystroke) ─── */
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<Map<string, string>>(new Map());

  const flushContentUpdate = useCallback(() => {
    if (pendingContentRef.current.size === 0) return;
    const cur = getBlocks();
    let changed = false;
    const next = cur.map((b) => {
      const pending = pendingContentRef.current.get(b.id);
      if (pending !== undefined && pending !== b.content) {
        changed = true;
        return { ...b, content: pending };
      }
      return b;
    });
    pendingContentRef.current.clear();
    if (changed) emitChange(next);
  }, [getBlocks, emitChange]);

  const debouncedContentUpdate = useCallback(
    (blockId: string, text: string) => {
      pendingContentRef.current.set(blockId, text);
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
      contentTimerRef.current = setTimeout(flushContentUpdate, 120);
    },
    [flushContentUpdate]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
      flushContentUpdate();
    };
  }, [flushContentUpdate]);

  const insertBlockAfter = useCallback(
    (afterId: string, newBlock: DocBlock) => {
      flushContentUpdate(); // Commit pending content before structural change
      const cur = getBlocks();
      const idx = cur.findIndex((b) => b.id === afterId);
      const next = [...cur];
      next.splice(idx + 1, 0, newBlock);
      emitChange(next);
      requestAnimationFrame(() => {
        const el = blockRefs.current.get(newBlock.id);
        if (el) {
          el.focus();
          const sel = window.getSelection();
          if (sel) sel.collapse(el, 0);
        }
      });
      return newBlock.id;
    },
    [getBlocks, emitChange, flushContentUpdate]
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      flushContentUpdate(); // Commit pending content before structural change
      const cur = getBlocks();
      if (cur.length <= 1) {
        emitChange([{ id: cur[0].id, type: "paragraph", content: "" }]);
        return;
      }
      const idx = cur.findIndex((b) => b.id === blockId);
      const next = cur.filter((b) => b.id !== blockId);
      emitChange(next);
      const prevIdx = Math.max(0, idx - 1);
      const prevBlock = next[prevIdx];
      if (prevBlock) {
        requestAnimationFrame(() => {
          const el = blockRefs.current.get(prevBlock.id);
          if (el) {
            el.focus();
            const s = window.getSelection();
            if (s) { s.selectAllChildren(el); s.collapseToEnd(); }
          }
        });
      }
    },
    [getBlocks, emitChange, flushContentUpdate]
  );

  const changeBlockType = useCallback(
    (blockId: string, type: DocBlockType, level?: number) => {
      const updates: Partial<DocBlock> = { type, level };
      if (type === "checklist") updates.checked = false;
      if (type === "callout") {
        updates.calloutColor = updates.calloutColor || "#3B82F6";
        updates.calloutIcon = updates.calloutIcon || "info";
      }
      if (type === "toggle") updates.collapsed = false;
      if (type === "table") {
        updates.tableData = { headers: ["Column 1", "Column 2", "Column 3"], rows: [["", "", ""], ["", "", ""]] };
      }
      updateBlock(blockId, updates);
    },
    [updateBlock]
  );

  /* ─── Slash Menu ─── */
  const slashMenuOpenRef = useRef(slashMenuOpen);
  slashMenuOpenRef.current = slashMenuOpen;
  const slashMenuBlockIdRef = useRef(slashMenuBlockId);
  slashMenuBlockIdRef.current = slashMenuBlockId;

  const openSlashMenu = useCallback((blockId: string) => {
    setSlashMenuOpen(true);
    setSlashQuery("");
    setSlashMenuIndex(0);
    setSlashMenuBlockId(blockId);
  }, []);

  const closeSlashMenu = useCallback(() => {
    setSlashMenuOpen(false);
    setSlashQuery("");
    setSlashMenuBlockId(null);
  }, []);

  const selectSlashItem = useCallback(
    (item: BlockTypeMeta) => {
      const menuBlockId = slashMenuBlockIdRef.current;
      if (!menuBlockId) return;
      const cur = getBlocks();
      const block = cur.find((b) => b.id === menuBlockId);
      if (!block) return;

      const content = block.content.replace(/\/[^\s]*$/, "").trim();

      // Check if this is an AI slash command
      const aiMatch = item.shortcut?.match(/^\/ai-(.+)$/);
      if (aiMatch && onAiAction) {
        updateBlock(menuBlockId, { content });
        closeSlashMenu();
        onAiAction(item.shortcut!.slice(1) as AiSlashAction, menuBlockId);
        return;
      }

      if (item.type === "divider") {
        updateBlock(menuBlockId, { content, type: "paragraph" });
        const dividerBlock: DocBlock = { id: generateBlockId(), type: "divider", content: "" };
        insertBlockAfter(menuBlockId, dividerBlock);
        const paraBlock: DocBlock = { id: generateBlockId(), type: "paragraph", content: "" };
        requestAnimationFrame(() => insertBlockAfter(dividerBlock.id, paraBlock));
      } else if (item.type === "embed") {
        updateBlock(menuBlockId, { content: "", type: "embed", embedUrl: "", embedType: "youtube" });
      } else if (item.type === "table") {
        updateBlock(menuBlockId, {
          content: "", type: "table",
          tableData: { headers: ["Column 1", "Column 2", "Column 3"], rows: [["", "", ""], ["", "", ""]] },
        });
      } else if (item.type === "unsplash-image") {
        updateBlock(menuBlockId, { content: "", type: "unsplash-image" });
      } else if (item.type === "gallery") {
        updateBlock(menuBlockId, { content: "", type: "gallery", galleryImages: [] });
      } else if (item.type === "group-card") {
        const newDocId = onCreateNestedDoc?.(menuBlockId) ?? undefined;
        updateBlock(menuBlockId, { content: "", type: "group-card", linkedDocId: newDocId, cardStyle: "list" });
      } else {
        changeBlockType(menuBlockId, item.type, item.level);
        updateBlock(menuBlockId, { content });
      }

      closeSlashMenu();

      requestAnimationFrame(() => {
        const el = blockRefs.current.get(menuBlockId);
        if (el) {
          el.textContent = content;
          el.focus();
        }
      });
    },
    [getBlocks, updateBlock, insertBlockAfter, changeBlockType, closeSlashMenu, onCreateNestedDoc]
  );

  /* ─── Markdown shortcut ─── */
  const applyMarkdownShortcut = useCallback(
    (blockId: string, type: DocBlockType, level?: number) => {
      changeBlockType(blockId, type, level);
      requestAnimationFrame(() => {
        const el = blockRefs.current.get(blockId);
        if (el) {
          el.textContent = "";
          el.focus();
        }
      });
      updateBlock(blockId, { content: "", type, level, checked: type === "checklist" ? false : undefined });
    },
    [changeBlockType, updateBlock]
  );

  /* ─── Key Handler ─── */
  const handleBlockKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>, blockId: string) => {
      try {
      const cur = getBlocks();
      const block = cur.find((b) => b.id === blockId);
      if (!block) return;
      const el = blockRefs.current.get(blockId);

      // Slash menu navigation
      if (slashMenuOpenRef.current && slashMenuBlockIdRef.current === blockId) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashMenuIndex((i) => Math.min(i + 1, filteredSlashItems.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashMenuIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (filteredSlashItems[slashMenuIndex]) {
            selectSlashItem(filteredSlashItems[slashMenuIndex]);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          closeSlashMenu();
          return;
        }
      }

      // ── Autocomplete navigation ──
      if (autocompleteOpenRef.current && autocompleteBlockId === blockId) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setAutocompleteIndex((i) => Math.min(i + 1, autocompleteItems.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setAutocompleteIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" && autocompleteItems.length > 0) {
          e.preventDefault();
          const selected = autocompleteItems[autocompleteIndex];
          if (selected && el) {
            el.textContent = selected;
            lastSyncedContentMap.current.set(blockId, selected);
            updateBlock(blockId, { content: selected });
            setAutocompleteOpen(false);
            const s = window.getSelection();
            if (s) { s.selectAllChildren(el); s.collapseToEnd(); }
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setAutocompleteOpen(false);
          return;
        }
      }

      // ── @Mention navigation ──
      if (mentionOpenRef.current && mentionBlockId === blockId) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionIndex((i) => Math.min(i + 1, filteredMentionItems.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" && filteredMentionItems.length > 0) {
          e.preventDefault();
          const item = filteredMentionItems[mentionIndex];
          if (item && el) {
            // Replace @query with mention span
            const text = readElText(el);
            const atIdx = text.lastIndexOf("@");
            if (atIdx !== -1) {
              const before = text.substring(0, atIdx);
              const after = text.substring(atIdx + 1 + mentionQuery.length);
              const mentionHtml = `<span data-mention-id="${item.id}" data-mention-type="${item.type}" style="color:var(--accent-primary);font-weight:500;cursor:pointer" contenteditable="false">@${item.label}</span>`;
              el.innerHTML = before + mentionHtml + after + "\u200B";
              // Place cursor after mention
              const s = window.getSelection();
              if (s) { s.selectAllChildren(el); s.collapseToEnd(); }
              debouncedContentUpdate(blockId, el.innerHTML);
            }
            setMentionOpen(false);
            setMentionQuery("");
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setMentionOpen(false);
          return;
        }
      }

      // ── Inline formatting shortcuts ──
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === "b") {
          e.preventDefault();
          document.execCommand("bold");
          return;
        }
        if (e.key === "i") {
          e.preventDefault();
          document.execCommand("italic");
          return;
        }
        if (e.key === "e") {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            const range = sel.getRangeAt(0);
            const code = document.createElement("code");
            code.style.cssText = "background:var(--neutral-100);padding:1px 4px;border-radius:3px;font-family:'Courier Prime',monospace;font-size:0.9em";
            range.surroundContents(code);
          }
          return;
        }
        // Cmd+K — insert link
        if (e.key === "k") {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel && !sel.isCollapsed) {
            const selectedText = sel.toString();
            const url = prompt("Enter URL:", "https://");
            if (url) {
              const range = sel.getRangeAt(0);
              const link = document.createElement("a");
              link.href = url;
              link.target = "_blank";
              link.rel = "noopener noreferrer";
              link.style.cssText = "color:var(--accent-primary);text-decoration:underline";
              range.surroundContents(link);
            }
          } else {
            const url = prompt("Enter URL:", "https://");
            if (url) {
              const linkText = prompt("Link text:", url) || url;
              document.execCommand("insertHTML", false, `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-primary);text-decoration:underline">${linkText}</a>`);
            }
          }
          return;
        }
        // Cmd+D — duplicate current block
        if (e.key === "d") {
          e.preventDefault();
          flushContentUpdate();
          const dupBlock: DocBlock = { ...block, id: generateBlockId(), content: el ? readElText(el) : block.content };
          insertBlockAfter(blockId, dupBlock);
          return;
        }
        // Cmd+/ — toggle slash menu
        if (e.key === "/") {
          e.preventDefault();
          if (slashMenuOpenRef.current) {
            closeSlashMenu();
          } else {
            openSlashMenu(blockId);
          }
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "s") {
        e.preventDefault();
        document.execCommand("strikeThrough");
        return;
      }
      // Cmd+Shift+H — cycle heading level (paragraph → h1 → h2 → h3 → paragraph)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        if (block.type === "paragraph") {
          changeBlockType(blockId, "heading", 1);
        } else if (block.type === "heading" && block.level === 1) {
          changeBlockType(blockId, "heading", 2);
        } else if (block.type === "heading" && block.level === 2) {
          changeBlockType(blockId, "heading", 3);
        } else if (block.type === "heading" && block.level === 3) {
          changeBlockType(blockId, "paragraph");
        } else {
          changeBlockType(blockId, "heading", 1);
        }
        return;
      }

      // ── Markdown shortcuts on Space ──
      if (e.key === " " && el && block.type === "paragraph") {
        const text = readElText(el);
        let matched = true;
        if (text === "#") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "heading", 1);
        } else if (text === "##") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "heading", 2);
        } else if (text === "###") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "heading", 3);
        } else if (text === "-" || text === "*") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "bulleted-list");
        } else if (text === "1.") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "numbered-list");
        } else if (text === "[]") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "checklist");
        } else if (text === ">") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "quote");
        } else {
          matched = false;
        }
        if (matched) return;
      }

      // ── Code/divider shortcuts ──
      if (el && block.type === "paragraph") {
        const text = readElText(el);
        if (text === "```" && e.key !== "Backspace") {
          e.preventDefault();
          applyMarkdownShortcut(blockId, "code");
          return;
        }
        if (text === "---" && e.key !== "Backspace") {
          e.preventDefault();
          changeBlockType(blockId, "divider");
          updateBlock(blockId, { content: "" });
          const newBlock: DocBlock = { id: generateBlockId(), type: "paragraph", content: "" };
          insertBlockAfter(blockId, newBlock);
          return;
        }
      }

      // Enter → new block
      if (e.key === "Enter" && !e.shiftKey) {
        if (block.type === "code") return;

        e.preventDefault();
        closeSlashMenu();

        if (!el) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const preRange = document.createRange();
        preRange.selectNodeContents(el);
        preRange.setEnd(range.startContainer, range.startOffset);
        const beforeText = preRange.toString();
        const fullText = readElText(el);
        const afterText = fullText.substring(beforeText.length);

        updateBlock(blockId, { content: beforeText });
        el.textContent = beforeText;

        // Script auto-advance: pressing Enter advances to next logical element type
        const SCRIPT_ADVANCE: Record<string, DocBlockType> = {
          "scene-heading": "action",
          "action": "character",
          "character": "dialogue",
          "dialogue": "action",
          "parenthetical": "dialogue",
          "transition": "scene-heading",
        };
        const isScriptBlock = block.type in SCRIPT_ADVANCE;
        const newType: DocBlockType = isScriptBlock
          ? (afterText ? block.type : SCRIPT_ADVANCE[block.type]) as DocBlockType
          : ["heading", "divider"].includes(block.type) ? "paragraph" : block.type as DocBlockType;
        const newBlock: DocBlock = {
          id: generateBlockId(),
          type: newType,
          content: afterText,
          checked: block.type === "checklist" ? false : undefined,
        };
        insertBlockAfter(blockId, newBlock);
        return;
      }

      // Backspace at start
      if (e.key === "Backspace" && el) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const atStart =
            range.collapsed &&
            range.startOffset === 0 &&
            (range.startContainer === el || range.startContainer === el.firstChild);

          if (atStart) {
            const text = readElText(el);
            if (!text.trim()) {
              // Empty block: revert to paragraph or delete
              if (block.type !== "paragraph") {
                e.preventDefault();
                changeBlockType(blockId, "paragraph");
                return;
              }
              e.preventDefault();
              deleteBlock(blockId);
              return;
            }
            // Non-empty block at cursor start: merge content into previous block
            const idx = cur.findIndex((b) => b.id === blockId);
            if (idx > 0) {
              const prevBlock = cur[idx - 1];
              // Only merge into text-content blocks (skip dividers, images, tables, etc.)
              const nonMergeTypes: DocBlockType[] = ["divider", "image", "unsplash-image", "gallery", "embed", "table", "group-card"];
              if (!nonMergeTypes.includes(prevBlock.type)) {
                e.preventDefault();
                const prevEl = blockRefs.current.get(prevBlock.id);
                const prevText = prevEl ? readElText(prevEl) : prevBlock.content;
                const cursorPos = prevText.length;
                // Merge: append current text to previous block
                flushContentUpdate();
                updateBlock(prevBlock.id, { content: prevText + text });
                // Delete current block
                const next = cur.filter((b) => b.id !== blockId);
                emitChange(next);
                // Focus previous block and place cursor at merge point
                requestAnimationFrame(() => {
                  const mergedEl = blockRefs.current.get(prevBlock.id);
                  if (mergedEl) {
                    mergedEl.textContent = prevText + text;
                    mergedEl.focus();
                    const s = window.getSelection();
                    if (s && mergedEl.firstChild) {
                      const r = document.createRange();
                      r.setStart(mergedEl.firstChild, Math.min(cursorPos, mergedEl.firstChild.textContent?.length || 0));
                      r.collapse(true);
                      s.removeAllRanges();
                      s.addRange(r);
                    }
                  }
                });
                return;
              }
            }
          }
        }
      }

      // Tab — script mode: cycle through element types
      if (e.key === "Tab") {
        e.preventDefault();
        // Autocomplete: accept suggestion
        if (autocompleteOpen && autocompleteBlockId === blockId && autocompleteItems.length > 0) {
          const selected = autocompleteItems[autocompleteIndex];
          if (selected && el) {
            el.textContent = selected;
            lastSyncedContentMap.current.set(blockId, selected);
            updateBlock(blockId, { content: selected });
            setAutocompleteOpen(false);
            const s = window.getSelection();
            if (s) { s.selectAllChildren(el); s.collapseToEnd(); }
          }
          return;
        }
        if (block.type === "code") {
          document.execCommand("insertText", false, "  ");
          return;
        }
        // Script mode: Tab cycles between element types
        const SCRIPT_CYCLE: DocBlockType[] = [
          "scene-heading", "action", "character", "dialogue", "parenthetical", "transition",
        ];
        if (scriptMode && SCRIPT_CYCLE.includes(block.type as any)) {
          const curIdx = SCRIPT_CYCLE.indexOf(block.type as any);
          const nextType = e.shiftKey
            ? SCRIPT_CYCLE[(curIdx - 1 + SCRIPT_CYCLE.length) % SCRIPT_CYCLE.length]
            : SCRIPT_CYCLE[(curIdx + 1) % SCRIPT_CYCLE.length];
          changeBlockType(blockId, nextType);
          return;
        }
        // Tab/Shift+Tab on list blocks: cycle list type (indent/outdent equivalent)
        const LIST_TYPES: DocBlockType[] = ["bulleted-list", "numbered-list", "checklist"];
        if (LIST_TYPES.includes(block.type)) {
          const curListIdx = LIST_TYPES.indexOf(block.type);
          if (e.shiftKey) {
            // Shift+Tab on list: convert back to paragraph (outdent)
            changeBlockType(blockId, "paragraph");
          } else {
            // Tab on list: cycle to next list type
            const nextListType = LIST_TYPES[(curListIdx + 1) % LIST_TYPES.length];
            changeBlockType(blockId, nextListType);
          }
          return;
        }
        // Tab on paragraph: convert to bulleted list (indent)
        if (block.type === "paragraph") {
          changeBlockType(blockId, "bulleted-list");
          return;
        }
        return;
      }

      // ArrowUp
      if (e.key === "ArrowUp") {
        const idx = cur.findIndex((b) => b.id === blockId);
        if (idx > 0) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (range.collapsed && range.startOffset === 0) {
              e.preventDefault();
              const prevEl = blockRefs.current.get(cur[idx - 1].id);
              if (prevEl) {
                prevEl.focus();
                const s = window.getSelection();
                if (s) { s.selectAllChildren(prevEl); s.collapseToEnd(); }
              }
            }
          }
        }
      }

      // ArrowDown
      if (e.key === "ArrowDown") {
        const idx = cur.findIndex((b) => b.id === blockId);
        if (idx < cur.length - 1 && el) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const textLen = el.textContent?.length || 0;
            if (range.collapsed && range.startOffset >= textLen) {
              e.preventDefault();
              const nextEl = blockRefs.current.get(cur[idx + 1].id);
              if (nextEl) {
                nextEl.focus();
                const s = window.getSelection();
                if (s) s.collapse(nextEl, 0);
              }
            }
          }
        }
      }
      } catch (err) {
        console.error("[DescriptionBlockEditor] Error in handleBlockKeyDown:", err);
      }
    },
    [getBlocks, filteredSlashItems, slashMenuIndex, selectSlashItem, closeSlashMenu, openSlashMenu,
     updateBlock, insertBlockAfter, deleteBlock, changeBlockType, applyMarkdownShortcut,
     autocompleteOpen, autocompleteBlockId, autocompleteItems, autocompleteIndex, scriptMode,
     flushContentUpdate, emitChange, mentionBlockId, filteredMentionItems, mentionIndex, mentionQuery, debouncedContentUpdate]
  );

  /* ─── Input Handler ─── */
  const handleBlockInput = useCallback(
    (blockId: string) => {
      try {
      const el = blockRefs.current.get(blockId);
      if (!el) return;

      const text = readElText(el);
      // Use debounced update for content-only changes (perf optimization)
      debouncedContentUpdate(blockId, text);

      if (text.endsWith("/") || (slashMenuOpenRef.current && slashMenuBlockIdRef.current === blockId)) {
        const slashIdx = text.lastIndexOf("/");
        if (slashIdx !== -1) {
          const query = text.substring(slashIdx + 1);
          if (!slashMenuOpenRef.current) {
            openSlashMenu(blockId);
          }
          setSlashQuery(query);
          setSlashMenuIndex(0);
        }
      } else if (slashMenuOpenRef.current && slashMenuBlockIdRef.current === blockId) {
        closeSlashMenu();
      }

      // Script autocomplete: character names / location names
      if (scriptMode && text.length > 0) {
        const cur = getBlocks();
        const block = cur.find((b) => b.id === blockId);
        if (block?.type === "character" && knownCharacters.length > 0) {
          const q = text.toUpperCase();
          const matches = knownCharacters.filter((c) => c.toUpperCase().startsWith(q) && c.toUpperCase() !== q);
          if (matches.length > 0) {
            setAutocompleteItems(matches.slice(0, 6));
            setAutocompleteIndex(0);
            setAutocompleteBlockId(blockId);
            setAutocompleteOpen(true);
          } else {
            setAutocompleteOpen(false);
          }
        } else if (block?.type === "scene-heading" && knownLocations.length > 0) {
          const q = text.toUpperCase();
          const matches = knownLocations.filter((l) => l.toUpperCase().includes(q) && l.toUpperCase() !== q);
          if (matches.length > 0) {
            setAutocompleteItems(matches.slice(0, 6));
            setAutocompleteIndex(0);
            setAutocompleteBlockId(blockId);
            setAutocompleteOpen(true);
          } else {
            setAutocompleteOpen(false);
          }
        } else {
          if (autocompleteOpenRef.current) setAutocompleteOpen(false);
        }
      } else {
        if (autocompleteOpenRef.current) setAutocompleteOpen(false);
      }

      // @Mention detection
      if (mentionItems.length > 0) {
        const atIdx = text.lastIndexOf("@");
        if (atIdx !== -1) {
          const afterAt = text.substring(atIdx + 1);
          // Only trigger if the @ is at the start or preceded by a space, and no space in the query
          const charBefore = atIdx > 0 ? text[atIdx - 1] : " ";
          if ((charBefore === " " || charBefore === "\n" || atIdx === 0) && !afterAt.includes(" ") && afterAt.length < 30) {
            setMentionOpen(true);
            setMentionQuery(afterAt);
            setMentionIndex(0);
            setMentionBlockId(blockId);
          } else {
            if (mentionOpenRef.current) setMentionOpen(false);
          }
        } else {
          if (mentionOpenRef.current) setMentionOpen(false);
        }
      }
      } catch (err) {
        console.error("[DescriptionBlockEditor] Error in handleBlockInput:", err);
      }
    },
    [debouncedContentUpdate, openSlashMenu, closeSlashMenu, scriptMode, knownCharacters, knownLocations, getBlocks, mentionItems]
  );

  /* ─── Paste handler ─── */
  const handlePaste = useCallback((e: ClipboardEvent<HTMLElement>, blockId: string) => {
    const cur = getBlocks();
    const block = cur.find((b) => b.id === blockId);
    if (block?.type !== "code") {
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }
  }, [getBlocks]);

  /* ─── Add block at end ─── */
  const addBlockAtEnd = useCallback(() => {
    const cur = getBlocks();
    const newBlock: DocBlock = { id: generateBlockId(), type: "paragraph", content: "" };
    insertBlockAfter(cur[cur.length - 1].id, newBlock);
  }, [getBlocks, insertBlockAfter]);

  /* ─── Drag & Drop reorder ─── */
  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDropTargetIdx(idx);
  }, []);

  const handleDrop = useCallback((targetIdx: number) => {
    if (draggedBlockId === null) return;
    const cur = getBlocks();
    const srcIdx = cur.findIndex((b) => b.id === draggedBlockId);
    if (srcIdx === -1 || srcIdx === targetIdx) {
      setDropTargetIdx(null);
      return;
    }
    const next = [...cur];
    const [moved] = next.splice(srcIdx, 1);
    const insertAt = targetIdx > srcIdx ? targetIdx - 1 : targetIdx;
    next.splice(insertAt, 0, moved);
    emitChange(next);
    setDropTargetIdx(null);
    setDraggedBlockId(null);
  }, [draggedBlockId, getBlocks, emitChange]);

  /* ─── Auto-focus ─── */
  useEffect(() => {
    if (autoFocus && safeBlocks.length > 0) {
      requestAnimationFrame(() => {
        const firstEl = blockRefs.current.get(safeBlocks[0].id);
        if (firstEl) firstEl.focus();
      });
    }
  }, [autoFocus]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── Register block ref ─── */
  const setBlockRef = useCallback((blockId: string, el: HTMLElement | null) => {
    if (el) blockRefs.current.set(blockId, el);
    else blockRefs.current.delete(blockId);
  }, []);

  /* ─── Block Selection (click-to-select, second-click-to-edit) ─── */
  const handleBlockClick = useCallback((blockId: string, idx: number, e: React.MouseEvent) => {
    if (readOnly) return;
    // Suppress click if it followed a marquee drag
    if (suppressNextClick.current) { suppressNextClick.current = false; return; }
    // Shift-click: range select
    if (e.shiftKey && lastClickedBlockIdx.current !== null) {
      const start = Math.min(lastClickedBlockIdx.current, idx);
      const end = Math.max(lastClickedBlockIdx.current, idx);
      const rangeIds = new Set<string>();
      for (let i = start; i <= end; i++) {
        if (safeBlocks[i]) rangeIds.add(safeBlocks[i].id);
      }
      setSelectedBlockIds(rangeIds);
      setEditingBlockId(null);
      e.preventDefault();
      return;
    }
    // Cmd/Ctrl-click: toggle single
    if (e.metaKey || e.ctrlKey) {
      setSelectedBlockIds((prev) => {
        const next = new Set(prev);
        if (next.has(blockId)) next.delete(blockId);
        else next.add(blockId);
        return next;
      });
      setEditingBlockId(null);
      lastClickedBlockIdx.current = idx;
      e.preventDefault();
      return;
    }
    // If this block is already the sole selected block → enter edit mode
    if (selectedBlockIds.size === 1 && selectedBlockIds.has(blockId) && editingBlockId === null) {
      setEditingBlockId(blockId);
      setSelectedBlockIds(new Set());
      requestAnimationFrame(() => {
        const el = blockRefs.current.get(blockId);
        if (el) { el.focus(); placeCursorAtEnd(el); }
      });
      lastClickedBlockIdx.current = idx;
      return;
    }
    // Normal click: select this block only
    if (editingBlockId && editingBlockId !== blockId) {
      const el = blockRefs.current.get(editingBlockId);
      if (el) el.blur();
    }
    setSelectedBlockIds(new Set([blockId]));
    setEditingBlockId(null);
    lastClickedBlockIdx.current = idx;
  }, [readOnly, safeBlocks, selectedBlockIds, editingBlockId]);

  const clearSelection = useCallback(() => { setSelectedBlockIds(new Set()); setEditingBlockId(null); }, []);

  /* ─── Unified Marquee mousedown (works from anywhere on the page) ─── */
  const handleMarqueeMouseDown = useCallback((e: React.MouseEvent) => {
    if (readOnly || e.button !== 0) return;
    const target = e.target as HTMLElement;
    const container = containerRef.current;
    if (!container || !container.contains(target)) return;

    // Allow normal interaction inside the editing block's contentEditable
    if (editingBlockIdRef.current) {
      const editingEl = blockRefs.current.get(editingBlockIdRef.current);
      if (editingEl && (editingEl === target || editingEl.contains(target))) return;
    }

    // Skip interactive elements (buttons, inputs, links, menus, dialogs)
    if (target.closest("button") || target.closest("input") || target.closest("textarea") || target.closest("select") || target.closest("a[href]") || target.closest("[role='menu']") || target.closest("[role='dialog']")) return;

    // Prevent contentEditable focus — selection mode takes priority
    e.preventDefault();

    // Determine which block (if any) was clicked
    const blockWrapper = target.closest("[data-block-wrapper]") as HTMLElement | null;
    let clickedBlockIdx: number | null = null;
    let clickedBlockId: string | null = null;
    if (blockWrapper) {
      for (let i = 0; i < safeBlocks.length; i++) {
        const el = blockRefs.current.get(safeBlocks[i].id);
        if (el) {
          const wrapper = el.closest("[data-block-wrapper]");
          if (wrapper === blockWrapper) {
            clickedBlockIdx = i;
            clickedBlockId = safeBlocks[i].id;
            break;
          }
        }
      }
    }

    const containerRect = container.getBoundingClientRect();
    marqueeState.current = {
      active: true,
      originX: e.clientX - containerRect.left + container.scrollLeft,
      originY: e.clientY - containerRect.top + container.scrollTop,
      clientOriginX: e.clientX,
      clientOriginY: e.clientY,
      scrollTop: container.scrollTop,
      moved: false,
      clickedBlockId,
      clickedBlockIdx,
      shiftKey: e.shiftKey,
      metaOrCtrlKey: e.metaKey || e.ctrlKey,
    };
    setMarqueeRect(null);
  }, [readOnly, safeBlocks]);

  /* ─── Unified mousemove / mouseup for marquee ─── */
  useEffect(() => {
    if (readOnly) return;
    const DRAG_THRESHOLD = 5;

    const handleMouseMove = (e: MouseEvent) => {
      if (!marqueeState.current?.active) return;

      const dx = e.clientX - marqueeState.current.clientOriginX;
      const dy = e.clientY - marqueeState.current.clientOriginY;
      if (!marqueeState.current.moved && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      marqueeState.current.moved = true;

      e.preventDefault();
      window.getSelection()?.removeAllRanges();

      const container = containerRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const curX = e.clientX - containerRect.left + container.scrollLeft;
      const curY = e.clientY - containerRect.top + container.scrollTop;
      const ox = marqueeState.current.originX;
      const oy = marqueeState.current.originY;
      const rect = {
        x: Math.min(ox, curX),
        y: Math.min(oy, curY),
        w: Math.abs(curX - ox),
        h: Math.abs(curY - oy),
      };
      setMarqueeRect(rect);

      // Exit editing mode when marquee dragging
      if (editingBlockIdRef.current) {
        const editEl = blockRefs.current.get(editingBlockIdRef.current);
        if (editEl) editEl.blur();
        setEditingBlockId(null);
      }

      // Determine which blocks intersect
      const hitIds = new Set<string>();
      for (let i = 0; i < safeBlocks.length; i++) {
        const el = blockRefs.current.get(safeBlocks[i].id);
        if (!el) continue;
        const wrapper = el.closest("[data-block-wrapper]") as HTMLElement | null;
        const bRect = (wrapper || el).getBoundingClientRect();
        const bx = bRect.left - containerRect.left + container.scrollLeft;
        const by = bRect.top - containerRect.top + container.scrollTop;
        const bw = bRect.width;
        const bh = bRect.height;
        if (rect.x < bx + bw && rect.x + rect.w > bx && rect.y < by + bh && rect.y + rect.h > by) {
          hitIds.add(safeBlocks[i].id);
        }
      }
      setSelectedBlockIds(hitIds);
    };

    const handleMouseUp = () => {
      if (!marqueeState.current?.active) return;
      const ms = marqueeState.current;
      if (ms.moved) {
        // Marquee drag completed — suppress the upcoming click event
        suppressNextClick.current = true;
      } else {
        // No movement — treat as a click. The block wrapper's onClick will handle it.
        // If clicked on empty space (no block), clear selection + editing
        if (!ms.clickedBlockId) {
          if (editingBlockIdRef.current) {
            const el = blockRefs.current.get(editingBlockIdRef.current);
            if (el) el.blur();
          }
          setSelectedBlockIds(new Set());
          setEditingBlockId(null);
        }
      }
      marqueeState.current = null;
      setMarqueeRect(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [readOnly, safeBlocks]);

  const handleSelectionChangeType = useCallback((ids: string[], type: DocBlockType, level?: number) => {
    ids.forEach((id) => {
      updateBlock(id, { type, level: type === "heading" ? level : undefined });
    });
  }, [updateBlock]);

  const handleSelectionChangeDecoration = useCallback((ids: string[], decoration: DocBlock["decoration"]) => {
    ids.forEach((id) => {
      const cur = getBlocks().find((b) => b.id === id);
      updateBlock(id, { decoration: cur?.decoration === decoration ? undefined : decoration });
    });
  }, [updateBlock, getBlocks]);

  const handleSelectionChangeColor = useCallback((ids: string[], color: string | undefined) => {
    ids.forEach((id) => updateBlock(id, { color }));
  }, [updateBlock]);

  const handleDeleteSelected = useCallback(() => {
    const cur = getBlocks();
    const remaining = cur.filter((b) => !selectedBlockIds.has(b.id));
    if (remaining.length === 0) {
      remaining.push({ id: generateBlockId(), type: "paragraph", content: "" });
    }
    emitChange(remaining);
    setSelectedBlockIds(new Set());
    setEditingBlockId(null);
  }, [getBlocks, selectedBlockIds, emitChange]);

  const handleGroupIntoCard = useCallback((ids: string[]) => {
    if (!onCreateNestedDoc || ids.length === 0) return;
    // Gather selected blocks in document order
    const cur = getBlocks();
    const selectedBlocks = cur.filter((b) => ids.includes(b.id));
    if (selectedBlocks.length === 0) return;

    // Create a nested doc — the parent (DocsPage) will create it and return the ID
    const firstId = ids[0];
    const newDocId = onCreateNestedDoc(firstId, selectedBlocks);
    if (!newDocId) return;

    // Replace the first selected block with a group-card block pointing to the new doc
    const groupCardBlock: DocBlock = {
      id: firstId,
      type: "group-card",
      content: "",
      linkedDocId: newDocId,
      cardStyle: "list",
    };

    // Remove all selected blocks except the first (which becomes the card), then replace it
    const next = cur.map((b) => {
      if (b.id === firstId) return groupCardBlock;
      return b;
    }).filter((b) => !ids.includes(b.id) || b.id === firstId);

    emitChange(next);
    setSelectedBlockIds(new Set());
    toast.success("Grouped into nested document");
  }, [getBlocks, emitChange, onCreateNestedDoc]);

  // Escape key clears selection and editing mode
  useEffect(() => {
    if (selectedBlockIds.size === 0 && editingBlockId === null) return;
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (editingBlockId) {
          // Exit editing mode → re-select the block
          const el = blockRefs.current.get(editingBlockId);
          if (el) el.blur();
          setSelectedBlockIds(new Set([editingBlockId]));
          setEditingBlockId(null);
        } else {
          setSelectedBlockIds(new Set());
        }
        return;
      }
      // Delete/Backspace while blocks are selected (not editing) → delete them
      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockIds.size > 0 && !editingBlockId) {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }
      // Cmd/Ctrl+A while blocks are selected (not editing) → select all blocks
      if (e.key === "a" && (e.metaKey || e.ctrlKey) && selectedBlockIds.size > 0 && !editingBlockId) {
        e.preventDefault();
        const allIds = new Set(safeBlocks.map((b) => b.id));
        setSelectedBlockIds(allIds);
        return;
      }
      // Cmd/Ctrl+D while blocks are selected (not editing) → duplicate selected blocks
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && selectedBlockIds.size > 0 && !editingBlockId) {
        e.preventDefault();
        flushContentUpdate();
        const cur = getBlocks();
        const selectedInOrder = cur.filter((b) => selectedBlockIds.has(b.id));
        const duplicates = selectedInOrder.map((b) => ({ ...b, id: generateBlockId() }));
        // Insert duplicates after the last selected block
        const lastSelected = selectedInOrder[selectedInOrder.length - 1];
        const lastIdx = cur.findIndex((b) => b.id === lastSelected.id);
        const next = [...cur];
        next.splice(lastIdx + 1, 0, ...duplicates);
        emitChange(next);
        setSelectedBlockIds(new Set(duplicates.map((b) => b.id)));
        toast.success(`Duplicated ${duplicates.length} block${duplicates.length > 1 ? "s" : ""}`);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedBlockIds.size, editingBlockId, handleDeleteSelected, safeBlocks, flushContentUpdate, getBlocks, emitChange]);

  return (
    <div ref={containerRef} className={`relative ${className}`} onMouseDown={handleMarqueeMouseDown}>
      <div className={contentClassName}>
      {/* Script Element Toolbar (only in script mode) */}
      {scriptMode && !readOnly && (
        <div className="flex items-center gap-1 mb-3 pb-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-default)" }}>
          {SCRIPT_BLOCK_TYPES.map((sbt) => (
            <button
              key={sbt.type}
              onClick={() => {
                const cur = getBlocks();
                const newBlock: DocBlock = { id: generateBlockId(), type: sbt.type, content: "" };
                const lastBlock = cur[cur.length - 1];
                insertBlockAfter(lastBlock.id, newBlock);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-[5px] whitespace-nowrap transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 500 }}
            >
              <sbt.icon className="w-3 h-3" />
              {sbt.label}
            </button>
          ))}
        </div>
      )}
      <div ref={blocksListRef} className="space-y-0.5 marquee-zone">
        {safeBlocks.map((block, idx) => (
          <div
            key={block.id}
            data-block-wrapper
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onClick={(e) => handleBlockClick(block.id, idx, e)}
            onDoubleClick={(e) => {
              if (readOnly) return;
              e.preventDefault();
              e.stopPropagation();
              setEditingBlockId(block.id);
              setSelectedBlockIds(new Set());
              requestAnimationFrame(() => {
                const el = blockRefs.current.get(block.id);
                if (el) { el.focus(); placeCursorAtEnd(el); }
              });
            }}
          >
            {dropTargetIdx === idx && draggedBlockId && (
              <div className="h-0.5 rounded-full mx-8 my-0.5" style={{ background: "var(--accent-primary)" }} />
            )}
            <BlockItem
              block={block}
              index={idx}
              totalBlocks={safeBlocks.length}
              focused={focusedBlockId === block.id}
              hovered={hoveredBlockId === block.id}
              selected={selectedBlockIds.has(block.id)}
              isEditing={editingBlockId === block.id}
              readOnly={readOnly}
              placeholder={idx === 0 && safeBlocks.length === 1 ? placeholder : ""}
              onFocus={() => { setFocusedBlockId(block.id); setEditingBlockId(block.id); }}
              onBlur={() => { setFocusedBlockId(null); }}
              onHover={(h) => setHoveredBlockId(h ? block.id : null)}
              onInput={() => handleBlockInput(block.id)}
              onKeyDown={(e) => handleBlockKeyDown(e, block.id)}
              onPaste={(e) => handlePaste(e, block.id)}
              onCheckToggle={() => updateBlock(block.id, { checked: !block.checked })}
              onDelete={() => deleteBlock(block.id)}
              onUpdate={(updates) => updateBlock(block.id, updates)}
              setBlockRef={setBlockRef}
              isDragging={draggedBlockId === block.id}
              onDragStart={() => setDraggedBlockId(block.id)}
              onDragEnd={() => { setDraggedBlockId(null); setDropTargetIdx(null); }}
              onOpenUnsplash={(mode, blockId) => setUnsplashModal({ mode, blockId })}
              resolveDoc={resolveDoc}
              onNavigateDoc={onNavigateDoc}
              remoteUsers={getCollabsOnBlock(block.id, collaborators)}
              enableAi={enableAi}
              onOpenLightbox={(images, index) => setLightbox({ images, index })}
              allDocs={allDocs}
            />
          </div>
        ))}
        {/* Empty drop zone below blocks for marquee selection */}
        {!readOnly && <div className="marquee-zone min-h-[40px]" />}
      </div>

      {/* Slash Command Menu */}
      <AnimatePresence>
        {slashMenuOpen && slashMenuBlockId && (
          <SlashMenu
            items={filteredSlashItems}
            activeIndex={slashMenuIndex}
            onSelect={selectSlashItem}
            blockId={slashMenuBlockId}
            blockRefs={blockRefs}
          />
        )}
      </AnimatePresence>

      {/* Autocomplete dropdown (script mode) */}
      <AnimatePresence>
        {autocompleteOpen && autocompleteBlockId && autocompleteItems.length > 0 && (
          <AutocompleteMenu
            items={autocompleteItems}
            activeIndex={autocompleteIndex}
            onSelect={(item) => {
              const el = blockRefs.current.get(autocompleteBlockId);
              if (el) {
                el.textContent = item;
                lastSyncedContentMap.current.set(autocompleteBlockId, item);
                updateBlock(autocompleteBlockId, { content: item });
                setAutocompleteOpen(false);
                const s = window.getSelection();
                if (s) { s.selectAllChildren(el); s.collapseToEnd(); }
              }
            }}
            blockId={autocompleteBlockId}
            blockRefs={blockRefs}
          />
        )}
      </AnimatePresence>

      {/* @Mention dropdown */}
      <AnimatePresence>
        {mentionOpen && mentionBlockId && filteredMentionItems.length > 0 && (
          <MentionMenu
            items={filteredMentionItems}
            activeIndex={mentionIndex}
            onSelect={(item) => {
              const el = blockRefs.current.get(mentionBlockId);
              if (el) {
                const text = readElText(el);
                const atIdx = text.lastIndexOf("@");
                if (atIdx !== -1) {
                  const before = text.substring(0, atIdx);
                  const after = text.substring(atIdx + 1 + mentionQuery.length);
                  const mentionHtml = `<span data-mention-id="${item.id}" data-mention-type="${item.type}" style="color:var(--accent-primary);font-weight:500;cursor:pointer" contenteditable="false">@${item.label}</span>`;
                  el.innerHTML = before + mentionHtml + after + "\u200B";
                  const s = window.getSelection();
                  if (s) { s.selectAllChildren(el); s.collapseToEnd(); }
                  debouncedContentUpdate(mentionBlockId, el.innerHTML);
                }
                setMentionOpen(false);
                setMentionQuery("");
              }
            }}
            blockId={mentionBlockId}
            blockRefs={blockRefs}
          />
        )}
      </AnimatePresence>

      {/* Add block button */}
      {!readOnly && (
        null
      )}
      </div>{/* end contentClassName wrapper */}

      {/* Marquee overlay */}
      {marqueeRect && marqueeRect.w > 2 && marqueeRect.h > 2 && (
        <div
          className="absolute pointer-events-none rounded-[4px]"
          style={{
            left: marqueeRect.x,
            top: marqueeRect.y,
            width: marqueeRect.w,
            height: marqueeRect.h,
            background: "oklch(0.85 0.025 250 / 0.12)",
            border: "1px solid oklch(0.7 0.035 250 / 0.3)",
            zIndex: 20,
          }}
        />
      )}

      {/* Multi-select toolbar */}
      <AnimatePresence>
        {selectedBlockIds.size > 0 && (
          <SelectionToolbar
            selectedIds={selectedBlockIds}
            blocks={safeBlocks}
            onChangeType={handleSelectionChangeType}
            onChangeDecoration={handleSelectionChangeDecoration}
            onChangeColor={handleSelectionChangeColor}
            onDeleteSelected={handleDeleteSelected}
            onClearSelection={clearSelection}
            onGroupIntoCard={onCreateNestedDoc ? handleGroupIntoCard : undefined}
          />
        )}
      </AnimatePresence>

      {/* Unsplash Search Modal */}
      <AnimatePresence>
        {unsplashModal && (
          <UnsplashSearchModal
            mode={unsplashModal.mode}
            onSelectSingle={(meta) => {
              updateBlock(unsplashModal.blockId, { unsplashMeta: meta });
              setUnsplashModal(null);
            }}
            onSelectMulti={(images) => {
              const block = getBlocks().find((b) => b.id === unsplashModal.blockId);
              const existing = block?.galleryImages || [];
              updateBlock(unsplashModal.blockId, {
                galleryImages: [...existing, ...images],
              });
              setUnsplashModal(null);
            }}
            onClose={() => setUnsplashModal(null)}
          />
        )}
      </AnimatePresence>

      {/* Gallery Lightbox */}
      {lightbox && createPortal(
        <GalleryLightbox
          images={lightbox.images}
          currentIndex={lightbox.index}
          onClose={() => setLightbox(null)}
          onNavigate={(idx) => setLightbox({ ...lightbox, index: idx })}
        />,
        document.body
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BLOCK ITEM
   ═══════════════════════════════════════════════════════════ */

interface BlockItemProps {
  block: DocBlock;
  index: number;
  totalBlocks: number;
  focused: boolean;
  hovered: boolean;
  selected: boolean;
  isEditing: boolean;
  readOnly: boolean;
  placeholder: string;
  onFocus: () => void;
  onBlur: () => void;
  onHover: (h: boolean) => void;
  onInput: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLElement>) => void;
  onCheckToggle: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<DocBlock>) => void;
  setBlockRef: (blockId: string, el: HTMLElement | null) => void;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpenUnsplash?: (mode: "single" | "multi", blockId: string) => void;
  resolveDoc?: (docId: string) => WorkspaceDoc | null;
  onNavigateDoc?: (docId: string) => void;
  /** Remote collaborators focused on this block (D12) */
  remoteUsers?: CollabUser[];
  /** Whether AI features (rewrite) are enabled */
  enableAi?: boolean;
  /** Open gallery lightbox */
  onOpenLightbox?: (images: UnsplashImageMeta[], index: number) => void;
  /** All docs for group-card link picker */
  allDocs?: WorkspaceDoc[];
}

const BlockItem = memo(function BlockItem({
  block,
  index,
  totalBlocks,
  focused,
  hovered,
  selected,
  isEditing,
  readOnly,
  placeholder,
  onFocus,
  onBlur,
  onHover,
  onInput,
  onKeyDown,
  onPaste,
  onCheckToggle,
  onDelete,
  onUpdate,
  setBlockRef,
  isDragging,
  onDragStart,
  onDragEnd,
  onOpenUnsplash,
  resolveDoc,
  onNavigateDoc,
  remoteUsers = [],
  enableAi = true,
  onOpenLightbox,
  allDocs = [],
}: BlockItemProps) {
  const showControls = (hovered || focused) && !readOnly;
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const rewriteRef = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLElement | null>(null);
  const lastSyncedContent = useRef<string>(block.content);

  const refCallback = useCallback(
    (el: HTMLElement | null) => {
      editableRef.current = el;
      setBlockRef(block.id, el);
      if (el && !el.hasAttribute("data-initialized")) {
        el.setAttribute("data-initialized", "1");
        if (block.content) {
          if (hasHtmlFormatting(block.content)) {
            el.innerHTML = block.content;
          } else {
            el.textContent = block.content;
          }
        }
        lastSyncedContent.current = block.content;
      }
    },
    [block.id, setBlockRef] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;
    const domContent = hasHtmlFormatting(block.content) ? readElHtml(el) : readElText(el);
    // Only overwrite the DOM if the incoming content differs from what's already displayed.
    // When the user is actively editing (el is focused), skip the overwrite to avoid
    // cursor jumps caused by the debounced content flush echoing stale text back.
    if (block.content !== domContent) {
      if (document.activeElement !== el) {
        if (hasHtmlFormatting(block.content)) {
          el.innerHTML = block.content || "";
        } else {
          el.textContent = block.content || "";
        }
      }
    }
    lastSyncedContent.current = block.content;
  }, [block.content]);

  const handleInputWrapped = useCallback(() => {
    const el = editableRef.current;
    if (el) {
      lastSyncedContent.current = readElHtml(el);
    }
    onInput();
  }, [onInput]);

  useEffect(() => {
    if (!rewriteOpen) return;
    const handler = (e: MouseEvent) => {
      if (rewriteRef.current && !rewriteRef.current.contains(e.target as Node)) {
        setRewriteOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [rewriteOpen]);

  const handleRewrite = async (style: RewriteStyle) => {
    if (!block.content.trim() || rewriting) return;
    setRewriting(true);
    setRewriteOpen(false);
    try {
      const result = await rewriteText({ text: block.content, style });
      if (result?.rewritten) {
        const el = editableRef.current;
        if (el) {
          el.textContent = result.rewritten;
          lastSyncedContent.current = result.rewritten;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    } catch (err) {
      console.error("[AI] Rewrite error:", err);
      toast.error("Failed to rewrite text. Please try again.");
    }
    setRewriting(false);
  };

  const canRewrite = enableAi && !["divider", "image", "table", "embed", "unsplash-image", "gallery"].includes(block.type) && block.content.trim().length > 0;

  /* ─── Remote presence + decoration wrapper style ─── */
  const remoteBlockStyle = getRemoteBlockBorderStyle(remoteUsers);
  const decorationStyle: React.CSSProperties = { ...remoteBlockStyle };
  if (block.decoration === "focus") {
    decorationStyle.borderLeft = `3px solid ${block.color || "var(--accent-primary)"}`;
    decorationStyle.paddingLeft = "12px";
  } else if (block.decoration === "block") {
    decorationStyle.background = "var(--neutral-50)";
    decorationStyle.borderRadius = "8px";
    decorationStyle.padding = "12px 16px";
    if (block.color) {
      decorationStyle.borderLeft = `3px solid ${block.color}`;
    }
  }

  /* ─── Block-specific styles ─── */
  const getBlockStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      fontFamily: block.fontStyle ? getFontFamily(block.fontStyle) : undefined,
      color: block.color || undefined,
      whiteSpace: "pre-wrap",
      overflowWrap: "break-word",
    };
    switch (block.type) {
      case "heading":
        return {
          ...base,
          fontSize: block.level === 1 ? "24px" : block.level === 2 ? "20px" : "17px",
          fontWeight: block.level === 1 ? 700 : 600,
          color: base.color || "var(--text-primary)",
          lineHeight: 1.3,
        };
      case "quote":
        return {
          ...base,
          borderLeft: `3px solid ${base.color || "var(--accent-primary)"}`,
          paddingLeft: "14px",
          color: base.color || "var(--text-secondary)",
          fontSize: "15px",
          fontStyle: "italic",
          lineHeight: 1.6,
        };
      case "code":
        return {
          ...base,
          fontFamily: "'Courier Prime', monospace",
          fontSize: "13px",
          lineHeight: 1.6,
          background: "var(--neutral-100)",
          color: base.color || "var(--text-secondary)",
          padding: "12px 16px",
          borderRadius: "6px",
          whiteSpace: "pre-wrap",
          overflowX: "auto" as const,
        };
      /* ─── Screenplay block styles ─── */
      case "scene-heading":
        return {
          ...base,
          fontFamily: "'Courier Prime', monospace",
          fontSize: "14px",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          letterSpacing: "0.02em",
          color: base.color || "var(--text-primary)",
          lineHeight: 1.8,
          marginTop: "1em",
        };
      case "action":
        return {
          ...base,
          fontFamily: "'Courier Prime', monospace",
          fontSize: "14px",
          color: base.color || "var(--text-primary)",
          lineHeight: 1.8,
        };
      case "character":
        return {
          ...base,
          fontFamily: "'Courier Prime', monospace",
          fontSize: "14px",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          textAlign: "center" as const,
          color: base.color || "var(--text-primary)",
          lineHeight: 1.8,
          paddingLeft: "25%",
        };
      case "dialogue":
        return {
          ...base,
          fontFamily: "'Courier Prime', monospace",
          fontSize: "14px",
          color: base.color || "var(--text-primary)",
          lineHeight: 1.8,
          paddingLeft: "15%",
          paddingRight: "15%",
        };
      case "parenthetical":
        return {
          ...base,
          fontFamily: "'Courier Prime', monospace",
          fontSize: "14px",
          fontStyle: "italic",
          color: base.color || "var(--text-secondary)",
          lineHeight: 1.8,
          paddingLeft: "20%",
          paddingRight: "20%",
        };
      case "transition":
        return {
          ...base,
          fontFamily: "'Courier Prime', monospace",
          fontSize: "14px",
          fontWeight: 700,
          textTransform: "uppercase" as const,
          textAlign: "right" as const,
          color: base.color || "var(--text-primary)",
          lineHeight: 1.8,
        };
      default:
        return {
          ...base,
          fontSize: "14px",
          color: base.color || "var(--text-primary)",
          lineHeight: 1.6,
        };
    }
  };

  const isEmpty = !block.content;

  /* ─── Drag handle ─── */
  const dragHandle = !readOnly ? (
    <div
      className={`absolute flex items-center gap-0 shrink-0 transition-opacity ${showControls ? "opacity-100" : "opacity-0"}`}
      style={{ width: "28px", left: "-32px", top: "4px" }}
    >
      <button
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        className="p-0.5 rounded hover:bg-black/[0.05] dark:hover:bg-white/[0.05] cursor-grab active:cursor-grabbing"
        style={{ color: "var(--text-quaternary)" }}
      >
        <DotsSixVertical className="w-4 h-4" />
      </button>
    </div>
  ) : null;

  /* ─── AI Rewrite button ─── */
  const aiRewriteBtn = !readOnly && canRewrite && showControls ? (
    <div ref={rewriteRef} className="absolute -top-1 -right-1 z-10">
      {rewriting ? (
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-[6px]"
          style={{ background: "oklch(0.55 0.2 280 / 0.08)", color: "oklch(0.55 0.2 280)", fontSize: "11px" }}
        >
          <CircleNotch className="w-3 h-3 animate-spin" />
          Rewriting...
        </div>
      ) : (
        <>
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setRewriteOpen(!rewriteOpen); }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
            style={{ color: "oklch(0.55 0.2 280)", fontSize: "11px", fontWeight: 500 }}
            title="AI Rewrite"
          >
            <Sparkle className="w-3 h-3" weight="fill" />
            AI
          </button>
          {rewriteOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full right-0 mt-1 w-40 rounded-[8px] shadow-lg border py-1 z-50"
              style={{ background: "var(--surface-bg)", borderColor: "#e8ebf1" }}
            >
              {([
                { style: "concise" as RewriteStyle, label: "Make concise" },
                { style: "professional" as RewriteStyle, label: "Professional" },
                { style: "friendly" as RewriteStyle, label: "Friendly" },
                { style: "detailed" as RewriteStyle, label: "More detailed" },
              ]).map((opt) => (
                <button
                  key={opt.style}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleRewrite(opt.style); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                >
                  <Sparkle className="w-3 h-3" style={{ color: "oklch(0.55 0.2 280)" }} />
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  ) : null;

  /* ═══ DIVIDER ═══ */
  if (block.type === "divider") {
    return (
      <div
        className={`group relative py-3 flex items-center gap-2 rounded-[4px] ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
      >
        {dragHandle}
        <div className="flex-1 h-px" style={{ background: "var(--border-default)" }} />
      </div>
    );
  }

  /* ═══ IMAGE ═══ */
  if (block.type === "image") {
    return (
      <div
        className={`group relative py-1 flex items-start gap-2 rounded-[4px] ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={decorationStyle}
      >
        {dragHandle}
        <div className="flex-1">
          {block.imageUrl ? (
            <div className="rounded-[8px] overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
              <img src={block.imageUrl} alt={block.imageAlt || ""} className="w-full max-h-[400px] object-cover" />
              {block.imageAlt && (
                <p className="px-3 py-2" style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>{block.imageAlt}</p>
              )}
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-2 py-8 rounded-[8px] border-2 border-dashed cursor-pointer hover:border-solid transition-colors"
              style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
              onClick={() => {
                const url = prompt("Enter image URL:");
                if (url) onUpdate({ imageUrl: url });
              }}
            >
              <ImageIcon className="w-5 h-5" />
              <span style={{ fontSize: "13px" }}>Click to add image URL</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══ TABLE ═══ */
  if (block.type === "table") {
    return (
      <TableBlockRenderer
        block={block}
        readOnly={readOnly}
        showControls={showControls}
        selected={selected}
        onHover={onHover}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandle={dragHandle}
      />
    );
  }

  /* ═══ EMBED ═══ */
  if (block.type === "embed") {
    return (
      <EmbedBlockRenderer
        block={block}
        readOnly={readOnly}
        showControls={showControls}
        selected={selected}
        onHover={onHover}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandle={dragHandle}
      />
    );
  }

  /* ═══ UNSPLASH IMAGE ═══ */
  if (block.type === "unsplash-image") {
    return (
      <div
        className={`group relative py-1 flex items-start gap-2 rounded-[4px] ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={decorationStyle}
      >
        {dragHandle}
        <div className="flex-1">
          {block.unsplashMeta?.url ? (
            <div className="rounded-[8px] overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
              <img src={block.unsplashMeta.url} alt="" className="w-full max-h-[400px] object-cover" />
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ background: "var(--neutral-50)" }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-quaternary)" }}>
                  Photo by{" "}
                  <a
                    href={block.unsplashMeta.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {block.unsplashMeta.photographer}
                  </a>
                  {" "}on{" "}
                  <a
                    href="https://unsplash.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Unsplash
                  </a>
                </span>
              </div>
            </div>
          ) : block.imageUrl ? (
            <div className="rounded-[8px] overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
              <img src={block.imageUrl} alt={block.imageAlt || ""} className="w-full max-h-[400px] object-cover" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-2 py-8 rounded-[8px] border-2 border-dashed cursor-pointer hover:border-solid transition-colors"
              style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
              onClick={() => onOpenUnsplash?.("single", block.id)}
            >
              <ImageIcon className="w-5 h-5" />
              <span style={{ fontSize: "13px" }}>Search Unsplash for a photo</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══ GALLERY ═══ */
  if (block.type === "gallery") {
    const images = block.galleryImages || [];
    return (
      <div
        className={`group relative py-1 flex items-start gap-2 rounded-[4px] ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={decorationStyle}
      >
        {dragHandle}
        <div className="flex-1">
          {images.length > 0 ? (
            <div className="space-y-2">
              <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : images.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}>
                {images.map((img, i) => (
                  <div key={img.id || i} className="rounded-[6px] overflow-hidden border relative group/img cursor-pointer" style={{ borderColor: "var(--border-default)" }} onClick={() => onOpenLightbox?.(images, i)}>
                    <img src={img.thumbUrl || img.url} alt="" className="w-full h-32 object-cover transition-transform hover:scale-105" />
                    <div
                      className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/50 to-transparent"
                    >
                      <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)" }}>
                        {img.photographer}
                      </span>
                    </div>
                    {!readOnly && showControls && (
                      <button
                        onClick={() => {
                          const filtered = images.filter((_, idx) => idx !== i);
                          onUpdate({ galleryImages: filtered });
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!readOnly && showControls && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenUnsplash?.("multi", block.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
                    style={{ color: "var(--text-quaternary)", fontSize: "11px" }}
                  >
                    <Plus className="w-3 h-3" /> Add images
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-2 py-8 rounded-[8px] border-2 border-dashed cursor-pointer hover:border-solid transition-colors"
              style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
              onClick={() => onOpenUnsplash?.("multi", block.id)}
            >
              <ImageIcon className="w-5 h-5" />
              <span style={{ fontSize: "13px" }}>Search Unsplash to create gallery</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══ GROUP CARD (nested doc) ═══ */
  if (block.type === "group-card") {
    const linkedDoc = block.linkedDocId && resolveDoc ? resolveDoc(block.linkedDocId) : null;
    return (
      <div
        className={`group relative py-1 flex items-start gap-2 rounded-[4px] ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={decorationStyle}
      >
        {dragHandle}
        <div className="flex-1">
          <GroupCard
            linkedDoc={linkedDoc}
            cardStyle={block.cardStyle || "compact"}
            onNavigate={() => {
              if (block.linkedDocId && onNavigateDoc) {
                onNavigateDoc(block.linkedDocId);
              }
            }}
            onChangeStyle={(style) => onUpdate({ cardStyle: style })}
            readOnly={readOnly}
            selected={selected}
            availableDocs={allDocs.filter((d) => d.id !== block.linkedDocId)}
            onLinkDoc={(docId) => onUpdate({ linkedDocId: docId })}
            onUnlink={() => onUpdate({ linkedDocId: undefined })}
          />
        </div>
      </div>
    );
  }

  /* ═══ CALLOUT ═══ */
  if (block.type === "callout") {
    const CalloutIcon = CALLOUT_ICON_MAP[block.calloutIcon || "info"] || Info;
    const calloutColor = block.calloutColor || "#3B82F6";
    return (
      <div
        className={`group relative flex items-start gap-2 py-0.5 rounded-[4px] ${isDragging ? "opacity-50" : ""} ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={decorationStyle}
      >
        {dragHandle}
        <div
          className="flex-1 flex items-start gap-3 rounded-[8px] px-4 py-3"
          style={{ background: `${calloutColor}12`, border: `1px solid ${calloutColor}30` }}
        >
          <div
            className="w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${calloutColor}20`, color: calloutColor }}
          >
            <CalloutIcon className="w-3.5 h-3.5" weight="bold" />
          </div>
          <div className="flex-1 relative min-w-0">
            <RemoteBlockPresence usersOnBlock={remoteUsers} />
            <div
              ref={refCallback}
              data-block-id={block.id}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onInput={handleInputWrapped}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onFocus={onFocus}
              onBlur={onBlur}
              data-placeholder={isEmpty ? "Type callout text..." : undefined}
              className={`outline-none w-full ${isEmpty ? "empty-block" : ""}`}
              style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "break-word", cursor: !isEditing && !readOnly ? "default" : undefined }}
            />
            {aiRewriteBtn}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ TOGGLE ═══ */
  if (block.type === "toggle") {
    const hasChildren = block.children && block.children.length > 0;
    return (
      <div
        className={`group relative flex flex-col py-0.5 rounded-[4px] ${isDragging ? "opacity-50" : ""} ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        style={decorationStyle}
      >
        <div className="flex items-start gap-1">
          {dragHandle}
          <button
            onClick={() => onUpdate({ collapsed: !block.collapsed })}
            className="shrink-0 mt-[5px] mr-0.5 transition-transform"
            style={{ color: "var(--text-tertiary)", transform: block.collapsed ? "rotate(0deg)" : "rotate(90deg)" }}
          >
            <CaretRight className="w-4 h-4" weight="bold" />
          </button>
          <div className="flex-1 relative min-w-0">
            <RemoteBlockPresence usersOnBlock={remoteUsers} />
            <div
              ref={refCallback}
              data-block-id={block.id}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onInput={handleInputWrapped}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onFocus={onFocus}
              onBlur={onBlur}
              data-placeholder={isEmpty ? "Toggle heading..." : undefined}
              className={`outline-none w-full font-medium ${isEmpty ? "empty-block" : ""}`}
              style={{ fontSize: "15px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "break-word", cursor: !isEditing && !readOnly ? "default" : undefined }}
            />
            {aiRewriteBtn}
          </div>
        </div>
        {/* Toggle children */}
        {!block.collapsed && hasChildren && (
          <div className="pl-7 mt-0.5 border-l-2" style={{ borderColor: "var(--border-default)", marginLeft: "10px" }}>
            {block.children!.map((child, ci) => (
              <div key={child.id} className="group/child flex items-start gap-1 py-0.5" style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                {child.type === "checklist" && (
                  <button
                    className="shrink-0 mt-[2px]"
                    style={{ color: child.checked ? "var(--accent-primary)" : "var(--text-quaternary)" }}
                    onClick={() => {
                      const newChildren = [...(block.children || [])];
                      newChildren[ci] = { ...child, checked: !child.checked };
                      onUpdate({ children: newChildren });
                    }}
                  >
                    {child.checked ? <CheckSquareOffset className="w-4 h-4" weight="fill" /> : <CheckSquare className="w-4 h-4" />}
                  </button>
                )}
                {child.type === "bulleted-list" && (
                  <span className="shrink-0 mt-[2px]" style={{ color: "var(--text-quaternary)" }}>&bull;</span>
                )}
                <div
                  contentEditable={!readOnly}
                  suppressContentEditableWarning
                  className={`outline-none flex-1 min-w-0 ${child.checked ? "line-through opacity-50" : ""}`}
                  style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: child.content || "" }}
                  onBlur={(e) => {
                    const newContent = e.currentTarget.innerHTML;
                    if (newContent !== child.content) {
                      const newChildren = [...(block.children || [])];
                      newChildren[ci] = { ...child, content: newContent };
                      onUpdate({ children: newChildren });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const newChild: DocBlock = { id: generateBlockId(), type: child.type, content: "", checked: child.type === "checklist" ? false : undefined };
                      const newChildren = [...(block.children || [])];
                      newChildren.splice(ci + 1, 0, newChild);
                      onUpdate({ children: newChildren });
                      requestAnimationFrame(() => {
                        const container = e.currentTarget.closest(".border-l-2");
                        if (container) {
                          const editables = container.querySelectorAll("[contenteditable]");
                          const next = editables[ci + 1] as HTMLElement;
                          if (next) { next.focus(); }
                        }
                      });
                    }
                    if (e.key === "Backspace" && (e.currentTarget.textContent || "") === "" && (block.children || []).length > 1) {
                      e.preventDefault();
                      const newChildren = [...(block.children || [])];
                      newChildren.splice(ci, 1);
                      onUpdate({ children: newChildren });
                    }
                  }}
                />
                {!readOnly && (
                  <button
                    className="shrink-0 opacity-0 group-hover/child:opacity-100 transition-opacity p-0.5"
                    style={{ color: "var(--text-quaternary)" }}
                    onClick={() => {
                      const newChildren = [...(block.children || [])];
                      newChildren.splice(ci, 1);
                      onUpdate({ children: newChildren.length > 0 ? newChildren : undefined });
                    }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <button
                className="flex items-center gap-1 py-1 px-1 mt-0.5 rounded transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
                onClick={() => {
                  const childType = block.children?.[0]?.type || "paragraph";
                  const newChild: DocBlock = { id: generateBlockId(), type: childType as DocBlockType, content: "", checked: childType === "checklist" ? false : undefined };
                  onUpdate({ children: [...(block.children || []), newChild] });
                }}
              >
                <Plus className="w-3 h-3" /> Add item
              </button>
            )}
          </div>
        )}
        {!block.collapsed && !hasChildren && !readOnly && (
          <div className="pl-7 mt-0.5" style={{ marginLeft: "10px" }}>
            <button
              className="flex items-center gap-1 py-1 px-1 rounded transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
              onClick={() => {
                const newChild: DocBlock = { id: generateBlockId(), type: "paragraph", content: "" };
                onUpdate({ children: [newChild] });
              }}
            >
              <Plus className="w-3 h-3" /> Add content
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ═══ EDITABLE CONTENT BLOCK ═══ */
  return (
    <div
      className={`group relative flex items-start gap-1 py-0.5 rounded-[4px] transition-colors ${isDragging ? "opacity-50" : ""} ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ ...decorationStyle, ...(!isEditing && !readOnly ? { cursor: "default" } : {}) }}
    >
      {dragHandle}

      {/* List prefix */}
      {block.type === "bulleted-list" && (
        <span
          className="shrink-0 mt-[2px] select-none"
          style={{ color: block.color || "var(--text-quaternary)", fontSize: "15px", lineHeight: 1.6, width: "20px", textAlign: "center" }}
        >
          &bull;
        </span>
      )}
      {block.type === "numbered-list" && (
        <span
          className="shrink-0 mt-[2px] select-none tabular-nums"
          style={{ color: block.color || "var(--text-quaternary)", fontSize: "14px", lineHeight: 1.6, width: "20px", textAlign: "right", marginRight: "4px" }}
        >
          {index + 1}.
        </span>
      )}
      {block.type === "checklist" && (
        <button
          onClick={onCheckToggle}
          className="shrink-0 mt-[3px] mr-1"
          style={{ color: block.checked ? (block.color || "var(--accent-primary)") : "var(--text-quaternary)" }}
        >
          {block.checked ? (
            <CheckSquareOffset className="w-[18px] h-[18px]" weight="fill" />
          ) : (
            <CheckSquare className="w-[18px] h-[18px]" />
          )}
        </button>
      )}

      {/* Editable content */}
      <div className="flex-1 relative min-w-0">
        <RemoteBlockPresence usersOnBlock={remoteUsers} />
        <div
          ref={refCallback}
          data-block-id={block.id}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={handleInputWrapped}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={onFocus}
          onBlur={onBlur}
          data-placeholder={isEmpty ? placeholder : undefined}
          className={`outline-none w-full ${
            block.type === "checklist" && block.checked ? "line-through" : ""
          } ${isEmpty ? "empty-block" : ""}`}
          style={{
            ...getBlockStyles(),
            opacity: block.type === "checklist" && block.checked ? 0.5 : 1,
            cursor: !isEditing && !readOnly ? "default" : undefined,
            minHeight: "1.6em",
          }}
        />
        {aiRewriteBtn}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════
   GALLERY LIGHTBOX
   ═══════════════════════════════════════════════════════════ */

function GalleryLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: {
  images: UnsplashImageMeta[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const img = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && hasNext) onNavigate(currentIndex + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

  if (!img) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
        style={{ color: "white" }}
      >
        <X className="w-5 h-5" weight="bold" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500 }}
        >
          {currentIndex + 1} of {images.length}
        </div>
      )}

      {/* Prev button */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          className="absolute left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
          style={{ color: "white", background: "rgba(0,0,0,0.4)" }}
        >
          <CaretRight className="w-5 h-5 rotate-180" weight="bold" />
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          className="absolute right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
          style={{ color: "white", background: "rgba(0,0,0,0.4)" }}
        >
          <CaretRight className="w-5 h-5" weight="bold" />
        </button>
      )}

      {/* Image */}
      <img
        src={img.url}
        alt=""
        className="relative z-10 max-w-[90vw] max-h-[80vh] rounded-[10px] shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Photographer credit */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full flex items-center gap-1.5"
        style={{ background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)", fontSize: "12px" }}
      >
        Photo by{" "}
        <a
          href={img.photographerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {img.photographer}
        </a>
        {" "}on Unsplash
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TABLE BLOCK RENDERER
   ══════════════════════════════════════════════════════════ */

function TableBlockRenderer({
  block,
  readOnly,
  showControls,
  selected,
  onHover,
  onUpdate,
  onDelete,
  dragHandle,
}: {
  block: DocBlock;
  readOnly: boolean;
  showControls: boolean;
  selected: boolean;
  onHover: (h: boolean) => void;
  onUpdate: (updates: Partial<DocBlock>) => void;
  onDelete: () => void;
  dragHandle: React.ReactNode;
}) {
  const table = block.tableData || { headers: ["Column 1", "Column 2"], rows: [["", ""]] };
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);

  const toggleSort = (colIdx: number) => {
    if (sortCol !== colIdx) { setSortCol(colIdx); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortCol(null); setSortDir(null); }
  };

  const sortedRows = useMemo(() => {
    if (sortCol === null || sortDir === null) return table.rows;
    return [...table.rows].sort((a, b) => {
      const va = (a[sortCol] || "").toLowerCase();
      const vb = (b[sortCol] || "").toLowerCase();
      const numA = Number(va), numB = Number(vb);
      if (!isNaN(numA) && !isNaN(numB)) return sortDir === "asc" ? numA - numB : numB - numA;
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [table.rows, sortCol, sortDir]);

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = table.rows.map((r, ri) =>
      ri === rowIdx ? r.map((c, ci) => (ci === colIdx ? value : c)) : [...r]
    );
    onUpdate({ tableData: { ...table, rows: newRows } });
  };

  const updateHeader = (colIdx: number, value: string) => {
    const newHeaders = table.headers.map((h, i) => (i === colIdx ? value : h));
    onUpdate({ tableData: { ...table, headers: newHeaders } });
  };

  const addRow = () => {
    onUpdate({ tableData: { ...table, rows: [...table.rows, new Array(table.headers.length).fill("")] } });
  };

  const addColumn = () => {
    onUpdate({
      tableData: {
        headers: [...table.headers, `Column ${table.headers.length + 1}`],
        rows: table.rows.map((r) => [...r, ""]),
      },
    });
  };

  const removeRow = (idx: number) => {
    if (table.rows.length <= 1) return;
    onUpdate({ tableData: { ...table, rows: table.rows.filter((_, i) => i !== idx) } });
  };

  const removeColumn = (idx: number) => {
    if (table.headers.length <= 1) return;
    onUpdate({
      tableData: {
        headers: table.headers.filter((_, i) => i !== idx),
        rows: table.rows.map((r) => r.filter((_, i) => i !== idx)),
      },
    });
  };

  return (
    <div
      className={`group py-2 flex items-start gap-2 rounded-[4px] ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {dragHandle}
      <div className="flex-1 overflow-x-auto">
        <table
          className="w-full border-collapse rounded-[8px] overflow-hidden"
          style={{ border: "1px solid var(--border-default)" }}
        >
          <thead>
            <tr>
              {table.headers.map((h, ci) => (
                <th
                  key={ci}
                  className="px-3 py-2 text-left relative"
                  style={{
                    background: "var(--neutral-100)",
                    borderBottom: "1px solid var(--border-default)",
                    borderRight: ci < table.headers.length - 1 ? "1px solid var(--border-default)" : undefined,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    minWidth: "100px",
                  }}
                >
                  <div className="flex items-center gap-1">
                    {readOnly ? h : (
                      <input
                        value={h}
                        onChange={(e) => updateHeader(ci, e.target.value)}
                        className="bg-transparent outline-none flex-1"
                        style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}
                      />
                    )}
                    <button
                      onClick={() => toggleSort(ci)}
                      className="shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors hover:bg-black/[0.06]"
                      style={{ color: sortCol === ci ? "var(--accent-primary)" : "var(--text-quaternary)", fontSize: "10px" }}
                      title={sortCol === ci && sortDir === "asc" ? "Sort descending" : sortCol === ci && sortDir === "desc" ? "Clear sort" : "Sort ascending"}
                    >
                      {sortCol === ci && sortDir === "asc" ? "▲" : sortCol === ci && sortDir === "desc" ? "▼" : "⇅"}
                    </button>
                  </div>
                  {!readOnly && showControls && table.headers.length > 1 && (
                    <button
                      onClick={() => removeColumn(ci)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "var(--surface-bg)", color: "var(--text-quaternary)", border: "1px solid var(--border-default)" }}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, ri) => (
              <tr key={ri} className="group/row">
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-1.5"
                    style={{
                      borderBottom: ri < sortedRows.length - 1 ? "1px solid var(--border-default)" : undefined,
                      borderRight: ci < row.length - 1 ? "1px solid var(--border-default)" : undefined,
                      fontSize: "13px",
                      color: "var(--text-primary)",
                    }}
                  >
                    {readOnly ? cell : (
                      <input
                        value={cell}
                        onChange={(e) => {
                          /* Find actual row index in unsorted data when sort is active */
                          const actualRi = sortCol !== null ? table.rows.indexOf(row) : ri;
                          updateCell(actualRi >= 0 ? actualRi : ri, ci, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Tab") {
                            e.preventDefault();
                            const parent = e.currentTarget.closest("table");
                            if (!parent) return;
                            const inputs = Array.from(parent.querySelectorAll("input"));
                            const curIdx = inputs.indexOf(e.currentTarget);
                            const nextIdx = e.shiftKey ? curIdx - 1 : curIdx + 1;
                            if (nextIdx >= 0 && nextIdx < inputs.length) {
                              (inputs[nextIdx] as HTMLInputElement).focus();
                            }
                          }
                        }}
                        className="bg-transparent outline-none w-full"
                        style={{ fontSize: "13px", color: "var(--text-primary)" }}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && showControls && sortedRows.length > 1 && (
                  <td className="w-6">
                    <button
                      onClick={() => { const actualRi = sortCol !== null ? table.rows.indexOf(row) : ri; removeRow(actualRi >= 0 ? actualRi : ri); }}
                      className="p-0.5 rounded opacity-0 group-hover/row:opacity-100 transition-opacity"
                      style={{ color: "var(--text-quaternary)" }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!readOnly && showControls && (
          <div className="flex items-center gap-2 mt-1.5">
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-quaternary)", fontSize: "11px" }}
            >
              <Plus className="w-3 h-3" /> Row
            </button>
            <button
              onClick={addColumn}
              className="flex items-center gap-1 px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-quaternary)", fontSize: "11px" }}
            >
              <Plus className="w-3 h-3" /> Column
            </button>
          </div>
        )}
      </div>
      {!readOnly && showControls && (
        <button onClick={onDelete} className="p-0.5 rounded hover:bg-black/[0.05]" style={{ color: "var(--text-quaternary)" }}>
          <Trash className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EMBED BLOCK RENDERER
   ═══════════════════════════════════════════════════════════ */

function EmbedBlockRenderer({
  block,
  readOnly,
  showControls,
  selected,
  onHover,
  onUpdate,
  onDelete,
  dragHandle,
}: {
  block: DocBlock;
  readOnly: boolean;
  showControls: boolean;
  selected: boolean;
  onHover: (h: boolean) => void;
  onUpdate: (updates: Partial<DocBlock>) => void;
  onDelete: () => void;
  dragHandle: React.ReactNode;
}) {
  const [urlInput, setUrlInput] = useState(block.embedUrl || "");

  const getEmbedUrl = (url: string): string | null => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  const embedSrc = getEmbedUrl(block.embedUrl || "");

  return (
    <div
      className={`group py-2 flex items-start gap-2 rounded-[4px] ${selected ? "px-2 -mx-2 ring-1 ring-[oklch(0.7_0.035_250_/_0.3)] bg-[oklch(0.85_0.025_250_/_0.1)]" : ""}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {dragHandle}
      <div className="flex-1">
        {embedSrc ? (
          <div className="rounded-[8px] overflow-hidden border" style={{ borderColor: "var(--border-default)" }}>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                src={embedSrc}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video embed"
              />
            </div>
            {!readOnly && showControls && (
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: "var(--neutral-50)" }}>
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onBlur={() => onUpdate({ embedUrl: urlInput })}
                  onKeyDown={(e) => { if (e.key === "Enter") onUpdate({ embedUrl: urlInput }); }}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: "12px", color: "var(--text-tertiary)" }}
                  placeholder="Video URL..."
                />
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 py-8 rounded-[8px] border-2 border-dashed"
            style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
          >
            <YoutubeLogo className="w-8 h-8" />
            <span style={{ fontSize: "13px" }}>Paste a YouTube or Vimeo URL</span>
            {!readOnly && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="px-3 py-1.5 rounded-[6px] outline-none w-72"
                  style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)", fontSize: "13px", color: "var(--text-primary)" }}
                  placeholder="https://youtube.com/watch?v=..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onUpdate({ embedUrl: urlInput, embedType: "youtube" });
                  }}
                />
                <button
                  onClick={() => onUpdate({ embedUrl: urlInput, embedType: "youtube" })}
                  className="px-3 py-1.5 rounded-[6px] text-white"
                  style={{ background: "var(--accent-primary)", fontSize: "12px", fontWeight: 500 }}
                >
                  Embed
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {!readOnly && showControls && (
        <button onClick={onDelete} className="p-0.5 rounded hover:bg-black/[0.05]" style={{ color: "var(--text-quaternary)" }}>
          <Trash className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════���══
   SLASH COMMAND MENU
   ═══════════════════════════════════════════════════════════ */

function SlashMenu({
  items,
  activeIndex,
  onSelect,
  blockId,
  blockRefs,
}: {
  items: BlockTypeMeta[];
  activeIndex: number;
  onSelect: (item: BlockTypeMeta) => void;
  blockId: string;
  blockRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const el = blockRefs.current.get(blockId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const containerRect = el.closest(".relative")?.getBoundingClientRect();
      if (containerRect) {
        setPos({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
        });
      }
    }
  }, [blockId, blockRefs]);

  useEffect(() => {
    const activeEl = menuRef.current?.querySelector(`[data-slash-idx="${activeIndex}"]`) as HTMLElement;
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (items.length === 0) return null;

  // Group items by category
  let lastCategory = "";

  return (
    <motion.div
      ref={menuRef}
      className="absolute z-50 w-72 max-h-80 overflow-y-auto rounded-[10px] shadow-lg border py-1"
      style={{
        top: pos.top,
        left: pos.left,
        background: "var(--surface-bg)",
        borderColor: "var(--border-default)",
      }}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {items.map((item, i) => {
        const showCategory = item.category && item.category !== lastCategory;
        if (item.category) lastCategory = item.category;
        return (
          <div key={`${item.type}-${item.level || ""}-${i}`}>
            {showCategory && (
              <div
                className="px-3 pt-2 pb-1"
                style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-quaternary)", letterSpacing: "0.05em", textTransform: "uppercase" }}
              >
                {item.category}
              </div>
            )}
            <button
              data-slash-idx={i}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
                i === activeIndex ? "bg-black/[0.05] dark:bg-white/[0.05]" : ""
              } hover:bg-black/[0.04] dark:hover:bg-white/[0.04]`}
            >
              <div
                className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
                style={{ background: "var(--neutral-100)" }}
              >
                <item.icon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-quaternary)" }}>
                  {item.description}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTOCOMPLETE MENU (script mode character/location)
   ═══════════════════════════════════════════════════════════ */

function AutocompleteMenu({
  items,
  activeIndex,
  onSelect,
  blockId,
  blockRefs,
}: {
  items: string[];
  activeIndex: number;
  onSelect: (item: string) => void;
  blockId: string;
  blockRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const el = blockRefs.current.get(blockId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const containerRect = el.closest(".relative")?.getBoundingClientRect();
      if (containerRect) {
        setPos({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
        });
      }
    }
  }, [blockId, blockRefs]);

  useEffect(() => {
    const activeEl = menuRef.current?.children[activeIndex] as HTMLElement;
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (items.length === 0) return null;

  return (
    <motion.div
      ref={menuRef}
      className="absolute z-50 w-56 max-h-48 overflow-y-auto rounded-[8px] shadow-lg border py-1"
      style={{
        top: pos.top,
        left: pos.left,
        background: "var(--surface-bg)",
        borderColor: "#e8ebf1",
      }}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.1 }}
    >
      <div
        className="px-3 py-1"
        style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", letterSpacing: "0.04em" }}
      >
        SUGGESTIONS · Tab or ↵ to accept
      </div>
      {items.map((item, i) => (
        <button
          key={item}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          className={`flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors ${
            i === activeIndex ? "bg-black/[0.05] dark:bg-white/[0.05]" : ""
          } hover:bg-black/[0.04] dark:hover:bg-white/[0.04]`}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text-primary)",
              fontFamily: "'Courier Prime', monospace",
            }}
          >
            {item}
          </span>
        </button>
      ))}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   @MENTION MENU
   ═══════════════════════════════════════════════════════════ */

function MentionMenu({
  items,
  activeIndex,
  onSelect,
  blockId,
  blockRefs,
}: {
  items: MentionItem[];
  activeIndex: number;
  onSelect: (item: MentionItem) => void;
  blockId: string;
  blockRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const el = blockRefs.current.get(blockId);
    if (el) {
      const rect = el.getBoundingClientRect();
      const containerRect = el.closest(".relative")?.getBoundingClientRect();
      if (containerRect) {
        setPos({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
        });
      }
    }
  }, [blockId, blockRefs]);

  useEffect(() => {
    const activeEl = menuRef.current?.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement;
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (items.length === 0) return null;

  const MENTION_TYPE_COLORS: Record<string, string> = {
    person: "#3B82F6",
    project: "#8B5CF6",
    task: "#22C55E",
  };

  return (
    <motion.div
      ref={menuRef}
      className="absolute z-50 w-64 max-h-56 overflow-y-auto rounded-[10px] shadow-lg border py-1"
      style={{
        top: pos.top,
        left: pos.left,
        background: "var(--surface-bg)",
        borderColor: "var(--border-default)",
      }}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <div
        className="px-3 py-1"
        style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", letterSpacing: "0.04em", textTransform: "uppercase" }}
      >
        Mentions
      </div>
      {items.map((item, i) => (
        <button
          key={item.id}
          data-idx={i}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors ${
            i === activeIndex ? "bg-black/[0.05] dark:bg-white/[0.05]" : ""
          } hover:bg-black/[0.04] dark:hover:bg-white/[0.04]`}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white"
            style={{
              background: item.color || MENTION_TYPE_COLORS[item.type] || "#64748B",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            {item.avatarUrl ? (
              <img src={item.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
            ) : (
              item.label.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }} className="truncate">
              {item.label}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-quaternary)" }}>
              {item.type}
            </div>
          </div>
        </button>
      ))}
    </motion.div>
  );
}

/* ─── CSS for empty placeholder ─── */
if (typeof document !== "undefined" && !document.querySelector("[data-block-editor-styles]")) {
  const s = document.createElement("style");
  s.setAttribute("data-block-editor-styles", "");
  s.textContent = `
    .empty-block[data-placeholder]:empty::before {
      content: attr(data-placeholder);
      color: var(--text-quaternary);
      pointer-events: none;
    }
  `;
  document.head.appendChild(s);
}

export default DescriptionBlockEditor;
