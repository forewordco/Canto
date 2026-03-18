/* ===================================================================
   MEETING BAR — Attendees bar and meeting metadata for meeting docs.
   
   Shows attendees with colored avatar circles, calendar link,
   project link, and add attendee functionality.
   =================================================================== */

import { useState, useRef, useEffect } from "react";
import {
  Users,
  CalendarBlank,
  Plus,
  X,
  UserCircle,
  LinkSimple,
  VideoCamera,
  Briefcase,
  Circle,
  CalendarPlus,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import type { WorkspaceDoc, TeamMemberInfo } from "../../lib/types";
import { useData } from "../../lib/data";

/* ─── Attendee Type ─── */
type AttendeeType = "team" | "client" | "external";

interface ResolvedAttendee {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
  type: AttendeeType;
}

/* ─── Avatar Colors by Type ─── */
const TYPE_BORDER_COLORS: Record<AttendeeType, string> = {
  team: "#3B82F6",
  client: "#F59145",
  external: "#64748B",
};

/* ─── Meeting Status Config ─── */
const MEETING_STATUSES = [
  { value: "on-track", label: "On Track", color: "#22C55E" },
  { value: "at-risk", label: "At Risk", color: "#EAB308" },
  { value: "off-track", label: "Off Track", color: "#EF4444" },
  { value: "on-hold", label: "On Hold", color: "#64748B" },
  { value: "complete", label: "Complete", color: "#3B82F6" },
  { value: "dropped", label: "Dropped", color: "#9CA3AF" },
] as const;

interface MeetingBarProps {
  doc: WorkspaceDoc;
  onUpdate: (updates: Partial<WorkspaceDoc>) => void;
}

export function MeetingBar({ doc, onUpdate }: MeetingBarProps) {
  const { teamMembers, clients, projects } = useData();
  const [addOpen, setAddOpen] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const addRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const [calendarInputOpen, setCalendarInputOpen] = useState(false);
  const [calendarLinkInput, setCalendarLinkInput] = useState("");

  const attendees = doc.attendees || [];

  /* ─── Resolve attendees ─── */
  const resolvedAttendees: ResolvedAttendee[] = attendees.map((a) => {
    const member = teamMembers.find((m) => m.userId === a || m.displayName === a || m.email === a);
    if (member) {
      return {
        id: member.userId,
        name: member.displayName,
        email: member.email,
        avatarUrl: member.avatarUrl,
        avatarColor: member.avatarColor,
        type: "team" as AttendeeType,
      };
    }
    // Check if it's an email
    if (a.includes("@")) {
      return { id: a, name: a.split("@")[0], email: a, type: "external" as AttendeeType };
    }
    return { id: a, name: a, type: "external" as AttendeeType };
  });

  /* ─── Add attendee ─── */
  const addAttendee = (value: string) => {
    if (!value.trim()) return;
    if (attendees.includes(value)) return;
    onUpdate({ attendees: [...attendees, value] });
    setAddQuery("");
    setAddOpen(false);
  };

  const removeAttendee = (id: string) => {
    onUpdate({ attendees: attendees.filter((a) => a !== id) });
  };

  /* ─── Suggestions ─── */
  const suggestions = addQuery.trim()
    ? teamMembers
        .filter(
          (m) =>
            !attendees.includes(m.userId) &&
            !attendees.includes(m.displayName) &&
            (m.displayName.toLowerCase().includes(addQuery.toLowerCase()) ||
              m.email.toLowerCase().includes(addQuery.toLowerCase()))
        )
        .slice(0, 6)
    : teamMembers.filter((m) => !attendees.includes(m.userId) && !attendees.includes(m.displayName)).slice(0, 4);

  /* ─── Close on outside click ─── */
  useEffect(() => {
    if (!addOpen && !statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (addOpen && addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
      if (statusOpen && statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addOpen, statusOpen]);

  useEffect(() => {
    if (addOpen) inputRef.current?.focus();
  }, [addOpen]);

  /* ─── Linked project ─── */
  const linkedProject = doc.linkedProjectId
    ? Object.entries(projects).find(([name]) => name === doc.linkedProjectId)?.[1]
    : doc.projectName
    ? Object.entries(projects).find(([name]) => name === doc.projectName)?.[1]
    : null;

  return (
    <div className="space-y-3">
      {/* Attendees row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" style={{ color: "var(--text-quaternary)" }} />
          <span style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500 }}>Attendees</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {resolvedAttendees.map((a) => (
            <div key={a.id} className="group relative inline-flex items-center">
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors"
                style={{
                  background: "var(--neutral-50)",
                  border: `1.5px solid ${TYPE_BORDER_COLORS[a.type]}`,
                }}
              >
                {a.avatarUrl ? (
                  <img src={a.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                    style={{
                      background: a.avatarColor || TYPE_BORDER_COLORS[a.type],
                      fontSize: "8px",
                      fontWeight: 700,
                    }}
                  >
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="truncate max-w-[80px]" style={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: 500 }}>
                  {a.name}
                </span>
                <button
                  onClick={() => removeAttendee(a.id)}
                  className="hidden group-hover:flex w-3.5 h-3.5 rounded-full items-center justify-center ml-0.5"
                  style={{ background: "var(--neutral-200)", color: "var(--text-quaternary)" }}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add attendee button */}
          <div ref={addRef} className="relative">
            <button
              onClick={() => setAddOpen(!addOpen)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ border: "1.5px dashed var(--border-default)", color: "var(--text-quaternary)" }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {addOpen && (
                <motion.div
                  className="absolute top-full left-0 mt-1 w-56 rounded-[8px] shadow-lg border overflow-hidden z-50"
                  style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                >
                  <div className="p-2">
                    <input
                      ref={inputRef}
                      value={addQuery}
                      onChange={(e) => setAddQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && addQuery.trim()) {
                          addAttendee(addQuery.trim());
                        }
                        if (e.key === "Escape") setAddOpen(false);
                      }}
                      placeholder="Name or email..."
                      className="w-full px-2.5 py-1.5 rounded-[5px] outline-none"
                      style={{
                        background: "var(--neutral-50)",
                        border: "1px solid var(--border-default)",
                        fontSize: "12px",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto">
                    {suggestions.map((m) => (
                      <button
                        key={m.userId}
                        onClick={() => addAttendee(m.userId)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      >
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ background: m.avatarColor || "#3B82F6", fontSize: "9px", fontWeight: 700 }}
                          >
                            {m.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>
                            {m.displayName}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-quaternary)" }}>{m.email}</div>
                        </div>
                      </button>
                    ))}
                    {addQuery.includes("@") && !suggestions.find((s) => s.email === addQuery) && (
                      <button
                        onClick={() => addAttendee(addQuery)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      >
                        <UserCircle className="w-5 h-5" style={{ color: "var(--text-quaternary)" }} />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          Add external: {addQuery}
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Meeting metadata row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Meeting date */}
        {doc.meetingDate && (
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
            <CalendarBlank className="w-3.5 h-3.5" />
            {doc.meetingDate}
          </div>
        )}

        {/* Calendar link */}
        {doc.gcalLink && (
          <a
            href={doc.gcalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "#4285F4", fontSize: "11px", fontWeight: 500 }}
          >
            <LinkSimple className="w-3 h-3" />
            Calendar
          </a>
        )}

        {/* Meet link */}
        {doc.gcalMeetLink && (
          <a
            href={doc.gcalMeetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "#00897B", fontSize: "11px", fontWeight: 500 }}
          >
            <VideoCamera className="w-3 h-3" />
            Join Meet
          </a>
        )}

        {/* Linked project */}
        {linkedProject && (
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
            <Briefcase className="w-3.5 h-3.5" />
            <span style={{ fontWeight: 500 }}>{linkedProject.name}</span>
          </div>
        )}

        {/* Meeting status picker */}
        <div ref={statusRef} className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ fontSize: "11px", fontWeight: 500 }}
          >
            <Circle
              className="w-2.5 h-2.5"
              weight="fill"
              style={{
                color: doc.meetingStatus
                  ? MEETING_STATUSES.find((s) => s.value === doc.meetingStatus)?.color || "var(--text-quaternary)"
                  : "var(--text-quaternary)",
              }}
            />
            <span style={{ color: doc.meetingStatus ? "var(--text-secondary)" : "var(--text-quaternary)" }}>
              {doc.meetingStatus
                ? MEETING_STATUSES.find((s) => s.value === doc.meetingStatus)?.label || "Status"
                : "Set status"}
            </span>
          </button>

          <AnimatePresence>
            {statusOpen && (
              <motion.div
                className="absolute bottom-full left-0 mb-1 w-40 rounded-[8px] shadow-lg border py-1 z-50"
                style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.1 }}
              >
                {MEETING_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => {
                      onUpdate({ meetingStatus: doc.meetingStatus === s.value ? undefined : s.value as any });
                      setStatusOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                    style={{ fontSize: "12px" }}
                  >
                    <Circle className="w-3 h-3" weight="fill" style={{ color: s.color }} />
                    <span style={{
                      color: doc.meetingStatus === s.value ? "var(--text-primary)" : "var(--text-secondary)",
                      fontWeight: doc.meetingStatus === s.value ? 600 : 400,
                    }}>
                      {s.label}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Calendar link add */}
        {!doc.gcalLink && (
          <div className="relative">
            {calendarInputOpen ? (
              <div className="flex items-center gap-1">
                <input
                  value={calendarLinkInput}
                  onChange={(e) => setCalendarLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && calendarLinkInput.trim()) {
                      onUpdate({ gcalLink: calendarLinkInput.trim() });
                      setCalendarLinkInput("");
                      setCalendarInputOpen(false);
                    }
                    if (e.key === "Escape") setCalendarInputOpen(false);
                  }}
                  placeholder="Paste calendar link..."
                  autoFocus
                  className="px-2 py-0.5 rounded-[4px] outline-none"
                  style={{
                    background: "var(--neutral-100)",
                    border: "1px solid var(--border-default)",
                    fontSize: "11px",
                    color: "var(--text-primary)",
                    width: "180px",
                  }}
                />
                <button
                  onClick={() => setCalendarInputOpen(false)}
                  className="p-0.5 rounded-[3px] hover:bg-black/[0.04]"
                  style={{ color: "var(--text-quaternary)" }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCalendarInputOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 500 }}
              >
                <CalendarPlus className="w-3 h-3" />
                Add calendar
              </button>
            )}
          </div>
        )}

        {/* Meeting date input */}
        {!doc.meetingDate && (
          <div className="relative">
            <input
              type="date"
              onChange={(e) => {
                if (e.target.value) {
                  const date = new Date(e.target.value);
                  const formatted = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
                  onUpdate({ meetingDate: formatted });
                }
              }}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
            />
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-quaternary)", fontSize: "11px", fontWeight: 500 }}
            >
              <CalendarBlank className="w-3 h-3" />
              Set date
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MeetingBar;