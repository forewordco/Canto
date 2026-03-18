/* ===================================================================
   DOC OUTLINE — Heading hierarchy navigation sidebar.
   
   Shows H1/H2/H3 headings with indentation, click-to-scroll,
   and active heading tracking.
   =================================================================== */

import { useMemo } from "react";
import { ListDashes } from "@phosphor-icons/react";
import type { DocBlock } from "../../lib/types";

interface DocOutlineProps {
  blocks: DocBlock[];
  onScrollToBlock?: (blockId: string) => void;
  activeBlockId?: string | null;
}

export function DocOutline({ blocks, onScrollToBlock, activeBlockId }: DocOutlineProps) {
  const headings = useMemo(
    () =>
      blocks.filter((b) => b.type === "heading" && b.content.trim()).map((b) => ({
        id: b.id,
        level: b.level || 1,
        text: b.content,
      })),
    [blocks]
  );

  if (headings.length === 0) {
    return (
      <div className="text-center py-6" style={{ color: "var(--text-quaternary)", fontSize: "12px" }}>
        <ListDashes className="w-5 h-5 mx-auto mb-2" />
        <p>No headings yet</p>
        <p className="mt-0.5" style={{ fontSize: "11px" }}>Add headings to see an outline</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <ListDashes className="w-3.5 h-3.5" style={{ color: "var(--text-quaternary)" }} />
        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-quaternary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Outline
        </span>
      </div>
      {headings.map((h) => {
        const isActive = activeBlockId === h.id;
        const indent = (h.level - 1) * 12;
        return (
          <button
            key={h.id}
            onClick={() => {
              if (onScrollToBlock) onScrollToBlock(h.id);
              // Also try scrolling the DOM element
              const el = document.querySelector(`[data-block-id="${h.id}"]`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="flex items-center gap-1.5 w-full py-1 px-2 rounded-[4px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{
              paddingLeft: `${8 + indent}px`,
              color: isActive ? "var(--accent-primary)" : "var(--text-secondary)",
              fontSize: h.level === 1 ? "13px" : "12px",
              fontWeight: isActive ? 600 : h.level === 1 ? 500 : 400,
            }}
          >
            <div
              className="w-1 h-1 rounded-full shrink-0"
              style={{ background: isActive ? "var(--accent-primary)" : "var(--text-quaternary)" }}
            />
            <span className="truncate">{h.text}</span>
          </button>
        );
      })}
    </div>
  );
}

export default DocOutline;
