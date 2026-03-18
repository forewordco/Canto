/* ===================================================================
   PROJECT FILES — Attachments gallery sub-view.

   Grid display of project attachments (images, videos, links,
   documents, galleries, travel). Supports adding and removing.
   Type-specific cards with thumbnails, descriptions, and metadata.

   Phase 5-6 of Canto build plan.
   =================================================================== */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  VideoCamera,
  LinkSimple,
  FileText,
  Images,
  Airplane,
  Plus,
  Trash,
  DotsThree,
  MagnifyingGlass,
  X,
  ArrowSquareOut,
  Eye,
  SquareHalf,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { ProjectAttachment, TravelItem } from "../lib/types";

/* ─── Type config ─── */

interface TypeConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const TYPE_CONFIG: Record<ProjectAttachment["type"], TypeConfig> = {
  image: {
    label: "Image",
    icon: ImageIcon,
    color: "oklch(0.55 0.2 280)",
    bg: "oklch(0.55 0.2 280 / 0.08)",
  },
  video: {
    label: "Video",
    icon: VideoCamera,
    color: "oklch(0.7 0.18 25)",
    bg: "oklch(0.7 0.18 25 / 0.08)",
  },
  link: {
    label: "Link",
    icon: LinkSimple,
    color: "oklch(0.65 0.15 180)",
    bg: "oklch(0.65 0.15 180 / 0.08)",
  },
  document: {
    label: "Document",
    icon: FileText,
    color: "oklch(0.72 0.17 55)",
    bg: "oklch(0.72 0.17 55 / 0.08)",
  },
  gallery: {
    label: "Gallery",
    icon: Images,
    color: "oklch(0.6 0.2 310)",
    bg: "oklch(0.6 0.2 310 / 0.08)",
  },
  travel: {
    label: "Travel",
    icon: Airplane,
    color: "oklch(0.65 0.18 200)",
    bg: "oklch(0.65 0.18 200 / 0.08)",
  },
};

const FILTER_TYPES: ProjectAttachment["type"][] = ["image", "video", "link", "document", "gallery", "travel"];

/* ─── Props ─── */

interface ProjectFilesProps {
  attachments: ProjectAttachment[];
  onAdd: (attachment: ProjectAttachment) => void;
  onRemove: (id: string) => void;
  projectColor?: string;
}

/* ─── Attachment Card ─── */

