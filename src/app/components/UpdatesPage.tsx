/* ═══════════════════════════════════════════════════════════
   UPDATES PAGE — Social-style news feed where users post
   status updates scoped to a Space. Shows a composer at the
   top and a chronological feed below.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Newspaper,
  PaperPlaneTilt,
  SmileySticker,
  ChatTeardropText,
  DotsThree,
  Trash,
  CaretDown,
  CirclesFour,
  TextB,
  TextItalic,
  TextStrikethrough,
  ListBullets,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  ArrowSquareOut,
  FrameCorners,
  UploadSimple,
  ArrowsOut,
  CaretLeft,
  CaretRight,
  Play,
  VideoCamera,
  PencilSimple,
  ChatCircleDots,
  ArrowsLeftRight,
  Check,
} from "@phosphor-icons/react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useData } from "../lib/data";
import { getPhosphorIcon } from "./PhosphorIconPicker";
import type { Space } from "../lib/types";
import { createPortal } from "react-dom";

/* ─── Types ─── */

interface UpdateComment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorColor: string;
  createdAt: string;
}

interface UpdatePost {
  id: string;
  title: string;
  content: string;
  contentFormat?: "html" | "text"; // "html" for rich posts, "text" (or absent) for legacy plain text
  attachments?: UpdateAttachment[];
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorColor: string;
  spaceId: string | null;
  createdAt: string;
  reactions: { emoji: string; userIds: string[] }[];
  comments: UpdateComment[];
  commentsDisabled?: boolean;
  isRead: boolean;
}

interface UpdateAttachment {
  type: "link" | "image" | "video";
  url: string;
  title?: string;
  thumbnailUrl?: string;
  videoId?: string;
  provider?: "youtube" | "vimeo" | "frameio";
}

/* ─── Emoji reactions palette ─── */
const REACTION_EMOJIS = ["👍", "❤️", "🔥", "🎉", "👏", "🚀", "💡", "✅"];

/* ─── Relative time helper ─── */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Avatar ─── */
function Avatar({ name, avatarUrl, color, size = 36 }: { name: string; avatarUrl?: string | null; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.38,
      }}
    >
      {initials}
    </div>
  );
}

/* ─── Space Selector (inline dropdown) ─── */
function SpaceSelector({
  spaces,
  value,
  onChange,
}: {
  spaces: Space[];
  value: string | null;
  onChange: (spaceId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = spaces.find((s) => s.id === value);

  const renderSpaceIcon = (space: Space) => {
    if (space.iconUrl) {
      return <img src={space.iconUrl} alt="" className="w-4 h-4 rounded-full object-cover" />;
    }
    const PhIcon = space.phosphorIcon ? getPhosphorIcon(space.phosphorIcon) || CirclesFour : null;
    if (PhIcon) {
      return (
        <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: space.color }}>
          <PhIcon size={10} weight="fill" className="text-white" />
        </div>
      );
    }
    return (
      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: space.color }}>
        <span style={{ fontSize: "9px" }}>{space.icon}</span>
      </div>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        style={{
          border: "1px solid var(--border-default)",
          color: current ? "var(--text-primary)" : "var(--text-tertiary)",
        }}
      >
        {current ? (
          <>
            {renderSpaceIcon(current)}
            <span className="max-w-[100px] truncate">{current.name}</span>
          </>
        ) : (
          <>
            <CirclesFour size={14} />
            <span>All Spaces</span>
          </>
        )}
        <CaretDown size={12} style={{ color: "var(--text-quaternary)" }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-[200px] rounded-[10px] py-1 shadow-lg overflow-hidden"
          style={{
            background: "var(--surface-bg)",
            border: "1px solid var(--border-default)",
          }}
        >
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{
              color: !value ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: !value ? 500 : 400,
            }}
          >
            <CirclesFour size={16} style={{ color: "var(--text-tertiary)" }} />
            All Spaces
          </button>
          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => { onChange(space.id); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{
                color: value === space.id ? "var(--accent-primary)" : "var(--text-secondary)",
                fontWeight: value === space.id ? 500 : 400,
              }}
            >
              {renderSpaceIcon(space)}
              <span className="truncate">{space.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── HTML sanitizer for safe rendering ─── */
const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "s", "del", "u", "ul", "ol", "li", "br", "p", "a", "div", "span"]);
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  span: new Set(["style"]),
};

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  function clean(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      return Array.from(el.childNodes).map(clean).join("");
    }
    const allowedAttrs = ALLOWED_ATTRS[tag];
    let attrs = "";
    if (allowedAttrs) {
      for (const attr of Array.from(el.attributes)) {
        if (allowedAttrs.has(attr.name)) {
          if (attr.name === "href" && attr.value.trim().toLowerCase().startsWith("javascript:")) continue;
          attrs += ` ${attr.name}="${attr.value.replace(/"/g, "&quot;")}"`;
        }
      }
    }
    if (tag === "a") {
      if (!attrs.includes("target=")) attrs += ' target="_blank"';
      if (!attrs.includes("rel=")) attrs += ' rel="noopener noreferrer"';
    }
    const children = Array.from(el.childNodes).map(clean).join("");
    const selfClosing = ["br"].includes(tag);
    return selfClosing ? `<${tag}${attrs} />` : `<${tag}${attrs}>${children}</${tag}>`;
  }
  return Array.from(doc.body.childNodes).map(clean).join("");
}

/* ─── Detect if a URL is a Frame.io link ─── */
function isFrameIoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.includes("frame.io") || u.hostname.includes("app.frame.io");
  } catch { return false; }
}

/* ─── Extract display domain from URL ─── */
function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

/* ─── Video URL detection & parsing ─── */
interface VideoInfo {
  provider: "youtube" | "vimeo" | "frameio";
  videoId: string;
  thumbnailUrl: string;
  embedUrl: string;
  title: string;
}

