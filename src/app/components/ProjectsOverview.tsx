/* ===================================================================
   PROJECTS OVERVIEW — Card Grid View (Figma-inspired layout)

   Features:
   - Card grid grouped by production phase
   - Collapsible phase groups with colored headers
   - Top header: Page icon + title + ListToolbar + "+ New Project" CTA
   - Starred/favorites section
   - Context menu (rename, duplicate, archive, delete, export)
   - Import project from JSON
   - Archived projects section (collapsed by default)

   Phase 6 of Canto build plan (P6-1, P6-2).
   =================================================================== */

import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from "react";
import {
  SquareHalf,
  Star,
  Plus,
  DotsThree,
  CaretDown,
  CaretRight,
  PencilSimple,
  Copy,
  Archive,
  Trash,
  Export,
  UploadSimple,
  X,
  ArrowCounterClockwise,
  Check,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData, useVisibleProjects } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import {
  PHASE_META,
  PROJECT_STATUS_OPTIONS,
  TASK_PHASE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type ProjectData,
  type ProjectStatus,
  type ProductionPhase,
  type ProjectType,
} from "../lib/types";
import { ProjectCreationWizard } from "./ProjectCreationWizard";
import { ResponsiveModal, FilterDrawer } from "./ResponsiveModal";
import { ProjectIcon } from "./ProjectIcon";
import { toast } from "sonner";
import { ListToolbar } from "./ListToolbar";
import type { SortOption } from "./ListToolbar";

/* ─── Work-type color mapping ─── */
const WORK_TYPE_COLORS: Record<ProjectType, { color: string; bg: string }> = {
  "video-production": { color: "oklch(0.45 0.15 250)", bg: "oklch(0.92 0.04 250)" },
  "video-edit": { color: "oklch(0.45 0.15 290)", bg: "oklch(0.92 0.04 290)" },
  photography: { color: "oklch(0.5 0.15 340)", bg: "oklch(0.93 0.04 340)" },
  design: { color: "oklch(0.48 0.15 310)", bg: "oklch(0.93 0.04 310)" },
  web: { color: "oklch(0.45 0.12 200)", bg: "oklch(0.92 0.04 200)" },
  branding: { color: "oklch(0.5 0.15 60)", bg: "oklch(0.94 0.04 60)" },
  "motion-graphics": { color: "oklch(0.45 0.15 170)", bg: "oklch(0.92 0.04 170)" },
  consulting: { color: "oklch(0.5 0.08 260)", bg: "oklch(0.93 0.03 260)" },
};

/* ─── Client badge colors (deterministic) ─── */
const CLIENT_COLORS = [
  { color: "oklch(0.45 0.15 250)", bg: "oklch(0.92 0.04 250)" },
  { color: "oklch(0.5 0.15 340)", bg: "oklch(0.93 0.04 340)" },
  { color: "oklch(0.48 0.12 170)", bg: "oklch(0.92 0.04 170)" },
  { color: "oklch(0.5 0.15 60)", bg: "oklch(0.94 0.05 60)" },
  { color: "oklch(0.45 0.15 290)", bg: "oklch(0.92 0.04 290)" },
  { color: "oklch(0.5 0.12 25)", bg: "oklch(0.94 0.03 25)" },
  { color: "oklch(0.48 0.15 130)", bg: "oklch(0.93 0.04 130)" },
  { color: "oklch(0.45 0.12 220)", bg: "oklch(0.92 0.04 220)" },
];

function getClientColor(client: string) {
  let hash = 0;
  for (let i = 0; i < client.length; i++) hash = ((hash << 5) - hash + client.charCodeAt(i)) | 0;
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}

/* ─── Relative date helper ─── */
function relativeDate(dateStr?: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 0) {
    // Future date
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }
  return `${Math.floor(diffDays / 365)}y ago`;
}

/* ─── Sort Options ─── */
type SortBy = "starred" | "name" | "status" | "phase" | "progress" | "recent";

const PROJECT_SORT_OPTIONS: SortOption[] = [
  { value: "starred", label: "Starred first" },
  { value: "name", label: "Name" },
  { value: "progress", label: "Progress" },
];

/* ─── Group By ─── */
type GroupBy = "phase" | "status" | "type" | "client" | "none";

/* ═══════════════════════════════════════════════════════════
   CONTEXT MENU
   ═══════════════════════════════════════════════════════════ */

interface ContextMenuProps {
  x: number;
  y: number;
  projectName: string;
  project: ProjectData;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onExport: () => void;
}

