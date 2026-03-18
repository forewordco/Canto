/* ═══════════════════════════════════════════════════════════
   SPACE PICKER — Dropdown for assigning a Space to an item
   
   Used in ProjectPage details, project creation wizard,
   and doc settings. Shows a dropdown of available spaces
   with color indicators, plus "No space" option.
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect } from "react";
import { Planet, CaretDown, X, CirclesFour } from "@phosphor-icons/react";
import { useData } from "../lib/data";
import { getPhosphorIcon } from "./PhosphorIconPicker";
import type { Space } from "../lib/types";

interface SpacePickerProps {
  value?: string;           // current spaceId
  onChange: (spaceId: string | undefined) => void;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Icon-only mode — shows just the space icon with no label */
  iconOnly?: boolean;
  label?: string;
}

export function SpacePicker({ value, onChange, compact, iconOnly, label }: SpacePickerProps) {
  const { spaces } = useData();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentSpace = spaces.find((s) => s.id === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (spaces.length === 0) return null;

  /** Render space icon: iconUrl → phosphorIcon → emoji fallback */
  const renderSpaceIcon = (space: Space, size: "sm" | "md") => {
    const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    const iconDim = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

    if (space.iconUrl) {
      return (
        <img
          src={space.iconUrl}
          alt=""
          className={`${dim} rounded-full object-cover shrink-0`}
        />
      );
    }

    const PhIcon = space.phosphorIcon
      ? getPhosphorIcon(space.phosphorIcon) || CirclesFour
      : null;

    return (
      <span
        className={`${dim} rounded-full flex items-center justify-center shrink-0`}
        style={{ background: space.color.replace(")", " / 0.2)") }}
      >
        {PhIcon ? (
          <PhIcon className={iconDim} weight="fill" style={{ color: space.color }} />
        ) : (
          <span className={size === "sm" ? "text-[10px]" : "text-[11px]"}>{space.icon}</span>
        )}
      </span>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${iconOnly ? "p-1" : compact ? "px-1.5 py-0.5" : "px-2 py-1"}`}
        style={{ fontSize: compact ? "12px" : "13px" }}
        title={currentSpace ? currentSpace.name : label || "Space"}
      >
        {currentSpace ? (
          <>
            {renderSpaceIcon(currentSpace, iconOnly ? "md" : "sm")}
            {!iconOnly && (
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                {currentSpace.name}
              </span>
            )}
          </>
        ) : (
          <>
            <Planet className={iconOnly ? "w-5 h-5 shrink-0" : "w-3.5 h-3.5 shrink-0"} style={{ color: "var(--text-quaternary)" }} />
            {!iconOnly && (
              <span style={{ color: "var(--text-quaternary)" }}>
                {label || "Space"}
              </span>
            )}
          </>
        )}
        {!iconOnly && <CaretDown className="w-3 h-3 shrink-0" style={{ color: "var(--text-quaternary)" }} />}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 w-[180px] py-1 rounded-[8px] border shadow-lg"
          style={{
            background: "var(--surface-bg)",
            borderColor: "var(--border-default)",
          }}
        >
          {/* No space option */}
          <button
            onClick={() => { onChange(undefined); setOpen(false); }}
            className={`flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${!value ? "font-medium" : ""}`}
            style={{ fontSize: "13px", color: "var(--text-tertiary)" }}
          >
            <X className="w-3.5 h-3.5" />
            No space
          </button>

          <div className="mx-2 my-1 h-px" style={{ background: "var(--border-default)" }} />

          {spaces
            .sort((a, b) => a.order - b.order)
            .map((space) => (
              <button
                key={space.id}
                onClick={() => { onChange(space.id); setOpen(false); }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04] ${value === space.id ? "font-medium" : ""}`}
                style={{
                  fontSize: "13px",
                  color: value === space.id ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {renderSpaceIcon(space, "md")}
                <span className="flex-1 truncate">{space.name}</span>
                {value === space.id && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: space.color }} />
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}