/* ═══════════════════════════════════════════════════════════
   SPACE DETAIL PAGE — Full-page deep-dive into a space.
   Tabs: Overview, Assets, Projects, Docs, Pinned, Teams, People, Integrations
   Updated: force cache invalidation
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  SquareHalf,
  Notebook,
  UsersThree,
  Briefcase,
  Eye,
  PushPin,
  Package,
  ChartBar,
  ArrowRight,
  Plus,
  Star,
  X,
  UserPlus,
  EnvelopeSimple,
  Lightning,
  TrendUp,
  Target,
  FileText,
  Image as ImageIcon,
  FilmStrip,
  File,
  DownloadSimple,
  MagnifyingGlass,
  Crown,
  CirclesFour,
  UsersFour,
  Plugs,
  Cube,
  PencilSimple,
  CheckCircle,
  CircleNotch,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { useAuth } from "../lib/auth";
import { getUserSpaceRole, isSuperAdmin, isAdminOrAbove, MEMBER_ROLE_META } from "../lib/space-roles";
import { getPhosphorIcon } from "./PhosphorIconPicker";
import { ProjectIcon } from "./ProjectIcon";
import { haptic } from "../lib/haptics";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { SpacePerson, SpacePersonRole, SpaceMemberRole, ProjectData, WorkspaceDoc } from "../lib/types";
import { AVATAR_COLORS } from "../lib/types";
import { TeamsTab } from "./TeamsTab";
import { getIntegrationStatus, type IntegrationStatus } from "../lib/integrations";
import {
  FrameIoDialog,
  AsanaImportDialog,
  CraftImportDialog,
} from "./IntegrationDialogs";

/* ─── Helpers ─── */