function parseVideoUrl(url: string): VideoInfo | null {
  try {
    const u = new URL(url);

    // YouTube
    // youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      let videoId = "";
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1).split("/")[0];
      } else if (u.pathname.startsWith("/embed/")) {
        videoId = u.pathname.split("/embed/")[1]?.split(/[?/]/)[0] || "";
      } else if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1]?.split(/[?/]/)[0] || "";
      } else {
        videoId = u.searchParams.get("v") || "";
      }
      if (videoId) {
        return {
          provider: "youtube",
          videoId,
          // maxresdefault is best quality; component falls back via useOfficialThumbnail
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
          title: "YouTube Video",
        };
      }
    }

    // Vimeo
    // vimeo.com/ID, vimeo.com/channels/xxx/ID, player.vimeo.com/video/ID
    if (u.hostname.includes("vimeo.com")) {
      let videoId = "";
      if (u.hostname === "player.vimeo.com") {
        videoId = u.pathname.split("/video/")[1]?.split(/[?/]/)[0] || "";
      } else {
        // Last numeric segment in the path
        const segments = u.pathname.split("/").filter(Boolean);
        const numericSegment = segments.reverse().find((s) => /^\d+$/.test(s));
        videoId = numericSegment || "";
      }
      if (videoId) {
        return {
          provider: "vimeo",
          videoId,
          thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
          embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
          title: "Vimeo Video",
        };
      }
    }

    // Frame.io
    if (u.hostname.includes("frame.io")) {
      // Frame.io doesn't have a public embed API, use branded placeholder
      const pathId = u.pathname.split("/").filter(Boolean).pop() || "frameio";
      return {
        provider: "frameio",
        videoId: pathId,
        thumbnailUrl: "", // Will use a branded placeholder
        embedUrl: url, // Opens in new tab
        title: "Frame.io Review",
      };
    }
  } catch {
    // invalid URL
  }
  return null;
}

/** Check if a URL is a recognized video platform */
function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

/** Build an UpdateAttachment from a video URL */
function videoAttachmentFromUrl(url: string): UpdateAttachment | null {
  const info = parseVideoUrl(url);
  if (!info) return null;
  return {
    type: "video",
    url,
    title: info.title,
    thumbnailUrl: info.thumbnailUrl,
    videoId: info.videoId,
    provider: info.provider,
  };
}

/* ─── Official thumbnail resolution cache & hook ─── */
const _thumbCache = new Map<string, string>();

