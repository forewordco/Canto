/* ═══════════════════════════════════════════════════════════
   DOC D7 FEATURES — Phase D7: Final Polish & Power Tools
   1. Template Gallery Modal — visual browsable template picker
   2. Backlinks Panel — shows docs that link to the current doc
   3. Export Panel — HTML export, copy rich text, print
   4. Document Stats Panel — detailed writing analytics
   5. Command Palette — Cmd+K quick search & actions
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  MagnifyingGlass,
  ArrowRight,
  FileText,
  Notebook,
  VideoCamera,
  FilmScript,
  Kanban,
  CalendarBlank,
  ListChecks,
  Presentation,
  Link as LinkIcon,
  Export,
  Printer,
  CopySimple,
  Code,
  ChartBar,
  TextAa,
  ArrowElbowRight,
  Lightning,
  PencilSimple,
  Trash,
  Star,
  PushPin,
  Eye,
  FolderSimple,
  Plus,
  Clock,
  CaretRight,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { DocBlock, DocBlockType, DocType, WorkspaceDoc } from "../../lib/types";
import { generateBlockId } from "../DescriptionBlockEditor";
import { DOC_TEMPLATES, type DocTemplate } from "./DocEditorFeatures";
import { downloadMarkdown } from "./DocEditorFeatures";

/* ─────────────────────────────────────────────────────────
   1. TEMPLATE GALLERY MODAL
   ───────────────────────────────────────────────────────── */

type TemplateCategory = "all" | "planning" | "meetings" | "writing" | "tracking" | "creative";

const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string }[] = [
  { key: "all", label: "All Templates" },
  { key: "planning", label: "Planning" },
  { key: "meetings", label: "Meetings" },
  { key: "writing", label: "Writing" },
  { key: "tracking", label: "Tracking" },
  { key: "creative", label: "Creative" },
];

const TEMPLATE_CATEGORY_MAP: Record<string, TemplateCategory> = {
  "blank": "writing",
  "project-brief": "planning",
  "meeting-notes": "meetings",
  "weekly-status": "tracking",
  "task-tracker": "tracking",
  "creative-brief": "creative",
  "script-template": "creative",
  "daily-journal": "writing",
};

function getBlockPreview(blocks: DocBlock[]): string[] {
  return blocks.slice(0, 6).map((b) => {
    if (b.type === "heading") return `${"#".repeat(b.level || 1)} ${b.content}`;
    if (b.type === "checklist") return `☐ ${b.content}`;
    if (b.type === "bulleted-list") return `• ${b.content}`;
    if (b.type === "numbered-list") return `1. ${b.content}`;
    if (b.type === "divider") return "───";
    if (b.type === "table") return "📊 Table";
    if (b.type === "callout") return `💡 ${b.content}`;
    if (b.type === "quote") return `"${b.content}"`;
    return b.content || "";
  });
}

