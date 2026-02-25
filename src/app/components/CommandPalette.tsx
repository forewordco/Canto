import { useState, useEffect, useCallback, useRef } from "react";
import { Command } from "cmdk";
import {
  MagnifyingGlass,
  House,
  Tray,
  FolderOpen,
  FileText,
  CalendarBlank,
  Binoculars,
  UsersThree,
  Gear,
  Clock,
  ArrowRight,
  X,
  Sparkle,
  Kanban,
  Plus,
  Lightning,
} from "@phosphor-icons/react";
import { useNavigation, type NavId } from "../lib/navigation";

/* ═══════════════════════════════════════════════════════════
   COMMAND PALETTE — Cmd+K search overlay
   Desktop: centered popover with backdrop
   Mobile: full-screen overlay with recent searches
   ═══════════════════════════════════════════════════════════ */

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  label: string;
  category: string;
  icon: React.ElementType;
  nav?: NavId;
  params?: Record<string, string>;
  keywords?: string[];
  shortcut?: string;
}

/** Navigation items */
const NAV_ITEMS: SearchItem[] = [
  { id: "nav-home", label: "Home", category: "Navigate", icon: House, nav: "home", keywords: ["dashboard", "today", "lineup"] },
  { id: "nav-inbox", label: "Inbox", category: "Navigate", icon: Tray, nav: "inbox", keywords: ["notifications", "messages"] },
  { id: "nav-projects", label: "Projects", category: "Navigate", icon: FolderOpen, nav: "overview", keywords: ["portfolio", "list"] },
  { id: "nav-docs", label: "Docs", category: "Navigate", icon: FileText, nav: "docs", keywords: ["documents", "notes", "wiki"] },
  { id: "nav-calendar", label: "Calendar", category: "Navigate", icon: CalendarBlank, nav: "calendar", keywords: ["schedule", "events"] },
  { id: "nav-clients", label: "Clients", category: "Navigate", icon: Binoculars, nav: "clients-list", keywords: ["contacts", "companies"] },
  { id: "nav-team", label: "Team", category: "Navigate", icon: UsersThree, nav: "team", keywords: ["members", "people"] },
  { id: "nav-settings", label: "Settings", category: "Navigate", icon: Gear, nav: "settings", keywords: ["preferences", "profile", "theme"] },
];

/** Quick action items */
const ACTION_ITEMS: SearchItem[] = [
  { id: "act-new-task", label: "New Task", category: "Quick Actions", icon: Plus, keywords: ["create", "add", "task"] },
  { id: "act-new-project", label: "New Project", category: "Quick Actions", icon: Kanban, keywords: ["create", "add", "project"] },
  { id: "act-new-doc", label: "New Document", category: "Quick Actions", icon: FileText, keywords: ["create", "add", "doc", "note"] },
];

/** Example project stubs */
const PROJECT_ITEMS: SearchItem[] = [
  { id: "proj-atlas", label: "Atlas Design System", category: "Projects", icon: FolderOpen, nav: "project", params: { projectId: "atlas" }, keywords: ["design", "branding"] },
  { id: "proj-nova", label: "Nova Brand Campaign", category: "Projects", icon: FolderOpen, nav: "project", params: { projectId: "nova" }, keywords: ["campaign", "marketing"] },
  { id: "proj-echo", label: "Echo Product Launch", category: "Projects", icon: FolderOpen, nav: "project", params: { projectId: "echo" }, keywords: ["product", "launch"] },
];

/** Example recent items */
const RECENT_ITEMS: SearchItem[] = [
  { id: "recent-1", label: "Update hero section assets", category: "Recent", icon: Lightning, nav: "project", params: { projectId: "atlas", taskId: "t1" } },
  { id: "recent-2", label: "Review color palette v2", category: "Recent", icon: Clock, nav: "project", params: { projectId: "atlas", taskId: "t2" } },
  { id: "recent-3", label: "Script draft — Brand Video", category: "Recent", icon: Clock, nav: "project", params: { projectId: "nova", taskId: "t3" } },
];

