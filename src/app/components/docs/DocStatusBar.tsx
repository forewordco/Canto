/* ===================================================================
   DOC STATUS BAR — Bottom stats bar for the document editor.
   
   Regular docs: block count, word count, char count, reading time.
   Script docs: scene count, element count, character count, location count.
   Minimal actions: Pin, Delete (star/today/lineup are in the header bar).
   =================================================================== */

import {
  PushPin,
  Trash,
  Hash,
  TextAa,
  FilmScript,
  UserCircle,
  MapPin,
  Stack,
  Clock,
  TextAlignLeft,
} from "@phosphor-icons/react";
import type { WorkspaceDoc } from "../../lib/types";

const WORDS_PER_MINUTE = 238;

interface DocStatusBarProps {
  doc: WorkspaceDoc;
  isStarred: boolean;
  onToggleStarred: () => void;
  onUpdate: (updates: Partial<WorkspaceDoc>) => void;
  onDelete: () => void;
}

export function DocStatusBar({
  doc,
  isStarred,
  onToggleStarred,
  onUpdate,
  onDelete,
}: DocStatusBarProps) {
  const blocks = doc.blocks || [];
  const blockCount = blocks.length;
  const allText = blocks.map((b) => b.content || "").join(" ");
  const wordCount = allText.split(/\s+/).filter(Boolean).length;
  const charCount = allText.replace(/\s/g, "").length;
  const readingTime = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

  // Script stats
  const isScript = doc.type === "script";
  const sceneCount = isScript
    ? blocks.filter((b) => b.type === "scene-heading").length
    : 0;
  const characterBlocks = isScript
    ? blocks.filter((b) => b.type === "character")
    : [];
  const uniqueCharacters = isScript
    ? new Set(characterBlocks.map((b) => b.content.trim().toUpperCase())).size
    : 0;
  const uniqueLocations = isScript
    ? new Set(
        blocks
          .filter((b) => b.type === "scene-heading")
          .map((b) => {
            const match = b.content.match(
              /(?:INT\.|EXT\.|INT\.\/EXT\.)\s*(.+?)(?:\s*[-–—]\s*|$)/i
            );
            return match?.[1]?.trim().toUpperCase() || b.content.trim().toUpperCase();
          })
      ).size
    : 0;

  const StatChip = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: number | string;
  }) => (
    <div
      className="inline-flex items-center gap-1.5"
      title={label}
      style={{ color: "var(--text-quaternary)", fontSize: "12px" }}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{value}</span>
    </div>
  );

  return (
    <div
      className="flex items-center justify-between mt-12 pt-4 border-t"
      style={{ borderColor: "var(--border-subtle)" }}
    >
      {/* Left: stats */}
      <div className="flex items-center gap-4">
        {isScript ? (
          <>
            <StatChip icon={FilmScript} label="Scenes" value={sceneCount} />
            <StatChip icon={Stack} label="Elements" value={blockCount} />
            <StatChip icon={UserCircle} label="Characters" value={uniqueCharacters} />
            <StatChip icon={MapPin} label="Locations" value={uniqueLocations} />
          </>
        ) : (
          <>
            <StatChip icon={Hash} label="Blocks" value={blockCount} />
            <StatChip icon={TextAa} label="Words" value={wordCount.toLocaleString()} />
            <StatChip icon={TextAlignLeft} label="Characters" value={charCount.toLocaleString()} />
            <StatChip icon={Clock} label="Reading time" value={`${readingTime} min read`} />
          </>
        )}
      </div>

      {/* Right: minimal actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onUpdate({ pinned: !doc.pinned })}
          className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{
            color: doc.pinned ? "var(--accent-primary)" : "var(--text-quaternary)",
          }}
          title={doc.pinned ? "Unpin" : "Pin"}
        >
          <PushPin
            className="w-3.5 h-3.5"
            weight={doc.pinned ? "fill" : "regular"}
          />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{ color: "var(--text-quaternary)" }}
          title="Delete"
        >
          <Trash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
