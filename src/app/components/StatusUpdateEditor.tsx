/* ═══════════════════════════════════════════════════════════
   STATUS UPDATE EDITOR — Full-screen modal for creating
   Asana-style project status updates.
   
   Two-panel layout: Left = editor, Right = sidebar with
   previous update / highlights / drafts tabs.
   ═══════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  CaretDown,
  Check,
  Plus,
  Trash,
  Paperclip,
  LinkSimple,
  Eye,
  PencilSimple,
  UserCircle,
  Users,
  ArrowsClockwise,
  Sparkle,
  ClockCountdown,
  NoteBlank,
  Lightning,
  Circle,
  FloppyDisk,
  ArrowLeft,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  ProjectData,
  ProjectStatus,
  UpdateItem,
  Attachment,
  TeamMemberInfo,
  ProductionPhase,
  ProjectType,
} from "../lib/types";
import { PHASE_META, PROJECT_TYPE_OPTIONS } from "../lib/types";
import { toast } from "sonner";

/* ─── Status Color Map (hex for safe rendering) ─── */

const STATUS_COLORS: Record<
  ProjectStatus,
  { dot: string; color: string; bg: string; label: string }
> = {
  "on-track": { dot: "#10B880", color: "#0D9668", bg: "#E8FCF7", label: "On Track" },
  "at-risk": { dot: "#F79000", color: "#C07300", bg: "#FFF8E5", label: "At Risk" },
  "off-track": { dot: "#fa6863", color: "#D03040", bg: "#FEE5F8", label: "Off Track" },
  "on-hold": { dot: "#6159e1", color: "#5048c7", bg: "#eeedfc", label: "On Hold" },
  complete: { dot: "#10B880", color: "#0D9668", bg: "#E8FCF7", label: "Complete" },
  dropped: { dot: "#868E95", color: "#676076", bg: "#EEEEF0", label: "Dropped" },
};

const ALL_STATUSES: ProjectStatus[] = [
  "on-track",
  "at-risk",
  "off-track",
  "on-hold",
  "complete",
  "dropped",
];

