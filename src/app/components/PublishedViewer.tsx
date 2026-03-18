/* ═══════════════════════════════════════════════════════════
   PUBLISHED VIEWER — Public page for viewing published docs/projects.

   Accessed via /#/published/<slug>. No auth required.
   Fetches content from the /published/:slug endpoint and renders
   a clean, read-only view.

   Phase 7 P7-3 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  NotePencil,
  VideoCamera,
  FilmScript,
  CalendarBlank,
  Users,
  Globe,
  CircleNotch,
  Sparkle,
  WarningCircle,
  CheckCircle,
  Circle,
  CircleHalf,
  Prohibit,
} from "@phosphor-icons/react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import type { DocBlock } from "../lib/types";
import { ProjectIcon } from "./ProjectIcon";

/* ─── Constants ─── */

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a038f2e0`;

const DOC_TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  doc: { label: "Document", icon: FileText, color: "oklch(0.55 0.2 280)" },
  note: { label: "Note", icon: NotePencil, color: "oklch(0.65 0.15 155)" },
  meeting: { label: "Meeting Notes", icon: VideoCamera, color: "oklch(0.7 0.18 25)" },
  script: { label: "Script", icon: FilmScript, color: "oklch(0.85 0.15 85)" },
};

/* ═══════════════════════════════════════════════════════════
   PUBLISHED VIEWER COMPONENT
   ═══════════════════════════════════════════════════════════ */

export function PublishedViewer({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchPublished = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${SERVER_BASE}/published/${slug}`, {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        });
        if (!response.ok) {
          if (response.status === 404) {
            setError("This published link is no longer available.");
          } else {
            setError(`Failed to load published content (${response.status})`);
          }
          return;
        }
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError("Failed to load published content. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchPublished();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.005 260)" }}>
        <div className="text-center space-y-4">
          <CircleNotch
            className="w-8 h-8 animate-spin mx-auto"
            style={{ color: "oklch(0.6 0.02 260)" }}
          />
          <p style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px" }}>Loading published content...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.005 260)" }}>
        <div className="text-center space-y-4 max-w-md px-4">
          <WarningCircle className="w-12 h-12 mx-auto" style={{ color: "oklch(0.7 0.18 25)" }} />
          <h1 style={{ color: "oklch(0.2 0.02 260)", fontSize: "20px", fontWeight: 700 }}>
            Content Not Found
          </h1>
          <p style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px" }}>
            {error || "This published link may have been removed or is no longer available."}
          </p>
        </div>
      </div>
    );
  }

  // Render based on type
  if (data.type === "doc") {
    return <PublishedDocView data={data} />;
  } else if (data.type === "project") {
    return <PublishedProjectView data={data} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.005 260)" }}>
      <p style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px" }}>Unknown content type</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PUBLISHED DOC VIEW
   ═══════════════════════════════════════════════════════════ */

