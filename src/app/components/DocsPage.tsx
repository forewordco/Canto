/* ===================================================================
   DOCS PAGE — Workspace Document Management (Overhaul D1-D5).

   Features:
   - Grid view with cover image thumbnails, favorites, folders (colored)
   - Document editor with cover images, editor toolbar, format panel,
     blocks panel, doc top nav, bottom status bar
   - Doc types: doc, note, meeting, script
   - Enhanced filtering: type tabs, status filters (pin/fav/today/lineup/private)
   - Folder CRUD with 14 color options
   - Breadcrumb navigation, context menus
   - Publishing (inline)
   =================================================================== */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  FileText,
  VideoCamera,
  FilmScript,
  FolderSimple,
  Plus,
  MagnifyingGlass,
  ArrowLeft,
  DotsThree,
  Trash,
  PencilSimple,
  X,
  Copy,
  Star,
  Globe,
  PushPin,
  Lock,
  LockOpen,
  Sun,
  Image as ImageIcon,
  ArrowsOutSimple,
  ArrowsInSimple,
  ClipboardText,
  Pencil,
  ListDashes,
  SkipForward,
  Briefcase,
  CheckCircle,
  ListChecks,
  SquareHalf,
  Sparkle,
  ProjectorScreen,
  Warning,
  ArrowsClockwise,
  Smiley,
  ArrowCounterClockwise,
  ArrowClockwise,
  Export,
  ClockCounterClockwise,
  Keyboard,
  UploadSimple,
  ChatCircleDots,
  ArrowsOut,
  Target,
  Link as LinkPhIcon,
  ChartBar,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData, useAllTasks, useVisibleDocs } from "../lib/data";
import { SpacePicker } from "./SpacePicker";
import type { WorkspaceDoc, DocFolder, DocType, DocBlock, DocBlockType, ProjectData } from "../lib/types";
import { DescriptionBlockEditor, generateBlockId } from "./DescriptionBlockEditor";
import type { AiSlashAction } from "./DescriptionBlockEditor";
import { ResponsiveModal } from "./ResponsiveModal";
import { FormatPanel } from "./docs/FormatPanel";
import { BlocksPanel } from "./docs/BlocksPanel";
import { MeetingBar } from "./docs/MeetingBar";
import { DocOutline } from "./docs/DocOutline";
import { DocStatusBar } from "./docs/DocStatusBar";
import { ScriptPanels } from "./docs/ScriptPanels";
import { DocIconPickerPopover, DocIconDisplay, DOC_ICON_MAP } from "./docs/DocIconPicker";
import { PublishDialog } from "./docs/PublishDialog";
import { AiPromptInline } from "./docs/AiPromptInline";
import type { AiDocAction } from "./docs/AiPromptInline";
import { DocAiSidebar } from "./docs/DocAiSidebar";
import { PresentationView } from "./docs/PresentationView";
import { ScriptToolbar } from "./docs/ScriptToolbar";
import { CollaborationBar } from "./docs/CollaborationBar";
import { useCollaboration, type CollabUser, type CollabOperation } from "../hooks/useCollaboration";
import { getCollabsOnBlock } from "./docs/RemoteBlockPresence";
import {
  useDocHistory,
  FindReplaceBar,
  downloadMarkdown,
  DOC_TEMPLATES,
  type DocTemplate,
} from "./docs/DocEditorFeatures";
import {
  useAutoVersioning,
  VersionHistoryPanel,
  ImportMarkdownModal,
  KeyboardShortcutsPanel,
} from "./docs/DocD5Features";
import {
  useBlockComments,
  CommentsPanel,
  CommentThread,
  useRecentlyViewed,
  useDocLock,
  LockBadge,
  FocusModeOverlay,
  useWordGoal,
  WordGoalPopover,
  WordGoalBar,
} from "./docs/DocD6Features";
import {
  TemplateGalleryModal,
  BacklinksPanel,
  ExportPanel,
  DocStatsPanel,
  CommandPalette,
  useCommandPalette,
  type CommandItem,
} from "./docs/DocD7Features";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useNavigation } from "../lib/navigation";
import { useAuth } from "../lib/auth";
import { ListToolbar } from "./ListToolbar";
import type { SortOption } from "./ListToolbar";
import type { MentionItem } from "./MentionInput";

/* ─── Doc Type Meta ─── */
interface DocTypeMeta {
  type: DocType;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const DOC_TYPE_META: Record<DocType, DocTypeMeta> = {
  doc: { type: "doc", label: "Document", icon: ClipboardText, color: "#FA6863", bgColor: "rgba(250, 104, 99, 0.08)" },
  note: { type: "note", label: "Note", icon: Pencil, color: "#22C55E", bgColor: "rgba(34, 197, 94, 0.08)" },
  meeting: { type: "meeting", label: "Meeting", icon: VideoCamera, color: "#F59145", bgColor: "rgba(245, 145, 69, 0.08)" },
  script: { type: "script", label: "Script", icon: FilmScript, color: "#8B5CF6", bgColor: "rgba(139, 92, 246, 0.08)" },
};

const DOC_TYPES = Object.values(DOC_TYPE_META);
const DEFAULT_DOC_META = DOC_TYPE_META.doc;

/* ─── Folder Colors ─── */
const FOLDER_COLORS = [
  "#64748B", "#FA6863", "#F59145", "#EAB308", "#22C55E", "#10B981",
  "#14B8A6", "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#EC4899",
  "#F43F5E", "#78716C",
];

/* ─── Sort & Filter ─── */
type SortBy = "updated" | "created" | "name" | "type";
type StatusFilter = "all" | "favorited" | "today" | "lineup" | "pinned" | "private" | "recent";

const DOC_SORT_OPTIONS: SortOption[] = [
  { value: "updated", label: "Last Updated" },
  { value: "created", label: "Date Created" },
  { value: "name", label: "Name" },
  { value: "type", label: "Type" },
];

/* ══���════════════════════════════════════════════════════════
   MAIN DOCS PAGE
   ═══════════════════════════════════════════════════════════ */

export function DocsPage() {
  const { docs, addDoc, updateDoc, deleteDoc, docFolders, setDocFolders, toggleStarred, isStarred, loadError, reload } = useData();
  const visibleDocs = useVisibleDocs();
  const { params } = useNavigation();

  // UI State — doc navigation stack for nested docs
  const [docStack, setDocStack] = useState<string[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(() => {
    if (params.docId) return params.docId;
    return null;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("updated");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ docId: string; x: number; y: number } | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [folderContextMenu, setFolderContextMenu] = useState<{ folderId: string; x: number; y: number } | null>(null);
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [dropTargetFolderId, setDropTargetFolderId] = useState<string | null>(null);
  const [importMdOpen, setImportMdOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Active document
  const activeDoc = useMemo(
    () => (activeDocId ? docs.find((d) => d.id === activeDocId) ?? null : null),
    [activeDocId, docs]
  );

  // Recently viewed tracking (D6)
  const recentlyViewed = useRecentlyViewed();
  useEffect(() => {
    if (activeDocId) recentlyViewed.track(activeDocId);
  }, [activeDocId]);

  /* ─── Filtered & Sorted Docs ─── */
  const filteredDocs = useMemo(() => {
    let result = [...visibleDocs];

    // Folder filter
    if (activeFolderId) {
      result = result.filter((d) => d.folderId === activeFolderId);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((d) => d.type === typeFilter);
    }

    // Status filter
    if (statusFilter === "favorited") result = result.filter((d) => isStarred(d.id));
    else if (statusFilter === "today") result = result.filter((d) => d.today);
    else if (statusFilter === "lineup") result = result.filter((d) => d.lineup);
    else if (statusFilter === "pinned") result = result.filter((d) => d.pinned);
    else if (statusFilter === "private") result = result.filter((d) => d.private);
    else if (statusFilter === "recent") {
      const recentIds = new Set(recentlyViewed.recent.map((r) => r.docId));
      result = result.filter((d) => recentIds.has(d.id));
      // Sort by recently viewed order
      const orderMap = new Map(recentlyViewed.recent.map((r, i) => [r.docId, i]));
      result.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content?.toLowerCase().includes(q) ||
          d.blocks?.some((b) => b.content.toLowerCase().includes(q))
      );
    }

    // Sort — pinned first, then by selected sort
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      switch (sortBy) {
        case "updated": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "created": return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "name": return a.title.localeCompare(b.title);
        case "type": return a.type.localeCompare(b.type);
        default: return 0;
      }
    });

    return result;
  }, [visibleDocs, activeFolderId, typeFilter, statusFilter, searchQuery, sortBy, isStarred, recentlyViewed.recent]);

  /* ─── Folder Helpers ─── */
  const rootFolders = useMemo(
    () => docFolders.filter((f) => !f.parentId).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [docFolders]
  );

  const docsInFolder = useCallback(
    (folderId: string | null) => docs.filter((d) => d.folderId === folderId).length,
    [docs]
  );

  /* ─── Create Document ─── */
  const handleCreateDoc = useCallback(
    (type: DocType, title: string, folderId?: string, spaceId?: string, templateBlocks?: DocBlock[]) => {
      const now = new Date().toISOString();
      const newDoc: WorkspaceDoc = {
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: title || `Untitled ${DOC_TYPE_META[type].label}`,
        type,
        folderId: folderId || activeFolderId || undefined,
        blocks: templateBlocks
          ? templateBlocks.map((b) => ({ ...b, id: generateBlockId() }))
          : [{ id: generateBlockId(), type: "paragraph", content: "" }],
        createdAt: now,
        updatedAt: now,
        spaceId,
      };
      addDoc(newDoc);
      setDocStack([]);
      setActiveDocId(newDoc.id);
      setCreateModalOpen(false);
      toast.success(`Created "${newDoc.title}"`);
    },
    [addDoc, activeFolderId]
  );

  /* ─── Delete Document ─── */
  const handleDeleteDoc = useCallback(
    (docId: string) => {
      const doc = docs.find((d) => d.id === docId);
      if (!doc) return;
      deleteDoc(docId);
      if (activeDocId === docId) setActiveDocId(null);
      toast.success(`Deleted "${doc.title}"`);
      setContextMenu(null);
    },
    [docs, deleteDoc, activeDocId]
  );

  /* ─── Duplicate Document ─── */
  const handleDuplicateDoc = useCallback(
    (docId: string) => {
      const doc = docs.find((d) => d.id === docId);
      if (!doc) return;
      const now = new Date().toISOString();
      const newDoc: WorkspaceDoc = {
        ...doc,
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: `${doc.title} (Copy)`,
        createdAt: now,
        updatedAt: now,
        pinned: false,
        publishedSlug: undefined,
      };
      addDoc(newDoc);
      setDocStack([]);
      setActiveDocId(newDoc.id);
      toast.success(`Duplicated "${doc.title}"`);
      setContextMenu(null);
    },
    [docs, addDoc]
  );

  /* ─── Create Folder ─── */
  const handleCreateFolder = useCallback(() => {
    const newFolder: DocFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: "New Folder",
      order: docFolders.length,
      color: FOLDER_COLORS[0],
    };
    setDocFolders([...docFolders, newFolder]);
    setRenamingFolderId(newFolder.id);
    requestAnimationFrame(() => renameInputRef.current?.focus());
  }, [docFolders, setDocFolders]);

  /* ─── Rename Folder ─── */
  const handleRenameFolder = useCallback(
    (folderId: string, name: string) => {
      const updated = docFolders.map((f) => (f.id === folderId ? { ...f, name: name.trim() || f.name } : f));
      setDocFolders(updated);
      setRenamingFolderId(null);
    },
    [docFolders, setDocFolders]
  );

  /* ─── Change Folder Color ─── */
  const handleFolderColor = useCallback(
    (folderId: string, color: string) => {
      const updated = docFolders.map((f) => (f.id === folderId ? { ...f, color } : f));
      setDocFolders(updated);
    },
    [docFolders, setDocFolders]
  );

