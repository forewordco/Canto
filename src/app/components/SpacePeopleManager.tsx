/* ═══════════════════════════════════════════════════════════
   SPACE PEOPLE MANAGER — Modal for managing Members,
   Clients, and Viewers within a Space.

   Three tabs: Members, Clients, Viewers.
   Each tab has an add form (name + email) and a list of
   existing people with remove/edit/role-switch capabilities.
   Uses spaceId + live data from useData() to avoid stale props.
   ═══════════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Plus,
  Trash,
  User,
  UsersThree,
  Briefcase,
  Eye,
  EnvelopeSimple,
  PencilSimple,
  Check,
  MagnifyingGlass,
  CaretDown,
  ArrowsLeftRight,
  UserPlus,
  Crown,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData } from "../lib/data";
import type { SpacePerson, SpacePersonRole } from "../lib/types";
import { AVATAR_COLORS } from "../lib/types";
import { toast } from "sonner";
import { haptic } from "../lib/haptics";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ProjectIcon } from "./ProjectIcon";
import { createPortal } from "react-dom";

/* ─── Tab Config ─── */

const ROLE_TABS: {
  role: SpacePersonRole;
  label: string;
  singularLabel: string;
  icon: typeof UsersThree;
  description: string;
  color: string;
}[] = [
  {
    role: "member",
    label: "Members",
    singularLabel: "member",
    icon: UsersThree,
    description: "Full access to projects, tasks, and docs in this space",
    color: "oklch(0.65 0.16 250)",
  },
  {
    role: "client",
    label: "Clients",
    singularLabel: "client",
    icon: Briefcase,
    description: "Can view deliverables and leave comments",
    color: "oklch(0.7 0.15 155)",
  },
  {
    role: "viewer",
    label: "Viewers",
    singularLabel: "viewer",
    icon: Eye,
    description: "View-only access to space content",
    color: "oklch(0.65 0.12 290)",
  },
];