function AttachmentCard({
  attachment,
  onRemove,
}: {
  attachment: ProjectAttachment;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const config = TYPE_CONFIG[attachment.type];
  const TypeIcon = config.icon;
  const hasThumb = attachment.thumbnailUrl || (attachment.type === "image" && attachment.url);
  const thumbUrl = attachment.thumbnailUrl || attachment.url;

  return (
    <>
      <div
        className="group/card rounded-[8px] overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
        style={{
          background: "var(--surface-bg)",
          border: "1px solid var(--border-default)",
        }}
        onClick={() => {
          if (attachment.type === "link") {
            window.open(attachment.url, "_blank", "noopener");
          } else {
            setPreview(true);
          }
        }}
      >
        {/* Thumbnail / preview area */}
        {hasThumb && (attachment.type === "image" || attachment.type === "gallery") ? (
          <div className="relative aspect-video overflow-hidden bg-black/5">
            <ImageWithFallback
              src={thumbUrl}
              alt={attachment.name}
              className="w-full h-full object-cover transition-transform group-hover/card:scale-[1.02]"
            />
            {attachment.type === "gallery" && attachment.images && attachment.images.length > 1 && (
              <div
                className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
                style={{ background: "oklch(0 0 0 / 0.6)", color: "white", fontSize: "10px", fontWeight: 600 }}
              >
                <Images className="w-3 h-3" />
                {attachment.images.length}
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors flex items-center justify-center">
              <Eye
                className="w-6 h-6 text-white opacity-0 group-hover/card:opacity-80 transition-opacity"
                weight="bold"
              />
            </div>
          </div>
        ) : attachment.type === "video" && thumbUrl ? (
          <div className="relative aspect-video overflow-hidden bg-black/5">
            <ImageWithFallback
              src={thumbUrl}
              alt={attachment.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0 0 0 / 0.5)" }}
              >
                <VideoCamera className="w-5 h-5 text-white" weight="fill" />
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-6"
            style={{ background: config.bg }}
          >
            <TypeIcon className="w-8 h-8" style={{ color: config.color, opacity: 0.6 }} />
          </div>
        )}

        {/* Info area */}
        <div className="px-3 py-2.5">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h4
                className="truncate"
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  lineHeight: 1.3,
                }}
              >
                {attachment.name}
              </h4>
              {attachment.description && (
                <p
                  className="mt-0.5 line-clamp-2"
                  style={{ fontSize: "11px", color: "var(--text-tertiary)", lineHeight: 1.4 }}
                >
                  {attachment.description}
                </p>
              )}
            </div>

            {/* Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="p-1 rounded-[4px] opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-black/[0.04]"
                style={{ color: "var(--text-quaternary)" }}
              >
                <DotsThree className="w-4 h-4" weight="bold" />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 top-full mt-1 py-1 rounded-[6px] shadow-lg z-50 min-w-[120px]"
                    style={{
                      background: "var(--surface-bg)",
                      border: "1px solid var(--border-default)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {attachment.url && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                        style={{ fontSize: "12px", color: "var(--text-secondary)" }}
                      >
                        <ArrowSquareOut className="w-3.5 h-3.5" />
                        Open
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                        setMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                      style={{ fontSize: "12px", color: "oklch(0.7 0.18 25)" }}
                    >
                      <Trash className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Type + meta */}
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
              style={{ background: config.bg, color: config.color, fontSize: "10px", fontWeight: 600 }}
            >
              <TypeIcon className="w-3 h-3" />
              {config.label}
            </span>

            {/* Travel budget total */}
            {attachment.type === "travel" && attachment.travelItems && attachment.travelItems.length > 0 && (
              <span
                className="inline-flex items-center gap-0.5"
                style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 500 }}
              >
                <CurrencyDollar className="w-3 h-3" />
                {attachment.travelItems.reduce((sum, ti) => sum + ti.amount, 0).toLocaleString()}
              </span>
            )}

            {/* Gallery count */}
            {attachment.type === "gallery" && attachment.images && (
              <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
                {attachment.images.length} images
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal for images */}
      <AnimatePresence>
        {preview && (attachment.type === "image" || attachment.type === "gallery") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
            onClick={() => setPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageWithFallback
                src={attachment.type === "gallery" && attachment.images?.[0]?.url ? attachment.images[0].url : attachment.url}
                alt={attachment.name}
                className="max-w-full max-h-[85vh] object-contain rounded-[8px]"
              />
              <button
                onClick={() => setPreview(false)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "oklch(0 0 0 / 0.7)", color: "white" }}
              >
                <X className="w-4 h-4" weight="bold" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Travel Breakdown ─── */

function TravelBreakdown({ items }: { items: TravelItem[] }) {
  const byCategory = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const item of items) {
      const existing = map.get(item.category) || { total: 0, count: 0 };
      existing.total += item.amount;
      existing.count += 1;
      map.set(item.category, existing);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [items]);

  const total = items.reduce((s, i) => s + i.amount, 0);

  return (
    <div
      className="rounded-[8px] p-3"
      style={{
        background: "var(--neutral-50)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
          BUDGET BREAKDOWN
        </span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
          ${total.toLocaleString()}
        </span>
      </div>
      <div className="space-y-1">
        {byCategory.map(([cat, info]) => (
          <div key={cat} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "oklch(0.65 0.18 200)" }}
              />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                {cat}
              </span>
              <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
                ({info.count})
              </span>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
              ${info.total.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export function ProjectFiles({
  attachments,
  onAdd,
  onRemove,
  projectColor,
}: ProjectFilesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ProjectAttachment["type"] | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<ProjectAttachment["type"]>("link");
  const [newDescription, setNewDescription] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addOpen) setTimeout(() => nameRef.current?.focus(), 50);
  }, [addOpen]);

  const filtered = useMemo(() => {
    let result = attachments;
    if (typeFilter !== "all") {
      result = result.filter((a) => a.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [attachments, typeFilter, searchQuery]);

  // Travel items from travel attachments
  const allTravelItems = useMemo(() => {
    return attachments
      .filter((a) => a.type === "travel" && a.travelItems)
      .flatMap((a) => a.travelItems || []);
  }, [attachments]);

  const handleAdd = useCallback(() => {
    if (!newName.trim()) return;
    const att: ProjectAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: newName.trim(),
      url: newUrl.trim() || "#",
      type: newType,
      description: newDescription.trim() || undefined,
    };
    onAdd(att);
    setNewName("");
    setNewUrl("");
    setNewDescription("");
    setAddOpen(false);
  }, [newName, newUrl, newType, newDescription, onAdd]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of attachments) {
      counts.set(a.type, (counts.get(a.type) || 0) + 1);
    }
    return counts;
  }, [attachments]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <SquareHalf className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em" }}>
            FILES
          </span>
          <span
            className="px-1.5 py-0.5 rounded"
            style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 600 }}
          >
            {attachments.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Search */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-[6px]"
            style={{ border: "1px solid var(--border-default)" }}
          >
            <MagnifyingGlass className="w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent outline-none w-24 sm:w-32"
              style={{ fontSize: "12px", color: "var(--text-primary)" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={{ color: "var(--text-quaternary)" }}>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Add button */}
          <button
            onClick={() => setAddOpen(!addOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] transition-colors hover:bg-black/[0.04]"
            style={{
              color: addOpen ? "var(--accent-primary)" : "var(--text-tertiary)",
              fontSize: "12px",
              fontWeight: 500,
              border: "1px solid var(--border-default)",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => setTypeFilter("all")}
          className="px-2 py-1 rounded-full transition-colors"
          style={{
            background: typeFilter === "all" ? "var(--accent-primary)" : "var(--neutral-100)",
            color: typeFilter === "all" ? "white" : "var(--text-tertiary)",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          All ({attachments.length})
        </button>
        {FILTER_TYPES.map((type) => {
          const count = typeCounts.get(type) || 0;
          if (count === 0) return null;
          const conf = TYPE_CONFIG[type];
          const Icon = conf.icon;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
              className="flex items-center gap-1 px-2 py-1 rounded-full transition-colors"
              style={{
                background: typeFilter === type ? conf.bg : "var(--neutral-100)",
                color: typeFilter === type ? conf.color : "var(--text-quaternary)",
                fontSize: "11px",
                fontWeight: 500,
                border: typeFilter === type ? `1px solid ${conf.color}40` : "1px solid transparent",
              }}
            >
              <Icon className="w-3 h-3" />
              {conf.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-[8px] p-3 space-y-2"
              style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
            >
              <div className="flex items-center gap-2">
                <input
                  ref={nameRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="File name..."
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: "13px", color: "var(--text-primary)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as ProjectAttachment["type"])}
                  className="rounded-[4px] px-2 py-1 text-xs outline-none cursor-pointer"
                  style={{
                    background: "var(--surface-bg)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-secondary)",
                    fontFamily: "'Albert Sans', sans-serif",
                  }}
                >
                  {FILTER_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                  ))}
                </select>
              </div>
              <input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="URL..."
                className="w-full bg-transparent outline-none"
                style={{ fontSize: "12px", color: "var(--text-secondary)" }}
              />
              <input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full bg-transparent outline-none"
                style={{ fontSize: "12px", color: "var(--text-tertiary)" }}
              />
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  onClick={() => setAddOpen(false)}
                  className="px-2.5 py-1 rounded-[6px] transition-colors hover:bg-black/[0.04]"
                  style={{ fontSize: "12px", color: "var(--text-tertiary)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="px-3 py-1 rounded-[6px] transition-colors disabled:opacity-40"
                  style={{ background: "var(--accent-primary)", color: "white", fontSize: "12px", fontWeight: 600 }}
                >
                  Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Travel budget breakdown */}
      {allTravelItems.length > 0 && (typeFilter === "all" || typeFilter === "travel") && (
        <TravelBreakdown items={allTravelItems} />
      )}

      {/* Files grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((att) => (
            <AttachmentCard
              key={att.id}
              attachment={att}
              onRemove={() => onRemove(att.id)}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-[8px]"
          style={{ color: "var(--text-quaternary)", background: "var(--neutral-50)" }}
        >
          <SquareHalf className="w-8 h-8 mb-2" />
          <p style={{ fontSize: "14px", fontWeight: 500 }}>
            {searchQuery || typeFilter !== "all" ? "No matching files" : "No files yet"}
          </p>
          <p className="mt-1" style={{ fontSize: "12px" }}>
            {searchQuery ? "Try a different search" : "Add links, images, videos, or documents"}
          </p>
        </div>
      )}
    </div>
  );
}