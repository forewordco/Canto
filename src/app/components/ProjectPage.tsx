/* ===================================================================
   PROJECT PAGE — Pixel-perfect match to brand-guide sample project.

   Full-width layout with optional cover image banner at top.
   OKLCH palette · Clean inline task list · Tags row · Resources row.
   =================================================================== */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Star,
  DotsThreeVertical,
  ListBullets,
  SquaresFour,
  ChartBar,
  Folder,
  CaretDown,
  Plus,
  Check,
  CheckCircle,
  UserCircle,
  ArrowLeft,
  Funnel,
  LinkSimple,
  VideoCamera,
  Image as ImageIcon,
  MapPin,
  Circle,
  Diamond,
  Flag,
  Eye,
  Sun,
  SkipForward,
  FilmSlate,
  YoutubeLogo,
  Suitcase,
  Tag,
  MagnifyingGlass,
  Question,
  CalendarBlank,
  ChatCircle,
  CircleNotch,
  Warning,
  ArrowClockwise,
  GearSix,
  Trash,
  Copy,
  Archive,
  Export,
  Users,
  Palette,
  NotePencil,
  X,
  CheckSquare,
  Square as SquareIcon,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useData } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { useAuth } from "../lib/auth";
import { TaskDetailPane } from "./TaskDetailPane";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { KanbanBoard } from "./KanbanBoard";
import { ProjectTimeline } from "./ProjectTimeline";
import { ProjectMessages } from "./ProjectMessages";
import { ProjectFiles } from "./ProjectFiles";
import {
  PHASE_META,
  PROJECT_STATUS_OPTIONS,
  type TaskItem,
  type ProjectData,
  type ProjectStatus,
  type TeamMemberInfo,
  type TimelineDate,
  type SubTask,
} from "../lib/types";
import { toast } from "sonner";
import { PhosphorIconPicker, getPhosphorIcon } from "./PhosphorIconPicker";
import { SpacePicker } from "./SpacePicker";
import { StatusUpdateEditor } from "./StatusUpdateEditor";
import { useDrag, useDrop } from "react-dnd";
import { TouchDndProvider } from "./TouchDndProvider";
import { ListToolbar } from "./ListToolbar";
import { ProjectResources } from "./ProjectResources";
import { setDragData, useDrag as useDragContext, type DragPayload } from "../lib/drag-context";

const TASK_DND_TYPE = "INLINE_TASK";

/* ── Short date formatter: "2026-03-10T17:00:00.000Z" or "Feb. 23, 2026" → "Mar 10" ── */
function formatShortDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/* ── OKLCH brand palette ── */

const c = {
  bg: "oklch(0.99 0.002 260)",
  card: "oklch(1 0 0)",
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.6 0.02 260)",
  border: "oklch(0.92 0.01 260)",
  borderLight: "oklch(0.95 0.005 260)",
  checkHover: "oklch(0.85 0.01 260)",
  coral: "oklch(0.7 0.18 25)",
  coralBg: "oklch(0.7 0.18 25 / 0.08)",
  indigo: "oklch(0.55 0.2 280)",
  teal: "oklch(0.65 0.15 180)",
  gold: "oklch(0.78 0.15 85)",
  green: "oklch(0.7 0.17 150)",
  greenBg: "oklch(0.7 0.17 150 / 0.08)",
  orange: "oklch(0.75 0.15 55)",
  purple: "oklch(0.6 0.2 300)",
};

/* ── Section color map ── */

const SECTION_COLORS: Record<string, string> = {
  "pre-production": c.coral,
  "preproduction": c.coral,
  "production": c.gold,
  "post-production": c.indigo,
  "postproduction": c.indigo,
  "post production": c.indigo,
  "delivery": c.indigo,
  "planning": c.coral,
  "execution": c.gold,
};

function getSectionColor(section: string): string {
  const key = section.toLowerCase().replace(/[^a-z ]/g, "").trim();
  return SECTION_COLORS[key] || c.coral;
}

/* ── Milestone color map ── */

const MILESTONE_COLORS: Record<string, string> = {
  travel: c.orange,
  shoot: c.coral,
  round1: c.indigo,
  final: c.green,
};

const MILESTONE_NAMES: Record<string, string> = {
  travel: "Travel",
  shoot: "Shoot",
  round1: "Round 1",
  final: "Final",
};

/* ── Resource styling ── */

const RESOURCE_ICON_MAP: Record<string, React.ElementType> = {
  video: FilmSlate,
  link: YoutubeLogo,
  gallery: ImageIcon,
  image: ImageIcon,
  document: Folder,
  travel: Suitcase,
};

const RESOURCE_COLOR_MAP: Record<string, string> = {
  video: c.indigo,
  link: c.coral,
  gallery: c.teal,
  image: c.teal,
  document: c.orange,
  travel: c.purple,
};

/* ── Project type icon map ── */

const PROJECT_TYPE_ICONS: Record<string, React.ElementType> = {
  "video-production": VideoCamera,
  "photo-shoot": ImageIcon,
  "social-media": Tag,
  branding: Tag,
  documentary: FilmSlate,
  commercial: VideoCamera,
  "music-video": VideoCamera,
};

/* ── Status Badge ── */

