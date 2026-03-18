/* ═══════════════════════════════════════════════════════════
   COVER IMAGE PICKER — Notion-style cover picker with
   Gallery (Unsplash curated), Search, Upload, and Link tabs.
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  MagnifyingGlass,
  UploadSimple,
  Link as LinkIcon,
  Images,
  X,
  SpinnerGap,
  ArrowLeft,
  Check,
} from "@phosphor-icons/react";
import { apiCall } from "../lib/api";

type Tab = "gallery" | "search" | "upload" | "link";

interface UnsplashPhoto {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  author: string;
  authorUrl: string;
  color?: string;
}

interface CoverImagePickerProps {
  onSelect: (url: string) => void;
  onRemove?: () => void;
  onClose: () => void;
  hasExisting?: boolean;
}

/* ── Gallery categories ── */
const GALLERY_CATEGORIES = [
  { label: "Popular", topic: "" },
  { label: "Nature", topic: "nature" },
  { label: "Architecture", topic: "architecture" },
  { label: "Textures", topic: "textures-patterns" },
  { label: "Film", topic: "film" },
  { label: "Travel", topic: "travel" },
  { label: "Arts & Culture", topic: "arts-culture" },
  { label: "Business", topic: "business-work" },
  { label: "Technology", topic: "technology" },
];

/* ── Gradient presets ── */
const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f5576c 0%, #ff9a9e 100%)",
  "linear-gradient(135deg, #667eea 0%, #00d2ff 100%)",
  "linear-gradient(135deg, #2b5876 0%, #4e4376 100%)",
  "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
];

/* ── Solid color presets ── */
const SOLID_PRESETS = [
  "#e8e0d4", "#d4c5a9", "#c4b19a", "#9b8c7a",
  "#c9daf8", "#a4c2f4", "#6d9eeb", "#3c78d8",
  "#d5a6bd", "#c27ba0", "#a64d79", "#741b47",
  "#b6d7a8", "#93c47d", "#6aa84f", "#38761d",
  "#f4cccc", "#ea9999", "#e06666", "#cc0000",
  "#fce5cd", "#f9cb9c", "#f6b26b", "#e69138",
];

