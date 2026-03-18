/* ═══════════════════════════════════════════════════════════
   TEAMS TAB — Create & manage teams within a space.
   Teams group people (members, clients, viewers) together.
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  UsersFour,
  PencilSimple,
  Trash,
  Check,
  UsersThree,
  Briefcase,
  Eye,
  CirclesFour,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData } from "../lib/data";
import { haptic } from "../lib/haptics";
import { toast } from "sonner";
import type { SpacePerson, SpaceTeam } from "../lib/types";
import { AVATAR_COLORS } from "../lib/types";

/* ─── Constants ─── */

const TEAM_COLORS = [
  "#6366F1", "#8B5CF6", "#EC4899", "#F43F5E",
  "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#06B6D4", "#3B82F6", "#6B7280", "#84CC16",
];

/* ─── Helpers ─── */

function generateTeamId() {
  return `team-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2);
}

function PersonAvatar({ person, size = 28, fontSize = 10 }: { person: SpacePerson; size?: number; fontSize?: number }) {
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
        <span style={{ color: "white", fontSize: `${fontSize}px`, fontWeight: 700, textShadow: "0 1px 1px oklch(0 0 0 / 0.1)" }}>
          {initials || "?"}
        </span>
      )}
    </div>
  );
}

function roleIcon(role: "member" | "client" | "viewer") {
  switch (role) {
    case "member": return UsersThree;
    case "client": return Briefcase;
    case "viewer": return Eye;
  }
}

function roleLabel(role: "member" | "client" | "viewer") {
  switch (role) {
    case "member": return "Member";
    case "client": return "Client";
    case "viewer": return "Viewer";
  }
}

/* ═══════════════════════════════════════════════════════════
   TEAM CARD — expandable card for a single team
   ═══════════════════════════════════════════════════════════ */

function TeamCard({
  team,
  allPeople,
  spaceColor,
  onUpdate,
  onDelete,
}: {
  team: SpaceTeam;
  allPeople: { person: SpacePerson; role: "member" | "client" | "viewer" }[];
  spaceColor: string;
  onUpdate: (teamId: string, updates: Partial<SpaceTeam>) => void;
  onDelete: (teamId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [editDesc, setEditDesc] = useState(team.description || "");
  const [editColor, setEditColor] = useState(team.color);
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  const [search, setSearch] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) nameRef.current?.focus();
  }, [editing]);

  const teamMembers = useMemo(() => {
    return allPeople.filter((p) => team.personIds.includes(p.person.id));
  }, [allPeople, team.personIds]);

  const availablePeople = useMemo(() => {
    const existing = new Set(team.personIds);
    return allPeople
      .filter((p) => !existing.has(p.person.id))
      .filter((p) => !search || p.person.name.toLowerCase().includes(search.toLowerCase()));
  }, [allPeople, team.personIds, search]);

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    onUpdate(team.id, { name: editName.trim(), description: editDesc.trim() || undefined, color: editColor });
    setEditing(false);
    haptic("success");
    toast.success("Team updated");
  };

  const handleAddPerson = (personId: string) => {
    onUpdate(team.id, { personIds: [...team.personIds, personId] });
    haptic("light");
  };

  const handleRemovePerson = (personId: string) => {
    onUpdate(team.id, { personIds: team.personIds.filter((id) => id !== personId) });
    haptic("light");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-[12px] border overflow-hidden"
      style={{ background: "var(--surface-bg)", borderColor: "var(--border-default)" }}
    >
      {/* Header */}
      <button
        onClick={() => { setExpanded(!expanded); haptic("selection"); }}
        className="flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
      >
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in oklch, ${team.color} 14%, transparent)` }}
        >
          <UsersFour size={18} weight="fill" style={{ color: team.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {team.name}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
            {teamMembers.length} {teamMembers.length === 1 ? "person" : "people"}
            {team.description ? ` · ${team.description}` : ""}
          </p>
        </div>

        {/* Stacked avatars */}
        <div className="flex -space-x-1.5">
          {teamMembers.slice(0, 4).map((m) => (
            <PersonAvatar key={m.person.id} person={m.person} size={24} fontSize={9} />
          ))}
          {teamMembers.length > 4 && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: "var(--neutral-200)", color: "var(--text-tertiary)" }}
            >
              +{teamMembers.length - 4}
            </div>
          )}
        </div>

        {expanded ? (
          <CaretUp size={14} style={{ color: "var(--text-quaternary)" }} />
        ) : (
          <CaretDown size={14} style={{ color: "var(--text-quaternary)" }} />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border-default)" }}>
              {/* Edit mode */}
              {editing ? (
                <div className="pt-3 space-y-2.5">
                  <input
                    ref={nameRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditing(false); }}
                    placeholder="Team name"
                    className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border text-[13px]"
                    style={{ color: "var(--text-primary)", borderColor: "var(--border-default)" }}
                  />
                  <input
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditing(false); }}
                    placeholder="Description (optional)"
                    className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border text-[12px]"
                    style={{ color: "var(--text-primary)", borderColor: "var(--border-default)" }}
                  />
                  {/* Color picker */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TEAM_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setEditColor(c)}
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ background: c, border: editColor === c ? "2px solid var(--text-primary)" : "2px solid transparent" }}
                      >
                        {editColor === c && <Check size={12} weight="bold" color="white" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editName.trim()}
                      className="px-3 py-1.5 rounded-[6px] text-white text-[12px] font-semibold disabled:opacity-40 hover:brightness-110 transition-all"
                      style={{ background: team.color }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditing(false); setEditName(team.name); setEditDesc(team.description || ""); setEditColor(team.color); }}
                      className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-3">
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <PencilSimple size={12} /> Edit
                    </button>
                    <button
                      onClick={() => { onDelete(team.id); haptic("medium"); toast.success("Team deleted"); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[12px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                      style={{ color: "oklch(0.6 0.2 25)" }}
                    >
                      <Trash size={12} /> Delete
                    </button>
                  </div>

                  {/* Team members list */}
                  <div className="space-y-0.5">
                    {teamMembers.length === 0 ? (
                      <p className="text-[12px] py-3 text-center" style={{ color: "var(--text-quaternary)" }}>
                        No people in this team yet
                      </p>
                    ) : (
                      teamMembers.map((m) => {
                        const RIcon = roleIcon(m.role);
                        return (
                          <div
                            key={m.person.id}
                            className="group flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <PersonAvatar person={m.person} size={28} fontSize={10} />
                            <span className="flex-1 text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                              {m.person.name}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-[4px]" style={{ color: "var(--text-quaternary)", background: "var(--neutral-50)" }}>
                              <RIcon size={10} />
                              {roleLabel(m.role)}
                            </span>
                            <button
                              onClick={() => handleRemovePerson(m.person.id)}
                              className="w-5 h-5 flex items-center justify-center rounded-[3px] opacity-0 group-hover:opacity-100 hover:bg-black/[0.06] dark:hover:bg-white/[0.06] transition-all"
                              style={{ color: "var(--text-quaternary)" }}
                              title="Remove from team"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add people */}
                  {!showPeoplePicker ? (
                    <button
                      onClick={() => { setShowPeoplePicker(true); haptic("light"); }}
                      className="flex items-center gap-1.5 w-full px-3 py-2 rounded-[8px] border border-dashed text-[12px] font-medium transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
                    >
                      <Plus size={12} /> Add people
                    </button>
                  ) : (
                    <div className="rounded-[8px] border p-2.5 space-y-2" style={{ borderColor: `color-mix(in oklch, ${team.color} 25%, var(--border-default))`, background: `color-mix(in oklch, ${team.color} 3%, var(--surface-bg))` }}>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-[5px] border" style={{ borderColor: "var(--border-default)" }}>
                        <MagnifyingGlass size={12} style={{ color: "var(--text-quaternary)" }} />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search people..."
                          className="flex-1 bg-transparent outline-none text-[12px]"
                          style={{ color: "var(--text-primary)" }}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[160px] overflow-y-auto space-y-0.5">
                        {availablePeople.length === 0 ? (
                          <p className="text-[11px] py-2 text-center" style={{ color: "var(--text-quaternary)" }}>
                            {allPeople.length === 0 ? "Add people to this space first" : "No more people to add"}
                          </p>
                        ) : (
                          availablePeople.map((p) => {
                            const RIcon = roleIcon(p.role);
                            return (
                              <button
                                key={p.person.id}
                                onClick={() => handleAddPerson(p.person.id)}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-[5px] text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                              >
                                <PersonAvatar person={p.person} size={24} fontSize={9} />
                                <span className="flex-1 text-[12px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
                                  {p.person.name}
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--text-quaternary)" }}>
                                  <RIcon size={10} />
                                  {roleLabel(p.role)}
                                </span>
                                <Plus size={12} style={{ color: team.color }} />
                              </button>
                            );
                          })
                        )}
                      </div>
                      <button
                        onClick={() => { setShowPeoplePicker(false); setSearch(""); }}
                        className="w-full text-center text-[11px] font-medium py-1 rounded-[5px] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        Done
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEAMS TAB — main export
   ═══════════════════════════════════════════════════════════ */

export function TeamsTab({ spaceId, spaceColor }: { spaceId: string; spaceColor: string }) {
  const { spaces, updateSpace } = useData();
  const space = useMemo(() => spaces.find((s) => s.id === spaceId), [spaces, spaceId]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(TEAM_COLORS[0]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) nameRef.current?.focus();
  }, [creating]);

  if (!space) return null;

  const teams = space.teams || [];

  // Collect all people from all roles
  const allPeople = useMemo(() => {
    const result: { person: SpacePerson; role: "member" | "client" | "viewer" }[] = [];
    (space.members || []).forEach((p) => result.push({ person: p, role: "member" }));
    (space.clients || []).forEach((p) => result.push({ person: p, role: "client" }));
    (space.viewers || []).forEach((p) => result.push({ person: p, role: "viewer" }));
    return result;
  }, [space.members, space.clients, space.viewers]);

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const newTeam: SpaceTeam = {
      id: generateTeamId(),
      name: trimmed,
      color: newColor,
      description: newDesc.trim() || undefined,
      personIds: [],
      createdAt: new Date().toISOString(),
    };
    updateSpace(spaceId, { teams: [...teams, newTeam] });
    haptic("success");
    toast.success(`Created team "${trimmed}"`);
    setNewName("");
    setNewDesc("");
    setNewColor(TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)]);
    setCreating(false);
  };

  const handleUpdateTeam = useCallback((teamId: string, updates: Partial<SpaceTeam>) => {
    const updated = teams.map((t) => t.id === teamId ? { ...t, ...updates } : t);
    updateSpace(spaceId, { teams: updated });
  }, [teams, spaceId, updateSpace]);

  const handleDeleteTeam = useCallback((teamId: string) => {
    updateSpace(spaceId, { teams: teams.filter((t) => t.id !== teamId) });
  }, [teams, spaceId, updateSpace]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <UsersFour size={16} weight="fill" style={{ color: spaceColor }} />
          <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
            {teams.length} {teams.length === 1 ? "team" : "teams"}
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-[8px]" style={{ background: `color-mix(in oklch, ${spaceColor} 4%, transparent)` }}>
        <UsersFour size={12} style={{ color: spaceColor, opacity: 0.6 }} />
        <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
          Teams let you group members, clients, and viewers together for easier collaboration
        </p>
      </div>

      {/* Teams list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {teams.length === 0 && !creating && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10"
            >
              <div
                className="w-14 h-14 rounded-[12px] flex items-center justify-center mx-auto mb-4"
                style={{ background: `color-mix(in oklch, ${spaceColor} 8%, transparent)` }}
              >
                <UsersFour size={28} weight="light" style={{ color: spaceColor, opacity: 0.5 }} />
              </div>
              <p className="text-[14px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                No teams yet
              </p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-quaternary)" }}>
                Create a team to group people from this space
              </p>
            </motion.div>
          )}

          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              allPeople={allPeople}
              spaceColor={spaceColor}
              onUpdate={handleUpdateTeam}
              onDelete={handleDeleteTeam}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Create team */}
      {!creating ? (
        <button
          onClick={() => { setCreating(true); haptic("light"); }}
          className="flex items-center gap-2 w-full px-3.5 py-3 rounded-[10px] border border-dashed transition-all hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
          style={{ borderColor: "var(--border-default)", color: "var(--text-quaternary)" }}
        >
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ background: `color-mix(in oklch, ${spaceColor} 10%, transparent)` }}
          >
            <Plus size={15} style={{ color: spaceColor }} />
          </div>
          <span className="text-[13px] font-medium">Create team</span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[10px] border p-3.5 space-y-2.5"
          style={{
            background: `color-mix(in oklch, ${spaceColor} 3%, var(--surface-bg))`,
            borderColor: `color-mix(in oklch, ${spaceColor} 20%, var(--border-default))`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <UsersFour size={14} style={{ color: spaceColor }} />
            <span className="text-[12px] font-semibold" style={{ color: spaceColor }}>New team</span>
          </div>
          <input
            ref={nameRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Team name"
            className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border"
            style={{ fontSize: "13px", color: "var(--text-primary)", borderColor: "var(--border-default)" }}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Description (optional)"
            className="w-full bg-white/60 dark:bg-white/[0.04] outline-none px-2.5 py-2 rounded-[6px] border"
            style={{ fontSize: "12px", color: "var(--text-primary)", borderColor: "var(--border-default)" }}
          />
          {/* Color picker */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: c, border: newColor === c ? "2px solid var(--text-primary)" : "2px solid transparent" }}
              >
                {newColor === c && <Check size={12} weight="bold" color="white" />}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="px-3.5 py-1.5 rounded-[6px] text-white text-[12px] font-semibold disabled:opacity-40 hover:brightness-110 active:scale-[0.97] transition-all"
              style={{ background: spaceColor }}
            >
              <Plus size={11} weight="bold" className="inline mr-0.5" /> Create
            </button>
            <button
              onClick={() => { setCreating(false); setNewName(""); setNewDesc(""); }}
              className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