function StatusBadge({
  status,
  onChange,
  onOpenStatusEditor,
}: {
  status: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  onOpenStatusEditor?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const opt = PROJECT_STATUS_OPTIONS.find((o) => o.value === status);
  const badgeColor = status === "on-track" ? c.green : opt?.color || c.text4;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (onOpenStatusEditor) {
            onOpenStatusEditor();
          } else {
            setOpen(!open);
          }
        }}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-colors hover:brightness-95"
        style={{
          background: `color-mix(in oklch, ${badgeColor} 8%, transparent)`,
          color: badgeColor,
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        <span
          className="w-[7px] h-[7px] rounded-full"
          style={{ background: badgeColor }}
        />
        {opt?.label || "Unknown"}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full right-0 mt-1 py-1 rounded-[8px] z-50 min-w-[160px]"
              style={{
                background: c.card,
                border: `1px solid ${c.border}`,
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              }}
            >
              {PROJECT_STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                  style={{
                    fontSize: "13px",
                    fontWeight: status === o.value ? 500 : 400,
                    color: status === o.value ? o.color : c.text3,
                  }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: o.color }}
                  />
                  {o.label}
                  {status === o.value && (
                    <Check className="w-3 h-3 ml-auto" style={{ color: o.color }} />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Subtask Row — full-featured like a task, square checkbox ── */

function SubtaskRow({
  sub,
  taskId,
  teamMembers,
  onUpdate,
  onClick,
  onToggleToday,
  onToggleLineup,
}: {
  sub: SubTask;
  taskId: string;
  teamMembers: TeamMemberInfo[];
  onUpdate: (updates: Partial<SubTask>) => void;
  onClick: () => void;
  onToggleToday?: () => void;
  onToggleLineup?: () => void;
}) {
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateInputValue, setDateInputValue] = useState("");
  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateBtnRef = useRef<HTMLButtonElement>(null);
  const assigneeBtnRef = useRef<HTMLButtonElement>(null);
  const datePortalRef = useRef<HTMLDivElement>(null);
  const assigneePortalRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [assigneePos, setAssigneePos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!assigneeOpen && !datePickerOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (assigneeOpen && assigneeRef.current && !assigneeRef.current.contains(t) && (!assigneePortalRef.current || !assigneePortalRef.current.contains(t))) setAssigneeOpen(false);
      if (datePickerOpen && datePickerRef.current && !datePickerRef.current.contains(t) && (!datePortalRef.current || !datePortalRef.current.contains(t))) setDatePickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [assigneeOpen, datePickerOpen]);

  const assigneeMember = sub.assignee ? teamMembers.find((m) => m.userId === sub.assignee) : null;
  const assigneeInitial = assigneeMember ? assigneeMember.displayName.charAt(0).toUpperCase() : null;
  const assigneeColor = assigneeMember?.avatarColor || c.coral;
  const assigneePhoto = assigneeMember?.avatarUrl || null;

  return (
    <div
      className="group/sub flex items-center gap-2 pl-8 pr-1 py-[5px] transition-colors hover:bg-black/[0.02] cursor-pointer"
      style={{ borderBottom: `1px solid ${c.borderLight}` }}
      onClick={onClick}
    >
      {/* Square checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onUpdate({ completed: !sub.completed });
        }}
        className="shrink-0 w-[18px] h-[18px] flex items-center justify-center"
      >
        {sub.completed ? (
          <CheckSquare weight="fill" size={18} style={{ color: c.green, opacity: 0.55 }} />
        ) : (
          <SquareIcon
            size={18}
            weight="regular"
            style={{ color: c.checkHover }}
            className="group-hover/sub:!text-[oklch(0.7_0.18_25)]"
          />
        )}
      </button>

      {/* Title */}
      <span
        className="truncate flex-1"
        style={{
          color: sub.completed ? c.text4 : c.text2,
          fontSize: "12.5px",
          fontWeight: sub.completed ? 400 : 450,
          textDecoration: sub.completed ? "line-through" : "none",
        }}
      >
        {sub.title}
      </span>

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Date picker */}
      <div className="shrink-0" ref={datePickerRef} onClick={(e) => e.stopPropagation()}>
        <button
          ref={dateBtnRef}
          onClick={() => {
            if (!datePickerOpen && dateBtnRef.current) {
              const r = dateBtnRef.current.getBoundingClientRect();
              setDropdownPos({ top: r.bottom + 4, left: r.right });
            }
            setDatePickerOpen(!datePickerOpen);
            if (sub.date) {
              try { setDateInputValue(new Date(sub.date).toISOString().split("T")[0]); } catch { setDateInputValue(""); }
            } else {
              setDateInputValue(new Date().toISOString().split("T")[0]);
            }
          }}
          className="inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-black/[0.05] transition-colors"
          title={sub.date ? "Change due date" : "Set due date"}
        >
          {sub.date ? (
            <span style={{ color: c.text4, fontSize: "11px" }}>{formatShortDate(sub.date)}</span>
          ) : (
            <CalendarBlank size={12} style={{ color: "oklch(0.82 0.01 260)", opacity: 0.5 }} className="opacity-0 group-hover/sub:opacity-100 transition-opacity" />
          )}
        </button>
        {datePickerOpen && createPortal(
          <div
            className="fixed z-[9999] p-2 rounded-[8px] min-w-[180px]"
            style={{ top: dropdownPos.top, left: dropdownPos.left, transform: "translateX(-100%)", background: "#fff", border: "1px solid #e1e5eb", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
            ref={datePortalRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {[{ label: "Today", offset: 0 }, { label: "Tomorrow", offset: 1 }, { label: "Next Week", offset: 7 }].map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  const d = new Date(); d.setDate(d.getDate() + opt.offset); d.setHours(12,0,0,0);
                  onUpdate({ date: d.toISOString() });
                  setDatePickerOpen(false);
                }}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left hover:bg-black/[0.04]"
                style={{ fontSize: "12px", color: c.text3 }}
              >
                <CalendarBlank size={13} style={{ color: c.text4 }} />
                {opt.label}
              </button>
            ))}
            <div className="h-px my-1.5" style={{ background: c.borderLight }} />
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateInputValue}
                onChange={(e) => setDateInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dateInputValue) {
                    onUpdate({ date: dateInputValue + "T12:00:00.000Z" });
                    setDatePickerOpen(false);
                  }
                }}
                className="flex-1 min-w-0 rounded px-2 py-1 text-xs outline-none"
                style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1 }}
                autoFocus
              />
              <button
                onClick={() => {
                  if (dateInputValue) { onUpdate({ date: dateInputValue + "T12:00:00.000Z" }); }
                  setDatePickerOpen(false);
                }}
                className="p-1 rounded hover:bg-black/[0.04]"
                style={{ color: c.coral }}
              >
                <Check size={13} weight="bold" />
              </button>
            </div>
            {sub.date && (
              <>
                <div className="h-px my-1.5" style={{ background: c.borderLight }} />
                <button
                  onClick={() => { onUpdate({ date: undefined }); setDatePickerOpen(false); }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left hover:bg-black/[0.04]"
                  style={{ fontSize: "12px", color: c.coral }}
                >
                  <X size={13} /> Remove date
                </button>
              </>
            )}
          </div>,
          document.body
        )}
      </div>

      {/* Today / Lineup icons */}
      <div className="flex items-center gap-0.5 shrink-0">
        {onToggleToday && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleToday(); }}
            className="p-0.5 rounded hover:bg-black/[0.05] transition-colors"
            title={sub.today ? "Remove from Today" : "Mark as Today"}
          >
            <Sun
              size={12}
              weight={sub.today ? "fill" : "regular"}
              style={{ color: sub.today ? "oklch(0.75 0.16 85)" : "oklch(0.55 0.02 260)", opacity: sub.today ? 0.9 : 0.5 }}
            />
          </button>
        )}
        {onToggleLineup && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLineup(); }}
            className="p-0.5 rounded hover:bg-black/[0.05] transition-colors"
            title={sub.lineup ? "Remove from Lineup" : "Add to Lineup"}
          >
            <SkipForward
              size={12}
              weight={sub.lineup ? "fill" : "regular"}
              style={{ color: sub.lineup ? "oklch(0.58 0.2 260)" : "oklch(0.55 0.02 260)", opacity: sub.lineup ? 0.85 : 0.5 }}
            />
          </button>
        )}
      </div>

      {/* Assignee avatar — clickable dropdown */}
      <div ref={assigneeRef} onClick={(e) => e.stopPropagation()}>
        <button
          ref={assigneeBtnRef}
          onClick={() => {
            if (!assigneeOpen && assigneeBtnRef.current) {
              const r = assigneeBtnRef.current.getBoundingClientRect();
              setAssigneePos({ top: r.bottom + 4, left: r.right });
            }
            setAssigneeOpen(!assigneeOpen);
          }}
          className="w-[22px] h-[22px] rounded-full hover:ring-2 hover:ring-black/10 transition-shadow flex items-center justify-center shrink-0"
          title={assigneeMember?.displayName || "Assign"}
        >
          {assigneePhoto ? (
            <ImageWithFallback src={assigneePhoto} alt={assigneeMember?.displayName || ""} className="w-full h-full rounded-full object-cover" />
          ) : assigneeInitial ? (
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: `color-mix(in oklch, ${assigneeColor} 15%, transparent)`, color: assigneeColor, fontSize: "10px", fontWeight: 600 }}>
              {assigneeInitial}
            </div>
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ border: "1.5px dashed oklch(0.88 0.01 260)" }}>
              <UserCircle size={12} style={{ color: "oklch(0.82 0.01 260)" }} />
            </div>
          )}
        </button>
        {assigneeOpen && createPortal(
          <div
            ref={assigneePortalRef}
            className="fixed z-[9999] py-1 rounded-[8px] min-w-[180px]"
            style={{ top: assigneePos.top, left: assigneePos.left, transform: "translateX(-100%)", background: "#fff", border: "1px solid #e1e5eb", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button onClick={() => { onUpdate({ assignee: undefined }); setAssigneeOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-black/[0.04]" style={{ fontSize: "13px", color: !sub.assignee ? "var(--accent-primary)" : "#5d646f" }}>
              <UserCircle className="w-4 h-4" style={{ color: "#8a9099" }} />
              Unassigned
              {!sub.assignee && <Check className="w-3 h-3 ml-auto" style={{ color: "var(--accent-primary)" }} />}
            </button>
            {teamMembers.map((m) => {
              const isActive = sub.assignee === m.userId;
              const ini = m.displayName.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
              return (
                <button key={m.userId} onClick={() => { onUpdate({ assignee: m.userId }); setAssigneeOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-black/[0.04]" style={{ fontSize: "13px", fontWeight: isActive ? 500 : 400, color: isActive ? "var(--accent-primary)" : "#5d646f" }}>
                  {m.avatarUrl ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: m.avatarColor || c.coral }}><ImageWithFallback src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" /></div>
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: m.avatarColor || c.coral }}><span style={{ color: "white", fontSize: "8px", fontWeight: 600 }}>{ini}</span></div>
                  )}
                  {m.displayName}
                  {isActive && <Check className="w-3 h-3 ml-auto" style={{ color: "var(--accent-primary)" }} />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}

/* ── Inline Task Row (matching brand guide exactly) ── */

function InlineTaskRow({
  task,
  teamMembers,
  onToggleComplete,
  onClick,
  onToggleToday,
  onToggleLineup,
  onUpdate,
  onSubtaskClick,
  projectName,
}: {
  task: TaskItem;
  teamMembers: TeamMemberInfo[];
  onToggleComplete: (id: string) => void;
  onClick: (id: string) => void;
  onToggleToday: (id: string) => void;
  onToggleLineup: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TaskItem>) => void;
  onSubtaskClick: (taskId: string, subtaskId: string) => void;
  projectName: string;
}) {
  const done = task.completed;
  const isDeliverable = task.title.toUpperCase().startsWith("DELIVERABLE:");
  const isMilestone = task.milestone === true;

  const dateInputRef = useRef<HTMLInputElement>(null);
  const { setDragging } = useDragContext();

  // Build drag payload for cross-panel drops
  const crossPanelPayload: DragPayload = { type: "task", id: task.id, title: task.title, projectName, taskDate: task.date, taskStatus: task.status };

  // DnD: make this row draggable
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: TASK_DND_TYPE,
    item: () => {
      // Also set context dragging state for cross-panel awareness
      setDragging(crossPanelPayload);
      return { id: task.id, fromSection: task.section };
    },
    end: () => setDragging(null),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [task.id, task.section, task.title, projectName, task.date, task.status, setDragging]);

  // Subtask counter
  const subtaskTotal = task.subtasks?.length || 0;
  const subtaskDone = task.subtasks?.filter((s) => s.completed).length || 0;
  const subtaskLabel = subtaskTotal > 0 ? `${subtaskDone}/${subtaskTotal}` : "";

  // First tag
  const firstTag = task.tags?.[0] || null;

  // Assignee
  const assigneeMember = task.assignee
    ? teamMembers.find((m) => m.userId === task.assignee)
    : null;
  const assigneeInitial = assigneeMember
    ? assigneeMember.displayName.charAt(0).toUpperCase()
    : null;
  const assigneeColor = assigneeMember?.avatarColor || c.coral;
  const assigneePhoto = assigneeMember?.avatarUrl || null;
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateInputValue, setDateInputValue] = useState("");

  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assigneeOpen && !datePickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (assigneeOpen && assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setAssigneeOpen(false);
      if (datePickerOpen && datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) setDatePickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [assigneeOpen, datePickerOpen]);

  return (
    <>
    <div
      ref={dragRef as unknown as React.RefObject<HTMLDivElement>}
      className="group flex items-center gap-2 transition-colors hover:bg-black/[0.015] cursor-grab active:cursor-grabbing px-[4px] py-[5px]"
      style={{ borderBottom: `1px solid ${c.borderLight}`, opacity: isDragging ? 0.4 : 1 }}
      onDragStart={(e) => {
        // Also set native drag data for cross-panel drops (chat, notepad, calendar)
        setDragData(e, { type: "task", id: task.id, title: task.title, projectName, taskDate: task.date, taskStatus: task.status });
      }}
      onClick={() => onClick(task.id)}
    >
      {/* Checkbox / diamond icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete(task.id);
        }}
        className="shrink-0 transition-colors flex items-center justify-center w-5 h-5"
      >
        {done ? (
          <CheckCircle weight="fill" size={20} style={{ color: c.green, opacity: 0.5 }} />
        ) : isMilestone ? (
          <Diamond size={18} style={{ color: c.gold }} />
        ) : isDeliverable ? (
          <Diamond size={18} style={{ color: c.indigo }} />
        ) : (
          <Circle
            size={20}
            style={{ color: c.checkHover }}
            className="group-hover:!text-[oklch(0.7_0.18_25)]"
          />
        )}
      </button>

      {/* Milestone flag */}
      {isMilestone && (
        <Flag weight="fill" size={14} style={{ color: c.gold }} className="shrink-0 -ml-0.5" />
      )}

      {/* Task name */}
      <span
        className="truncate"
        style={{
          color: done ? c.text4 : c.text1,
          fontSize: "13px",
          fontWeight: done ? 400 : 500,
        }}
      >
        {task.title}
      </span>

      {/* Subtasks count — clickable to expand */}
      {subtaskTotal > 0 && (
        <button
          className="shrink-0 inline-flex items-center gap-0.5 rounded px-1 py-0.5 hover:bg-black/[0.04] transition-colors"
          style={{ color: "oklch(0.72 0.01 260)", fontSize: "12px" }}
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          title={expanded ? "Collapse subtasks" : "Expand subtasks"}
        >
          <CaretDown
            size={10}
            weight="bold"
            style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s ease" }}
          />
          {subtaskLabel}
        </button>
      )}

      {/* Tag */}
      {firstTag && (
        <span
          className="shrink-0 px-1.5 py-[2px] rounded"
          style={{
            background: "oklch(0.94 0.005 260)",
            color: c.text3,
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          {firstTag}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date — clickable date picker */}
      <div className="relative shrink-0" ref={datePickerRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => {
            setDatePickerOpen(!datePickerOpen);
            if (task.date) {
              try { setDateInputValue(new Date(task.date).toISOString().split("T")[0]); } catch { setDateInputValue(""); }
            } else {
              setDateInputValue(new Date().toISOString().split("T")[0]);
            }
          }}
          className="inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-black/[0.05] transition-colors"
          title={task.date ? "Change due date" : "Set due date"}
        >
          {task.date ? (
            <span style={{ color: c.text4, fontSize: "12px" }}>
              {task.startDate
                ? `${formatShortDate(task.startDate)} – ${formatShortDate(task.date)}`
                : formatShortDate(task.date)}
            </span>
          ) : (
            <CalendarBlank size={13} style={{ color: "oklch(0.82 0.01 260)", opacity: 0.5 }} />
          )}
        </button>
        <AnimatePresence>
          {datePickerOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full right-0 mt-1 p-2 rounded-[8px] z-50 min-w-[180px]"
              style={{ background: "#fff", border: "1px solid #e1e5eb", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {[{ label: "Today", offset: 0 }, { label: "Tomorrow", offset: 1 }, { label: "Next Week", offset: 7 }].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    const d = new Date(); d.setDate(d.getDate() + opt.offset); d.setHours(12,0,0,0);
                    onUpdate(task.id, { date: d.toISOString() });
                    setDatePickerOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left hover:bg-black/[0.04]"
                  style={{ fontSize: "12px", color: c.text3 }}
                >
                  <CalendarBlank size={13} style={{ color: c.text4 }} />
                  {opt.label}
                </button>
              ))}
              <div className="h-px my-1.5" style={{ background: c.borderLight }} />
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dateInputValue}
                  onChange={(e) => setDateInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && dateInputValue) {
                      onUpdate(task.id, { date: dateInputValue + "T12:00:00.000Z" });
                      setDatePickerOpen(false);
                    }
                  }}
                  className="flex-1 min-w-0 rounded px-2 py-1 text-xs outline-none"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text1 }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (dateInputValue) { onUpdate(task.id, { date: dateInputValue + "T12:00:00.000Z" }); }
                    setDatePickerOpen(false);
                  }}
                  className="p-1 rounded hover:bg-black/[0.04]"
                  style={{ color: c.coral }}
                >
                  <Check size={13} weight="bold" />
                </button>
              </div>
              {task.date && (
                <>
                  <div className="h-px my-1.5" style={{ background: c.borderLight }} />
                  <button
                    onClick={() => { onUpdate(task.id, { date: undefined }); setDatePickerOpen(false); }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-left hover:bg-black/[0.04]"
                    style={{ fontSize: "12px", color: c.coral }}
                  >
                    <X size={13} /> Remove date
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Today / Lineup icons — always visible, subtle when inactive */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleToday(task.id);
          }}
          className="p-0.5 rounded hover:bg-black/[0.05] transition-colors"
          title={task.today ? "Remove from Today" : "Mark as Today"}
        >
          <Sun
            size={13}
            weight={task.today ? "fill" : "regular"}
            style={{ color: task.today ? "oklch(0.75 0.16 85)" : "oklch(0.55 0.02 260)", opacity: task.today ? 0.9 : 0.5 }}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLineup(task.id);
          }}
          className="p-0.5 rounded hover:bg-black/[0.05] transition-colors"
          title={task.lineup ? "Remove from Lineup" : "Add to Lineup"}
        >
          <SkipForward
            size={13}
            weight={task.lineup ? "fill" : "regular"}
            style={{ color: task.lineup ? "oklch(0.58 0.2 260)" : "oklch(0.55 0.02 260)", opacity: task.lineup ? 0.85 : 0.5 }}
          />
        </button>
      </div>

      {/* Hover-only: Watch icon */}
      <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => e.stopPropagation()}
          className="p-0.5 rounded hover:bg-black/[0.05] transition-colors"
          title="Watch task"
        >
          
        </button>
      </div>

      {/* Assignee avatar — clickable dropdown */}
      <div className="relative" ref={assigneeRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setAssigneeOpen(!assigneeOpen); }}
          className="w-[22px] h-[22px] rounded-full hover:ring-2 hover:ring-black/10 transition-shadow flex items-center justify-center shrink-0"
          title={assigneeMember?.displayName || "Assign"}
        >
          {assigneePhoto ? (
            <ImageWithFallback src={assigneePhoto} alt={assigneeMember?.displayName || ""} className="w-full h-full rounded-full object-cover" />
          ) : assigneeInitial ? (
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: `color-mix(in oklch, ${assigneeColor} 15%, transparent)`, color: assigneeColor, fontSize: "10px", fontWeight: 600 }}>
              {assigneeInitial}
            </div>
          ) : (
            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ border: "1.5px dashed oklch(0.88 0.01 260)" }}>
              <UserCircle size={12} style={{ color: "oklch(0.82 0.01 260)" }} />
            </div>
          )}
        </button>
        <AnimatePresence>
          {assigneeOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full right-0 mt-1 py-1 rounded-[8px] z-50 min-w-[180px]"
              style={{ background: "var(--surface-bg)", border: "1px solid #e1e5eb", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => { onUpdate(task.id, { assignee: undefined }); setAssigneeOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-black/[0.04]" style={{ fontSize: "13px", color: !task.assignee ? "var(--accent-primary)" : "#5d646f" }}>
                <UserCircle className="w-4 h-4" style={{ color: "#8a9099" }} />
                Unassigned
                {!task.assignee && <Check className="w-3 h-3 ml-auto" style={{ color: "var(--accent-primary)" }} />}
              </button>
              {teamMembers.map((m) => {
                const isActive = task.assignee === m.userId;
                const ini = m.displayName.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <button key={m.userId} onClick={() => { onUpdate(task.id, { assignee: m.userId }); setAssigneeOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-black/[0.04]" style={{ fontSize: "13px", fontWeight: isActive ? 500 : 400, color: isActive ? "var(--accent-primary)" : "#5d646f" }}>
                    {m.avatarUrl ? (
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: m.avatarColor || c.coral }}><ImageWithFallback src={m.avatarUrl} alt={m.displayName} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: m.avatarColor || c.coral }}><span style={{ color: "white", fontSize: "8px", fontWeight: 600 }}>{ini}</span></div>
                    )}
                    {m.displayName}
                    {isActive && <Check className="w-3 h-3 ml-auto" style={{ color: "var(--accent-primary)" }} />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>

    {/* ── Expanded subtasks ── */}
    <AnimatePresence>
      {expanded && subtaskTotal > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          {task.subtasks!.map((sub) => (
            <SubtaskRow
              key={sub.id}
              sub={sub}
              taskId={task.id}
              teamMembers={teamMembers}
              onUpdate={(updates) => {
                const updatedSubtasks = task.subtasks!.map((s) =>
                  s.id === sub.id ? { ...s, ...updates } : s
                );
                onUpdate(task.id, { subtasks: updatedSubtasks });
              }}
              onClick={() => onSubtaskClick(task.id, sub.id)}
              onToggleToday={() => {
                const updatedSubtasks = task.subtasks!.map((s) =>
                  s.id === sub.id ? { ...s, today: !s.today } : s
                );
                onUpdate(task.id, { subtasks: updatedSubtasks });
              }}
              onToggleLineup={() => {
                const updatedSubtasks = task.subtasks!.map((s) =>
                  s.id === sub.id ? { ...s, lineup: !s.lineup } : s
                );
                onUpdate(task.id, { subtasks: updatedSubtasks });
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

/* ── Droppable Section wrapper for DnD ── */

function DroppableSection({
  sectionLabel,
  onDropTask,
  children,
}: {
  sectionLabel: string;
  onDropTask: (taskId: string, toSection: string) => void;
  children: React.ReactNode;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: TASK_DND_TYPE,
      drop: (item: { id: string; fromSection: string }) => {
        if (item.fromSection !== sectionLabel) {
          onDropTask(item.id, sectionLabel);
        }
      },
      canDrop: (item: { id: string; fromSection: string }) => item.fromSection !== sectionLabel,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [sectionLabel, onDropTask]
  );

  return (
    <div
      ref={dropRef as unknown as React.RefObject<HTMLDivElement>}
      className="rounded-lg transition-colors"
      style={{
        outline: isOver && canDrop ? `2px dashed oklch(0.7 0.18 25 / 0.5)` : "2px dashed transparent",
        background: isOver && canDrop ? "oklch(0.7 0.18 25 / 0.04)" : "transparent",
      }}
    >
      {children}
    </div>
  );
}

/* ── Insights Tab ── */

function OverviewTab({
  project,
  onAddUpdate,
  onOpenStatusEditor,
}: {
  project: ProjectData;
  onAddUpdate?: (update: { title: string; content: string; sections?: { label: string; content: string }[] }) => void;
  onOpenStatusEditor?: () => void;
}) {
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.completed).length;
  const overdueTasks = project.tasks.filter((t) => {
    if (!t.date || t.completed) return false;
    try { return new Date(t.date) < new Date(); } catch { return false; }
  }).length;
  const phaseMeta = PHASE_META[project.productionPhase];

  /* Status color map (hex) for safe rendering */
  const STATUS_HEX: Record<string, { dot: string; color: string; bg: string; label: string }> = {
    "on-track": { dot: "#10B880", color: "#0D9668", bg: "#E8FCF7", label: "On Track" },
    "at-risk": { dot: "#F79000", color: "#C07300", bg: "#FFF8E5", label: "At Risk" },
    "off-track": { dot: "#fa6863", color: "#D03040", bg: "#FEE5F8", label: "Off Track" },
    "on-hold": { dot: "#6159e1", color: "#5048c7", bg: "#eeedfc", label: "On Hold" },
    complete: { dot: "#10B880", color: "#0D9668", bg: "#E8FCF7", label: "Complete" },
    dropped: { dot: "#868E95", color: "#676076", bg: "#EEEEF0", label: "Dropped" },
  };

  const [viewingUpdate, setViewingUpdate] = useState<string | null>(null);

  const allStatusUpdates = useMemo(
    () =>
      project.updates
        .filter((u) => !u.type || u.type === "status-update")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [project.updates]
  );
  const latestStatusUpdate = allStatusUpdates[0] || null;
  const pastStatusUpdates = allStatusUpdates.slice(1);
  const viewedUpdate = viewingUpdate ? allStatusUpdates.find((u) => u.id === viewingUpdate) : null;

  const relativeTime = (iso: string): string => {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    if (days < 30) return `${days} days ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
  };

  return (
    <div className="space-y-6">
      {/* ── Latest Status Update Card ── */}
      {latestStatusUpdate ? (
        <div className="rounded-lg px-5 py-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <h4 style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Latest Status Update</h4>
            <button
              onClick={onOpenStatusEditor}
              className="text-xs font-medium hover:underline"
              style={{ color: "#3B82F6" }}
            >
              + New update
            </button>
          </div>

          {latestStatusUpdate.status && STATUS_HEX[latestStatusUpdate.status] && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
              style={{ background: STATUS_HEX[latestStatusUpdate.status].bg }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_HEX[latestStatusUpdate.status].dot }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: STATUS_HEX[latestStatusUpdate.status].color }}>
                {STATUS_HEX[latestStatusUpdate.status].label}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "#999" }}>
              {(latestStatusUpdate.authorName || latestStatusUpdate.author || "?").charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: c.text2 }}>
              {latestStatusUpdate.authorName || latestStatusUpdate.author}
            </span>
            <span style={{ fontSize: "12px", color: c.text4 }}>{relativeTime(latestStatusUpdate.createdAt)}</span>
          </div>

          <div style={{ fontSize: "15px", fontWeight: 600, color: c.text1, marginBottom: "8px" }}>
            {latestStatusUpdate.title}
          </div>

          {(latestStatusUpdate.summary || latestStatusUpdate.content) && (
            <div className="mb-2">
              <span style={{ fontSize: "11px", fontWeight: 600, color: c.text4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary</span>
              <p className="mt-1 line-clamp-4" style={{ fontSize: "13px", color: c.text3, lineHeight: 1.6 }}>
                {latestStatusUpdate.summary || latestStatusUpdate.content}
              </p>
            </div>
          )}

          {latestStatusUpdate.nextSteps && (
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: c.text4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Steps</span>
              <p className="mt-1 line-clamp-3" style={{ fontSize: "13px", color: c.text3, lineHeight: 1.6 }}>
                {latestStatusUpdate.nextSteps}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {latestStatusUpdate.owner && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#f5f5f5", color: "#666" }}>
                Owner: {latestStatusUpdate.ownerName || latestStatusUpdate.owner}
              </span>
            )}
            {latestStatusUpdate.productionPhase && PHASE_META[latestStatusUpdate.productionPhase] && (
              <span className="text-xs px-2 py-0.5 rounded" style={{
                background: PHASE_META[latestStatusUpdate.productionPhase].bgColor,
                color: PHASE_META[latestStatusUpdate.productionPhase].color,
              }}>
                {PHASE_META[latestStatusUpdate.productionPhase].label}
              </span>
            )}
            {latestStatusUpdate.client && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#f0f7ff", color: "#3B82F6" }}>
                {latestStatusUpdate.client}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          className="rounded-lg px-5 py-8 text-center cursor-pointer hover:bg-black/[0.01] transition-colors"
          style={{ border: `2px dashed ${c.border}` }}
          onClick={onOpenStatusEditor}
        >
          <ArrowClockwise size={28} style={{ color: c.text4, margin: "0 auto 8px" }} />
          <p style={{ fontSize: "14px", fontWeight: 500, color: c.text3 }}>Add a status update</p>
          <p style={{ fontSize: "12px", color: c.text4, marginTop: "4px" }}>
            Keep your team informed about this project's progress
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: totalTasks, color: c.text1 },
          { label: "Completed", value: completedTasks, color: c.teal },
          { label: "In Progress", value: project.tasks.filter((t) => t.status === "in-progress").length, color: c.indigo },
          { label: "Overdue", value: overdueTasks, color: overdueTasks > 0 ? c.coral : c.text4 },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg px-4 py-3" style={{ background: c.card, border: `1px solid ${c.border}` }}>
            <div style={{ fontSize: "11px", color: c.text4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: stat.color, marginTop: "4px" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg px-4 py-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Completion</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: c.teal }}>
            {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: c.borderLight }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`, background: c.teal }}
          />
        </div>
      </div>

      <div className="rounded-lg px-4 py-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
        <h4 className="mb-2" style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Description</h4>
        <p style={{ fontSize: "14px", color: c.text3, lineHeight: 1.6 }}>
          {project.description || "No description provided."}
        </p>
      </div>

      <div className="rounded-lg px-4 py-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
        <h4 className="mb-3" style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>Details</h4>
        <div className="space-y-2">
          {[
            { label: "Client", value: project.client || "None" },
            { label: "Location", value: project.location || "None" },
            { label: "Phase", value: phaseMeta?.label || project.productionPhase },
            { label: "Type", value: project.projectType },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0" style={{ fontSize: "12px", color: c.text4, fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: "13px", color: c.text3 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── All Status Updates Timeline ── */}
      {allStatusUpdates.length > 0 && (
        <div className="rounded-lg px-4 py-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
          <h4 className="mb-3" style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>
            Status Update History ({allStatusUpdates.length})
          </h4>
          <div className="relative pl-5">
            <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: c.border }} />
            <div className="space-y-4">
              {allStatusUpdates.map((update, idx) => {
                const sColor = update.status && STATUS_HEX[update.status]
                  ? STATUS_HEX[update.status]
                  : { dot: "#999", color: "#666", bg: "#f5f5f5", label: "" };
                return (
                  <div
                    key={update.id}
                    className="relative cursor-pointer group"
                    onClick={() => setViewingUpdate(update.id)}
                  >
                    <div
                      className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                      style={{ background: sColor.dot }}
                    />
                    <div className="rounded-md px-3 py-2 -mx-3 transition-colors group-hover:bg-black/[0.02]">
                      <div className="flex items-center gap-2 mb-0.5">
                        {idx === 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded" style={{ background: "#3B82F6", color: "#fff" }}>
                            Latest
                          </span>
                        )}
                        <span style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}>{update.title}</span>
                        {update.status && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                            style={{ background: sColor.bg, fontSize: "10px", fontWeight: 600, color: sColor.color }}
                          >
                            {sColor.label}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2" style={{ fontSize: "12px", color: c.text3, lineHeight: 1.5 }}>
                        {update.summary || update.content}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                          style={{ background: "#999" }}
                        >
                          {(update.authorName || update.author || "?").charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: "11px", color: c.text4 }}>
                          {update.authorName || update.author} · {relativeTime(update.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Full Update Detail Modal ── */}
      <AnimatePresence>
        {viewedUpdate && (
          <>
            <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setViewingUpdate(null)} />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-[10%] bottom-[10%] md:inset-x-auto md:left-1/2 md:top-[8%] md:bottom-[8%] md:w-[640px] md:-translate-x-1/2 z-50 rounded-xl shadow-2xl flex flex-col overflow-hidden"
              style={{ background: "#fff" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#e5e7eb" }}>
                <div className="flex items-center gap-2">
                  {viewedUpdate.status && STATUS_HEX[viewedUpdate.status] && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                      style={{ background: STATUS_HEX[viewedUpdate.status].bg, fontSize: "11px", fontWeight: 600, color: STATUS_HEX[viewedUpdate.status].color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: STATUS_HEX[viewedUpdate.status].dot }} />
                      {STATUS_HEX[viewedUpdate.status].label}
                    </span>
                  )}
                  <span style={{ fontSize: "11px", color: "#999" }}>
                    {new Date(viewedUpdate.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <button
                  onClick={() => setViewingUpdate(null)}
                  className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5 transition-colors"
                  style={{ color: "#666" }}
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>
                    {viewedUpdate.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: "#999" }}>
                      {(viewedUpdate.authorName || viewedUpdate.author || "?").charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#555" }}>
                      {viewedUpdate.authorName || viewedUpdate.author}
                    </span>
                    <span style={{ fontSize: "12px", color: "#999" }}>
                      {relativeTime(viewedUpdate.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Metadata pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {viewedUpdate.owner && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#f5f5f5", color: "#666" }}>
                      Owner: {viewedUpdate.ownerName || viewedUpdate.owner}
                    </span>
                  )}
                  {viewedUpdate.productionPhase && PHASE_META[viewedUpdate.productionPhase] && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{
                      background: PHASE_META[viewedUpdate.productionPhase].bgColor,
                      color: PHASE_META[viewedUpdate.productionPhase].color,
                    }}>
                      {PHASE_META[viewedUpdate.productionPhase].label}
                    </span>
                  )}
                  {viewedUpdate.client && (
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#f0f7ff", color: "#3B82F6" }}>
                      {viewedUpdate.client}
                    </span>
                  )}
                </div>

                {/* Summary */}
                {(viewedUpdate.summary || viewedUpdate.content) && (
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>Summary</span>
                    <p className="mt-1" style={{ fontSize: "14px", color: "#444", lineHeight: 1.7 }}>
                      {viewedUpdate.summary || viewedUpdate.content}
                    </p>
                  </div>
                )}

                {/* Next Steps */}
                {viewedUpdate.nextSteps && (
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Steps</span>
                    <p className="mt-1" style={{ fontSize: "14px", color: "#444", lineHeight: 1.7 }}>
                      {viewedUpdate.nextSteps}
                    </p>
                  </div>
                )}

                {/* Custom Sections */}
                {viewedUpdate.customSections?.map((sec, i) => (
                  <div key={i}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>{sec.title}</span>
                    <p className="mt-1" style={{ fontSize: "14px", color: "#444", lineHeight: 1.7 }}>
                      {sec.content}
                    </p>
                  </div>
                ))}

                {/* Legacy sections */}
                {viewedUpdate.sections?.map((sec, i) => (
                  <div key={i}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#999", textTransform: "uppercase", letterSpacing: "0.05em" }}>{sec.label}</span>
                    <p className="mt-1" style={{ fontSize: "14px", color: "#444", lineHeight: 1.7 }}>
                      {sec.content}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================= */
/* === FILTER DROPDOWN                                       === */
/* ============================================================= */

const FILTER_STATUSES = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];
const FILTER_PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "None" },
];
const FILTER_COMPLETION = [
  { value: "all", label: "All" },
  { value: "done", label: "Done" },
  { value: "not-done", label: "Not Done" },
];

function FilterDropdown({
  anchorEl,
  filter,
  onFilterChange,
  onClose,
}: {
  anchorEl: HTMLElement;
  filter: { status?: string[]; priority?: string[]; completed?: "all" | "done" | "not-done" };
  onFilterChange: (f: typeof filter) => void;
  onClose: () => void;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: Math.max(8, rect.right - 240) });
  }, [anchorEl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) && !anchorEl.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [anchorEl, onClose]);

  const toggleStatus = (v: string) => {
    const cur = filter.status || [];
    const next = cur.includes(v) ? cur.filter((s) => s !== v) : [...cur, v];
    onFilterChange({ ...filter, status: next.length > 0 ? next : undefined });
  };
  const togglePriority = (v: string) => {
    const cur = filter.priority || [];
    const next = cur.includes(v) ? cur.filter((s) => s !== v) : [...cur, v];
    onFilterChange({ ...filter, priority: next.length > 0 ? next : undefined });
  };
  const setCompletion = (v: "all" | "done" | "not-done") => {
    onFilterChange({ ...filter, completed: v === "all" ? undefined : v });
  };

  const hasFilters = (filter.status && filter.status.length > 0) || (filter.priority && filter.priority.length > 0) || (filter.completed && filter.completed !== "all");

  return (
    <div
      ref={dropRef}
      className="py-2 rounded-[8px] shadow-lg w-[240px]"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        background: "var(--surface-bg)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pb-1.5 mb-1" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Filters
        </span>
        {hasFilters && (
          <button
            onClick={() => onFilterChange({})}
            style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 500 }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Completion */}
      <div className="px-3 pt-1.5 pb-1">
        <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Completion
        </span>
        <div className="flex gap-1 mt-1">
          {FILTER_COMPLETION.map((opt) => {
            const active = (filter.completed || "all") === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setCompletion(opt.value as any)}
                className="px-2 py-0.5 rounded-full transition-colors"
                style={{
                  fontSize: "11px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "white" : "var(--text-secondary)",
                  background: active ? "var(--accent-primary)" : "var(--neutral-100)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div className="px-3 pt-2 pb-1">
        <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Status
        </span>
        <div className="flex flex-wrap gap-1 mt-1">
          {FILTER_STATUSES.map((opt) => {
            const active = filter.status?.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleStatus(opt.value)}
                className="px-2 py-0.5 rounded-full transition-colors"
                style={{
                  fontSize: "11px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "white" : "var(--text-secondary)",
                  background: active ? "var(--accent-primary)" : "var(--neutral-100)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Priority */}
      <div className="px-3 pt-2 pb-1.5">
        <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Priority
        </span>
        <div className="flex flex-wrap gap-1 mt-1">
          {FILTER_PRIORITIES.map((opt) => {
            const active = filter.priority?.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => togglePriority(opt.value)}
                className="px-2 py-0.5 rounded-full transition-colors"
                style={{
                  fontSize: "11px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "white" : "var(--text-secondary)",
                  background: active ? "var(--accent-primary)" : "var(--neutral-100)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================= */
/* === MILESTONES CARD + EDIT POPUP                           === */
/* ============================================================= */

const MILESTONE_TYPES = ["travel", "shoot", "round1", "final"] as const;
type MilestoneType = (typeof MILESTONE_TYPES)[number];

function fmtDisplay(iso: string): string {
  if (!iso) return "TBD";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MilestonesCard({
  timelineDates,
  onUpdate,
}: {
  timelineDates: TimelineDate[] | undefined;
  onUpdate: (dates: TimelineDate[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [showTravel, setShowTravel] = useState(() =>
    !!timelineDates?.some((td) => td.type === "travel")
  );

  const [draft, setDraft] = useState<Record<MilestoneType, { date: string; endDate: string }>>(() => {
    const init: any = {};
    for (const t of MILESTONE_TYPES) init[t] = { date: "", endDate: "" };
    if (timelineDates) {
      for (const td of timelineDates) {
        if (MILESTONE_TYPES.includes(td.type as MilestoneType)) {
          init[td.type as MilestoneType] = { date: td.label || "", endDate: td.endLabel || "" };
        }
      }
    }
    return init;
  });

  useEffect(() => {
    const next: any = {};
    for (const t of MILESTONE_TYPES) next[t] = { date: "", endDate: "" };
    if (timelineDates) {
      for (const td of timelineDates) {
        if (MILESTONE_TYPES.includes(td.type as MilestoneType)) {
          next[td.type as MilestoneType] = { date: td.label || "", endDate: td.endLabel || "" };
        }
      }
    }
    setDraft(next);
    setShowTravel(!!timelineDates?.some((td) => td.type === "travel"));
  }, [timelineDates]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (cardRef.current && !cardRef.current.contains(t) && popupRef.current && !popupRef.current.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (!open && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

  const saveDraft = (next: typeof draft, travel: boolean) => {
    const result: TimelineDate[] = [];
    const types = travel ? MILESTONE_TYPES : MILESTONE_TYPES.filter((t) => t !== "travel");
    for (const t of types) {
      const d = next[t];
      if (d.date) result.push({ label: d.date, type: t, endLabel: d.endDate || undefined });
    }
    onUpdate(result);
  };

  const handleDateChange = (type: MilestoneType, field: "date" | "endDate", value: string) => {
    const next = { ...draft, [type]: { ...draft[type], [field]: value } };
    setDraft(next);
    saveDraft(next, showTravel);
  };

  const handleTravelToggle = () => {
    const next = !showTravel;
    setShowTravel(next);
    if (!next) {
      const nextDraft = { ...draft, travel: { date: "", endDate: "" } };
      setDraft(nextDraft);
      saveDraft(nextDraft, false);
    } else {
      saveDraft(draft, true);
    }
  };

  const visibleTypes = showTravel
    ? (MILESTONE_TYPES as readonly MilestoneType[])
    : MILESTONE_TYPES.filter((t) => t !== "travel");

  const rows = visibleTypes.map((type) => {
    const d = draft[type];
    return { type, label: MILESTONE_NAMES[type] || type, color: MILESTONE_COLORS[type] || c.indigo, date: d.date, endDate: d.endDate };
  });

  return (
    <>
      <div
        ref={cardRef}
        onClick={handleOpen}
        className="hidden md:flex shrink-0 rounded-lg px-4 py-3 flex-col gap-1.5 cursor-pointer transition-all hover:shadow-sm"
        style={{ border: `1px solid ${c.border}` }}
      >
        {rows.map((r) => (
          <div key={r.type} className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 w-[76px]">
              <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: r.color }} />
              <span style={{ color: c.text2, fontSize: "12px", fontWeight: 600 }}>{r.label}</span>
            </div>
            <span style={{ color: c.text4, fontSize: "12px", whiteSpace: "nowrap" }}>
              {r.endDate ? `${fmtDisplay(r.date)} – ${fmtDisplay(r.endDate)}` : fmtDisplay(r.date)}
            </span>
          </div>
        ))}
      </div>

      {open && pos && createPortal(
        <div
          ref={popupRef}
          className="rounded-xl shadow-xl"
          style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999, width: 340, background: c.card, border: `1px solid ${c.border}` }}
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <span style={{ color: c.text1, fontSize: "13px", fontWeight: 700 }}>Edit Dates</span>
            <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:opacity-70 transition-opacity" style={{ color: c.text4 }}>
              <X size={14} weight="bold" />
            </button>
          </div>

          <div className="px-5 pb-4 flex flex-col gap-3">
            {/* Travel toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2.5">
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: MILESTONE_COLORS.travel }} />
                <span style={{ color: c.text2, fontSize: "12.5px", fontWeight: 500 }}>Travel dates</span>
              </div>
              <button
                onClick={handleTravelToggle}
                className="w-[36px] h-[20px] rounded-full relative transition-colors"
                style={{ background: showTravel ? c.coral : c.borderLight }}
              >
                <span
                  className="absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-all"
                  style={{ left: showTravel ? 18 : 2 }}
                />
              </button>
            </div>

            {showTravel && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label style={{ color: c.text4, fontSize: "10.5px", fontWeight: 500 }} className="block mb-1">Start</label>
                  <input type="date" value={draft.travel.date} onChange={(e) => handleDateChange("travel", "date", e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: c.bg, color: c.text1, border: `1px solid ${c.border}` }} />
                </div>
                <div className="flex-1">
                  <label style={{ color: c.text4, fontSize: "10.5px", fontWeight: 500 }} className="block mb-1">End</label>
                  <input type="date" value={draft.travel.endDate} onChange={(e) => handleDateChange("travel", "endDate", e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: c.bg, color: c.text1, border: `1px solid ${c.border}` }} />
                </div>
              </div>
            )}

            <div className="w-full h-px" style={{ background: c.border }} />

            {(["shoot", "round1", "final"] as MilestoneType[]).map((type) => (
              <div key={type}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: MILESTONE_COLORS[type] }} />
                  <label style={{ color: c.text2, fontSize: "12.5px", fontWeight: 500 }}>{MILESTONE_NAMES[type]}</label>
                </div>
                <input type="date" value={draft[type].date} onChange={(e) => handleDateChange(type, "date", e.target.value)} className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none" style={{ background: c.bg, color: c.text1, border: `1px solid ${c.border}` }} />
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ============================================================= */
/* === MAIN PROJECT PAGE                                     === */
/* ============================================================= */

type ProjectTab = "list" | "board" | "timeline" | "messages" | "files" | "insights";

export function ProjectPage() {
  const { params, goBack } = useNavigation();
  const projectName = params.projectId || "";
  const {
    projects,
    setProject,
    updateTask,
    addTask,
    deleteTask,
    deleteProject,
    starred,
    toggleStarred,
    teamMembers,
    loadError,
    reload,
  } = useData();

  const { profile } = useAuth();

  const project = projects[projectName];
  const [activeTab, setActiveTab] = useState<ProjectTab>("list");
  const [showStatusEditor, setShowStatusEditor] = useState<false | "view" | "edit">(false);


  /* ── Toolbar state ── */
  const [taskSort, setTaskSort] = useState("manual");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskFilter, setTaskFilter] = useState<{
    status?: string[];
    priority?: string[];
    completed?: "all" | "done" | "not-done";
  }>({});
  const [taskGroupBy, setTaskGroupBy] = useState<"section" | "status" | "priority" | "assignee" | "none">("section");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterBtnRef = useRef<HTMLDivElement>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const settingsDropRef = useRef<HTMLDivElement>(null);
  const [settingsPos, setSettingsPos] = useState({ top: 0, left: 0 });
  const [editName, setEditName] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Close settings menu on outside click
  useEffect(() => {
    if (!showSettingsMenu) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (settingsBtnRef.current && !settingsBtnRef.current.contains(t) && settingsDropRef.current && !settingsDropRef.current.contains(t)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSettingsMenu]);

  const [detailTaskId, setDetailTaskId] = useState<string | null>(() => {
    // Deep-link: auto-open task detail pane when navigated with taskId param
    if (params.taskId && project?.tasks?.some((t) => t.id === params.taskId)) {
      return params.taskId;
    }
    return null;
  });

  // Subtask detail: when set, opens TaskDetailPane with subtask data
  const [detailSubtask, setDetailSubtask] = useState<{ parentId: string; subtaskId: string } | null>(null);


  const handleUpdateTask = useCallback(
    (taskId: string, updates: Partial<TaskItem>) => updateTask(projectName, taskId, updates),
    [projectName, updateTask]
  );

  const handleAddTask = useCallback(
    (task: TaskItem) => addTask(projectName, task),
    [projectName, addTask]
  );

  const handleDeleteTask = useCallback(
    (taskId: string) => {
      deleteTask(projectName, taskId);
      if (detailTaskId === taskId) setDetailTaskId(null);
    },
    [projectName, deleteTask, detailTaskId]
  );

  // Subtask detail pane handlers
  const handleSubtaskClick = useCallback((parentTaskId: string, subtaskId: string) => {
    setDetailTaskId(null); // close any open task pane
    setDetailSubtask({ parentId: parentTaskId, subtaskId });
  }, []);

  const handleUpdateSubtaskFromPane = useCallback(
    (subtaskId: string, updates: Partial<TaskItem>) => {
      if (!detailSubtask || !project) return;
      const parent = project.tasks.find((t) => t.id === detailSubtask.parentId);
      if (!parent?.subtasks) return;
      const updatedSubtasks = parent.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, ...updates } : s
      );
      updateTask(projectName, detailSubtask.parentId, { subtasks: updatedSubtasks });
    },
    [detailSubtask, project, projectName, updateTask]
  );

  const handleDeleteSubtaskFromPane = useCallback(
    (subtaskId: string) => {
      if (!detailSubtask || !project) return;
      const parent = project.tasks.find((t) => t.id === detailSubtask.parentId);
      if (!parent?.subtasks) return;
      const updatedSubtasks = parent.subtasks.filter((s) => s.id !== subtaskId);
      updateTask(projectName, detailSubtask.parentId, { subtasks: updatedSubtasks });
      setDetailSubtask(null);
    },
    [detailSubtask, project, projectName, updateTask]
  );

  const handleToggleSubtaskToday = useCallback(
    (subtaskId: string) => {
      if (!detailSubtask || !project) return;
      const parent = project.tasks.find((t) => t.id === detailSubtask.parentId);
      if (!parent?.subtasks) return;
      const sub = parent.subtasks.find((s) => s.id === subtaskId);
      if (!sub) return;
      const updatedSubtasks = parent.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, today: !s.today } : s
      );
      updateTask(projectName, detailSubtask.parentId, { subtasks: updatedSubtasks });
    },
    [detailSubtask, project, projectName, updateTask]
  );

  const handleToggleSubtaskLineup = useCallback(
    (subtaskId: string) => {
      if (!detailSubtask || !project) return;
      const parent = project.tasks.find((t) => t.id === detailSubtask.parentId);
      if (!parent?.subtasks) return;
      const sub = parent.subtasks.find((s) => s.id === subtaskId);
      if (!sub) return;
      const updatedSubtasks = parent.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, lineup: !s.lineup } : s
      );
      updateTask(projectName, detailSubtask.parentId, { subtasks: updatedSubtasks });
    },
    [detailSubtask, project, projectName, updateTask]
  );

  // Use a ref to always have the latest project for non-stale updates
  const projectRef = useRef(project);
  projectRef.current = project;

  const handleUpdateProject = useCallback(
    (updates: Partial<ProjectData>) => {
      const current = projectRef.current;
      if (!current) return;
      setProject(projectName, { ...current, ...updates });
    },
    [projectName, setProject]
  );

  const handleToggleComplete = useCallback(
    (taskId: string) => {
      if (!project) return;
      const task = project.tasks.find((t) => t.id === taskId);
      if (!task) return;
      updateTask(projectName, taskId, { completed: !task.completed });
    },
    [project, projectName, updateTask]
  );

  const handleToggleToday = useCallback(
    (taskId: string) => {
      if (!project) return;
      const task = project.tasks.find((t) => t.id === taskId);
      if (!task) return;
      updateTask(projectName, taskId, { today: !task.today });
    },
    [project, projectName, updateTask]
  );

  const handleToggleLineup = useCallback(
    (taskId: string) => {
      if (!project) return;
      const task = project.tasks.find((t) => t.id === taskId);
      if (!task) return;
      updateTask(projectName, taskId, { lineup: !task.lineup });
    },
    [project, projectName, updateTask]
  );

  const handleDropTask = useCallback(
    (taskId: string, toSection: string) => {
      updateTask(projectName, taskId, { section: toSection });
      toast.success(`Moved to ${toSection}`);
    },
    [projectName, updateTask]
  );

  const detailTask = useMemo(() => {
    if (!detailTaskId || !project) return null;
    return project.tasks.find((t) => t.id === detailTaskId) || null;
  }, [detailTaskId, project]);

  // Convert subtask to TaskItem-like object for TaskDetailPane
  const detailSubtaskAsTask = useMemo((): TaskItem | null => {
    if (!detailSubtask || !project) return null;
    const parent = project.tasks.find((t) => t.id === detailSubtask.parentId);
    if (!parent?.subtasks) return null;
    const sub = parent.subtasks.find((s) => s.id === detailSubtask.subtaskId);
    if (!sub) return null;
    return {
      id: sub.id,
      title: sub.title,
      completed: sub.completed,
      date: sub.date,
      startDate: sub.startDate,
      assignee: sub.assignee,
      status: sub.status || "todo",
      content: sub.content,
      descriptionBlocks: sub.descriptionBlocks,
      today: sub.today,
      lineup: sub.lineup,
      attachments: sub.attachments,
      comments: sub.comments,
      subtasks: sub.subtasks,
      priority: sub.priority,
    } as TaskItem;
  }, [detailSubtask, project]);

  /* ── Filter → Sort → Group tasks ── */
  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
  const STATUS_ORDER: Record<string, number> = { "in-progress": 0, todo: 1, hold: 2, completed: 3 };

  const processedTasks = useMemo(() => {
    if (!project) return [] as TaskItem[];
    let tasks = [...project.tasks];

    // Search
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      tasks = tasks.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.assignee?.toLowerCase().includes(q) ||
        t.section?.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (taskFilter.status && taskFilter.status.length > 0) {
      tasks = tasks.filter((t) => taskFilter.status!.includes(t.status));
    }
    // Filter by priority
    if (taskFilter.priority && taskFilter.priority.length > 0) {
      tasks = tasks.filter((t) => taskFilter.priority!.includes(t.priority || "none"));
    }
    // Filter by completion
    if (taskFilter.completed === "done") tasks = tasks.filter((t) => t.completed);
    else if (taskFilter.completed === "not-done") tasks = tasks.filter((t) => !t.completed);

    // Sort
    if (taskSort !== "manual") {
      tasks.sort((a, b) => {
        switch (taskSort) {
          case "due_date": {
            if (!a.date && !b.date) return 0;
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          }
          case "priority":
            return (PRIORITY_ORDER[a.priority || "none"] ?? 4) - (PRIORITY_ORDER[b.priority || "none"] ?? 4);
          case "assignee":
            return (a.assignee || "zzz").localeCompare(b.assignee || "zzz");
          case "name":
            return a.title.localeCompare(b.title);
          case "status":
            return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
          default:
            return 0;
        }
      });
    }

    return tasks;
  }, [project, taskSearch, taskFilter, taskSort]);

  const taskSections = useMemo(() => {
    const tasks = processedTasks;
    if (tasks.length === 0) return [];

    const groupKey = taskGroupBy;
    const map = new Map<string, TaskItem[]>();
    const order: string[] = [];

    for (const t of tasks) {
      let sec: string;
      switch (groupKey) {
        case "status":
          sec = t.status === "in-progress" ? "In Progress" : t.status === "todo" ? "To Do" : t.status === "hold" ? "On Hold" : "Completed";
          break;
        case "priority":
          sec = (t.priority || "none").charAt(0).toUpperCase() + (t.priority || "none").slice(1);
          break;
        case "assignee":
          sec = t.assignee || "Unassigned";
          break;
        case "none":
          sec = "All Tasks";
          break;
        default: // "section"
          sec = t.section || "Untitled";
          break;
      }
      if (!map.has(sec)) {
        map.set(sec, []);
        order.push(sec);
      }
      map.get(sec)!.push(t);
    }
    return order.map((label) => ({ label, tasks: map.get(label)! }));
  }, [processedTasks, taskGroupBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (taskFilter.status && taskFilter.status.length > 0) count++;
    if (taskFilter.priority && taskFilter.priority.length > 0) count++;
    if (taskFilter.completed && taskFilter.completed !== "all") count++;
    return count;
  }, [taskFilter]);

  // Resolve project members to TeamMemberInfo objects (must be before early returns)
  const projectMembers = useMemo(() => {
    if (!project || !project.members || project.members.length === 0) return teamMembers.slice(0, 5);
    return project.members
      .map((uid) => teamMembers.find((m) => m.userId === uid))
      .filter(Boolean) as TeamMemberInfo[];
  }, [project, project?.members, teamMembers]);

  /* ── Data load error fallback ── */
  if (loadError && !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto"
            style={{ background: "oklch(0.95 0.04 60)" }}
          >
            <Warning className="w-6 h-6" style={{ color: "oklch(0.7 0.15 60)" }} weight="fill" />
          </div>
          <div>
            <h3
              className="mb-1"
              style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}
            >
              Unable to load project
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
              {loadError}
            </p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
            style={{
              background: "var(--accent-primary)",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <ArrowClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  /* ── Not-found state ── */
  if (!project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <h2 style={{ color: c.text1, fontSize: "18px", fontWeight: 600 }}>Project not found</h2>
          <p style={{ color: c.text3, fontSize: "14px" }}>The project "{projectName}" doesn't exist or was deleted.</p>
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:bg-black/[0.04]"
            style={{ color: c.coral, fontSize: "14px", fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const phaseMeta = PHASE_META[project.productionPhase];
  const isStarred = starred.has(projectName);
  const completedCount = processedTasks.filter((t) => t.completed).length;
  const totalCount = processedTasks.length;

  const projectColor = project.color || c.coral;

  // projectMembers is computed above (before early returns)

  // Build tags from project metadata
  const tags: { label: string; dot?: string; icon?: React.ElementType }[] = [];
  if (project.client) tags.push({ label: project.client, dot: projectColor });
  if (project.location) tags.push({ label: project.location, icon: MapPin });
  if (project.projectType) {
    const typeLabel = project.projectType
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" – ");
    tags.push({ label: typeLabel, icon: PROJECT_TYPE_ICONS[project.projectType] || VideoCamera });
  }

  return (
    <div style={{ background: c.bg, minHeight: "calc(100vh - 48px)" }}>
      <div className="h-[calc(100vh-48px)]">

        {/* ═══════════════════════════════════════════════
            MAIN COLUMN — Scrollable project content
            ═══════════════════════════════════════════════ */}
        <div className="h-full overflow-y-auto">



          <div className="max-w-[1200px] mx-auto px-6 lg:px-8 pt-6 lg:pt-7">

            {/* ── Title row ── */}
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Project icon — clickable Phosphor icon picker */}
                <PhosphorIconPicker
                  currentIcon={project.phosphorIcon || "Circle"}
                  color={projectColor}
                  onSelect={(iconName) => handleUpdateProject({ phosphorIcon: iconName })}
                >
                  {({ onClick, ref }) => {
                    const IconComp = getPhosphorIcon(project.phosphorIcon || "Circle") || Circle;
                    return (
                      <button
                        ref={ref as React.RefObject<HTMLButtonElement>}
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all hover:ring-2 hover:ring-black/[0.06] cursor-pointer"
                        style={{ background: `color-mix(in oklch, ${projectColor} 8%, transparent)` }}
                        title="Change project icon"
                      >
                        <IconComp weight="fill" size={18} style={{ color: projectColor }} />
                      </button>
                    );
                  }}
                </PhosphorIconPicker>
                <h1
                  className="truncate flex items-center gap-2"
                  style={{ color: c.text1, fontSize: "20px", fontWeight: 700, lineHeight: 1.3 }}
                >
                  {projectName}
                  {project.abbreviation && (
                    null
                  )}
                </h1>

                {/* Status badge — next to title */}
                <StatusBadge
                  status={project.status}
                  onChange={(s) => handleUpdateProject({ status: s })}
                  onOpenStatusEditor={() => setShowStatusEditor("view")}
                />

                {project.abbreviation && (
                  null
                )}
                
                {/* Caret — project settings dropdown */}
                <button
                  ref={settingsBtnRef}
                  className="shrink-0 p-0.5 rounded hover:bg-black/[0.04] transition-colors"
                  onClick={() => {
                    if (settingsBtnRef.current) {
                      const rect = settingsBtnRef.current.getBoundingClientRect();
                      setSettingsPos({ top: rect.bottom + 4, left: rect.left });
                    }
                    setShowSettingsMenu((v) => !v);
                  }}
                >
                  <CaretDown size={13} style={{ color: c.text4 }} />
                </button>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {/* Stacked member avatars */}
                {projectMembers.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {projectMembers.slice(0, 5).map((m) => {
                      const initials = (m.displayName || "?")
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <div
                          key={m.userId}
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-gray-900"
                          style={{
                            background: m.avatarColor || c.indigo,
                            overflow: "hidden",
                          }}
                          title={m.displayName}
                        >
                          {m.avatarUrl ? (
                            <ImageWithFallback
                              src={m.avatarUrl}
                              alt={m.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-[10px] font-semibold leading-none">
                              {initials}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {projectMembers.length > 5 && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-gray-900"
                        style={{ background: c.border }}
                      >
                        <span style={{ color: c.text3, fontSize: "10px", fontWeight: 600 }}>
                          +{projectMembers.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {/* Space icon */}
                <SpacePicker
                  value={project.spaceId}
                  onChange={(spaceId) => handleUpdateProject({ spaceId })}
                  iconOnly
                />
              </div>
            </div>

            {/* ── Description + Milestones side by side ── */}
            <div className="flex gap-6 mb-5">
              <p
                className="flex-1 min-w-0"
                style={{ color: c.text3, fontSize: "13px", lineHeight: 1.7 }}
              >
                {project.description || "No description provided."}
              </p>

              {/* Milestones card with edit popup */}
              <MilestonesCard
                timelineDates={project.timelineDates}
                onUpdate={(dates) => handleUpdateProject({ timelineDates: dates })}
              />
            </div>

            {/* ─ Tags row + Space picker ── */}
            

          {/* ── Resources ── */}
          <ProjectResources
            attachments={project.projectAttachments || []}
            onUpdate={(next) => handleUpdateProject({ projectAttachments: next })}
          />

          {/* ═════════════════════════════════════════
              TASKS section
              ══════════════════════════════════════════ */}
          <div className="pt-[0px] pb-[40px]">
            {/* Tasks header bar */}
            <div className="flex items-center justify-between gap-3 pt-4 pb-3">
              <div className="flex items-center gap-2">
                <span style={{ color: c.text1, fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em" }}>
                  TASKS
                </span>
                

                {/* Segmented tabs */}
                
              </div>

              <div className="flex items-center gap-1.5" ref={filterBtnRef}>
                <ListToolbar
                  searchValue={taskSearch}
                  onSearchChange={setTaskSearch}
                  searchPlaceholder="Search tasks…"
                  sortOptions={[
                    { value: "manual", label: "Manual" },
                    { value: "due_date", label: "Due Date" },
                    { value: "priority", label: "Priority" },
                    { value: "assignee", label: "Assignee" },
                    { value: "name", label: "Name" },
                    { value: "status", label: "Status" },
                  ]}
                  sortValue={taskSort}
                  onSortChange={setTaskSort}
                  activeFilterCount={activeFilterCount}
                  onFilterClick={() => setShowFilterMenu((v) => !v)}
                  groupActive={taskGroupBy !== "section"}
                  groupOptions={[
                    { value: "section", label: "Section" },
                    { value: "status", label: "Status" },
                    { value: "priority", label: "Priority" },
                    { value: "assignee", label: "Assignee" },
                    { value: "none", label: "None" },
                  ]}
                  groupValue={taskGroupBy}
                  onGroupChange={(v) => setTaskGroupBy(v as any)}
                />
                
              </div>

              {/* Filter dropdown */}
              {showFilterMenu && filterBtnRef.current && createPortal(
                <FilterDropdown
                  anchorEl={filterBtnRef.current}
                  filter={taskFilter}
                  onFilterChange={(f) => setTaskFilter(f)}
                  onClose={() => setShowFilterMenu(false)}
                />,
                document.body
              )}

              {/* Project settings dropdown */}
              {showSettingsMenu && createPortal(
                <div
                  ref={settingsDropRef}
                  className="py-1.5 rounded-[8px] shadow-lg min-w-[200px]"
                  style={{
                    position: "fixed",
                    top: settingsPos.top,
                    left: Math.max(8, settingsPos.left),
                    zIndex: 9999,
                    background: "var(--surface-bg)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <div className="px-3 py-1.5 mb-0.5" style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-quaternary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Project Settings
                  </div>
                  {[
                    { icon: GearSix, label: "Project preferences", action: () => {
                      setEditName(project.shortName || projectName);
                      setEditShortName(project.abbreviation || "");
                      setEditDesc(project.description || "");
                      setShowPrefsModal(true);
                    } },
                    { icon: Copy, label: "Duplicate project", action: () => {
                      const newName = `${projectName} (Copy)`;
                      const newProject = {
                        ...JSON.parse(JSON.stringify(project)),
                        tasks: project.tasks.map((t: any) => ({ ...t, id: `${t.id}-copy-${Date.now()}` })),
                      };
                      setProject(newName, newProject);
                      toast.success(`Duplicated as "${newName}"`);
                    } },
                    { icon: Export, label: "Export project", action: () => {
                      const blob = new Blob([JSON.stringify({ name: projectName, ...project }, null, 2)], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Project exported as JSON");
                    } },
                    { divider: true } as any,
                    { icon: Archive, label: project.archived ? "Unarchive project" : "Archive project", action: () => {
                      handleUpdateProject({ archived: !project.archived });
                      toast(project.archived ? "Project unarchived" : "Project archived");
                    }, danger: false },
                    { icon: Trash, label: "Delete project", action: () => {
                      setConfirmDelete(true);
                    }, danger: true },
                  ].map((item, i) => {
                    if (item.divider) return <div key={i} className="my-1 mx-2" style={{ borderTop: "1px solid var(--border-default)" }} />;
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => { item.action?.(); setShowSettingsMenu(false); }}
                        className="flex items-center gap-2.5 w-full px-3 py-1.5 transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                        style={{ fontSize: "13px", color: item.danger ? "oklch(0.6 0.2 25)" : "var(--text-secondary)" }}
                      >
                        {Icon && <Icon size={14} weight="regular" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>,
                document.body
              )}
            </div>

            {/* ── Project Preferences modal ── */}
            {showPrefsModal && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }} onClick={() => setShowPrefsModal(false)}>
                <div className="rounded-xl shadow-2xl w-[480px] max-h-[85vh] overflow-y-auto" style={{ background: c.card, border: `1px solid ${c.border}` }} onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="px-6 pt-5 pb-4 flex items-center justify-between sticky top-0 z-10" style={{ background: c.card, borderBottom: `1px solid ${c.border}` }}>
                    <div className="flex items-center gap-2.5">
                      <GearSix size={18} weight="fill" style={{ color: projectColor }} />
                      <span style={{ color: c.text1, fontSize: "16px", fontWeight: 700 }}>Project Preferences</span>
                    </div>
                    <button onClick={() => setShowPrefsModal(false)} className="p-1 rounded hover:opacity-70" style={{ color: c.text4 }}><X size={16} weight="bold" /></button>
                  </div>

                  <div className="px-6 py-5 flex flex-col gap-6">
                    {/* ── Name & Short Name ── */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2" style={{ color: c.text2, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <NotePencil size={14} weight="bold" />
                        <span>Name & Description</span>
                      </div>
                      <div>
                        <label className="block mb-1" style={{ color: c.text3, fontSize: "11px", fontWeight: 600 }}>Project Name</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ background: c.bg, color: c.text1, border: `1px solid ${c.border}` }}
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block mb-1" style={{ color: c.text3, fontSize: "11px", fontWeight: 600 }}>Short Name</label>
                        <input
                          value={editShortName}
                          onChange={(e) => setEditShortName(e.target.value)}
                          placeholder="e.g. PROJ"
                          maxLength={12}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                          style={{ background: c.bg, color: c.text1, border: `1px solid ${c.border}` }}
                        />
                        <span className="block mt-0.5" style={{ color: c.text4, fontSize: "10.5px" }}>A short abbreviation shown in compact views</span>
                      </div>
                      <div>
                        <label className="block mb-1" style={{ color: c.text3, fontSize: "11px", fontWeight: 600 }}>Description</label>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={3}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                          style={{ background: c.bg, color: c.text1, border: `1px solid ${c.border}` }}
                        />
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${c.border}` }} />

                    {/* ── Color ── */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2" style={{ color: c.text2, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Palette size={14} weight="bold" />
                        <span>Color</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2.5">
                        {[
                          { label: "Coral", value: c.coral },
                          { label: "Indigo", value: c.indigo },
                          { label: "Green", value: c.green },
                          { label: "Orange", value: c.orange },
                          { label: "Teal", value: c.teal },
                          { label: "Gold", value: c.gold },
                          { label: "Purple", value: c.purple },
                          { label: "Rose", value: "oklch(0.65 0.2 0)" },
                          { label: "Sky", value: "oklch(0.65 0.15 230)" },
                          { label: "Lime", value: "oklch(0.75 0.18 130)" },
                          { label: "Amber", value: "oklch(0.8 0.15 70)" },
                          { label: "Slate", value: "oklch(0.55 0.02 260)" },
                        ].map((col) => (
                          <button
                            key={col.label}
                            title={col.label}
                            onClick={() => {
                              handleUpdateProject({ color: col.value });
                              toast.success(`Color set to ${col.label}`);
                            }}
                            className="w-9 h-9 rounded-full transition-all hover:scale-110"
                            style={{
                              background: col.value,
                              outline: project.color === col.value ? `2px solid ${col.value}` : "none",
                              outlineOffset: "2px",
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${c.border}` }} />

                    {/* ── Members ── */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2" style={{ color: c.text2, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <Users size={14} weight="bold" />
                        <span>Members</span>
                      </div>
                      <p className="text-xs" style={{ color: c.text4 }}>
                        Use the member avatars in the project header to add or manage project members.
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 flex justify-end gap-2 sticky bottom-0" style={{ background: c.card, borderTop: `1px solid ${c.border}` }}>
                    <button onClick={() => setShowPrefsModal(false)} className="px-3.5 py-1.5 rounded-lg text-sm" style={{ color: c.text3, border: `1px solid ${c.border}` }}>Cancel</button>
                    <button
                      onClick={() => {
                        handleUpdateProject({ shortName: editName, abbreviation: editShortName || undefined, description: editDesc });
                        setShowPrefsModal(false);
                        toast.success("Project preferences saved");
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white"
                      style={{ background: c.coral }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* ── Delete Confirmation modal ── */}
            {confirmDelete && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setConfirmDelete(false)}>
                <div className="rounded-xl shadow-2xl w-[380px]" style={{ background: c.card, border: `1px solid ${c.border}` }} onClick={(e) => e.stopPropagation()}>
                  <div className="px-5 pt-5 pb-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "oklch(0.6 0.2 25 / 0.1)" }}>
                        <Trash size={18} weight="fill" style={{ color: "oklch(0.6 0.2 25)" }} />
                      </div>
                      <span style={{ color: c.text1, fontSize: "15px", fontWeight: 700 }}>Delete Project</span>
                    </div>
                    <p style={{ color: c.text3, fontSize: "13px", lineHeight: 1.6 }}>
                      Are you sure you want to delete <strong style={{ color: c.text1 }}>{project.shortName || projectName}</strong>? This action cannot be undone and all tasks, files, and messages will be permanently removed.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 px-5 pb-5 pt-3">
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: c.text3, border: `1px solid ${c.border}` }}>Cancel</button>
                    <button
                      onClick={() => {
                        deleteProject(projectName);
                        setConfirmDelete(false);
                        goBack();
                        toast.success("Project deleted");
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                      style={{ background: "oklch(0.6 0.2 25)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Tab content */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
              >
                {/* ── LIST VIEW (inline, matching brand guide) ── */}
                {activeTab === "list" && (
                  <TouchDndProvider>
                    <div className="space-y-4">
                      {taskSections.map((section) => (
                        <DroppableSection
                          key={section.label}
                          sectionLabel={section.label}
                          onDropTask={handleDropTask}
                        >
                          {/* Section label — colored uppercase text with accent underline */}
                          <div className="pb-2 mt-2 mb-0.5">
                            <span
                              className="inline-block pb-[6px]"
                              style={{
                                color: getSectionColor(section.label),
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                borderBottom: `2px solid ${getSectionColor(section.label)}`,
                              }}
                            >
                              {section.label}
                            </span>
                          </div>

                          {/* Task rows */}
                          <div>
                            {section.tasks.map((task) => (
                              <InlineTaskRow
                                key={task.id}
                                task={task}
                                teamMembers={teamMembers}
                                onToggleComplete={handleToggleComplete}
                                onClick={(id) => { setDetailSubtask(null); setDetailTaskId(id); }}
                                onToggleToday={handleToggleToday}
                                onToggleLineup={handleToggleLineup}
                                onUpdate={handleUpdateTask}
                                onSubtaskClick={handleSubtaskClick}
                                projectName={projectName}
                              />
                            ))}
                          </div>
                        </DroppableSection>
                      ))}

                      {/* Edge: no sections at all */}
                      {/* Empty state when filters/search yield no results */}
                      {processedTasks.length === 0 && project.tasks.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                          <Funnel size={24} style={{ color: c.text4 }} />
                          <p style={{ color: c.text3, fontSize: "13px" }}>No tasks match your filters</p>
                          <button
                            onClick={() => { setTaskSearch(""); setTaskFilter({}); setTaskSort("manual"); }}
                            className="px-3 py-1 rounded-full transition-colors hover:bg-black/[0.04]"
                            style={{ color: "var(--accent-primary)", fontSize: "12px", fontWeight: 500 }}
                          >
                            Clear filters
                          </button>
                        </div>
                      )}

                      {taskSections.length === 0 && processedTasks.length > 0 && (
                        <div>
                          {processedTasks.map((task) => (
                            <InlineTaskRow
                              key={task.id}
                              task={task}
                              teamMembers={teamMembers}
                              onToggleComplete={handleToggleComplete}
                              onClick={(id) => { setDetailSubtask(null); setDetailTaskId(id); }}
                              onToggleToday={handleToggleToday}
                              onToggleLineup={handleToggleLineup}
                              onUpdate={handleUpdateTask}
                              onSubtaskClick={handleSubtaskClick}
                              projectName={projectName}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </TouchDndProvider>
                )}

                {/* ── BOARD VIEW (Kanban) ── */}
                {activeTab === "board" && (
                  <KanbanBoard
                    tasks={project.tasks}
                    teamMembers={teamMembers}
                    onUpdateTask={handleUpdateTask}
                    onAddTask={handleAddTask}
                    onClickTask={(id) => setDetailTaskId(id)}
                  />
                )}

                {/* ── TIMELINE VIEW ── */}
                {activeTab === "timeline" && (
                  <ProjectTimeline
                    tasks={project.tasks}
                    timelineDates={project.timelineDates}
                    projectColor={projectColor}
                    onTaskClick={(id) => setDetailTaskId(id)}
                    teamMembers={teamMembers}
                  />
                )}

                {/* ── MESSAGES VIEW ── */}
                {activeTab === "messages" && (
                  <ProjectMessages
                    notes={project.notes || []}
                    onAddNote={(note) => {
                      const cur = projectRef.current;
                      if (!cur) return;
                      handleUpdateProject({
                        notes: [...(cur.notes || []), note],
                      });
                    }}
                    onUpdateNote={(noteId, updates) => {
                      const cur = projectRef.current;
                      if (!cur) return;
                      handleUpdateProject({
                        notes: (cur.notes || []).map((n) =>
                          n.id === noteId ? { ...n, ...updates } : n
                        ),
                      });
                    }}
                    onDeleteNote={(noteId) => {
                      const cur = projectRef.current;
                      if (!cur) return;
                      handleUpdateProject({
                        notes: (cur.notes || []).filter((n) => n.id !== noteId),
                      });
                    }}
                    onNoteClick={(id) => setDetailTaskId(id)}
                    projectColor={projectColor}
                  />
                )}

                {/* ── FILES VIEW ── */}
                {activeTab === "files" && (
                  <ProjectFiles
                    attachments={project.projectAttachments || []}
                    onAdd={(attachment) => {
                      const cur = projectRef.current;
                      if (!cur) return;
                      handleUpdateProject({
                        projectAttachments: [...(cur.projectAttachments || []), attachment],
                      });
                    }}
                    onRemove={(attachmentId) => {
                      const cur = projectRef.current;
                      if (!cur) return;
                      handleUpdateProject({
                        projectAttachments: (cur.projectAttachments || []).filter((a) => a.id !== attachmentId),
                      });
                    }}
                    projectColor={projectColor}
                  />
                )}

                {/* ── INSIGHTS VIEW ── */}
                {activeTab === "insights" && (
                  <OverviewTab
                    project={project}
                    onOpenStatusEditor={() => setShowStatusEditor("edit")}
                    onAddUpdate={(update) => {
                      const cur = projectRef.current;
                      if (!cur) return;
                      handleUpdateProject({
                        updates: [
                          {
                            id: `update-${Date.now()}`,
                            title: update.title,
                            content: update.content,
                            author: "ai",
                            authorName: "Canto AI",
                            createdAt: new Date().toISOString(),
                            sections: update.sections,
                          },
                          ...cur.updates,
                        ],
                      });
                    }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Add task */}
            <button
              onClick={() => {
                const newTask: TaskItem = {
                  id: `task-${Date.now()}`,
                  title: "",
                  completed: false,
                  status: "todo",
                  priority: "none",
                  section: taskSections[taskSections.length - 1]?.label || "",
                };
                handleAddTask(newTask);
              }}
              className="flex items-center gap-2 mt-2 py-2 rounded transition-colors hover:bg-black/[0.02] w-full"
              style={{ color: c.text4, fontSize: "13px" }}
            >
              <Plus size={13} />
              Add task
            </button>
          </div>
          </div>{/* close max-w-[1200px] */}
        </div>


      </div>

      {/* ── FABs ── */}
      

      {/* ── Question FAB (positioned near cover image edge) ── */}
      

      {/* ── Task Detail Pane ── */}
      <AnimatePresence>
        {detailTask && (
          <TaskDetailPane
            key={detailTask.id}
            task={detailTask}
            projectName={projectName}
            projectColor={project.color}
            projectIcon={project.phosphorIcon}
            projectShortName={project.shortName}
            open={!!detailTask}
            onClose={() => setDetailTaskId(null)}
            onUpdate={handleUpdateTask}
            onDelete={handleDeleteTask}
            teamMembers={teamMembers}
            allTasks={project.tasks}
            isToday={!!detailTask.today}
            onToggleToday={handleToggleToday}
            isLineup={!!detailTask.lineup}
            onToggleLineup={handleToggleLineup}
          />
        )}
      </AnimatePresence>

      {/* ── Subtask Detail Pane ── */}
      <AnimatePresence>
        {detailSubtaskAsTask && detailSubtask && (
          <TaskDetailPane
            key={`sub-${detailSubtask.subtaskId}`}
            task={detailSubtaskAsTask}
            projectName={projectName}
            projectColor={project.color}
            projectIcon={project.phosphorIcon}
            projectShortName={project.shortName}
            open={!!detailSubtaskAsTask}
            onClose={() => setDetailSubtask(null)}
            onUpdate={handleUpdateSubtaskFromPane}
            onDelete={handleDeleteSubtaskFromPane}
            teamMembers={teamMembers}
            allTasks={project.tasks}
            isToday={!!detailSubtaskAsTask.today}
            onToggleToday={handleToggleSubtaskToday}
            isLineup={!!detailSubtaskAsTask.lineup}
            onToggleLineup={handleToggleSubtaskLineup}
          />
        )}
      </AnimatePresence>

      {/* ── Status Update Editor Modal ── */}
      {showStatusEditor && (
        <StatusUpdateEditor
          project={project}
          projectName={projectName}
          teamMembers={teamMembers}
          currentUserId={profile?.email || "unknown"}
          currentUserName={profile?.displayName || "Unknown"}
          currentUserAvatar={profile?.avatarUrl}
          currentUserColor={profile?.avatarColor}
          startInEditMode={showStatusEditor === "edit"}
          onSaveDraft={(draft) => {
            console.log("Draft saved:", draft);
          }}
          onPost={(update) => {
            const current = projectRef.current;
            if (!current) return;
            const newUpdate = {
              ...update,
              id: `update-${Date.now()}`,
              createdAt: new Date().toISOString(),
            };
            handleUpdateProject({
              updates: [newUpdate, ...current.updates],
              status: update.status || current.status,
            });
            toast.success("Status update posted");
          }}
          onClose={() => setShowStatusEditor(false)}
        />
      )}


    </div>
  );
}

export default ProjectPage;