function ContextMenu({ x, y, project, onClose, onRename, onDuplicate, onArchive, onDelete, onExport }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let nx = x, ny = y;
      if (rect.right > window.innerWidth - 8) nx = window.innerWidth - rect.width - 8;
      if (rect.bottom > window.innerHeight - 8) ny = window.innerHeight - rect.height - 8;
      if (nx !== x || ny !== y) setPos({ x: nx, y: ny });
    }
  }, [x, y]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [onClose]);

  const items = [
    { label: "Rename", icon: PencilSimple, action: onRename },
    { label: "Duplicate", icon: Copy, action: onDuplicate },
    { label: "Export JSON", icon: Export, action: onExport },
    null,
    { label: project.archived ? "Unarchive" : "Archive", icon: project.archived ? ArrowCounterClockwise : Archive, action: onArchive },
    { label: "Delete", icon: Trash, action: onDelete, danger: true },
  ];

  return (
    <motion.div
      ref={menuRef}
      className="fixed z-50 py-1.5 rounded-[8px] shadow-xl min-w-[180px]"
      style={{ left: pos.x, top: pos.y, background: "var(--surface-bg)", border: "1px solid var(--border-default)", boxShadow: "0 8px 32px oklch(0 0 0 / 0.12)" }}
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.1 }}
    >
      {items.map((item, i) => {
        if (!item) return <div key={`sep-${i}`} className="mx-2 my-1 h-px" style={{ background: "var(--border-default)" }} />;
        return (
          <button
            key={item.label}
            onClick={() => { item.action(); onClose(); }}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: (item as any).danger ? "oklch(0.62 0.18 25)" : "var(--text-secondary)", fontSize: "13px" }}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RENAME DIALOG
   ═══════════════════════════════════════════════════════════ */

function RenameDialog({ open, projectName, onClose, onConfirm }: { open: boolean; projectName: string; onClose: () => void; onConfirm: (n: string) => void }) {
  const [newName, setNewName] = useState(projectName);
  const { projects } = useData();
  const exists = newName.trim() !== projectName && projects[newName.trim()];
  const valid = newName.trim().length > 0 && !exists;
  if (!open) return null;
  return (
    <ResponsiveModal open={open} onClose={onClose} title="Rename Project" desktopMaxWidth="400px">
      <div className="space-y-3">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
          className="w-full px-3 py-2 rounded-[6px] outline-none"
          style={{ background: "var(--neutral-50)", border: `1px solid ${exists ? "oklch(0.7 0.18 25)" : "var(--border-default)"}`, color: "var(--text-primary)", fontSize: "14px" }}
          onKeyDown={(e) => { if (e.key === "Enter" && valid) onConfirm(newName.trim()); if (e.key === "Escape") onClose(); }}
        />
        {exists && <p style={{ color: "oklch(0.7 0.18 25)", fontSize: "12px" }}>A project with this name already exists</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-[6px] transition-colors hover:bg-black/5" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Cancel</button>
          <button onClick={() => valid && onConfirm(newName.trim())} disabled={!valid} className="px-3 py-1.5 rounded-[6px] text-white"
            style={{ background: "var(--accent-primary)", fontSize: "13px", fontWeight: 500, opacity: valid ? 1 : 0.5 }}>Rename</button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

/* ═══════════════════════════════════════════════════════════
   DELETE CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════ */

function DeleteConfirm({ open, projectName, onClose, onConfirm }: { open: boolean; projectName: string; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <ResponsiveModal open={open} onClose={onClose} title="Delete Project" description="This cannot be undone." desktopMaxWidth="400px">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "oklch(0.7 0.18 25 / 0.1)" }}>
            <Warning className="w-5 h-5" style={{ color: "oklch(0.62 0.18 25)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.5 }}>
            Are you sure you want to permanently delete <strong>{projectName}</strong> and all its tasks, notes, and attachments?
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-[6px] transition-colors hover:bg-black/5" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Cancel</button>
          <button onClick={onConfirm} className="px-3 py-1.5 rounded-[6px] text-white" style={{ background: "oklch(0.62 0.18 25)", fontSize: "13px", fontWeight: 500 }}>Delete Project</button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER DROPDOWN
   ═══════════════════════════════════════════════════════════ */

function FilterDropdown<T extends string>({ options, selected, onSelect, onClose, anchorRef }: {
  options: { value: T; label: string; color?: string }[];
  selected: Set<T>;
  onSelect: (value: T) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [anchorRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  return (
    <motion.div
      ref={ref}
      className="fixed z-40 py-1.5 rounded-[8px] shadow-lg min-w-[180px] max-h-[280px] overflow-y-auto"
      style={{ top: pos.top, left: pos.left, background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.1 }}
    >
      {options.map((opt) => {
        const isSelected = selected.has(opt.value);
        return (
          <button key={opt.value} onClick={() => onSelect(opt.value)}
            className="flex items-center gap-2 w-full px-3 py-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            <div className="w-4 h-4 rounded-[3px] flex items-center justify-center shrink-0"
              style={{ border: `1.5px solid ${isSelected ? "var(--accent-primary)" : "var(--border-default)"}`, background: isSelected ? "var(--accent-primary)" : "transparent" }}>
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MOBILE FILTER PANEL
   ═══════════════════════════════════════════════════════════ */

function MobileFilterPanel({ statusFilter, setStatusFilter, phaseFilter, setPhaseFilter, typeFilter, setTypeFilter, clientFilter, setClientFilter, allClients, activeFilterCount, onClearAll, toggleFilter }: {
  statusFilter: Set<ProjectStatus>; setStatusFilter: (s: Set<ProjectStatus>) => void;
  phaseFilter: Set<ProductionPhase>; setPhaseFilter: (s: Set<ProductionPhase>) => void;
  typeFilter: Set<ProjectType>; setTypeFilter: (s: Set<ProjectType>) => void;
  clientFilter: Set<string>; setClientFilter: (s: Set<string>) => void;
  allClients: string[]; activeFilterCount: number; onClearAll: () => void;
  toggleFilter: <T extends string>(set: Set<T>, setFn: (s: Set<T>) => void, value: T) => void;
}) {
  const renderSection = <T extends string>(title: string, options: { value: T; label: string; color?: string }[], selected: Set<T>, setFn: (s: Set<T>) => void) => (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{title}</span>
        {selected.size > 0 && <button onClick={() => setFn(new Set())} style={{ color: "var(--accent-primary)", fontSize: "11px" }}>Clear</button>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.has(opt.value);
          return (
            <button key={opt.value} onClick={() => toggleFilter(selected, setFn, opt.value)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-colors"
              style={{ border: `1.5px solid ${isSelected ? "var(--accent-primary)" : "var(--border-default)"}`, background: isSelected ? "var(--accent-primary-subtle)" : "transparent", color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)", fontSize: "13px", fontWeight: isSelected ? 500 : 400 }}>
              {opt.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.color }} />}
              {opt.label}
              {isSelected && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {renderSection("Status", PROJECT_STATUS_OPTIONS, statusFilter, setStatusFilter)}
      {renderSection("Phase", TASK_PHASE_OPTIONS.map(o => ({ ...o, color: PHASE_META[o.value]?.color })), phaseFilter, setPhaseFilter)}
      {renderSection("Type", PROJECT_TYPE_OPTIONS, typeFilter, setTypeFilter)}
      {allClients.length > 0 && renderSection("Client", allClients.map(c => ({ value: c, label: c })), clientFilter, setClientFilter)}
      {activeFilterCount > 0 && (
        <button onClick={onClearAll} className="w-full py-2.5 rounded-[6px] transition-colors"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 500 }}>
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROJECT CARD (Grid View — matches Figma card layout)
   ═══════════════════════════════════════════════════════════ */

function ProjectCard({ name, project, idx, onNav, onContextMenu, isStarred }: {
  name: string; project: ProjectData; idx: number;
  onNav: () => void; onContextMenu: (e: React.MouseEvent) => void;
  isStarred: boolean;
}) {
  const statusOpt = PROJECT_STATUS_OPTIONS.find(o => o.value === project.status);
  const clientColors = project.client ? getClientColor(project.client) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02, duration: 0.15 }}
      onClick={onNav}
      onContextMenu={onContextMenu}
      className="group cursor-pointer rounded-[10px] border overflow-hidden transition-all hover:shadow-md"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
      whileHover={{ y: -2 }}
    >
      {/* Thumbnail area */}
      <div
        className="flex items-center justify-center relative overflow-hidden"
        style={{
          background: `color-mix(in oklch, ${project.color || "var(--accent-primary)"} 10%, transparent)`,
          height: "100px",
        }}
      >
        <ProjectIcon
          phosphorIcon={project.phosphorIcon}
          color={project.color}
          iconUrl={project.iconUrl}
          size="lg"
        />
        {/* Star badge — top-right */}
        {isStarred && (
          <div className="absolute top-1.5 right-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <Star className="w-3 h-3 text-white" weight="fill" />
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="px-3.5 pt-3 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          {statusOpt && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
              style={{ background: `${statusOpt.color}15`, color: statusOpt.color, fontSize: "10px", fontWeight: 600 }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: statusOpt.color }} />
              {statusOpt.label}
            </span>
          )}
          {project.client && clientColors && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
              style={{ background: clientColors.bg, color: clientColors.color, fontSize: "10px", fontWeight: 500 }}
            >
              {project.client}
            </span>
          )}
        </div>

        <h3 className="truncate" style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600, lineHeight: 1.4 }}>
          {project.shortName || name}
        </h3>

        {project.description && (
          <p className="truncate mt-0.5" style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
            {project.description}
          </p>
        )}

        <p className="mt-2" style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
          {relativeDate(project.updates?.[0]?.createdAt) || "No updates"}
        </p>
      </div>
    </motion.div>
  );
}

/* MobileProjectCard removed — using unified ProjectCard grid view */

/* ═══════════════════════════════════════════════════════════
   PHASE GROUP SECTION
   ═══════════════════════════════════════════════════════════ */

function PhaseGroupSection({ groupKey, label, color, bgColor, projects: groupProjects, defaultOpen, children }: {
  groupKey: string; label: string; color: string; bgColor: string;
  projects: [string, ProjectData][]; defaultOpen: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      {/* Group header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-2 px-1 w-full text-left transition-colors hover:bg-black/[0.02] rounded-[4px]"
      >
        <CaretRight
          className="w-3.5 h-3.5 transition-transform shrink-0"
          style={{ color: "var(--text-quaternary)", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[4px]"
          style={{ background: bgColor, color, fontSize: "12px", fontWeight: 600 }}
        >
          <span className="w-[7px] h-[7px] rounded-full" style={{ background: color }} />
          {label}
        </span>
      </button>

      {/* Rows */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function ProjectsOverview() {
  const { projects, starred, toggleStarred, setProject, deleteProject, loadError, reload } = useData();
  const visibleProjects = useVisibleProjects();
  const { navigate } = useNavigation();

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("starred");
  const [groupBy, setGroupBy] = useState<GroupBy>("phase");
  const [showArchived, setShowArchived] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<Set<ProjectStatus>>(new Set());
  const [phaseFilter, setPhaseFilter] = useState<Set<ProductionPhase>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<ProjectType>>(new Set());
  const [clientFilter, setClientFilter] = useState<Set<string>>(new Set());

  // Filter dropdown open state
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const statusBtnRef = useRef<HTMLDivElement>(null);
  const phaseBtnRef = useRef<HTMLDivElement>(null);
  const typeBtnRef = useRef<HTMLDivElement>(null);
  const clientBtnRef = useRef<HTMLDivElement>(null);

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; name: string } | null>(null);

  // Dialogs
  const [wizardOpen, setWizardOpen] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<(ProjectData & { originalName: string }) | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // File import ref
  const importRef = useRef<HTMLInputElement>(null);

  // All unique clients
  const allClients = useMemo(() => {
    return Array.from(new Set(Object.values(visibleProjects).map(p => p.client).filter(Boolean))).sort();
  }, [visibleProjects]);

  const activeFilterCount = statusFilter.size + phaseFilter.size + typeFilter.size + clientFilter.size;

  // Filter + sort logic
  const { activeProjects, archivedProjects } = useMemo(() => {
    const allEntries = Object.entries(visibleProjects);
    const active: [string, ProjectData][] = [];
    const archived: [string, ProjectData][] = [];

    for (const [name, project] of allEntries) {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = name.toLowerCase().includes(q) ||
          (project.shortName || "").toLowerCase().includes(q) ||
          (project.client || "").toLowerCase().includes(q) ||
          (project.description || "").toLowerCase().includes(q);
        if (!matches) continue;
      }
      if (statusFilter.size > 0 && !statusFilter.has(project.status)) continue;
      if (phaseFilter.size > 0 && !phaseFilter.has(project.productionPhase)) continue;
      if (typeFilter.size > 0 && !typeFilter.has(project.projectType)) continue;
      if (clientFilter.size > 0 && !clientFilter.has(project.client || "")) continue;

      if (project.archived) archived.push([name, project]);
      else active.push([name, project]);
    }

    const sortFn = (a: [string, ProjectData], b: [string, ProjectData]) => {
      if (sortBy === "starred" || sortBy === "name") {
        const aS = starred.has(a[0]) ? 0 : 1;
        const bS = starred.has(b[0]) ? 0 : 1;
        if (aS !== bS) return aS - bS;
        return (a[1].shortName || a[0]).localeCompare(b[1].shortName || b[0]);
      }
      if (sortBy === "progress") {
        const pctA = a[1].tasks.length > 0 ? a[1].tasks.filter(t => t.completed).length / a[1].tasks.length : 0;
        const pctB = b[1].tasks.length > 0 ? b[1].tasks.filter(t => t.completed).length / b[1].tasks.length : 0;
        return pctB - pctA;
      }
      return (a[1].shortName || a[0]).localeCompare(b[1].shortName || b[0]);
    };

    active.sort(sortFn);
    archived.sort(sortFn);
    return { activeProjects: active, archivedProjects: archived };
  }, [visibleProjects, starred, searchQuery, statusFilter, phaseFilter, typeFilter, clientFilter, sortBy]);

  // Group projects by phase (or other groupBy)
  const groupedProjects = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: "All Projects", color: "var(--text-secondary)", bgColor: "var(--neutral-100)", projects: activeProjects }];

    const groupMap = new Map<string, [string, ProjectData][]>();
    const orderMap = new Map<string, number>();

    if (groupBy === "phase") {
      const phaseOrder = ["incoming", "pre-production", "in-production", "post-production", "submitted", "revisions", "ongoing", "future", "cold"];
      phaseOrder.forEach((p, i) => orderMap.set(p, i));
      for (const entry of activeProjects) {
        const key = entry[1].productionPhase;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(entry);
      }
    } else if (groupBy === "status") {
      PROJECT_STATUS_OPTIONS.forEach((o, i) => orderMap.set(o.value, i));
      for (const entry of activeProjects) {
        const key = entry[1].status;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(entry);
      }
    } else if (groupBy === "type") {
      PROJECT_TYPE_OPTIONS.forEach((o, i) => orderMap.set(o.value, i));
      for (const entry of activeProjects) {
        const key = entry[1].projectType;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(entry);
      }
    } else if (groupBy === "client") {
      for (const entry of activeProjects) {
        const key = entry[1].client || "(No Client)";
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(entry);
      }
    }

    const groups = Array.from(groupMap.entries())
      .sort((a, b) => (orderMap.get(a[0]) ?? 99) - (orderMap.get(b[0]) ?? 99))
      .map(([key, entries]) => {
        let label = key;
        let color = "var(--text-secondary)";
        let bgColor = "var(--neutral-100)";

        if (groupBy === "phase" && PHASE_META[key as ProductionPhase]) {
          const meta = PHASE_META[key as ProductionPhase];
          label = meta.label;
          color = meta.color;
          bgColor = meta.bgColor;
        } else if (groupBy === "status") {
          const opt = PROJECT_STATUS_OPTIONS.find(o => o.value === key);
          if (opt) { label = opt.label; color = opt.color; bgColor = `${opt.color}15`; }
        } else if (groupBy === "type") {
          const opt = PROJECT_TYPE_OPTIONS.find(o => o.value === key);
          const tc = WORK_TYPE_COLORS[key as ProjectType];
          if (opt) { label = opt.label; }
          if (tc) { color = tc.color; bgColor = tc.bg; }
        } else if (groupBy === "client") {
          const cc = key !== "(No Client)" ? getClientColor(key) : { color: "var(--text-quaternary)", bg: "var(--neutral-100)" };
          color = cc.color;
          bgColor = cc.bg;
        }

        return { key, label, color, bgColor, projects: entries };
      });

    return groups;
  }, [activeProjects, groupBy]);

  // Handlers
  const handleContextMenu = useCallback((e: React.MouseEvent, name: string) => {
    e.preventDefault(); e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, name });
  }, []);

  const handleRename = useCallback((oldName: string, newName: string) => {
    const project = projects[oldName];
    if (!project || projects[newName]) return;
    setProject(newName, { ...project, name: newName });
    deleteProject(oldName);
    if (starred.has(oldName)) { toggleStarred(oldName); toggleStarred(newName); }
    setRenameTarget(null);
    toast.success(`Renamed to "${newName}"`);
  }, [projects, setProject, deleteProject, starred, toggleStarred]);

  const handleDuplicate = useCallback((name: string) => {
    const project = projects[name];
    if (!project) return;
    setDuplicateFrom({ ...project, originalName: name });
    setWizardOpen(true);
  }, [projects]);

  const handleArchive = useCallback((name: string) => {
    const project = projects[name];
    if (!project) return;
    setProject(name, { ...project, archived: !project.archived });
    toast.success(project.archived ? `"${project.shortName || name}" unarchived` : `"${project.shortName || name}" archived`);
  }, [projects, setProject]);

  const handleDelete = useCallback((name: string) => {
    deleteProject(name);
    setDeleteTarget(null);
    toast.success(`"${name}" deleted`);
  }, [deleteProject]);

  const handleExport = useCallback((name: string) => {
    const project = projects[name];
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Project exported");
  }, [projects]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ProjectData;
        if (!data.name) { toast.error("Invalid project file: missing name"); return; }
        let projectName = data.name;
        if (projects[projectName]) projectName = `${projectName} (Imported)`;
        setProject(projectName, { ...data, name: projectName });
        toast.success(`"${projectName}" imported`);
      } catch { toast.error("Failed to parse project JSON"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [projects, setProject]);

  const toggleFilter = useCallback(<T extends string>(set: Set<T>, setFn: (s: Set<T>) => void, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value); else next.add(value);
    setFn(next);
  }, []);

  const clearAllFilters = () => {
    setStatusFilter(new Set()); setPhaseFilter(new Set()); setTypeFilter(new Set()); setClientFilter(new Set()); setSearchQuery("");
  };

  // Starred projects
  const starredProjects = useMemo(
    () => activeProjects.filter(([name]) => starred.has(name)),
    [activeProjects, starred]
  );

  /* ── Error fallback ── */
  if (loadError && Object.keys(projects).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto" style={{ background: "oklch(0.95 0.04 60)" }}>
            <Warning className="w-6 h-6" style={{ color: "oklch(0.7 0.15 60)" }} weight="fill" />
          </div>
          <div>
            <h3 className="mb-1" style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}>Unable to load projects</h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>{loadError}</p>
          </div>
          <button onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
            style={{ background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500 }}>
            <ArrowClockwise className="w-4 h-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <SquareHalf className="w-7 h-7" weight="fill" style={{ color: "var(--accent-primary)" }} />
          <h1 style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Projects
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ListToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search projects…"
            sortOptions={PROJECT_SORT_OPTIONS}
            sortValue={sortBy}
            onSortChange={(v) => setSortBy(v as SortBy)}
            activeFilterCount={activeFilterCount}
            onFilterClick={() => {
              if (window.innerWidth < 640) setFiltersExpanded(!filtersExpanded);
              else setOpenFilter(openFilter ? null : "status");
            }}
            groupActive={groupBy !== "none"}
            groupLabel={groupBy !== "none" ? `Grouped: ${groupBy}` : "Group"}
            onGroupClick={() => setGroupBy(groupBy === "none" ? "phase" : "none")}
          />

          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

          <button
            onClick={() => { setDuplicateFrom(null); setWizardOpen(true); }}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-white transition-opacity hover:opacity-90"
            style={{ background: "#FA6863", fontSize: "13px", fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" weight="bold" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </div>
      </div>

      {/* ═══ Filter row (desktop, conditional) ═══ */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="hidden sm:flex items-center gap-2 flex-wrap py-1">
              <div ref={statusBtnRef} className="relative">
                <FilterPill label={statusFilter.size > 0 ? `Status (${statusFilter.size})` : "Status"} active={statusFilter.size > 0}
                  onClick={() => setOpenFilter(openFilter === "status" ? null : "status")}
                  onClear={statusFilter.size > 0 ? () => setStatusFilter(new Set()) : undefined} />
              </div>
              <div ref={phaseBtnRef} className="relative">
                <FilterPill label={phaseFilter.size > 0 ? `Phase (${phaseFilter.size})` : "Phase"} active={phaseFilter.size > 0}
                  onClick={() => setOpenFilter(openFilter === "phase" ? null : "phase")}
                  onClear={phaseFilter.size > 0 ? () => setPhaseFilter(new Set()) : undefined} />
              </div>
              <div ref={typeBtnRef} className="relative">
                <FilterPill label={typeFilter.size > 0 ? `Type (${typeFilter.size})` : "Type"} active={typeFilter.size > 0}
                  onClick={() => setOpenFilter(openFilter === "type" ? null : "type")}
                  onClear={typeFilter.size > 0 ? () => setTypeFilter(new Set()) : undefined} />
              </div>
              {allClients.length > 0 && (
                <div ref={clientBtnRef} className="relative">
                  <FilterPill label={clientFilter.size > 0 ? `Client (${clientFilter.size})` : "Client"} active={clientFilter.size > 0}
                    onClick={() => setOpenFilter(openFilter === "client" ? null : "client")}
                    onClear={clientFilter.size > 0 ? () => setClientFilter(new Set()) : undefined} />
                </div>
              )}
              <button onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] transition-colors hover:bg-black/5"
                style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
                <X className="w-3 h-3" /> Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile filter drawer */}
      <FilterDrawer open={filtersExpanded} onClose={() => setFiltersExpanded(false)} title="Filter Projects">
        <MobileFilterPanel statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          phaseFilter={phaseFilter} setPhaseFilter={setPhaseFilter}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          clientFilter={clientFilter} setClientFilter={setClientFilter}
          allClients={allClients} activeFilterCount={activeFilterCount}
          onClearAll={clearAllFilters} toggleFilter={toggleFilter} />
      </FilterDrawer>

      {/* ═══ Desktop Filter Dropdowns ═══ */}
      <AnimatePresence>
        {openFilter === "status" && statusBtnRef.current && (
          <FilterDropdown options={PROJECT_STATUS_OPTIONS} selected={statusFilter}
            onSelect={(v) => toggleFilter(statusFilter, setStatusFilter, v)}
            onClose={() => setOpenFilter(null)} anchorRef={statusBtnRef} />
        )}
        {openFilter === "phase" && phaseBtnRef.current && (
          <FilterDropdown options={TASK_PHASE_OPTIONS} selected={phaseFilter}
            onSelect={(v) => toggleFilter(phaseFilter, setPhaseFilter, v)}
            onClose={() => setOpenFilter(null)} anchorRef={phaseBtnRef} />
        )}
        {openFilter === "type" && typeBtnRef.current && (
          <FilterDropdown options={PROJECT_TYPE_OPTIONS} selected={typeFilter}
            onSelect={(v) => toggleFilter(typeFilter, setTypeFilter, v)}
            onClose={() => setOpenFilter(null)} anchorRef={typeBtnRef} />
        )}
        {openFilter === "client" && clientBtnRef.current && (
          <FilterDropdown options={allClients.map(c => ({ value: c, label: c }))} selected={clientFilter}
            onSelect={(v) => toggleFilter(clientFilter, setClientFilter, v)}
            onClose={() => setOpenFilter(null)} anchorRef={clientBtnRef} />
        )}
      </AnimatePresence>

      {/* ═══ Starred Section ═══ */}
      {starredProjects.length > 0 && !searchQuery && activeFilterCount === 0 && (
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
              {starredProjects.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {starredProjects.map(([name, project]) => (
              <button
                key={name}
                onClick={() => navigate("project", { projectId: name })}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-[6px] transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                style={{ border: "1px solid var(--border-default)", background: "var(--surface-bg)" }}
              >
                <ProjectIcon phosphorIcon={project.phosphorIcon} color={project.color} iconUrl={project.iconUrl} size="sm" />
                <span className="truncate max-w-[160px]" style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
                  {project.shortName || name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Projects Section Header ═══ */}
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--text-primary)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Projects
        </span>
        <span
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
          style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}
        >
          {activeProjects.length}
        </span>
      </div>

      {/* ═══ Card Grid ═══ */}
      {activeProjects.length === 0 && archivedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-[12px] flex items-center justify-center mb-4" style={{ background: "var(--neutral-100)" }}>
            <SquareHalf className="w-8 h-8" style={{ color: "var(--text-quaternary)" }} />
          </div>
          <h3 style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 600 }}>
            {activeFilterCount > 0 || searchQuery ? "No matching projects" : "No projects yet"}
          </h3>
          <p className="mt-1.5 max-w-sm" style={{ color: "var(--text-quaternary)", fontSize: "13px" }}>
            {activeFilterCount > 0 || searchQuery ? "Try adjusting your search or filters." : "Create your first project to get started."}
          </p>
          {!(activeFilterCount > 0 || searchQuery) && (
            <button onClick={() => { setDuplicateFrom(null); setWizardOpen(true); }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-white transition-opacity hover:opacity-90"
              style={{ background: "#FA6863", fontSize: "13px", fontWeight: 500 }}>
              <Plus className="w-4 h-4" weight="bold" /> New Project
            </button>
          )}
        </div>
      ) : (
        <>
          {groupBy !== "none" ? (
            groupedProjects.map(group => (
              <PhaseGroupSection
                key={group.key}
                groupKey={group.key}
                label={group.label}
                color={group.color}
                bgColor={group.bgColor}
                projects={group.projects}
                defaultOpen
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pl-5 mt-1">
                  {group.projects.map(([name, project], idx) => (
                    <ProjectCard
                      key={name} name={name} project={project} idx={idx}
                      onNav={() => navigate("project", { projectId: name })}
                      onContextMenu={(e) => handleContextMenu(e, name)}
                      isStarred={starred.has(name)}
                    />
                  ))}
                </div>
              </PhaseGroupSection>
            ))
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeProjects.map(([name, project], idx) => (
                <ProjectCard
                  key={name} name={name} project={project} idx={idx}
                  onNav={() => navigate("project", { projectId: name })}
                  onContextMenu={(e) => handleContextMenu(e, name)}
                  isStarred={starred.has(name)}
                />
              ))}
            </div>
          )}

          {/* Archived section */}
          {archivedProjects.length > 0 && (
            <div className="mt-6">
              <button onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2 mb-3 transition-colors hover:opacity-80"
                style={{ color: "var(--text-tertiary)", fontSize: "13px", fontWeight: 500 }}>
                {showArchived ? <CaretDown className="w-4 h-4" /> : <CaretRight className="w-4 h-4" />}
                <Archive className="w-4 h-4" /> Archived ({archivedProjects.length})
              </button>
              {showArchived && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 opacity-60">
                    {archivedProjects.map(([name, project], idx) => (
                      <ProjectCard key={name} name={name} project={project} idx={idx}
                        onNav={() => navigate("project", { projectId: name })}
                        onContextMenu={(e) => handleContextMenu(e, name)}
                        isStarred={starred.has(name)} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══ Context Menu ═══ */}
      <AnimatePresence>
        {contextMenu && projects[contextMenu.name] && (
          <ContextMenu x={contextMenu.x} y={contextMenu.y} projectName={contextMenu.name}
            project={projects[contextMenu.name]} onClose={() => setContextMenu(null)}
            onRename={() => setRenameTarget(contextMenu.name)}
            onDuplicate={() => handleDuplicate(contextMenu.name)}
            onArchive={() => handleArchive(contextMenu.name)}
            onDelete={() => setDeleteTarget(contextMenu.name)}
            onExport={() => handleExport(contextMenu.name)} />
        )}
      </AnimatePresence>

      {/* ═══ Dialogs ═══ */}
      <AnimatePresence>
        {wizardOpen && (
          <ProjectCreationWizard open={wizardOpen}
            onClose={() => { setWizardOpen(false); setDuplicateFrom(null); }}
            duplicateFrom={duplicateFrom || undefined} />
        )}
      </AnimatePresence>
      {renameTarget && (
        <RenameDialog open={!!renameTarget} projectName={renameTarget}
          onClose={() => setRenameTarget(null)} onConfirm={(newName) => handleRename(renameTarget, newName)} />
      )}
      {deleteTarget && (
        <DeleteConfirm open={!!deleteTarget} projectName={deleteTarget}
          onClose={() => setDeleteTarget(null)} onConfirm={() => handleDelete(deleteTarget)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FILTER PILL
   ═══════════════════════════════════════════════════════════ */

function FilterPill({ label, active, onClick, onClear }: { label: string; active: boolean; onClick: () => void; onClear?: () => void }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] transition-colors shrink-0"
      style={{
        border: `1px solid ${active ? "var(--accent-primary)" : "var(--border-default)"}`,
        background: active ? "var(--accent-primary-subtle)" : "transparent",
        color: active ? "var(--accent-primary)" : "var(--text-tertiary)",
        fontSize: "12px", fontWeight: active ? 500 : 400,
      }}>
      {label}
      {active && onClear && (
        <span onClick={(e) => { e.stopPropagation(); onClear(); }} className="ml-0.5 hover:opacity-70">
          <X className="w-3 h-3" />
        </span>
      )}
      {!active && <CaretDown className="w-3 h-3 ml-0.5" />}
    </button>
  );
}

export default ProjectsOverview;