const ALL_ITEMS = [...RECENT_ITEMS, ...NAV_ITEMS, ...ACTION_ITEMS, ...PROJECT_ITEMS];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setSearch("");
      // cmdk handles focus internally, but let's ensure
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      if (item.nav) {
        navigate(item.nav, item.params);
      }
      onClose();
    },
    [navigate, onClose]
  );

  if (!open) return null;

  const hasSearch = search.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[60]" style={{ fontFamily: "'Albert Sans', sans-serif" }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Command dialog */}
      <div className="flex items-start md:items-center justify-center h-full px-4 pt-[15vh] md:pt-0">
        <Command
          className="relative w-full max-w-[560px] rounded-[12px] overflow-hidden shadow-2xl"
          style={{
            background: "var(--surface-bg)",
            boxShadow:
              "0 24px 64px oklch(0 0 0 / 0.2), 0 8px 24px oklch(0 0 0 / 0.1), 0 0 0 1px oklch(0 0 0 / 0.05)",
          }}
          label="Search"
          loop
        >
          {/* Search input */}
          <div
            className="flex items-center gap-3 px-4 h-[52px] border-b"
            style={{ borderColor: "var(--border-default)" }}
          >
            <MagnifyingGlass
              className="w-5 h-5 shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            />
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Search or jump to..."
              className="flex-1 bg-transparent outline-none"
              style={{
                color: "var(--text-primary)",
                fontSize: "15px",
                caretColor: "var(--accent-primary)",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: "var(--text-quaternary)" }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[4px]"
              style={{
                background: "var(--neutral-100)",
                color: "var(--text-quaternary)",
                fontSize: "11px",
                fontWeight: 500,
                border: "1px solid var(--border-default)",
              }}
            >
              esc
            </kbd>
          </div>

          {/* Results list */}
          <Command.List
            className="overflow-y-auto overscroll-contain"
            style={{
              maxHeight: "min(400px, 50vh)",
            }}
          >
            <Command.Empty className="py-10 text-center">
              <div className="space-y-2">
                <MagnifyingGlass
                  className="w-8 h-8 mx-auto"
                  style={{ color: "var(--text-quaternary)" }}
                />
                <p
                  style={{
                    color: "var(--text-tertiary)",
                    fontSize: "14px",
                  }}
                >
                  No results found for "{search}"
                </p>
                <p
                  style={{
                    color: "var(--text-quaternary)",
                    fontSize: "12px",
                  }}
                >
                  Try a different search term
                </p>
              </div>
            </Command.Empty>

            {/* Show recent when no search */}
            {!hasSearch && (
              <Command.Group
                heading={
                  <span
                    className="px-4 py-2 block uppercase"
                    style={{
                      color: "var(--text-quaternary)",
                      fontSize: "10px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                    }}
                  >
                    Recent
                  </span>
                }
              >
                {RECENT_ITEMS.map((item) => (
                  <CommandItem
                    key={item.id}
                    item={item}
                    onSelect={() => handleSelect(item)}
                  />
                ))}
              </Command.Group>
            )}

            {/* Navigation */}
            <Command.Group
              heading={
                <span
                  className="px-4 py-2 block uppercase"
                  style={{
                    color: "var(--text-quaternary)",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  Navigate
                </span>
              }
            >
              {NAV_ITEMS.map((item) => (
                <CommandItem
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                />
              ))}
            </Command.Group>

            {/* Quick Actions */}
            <Command.Group
              heading={
                <span
                  className="px-4 py-2 block uppercase"
                  style={{
                    color: "var(--text-quaternary)",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  Quick Actions
                </span>
              }
            >
              {ACTION_ITEMS.map((item) => (
                <CommandItem
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                />
              ))}
            </Command.Group>

            {/* Projects */}
            <Command.Group
              heading={
                <span
                  className="px-4 py-2 block uppercase"
                  style={{
                    color: "var(--text-quaternary)",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  Projects
                </span>
              }
            >
              {PROJECT_ITEMS.map((item) => (
                <CommandItem
                  key={item.id}
                  item={item}
                  onSelect={() => handleSelect(item)}
                />
              ))}
            </Command.Group>
          </Command.List>

          {/* Footer hints */}
          <div
            className="hidden sm:flex items-center gap-4 px-4 py-2.5 border-t"
            style={{
              borderColor: "var(--border-default)",
              background: "var(--neutral-50)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <kbd
                className="inline-flex items-center justify-center w-5 h-5 rounded-[3px]"
                style={{
                  background: "var(--neutral-100)",
                  color: "var(--text-quaternary)",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "1px solid var(--border-default)",
                }}
              >
                ↵
              </kbd>
              <span
                style={{
                  color: "var(--text-quaternary)",
                  fontSize: "11px",
                }}
              >
                Open
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd
                className="inline-flex items-center justify-center w-5 h-5 rounded-[3px]"
                style={{
                  background: "var(--neutral-100)",
                  color: "var(--text-quaternary)",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "1px solid var(--border-default)",
                }}
              >
                ↑
              </kbd>
              <kbd
                className="inline-flex items-center justify-center w-5 h-5 rounded-[3px]"
                style={{
                  background: "var(--neutral-100)",
                  color: "var(--text-quaternary)",
                  fontSize: "10px",
                  fontWeight: 600,
                  border: "1px solid var(--border-default)",
                }}
              >
                ↓
              </kbd>
              <span
                style={{
                  color: "var(--text-quaternary)",
                  fontSize: "11px",
                }}
              >
                Navigate
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

/* ─── Individual command item ─── */

function CommandItem({
  item,
  onSelect,
}: {
  item: SearchItem;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${item.label} ${item.keywords?.join(" ") || ""}`}
      onSelect={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors mx-1 rounded-[6px]"
      style={{ color: "var(--text-secondary)" }}
    >
      <item.icon className="w-4 h-4 shrink-0" style={{ color: "var(--text-tertiary)" }} />
      <span
        className="flex-1 truncate"
        style={{ fontSize: "14px" }}
      >
        {item.label}
      </span>
      <ArrowRight
        className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100"
        style={{ color: "var(--text-quaternary)" }}
      />
    </Command.Item>
  );
}
