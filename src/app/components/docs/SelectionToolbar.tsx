/* ===================================================================
   SELECTION TOOLBAR — Floating bottom-center toolbar for multi-selected blocks.
   
   Two-row dark panel design:
   Row 1: count | H1 H2 H3 Para | Quote Bullet Number Check Toggle | Focus Block | Colors | X
   Row 2: AI | Layout | Group | Delete | Esc
   =================================================================== */

import {
  TextHOne,
  TextHTwo,
  TextHThree,
  TextAa,
  Quotes,
  ListBullets,
  ListNumbers,
  CheckSquare,
  CaretRight,
  HighlighterCircle,
  Square,
  X,
  SquaresFour,
  Sparkle,
  ArrowsOutSimple,
  Copy,
  PencilSimple,
  Trash,
  Rows,
  Columns,
  GridFour,
  ListDashes,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { DocBlock, DocBlockType } from "../../lib/types";

/* ─── Type Switchers ─── */
const HEADING_BUTTONS: { type: DocBlockType; icon: React.ElementType; label: string; level?: number }[] = [
  { type: "heading", icon: TextHOne, label: "H1", level: 1 },
  { type: "heading", icon: TextHTwo, label: "H2", level: 2 },
  { type: "heading", icon: TextHThree, label: "H3", level: 3 },
  { type: "paragraph", icon: TextAa, label: "Body" },
];

const FORMAT_BUTTONS: { type: DocBlockType; icon: React.ElementType; label: string }[] = [
  { type: "quote", icon: Quotes, label: "Quote" },
  { type: "bulleted-list", icon: ListBullets, label: "Bullet" },
  { type: "numbered-list", icon: ListNumbers, label: "Number" },
  { type: "checklist", icon: CheckSquare, label: "Todo" },
  { type: "toggle", icon: CaretRight, label: "Toggle" },
];

/* ─── Colors ─── */
const COLORS = [
  { value: "oklch(0.55 0.15 240)", label: "Blue" },
  { value: "oklch(0.65 0.18 145)", label: "Green" },
  { value: "oklch(0.60 0.18 330)", label: "Pink" },
  { value: "oklch(0.55 0.18 25)", label: "Red" },
  { value: "oklch(0.65 0.18 50)", label: "Orange" },
];

interface SelectionToolbarProps {
  selectedIds: Set<string>;
  blocks: DocBlock[];
  onChangeType: (ids: string[], type: DocBlockType, level?: number) => void;
  onChangeDecoration: (ids: string[], decoration: DocBlock["decoration"]) => void;
  onChangeColor: (ids: string[], color: string | undefined) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onGroupIntoCard?: (ids: string[]) => void;
}

export function SelectionToolbar({
  selectedIds,
  blocks,
  onChangeType,
  onChangeDecoration,
  onChangeColor,
  onDeleteSelected,
  onClearSelection,
  onGroupIntoCard,
}: SelectionToolbarProps) {
  const count = selectedIds.size;
  if (count === 0) return null;

  const ids = Array.from(selectedIds);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-[12px] shadow-2xl overflow-hidden"
      style={{
        background: "oklch(0.16 0.01 260)",
        border: "1px solid oklch(0.26 0.01 260)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Row 1: Type, format, decorations, colors */}
      <div className="flex items-center gap-0.5 px-2.5 py-1.5" style={{ borderBottom: "1px solid oklch(0.24 0.01 260)" }}>
        {/* Count */}
        <span
          className="px-2 py-0.5 rounded-[5px] tabular-nums shrink-0 mr-0.5"
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "oklch(0.65 0 0)",
          }}
        >
          {count} block{count !== 1 ? "s" : ""}
        </span>

        <Divider />

        {/* Heading + Body types */}
        <div className="flex items-center gap-0">
          {HEADING_BUTTONS.map((tb) => (
            <ToolBtn
              key={`${tb.type}-${tb.label}`}
              icon={tb.icon}
              label={tb.label}
              onClick={() => onChangeType(ids, tb.type, tb.level)}
            />
          ))}
        </div>

        <Divider />

        {/* Format types */}
        <div className="flex items-center gap-0">
          {FORMAT_BUTTONS.map((tb) => (
            <ToolBtn
              key={`${tb.type}-${tb.label}`}
              icon={tb.icon}
              label={tb.label}
              onClick={() => onChangeType(ids, tb.type)}
            />
          ))}
        </div>

        <Divider />

        {/* Decorations */}
        <div className="flex items-center gap-0">
          <ToolBtnWithLabel
            icon={HighlighterCircle}
            label="Focus"
            onClick={() => onChangeDecoration(ids, "focus")}
          />
          <ToolBtnWithLabel
            icon={Square}
            label="Block"
            onClick={() => onChangeDecoration(ids, "block")}
          />
        </div>

        <Divider />

        {/* Color dots */}
        <div className="flex items-center gap-1 px-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => onChangeColor(ids, c.value)}
              className="w-[14px] h-[14px] rounded-full transition-all hover:scale-125 hover:ring-2 hover:ring-white/20"
              style={{ background: c.value }}
              title={c.label}
            />
          ))}
          <button
            onClick={() => onChangeColor(ids, undefined)}
            className="w-[14px] h-[14px] rounded-full flex items-center justify-center transition-all hover:scale-125"
            style={{ border: "1.5px solid oklch(0.5 0 0)" }}
            title="Clear color"
          >
            <X className="w-2 h-2" style={{ color: "oklch(0.5 0 0)" }} />
          </button>
        </div>

        <Divider />

        {/* Close */}
        <ToolBtn
          icon={X}
          label="Close"
          onClick={onClearSelection}
        />
      </div>

      {/* Row 2: AI, layout, group, delete, esc */}
      <div className="flex items-center gap-0.5 px-2.5 py-1.5">
        {/* AI section */}
        <div className="flex items-center gap-0">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-[5px] transition-colors hover:bg-white/[0.08]"
            style={{ color: "oklch(0.75 0.15 280)", fontSize: "11px", fontWeight: 600 }}
            title="AI Actions"
          >
            <Sparkle className="w-3.5 h-3.5" weight="fill" />
            AI
          </button>
          <ToolBtn icon={ArrowsOutSimple} label="Expand" onClick={() => {}} />
          <ToolBtn icon={Copy} label="Copy" onClick={() => {
            const selectedBlocks = blocks.filter(b => ids.includes(b.id));
            const text = selectedBlocks.map(b => b.content).join("\n");
            navigator.clipboard?.writeText(text);
          }} />
          <ToolBtn icon={PencilSimple} label="Edit" onClick={() => {}} />
        </div>

        <Divider />

        {/* Layout options */}
        <div className="flex items-center gap-0">
          <ToolBtn icon={ListDashes} label="List view" onClick={() => {}} />
          <ToolBtn icon={Rows} label="Row layout" onClick={() => {}} />
          <ToolBtn icon={Columns} label="Column layout" onClick={() => {}} />
          <ToolBtn icon={GridFour} label="Grid layout" onClick={() => {}} />
        </div>

        <Divider />

        {/* Group */}
        {onGroupIntoCard && (
          <>
            <button
              onClick={() => onGroupIntoCard(ids)}
              className="flex items-center gap-1 px-2 py-1 rounded-[5px] transition-colors hover:bg-white/[0.08]"
              style={{
                background: "oklch(0.55 0.18 25 / 0.2)",
                color: "oklch(0.75 0.15 25)",
                fontSize: "11px",
                fontWeight: 600,
              }}
              title="Group into card"
            >
              <SquaresFour className="w-3.5 h-3.5" weight="bold" />
              Group
            </button>
            <Divider />
          </>
        )}

        {/* Delete */}
        <button
          onClick={onDeleteSelected}
          className="flex items-center gap-1 px-2 py-1 rounded-[5px] transition-colors hover:bg-white/[0.08]"
          style={{ color: "oklch(0.7 0.15 25)", fontSize: "11px", fontWeight: 500 }}
          title="Delete selected"
        >
          <Trash className="w-3.5 h-3.5" />
          Delete
        </button>

        <Divider />

        {/* Escape hint */}
        <span
          className="px-1.5 py-0.5 rounded-[4px]"
          style={{
            background: "oklch(0.24 0.01 260)",
            color: "oklch(0.5 0 0)",
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: 500,
          }}
        >
          Esc
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Icon-only button ─── */
function ToolBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-1.5 rounded-[5px] transition-colors hover:bg-white/[0.1]"
      style={{ color: "oklch(0.78 0 0)" }}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}

/* ─── Icon + text label button ─── */
function ToolBtnWithLabel({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-1.5 py-1 rounded-[5px] transition-colors hover:bg-white/[0.1]"
      style={{ color: "oklch(0.78 0 0)", fontSize: "11px", fontWeight: 500 }}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 mx-1 shrink-0" style={{ background: "oklch(0.30 0.01 260)" }} />;
}

export default SelectionToolbar;