function generatePersonId() {
  return `person-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ═══════════════════════════════════════════════════════════
   AVATAR COMPONENT
   ═══════════════════════════════════════════════════════════ */

function PersonAvatar({
  person,
  size = 32,
  fontSize = 11,
}: {
  person: SpacePerson;
  size?: number;
  fontSize?: number;
}) {
  const initials = getInitials(person.name);
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: person.avatarColor || "var(--neutral-300)",
      }}
    >
      {person.avatarUrl ? (
        <img src={person.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span
          style={{
            color: "white",
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            textShadow: "0 1px 1px oklch(0 0 0 / 0.1)",
          }}
        >
          {initials || "?"}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROLE SWITCHER DROPDOWN
   ═══════════════════════════════════════════════════════════ */

function RoleSwitcher({
  currentRole,
  onSwitch,
}: {
  currentRole: SpacePersonRole;
  onSwitch: (newRole: SpacePersonRole) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const currentTab = ROLE_TABS.find((t) => t.role === currentRole)!;
  const otherTabs = ROLE_TABS.filter((t) => t.role !== currentRole);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => {
          if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.left });
          }
          setOpen(!open);
        }}
        className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        style={{ fontSize: "11px", color: currentTab.color, fontWeight: 500 }}
        title="Change role"
      >
        <currentTab.icon size={11} weight="fill" />
        {currentTab.singularLabel}
        <CaretDown size={9} weight="bold" />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="fixed z-[9999] w-[200px] py-1 rounded-[10px] border shadow-lg overflow-hidden"
              style={{
                top: pos.top,
                left: pos.left,
                background: "var(--surface-bg)",
                borderColor: "var(--border-default)",
              }}
            >
              <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>
                Move to
              </p>
              {otherTabs.map((tab) => (
                <button
                  key={tab.role}
                  onClick={() => {
                    setOpen(false);
                    onSwitch(tab.role);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-[7px] text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                  style={{ fontSize: "13px", color: "var(--text-secondary)" }}
                >
                  <tab.icon size={15} weight="regular" style={{ color: tab.color }} />
                  {tab.label}
                  <ArrowsLeftRight size={11} className="ml-auto" style={{ color: "var(--text-quaternary)" }} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   PERSON ROW — with inline edit, role switch, remove
   ═══════════════════════════════════════════════════════════ */

function PersonRow({
  person,
  role,
  onRemove,
  onUpdate,
  onSwitchRole,
}: {
  person: SpacePerson;
  role: SpacePersonRole;
  onRemove: () => void;
  onUpdate: (updates: Partial<SpacePerson>) => void;
  onSwitchRole: (newRole: SpacePersonRole) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(person.name);
  const [editEmail, setEditEmail] = useState(person.email || "");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const trimName = editName.trim();
    if (!trimName) {
      setEditName(person.name);
      setEditEmail(person.email || "");
      setEditing(false);
      return;
    }
    const updates: Partial<SpacePerson> = {};
    if (trimName !== person.name) updates.name = trimName;
    const trimEmail = editEmail.trim();
    if (trimEmail !== (person.email || "")) updates.email = trimEmail || undefined;
    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="group flex items-center gap-2.5 px-3 py-2 rounded-[8px] hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors"
    >
      <PersonAvatar person={person} size={32} fontSize={11} />

      {editing ? (
        <div className="flex-1 min-w-0 space-y-1">
          <input
            ref={nameRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") {
                setEditName(person.name);
                setEditEmail(person.email || "");
                setEditing(false);
              }
            }}
            className="w-full bg-transparent outline-none border-b pb-0.5"
            style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", borderColor: "var(--accent-primary)" }}
          />
          <div className="flex items-center gap-1">
            <EnvelopeSimple size={11} style={{ color: "var(--text-quaternary)" }} />
            <input
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") {
                  setEditName(person.name);
                  setEditEmail(person.email || "");
                  setEditing(false);
                }
              }}
              placeholder="email@example.com"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: "11px", color: "var(--text-tertiary)" }}
            />
          </div>
          <div className="flex items-center gap-1 pt-0.5">
            <button
              onClick={commitEdit}
              className="px-2 py-0.5 rounded-[4px] text-white text-[11px] font-semibold"
              style={{ background: "var(--accent-primary)" }}
            >
              <Check size={10} weight="bold" className="inline mr-0.5" /> Save
            </button>
            <button
              onClick={() => {
                setEditName(person.name);
                setEditEmail(person.email || "");
                setEditing(false);
              }}
              className="px-2 py-0.5 rounded-[4px] text-[11px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                {person.name}
              </span>
            </div>
            {person.email && (
              <div className="flex items-center gap-1.5">
                <span className="truncate" style={{ fontSize: "11px", color: "var(--text-quaternary)" }}>
                  {person.email}
                </span>
                {person.inviteStatus === "sent" && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-[1px] rounded-full" style={{ background: "oklch(0.85 0.12 55 / 0.15)", color: "oklch(0.6 0.12 55)" }}>
                    <EnvelopeSimple size={9} weight="bold" />
                    Invited
                  </span>
                )}
                {person.inviteStatus === "accepted" && (
                  <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-[1px] rounded-full" style={{ background: "oklch(0.73 0.15 155 / 0.12)", color: "oklch(0.5 0.12 155)" }}>
                    Joined
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Role badge with switcher */}
          <RoleSwitcher currentRole={role} onSwitch={onSwitchRole} />

          {/* Actions — edit + remove */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setEditName(person.name);
                setEditEmail(person.email || "");
                setEditing(true);
                haptic("light");
              }}
              className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
              style={{ color: "var(--text-quaternary)" }}
              title="Edit"
            >
              <PencilSimple size={12} />
            </button>
            {!confirmRemove ? (
              <button
                onClick={() => setConfirmRemove(true)}
                className="w-6 h-6 flex items-center justify-center rounded-[4px] hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-colors"
                style={{ color: "var(--text-quaternary)" }}
                title="Remove"
              >
                <X size={12} />
              </button>
            ) : (
              <button
                onClick={() => {
                  onRemove();
                  setConfirmRemove(false);
                }}
                onMouseLeave={() => setConfirmRemove(false)}
                className="px-1.5 h-6 flex items-center justify-center rounded-[4px] text-[10px] font-semibold transition-colors"
                style={{ color: "oklch(0.6 0.2 25)", background: "oklch(0.6 0.2 25 / 0.08)" }}
              >
                Remove?
              </button>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD PERSON FORM — inline expansion with name + email
   ═══════════════════════════════════════════════════════════ */

function AddPersonForm({
  role,
  color,
  onAdd,
}: {
  role: SpacePersonRole;
  color: string;
  onAdd: (person: SpacePerson) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [expanded, setExpanded] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) nameRef.current?.focus();
  }, [expanded]);

  const handleAdd = () => {
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) return;
    onAdd({
      id: generatePersonId(),
      name: `${first} ${last}`,
      email: email.trim() || undefined,
      avatarColor: randomAvatarColor(),
    });
    setFirstName("");
    setLastName("");
    setEmail("");
    // Keep form expanded so user can add multiple
    nameRef.current?.focus();
  };

  if (!expanded) {
    return (
      <button
        onClick={() => { setExpanded(true); haptic("light"); }}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[8px] transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03] border border-dashed"
        style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: `color-mix(in oklch, ${color} 10%, transparent)` }}
        >
          <UserPlus size={14} style={{ color }} />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 500 }}>
          Add {role}
        </span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="rounded-[10px] border p-3"
      style={{
        background: `color-mix(in oklch, ${color} 3%, var(--surface-bg))`,
        borderColor: `color-mix(in oklch, ${color} 20%, var(--border-default))`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <UserPlus size={14} style={{ color }} />
        <span style={{ fontSize: "12px", fontWeight: 600, color }}>
          Add {role}
        </span>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            ref={nameRef}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setFirstName("");
                setLastName("");
                setEmail("");
                setExpanded(false);
              }
            }}
            placeholder="First name"
            className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border"
            style={{
              fontSize: "13px",
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
            }}
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setFirstName("");
                setLastName("");
                setEmail("");
                setExpanded(false);
              }
            }}
            placeholder="Last name"
            className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border"
            style={{
              fontSize: "13px",
              color: "var(--text-primary)",
              borderColor: "var(--border-default)",
            }}
          />
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] border bg-white/60 dark:bg-white/[0.04]" style={{ borderColor: "var(--border-default)" }}>
          <EnvelopeSimple size={13} style={{ color: "var(--text-quaternary)" }} />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setFirstName("");
                setLastName("");
                setEmail("");
                setExpanded(false);
              }
            }}
            placeholder="Email (optional — sends invite)"
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: "12px", color: "var(--text-primary)" }}
          />
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={handleAdd}
            disabled={!firstName.trim() || !lastName.trim()}
            className="px-3.5 py-1.5 rounded-[6px] text-white text-[12px] font-semibold transition-all disabled:opacity-40 hover:brightness-110 active:scale-[0.97]"
            style={{ background: color }}
          >
            <Plus size={11} weight="bold" className="inline mr-0.5" />
            {email.trim() ? "Add & Invite" : "Add"}
          </button>
          <button
            onClick={() => {
              setFirstName("");
              setLastName("");
              setEmail("");
              setExpanded(false);
            }}
            className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Done
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN MODAL — SpacePeopleManager
   ═══════════════════════════════════════════════════════════ */

export function SpacePeopleManager({
  space: initialSpace,
  onClose,
}: {
  space: { id: string };
  onClose: () => void;
}) {
  const { spaces, updateSpace } = useData();
  const [activeTab, setActiveTab] = useState<SpacePersonRole>("member");
  const [search, setSearch] = useState("");

  // Live space data from context — avoids stale props
  const space = useMemo(
    () => spaces.find((s) => s.id === initialSpace.id),
    [spaces, initialSpace.id]
  );

  const getPeopleForRole = useCallback(
    (role: SpacePersonRole): SpacePerson[] => {
      if (!space) return [];
      switch (role) {
        case "member": return space.members || [];
        case "client": return space.clients || [];
        case "viewer": return space.viewers || [];
      }
    },
    [space]
  );

  const roleKey = (role: SpacePersonRole) =>
    role === "member" ? "members" : role === "client" ? "clients" : "viewers";

  const { profile, user } = useAuth();
  const inviterName = profile?.displayName || user?.user_metadata?.name || "A teammate";

  const handleAddPerson = useCallback(
    async (role: SpacePersonRole, person: SpacePerson) => {
      if (!space) return;
      const current = getPeopleForRole(role);
      // Mark invite status if email was provided
      const personWithInvite: SpacePerson = person.email
        ? { ...person, inviteStatus: "sent", invitedAt: new Date().toISOString() }
        : person;
      updateSpace(space.id, { [roleKey(role)]: [...current, personWithInvite] });
      haptic("success");

      // Send invite email if email provided
      if (person.email) {
        try {
          const result = await api.post(`/spaces/${space.id}/invite`, {
            personName: person.name,
            personEmail: person.email,
            spaceName: space.name,
            spaceColor: space.color,
            inviterName,
            role,
          });
          if (result.error) {
            console.error("[SpacePeopleManager] Invite email error:", result.error);
            toast.success(`Added ${person.name} as ${role}`, { description: "Invite email could not be sent" });
          } else if (result.warning) {
            toast.success(`Added ${person.name} as ${role}`, { description: "Email skipped — verify a domain at resend.com/domains" });
          } else {
            toast.success(`Added ${person.name} as ${role}`, { description: `Invitation sent to ${person.email}` });
          }
        } catch (err) {
          console.error("[SpacePeopleManager] Invite email error:", err);
          toast.success(`Added ${person.name} as ${role}`, { description: "Invite email could not be sent" });
        }
      } else {
        toast.success(`Added ${person.name} as ${role}`);
      }
    },
    [space, getPeopleForRole, updateSpace, inviterName]
  );

  const handleRemovePerson = useCallback(
    (role: SpacePersonRole, personId: string) => {
      if (!space) return;
      const current = getPeopleForRole(role);
      const removed = current.find((p) => p.id === personId);
      updateSpace(space.id, { [roleKey(role)]: current.filter((p) => p.id !== personId) });
      haptic("light");
      if (removed) toast.success(`Removed ${removed.name}`);
    },
    [space, getPeopleForRole, updateSpace]
  );

  const handleUpdatePerson = useCallback(
    (role: SpacePersonRole, personId: string, updates: Partial<SpacePerson>) => {
      if (!space) return;
      const current = getPeopleForRole(role);
      const updated = current.map((p) => (p.id === personId ? { ...p, ...updates } : p));
      updateSpace(space.id, { [roleKey(role)]: updated });
      haptic("light");
    },
    [space, getPeopleForRole, updateSpace]
  );

  const handleSwitchRole = useCallback(
    (fromRole: SpacePersonRole, personId: string, toRole: SpacePersonRole) => {
      if (!space) return;
      const fromList = getPeopleForRole(fromRole);
      const toList = getPeopleForRole(toRole);
      const person = fromList.find((p) => p.id === personId);
      if (!person) return;

      updateSpace(space.id, {
        [roleKey(fromRole)]: fromList.filter((p) => p.id !== personId),
        [roleKey(toRole)]: [...toList, person],
      });
      haptic("medium");
      const toLabel = ROLE_TABS.find((t) => t.role === toRole)!.singularLabel;
      toast.success(`Moved ${person.name} to ${toLabel}s`);
      // Switch to the target tab so user sees the person
      setActiveTab(toRole);
    },
    [space, getPeopleForRole, updateSpace]
  );

  if (!space) return null;

  const totalPeople =
    (space.members?.length || 0) + (space.clients?.length || 0) + (space.viewers?.length || 0);

  const activeTabConfig = ROLE_TABS.find((t) => t.role === activeTab)!;
  const people = getPeopleForRole(activeTab);

  // Filter by search
  const filteredPeople = search
    ? people.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.email?.toLowerCase().includes(search.toLowerCase())
      )
    : people;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
        className="relative w-full max-w-[500px] mx-4 rounded-[14px] border shadow-xl overflow-hidden"
        style={{
          background: "var(--surface-bg)",
          borderColor: "var(--border-default)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
          <ProjectIcon
            phosphorIcon={space.phosphorIcon}
            iconUrl={space.iconUrl}
            color={space.color}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="truncate" style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
              {space.name}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>
              {totalPeople} {totalPeople === 1 ? "person" : "people"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b" style={{ borderColor: "var(--border-default)" }}>
          {ROLE_TABS.map((tab) => {
            const count = getPeopleForRole(tab.role).length;
            const isActive = activeTab === tab.role;
            return (
              <button
                key={tab.role}
                onClick={() => { setActiveTab(tab.role); haptic("selection"); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 transition-colors relative"
                style={{
                  color: isActive ? tab.color : "var(--text-tertiary)",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <tab.icon size={16} weight={isActive ? "fill" : "regular"} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className="text-[10px] font-bold tabular-nums px-1.5 rounded-full"
                    style={{
                      background: isActive
                        ? `color-mix(in oklch, ${tab.color} 12%, transparent)`
                        : "var(--neutral-100)",
                      color: isActive ? tab.color : "var(--text-quaternary)",
                    }}
                  >
                    {count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="people-tab-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-t-full"
                    style={{ background: tab.color }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div className="flex flex-col" style={{ maxHeight: "min(460px, 60vh)" }}>
          {/* Role description */}
          <div
            className="px-5 py-2.5 flex items-center gap-2"
            style={{ background: `color-mix(in oklch, ${activeTabConfig.color} 4%, transparent)` }}
          >
            <Crown size={13} style={{ color: activeTabConfig.color, opacity: 0.6 }} />
            <p style={{ fontSize: "12px", color: "var(--text-quaternary)" }}>
              {activeTabConfig.description}
            </p>
          </div>

          {/* Search (when people > 3) */}
          {people.length > 3 && (
            <div className="px-4 pt-3">
              <div
                className="flex items-center gap-2 px-2.5 py-[6px] rounded-[7px] border transition-colors focus-within:border-[var(--accent-primary)]"
                style={{ borderColor: "var(--border-default)" }}
              >
                <MagnifyingGlass size={13} style={{ color: "var(--text-quaternary)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTabConfig.label.toLowerCase()}...`}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: "12px", color: "var(--text-primary)" }}
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X size={11} style={{ color: "var(--text-quaternary)" }} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* People list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            <AnimatePresence mode="popLayout">
              {filteredPeople.length === 0 && !search ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: `color-mix(in oklch, ${activeTabConfig.color} 8%, transparent)` }}
                  >
                    <activeTabConfig.icon size={24} weight="light" style={{ color: activeTabConfig.color, opacity: 0.5 }} />
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-quaternary)", fontWeight: 500 }}>
                    No {activeTabConfig.label.toLowerCase()} yet
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-quaternary)", opacity: 0.6, marginTop: "4px" }}>
                    Add someone below to get started
                  </p>
                </motion.div>
              ) : filteredPeople.length === 0 && search ? (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-6"
                >
                  <p style={{ fontSize: "13px", color: "var(--text-quaternary)" }}>
                    No results for "{search}"
                  </p>
                </motion.div>
              ) : (
                filteredPeople.map((person) => (
                  <PersonRow
                    key={person.id}
                    person={person}
                    role={activeTab}
                    onRemove={() => handleRemovePerson(activeTab, person.id)}
                    onUpdate={(updates) => handleUpdatePerson(activeTab, person.id, updates)}
                    onSwitchRole={(newRole) => handleSwitchRole(activeTab, person.id, newRole)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Add person form */}
          <div className="px-3 pb-3 pt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
            <AddPersonForm
              role={activeTab}
              color={activeTabConfig.color}
              onAdd={(person) => handleAddPerson(activeTab, person)}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}