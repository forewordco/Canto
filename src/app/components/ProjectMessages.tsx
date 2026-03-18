/* ===================================================================
   PROJECT MESSAGES — Notes & meeting notes sub-view.

   Shows a list of project notes (from project.notes) with
   note type badges, attendees, and block-based content preview.
   Supports adding new notes.

   Phase 5-8 of Canto build plan.
   =================================================================== */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  NotePencil,
  VideoCamera,
  Users,
  CalendarBlank,
  CaretDown,
  CaretRight,
  DotsThree,
  Trash,
  PencilSimple,
  MagnifyingGlass,
  X,
  Check,
  Clock,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { TaskItem, NoteType } from "../lib/types";

/* ─── Note type config ─── */

interface NoteTypeInfo {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

const NOTE_TYPES: Record<string, NoteTypeInfo> = {
  note: {
    label: "Note",
    icon: NotePencil,
    color: "oklch(0.55 0.2 280)",
    bg: "oklch(0.55 0.2 280 / 0.08)",
  },
  meeting: {
    label: "Meeting",
    icon: VideoCamera,
    color: "oklch(0.65 0.15 180)",
    bg: "oklch(0.65 0.15 180 / 0.08)",
  },
  standup: {
    label: "Standup",
    icon: Users,
    color: "oklch(0.72 0.17 55)",
    bg: "oklch(0.72 0.17 55 / 0.08)",
  },
  brainstorm: {
    label: "Brainstorm",
    icon: NotePencil,
    color: "oklch(0.6 0.2 310)",
    bg: "oklch(0.6 0.2 310 / 0.08)",
  },
};

/* ─── Helpers ─── */

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(d);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    if (diff < 7) return `${diff}d ago`;

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return "";
  }
}

function getContentPreview(note: TaskItem): string {
  if (note.descriptionBlocks && note.descriptionBlocks.length > 0) {
    return note.descriptionBlocks
      .filter((b) => b.type === "paragraph" || b.type === "heading")
      .map((b) => b.content)
      .filter(Boolean)
      .join(" ")
      .slice(0, 120);
  }
  if (note.content) return note.content.slice(0, 120);
  return "";
}

/* ─── Props ─── */

interface ProjectMessagesProps {
  notes: TaskItem[];
  onAddNote: (note: TaskItem) => void;
  onUpdateNote: (noteId: string, updates: Partial<TaskItem>) => void;
  onDeleteNote: (noteId: string) => void;
  onNoteClick?: (noteId: string) => void;
  projectColor?: string;
}

/* ─── Note Card ─── */

