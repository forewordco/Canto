/* ===================================================================
   DOC ICON PICKER — Popover to choose a custom icon for a document.
   
   Shows a grid of categorized Phosphor icons. The selected icon name
   is stored on WorkspaceDoc.icon and rendered via DocIconDisplay.
   =================================================================== */

import { useState, useRef, useEffect } from "react";
import {
  ClipboardText,
  Pencil,
  VideoCamera,
  FilmScript,
  FileText,
  Notebook,
  BookOpen,
  Article,
  Newspaper,
  Lightbulb,
  Star,
  Heart,
  Lightning,
  Flag,
  Rocket,
  Target,
  Trophy,
  Briefcase,
  Buildings,
  House,
  GraduationCap,
  ChartLine,
  Gear,
  Wrench,
  Palette,
  Camera,
  Microphone,
  MusicNote,
  Globe,
  MapPin,
  Clock,
  CalendarBlank,
  ChatCircle,
  EnvelopeSimple,
  Phone,
  Users,
  UserCircle,
  ShieldCheck,
  Lock,
  Key,
  Leaf,
  Sun,
  Moon,
  Cloud,
  Fire,
  Drop,
  Sparkle,
  Diamond,
  Crown,
  Smiley,
  X,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { motion } from "motion/react";

/* ─── Icon Registry ─── */
export const DOC_ICON_MAP: Record<string, React.ElementType> = {
  "clipboard-text": ClipboardText,
  pencil: Pencil,
  "video-camera": VideoCamera,
  "film-script": FilmScript,
  "file-text": FileText,
  notebook: Notebook,
  "book-open": BookOpen,
  article: Article,
  newspaper: Newspaper,
  lightbulb: Lightbulb,
  star: Star,
  heart: Heart,
  lightning: Lightning,
  flag: Flag,
  rocket: Rocket,
  target: Target,
  trophy: Trophy,
  briefcase: Briefcase,
  buildings: Buildings,
  house: House,
  "graduation-cap": GraduationCap,
  "chart-line": ChartLine,
  gear: Gear,
  wrench: Wrench,
  palette: Palette,
  camera: Camera,
  microphone: Microphone,
  "music-note": MusicNote,
  globe: Globe,
  "map-pin": MapPin,
  clock: Clock,
  "calendar-blank": CalendarBlank,
  "chat-circle": ChatCircle,
  "envelope-simple": EnvelopeSimple,
  phone: Phone,
  users: Users,
  "user-circle": UserCircle,
  "shield-check": ShieldCheck,
  lock: Lock,
  key: Key,
  leaf: Leaf,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  fire: Fire,
  drop: Drop,
  sparkle: Sparkle,
  diamond: Diamond,
  crown: Crown,
  smiley: Smiley,
};

const ICON_ENTRIES = Object.entries(DOC_ICON_MAP);

/* ─── Color options for icon background ─── */
const ICON_BG_COLORS = [
  { value: "#FA6863", label: "Coral" },
  { value: "#F59145", label: "Orange" },
  { value: "#EAB308", label: "Gold" },
  { value: "#22C55E", label: "Green" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#64748B", label: "Slate" },
];

/* ═══ DocIconDisplay — Renders a doc icon with colored bg badge ═══ */
export function DocIconDisplay({
  iconName,
  color,
  size = "md",
}: {
  iconName?: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = iconName ? DOC_ICON_MAP[iconName] : null;
  if (!Icon) return null;

  const sizes = {
    sm: { box: "w-5 h-5", icon: "w-3 h-3", radius: "3px" },
    md: { box: "w-7 h-7", icon: "w-4 h-4", radius: "5px" },
    lg: { box: "w-10 h-10", icon: "w-5 h-5", radius: "8px" },
  };
  const s = sizes[size];

  return (
    <div
      className={`${s.box} rounded-[${s.radius}] flex items-center justify-center shrink-0`}
      style={{ background: `${color}15`, borderRadius: s.radius }}
    >
      <Icon className={s.icon} style={{ color }} />
    </div>
  );
}

/* ═══ DocIconPickerPopover ═══ */
interface DocIconPickerProps {
  currentIcon?: string;
  onSelect: (iconName: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function DocIconPickerPopover({
  currentIcon,
  onSelect,
  onRemove,
  onClose,
}: DocIconPickerProps) {
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filteredIcons = search
    ? ICON_ENTRIES.filter(([name]) =>
        name.replace(/-/g, " ").includes(search.toLowerCase())
      )
    : ICON_ENTRIES;

  return (
    <motion.div
      ref={ref}
      className="w-[280px] rounded-[8px] shadow-lg border overflow-hidden"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.1 }}
    >
      {/* Search */}
      <div className="px-2 pt-2 pb-1">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-[5px]"
          style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
        >
          <MagnifyingGlass className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons..."
            className="flex-1 bg-transparent outline-none"
            style={{ color: "var(--text-primary)", fontSize: "12px" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "var(--text-quaternary)" }}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Remove button */}
      {currentIcon && (
        <button
          onClick={() => { onRemove(); onClose(); }}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
        >
          <X className="w-3.5 h-3.5" />
          Remove icon
        </button>
      )}

      {/* Icon grid */}
      <div className="px-2 pb-2 max-h-[200px] overflow-y-auto">
        <div className="grid grid-cols-8 gap-0.5">
          {filteredIcons.map(([name, Icon]) => (
            <button
              key={name}
              onClick={() => { onSelect(name); onClose(); }}
              className={`w-8 h-8 flex items-center justify-center rounded-[5px] transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06] ${
                currentIcon === name ? "ring-1.5 ring-[var(--accent-primary)] bg-[var(--accent-primary-subtle)]" : ""
              }`}
              style={{ color: currentIcon === name ? "var(--accent-primary)" : "var(--text-secondary)" }}
              title={name.replace(/-/g, " ")}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        {filteredIcons.length === 0 && (
          <div className="text-center py-4" style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>
            No icons found
          </div>
        )}
      </div>
    </motion.div>
  );
}
