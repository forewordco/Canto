/* ===================================================================
   PROJECT RESOURCES — Full-featured resource section for project pages.
   Supports: links, videos, image galleries, travel details, documents.
   =================================================================== */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  X,
  LinkSimple,
  VideoCamera,
  Image as ImageIcon,
  AirplaneTakeoff,
  FileText,
  MagnifyingGlass,
  UploadSimple,
  ArrowLeft,
  ArrowRight,
  DotsSixVertical,
  Trash,
  PencilSimple,
  CarProfile,
  Bed,
  Hamburger,
  Backpack,
  Airplane,
  MapPin,
} from "@phosphor-icons/react";
import type { ProjectAttachment, TravelItem } from "../lib/types";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { setDragData, type DragPayload } from "../lib/drag-context";

/* ── Color constants (hex for compatibility) ── */
const COLORS = {
  doc: "#6C63FF",
  link: "#6159e1",
  video: "#fa6863",
  gallery: "#E67E22",
  travel: "#2ECC71",
  meeting: "#F59E0B",
  note: "#10B981",
  script: "#E11D48",
  text1: "#1a1a1a",
  text2: "#444",
  text3: "#6f6e6f",
  text4: "#999",
  border: "#eceae9",
  borderDash: "#e0dedd",
  bg: "#fafaf9",
  card: "#fff",
};

