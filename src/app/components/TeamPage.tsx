/* ═══════════════════════════════════════════════════════════
   TEAM PAGE — Team members list/grid, roles, departments,
   active timers, and member management.

   Phase 10 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  UsersThree,
  Plus,
  Envelope,
  MapPin,
  Clock,
  DotsThree,
  Trash,
  PencilSimple,
  X,
  UserCircle,
  Buildings,
  Globe,
  Check,
  CaretDown,
  SquaresFour,
  List,
  Timer,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData } from "../lib/data";
import { useAuth } from "../lib/auth";
import type { TeamMemberInfo } from "../lib/types";
import { ResponsiveModal } from "./ResponsiveModal";
import { api } from "../lib/api";
import { toast } from "sonner";
import { ListToolbar } from "./ListToolbar";

/* ─── Invitation Types ─── */
interface PendingInvite {
  email: string;
  role?: string;
  message?: string;
  inviterName?: string;
  status: "pending" | "accepted";
  createdAt: string;
  emailSent?: boolean;
  acceptedAt?: string;
}

/* ─── View Mode ─── */
type ViewMode = "grid" | "list";

/* ─── Avatar Helper ─── */
function MemberAvatar({
  member,
  size = 40,
}: {
  member: TeamMemberInfo;
  size?: number;
}) {
  const initials = member.displayName
    ? member.displayName
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: member.avatarColor || "oklch(0.82 0.12 25)",
      }}
    >
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span
          style={{
            color: "white",
            fontSize: size * 0.32,
            fontWeight: 700,
            textShadow: "0 1px 1px oklch(0 0 0 / 0.1)",
          }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}

