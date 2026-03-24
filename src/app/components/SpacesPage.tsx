/* ═══════════════════════════════════════════════════════════
   SPACES PAGE — Full-page workspace for managing spaces.
   
   Features:
   - Card grid of all spaces with project/doc counts
   - Create new space with name, color, icon, Phosphor icon
   - Inline editing of space name/description
   - Drag to reorder (future), delete with confirmation
   - Toggle visibility, manage people
   - View projects/docs assigned to each space
   - Assign unassigned projects to a space
   
   Updated: force module refresh
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from "react";
import {
  Plus,
  DotsThree,
  Trash,
  PencilSimple,
  Check,
  X,
  Eye,
  EyeSlash,
  CirclesFour,
  UsersThree,
  SquareHalf,
  UploadSimple,
  Gear,
  CaretDown,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { useAuth } from "../lib/auth";
import { getUserSpaceRole, isSuperAdmin, isAdminOrAbove, MEMBER_ROLE_META } from "../lib/space-roles";
import { getPhosphorIcon } from "./PhosphorIconPicker";
import { ProjectIcon } from "./ProjectIcon";
import { SpacePeopleManager } from "./SpacePeopleManager";
import type { Space, SpaceMemberRole } from "../lib/types";
import { toast } from "sonner";
import { haptic } from "../lib/haptics";
import { createPortal } from "react-dom";
import { ListToolbar } from "./ListToolbar";

/* ─── Constants ─── */

const TOGGLE_GREEN = "oklch(0.62 0.17 155)";

const SPACE_COLORS = [
  "oklch(0.65 0.18 25)",   // coral-red
  "oklch(0.7 0.15 155)",   // emerald
  "oklch(0.65 0.16 250)",  // blue
  "oklch(0.65 0.16 290)",  // violet
  "oklch(0.8 0.14 80)",    // amber
  "oklch(0.65 0.12 340)",  // pink
  "oklch(0.6 0.14 200)",   // teal
  "oklch(0.6 0.1 30)",     // burnt orange
  "oklch(0.55 0.2 280)",   // indigo
  "oklch(0.73 0.15 155)",  // green
];

const SPACE_EMOJIS = ["🏢", "🏠", "👤", "🎨", "🚀", "📦", "💼", "🌱", "⭐", "🔬", "🎯", "🌍"];

/* ─── Common Phosphor icon names for quick-pick ─── */
const QUICK_ICONS = [
  "CirclesFour", "Briefcase", "Rocket", "Star", "Heart", "Lightning",
  "Camera", "VideoCamera", "Palette", "PaintBrush", "Notebook", "BookOpen",
  "Buildings", "House", "Globe", "Users", "UsersThree", "Target",
  "Flag", "Trophy", "Package", "Gift", "Headphones", "MusicNote",
  "Code", "Database", "Gear", "Shield", "ChartBar", "Megaphone",
  "Lightbulb", "Plant", "Sparkle", "Atom", "Compass",
];

