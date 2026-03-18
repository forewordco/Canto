/* ===================================================================
   TASK DETAIL PANE — Centered popup modal (Figma-matched layout).

   Desktop: centered popup with two-column layout.
   Mobile: full-screen bottom sheet via Vaul.

   Left column: status badges, title, description, subtasks, attachments.
   Right column: activity feed, comments, comment input.

   Phase 5 of Canto build plan (P5-4).
   =================================================================== */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  CalendarBlank,
  Flag,
  UserCircle,
  Circle,
  CircleHalf,
  CheckCircle,
  PauseCircle,
  CaretDown,
  Plus,
  Trash,
  Check,
  DotsThree,
  ThumbsUp,
  Paperclip,
  LinkSimple,
  ArrowsOut,
  At,
  Smiley,
  PaperPlaneTilt,
  TextB,
  TextItalic,
  MagnifyingGlass,
  File as FileIcon,
  Image as ImageIcon,
  FilePdf,
  DownloadSimple,
  UploadSimple,
  Spinner,
  Sun,
  Queue,
  SquareSplitVertical,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type {
  TaskItem,
  TaskStatus,
  Priority,
  SubTask,
  ProductionPhase,
  Comment,
  Attachment,
} from "../lib/types";
import { PHASE_META, TASK_PHASE_OPTIONS } from "../lib/types";
import type { DocBlock } from "../lib/types";
import { DescriptionBlockEditor, generateBlockId } from "./DescriptionBlockEditor";
import { useAuth } from "../lib/auth";
import { sendNotification } from "../lib/notifications";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../lib/api";
import { validateFiles, enforceMaxLength, MAX_LENGTHS } from "../lib/validation";
import { MentionInput, type MentionItem } from "./MentionInput";
import { useAnnounce } from "./ScreenReaderAnnouncer";
import { toast } from "sonner";
import { Drawer as VaulDrawer } from "vaul";
import { useIsMobile } from "./ui/use-mobile";
import { getPhosphorIcon } from "./PhosphorIconPicker";
import { useNavigation } from "../lib/navigation";

/* --- Status Config --- */

const STATUS_OPTIONS: {
  value: TaskStatus;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: "todo", label: "To Do", icon: Circle, color: "oklch(0.65 0.015 260)" },
  { value: "in-progress", label: "In Progress", icon: CircleHalf, color: "oklch(0.63 0.16 205)" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "oklch(0.72 0.11 180)" },
  { value: "hold", label: "On Hold", icon: PauseCircle, color: "oklch(0.85 0.15 85)" },
];

/* --- Priority Config --- */

const PRIORITY_OPTIONS: {
  value: Priority;
  label: string;
  color: string;
  weight: "fill" | "regular";
}[] = [
  { value: "urgent", label: "Urgent", color: "oklch(0.7 0.18 25)", weight: "fill" },
  { value: "high", label: "High", color: "oklch(0.72 0.17 55)", weight: "fill" },
  { value: "medium", label: "Medium", color: "oklch(0.85 0.15 85)", weight: "fill" },
  { value: "low", label: "Low", color: "oklch(0.65 0.15 180)", weight: "regular" },
  { value: "none", label: "None", color: "oklch(0.85 0.01 260)", weight: "regular" },
];

/* --- Props --- */

export interface TaskDetailPaneProps {
  task: TaskItem;
  projectName: string;
  projectColor?: string;
  projectIcon?: string;
  projectShortName?: string;
  open: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<TaskItem>) => void;
  onDelete?: (taskId: string) => void;
  teamMembers?: {
    userId: string;
    displayName: string;
    avatarColor?: string;
    avatarUrl?: string;
  }[];
  allTasks?: TaskItem[];
  isToday?: boolean;
  onToggleToday?: (taskId: string) => void;
  isLineup?: boolean;
  onToggleLineup?: (taskId: string) => void;
}

/* === DATE PICKER BUTTON === */

function formatDateShort(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
  } catch {
    return raw;
  }
}

function formatDateFull(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const months = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return raw;
  }
}

