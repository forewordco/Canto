/* ===================================================================
   SCRIPT TOOLBAR — Quick insert bar for screenplay element types (D8-4).
   
   Horizontal bar showing all screenplay element types for quick insertion.
   Only visible for script-type docs. Highlights the current block type.
   =================================================================== */

import {
  FilmScript,
  TextAa,
  UserCircle,
  ChatCentered,
  TextT,
  ArrowRight,
} from "@phosphor-icons/react";
import type { DocBlockType } from "../../lib/types";

const SCRIPT_ELEMENTS: {
  type: DocBlockType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  hint: string;
}[] = [
  { type: "scene-heading", label: "Scene Heading", shortLabel: "Scene", icon: FilmScript, hint: "INT./EXT." },
  { type: "action", label: "Action", shortLabel: "Action", icon: TextAa, hint: "Description" },
  { type: "character", label: "Character", shortLabel: "Char", icon: UserCircle, hint: "NAME" },
  { type: "dialogue", label: "Dialogue", shortLabel: "Dialog", icon: ChatCentered, hint: "Speech" },
  { type: "parenthetical", label: "Parenthetical", shortLabel: "Paren", icon: TextT, hint: "(wryly)" },
  { type: "transition", label: "Transition", shortLabel: "Trans", icon: ArrowRight, hint: "CUT TO:" },
];

interface ScriptToolbarProps {
  currentBlockType?: DocBlockType;
  onInsertElement: (type: DocBlockType) => void;
}

export function ScriptToolbar({ currentBlockType, onInsertElement }: ScriptToolbarProps) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1.5 rounded-[8px] overflow-x-auto"
      style={{
        background: "var(--neutral-50)",
        border: "1px solid var(--border-default)",
      }}
    >
      <span
        className="shrink-0 mr-1"
        style={{
          color: "#8B5CF6",
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: "'Courier Prime', monospace",
        }}
      >
        Elements
      </span>
      {SCRIPT_ELEMENTS.map((el) => {
        const isActive = currentBlockType === el.type;
        const Icon = el.icon;
        return (
          <button
            key={el.type}
            onClick={() => onInsertElement(el.type)}
            className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{
              background: isActive ? "rgba(139, 92, 246, 0.1)" : undefined,
              color: isActive ? "#8B5CF6" : "var(--text-tertiary)",
              fontSize: "11px",
              fontWeight: isActive ? 600 : 500,
              fontFamily: "'Courier Prime', monospace",
            }}
            title={`${el.label} — ${el.hint}`}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{el.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ScriptToolbar;