function generateId() {
  return `space-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── File-to-DataURL helper for logo uploads ── */
function readFileAsDataUrl(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Reusable Logo Upload Button ── */
function LogoUploadButton({
  onUpload,
  onRemove,
  hasLogo,
  color,
}: {
  onUpload: (dataUrl: string) => void;
  onRemove: () => void;
  hasLogo: boolean;
  color: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onUpload(dataUrl);
    } catch {
      toast.error("Failed to process image");
    }
    // Reset so the same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        style={{ color: color }}
      >
        <UploadSimple size={12} weight="bold" />
        Upload logo
      </button>
      {hasLogo && (
        <button
          onClick={onRemove}
          className="flex items-center gap-1 px-2 py-1 rounded-[5px] text-[11px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{ color: "var(--text-quaternary)" }}
        >
          <X size={10} weight="bold" />
          Remove
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SPACE CARD
   ═══════════════════════════════════════════════════════════ */

interface SpaceCardProps {
  space: Space;
  projectCount: number;
  docCount: number;
  taskCount: number;
  userRole: SpaceMemberRole | null;
  onEdit: (updates: Partial<Space>) => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onManagePeople: () => void;
  onOpenSpace: () => void;
}

const SpaceCard = forwardRef<HTMLDivElement, SpaceCardProps>(function SpaceCard({
  space,
  projectCount,
  docCount,
  taskCount,
  userRole,
  onEdit,
  onDelete,
  onToggleVisibility,
  onManagePeople,
  onOpenSpace,
}, ref) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(space.name);
  const [editDesc, setEditDesc] = useState(space.description || "");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  // Close context menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        menuBtnRef.current && !menuBtnRef.current.contains(target)
      ) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (editing) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const trimName = editName.trim();
    const trimDesc = editDesc.trim();
    const updates: Partial<Space> = {};
    if (trimName && trimName !== space.name) updates.name = trimName;
    if (trimDesc !== (space.description || "")) updates.description = trimDesc || undefined;
    if (Object.keys(updates).length > 0) {
      onEdit(updates);
    }
    setEditing(false);
  };

  const SpaceIcon = space.phosphorIcon
    ? getPhosphorIcon(space.phosphorIcon) || CirclesFour
    : CirclesFour;

  const totalPeople = (space.admins?.length || 0) + (space.members?.length || 0) + (space.viewers?.length || 0);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-[10px] border overflow-hidden transition-all hover:shadow-md cursor-pointer"
      style={{
        background: "var(--surface-bg)",
        borderColor: "var(--border-default)",
        opacity: space.visible ? 1 : 0.6,
      }}
      onClick={onOpenSpace}
    >
      {/* ── Thumbnail area ── */}
      <div
        className="flex items-center justify-center relative overflow-hidden"
        style={{
          background: space.visible
            ? `color-mix(in oklch, ${space.color} 10%, transparent)`
            : "var(--neutral-50)",
          height: "100px",
        }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); if (!editing) setShowIconPicker(true); }}
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-110"
          style={{
            background: `color-mix(in oklch, ${space.color} 14%, transparent)`,
            border: `1.5px solid color-mix(in oklch, ${space.color} 20%, transparent)`,
          }}
          title="Change icon"
        >
          {space.iconUrl ? (
            <img src={space.iconUrl} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <SpaceIcon
              size={26}
              weight="fill"
              style={{ color: space.color }}
            />
          )}
        </button>

        {/* Visibility badge — top-right */}
        {!space.visible && (
          <div className="absolute top-1.5 right-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <EyeSlash className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>

      <div className="px-3.5 pt-3 pb-3">
        {/* ── Name / Description ── */}
        <div className="mb-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-1.5">
                <input
                  ref={nameRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") { setEditName(space.name); setEditDesc(space.description || ""); setEditing(false); }
                  }}
                  className="w-full bg-transparent outline-none border-b pb-0.5"
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    borderColor: "var(--accent-primary)",
                  }}
                />
                <input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") { setEditName(space.name); setEditDesc(space.description || ""); setEditing(false); }
                  }}
                  placeholder="Description (optional)"
                  className="w-full bg-transparent outline-none"
                  style={{
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                  }}
                />
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={commitEdit}
                    className="px-2.5 py-1 rounded-[5px] text-white text-[11px] font-semibold"
                    style={{ background: "var(--accent-primary)" }}
                  >
                    <Check className="w-3 h-3 inline mr-0.5" weight="bold" />
                    Save
                  </button>
                  <button
                    onClick={() => { setEditName(space.name); setEditDesc(space.description || ""); setEditing(false); }}
                    className="px-2.5 py-1 rounded-[5px] text-[11px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3
                  className="text-[15px] font-semibold truncate cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                  onClick={onOpenSpace}
                >
                  {space.name}
                </h3>
                {space.description && (
                  <p
                    className="text-[12px] truncate mt-0.5"
                    style={{ color: "var(--text-quaternary)" }}
                  >
                    {space.description}
                  </p>
                )}
              </>
            )}
            </div>

            {/* ── Context menu ── */}
            {!editing && (
              <div className="relative shrink-0">
                <button
                  ref={menuBtnRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!menuOpen && menuBtnRef.current) {
                      const rect = menuBtnRef.current.getBoundingClientRect();
                      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                    }
                    setMenuOpen(!menuOpen);
                    setConfirmDelete(false);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-[6px] opacity-0 group-hover:opacity-100 transition-all hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
                  style={{ color: "var(--text-quaternary)" }}
                >
                  <DotsThree size={18} weight="bold" />
                </button>

                {createPortal(
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ duration: 0.12 }}
                        className="fixed z-[9999] w-[170px] py-1 rounded-[10px] border shadow-lg overflow-hidden"
                        style={{
                          top: menuPos.top,
                          right: menuPos.right,
                          background: "var(--surface-bg)",
                          borderColor: "var(--border-default)",
                        }}
                      >
                        {/* Super-admin only: Edit space (icon/color) */}
                        {isSuperAdmin(userRole) && (
                          <CtxMenuItem icon={Gear} label="Edit space" onClick={() => { setMenuOpen(false); setShowIconPicker(true); }} />
                        )}
                        {/* Super-admin only: Rename */}
                        {isSuperAdmin(userRole) && (
                          <CtxMenuItem icon={PencilSimple} label="Rename" onClick={() => { setMenuOpen(false); setEditName(space.name); setEditDesc(space.description || ""); setEditing(true); }} />
                        )}
                        {/* Super-admin only: Hide/Show */}
                        {isSuperAdmin(userRole) && (
                          <CtxMenuItem icon={space.visible ? EyeSlash : Eye} label={space.visible ? "Hide" : "Show"} onClick={() => { setMenuOpen(false); onToggleVisibility(); }} />
                        )}
                        {/* Admin or above: People */}
                        {isAdminOrAbove(userRole) && (
                          <CtxMenuItem icon={UsersThree} label="People" onClick={() => { setMenuOpen(false); onManagePeople(); }} />
                        )}
                        {/* Always show Open */}
                        <CtxMenuItem icon={Eye} label="Open space" onClick={() => { setMenuOpen(false); onOpenSpace(); }} />
                        {/* Super-admin only: Delete */}
                        {isSuperAdmin(userRole) && (
                          <>
                            <div className="my-1 mx-2 h-px" style={{ background: "var(--border-default)" }} />
                            {!confirmDelete ? (
                              <CtxMenuItem icon={Trash} label="Delete" danger onClick={() => setConfirmDelete(true)} />
                            ) : (
                              <CtxMenuItem icon={Trash} label="Confirm delete?" danger onClick={() => { setMenuOpen(false); setConfirmDelete(false); onDelete(); }} />
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats + badges ── */}
        {!editing && (
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
              style={{ background: `color-mix(in oklch, ${space.color} 10%, transparent)`, color: space.color, fontSize: "10px", fontWeight: 600 }}
            >
              {projectCount} projects
            </span>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
              style={{ background: "var(--neutral-100)", color: "var(--text-tertiary)", fontSize: "10px", fontWeight: 500 }}
            >
              {docCount} docs
            </span>
            {totalPeople > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
                style={{ background: "var(--neutral-100)", color: "var(--text-tertiary)", fontSize: "10px", fontWeight: 500 }}
              >
                {totalPeople} people
              </span>
            )}
          </div>
        )}

        {space.description && !editing && (
          <p className="truncate" style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
            {space.description}
          </p>
        )}
      </div>

      {/* ── Phosphor Icon Picker Modal ── */}
      {showIconPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowIconPicker(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 p-4 rounded-[12px] border shadow-xl w-[320px]"
            style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Choose icon</p>
              <button onClick={() => setShowIconPicker(false)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
                <X size={14} style={{ color: "var(--text-tertiary)" }} />
              </button>
            </div>

            {/* Current logo preview */}
            {space.iconUrl && (
              <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-[8px]" style={{ background: "var(--neutral-50)" }}>
                <img src={space.iconUrl} alt="" className="w-8 h-8 rounded-[6px] object-cover" />
                <span className="text-[12px] flex-1" style={{ color: "var(--text-secondary)" }}>Current logo</span>
                <button
                  onClick={() => { onEdit({ iconUrl: undefined, phosphorIcon: "CirclesFour" }); }}
                  className="text-[11px] px-1.5 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: "var(--text-quaternary)" }}
                >
                  Remove
                </button>
              </div>
            )}

            <div className="grid grid-cols-8 gap-1">
              {QUICK_ICONS.map((iconName) => {
                const Ic = getPhosphorIcon(iconName);
                if (!Ic) return null;
                const isActive = space.phosphorIcon === iconName && !space.iconUrl;
                return (
                  <button
                    key={iconName}
                    onClick={() => { onEdit({ phosphorIcon: iconName, iconUrl: undefined }); setShowIconPicker(false); }}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors"
                    style={{
                      background: isActive ? `color-mix(in oklch, ${space.color} 16%, transparent)` : undefined,
                      border: isActive ? `1.5px solid ${space.color}` : "1.5px solid transparent",
                    }}
                    title={iconName}
                  >
                    <Ic size={17} weight={isActive ? "fill" : "regular"} style={{ color: isActive ? space.color : "var(--text-tertiary)" }} />
                  </button>
                );
              })}
            </div>

            {/* Upload logo option */}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-default)" }}>
              <LogoUploadButton
                onUpload={(dataUrl) => { onEdit({ iconUrl: dataUrl, phosphorIcon: undefined }); setShowIconPicker(false); }}
                onRemove={() => { onEdit({ iconUrl: undefined, phosphorIcon: "CirclesFour" }); }}
                hasLogo={!!space.iconUrl}
                color={space.color}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Color Picker Inline ── */}
      {showColorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0" onClick={() => setShowColorPicker(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 p-3 rounded-[10px] border shadow-xl"
            style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
          >
            <p className="text-[12px] font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>Space color</p>
            <div className="flex flex-wrap gap-2">
              {SPACE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => { onEdit({ color }); setShowColorPicker(false); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    background: color,
                    outline: space.color === color ? "2.5px solid var(--accent-primary)" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {space.color === color && <Check size={13} weight="bold" className="text-white" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
});
SpaceCard.displayName = "SpaceCard";

/* StatBadge removed — using inline badge pills in card body */

/* ── Context menu item ── */
function CtxMenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center gap-2 w-full px-3 py-[6px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
      style={{ fontSize: "13px", color: danger ? "oklch(0.6 0.2 25)" : "var(--text-secondary)" }}
    >
      <Icon size={15} weight="regular" />
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   TOGGLE SWITCH — iOS-style toggle (moved from UserOrbitMenu)
   ═══════════════════════════════════════════════════════════ */

function ToggleSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="relative shrink-0 rounded-full transition-colors duration-200"
      style={{
        width: 36,
        height: 20,
        background: on ? TOGGLE_GREEN : "var(--neutral-200)",
      }}
      aria-checked={on}
      role="switch"
    >
      <motion.div
        className="absolute top-[2px] rounded-full bg-white"
        style={{ width: 16, height: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}
        animate={{ left: on ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   VISIBILITY TOGGLES PANEL — quick space on/off switches
   ═══════════════════════════════════════════════════════════ */

function VisibilityTogglesPanel({
  spaces,
  onToggle,
}: {
  spaces: Space[];
  onToggle: (spaceId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const visibleCount = spaces.filter((s) => s.visible).length;

  if (spaces.length === 0) return null;

  return (
    <div
      className="rounded-[12px] border overflow-hidden"
      style={{
        background: "var(--surface-bg)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full px-4 py-3 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <Eye
          size={16}
          weight="fill"
          style={{ color: "var(--accent-primary)" }}
        />
        <span
          className="flex-1 text-left text-[13px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Visibility
        </span>
        <span
          className="text-[12px] tabular-nums mr-1"
          style={{ color: "var(--text-quaternary)" }}
        >
          {visibleCount}/{spaces.length} active
        </span>
        <CaretDown
          size={14}
          weight="bold"
          className="transition-transform duration-200"
          style={{
            color: "var(--text-quaternary)",
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
          }}
        />
      </button>

      {/* Toggle rows */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div
              className="border-t"
              style={{ borderColor: "var(--border-default)" }}
            >
              {spaces.map((space) => {
                const SpaceIcon = space.phosphorIcon
                  ? getPhosphorIcon(space.phosphorIcon) || CirclesFour
                  : CirclesFour;

                return (
                  <div
                    key={space.id}
                    className="flex items-center gap-3 px-4 py-[9px] transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                    style={{ opacity: space.visible ? 1 : 0.55 }}
                  >
                    {/* Space icon */}
                    <div
                      className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 transition-all duration-250 overflow-hidden"
                      style={{
                        background: space.visible
                          ? `color-mix(in oklch, ${space.color} 14%, transparent)`
                          : "var(--neutral-100)",
                        border: `1.5px solid ${space.visible ? `color-mix(in oklch, ${space.color} 20%, transparent)` : "var(--border-default)"}`,
                      }}
                    >
                      {space.iconUrl ? (
                        <img src={space.iconUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <SpaceIcon
                          size={15}
                          weight="fill"
                          style={{
                            color: space.visible ? space.color : "var(--text-quaternary)",
                            transition: "all 0.25s",
                          }}
                        />
                      )}
                    </div>

                    {/* Name */}
                    <span
                      className="flex-1 truncate transition-colors duration-200"
                      style={{
                        fontSize: "14px",
                        color: space.visible ? "var(--text-primary)" : "var(--text-quaternary)",
                        fontWeight: space.visible ? 500 : 400,
                      }}
                    >
                      {space.name}
                    </span>

                    {/* Toggle */}
                    <ToggleSwitch
                      on={space.visible}
                      onToggle={() => onToggle(space.id)}
                    />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CREATE SPACE MODAL
   ═══════════════════════════════════════════════════════════ */

function CreateSpaceModal({
  onClose,
  onCreate,
  nextOrder,
  creatorUserId,
  creatorName,
  creatorEmail,
  creatorAvatarUrl,
  creatorAvatarColor,
}: {
  onClose: () => void;
  onCreate: (space: Space) => void;
  nextOrder: number;
  creatorUserId?: string;
  creatorName?: string;
  creatorEmail?: string;
  creatorAvatarUrl?: string;
  creatorAvatarColor?: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(SPACE_COLORS[Math.floor(Math.random() * SPACE_COLORS.length)]);
  const [selectedIcon, setSelectedIcon] = useState(SPACE_EMOJIS[0]);
  const [phosphorIcon, setPhosphorIcon] = useState<string | undefined>("CirclesFour");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Build the creator as a super-admin member
    const creatorMember = creatorUserId
      ? {
          id: `person-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: creatorName || creatorEmail || "Creator",
          email: creatorEmail,
          avatarUrl: creatorAvatarUrl,
          avatarColor: creatorAvatarColor,
          memberRole: "super-admin" as const,
          userId: creatorUserId,
        }
      : undefined;

    onCreate({
      id: generateId(),
      name: trimmed,
      description: description.trim() || undefined,
      color: selectedColor,
      icon: selectedIcon,
      phosphorIcon: logoUrl ? undefined : phosphorIcon,
      iconUrl: logoUrl || undefined,
      order: nextOrder,
      visible: true,
      createdAt: new Date().toISOString(),
      creatorId: creatorUserId,
      members: creatorMember ? [creatorMember] : [],
    });
  };

  const SelectedPhosphorIcon = phosphorIcon ? getPhosphorIcon(phosphorIcon) || CirclesFour : CirclesFour;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-[440px] mx-4 rounded-[14px] border shadow-xl overflow-hidden"
        style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <h3 className="text-[16px] font-semibold" style={{ color: "var(--text-primary)" }}>
            Create space
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Icon + Name row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIconPicker(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105"
              style={{
                background: `color-mix(in oklch, ${selectedColor} 14%, transparent)`,
                border: `1.5px solid color-mix(in oklch, ${selectedColor} 22%, transparent)`,
              }}
              title="Choose icon"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <SelectedPhosphorIcon size={26} weight="fill" style={{ color: selectedColor }} />
              )}
            </button>
            <div className="flex-1 space-y-1.5">
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleCreate(); if (e.key === "Escape") onClose(); }}
                placeholder="Space name"
                className="w-full bg-transparent outline-none text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleCreate(); if (e.key === "Escape") onClose(); }}
                placeholder="Description (optional)"
                className="w-full bg-transparent outline-none text-[12px]"
                style={{ color: "var(--text-tertiary)" }}
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-quaternary)" }}>
              Color
            </p>
            <div className="flex flex-wrap gap-2">
              {SPACE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    background: color,
                    outline: selectedColor === color ? "2.5px solid var(--accent-primary)" : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {selectedColor === color && <Check size={12} weight="bold" className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Logo upload */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-quaternary)" }}>
              Logo (optional)
            </p>
            <LogoUploadButton
              onUpload={setLogoUrl}
              onRemove={() => setLogoUrl(null)}
              hasLogo={!!logoUrl}
              color={selectedColor}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: "var(--border-default)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] text-[13px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-5 py-2 rounded-[8px] text-[13px] font-semibold text-white transition-colors disabled:opacity-40"
            style={{ background: "var(--accent-primary)" }}
          >
            Create space
          </button>
        </div>

        {/* Nested icon picker */}
        {showIconPicker && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10 rounded-[14px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-[12px] border shadow-xl w-[320px]"
              style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Choose icon</p>
                <button onClick={() => setShowIconPicker(false)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
                  <X size={14} style={{ color: "var(--text-tertiary)" }} />
                </button>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {QUICK_ICONS.map((iconName) => {
                  const Ic = getPhosphorIcon(iconName);
                  if (!Ic) return null;
                  const isActive = phosphorIcon === iconName;
                  return (
                    <button
                      key={iconName}
                      onClick={() => { setPhosphorIcon(iconName); setShowIconPicker(false); }}
                      className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-colors"
                      style={{
                        background: isActive ? `color-mix(in oklch, ${selectedColor} 16%, transparent)` : undefined,
                        border: isActive ? `1.5px solid ${selectedColor}` : "1.5px solid transparent",
                      }}
                      title={iconName}
                    >
                      <Ic size={17} weight={isActive ? "fill" : "regular"} style={{ color: isActive ? selectedColor : "var(--text-tertiary)" }} />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   UNASSIGNED PROJECTS PANEL
   ═══════════════════════════════════════════════════════════ */

function UnassignedProjectsPanel({
  spaces,
  onAssign,
}: {
  spaces: Space[];
  onAssign: (projectName: string, spaceId: string) => void;
}) {
  const { projects } = useData();
  const [assignDropdown, setAssignDropdown] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const unassigned = useMemo(() => {
    return Object.entries(projects).filter(([_, p]) => !p.spaceId && !p.archived);
  }, [projects]);

  useEffect(() => {
    if (!assignDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setAssignDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [assignDropdown]);

  if (unassigned.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
        <SquareHalf size={15} />
        Unassigned projects
        <span className="text-[11px] font-normal tabular-nums px-1.5 rounded-full" style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}>
          {unassigned.length}
        </span>
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {unassigned.map(([name, proj]) => (
          <div
            key={name}
            className="relative flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border transition-colors hover:border-[color-mix(in_oklch,var(--accent-primary)_30%,var(--border-default))]"
            style={{
              background: "var(--surface-bg)",
              borderColor: "var(--border-default)",
            }}
          >
            <ProjectIcon
              phosphorIcon={proj.phosphorIcon}
              iconUrl={proj.iconUrl}
              color={proj.color}
              size="md"
            />
            <span className="flex-1 truncate text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
              {name}
            </span>
            <div className="relative" ref={assignDropdown === name ? dropRef : undefined}>
              <button
                onClick={() => setAssignDropdown(assignDropdown === name ? null : name)}
                className="px-2 py-1 rounded-[5px] text-[11px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] flex items-center gap-1"
                style={{ color: "var(--text-quaternary)" }}
              >
                <Plus size={12} />
                Assign
              </button>
              {assignDropdown === name && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 z-50 w-[180px] py-1 rounded-[10px] border shadow-lg"
                  style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
                >
                  {spaces.map((s) => {
                    const SI = s.phosphorIcon ? getPhosphorIcon(s.phosphorIcon) || CirclesFour : CirclesFour;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { onAssign(name, s.id); setAssignDropdown(null); }}
                        className="flex items-center gap-2 w-full px-3 py-[6px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        style={{ fontSize: "13px", color: "var(--text-secondary)" }}
                      >
                        <SI size={14} weight="fill" style={{ color: s.color }} />
                        <span className="truncate">{s.name}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT — SpacesPage
   ═══════════════════════════════════════════════════════════ */

export function SpacesPage() {
  const { spaces, projects, docs, addSpace, updateSpace, deleteSpace, toggleSpaceVisibility, setProject } = useData();
  const { navigate } = useNavigation();
  const { user, profile } = useAuth();
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [peopleSpace, setPeopleSpace] = useState<Space | null>(null);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  const sortedSpaces = useMemo(() => {
    let list = [...spaces].sort((a, b) => a.order - b.order);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    if (filter === "visible") list = list.filter((s) => s.visible);
    if (filter === "hidden") list = list.filter((s) => !s.visible);
    return list;
  }, [spaces, search, filter]);

  const spaceStats = useMemo(() => {
    const stats: Record<string, { projects: number; docs: number; tasks: number }> = {};
    for (const s of spaces) {
      stats[s.id] = { projects: 0, docs: 0, tasks: 0 };
    }
    for (const [_, p] of Object.entries(projects)) {
      if (p.spaceId && stats[p.spaceId]) {
        stats[p.spaceId].projects++;
        stats[p.spaceId].tasks += p.tasks.length;
      }
    }
    for (const d of docs) {
      if (d.spaceId && stats[d.spaceId]) {
        stats[d.spaceId].docs++;
      }
    }
    return stats;
  }, [spaces, projects, docs]);

  const handleAssignProject = useCallback(
    (projectName: string, spaceId: string) => {
      const proj = projects[projectName];
      if (!proj) return;
      setProject(projectName, { ...proj, spaceId });
      const space = spaces.find((s) => s.id === spaceId);
      toast.success(`Moved "${projectName}" to ${space?.name || "space"}`);
    },
    [projects, setProject, spaces],
  );

  const handleDeleteSpace = useCallback(
    (spaceId: string) => {
      const space = spaces.find((s) => s.id === spaceId);
      deleteSpace(spaceId);
      haptic("medium");
      toast.success(`Deleted "${space?.name || "space"}"`);
    },
    [spaces, deleteSpace],
  );

  const visibleCount = spaces.filter((s) => s.visible).length;

  return (
    <div className="max-w-[1200px] mx-auto space-y-5">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <CirclesFour className="w-7 h-7" weight="fill" style={{ color: "var(--accent-primary)" }} />
          <h1 style={{ color: "var(--text-primary)", fontSize: "28px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            Spaces
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search spaces…"
            activeFilterCount={filter !== "all" ? 1 : 0}
            onFilterClick={() => setFilter(filter === "all" ? "visible" : filter === "visible" ? "hidden" : "all")}
            hideSort
            hideGroup
            hideOptions
          />

          <button
            onClick={() => { setCreating(true); haptic("light"); }}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ background: "#FA6863" }}
          >
            <Plus size={16} weight="bold" />
            <span className="hidden sm:inline">New Space</span>
          </button>
        </div>
      </div>

      {/* ── Visibility Toggles ── */}
      <VisibilityTogglesPanel
        spaces={[...spaces].sort((a, b) => a.order - b.order)}
        onToggle={(spaceId) => { haptic("selection"); toggleSpaceVisibility(spaceId); }}
      />

      {/* ── Section Header ── */}
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--text-primary)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Spaces
        </span>
        <span
          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
          style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}
        >
          {sortedSpaces.length}
        </span>
      </div>

      {/* ── Spaces Grid ── */}
      {sortedSpaces.length === 0 && spaces.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 rounded-[16px] border-2 border-dashed"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div
            className="w-16 h-16 rounded-[14px] flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-primary-subtle)" }}
          >
            <CirclesFour size={32} weight="fill" style={{ color: "var(--accent-primary)" }} />
          </div>
          <h2 className="text-[18px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            No spaces yet
          </h2>
          <p className="text-[13px] mb-5 max-w-[340px] mx-auto" style={{ color: "var(--text-tertiary)" }}>
            Spaces let you organize projects and docs into separate workspaces — for teams, departments, or categories.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white"
            style={{ background: "var(--accent-primary)" }}
          >
            <Plus size={15} weight="bold" />
            Create your first space
          </button>
        </motion.div>
      ) : sortedSpaces.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-[14px]" style={{ color: "var(--text-quaternary)" }}>
            No spaces match your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {sortedSpaces.map((space) => {
              const stats = spaceStats[space.id] || { projects: 0, docs: 0, tasks: 0 };
              const userRole = getUserSpaceRole(space, user?.id);
              return (
                <SpaceCard
                  key={space.id}
                  space={space}
                  projectCount={stats.projects}
                  docCount={stats.docs}
                  taskCount={stats.tasks}
                  userRole={userRole}
                  onEdit={(updates) => updateSpace(space.id, updates)}
                  onDelete={() => handleDeleteSpace(space.id)}
                  onToggleVisibility={() => { haptic("selection"); toggleSpaceVisibility(space.id); }}
                  onManagePeople={() => setPeopleSpace(space)}
                  onOpenSpace={() => {
                    haptic("light");
                    navigate("space-detail", { spaceId: space.id });
                  }}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Unassigned Projects ── */}
      {spaces.length > 0 && (
        <UnassignedProjectsPanel spaces={spaces} onAssign={handleAssignProject} />
      )}

      {/* ── Create Modal ── */}
      <AnimatePresence>
        {creating && (
          <CreateSpaceModal
            onClose={() => setCreating(false)}
            nextOrder={spaces.length}
            onCreate={(space) => {
              addSpace(space);
              setCreating(false);
              haptic("success");
              toast.success(`Created "${space.name}" space`);
            }}
            creatorUserId={user?.id}
            creatorName={profile?.displayName || user?.email?.split("@")[0]}
            creatorEmail={user?.email || undefined}
            creatorAvatarUrl={profile?.avatarUrl || undefined}
            creatorAvatarColor={profile?.avatarColor || undefined}
          />
        )}
      </AnimatePresence>

      {/* ── People Manager ── */}
      <AnimatePresence>
        {peopleSpace && (
          <SpacePeopleManager
            space={peopleSpace}
            onClose={() => setPeopleSpace(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}