  /* ─── Delete Folder ─── */
  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      docs.filter((d) => d.folderId === folderId).forEach((d) => updateDoc(d.id, { folderId: undefined }));
      setDocFolders(docFolders.filter((f) => f.id !== folderId));
      if (activeFolderId === folderId) setActiveFolderId(null);
      setFolderContextMenu(null);
      toast.success("Folder deleted");
    },
    [docs, docFolders, activeFolderId, updateDoc, setDocFolders]
  );

  /* ─── Update Doc Blocks ─── */
  const handleBlocksChange = useCallback(
    (blocks: DocBlock[]) => {
      if (!activeDocId) return;
      updateDoc(activeDocId, { blocks, updatedAt: new Date().toISOString() });
    },
    [activeDocId, updateDoc]
  );

  /* ─── Update Doc Title ─── */
  const handleTitleChange = useCallback(
    (title: string) => {
      if (!activeDocId) return;
      updateDoc(activeDocId, { title, updatedAt: new Date().toISOString() });
    },
    [activeDocId, updateDoc]
  );

  /* ─── Close context menus on click outside ─── */
  useEffect(() => {
    const handler = () => { setContextMenu(null); setFolderContextMenu(null); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  /* ─── Format date ─── */
  const formatDateShort = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  /* ─── Favorites (starred docs) ─── */
  const favoriteDocs = useMemo(
    () => docs.filter((d) => isStarred(d.id)),
    [docs, isStarred]
  );

  /* ─── Nested Doc Helpers ─── */
  const resolveDoc = useCallback(
    (docId: string): WorkspaceDoc | null => docs.find((d) => d.id === docId) ?? null,
    [docs]
  );

  const navigateToDoc = useCallback(
    (docId: string) => {
      if (activeDocId) {
        setDocStack((prev) => [...prev, activeDocId]);
      }
      setActiveDocId(docId);
    },
    [activeDocId]
  );

  const navigateBack = useCallback(() => {
    if (docStack.length > 0) {
      const prev = [...docStack];
      const parentId = prev.pop()!;
      setDocStack(prev);
      setActiveDocId(parentId);
    } else {
      setActiveDocId(null);
    }
  }, [docStack]);

  const createNestedDoc = useCallback(
    (parentBlockId: string, seedBlocks?: DocBlock[]): string | null => {
      const now = new Date().toISOString();
      const newDocId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newDoc: WorkspaceDoc = {
        id: newDocId,
        title: "Untitled Nested Document",
        type: "doc",
        folderId: activeDoc?.folderId,
        blocks: seedBlocks && seedBlocks.length > 0
          ? seedBlocks.map((b) => ({ ...b, id: generateBlockId() }))
          : [{ id: generateBlockId(), type: "paragraph" as const, content: "" }],
        createdAt: now,
        updatedAt: now,
        parentDocId: activeDocId || undefined,
      };
      addDoc(newDoc);
      return newDocId;
    },
    [addDoc, activeDocId, activeDoc?.folderId]
  );

  /* ─── Document Editor View ─── */
  if (activeDoc) {
    return (
      <DocumentEditor
        doc={activeDoc}
        onBack={navigateBack}
        onTitleChange={handleTitleChange}
        onBlocksChange={handleBlocksChange}
        onDelete={() => handleDeleteDoc(activeDoc.id)}
        formatDate={formatDateShort}
        allDocs={docs}
        resolveDoc={resolveDoc}
        onNavigateDoc={navigateToDoc}
        onCreateNestedDoc={createNestedDoc}
        docStack={docStack}
      />
    );
  }

  /* ─── Data load error fallback ─── */
  if (loadError && docs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center max-w-sm space-y-4">
          <div
            className="w-12 h-12 rounded-[12px] flex items-center justify-center mx-auto"
            style={{ background: "oklch(0.7 0.18 25 / 0.1)" }}
          >
            <Warning className="w-6 h-6" weight="fill" style={{ color: "oklch(0.7 0.18 25)" }} />
          </div>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
              Couldn't load documents
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
              {loadError}
            </p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] transition-colors hover:brightness-95"
            style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "13px", fontWeight: 500 }}
          >
            <ArrowsClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ─── Document List View ─── */
  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardText className="w-7 h-7" weight="fill" style={{ color: "#FA6863" }} />
          <h1 style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Docs
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ListToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search documents…"
            sortOptions={DOC_SORT_OPTIONS}
            sortValue={sortBy}
            onSortChange={(v) => setSortBy(v as SortBy)}
            activeFilterCount={
              (typeFilter !== "all" ? 1 : 0) +
              (statusFilter !== "all" ? 1 : 0)
            }
            onFilterClick={() => {
              const types: (DocType | "all")[] = ["all", "doc", "note", "meeting", "script"];
              const idx = types.indexOf(typeFilter);
              setTypeFilter(types[(idx + 1) % types.length]);
            }}
            hideGroup
            hideOptions
          />

          <button
            onClick={() => setImportMdOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500, border: "1px solid var(--border-default)" }}
            title="Import from Markdown"
          >
            <UploadSimple className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setShowTemplateGallery(true)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500, border: "1px solid var(--border-default)" }}
            title="Template Gallery"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Templates</span>
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white transition-opacity hover:opacity-90"
            style={{ background: "#FA6863", fontSize: "13px", fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" weight="bold" />
            <span className="hidden sm:inline">New Doc</span>
          </button>
        </div>
      </div>

      {/* Status Filter Chips (D6: added "Recent") */}
      <div className="flex items-center gap-1.5 flex-wrap mt-1 mb-3">
        {([
          { key: "all", label: "All" },
          { key: "recent", label: "Recent" },
          { key: "favorited", label: "Favorites" },
          { key: "pinned", label: "Pinned" },
          { key: "today", label: "Today" },
          { key: "lineup", label: "Lineup" },
          { key: "private", label: "Private" },
        ] as { key: StatusFilter; label: string }[]).map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className="px-2.5 py-1 rounded-full transition-colors"
            style={{
              fontSize: "12px",
              fontWeight: statusFilter === f.key ? 600 : 400,
              color: statusFilter === f.key ? "white" : "var(--text-secondary)",
              background: statusFilter === f.key ? "#FA6863" : "var(--neutral-50)",
              border: `1px solid ${statusFilter === f.key ? "#FA6863" : "var(--border-default)"}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Favorites section */}
      {favoriteDocs.length > 0 && !searchQuery && !activeFolderId && statusFilter === "all" && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-3.5 h-3.5" weight="fill" style={{ color: "#F59145" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Favorites
            </span>
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
              style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}
            >
              {favoriteDocs.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {favoriteDocs.map((doc) => {
              const meta = DOC_TYPE_META[doc.type] || DEFAULT_DOC_META;
              return (
                <button
                  key={doc.id}
                  onClick={() => { setDocStack([]); setActiveDocId(doc.id); }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-[6px] transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  style={{ border: "1px solid var(--border-default)", background: "var(--surface-bg)" }}
                >
                  <div
                    className="w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0"
                    style={{ background: meta.bgColor }}
                  >
                    <meta.icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                  </div>
                  <span className="truncate max-w-[160px]" style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
                    {doc.title || "Untitled"}
                  </span>
                  {doc.pinned && <PushPin className="w-3 h-3 shrink-0" style={{ color: "var(--text-quaternary)" }} weight="fill" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Folders section */}
      {rootFolders.length > 0 && !searchQuery && !activeFolderId && statusFilter === "all" && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FolderSimple className="w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Folders
            </span>
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
              style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}
            >
              {rootFolders.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {rootFolders.map((folder) => {
              const folderColor = folder.color || FOLDER_COLORS[0];
              return (
                <button
                  key={folder.id}
                  onClick={() => setActiveFolderId(folder.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setFolderContextMenu({ folderId: folder.id, x: e.clientX, y: e.clientY });
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDropTargetFolderId(folder.id);
                  }}
                  onDragLeave={() => setDropTargetFolderId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const docId = e.dataTransfer.getData("text/plain");
                    if (docId) {
                      updateDoc(docId, { folderId: folder.id, updatedAt: new Date().toISOString() });
                    }
                    setDropTargetFolderId(null);
                    setDraggedDocId(null);
                  }}
                  className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-[6px] transition-all ${
                    dropTargetFolderId === folder.id
                      ? "ring-2 ring-[var(--accent-primary)] bg-[oklch(0.6_0.15_260_/_0.06)]"
                      : "hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  }`}
                  style={{ border: "1px solid var(--border-default)", background: "var(--surface-bg)" }}
                >
                  <div
                    className="w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0"
                    style={{ background: `${folderColor}18` }}
                  >
                    <FolderSimple className="w-3.5 h-3.5" style={{ color: folderColor }} weight="fill" />
                  </div>
                  <div className="text-left">
                    {renamingFolderId === folder.id ? (
                      <input
                        ref={renameInputRef}
                        defaultValue={folder.name}
                        className="bg-transparent outline-none w-24"
                        style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}
                        onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFolder(folder.id, (e.target as HTMLInputElement).value);
                          if (e.key === "Escape") setRenamingFolderId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="block truncate max-w-[140px]" style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
                          {folder.name}
                        </span>
                        <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>
                          {docsInFolder(folder.id)} docs
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active folder breadcrumb */}
      {activeFolderId && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveFolderId(null)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-tertiary)", fontSize: "13px" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Docs
          </button>
          <span style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>/</span>
          <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
            {docFolders.find((f) => f.id === activeFolderId)?.name || "Folder"}
          </span>
        </div>
      )}

      {/* Documents section header */}
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--text-primary)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Documents
        </span>
        <span
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
          style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}
        >
          {filteredDocs.length}
        </span>
      </div>

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-[12px] flex items-center justify-center mb-4"
            style={{ background: "var(--neutral-100)" }}
          >
            <FileText className="w-8 h-8" style={{ color: "var(--text-quaternary)" }} />
          </div>
          <h3 style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 600 }}>
            {searchQuery ? "No documents found" : "No documents yet"}
          </h3>
          <p className="mt-1.5 max-w-sm" style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>
            {searchQuery ? "Try adjusting your search or filters." : "Create your first document to get started."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-white transition-opacity hover:opacity-90"
              style={{ background: "#FA6863", fontSize: "13px", fontWeight: 500 }}
            >
              <Plus className="w-4 h-4" />
              New Doc
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredDocs.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onClick={() => { setDocStack([]); setActiveDocId(doc.id); }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ docId: doc.id, x: e.clientX, y: e.clientY });
              }}
              formatDate={formatDateShort}
              isStarred={isStarred(doc.id)}
              isRenaming={renamingDocId === doc.id}
              onRename={(name) => {
                updateDoc(doc.id, { title: name, updatedAt: new Date().toISOString() });
                setRenamingDocId(null);
              }}
              onCancelRename={() => setRenamingDocId(null)}
              onToggleToday={() => updateDoc(doc.id, { today: !doc.today })}
              onToggleLineup={() => updateDoc(doc.id, { lineup: !doc.lineup })}
              onDragStart={() => setDraggedDocId(doc.id)}
              onDragEnd={() => { setDraggedDocId(null); setDropTargetFolderId(null); }}
              isDragging={draggedDocId === doc.id}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (() => {
          const doc = docs.find((d) => d.id === contextMenu.docId);
          return (
            <ContextMenuPopup
              key="doc-ctx-menu"
              x={contextMenu.x}
              y={contextMenu.y}
              onClose={() => setContextMenu(null)}
              items={[
                { label: "Open", icon: FileText, action: () => { setDocStack([]); setActiveDocId(contextMenu.docId); setContextMenu(null); } },
                { label: "Rename", icon: PencilSimple, action: () => { setRenamingDocId(contextMenu.docId); setContextMenu(null); } },
                { label: "Duplicate", icon: Copy, action: () => handleDuplicateDoc(contextMenu.docId) },
                null,
                {
                  label: doc?.pinned ? "Unpin" : "Pin",
                  icon: PushPin,
                  action: () => { updateDoc(contextMenu.docId, { pinned: !doc?.pinned }); setContextMenu(null); },
                },
                {
                  label: isStarred(contextMenu.docId) ? "Unfavorite" : "Favorite",
                  icon: Star,
                  action: () => { toggleStarred(contextMenu.docId); setContextMenu(null); },
                },
                {
                  label: doc?.today ? "Remove from Today" : "Add to Today",
                  icon: Sun,
                  action: () => { updateDoc(contextMenu.docId, { today: !doc?.today }); setContextMenu(null); },
                },
                {
                  label: doc?.lineup ? "Remove from Lineup" : "Add to Lineup",
                  icon: SkipForward,
                  action: () => { updateDoc(contextMenu.docId, { lineup: !doc?.lineup }); setContextMenu(null); },
                },
                {
                  label: doc?.private ? "Make Public" : "Make Private",
                  icon: doc?.private ? LockOpen : Lock,
                  action: () => { updateDoc(contextMenu.docId, { private: !doc?.private }); setContextMenu(null); },
                },
                null,
                ...(docFolders.length > 0 ? [
                  ...docFolders.map((f) => ({
                    label: doc?.folderId === f.id ? `✓ ${f.name}` : `Move to ${f.name}`,
                    icon: FolderSimple,
                    action: () => {
                      updateDoc(contextMenu.docId, {
                        folderId: doc?.folderId === f.id ? undefined : f.id,
                        updatedAt: new Date().toISOString(),
                      });
                      setContextMenu(null);
                    },
                  })),
                  ...(doc?.folderId ? [{
                    label: "Remove from Folder",
                    icon: FolderSimple,
                    action: () => { updateDoc(contextMenu.docId, { folderId: undefined, updatedAt: new Date().toISOString() }); setContextMenu(null); },
                  }] : []),
                  null as any,
                ] : []),
                { label: "Delete", icon: Trash, action: () => handleDeleteDoc(contextMenu.docId), danger: true },
              ]}
            />
          );
        })()}
      </AnimatePresence>

      {/* Folder Context Menu */}
      <AnimatePresence>
        {folderContextMenu && (
          <ContextMenuPopup
            key="folder-ctx-menu"
            x={folderContextMenu.x}
            y={folderContextMenu.y}
            onClose={() => setFolderContextMenu(null)}
            items={[
              { label: "Rename", icon: PencilSimple, action: () => { setRenamingFolderId(folderContextMenu.folderId); setFolderContextMenu(null); } },
              null,
              ...FOLDER_COLORS.slice(0, 7).map((color) => ({
                label: "",
                icon: () => <div className="w-4 h-4 rounded-full" style={{ background: color }} />,
                action: () => { handleFolderColor(folderContextMenu.folderId, color); setFolderContextMenu(null); },
              })),
              null,
              { label: "Delete Folder", icon: Trash, action: () => handleDeleteFolder(folderContextMenu.folderId), danger: true },
            ]}
          />
        )}
      </AnimatePresence>

      {/* Create Document Modal */}
      <AnimatePresence>
        {createModalOpen && (
          <CreateDocModal
            key="create-doc-modal"
            onClose={() => setCreateModalOpen(false)}
            onCreate={handleCreateDoc}
            folders={rootFolders}
            activeFolderId={activeFolderId}
          />
        )}
      </AnimatePresence>

      {/* Template Gallery (D7) */}
      <AnimatePresence>
        <TemplateGalleryModal
          open={showTemplateGallery}
          onSelect={(template) => {
            handleCreateDoc(template.type, template.label, undefined, undefined, template.blocks);
            setShowTemplateGallery(false);
            toast.success(`Created "${template.label}" from template`);
          }}
          onClose={() => setShowTemplateGallery(false)}
        />
      </AnimatePresence>

      {/* Import from Markdown Modal (D5) */}
      <ImportMarkdownModal
        open={importMdOpen}
        onClose={() => setImportMdOpen(false)}
        onImport={(title, blocks) => {
          handleCreateDoc("doc", title, undefined, undefined, blocks);
          toast.success(`Imported "${title}"`);
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DOCUMENT CARD
   ═══════════════════════════════════════════════════════════ */

function DocCard({
  doc,
  onClick,
  onContextMenu,
  formatDate,
  isStarred,
  isRenaming,
  onRename,
  onCancelRename,
  onToggleToday,
  onToggleLineup,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  doc: WorkspaceDoc;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  formatDate: (iso: string) => string;
  isStarred: boolean;
  isRenaming: boolean;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onToggleToday?: () => void;
  onToggleLineup?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  const meta = DOC_TYPE_META[doc.type] || DEFAULT_DOC_META;
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) renameRef.current?.focus();
  }, [isRenaming]);

  const preview = useMemo(() => {
    if (!doc.blocks?.length) return doc.content || "";
    return doc.blocks
      .filter((b) => b.type !== "divider" && b.type !== "image" && b.type !== "table" && b.type !== "embed" && b.content)
      .slice(0, 3)
      .map((b) => b.content)
      .join(" ")
      .slice(0, 120);
  }, [doc]);

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => {
        const evt = e as unknown as React.DragEvent;
        evt.dataTransfer?.setData("text/plain", doc.id);
        onDragStart?.();
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`group cursor-pointer rounded-[10px] border overflow-hidden transition-all hover:shadow-md ${isDragging ? "opacity-40" : ""}`}
      style={{ background: "var(--surface-bg)", borderColor: "#e1e5eb" }}
      whileHover={{ y: -2 }}
    >
      {/* Thumbnail area */}
      <div
        className="flex items-center justify-center relative overflow-hidden"
        style={{
          background: doc.coverImage ? undefined : meta.bgColor,
          height: "100px",
        }}
      >
        {doc.coverImage ? (
          <img
            src={doc.coverImage}
            alt=""
            className="w-full h-full object-cover"
            style={{ objectPosition: `center ${doc.coverImageY ?? 50}%` }}
          />
        ) : doc.icon && DOC_ICON_MAP[doc.icon] ? (
          <DocIconDisplay iconName={doc.icon} color={meta.color} size="lg" />
        ) : (
          <meta.icon className="w-7 h-7" style={{ color: meta.color }} weight="duotone" />
        )}
        {/* Today/Lineup badges — top-left */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
          {doc.today && (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] backdrop-blur-sm"
              style={{ background: "rgba(245, 158, 11, 0.85)" }}
            >
              <Sun className="w-2.5 h-2.5 text-white" weight="fill" />
            </div>
          )}
          {doc.lineup && (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] backdrop-blur-sm"
              style={{ background: "rgba(59, 130, 246, 0.85)" }}
            >
              <SkipForward className="w-2.5 h-2.5 text-white" weight="fill" />
            </div>
          )}
        </div>

        {/* Hover-reveal Today/Lineup toggle buttons — bottom-left */}
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onToggleToday && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleToday(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              style={{
                background: doc.today ? "rgba(245, 158, 11, 0.9)" : "rgba(0,0,0,0.45)",
              }}
              title={doc.today ? "Remove from Today" : "Add to Today"}
            >
              <Sun className="w-3 h-3 text-white" weight={doc.today ? "fill" : "regular"} />
            </button>
          )}
          {onToggleLineup && (
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLineup(); }}
              className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
              style={{
                background: doc.lineup ? "rgba(59, 130, 246, 0.9)" : "rgba(0,0,0,0.45)",
              }}
              title={doc.lineup ? "Remove from Lineup" : "Add to Lineup"}
            >
              <SkipForward className="w-3 h-3 text-white" weight={doc.lineup ? "fill" : "regular"} />
            </button>
          )}
        </div>

        {/* Status badges — top-right */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
          {doc.pinned && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <PushPin className="w-3 h-3 text-white" weight="fill" />
            </div>
          )}
          {isStarred && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Star className="w-3 h-3 text-white" weight="fill" />
            </div>
          )}
          {doc.private && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Lock className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="px-3.5 pt-3 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
            style={{ background: meta.bgColor, color: meta.color, fontSize: "10px", fontWeight: 600 }}
          >
            <meta.icon className="w-2.5 h-2.5" />
            {meta.label}
          </span>
          {doc.projectName && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
              style={{ background: "var(--neutral-100)", color: "var(--text-tertiary)", fontSize: "10px", fontWeight: 500 }}
            >
              {doc.projectName}
            </span>
          )}
        </div>

        {isRenaming ? (
          <input
            ref={renameRef}
            defaultValue={doc.title}
            className="w-full bg-transparent outline-none mb-1 px-0 py-0"
            style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, borderBottom: "2px solid var(--accent-primary)" }}
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => onRename(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRename((e.target as HTMLInputElement).value);
              if (e.key === "Escape") onCancelRename();
            }}
          />
        ) : (
          <h3 className="truncate" style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, lineHeight: 1.4 }}>
            {doc.title || "Untitled"}
          </h3>
        )}

        {preview && (
          <p className="truncate mt-0.5" style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>{preview}</p>
        )}

        <p className="mt-2" style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
          {formatDate(doc.updatedAt)}
        </p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DOCUMENT EDITOR VIEW
   ═══════════════════════════════════════════════════════════ */