/* ─── Add/Edit Member Modal ─── */
function MemberModal({
  member,
  onClose,
  onSave,
}: {
  member: Partial<TeamMemberInfo> | null;
  onClose: () => void;
  onSave: (data: TeamMemberInfo) => void;
}) {
  const isEdit = !!member?.userId;
  const [form, setForm] = useState<Partial<TeamMemberInfo>>({
    displayName: "",
    email: "",
    role: "",
    department: "",
    timezone: "",
    avatarColor: "oklch(0.82 0.12 25)",
    ...member,
  });

  const avatarColors = [
    "oklch(0.82 0.12 25)",
    "oklch(0.78 0.13 260)",
    "oklch(0.75 0.12 172)",
    "oklch(0.85 0.13 88)",
    "oklch(0.75 0.15 320)",
    "oklch(0.70 0.15 140)",
    "oklch(0.80 0.10 50)",
    "oklch(0.65 0.15 210)",
  ];

  const handleSubmit = () => {
    if (!form.displayName || !form.email) return;
    const data: TeamMemberInfo = {
      userId: form.userId || `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      displayName: form.displayName!,
      email: form.email!,
      role: form.role,
      department: form.department,
      timezone: form.timezone,
      avatarUrl: form.avatarUrl,
      avatarColor: form.avatarColor,
      isPlaceholder: form.isPlaceholder,
    };
    onSave(data);
    onClose();
  };

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title={isEdit ? "Edit Member" : "Add Team Member"}
    >
      <div className="space-y-4">
        {/* Avatar color picker */}
        <div className="flex items-center gap-3">
          <MemberAvatar
            member={{ userId: "", displayName: form.displayName || "", email: form.email || "", avatarColor: form.avatarColor }}
            size={48}
          />
          <div className="flex gap-1.5 flex-wrap">
            {avatarColors.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c,
                  outline: form.avatarColor === c ? "2px solid var(--accent-primary)" : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Name *</label>
          <input
            value={form.displayName || ""}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            placeholder="Full name"
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none transition-colors"
            style={{
              background: "var(--neutral-100)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Email *</label>
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@example.com"
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
            style={{
              background: "var(--neutral-100)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Role */}
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Role</label>
            <input
              value={form.role || ""}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              placeholder="Designer, Developer..."
              className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
              style={{
                background: "var(--neutral-100)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Department</label>
            <input
              value={form.department || ""}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="Engineering, Design..."
              className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
              style={{
                background: "var(--neutral-100)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              }}
            />
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Timezone</label>
          <input
            value={form.timezone || ""}
            onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            placeholder="America/New_York"
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
            style={{
              background: "var(--neutral-100)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-[6px] text-[13px] font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.displayName || !form.email}
          className="px-4 py-2 rounded-[6px] text-[13px] font-medium text-white disabled:opacity-40"
          style={{ background: "var(--accent-primary)" }}
        >
          {isEdit ? "Save Changes" : "Add Member"}
        </button>
      </div>
    </ResponsiveModal>
  );
}

/* ─── Member Card (Grid) ─── */
function MemberCard({
  member,
  onEdit,
  onDelete,
  projectCount,
}: {
  member: TeamMemberInfo;
  onEdit: () => void;
  onDelete: () => void;
  projectCount: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[10px] p-4 group relative"
      style={{
        background: "var(--surface-bg)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* Actions menu */}
      <div className="absolute top-3 right-3">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1.5 rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5"
          style={{ color: "var(--text-quaternary)" }}
        >
          <DotsThree size={16} weight="bold" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div
              className="absolute right-0 top-8 z-20 w-36 rounded-[8px] py-1 shadow-lg"
              style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}
            >
              <button
                onClick={() => { onEdit(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-black/[0.03] transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <PencilSimple size={14} /> Edit
              </button>
              <button
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-black/[0.03] transition-colors"
                style={{ color: "oklch(0.7 0.18 25)" }}
              >
                <Trash size={14} /> Remove
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col items-center text-center">
        <MemberAvatar member={member} size={56} />
        <h3 className="mt-3 text-[14px] font-semibold truncate max-w-full" style={{ color: "var(--text-primary)" }}>
          {member.displayName}
        </h3>
        {member.role && (
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {member.role}
          </p>
        )}
        {member.department && (
          <span
            className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: "var(--azure-100)", color: "var(--azure-600)" }}
          >
            <Buildings size={11} />
            {member.department}
          </span>
        )}

        <div className="flex items-center gap-3 mt-3 pt-3 w-full border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex-1 text-center">
            <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>Projects</p>
            <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>{projectCount}</p>
          </div>
          <div className="w-px h-6" style={{ background: "var(--border-subtle)" }} />
          <div className="flex-1 text-center">
            <a
              href={`mailto:${member.email}`}
              className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline"
              style={{ color: "var(--accent-primary)" }}
            >
              <Envelope size={12} />
              Email
            </a>
          </div>
        </div>
      </div>

      {member.isPlaceholder && (
        <div className="absolute top-3 left-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--mustard-100)", color: "var(--mustard-700)" }}>
            Placeholder
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Member Row (List) ─── */
function MemberRow({
  member,
  onEdit,
  onDelete,
  projectCount,
}: {
  member: TeamMemberInfo;
  onEdit: () => void;
  onDelete: () => void;
  projectCount: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 px-4 py-3 rounded-[8px] group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      style={{ borderBottom: "1px solid var(--border-subtle)" }}
    >
      <MemberAvatar member={member} size={36} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {member.displayName}
          </span>
          {member.isPlaceholder && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--mustard-100)", color: "var(--mustard-700)" }}>
              Placeholder
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {member.role && (
            <span className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>{member.role}</span>
          )}
          {member.department && (
            <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-quaternary)" }}>
              <Buildings size={11} />
              {member.department}
            </span>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
        <Envelope size={13} />
        <span className="truncate max-w-[180px]">{member.email}</span>
      </div>

      {member.timezone && (
        <div className="hidden md:flex items-center gap-1.5 text-[12px]" style={{ color: "var(--text-quaternary)" }}>
          <Globe size={13} />
          <span>{member.timezone}</span>
        </div>
      )}

      <span className="hidden sm:block text-[12px] tabular-nums min-w-[60px] text-center" style={{ color: "var(--text-tertiary)" }}>
        {projectCount} proj
      </span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded-[6px] hover:bg-black/5" style={{ color: "var(--text-tertiary)" }}>
          <PencilSimple size={14} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-[6px] hover:bg-black/5" style={{ color: "oklch(0.7 0.18 25)" }}>
          <Trash size={14} />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Invite Modal ─── */
function InviteModal({
  onClose,
  inviterName,
}: {
  onClose: () => void;
  inviterName: string;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Load pending invites on mount
  useEffect(() => {
    api.get<{ invites: PendingInvite[] }>("/invite/pending").then(({ data }) => {
      if (data?.invites) setPendingInvites(data.invites);
    }).catch(() => {}).finally(() => setLoadingInvites(false));
  }, []);

  const handleSend = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await api.post<{ success: boolean; emailSent: boolean; message?: string }>(
        "/invite/send",
        { email: email.trim(), role, message, inviterName }
      );
      if (error) {
        toast.error(error);
      } else if (data?.emailSent) {
        toast.success(`Invitation sent to ${email}`);
        setPendingInvites((prev) => [
          { email: email.trim().toLowerCase(), role, message, status: "pending", createdAt: new Date().toISOString(), emailSent: true },
          ...prev,
        ]);
        setEmail("");
        setRole("");
        setMessage("");
      } else {
        toast.success(data?.message || "Invitation saved (email delivery pending)");
        setPendingInvites((prev) => [
          { email: email.trim().toLowerCase(), role, status: "pending", createdAt: new Date().toISOString(), emailSent: false },
          ...prev,
        ]);
        setEmail("");
        setRole("");
        setMessage("");
      }
    } catch (err) {
      toast.error("Failed to send invitation");
      console.error("[Invite] Send error:", err);
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (inviteEmail: string) => {
    try {
      const { error } = await api.del(`/invite/${encodeURIComponent(inviteEmail)}`);
      if (error) {
        toast.error(error);
      } else {
        setPendingInvites((prev) => prev.filter((i) => i.email !== inviteEmail));
        toast.success("Invitation revoked");
      }
    } catch {
      toast.error("Failed to revoke invitation");
    }
  };

  const pendingOnly = pendingInvites.filter((i) => i.status === "pending");

  return (
    <ResponsiveModal open={true} onClose={onClose} title="Invite Team Members">
      <div className="space-y-4">
        {/* Email input */}
        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
            Email address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
            style={{
              background: "var(--neutral-100)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          />
        </div>

        {/* Role (optional) */}
        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
            Role (optional)
          </label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Designer, Producer, Editor..."
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
            style={{
              background: "var(--neutral-100)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
          />
        </div>

        {/* Personal message (optional) */}
        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>
            Personal message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hey! I'd love for you to join our team on Canto..."
            rows={2}
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none resize-none"
            style={{
              background: "var(--neutral-100)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
            }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] text-[13px] font-medium text-white disabled:opacity-40 transition-opacity"
          style={{ background: "#6159E1" }}
        >
          {sending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <Envelope size={15} weight="bold" />
          )}
          {sending ? "Sending..." : "Send Invitation"}
        </button>

        {/* Pending invitations */}
        {pendingOnly.length > 0 && (
          <div className="pt-2">
            <p className="text-[12px] font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
              Pending Invitations ({pendingOnly.length})
            </p>
            <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
              {pendingOnly.map((inv) => (
                <div
                  key={inv.email}
                  className="flex items-center gap-2 px-3 py-2 rounded-[6px]"
                  style={{ background: "var(--neutral-100)" }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--azure-100)" }}
                  >
                    <Envelope size={13} style={{ color: "var(--azure-600)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {inv.email}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                      {inv.role ? `${inv.role} · ` : ""}
                      {inv.emailSent ? "Email sent" : "Saved"} · {new Date(inv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevoke(inv.email)}
                    className="p-1 rounded-[4px] hover:bg-black/5 transition-colors shrink-0"
                    style={{ color: "var(--text-quaternary)" }}
                    title="Revoke invitation"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEAM PAGE — Main Export
   ═══════════════════════════════════════════════════════════ */

export function TeamPage() {
  const { teamMembers, setTeamMembers, projects, loadError, reload } = useData();
  const { user, profile } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [modalMember, setModalMember] = useState<Partial<TeamMemberInfo> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    teamMembers.forEach((m) => { if (m.department) depts.add(m.department); });
    return Array.from(depts).sort();
  }, [teamMembers]);

  // Count projects per member
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(projects).forEach((p) => {
      p.members?.forEach((userId) => {
        counts[userId] = (counts[userId] || 0) + 1;
      });
    });
    return counts;
  }, [projects]);

  // Filtered members
  const filtered = useMemo(() => {
    let list = [...teamMembers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q) ||
          m.department?.toLowerCase().includes(q)
      );
    }
    if (deptFilter !== "all") {
      list = list.filter((m) => m.department === deptFilter);
    }
    return list;
  }, [teamMembers, search, deptFilter]);

  const handleAdd = useCallback(() => {
    setModalMember(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((m: TeamMemberInfo) => {
    setModalMember(m);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (userId: string) => {
      setTeamMembers(teamMembers.filter((m) => m.userId !== userId));
    },
    [teamMembers, setTeamMembers]
  );

  const handleSave = useCallback(
    (data: TeamMemberInfo) => {
      const existing = teamMembers.find((m) => m.userId === data.userId);
      if (existing) {
        setTeamMembers(teamMembers.map((m) => (m.userId === data.userId ? data : m)));
      } else {
        setTeamMembers([...teamMembers, data]);
      }
    },
    [teamMembers, setTeamMembers]
  );

  /* ─── Data load error fallback ─── */
  if (loadError && teamMembers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto" style={{ background: "oklch(0.95 0.04 60)" }}>
            <Warning className="w-6 h-6" style={{ color: "oklch(0.7 0.15 60)" }} weight="fill" />
          </div>
          <div>
            <h3 className="mb-1" style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}>Unable to load team</h3>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.5 }}>{loadError}</p>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
            style={{ background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500 }}
          >
            <ArrowClockwise className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700 }}>Team</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium hover:opacity-90 transition-opacity"
            style={{ background: "#6159E1", color: "white" }}
          >
            <Envelope size={15} weight="bold" />
            Invite
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
            style={{ background: "var(--accent-primary)" }}
          >
            <Plus size={15} weight="bold" />
            Add Member
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        {/* ListToolbar + Department filter */}
        <div className="flex items-center gap-3 flex-1">
          <ListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search team…"
            activeFilterCount={deptFilter !== "all" ? 1 : 0}
            onFilterClick={() => setDeptFilter("all")}
            hideSort
            hideGroup
            hideOptions
          />
          {departments.length > 0 && (
            <div className="relative">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-[6px] text-[13px] outline-none cursor-pointer"
                style={{
                  background: "var(--neutral-100)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <CaretDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-quaternary)" }} />
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-[6px] p-0.5" style={{ background: "var(--neutral-100)", border: "1px solid var(--border-default)" }}>
          <button
            onClick={() => setViewMode("grid")}
            className="p-1.5 rounded-[4px] transition-colors"
            style={{
              background: viewMode === "grid" ? "var(--surface-bg)" : "transparent",
              color: viewMode === "grid" ? "var(--text-primary)" : "var(--text-quaternary)",
              boxShadow: viewMode === "grid" ? "0 1px 2px oklch(0 0 0 / 0.06)" : "none",
            }}
          >
            <SquaresFour size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="p-1.5 rounded-[4px] transition-colors"
            style={{
              background: viewMode === "list" ? "var(--surface-bg)" : "transparent",
              color: viewMode === "list" ? "var(--text-primary)" : "var(--text-quaternary)",
              boxShadow: viewMode === "list" ? "0 1px 2px oklch(0 0 0 / 0.06)" : "none",
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-[14px] flex items-center justify-center mb-4" style={{ background: "var(--neutral-100)" }}>
            <UsersThree size={28} style={{ color: "var(--text-quaternary)" }} />
          </div>
          <h3 className="text-[16px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            {search ? "No results found" : "No team members yet"}
          </h3>
          <p className="text-[13px] max-w-sm" style={{ color: "var(--text-tertiary)" }}>
            {search
              ? "Try adjusting your search or filters."
              : "Add your first team member to start collaborating on projects."}
          </p>
          {!search && (
            <button
              onClick={handleAdd}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium text-white"
              style={{ background: "var(--accent-primary)" }}
            >
              <Plus size={14} weight="bold" />
              Add Member
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((m) => (
              <MemberCard
                key={m.userId}
                member={m}
                onEdit={() => handleEdit(m)}
                onDelete={() => handleDelete(m.userId)}
                projectCount={projectCounts[m.userId] || 0}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((m) => (
              <MemberRow
                key={m.userId}
                member={m}
                onEdit={() => handleEdit(m)}
                onDelete={() => handleDelete(m.userId)}
                projectCount={projectCounts[m.userId] || 0}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Member Modal */}
      {showModal && (
        <MemberModal
          member={modalMember}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          inviterName={profile?.displayName || user?.email || ""}
        />
      )}
    </div>
  );
}

export default TeamPage;