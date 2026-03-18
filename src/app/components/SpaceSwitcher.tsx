import { useState, useRef, useEffect, type ElementType } from "react";
import {
  Plus,
  CaretDown,
  CaretRight,
  DotsThree,
  Trash,
  PencilSimple,
  Check,
  Planet,
  Briefcase,
  UsersThree,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData } from "../lib/data";
import type { Space } from "../lib/types";
import type { NavId } from "../lib/navigation";
import { toast } from "sonner";

/* ─── Default space colors ─── */
const SPACE_COLORS = [
  "oklch(0.65 0.18 25)",   // coral-red
  "oklch(0.7 0.15 155)",   // emerald
  "oklch(0.65 0.16 250)",  // blue
  "oklch(0.65 0.16 290)",  // violet
  "oklch(0.8 0.14 80)",    // amber
  "oklch(0.65 0.12 340)",  // pink
  "oklch(0.6 0.14 200)",   // teal
  "oklch(0.6 0.1 30)",     // burnt orange
];

/* ─── Default space icons ─── */
const SPACE_ICONS = ["🏢", "🏠", "👤", "🎨", "🚀", "📦", "💼", "🌱", "⭐", "🔬"];

function generateId() {
  return `space-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ═══════════════════════════════════════════════════════════
   SPACE TOGGLE ROW
   ═════════��═════════════════════════════════════════════════ */

function SpaceRow({
  space,
  onToggle,
  onEdit,
  onDelete,
}: {
  space: Space;
  onToggle: () => void;
  onEdit: (updates: Partial<Space>) => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(space.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== space.name) {
      onEdit({ name: trimmed });
    }
    setEditing(false);
  };

  const projectCount = useSpaceProjectCount(space.id);

  return (
    <div className="group flex items-center gap-1.5 px-1 py-[3px] rounded-[6px] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
      {/* Icon */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[13px] shrink-0"
        style={{ background: space.color.replace(")", " / 0.15)") }}
      >
        {space.icon}
      </div>

      {/* Name or edit input */}
      {editing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") { setEditName(space.name); setEditing(false); }
          }}
          onBlur={commitEdit}
          className="flex-1 min-w-0 bg-transparent outline-none border-b"
          style={{
            fontSize: "13px",
            color: "var(--text-primary)",
            borderColor: "var(--accent-primary)",
          }}
        />
      ) : (
        <span
          className="flex-1 min-w-0 truncate"
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: space.visible ? "var(--text-primary)" : "var(--text-quaternary)",
          }}
        >
          {space.name}
        </span>
      )}

      {/* Project count */}
      {!editing && (
        <span
          className="text-[10px] shrink-0 tabular-nums"
          style={{ color: "var(--text-quaternary)" }}
        >
          {projectCount}
        </span>
      )}

      {/* Toggle switch */}
      {!editing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 relative w-[30px] h-[16px] rounded-full transition-colors duration-200 cursor-pointer"
          style={{
            background: space.visible ? space.color : "var(--border-default)",
          }}
          title={space.visible ? "Hide space" : "Show space"}
        >
          <div
            className="absolute top-[2px] w-[12px] h-[12px] rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{
              transform: space.visible ? "translateX(16px)" : "translateX(2px)",
            }}
          />
        </button>
      )}

      {/* Context menu button */}
      {!editing && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="w-5 h-5 flex items-center justify-center rounded-[4px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/[0.05] dark:hover:bg-white/[0.05]"
            style={{ color: "var(--text-quaternary)" }}
          >
            <DotsThree className="w-3.5 h-3.5" weight="bold" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-50 w-[140px] py-1 rounded-[8px] border shadow-lg"
              style={{
                background: "var(--surface-bg)",
                borderColor: "var(--border-default)",
              }}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setEditName(space.name);
                  setEditing(true);
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                style={{ fontSize: "13px", color: "var(--text-secondary)" }}
              >
                <PencilSimple className="w-3.5 h-3.5" />
                Rename
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                style={{ fontSize: "13px", color: "oklch(0.65 0.2 25)" }}
              >
                <Trash className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Count projects belonging to a space */
function useSpaceProjectCount(spaceId: string): number {
  const { projects } = useData();
  let count = 0;
  for (const proj of Object.values(projects)) {
    if (proj.spaceId === spaceId) count++;
  }
  return count;
}

/* ═══════════════════════════════════════════════════════════
   CREATE SPACE INLINE FORM
   ═══════════════════════════════════════════════════════════ */

function CreateSpaceForm({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (space: Space) => void;
}) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(SPACE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(SPACE_ICONS[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { spaces } = useData();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({
      id: generateId(),
      name: trimmed,
      color: selectedColor,
      icon: selectedIcon,
      order: spaces.length,
      visible: true,
      createdAt: new Date().toISOString(),
    });
    setName("");
  };

  return (
    <div
      className="rounded-[8px] border p-2.5 space-y-2"
      style={{
        background: "var(--surface-raised)",
        borderColor: "var(--border-default)",
      }}
    >
      {/* Name input */}
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Space name..."
        className="w-full bg-transparent outline-none px-1.5 py-1 rounded-[5px] border"
        style={{
          fontSize: "13px",
          color: "var(--text-primary)",
          borderColor: "var(--border-default)",
        }}
      />

      {/* Icon picker row */}
      <div className="flex flex-wrap gap-1">
        {SPACE_ICONS.map((icon) => (
          <button
            key={icon}
            onClick={() => setSelectedIcon(icon)}
            className="w-7 h-7 rounded-[5px] flex items-center justify-center text-[14px] transition-colors"
            style={{
              background: selectedIcon === icon ? "var(--accent-primary-subtle)" : undefined,
              border: selectedIcon === icon ? "1px solid var(--accent-primary)" : "1px solid transparent",
            }}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Color picker row */}
      <div className="flex flex-wrap gap-1">
        {SPACE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            className="w-5 h-5 rounded-full flex items-center justify-center transition-transform"
            style={{
              background: color,
              transform: selectedColor === color ? "scale(1.2)" : undefined,
              outline: selectedColor === color ? "2px solid var(--accent-primary)" : undefined,
              outlineOffset: "2px",
            }}
          >
            {selectedColor === color && (
              <Check className="w-3 h-3 text-white" weight="bold" />
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] text-white transition-colors disabled:opacity-40"
          style={{
            background: "var(--accent-primary)",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <Check className="w-3 h-3" weight="bold" />
          Create
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-2.5 py-1 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-tertiary)",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN SPACE SWITCHER COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function SpaceSwitcher({ collapsed, activeNav, onNavClick }: { collapsed: boolean; activeNav?: NavId; onNavClick?: (id: NavId) => void }) {
  const { spaces, addSpace, updateSpace, deleteSpace, toggleSpaceVisibility } = useData();
  const [expanded, setExpanded] = useState(true);
  const [creating, setCreating] = useState(false);

  const sortedSpaces = [...spaces].sort((a, b) => a.order - b.order);
  const visibleCount = spaces.filter((s) => s.visible).length;

  if (collapsed) return null;

  /* ─── Built-in nav items within Spaces ─── */
  const spaceNavItems: { id: NavId; label: string; icon: ElementType }[] = [
    { id: "clients-list", label: "Clients", icon: Briefcase },
    { id: "team", label: "Team", icon: UsersThree },
  ];

  return (
    <div className="mt-1">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full px-1.5 py-1 rounded-[5px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
      >
        {expanded ? (
          <CaretDown className="w-3 h-3 shrink-0" style={{ color: "var(--text-quaternary)" }} />
        ) : (
          <CaretRight className="w-3 h-3 shrink-0" style={{ color: "var(--text-quaternary)" }} />
        )}
        <Planet className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
        <span
          className="text-[11px] font-semibold uppercase tracking-wider flex-1 text-left"
          style={{ color: "var(--text-quaternary)" }}
        >
          Spaces
        </span>
        {spaces.length > 0 && (
          <span
            className="text-[10px] tabular-nums px-1 rounded-[3px]"
            style={{
              color: "var(--text-quaternary)",
              background: "var(--surface-raised)",
            }}
          >
            {visibleCount}/{spaces.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-0.5 space-y-0.5">
              {sortedSpaces.length === 0 && !creating && (
                <div
                  className="px-2 py-2 text-center rounded-[6px]"
                  style={{
                    fontSize: "12px",
                    color: "var(--text-quaternary)",
                  }}
                >
                  No spaces yet
                </div>
              )}

              {sortedSpaces.map((space) => (
                <SpaceRow
                  key={space.id}
                  space={space}
                  onToggle={() => toggleSpaceVisibility(space.id)}
                  onEdit={(updates) => updateSpace(space.id, updates)}
                  onDelete={() => {
                    deleteSpace(space.id);
                    toast.success(`Deleted "${space.name}" space`);
                  }}
                />
              ))}

              {/* Create form or button */}
              {creating ? (
                <CreateSpaceForm
                  onCancel={() => setCreating(false)}
                  onCreate={(space) => {
                    addSpace(space);
                    setCreating(false);
                    toast.success(`Created "${space.name}" space`);
                  }}
                />
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-1.5 w-full px-1.5 py-1 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ color: "var(--text-quaternary)", fontSize: "12px" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add space</span>
                </button>
              )}

              {/* Built-in nav items: Clients & Team */}
              {onNavClick && (
                <div className="pt-1 mt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
                  {spaceNavItems.map((item) => {
                    const isActive = activeNav === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavClick(item.id)}
                        className={`flex items-center gap-2 w-full rounded-[6px] px-1.5 py-[5px] transition-all duration-150 ${isActive ? "" : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"}`}
                        style={{
                          background: isActive ? "var(--accent-primary-subtle)" : undefined,
                          color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
                          fontSize: "13px",
                          fontWeight: isActive ? 500 : 400,
                        }}
                      >
                        <item.icon className="w-[16px] h-[16px] shrink-0" weight={isActive ? "fill" : "regular"} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}