const TRAVEL_CATEGORIES = [
  { value: "flight" as const, label: "Flight", icon: Airplane, color: "#8B5CF6" },
  { value: "stay" as const, label: "Stay", icon: Bed, color: "#F59E0B" },
  { value: "car_rental" as const, label: "Car Rental", icon: CarProfile, color: "#8B5CF6" },
  { value: "gear" as const, label: "Gear", icon: Backpack, color: "#10B981" },
  { value: "food" as const, label: "Food", icon: Hamburger, color: "#fa6863" },
  { value: "parking" as const, label: "Parking", icon: MapPin, color: "#3B82F6" },
] as const;

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`;
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return url;
  return null;
}

function formatCost(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ═══════════════════════════════════════════════════════════
   RESOURCE CARD
   ═══════════════════════════════════════════════════════════ */

function ResourceCard({
  att,
  onClick,
  onRemove,
}: {
  att: ProjectAttachment;
  onClick: () => void;
  onRemove: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const iconMap: Record<string, { Icon: React.ElementType; color: string }> = {
    video: { Icon: VideoCamera, color: COLORS.video },
    link: { Icon: LinkSimple, color: COLORS.link },
    gallery: { Icon: ImageIcon, color: COLORS.gallery },
    image: { Icon: ImageIcon, color: COLORS.gallery },
    document: { Icon: FileText, color: COLORS.doc },
    travel: { Icon: AirplaneTakeoff, color: COLORS.travel },
  };

  const { Icon, color } = iconMap[att.type] || { Icon: FileText, color: COLORS.text3 };

  // Determine metadata line
  let meta: string | null = null;
  if (att.type === "link" && att.url) meta = getDomain(att.url);
  if (att.type === "video" && att.url) meta = getDomain(att.url);
  if (att.type === "gallery") {
    const count = att.images?.length || 0;
    if (count > 0) meta = `${count} image${count !== 1 ? "s" : ""}`;
  }
  if (att.type === "travel") {
    const items = att.travelItems || [];
    const total = items.reduce((s, i) => s + (i.cost || 0), 0);
    const parts: string[] = [];
    if (items.length > 0) parts.push(`${items.length} item${items.length !== 1 ? "s" : ""}`);
    if (total > 0) parts.push(formatCost(total));
    if (parts.length > 0) meta = parts.join(" \u00B7 ");
  }

  // Use thumbnail for gallery if available
  const hasThumbnail = (att.type === "gallery" && att.images && att.images.length > 0) ||
    (att.type === "image" && att.url);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        const payload: DragPayload = {
          type: "resource",
          id: att.id,
          title: att.name || att.type,
          resourceType: att.type,
          resourceUrl: att.url,
        };
        setDragData(e, payload);
      }}
      className="relative flex items-center gap-2.5 shrink-0 cursor-pointer transition-all"
      style={{
        padding: "10px 11px",
        borderRadius: "10px",
        border: `1px solid ${COLORS.border}`,
        background: COLORS.card,
        boxShadow: hovered ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
        minWidth: "120px",
        maxWidth: "220px",
      }}
    >
      {/* Icon / Thumbnail */}
      {hasThumbnail ? (
        <img
          src={att.type === "image" ? att.url! : att.images![0].url}
          alt=""
          className="shrink-0 object-cover"
          style={{ width: 28, height: 28, borderRadius: 6 }}
        />
      ) : (
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: `${color}20`,
          }}
        >
          <Icon weight="fill" size={15} style={{ color }} />
        </div>
      )}

      {/* Text */}
      <div className="min-w-0">
        <p
          className="truncate"
          style={{
            color: COLORS.text1,
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.3,
            maxWidth: "140px",
          }}
        >
          {att.name}
        </p>
        {meta && (
          <p
            className="truncate"
            style={{
              color: COLORS.text4,
              fontSize: "11px",
              lineHeight: 1.3,
              marginTop: "1px",
            }}
          >
            {meta}
          </p>
        )}
      </div>

      {/* Remove button */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute flex items-center justify-center transition-colors"
          style={{
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#f0efee",
            color: COLORS.text3,
            border: `1px solid ${COLORS.border}`,
          }}
        >
          <X size={10} weight="bold" />
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD RESOURCE DROPDOWN
   ═══════════════════════════════════════════════════════════ */

function AddResourceDropdown({
  anchorEl,
  onClose,
  onAddLink,
  onAddVideo,
  onAddGallery,
  onAddTravel,
  onAddImage,
}: {
  anchorEl: HTMLElement;
  onClose: () => void;
  onAddLink: () => void;
  onAddVideo: () => void;
  onAddGallery: () => void;
  onAddTravel: () => void;
  onAddImage: () => void;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, [anchorEl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorEl, onClose]);

  const items = [
    { label: "Link", icon: LinkSimple, color: COLORS.link, action: onAddLink },
    { label: "Video", icon: VideoCamera, color: COLORS.video, action: onAddVideo },
    { label: "Image", icon: ImageIcon, color: COLORS.gallery, action: onAddImage },
    { label: "Image Gallery", icon: ImageIcon, color: COLORS.gallery, action: onAddGallery },
    { label: "Travel Details", icon: AirplaneTakeoff, color: COLORS.travel, action: onAddTravel },
  ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[98]" onClick={onClose} />
      <div
        ref={dropRef}
        className="py-1.5 rounded-[10px] shadow-lg"
        style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          zIndex: 99,
          width: 200,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          className="px-3 py-1 mb-0.5"
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: COLORS.text4,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Add Resource
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => {
                item.action();
                onClose();
              }}
              className="flex items-center gap-2.5 w-full px-3 py-1.5 transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: "12px", color: COLORS.text2 }}
            >
              <Icon size={14} weight="fill" style={{ color: item.color }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   URL INPUT MODAL (for Link / Video)
   ═══════════════════════════════════════════════════════════ */

function UrlInputModal({
  type,
  onClose,
  onAdd,
}: {
  type: "link" | "video";
  onClose: () => void;
  onAdd: (title: string, url: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;
    onAdd(title.trim() || finalUrl, finalUrl);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-[420px] overflow-hidden"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2">
            {type === "link" ? (
              <LinkSimple size={16} weight="bold" style={{ color: COLORS.link }} />
            ) : (
              <VideoCamera size={16} weight="fill" style={{ color: COLORS.video }} />
            )}
            <span style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text1 }}>
              Add {type === "link" ? "Link" : "Video"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: COLORS.text4 }}>
            <X size={14} weight="bold" />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div>
            <label className="block mb-1" style={{ fontSize: "11px", fontWeight: 600, color: COLORS.text3 }}>
              URL
            </label>
            <input
              ref={inputRef}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={type === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: COLORS.bg, color: COLORS.text1, border: `1px solid ${COLORS.border}` }}
            />
          </div>
          <div>
            <label className="block mb-1" style={{ fontSize: "11px", fontWeight: 600, color: COLORS.text3 }}>
              Title (optional)
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Give it a name..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: COLORS.bg, color: COLORS.text1, border: `1px solid ${COLORS.border}` }}
            />
          </div>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: COLORS.text3, border: `1px solid ${COLORS.border}` }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!url.trim()}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: type === "link" ? COLORS.link : COLORS.video }}
          >
            Add
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   VIDEO PLAYER MODAL
   ═══════════════════════════════════════════════════════════ */

function VideoPlayerModal({ url, onClose }: { url: string; onClose: () => void }) {
  const embedUrl = getEmbedUrl(url);
  const isDirectVideo = embedUrl && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
      >
        <X size={18} weight="bold" />
      </button>
      <div
        className="rounded-xl overflow-hidden"
        style={{ width: "80vw", maxWidth: 900, background: "#000" }}
        onClick={(e) => e.stopPropagation()}
      >
        {isDirectVideo ? (
          <video src={embedUrl!} controls autoPlay style={{ width: "100%", height: 500 }} />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            style={{ width: "100%", height: 500, border: "none" }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex items-center justify-center" style={{ height: 300, color: "#999", fontSize: 14 }}>
            Unsupported video format.{" "}
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline ml-1" style={{ color: "#6159e1" }}>
              Open link
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   GALLERY MANAGER MODAL
   ═══════════════════════════════════════════════════════════ */

function GalleryManagerModal({
  att,
  onUpdate,
  onClose,
}: {
  att: ProjectAttachment;
  onUpdate: (updates: Partial<ProjectAttachment>) => void;
  onClose: () => void;
}) {
  const images = att.images || [];
  const [name, setName] = useState(att.name);
  const [editingName, setEditingName] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ url: string; thumb: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateImages = useCallback(
    (newImages: { url: string; caption?: string }[]) => {
      onUpdate({ images: newImages, thumbnailUrl: newImages[0]?.url });
    },
    [onUpdate]
  );

  const addImage = useCallback(
    (url: string) => {
      updateImages([...images, { url }]);
    },
    [images, updateImages]
  );

  const removeImage = useCallback(
    (idx: number) => {
      const next = images.filter((_, i) => i !== idx);
      updateImages(next);
    },
    [images, updateImages]
  );

  const handleDrop = useCallback(
    (fromIdx: number, toIdx: number) => {
      if (fromIdx === toIdx) return;
      const next = [...images];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      updateImages(next);
    },
    [images, updateImages]
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a038f2e0/unsplash/search?query=${encodeURIComponent(searchQuery)}&per_page=10`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      const data = await res.json();
      if (data.results) {
        setSearchResults(
          data.results.map((r: any) => ({
            url: r.url || r.urls?.regular || r.urls?.small,
            thumb: r.thumb || r.urls?.thumb || r.urls?.small,
          }))
        );
      }
    } catch (err) {
      console.error("Unsplash search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") addImage(reader.result);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const saveName = () => {
    setEditingName(false);
    if (name.trim() && name.trim() !== att.name) {
      onUpdate({ name: name.trim() });
    } else {
      setName(att.name);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: 820,
          maxHeight: "85vh",
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2.5">
            <ImageIcon size={18} weight="fill" style={{ color: COLORS.gallery }} />
            {editingName ? (
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setName(att.name);
                    setEditingName(false);
                  }
                }}
                className="outline-none bg-transparent"
                style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text1, width: 200 }}
                autoFocus
              />
            ) : (
              <span
                onClick={() => setEditingName(true)}
                className="cursor-pointer hover:opacity-70"
                style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text1 }}
              >
                {att.name}
              </span>
            )}
            <span style={{ fontSize: "11px", color: COLORS.text4 }}>
              {images.length} image{images.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5" style={{ color: COLORS.text3 }}>
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <ImageIcon size={48} style={{ color: "#ddd" }} />
              <p style={{ fontSize: "13px", color: COLORS.text4, textAlign: "center", maxWidth: 280 }}>
                No images yet. Search Unsplash, upload files, or paste a URL below.
              </p>
            </div>
          ) : (
            <div style={{ columns: 3, columnGap: 10 }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group mb-2.5 break-inside-avoid"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", String(idx))}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverIdx(idx);
                  }}
                  onDragLeave={() => setDragOverIdx(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverIdx(null);
                    const from = parseInt(e.dataTransfer.getData("text/plain"));
                    handleDrop(from, idx);
                  }}
                  onClick={() => setLightboxIdx(idx)}
                  style={{
                    cursor: "pointer",
                    outline: dragOverIdx === idx ? `2px solid ${COLORS.gallery}` : "none",
                    borderRadius: 8,
                  }}
                >
                  <img src={img.url} alt="" className="w-full rounded-lg" style={{ display: "block" }} />
                  <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.2)" }} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(idx);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                  >
                    <X size={12} weight="bold" />
                  </button>
                  <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab" style={{ color: "#fff" }}>
                    <DotsSixVertical size={16} weight="bold" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Add tools */}
        <div className="px-5 py-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex gap-2">
            {/* Unsplash search */}
            <div className="flex-1 flex items-center gap-1.5 rounded-lg px-2.5" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <MagnifyingGlass size={13} style={{ color: COLORS.text4 }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search Unsplash..."
                className="flex-1 bg-transparent outline-none py-1.5 text-xs"
                style={{ color: COLORS.text1 }}
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ color: COLORS.gallery }}
              >
                {searching ? "..." : "Search"}
              </button>
            </div>
            {/* Upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/[0.04]"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text2 }}
            >
              <UploadSimple size={13} />
              Upload
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
          </div>
          {/* Paste URL */}
          <div className="flex items-center gap-1.5 rounded-lg px-2.5" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <LinkSimple size={13} style={{ color: COLORS.text4 }} />
            <input
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && pasteUrl.trim()) {
                  addImage(pasteUrl.trim());
                  setPasteUrl("");
                }
              }}
              placeholder="Paste image URL..."
              className="flex-1 bg-transparent outline-none py-1.5 text-xs"
              style={{ color: COLORS.text1 }}
            />
            <button
              onClick={() => {
                if (pasteUrl.trim()) {
                  addImage(pasteUrl.trim());
                  setPasteUrl("");
                }
              }}
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ color: COLORS.gallery }}
            >
              Add
            </button>
          </div>

          {/* Unsplash results */}
          {searchResults.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => {
                    addImage(r.url);
                    setSearchResults([]);
                    setSearchQuery("");
                  }}
                  className="relative shrink-0 cursor-pointer rounded-md overflow-hidden group"
                  style={{ width: 90, height: 65 }}
                >
                  <img src={r.thumb} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <Plus size={16} weight="bold" style={{ color: "#fff" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setLightboxIdx(null)}
        >
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            <X size={18} weight="bold" />
          </button>
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx - 1);
              }}
              className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
          )}
          {lightboxIdx < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx + 1);
              }}
              className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
            >
              <ArrowRight size={20} weight="bold" />
            </button>
          )}
          <img
            src={images[lightboxIdx].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 8 }}
          />
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}
          >
            {lightboxIdx + 1} / {images.length}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   TRAVEL MANAGER MODAL
   ═══════════════════════════════════════════════════════════ */