function NoteCard({
  note,
  onClick,
  onDelete,
}: {
  note: TaskItem;
  onClick?: () => void;
  onDelete?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const typeInfo = NOTE_TYPES[note.noteType || "note"] || NOTE_TYPES.note;
  const TypeIcon = typeInfo.icon;
  const preview = getContentPreview(note);
  const dateLabel = formatDate(note.createdAt || note.date);

  return (
    <div
      onClick={onClick}
      className="group/note rounded-[8px] p-4 cursor-pointer transition-all hover:shadow-sm"
      style={{
        background: "var(--surface-bg)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2 mb-2">
        {/* Type badge */}
        <span
          className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px]"
          style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: "10px", fontWeight: 600 }}
        >
          <TypeIcon className="w-3 h-3" />
          {typeInfo.label}
        </span>

        {/* Date */}
        {dateLabel && (
          <span
            className="flex items-center gap-1 shrink-0"
            style={{ fontSize: "11px", color: "var(--text-quaternary)" }}
          >
            <Clock className="w-3 h-3" />
            {dateLabel}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Attendees */}
        {note.attendees && note.attendees.length > 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <Users className="w-3 h-3" style={{ color: "var(--text-quaternary)" }} />
            <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
              {note.attendees.length}
            </span>
          </div>
        )}

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-[4px] opacity-0 group-hover/note:opacity-100 transition-opacity hover:bg-black/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
          >
            <DotsThree className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-1 py-1 rounded-[6px] shadow-lg z-50 min-w-[120px]"
                style={{
                  background: "var(--surface-bg)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04]"
                  style={{ fontSize: "12px", color: "oklch(0.7 0.18 25)" }}
                >
                  <Trash className="w-3.5 h-3.5" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Title */}
      <h3
        className="mb-1"
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--text-primary)",
          lineHeight: 1.3,
        }}
      >
        {note.title || "Untitled"}
      </h3>

      {/* Content preview */}
      {preview && (
        <p
          className="line-clamp-2"
          style={{
            fontSize: "12px",
            color: "var(--text-tertiary)",
            lineHeight: 1.5,
          }}
        >
          {preview}
        </p>
      )}

      {/* Attendees list (if meeting) */}
      {note.attendees && note.attendees.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {note.attendees.slice(0, 4).map((a, i) => {
            const initials = a
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <div
                key={i}
                className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: `oklch(0.82 0.12 ${(i * 80 + 25) % 360})` }}
                title={a}
              >
                <span style={{ color: "white", fontSize: "7px", fontWeight: 700 }}>{initials}</span>
              </div>
            );
          })}
          {note.attendees.length > 4 && (
            <span style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>
              +{note.attendees.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export function ProjectMessages({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onNoteClick,
  projectColor,
}: ProjectMessagesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [addingType, setAddingType] = useState<NoteType | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingType) setTimeout(() => inputRef.current?.focus(), 50);
  }, [addingType]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        getContentPreview(n).toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  // Group by type
  const meetings = filteredNotes.filter((n) => n.noteType === "meeting" || n.noteType === "standup");
  const notesList = filteredNotes.filter((n) => !n.noteType || n.noteType === "note" || n.noteType === "brainstorm");

  const handleAddNote = useCallback(
    (type: NoteType) => {
      if (!newTitle.trim()) {
        setAddingType(null);
        return;
      }
      const note: TaskItem = {
        id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: newTitle.trim(),
        completed: false,
        status: "todo",
        noteType: type,
        createdAt: new Date().toISOString(),
      };
      if (type === "meeting" || type === "standup") {
        note.attendees = [];
      }
      onAddNote(note);
      setNewTitle("");
      setAddingType(null);
    },
    [newTitle, onAddNote]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--text-primary)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em" }}>
            MESSAGES
          </span>
          <span
            className="px-1.5 py-0.5 rounded"
            style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 600 }}
          >
            {notes.length}
          </span>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
            style={{
              color: showSearch ? "var(--accent-primary)" : "var(--text-tertiary)",
              fontSize: "12px",
            }}
          >
            <MagnifyingGlass className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setAddingType("note"); setNewTitle(""); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--text-tertiary)", fontSize: "12px" }}
          >
            <NotePencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Note</span>
          </button>
          <button
            onClick={() => { setAddingType("meeting"); setNewTitle(""); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--text-tertiary)", fontSize: "12px" }}
          >
            <VideoCamera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Meeting</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[8px]"
              style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
            >
              <MagnifyingGlass className="w-4 h-4 shrink-0" style={{ color: "var(--text-quaternary)" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: "13px", color: "var(--text-primary)" }}
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-0.5 rounded" style={{ color: "var(--text-quaternary)" }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add note inline */}
      <AnimatePresence>
        {addingType && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-[8px]"
              style={{ background: "var(--neutral-50)", border: "1px solid var(--border-default)" }}
            >
              {(() => {
                const info = NOTE_TYPES[addingType] || NOTE_TYPES.note;
                const Icon = info.icon;
                return <Icon className="w-4 h-4 shrink-0" style={{ color: info.color }} />;
              })()}
              <input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNote(addingType);
                  if (e.key === "Escape") setAddingType(null);
                }}
                placeholder={`New ${NOTE_TYPES[addingType]?.label || "note"} title...`}
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: "13px", color: "var(--text-primary)" }}
              />
              <button
                onClick={() => handleAddNote(addingType)}
                className="p-1 rounded-[4px] hover:bg-black/[0.04] transition-colors"
                style={{ color: "var(--accent-primary)" }}
              >
                <Check className="w-4 h-4" weight="bold" />
              </button>
              <button
                onClick={() => setAddingType(null)}
                className="p-1 rounded-[4px] hover:bg-black/[0.04] transition-colors"
                style={{ color: "var(--text-quaternary)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes grid */}
      {notesList.length > 0 && (
        <div>
          <p className="mb-2" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-quaternary)", letterSpacing: "0.05em" }}>
            NOTES
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notesList.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onNoteClick?.(note.id)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Meetings list */}
      {meetings.length > 0 && (
        <div>
          <p className="mb-2" style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-quaternary)", letterSpacing: "0.05em" }}>
            MEETINGS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {meetings.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onNoteClick?.(note.id)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredNotes.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-12 rounded-[8px]"
          style={{ color: "var(--text-quaternary)", background: "var(--neutral-50)" }}
        >
          <NotePencil className="w-8 h-8 mb-2" style={{ color: "var(--text-quaternary)" }} />
          <p style={{ fontSize: "14px", fontWeight: 500 }}>
            {searchQuery ? "No matching messages" : "No messages yet"}
          </p>
          <p className="mt-1" style={{ fontSize: "12px" }}>
            {searchQuery ? "Try a different search" : "Create a note or meeting to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