function useOfficialThumbnail(att: UpdateAttachment): string {
  const isVideo = att.type === "video";
  const provider = att.provider;
  const videoId = att.videoId || "";
  const fallback = att.thumbnailUrl || "";

  const [resolved, setResolved] = useState<string>(() => {
    if (!isVideo) return att.url;
    const cacheKey = `${provider}:${videoId}`;
    return _thumbCache.get(cacheKey) || fallback;
  });

  useEffect(() => {
    if (!isVideo || !videoId) return;
    const cacheKey = `${provider}:${videoId}`;

    // Already resolved
    if (_thumbCache.has(cacheKey)) {
      setResolved(_thumbCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;

    if (provider === "vimeo") {
      // Fetch official thumbnail from Vimeo oEmbed (supports CORS)
      fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}&width=640`)
        .then((r) => r.json())
        .then((data: any) => {
          if (!cancelled && data.thumbnail_url) {
            // Vimeo returns sized thumbnails — request wider version
            const url = data.thumbnail_url.replace(/_\d+x\d+/, "_640");
            _thumbCache.set(cacheKey, url);
            setResolved(url);
          }
        })
        .catch(() => {
          // Keep fallback (vumbnail.com)
        });
    } else if (provider === "youtube") {
      // Try maxresdefault, fall back to hqdefault
      const maxres = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const hq = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      const img = new Image();
      img.onload = () => {
        // YouTube returns a 120×90 gray placeholder for missing maxresdefault
        if (!cancelled && img.naturalWidth > 200) {
          _thumbCache.set(cacheKey, maxres);
          setResolved(maxres);
        } else if (!cancelled) {
          _thumbCache.set(cacheKey, hq);
          setResolved(hq);
        }
      };
      img.onerror = () => {
        if (!cancelled) {
          _thumbCache.set(cacheKey, hq);
          setResolved(hq);
        }
      };
      img.src = maxres;
    }

    return () => { cancelled = true; };
  }, [isVideo, provider, videoId, fallback]);

  return resolved;
}

/* ─── Media Lightbox (portaled to body) — supports images and video embeds ─── */
interface LightboxItem {
  type: "image" | "video";
  url: string; // image src or original video URL
  embedUrl?: string; // for videos, the iframe embed URL
  provider?: "youtube" | "vimeo" | "frameio";
}

function MediaLightbox({
  items,
  initialIndex,
  onClose,
}: {
  items: LightboxItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < items.length - 1) setIndex((i) => i + 1);
      if (e.key === "ArrowLeft" && index > 0) setIndex((i) => i - 1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [index, items.length, onClose]);

  const current = items[index];

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 200, background: "rgba(0,0,0,0.85)" }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-colors"
        style={{ zIndex: 201 }}
      >
        <X size={20} weight="bold" />
      </button>

      {/* Navigation arrows */}
      {items.length > 1 && index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i - 1); }}
          className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-colors"
          style={{ zIndex: 201 }}
        >
          <CaretLeft size={20} weight="bold" />
        </button>
      )}
      {items.length > 1 && index < items.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIndex((i) => i + 1); }}
          className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-colors"
          style={{ zIndex: 201 }}
        >
          <CaretRight size={20} weight="bold" />
        </button>
      )}

      {/* Content */}
      {current.type === "video" && current.provider === "frameio" ? (
        /* Frame.io — no public embed, show branded card with external link */
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-4 p-8 rounded-[12px]"
          style={{ zIndex: 201, background: "linear-gradient(135deg, #3a3a50, #1a1a2e)", minWidth: 320 }}
        >
          <FrameCorners size={56} weight="duotone" className="text-white/60" />
          <p className="text-white/80 text-[15px] font-medium text-center">Frame.io Review</p>
          <a
            href={current.embedUrl || current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: "#7B61FF" }}
          >
            <ArrowSquareOut size={16} weight="bold" />
            Open in Frame.io
          </a>
        </div>
      ) : current.type === "video" && current.embedUrl ? (
        <div
          onClick={(e) => e.stopPropagation()}
          className="rounded-[8px] overflow-hidden"
          style={{ zIndex: 201, width: "min(90vw, 960px)", aspectRatio: "16/9" }}
        >
          <iframe
            src={current.embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ border: "none" }}
          />
        </div>
      ) : (
        <img
          src={current.url}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-[8px] select-none"
          style={{ zIndex: 201 }}
        />
      )}

      {/* Counter */}
      {items.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[12px] font-medium text-white bg-white/15 backdrop-blur-sm"
          style={{ zIndex: 201 }}
        >
          {index + 1} / {items.length}
        </div>
      )}
    </div>,
    document.body
  );
}

/* ─── Media Gallery — social-style edge-to-edge image/video grid ─── */

/** Play button overlay for video thumbnails */
function PlayOverlay({ size = 48 }: { size?: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="rounded-full flex items-center justify-center backdrop-blur-sm"
        style={{
          width: size,
          height: size,
          background: "rgba(0,0,0,0.55)",
        }}
      >
        <Play size={size * 0.45} weight="fill" className="text-white ml-[2px]" />
      </div>
    </div>
  );
}

/** Provider badge (YouTube / Vimeo / Frame.io) shown on video thumbnails */
function ProviderBadge({ provider }: { provider?: string }) {
  if (!provider) return null;
  const labels: Record<string, { label: string; bg: string }> = {
    youtube: { label: "YouTube", bg: "#FF0000" },
    vimeo: { label: "Vimeo", bg: "#1AB7EA" },
    frameio: { label: "Frame.io", bg: "#7B61FF" },
  };
  const info = labels[provider];
  if (!info) return null;
  return (
    <div
      className="absolute top-2 left-2 px-2 py-0.5 rounded-[4px] text-[10px] font-bold text-white tracking-wide pointer-events-none"
      style={{ background: info.bg }}
    >
      {info.label}
    </div>
  );
}

/** Render a single media cell (image or video thumbnail) — videos support inline playback */
function MediaCell({
  att,
  onClick,
  onExpandToLightbox,
  className = "",
  style,
}: {
  att: UpdateAttachment;
  onClick: () => void;
  onExpandToLightbox?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const resolvedSrc = useOfficialThumbnail(att);
  const isVideo = att.type === "video";
  const [playing, setPlaying] = useState(false);

  // Derive embed URL for inline play
  const embedUrl = useMemo(() => {
    if (!isVideo) return "";
    const info = parseVideoUrl(att.url);
    return info?.embedUrl || "";
  }, [isVideo, att.url]);

  const handleClick = () => {
    if (isVideo && att.provider !== "frameio" && embedUrl) {
      // Inline play for YouTube / Vimeo
      setPlaying(true);
    } else {
      onClick();
    }
  };

  // Inline player active
  if (playing && isVideo && embedUrl) {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`} style={{ ...style, aspectRatio: "16/9" }}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          style={{ border: "none" }}
        />
        {/* Collapse (back to thumbnail) */}
        <button
          onClick={(e) => { e.stopPropagation(); setPlaying(false); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
          title="Collapse"
        >
          <X size={14} weight="bold" />
        </button>
        {/* Expand to lightbox */}
        {onExpandToLightbox && (
          <button
            onClick={(e) => { e.stopPropagation(); setPlaying(false); onExpandToLightbox(); }}
            className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/60 text-white hover:bg-black/80 transition-colors z-10"
            title="Expand"
          >
            <ArrowsOut size={14} weight="bold" />
          </button>
        )}
      </div>
    );
  }

  const src = isVideo ? resolvedSrc : att.url;

  return (
    <div className={`relative group cursor-pointer overflow-hidden ${className}`} style={style} onClick={handleClick}>
      {src ? (
        <img
          src={src}
          alt={att.title || ""}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            // YouTube maxresdefault fallback → hqdefault
            if (att.provider === "youtube" && att.videoId && el.src.includes("maxresdefault")) {
              el.src = `https://img.youtube.com/vi/${att.videoId}/hqdefault.jpg`;
            } else {
              el.style.display = "none";
            }
          }}
        />
      ) : (
        // Frame.io or missing thumbnail placeholder
        <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3a3a50, #1a1a2e)" }}>
          <FrameCorners size={40} weight="duotone" className="text-white/50" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      {isVideo && <PlayOverlay size={48} />}
      {isVideo && <ProviderBadge provider={att.provider} />}
      {/* Expand button for videos (opens lightbox without inline play) */}
      {isVideo && onExpandToLightbox && (
        <button
          onClick={(e) => { e.stopPropagation(); onExpandToLightbox(); }}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm z-10"
          title="Expand in lightbox"
        >
          <ArrowsOut size={14} weight="bold" />
        </button>
      )}
      {!isVideo && (
        <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
          <ArrowsOut size={14} weight="bold" />
        </div>
      )}
    </div>
  );
}

function MediaGallery({
  media,
  onOpenLightbox,
}: {
  media: UpdateAttachment[];
  onOpenLightbox: (index: number) => void;
}) {
  const count = media.length;
  if (count === 0) return null;

  const galleryHeight = 320;

  // Single item — full width, videos get 16:9 aspect ratio for inline play
  if (count === 1) {
    const isVideo = media[0].type === "video";
    return (
      <MediaCell
        att={media[0]}
        onClick={() => onOpenLightbox(0)}
        onExpandToLightbox={() => onOpenLightbox(0)}
        style={isVideo ? { aspectRatio: "16/9", width: "100%" } : { maxHeight: 480, minHeight: 200 }}
      />
    );
  }

  // Two items — side by side
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-[2px]" style={{ height: galleryHeight }}>
        {media.map((m, i) => (
          <MediaCell key={i} att={m} onClick={() => onOpenLightbox(i)} onExpandToLightbox={() => onOpenLightbox(i)} />
        ))}
      </div>
    );
  }

  // Three items — one large left, two stacked right
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-[2px]" style={{ height: galleryHeight }}>
        <MediaCell att={media[0]} onClick={() => onOpenLightbox(0)} onExpandToLightbox={() => onOpenLightbox(0)} className="row-span-2" />
        {media.slice(1).map((m, i) => (
          <MediaCell key={i} att={m} onClick={() => onOpenLightbox(i + 1)} onExpandToLightbox={() => onOpenLightbox(i + 1)} />
        ))}
      </div>
    );
  }

  // Four+ items — 2×2 grid, last cell shows "+N" overflow
  const shown = media.slice(0, 4);
  const extra = count - 4;
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-[2px]" style={{ height: galleryHeight }}>
      {shown.map((m, i) => (
        <div key={i} className="relative group cursor-pointer overflow-hidden" onClick={() => onOpenLightbox(i)}>
          <MediaCell att={m} onClick={() => {}} onExpandToLightbox={() => onOpenLightbox(i)} />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
              <span className="text-white text-[24px] font-bold">+{extra}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Formatting toolbar button ─── */
function ToolbarBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; weight?: string }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-[5px] transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
      style={{
        color: active ? "var(--accent-primary)" : "var(--text-tertiary)",
        background: active ? "var(--accent-primary-subtle)" : undefined,
      }}
    >
      <Icon size={16} weight={active ? "bold" : "regular"} />
    </button>
  );
}

