/* ===================================================================
   AI PROMPT INLINE — Inline AI prompt that appears below a block.
   
   When an AI slash command is selected, this input appears with a
   contextual prompt. The user types their request, and AI generates
   content blocks that get inserted after the current block.
   =================================================================== */

import { useState, useRef, useEffect } from "react";
import {
  Sparkle,
  PaperPlaneTilt,
  X,
  CircleNotch,
  ArrowClockwise,
  Check,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { api } from "../../lib/api";
import type { DocBlock, DocBlockType } from "../../lib/types";

/* ─── AI Action Types ─── */
export type AiDocAction = "write" | "summarize" | "brainstorm" | "outline" | "continue" | "edit";

interface AiActionMeta {
  label: string;
  placeholder: string;
  needsPrompt: boolean;
  color: string;
}

const AI_ACTION_META: Record<AiDocAction, AiActionMeta> = {
  write: { label: "AI Write", placeholder: "What should I write about?", needsPrompt: true, color: "#8B5CF6" },
  summarize: { label: "AI Summarize", placeholder: "Summarizing document...", needsPrompt: false, color: "#3B82F6" },
  brainstorm: { label: "AI Brainstorm", placeholder: "What topic to brainstorm?", needsPrompt: true, color: "#F59E0B" },
  outline: { label: "AI Outline", placeholder: "What should the outline cover?", needsPrompt: true, color: "#10B981" },
  continue: { label: "AI Continue", placeholder: "Continuing from document...", needsPrompt: false, color: "#6366F1" },
  edit: { label: "AI Edit", placeholder: "How should I edit this text?", needsPrompt: true, color: "#EC4899" },
};

interface AiPromptInlineProps {
  action: AiDocAction;
  docTitle: string;
  docContent: string; // serialized blocks content for context
  selectedText?: string; // for edit action
  onInsertBlocks: (blocks: DocBlock[]) => void;
  onClose: () => void;
  generateBlockId: () => string;
}

export function AiPromptInline({
  action,
  docTitle,
  docContent,
  selectedText,
  onInsertBlocks,
  onClose,
  generateBlockId,
}: AiPromptInlineProps) {
  const meta = AI_ACTION_META[action];
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBlocks, setPreviewBlocks] = useState<DocBlock[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Auto-submit for actions that don't need a prompt
    if (!meta.needsPrompt) {
      handleSubmit();
    }
  }, []);

  const handleSubmit = async () => {
    if (meta.needsPrompt && !prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await api.post<{ blocks: Array<{ type: DocBlockType; content: string; level?: number; calloutColor?: string; calloutIcon?: string }> }>("/ai/doc", {
        action,
        prompt: prompt.trim(),
        context: docContent.slice(0, 4000), // limit context size
        selectedText,
      });

      if (apiError || !data?.blocks) {
        setError(apiError || "AI failed to generate content");
        setLoading(false);
        return;
      }

      // Convert to DocBlock format with IDs
      const newBlocks: DocBlock[] = data.blocks.map((b) => ({
        id: generateBlockId(),
        type: b.type || "paragraph",
        content: b.content || "",
        level: b.level,
        calloutColor: b.calloutColor,
        calloutIcon: b.calloutIcon,
      }));

      setPreviewBlocks(newBlocks);
    } catch (err) {
      setError("Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (previewBlocks) {
      onInsertBlocks(previewBlocks);
    }
    onClose();
  };

  const handleRetry = () => {
    setPreviewBlocks(null);
    setError(null);
    handleSubmit();
  };

  return (
    <motion.div
      className="my-2 rounded-[8px] overflow-hidden"
      style={{
        background: `${meta.color}08`,
        border: `1px solid ${meta.color}30`,
      }}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: `1px solid ${meta.color}20` }}>
        <Sparkle className="w-3.5 h-3.5" weight="fill" style={{ color: meta.color }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color: meta.color }}>{meta.label}</span>
        <div className="flex-1" />
        <button
          onClick={onClose}
          className="p-0.5 rounded-[3px] transition-colors hover:bg-black/[0.04]"
          style={{ color: "var(--text-quaternary)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Prompt input (for actions that need it) */}
      {meta.needsPrompt && !previewBlocks && !loading && (
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onClose();
            }}
            placeholder={meta.placeholder}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: "13px", color: "var(--text-primary)" }}
          />
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim()}
            className="p-1.5 rounded-[5px] transition-colors hover:opacity-80 disabled:opacity-40"
            style={{ background: meta.color, color: "white" }}
          >
            <PaperPlaneTilt className="w-3.5 h-3.5" weight="fill" />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-4">
          <CircleNotch className="w-4 h-4 animate-spin" style={{ color: meta.color }} />
          <span style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
            {action === "summarize" ? "Summarizing..." : action === "continue" ? "Writing..." : "Generating..."}
          </span>
          <div className="flex gap-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: meta.color, animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: meta.color, animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: meta.color, animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="px-4 py-3">
          <p style={{ fontSize: "12px", color: "oklch(0.62 0.18 25)" }}>{error}</p>
          <button
            onClick={handleRetry}
            className="mt-2 flex items-center gap-1 px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
            style={{ fontSize: "12px", color: meta.color }}
          >
            <ArrowClockwise className="w-3.5 h-3.5" /> Try again
          </button>
        </div>
      )}

      {/* Preview blocks */}
      {previewBlocks && (
        <div>
          <div className="px-4 py-3 space-y-1 max-h-64 overflow-y-auto">
            {previewBlocks.map((block) => (
              <PreviewBlock key={block.id} block={block} />
            ))}
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ borderTop: `1px solid ${meta.color}20` }}
          >
            <button
              onClick={handleAccept}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[5px] text-white transition-colors hover:opacity-90"
              style={{ background: meta.color, fontSize: "12px", fontWeight: 600 }}
            >
              <Check className="w-3.5 h-3.5" weight="bold" /> Insert
            </button>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: "12px", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
            >
              <ArrowClockwise className="w-3.5 h-3.5" /> Regenerate
            </button>
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
              style={{ fontSize: "12px", color: "var(--text-quaternary)" }}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Preview Block Renderer ─── */
