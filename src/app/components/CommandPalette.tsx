import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Command } from "cmdk";
import {
  MagnifyingGlass,
  House,
  Tray,
  SquareHalf,
  FileText,
  CalendarBlank,
  Binoculars,
  UsersThree,
  Gear,
  ArrowRight,
  X,
  Kanban,
  Plus,
  CheckCircle,
  Circle,
  User,
  NotePencil,
  VideoCamera,
  FilmScript,
  Notebook,
  ChatCircle,
} from "@phosphor-icons/react";
import { useNavigation, type NavId } from "../lib/navigation";
import { useData } from "../lib/data";
import { getPhosphorIcon } from "./PhosphorIconPicker";
import { useGlobalTaskDetail } from "./GlobalTaskDetail";

/* ═══════════════════════════════════════════════════════════
   COMMAND PALETTE — Cmd+K global search overlay
   
   Searches across:
   - Navigation pages
   - Projects (names, clients, types)
   - Tasks (titles, tags, sections) across all projects
   - Workspace Docs (titles, types)
   - Clients (names, contacts)
   - Team Members (names, emails, roles)
   - Quick Actions (create task/project/doc)
   
   Desktop: centered popover with backdrop
   Mobile: full-screen overlay
   ══════════════════════════════════════════════════════════ */

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  label: string;
  sublabel?: string;
  category: string;
  icon: React.ElementType;
  iconColor?: string;
  nav?: NavId;
  params?: Record<string, string>;
  keywords?: string[];
  badge?: string;
  badgeColor?: string;
}

/** Navigation items */
const NAV_ITEMS: SearchItem[] = [
  { id: "nav-home", label: "Home", category: "Navigate", icon: House, nav: "home", keywords: ["dashboard", "today", "lineup"] },
  { id: "nav-inbox", label: "Inbox", category: "Navigate", icon: Tray, nav: "inbox", keywords: ["notifications", "messages"] },
  { id: "nav-projects", label: "Projects", category: "Navigate", icon: SquareHalf, nav: "overview", keywords: ["portfolio", "list"] },
  { id: "nav-docs", label: "Docs", category: "Navigate", icon: Notebook, nav: "docs", keywords: ["documents", "notes", "wiki"] },
  { id: "nav-calendar", label: "Calendar", category: "Navigate", icon: CalendarBlank, nav: "calendar", keywords: ["schedule", "events"] },
  { id: "nav-clients", label: "Clients", category: "Navigate", icon: Binoculars, nav: "clients-list", keywords: ["contacts", "companies"] },
  { id: "nav-team", label: "Team", category: "Navigate", icon: UsersThree, nav: "team", keywords: ["members", "people"] },
  { id: "nav-settings", label: "Settings", category: "Navigate", icon: Gear, nav: "settings", keywords: ["preferences", "profile", "theme"] },
  { id: "nav-chat", label: "Chat", category: "Navigate", icon: ChatCircle, nav: "chat" as NavId, keywords: ["messages", "dm", "messaging", "conversation"] },
];

/** Quick action items */
const ACTION_ITEMS: SearchItem[] = [
  { id: "act-new-task", label: "New Task", category: "Quick Actions", icon: Plus, keywords: ["create", "add", "task"] },
  { id: "act-new-project", label: "New Project", category: "Quick Actions", icon: Kanban, keywords: ["create", "add", "project"] },
  { id: "act-new-doc", label: "New Document", category: "Quick Actions", icon: FileText, keywords: ["create", "add", "doc", "note"] },
];

/** Doc type icon map */
const DOC_ICONS: Record<string, React.ElementType> = {
  doc: FileText,
  note: NotePencil,
  meeting: VideoCamera,
  script: FilmScript,
};