/* ─── Link / Image Insert Popover ─── */
function InsertPopover({
  mode,
  onInsert,
  onClose,
}: {
  mode: "link" | "image" | "video";
  onInsert: (url: string, title?: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = "https://" + normalizedUrl;
    onInsert(normalizedUrl, title.trim() || undefined);
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 bottom-full mb-2 z-50 w-[300px] rounded-[10px] p-3 shadow-lg"
      style={{
        background: "var(--surface-bg)",
        border: "1px solid var(--border-default)",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
          {mode === "link" ? "Add Link" : mode === "video" ? "Add Video" : "Add Image"}
        </div>
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={mode === "link" ? "https://app.frame.io/reviews/..." : mode === "video" ? "YouTube, Vimeo, or Frame.io URL" : "https://example.com/image.png"}
          className="w-full text-[13px] px-2.5 py-1.5 rounded-[6px] outline-none"
          style={{
            color: "var(--text-primary)",
            background: "var(--page-bg)",
            border: "1px solid var(--border-default)",
          }}
        />
        {mode === "link" && (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Display text (optional)"
            className="w-full text-[13px] px-2.5 py-1.5 rounded-[6px] outline-none"
            style={{
              color: "var(--text-primary)",
              background: "var(--page-bg)",
              border: "1px solid var(--border-default)",
            }}
          />
        )}
        <div className="flex justify-end gap-1.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-[6px] text-[12px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!url.trim()}
            className="px-3 py-1 rounded-[6px] text-[12px] font-semibold text-white transition-colors disabled:opacity-40"
            style={{ background: "var(--accent-primary)" }}
          >
            {mode === "link" ? "Add Link" : mode === "video" ? "Add Video" : "Add Image"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Attachment Preview Card ─── */
function AttachmentCard({
  attachment,
  onRemove,
}: {
  attachment: UpdateAttachment;
  onRemove?: () => void;
}) {
  const isFrameIo = attachment.type === "link" && isFrameIoUrl(attachment.url);

  if (attachment.type === "image") {
    return (
      <div className="relative group rounded-[8px] overflow-hidden inline-block" style={{ border: "1px solid var(--border-default)" }}>
        <img
          src={attachment.url}
          alt={attachment.title || "Attached image"}
          className="max-w-full max-h-[200px] object-cover rounded-[8px]"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} weight="bold" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative group flex items-center gap-2.5 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      style={{ border: "1px solid var(--border-default)" }}
    >
      <div
        className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
        style={{
          background: isFrameIo ? "#7B61FF" : "var(--accent-primary-subtle)",
        }}
      >
        {isFrameIo ? (
          <FrameCorners size={16} weight="bold" className="text-white" />
        ) : (
          <LinkIcon size={16} style={{ color: "var(--accent-primary)" }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-medium truncate block hover:underline"
          style={{ color: "var(--accent-primary)" }}
        >
          {attachment.title || (isFrameIo ? "Frame.io Review" : getDomain(attachment.url))}
        </a>
        <span className="text-[11px] truncate block" style={{ color: "var(--text-quaternary)" }}>
          {getDomain(attachment.url)}
        </span>
      </div>
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-6 h-6 rounded-[4px] flex items-center justify-center transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <ArrowSquareOut size={14} />
      </a>
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06] opacity-0 group-hover:opacity-100"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X size={12} weight="bold" />
        </button>
      )}
    </div>
  );
}

/* ─── Composer media thumbnail (uses hook for official thumbnails) ─── */
function ComposerMediaThumb({
  att,
  isSingle,
  onRemove,
}: {
  att: UpdateAttachment & { _idx: number };
  isSingle: boolean;
  onRemove: () => void;
}) {
  const resolvedSrc = useOfficialThumbnail(att);
  const src = att.type === "video" ? resolvedSrc : att.url;

  return (
    <div
      className="relative group shrink-0 rounded-[8px] overflow-hidden"
      style={{ border: "1px solid var(--border-default)", width: isSingle ? "100%" : 120, height: isSingle ? "auto" : 120 }}
    >
      {src ? (
        <img
          src={src}
          alt={att.title || ""}
          className="object-cover"
          style={isSingle ? { width: "100%", maxHeight: 200, aspectRatio: att.type === "video" ? "16/9" : undefined } : { width: 120, height: 120 }}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            if (att.provider === "youtube" && att.videoId && el.src.includes("maxresdefault")) {
              el.src = `https://img.youtube.com/vi/${att.videoId}/hqdefault.jpg`;
            } else {
              el.style.display = "none";
            }
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ width: isSingle ? "100%" : 120, height: isSingle ? 120 : 120, background: "linear-gradient(135deg, #3a3a50, #1a1a2e)" }}
        >
          <FrameCorners size={28} weight="duotone" className="text-white/50" />
        </div>
      )}
      {att.type === "video" && (
        <>
          <PlayOverlay size={isSingle ? 40 : 28} />
          <ProviderBadge provider={att.provider} />
        </>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={10} weight="bold" />
      </button>
    </div>
  );
}

/* ─── Post Composer ─── */
function UpdateComposer({
  spaces,
  onPost,
  authorName,
  authorAvatar,
  authorColor,
}: {
  spaces: Space[];
  onPost: (content: string, spaceId: string | null, contentFormat: "html", attachments: UpdateAttachment[]) => Promise<void>;
  authorName: string;
  authorAvatar?: string | null;
  authorColor: string;
}) {
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [attachments, setAttachments] = useState<UpdateAttachment[]>([]);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [showVideoPopover, setShowVideoPopover] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const dragCounter = useRef(0);

  /** Upload a File to the attachment storage and return the signed URL */
  const uploadImageFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      setUploadingCount((c) => c + 1);
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Strip the data:...;base64, prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await api.post<{ url: string }>("/storage/attachment", {
        base64,
        contentType: file.type,
        fileName: file.name,
        projectName: "updates",
      });

      if (res.data?.url) return res.data.url;
      console.error("[UpdateComposer] Image upload failed:", res.error);
      return null;
    } catch (err) {
      console.error("[UpdateComposer] Image upload error:", err);
      return null;
    } finally {
      setUploadingCount((c) => c - 1);
    }
  }, []);

  /** Process an array of Files — filter to images, upload, add as attachments */
  const processImageFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const uploads = imageFiles.map((f) => uploadImageFile(f));
    const urls = await Promise.all(uploads);
    const valid = urls.filter((u): u is string => !!u);

    if (valid.length > 0) {
      setAttachments((prev) => [
        ...prev,
        ...valid.map((url) => ({ type: "image" as const, url })),
      ]);
      setTimeout(checkEmpty, 0);
    }
  }, [uploadImageFile]);

  const checkEmpty = () => {
    const el = editorRef.current;
    if (!el) return;
    const text = el.textContent || "";
    setIsEmpty(!text.trim() && attachments.length === 0);
  };

  const execCmd = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    checkEmpty();
  };

  const handlePost = async () => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    const text = el.textContent || "";
    if (!text.trim() && attachments.length === 0) return;
    if (posting) return;
    setPosting(true);
    try {
      await onPost(html, spaceId, "html", attachments);
      el.innerHTML = "";
      setAttachments([]);
      setIsEmpty(true);
    } finally {
      setPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handlePost();
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "b") { e.preventDefault(); execCmd("bold"); }
      if (e.key === "i") { e.preventDefault(); execCmd("italic"); }
      if (e.shiftKey && e.key === "X") { e.preventDefault(); execCmd("strikeThrough"); }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Handle pasted image files (e.g. screenshots)
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        e.preventDefault();
        processImageFiles(imageFiles);
        return;
      }
    }

    const text = e.clipboardData?.getData("text/plain") || "";
    const urlMatch = text.match(/^(https?:\/\/[^\s]+)$/);
    if (urlMatch) {
      const url = urlMatch[1];
      // Check for video URL first
      const videoAtt = videoAttachmentFromUrl(url);
      if (videoAtt) {
        e.preventDefault();
        setAttachments((prev) => [...prev, videoAtt]);
        setTimeout(checkEmpty, 0);
        return;
      }
      // Then check for image URL
      if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i)) {
        e.preventDefault();
        setAttachments((prev) => [...prev, { type: "image", url }]);
        setTimeout(checkEmpty, 0);
        return;
      }
    }
    e.preventDefault();
    const html = e.clipboardData?.getData("text/html");
    if (html) {
      const cleaned = sanitizeHtml(html);
      document.execCommand("insertHTML", false, cleaned);
    } else {
      document.execCommand("insertText", false, text);
    }
    setTimeout(checkEmpty, 0);
  };

  const addLink = (url: string, title?: string) => {
    // Auto-detect video URLs from the link popover
    const videoAtt = videoAttachmentFromUrl(url);
    if (videoAtt) {
      if (title) videoAtt.title = title;
      setAttachments((prev) => [...prev, videoAtt]);
    } else {
      setAttachments((prev) => [...prev, { type: "link", url, title }]);
    }
    setShowLinkPopover(false);
    setShowVideoPopover(false);
    setTimeout(checkEmpty, 0);
  };

  const addImage = (url: string) => {
    setAttachments((prev) => [...prev, { type: "image", url }]);
    setShowImagePopover(false);
    setTimeout(checkEmpty, 0);
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
    setTimeout(checkEmpty, 0);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processImageFiles(Array.from(files));
    }
  };

  return (
    <div
      className="rounded-[12px] relative"
      style={{
        background: "var(--surface-bg)",
        border: isDragging ? "2px dashed var(--accent-primary)" : "1px solid var(--border-default)",
      }}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-10 rounded-[12px] flex flex-col items-center justify-center gap-2 pointer-events-none"
          style={{ background: "var(--accent-primary-subtle)" }}
        >
          <UploadSimple size={32} weight="duotone" style={{ color: "var(--accent-primary)" }} />
          <span className="text-[14px] font-semibold" style={{ color: "var(--accent-primary)" }}>
            Drop images here
          </span>
        </div>
      )}

      <div className="flex gap-3 p-4 pb-2">
        <Avatar name={authorName} avatarUrl={authorAvatar} color={authorColor} size={36} />
        <div className="flex-1 min-w-0">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={checkEmpty}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            data-placeholder="Share an update with your team..."
            className="w-full min-h-[60px] outline-none text-[14px] leading-relaxed [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:pointer-events-none"
            style={{
              color: "var(--text-primary)",
              wordBreak: "break-word",
            }}
          />
          <style>{`
            [data-placeholder]:empty::before {
              color: var(--text-quaternary);
            }
          `}</style>
        </div>
      </div>

      {/* Uploading indicator */}
      {uploadingCount > 0 && (
        <div className="px-4 pb-2 pl-[60px]">
          <div
            className="flex items-center gap-2 text-[12px] font-medium animate-pulse"
            style={{ color: "var(--text-tertiary)" }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
            />
            Uploading {uploadingCount} image{uploadingCount > 1 ? "s" : ""}...
          </div>
        </div>
      )}

      {/* Attachments preview — images/videos as horizontal gallery strip, links as cards */}
      {attachments.length > 0 && (() => {
        const mediaAtts = attachments.map((a, i) => ({ ...a, _idx: i })).filter((a) => a.type === "image" || a.type === "video");
        const linkAtts = attachments.map((a, i) => ({ ...a, _idx: i })).filter((a) => a.type === "link");
        return (
          <div className="px-4 pb-2 pl-[60px] space-y-2">
            {/* Media gallery strip */}
            {mediaAtts.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaAtts.map((att) => (
                  <ComposerMediaThumb
                    key={`media-${att._idx}`}
                    att={att}
                    isSingle={mediaAtts.length === 1}
                    onRemove={() => removeAttachment(att._idx)}
                  />
                ))}
              </div>
            )}
            {/* Link cards */}
            {linkAtts.map((att) => (
              <AttachmentCard key={`link-${att._idx}`} attachment={att} onRemove={() => removeAttachment(att._idx)} />
            ))}
          </div>
        );
      })()}

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-4 py-1.5 pl-[60px]">
        <ToolbarBtn icon={TextB} label="Bold (⌘B)" onClick={() => execCmd("bold")} />
        <ToolbarBtn icon={TextItalic} label="Italic (⌘I)" onClick={() => execCmd("italic")} />
        <ToolbarBtn icon={TextStrikethrough} label="Strikethrough" onClick={() => execCmd("strikeThrough")} />
        <ToolbarBtn icon={ListBullets} label="Bullet list" onClick={() => execCmd("insertUnorderedList")} />
        <div className="w-px h-4 mx-1" style={{ background: "var(--border-default)" }} />
        <div className="relative">
          <ToolbarBtn icon={LinkIcon} label="Add link" onClick={() => { setShowLinkPopover(!showLinkPopover); setShowImagePopover(false); setShowVideoPopover(false); }} />
          {showLinkPopover && (
            <InsertPopover mode="link" onInsert={addLink} onClose={() => setShowLinkPopover(false)} />
          )}
        </div>
        <div className="relative">
          <ToolbarBtn icon={ImageIcon} label="Add image" onClick={() => { setShowImagePopover(!showImagePopover); setShowLinkPopover(false); setShowVideoPopover(false); }} />
          {showImagePopover && (
            <InsertPopover mode="image" onInsert={(url) => addImage(url)} onClose={() => setShowImagePopover(false)} />
          )}
        </div>
        <div className="relative">
          <ToolbarBtn icon={VideoCamera} label="Add video" onClick={() => { setShowVideoPopover(!showVideoPopover); setShowLinkPopover(false); setShowImagePopover(false); }} />
          {showVideoPopover && (
            <InsertPopover mode="video" onInsert={(url) => addLink(url)} onClose={() => setShowVideoPopover(false)} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-t"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="flex items-center gap-2">
          <SpaceSelector spaces={spaces} value={spaceId} onChange={setSpaceId} />
        </div>

        <button
          onClick={handlePost}
          disabled={(isEmpty && attachments.length === 0) || posting}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "var(--accent-primary)",
          }}
        >
          <PaperPlaneTilt size={15} weight="fill" />
          {posting ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}

