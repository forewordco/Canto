/* ===================================================================
   FORMAT PANEL — Craft-style floating format card.
   
   Sections: Titles, Content, Inline Formatting, Lists,
   Decorations, Color Picker, Font Chooser.
   =================================================================== */

import { useState } from "react";
import {
  TextHOne,
  TextHTwo,
  TextHThree,
  TextAa,
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  ListBullets,
  ListNumbers,
  CheckSquare,
  CaretRight,
  Quotes,
  Info,
  Minus,
  X,
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import type { DocBlockType, DocBlock } from "../../lib/types";

/* ─── Color Palette ─── */
const COLORS = [
  { value: "#FA6863", label: "Coral" },
  { value: "#F59145", label: "Orange" },
  { value: "#EAB308", label: "Gold" },
  { value: "#22C55E", label: "Green" },
  { value: "#14B8A6", label: "Teal" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#64748B", label: "Slate" },
  { value: "#78716C", label: "Stone" },
  { value: "#000000", label: "Black" },
];

/* ─── Font Styles ─── */
const FONTS: { value: NonNullable<DocBlock["fontStyle"]>; label: string; sample: string }[] = [
  { value: "system", label: "System", sample: "Aa" },
  { value: "serif", label: "Serif", sample: "Aa" },
  { value: "mono", label: "Mono", sample: "Aa" },
  { value: "round", label: "Round", sample: "Aa" },
];

const FONT_FAMILIES: Record<string, string> = {
  system: "'Albert Sans', sans-serif",
  serif: "Georgia, serif",
  mono: "'Courier Prime', monospace",
  round: "'Nunito', sans-serif",
};

/* ─── Props ─── */
interface FormatPanelProps {
  onClose: () => void;
  onChangeBlockType: (type: DocBlockType, level?: number) => void;
  onApplyDecoration: (decoration: DocBlock["decoration"]) => void;
  onApplyColor: (color: string | undefined) => void;
  onApplyFont: (font: DocBlock["fontStyle"]) => void;
  onInlineFormat: (format: "bold" | "italic" | "strikethrough" | "code") => void;
  currentType?: DocBlockType;
  currentLevel?: number;
  currentDecoration?: DocBlock["decoration"];
  currentColor?: string;
  currentFont?: DocBlock["fontStyle"];
}

export function FormatPanel({
  onClose,
  onChangeBlockType,
  onApplyDecoration,
  onApplyColor,
  onApplyFont,
  onInlineFormat,
  currentType,
  currentLevel,
  currentDecoration,
  currentColor,
  currentFont,
}: FormatPanelProps) {
  return (
    <motion.div
      className="w-64 rounded-[10px] shadow-lg border overflow-hidden"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.12 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--border-default)" }}>
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
          Format
        </span>
        <button onClick={onClose} className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5" style={{ color: "var(--text-quaternary)" }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2 space-y-2">
        {/* Titles */}
        <Section label="Titles">
          <FormatBtn
            icon={TextHOne}
            label="Heading 1"
            active={currentType === "heading" && currentLevel === 1}
            onClick={() => onChangeBlockType("heading", 1)}
          />
          <FormatBtn
            icon={TextHTwo}
            label="Heading 2"
            active={currentType === "heading" && currentLevel === 2}
            onClick={() => onChangeBlockType("heading", 2)}
          />
          <FormatBtn
            icon={TextHThree}
            label="Heading 3"
            active={currentType === "heading" && currentLevel === 3}
            onClick={() => onChangeBlockType("heading", 3)}
          />
        </Section>

        {/* Content */}
        <Section label="Content">
          <FormatBtn icon={TextAa} label="Body" active={currentType === "paragraph"} onClick={() => onChangeBlockType("paragraph")} />
          <FormatBtn icon={Quotes} label="Quote" active={currentType === "quote"} onClick={() => onChangeBlockType("quote")} />
          <FormatBtn icon={Info} label="Callout" active={currentType === "callout"} onClick={() => onChangeBlockType("callout")} />
        </Section>

        {/* Inline */}
        <Section label="Inline">
          <div className="flex gap-1">
            <InlineBtn icon={TextB} label="Bold" onClick={() => onInlineFormat("bold")} shortcut="B" />
            <InlineBtn icon={TextItalic} label="Italic" onClick={() => onInlineFormat("italic")} shortcut="I" />
            <InlineBtn icon={TextStrikethrough} label="Strike" onClick={() => onInlineFormat("strikethrough")} shortcut="S" />
            <InlineBtn icon={Code} label="Code" onClick={() => onInlineFormat("code")} shortcut="E" />
          </div>
        </Section>

        {/* Lists */}
        <Section label="Lists">
          <FormatBtn icon={ListBullets} label="Bullet" active={currentType === "bulleted-list"} onClick={() => onChangeBlockType("bulleted-list")} />
          <FormatBtn icon={ListNumbers} label="Number" active={currentType === "numbered-list"} onClick={() => onChangeBlockType("numbered-list")} />
          <FormatBtn icon={CheckSquare} label="To-do" active={currentType === "checklist"} onClick={() => onChangeBlockType("checklist")} />
          <FormatBtn icon={CaretRight} label="Toggle" active={currentType === "toggle"} onClick={() => onChangeBlockType("toggle")} />
        </Section>

        {/* Decorations */}
        <Section label="Decoration">
          <div className="flex gap-1">
            <button
              onClick={() => onApplyDecoration(currentDecoration === "focus" ? undefined : "focus")}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[5px] transition-colors"
              style={{
                background: currentDecoration === "focus" ? "var(--accent-primary-subtle)" : "var(--neutral-50)",
                color: currentDecoration === "focus" ? "var(--accent-primary)" : "var(--text-tertiary)",
                fontSize: "11px",
                fontWeight: 500,
                border: `1px solid ${currentDecoration === "focus" ? "var(--accent-primary)" : "transparent"}`,
              }}
            >
              <div className="w-0.5 h-3 rounded-full" style={{ background: "currentColor" }} />
              Focus
            </button>
            <button
              onClick={() => onApplyDecoration(currentDecoration === "block" ? undefined : "block")}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[5px] transition-colors"
              style={{
                background: currentDecoration === "block" ? "var(--accent-primary-subtle)" : "var(--neutral-50)",
                color: currentDecoration === "block" ? "var(--accent-primary)" : "var(--text-tertiary)",
                fontSize: "11px",
                fontWeight: 500,
                border: `1px solid ${currentDecoration === "block" ? "var(--accent-primary)" : "transparent"}`,
              }}
            >
              <div className="w-3 h-2.5 rounded-[2px] border" style={{ borderColor: "currentColor" }} />
              Block
            </button>
          </div>
        </Section>

        {/* Colors */}
        <Section label="Color">
          <div className="flex flex-wrap gap-1.5">
            {currentColor && (
              <button
                onClick={() => onApplyColor(undefined)}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ border: "1px solid var(--border-default)" }}
                title="Reset color"
              >
                <X className="w-2.5 h-2.5" style={{ color: "var(--text-quaternary)" }} />
              </button>
            )}
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onApplyColor(c.value)}
                className="w-5 h-5 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c.value,
                  boxShadow: currentColor === c.value ? `0 0 0 2px var(--surface-bg), 0 0 0 3.5px ${c.value}` : undefined,
                }}
                title={c.label}
              />
            ))}
          </div>
        </Section>

        {/* Font */}
        <Section label="Font">
          <div className="flex gap-1">
            {FONTS.map((f) => (
              <button
                key={f.value}
                onClick={() => onApplyFont(f.value)}
                className="flex-1 py-1.5 rounded-[5px] transition-colors text-center"
                style={{
                  background: currentFont === f.value ? "var(--accent-primary-subtle)" : "var(--neutral-50)",
                  color: currentFont === f.value ? "var(--accent-primary)" : "var(--text-tertiary)",
                  fontFamily: FONT_FAMILIES[f.value],
                  fontSize: "11px",
                  fontWeight: 500,
                  border: `1px solid ${currentFont === f.value ? "var(--accent-primary)" : "transparent"}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </motion.div>
  );
}

/* ─── Section ─── */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

/* ─── Format Button ─── */
function FormatBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-[5px] transition-colors"
      style={{
        background: active ? "var(--accent-primary-subtle)" : "transparent",
        color: active ? "var(--accent-primary)" : "var(--text-secondary)",
        fontSize: "12px",
        fontWeight: active ? 500 : 400,
      }}
    >
      <Icon className="w-3.5 h-3.5" weight={active ? "bold" : "regular"} />
      {label}
    </button>
  );
}

/* ─── Inline Format Button ─── */
function InlineBtn({
  icon: Icon,
  label,
  onClick,
  shortcut,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  shortcut: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
      style={{ color: "var(--text-secondary)" }}
      title={`${label} (\u2318${shortcut})`}
    >
      <Icon className="w-4 h-4" />
      <span style={{ fontSize: "9px", color: "var(--text-quaternary)" }}>\u2318{shortcut}</span>
    </button>
  );
}

export default FormatPanel;