function TravelManagerModal({
  att,
  onUpdate,
  onClose,
}: {
  att: ProjectAttachment;
  onUpdate: (updates: Partial<ProjectAttachment>) => void;
  onClose: () => void;
}) {
  const items = att.travelItems || [];
  const [addingCategory, setAddingCategory] = useState<TravelItem["category"] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDetails, setFormDetails] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formCost, setFormCost] = useState("");

  const total = items.reduce((s, i) => s + (i.cost || 0), 0);

  const updateItems = (newItems: TravelItem[]) => {
    onUpdate({ travelItems: newItems });
  };

  const handleAdd = () => {
    if (!addingCategory || !formTitle.trim()) return;
    const newItem: TravelItem = {
      id: genId(),
      category: addingCategory,
      title: formTitle.trim(),
      details: formDetails.trim(),
      link: formLink.trim() || undefined,
      cost: parseFloat(formCost) || 0,
    };
    updateItems([...items, newItem]);
    resetForm();
  };

  const handleSaveEdit = () => {
    if (!editingId || !formTitle.trim()) return;
    updateItems(
      items.map((i) =>
        i.id === editingId
          ? { ...i, title: formTitle.trim(), details: formDetails.trim(), link: formLink.trim() || undefined, cost: parseFloat(formCost) || 0 }
          : i
      )
    );
    resetForm();
  };

  const startEdit = (item: TravelItem) => {
    setEditingId(item.id);
    setAddingCategory(null);
    setFormTitle(item.title);
    setFormDetails(item.details);
    setFormLink(item.link || "");
    setFormCost(String(item.cost || ""));
  };

  const resetForm = () => {
    setAddingCategory(null);
    setEditingId(null);
    setFormTitle("");
    setFormDetails("");
    setFormLink("");
    setFormCost("");
  };

  // Group items by category
  const grouped = TRAVEL_CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.value),
  })).filter((g) => g.items.length > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 580, maxHeight: "85vh", background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2.5">
            <AirplaneTakeoff size={18} weight="fill" style={{ color: COLORS.travel }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text1 }}>Travel Details</span>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: "18px", fontWeight: 700, color: COLORS.travel }}>{formatCost(total)}</span>
            <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5" style={{ color: COLORS.text3 }}>
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {grouped.map((group) => {
            const CatIcon = group.icon;
            return (
              <div key={group.value}>
                <div className="flex items-center gap-2 mb-2">
                  <CatIcon size={13} weight="fill" style={{ color: group.color }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: COLORS.text4, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {group.label}
                  </span>
                </div>
                {group.items.map((item) => (
                  <div key={item.id} className="group flex items-start justify-between py-2 px-2 rounded-lg hover:bg-black/[0.02]">
                    {editingId === item.id ? (
                      <div className="flex-1 flex flex-col gap-2">
                        <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Title" className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: COLORS.bg, color: COLORS.text1, border: `1px solid ${COLORS.border}` }} />
                        <input value={formDetails} onChange={(e) => setFormDetails(e.target.value)} placeholder="Details" className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: COLORS.bg, color: COLORS.text1, border: `1px solid ${COLORS.border}` }} />
                        <input value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="Link (optional)" className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: COLORS.bg, color: COLORS.text1, border: `1px solid ${COLORS.border}` }} />
                        <div className="flex items-center gap-2">
                          <div className="flex items-center rounded-md px-2.5 py-1.5" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                            <span style={{ fontSize: "12px", color: COLORS.text4, marginRight: 4 }}>$</span>
                            <input value={formCost} onChange={(e) => setFormCost(e.target.value)} type="number" step="0.01" className="w-24 bg-transparent text-xs outline-none" style={{ color: COLORS.text1 }} />
                          </div>
                          <button onClick={handleSaveEdit} className="px-2.5 py-1 rounded-md text-xs font-semibold text-white" style={{ background: COLORS.travel }}>Save</button>
                          <button onClick={resetForm} className="px-2.5 py-1 rounded-md text-xs" style={{ color: COLORS.text3 }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: "13px", fontWeight: 600, color: COLORS.text1 }}>{item.title}</span>
                          </div>
                          {item.details && <p className="truncate" style={{ fontSize: "11px", color: COLORS.text4, marginTop: 1 }}>{item.details}</p>}
                          {item.link && (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-0.5 hover:underline" style={{ fontSize: "10px", color: COLORS.link }}>
                              <LinkSimple size={10} />
                              {getDomain(item.link)}
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span style={{ fontSize: "12px", fontWeight: 600, color: COLORS.text2 }}>{formatCost(item.cost)}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-black/5" style={{ color: COLORS.text4 }}>
                              <PencilSimple size={12} />
                            </button>
                            <button onClick={() => updateItems(items.filter((i) => i.id !== item.id))} className="p-1 rounded hover:bg-black/5" style={{ color: COLORS.text4 }}>
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {items.length === 0 && !addingCategory && (
            <div className="text-center py-8" style={{ color: COLORS.text4, fontSize: "13px" }}>
              No items yet. Click a category below to add one.
            </div>
          )}

          {/* Add form */}
          {addingCategory && (
            <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: COLORS.text3 }}>
                Add {TRAVEL_CATEGORIES.find((c) => c.value === addingCategory)?.label}
              </span>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Title" className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: COLORS.card, color: COLORS.text1, border: `1px solid ${COLORS.border}` }} autoFocus />
              <input value={formDetails} onChange={(e) => setFormDetails(e.target.value)} placeholder="Details" className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: COLORS.card, color: COLORS.text1, border: `1px solid ${COLORS.border}` }} />
              <input value={formLink} onChange={(e) => setFormLink(e.target.value)} placeholder="Link (optional)" className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: COLORS.card, color: COLORS.text1, border: `1px solid ${COLORS.border}` }} />
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-md px-2.5 py-1.5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: "12px", color: COLORS.text4, marginRight: 4 }}>$</span>
                  <input value={formCost} onChange={(e) => setFormCost(e.target.value)} type="number" step="0.01" placeholder="0.00" className="w-24 bg-transparent text-xs outline-none" style={{ color: COLORS.text1 }} />
                </div>
                <button onClick={handleAdd} disabled={!formTitle.trim()} className="px-2.5 py-1 rounded-md text-xs font-semibold text-white disabled:opacity-40" style={{ background: COLORS.travel }}>
                  Add {TRAVEL_CATEGORIES.find((c) => c.value === addingCategory)?.label}
                </button>
                <button onClick={resetForm} className="px-2.5 py-1 rounded-md text-xs" style={{ color: COLORS.text3 }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Category buttons */}
        <div className="px-5 py-3 flex flex-wrap gap-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          {TRAVEL_CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => {
                  setEditingId(null);
                  setAddingCategory(cat.value);
                  setFormTitle("");
                  setFormDetails("");
                  setFormLink("");
                  setFormCost("");
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors hover:bg-black/[0.04]"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text2 }}
              >
                <CatIcon size={12} weight="fill" style={{ color: cat.color }} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   IMAGE ADD MODAL — Add a single image via URL, upload, or Unsplash
   ═══════════════════════════════════════════════════════════ */

function ImageAddModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, url: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ url: string; thumb: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    urlInputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const finalUrl = preview || url.trim();
    if (!finalUrl) return;
    let normalizedUrl = finalUrl;
    if (!preview && !/^(https?:|data:)/i.test(normalizedUrl)) normalizedUrl = "https://" + normalizedUrl;
    onAdd(name.trim() || "Image", normalizedUrl);
    onClose();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a038f2e0/unsplash/search?query=${encodeURIComponent(searchQuery)}&per_page=8`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );
      const data = await res.json();
      if (data.results) {
        setSearchResults(
          data.results.map((r: any) => ({
            url: r.url || r.urls?.regular || r.urls?.small,
            thumb: r.thumb || r.urls?.thumb || r.urls?.small,
          }))
        );
      }
    } catch (err) {
      console.error("Unsplash search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!name.trim()) setName(file.name.replace(/\.[^.]+$/, ""));
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
        setUrl("");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const selectUnsplash = (imgUrl: string) => {
    setPreview(imgUrl);
    setUrl("");
    setSearchResults([]);
    setSearchQuery("");
  };

  const currentPreview = preview || (url.trim() && /^(https?:\/\/|data:)/i.test(url.trim()) ? url.trim() : null);

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-[480px] overflow-hidden"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2">
            <ImageIcon size={16} weight="fill" style={{ color: COLORS.gallery }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text1 }}>Add Image</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:opacity-70" style={{ color: COLORS.text4 }}>
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {/* Preview */}
          {currentPreview && (
            <div className="relative rounded-lg overflow-hidden" style={{ maxHeight: 200 }}>
              <img src={currentPreview} alt="" className="w-full object-contain" style={{ maxHeight: 200 }} />
              <button
                onClick={() => { setPreview(null); setUrl(""); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
              >
                <X size={10} weight="bold" />
              </button>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block mb-1" style={{ fontSize: "11px", fontWeight: 600, color: COLORS.text3 }}>
              Name (optional)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Give it a name..."
              className="w-full rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: COLORS.bg, color: COLORS.text1, border: `1px solid ${COLORS.border}` }}
            />
          </div>

          {/* URL input */}
          {!preview && (
            <div>
              <label className="block mb-1" style={{ fontSize: "11px", fontWeight: 600, color: COLORS.text3 }}>
                Image URL
              </label>
              <input
                ref={urlInputRef}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="https://..."
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: COLORS.bg, color: COLORS.text1, border: `1px solid ${COLORS.border}` }}
              />
            </div>
          )}

          {/* Upload + Unsplash row */}
          {!preview && (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-black/[0.04]"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text2 }}
              >
                <UploadSimple size={13} />
                Upload File
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <div className="flex-1 flex items-center gap-1.5 rounded-lg px-2.5" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <MagnifyingGlass size={13} style={{ color: COLORS.text4 }} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search Unsplash..."
                  className="flex-1 bg-transparent outline-none py-1.5 text-xs"
                  style={{ color: COLORS.text1 }}
                />
                <button onClick={handleSearch} disabled={searching} className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: COLORS.gallery }}>
                  {searching ? "..." : "Search"}
                </button>
              </div>
            </div>
          )}

          {/* Unsplash results */}
          {searchResults.length > 0 && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => selectUnsplash(r.url)}
                  className="relative shrink-0 cursor-pointer rounded-md overflow-hidden group"
                  style={{ width: 80, height: 60 }}
                >
                  <img src={r.thumb} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }}>
                    <Plus size={14} weight="bold" style={{ color: "#fff" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: COLORS.text3, border: `1px solid ${COLORS.border}` }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!currentPreview && !url.trim()}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: COLORS.gallery }}
          >
            Add Image
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   IMAGE LIGHTBOX — Fullscreen view of a single image resource
   ═══════════════════════════════════════════════════════════ */

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/20"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}
      >
        <X size={18} weight="bold" />
      </button>
      <img
        src={url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 8 }}
      />
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT: ProjectResources
   ═══════════════════════════════════════════════════════════ */

export function ProjectResources({
  attachments,
  onUpdate,
}: {
  attachments: ProjectAttachment[];
  onUpdate: (next: ProjectAttachment[]) => void;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [urlModalType, setUrlModalType] = useState<"link" | "video" | null>(null);
  const [videoPlayerUrl, setVideoPlayerUrl] = useState<string | null>(null);
  const [galleryId, setGalleryId] = useState<string | null>(null);
  const [travelId, setTravelId] = useState<string | null>(null);
  const [imageAddId, setImageAddId] = useState<string | null>(null);
  const [imageLightboxUrl, setImageLightboxUrl] = useState<string | null>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const handleRemove = (id: string) => {
    onUpdate(attachments.filter((a) => a.id !== id));
  };

  const handleAddResource = (att: ProjectAttachment) => {
    onUpdate([...attachments, att]);
  };

  const handleUpdateAttachment = (id: string, updates: Partial<ProjectAttachment>) => {
    onUpdate(attachments.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleCardClick = (att: ProjectAttachment) => {
    if (att.type === "link" && att.url) {
      window.open(att.url, "_blank", "noopener,noreferrer");
    } else if (att.type === "video" && att.url) {
      setVideoPlayerUrl(att.url);
    } else if (att.type === "gallery") {
      setGalleryId(att.id);
    } else if (att.type === "travel") {
      setTravelId(att.id);
    } else if (att.type === "image") {
      if (att.url) {
        setImageLightboxUrl(att.url);
      } else {
        setImageAddId(att.id);
      }
    }
  };

  const galleryAtt = galleryId ? attachments.find((a) => a.id === galleryId) : null;
  const travelAtt = travelId ? attachments.find((a) => a.id === travelId) : null;
  const imageAddAtt = imageAddId ? attachments.find((a) => a.id === imageAddId) : null;

  return (
    <div className="px-[32px] pb-5">
      <h3
        className="mb-[7px]"
        style={{ color: COLORS.text3, fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}
      >
        RESOURCES
      </h3>

      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 flex-wrap">
        {attachments.map((att) => (
          <ResourceCard
            key={att.id}
            att={att}
            onClick={() => handleCardClick(att)}
            onRemove={() => handleRemove(att.id)}
          />
        ))}

        {/* + Add button */}
        <button
          ref={addBtnRef}
          onClick={() => setShowAddMenu(true)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-[10px] shrink-0 transition-colors group"
          style={{
            border: `1px dashed ${COLORS.borderDash}`,
            color: "#cfcbcb",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          <Plus size={12} />
          <span className="group-hover:text-[#6f6e6f] transition-colors">Add</span>
        </button>
      </div>

      {/* Dropdown */}
      {showAddMenu && addBtnRef.current && (
        <AddResourceDropdown
          anchorEl={addBtnRef.current}
          onClose={() => setShowAddMenu(false)}
          onAddLink={() => setUrlModalType("link")}
          onAddVideo={() => setUrlModalType("video")}
          onAddGallery={() => {
            const id = genId();
            const att: ProjectAttachment = { id, name: "Image Gallery", type: "gallery", images: [] };
            handleAddResource(att);
            setGalleryId(id);
          }}
          onAddTravel={() => {
            const id = genId();
            const att: ProjectAttachment = { id, name: "Travel Details", type: "travel", travelItems: [] };
            handleAddResource(att);
            setTravelId(id);
          }}
          onAddImage={() => {
            const id = genId();
            const att: ProjectAttachment = { id, name: "Image", type: "image", url: "" };
            handleAddResource(att);
            setImageAddId(id);
          }}
        />
      )}

      {/* URL input modal */}
      {urlModalType && (
        <UrlInputModal
          type={urlModalType}
          onClose={() => setUrlModalType(null)}
          onAdd={(title, url) => {
            handleAddResource({ id: genId(), name: title, type: urlModalType, url });
          }}
        />
      )}

      {/* Video player */}
      {videoPlayerUrl && <VideoPlayerModal url={videoPlayerUrl} onClose={() => setVideoPlayerUrl(null)} />}

      {/* Gallery manager */}
      {galleryAtt && (
        <GalleryManagerModal
          att={galleryAtt}
          onUpdate={(updates) => handleUpdateAttachment(galleryAtt.id, updates)}
          onClose={() => setGalleryId(null)}
        />
      )}

      {/* Travel manager */}
      {travelAtt && (
        <TravelManagerModal
          att={travelAtt}
          onUpdate={(updates) => handleUpdateAttachment(travelAtt.id, updates)}
          onClose={() => setTravelId(null)}
        />
      )}

      {/* Image add modal */}
      {imageAddAtt && (
        <ImageAddModal
          onClose={() => setImageAddId(null)}
          onAdd={(name, url) => {
            handleUpdateAttachment(imageAddAtt.id, { name, url });
            setImageAddId(null);
          }}
        />
      )}

      {/* Image lightbox */}
      {imageLightboxUrl && (
        <ImageLightbox
          url={imageLightboxUrl}
          onClose={() => setImageLightboxUrl(null)}
        />
      )}
    </div>
  );
}