/* ─── Relative time ─── */

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  const days = Math.floor(diffMs / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

/* ─── Markdown content field ─── */

function MarkdownField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  const [mode, setMode] = useState<"write" | "preview">(value ? "preview" : "write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "write" && textareaRef.current) {
      textareaRef.current.focus();
      // Auto-resize
      const el = textareaRef.current;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [mode]);

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{label}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setMode("write")}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{
              background: mode === "write" ? "#f0f0f0" : "transparent",
              color: mode === "write" ? "#333" : "#999",
              fontWeight: 500,
            }}
          >
            <PencilSimple size={12} />
            Write
          </button>
          <button
            onClick={() => setMode("preview")}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
            style={{
              background: mode === "preview" ? "#f0f0f0" : "transparent",
              color: mode === "preview" ? "#333" : "#999",
              fontWeight: 500,
            }}
          >
            <Eye size={12} />
            Preview
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={handleInput}
          onBlur={() => {
            if (value.trim()) setMode("preview");
          }}
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2 resize-none"
          style={{
            border: "1px solid #e5e5e5",
            fontSize: "13px",
            lineHeight: 1.6,
            minHeight: "80px",
            color: "#333",
            outline: "none",
          }}
          rows={3}
        />
      ) : (
        <div
          onClick={() => setMode("write")}
          className="rounded-lg px-3 py-2 cursor-text min-h-[80px]"
          style={{ border: "1px solid #e5e5e5", fontSize: "13px", lineHeight: 1.6, color: "#333" }}
        >
          {value.trim() ? (
            <div className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500 [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          ) : (
            <span className="italic" style={{ color: "#aaa" }}>
              {placeholder}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Custom section ─── */

interface CustomSection {
  title: string;
  content: string;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

interface StatusUpdateEditorProps {
  project: ProjectData;
  projectName: string;
  initialStatus?: ProjectStatus;
  teamMembers: TeamMemberInfo[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  currentUserColor?: string;
  startInEditMode?: boolean;
  onPost: (update: Omit<UpdateItem, "id" | "createdAt">) => void;
  onSaveDraft?: (draft: { title: string; status: ProjectStatus; summary: string; nextSteps: string }) => void;
  onClose: () => void;
}

export function StatusUpdateEditor({
  project,
  projectName,
  initialStatus,
  teamMembers,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserColor,
  startInEditMode,
  onPost,
  onSaveDraft,
  onClose,
}: StatusUpdateEditorProps) {
  /* ── State ── */
  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const [title, setTitle] = useState(`${projectName} - ${todayStr}`);
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(
    initialStatus || project.status || "on-track"
  );
  const [summary, setSummary] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [owner, setOwner] = useState(currentUserName);
  const [attendees, setAttendees] = useState<string[]>([currentUserName]);

  // Dropdowns
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);

  // Right sidebar tab
  const [sidebarTab, setSidebarTab] = useState<"previous" | "highlights" | "drafts">("previous");

  // Field visibility toggles
  const [showPhase, setShowPhase] = useState(true);
  const [showType, setShowType] = useState(true);
  const [showClient, setShowClient] = useState(!!project.client);
  const [showFieldToggle, setShowFieldToggle] = useState(false);

  // View vs Edit mode
  const hasExistingUpdates = project.updates.some((u) => !u.type || u.type === "status-update");
  const [mode, setMode] = useState<"view" | "edit">(
    startInEditMode || !hasExistingUpdates ? "edit" : "view"
  );

  // Close confirmation
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Which update is currently viewed in view mode
  const [selectedViewUpdateId, setSelectedViewUpdateId] = useState<string | null>(null);

  const hasDraftContent = summary.trim() !== "" || nextSteps.trim() !== "" || customSections.some((s) => s.content.trim() !== "");

  const handleRequestClose = () => {
    if (mode === "edit" && hasDraftContent) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSaveDraft = () => {
    onSaveDraft?.({ title, status: selectedStatus, summary, nextSteps });
    toast.success("Draft saved");
    onClose();
  };

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleRequestClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mode, hasDraftContent]);

  /* ── Previous update ── */
  const previousUpdate = useMemo(() => {
    return project.updates.find(
      (u) => !u.type || u.type === "status-update"
    );
  }, [project.updates]);

  /* ── Collaborators count (unique task assignees) ── */
  const collaboratorCount = useMemo(() => {
    const set = new Set<string>();
    for (const t of project.tasks) {
      if (t.assignee) set.add(t.assignee);
    }
    return set.size;
  }, [project.tasks]);

  /* ── Status info ── */
  const statusInfo = STATUS_COLORS[selectedStatus];

  /* ── Handle post ── */
  const handlePost = () => {
    onPost({
      title: title || `${projectName} - ${todayStr}`,
      content: summary || "",
      author: currentUserId,
      authorName: currentUserName,
      status: selectedStatus,
      summary,
      nextSteps,
      customSections: customSections.length > 0 ? customSections : undefined,
      owner,
      ownerName: owner,
      attendees,
      type: "status-update",
      productionPhase: project.productionPhase,
      projectType: project.projectType,
      client: project.client || undefined,
      comments: [],
    });
    onClose();
  };

  /* ── Add custom section ── */
  const addCustomSection = () => {
    setCustomSections((prev) => [...prev, { title: "", content: "" }]);
  };

  const updateCustomSection = (idx: number, field: "title" | "content", value: string) => {
    setCustomSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const removeCustomSection = (idx: number) => {
    setCustomSections((prev) => prev.filter((_, i) => i !== idx));
  };

  /* ── Render ── */

  /* ── Most recent status update for view mode ── */
  const mostRecentUpdate = useMemo(() => {
    return [...project.updates]
      .filter((u) => !u.type || u.type === "status-update")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
  }, [project.updates]);

  const viewStatusInfo = mostRecentUpdate?.status ? STATUS_COLORS[mostRecentUpdate.status] : null;

  /* ── Close confirmation overlay ── */
  const closeConfirmOverlay = showCloseConfirm ? createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 300, fontFamily: "'Albert Sans', system-ui, sans-serif" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={() => setShowCloseConfirm(false)}
      />
      <div
        className="relative rounded-xl shadow-2xl p-6 w-full max-w-[400px] mx-4"
        style={{ background: "white" }}
      >
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1a1a1a" }}>
          You have unsaved changes
        </div>
        <p className="mt-2" style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
          Would you like to save your progress as a draft before closing?
        </p>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={() => {
              setShowCloseConfirm(false);
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ color: "#666" }}
          >
            Discard
          </button>
          <button
            onClick={() => {
              setShowCloseConfirm(false);
              handleSaveDraft();
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 flex items-center gap-1.5"
            style={{ background: "#333" }}
          >
            <FloppyDisk size={14} />
            Save Draft
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  /* ── VIEW MODE ── */
  if (mode === "view" && hasExistingUpdates) {
    const allStatusUpdates = [...project.updates]
      .filter((u) => !u.type || u.type === "status-update")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const allTimelineUpdates = [...project.updates]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeUpdate = selectedViewUpdateId
      ? allStatusUpdates.find((u) => u.id === selectedViewUpdateId) || allStatusUpdates[0]
      : allStatusUpdates[0];

    const activeStatusInfo = activeUpdate?.status ? STATUS_COLORS[activeUpdate.status] : null;

    const fmtDate = (iso: string) => {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
      <>
        {createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ zIndex: 200, fontFamily: "'Albert Sans', system-ui, sans-serif" }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={onClose}
            />

            {/* Modal — full two-panel */}
            <div
              className="relative flex w-full max-w-[960px] mx-4 rounded-xl overflow-hidden shadow-2xl"
              style={{ background: "white", maxHeight: "90vh" }}
            >
              {/* ═══ LEFT PANEL — Update detail ═══ */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" style={{ maxHeight: "90vh" }}>
                {/* Header */}
                <div
                  className="flex items-center justify-between px-6 py-4 shrink-0"
                  style={{ borderBottom: "1px solid #e5e5e5" }}
                >
                  <div className="flex items-center gap-3">
                    {activeStatusInfo && (
                      <div
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                        style={{ background: activeStatusInfo.bg }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: activeStatusInfo.dot }}
                        />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: activeStatusInfo.color }}>
                          {activeStatusInfo.label}
                        </span>
                      </div>
                    )}
                    <span style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>
                      Status Update
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMode("edit")}
                      className="px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90 flex items-center gap-1.5"
                      style={{ background: activeStatusInfo?.dot || "#333" }}
                    >
                      <PencilSimple size={14} />
                      Update Status
                    </button>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <X size={18} style={{ color: "#666" }} />
                    </button>
                  </div>
                </div>

                {/* Color bar */}
                {activeStatusInfo && (
                  <div className="h-1" style={{ background: activeStatusInfo.dot }} />
                )}

                {/* Content */}
                {activeUpdate ? (
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Title */}
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>
                      {activeUpdate.title}
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                        style={{ background: "#999" }}
                      >
                        {(activeUpdate.authorName || activeUpdate.author || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "#333" }}>
                          {activeUpdate.authorName || activeUpdate.author}
                        </div>
                        <div style={{ fontSize: "11px", color: "#aaa" }}>
                          {new Date(activeUpdate.createdAt).toLocaleDateString("en-US", {
                            weekday: "long", month: "long", day: "numeric", year: "numeric"
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    {(activeUpdate.summary || activeUpdate.content) && (
                      <div>
                        <div
                          className="mb-1.5"
                          style={{ fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}
                        >
                          Summary
                        </div>
                        <div
                          className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:text-gray-500"
                          style={{ fontSize: "13px", color: "#444", lineHeight: 1.7 }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {activeUpdate.summary || activeUpdate.content || ""}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {activeUpdate.nextSteps && (
                      <div>
                        <div
                          className="mb-1.5"
                          style={{ fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}
                        >
                          Next Steps
                        </div>
                        <div
                          className="prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                          style={{ fontSize: "13px", color: "#444", lineHeight: 1.7 }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {activeUpdate.nextSteps}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Custom sections */}
                    {activeUpdate.customSections?.map((sec: { title: string; content: string }, i: number) => (
                      <div key={i}>
                        <div
                          className="mb-1.5"
                          style={{ fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}
                        >
                          {sec.title}
                        </div>
                        <div
                          className="prose prose-sm max-w-none"
                          style={{ fontSize: "13px", color: "#444", lineHeight: 1.7 }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {sec.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <ClockCountdown size={32} style={{ color: "#ccc", margin: "0 auto 8px" }} />
                      <p style={{ fontSize: "13px", color: "#888" }}>No updates yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ═══ RIGHT PANEL — All updates timeline ═══ */}
              <div
                className="w-[320px] shrink-0 flex flex-col border-l"
                style={{ borderColor: "#e5e5e5", background: "#fafafa", maxHeight: "90vh" }}
              >
                {/* Sidebar header */}
                <div
                  className="px-4 py-3 shrink-0 flex items-center justify-between"
                  style={{ borderBottom: "1px solid #e5e5e5" }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>
                    All Updates
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ fontSize: "11px", color: "#888", background: "#eee" }}
                  >
                    {allStatusUpdates.length}
                  </span>
                </div>

                {/* Update list */}
                <div className="flex-1 overflow-y-auto">
                  {allTimelineUpdates.map((update) => {
                    const isStatus = !update.type || update.type === "status-update";
                    const isMemberJoined = update.type === "member-joined";
                    const isProjectCreated = update.type === "project-created";
                    const sColor = isStatus && update.status
                      ? STATUS_COLORS[update.status] || { dot: "#999", color: "#666", bg: "#f5f5f5", label: update.status }
                      : null;
                    const isActive = activeUpdate?.id === update.id;

                    if (isStatus) {
                      return (
                        <button
                          key={update.id}
                          onClick={() => setSelectedViewUpdateId(update.id)}
                          className="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/80"
                          style={{
                            background: isActive ? "white" : "transparent",
                            borderBottom: "1px solid #eee",
                            borderLeft: isActive ? `3px solid ${sColor?.dot || "#333"}` : "3px solid transparent",
                          }}
                        >
                          <div
                            className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: sColor?.dot || "#999" }}
                          >
                            <Circle size={8} weight="fill" style={{ color: "#fff" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="truncate"
                              style={{
                                fontSize: "13px",
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? "#1a1a1a" : "#333",
                                lineHeight: 1.3,
                              }}
                            >
                              {update.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {sColor && (
                                <span
                                  className="px-1.5 py-px rounded text-[10px] font-medium"
                                  style={{ background: sColor.bg, color: sColor.color }}
                                >
                                  {sColor.label}
                                </span>
                              )}
                              <span style={{ fontSize: "11px", color: "#aaa" }}>
                                {fmtDate(update.createdAt)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    }

                    // Non-status events (compact, non-clickable)
                    return (
                      <div
                        key={update.id}
                        className="px-4 py-2.5 flex items-center gap-3"
                        style={{ borderBottom: "1px solid #eee" }}
                      >
                        <div
                          className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "#f0f0f0" }}
                        >
                          {isMemberJoined ? (
                            <Users size={11} style={{ color: "#888" }} />
                          ) : isProjectCreated ? (
                            <NoteBlank size={11} style={{ color: "#888" }} />
                          ) : (
                            <Circle size={8} weight="fill" style={{ color: "#ccc" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate" style={{ fontSize: "12px", color: "#888", lineHeight: 1.3 }}>
                            {update.title}
                          </div>
                          <div style={{ fontSize: "10px", color: "#bbb", marginTop: "1px" }}>
                            {fmtDate(update.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  /* ── EDIT MODE ── */
  return (
    <>
      {closeConfirmOverlay}
      {createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 200, fontFamily: "'Albert Sans', system-ui, sans-serif" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={handleRequestClose}
      />

      {/* Modal */}
      <div
        className="relative flex w-full max-w-[960px] mx-4 rounded-xl overflow-hidden shadow-2xl"
        style={{ background: "white", maxHeight: "90vh" }}
      >
        {/* ═══ LEFT PANEL — Editor ═══ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" style={{ maxHeight: "90vh" }}>
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: "1px solid #e5e5e5" }}
          >
            <div className="flex items-center gap-3">
              {hasExistingUpdates && (
                <button
                  onClick={() => setMode("view")}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={16} style={{ color: "#666" }} />
                </button>
              )}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: statusInfo.bg }}
              >
                <Circle size={14} weight="fill" style={{ color: statusInfo.dot }} />
              </div>
              <span style={{ fontSize: "15px", fontWeight: 600, color: "#1a1a1a" }}>
                New Status Update
              </span>
              {collaboratorCount > 0 && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: "#f5f5f5", fontSize: "11px", color: "#888" }}
                >
                  <Users size={12} />
                  {collaboratorCount} {collaboratorCount === 1 ? "person" : "people"} will be
                  notified
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 flex items-center gap-1.5"
                style={{ color: "#666", border: "1px solid #e5e5e5" }}
              >
                <FloppyDisk size={14} />
                Save Draft
              </button>
              <button
                onClick={handlePost}
                className="px-4 py-1.5 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                style={{ background: statusInfo.dot }}
              >
                Post
              </button>
              <button
                onClick={handleRequestClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <X size={18} style={{ color: "#666" }} />
              </button>
            </div>
          </div>

          {/* Editor body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* AI Draft banner placeholder */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "#faf5ff", border: "1px solid #ede5f7" }}
            >
              <Sparkle size={16} style={{ color: "#8B5CF6" }} />
              <span style={{ fontSize: "12px", color: "#7C3AED", fontWeight: 500 }}>
                Draft with AI
              </span>
              <span style={{ fontSize: "11px", color: "#a78bfa" }}>Coming soon</span>
            </div>

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold outline-none"
              style={{ color: "#1a1a1a", fontSize: "20px" }}
              placeholder={`${projectName} - ${todayStr}`}
              autoFocus
            />

            {/* Metadata grid */}
            <div className="space-y-3">
              {/* Status picker */}
              <div className="flex items-center gap-3">
                <span
                  className="w-24 shrink-0"
                  style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}
                >
                  Status *
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
                    style={{ border: "1px solid #e5e5e5" }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: statusInfo.dot }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 500, color: statusInfo.color }}>
                      {statusInfo.label}
                    </span>
                    <CaretDown size={12} style={{ color: "#999" }} />
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div
                        className="fixed inset-0"
                        style={{ zIndex: 10 }}
                        onClick={() => setShowStatusDropdown(false)}
                      />
                      <div
                        className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border min-w-[180px]"
                        style={{ background: "white", borderColor: "#e5e5e5", zIndex: 11 }}
                      >
                        {ALL_STATUSES.map((s) => {
                          const info = STATUS_COLORS[s];
                          return (
                            <button
                              key={s}
                              onClick={() => {
                                setSelectedStatus(s);
                                setShowStatusDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ background: info.dot }}
                              />
                              <span style={{ fontSize: "13px", color: info.color, fontWeight: 500 }}>
                                {info.label}
                              </span>
                              {s === selectedStatus && (
                                <Check
                                  size={14}
                                  weight="bold"
                                  className="ml-auto"
                                  style={{ color: info.color }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3">
                <span
                  className="w-24 shrink-0"
                  style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}
                >
                  Owner
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowOwnerDropdown(!showOwnerDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-50"
                    style={{ border: "1px solid #e5e5e5" }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: currentUserColor || "#999" }}
                    >
                      {owner.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: "13px", color: "#333" }}>{owner}</span>
                    <CaretDown size={12} style={{ color: "#999" }} />
                  </button>
                  {showOwnerDropdown && (
                    <>
                      <div
                        className="fixed inset-0"
                        style={{ zIndex: 10 }}
                        onClick={() => setShowOwnerDropdown(false)}
                      />
                      <div
                        className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border min-w-[200px] max-h-[200px] overflow-y-auto"
                        style={{ background: "white", borderColor: "#e5e5e5", zIndex: 11 }}
                      >
                        {teamMembers.map((m) => (
                          <button
                            key={m.userId}
                            onClick={() => {
                              setOwner(m.displayName);
                              setShowOwnerDropdown(false);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                          >
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                              style={{ background: m.avatarColor || "#999" }}
                            >
                              {m.displayName.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: "13px", color: "#333" }}>
                              {m.displayName}
                            </span>
                            {m.displayName === owner && (
                              <Check
                                size={14}
                                weight="bold"
                                className="ml-auto"
                                style={{ color: "#10B880" }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Phase (optional) */}
              {showPhase && (
                <div className="flex items-center gap-3">
                  <span
                    className="w-24 shrink-0"
                    style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}
                  >
                    Stage
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: PHASE_META[project.productionPhase]?.bgColor || "#f5f5f5",
                      color: PHASE_META[project.productionPhase]?.color || "#666",
                    }}
                  >
                    {PHASE_META[project.productionPhase]?.label || project.productionPhase}
                  </span>
                </div>
              )}

              {/* Work Type (optional) */}
              {showType && (
                <div className="flex items-center gap-3">
                  <span
                    className="w-24 shrink-0"
                    style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}
                  >
                    Work Type
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#f5f5f5", color: "#666" }}>
                    {PROJECT_TYPE_OPTIONS.find((o) => o.value === project.projectType)?.label ||
                      project.projectType}
                  </span>
                </div>
              )}

              {/* Client (optional) */}
              {showClient && project.client && (
                <div className="flex items-center gap-3">
                  <span
                    className="w-24 shrink-0"
                    style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}
                  >
                    Client
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#f0f7ff", color: "#3B82F6" }}>
                    {project.client}
                  </span>
                </div>
              )}

              {/* Field visibility toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowFieldToggle(!showFieldToggle)}
                  className="text-xs hover:underline"
                  style={{ color: "#3B82F6" }}
                >
                  Show or hide fields
                </button>
                {showFieldToggle && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 10 }}
                      onClick={() => setShowFieldToggle(false)}
                    />
                    <div
                      className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border min-w-[180px]"
                      style={{ background: "white", borderColor: "#e5e5e5", zIndex: 11 }}
                    >
                      {[
                        { label: "Current Stage", checked: showPhase, toggle: () => setShowPhase(!showPhase) },
                        { label: "Work Type", checked: showType, toggle: () => setShowType(!showType) },
                        { label: "Client", checked: showClient, toggle: () => setShowClient(!showClient) },
                      ].map((f) => (
                        <label
                          key={f.label}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={f.checked}
                            onChange={f.toggle}
                            className="rounded"
                          />
                          <span style={{ fontSize: "13px", color: "#333" }}>{f.label}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "#e5e5e5" }} />

            {/* Summary */}
            <MarkdownField
              value={summary}
              onChange={setSummary}
              placeholder="How's this project going?"
              label="Summary"
            />

            {/* Next Steps */}
            <MarkdownField
              value={nextSteps}
              onChange={setNextSteps}
              placeholder="What's next for the team?"
              label="Next Steps"
            />

            {/* Custom Sections */}
            {customSections.map((sec, idx) => (
              <div key={idx} className="relative group">
                <input
                  value={sec.title}
                  onChange={(e) => updateCustomSection(idx, "title", e.target.value)}
                  placeholder="Section title"
                  className="w-full text-sm font-semibold outline-none mb-1"
                  style={{ color: "#333" }}
                />
                <MarkdownField
                  value={sec.content}
                  onChange={(v) => updateCustomSection(idx, "content", v)}
                  placeholder="Add content..."
                  label=""
                />
                <button
                  onClick={() => removeCustomSection(idx)}
                  className="absolute top-0 right-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity"
                >
                  <Trash size={14} style={{ color: "#EF4444" }} />
                </button>
              </div>
            ))}

            <button
              onClick={addCustomSection}
              className="flex items-center gap-1.5 text-xs font-medium hover:underline"
              style={{ color: "#3B82F6" }}
            >
              <Plus size={12} />
              Add a section
            </button>
          </div>
        </div>

        {/* ═══ RIGHT PANEL — Sidebar ═══ */}
        <div
          className="w-[320px] shrink-0 flex flex-col border-l"
          style={{ borderColor: "#e5e5e5", background: "#fafafa", maxHeight: "90vh" }}
        >
          {/* Sidebar header */}
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid #e5e5e5" }}
          >
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>
              Build your update
            </span>
          </div>

          {/* Tabs */}
          <div
            className="flex shrink-0"
            style={{ borderBottom: "1px solid #e5e5e5" }}
          >
            {(
              [
                { key: "previous", label: "Previous", icon: ClockCountdown },
                { key: "highlights", label: "Highlights", icon: Lightning },
                { key: "drafts", label: "Drafts", icon: NoteBlank },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSidebarTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors"
                style={{
                  color: sidebarTab === tab.key ? "#333" : "#999",
                  borderBottom:
                    sidebarTab === tab.key ? "2px solid #333" : "2px solid transparent",
                }}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {sidebarTab === "previous" && (() => {
              const allUpdates = [...project.updates]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              if (allUpdates.length === 0) {
                return (
                  <div
                    className="rounded-lg p-6 text-center"
                    style={{ background: "white", border: "1px dashed #ddd" }}
                  >
                    <ClockCountdown size={32} style={{ color: "#ccc", margin: "0 auto 8px" }} />
                    <p style={{ fontSize: "13px", color: "#888", fontWeight: 500 }}>
                      No previous updates yet.
                    </p>
                    <p style={{ fontSize: "12px", color: "#aaa" }}>
                      This will be your first!
                    </p>
                  </div>
                );
              }

              const formatDate = (iso: string) => {
                const d = new Date(iso);
                return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              };

              return (
                <div className="space-y-0">
                  {allUpdates.map((update, idx) => {
                    const isStatus = !update.type || update.type === "status-update";
                    const isMemberJoined = update.type === "member-joined";
                    const isProjectCreated = update.type === "project-created";
                    const sColor = isStatus && update.status
                      ? STATUS_COLORS[update.status] || { dot: "#999", color: "#666", bg: "#f5f5f5", label: update.status }
                      : null;
                    const isFirst = idx === 0;

                    return (
                      <div key={update.id} className="flex gap-3 pb-5 group relative">
                        {/* Vertical connector line */}
                        <div className="absolute left-[13px] top-[28px] bottom-0 w-px" style={{ background: "#e5e5e5" }} />

                        {/* Icon */}
                        <div className="relative z-10 shrink-0 mt-0.5">
                          {isStatus && sColor ? (
                            <div
                              className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                              style={{ background: sColor.dot }}
                            >
                              <Circle size={10} weight="fill" style={{ color: "#fff" }} />
                            </div>
                          ) : isMemberJoined ? (
                            <div
                              className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                              style={{ background: "#f0f0f0" }}
                            >
                              <Users size={13} style={{ color: "#888" }} />
                            </div>
                          ) : isProjectCreated ? (
                            <div
                              className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                              style={{ background: "#f0f0f0" }}
                            >
                              <NoteBlank size={13} style={{ color: "#888" }} />
                            </div>
                          ) : (
                            <div
                              className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                              style={{ background: "#f0f0f0" }}
                            >
                              <Circle size={10} weight="fill" style={{ color: "#ccc" }} />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {isStatus ? (
                            isFirst ? (
                              <>
                                {/* Status update card — full for most recent */}
                                <div
                                  className="rounded-lg overflow-hidden"
                                  style={{ border: "1px solid #e5e5e5", background: "white" }}
                                >
                                  {/* Color bar */}
                                  {sColor && (
                                    <div className="h-[3px]" style={{ background: sColor.dot }} />
                                  )}
                                  <div className="p-3.5 space-y-2.5">
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>
                                      {update.title}
                                    </div>

                                    {/* Summary preview */}
                                    {(update.summary || update.content) && (
                                      <div>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>Summary</span>
                                        <p className="mt-0.5 line-clamp-3" style={{ fontSize: "12px", color: "#555", lineHeight: 1.5 }}>
                                          {update.summary || update.content}
                                        </p>
                                      </div>
                                    )}

                                    {/* Author row */}
                                    <div className="flex items-center justify-between pt-1">
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                                          style={{ background: "#999" }}
                                        >
                                          {(update.authorName || update.author || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                          <div style={{ fontSize: "12px", fontWeight: 500, color: "#333" }}>
                                            {update.authorName || update.author}
                                          </div>
                                          <div style={{ fontSize: "11px", color: "#aaa" }}>
                                            {formatDate(update.createdAt)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* Compact card for older status updates */
                              <div className="pt-0.5">
                                <div style={{ fontSize: "13px", fontWeight: 500, color: "#333", lineHeight: 1.4 }}>
                                  {update.title}
                                </div>
                                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                                  {formatDate(update.createdAt)}
                                </div>
                              </div>
                            )
                          ) : (
                            /* Activity event (member-joined, project-created, etc.) */
                            <div className="pt-1">
                              <div style={{ fontSize: "13px", fontWeight: 500, color: "#333", lineHeight: 1.4 }}>
                                {update.title}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {update.authorName && (
                                  <span style={{ fontSize: "12px", color: "#666" }}>
                                    {update.authorName || update.author}
                                  </span>
                                )}
                                <span style={{ fontSize: "11px", color: "#aaa" }}>
                                  {formatDate(update.createdAt)}
                                </span>
                              </div>
                              {/* Member avatars for join events */}
                              {isMemberJoined && update.eventMembers && update.eventMembers.length > 0 && (
                                <div className="flex items-center gap-0.5 mt-1.5">
                                  {update.eventMembers.slice(0, 6).map((m, i) => (
                                    <div
                                      key={i}
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold border-2 border-white -ml-1 first:ml-0"
                                      style={{ background: ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"][i % 6] }}
                                    >
                                      {m.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {sidebarTab === "highlights" && (
              <div
                className="rounded-lg p-6 text-center"
                style={{ background: "white", border: "1px dashed #ddd" }}
              >
                <Lightning size={32} style={{ color: "#ccc", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "#888", fontWeight: 500 }}>
                  Key milestones and completed tasks will appear here
                </p>
              </div>
            )}

            {sidebarTab === "drafts" && (
              <div
                className="rounded-lg p-6 text-center"
                style={{ background: "white", border: "1px dashed #ddd" }}
              >
                <NoteBlank size={32} style={{ color: "#ccc", margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", color: "#888", fontWeight: 500 }}>
                  Save drafts of your updates
                </p>
                <p style={{ fontSize: "12px", color: "#aaa" }}>Coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
      )}
    </>
  );
}