/** Max items per category in search results */
const MAX_SEARCH_RESULTS_PER_CATEGORY = 8;

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { navigate } = useNavigation();
  const { projects, docs, clients, teamMembers } = useData();
  const { openTaskDetail } = useGlobalTaskDetail();

  const safeProjects = projects ?? {};
  const safeDocs = docs ?? [];
  const safeClients = clients ?? [];
  const safeTeamMembers = teamMembers ?? [];

  // Build project items
  const PROJECT_ITEMS: SearchItem[] = useMemo(() => {
    return Object.entries(safeProjects).map(([name, proj]) => ({
      id: `proj-${name}`,
      label: proj.shortName || name,
      sublabel: proj.client || undefined,
      category: "Projects",
      icon: (proj.phosphorIcon ? getPhosphorIcon(proj.phosphorIcon) : null) || SquareHalf,
      iconColor: proj.color || undefined,
      nav: "project" as NavId,
      params: { projectId: name },
      keywords: [name, proj.client, proj.projectType, proj.description].filter(Boolean) as string[],
      badge: proj.productionPhase || undefined,
    }));
  }, [safeProjects]);

  // Build task items from all projects (capped for performance)
  const TASK_ITEMS: SearchItem[] = useMemo(() => {
    const items: SearchItem[] = [];
    for (const [projectName, proj] of Object.entries(safeProjects)) {
      const displayName = proj.shortName || projectName;
      for (const task of proj.tasks || []) {
        items.push({
          id: `task-${projectName}-${task.id}`,
          label: task.title,
          sublabel: displayName,
          category: "Tasks",
          icon: task.completed ? CheckCircle : Circle,
          nav: "project" as NavId,
          params: { projectId: projectName, taskId: task.id },
          keywords: [
            task.title,
            task.section || "",
            task.assignee || "",
            ...(task.tags || []),
            task.priority || "",
            projectName,
          ].filter(Boolean),
          badge: task.section || undefined,
          badgeColor: task.completed ? "oklch(0.73 0.15 155)" : undefined,
        });
      }
    }
    return items;
  }, [safeProjects]);

  // Build doc items
  const DOC_ITEMS: SearchItem[] = useMemo(() => {
    return safeDocs.map((doc) => ({
      id: `doc-${doc.id}`,
      label: doc.title || "Untitled",
      sublabel: doc.projectName || undefined,
      category: "Docs",
      icon: DOC_ICONS[doc.type] || FileText,
      nav: "docs" as NavId,
      params: { docId: doc.id },
      keywords: [
        doc.title,
        doc.type,
        doc.projectName || "",
        doc.importSource || "",
      ].filter(Boolean),
      badge: doc.type !== "doc" ? doc.type : undefined,
    }));
  }, [safeDocs]);

  // Build client items
  const CLIENT_ITEMS: SearchItem[] = useMemo(() => {
    return safeClients.map((client) => ({
      id: `client-${client.id}`,
      label: client.name,
      sublabel: client.contacts?.[0]?.email || undefined,
      category: "Clients",
      icon: Binoculars,
      nav: "client" as NavId,
      params: { clientId: client.id },
      keywords: [
        client.name,
        client.description || "",
        ...(client.contacts || []).map((c) => `${c.name} ${c.email}`),
        ...(client.connectedProjects || []),
      ].filter(Boolean),
    }));
  }, [safeClients]);

  // Build team member items
  const TEAM_ITEMS: SearchItem[] = useMemo(() => {
    return safeTeamMembers.map((member) => ({
      id: `team-${member.userId}`,
      label: member.displayName,
      sublabel: member.email,
      category: "Team",
      icon: User,
      nav: "team" as NavId,
      keywords: [
        member.displayName,
        member.email,
        member.role || "",
        member.department || "",
      ].filter(Boolean),
      badge: member.role || undefined,
    }));
  }, [safeTeamMembers]);

  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setSearch("");
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
      // For task items, open the global task detail overlay instead of navigating
      if (item.category === "Tasks" && item.params?.taskId) {
        openTaskDetail(item.params.taskId, item.params.projectId);
      } else if (item.nav) {
        navigate(item.nav, item.params);
      }
      onClose();
    },
    [navigate, onClose, openTaskDetail]
  );

  // Count total searchable items
  const totalItems = useMemo(
    () => PROJECT_ITEMS.length + TASK_ITEMS.length + DOC_ITEMS.length + CLIENT_ITEMS.length + TEAM_ITEMS.length,
    [PROJECT_ITEMS, TASK_ITEMS, DOC_ITEMS, CLIENT_ITEMS, TEAM_ITEMS]
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
      <div className="flex items-start md:items-center justify-center h-full px-0 pt-0 md:px-4 md:pt-0">
        <Command
          className="relative w-full h-full md:h-auto md:max-h-[70vh] max-w-full md:max-w-[560px] rounded-none md:rounded-[12px] overflow-hidden shadow-2xl"
          style={{
            background: "var(--surface-bg)",
            boxShadow:
              "0 24px 64px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)",
          }}
          label="Search"
          loop
        >
          {/* Search input */}
          <div
            className="flex items-center gap-3 px-4 h-[52px] border-b"
            style={{ borderColor: "var(--border-default)" }}
          >
            {/* Mobile back/close button */}
            <button
              onClick={onClose}
              className="md:hidden p-1 -ml-1 rounded-[6px] active:bg-black/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
            <MagnifyingGlass
              className="w-5 h-5 shrink-0"
              style={{ color: "var(--text-tertiary)" }}
            />
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Search tasks, projects, docs, people..."
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
              maxHeight: "min(420px, 55vh)",
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
                  No results found for &ldquo;{search}&rdquo;
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

            {/* ─── When NOT searching: show recent projects + navigation ─── */}
            {!hasSearch && (
              <>
                {PROJECT_ITEMS.length > 0 && (
                  <Command.Group heading={<GroupHeading>Recent Projects</GroupHeading>}>
                    {PROJECT_ITEMS.slice(0, 5).map((item) => (
                      <CommandItem
                        key={item.id}
                        item={item}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading={<GroupHeading>Navigate</GroupHeading>}>
                  {NAV_ITEMS.map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      onSelect={() => handleSelect(item)}
                    />
                  ))}
                </Command.Group>

                <Command.Group heading={<GroupHeading>Quick Actions</GroupHeading>}>
                  {ACTION_ITEMS.map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      onSelect={() => handleSelect(item)}
                    />
                  ))}
                </Command.Group>
              </>
            )}

            {/* ─── When searching: show all categories ─── */}
            {hasSearch && (
              <>
                {/* Tasks — highest priority in search */}
                {TASK_ITEMS.length > 0 && (
                  <Command.Group heading={<GroupHeading>Tasks</GroupHeading>}>
                    {TASK_ITEMS.slice(0, MAX_SEARCH_RESULTS_PER_CATEGORY).map((item) => (
                      <CommandItem
                        key={item.id}
                        item={item}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Projects */}
                {PROJECT_ITEMS.length > 0 && (
                  <Command.Group heading={<GroupHeading>Projects</GroupHeading>}>
                    {PROJECT_ITEMS.map((item) => (
                      <CommandItem
                        key={item.id}
                        item={item}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Docs */}
                {DOC_ITEMS.length > 0 && (
                  <Command.Group heading={<GroupHeading>Documents</GroupHeading>}>
                    {DOC_ITEMS.slice(0, MAX_SEARCH_RESULTS_PER_CATEGORY).map((item) => (
                      <CommandItem
                        key={item.id}
                        item={item}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Clients */}
                {CLIENT_ITEMS.length > 0 && (
                  <Command.Group heading={<GroupHeading>Clients</GroupHeading>}>
                    {CLIENT_ITEMS.map((item) => (
                      <CommandItem
                        key={item.id}
                        item={item}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Team */}
                {TEAM_ITEMS.length > 0 && (
                  <Command.Group heading={<GroupHeading>Team Members</GroupHeading>}>
                    {TEAM_ITEMS.map((item) => (
                      <CommandItem
                        key={item.id}
                        item={item}
                        onSelect={() => handleSelect(item)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Navigation + Actions (lower priority) */}
                <Command.Group heading={<GroupHeading>Navigation</GroupHeading>}>
                  {NAV_ITEMS.map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      onSelect={() => handleSelect(item)}
                    />
                  ))}
                </Command.Group>

                <Command.Group heading={<GroupHeading>Quick Actions</GroupHeading>}>
                  {ACTION_ITEMS.map((item) => (
                    <CommandItem
                      key={item.id}
                      item={item}
                      onSelect={() => handleSelect(item)}
                    />
                  ))}
                </Command.Group>
              </>
            )}
          </Command.List>

          {/* Footer hints */}
          <div
            className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t"
            style={{
              borderColor: "var(--border-default)",
              background: "var(--neutral-50)",
            }}
          >
            <div className="flex items-center gap-4">
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
                <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>Open</span>
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
                <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>Navigate</span>
              </div>
            </div>
            {/* Item count */}
            <span style={{ color: "var(--text-quaternary)", fontSize: "11px" }}>
              {totalItems} items
            </span>
          </div>
        </Command>
      </div>
    </div>
  );
}

/* ─── Group heading component ─── */

function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-4 py-2 block uppercase"
      style={{
        color: "var(--text-quaternary)",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </span>
  );
}

/* ─── Individual command item with sublabel + badge ─── */

function CommandItem({
  item,
  onSelect,
}: {
  item: SearchItem;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${item.label} ${item.sublabel || ""} ${item.keywords?.join(" ") || ""}`}
      onSelect={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors mx-1 rounded-[6px] group"
      style={{ color: "var(--text-secondary)" }}
    >
      <item.icon
        className="w-4 h-4 shrink-0"
        style={{ color: item.iconColor || item.badgeColor || "var(--text-tertiary)" }}
        weight={item.icon === CheckCircle ? "fill" : item.iconColor ? "fill" : undefined}
      />
      <div className="flex-1 min-w-0">
        <span className="truncate block" style={{ fontSize: "14px" }}>
          {item.label}
        </span>
        {item.sublabel && (
          <span
            className="truncate block"
            style={{ fontSize: "11px", color: "var(--text-quaternary)", marginTop: "-1px" }}
          >
            {item.sublabel}
          </span>
        )}
      </div>
      {item.badge && (
        <span
          className="shrink-0 px-1.5 py-0.5 rounded-[4px] capitalize"
          style={{
            fontSize: "10px",
            fontWeight: 500,
            color: "var(--text-quaternary)",
            background: "var(--neutral-100)",
          }}
        >
          {item.badge}
        </span>
      )}
      <ArrowRight
        className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--text-quaternary)" }}
      />
    </Command.Item>
  );
}