function DocumentEditor({
  doc,
  onBack,
  onTitleChange,
  onBlocksChange,
  onDelete,
  formatDate,
  allDocs,
  resolveDoc,
  onNavigateDoc,
  onCreateNestedDoc,
  docStack,
}: {
  doc: WorkspaceDoc;
  onBack: () => void;
  onTitleChange: (title: string) => void;
  onBlocksChange: (blocks: DocBlock[]) => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
  allDocs?: WorkspaceDoc[];
  resolveDoc?: (docId: string) => WorkspaceDoc | null;
  onNavigateDoc?: (docId: string) => void;
  onCreateNestedDoc?: (parentBlockId: string, seedBlocks?: DocBlock[]) => string | null;
  docStack?: string[];
}) {
  const meta = DOC_TYPE_META[doc.type] || DEFAULT_DOC_META;
  const [showMenu, setShowMenu] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [showBlocksPanel, setShowBlocksPanel] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showScriptPanels, setShowScriptPanels] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editorFocusedBlockId, setEditorFocusedBlockId] = useState<string | null>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [commentPopover, setCommentPopover] = useState<{ blockId: string; top: number; left: number } | null>(null);
  const [showWordGoalPopover, setShowWordGoalPopover] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  // ── D7 state ──
  const [showBacklinks, setShowBacklinks] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [showDocStats, setShowDocStats] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const prevBlocksRef = useRef<DocBlock[]>(doc.blocks || []);
  const isRemoteUpdateRef = useRef(false);
  const { updateDoc, isStarred, toggleStarred, projects, clients, teamMembers } = useData();

  // ── Undo/Redo history (D4) ──
  const history = useDocHistory(doc.blocks || []);

  // ── Auto-versioning (D5) ──
  const versioning = useAutoVersioning(doc.id, doc.blocks || []);

  // ── D6 hooks ──
  const blockComments = useBlockComments(doc.id);
  const docLock = useDocLock(doc.id);
  const wordGoal = useWordGoal(doc.id);
  const blocks = doc.blocks || [];
  const wordCount = useMemo(() => blocks.reduce((acc, b) => acc + (b.content?.split(/\s+/).filter(Boolean).length || 0), 0), [blocks]);

  // ── D7: Command Palette keyboard shortcut ──
  useCommandPalette(showCommandPalette, setShowCommandPalette);

  // ── D7: Build command list ──
  const commandItems: CommandItem[] = useMemo(() => {
    const cmds: CommandItem[] = [];
    // Document actions
    cmds.push({ id: "undo", label: "Undo", icon: ArrowCounterClockwise, section: "Edit", action: () => { const b = history.undo(); if (b) { prevBlocksRef.current = b; onBlocksChange(b); } }, keywords: ["undo"] });
    cmds.push({ id: "redo", label: "Redo", icon: ArrowClockwise, section: "Edit", action: () => { const b = history.redo(); if (b) { prevBlocksRef.current = b; onBlocksChange(b); } }, keywords: ["redo"] });
    cmds.push({ id: "find", label: "Find & Replace", icon: MagnifyingGlass, section: "Edit", action: () => setShowFindReplace(true), keywords: ["search", "find", "replace"] });
    cmds.push({ id: "focus", label: "Focus Mode", icon: ArrowsOut, section: "View", action: () => setFocusMode(true), keywords: ["zen", "distraction"] });
    cmds.push({ id: "fullwidth", label: fullWidth ? "Normal Width" : "Full Width", icon: fullWidth ? ArrowsInSimple : ArrowsOutSimple, section: "View", action: () => setFullWidth(!fullWidth), keywords: ["width", "wide", "narrow"] });
    cmds.push({ id: "outline", label: "Toggle Outline", icon: ListDashes, section: "View", action: () => setShowOutline(!showOutline), keywords: ["outline", "toc", "headings"] });
    cmds.push({ id: "format", label: "Format Panel", icon: SquareHalf, section: "View", action: () => { setShowFormatPanel(!showFormatPanel); setShowBlocksPanel(false); }, keywords: ["format", "style"] });
    cmds.push({ id: "blocks", label: "Blocks Panel", icon: SkipForward, section: "View", action: () => { setShowBlocksPanel(!showBlocksPanel); setShowFormatPanel(false); }, keywords: ["blocks", "add"] });
    cmds.push({ id: "export-md", label: "Export Markdown", icon: Export, section: "Export", action: () => { downloadMarkdown(doc.title || "Untitled", doc.blocks || []); toast.success("Exported to Markdown"); }, keywords: ["markdown", "download"] });
    cmds.push({ id: "export-panel", label: "Export Options", icon: Export, section: "Export", action: () => setShowExportPanel(true), keywords: ["html", "pdf", "print", "export"] });
    cmds.push({ id: "comments", label: "Comments Panel", icon: ChatCircleDots, section: "Collaboration", action: () => setShowCommentsPanel(!showCommentsPanel), keywords: ["comments", "discuss"] });
    cmds.push({ id: "lock", label: docLock.locked ? "Unlock Document" : "Lock Document", icon: docLock.locked ? LockOpen : Lock, section: "Collaboration", action: docLock.toggle, keywords: ["lock", "unlock", "protect"] });
    cmds.push({ id: "versions", label: "Version History", icon: ClockCounterClockwise, section: "History", action: () => setShowVersionHistory(!showVersionHistory), keywords: ["version", "history", "snapshot"] });
    cmds.push({ id: "backlinks", label: "Backlinks", icon: LinkPhIcon, section: "References", action: () => setShowBacklinks(!showBacklinks), keywords: ["backlinks", "references", "linked"] });
    cmds.push({ id: "stats", label: "Document Stats", icon: ChartBar, section: "Analyze", action: () => setShowDocStats(!showDocStats), keywords: ["stats", "analytics", "words", "readability"] });
    cmds.push({ id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard, section: "Help", action: () => setShowKeyboardShortcuts(true), keywords: ["keyboard", "shortcuts", "help"] });
    // Navigate to other docs
    if (allDocs) {
      for (const d of allDocs.slice(0, 20)) {
        if (d.id === doc.id) continue;
        cmds.push({ id: `nav-${d.id}`, label: d.title || "Untitled", description: d.type, icon: FileText, iconColor: DOC_TYPE_META[d.type]?.color, section: "Documents", action: () => onNavigateDoc?.(d.id), keywords: [d.type] });
      }
    }
    return cmds;
  }, [doc, history, fullWidth, showOutline, showFormatPanel, showBlocksPanel, showCommentsPanel, showVersionHistory, showBacklinks, showDocStats, docLock, allDocs]);

  const allTasks = useAllTasks();
  const { user, profile } = useAuth();

  // Build mention items from team members
  const mentionItems: MentionItem[] = useMemo(() => {
    return teamMembers.map((m) => ({
      id: m.userId,
      label: m.displayName,
      type: "person" as const,
      color: m.avatarColor,
      avatarUrl: m.avatarUrl,
    }));
  }, [teamMembers]);

  // Real-time collaboration (D12)
  const handleRemoteOperation = useCallback((op: CollabOperation, _senderId: string) => {
    isRemoteUpdateRef.current = true;
    if (op.type === "block_update") {
      // Apply remote block update to current blocks
      const currentBlocks = doc.blocks || [];
      const updated = currentBlocks.map((b) =>
        b.id === op.blockId ? { ...b, ...op.updates } : b
      );
      onBlocksChange(updated);
    } else if (op.type === "block_insert") {
      const currentBlocks = doc.blocks || [];
      const idx = op.afterBlockId
        ? currentBlocks.findIndex((b) => b.id === op.afterBlockId) + 1
        : 0;
      const next = [...currentBlocks];
      next.splice(idx, 0, op.block);
      onBlocksChange(next);
    } else if (op.type === "block_delete") {
      const currentBlocks = doc.blocks || [];
      onBlocksChange(currentBlocks.filter((b) => b.id !== op.blockId));
    } else if (op.type === "blocks_reorder") {
      const currentBlocks = doc.blocks || [];
      const blockMap = new Map(currentBlocks.map((b) => [b.id, b]));
      const reordered = op.blockIds
        .map((id) => blockMap.get(id))
        .filter(Boolean) as DocBlock[];
      // Add any blocks not in the reorder list at the end
      const reorderedIds = new Set(op.blockIds);
      currentBlocks.forEach((b) => {
        if (!reorderedIds.has(b.id)) reordered.push(b);
      });
      onBlocksChange(reordered);
    } else if (op.type === "title_change") {
      onTitleChange(op.title);
    } else if (op.type === "meta_change") {
      updateDoc(doc.id, op.updates);
    }
    // Reset remote flag after a tick so the onChange wrapper can check it
    requestAnimationFrame(() => { isRemoteUpdateRef.current = false; });
  }, [doc.blocks, doc.id, onBlocksChange, onTitleChange, updateDoc]);

  const collab = useCollaboration({
    docId: doc.id,
    userId: user?.id || `anon_${Math.random().toString(36).slice(2, 8)}`,
    userName: profile?.displayName || user?.email?.split("@")[0] || "Anonymous",
    userAvatarUrl: profile?.avatarUrl,
    onRemoteOperation: handleRemoteOperation,
    enabled: true,
  });

  // Block-change broadcasting wrapper (D12) — diffs old vs new blocks and
  // broadcasts individual operations to collaborators. Skips broadcasting
  // when the change originated from a remote operation.
  const handleBlocksChangeWithBroadcast = useCallback((newBlocks: DocBlock[]) => {
    if (isRemoteUpdateRef.current) {
      // This change came from a remote collaborator; don't re-broadcast
      prevBlocksRef.current = newBlocks;
      onBlocksChange(newBlocks);
      return;
    }

    const oldBlocks = prevBlocksRef.current;
    const oldMap = new Map(oldBlocks.map((b) => [b.id, b]));
    const newMap = new Map(newBlocks.map((b) => [b.id, b]));

    // Detect deleted blocks
    for (const ob of oldBlocks) {
      if (!newMap.has(ob.id)) {
        collab.broadcastBlockDelete(ob.id);
      }
    }

    // Detect inserted and updated blocks
    for (let i = 0; i < newBlocks.length; i++) {
      const nb = newBlocks[i];
      const ob = oldMap.get(nb.id);
      if (!ob) {
        // New block inserted
        const afterId = i > 0 ? newBlocks[i - 1].id : null;
        collab.broadcastBlockInsert(nb, afterId);
      } else if (JSON.stringify(ob) !== JSON.stringify(nb)) {
        // Block was updated — compute diff
        const updates: Partial<DocBlock> = {};
        for (const key of Object.keys(nb) as (keyof DocBlock)[]) {
          if (JSON.stringify(ob[key]) !== JSON.stringify(nb[key])) {
            (updates as any)[key] = nb[key];
          }
        }
        if (Object.keys(updates).length > 0) {
          collab.broadcastBlockUpdate(nb.id, updates);
        }
      }
    }

    // Detect reorder (if same ids but different order)
    if (
      oldBlocks.length === newBlocks.length &&
      oldBlocks.every((b) => newMap.has(b.id)) &&
      oldBlocks.some((b, i) => b.id !== newBlocks[i].id)
    ) {
      collab.broadcastBlocksReorder(newBlocks.map((b) => b.id));
    }

    // Push to undo history (D4)
    history.push(newBlocks);

    prevBlocksRef.current = newBlocks;
    onBlocksChange(newBlocks);
  }, [onBlocksChange, collab, history]);

  // ── Undo/Redo keyboard shortcuts (D4) ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      // Cmd+Z = undo, Cmd+Shift+Z = redo
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const blocks = history.undo();
        if (blocks) {
          prevBlocksRef.current = blocks;
          onBlocksChange(blocks);
        }
      } else if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        const blocks = history.redo();
        if (blocks) {
          prevBlocksRef.current = blocks;
          onBlocksChange(blocks);
        }
      }
      // Cmd+F = find/replace
      else if (mod && e.key === "f") {
        e.preventDefault();
        setShowFindReplace(true);
      }
      // Cmd+/ = keyboard shortcuts (D5)
      else if (mod && e.key === "/") {
        e.preventDefault();
        setShowKeyboardShortcuts((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [history, onBlocksChange]);

  // Clear history when switching docs
  useEffect(() => {
    history.clear();
  }, [doc.id]);

  // Keep prevBlocksRef in sync when doc.blocks changes from external sources
  useEffect(() => {
    prevBlocksRef.current = doc.blocks || [];
  }, [doc.blocks]);

  // Linking dropdowns state
  const [projectLinkOpen, setProjectLinkOpen] = useState(false);
  const [clientLinkOpen, setClientLinkOpen] = useState(false);
  const [taskLinkOpen, setTaskLinkOpen] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const projectLinkRef = useRef<HTMLDivElement>(null);
  const clientLinkRef = useRef<HTMLDivElement>(null);
  const taskLinkRef = useRef<HTMLDivElement>(null);

  // Close link dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (projectLinkRef.current && !projectLinkRef.current.contains(e.target as Node)) setProjectLinkOpen(false);
      if (clientLinkRef.current && !clientLinkRef.current.contains(e.target as Node)) setClientLinkOpen(false);
      if (taskLinkRef.current && !taskLinkRef.current.contains(e.target as Node)) setTaskLinkOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Linking data
  const projectList = useMemo(() =>
    Object.entries(projects).map(([name, data]) => ({
      name,
      color: (data as ProjectData).color || "#3B82F6",
    })), [projects]);

  const clientList = useMemo(() =>
    clients.map((c) => ({
      id: c.id || c.name,
      name: c.name,
      color: c.avatarColor || "#F59145",
    })), [clients]);

  const linkedProjectName = doc.linkedProjectId || doc.projectName;
  const linkedProject = linkedProjectName
    ? projectList.find((p) => p.name === linkedProjectName)
    : null;
  const linkedClient = doc.linkedClientId
    ? clientList.find((c) => c.id === doc.linkedClientId || c.name === doc.linkedClientId)
    : null;
  const linkedTask = doc.linkedTaskId
    ? allTasks.find((t) => t.id === doc.linkedTaskId)
    : null;

  // Script autocomplete: compute known characters and locations
  const scriptKnownCharacters = useMemo(() => {
    if (doc.type !== "script") return [];
    const chars = new Set<string>();
    (doc.blocks || []).filter((b) => b.type === "character").forEach((b) => {
      const name = b.content.trim().toUpperCase();
      if (name) chars.add(name);
    });
    (doc.characters || []).forEach((c) => chars.add(c.toUpperCase()));
    return Array.from(chars).sort();
  }, [doc.type, doc.blocks, doc.characters]);

  const scriptKnownLocations = useMemo(() => {
    if (doc.type !== "script") return [];
    const locs = new Set<string>();
    (doc.blocks || []).filter((b) => b.type === "scene-heading").forEach((b) => {
      const match = b.content.match(/(?:INT\.|EXT\.|INT\.\/EXT\.)\s*(.+?)(?:\s*[-–—]\s*|$)/i);
      const loc = match?.[1]?.trim().toUpperCase() || b.content.trim().toUpperCase();
      if (loc) locs.add(loc);
    });
    (doc.locations || []).forEach((l) => locs.add(l.toUpperCase()));
    return Array.from(locs).sort();
  }, [doc.type, doc.blocks, doc.locations]);

  // AI state
  const [showAiSidebar, setShowAiSidebar] = useState(false);
  const [aiPromptAction, setAiPromptAction] = useState<AiDocAction | null>(null);
  const [aiPromptBlockId, setAiPromptBlockId] = useState<string | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);

  // Serialized doc content for AI context
  const serializedDocContent = useMemo(() => {
    return (doc.blocks || [])
      .filter((b) => b.content)
      .map((b) => b.content)
      .join("\n");
  }, [doc.blocks]);

  // AI slash command handler
  const handleAiAction = useCallback((slashAction: AiSlashAction, afterBlockId: string) => {
    const actionName = slashAction.replace("ai-", "") as AiDocAction;
    setAiPromptAction(actionName);
    setAiPromptBlockId(afterBlockId);
  }, []);

  // Insert AI-generated blocks after a specific block
  const handleInsertAiBlocks = useCallback((newBlocks: DocBlock[]) => {
    if (!aiPromptBlockId) {
      // Append to end
      onBlocksChange([...(doc.blocks || []), ...newBlocks]);
    } else {
      const blocks = doc.blocks || [];
      const idx = blocks.findIndex((b) => b.id === aiPromptBlockId);
      if (idx === -1) {
        onBlocksChange([...blocks, ...newBlocks]);
      } else {
        const updated = [...blocks];
        updated.splice(idx + 1, 0, ...newBlocks);
        onBlocksChange(updated);
      }
    }
    toast.success(`Inserted ${newBlocks.length} block${newBlocks.length !== 1 ? "s" : ""}`);
  }, [aiPromptBlockId, doc.blocks, onBlocksChange]);

  // Insert text from AI chat sidebar as a paragraph block
  const handleInsertAiText = useCallback((text: string) => {
    const newBlock: DocBlock = {
      id: generateBlockId(),
      type: "paragraph",
      content: text,
    };
    onBlocksChange([...(doc.blocks || []), newBlock]);
  }, [doc.blocks, onBlocksChange]);

  // Cover image state
  const [coverHovered, setCoverHovered] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Publishing state
  const [publishSlug, setPublishSlug] = useState<string | null>(doc.publishedSlug || null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  useEffect(() => {
    if (doc.publishedSlug) {
      setPublishSlug(doc.publishedSlug);
    } else {
      api.get<{ slug: string | null }>(`/publish-slug/${doc.id}`).then(({ data }) => {
        if (data?.slug) {
          setPublishSlug(data.slug);
          updateDoc(doc.id, { publishedSlug: data.slug });
        }
      }).catch(() => {});
    }
  }, [doc.id]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const { data, error } = await api.post<{ slug: string }>("/publish/doc", {
        docId: doc.id, title: doc.title, blocks: doc.blocks, type: doc.type,
        meetingDate: doc.meetingDate, attendees: doc.attendees, slug: publishSlug || undefined,
      });
      if (error) { toast.error(`Publish failed: ${error}`); return; }
      if (data?.slug) {
        setPublishSlug(data.slug);
        updateDoc(doc.id, { publishedSlug: data.slug });
        toast.success("Document published! Link copied.");
        const url = `${window.location.origin}/#/published/${data.slug}`;
        navigator.clipboard?.writeText(url).catch(() => {});
      }
    } catch { toast.error("Failed to publish document"); }
    finally { setIsPublishing(false); }
  };

  const handleUnpublish = async () => {
    setIsPublishing(true);
    try {
      const { error } = await api.post("/unpublish", { docId: doc.id, slug: publishSlug });
      if (error) { toast.error(`Unpublish failed: ${error}`); return; }
      setPublishSlug(null);
      updateDoc(doc.id, { publishedSlug: undefined });
      toast.success("Document unpublished");
    } catch { toast.error("Failed to unpublish"); }
    finally { setIsPublishing(false); }
  };

  const handleCoverChange = (url: string) => {
    updateDoc(doc.id, { coverImage: url, updatedAt: new Date().toISOString() });
    setShowCoverPicker(false);
  };

  const handleRemoveCover = () => {
    updateDoc(doc.id, { coverImage: undefined, coverImageY: undefined, updatedAt: new Date().toISOString() });
  };

  // ── Cover image reposition state ──
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [repositionY, setRepositionY] = useState(doc.coverImageY ?? 50);
  const coverDragRef = useRef<{ startY: number; startVal: number } | null>(null);
  const repositionYRef = useRef(repositionY);
  repositionYRef.current = repositionY;

  const handleCoverDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startVal = repositionYRef.current;
    setIsRepositioning(true);
    coverDragRef.current = { startY: e.clientY, startVal };

    const handleMove = (ev: MouseEvent) => {
      if (!coverDragRef.current) return;
      const delta = ev.clientY - coverDragRef.current.startY;
      const newVal = Math.max(0, Math.min(100, coverDragRef.current.startVal - delta * 0.5));
      setRepositionY(newVal);
      repositionYRef.current = newVal;
    };

    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      setIsRepositioning(false);
      updateDoc(doc.id, { coverImageY: repositionYRef.current, updatedAt: new Date().toISOString() });
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }, [doc.id, updateDoc]);

  // Sync repositionY when doc changes
  useEffect(() => {
    if (!isRepositioning) setRepositionY(doc.coverImageY ?? 50);
  }, [doc.coverImageY, isRepositioning]);

  // ── Format panel handlers ──
  const handleEditorBlockFocus = useCallback((blockId: string | null) => {
    setEditorFocusedBlockId(blockId);
    collab.updateFocusedBlock(blockId);
  }, [collab]);

  const handleFormatChangeBlockType = useCallback((type: DocBlockType, level?: number) => {
    if (!editorFocusedBlockId) return;
    const blocks = doc.blocks || [];
    const updated = blocks.map((b) =>
      b.id === editorFocusedBlockId ? { ...b, type, level: level ?? b.level } : b
    );
    handleBlocksChangeWithBroadcast(updated);
  }, [editorFocusedBlockId, doc.blocks, handleBlocksChangeWithBroadcast]);

  const handleFormatApplyDecoration = useCallback((decoration?: "focus" | "block") => {
    if (!editorFocusedBlockId) return;
    const blocks = doc.blocks || [];
    const updated = blocks.map((b) =>
      b.id === editorFocusedBlockId ? { ...b, decoration: b.decoration === decoration ? undefined : decoration } : b
    );
    handleBlocksChangeWithBroadcast(updated);
  }, [editorFocusedBlockId, doc.blocks, handleBlocksChangeWithBroadcast]);

  const handleFormatApplyColor = useCallback((color?: string) => {
    if (!editorFocusedBlockId) return;
    const blocks = doc.blocks || [];
    const updated = blocks.map((b) =>
      b.id === editorFocusedBlockId ? { ...b, color: b.color === color ? undefined : color } : b
    );
    handleBlocksChangeWithBroadcast(updated);
  }, [editorFocusedBlockId, doc.blocks, handleBlocksChangeWithBroadcast]);

  const handleFormatApplyFont = useCallback((fontStyle?: DocBlock["fontStyle"]) => {
    if (!editorFocusedBlockId) return;
    const blocks = doc.blocks || [];
    const updated = blocks.map((b) =>
      b.id === editorFocusedBlockId ? { ...b, fontStyle: b.fontStyle === fontStyle ? undefined : fontStyle } : b
    );
    handleBlocksChangeWithBroadcast(updated);
  }, [editorFocusedBlockId, doc.blocks, handleBlocksChangeWithBroadcast]);

  // Current focused block properties for FormatPanel active state
  const focusedBlock = useMemo(() => {
    if (!editorFocusedBlockId) return null;
    return (doc.blocks || []).find((b) => b.id === editorFocusedBlockId) || null;
  }, [editorFocusedBlockId, doc.blocks]);

  return (
    <div className="flex gap-6 -mx-4 sm:-mx-6 md:-mx-10 -mt-6 md:-mt-10">
    {/* Main content */}
    <div className="flex-1 min-w-0 flex flex-col" style={{ background: "white" }}>
      {/* ═══ HEADER BAR — sticky top ═══ */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between h-10 px-2.5 shrink-0"
        style={{ background: "white", borderBottom: "1px solid var(--border-default)" }}
      >
        {/* Left: back button with breadcrumb for nested docs */}
        <div className="flex items-center gap-0.5 min-w-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 h-[31.5px] px-2.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] shrink-0"
            style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" />
            {docStack && docStack.length > 0 ? "Back" : "Docs"}
          </button>
          {docStack && docStack.length > 0 && allDocs && (
            <div className="flex items-center gap-0.5 min-w-0 overflow-hidden">
              {docStack.slice(-2).map((stackDocId) => {
                const stackDoc = allDocs.find((d) => d.id === stackDocId);
                return (
                  <span key={stackDocId} className="flex items-center gap-0.5 shrink-0">
                    <span style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>/</span>
                    <span className="truncate max-w-[100px]" style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                      {stackDoc?.title || "Untitled"}
                    </span>
                  </span>
                );
              })}
              <span style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>/</span>
              <span className="truncate max-w-[120px]" style={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: 600 }}>
                {doc.title || "Untitled"}
              </span>
            </div>
          )}
        </div>

        {/* Right: action icons + meta */}
        <div className="flex items-center gap-0.5">
          {/* Collaboration Bar (D12) */}
          <CollaborationBar
            status={collab.status}
            collaborators={collab.collaborators}
          />

          {collab.collaborators.length > 0 && (
            <div className="w-px h-4 mx-0.5" style={{ background: "var(--border-default)" }} />
          )}

          {/* Star */}
          <button
            onClick={() => toggleStarred(doc.id)}
            className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: isStarred(doc.id) ? "oklch(0.85 0.15 85)" : "var(--text-quaternary)" }}
            title={isStarred(doc.id) ? "Unfavorite" : "Favorite"}
          >
            <Star className="w-3.5 h-3.5" weight={isStarred(doc.id) ? "fill" : "regular"} />
          </button>

          {/* Today */}
          <button
            onClick={() => updateDoc(doc.id, { today: !doc.today })}
            className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: doc.today ? "#F59E0B" : "var(--text-quaternary)" }}
            title={doc.today ? "Remove from Today" : "Add to Today"}
          >
            <Sun className="w-3.5 h-3.5" weight={doc.today ? "fill" : "regular"} />
          </button>

          {/* Lineup */}
          <button
            onClick={() => updateDoc(doc.id, { lineup: !doc.lineup })}
            className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: doc.lineup ? "#3B82F6" : "var(--text-quaternary)" }}
            title={doc.lineup ? "Remove from Lineup" : "Add to Lineup"}
          >
            <SkipForward className="w-3.5 h-3.5" weight={doc.lineup ? "fill" : "regular"} />
          </button>

          {/* Divider */}
          <div className="w-px h-4 mx-0.5" style={{ background: "var(--border-default)" }} />

          {/* ── Link: Project (SquareHalf — same as nav) ── */}
          <div ref={projectLinkRef} className="relative">
            <button
              onClick={() => { setProjectLinkOpen(!projectLinkOpen); setClientLinkOpen(false); setTaskLinkOpen(false); setLinkSearch(""); }}
              className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: linkedProject ? linkedProject.color : "var(--text-quaternary)" }}
              title={linkedProject ? `Project: ${linkedProjectName}` : "Link project"}
            >
              <SquareHalf className="w-3.5 h-3.5" weight={linkedProject ? "fill" : "regular"} />
            </button>
            <AnimatePresence>
              {projectLinkOpen && (
                <motion.div
                  className="absolute right-0 top-full mt-1 w-52 rounded-[8px] shadow-lg border py-1 z-50 max-h-64 overflow-y-auto"
                  style={{ background: "var(--surface-bg)", borderColor: "#e1e5eb" }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="px-2 pb-1">
                    <input
                      autoFocus
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="Search projects…"
                      className="w-full px-2 py-1.5 rounded-[5px] outline-none"
                      style={{ fontSize: "12px", background: "var(--neutral-50)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                    />
                  </div>
                  {linkedProjectName && (
                    <button
                      onClick={() => { updateDoc(doc.id, { linkedProjectId: undefined, projectName: undefined }); setProjectLinkOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove link
                    </button>
                  )}
                  {projectList.filter((p) => !linkSearch || p.name.toLowerCase().includes(linkSearch.toLowerCase())).length === 0 ? (
                    <div className="px-3 py-2" style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>No projects</div>
                  ) : (
                    projectList.filter((p) => !linkSearch || p.name.toLowerCase().includes(linkSearch.toLowerCase())).map((p) => (
                      <button
                        key={p.name}
                        onClick={() => { updateDoc(doc.id, { linkedProjectId: p.name, projectName: p.name }); setProjectLinkOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        style={{ fontSize: "12px" }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                        <span className="truncate" style={{ color: linkedProjectName === p.name ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: linkedProjectName === p.name ? 600 : 400 }}>
                          {p.name}
                        </span>
                        {linkedProjectName === p.name && <CheckCircle className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: p.color }} weight="fill" />}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Link: Client (Briefcase — same as nav) ── */}
          <div ref={clientLinkRef} className="relative">
            <button
              onClick={() => { setClientLinkOpen(!clientLinkOpen); setProjectLinkOpen(false); setTaskLinkOpen(false); setLinkSearch(""); }}
              className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: linkedClient ? linkedClient.color : "var(--text-quaternary)" }}
              title={linkedClient ? `Client: ${linkedClient.name}` : "Link client"}
            >
              <Briefcase className="w-3.5 h-3.5" weight={linkedClient ? "fill" : "regular"} />
            </button>
            <AnimatePresence>
              {clientLinkOpen && (
                <motion.div
                  className="absolute right-0 top-full mt-1 w-48 rounded-[8px] shadow-lg border py-1 z-50 max-h-64 overflow-y-auto"
                  style={{ background: "var(--surface-bg)", borderColor: "#e1e5eb" }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="px-2 pb-1">
                    <input
                      autoFocus
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="Search clients…"
                      className="w-full px-2 py-1.5 rounded-[5px] outline-none"
                      style={{ fontSize: "12px", background: "var(--neutral-50)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                    />
                  </div>
                  {doc.linkedClientId && (
                    <button
                      onClick={() => { updateDoc(doc.id, { linkedClientId: undefined }); setClientLinkOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove link
                    </button>
                  )}
                  {clientList.filter((c) => !linkSearch || c.name.toLowerCase().includes(linkSearch.toLowerCase())).length === 0 ? (
                    <div className="px-3 py-2" style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>No clients</div>
                  ) : (
                    clientList.filter((c) => !linkSearch || c.name.toLowerCase().includes(linkSearch.toLowerCase())).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { updateDoc(doc.id, { linkedClientId: c.id }); setClientLinkOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        style={{ fontSize: "12px" }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                        <span className="truncate" style={{ color: doc.linkedClientId === c.id ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: doc.linkedClientId === c.id ? 600 : 400 }}>
                          {c.name}
                        </span>
                        {doc.linkedClientId === c.id && <CheckCircle className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: c.color }} weight="fill" />}
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Link: Task (ListChecks) ── */}
          <div ref={taskLinkRef} className="relative">
            <button
              onClick={() => { setTaskLinkOpen(!taskLinkOpen); setProjectLinkOpen(false); setClientLinkOpen(false); setLinkSearch(""); }}
              className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: linkedTask ? "var(--accent-primary)" : "var(--text-quaternary)" }}
              title={linkedTask ? `Task: ${linkedTask.title}` : "Link task"}
            >
              <ListChecks className="w-3.5 h-3.5" weight={linkedTask ? "fill" : "regular"} />
            </button>
            <AnimatePresence>
              {taskLinkOpen && (
                <motion.div
                  className="absolute right-0 top-full mt-1 w-64 rounded-[8px] shadow-lg border py-1 z-50 max-h-72 overflow-y-auto"
                  style={{ background: "var(--surface-bg)", borderColor: "#e1e5eb" }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="px-2 pb-1">
                    <input
                      autoFocus
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="Search tasks…"
                      className="w-full px-2 py-1.5 rounded-[5px] outline-none"
                      style={{ fontSize: "12px", background: "var(--neutral-50)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                    />
                  </div>
                  {doc.linkedTaskId && (
                    <button
                      onClick={() => { updateDoc(doc.id, { linkedTaskId: undefined }); setTaskLinkOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove link
                    </button>
                  )}
                  {allTasks.filter((t) => !linkSearch || t.title.toLowerCase().includes(linkSearch.toLowerCase())).length === 0 ? (
                    <div className="px-3 py-2" style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>No tasks</div>
                  ) : (
                    allTasks
                      .filter((t) => !linkSearch || t.title.toLowerCase().includes(linkSearch.toLowerCase()))
                      .slice(0, 30)
                      .map((t) => {
                        const projColor = projectList.find((p) => p.name === t.projectName)?.color || "#3B82F6";
                        return (
                          <button
                            key={t.id}
                            onClick={() => { updateDoc(doc.id, { linkedTaskId: t.id }); setTaskLinkOpen(false); }}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                            style={{ fontSize: "12px" }}
                          >
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: projColor }} />
                            <div className="flex-1 min-w-0">
                              <span className="truncate block" style={{ color: doc.linkedTaskId === t.id ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: doc.linkedTaskId === t.id ? 600 : 400 }}>
                                {t.title}
                              </span>
                              <span className="truncate block" style={{ color: "var(--text-quaternary)", fontSize: "10px" }}>{t.projectName}</span>
                            </div>
                            {doc.linkedTaskId === t.id && <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-primary)" }} weight="fill" />}
                          </button>
                        );
                      })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="w-px h-4 mx-0.5" style={{ background: "var(--border-default)" }} />

          {/* Doc type badge */}
          <div
            className="inline-flex items-center justify-center p-1.5 rounded-[4px]"
            style={{ background: meta.bgColor }}
            title={meta.label}
          >
            {doc.icon && DOC_ICON_MAP[doc.icon] ? (
              (() => { const CustomIcon = DOC_ICON_MAP[doc.icon!]; return <CustomIcon className="w-3 h-3" style={{ color: meta.color }} />; })()
            ) : (
              <meta.icon className="w-3 h-3" style={{ color: meta.color }} />
            )}
          </div>

          {/* Public / Private pill */}
          <button
            onClick={() => updateDoc(doc.id, { private: !doc.private })}
            className="inline-flex items-center gap-1 h-[24px] px-[7px] rounded-[5px] transition-colors hover:opacity-80"
            style={{
              background: "var(--neutral-100)",
              color: "var(--text-quaternary)",
              fontSize: "11px",
              fontWeight: 500,
            }}
          >
            {doc.private ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
            {doc.private ? "Private" : "Public"}
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-quaternary)" }}
            >
              <DotsThree className="w-5 h-5" weight="bold" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-full mt-1 w-56 rounded-[8px] shadow-lg border py-1 z-50"
                  style={{ background: "var(--surface-bg)", borderColor: "#e1e5eb" }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  <button
                    onClick={() => { setShowPublishDialog(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: publishSlug ? "oklch(0.47 0.12 155)" : "var(--text-secondary)", fontSize: "13px" }}
                  >
                    <Globe className="w-4 h-4" weight={publishSlug ? "fill" : "regular"} />
                    {publishSlug ? "Published" : "Publish to Web"}
                    {publishSlug && (
                      <span className="ml-auto w-2 h-2 rounded-full shrink-0" style={{ background: "#22C55E" }} />
                    )}
                  </button>

                  <div className="mx-2 my-1 h-px" style={{ background: "var(--border-default)" }} />

                  {/* ── Type Switcher ── */}
                  <div className="px-3 py-1" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Document Type
                  </div>
                  {DOC_TYPES.map((dt) => {
                    const isActive = doc.type === dt.type;
                    return (
                      <button
                        key={dt.type}
                        onClick={() => {
                          if (!isActive) updateDoc(doc.id, { type: dt.type, updatedAt: new Date().toISOString() });
                          setShowMenu(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        style={{ fontSize: "13px", color: isActive ? dt.color : "var(--text-secondary)", fontWeight: isActive ? 600 : 400 }}
                      >
                        <dt.icon className="w-4 h-4" style={{ color: dt.color }} />
                        {dt.label}
                        {isActive && <CheckCircle className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: dt.color }} weight="fill" />}
                      </button>
                    );
                  })}

                  <div className="mx-2 my-1 h-px" style={{ background: "var(--border-default)" }} />

                  <button
                    onClick={() => { setShowCoverPicker(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    <ImageIcon className="w-4 h-4" />
                    {doc.coverImage ? "Change Cover" : "Add Cover Image"}
                  </button>

                  {doc.coverImage && (
                    <button
                      onClick={() => { handleRemoveCover(); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      style={{ color: "var(--text-tertiary)", fontSize: "13px" }}
                    >
                      <X className="w-4 h-4" />
                      Remove Cover
                    </button>
                  )}

                  <div className="mx-2 my-1 h-px" style={{ background: "var(--border-default)" }} />

                  <button
                    onClick={() => { updateDoc(doc.id, { pinned: !doc.pinned }); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    <PushPin className="w-4 h-4" weight={doc.pinned ? "fill" : "regular"} />
                    {doc.pinned ? "Unpin" : "Pin"}
                  </button>

                  <button
                    onClick={() => { downloadMarkdown(doc.title || "Untitled", doc.blocks || []); toast.success("Exported to Markdown"); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    <Export className="w-4 h-4" />
                    Export as Markdown
                  </button>

                  <button
                    onClick={() => { setShowVersionHistory(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    <ClockCounterClockwise className="w-4 h-4" />
                    Version History
                  </button>

                  <button
                    onClick={() => { setShowKeyboardShortcuts(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                  >
                    <Keyboard className="w-4 h-4" />
                    Keyboard Shortcuts
                  </button>

                  <div className="mx-2 my-1 h-px" style={{ background: "var(--border-default)" }} />

                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "oklch(0.62 0.18 25)", fontSize: "13px" }}
                  >
                    <Trash className="w-4 h-4" />
                    Delete Document
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ═══ COVER IMAGE (full-width, before sub-bar) ═══ */}
      {doc.coverImage && (
        <div
          className="relative w-full overflow-hidden group/cover shrink-0"
          style={{ height: "220px", cursor: isRepositioning ? "ns-resize" : undefined }}
          onMouseEnter={() => setCoverHovered(true)}
          onMouseLeave={() => { if (!isRepositioning) setCoverHovered(false); }}
        >
          <img
            src={doc.coverImage}
            alt=""
            className="w-full h-full object-cover select-none"
            style={{ objectPosition: `center ${isRepositioning ? repositionY : (doc.coverImageY ?? 50)}%` }}
            draggable={false}
          />
          {/* Reposition overlay */}
          {isRepositioning && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
              <span className="px-3 py-1.5 rounded-[6px] text-white text-xs font-medium" style={{ background: "rgba(0,0,0,0.6)" }}>
                Drag to reposition
              </span>
            </div>
          )}
          {/* Normal hover overlay */}
          {coverHovered && !isRepositioning && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center gap-2 transition-opacity">
              <button
                onMouseDown={handleCoverDragStart}
                className="px-3 py-1.5 rounded-[6px] text-white text-xs font-medium transition-colors hover:bg-black/70"
                style={{ background: "rgba(0,0,0,0.5)", cursor: "ns-resize" }}
              >
                Reposition
              </button>
              <button
                onClick={() => setShowCoverPicker(true)}
                className="px-3 py-1.5 rounded-[6px] text-white text-xs font-medium transition-colors hover:bg-black/70"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                Change Cover
              </button>
              <button
                onClick={handleRemoveCover}
                className="px-3 py-1.5 rounded-[6px] text-white text-xs font-medium transition-colors hover:bg-black/70"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══ SUB-BAR — "Add icon/cover" + toolbar (below cover when present) ═══ */}
      <div className="flex items-center justify-between h-10 px-2.5 shrink-0">
        {/* Left: Add icon / Add cover actions */}
        <div className="flex items-center gap-0.5">
          {!doc.icon && (
            <div className="relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center gap-1.5 px-1 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                style={{ color: "var(--text-quaternary)", fontSize: "12px", fontWeight: 500 }}
              >
                <Smiley className="w-3.5 h-3.5" />
                Add icon
              </button>
              <AnimatePresence>
                {showIconPicker && (
                  <div className="absolute left-0 top-full mt-1 z-50">
                    <DocIconPickerPopover
                      currentIcon={doc.icon}
                      onSelect={(iconName) => { updateDoc(doc.id, { icon: iconName, updatedAt: new Date().toISOString() }); setShowIconPicker(false); }}
                      onRemove={() => { updateDoc(doc.id, { icon: undefined, updatedAt: new Date().toISOString() }); setShowIconPicker(false); }}
                      onClose={() => setShowIconPicker(false)}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
          {!doc.coverImage && (
            <button
              onClick={() => setShowCoverPicker(true)}
              className="flex items-center gap-1.5 px-1 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-quaternary)", fontSize: "12px", fontWeight: 500 }}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Add cover
            </button>
          )}
          {!doc.icon && !doc.coverImage && <span />}
        </div>

        {/* Right: toolbar buttons */}
        <div className="flex items-center gap-1.5">
          {/* Undo (D4) */}
          <button
            onClick={() => { const blocks = history.undo(); if (blocks) { prevBlocksRef.current = blocks; onBlocksChange(blocks); } }}
            disabled={!history.canUndo}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] disabled:opacity-30"
            style={{ color: "var(--text-quaternary)" }}
            title="Undo (Cmd+Z)"
          >
            <ArrowCounterClockwise className="w-4 h-4" />
          </button>
          {/* Redo (D4) */}
          <button
            onClick={() => { const blocks = history.redo(); if (blocks) { prevBlocksRef.current = blocks; onBlocksChange(blocks); } }}
            disabled={!history.canRedo}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] disabled:opacity-30"
            style={{ color: "var(--text-quaternary)" }}
            title="Redo (Cmd+Shift+Z)"
          >
            <ArrowClockwise className="w-4 h-4" />
          </button>

          {/* Find & Replace (D4) */}
          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: showFindReplace ? "var(--accent-primary)" : "var(--text-quaternary)" }}
            title="Find & Replace (Cmd+F)"
          >
            <MagnifyingGlass className="w-4 h-4" />
          </button>

          {/* Export Options (D4→D7) */}
          <div className="relative">
            <button
              onClick={() => setShowExportPanel(!showExportPanel)}
              className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: showExportPanel ? "var(--accent-primary)" : "var(--text-quaternary)" }}
              title="Export Options"
            >
              <Export className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showExportPanel && (
                <ExportPanel
                  docTitle={doc.title || "Untitled"}
                  blocks={doc.blocks || []}
                  onClose={() => setShowExportPanel(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Version History (D5) */}
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: showVersionHistory ? "var(--accent-primary)" : "var(--text-quaternary)" }}
            title="Version History"
          >
            <ClockCounterClockwise className="w-4 h-4" />
          </button>

          {/* Keyboard Shortcuts (D5) */}
          <button
            onClick={() => setShowKeyboardShortcuts(true)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Comments (D6) */}
          <button
            onClick={() => setShowCommentsPanel(!showCommentsPanel)}
            className="relative p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: showCommentsPanel ? "var(--accent-primary)" : "var(--text-quaternary)" }}
            title="Comments"
          >
            <ChatCircleDots className="w-4 h-4" />
            {blockComments.totalUnresolved > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[14px] h-[14px] rounded-full"
                style={{ background: "var(--accent-primary)", color: "white", fontSize: "9px", fontWeight: 700 }}
              >
                {blockComments.totalUnresolved}
              </span>
            )}
          </button>

          {/* Lock (D6) */}
          <button
            onClick={docLock.toggle}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: docLock.locked ? "oklch(0.65 0.14 55)" : "var(--text-quaternary)" }}
            title={docLock.locked ? "Unlock Document" : "Lock Document"}
          >
            {docLock.locked ? <Lock className="w-4 h-4" weight="fill" /> : <LockOpen className="w-4 h-4" />}
          </button>

          {/* Focus Mode (D6) */}
          <button
            onClick={() => setFocusMode(true)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
            title="Focus Mode"
          >
            <ArrowsOut className="w-4 h-4" />
          </button>

          {/* Word Goal (D6) */}
          <div className="relative">
            <button
              onClick={() => setShowWordGoalPopover(!showWordGoalPopover)}
              className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: wordGoal.goal ? "var(--accent-primary)" : "var(--text-quaternary)" }}
              title="Word Goal"
            >
              <Target className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showWordGoalPopover && (
                <WordGoalPopover
                  docId={doc.id}
                  wordCount={wordCount}
                  onClose={() => setShowWordGoalPopover(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Backlinks (D7) */}
          <button
            onClick={() => setShowBacklinks(!showBacklinks)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: showBacklinks ? "var(--accent-primary)" : "var(--text-quaternary)" }}
            title="Backlinks"
          >
            <LinkPhIcon className="w-4 h-4" />
          </button>

          {/* Stats (D7) */}
          <button
            onClick={() => setShowDocStats(!showDocStats)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: showDocStats ? "var(--accent-primary)" : "var(--text-quaternary)" }}
            title="Document Stats"
          >
            <ChartBar className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-4" style={{ background: "var(--border-default)" }} />

          {/* Blocks panel toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowBlocksPanel(!showBlocksPanel); setShowFormatPanel(false); }}
              className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: showBlocksPanel ? "var(--accent-primary)" : "var(--text-quaternary)" }}
              title="Blocks"
            >
              <Plus className="w-4 h-4" weight="bold" />
            </button>
            {/* Desktop: floating panel */}
            <AnimatePresence>
              {showBlocksPanel && (
                <div className="hidden md:block absolute right-0 top-full mt-1 z-50">
                  <BlocksPanel
                    onClose={() => setShowBlocksPanel(false)}
                    scriptMode={doc.type === "script"}
                    onInsertBlock={(type: DocBlockType, level?: number) => {
                      const blocks = doc.blocks || [];
                      const newBlock: DocBlock = {
                        id: generateBlockId(),
                        type,
                        content: "",
                        level,
                        checked: type === "checklist" ? false : undefined,
                        calloutColor: type === "callout" ? "#3B82F6" : undefined,
                        calloutIcon: type === "callout" ? "info" : undefined,
                        collapsed: type === "toggle" ? false : undefined,
                        tableData: type === "table" ? { headers: ["Column 1", "Column 2", "Column 3"], rows: [["", "", ""], ["", "", ""]] } : undefined,
                        galleryImages: type === "gallery" ? [] : undefined,
                      };
                      handleBlocksChangeWithBroadcast([...blocks, newBlock]);
                    }}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Format panel toggle */}
          <div className="relative">
            <button
              onClick={() => { setShowFormatPanel(!showFormatPanel); setShowBlocksPanel(false); }}
              className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: showFormatPanel ? "var(--accent-primary)" : "var(--text-quaternary)" }}
              title="Format"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {/* Desktop: floating panel */}
            <AnimatePresence>
              {showFormatPanel && (
                <div className="hidden md:block absolute right-0 top-full mt-1 z-50">
                  <FormatPanel
                    onClose={() => setShowFormatPanel(false)}
                    onChangeBlockType={handleFormatChangeBlockType}
                    onApplyDecoration={handleFormatApplyDecoration}
                    onApplyColor={handleFormatApplyColor}
                    onApplyFont={handleFormatApplyFont}
                    currentType={focusedBlock?.type}
                    currentLevel={focusedBlock?.level}
                    currentDecoration={focusedBlock?.decoration}
                    currentColor={focusedBlock?.color}
                    currentFont={focusedBlock?.fontStyle}
                    onInlineFormat={(format) => {
                      if (format === "bold") document.execCommand("bold");
                      else if (format === "italic") document.execCommand("italic");
                      else if (format === "strikethrough") document.execCommand("strikeThrough");
                      else if (format === "code") {
                        const sel = window.getSelection();
                        if (sel && !sel.isCollapsed) {
                          const range = sel.getRangeAt(0);
                          const code = document.createElement("code");
                          code.style.cssText = "background:var(--neutral-100);padding:1px 4px;border-radius:3px;font-family:'Courier Prime',monospace;font-size:0.9em";
                          range.surroundContents(code);
                        }
                      }
                    }}
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Outline toggle */}
          <button
            onClick={() => setShowOutline(!showOutline)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: showOutline ? "var(--accent-primary)" : "var(--text-quaternary)" }}
            title="Outline"
          >
            <ListDashes className="w-4 h-4" />
          </button>

          {/* Script panels toggle (script docs only) */}
          {doc.type === "script" && (
            <button
              onClick={() => setShowScriptPanels(!showScriptPanels)}
              className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: showScriptPanels ? "#8B5CF6" : "var(--text-quaternary)" }}
              title="Characters & Locations"
            >
              <FilmScript className="w-4 h-4" />
            </button>
          )}

          {/* AI sidebar toggle */}
          <button
            onClick={() => setShowAiSidebar(!showAiSidebar)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: showAiSidebar ? "#8B5CF6" : "var(--text-quaternary)" }}
            title="Doc AI"
          >
            <Sparkle className="w-4 h-4" weight={showAiSidebar ? "fill" : "regular"} />
          </button>

          {/* Present — AI slide deck */}
          <button
            onClick={() => setShowPresentation(true)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
            title="Generate AI Presentation"
          >
            <ProjectorScreen className="w-4 h-4" />
          </button>

          {/* Full width toggle */}
          <button
            onClick={() => setFullWidth(!fullWidth)}
            className="p-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
            title={fullWidth ? "Narrow width" : "Full width"}
          >
            {fullWidth ? <ArrowsInSimple className="w-4 h-4" /> : <ArrowsOutSimple className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ═══ EDITOR BODY ═══ Full-width container so marquee selection works from page margins */}
      <div className={`flex-1 flex flex-col ${doc.coverImage ? "pt-0" : "pt-4"} pb-28 md:pb-10 relative`}>
        {/* Find & Replace Bar (D4) */}
        {showFindReplace && (
          <FindReplaceBar
            blocks={doc.blocks || []}
            onClose={() => setShowFindReplace(false)}
            onHighlightBlock={(blockId) => {
              const el = document.querySelector(`[data-block-id="${blockId}"]`);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.classList.add("ring-2", "ring-blue-400/50");
                setTimeout(() => el.classList.remove("ring-2", "ring-blue-400/50"), 1500);
              }
            }}
            onReplaceInBlock={(blockId, search, replacement) => {
              const blocks = doc.blocks || [];
              const updated = blocks.map((b) => {
                if (b.id !== blockId) return b;
                const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
                return { ...b, content: b.content.replace(regex, replacement) };
              });
              handleBlocksChangeWithBroadcast(updated);
            }}
            onReplaceAll={(search, replacement) => {
              const blocks = doc.blocks || [];
              const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
              const updated = blocks.map((b) => ({
                ...b,
                content: b.content ? b.content.replace(regex, replacement) : b.content,
              }));
              handleBlocksChangeWithBroadcast(updated);
              toast.success("Replaced all occurrences");
            }}
          />
        )}

        {/* Constrained content wrapper for title, icons, meeting bar */}
        <div className={fullWidth ? "px-6 md:px-12" : "px-6 md:px-[88px] max-w-3xl mx-auto w-full"}>

          {/* ═══ Notion-style large doc icon ═══ */}
          {doc.icon && DOC_ICON_MAP[doc.icon] ? (
            <div className={`relative ${doc.coverImage ? "-mt-8" : "mt-2"} mb-3`}>
              <button
                onClick={() => setShowIconPicker(true)}
                className="group/icon relative flex items-center justify-center rounded-[12px] transition-all hover:scale-105 active:scale-95"
                style={{
                  width: "72px",
                  height: "72px",
                  background: doc.coverImage ? "white" : `${meta.color}12`,
                  border: `1px solid ${doc.coverImage ? "var(--border-default)" : `${meta.color}20`}`,
                  boxShadow: doc.coverImage ? "0 2px 8px rgba(0,0,0,0.1)" : undefined,
                }}
                title="Change icon"
              >
                {(() => { const CustomIcon = DOC_ICON_MAP[doc.icon!]; return <CustomIcon className="w-9 h-9" style={{ color: meta.color }} weight="duotone" />; })()}
                <div className="absolute inset-0 rounded-[12px] bg-black/0 group-hover/icon:bg-black/5 transition-colors" />
              </button>
              <AnimatePresence>
                {showIconPicker && (
                  <div className="absolute left-0 top-full mt-1 z-50">
                    <DocIconPickerPopover
                      currentIcon={doc.icon}
                      onSelect={(iconName) => { updateDoc(doc.id, { icon: iconName, updatedAt: new Date().toISOString() }); setShowIconPicker(false); }}
                      onRemove={() => { updateDoc(doc.id, { icon: undefined, updatedAt: new Date().toISOString() }); setShowIconPicker(false); }}
                      onClose={() => setShowIconPicker(false)}
                    />
                  </div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className={doc.coverImage ? "" : "mt-4"} />
          )}

          {/* Meeting bar */}
          {doc.type === "meeting" && (
            <div className="mb-6 px-4 py-3 rounded-[8px]" style={{ background: meta.bgColor }}>
              <MeetingBar
                doc={doc}
                onUpdate={(updates) => updateDoc(doc.id, { ...updates, updatedAt: new Date().toISOString() })}
              />
            </div>
          )}

          {/* Lock badge (D6) */}
          {docLock.locked && (
            <div className="mb-3">
              <LockBadge locked />
            </div>
          )}

          {/* Title */}
          <input
            ref={titleRef}
            value={doc.title}
            onChange={(e) => { if (!docLock.locked) { onTitleChange(e.target.value); collab.broadcastTitleChange(e.target.value); } }}
            placeholder="Untitled Document"
            className="w-full bg-transparent outline-none mb-8"
            readOnly={docLock.locked}
            style={{
              color: doc.title ? "var(--text-primary)" : "oklch(0.45 0.03 260 / 0.5)",
              fontSize: doc.type === "script" ? "24px" : "28px",
              fontWeight: 700,
              lineHeight: 1.2,
              fontFamily: doc.type === "script" ? "'Courier Prime', monospace" : undefined,
              textAlign: doc.type === "script" ? "center" : undefined,
              cursor: docLock.locked ? "default" : undefined,
            }}
          />

          {/* Script byline (editable) */}
          {doc.type === "script" && (
            <div className="text-center mb-6">
              <span style={{ color: "var(--text-quaternary)", fontSize: "13px", fontFamily: "'Courier Prime', monospace" }}>
                Written by
              </span>
              <br />
              <input
                value={doc.scriptByline || ""}
                onChange={(e) => updateDoc(doc.id, { scriptByline: e.target.value, updatedAt: new Date().toISOString() })}
                placeholder="Author Name"
                className="bg-transparent outline-none text-center w-full max-w-xs mx-auto mt-0.5"
                style={{
                  color: "var(--text-tertiary)",
                  fontSize: "14px",
                  fontFamily: "'Courier Prime', monospace",
                }}
              />
            </div>
          )}

          {/* Script quick-insert toolbar */}
          {doc.type === "script" && (
            <div className="mb-4">
              <ScriptToolbar
                currentBlockType={undefined}
                onInsertElement={(type) => {
                  const blocks = doc.blocks || [];
                  const newBlock: DocBlock = {
                    id: generateBlockId(),
                    type,
                    content: "",
                  };
                  onBlocksChange([...blocks, newBlock]);
                }}
              />
            </div>
          )}
        </div>

        {/* Block Editor — full width, flex-1 so marquee can start from page margins & below blocks */}
        <DescriptionBlockEditor
          className="flex-1"
          contentClassName={fullWidth ? "px-6 md:px-12" : "px-6 md:px-[88px] max-w-3xl mx-auto w-full"}
          blocks={doc.blocks || []}
          onChange={(blocks) => { handleBlocksChangeWithBroadcast(blocks); }}
          placeholder="Start typing or press '/' for commands..."
          autoFocus
          readOnly={docLock.locked}
          scriptMode={doc.type === "script"}
          knownCharacters={doc.type === "script" ? scriptKnownCharacters : undefined}
          knownLocations={doc.type === "script" ? scriptKnownLocations : undefined}
          onAiAction={handleAiAction}
          resolveDoc={resolveDoc}
          onNavigateDoc={onNavigateDoc}
          onCreateNestedDoc={onCreateNestedDoc}
          collaborators={collab.collaborators}
          onBlockFocus={handleEditorBlockFocus}
          onBlockUpdate={(blockId, updates) => collab.broadcastBlockUpdate(blockId, updates)}
          mentionItems={mentionItems}
          allDocs={allDocs}
        />

        {/* AI Prompt Inline */}
        <div className={fullWidth ? "px-6 md:px-12" : "px-6 md:px-[88px] max-w-3xl mx-auto w-full"}>
          <AnimatePresence>
            {aiPromptAction && (
              <AiPromptInline
                key="ai-prompt-inline"
                action={aiPromptAction}
                docTitle={doc.title}
                docContent={serializedDocContent}
                onInsertBlocks={handleInsertAiBlocks}
                onClose={() => { setAiPromptAction(null); setAiPromptBlockId(null); }}
                generateBlockId={generateBlockId}
              />
            )}
          </AnimatePresence>

          {/* Bottom Status Bar */}
          <DocStatusBar
            doc={doc}
            isStarred={isStarred(doc.id)}
            onToggleStarred={() => toggleStarred(doc.id)}
            onUpdate={(updates) => updateDoc(doc.id, { ...updates, updatedAt: new Date().toISOString() })}
            onDelete={onDelete}
          />
          {/* Word Goal Bar (D6) */}
          {wordGoal.goal && wordGoal.goal > 0 && (
            <div className="mt-2">
              <WordGoalBar wordCount={wordCount} goal={wordGoal.goal} />
            </div>
          )}
        </div>

      {/* ─── Mobile bottom sheet: Blocks panel ─── */}
      <AnimatePresence>
        {showBlocksPanel && (
          <motion.div
            className="md:hidden fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowBlocksPanel(false)} />
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-[16px] overflow-y-auto"
              style={{ background: "var(--surface-bg)", maxHeight: "70vh", boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mt-2.5 mb-1" style={{ background: "var(--neutral-300)" }} />
              <div className="p-4">
                <BlocksPanel
                  onClose={() => setShowBlocksPanel(false)}
                  scriptMode={doc.type === "script"}
                  onInsertBlock={(type: DocBlockType, level?: number) => {
                    const blocks = doc.blocks || [];
                    const newBlock: DocBlock = {
                      id: generateBlockId(),
                      type,
                      content: "",
                      level,
                      checked: type === "checklist" ? false : undefined,
                      calloutColor: type === "callout" ? "#3B82F6" : undefined,
                      calloutIcon: type === "callout" ? "info" : undefined,
                      collapsed: type === "toggle" ? false : undefined,
                      tableData: type === "table" ? { headers: ["Column 1", "Column 2", "Column 3"], rows: [["", "", ""], ["", "", ""]] } : undefined,
                      galleryImages: type === "gallery" ? [] : undefined,
                    };
                    handleBlocksChangeWithBroadcast([...blocks, newBlock]);
                    setShowBlocksPanel(false);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Mobile bottom sheet: Format panel ─── */}
      <AnimatePresence>
        {showFormatPanel && (
          <motion.div
            className="md:hidden fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowFormatPanel(false)} />
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-[16px] overflow-y-auto"
              style={{ background: "var(--surface-bg)", maxHeight: "70vh", boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="w-10 h-1 rounded-full mx-auto mt-2.5 mb-1" style={{ background: "var(--neutral-300)" }} />
              <div className="p-4">
                <FormatPanel
                  onClose={() => setShowFormatPanel(false)}
                  onChangeBlockType={handleFormatChangeBlockType}
                  onApplyDecoration={handleFormatApplyDecoration}
                  onApplyColor={handleFormatApplyColor}
                  onApplyFont={handleFormatApplyFont}
                  currentType={focusedBlock?.type}
                  currentLevel={focusedBlock?.level}
                  currentDecoration={focusedBlock?.decoration}
                  currentColor={focusedBlock?.color}
                  currentFont={focusedBlock?.fontStyle}
                  onInlineFormat={(format) => {
                    if (format === "bold") document.execCommand("bold");
                    else if (format === "italic") document.execCommand("italic");
                    else if (format === "strikethrough") document.execCommand("strikeThrough");
                    else if (format === "code") {
                      const sel = window.getSelection();
                      if (sel && !sel.isCollapsed) {
                        const range = sel.getRangeAt(0);
                        const code = document.createElement("code");
                        code.style.cssText = "background:var(--neutral-100);padding:1px 4px;border-radius:3px;font-family:'Courier Prime',monospace;font-size:0.9em";
                        range.surroundContents(code);
                      }
                    }
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cover Image Picker Modal */}
      <AnimatePresence>
        {showCoverPicker && (
          <CoverImagePicker
            onSelect={handleCoverChange}
            onClose={() => setShowCoverPicker(false)}
          />
        )}
      </AnimatePresence>
      </div>{/* end editor body */}
    </div>{/* end main content column */}

    {/* Document Outline Sidebar */}
    <AnimatePresence>
      {showOutline && (doc.blocks || []).some((b) => b.type === "heading") && (
        <motion.div
          className="w-56 shrink-0 hidden lg:block pt-20 pr-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="sticky top-20 p-3 rounded-[8px]"
            style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
          >
            <DocOutline
              blocks={doc.blocks || []}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Script Panels Sidebar (Characters & Locations) */}
    <AnimatePresence>
      {showScriptPanels && doc.type === "script" && (
        <motion.div
          className="w-56 shrink-0 hidden lg:block pt-20 pr-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.15 }}
        >
          <div className="sticky top-20">
            <ScriptPanels
              doc={doc}
              blocks={doc.blocks || []}
              onUpdate={(updates) => updateDoc(doc.id, { ...updates, updatedAt: new Date().toISOString() })}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Doc AI Sidebar */}
    <AnimatePresence>
      {showAiSidebar && (
        <motion.div
          className="w-72 shrink-0 hidden lg:flex flex-col border-l"
          style={{ borderColor: "#e1e5eb", background: "white", height: "calc(100vh - 40px)", position: "sticky", top: "40px" }}
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 288 }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.15 }}
        >
          <DocAiSidebar
            docTitle={doc.title}
            docContent={serializedDocContent}
            onClose={() => setShowAiSidebar(false)}
            onInsertText={handleInsertAiText}
          />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Publish Dialog */}
    <AnimatePresence>
      {showPublishDialog && (
        <PublishDialog
          docTitle={doc.title}
          publishSlug={publishSlug}
          isPublishing={isPublishing}
          onPublish={async () => { await handlePublish(); }}
          onUnpublish={async () => { await handleUnpublish(); setShowPublishDialog(false); }}
          onClose={() => setShowPublishDialog(false)}
        />
      )}
    </AnimatePresence>

    {/* AI Presentation View (fullscreen overlay) */}
    <AnimatePresence>
      {showPresentation && (
        <PresentationView
          docTitle={doc.title}
          docContent={serializedDocContent}
          onClose={() => setShowPresentation(false)}
        />
      )}
    </AnimatePresence>

    {/* Version History Panel (D5) — slides in from right */}
    <AnimatePresence>
      {showVersionHistory && (
        <VersionHistoryPanel
          docId={doc.id}
          currentBlocks={doc.blocks || []}
          onRestore={(blocks) => {
            handleBlocksChangeWithBroadcast(blocks);
            toast.success("Restored to previous version");
            setShowVersionHistory(false);
          }}
          onClose={() => setShowVersionHistory(false)}
          onSaveNow={(label) => {
            versioning.saveNow(label);
            toast.success("Version saved");
          }}
        />
      )}
    </AnimatePresence>

    {/* Keyboard Shortcuts Panel (D5) */}
    <KeyboardShortcutsPanel
      open={showKeyboardShortcuts}
      onClose={() => setShowKeyboardShortcuts(false)}
    />

    {/* Comments Panel (D6) */}
    <AnimatePresence>
      {showCommentsPanel && (
        <CommentsPanel
          docId={doc.id}
          onClose={() => setShowCommentsPanel(false)}
          onScrollToBlock={(blockId) => {
            const el = document.querySelector(`[data-block-id="${blockId}"]`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
        />
      )}
    </AnimatePresence>

    {/* Comment Thread Popover (D6) */}
    <AnimatePresence>
      {commentPopover && (
        <CommentThread
          docId={doc.id}
          blockId={commentPopover.blockId}
          position={{ top: commentPopover.top, left: commentPopover.left }}
          onClose={() => setCommentPopover(null)}
        />
      )}
    </AnimatePresence>

    {/* Focus Mode Overlay (D6) */}
    <AnimatePresence>
      {focusMode && (
        <FocusModeOverlay
          active={focusMode}
          onExit={() => setFocusMode(false)}
          wordCount={wordCount}
          wordGoal={wordGoal.goal}
        >
          <input
            value={doc.title}
            onChange={(e) => { if (!docLock.locked) onTitleChange(e.target.value); }}
            placeholder="Untitled Document"
            className="w-full bg-transparent outline-none mb-8"
            readOnly={docLock.locked}
            style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}
          />
          <DescriptionBlockEditor
            blocks={doc.blocks || []}
            onChange={(newBlocks) => { if (!docLock.locked) handleBlocksChangeWithBroadcast(newBlocks); }}
            readOnly={docLock.locked}
          />
        </FocusModeOverlay>
      )}
    </AnimatePresence>

    {/* Backlinks Panel (D7) */}
    <AnimatePresence>
      {showBacklinks && (
        <BacklinksPanel
          docId={doc.id}
          allDocs={allDocs || []}
          onNavigateDoc={onNavigateDoc}
          onClose={() => setShowBacklinks(false)}
        />
      )}
    </AnimatePresence>

    {/* Document Stats Panel (D7) */}
    <AnimatePresence>
      {showDocStats && (
        <DocStatsPanel
          blocks={doc.blocks || []}
          onClose={() => setShowDocStats(false)}
        />
      )}
    </AnimatePresence>

    {/* Command Palette (D7) */}
    <AnimatePresence>
      {showCommandPalette && (
        <CommandPalette
          open={showCommandPalette}
          commands={commandItems}
          onClose={() => setShowCommandPalette(false)}
        />
      )}
    </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   COVER IMAGE PICKER
   ═══════════════════════════════════════════════════════════ */

const BUILT_IN_COVERS = [
  { label: "Gradient", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80" },
  { label: "Sunset", url: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1200&q=80" },
  { label: "Workspace", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80" },
  { label: "Ocean", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80" },
  { label: "Forest", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80" },
  { label: "Studio", url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80" },
];

function CoverImagePicker({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"gallery" | "unsplash" | "url">("gallery");
  const [urlInput, setUrlInput] = useState("");
  const [unsplashQuery, setUnsplashQuery] = useState("");
  const [unsplashResults, setUnsplashResults] = useState<{ url: string; thumb: string; photographer: string }[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchUnsplash = async (query: string) => {
    if (!query.trim()) { setUnsplashResults([]); return; }
    setUnsplashLoading(true);
    try {
      const { data, error } = await api.get<{ results: { id: string; url: string; thumb: string; photographer: string; profileUrl: string }[] }>(
        `/unsplash/search?query=${encodeURIComponent(query)}&per_page=12`,
        { skipAuth: true }
      );
      if (error || !data?.results) {
        console.error("[CoverPicker] Unsplash search error:", error);
        setUnsplashResults([]);
      } else {
        setUnsplashResults(data.results.map((r) => ({ url: r.url, thumb: r.thumb, photographer: r.photographer })));
      }
    } catch (err) {
      console.error("[CoverPicker] Unsplash search failed:", err);
      setUnsplashResults([]);
    } finally {
      setUnsplashLoading(false);
    }
  };

  const handleUnsplashSearch = (query: string) => {
    setUnsplashQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchUnsplash(query), 400);
  };

  const tabStyle = (active: boolean) => ({
    background: active ? "var(--neutral-200)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-tertiary)",
    fontSize: "13px" as const, fontWeight: 500 as const,
  });

  return (
    <ResponsiveModal open={true} onClose={onClose} title="Cover Image">
      <div className="space-y-4">
        <div className="flex gap-2">
          {(["gallery", "unsplash", "url"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3 py-1.5 rounded-[6px] transition-colors"
              style={tabStyle(tab === t)}
            >
              {t === "gallery" ? "Gallery" : t === "unsplash" ? "Unsplash" : "Paste URL"}
            </button>
          ))}
        </div>

        {tab === "gallery" && (
          <div className="grid grid-cols-3 gap-2">
            {BUILT_IN_COVERS.map((cover) => (
              <button
                key={cover.label}
                onClick={() => onSelect(cover.url)}
                className="rounded-[6px] overflow-hidden border-2 border-transparent hover:border-[var(--accent-primary)] transition-colors"
              >
                <img src={cover.url} alt={cover.label} className="w-full h-20 object-cover" />
                <p className="py-1" style={{ fontSize: "11px", color: "var(--text-tertiary)", textAlign: "center" }}>
                  {cover.label}
                </p>
              </button>
            ))}
          </div>
        )}

        {tab === "unsplash" && (
          <div className="space-y-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
              style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
            >
              <MagnifyingGlass className="w-4 h-4 shrink-0" style={{ color: "var(--text-quaternary)" }} />
              <input
                value={unsplashQuery}
                onChange={(e) => handleUnsplashSearch(e.target.value)}
                placeholder="Search photos..."
                className="flex-1 bg-transparent outline-none"
                style={{ color: "var(--text-primary)", fontSize: "13px" }}
                autoFocus
              />
            </div>

            {unsplashLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--text-quaternary)", borderTopColor: "transparent" }} />
              </div>
            )}

            {!unsplashLoading && unsplashResults.length > 0 && (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {unsplashResults.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(img.url)}
                    className="rounded-[6px] overflow-hidden border-2 border-transparent hover:border-[var(--accent-primary)] transition-colors group"
                  >
                    <img src={img.thumb} alt="" className="w-full h-20 object-cover" loading="lazy" />
                    <p className="py-0.5 truncate px-1" style={{ fontSize: "9px", color: "var(--text-quaternary)", textAlign: "center" }}>
                      {img.photographer}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {!unsplashLoading && unsplashQuery && unsplashResults.length === 0 && (
              <div className="text-center py-6" style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>
                No results found
              </div>
            )}

            {!unsplashQuery && (
              <div className="text-center py-6" style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>
                Search for free photos from Unsplash
              </div>
            )}
          </div>
        )}

        {tab === "url" && (
          <div className="flex items-center gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 rounded-[6px] outline-none"
              style={{
                background: "var(--neutral-50)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && urlInput) onSelect(urlInput); }}
            />
            <button
              onClick={() => { if (urlInput) onSelect(urlInput); }}
              className="px-4 py-2 rounded-[6px] text-white"
              style={{ background: "var(--accent-primary)", fontSize: "13px", fontWeight: 500 }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE DOC MODAL
   ═══════════════════════════════════════════════════════════ */

function CreateDocModal({
  onClose,
  onCreate,
  folders,
  activeFolderId,
}: {
  onClose: () => void;
  onCreate: (type: DocType, title: string, folderId?: string, spaceId?: string, templateBlocks?: DocBlock[]) => void;
  folders: DocFolder[];
  activeFolderId: string | null;
}) {
  const [selectedType, setSelectedType] = useState<DocType>("doc");
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState<string | undefined>(activeFolderId || undefined);
  const [spaceId, setSpaceId] = useState<string | undefined>(undefined);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");
  const titleRef = useRef<HTMLInputElement>(null);

  // Filter templates by selected type (+ blank is always shown)
  const filteredTemplates = DOC_TEMPLATES.filter(
    (t) => t.id === "blank" || t.type === selectedType
  );

  useEffect(() => {
    requestAnimationFrame(() => titleRef.current?.focus());
  }, []);

  const handleCreate = () => {
    const tmpl = DOC_TEMPLATES.find((t) => t.id === selectedTemplate);
    const blocks = tmpl && tmpl.id !== "blank" ? tmpl.blocks : undefined;
    onCreate(selectedType, title, folderId, spaceId, blocks);
  };

  return (
    <ResponsiveModal open={true} onClose={onClose} title="New Document">
      <div className="space-y-4">
        <div>
          <label className="block mb-2" style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.type}
                onClick={() => { setSelectedType(dt.type); setSelectedTemplate("blank"); }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-[6px] text-left transition-colors"
                style={{
                  border: `1.5px solid ${selectedType === dt.type ? dt.color : "var(--border-default)"}`,
                  background: selectedType === dt.type ? dt.bgColor : "var(--neutral-50)",
                  color: selectedType === dt.type ? dt.color : "var(--text-secondary)",
                  fontSize: "13px",
                  fontWeight: selectedType === dt.type ? 500 : 400,
                }}
              >
                <dt.icon className="w-4 h-4" />
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block mb-1.5" style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
            Title
          </label>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Untitled ${DOC_TYPE_META[selectedType].label}`}
            className="w-full px-3 py-2 rounded-[6px] outline-none transition-shadow"
            style={{
              background: "var(--neutral-50)",
              border: "1px solid var(--border-default)",
              color: "var(--text-primary)",
              fontSize: "14px",
            }}
            onFocus={(e) => (e.target.style.boxShadow = "0 0 0 2px var(--accent-primary-subtle)")}
            onBlur={(e) => (e.target.style.boxShadow = "none")}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
          />
        </div>

        {folders.length > 0 && (
          <div>
            <label className="block mb-1.5" style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
              Folder
            </label>
            <select
              value={folderId || ""}
              onChange={(e) => setFolderId(e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-[6px] outline-none cursor-pointer"
              style={{
                background: "var(--neutral-50)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                fontSize: "14px",
              }}
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Template picker (D4) */}
        {filteredTemplates.length > 1 && (
          <div>
            <label className="block mb-1.5" style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
              Template
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {filteredTemplates.map((tmpl) => {
                const sel = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className="flex items-start gap-2 px-2.5 py-2 rounded-[6px] text-left transition-colors"
                    style={{
                      border: `1.5px solid ${sel ? tmpl.color : "var(--border-default)"}`,
                      background: sel ? `${tmpl.color}0a` : "var(--neutral-50)",
                      fontSize: "12px",
                    }}
                  >
                    <tmpl.icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: tmpl.color }} />
                    <div className="min-w-0">
                      <div className="truncate" style={{ color: sel ? tmpl.color : "var(--text-primary)", fontWeight: sel ? 600 : 500 }}>
                        {tmpl.label}
                      </div>
                      <div className="truncate" style={{ color: "var(--text-quaternary)", fontSize: "10px" }}>
                        {tmpl.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Space assignment */}
        <div>
          <label className="block mb-1.5" style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
            Space
          </label>
          <SpacePicker
            value={spaceId}
            onChange={setSpaceId}
            label="Choose a space (optional)"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-[6px] transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent-primary)", fontSize: "13px", fontWeight: 500 }}
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>
    </ResponsiveModal>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONTEXT MENU POPUP
   ════════════════════════��══════════════════════════════════ */

interface CtxMenuItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  danger?: boolean;
}

function ContextMenuPopup({
  x,
  y,
  onClose,
  items,
}: {
  x: number;
  y: number;
  onClose: () => void;
  items: (CtxMenuItem | null)[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({ top: y, left: x });
  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      let newTop = y;
      let newLeft = x;
      if (rect.right > window.innerWidth - 8) newLeft = window.innerWidth - rect.width - 8;
      if (rect.bottom > window.innerHeight - 8) newTop = window.innerHeight - rect.height - 8;
      setPos({ top: newTop, left: newLeft });
    }
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className="fixed z-[60] w-52 rounded-[8px] shadow-lg border py-1"
      style={{ top: pos.top, left: pos.left, background: "var(--surface-bg)", borderColor: "#e1e5eb" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
    >
      {items.map((item, i) => {
        if (!item) {
          return <div key={`sep-${i}`} className="mx-2 my-1 h-px" style={{ background: "var(--border-default)" }} />;
        }
        // Color swatch items (label is empty)
        if (!item.label) {
          return (
            <button
              key={`color-${i}`}
              onClick={(e) => { e.stopPropagation(); item.action(); }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] mx-0.5"
            >
              <item.icon />
            </button>
          );
        }
        return (
          <button
            key={`${item.label}-${i}`}
            onClick={(e) => { e.stopPropagation(); item.action(); }}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: item.danger ? "oklch(0.62 0.18 25)" : "var(--text-secondary)", fontSize: "13px" }}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </motion.div>
  );
}

export default DocsPage;