/* ─── Single Update Card ─── */
function UpdateCard({
  update,
  spaces,
  currentUserId,
  onReact,
  onComment,
  onDelete,
  onEdit,
  onToggleComments,
  onChangeSpace,
}: {
  update: UpdatePost;
  spaces: Space[];
  currentUserId: string;
  onReact: (updateId: string, emoji: string) => void;
  onComment: (updateId: string, text: string) => void;
  onDelete: (updateId: string) => void;
  onEdit: (updateId: string, content: string) => void;
  onToggleComments: (updateId: string, disabled: boolean) => void;
  onChangeSpace: (updateId: string, spaceId: string | null) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showSpaceSubmenu, setShowSpaceSubmenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const editRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);

  const space = update.spaceId ? spaces.find((s) => s.id === update.spaceId) : null;

  // Close dropdowns on outside click
  useEffect(() => {
    if (!showMenu && !showReactionPicker) return;
    const handler = (e: MouseEvent) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) { setShowMenu(false); setShowSpaceSubmenu(false); }
      if (showReactionPicker && reactionRef.current && !reactionRef.current.contains(e.target as Node)) setShowReactionPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu, showReactionPicker]);

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(update.id, commentText);
    setCommentText("");
  };

  const isAuthor = update.authorId === currentUserId;

  // Separate media (images + videos) from link attachments for social-style rendering
  const mediaAttachments = (update.attachments || []).filter((a) => a.type === "image" || a.type === "video");
  const linkAttachments = (update.attachments || []).filter((a) => a.type === "link");
  const hasMedia = mediaAttachments.length > 0;
  const contentText = (update.content || "").replace(/<[^>]*>/g, "").trim();
  const hasContent = contentText.length > 0;

  // Build lightbox items from media attachments
  const lightboxItems: LightboxItem[] = mediaAttachments.map((a) => {
    if (a.type === "video") {
      const info = parseVideoUrl(a.url);
      return {
        type: "video" as const,
        url: a.thumbnailUrl || a.url,
        embedUrl: info?.embedUrl || a.url,
        provider: a.provider,
      };
    }
    return { type: "image" as const, url: a.url };
  });

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div
      className="rounded-[12px] overflow-hidden"
      style={{
        background: "var(--surface-bg)",
        border: `1px solid ${!update.isRead ? "var(--accent-primary)" : "var(--border-default)"}`,
        boxShadow: !update.isRead ? "0 0 0 1px var(--accent-primary-subtle)" : undefined,
      }}
    >
      {/* Header */}
      <div className={`flex items-start gap-3 p-4 ${hasContent ? "pb-0" : hasMedia ? "pb-3" : "pb-0"}`}>
        <Avatar name={update.authorName} avatarUrl={update.authorAvatar} color={update.authorColor} size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {update.authorName}
            </span>
            {space && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: space.color.replace(")", " / 0.1)"),
                  color: space.color,
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: space.color }} />
                {space.name}
              </span>
            )}
            {!update.isRead && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: "var(--accent-primary)" }}
              />
            )}
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {timeAgo(update.createdAt)}
          </p>
        </div>

        {/* Menu */}
        {isAuthor && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setShowMenu(!showMenu); setShowSpaceSubmenu(false); }}
              className="w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-quaternary)" }}
            >
              <DotsThree size={18} weight="bold" />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 z-50 w-[200px] rounded-[8px] py-1 shadow-lg"
                style={{
                  background: "var(--surface-bg)",
                  border: "1px solid var(--border-default)",
                }}
              >
                {/* Edit Post */}
                <button
                  onClick={() => {
                    setEditContent(update.content || "");
                    setIsEditing(true);
                    setShowMenu(false);
                    setTimeout(() => editRef.current?.focus(), 50);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ color: "var(--text-primary)" }}
                >
                  <PencilSimple size={15} />
                  Edit post
                </button>

                {/* Toggle Comments */}
                <button
                  onClick={() => {
                    onToggleComments(update.id, !update.commentsDisabled);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ color: "var(--text-primary)" }}
                >
                  <ChatCircleDots size={15} />
                  {update.commentsDisabled ? "Enable comments" : "Disable comments"}
                </button>

                {/* Change Space — submenu */}
                <div className="relative">
                  <button
                    onClick={() => setShowSpaceSubmenu(!showSpaceSubmenu)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <ArrowsLeftRight size={15} />
                    <span className="flex-1 text-left">Change space</span>
                    <CaretDown size={12} className={`transition-transform ${showSpaceSubmenu ? "rotate-180" : ""}`} style={{ color: "var(--text-quaternary)" }} />
                  </button>
                  {showSpaceSubmenu && (
                    <div
                      className="mx-1.5 mb-1 rounded-[6px] py-1 max-h-[200px] overflow-y-auto"
                      style={{ background: "var(--page-bg)" }}
                    >
                      {/* No space / General */}
                      <button
                        onClick={() => { onChangeSpace(update.id, null); setShowMenu(false); setShowSpaceSubmenu(false); }}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        style={{ color: update.spaceId === null ? "var(--accent-primary)" : "var(--text-secondary)" }}
                      >
                        <div className="w-3.5 h-3.5 rounded-full" style={{ background: "var(--text-quaternary)" }} />
                        <span className="flex-1 text-left">General</span>
                        {update.spaceId === null && <Check size={13} weight="bold" />}
                      </button>
                      {spaces.map((s) => {
                        const selected = update.spaceId === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => { onChangeSpace(update.id, s.id); setShowMenu(false); setShowSpaceSubmenu(false); }}
                            className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                            style={{ color: selected ? "var(--accent-primary)" : "var(--text-secondary)" }}
                          >
                            <div className="w-3.5 h-3.5 rounded-full" style={{ background: s.color }} />
                            <span className="flex-1 text-left truncate">{s.name}</span>
                            {selected && <Check size={13} weight="bold" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="my-1 border-t" style={{ borderColor: "var(--border-default)" }} />

                {/* Delete */}
                <button
                  onClick={() => { onDelete(update.id); setShowMenu(false); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ color: "oklch(0.65 0.2 25)" }}
                >
                  <Trash size={15} />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content — reduced bottom padding when media follows */}
      {isEditing ? (
        <div className="px-4 py-3">
          <div
            ref={editRef}
            contentEditable
            suppressContentEditableWarning
            className="text-[14px] leading-relaxed rounded-[8px] px-3 py-2 min-h-[60px] outline-none focus:ring-2"
            style={{
              color: "var(--text-primary)",
              background: "var(--page-bg)",
              border: "1px solid var(--border-default)",
              focusRingColor: "var(--accent-primary)",
            }}
            dangerouslySetInnerHTML={{ __html: update.contentFormat === "html" ? update.content : update.content.replace(/\n/g, "<br>") }}
            onInput={(e) => setEditContent((e.target as HTMLDivElement).innerHTML)}
          />
          <div className="flex items-center gap-2 mt-2 justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onEdit(update.id, editContent);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 rounded-[6px] text-[12px] font-semibold text-white transition-colors"
              style={{ background: "var(--accent-primary)" }}
            >
              Save
            </button>
          </div>
        </div>
      ) : hasContent ? (
        <div className={`px-4 ${hasMedia ? "pt-3 pb-2" : "py-3"}`}>
          {update.contentFormat === "html" ? (
            <div
              className="text-[14px] leading-relaxed update-rich-content"
              style={{ color: "var(--text-primary)" }}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(update.content) }}
            />
          ) : (
            <p
              className="text-[14px] leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-primary)" }}
            >
              {update.content}
            </p>
          )}
          <style>{`
            .update-rich-content b, .update-rich-content strong { font-weight: 600; }
            .update-rich-content i, .update-rich-content em { font-style: italic; }
            .update-rich-content s, .update-rich-content del { text-decoration: line-through; }
            .update-rich-content ul { list-style: disc; padding-left: 1.5em; margin: 0.25em 0; }
            .update-rich-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.25em 0; }
            .update-rich-content li { margin: 0.1em 0; }
            .update-rich-content a { color: var(--accent-primary); text-decoration: underline; text-underline-offset: 2px; }
            .update-rich-content a:hover { opacity: 0.8; }
          `}</style>
        </div>
      ) : null}

      {/* Full-bleed media gallery (edge-to-edge, no horizontal padding) */}
      {hasMedia && (
        <MediaGallery
          media={mediaAttachments}
          onOpenLightbox={(i) => setLightboxIndex(i)}
        />
      )}

      {/* Media Lightbox (images + video embeds) */}
      {lightboxIndex !== null && (
        <MediaLightbox
          items={lightboxItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Link attachments — still rendered as cards with padding */}
      {linkAttachments.length > 0 && (
        <div className="px-4 py-2 space-y-2">
          {linkAttachments.map((att, idx) => (
            <AttachmentCard key={`${att.url}-${idx}`} attachment={att} />
          ))}
        </div>
      )}

      {/* Action bar — my reactions left, others' reactions right */}
      {(() => {
        const myReactions = update.reactions.filter((r) => r.userIds.includes(currentUserId));
        const othersReactions = update.reactions.filter((r) => !r.userIds.includes(currentUserId));
        return (
          <div
            className="flex items-center gap-1.5 px-3 py-2 border-t"
            style={{ borderColor: "var(--border-default)" }}
          >
            {/* Left — React picker, Comment, then my reaction pills */}
            <div className="flex items-center gap-1 flex-wrap">
              <div className="relative" ref={reactionRef}>
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <SmileySticker size={16} />
                  React
                </button>
                {showReactionPicker && (
                  <div
                    className="absolute left-0 bottom-full mb-1 z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-[10px] shadow-lg"
                    style={{
                      background: "var(--surface-bg)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { onReact(update.id, emoji); setShowReactionPicker(false); }}
                        className="w-8 h-8 flex items-center justify-center rounded-[6px] text-[18px] transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.06]"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                style={{ color: update.commentsDisabled ? "var(--text-quaternary)" : "var(--text-tertiary)" }}
              >
                <ChatTeardropText size={16} />
                {update.commentsDisabled
                  ? "Comments off"
                  : update.comments.length > 0
                    ? `${update.comments.length} comment${update.comments.length > 1 ? "s" : ""}`
                    : "Comment"}
              </button>

              {/* My reaction pills — accent-colored, inline with actions */}
              {myReactions.map((r) => (
                <button
                  key={r.emoji}
                  onClick={() => onReact(update.id, r.emoji)}
                  className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[12px] font-semibold transition-colors"
                  style={{
                    background: "var(--accent-primary-subtle)",
                    border: "1px solid var(--accent-primary)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <span>{r.emoji}</span>
                  <span>{r.userIds.length}</span>
                </button>
              ))}
            </div>

            {/* Right — others' reaction pills */}
            {othersReactions.length > 0 && (
              <div className="flex items-center gap-1 ml-auto flex-wrap justify-end">
                {othersReactions.map((r) => (
                  <button
                    key={r.emoji}
                    onClick={() => onReact(update.id, r.emoji)}
                    className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[12px] transition-colors hover:border-[var(--text-quaternary)]"
                    style={{
                      background: "var(--page-bg)",
                      border: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.userIds.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Comments section */}
      {showComments && (
        <div
          className="border-t px-4 py-3"
          style={{ borderColor: "var(--border-default)" }}
        >
          {update.comments.length > 0 && (
            <div className="space-y-3 mb-3">
              {update.comments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <Avatar
                    name={comment.authorName}
                    avatarUrl={comment.authorAvatar}
                    color={comment.authorColor}
                    size={28}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {comment.authorName}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          {update.commentsDisabled ? (
            <p className="text-[12px] italic" style={{ color: "var(--text-quaternary)" }}>
              Comments have been turned off for this post.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent outline-none text-[13px] px-3 py-2 rounded-[8px]"
                style={{
                  color: "var(--text-primary)",
                  background: "var(--page-bg)",
                  border: "1px solid var(--border-default)",
                }}
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                className="w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors disabled:opacity-30"
                style={{
                  background: "var(--accent-primary)",
                  color: "#fff",
                }}
              >
                <PaperPlaneTilt size={14} weight="fill" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN UPDATES PAGE
   ═══════════════════════════════════════════════════════════ */

export function UpdatesPage() {
  const { profile, user } = useAuth();
  const { spaces } = useData();
  const [updates, setUpdates] = useState<UpdatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSpaceId, setFilterSpaceId] = useState<string | null>(null);
  const spaceList = Array.isArray(spaces) ? spaces.filter((s) => s.visible !== false) : [];

  const userId = user?.id || "";
  const authorName = profile?.displayName || user?.email?.split("@")[0] || "User";
  const authorAvatar = profile?.avatarUrl || null;
  const authorColor = profile?.avatarColor || "oklch(0.82 0.12 25)";

  const fetchUpdates = useCallback(async () => {
    try {
      const params = filterSpaceId ? `?spaceId=${filterSpaceId}` : "";
      const res = await api.get<{ updates: UpdatePost[]; total: number }>(`/updates${params}`);
      if (res.data?.updates) {
        // Ensure newest-first order on the frontend
        const sorted = [...res.data.updates].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setUpdates(sorted);

        // Mark visible updates as read
        const unreadIds = sorted.filter((u) => !u.isRead).map((u) => u.id);
        if (unreadIds.length > 0) {
          api.post("/updates/mark-read", { updateIds: unreadIds }).catch(() => {});
        }
      }
    } catch (err) {
      console.error("[UpdatesPage] Failed to fetch updates:", err);
    } finally {
      setLoading(false);
    }
  }, [filterSpaceId]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Poll for new updates every 30s
  useEffect(() => {
    const interval = setInterval(fetchUpdates, 30000);
    return () => clearInterval(interval);
  }, [fetchUpdates]);

  const handlePost = async (content: string, spaceId: string | null, contentFormat: "html", attachments: UpdateAttachment[]) => {
    const res = await api.post<{ update: UpdatePost }>("/updates", {
      content,
      spaceId,
      authorName,
      authorAvatar,
      authorColor,
      contentFormat,
      attachments,
    });
    if (res.data?.update) {
      setUpdates((prev) => [{ ...res.data!.update, isRead: true }, ...prev]);
    }
  };

  const handleReact = async (updateId: string, emoji: string) => {
    // Optimistic
    setUpdates((prev) =>
      prev.map((u) => {
        if (u.id !== updateId) return u;
        const reactions = [...u.reactions];
        const idx = reactions.findIndex((r) => r.emoji === emoji);
        if (idx >= 0) {
          const userIds = [...reactions[idx].userIds];
          const uidx = userIds.indexOf(userId);
          if (uidx >= 0) {
            userIds.splice(uidx, 1);
            if (userIds.length === 0) reactions.splice(idx, 1);
            else reactions[idx] = { ...reactions[idx], userIds };
          } else {
            reactions[idx] = { ...reactions[idx], userIds: [...userIds, userId] };
          }
        } else {
          reactions.push({ emoji, userIds: [userId] });
        }
        return { ...u, reactions };
      })
    );
    await api.post(`/updates/${updateId}/react`, { emoji });
  };

  const handleComment = async (updateId: string, text: string) => {
    const res = await api.post<{ comment: UpdateComment }>(`/updates/${updateId}/comment`, {
      text,
      authorName,
      authorAvatar,
      authorColor,
    });
    if (res.data?.comment) {
      setUpdates((prev) =>
        prev.map((u) =>
          u.id === updateId ? { ...u, comments: [...u.comments, res.data!.comment] } : u
        )
      );
    }
  };

  const handleDelete = async (updateId: string) => {
    setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    await api.del(`/updates/${updateId}`);
  };

  const handleEdit = async (updateId: string, content: string) => {
    // Optimistic
    setUpdates((prev) =>
      prev.map((u) => (u.id === updateId ? { ...u, content, contentFormat: "html" as const } : u))
    );
    const res = await api.patch<{ update: UpdatePost }>(`/updates/${updateId}`, {
      content,
      contentFormat: "html",
    });
    if (res.data?.update) {
      setUpdates((prev) => prev.map((u) => (u.id === updateId ? { ...res.data!.update, isRead: u.isRead } : u)));
    }
  };

  const handleToggleComments = async (updateId: string, disabled: boolean) => {
    setUpdates((prev) =>
      prev.map((u) => (u.id === updateId ? { ...u, commentsDisabled: disabled } : u))
    );
    await api.patch(`/updates/${updateId}`, { commentsDisabled: disabled });
  };

  const handleChangeSpace = async (updateId: string, spaceId: string | null) => {
    setUpdates((prev) =>
      prev.map((u) => (u.id === updateId ? { ...u, spaceId } : u))
    );
    const res = await api.patch<{ update: UpdatePost }>(`/updates/${updateId}`, { spaceId });
    if (res.data?.update) {
      setUpdates((prev) => prev.map((u) => (u.id === updateId ? { ...res.data!.update, isRead: u.isRead } : u)));
    }
  };

  return (
    <div className="max-w-[640px] mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center"
            style={{ background: "var(--accent-primary-subtle)" }}
          >
            <Newspaper size={22} weight="duotone" style={{ color: "var(--accent-primary)" }} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold" style={{ color: "var(--text-primary)" }}>
              Updates
            </h1>
            <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              Share progress and updates with your team
            </p>
          </div>
        </div>

        {/* Filter by space */}
        {spaceList.length > 0 && (
          <SpaceSelector spaces={spaceList} value={filterSpaceId} onChange={setFilterSpaceId} />
        )}
      </div>

      {/* Composer */}
      <div className="mb-6">
        <UpdateComposer
          spaces={spaceList}
          onPost={handlePost}
          authorName={authorName}
          authorAvatar={authorAvatar}
          authorColor={authorColor}
        />
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[12px] p-4 animate-pulse"
              style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full" style={{ background: "var(--neutral-200)" }} />
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded" style={{ background: "var(--neutral-200)" }} />
                  <div className="h-2.5 w-16 rounded" style={{ background: "var(--neutral-200)" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded" style={{ background: "var(--neutral-200)" }} />
                <div className="h-3 w-3/4 rounded" style={{ background: "var(--neutral-200)" }} />
              </div>
            </div>
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div
            className="w-16 h-16 rounded-[14px] flex items-center justify-center"
            style={{ background: "var(--accent-primary-subtle)" }}
          >
            <Newspaper size={32} weight="duotone" style={{ color: "var(--accent-primary)" }} />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No updates yet
            </p>
            <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              Be the first to share an update with your team!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <UpdateCard
              key={update.id}
              update={update}
              spaces={spaceList}
              currentUserId={userId}
              onReact={handleReact}
              onComment={handleComment}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onToggleComments={handleToggleComments}
              onChangeSpace={handleChangeSpace}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default UpdatesPage;