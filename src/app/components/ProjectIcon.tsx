/* ===================================================================
   PROJECT ICON — Shared component that renders a project's Phosphor
   icon with its color, in a rounded container. Never renders emojis.
   =================================================================== */

import { SquareHalf } from "@phosphor-icons/react";
import { getPhosphorIcon } from "./PhosphorIconPicker";

interface ProjectIconProps {
  /** Phosphor icon name from the project (e.g. "Camera", "VideoCamera") */
  phosphorIcon?: string;
  /** Project color */
  color?: string;
  /** Custom uploaded icon URL — takes priority */
  iconUrl?: string;
  /** Size preset */
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: { box: "w-4 h-4", radius: "rounded-[3px]", iconSize: 10 },
  sm: { box: "w-5 h-5", radius: "rounded-[4px]", iconSize: 13 },
  md: { box: "w-7 h-7", radius: "rounded-[5px]", iconSize: 16 },
  lg: { box: "w-8 h-8", radius: "rounded-[6px]", iconSize: 18 },
} as const;

export function ProjectIcon({
  phosphorIcon,
  color,
  iconUrl,
  size = "sm",
  className = "",
}: ProjectIconProps) {
  const c = color || "var(--accent-primary)";
  const s = SIZE_MAP[size];
  const IconComp = phosphorIcon ? (getPhosphorIcon(phosphorIcon) || SquareHalf) : SquareHalf;

  return (
    <div
      className={`${s.box} ${s.radius} flex items-center justify-center shrink-0 ${className}`}
      style={{ background: `color-mix(in oklch, ${c} 12%, transparent)` }}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="" className={`w-full h-full ${s.radius} object-cover`} />
      ) : (
        <IconComp size={s.iconSize} weight="fill" style={{ color: c }} />
      )}
    </div>
  );
}