function PreviewBlock({ block }: { block: DocBlock }) {
  const content = block.content || "";
  switch (block.type) {
    case "heading":
      return (
        <p
          style={{
            fontSize: block.level === 1 ? "18px" : block.level === 3 ? "14px" : "16px",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1.4,
            marginTop: block.level === 1 ? "0.5em" : "0.3em",
          }}
        >
          {content}
        </p>
      );
    case "bulleted-list":
      return (
        <div className="flex gap-2" style={{ paddingLeft: "4px" }}>
          <span style={{ color: "var(--text-quaternary)" }}>&bull;</span>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{content}</p>
        </div>
      );
    case "numbered-list":
      return (
        <div className="flex gap-2" style={{ paddingLeft: "4px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{content}</p>
        </div>
      );
    case "quote":
      return (
        <blockquote
          className="pl-3 my-0.5"
          style={{ borderLeft: "2px solid var(--text-quaternary)", fontSize: "13px", color: "var(--text-tertiary)", fontStyle: "italic", lineHeight: 1.6 }}
        >
          {content}
        </blockquote>
      );
    case "callout":
      return (
        <div
          className="flex items-start gap-2 rounded-[6px] px-3 py-2 my-0.5"
          style={{ background: `${block.calloutColor || "#3B82F6"}12`, border: `1px solid ${block.calloutColor || "#3B82F6"}30`, fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}
        >
          <span>{block.calloutIcon === "lightbulb" ? "\u{1F4A1}" : block.calloutIcon === "warning" ? "\u26A0" : block.calloutIcon === "star" ? "\u2B50" : "\u2139"}</span>
          <span>{content}</span>
        </div>
      );
    default:
      return content ? (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>{content}</p>
      ) : (
        <div style={{ height: "0.3em" }} />
      );
  }
}

export default AiPromptInline;
