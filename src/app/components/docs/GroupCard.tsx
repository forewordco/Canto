/* ===================================================================
   GROUP CARD — Nested document reference card component (D10).
   
   Displays a linked document with 5 card styles:
   - compact: Small icon + title only
   - list: Title + preview text
   - preview: Full rendered content inline
   - gallery: Cover image prominent
   - board: Styled card with metadata
   =================================================================== */

import {
  FileText,
  ArrowSquareOut,
  DotsThree,
  CaretRight,
  Clock,
  Pencil,
  Image as ImageIcon,
  SquaresFour,
  ListDashes,
  Eye,
  Rows,
  Kanban,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { WorkspaceDoc, DocBlock } from "../../lib/types";

/* ─── Types ─── */
export type GroupCardStyle = "compact" | "list" | "preview" | "gallery" | "board";

interface GroupCardProps {
  /** The linked doc data (fetched by parent) */
  linkedDoc: WorkspaceDoc | null;
  /** Current card style */
  cardStyle: GroupCardStyle;
  /** Navigate into the nested doc */
  onNavigate: () => void;
  /** Change card style */
  onChangeStyle?: (style: GroupCardStyle) => void;
  /** Whether this is read-only */
  readOnly?: boolean;
  /** Whether selected */
  selected?: boolean;
}

const CARD_STYLES: { style: GroupCardStyle; icon: React.ElementType; label: string }[] = [
  { style: "compact", icon: ListDashes, label: "Compact" },
  { style: "list", icon: Rows, label: "List" },
  { style: "preview", icon: Eye, label: "Preview" },
  { style: "gallery", icon: ImageIcon, label: "Gallery" },
  { style: "board", icon: Kanban, label: "Board" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getPreviewText(blocks?: DocBlock[]): string {
  if (!blocks || blocks.length === 0) return "";
  return blocks
    .filter((b) => b.type !== "divider" && b.content)
    .map((b) => b.content)
    .join(" ")
    .slice(0, 200);
}

function getBlockCount(blocks?: DocBlock[]): number {
  return blocks?.length || 0;
}

export function GroupCard({
  linkedDoc,
  cardStyle,
  onNavigate,
  onChangeStyle,
  readOnly,
  selected,
}: GroupCardProps) {
  const [showStylePicker, setShowStylePicker] = React.useState(false);

  if (!linkedDoc) {
    return (
      <div
        className="rounded-[8px] px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-black/[0.02]"
        style={{
          border: "1px dashed var(--border-default)",
          background: "var(--neutral-50)",
        }}
        onClick={onNavigate}
      >
        <FileText className="w-4 h-4" style={{ color: "var(--text-quaternary)" }} />
        <span style={{ fontSize: "13px", color: "var(--text-quaternary)", fontStyle: "italic" }}>
          Linked document not found
        </span>
      </div>
    );
  }

  const preview = getPreviewText(linkedDoc.blocks);
  const blockCount = getBlockCount(linkedDoc.blocks);

  /* ─── Compact: icon + title ─── */
  if (cardStyle === "compact") {
    return (
      <div
        className={`group relative rounded-[8px] px-3 py-2 flex items-center gap-2 cursor-pointer transition-all hover:bg-black/[0.03] ${
          selected ? "ring-2 ring-[var(--accent-primary)] ring-offset-1" : ""
        }`}
        style={{ border: "1px solid var(--border-default)" }}
        onClick={onNavigate}
      >
        <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} weight="duotone" />
        <span className="truncate" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>
          {linkedDoc.title || "Untitled"}
        </span>
        <CaretRight className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-quaternary)" }} />
        {!readOnly && onChangeStyle && (
          <StylePickerButton showStylePicker={showStylePicker} setShowStylePicker={setShowStylePicker} onChangeStyle={onChangeStyle} cardStyle={cardStyle} />
        )}
      </div>
    );
  }

  /* ─── List: title + preview ─── */
  if (cardStyle === "list") {
    return (
      <div
        className={`group relative rounded-[8px] px-4 py-3 cursor-pointer transition-all hover:bg-black/[0.03] ${
          selected ? "ring-2 ring-[var(--accent-primary)] ring-offset-1" : ""
        }`}
        style={{ border: "1px solid var(--border-default)" }}
        onClick={onNavigate}
      >
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} weight="duotone" />
          <span className="truncate" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            {linkedDoc.title || "Untitled"}
          </span>
          <CaretRight className="w-3.5 h-3.5 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-quaternary)" }} />
        </div>
        {preview && (
          <p className="line-clamp-2" style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5, paddingLeft: "24px" }}>
            {preview}
          </p>
        )}
        {!readOnly && onChangeStyle && (
          <StylePickerButton showStylePicker={showStylePicker} setShowStylePicker={setShowStylePicker} onChangeStyle={onChangeStyle} cardStyle={cardStyle} />
        )}
      </div>
    );
  }

  /* ─── Preview: full rendered content ─── */
  if (cardStyle === "preview") {
    return (
      <div
        className={`group relative rounded-[8px] overflow-hidden cursor-pointer transition-all hover:shadow-md ${
          selected ? "ring-2 ring-[var(--accent-primary)] ring-offset-1" : ""
        }`}
        style={{ border: "1px solid var(--border-default)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: "1px solid var(--border-default)", background: "var(--neutral-50)" }}
          onClick={onNavigate}
        >
          <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--accent-primary)" }} weight="duotone" />
          <span className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {linkedDoc.title || "Untitled"}
          </span>
          <div className="flex-1" />
          <span style={{ fontSize: "11px", color: "var(--text-quaternary)" }}>{blockCount} blocks</span>
          <ArrowSquareOut className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-quaternary)" }} />
        </div>

        {/* Content preview */}
        <div className="px-4 py-3 max-h-48 overflow-hidden" style={{ mask: "linear-gradient(to bottom, black 70%, transparent)" }} onClick={onNavigate}>
          {(linkedDoc.blocks || []).slice(0, 8).map((block) => (
            <PreviewBlockRender key={block.id} block={block} />
          ))}
          {(!linkedDoc.blocks || linkedDoc.blocks.length === 0) && (
            <p style={{ fontSize: "13px", color: "var(--text-quaternary)", fontStyle: "italic" }}>Empty document</p>
          )}
        </div>

        {!readOnly && onChangeStyle && (
          <StylePickerButton showStylePicker={showStylePicker} setShowStylePicker={setShowStylePicker} onChangeStyle={onChangeStyle} cardStyle={cardStyle} />
        )}
      </div>
    );
  }

  /* ─── Gallery: cover image prominent ─── */
  if (cardStyle === "gallery") {
    return (
      <div
        className={`group relative rounded-[8px] overflow-hidden cursor-pointer transition-all hover:shadow-md ${
          selected ? "ring-2 ring-[var(--accent-primary)] ring-offset-1" : ""
        }`}
        style={{ border: "1px solid var(--border-default)" }}
        onClick={onNavigate}
      >
        {/* Cover image or placeholder */}
        <div
          className="w-full h-32 flex items-center justify-center"
          style={{
            background: linkedDoc.coverImage
              ? `url(${linkedDoc.coverImage}) center/cover no-repeat`
              : "linear-gradient(135deg, oklch(0.95 0.02 260), oklch(0.9 0.04 280))",
          }}
        >
          {!linkedDoc.coverImage && (
            <ImageIcon className="w-8 h-8" style={{ color: "oklch(0.7 0.04 260)", opacity: 0.5 }} />
          )}
        </div>

        {/* Info */}
        <div className="px-3 py-2.5">
          <p className="truncate" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
            {linkedDoc.title || "Untitled"}
          </p>
          {preview && (
            <p className="truncate mt-0.5" style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              {preview}
            </p>
          )}
        </div>

        {!readOnly && onChangeStyle && (
          <StylePickerButton showStylePicker={showStylePicker} setShowStylePicker={setShowStylePicker} onChangeStyle={onChangeStyle} cardStyle={cardStyle} />
        )}
      </div>
    );
  }

  /* ─── Board: styled card with metadata ─── */
  return (
    <div
      className={`group relative rounded-[8px] overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-[var(--accent-primary)] ring-offset-1" : ""
      }`}
      style={{ border: "1px solid var(--border-default)" }}
      onClick={onNavigate}
    >
      {/* Color accent top */}
      <div className="h-1" style={{ background: "var(--accent-primary)" }} />

      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start gap-2">
          <div
            className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "oklch(0.6 0.15 260 / 0.1)" }}
          >
            <FileText className="w-4 h-4" style={{ color: "var(--accent-primary)" }} weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
              {linkedDoc.title || "Untitled"}
            </p>
            <p className="truncate mt-0.5" style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>
              {linkedDoc.type} &middot; {blockCount} blocks
            </p>
          </div>
          <ArrowSquareOut className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1" style={{ color: "var(--text-quaternary)" }} />
        </div>

        {preview && (
          <p className="line-clamp-2" style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            {preview}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1" style={{ borderTop: "1px solid var(--border-default)" }}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" style={{ color: "var(--text-quaternary)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-quaternary)" }}>
              {formatDate(linkedDoc.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {!readOnly && onChangeStyle && (
        <StylePickerButton showStylePicker={showStylePicker} setShowStylePicker={setShowStylePicker} onChangeStyle={onChangeStyle} cardStyle={cardStyle} />
      )}
    </div>
  );
}

/* ─── Style Picker Button ─── */
import React from "react";

function StylePickerButton({
  showStylePicker,
  setShowStylePicker,
  onChangeStyle,
  cardStyle,
}: {
  showStylePicker: boolean;
  setShowStylePicker: (v: boolean) => void;
  onChangeStyle: (style: GroupCardStyle) => void;
  cardStyle: GroupCardStyle;
}) {
  return (
    <div className="absolute top-1.5 right-1.5 z-10">
      <button
        onClick={(e) => { e.stopPropagation(); setShowStylePicker(!showStylePicker); }}
        className="p-1 rounded-[4px] transition-all opacity-0 group-hover:opacity-100 hover:bg-black/[0.06]"
        style={{ color: "var(--text-quaternary)" }}
        title="Change card style"
      >
        <DotsThree className="w-4 h-4" weight="bold" />
      </button>

      {showStylePicker && (
        <>
          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowStylePicker(false); }} />
          <motion.div
            className="absolute right-0 top-7 z-20 rounded-[8px] shadow-xl py-1 min-w-[140px]"
            style={{
              background: "white",
              border: "1px solid var(--border-default)",
            }}
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.1 }}
          >
            <p
              className="px-3 py-1"
              style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              Card Style
            </p>
            {CARD_STYLES.map((cs) => (
              <button
                key={cs.style}
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeStyle(cs.style);
                  setShowStylePicker(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                style={{
                  fontSize: "13px",
                  fontWeight: cs.style === cardStyle ? 600 : 400,
                  color: cs.style === cardStyle ? "var(--accent-primary)" : "var(--text-primary)",
                }}
              >
                <cs.icon className="w-3.5 h-3.5" />
                {cs.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

/* ─── Minimal Preview Block Renderer ─── */
function PreviewBlockRender({ block }: { block: DocBlock }) {
  const content = block.content || "";

  if (block.type === "divider") {
    return <hr className="my-2" style={{ border: "none", borderTop: "1px solid var(--border-default)" }} />;
  }

  if (block.type === "heading") {
    const size = block.level === 1 ? "16px" : block.level === 3 ? "13px" : "14px";
    return (
      <p style={{ fontSize: size, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.5, marginTop: "0.3em" }}>
        {content}
      </p>
    );
  }

  if (block.type === "bulleted-list") {
    return (
      <div className="flex gap-2 pl-1">
        <span style={{ color: "var(--text-quaternary)" }}>&bull;</span>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{content}</p>
      </div>
    );
  }

  if (block.type === "checklist") {
    return (
      <div className="flex items-center gap-2 pl-1">
        <div
          className="w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center"
          style={{
            borderColor: block.checked ? "var(--accent-primary)" : "var(--border-default)",
            background: block.checked ? "var(--accent-primary)" : "transparent",
          }}
        >
          {block.checked && <span className="text-white text-[8px]">&#10003;</span>}
        </div>
        <p className={block.checked ? "line-through" : ""} style={{ fontSize: "13px", color: block.checked ? "var(--text-quaternary)" : "var(--text-secondary)", lineHeight: 1.5 }}>
          {content}
        </p>
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="pl-3 my-0.5" style={{ borderLeft: "2px solid var(--text-quaternary)", fontSize: "13px", color: "var(--text-tertiary)", fontStyle: "italic", lineHeight: 1.5 }}>
        {content}
      </blockquote>
    );
  }

  if (!content) return null;

  return (
    <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{content}</p>
  );
}

export default GroupCard;