export function CoverImagePicker({
  onSelect,
  onRemove,
  onClose,
  hasExisting,
}: CoverImagePickerProps) {
  const [tab, setTab] = useState<Tab>("gallery");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<UnsplashPhoto[]>([]);
  const [galleryCategory, setGalleryCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load gallery on mount & category change ── */
  useEffect(() => {
    loadGallery(galleryCategory);
  }, [galleryCategory]);

  /* ── Focus search input when switching to search tab ── */
  useEffect(() => {
    if (tab === "search") {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [tab]);

  const loadGallery = useCallback(async (topic: string) => {
    setLoading(true);
    try {
      const params = topic ? `?topic=${topic}&per_page=30` : `?per_page=30`;
      const resp = await apiCall<{ photos: UnsplashPhoto[] }>(
        `/unsplash/curated${params}`
      );
      if (resp.data?.photos) {
        setGalleryPhotos(resp.data.photos);
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchUnsplash = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await apiCall<{ results: any[] }>(
        `/unsplash/search?query=${encodeURIComponent(query)}&per_page=30`
      );
      if (resp.data?.results) {
        setSearchResults(resp.data.results.map((r: any) => ({
          id: r.id,
          url: r.url,
          thumb: r.thumb,
          alt: r.alt || "",
          author: r.author || r.photographer || "",
          authorUrl: r.authorUrl || r.profileUrl || "",
          color: r.color,
        })));
      }
    } catch (err) {
      console.error("Failed to search Unsplash:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchInput = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchUnsplash(val), 400);
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onSelect(result);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleLinkSubmit = () => {
    if (linkUrl.trim()) {
      onSelect(linkUrl.trim());
      onClose();
    }
  };

  const handlePhotoClick = (photo: UnsplashPhoto) => {
    onSelect(photo.url);
    onClose();
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "gallery", label: "Gallery", icon: Images },
    { id: "search", label: "Search", icon: MagnifyingGlass },
    { id: "upload", label: "Upload", icon: UploadSimple },
    { id: "link", label: "Link", icon: LinkIcon },
  ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          width: "min(720px, calc(100vw - 48px))",
          maxHeight: "min(560px, calc(100vh - 140px))",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid #eee" }}
        >
          <div className="flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
                  style={{
                    color: active ? "#1a1a1a" : "#888",
                    background: active ? "#f3f3f3" : "transparent",
                  }}
                >
                  <Icon size={15} weight={active ? "bold" : "regular"} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {hasExisting && onRemove && (
              <button
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="text-[12px] font-medium px-2.5 py-1 rounded-md transition-colors text-red-500 hover:bg-red-50"
              >
                Remove
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <X size={16} weight="bold" style={{ color: "#666" }} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* GALLERY TAB */}
          {tab === "gallery" && (
            <div className="p-4">
              {/* Category pills */}
              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                {GALLERY_CATEGORIES.map((cat) => (
                  <button
                    key={cat.topic || "popular"}
                    onClick={() => setGalleryCategory(cat.topic)}
                    className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors"
                    style={{
                      color:
                        galleryCategory === cat.topic ? "#fff" : "#555",
                      background:
                        galleryCategory === cat.topic
                          ? "#333"
                          : "#f0f0f0",
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Color & gradient presets */}
              <div className="mb-4">
                <div
                  className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "#999" }}
                >
                  Color & Gradient
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GRADIENT_PRESETS.map((grad, i) => (
                    <button
                      key={`grad-${i}`}
                      onClick={() => {
                        // Encode gradient as a data URI SVG for the banner
                        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">${parseGradientStops(grad)}</linearGradient></defs><rect width="1200" height="400" fill="url(#g)"/></svg>`;
                        const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
                        onSelect(url);
                        onClose();
                      }}
                      className="w-[52px] h-[34px] rounded-md cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                      style={{ background: grad }}
                    />
                  ))}
                  {SOLID_PRESETS.map((color, i) => (
                    <button
                      key={`solid-${i}`}
                      onClick={() => {
                        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400" fill="${color}"/></svg>`;
                        const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
                        onSelect(url);
                        onClose();
                      }}
                      className="w-[52px] h-[34px] rounded-md cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Unsplash photos */}
              <div
                className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                style={{ color: "#999" }}
              >
                Unsplash Photos
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <SpinnerGap
                    size={24}
                    className="animate-spin"
                    style={{ color: "#999" }}
                  />
                </div>
              ) : (
                <PhotoGrid
                  photos={galleryPhotos}
                  onSelect={handlePhotoClick}
                />
              )}
            </div>
          )}

          {/* SEARCH TAB */}
          {tab === "search" && (
            <div className="p-4">
              <div className="relative mb-4">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#999" }}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Search Unsplash for photos..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[14px] outline-none transition-colors"
                  style={{
                    border: "1px solid #ddd",
                    color: "#1a1a1a",
                    background: "#fafafa",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "#aaa")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "#ddd")
                  }
                />
              </div>

              {/* Quick suggestions */}
              {!searchQuery && searchResults.length === 0 && (
                <div className="mb-4">
                  <div
                    className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "#999" }}
                  >
                    Suggestions
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "minimal",
                      "abstract",
                      "mountains",
                      "ocean",
                      "city",
                      "space",
                      "forest",
                      "desert",
                      "clouds",
                      "sunset",
                      "architecture",
                      "aerial",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setSearchQuery(q);
                          searchUnsplash(q);
                        }}
                        className="px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors hover:bg-gray-200"
                        style={{ color: "#555", background: "#f0f0f0" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <SpinnerGap
                    size={24}
                    className="animate-spin"
                    style={{ color: "#999" }}
                  />
                </div>
              ) : searchResults.length > 0 ? (
                <PhotoGrid
                  photos={searchResults}
                  onSelect={handlePhotoClick}
                />
              ) : searchQuery ? (
                <div className="text-center py-10" style={{ color: "#999", fontSize: "13px" }}>
                  No results for "{searchQuery}"
                </div>
              ) : null}
            </div>
          )}

          {/* UPLOAD TAB */}
          {tab === "upload" && (
            <div className="p-4">
              <div
                className="rounded-xl flex flex-col items-center justify-center py-16 transition-colors cursor-pointer"
                style={{
                  border: `2px dashed ${dragOver ? "#4facfe" : "#ddd"}`,
                  background: dragOver ? "#f0f7ff" : "#fafafa",
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple
                  size={40}
                  weight="light"
                  style={{ color: dragOver ? "#4facfe" : "#bbb", marginBottom: "12px" }}
                />
                <span
                  className="text-[14px] font-medium mb-1"
                  style={{ color: "#555" }}
                >
                  {dragOver
                    ? "Drop image here"
                    : "Click to upload or drag and drop"}
                </span>
                <span className="text-[12px]" style={{ color: "#999" }}>
                  PNG, JPG, GIF, SVG, or WebP
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
            </div>
          )}

          {/* LINK TAB */}
          {tab === "link" && (
            <div className="p-4">
              <div
                className="text-[13px] mb-3"
                style={{ color: "#666" }}
              >
                Paste an image URL from the web
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <LinkIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#999" }}
                  />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg text-[14px] outline-none"
                    style={{
                      border: "1px solid #ddd",
                      color: "#1a1a1a",
                      background: "#fafafa",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLinkSubmit();
                    }}
                  />
                </div>
                <button
                  onClick={handleLinkSubmit}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors"
                  style={{
                    background: linkUrl.trim() ? "#333" : "#e5e5e5",
                    color: linkUrl.trim() ? "#fff" : "#999",
                  }}
                >
                  Embed
                </button>
              </div>

              {/* Preview */}
              {linkUrl.trim() && (
                <div className="mt-4 rounded-lg overflow-hidden" style={{ border: "1px solid #eee" }}>
                  <img
                    src={linkUrl}
                    alt="Preview"
                    className="w-full h-[200px] object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer attribution ── */}
        {(tab === "gallery" || tab === "search") && (
          <div
            className="px-4 py-2 text-[11px] shrink-0 flex items-center justify-between"
            style={{ color: "#999", borderTop: "1px solid #eee" }}
          >
            <span>
              Photos by{" "}
              <a
                href="https://unsplash.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Unsplash
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Photo grid sub-component ── */
function PhotoGrid({
  photos,
  onSelect,
}: {
  photos: UnsplashPhoto[];
  onSelect: (photo: UnsplashPhoto) => void;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {photos.map((photo) => (
        <button
          key={photo.id}
          onClick={() => onSelect(photo)}
          className="relative rounded-md overflow-hidden group cursor-pointer aspect-[16/10]"
          style={{ background: photo.color || "#eee" }}
        >
          <img
            src={photo.thumb}
            alt={photo.alt}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
          {/* Hover overlay with author */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
            <span className="text-white text-[10px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity truncate w-full">
              {photo.author}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ── Helper: parse CSS gradient stops for SVG ── */
function parseGradientStops(css: string): string {
  // Extract color stops from "linear-gradient(135deg, #color1 0%, #color2 100%)"
  const match = css.match(
    /linear-gradient\([^,]+,\s*(#[0-9a-fA-F]+)\s+(\d+)%,\s*(#[0-9a-fA-F]+)\s+(\d+)%\)/
  );
  if (!match) return `<stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/>`;
  return `<stop offset="${match[2]}%" stop-color="${match[1]}"/><stop offset="${match[4]}%" stop-color="${match[3]}"/>`;
}