function generatePersonId() {
  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Tab definitions ─── */

type TabId = "overview" | "assets" | "projects" | "docs" | "pinned" | "teams" | "people" | "integrations";

const TABS: { id: TabId; label: string; icon: typeof SquareHalf }[] = [
  { id: "overview", label: "Overview", icon: ChartBar },
  { id: "assets", label: "Assets", icon: Package },
  { id: "projects", label: "Projects", icon: SquareHalf },
  { id: "docs", label: "Docs", icon: Notebook },
  { id: "pinned", label: "Pinned", icon: PushPin },
  { id: "teams", label: "Teams", icon: UsersFour },
  { id: "people", label: "People", icon: UsersThree },
  { id: "integrations", label: "Integrations", icon: Plugs },
];

/* ─── Role config for People tab ─── */

const ROLE_TABS: {
  role: SpacePersonRole;
  label: string;
  singularLabel: string;
  icon: typeof UsersThree;
  description: string;
  color: string;
}[] = [
  { role: "member", label: "Members", singularLabel: "member", icon: UsersThree, description: "Members can be Super Admin, Admin, or Member — each with different permissions", color: "oklch(0.65 0.16 250)" },
  { role: "client", label: "Clients", singularLabel: "client", icon: Briefcase, description: "Can view deliverables and leave comments", color: "oklch(0.7 0.15 155)" },
  { role: "viewer", label: "Viewers", singularLabel: "viewer", icon: Eye, description: "View-only access to space content", color: "oklch(0.65 0.12 290)" },
];

/* ═══════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════ */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: typeof SquareHalf;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-[12px] border transition-shadow hover:shadow-sm"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
    >
      <div
        className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in oklch, ${color} 10%, transparent)` }}
      >
        <Icon size={20} weight="duotone" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[20px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
          {label}
          {subtitle && <span className="ml-1">· {subtitle}</span>}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROGRESS RING (small SVG)
   ═══════════════════════════════════════════════════════════ */

function ProgressRing({ percent, color, size = 40 }: { percent: number; color: string; size?: number }) {
  const strokeWidth = 4;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--neutral-100)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════════ */

function OverviewTab({
  spaceProjects,
  spaceDocs,
  spaceColor,
  totalPeople,
  onNavigateProject,
}: {
  spaceProjects: [string, ProjectData][];
  spaceDocs: WorkspaceDoc[];
  spaceColor: string;
  totalPeople: number;
  onNavigateProject: (name: string) => void;
}) {
  const totalTasks = spaceProjects.reduce((sum, [, p]) => sum + p.tasks.length, 0);
  const completedTasks = spaceProjects.reduce((sum, [, p]) => sum + p.tasks.filter((t) => t.completed).length, 0);
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueTasks = spaceProjects.reduce(
    (sum, [, p]) => sum + p.tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length,
    0
  );

  // Recent projects by update time
  const recentProjects = [...spaceProjects]
    .sort(([, a], [, b]) => {
      const aTime = a.updates?.[0]?.date || "";
      const bTime = b.updates?.[0]?.date || "";
      return bTime.localeCompare(aTime);
    })
    .slice(0, 5);

  // Status distribution
  const statusCounts: Record<string, number> = {};
  spaceProjects.forEach(([, p]) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={SquareHalf} label="Projects" value={spaceProjects.length} color={spaceColor} />
        <StatCard icon={Notebook} label="Docs" value={spaceDocs.length} color="oklch(0.65 0.16 250)" />
        <StatCard icon={Target} label="Tasks" value={totalTasks} color="oklch(0.7 0.15 155)" subtitle={`${completedTasks} done`} />
        <StatCard icon={UsersThree} label="People" value={totalPeople} color="oklch(0.65 0.12 290)" />
      </div>

      {/* Completion + status row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Completion card */}
        <div className="rounded-[12px] border p-5" style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}>
          <h4 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <TrendUp size={15} style={{ color: spaceColor }} />
            Task Progress
          </h4>
          <div className="flex items-center gap-5">
            <ProgressRing percent={pct} color={spaceColor} size={56} />
            <div>
              <p className="text-[28px] font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {pct}%
              </p>
              <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
                {completedTasks} of {totalTasks} tasks completed
              </p>
              {overdueTasks > 0 && (
                <p className="text-[12px] mt-0.5" style={{ color: "oklch(0.6 0.2 25)" }}>
                  {overdueTasks} overdue
                </p>
              )}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: spaceColor }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Status distribution */}
        <div className="rounded-[12px] border p-5" style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}>
          <h4 className="text-[13px] font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <ChartBar size={15} style={{ color: spaceColor }} />
            Project Status
          </h4>
          {spaceProjects.length === 0 ? (
            <p className="text-[13px] py-4 text-center" style={{ color: "var(--text-quaternary)" }}>No projects yet</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(statusCounts).map(([status, count]) => {
                const barPct = Math.round((count / spaceProjects.length) * 100);
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-[12px] font-medium w-24 truncate capitalize" style={{ color: "var(--text-secondary)" }}>
                      {status.replace(/-/g, " ")}
                    </span>
                    <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${barPct}%`, background: spaceColor, opacity: 0.7 + 0.3 * (barPct / 100) }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums w-6 text-right" style={{ color: "var(--text-quaternary)" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div className="rounded-[12px] border p-5" style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}>
          <h4 className="text-[13px] font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
            <Lightning size={15} style={{ color: spaceColor }} />
            Recent Projects
          </h4>
          <div className="space-y-1">
            {recentProjects.map(([name, proj]) => {
              const tasksDone = proj.tasks.filter((t) => t.completed).length;
              const taskPct = proj.tasks.length > 0 ? Math.round((tasksDone / proj.tasks.length) * 100) : 0;
              return (
                <button
                  key={name}
                  onClick={() => onNavigateProject(name)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[8px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] group/rp"
                >
                  <ProjectIcon phosphorIcon={proj.phosphorIcon} iconUrl={proj.iconUrl} color={proj.color} size="md" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                      {tasksDone}/{proj.tasks.length} tasks · {proj.status.replace(/-/g, " ")}
                    </p>
                  </div>
                  <div className="w-[50px]">
                    <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
                      <div className="h-full rounded-full" style={{ width: `${taskPct}%`, background: proj.color }} />
                    </div>
                  </div>
                  <ArrowRight size={13} className="opacity-0 group-hover/rp:opacity-100 transition-opacity" style={{ color: "var(--text-quaternary)" }} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ASSETS TAB
   ═══════════════════════════════════════════════════════════ */

function AssetsTab({ spaceProjects }: { spaceProjects: [string, ProjectData][] }) {
  const assets = useMemo(() => {
    const allAttachments: { projectName: string; projectColor: string; name: string; type: string; url?: string; description?: string }[] = [];
    spaceProjects.forEach(([name, proj]) => {
      (proj.projectAttachments || []).forEach((att) => {
        allAttachments.push({
          projectName: name,
          projectColor: proj.color,
          name: att.name,
          type: att.type || "file",
          url: att.url,
          description: att.description,
        });
      });
    });
    return allAttachments;
  }, [spaceProjects]);

  const [search, setSearch] = useState("");
  const filtered = search
    ? assets.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()) || a.projectName.toLowerCase().includes(search.toLowerCase()))
    : assets;

  const fileIcon = (type: string) => {
    if (type === "image" || type === "gallery") return ImageIcon;
    if (type === "video") return FilmStrip;
    if (type === "document") return FileText;
    return File;
  };

  if (assets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-[12px] flex items-center justify-center mx-auto mb-4" style={{ background: "var(--neutral-50)" }}>
          <Package size={28} weight="light" style={{ color: "var(--text-quaternary)", opacity: 0.5 }} />
        </div>
        <p className="text-[14px] font-medium" style={{ color: "var(--text-tertiary)" }}>No assets yet</p>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-quaternary)" }}>
          Attachments from projects in this space will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assets.length > 5 && (
        <div className="flex items-center gap-2 px-3 py-[6px] rounded-[8px] border" style={{ borderColor: "var(--border-default)" }}>
          <MagnifyingGlass size={14} style={{ color: "var(--text-quaternary)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((asset, i) => {
          const FIcon = fileIcon(asset.type);
          return (
            <div
              key={`${asset.name}-${i}`}
              className="flex items-center gap-3 px-3.5 py-3 rounded-[10px] border transition-colors hover:shadow-sm"
              style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
            >
              <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: `color-mix(in oklch, ${asset.projectColor} 10%, transparent)` }}>
                <FIcon size={18} weight="duotone" style={{ color: asset.projectColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{asset.name}</p>
                <p className="text-[11px] truncate" style={{ color: "var(--text-quaternary)" }}>
                  {asset.projectName}
                  {asset.description ? ` · ${asset.description}` : ""}
                </p>
              </div>
              {asset.url && (
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 flex items-center justify-center rounded-[5px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                  style={{ color: "var(--text-quaternary)" }}
                  title="Download"
                >
                  <DownloadSimple size={14} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROJECTS TAB
   ═══════════════════════════════════════════════════════════ */

function ProjectsTab({
  spaceProjects,
  spaceColor,
  onNavigateProject,
}: {
  spaceProjects: [string, ProjectData][];
  spaceColor: string;
  onNavigateProject: (name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? spaceProjects.filter(([name]) => name.toLowerCase().includes(search.toLowerCase()))
    : spaceProjects;

  if (spaceProjects.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-[12px] flex items-center justify-center mx-auto mb-4" style={{ background: "var(--neutral-50)" }}>
          <SquareHalf size={28} weight="light" style={{ color: "var(--text-quaternary)", opacity: 0.5 }} />
        </div>
        <p className="text-[14px] font-medium" style={{ color: "var(--text-tertiary)" }}>No projects in this space</p>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-quaternary)" }}>
          Assign projects to this space from the Projects page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {spaceProjects.length > 4 && (
        <div className="flex items-center gap-2 px-3 py-[6px] rounded-[8px] border" style={{ borderColor: "var(--border-default)" }}>
          <MagnifyingGlass size={14} style={{ color: "var(--text-quaternary)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: "var(--text-primary)" }} />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(([name, proj]) => {
          const tasksDone = proj.tasks.filter((t) => t.completed).length;
          const taskPct = proj.tasks.length > 0 ? Math.round((tasksDone / proj.tasks.length) * 100) : 0;
          return (
            <button
              key={name}
              onClick={() => onNavigateProject(name)}
              className="text-left rounded-[12px] border p-4 transition-all hover:shadow-md hover:border-[color-mix(in_oklch,var(--accent-primary)_30%,var(--border-default))] group/pc"
              style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
            >
              <div className="flex items-start gap-3 mb-3">
                <ProjectIcon phosphorIcon={proj.phosphorIcon} iconUrl={proj.iconUrl} color={proj.color} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{name}</p>
                  <p className="text-[12px] capitalize" style={{ color: "var(--text-quaternary)" }}>
                    {proj.status.replace(/-/g, " ")}
                  </p>
                </div>
                <ArrowRight size={14} className="opacity-0 group-hover/pc:opacity-100 transition-opacity mt-1" style={{ color: "var(--text-quaternary)" }} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
                  <div className="h-full rounded-full" style={{ width: `${taskPct}%`, background: proj.color }} />
                </div>
                <span className="text-[11px] tabular-nums shrink-0" style={{ color: "var(--text-quaternary)" }}>
                  {tasksDone}/{proj.tasks.length}
                </span>
              </div>
              {proj.client && (
                <p className="text-[11px] mt-2 truncate" style={{ color: "var(--text-quaternary)" }}>
                  Client: {proj.client}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DOCS TAB
   ═══════════════════════════════════════════════════════════ */

function DocsTab({
  spaceDocs,
  spaceColor,
}: {
  spaceDocs: WorkspaceDoc[];
  spaceColor: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? spaceDocs.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    : spaceDocs;

  const grouped = useMemo(() => {
    const map = new Map<string, WorkspaceDoc[]>();
    filtered.forEach((d) => {
      const type = d.type || "other";
      if (!map.has(type)) map.set(type, []);
      map.get(type)!.push(d);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  if (spaceDocs.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-[12px] flex items-center justify-center mx-auto mb-4" style={{ background: "var(--neutral-50)" }}>
          <Notebook size={28} weight="light" style={{ color: "var(--text-quaternary)", opacity: 0.5 }} />
        </div>
        <p className="text-[14px] font-medium" style={{ color: "var(--text-tertiary)" }}>No docs in this space</p>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-quaternary)" }}>
          Create docs and assign them to this space
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {spaceDocs.length > 5 && (
        <div className="flex items-center gap-2 px-3 py-[6px] rounded-[8px] border" style={{ borderColor: "var(--border-default)" }}>
          <MagnifyingGlass size={14} style={{ color: "var(--text-quaternary)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search docs..." className="flex-1 bg-transparent outline-none text-[13px]" style={{ color: "var(--text-primary)" }} />
        </div>
      )}
      {grouped.map(([type, docs]) => (
        <div key={type}>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 capitalize flex items-center gap-1.5" style={{ color: "var(--text-quaternary)" }}>
            <FileText size={12} />
            {type} ({docs.length})
          </h4>
          <div className="space-y-1">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
              >
                <Notebook size={16} style={{ color: spaceColor }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{doc.title}</p>
                  {doc.updatedAt && (
                    <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                      Updated {formatRelativeDate(doc.updatedAt)}
                    </p>
                  )}
                </div>
                {doc.pinned && <PushPin size={12} weight="fill" style={{ color: spaceColor }} />}
                <span className="text-[11px] capitalize px-1.5 py-0.5 rounded-full" style={{ background: "var(--neutral-50)", color: "var(--text-quaternary)" }}>
                  {doc.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PINNED TAB — starred projects + pinned docs
   ═══════════════════════════════════════════════════════════ */

function PinnedTab({
  spaceProjects,
  spaceDocs,
  spaceColor,
  starredIds,
  onNavigateProject,
}: {
  spaceProjects: [string, ProjectData][];
  spaceDocs: WorkspaceDoc[];
  spaceColor: string;
  starredIds: Set<string>;
  onNavigateProject: (name: string) => void;
}) {
  const starredProjects = spaceProjects.filter(([name]) => starredIds.has(name));
  const pinnedDocs = spaceDocs.filter((d) => d.pinned);

  const hasItems = starredProjects.length > 0 || pinnedDocs.length > 0;

  if (!hasItems) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-[12px] flex items-center justify-center mx-auto mb-4" style={{ background: "var(--neutral-50)" }}>
          <PushPin size={28} weight="light" style={{ color: "var(--text-quaternary)", opacity: 0.5 }} />
        </div>
        <p className="text-[14px] font-medium" style={{ color: "var(--text-tertiary)" }}>No pinned items</p>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-quaternary)" }}>
          Star projects or pin docs to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {starredProjects.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5" style={{ color: "var(--text-quaternary)" }}>
            <Star size={12} weight="fill" style={{ color: "oklch(0.8 0.14 80)" }} />
            Starred Projects ({starredProjects.length})
          </h4>
          <div className="space-y-1">
            {starredProjects.map(([name, proj]) => (
              <button
                key={name}
                onClick={() => onNavigateProject(name)}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-[8px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] group/sp"
              >
                <ProjectIcon phosphorIcon={proj.phosphorIcon} iconUrl={proj.iconUrl} color={proj.color} size="md" />
                <span className="flex-1 truncate text-left text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{name}</span>
                <Star size={14} weight="fill" style={{ color: "oklch(0.8 0.14 80)" }} />
                <ArrowRight size={13} className="opacity-0 group-hover/sp:opacity-100 transition-opacity" style={{ color: "var(--text-quaternary)" }} />
              </button>
            ))}
          </div>
        </div>
      )}
      {pinnedDocs.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5" style={{ color: "var(--text-quaternary)" }}>
            <PushPin size={12} weight="fill" style={{ color: spaceColor }} />
            Pinned Docs ({pinnedDocs.length})
          </h4>
          <div className="space-y-1">
            {pinnedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]">
                <Notebook size={16} style={{ color: spaceColor }} />
                <span className="flex-1 truncate text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{doc.title}</span>
                <PushPin size={12} weight="fill" style={{ color: spaceColor }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PEOPLE TAB — inline management
   ═══════════════════════════════════════════════════════════ */

function PersonAvatar({ person, size = 32, fontSize = 11 }: { person: SpacePerson; size?: number; fontSize?: number }) {
  const initials = getInitials(person.name);
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 overflow-hidden" style={{ width: size, height: size, background: person.avatarColor || "var(--neutral-300)" }}>
      {person.avatarUrl ? (
        <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ color: "white", fontSize: `${fontSize}px`, fontWeight: 700, textShadow: "0 1px 1px oklch(0 0 0 / 0.1)" }}>
          {initials || "?"}
        </span>
      )}
    </div>
  );
}

function PeopleTab({ spaceId, spaceColor, myRole, currentUserId, inviterName, spaceName }: { spaceId: string; spaceColor: string; myRole: SpaceMemberRole | null; currentUserId?: string; inviterName?: string; spaceName?: string }) {
  const { spaces, updateSpace } = useData();
  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);
  const [activeRole, setActiveRole] = useState<SpacePersonRole>("member");
  const [addingFirstName, setAddingFirstName] = useState("");
  const [addingLastName, setAddingLastName] = useState("");
  const [addingEmail, setAddingEmail] = useState("");
  const [addExpanded, setAddExpanded] = useState(false);
  const [roleMenuPerson, setRoleMenuPerson] = useState<string | null>(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close role menu on outside click
  useEffect(() => {
    if (!roleMenuPerson) return;
    const handler = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuPerson(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [roleMenuPerson]);

  useEffect(() => {
    if (addExpanded) nameRef.current?.focus();
  }, [addExpanded]);

  if (!space) return null;

  const getPeople = (role: SpacePersonRole): SpacePerson[] => {
    switch (role) {
      case "member": return space.members || [];
      case "client": return space.clients || [];
      case "viewer": return space.viewers || [];
    }
  };

  const roleKey = (role: SpacePersonRole) => role === "member" ? "members" : role === "client" ? "clients" : "viewers";

  const handleAdd = async () => {
    const first = addingFirstName.trim();
    const last = addingLastName.trim();
    if (!first || !last) return;
    const fullName = `${first} ${last}`;
    const emailVal = addingEmail.trim();
    const person: SpacePerson = {
      id: generatePersonId(),
      name: fullName,
      email: emailVal || undefined,
      avatarColor: randomAvatarColor(),
      ...(emailVal ? { inviteStatus: "sent" as const, invitedAt: new Date().toISOString() } : {}),
    };
    const current = getPeople(activeRole);
    updateSpace(spaceId, { [roleKey(activeRole)]: [...current, person] });
    haptic("success");

    // Send invite email if email was provided
    if (emailVal) {
      setSendingInvite(true);
      try {
        const result = await api.post(`/spaces/${spaceId}/invite`, {
          personName: fullName,
          personEmail: emailVal,
          spaceName: spaceName || space?.name || "a space",
          spaceColor: spaceColor,
          inviterName: inviterName || "A teammate",
          role: activeRole,
        });
        if (result.error) {
          console.error("[SpaceDetailPage] Invite email error:", result.error);
          toast.success(`Added ${fullName} as ${activeRole}`, { description: "Invite email could not be sent" });
        } else if (result.warning) {
          toast.success(`Added ${fullName} as ${activeRole}`, { description: "Email skipped — verify a domain at resend.com/domains" });
        } else {
          toast.success(`Added ${fullName} as ${activeRole}`, { description: `Invitation sent to ${emailVal}` });
        }
      } catch (err) {
        console.error("[SpaceDetailPage] Invite email error:", err);
        toast.success(`Added ${fullName} as ${activeRole}`, { description: "Invite email could not be sent" });
      } finally {
        setSendingInvite(false);
      }
    } else {
      toast.success(`Added ${fullName} as ${activeRole}`);
    }

    setAddingFirstName("");
    setAddingLastName("");
    setAddingEmail("");
    nameRef.current?.focus();
  };

  const handleRemove = (role: SpacePersonRole, personId: string) => {
    const current = getPeople(role);
    const person = current.find((p) => p.id === personId);
    updateSpace(spaceId, { [roleKey(role)]: current.filter((p) => p.id !== personId) });
    haptic("light");
    if (person) toast.success(`Removed ${person.name}`);
  };

  const handleSwitchRole = (fromRole: SpacePersonRole, personId: string, toRole: SpacePersonRole) => {
    const fromList = getPeople(fromRole);
    const toList = getPeople(toRole);
    const person = fromList.find((p) => p.id === personId);
    if (!person) return;
    updateSpace(spaceId, {
      [roleKey(fromRole)]: fromList.filter((p) => p.id !== personId),
      [roleKey(toRole)]: [...toList, person],
    });
    haptic("medium");
    toast.success(`Moved ${person.name} to ${ROLE_TABS.find((t) => t.role === toRole)!.label.toLowerCase()}`);
    setActiveRole(toRole);
  };

  /** Change a member's internal role (super-admin / admin / member) — super-admin only */
  const handleChangeMemberRole = (personId: string, newRole: SpaceMemberRole) => {
    const members = space!.members || [];
    const person = members.find((p) => p.id === personId);
    if (!person) return;

    // Prevent demoting the last super-admin
    if (person.memberRole === "super-admin" && newRole !== "super-admin") {
      const superAdminCount = members.filter((m) => m.memberRole === "super-admin").length;
      if (superAdminCount <= 1) {
        toast.error("Cannot demote — at least one super admin is required");
        return;
      }
    }

    const updated = members.map((m) =>
      m.id === personId ? { ...m, memberRole: newRole } : m
    );
    updateSpace(spaceId, { members: updated });
    setRoleMenuPerson(null);
    haptic("medium");
    toast.success(`${person.name} is now ${MEMBER_ROLE_META[newRole].label}`);
  };

  const people = getPeople(activeRole);
  const activeConfig = ROLE_TABS.find((t) => t.role === activeRole)!;
  const totalPeople = (space.members?.length || 0) + (space.clients?.length || 0) + (space.viewers?.length || 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 mb-2">
        <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
          {totalPeople} {totalPeople === 1 ? "person" : "people"} in this space
        </p>
      </div>

      {/* Role tabs */}
      <div className="flex rounded-[10px] p-[3px] gap-[2px]" style={{ background: "var(--neutral-100)" }}>
        {ROLE_TABS.map((tab) => {
          const count = getPeople(tab.role).length;
          const isActive = activeRole === tab.role;
          return (
            <button
              key={tab.role}
              onClick={() => { setActiveRole(tab.role); haptic("selection"); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] transition-all text-[13px]"
              style={{
                background: isActive ? "var(--surface-bg)" : "transparent",
                boxShadow: isActive ? "0 1px 3px oklch(0 0 0 / 0.06)" : "none",
                color: isActive ? tab.color : "var(--text-quaternary)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <tab.icon size={14} weight={isActive ? "fill" : "regular"} />
              {tab.label}
              {count > 0 && (
                <span
                  className="text-[10px] font-bold tabular-nums px-1.5 rounded-full"
                  style={{
                    background: isActive ? `color-mix(in oklch, ${tab.color} 12%, transparent)` : "var(--neutral-200)",
                    color: isActive ? tab.color : "var(--text-quaternary)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-[8px]" style={{ background: `color-mix(in oklch, ${activeConfig.color} 4%, transparent)` }}>
        <Crown size={12} style={{ color: activeConfig.color, opacity: 0.6 }} />
        <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>{activeConfig.description}</p>
      </div>

      {/* People list */}
      <div className="space-y-0.5">
        <AnimatePresence mode="popLayout">
          {people.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `color-mix(in oklch, ${activeConfig.color} 8%, transparent)` }}>
                <activeConfig.icon size={22} weight="light" style={{ color: activeConfig.color, opacity: 0.5 }} />
              </div>
              <p className="text-[13px]" style={{ color: "var(--text-quaternary)" }}>No {activeConfig.label.toLowerCase()} yet</p>
            </motion.div>
          ) : (
            people.map((person) => (
              <motion.div
                key={person.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors"
              >
                <PersonAvatar person={person} size={34} fontSize={12} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{person.name}</p>
                    {/* Show creator crown for space creator */}
                    {space!.creatorId && person.userId === space!.creatorId && (
                      <Crown size={12} weight="fill" style={{ color: "oklch(0.7 0.18 25)" }} title="Space creator" />
                    )}
                  </div>
                  {person.email && (
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] truncate" style={{ color: "var(--text-quaternary)" }}>{person.email}</p>
                      {person.inviteStatus === "sent" && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-[1px] rounded-full" style={{ background: "oklch(0.85 0.12 55 / 0.15)", color: "oklch(0.6 0.12 55)" }}>
                          <EnvelopeSimple size={9} weight="bold" />
                          Invited
                        </span>
                      )}
                      {person.inviteStatus === "accepted" && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-[1px] rounded-full" style={{ background: "oklch(0.73 0.15 155 / 0.12)", color: "oklch(0.5 0.12 155)" }}>
                          <CheckCircle size={9} weight="bold" />
                          Joined
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {/* Resend invite button — show for people with pending/sent invites */}
                {person.email && person.inviteStatus === "sent" && isAdminOrAbove(myRole) && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const result = await api.post(`/spaces/${spaceId}/resend-invite`, {
                          personEmail: person.email,
                          personName: person.name,
                          spaceName: spaceName || space?.name || "a space",
                          spaceColor,
                          inviterName: inviterName || "A teammate",
                          role: activeRole,
                        });
                        if (result.error) {
                          toast.error("Could not resend invite");
                        } else {
                          toast.success(`Invite re-sent to ${person.email}`);
                        }
                      } catch {
                        toast.error("Could not resend invite");
                      }
                    }}
                    className="shrink-0 text-[11px] font-medium px-2 py-1 rounded-[5px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ color: "var(--accent-primary)" }}
                    title="Resend invitation email"
                  >
                    Resend
                  </button>
                )}
                {/* Member role badge — for the Members tab, show memberRole */}
                {activeRole === "member" && person.memberRole ? (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSuperAdmin(myRole)) {
                          setRoleMenuPerson(roleMenuPerson === person.id ? null : person.id);
                        }
                      }}
                      className="text-[11px] font-medium px-1.5 py-0.5 rounded-[4px] transition-colors"
                      style={{
                        color: MEMBER_ROLE_META[person.memberRole].color,
                        background: `color-mix(in oklch, ${MEMBER_ROLE_META[person.memberRole].color} 8%, transparent)`,
                        cursor: isSuperAdmin(myRole) ? "pointer" : "default",
                      }}
                      title={isSuperAdmin(myRole) ? "Click to change role" : MEMBER_ROLE_META[person.memberRole].description}
                    >
                      {MEMBER_ROLE_META[person.memberRole].shortLabel}
                    </button>
                    {/* Role change dropdown */}
                    {roleMenuPerson === person.id && isSuperAdmin(myRole) && (
                      <div
                        ref={roleMenuRef}
                        className="absolute right-0 top-full mt-1 z-50 w-[200px] py-1 rounded-[10px] border shadow-lg"
                        style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
                      >
                        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>
                          Change role
                        </p>
                        {(["super-admin", "admin", "member"] as SpaceMemberRole[]).map((role) => {
                          const meta = MEMBER_ROLE_META[role];
                          const isCurrentRole = person.memberRole === role;
                          return (
                            <button
                              key={role}
                              onClick={(e) => { e.stopPropagation(); handleChangeMemberRole(person.id, role); }}
                              className="flex items-center gap-2 w-full px-3 py-[6px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                              style={{ fontSize: "13px", color: isCurrentRole ? meta.color : "var(--text-secondary)" }}
                            >
                              <span className="w-4 text-center">{isCurrentRole ? "✓" : ""}</span>
                              <span className="flex-1">{meta.label}</span>
                              {role === "super-admin" && <Crown size={12} weight="fill" style={{ color: meta.color, opacity: 0.6 }} />}
                            </button>
                          );
                        })}
                        <div className="mt-1 mx-2 px-1 py-1.5 rounded-[6px]" style={{ background: "var(--neutral-50)" }}>
                          <p className="text-[10px] leading-tight" style={{ color: "var(--text-quaternary)" }}>
                            {MEMBER_ROLE_META[person.memberRole || "member"].description}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] font-medium capitalize px-1.5 py-0.5 rounded-[4px]" style={{ color: activeConfig.color, background: `color-mix(in oklch, ${activeConfig.color} 8%, transparent)` }}>
                    {activeConfig.singularLabel}
                  </span>
                )}
                {/* Move to another role / remove — only if admin or above */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAdminOrAbove(myRole) && ROLE_TABS.filter((t) => t.role !== activeRole).map((tab) => (
                    <button
                      key={tab.role}
                      onClick={() => handleSwitchRole(activeRole, person.id, tab.role)}
                      className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
                      style={{ color: "var(--text-quaternary)" }}
                      title={`Move to ${tab.label}`}
                    >
                      <tab.icon size={12} />
                    </button>
                  ))}
                  {/* Can't remove super-admins unless you are a super-admin */}
                  {isAdminOrAbove(myRole) && !(activeRole === "member" && person.memberRole === "super-admin" && !isSuperAdmin(myRole)) && (
                    <button
                      onClick={() => handleRemove(activeRole, person.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
                      style={{ color: "var(--text-quaternary)" }}
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add person form */}
      {!addExpanded ? (
        <button
          onClick={() => { setAddExpanded(true); haptic("light"); }}
          className="flex items-center gap-2 w-full px-3.5 py-3 rounded-[10px] border border-dashed transition-all hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `color-mix(in oklch, ${activeConfig.color} 10%, transparent)` }}>
            <UserPlus size={15} style={{ color: activeConfig.color }} />
          </div>
          <span className="text-[13px] font-medium">Add {activeConfig.singularLabel}</span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[10px] border p-3.5 space-y-2.5"
          style={{ background: `color-mix(in oklch, ${activeConfig.color} 3%, var(--surface-bg))`, borderColor: `color-mix(in oklch, ${activeConfig.color} 20%, var(--border-default))` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={14} style={{ color: activeConfig.color }} />
            <span className="text-[12px] font-semibold" style={{ color: activeConfig.color }}>Add {activeConfig.singularLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              ref={nameRef}
              value={addingFirstName}
              onChange={(e) => setAddingFirstName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAddingFirstName(""); setAddingLastName(""); setAddingEmail(""); setAddExpanded(false); } }}
              placeholder="First name"
              className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border"
              style={{ fontSize: "13px", color: "var(--text-primary)", borderColor: "var(--border-default)" }}
            />
            <input
              value={addingLastName}
              onChange={(e) => setAddingLastName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAddingFirstName(""); setAddingLastName(""); setAddingEmail(""); setAddExpanded(false); } }}
              placeholder="Last name"
              className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border"
              style={{ fontSize: "13px", color: "var(--text-primary)", borderColor: "var(--border-default)" }}
            />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border bg-white/60 dark:bg-white/[0.04]" style={{ borderColor: "var(--border-default)" }}>
            <EnvelopeSimple size={13} style={{ color: "var(--text-quaternary)" }} />
            <input
              value={addingEmail}
              onChange={(e) => setAddingEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAddingFirstName(""); setAddingLastName(""); setAddingEmail(""); setAddExpanded(false); } }}
              placeholder="Email (optional — sends invite)"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: "12px", color: "var(--text-primary)" }}
            />
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={handleAdd}
              disabled={!addingFirstName.trim() || !addingLastName.trim() || sendingInvite}
              className="px-3.5 py-1.5 rounded-[6px] text-white text-[12px] font-semibold disabled:opacity-40 hover:brightness-110 active:scale-[0.97] transition-all inline-flex items-center gap-1"
              style={{ background: activeConfig.color }}
            >
              {sendingInvite ? (
                <><CircleNotch size={11} weight="bold" className="animate-spin" /> Sending...</>
              ) : (
                <><Plus size={11} weight="bold" /> Add{addingEmail.trim() ? " & Invite" : ""}</>
              )}
            </button>
            <button
              onClick={() => { setAddingFirstName(""); setAddingLastName(""); setAddingEmail(""); setAddExpanded(false); }}
              className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Done
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   INTEGRATIONS TAB — Asana, Frame.io, Craft at space level
   ═══════════════════════════════════════════════════════════ */

const SPACE_INTEGRATIONS = [
  {
    name: "Frame.io",
    icon: FilmStrip,
    desc: "Review and approval workflows for video and creative assets",
    color: "oklch(0.65 0.15 180)",
    dialogId: "frameio" as const,
    statusKey: "frameio" as const,
  },
  {
    name: "Asana",
    icon: Cube,
    desc: "Import projects and tasks from Asana into this space",
    color: "oklch(0.7 0.18 25)",
    dialogId: "asana" as const,
    statusKey: "asana" as const,
  },
  {
    name: "Craft",
    icon: PencilSimple,
    desc: "Import documents and notes from Craft into this space",
    color: "oklch(0.55 0.15 280)",
    dialogId: "craft" as const,
    statusKey: null as null,
  },
];

function IntegrationsTab({
  spaceId,
  spaceName,
  spaceColor,
}: {
  spaceId: string;
  spaceName: string;
  spaceColor: string;
}) {
  const { setProject, addDoc } = useData();
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [activeDialog, setActiveDialog] = useState<"frameio" | "asana" | "craft" | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshIntegrationStatus = useCallback(() => {
    getIntegrationStatus()
      .then((s) => setIntegrationStatus(s))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refreshIntegrationStatus();
  }, [refreshIntegrationStatus]);

  const getConnected = (statusKey: string | null): boolean => {
    if (!statusKey || !integrationStatus) return false;
    const entry = (integrationStatus as any)[statusKey];
    return entry?.connected || false;
  };

  const getConnectedLabel = (statusKey: string | null): string | undefined => {
    if (!statusKey || !integrationStatus) return undefined;
    const entry = (integrationStatus as any)[statusKey];
    return entry?.accountName || entry?.userName || entry?.email || undefined;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Plugs size={16} style={{ color: spaceColor }} />
        <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
          Connect external services to <span className="font-semibold">{spaceName}</span>
        </p>
      </div>

      <div
        className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
        style={{ background: `color-mix(in oklch, ${spaceColor} 4%, transparent)` }}
      >
        <Plugs size={12} style={{ color: spaceColor, opacity: 0.6 }} />
        <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
          Integrations are scoped to this space — imported projects and docs will be added here.
        </p>
      </div>

      {/* Integration cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <CircleNotch size={20} className="animate-spin" style={{ color: "var(--text-quaternary)" }} />
          </div>
        ) : (
          SPACE_INTEGRATIONS.map((integ) => {
            const connected = getConnected(integ.statusKey);
            const connectedLabel = getConnectedLabel(integ.statusKey);
            return (
              <div
                key={integ.name}
                className="flex items-center gap-3 p-4 rounded-[12px] transition-all hover:shadow-sm"
                style={{
                  background: connected ? `color-mix(in oklch, ${integ.color} 4%, var(--surface-bg))` : "var(--surface-bg)",
                  border: `1px solid ${connected ? `color-mix(in oklch, ${integ.color} 20%, var(--border-default))` : "var(--border-default)"}`,
                }}
              >
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklch, ${integ.color} 12%, transparent)` }}
                >
                  <integ.icon size={22} weight="duotone" style={{ color: integ.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      {integ.name}
                    </span>
                    {connected && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ background: "oklch(0.73 0.15 155 / 0.15)", color: "oklch(0.45 0.12 155)" }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.6 0.15 155)" }} />
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                    {connected && connectedLabel ? connectedLabel : integ.desc}
                  </p>
                </div>
                <button
                  onClick={() => { setActiveDialog(integ.dialogId); haptic("light"); }}
                  className="px-4 py-2 rounded-[8px] text-[12px] font-semibold transition-all hover:brightness-110 active:scale-[0.97] shrink-0"
                  style={{
                    background: connected ? `color-mix(in oklch, ${integ.color} 12%, transparent)` : integ.color,
                    color: connected ? integ.color : "white",
                  }}
                >
                  {connected
                    ? integ.dialogId === "asana" || integ.dialogId === "craft"
                      ? "Import"
                      : "Manage"
                    : "Connect"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog modals */}
      <FrameIoDialog
        open={activeDialog === "frameio"}
        onClose={() => setActiveDialog(null)}
        status={integrationStatus}
        onRefreshStatus={refreshIntegrationStatus}
      />
      <AsanaImportDialog
        open={activeDialog === "asana"}
        onClose={() => setActiveDialog(null)}
        status={integrationStatus}
        onRefreshStatus={refreshIntegrationStatus}
        onImportProject={(importedProject) => {
          if (!importedProject?.name) return;
          const projectData = {
            name: importedProject.name,
            shortName: "",
            description: importedProject.description || "",
            tasks: importedProject.tasks || [],
            notes: [],
            updates: [],
            timelineDates: [],
            status: (importedProject.status || "on-track") as any,
            bannerImage: "",
            client: "",
            color: "oklch(0.7 0.18 25)",
            icon: "",
            projectAttachments: [],
            productionPhase: "incoming" as const,
            projectType: "consulting" as const,
            members: importedProject.members || [],
            spaceId,
          };
          setProject(importedProject.name, projectData);
          toast.success(`Project "${importedProject.name}" imported from Asana into ${spaceName}`);
        }}
      />
      <CraftImportDialog
        open={activeDialog === "craft"}
        onClose={() => setActiveDialog(null)}
        onImportDocs={(importedDocs) => {
          for (const doc of importedDocs) {
            addDoc({
              id: doc.id,
              title: doc.title,
              type: doc.type || "doc",
              blocks: doc.blocks || [],
              createdAt: doc.createdAt || new Date().toISOString(),
              updatedAt: doc.updatedAt || new Date().toISOString(),
              createdBy: doc.createdBy,
              importSource: "craft",
              importSourceId: doc.importSourceId,
              spaceId,
            });
          }
          toast.success(
            `${importedDocs.length} document${importedDocs.length !== 1 ? "s" : ""} imported from Craft into ${spaceName}`
          );
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT — SpaceDetailPage
   ═══════════════════════════════════════════════════════════ */

export function SpaceDetailPage() {
  const { params, goBack, navigate } = useNavigation();
  const { spaces, projects, docs, starred } = useData();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const space = useMemo(() => spaces.find((s) => s.id === params.spaceId), [spaces, params.spaceId]);
  const myRole = useMemo(() => space ? getUserSpaceRole(space, user?.id) : null, [space, user?.id]);

  const spaceProjects = useMemo(() => {
    if (!space) return [];
    return Object.entries(projects).filter(([, p]) => p.spaceId === space.id && !p.archived);
  }, [projects, space]);

  const spaceDocs = useMemo(() => {
    if (!space) return [];
    return docs.filter((d) => d.spaceId === space.id);
  }, [docs, space]);

  const totalPeople = space
    ? (space.members?.length || 0) + (space.clients?.length || 0) + (space.viewers?.length || 0)
    : 0;

  const handleNavigateProject = useCallback(
    (name: string) => {
      navigate("project", { projectId: name });
    },
    [navigate]
  );

  if (!space) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <CirclesFour size={40} weight="light" style={{ color: "var(--text-quaternary)", opacity: 0.3 }} className="mx-auto" />
          <p className="text-[14px]" style={{ color: "var(--text-quaternary)" }}>Space not found</p>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-[13px] font-medium"
            style={{ color: "var(--accent-primary)", background: "var(--accent-primary-subtle)" }}
          >
            <ArrowLeft size={14} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const SpaceIcon = space.phosphorIcon ? getPhosphorIcon(space.phosphorIcon) || CirclesFour : CirclesFour;

  // Tab badge counts
  const tabBadges: Partial<Record<TabId, number>> = {
    projects: spaceProjects.length,
    docs: spaceDocs.length,
    teams: space.teams?.length || 0,
    people: totalPeople,
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* ── Header ── */}
      <div className="mb-6">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 mb-4 px-2 py-1 rounded-[6px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{ color: "var(--text-tertiary)", fontSize: "13px" }}
        >
          <ArrowLeft size={14} />
          Spaces
        </button>

        {/* Color banner */}
        <div
          className="h-[6px] rounded-t-[14px] w-full mb-[-3px]"
          style={{
            background: `linear-gradient(90deg, ${space.color}, color-mix(in oklch, ${space.color} 40%, transparent))`,
          }}
        />

        {/* Space info */}
        <div
          className="rounded-[14px] rounded-t-none border border-t-0 px-6 py-5"
          style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: `color-mix(in oklch, ${space.color} 14%, transparent)`,
                border: `1.5px solid color-mix(in oklch, ${space.color} 22%, transparent)`,
              }}
            >
              {space.iconUrl ? (
                <img src={space.iconUrl} alt="" className="w-full h-full object-cover rounded-full" />
              ) : (
                <SpaceIcon size={28} weight="fill" style={{ color: space.color }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[22px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {space.name}
              </h1>
              {space.description && (
                <p className="text-[13px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  {space.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[12px] flex items-center gap-1" style={{ color: "var(--text-quaternary)" }}>
                  <SquareHalf size={12} /> {spaceProjects.length} project{spaceProjects.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[12px] flex items-center gap-1" style={{ color: "var(--text-quaternary)" }}>
                  <Notebook size={12} /> {spaceDocs.length} doc{spaceDocs.length !== 1 ? "s" : ""}
                </span>
                <span className="text-[12px] flex items-center gap-1" style={{ color: "var(--text-quaternary)" }}>
                  <UsersThree size={12} /> {totalPeople} {totalPeople === 1 ? "person" : "people"}
                </span>
              </div>
            </div>

            {/* Space visibility indicator */}
            {!space.visible && (
              <span
                className="text-[11px] font-medium px-2 py-1 rounded-[5px]"
                style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}
              >
                Hidden
              </span>
            )}

            {/* Current user's role badge */}
            {myRole && (
              <span
                className="text-[11px] font-semibold px-2 py-1 rounded-[5px] flex items-center gap-1"
                style={{
                  background: `color-mix(in oklch, ${MEMBER_ROLE_META[myRole].color} 10%, transparent)`,
                  color: MEMBER_ROLE_META[myRole].color,
                }}
                title={MEMBER_ROLE_META[myRole].description}
              >
                {myRole === "super-admin" && <Crown size={11} weight="fill" />}
                {MEMBER_ROLE_META[myRole].shortLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div
        className="flex gap-0.5 mb-6 border-b overflow-x-auto"
        style={{ borderColor: "var(--border-default)" }}
      >
        {TABS.filter((tab) => {
          // Only super-admins can see Integrations tab
          if (tab.id === "integrations" && !isSuperAdmin(myRole)) return false;
          return true;
        }).map((tab) => {
          const isActive = activeTab === tab.id;
          const badge = tabBadges[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); haptic("selection"); }}
              className="relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap"
              style={{
                color: isActive ? space.color : "var(--text-tertiary)",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <tab.icon size={15} weight={isActive ? "fill" : "regular"} />
              {tab.label}
              {badge != null && badge > 0 && (
                <span
                  className="text-[10px] font-bold tabular-nums px-1.5 rounded-full"
                  style={{
                    background: isActive ? `color-mix(in oklch, ${space.color} 12%, transparent)` : "var(--neutral-100)",
                    color: isActive ? space.color : "var(--text-quaternary)",
                  }}
                >
                  {badge}
                </span>
              )}
              {isActive && (
                <motion.div
                  layoutId="space-detail-tab"
                  className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full"
                  style={{ background: space.color }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              spaceProjects={spaceProjects}
              spaceDocs={spaceDocs}
              spaceColor={space.color}
              totalPeople={totalPeople}
              onNavigateProject={handleNavigateProject}
            />
          )}
          {activeTab === "assets" && <AssetsTab spaceProjects={spaceProjects} />}
          {activeTab === "projects" && (
            <ProjectsTab spaceProjects={spaceProjects} spaceColor={space.color} onNavigateProject={handleNavigateProject} />
          )}
          {activeTab === "docs" && <DocsTab spaceDocs={spaceDocs} spaceColor={space.color} />}
          {activeTab === "pinned" && (
            <PinnedTab
              spaceProjects={spaceProjects}
              spaceDocs={spaceDocs}
              spaceColor={space.color}
              starredIds={starred}
              onNavigateProject={handleNavigateProject}
            />
          )}
          {activeTab === "teams" && <TeamsTab spaceId={space.id} spaceColor={space.color} />}
          {activeTab === "people" && <PeopleTab spaceId={space.id} spaceColor={space.color} myRole={myRole} currentUserId={user?.id} inviterName={profile?.displayName || user?.user_metadata?.name || "A teammate"} spaceName={space.name} />}
          {activeTab === "integrations" && (
            <IntegrationsTab spaceId={space.id} spaceName={space.name} spaceColor={space.color} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}