export function TemplateGalleryModal({
  open,
  onSelect,
  onClose,
}: {
  open: boolean;
  onSelect: (template: DocTemplate) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setCategory("all");
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = useMemo(() => {
    let result = DOC_TEMPLATES;
    if (category !== "all") {
      result = result.filter((t) => TEMPLATE_CATEGORY_MAP[t.id] === category);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [category, search]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
          width: "min(720px, 90vw)",
          maxHeight: "min(600px, 80vh)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 style={{ color: "var(--text-primary)", fontSize: "18px", fontWeight: 700 }}>
            Template Gallery
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/[0.05] transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pb-3">
          <div
            className="flex items-center gap-2 px-3 h-9 rounded-lg"
            style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
          >
            <MagnifyingGlass className="w-4 h-4 shrink-0" style={{ color: "var(--text-quaternary)" }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="flex-1 bg-transparent outline-none"
              style={{ color: "var(--text-primary)", fontSize: "13px" }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 px-6 pb-3 overflow-x-auto">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className="px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              style={{
                fontSize: "12px",
                fontWeight: category === cat.key ? 600 : 400,
                color: category === cat.key ? "white" : "var(--text-secondary)",
                background: category === cat.key ? "#FA6863" : "transparent",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((template) => {
              const Icon = template.icon;
              const isHovered = hoveredId === template.id;
              const preview = getBlockPreview(template.blocks);
              return (
                <button
                  key={template.id}
                  onClick={() => onSelect(template)}
                  onMouseEnter={() => setHoveredId(template.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="text-left rounded-xl p-4 transition-all"
                  style={{
                    border: `1px solid ${isHovered ? template.color : "var(--border-default)"}`,
                    background: isHovered ? `${template.color}08` : "var(--bg-primary)",
                  }}
                >
                  {/* Icon & label */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${template.color}18`, color: template.color }}
                    >
                      <Icon className="w-4 h-4" weight="bold" />
                    </div>
                    <span
                      style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}
                    >
                      {template.label}
                    </span>
                  </div>
                  {/* Description */}
                  <p
                    className="mb-2"
                    style={{ color: "var(--text-tertiary)", fontSize: "11px", lineHeight: 1.4 }}
                  >
                    {template.description}
                  </p>
                  {/* Mini preview */}
                  <div
                    className="rounded-md p-2 space-y-0.5"
                    style={{ background: "var(--neutral-50)", minHeight: "48px" }}
                  >
                    {preview.map((line, i) => (
                      <div
                        key={i}
                        className="truncate"
                        style={{
                          color: "var(--text-quaternary)",
                          fontSize: "9px",
                          fontFamily: "var(--font-mono, monospace)",
                          lineHeight: 1.5,
                        }}
                      >
                        {line || "\u00A0"}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-8 h-8 mb-2" style={{ color: "var(--text-quaternary)" }} />
              <p style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>No templates found</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   2. BACKLINKS PANEL
   ───────────────────────────────────────────────────────── */

export function useBacklinks(docId: string, allDocs: WorkspaceDoc[]) {
  return useMemo(() => {
    if (!allDocs) return [];
    return allDocs.filter((d) => {
      if (d.id === docId) return false;
      // Check if any block references this doc via group-card
      return (d.blocks || []).some(
        (b) => b.linkedDocId === docId
      );
    });
  }, [docId, allDocs]);
}

export function BacklinksPanel({
  docId,
  allDocs,
  onNavigateDoc,
  onClose,
}: {
  docId: string;
  allDocs: WorkspaceDoc[];
  onNavigateDoc?: (id: string) => void;
  onClose: () => void;
}) {
  const backlinks = useBacklinks(docId, allDocs);

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="fixed right-0 top-0 bottom-0 z-[100] overflow-y-auto shadow-2xl"
      style={{
        width: "min(320px, 90vw)",
        background: "var(--bg-primary)",
        borderLeft: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-2">
          <LinkIcon className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>
            Backlinks
          </span>
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{ background: "var(--neutral-100)", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 600 }}
          >
            {backlinks.length}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-black/[0.05] transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-1">
        {backlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            <LinkIcon className="w-6 h-6 mb-2" style={{ color: "var(--text-quaternary)" }} />
            <p style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>No other docs link here</p>
          </div>
        ) : (
          backlinks.map((d) => (
            <button
              key={d.id}
              onClick={() => onNavigateDoc?.(d.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-black/[0.04]"
            >
              <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
              <div className="flex-1 min-w-0">
                <div className="truncate" style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>
                  {d.title || "Untitled"}
                </div>
                <div style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>
                  {d.type} · Updated {new Date(d.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <CaretRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   3. EXPORT PANEL
   ───────────────────────────────────────────────────────── */

function blocksToHtml(title: string, blocks: DocBlock[]): string {
  const lines: string[] = [
    "<!DOCTYPE html>",
    '<html lang="en"><head>',
    '<meta charset="UTF-8">',
    `<title>${escHtml(title)}</title>`,
    "<style>",
    "body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.7}",
    "h1{font-size:28px;font-weight:700;margin:24px 0 8px}",
    "h2{font-size:22px;font-weight:700;margin:20px 0 6px}",
    "h3{font-size:18px;font-weight:600;margin:16px 0 4px}",
    "blockquote{border-left:3px solid #ddd;padding-left:16px;color:#555;margin:12px 0}",
    "pre{background:#f5f5f5;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px}",
    "code{font-family:ui-monospace,SFMono-Regular,monospace}",
    "hr{border:none;border-top:1px solid #e5e5e5;margin:16px 0}",
    "table{border-collapse:collapse;width:100%;margin:12px 0}",
    "th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;font-size:14px}",
    "th{background:#f9f9f9;font-weight:600}",
    ".callout{padding:12px 16px;border-radius:8px;margin:12px 0}",
    ".checklist{list-style:none;padding-left:0}",
    ".checklist li::before{content:'☐ '}",
    ".checklist li.done::before{content:'☑ ';color:#22c55e}",
    "</style></head><body>",
    `<h1>${escHtml(title)}</h1>`,
  ];

  for (const b of blocks) {
    switch (b.type) {
      case "heading":
        lines.push(`<h${b.level || 2}>${escHtml(b.content)}</h${b.level || 2}>`);
        break;
      case "paragraph":
        lines.push(`<p>${escHtml(b.content)}</p>`);
        break;
      case "bulleted-list":
        lines.push(`<ul><li>${escHtml(b.content)}</li></ul>`);
        break;
      case "numbered-list":
        lines.push(`<ol><li>${escHtml(b.content)}</li></ol>`);
        break;
      case "checklist":
        lines.push(`<ul class="checklist"><li class="${b.checked ? "done" : ""}">${escHtml(b.content)}</li></ul>`);
        break;
      case "quote":
        lines.push(`<blockquote>${escHtml(b.content)}</blockquote>`);
        break;
      case "code":
        lines.push(`<pre><code>${escHtml(b.content)}</code></pre>`);
        break;
      case "divider":
        lines.push("<hr>");
        break;
      case "callout":
        lines.push(`<div class="callout" style="background:${b.calloutColor || '#f0f0f0'}18">${escHtml(b.content)}</div>`);
        break;
      case "table":
        if (b.tableData) {
          lines.push("<table>");
          lines.push("<thead><tr>" + b.tableData.headers.map((h) => `<th>${escHtml(h)}</th>`).join("") + "</tr></thead>");
          lines.push("<tbody>" + b.tableData.rows.map((r) => "<tr>" + r.map((c) => `<td>${escHtml(c)}</td>`).join("") + "</tr>").join("") + "</tbody>");
          lines.push("</table>");
        }
        break;
      case "image":
      case "unsplash-image":
        if (b.imageUrl) lines.push(`<figure><img src="${escHtml(b.imageUrl)}" alt="${escHtml(b.imageAlt || "")}" style="max-width:100%;border-radius:8px"></figure>`);
        break;
      default:
        if (b.content) lines.push(`<p>${escHtml(b.content)}</p>`);
    }
  }

  lines.push("</body></html>");
  return lines.join("\n");
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function blocksToPlainText(title: string, blocks: DocBlock[]): string {
  const lines = [title, "=".repeat(title.length), ""];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
        lines.push(`${"#".repeat(b.level || 2)} ${b.content}`);
        break;
      case "divider":
        lines.push("---");
        break;
      case "checklist":
        lines.push(`[${b.checked ? "x" : " "}] ${b.content}`);
        break;
      case "bulleted-list":
        lines.push(`  • ${b.content}`);
        break;
      case "numbered-list":
        lines.push(`  1. ${b.content}`);
        break;
      case "quote":
        lines.push(`  > ${b.content}`);
        break;
      case "code":
        lines.push("```", b.content, "```");
        break;
      default:
        lines.push(b.content || "");
    }
  }
  return lines.join("\n");
}

export function ExportPanel({
  docTitle,
  blocks,
  onClose,
}: {
  docTitle: string;
  blocks: DocBlock[];
  onClose: () => void;
}) {
  const handleExportMarkdown = useCallback(() => {
    downloadMarkdown(docTitle, blocks);
  }, [docTitle, blocks]);

  const handleExportHtml = useCallback(() => {
    const html = blocksToHtml(docTitle, blocks);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docTitle || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [docTitle, blocks]);

  const handleCopyRichText = useCallback(async () => {
    const html = blocksToHtml(docTitle, blocks);
    const plain = blocksToPlainText(docTitle, blocks);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(plain);
    }
  }, [docTitle, blocks]);

  const handleCopyPlainText = useCallback(async () => {
    const plain = blocksToPlainText(docTitle, blocks);
    await navigator.clipboard.writeText(plain);
  }, [docTitle, blocks]);

  const handlePrint = useCallback(() => {
    const html = blocksToHtml(docTitle, blocks);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 300);
    }
  }, [docTitle, blocks]);

  const exportOptions = [
    { icon: Export, label: "Export as Markdown", description: "Download .md file", action: handleExportMarkdown, color: "#F59E0B" },
    { icon: Code, label: "Export as HTML", description: "Download styled HTML file", action: handleExportHtml, color: "#3B82F6" },
    { icon: CopySimple, label: "Copy as Rich Text", description: "Paste into other apps with formatting", action: handleCopyRichText, color: "#8B5CF6" },
    { icon: TextAa, label: "Copy as Plain Text", description: "Plain text with simple formatting", action: handleCopyPlainText, color: "#64748B" },
    { icon: Printer, label: "Print / Save as PDF", description: "Opens print dialog for PDF export", action: handlePrint, color: "#22C55E" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute right-0 top-full mt-2 rounded-xl shadow-xl z-50 overflow-hidden"
      style={{
        width: "280px",
        background: "var(--bg-primary)",
        border: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 600 }}>Export Document</span>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-black/[0.05]" style={{ color: "var(--text-tertiary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-0.5">
        {exportOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => { opt.action(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-black/[0.04]"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${opt.color}14`, color: opt.color }}
            >
              <opt.icon className="w-4 h-4" weight="bold" />
            </div>
            <div>
              <div style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 500 }}>{opt.label}</div>
              <div style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>{opt.description}</div>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   4. DOCUMENT STATS PANEL
   ───────────────────────────────────────────────────────── */

interface DocStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  blocks: number;
  headings: number;
  images: number;
  tables: number;
  checklists: { total: number; checked: number };
  readingTime: string;
  speakingTime: string;
  readability: string; // simplified label
}

function computeDocStats(blocks: DocBlock[]): DocStats {
  const allText = blocks.map((b) => b.content || "").join(" ");
  const words = allText.split(/\s+/).filter(Boolean).length;
  const characters = allText.length;
  const charactersNoSpaces = allText.replace(/\s/g, "").length;
  const sentences = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const paragraphs = blocks.filter((b) => b.type === "paragraph" && b.content?.trim()).length;
  const headings = blocks.filter((b) => b.type === "heading").length;
  const images = blocks.filter((b) => b.type === "image" || b.type === "unsplash-image" || b.type === "gallery").length;
  const tables = blocks.filter((b) => b.type === "table").length;
  const checklistBlocks = blocks.filter((b) => b.type === "checklist");
  const checklists = {
    total: checklistBlocks.length,
    checked: checklistBlocks.filter((b) => b.checked).length,
  };

  const readMin = Math.max(1, Math.ceil(words / 238));
  const speakMin = Math.max(1, Math.ceil(words / 150));

  // Simple readability heuristic
  const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
  let readability = "Easy";
  if (avgWordsPerSentence > 25) readability = "Complex";
  else if (avgWordsPerSentence > 18) readability = "Moderate";
  else if (avgWordsPerSentence > 12) readability = "Standard";

  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    blocks: blocks.length,
    headings,
    images,
    tables,
    checklists,
    readingTime: `${readMin} min`,
    speakingTime: `${speakMin} min`,
    readability,
  };
}

export function DocStatsPanel({
  blocks,
  onClose,
}: {
  blocks: DocBlock[];
  onClose: () => void;
}) {
  const stats = useMemo(() => computeDocStats(blocks), [blocks]);

  const readabilityColor =
    stats.readability === "Easy" ? "#22C55E" :
    stats.readability === "Standard" ? "#3B82F6" :
    stats.readability === "Moderate" ? "#F59E0B" : "#EF4444";

  const statRows: { label: string; value: string | number }[] = [
    { label: "Words", value: stats.words.toLocaleString() },
    { label: "Characters", value: stats.characters.toLocaleString() },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces.toLocaleString() },
    { label: "Sentences", value: stats.sentences.toLocaleString() },
    { label: "Paragraphs", value: stats.paragraphs.toLocaleString() },
    { label: "Blocks", value: stats.blocks.toLocaleString() },
    { label: "Headings", value: stats.headings },
    { label: "Images", value: stats.images },
    { label: "Tables", value: stats.tables },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className="fixed right-0 top-0 bottom-0 z-[100] overflow-y-auto shadow-2xl"
      style={{
        width: "min(300px, 85vw)",
        background: "var(--bg-primary)",
        borderLeft: "1px solid var(--border-default)",
      }}
    >
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border-default)" }}>
        <div className="flex items-center gap-2">
          <ChartBar className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
          <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 600 }}>Document Stats</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-black/[0.05] transition-colors" style={{ color: "var(--text-tertiary)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Time estimates */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "var(--neutral-50)" }}
        >
          <div style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700 }}>{stats.readingTime}</div>
          <div style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>Reading time</div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ background: "var(--neutral-50)" }}
        >
          <div style={{ color: "var(--text-primary)", fontSize: "20px", fontWeight: 700 }}>{stats.speakingTime}</div>
          <div style={{ color: "var(--text-tertiary)", fontSize: "11px" }}>Speaking time</div>
        </div>
      </div>

      {/* Readability */}
      <div className="px-4 pb-3">
        <div
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ background: `${readabilityColor}10`, border: `1px solid ${readabilityColor}30` }}
        >
          <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Readability</span>
          <span style={{ color: readabilityColor, fontSize: "12px", fontWeight: 600 }}>{stats.readability}</span>
        </div>
      </div>

      {/* Checklist progress */}
      {stats.checklists.total > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Checklists</span>
            <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
              {stats.checklists.checked}/{stats.checklists.total}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(stats.checklists.checked / stats.checklists.total) * 100}%`,
                background: "#22C55E",
              }}
            />
          </div>
        </div>
      )}

      {/* Stat rows */}
      <div className="px-4 pb-4 space-y-0">
        {statRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--border-light)" }}>
            <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>{row.label}</span>
            <span style={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   5. COMMAND PALETTE
   ───────────────────────────────────────────────────────── */

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  section: string;
  action: () => void;
  keywords?: string[];
}

export function useCommandPalette(open: boolean, setOpen: (v: boolean) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);
}

export function CommandPalette({
  open,
  commands,
  onClose,
}: {
  open: boolean;
  commands: CommandItem[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.keywords?.some((k) => k.includes(q))
    );
  }, [commands, query]);

  // Group by section
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const c of filtered) {
      const arr = map.get(c.section) || [];
      arr.push(c);
      map.set(c.section, arr);
    }
    return map;
  }, [filtered]);

  const flatList = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-cmd-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, flatList.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatList[selectedIdx]) {
          flatList[selectedIdx].action();
          onClose();
        }
      }
    },
    [flatList, selectedIdx, onClose]
  );

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -8 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        className="relative rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{
          width: "min(520px, 90vw)",
          maxHeight: "min(420px, 60vh)",
          background: "var(--bg-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 h-12 border-b"
          style={{ borderColor: "var(--border-default)" }}
        >
          <MagnifyingGlass className="w-4.5 h-4.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent outline-none"
            style={{ color: "var(--text-primary)", fontSize: "14px" }}
          />
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)", border: "1px solid var(--border-default)" }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto py-2">
          {flatList.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <MagnifyingGlass className="w-6 h-6 mb-2" style={{ color: "var(--text-quaternary)" }} />
              <p style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>No results found</p>
            </div>
          )}
          {Array.from(grouped.entries()).map(([section, items]) => (
            <div key={section}>
              <div className="px-4 pt-2 pb-1">
                <span style={{ color: "var(--text-quaternary)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {section}
                </span>
              </div>
              {items.map((item) => {
                flatIdx++;
                const idx = flatIdx;
                const isSelected = idx === selectedIdx;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    data-cmd-idx={idx}
                    onClick={() => { item.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIdx(idx)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                    style={{
                      background: isSelected ? "var(--neutral-50)" : "transparent",
                    }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: item.iconColor || "var(--text-tertiary)" }} />
                    <span className="flex-1 truncate" style={{ color: "var(--text-primary)", fontSize: "13px" }}>
                      {item.label}
                    </span>
                    {item.description && (
                      <span className="truncate shrink-0" style={{ color: "var(--text-quaternary)", fontSize: "11px", maxWidth: "160px" }}>
                        {item.description}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowElbowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-quaternary)" }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{ borderColor: "var(--border-default)" }}
        >
          <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>
            {flatList.length} result{flatList.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>↑↓ navigate</span>
            <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>↵ select</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}