function toInputValue(raw?: string): string {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function DatePickerButton({
  value,
  onChange,
  placeholder,
  size = "md",
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder: string;
  size?: "sm" | "md";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isSm = size === "sm";

  const displayText = value
    ? isSm
      ? formatDateShort(value)
      : formatDateFull(value)
    : placeholder;

  return (
    <label
      className={`
        relative inline-flex items-center gap-1 cursor-pointer rounded-[5px] transition-colors
        ${isSm
          ? "text-[12px] px-1 py-0.5 -mx-1 hover:bg-black/[0.04]"
          : "text-[13px] px-2 py-1 hover:bg-black/[0.04]"
        }
      `}
      style={{
        color: value
          ? isSm ? "#5d646f" : "#11161f"
          : "#8a9099",
      }}
    >
      {isSm && <CalendarBlank className="w-3.5 h-3.5 shrink-0" style={{ color: "#8a9099" }} />}
      <span>{displayText}</span>
      <input
        ref={inputRef}
        type="date"
        value={toInputValue(value)}
        onChange={(e) => {
          if (e.target.value) {
            const d = new Date(e.target.value + "T12:00:00");
            onChange(d.toISOString());
          } else {
            onChange(undefined);
          }
        }}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        style={{ border: "none" }}
        tabIndex={-1}
      />
    </label>
  );
}

/* === INLINE DROPDOWN === */

function InlineDropdown<T extends string>({
  value,
  options,
  onChange,
  renderOption,
  renderValue,
  align = "left",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
  renderOption?: (opt: { value: T; label: string }, isActive: boolean) => React.ReactNode;
  renderValue?: (val: T) => React.ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-[6px] transition-colors cursor-pointer"
        style={{ fontSize: "13px" }}
      >
        {renderValue ? renderValue(value) : options.find((o) => o.value === value)?.label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1 py-1 rounded-[8px] z-50 min-w-[160px]"
            style={{ background: "var(--surface-bg)", border: "1px solid #e1e5eb", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", ...(align === "right" ? { right: 0 } : { left: 0 }) }}
          >
            {options.map((opt) => {
              const isActive = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                  style={{ fontSize: "13px", fontWeight: isActive ? 500 : 400, color: isActive ? "var(--accent-primary)" : "#5d646f" }}
                >
                  {renderOption ? (
                    renderOption(opt, isActive)
                  ) : (
                    <>
                      {opt.label}
                      {isActive && <Check className="w-3 h-3 ml-auto" style={{ color: "var(--accent-primary)" }} />}
                    </>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* === MORE ACTIONS MENU (header ... button) === */

function MoreActionsMenu({
  task,
  onDelete,
}: {
  task: TaskItem;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="More actions">
        <DotsThree className="w-4 h-4" weight="bold" style={{ color: "#8a9099" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full right-0 mt-1 py-1 rounded-[8px] z-50 min-w-[180px]"
            style={{ background: "var(--surface-bg)", border: "1px solid #e1e5eb", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
          >
            {onDelete && (
              <button onClick={() => { onDelete(); setOpen(false); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-black/[0.04]" style={{ fontSize: "13px", color: "#FA6863" }}>
                <Trash className="w-3.5 h-3.5" />
                Delete task
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* === SUBTASK ROW === */

function SubtaskRow({
  subtask,
  onToggle,
  onDelete,
  onTitleChange,
}: {
  subtask: SubTask;
  onToggle: () => void;
  onDelete: () => void;
  onTitleChange: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(subtask.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  return (
    <div className="flex items-center gap-2 group/sub" style={{ borderBottom: "1px solid #e8ebf1", padding: "7px 0" }}>
      <button onClick={onToggle} className="shrink-0 p-0.5 rounded-full transition-transform active:scale-90">
        {subtask.completed ? (
          <CheckCircle className="w-4 h-4" weight="fill" style={{ color: "#00AB93" }} />
        ) : (
          <Circle className="w-4 h-4" style={{ color: "#6159e1" }} />
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          value={editVal}
          onChange={(e) => setEditVal(e.target.value)}
          onBlur={() => { if (editVal.trim() && editVal.trim() !== subtask.title) onTitleChange(editVal.trim()); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); else if (e.key === "Escape") { setEditVal(subtask.title); setEditing(false); } }}
          className="flex-1 bg-transparent outline-none min-w-0"
          style={{ fontSize: "13px", color: "#343b45" }}
        />
      ) : (
        <span
          onClick={() => { if (!subtask.completed) { setEditVal(subtask.title); setEditing(true); } }}
          className={`flex-1 min-w-0 truncate cursor-text ${subtask.completed ? "line-through" : ""}`}
          style={{ fontSize: "13px", color: subtask.completed ? "#8a9099" : "#343b45" }}
        >
          {subtask.title}
        </span>
      )}

      <button
        onClick={onDelete}
        className="shrink-0 p-1 rounded opacity-0 group-hover/sub:opacity-100 transition-opacity hover:bg-black/[0.04]"
        style={{ color: "#8a9099" }}
      >
        <Trash className="w-3 h-3" />
      </button>
    </div>
  );
}

/* === MAIN COMPONENT === */

export function TaskDetailPane({
  task,
  projectName,
  projectColor,
  projectIcon,
  projectShortName,
  open,
  onClose,
  onUpdate,
  onDelete,
  teamMembers = [],
  allTasks = [],
  isToday = false,
  onToggleToday,
  isLineup = false,
  onToggleLineup,
}: TaskDetailPaneProps) {
  const [descBlocks, setDescBlocks] = useState<DocBlock[]>(
    task.descriptionBlocks && task.descriptionBlocks.length > 0
      ? task.descriptionBlocks
      : [{ id: generateBlockId(), type: "paragraph", content: task.content || "" }]
  );
  const [newSubtask, setNewSubtask] = useState("");
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subtasksSectionRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const { announce } = useAnnounce();
  const { navigate, activeRightPanel, rightPanelPinned } = useNavigation();

  // Compute right sidebar offset for modal positioning
  const rightPanelOffset = useMemo(() => {
    if (!activeRightPanel || !rightPanelPinned) return 0;
    const ICON_RAIL_WIDTH = 44;
    let panelWidth = 380;
    try {
      const stored = localStorage.getItem("canto-right-panel-width");
      if (stored) panelWidth = parseInt(stored, 10) || 380;
    } catch {}
    return panelWidth + ICON_RAIL_WIDTH;
  }, [activeRightPanel, rightPanelPinned]);

  const mentionItems: MentionItem[] = useMemo(() => {
    return teamMembers.map((m) => ({
      id: m.userId, label: m.displayName, type: "person" as const, color: m.avatarColor, avatarUrl: m.avatarUrl,
    }));
  }, [teamMembers]);

  // Derive unique section names from all tasks for the section picker
  const sectionOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { value: string; label: string }[] = [];
    for (const t of allTasks) {
      const sec = t.section || "";
      if (sec && !seen.has(sec)) {
        seen.add(sec);
        options.push({ value: sec, label: sec });
      }
    }
    return options;
  }, [allTasks]);

  useEffect(() => {
    setDescBlocks(
      task.descriptionBlocks && task.descriptionBlocks.length > 0
        ? task.descriptionBlocks
        : [{ id: generateBlockId(), type: "paragraph", content: task.content || "" }]
    );
  }, [task.id, task.content, task.descriptionBlocks]);

  useEffect(() => { if (showAddSubtask) subtaskInputRef.current?.focus(); }, [showAddSubtask]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleAddSubtask = useCallback(() => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    const sub: SubTask = { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: trimmed, completed: false };
    onUpdate(task.id, { subtasks: [...(task.subtasks || []), sub] });
    setNewSubtask("");
  }, [newSubtask, task.id, task.subtasks, onUpdate]);

  const handleToggleSubtask = useCallback((subtaskId: string) => {
    const updated = (task.subtasks || []).map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    onUpdate(task.id, { subtasks: updated });
  }, [task.id, task.subtasks, onUpdate]);

  const handleDeleteSubtask = useCallback((subtaskId: string) => {
    onUpdate(task.id, { subtasks: (task.subtasks || []).filter((s) => s.id !== subtaskId) });
  }, [task.id, task.subtasks, onUpdate]);

  const handleSubtaskTitleChange = useCallback((subtaskId: string, title: string) => {
    const updated = (task.subtasks || []).map((s) => s.id === subtaskId ? { ...s, title } : s);
    onUpdate(task.id, { subtasks: updated });
  }, [task.id, task.subtasks, onUpdate]);

  const statusConfig = STATUS_OPTIONS.find((s) => s.value === task.status)!;
  const StatusIcon = statusConfig.icon;
  const subtasksDone = (task.subtasks || []).filter((s) => s.completed).length;
  const subtasksTotal = (task.subtasks || []).length;
  const assignee = teamMembers.find((m) => m.userId === task.assignee);
  const isMobile = useIsMobile();

  if (!open) return null;

  /* ── Helpers ── */
  const timeAgo = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
      const days = Math.floor(hrs / 24);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } catch { return ""; }
  };

  /* Activity entries */
  const activityEntries: { id: string; text: React.ReactNode; time: string }[] = [];
  (task.subtasks || []).filter((s) => s.completed).forEach((s) => {
    const member = teamMembers.find((m) => m.userId === s.assignee);
    activityEntries.push({
      id: `act-sub-${s.id}`,
      text: (<span><strong style={{ fontWeight: 600, color: "#11161f" }}>{member?.displayName || "Someone"}</strong><span style={{ color: "#343b45" }}>{` completed subtask "${s.title}"`}</span></span>),
      time: task.updatedAt || task.createdAt || new Date().toISOString(),
    });
  });
  if (task.createdAt) {
    activityEntries.push({ id: "act-created", text: <span style={{ color: "#343b45" }}>Task created</span>, time: task.createdAt });
  }

  /* Comment submit */
  const handleCommentSubmit = () => {
    const trimmed = commentText.trim();
    if (!trimmed || !user) return;
    const mentionRegex = /@([^\s@]+(?:\s[^\s@]+)?)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(trimmed)) !== null) {
      const member = teamMembers.find((m) => m.displayName.toLowerCase() === match![1].toLowerCase());
      if (member) mentions.push(member.userId);
    }
    const newComment: Comment = { id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text: trimmed, author: user.id, authorName: profile?.displayName || user.email || "Unknown", authorColor: profile?.avatarColor, authorAvatar: profile?.avatarUrl, createdAt: new Date().toISOString(), mentions: mentions.length > 0 ? mentions : undefined };
    onUpdate(task.id, { comments: [...(task.comments || []), newComment] });
    setCommentText("");
    announce("Comment sent");
    if (task.assignee && task.assignee !== user.id) { sendNotification({ targetUserId: task.assignee, type: "comment", title: `New comment on: ${task.title}`, message: `${profile?.displayName || user.email}: ${trimmed.slice(0, 100)}`, fromUserName: profile?.displayName || user.email || "Someone", projectName, taskId: task.id, taskTitle: task.title }).catch(() => {}); }
    for (const mentionedUserId of mentions) { if (mentionedUserId === task.assignee || mentionedUserId === user.id) continue; sendNotification({ targetUserId: mentionedUserId, type: "mention", title: `Mentioned you in: ${task.title}`, message: `${profile?.displayName || user.email}: ${trimmed.slice(0, 100)}`, fromUserName: profile?.displayName || user.email || "Someone", projectName, taskId: task.id, taskTitle: task.title }).catch(() => {}); }
  };

  /* File upload */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const validation = validateFiles(fileArray);
    if (!validation.valid) { alert(validation.error); if (fileInputRef.current) fileInputRef.current.value = ""; return; }
    setUploadingFile(true);
    try {
      const newAttachments: Attachment[] = [...(task.attachments || [])];
      for (const file of fileArray) {
        const base64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => { resolve((reader.result as string).split(",")[1] || (reader.result as string)); }; reader.onerror = reject; reader.readAsDataURL(file); });
        const { data, error } = await api.post<{ url: string; path: string; storageKey: string }>("/storage/attachment", { base64, contentType: file.type, fileName: file.name, projectName });
        if (error || !data) { console.error(`[Attachments] Upload failed for ${file.name}: ${error}`); continue; }
        newAttachments.push({ id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: file.name, url: data.url, type: file.type, size: file.size, storageKey: data.storageKey, uploadedBy: user?.id, uploadedAt: new Date().toISOString() });
      }
      onUpdate(task.id, { attachments: newAttachments });
      if (task.assignee && user && task.assignee !== user.id) { sendNotification({ targetUserId: task.assignee, type: "attachment_added", title: `Attachment added to: ${task.title}`, message: `${profile?.displayName || user.email} added ${files.length} file(s)`, fromUserName: profile?.displayName || user.email || "Someone", projectName, taskId: task.id, taskTitle: task.title }).catch(() => {}); }
    } catch (err) { console.error("[Attachments] Upload error:", err); }
    finally { setUploadingFile(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  /* ═══════ PANEL INNER ═══════ */
  const panelInner = (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--surface-bg)" }}>
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple capture="environment" className="hidden" onChange={handleFileUpload} />

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-6 h-[49px] shrink-0" style={{ borderBottom: "1px solid #e1e5eb" }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1" style={{ fontSize: "12px", color: "#8a9099" }}>{(() => { const ProjIcon = projectIcon ? getPhosphorIcon(projectIcon) : null; return ProjIcon ? <ProjIcon className="w-3.5 h-3.5" weight="duotone" style={{ color: projectColor || "#8a9099" }} /> : null; })()}{projectShortName || projectName}</span>
          {task.section && (<><span style={{ fontSize: "12px", color: "#8a9099" }}>/</span><span className="inline-flex items-center gap-0.5" style={{ fontSize: "12px", color: "#8a9099" }}><SquareSplitVertical className="w-3 h-3" />{task.section}</span></>)}
        </div>
        <div className="flex items-center gap-1">
          {/* Like */}
          <button
            onClick={() => { const userId = user?.id; if (!userId) return; const liked = task.likedBy || []; const alreadyLiked = liked.includes(userId); onUpdate(task.id, { likedBy: alreadyLiked ? liked.filter((id) => id !== userId) : [...liked, userId] }); if (!alreadyLiked) { toast.success("Liked!"); if (task.assignee && task.assignee !== userId) { sendNotification({ targetUserId: task.assignee, type: "task_liked", title: `Liked: ${task.title}`, message: `${profile?.displayName || user?.email || "Someone"} liked this task`, fromUserName: profile?.displayName || user?.email || "Someone", projectName, taskId: task.id, taskTitle: task.title }).catch(() => {}); } } }}
            className="p-1.5 rounded-[6px] hover:bg-black/[0.04] flex items-center gap-0.5" title={user && (task.likedBy || []).includes(user.id) ? "Unlike" : "Like"}
          >
            <ThumbsUp className="w-4 h-4" weight={user && (task.likedBy || []).includes(user.id) ? "fill" : "regular"} style={{ color: user && (task.likedBy || []).includes(user.id) ? "oklch(0.55 0.2 280)" : "#8a9099" }} />
            {(task.likedBy || []).length > 0 && <span style={{ fontSize: "10px", fontWeight: 600, color: "#8a9099" }}>{(task.likedBy || []).length}</span>}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Attach"><Paperclip className="w-4 h-4" style={{ color: "#8a9099" }} /></button>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?project=${encodeURIComponent(projectName)}&task=${encodeURIComponent(task.id)}`).then(() => toast.success("Link copied")).catch(() => toast.error("Failed")); }} className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Copy link"><LinkSimple className="w-4 h-4" style={{ color: "#8a9099" }} /></button>
          <button onClick={() => setFullscreen((f) => !f)} className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title={fullscreen ? "Exit full screen" : "Full screen"}><ArrowsOut className="w-4 h-4" style={{ color: fullscreen ? "var(--accent-primary)" : "#8a9099" }} /></button>
          {onToggleToday && (
            <button onClick={() => onToggleToday(task.id)} className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title={isToday ? "Remove from Today" : "Add to Today"}>
              <Sun className="w-4 h-4" weight={isToday ? "fill" : "regular"} style={{ color: isToday ? "#E5A000" : "#8a9099" }} />
            </button>
          )}
          {onToggleLineup && (
            <button onClick={() => onToggleLineup(task.id)} className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title={isLineup ? "Remove from Lineup" : "Add to Lineup"}>
              <Queue className="w-4 h-4" weight={isLineup ? "fill" : "regular"} style={{ color: isLineup ? "#6366F1" : "#8a9099" }} />
            </button>
          )}
          <MoreActionsMenu task={task} onDelete={onDelete ? () => { onDelete(task.id); onClose(); } : undefined} />
        </div>
      </div>

      {/* ── Body: two columns ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex-1 overflow-y-auto min-w-0" style={{ borderRight: "1px solid #e1e5eb" }}>
          <div className="px-6 pt-5 pb-8 space-y-5">
            {/* Status row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <InlineDropdown
                  value={task.status}
                  options={STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                  onChange={(val) => onUpdate(task.id, { status: val, completed: val === "completed" })}
                  renderValue={(val) => {
                    const cfg = STATUS_OPTIONS.find((s) => s.value === val)!;
                    const Icon = cfg.icon;
                    const isSubtle = val !== "completed";
                    return (
                      <span className="inline-flex items-center gap-1 rounded-[8px] pl-[8px] pr-[12px] py-[4px]" style={{ background: isSubtle ? `color-mix(in oklch, ${cfg.color} 12%, transparent)` : cfg.color, border: `1.5px solid ${isSubtle ? `color-mix(in oklch, ${cfg.color} 40%, transparent)` : cfg.color}` }}>
                        <Icon className="w-[18px] h-[18px]" weight={val === "completed" || val === "in-progress" || val === "hold" ? "fill" : "regular"} style={{ color: isSubtle ? cfg.color : "white" }} />
                        <span style={{ fontSize: "14px", fontWeight: 600, color: isSubtle ? cfg.color : "white" }}>{cfg.label}</span>
                      </span>
                    );
                  }}
                  renderOption={(opt, isActive) => {
                    const cfg = STATUS_OPTIONS.find((s) => s.value === opt.value)!;
                    const Icon = cfg.icon;
                    return (
                      <>
                        <Icon className="w-4 h-4" weight={opt.value === "completed" || opt.value === "in-progress" || opt.value === "hold" ? "fill" : "regular"} style={{ color: cfg.color }} />
                        <span style={{ color: isActive ? cfg.color : "#5d646f" }}>{opt.label}</span>
                        {isActive && <Check className="w-3 h-3 ml-auto" style={{ color: cfg.color }} />}
                      </>
                    );
                  }}
                />
                <InlineDropdown
                  value={task.section || ""}
                  options={sectionOptions.length > 0 ? sectionOptions : [{ value: task.section || "", label: task.section || "No Section" }]}
                  onChange={(val) => onUpdate(task.id, { section: val || undefined })}
                  renderValue={(val) => {
                    if (!val) return <span className="inline-flex items-center px-4 py-2 rounded-full" style={{ background: "oklch(0.55 0.2 280 / 0.08)", color: "#8a9099", fontSize: "15px", fontWeight: 500 }}>Section</span>;
                    return (null);
                  }}
                />
                <InlineDropdown value={task.priority || "none"} options={PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }))} onChange={(val) => onUpdate(task.id, { priority: val })} renderValue={(val) => { const p = PRIORITY_OPTIONS.find((o) => o.value === val)!; return <Flag className="w-5 h-5" weight={p.weight} style={{ color: p.color }} />; }} />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-1" style={{ background: "#f9fafc", border: "1px solid #e1e5eb" }}>
                  <DatePickerButton value={task.startDate} onChange={(v) => onUpdate(task.id, { startDate: v })} placeholder="Start" size="sm" />
                  <span style={{ fontSize: "13px", color: "#8a9099" }}>→</span>
                  <DatePickerButton value={task.date} onChange={(v) => onUpdate(task.id, { date: v })} placeholder="Due" size="sm" />
                </div>
                <InlineDropdown value={task.assignee || ""} options={[{ value: "", label: "Unassigned" }, ...teamMembers.map((m) => ({ value: m.userId, label: m.displayName }))]} onChange={(val) => onUpdate(task.id, { assignee: val || undefined })} align="right" renderValue={(val) => { const member = val ? teamMembers.find((m) => m.userId === val) : undefined; if (!member) return <UserCircle className="w-[22px] h-[22px]" style={{ color: "#8a9099" }} />; if (member.avatarUrl) return (<div className="w-[22px] h-[22px] rounded-full overflow-hidden shrink-0" style={{ background: member.avatarColor || "#fa6863" }} title={member.displayName}><ImageWithFallback src={member.avatarUrl} alt={member.displayName} className="w-full h-full object-cover" /></div>); const initials = member.displayName.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2); return (<div className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0" style={{ background: member.avatarColor || "#fa6863" }} title={member.displayName}><span style={{ color: "white", fontSize: "8px", fontWeight: 600 }}>{initials}</span></div>); }} renderOption={(opt, isActive) => { if (!opt.value) return (<><UserCircle className="w-4 h-4" style={{ color: "#8a9099" }} /><span>Unassigned</span>{isActive && <Check className="w-3 h-3 ml-auto" style={{ color: "var(--accent-primary)" }} />}</>); const member = teamMembers.find((m) => m.userId === opt.value); const ini = opt.label.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2); return (<>{member?.avatarUrl ? (<div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ background: member?.avatarColor || "#fa6863" }}><ImageWithFallback src={member.avatarUrl} alt={opt.label} className="w-full h-full object-cover" /></div>) : (<div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: member?.avatarColor || "#fa6863" }}><span style={{ color: "white", fontSize: "8px", fontWeight: 600 }}>{ini}</span></div>)}<span>{opt.label}</span>{isActive && <Check className="w-3 h-3 ml-auto" style={{ color: "var(--accent-primary)" }} />}</>); }} />
              </div>
            </div>

            {/* Title */}
            <input className="w-full bg-transparent outline-none" style={{ fontSize: "20px", fontWeight: 600, color: "#11161f", lineHeight: 1.3 }} value={task.title} onChange={(e) => onUpdate(task.id, { title: e.target.value })} placeholder="Task title..." />

            {/* Description */}
            <DescriptionBlockEditor blocks={descBlocks} onChange={(blocks) => { setDescBlocks(blocks); const plainText = blocks.map((b) => b.content).filter(Boolean).join("\n"); onUpdate(task.id, { descriptionBlocks: blocks, content: plainText }); }} placeholder="Add a description..." enableAi={false} />

            {/* Subtasks */}
            <div ref={subtasksSectionRef}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#11161f" }}>Subtasks</span>
                <span style={{ fontSize: "12px", color: "#8a9099" }}>{subtasksTotal > 0 ? `${subtasksDone} of ${subtasksTotal}` : ""}</span>
              </div>
              {subtasksTotal > 0 && (
                <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: "#f3f5f9" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(subtasksDone / subtasksTotal) * 100}%`, background: "#6159e1" }} />
                </div>
              )}
              <div>
                {(task.subtasks || []).map((sub) => {
                  const subMember = teamMembers.find((m) => m.userId === sub.assignee);
                  return (
                    <SubtaskRow key={sub.id} subtask={sub} onToggle={() => handleToggleSubtask(sub.id)} onDelete={() => handleDeleteSubtask(sub.id)} onTitleChange={(title) => handleSubtaskTitleChange(sub.id, title)} />
                  );
                })}
                {showAddSubtask && (
                  <div className="flex items-center gap-2 py-2">
                    <Circle className="w-4 h-4 shrink-0" style={{ color: "#8a9099" }} />
                    <input ref={subtaskInputRef} value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAddSubtask(); else if (e.key === "Escape") { setShowAddSubtask(false); setNewSubtask(""); } }} onBlur={() => { if (newSubtask.trim()) handleAddSubtask(); setShowAddSubtask(false); }} placeholder="Add a subtask..." className="flex-1 bg-transparent outline-none" style={{ fontSize: "13px", color: "#343b45" }} />
                  </div>
                )}
                <button onClick={() => setShowAddSubtask(true)} className="flex items-center gap-1.5 py-2 rounded-[6px] transition-colors hover:bg-black/[0.02]" style={{ color: "#8a9099", fontSize: "12px", fontWeight: 500 }}>
                  <Plus className="w-3 h-3" /> Add Task
                </button>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#11161f" }}>Attachments</span>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-black/[0.04] disabled:opacity-50" style={{ color: "#8a9099", fontSize: "12px" }}>
                  {uploadingFile ? <Spinner className="w-3 h-3 animate-spin" /> : <UploadSimple className="w-3 h-3" />} Upload
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {(task.attachments || []).map((att) => {
                  const isImage = att.type?.startsWith("image/");
                  const isPdf = att.type === "application/pdf";
                  return (
                    <div key={att.id} className="flex items-center gap-2.5 px-2 py-2 rounded-[6px] group/att" style={{ border: "1px solid #e1e5eb", background: "white", width: "calc(50% - 6px)" }}>
                      <div className="w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 overflow-hidden" style={{ background: isImage ? "#f0eeff" : isPdf ? "rgba(230,43,52,0.08)" : "#f3f5f9" }}>
                        {isImage && att.url ? <ImageWithFallback src={att.url} alt={att.name} className="w-full h-full object-cover" /> : isPdf ? <FilePdf className="w-[18px] h-[18px]" style={{ color: "#D40924" }} /> : <FileIcon className="w-[18px] h-[18px]" style={{ color: "#8a9099" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "#11161f" }}>{att.name}</p>
                        {att.size && <p style={{ fontSize: "11px", fontWeight: 500, color: "#8a9099" }}>{att.size > 1048576 ? `${(att.size / 1048576).toFixed(1)} MB` : `${Math.round(att.size / 1024)} KB`}</p>}
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/att:opacity-100 transition-opacity">
                        {att.url && <a href={att.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-black/[0.04]" title="Download"><DownloadSimple className="w-3.5 h-3.5" style={{ color: "#8a9099" }} /></a>}
                        <button onClick={() => onUpdate(task.id, { attachments: (task.attachments || []).filter((a) => a.id !== att.id) })} className="p-1 rounded hover:bg-black/[0.04]" title="Remove"><Trash className="w-3.5 h-3.5" style={{ color: "#8a9099" }} /></button>
                      </div>
                    </div>
                  );
                })}
                {(task.attachments || []).length === 0 && (
                  <div className="rounded-[6px] px-3 py-4 text-center cursor-pointer transition-colors hover:bg-black/[0.01] w-full" style={{ border: "1px dashed #e1e5eb", color: "#8a9099", fontSize: "13px" }} onClick={() => fileInputRef.current?.click()}>
                    Drop files here or click to upload
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Activity & Comments */}
        <div className="w-[380px] shrink-0 flex flex-col" style={{ background: "#f9fafc" }}>
          {/* Activity log */}
          <div className="shrink-0" style={{ borderBottom: "1px solid #e1e5eb" }}>
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#11161f" }}>Activity</span>
                <button className="p-1.5 rounded-[6px] hover:bg-black/[0.04]" title="Search"><MagnifyingGlass className="w-4 h-4" style={{ color: "#8a9099" }} /></button>
              </div>
              {activityEntries.length > 0 ? (
                <div className="space-y-1">
                  {activityEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex gap-5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[5px]" style={{ background: "#8a9099" }} />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: "12px", lineHeight: 1.5 }}>{entry.text}</p>
                        <p style={{ fontSize: "11px", color: "#8a9099" }}>{timeAgo(entry.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "12px", color: "#8a9099" }}>No activity yet</p>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3">
            <div className="space-y-5">
              {(() => {
                const comments = task.comments || [];
                // Group consecutive comments by same author
                const groups: { author: string; comments: Comment[] }[] = [];
                for (const comment of comments) {
                  const last = groups[groups.length - 1];
                  if (last && last.author === comment.author) {
                    last.comments.push(comment);
                  } else {
                    groups.push({ author: comment.author, comments: [comment] });
                  }
                }
                return groups.map((group) => {
                  const first = group.comments[0];
                  const commentMember = teamMembers.find((m) => m.userId === first.author);
                  const authorName = first.authorName || commentMember?.displayName || "Unknown";
                  const authorColor = first.authorColor || commentMember?.avatarColor || "#fa6863";
                  const authorPhoto = first.authorAvatar || commentMember?.avatarUrl;
                  const initials = authorName.split(/\s+/).map((p: string) => p[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div key={first.id}>
                      {/* Author header — shown once per group */}
                      <div className="flex items-center gap-1.5 mb-1">
                        {authorPhoto ? (
                          <div className="w-[22px] h-[22px] rounded-full overflow-hidden shrink-0" style={{ background: authorColor }}><ImageWithFallback src={authorPhoto} alt={authorName} className="w-full h-full object-cover" /></div>
                        ) : (
                          <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0" style={{ background: authorColor }}><span style={{ color: "white", fontSize: "8px", fontWeight: 600 }}>{initials}</span></div>
                        )}
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#11161f" }}>{authorName}</span>
                        <span style={{ fontSize: "11px", color: "#8a9099" }}>{timeAgo(first.createdAt)}</span>
                      </div>
                      {/* All messages in this consecutive group */}
                      <div className="ml-7 space-y-1.5">
                        {group.comments.map((comment, ci) => (
                          <div key={comment.id}>
                            {/* Show relative timestamp for follow-up messages only if it differs from the header */}
                            {ci > 0 && timeAgo(comment.createdAt) !== timeAgo(first.createdAt) && (
                              <span style={{ fontSize: "10px", color: "#8a9099", display: "block", marginBottom: "2px" }}>{timeAgo(comment.createdAt)}</span>
                            )}
                            <p style={{ fontSize: "13px", color: "#343b45", lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{comment.text}</p>
                            {comment.reactions && comment.reactions.length > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                {comment.reactions.map((r, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "rgba(250,104,99,0.1)", fontSize: "12px" }}><span>{r.emoji}</span><span style={{ fontSize: "11px", color: "#5d646f" }}>{r.userIds.length}</span></span>
                                ))}
                                <button className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.04]" style={{ fontSize: "11px", color: "#5d646f", fontWeight: 500 }}><Smiley className="w-3 h-3" style={{ color: "#5d646f" }} /> React</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
              {(task.comments || []).length === 0 && <p className="text-center py-6" style={{ fontSize: "13px", color: "#8a9099" }}>No comments yet</p>}
            </div>
          </div>

          {/* Comment input */}
          <div className="shrink-0 px-4 pt-3 pb-3" style={{ borderTop: "1px solid #e1e5eb", background: "#f9fafc" }}>
            <div className="rounded-[6px] overflow-hidden" style={{ border: "1px solid #e1e5eb", background: "white" }}>
              <MentionInput
                value={commentText}
                onChange={(val) => setCommentText(enforceMaxLength(val, MAX_LENGTHS.commentText))}
                onSubmit={handleCommentSubmit}
                mentionItems={mentionItems}
                placeholder="Write a comment..."
                maxLength={MAX_LENGTHS.commentText}
                rows={1}
                toolbar={
                  <>
                    <button className="p-1 rounded hover:bg-black/[0.04]" title="Bold" onMouseDown={(e) => { e.preventDefault(); setCommentText((prev) => prev + "**bold text**"); }}><TextB className="w-3.5 h-3.5" style={{ color: "#5d646f" }} /></button>
                    <button className="p-1 rounded hover:bg-black/[0.04]" title="Italic" onMouseDown={(e) => { e.preventDefault(); setCommentText((prev) => prev + "*italic text*"); }}><TextItalic className="w-3.5 h-3.5" style={{ color: "#5d646f" }} /></button>
                    <button className="p-1 rounded hover:bg-black/[0.04]" title="Mention" onMouseDown={(e) => { e.preventDefault(); setCommentText((prev) => prev + "@"); }}><At className="w-3.5 h-3.5" style={{ color: "#5d646f" }} /></button>
                    <button className="p-1 rounded hover:bg-black/[0.04]" title="Emoji" onMouseDown={(e) => { e.preventDefault(); setCommentText((prev) => prev + "\u{1F60A}"); }}><Smiley className="w-3.5 h-3.5" style={{ color: "#5d646f" }} /></button>
                    <button className="p-1 rounded hover:bg-black/[0.04]" title="Attach" onMouseDown={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}><Paperclip className="w-3.5 h-3.5" style={{ color: "#5d646f" }} /></button>
                  </>
                }
                submitLabel={<PaperPlaneTilt className="w-3.5 h-3.5" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Mobile: vaul bottom sheet ── */
  if (isMobile) {
    return (
      <VaulDrawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
        <VaulDrawer.Portal>
          <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/40" style={{ backdropFilter: "blur(2px)" }} />
          <VaulDrawer.Content className="fixed z-50 inset-x-0 bottom-0 flex flex-col rounded-t-[16px] overflow-hidden" style={{ background: "var(--surface-bg)", maxHeight: "95vh", paddingBottom: "env(safe-area-inset-bottom, 0px)" }} role="dialog" aria-label={`Task details: ${task.title}`} aria-modal="true">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: "var(--neutral-300)" }} /></div>
            {panelInner}
          </VaulDrawer.Content>
        </VaulDrawer.Portal>
      </VaulDrawer.Root>
    );
  }

  /* ── Desktop: centered popup modal ── */
  return (
    <>
      <motion.div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" style={{ right: rightPanelOffset }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
      <motion.div className="fixed z-50 inset-0 flex items-center justify-center pointer-events-none" style={{ right: rightPanelOffset }}>
        <motion.div
          className={`pointer-events-auto flex flex-col rounded-[6px] overflow-hidden ${fullscreen ? "w-full h-full" : "w-[944px] max-w-[95vw] h-[730px] max-h-[90vh]"}`}
          style={{ background: "var(--surface-bg)", border: "1px solid #e1e5eb", boxShadow: "0 25px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08)" }}
          initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", damping: 28, stiffness: 400 }} role="dialog" aria-label={`Task details: ${task.title}`} aria-modal="true"
        >
          {panelInner}
        </motion.div>
      </motion.div>
    </>
  );
}

/* ── Dependency Search ── */

function DepSearch({
  query,
  setQuery,
  tasks,
  onSelect,
  onClose,
}: {
  query: string;
  setQuery: (q: string) => void;
  tasks: TaskItem[];
  onSelect: (taskId: string) => void;
  onClose: () => void;
}) {
  const filtered = tasks.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  return (
    <div className="mt-1 rounded-[6px] overflow-hidden" style={{ border: "1px solid #e1e5eb", background: "var(--surface-bg)" }}>
      <div className="flex items-center gap-1.5 px-2 py-1.5" style={{ borderBottom: "1px solid #e1e5eb" }}>
        <MagnifyingGlass className="w-3 h-3 shrink-0" style={{ color: "#8a9099" }} />
        <input
          autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && filtered.length > 0) onSelect(filtered[0].id); }}
          placeholder="Search tasks..." className="flex-1 bg-transparent outline-none" style={{ fontSize: "11px", color: "#11161f" }}
          aria-label="Search tasks to add as dependency"
        />
      </div>
      <div className="max-h-[120px] overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((t) => (
            <button key={t.id} onClick={() => onSelect(t.id)} className="flex items-center gap-1.5 w-full px-2 py-1.5 text-left hover:bg-black/[0.03] transition-colors">
              <CheckCircle className="w-3 h-3 shrink-0" weight={t.completed ? "fill" : "regular"} style={{ color: t.completed ? "oklch(0.72 0.17 155)" : "#8a9099" }} />
              <span className="truncate" style={{ fontSize: "11px", color: t.completed ? "#8a9099" : "#5d646f", textDecoration: t.completed ? "line-through" : "none" }}>{t.title}</span>
            </button>
          ))
        ) : (
          <div className="px-2 py-2 text-center" style={{ fontSize: "11px", color: "#8a9099" }}>{query ? "No matching tasks" : "No available tasks"}</div>
        )}
      </div>
    </div>
  );
}

export default TaskDetailPane;