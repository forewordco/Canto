/* ═══════════════════════════════════════════════════════════
   LIST TOOLBAR — Standardized toolbar for all list views.

   Matches Figma Frame5 design: 5 compact icons in a row
   (Search, Sort, Filter, Group, Options) at 13px.

   Used in: DocsPage, ProjectsOverview, InboxPage, SpacesPage,
            TeamPage, ClientsListPage, and any list-based view.
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "@phosphor-icons/react";
import svgPaths from "../../imports/svg-fqld3l7bho";

/* ─── Icon Components (from Figma) ─── */

function SearchIcon({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
      <g clipPath="url(#searchClip)">
        <path
          d={svgPaths.p169d4200}
          stroke={active ? "var(--accent-primary)" : "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.8125"
        />
        <path
          d={svgPaths.pf3b0c90}
          stroke={active ? "var(--accent-primary)" : "currentColor"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="0.8125"
        />
      </g>
      <defs>
        <clipPath id="searchClip">
          <rect fill="white" height="13" rx="2" width="13" />
        </clipPath>
      </defs>
    </svg>
  );
}

function SortIcon({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
      <g clipPath="url(#sortClip)">
        <path d="M2.4375 6.5H6.09375" stroke={active ? "var(--accent-primary)" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
        <path d="M2.4375 3.25H9.34375" stroke={active ? "var(--accent-primary)" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
        <path d="M2.4375 9.75H5.28125" stroke={active ? "var(--accent-primary)" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
        <path d={svgPaths.p1e9d7c90} stroke={active ? "var(--accent-primary)" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
        <path d="M9.34375 10.5625V5.6875" stroke={active ? "var(--accent-primary)" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
      </g>
      <defs>
        <clipPath id="sortClip">
          <rect fill="white" height="13" width="13" />
        </clipPath>
      </defs>
    </svg>
  );
}

function FilterIcon({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
      <path d={svgPaths.p35e1d640} fill={active ? "var(--accent-primary)" : "currentColor"} />
    </svg>
  );
}

function GroupIcon({ active }: { active?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 14.1253 14.1253" fill="none">
      <path d={svgPaths.p48e5d80} stroke={active ? "var(--accent-primary)" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
      <path d={svgPaths.pe5b1d00} stroke={active ? "var(--accent-primary)" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8125" />
    </svg>
  );
}

function OptionsIcon({ active }: { active?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 13 13" fill="none">
      <g clipPath="url(#optClip)">
        <path d={svgPaths.p3763f80} stroke={active ? "var(--accent-primary)" : "currentColor"} strokeMiterlimit="10" strokeWidth="0.8125" />
        <path d={svgPaths.pf5e37f0} fill={active ? "var(--accent-primary)" : "currentColor"} />
        <path d={svgPaths.p1db98b80} fill={active ? "var(--accent-primary)" : "currentColor"} />
        <path d={svgPaths.p223ac080} fill={active ? "var(--accent-primary)" : "currentColor"} />
      </g>
      <defs>
        <clipPath id="optClip">
          <rect fill="white" height="13" width="13" />
        </clipPath>
      </defs>
    </svg>
  );
}

/* ─── Sort Option type ─── */

export interface SortOption {
  value: string;
  label: string;
}

/* ─── Props ─── */

export interface ListToolbarProps {
  /** Search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Sort */
  sortOptions?: SortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;

  /** Filter */
  activeFilterCount?: number;
  onFilterClick?: () => void;

  /** Group */
  groupActive?: boolean;
  groupLabel?: string;
  onGroupClick?: () => void;
  groupOptions?: SortOption[];
  groupValue?: string;
  onGroupChange?: (value: string) => void;

  /** Options */
  onOptionsClick?: () => void;
  optionsContent?: React.ReactNode;

  /** Hide individual icons */
  hideSearch?: boolean;
  hideSort?: boolean;
  hideFilter?: boolean;
  hideGroup?: boolean;
  hideOptions?: boolean;
}

/* ─── Toolbar Button ─── */

function ToolbarBtn({
  onClick,
  active,
  title,
  badge,
  children,
}: {
  onClick?: () => void;
  active?: boolean;
  title?: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="relative flex items-center justify-center w-[26px] h-[26px] rounded-[5px] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
      style={{ color: active ? "var(--accent-primary)" : "var(--text-quaternary)" }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-white text-[8px] font-bold px-[3px]"
          style={{ background: "var(--accent-primary)" }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

/* ─── Main Component ─── */

export function ListToolbar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search…",
  sortOptions,
  sortValue,
  onSortChange,
  activeFilterCount = 0,
  onFilterClick,
  groupActive = false,
  groupLabel,
  onGroupClick,
  groupOptions,
  groupValue,
  onGroupChange,
  onOptionsClick,
  optionsContent,
  hideSearch = false,
  hideSort = false,
  hideFilter = false,
  hideGroup = false,
  hideOptions = false,
}: ListToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);
  const groupBtnRef = useRef<HTMLButtonElement>(null);
  const optionsBtnRef = useRef<HTMLButtonElement>(null);
  const sortDropRef = useRef<HTMLDivElement>(null);
  const groupDropRef = useRef<HTMLDivElement>(null);
  const optionsDropRef = useRef<HTMLDivElement>(null);

  // Focus search on open
  useEffect(() => {
    if (searchOpen) requestAnimationFrame(() => searchRef.current?.focus());
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!sortOpen && !groupOpen && !optionsOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sortOpen && sortBtnRef.current && !sortBtnRef.current.contains(target) && sortDropRef.current && !sortDropRef.current.contains(target)) {
        setSortOpen(false);
      }
      if (groupOpen && groupBtnRef.current && !groupBtnRef.current.contains(target) && groupDropRef.current && !groupDropRef.current.contains(target)) {
        setGroupOpen(false);
      }
      if (optionsOpen && optionsBtnRef.current && !optionsBtnRef.current.contains(target) && optionsDropRef.current && !optionsDropRef.current.contains(target)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen, groupOpen, optionsOpen]);

  const handleSearchToggle = useCallback(() => {
    if (searchOpen) {
      onSearchChange?.("");
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
    }
  }, [searchOpen, onSearchChange]);

  const handleSortToggle = useCallback(() => {
    if (sortOptions && sortOptions.length > 0) {
      setSortOpen(!sortOpen);
    }
  }, [sortOptions, sortOpen]);

  const handleGroupToggle = useCallback(() => {
    if (groupOptions && groupOptions.length > 0) {
      setGroupOpen(!groupOpen);
    }
  }, [groupOptions, groupOpen]);

  const handleOptionsToggle = useCallback(() => {
    if (optionsContent) {
      setOptionsOpen(!optionsOpen);
    } else {
      onOptionsClick?.();
    }
  }, [optionsContent, optionsOpen, onOptionsClick]);

  // Compute dropdown positions
  const [sortPos, setSortPos] = useState({ top: 0, left: 0 });
  const [groupPos, setGroupPos] = useState({ top: 0, left: 0 });
  const [optionsPos, setOptionsPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (sortOpen && sortBtnRef.current) {
      const rect = sortBtnRef.current.getBoundingClientRect();
      setSortPos({ top: rect.bottom + 4, left: rect.right - 160 });
    }
  }, [sortOpen]);

  useEffect(() => {
    if (groupOpen && groupBtnRef.current) {
      const rect = groupBtnRef.current.getBoundingClientRect();
      setGroupPos({ top: rect.bottom + 4, left: rect.right - 160 });
    }
  }, [groupOpen]);

  useEffect(() => {
    if (optionsOpen && optionsBtnRef.current) {
      const rect = optionsBtnRef.current.getBoundingClientRect();
      setOptionsPos({ top: rect.bottom + 4, left: rect.right - 180 });
    }
  }, [optionsOpen]);

  const hasActiveSort = sortValue && sortOptions && sortOptions.length > 0 && sortValue !== sortOptions[0]?.value;

  return (
    <div className="flex items-center gap-[2px]">
      {/* Inline search input (expandable) */}
      <AnimatePresence>
        {searchOpen && !hideSearch && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 180, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-1.5 px-2 py-[3px] rounded-[5px]"
              style={{ border: "1px solid var(--border-default)", background: "var(--neutral-50)" }}
            >
              <SearchIcon active />
              <input
                ref={searchRef}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent outline-none min-w-0"
                style={{ color: "var(--text-primary)", fontSize: "11px" }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onSearchChange?.("");
                    setSearchOpen(false);
                  }
                }}
              />
              {searchValue && (
                <button onClick={() => onSearchChange?.("")} style={{ color: "var(--text-quaternary)" }}>
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search icon */}
      {!hideSearch && (
        <ToolbarBtn
          onClick={handleSearchToggle}
          active={searchOpen || !!searchValue}
          title="Search"
        >
          <SearchIcon active={searchOpen || !!searchValue} />
        </ToolbarBtn>
      )}

      {/* Sort icon */}
      {!hideSort && (
        <button
          ref={sortBtnRef as any}
          onClick={handleSortToggle}
          title="Sort"
          className="relative flex items-center justify-center w-[26px] h-[26px] rounded-[5px] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
          style={{ color: hasActiveSort ? "var(--accent-primary)" : "var(--text-quaternary)" }}
        >
          <SortIcon active={!!hasActiveSort} />
        </button>
      )}

      {/* Filter icon */}
      {!hideFilter && (
        <ToolbarBtn
          onClick={onFilterClick}
          active={activeFilterCount > 0}
          title="Filter"
          badge={activeFilterCount > 0 ? activeFilterCount : undefined}
        >
          <FilterIcon active={activeFilterCount > 0} />
        </ToolbarBtn>
      )}

      {/* Group icon */}
      {!hideGroup && (
        <button
          ref={groupBtnRef as any}
          onClick={handleGroupToggle}
          title="Group"
          className="relative flex items-center justify-center w-[26px] h-[26px] rounded-[5px] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
          style={{ color: groupActive ? "var(--accent-primary)" : "var(--text-quaternary)" }}
        >
          <div className="w-[14px] h-[14px] flex items-center justify-center">
            <GroupIcon active={groupActive} />
          </div>
        </button>
      )}

      {/* Options icon */}
      {!hideOptions && (
        <button
          ref={optionsBtnRef as any}
          onClick={handleOptionsToggle}
          title="Options"
          className="relative flex items-center justify-center w-[26px] h-[26px] rounded-[5px] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
          style={{ color: optionsOpen ? "var(--accent-primary)" : "var(--text-quaternary)" }}
        >
          <OptionsIcon active={optionsOpen} />
        </button>
      )}

      {/* Sort dropdown portal */}
      {sortOpen && sortOptions && sortOptions.length > 0 && createPortal(
        <div
          ref={sortDropRef}
          className="py-1.5 rounded-[8px] shadow-lg min-w-[160px]"
          style={{
            position: "fixed",
            top: sortPos.top,
            left: Math.max(8, sortPos.left),
            zIndex: 9999,
            background: "var(--surface-bg)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="px-3 py-1.5 mb-0.5" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sort by
          </div>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onSortChange?.(opt.value); setSortOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ fontSize: "13px", color: sortValue === opt.value ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: sortValue === opt.value ? 500 : 400 }}
            >
              {sortValue === opt.value && <Check className="w-3.5 h-3.5" />}
              <span className={sortValue === opt.value ? "" : "pl-[22px]"}>{opt.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Group dropdown portal */}
      {groupOpen && groupOptions && groupOptions.length > 0 && createPortal(
        <div
          ref={groupDropRef}
          className="py-1.5 rounded-[8px] shadow-lg min-w-[160px]"
          style={{
            position: "fixed",
            top: groupPos.top,
            left: Math.max(8, groupPos.left),
            zIndex: 9999,
            background: "var(--surface-bg)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="px-3 py-1.5 mb-0.5" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Group by
          </div>
          {groupOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onGroupChange?.(opt.value); setGroupOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ fontSize: "13px", color: groupValue === opt.value ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: groupValue === opt.value ? 500 : 400 }}
            >
              {groupValue === opt.value && <Check className="w-3.5 h-3.5" />}
              <span className={groupValue === opt.value ? "" : "pl-[22px]"}>{opt.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Options dropdown portal */}
      {optionsOpen && optionsContent && createPortal(
        <div
          ref={optionsDropRef}
          className="py-1.5 rounded-[8px] shadow-lg min-w-[180px]"
          style={{
            position: "fixed",
            top: optionsPos.top,
            left: Math.max(8, optionsPos.left),
            zIndex: 9999,
            background: "var(--surface-bg)",
            border: "1px solid var(--border-default)",
          }}
        >
          {optionsContent}
        </div>,
        document.body
      )}
    </div>
  );
}