function PublishedDocView({ data }: { data: any }) {
  const meta = DOC_TYPE_META[data.docType] || DOC_TYPE_META.doc;
  const Icon = meta.icon;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "oklch(0.985 0.005 260)",
        fontFamily: "'Albert Sans', system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[6px] flex items-center justify-center"
              style={{ background: "oklch(0.7 0.18 25)", color: "white" }}
            >
              <Sparkle className="w-4 h-4" weight="fill" />
            </div>
            <span style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", fontWeight: 600 }}>Canto</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" style={{ color: "oklch(0.47 0.12 155)" }} />
            <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px" }}>Published Document</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Type badge */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: `${meta.color}15`, color: meta.color, fontSize: "12px", fontWeight: 500 }}
          >
            <Icon className="w-3.5 h-3.5" />
            {meta.label}
          </div>
          {data.publishedAt && (
            <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "12px" }}>
              Published {new Date(data.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        {/* Meeting info */}
        {data.docType === "meeting" && (
          <div
            className="flex flex-wrap items-center gap-3 mb-6 px-4 py-3 rounded-[8px]"
            style={{ background: `${meta.color}10` }}
          >
            {data.meetingDate && (
              <span className="inline-flex items-center gap-1.5" style={{ color: meta.color, fontSize: "13px" }}>
                <CalendarBlank className="w-4 h-4" />
                {data.meetingDate}
              </span>
            )}
            {data.attendees?.length > 0 && (
              <span className="inline-flex items-center gap-1.5" style={{ color: meta.color, fontSize: "13px" }}>
                <Users className="w-4 h-4" />
                {data.attendees.length} attendee{data.attendees.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h1
          className="mb-8"
          style={{
            color: "oklch(0.15 0.02 260)",
            fontSize: "32px",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {data.title || "Untitled"}
        </h1>

        {/* Blocks */}
        <div className="space-y-3">
          {(data.blocks || []).map((block: DocBlock, i: number) => (
            <PublishedBlock key={block.id || i} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Block decoration/style wrapper ─── */

const FONT_FAMILIES: Record<string, string> = {
  system: "'Albert Sans', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier Prime', 'SF Mono', monospace",
  round: "'Nunito', 'Comic Neue', system-ui, sans-serif",
};

function BlockWrapper({ block, children }: { block: DocBlock; children: React.ReactNode }) {
  const hasDecoration = block.decoration === "focus" || block.decoration === "block";
  const hasColor = !!block.color;
  const hasFont = !!block.fontStyle;

  if (!hasDecoration && !hasColor && !hasFont) return <>{children}</>;

  const style: React.CSSProperties = {};
  if (hasColor) style.color = block.color;
  if (hasFont && block.fontStyle) style.fontFamily = FONT_FAMILIES[block.fontStyle] || undefined;

  if (block.decoration === "focus") {
    return (
      <div
        className="pl-4 my-1"
        style={{
          borderLeft: "3px solid oklch(0.55 0.15 240)",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  if (block.decoration === "block") {
    return (
      <div
        className="px-4 py-3 rounded-[8px] my-1"
        style={{
          background: "oklch(0.96 0.005 260)",
          border: "1px solid oklch(0.92 0.01 260)",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  return <div style={style}>{children}</div>;
}

/* ─── Helper: check if content has HTML tags ─── */
function hasHtml(content: string): boolean {
  return /<\w/.test(content);
}

/* ─── Render rich text content (supports inline HTML formatting) ─── */
function RichContent({ content, style, className }: { content: string; style?: React.CSSProperties; className?: string }) {
  if (hasHtml(content)) {
    return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: content }} />;
  }
  return <span className={className} style={style}>{content}</span>;
}

/* ─── Render a single block ─── */

function PublishedBlock({ block }: { block: DocBlock }) {
  const content = block.content || "";

  const inner = (() => {
  switch (block.type) {
    case "heading": {
      const Tag = block.level === 1 ? "h2" : block.level === 3 ? "h4" : "h3";
      const sizes: Record<number, string> = { 1: "24px", 2: "20px", 3: "16px" };
      const headingStyle: React.CSSProperties = {
        color: block.color || "oklch(0.15 0.02 260)",
        fontSize: sizes[block.level || 2] || "20px",
        fontWeight: 700,
        lineHeight: 1.3,
        marginTop: "1.5em",
        marginBottom: "0.5em",
      };
      if (hasHtml(content)) {
        return <Tag style={headingStyle} dangerouslySetInnerHTML={{ __html: content }} />;
      }
      return <Tag style={headingStyle}>{content}</Tag>;
    }

    case "bulleted-list":
      return (
        <div className="flex gap-2" style={{ paddingLeft: "4px" }}>
          <span style={{ color: "oklch(0.5 0.02 260)", marginTop: "2px" }}>•</span>
          <p style={{ color: block.color || "oklch(0.25 0.02 260)", fontSize: "15px", lineHeight: 1.7 }}>
            <RichContent content={content} />
          </p>
        </div>
      );

    case "numbered-list":
      return (
        <div className="flex gap-2" style={{ paddingLeft: "4px" }}>
          <p style={{ color: block.color || "oklch(0.25 0.02 260)", fontSize: "15px", lineHeight: 1.7 }}>
            <RichContent content={content} />
          </p>
        </div>
      );

    case "checklist":
      return (
        <div className="flex items-start gap-2">
          <div
            className="w-4 h-4 rounded-[3px] border mt-1 flex items-center justify-center shrink-0"
            style={{
              borderColor: block.checked ? "oklch(0.65 0.15 180)" : "oklch(0.8 0.01 260)",
              background: block.checked ? "oklch(0.65 0.15 180)" : "transparent",
            }}
          >
            {block.checked && (
              <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p
            style={{
              color: block.checked ? "oklch(0.6 0.02 260)" : (block.color || "oklch(0.25 0.02 260)"),
              fontSize: "15px",
              lineHeight: 1.7,
              textDecoration: block.checked ? "line-through" : "none",
            }}
          >
            <RichContent content={content} />
          </p>
        </div>
      );

    case "quote":
      return (
        <blockquote
          className="pl-4"
          style={{
            borderLeft: "3px solid oklch(0.7 0.18 25)",
            color: block.color || "oklch(0.4 0.02 260)",
            fontSize: "15px",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          <RichContent content={content} />
        </blockquote>
      );

    case "code":
      return (
        <pre
          className="px-4 py-3 rounded-[6px] overflow-x-auto"
          style={{
            background: "oklch(0.95 0.005 260)",
            border: "1px solid oklch(0.92 0.01 260)",
            color: "oklch(0.3 0.02 260)",
            fontSize: "13px",
            fontFamily: "'SF Mono', 'Fira Code', 'Menlo', monospace",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {content}
        </pre>
      );

    case "divider":
      return <hr style={{ border: "none", borderTop: "1px solid oklch(0.92 0.01 260)", margin: "1.5em 0" }} />;

    case "image":
      return block.imageUrl ? (
        <figure className="my-4">
          <img
            src={block.imageUrl}
            alt={block.imageAlt || ""}
            className="rounded-[8px] max-w-full"
            style={{ border: "1px solid oklch(0.92 0.01 260)" }}
          />
          {block.imageAlt && (
            <figcaption className="mt-2 text-center" style={{ color: "oklch(0.6 0.02 260)", fontSize: "13px" }}>
              {block.imageAlt}
            </figcaption>
          )}
        </figure>
      ) : null;

    case "callout": {
      const calloutColor = block.calloutColor || "#3B82F6";
      return (
        <div
          className="flex items-start gap-3 rounded-[8px] px-4 py-3 my-2"
          style={{ background: `${calloutColor}12`, border: `1px solid ${calloutColor}30` }}
        >
          <div
            className="w-6 h-6 rounded-[5px] flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${calloutColor}20`, color: calloutColor, fontSize: "14px" }}
          >
            {block.calloutIcon === "lightbulb" ? "\u{1F4A1}" : block.calloutIcon === "warning" ? "\u26A0" : block.calloutIcon === "star" ? "\u2B50" : block.calloutIcon === "lightning" ? "\u26A1" : "\u2139"}
          </div>
          <p style={{ color: "oklch(0.25 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>{content}</p>
        </div>
      );
    }

    case "toggle":
      return (
        <details className="my-1" open={!block.collapsed}>
          <summary
            className="cursor-pointer font-medium"
            style={{ color: "oklch(0.25 0.02 260)", fontSize: "15px", lineHeight: 1.7 }}
          >
            {content || "Toggle"}
          </summary>
          {block.children?.map((child, i) => (
            <div key={i} className="pl-5 mt-1">
              <PublishedBlock block={child} />
            </div>
          ))}
        </details>
      );

    case "embed": {
      const getEmbedSrc = (url: string): string | null => {
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
        const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
        if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        return null;
      };
      const embedSrc = block.embedUrl ? getEmbedSrc(block.embedUrl) : null;
      return embedSrc ? (
        <div className="my-4 rounded-[8px] overflow-hidden" style={{ border: "1px solid oklch(0.92 0.01 260)" }}>
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embedSrc}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video embed"
            />
          </div>
        </div>
      ) : null;
    }

    case "table": {
      const table = block.tableData || { headers: [], rows: [] };
      return (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse rounded-[8px] overflow-hidden" style={{ border: "1px solid oklch(0.92 0.01 260)" }}>
            <thead>
              <tr>
                {table.headers.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-2 text-left"
                    style={{
                      background: "oklch(0.96 0.005 260)",
                      borderBottom: "1px solid oklch(0.92 0.01 260)",
                      borderRight: i < table.headers.length - 1 ? "1px solid oklch(0.92 0.01 260)" : undefined,
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "oklch(0.4 0.02 260)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-1.5"
                      style={{
                        borderBottom: ri < table.rows.length - 1 ? "1px solid oklch(0.92 0.01 260)" : undefined,
                        borderRight: ci < row.length - 1 ? "1px solid oklch(0.92 0.01 260)" : undefined,
                        fontSize: "13px",
                        color: "oklch(0.25 0.02 260)",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    /* ─── Screenplay blocks ─── */
    case "scene-heading":
      return (
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: "14px", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.8,
          color: "oklch(0.15 0.02 260)", marginTop: "1.5em",
        }}>
          {content}
        </p>
      );

    case "action":
      return (
        <p style={{ fontFamily: "'Courier Prime', monospace", fontSize: "14px", lineHeight: 1.8, color: "oklch(0.25 0.02 260)" }}>
          {content}
        </p>
      );

    case "character":
      return (
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: "14px", fontWeight: 700,
          textTransform: "uppercase", textAlign: "center", paddingLeft: "25%",
          lineHeight: 1.8, color: "oklch(0.15 0.02 260)",
        }}>
          {content}
        </p>
      );

    case "dialogue":
      return (
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: "14px",
          paddingLeft: "15%", paddingRight: "15%", lineHeight: 1.8,
          color: "oklch(0.25 0.02 260)",
        }}>
          {content}
        </p>
      );

    case "parenthetical":
      return (
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: "14px", fontStyle: "italic",
          paddingLeft: "20%", paddingRight: "20%", lineHeight: 1.8,
          color: "oklch(0.4 0.02 260)",
        }}>
          ({content})
        </p>
      );

    case "transition":
      return (
        <p style={{
          fontFamily: "'Courier Prime', monospace", fontSize: "14px", fontWeight: 700,
          textTransform: "uppercase", textAlign: "right", lineHeight: 1.8,
          color: "oklch(0.15 0.02 260)",
        }}>
          {content}
        </p>
      );

    /* ─── Unsplash image ─── */
    case "unsplash-image":
      return block.unsplashMeta?.url ? (
        <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid oklch(0.9 0 0)" }}>
          <img src={block.unsplashMeta.url} alt="" style={{ width: "100%", maxHeight: "400px", objectFit: "cover" }} />
          <div style={{ padding: "8px 12px", background: "oklch(0.97 0 0)", fontSize: "11px", color: "oklch(0.55 0 0)" }}>
            Photo by{" "}
            <a href={block.unsplashMeta.photographerUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "oklch(0.4 0 0)" }}>
              {block.unsplashMeta.photographer}
            </a>
            {" "}on{" "}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "oklch(0.4 0 0)" }}>
              Unsplash
            </a>
          </div>
        </div>
      ) : null;

    /* ─── Gallery ─── */
    case "gallery": {
      const images = block.galleryImages || [];
      if (images.length === 0) return null;
      const cols = images.length === 1 ? 1 : images.length === 2 ? 2 : 3;
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px" }}>
          {images.map((img, i) => (
            <div key={img.id || i} style={{ borderRadius: "6px", overflow: "hidden", border: "1px solid oklch(0.9 0 0)", position: "relative" }}>
              <img src={img.thumbUrl || img.url} alt="" style={{ width: "100%", height: "140px", objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 8px", background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)" }}>{img.photographer}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      // paragraph
      return content ? (
        <p style={{ color: block.color || "oklch(0.25 0.02 260)", fontSize: "15px", lineHeight: 1.7 }}>
          <RichContent content={content} />
        </p>
      ) : (
        <div style={{ height: "0.5em" }} />
      );
  }
  })();

  return <BlockWrapper block={block}>{inner}</BlockWrapper>;
}

/* ═══════════════════════════════════════════════════════════
   PUBLISHED PROJECT VIEW
   ═══════════════════════════════════════════════════════════ */

function PublishedProjectView({ data }: { data: any }) {
  const project = data.data || {};
  const tasks = project.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.completed).length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Group tasks by section
  const sections = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const t of tasks) {
      const sec = t.section || "Tasks";
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(t);
    }
    return Array.from(map.entries());
  }, [tasks]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" style={{ color: "oklch(0.65 0.15 180)" }} weight="fill" />;
      case "in-progress": return <CircleHalf className="w-4 h-4" style={{ color: "oklch(0.55 0.2 280)" }} weight="fill" />;
      case "hold": return <Prohibit className="w-4 h-4" style={{ color: "oklch(0.85 0.15 85)" }} />;
      default: return <Circle className="w-4 h-4" style={{ color: "oklch(0.75 0.01 260)" }} />;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "oklch(0.985 0.005 260)",
        fontFamily: "'Albert Sans', system-ui, sans-serif",
      }}
    >
      {/* Top bar */}
      <div
        className="border-b px-4 py-3"
        style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[6px] flex items-center justify-center"
              style={{ background: "oklch(0.7 0.18 25)", color: "white" }}
            >
              <Sparkle className="w-4 h-4" weight="fill" />
            </div>
            <span style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", fontWeight: 600 }}>Canto</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" style={{ color: "oklch(0.47 0.12 155)" }} />
            <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px" }}>Published Project</span>
          </div>
        </div>
      </div>

      {/* Banner */}
      {project.bannerImage && (
        <div className="w-full h-48 sm:h-64 relative overflow-hidden">
          <img
            src={project.bannerImage}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <ProjectIcon
            phosphorIcon={project.phosphorIcon}
            color={project.color}
            iconUrl={project.iconUrl}
            size="lg"
          />
          <h1
            style={{
              color: "oklch(0.15 0.02 260)",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            {project.name}
          </h1>
        </div>

        {project.description && (
          <p className="mb-6" style={{ color: "oklch(0.4 0.02 260)", fontSize: "15px", lineHeight: 1.7 }}>
            {project.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-8 p-4 rounded-[8px]" style={{ background: "white", border: "1px solid oklch(0.92 0.01 260)" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ color: "oklch(0.35 0.02 260)", fontSize: "14px", fontWeight: 600 }}>
              Progress
            </span>
            <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "13px" }}>
              {completedTasks}/{totalTasks} tasks ({completionPct}%)
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ background: "oklch(0.94 0.005 260)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${completionPct}%`,
                background: "oklch(0.65 0.15 180)",
              }}
            />
          </div>
        </div>

        {/* Task sections */}
        {sections.map(([sectionName, sectionTasks]) => (
          <div key={sectionName} className="mb-6">
            <h2
              className="mb-3 pb-2 border-b"
              style={{
                color: "oklch(0.25 0.02 260)",
                fontSize: "16px",
                fontWeight: 600,
                borderColor: "oklch(0.92 0.01 260)",
              }}
            >
              {sectionName}
            </h2>
            <div className="space-y-1">
              {sectionTasks.map((task: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[6px]"
                  style={{
                    background: task.completed ? "oklch(0.97 0.005 180)" : "white",
                  }}
                >
                  {statusIcon(task.completed ? "completed" : task.status)}
                  <span
                    style={{
                      color: task.completed ? "oklch(0.55 0.02 260)" : "oklch(0.25 0.02 260)",
                      fontSize: "14px",
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </span>
                  {task.date && (
                    <span className="ml-auto" style={{ color: "oklch(0.6 0.02 260)", fontSize: "12px" }}>
                      {task.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Updates */}
        {project.updates?.length > 0 && (
          <div className="mt-8">
            <h2
              className="mb-4"
              style={{ color: "oklch(0.25 0.02 260)", fontSize: "18px", fontWeight: 700 }}
            >
              Status Updates
            </h2>
            <div className="space-y-4">
              {project.updates.map((update: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-[8px]"
                  style={{ background: "white", border: "1px solid oklch(0.92 0.01 260)" }}
                >
                  <h3 style={{ color: "oklch(0.25 0.02 260)", fontSize: "15px", fontWeight: 600, marginBottom: "4px" }}>
                    {update.title}
                  </h3>
                  <p style={{ color: "oklch(0.45 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>
                    {update.content}
                  </p>
                  <span className="mt-2 block" style={{ color: "oklch(0.6 0.02 260)", fontSize: "12px" }}>
                    {new Date(update.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublishedViewer;