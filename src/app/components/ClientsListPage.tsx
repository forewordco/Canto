/* ═══════════════════════════════════════════════════════════
   CLIENTS LIST PAGE & CLIENT DETAIL PAGE

   ClientsListPage: Grid/list of all clients with search,
   add-client dialog, and click-to-detail navigation.

   ClientPage: Client detail with contacts, projects,
   contracts, satisfaction rating, and notes.

   Phase 10 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback } from "react";
import {
  Binoculars,
  Plus,
  X,
  Star,
  StarHalf,
  Envelope,
  Phone,
  PencilSimple,
  Trash,
  DotsThree,
  SquareHalf,
  FileText,
  Users,
  Buildings,
  CurrencyDollar,
  CalendarBlank,
  Check,
  ArrowRight,
  ChatText,
  UserCircle,
  SquaresFour,
  List,
  CaretDown,
  Warning,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useData } from "../lib/data";
import { useNavigation } from "../lib/navigation";
import { ResponsiveModal } from "./ResponsiveModal";
import type {
  ClientData,
  ClientContact,
  ClientContract,
} from "../lib/types";
import { ListToolbar } from "./ListToolbar";

/* ─── Client Avatar ─── */
function ClientAvatar({ client, size = 40 }: { client: ClientData; size?: number }) {
  const initials = client.name
    ? client.name.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div
      className="rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        background: client.avatarColor || "oklch(0.78 0.13 260)",
      }}
    >
      {client.avatarUrl ? (
        <img src={client.avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span style={{ color: "white", fontSize: size * 0.34, fontWeight: 700, textShadow: "0 1px 1px oklch(0 0 0/0.1)" }}>
          {initials}
        </span>
      )}
    </div>
  );
}

/* ─── Satisfaction Stars ─── */
function SatisfactionStars({
  rating,
  size = 14,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star
            size={size}
            weight={i <= rating ? "fill" : "regular"}
            style={{
              color: i <= rating ? "oklch(0.85 0.15 85)" : "var(--neutral-300)",
            }}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Add/Edit Client Modal ─── */
function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client: Partial<ClientData> | null;
  onClose: () => void;
  onSave: (data: ClientData) => void;
}) {
  const isEdit = !!client?.id;
  const [form, setForm] = useState<Partial<ClientData>>({
    name: "",
    description: "",
    avatarColor: "oklch(0.78 0.13 260)",
    contacts: [],
    contracts: [],
    connectedProjects: [],
    notes: "",
    ...client,
  });

  const avatarColors = [
    "oklch(0.78 0.13 260)",
    "oklch(0.82 0.12 25)",
    "oklch(0.75 0.12 172)",
    "oklch(0.85 0.13 88)",
    "oklch(0.75 0.15 320)",
    "oklch(0.70 0.15 140)",
  ];

  const handleSubmit = () => {
    if (!form.name) return;
    const data: ClientData = {
      id: form.id || `client-${Date.now()}`,
      name: form.name!,
      description: form.description,
      contacts: form.contacts || [],
      contracts: form.contracts || [],
      connectedProjects: form.connectedProjects || [],
      satisfactionRating: form.satisfactionRating,
      notes: form.notes,
      avatarColor: form.avatarColor,
      avatarUrl: form.avatarUrl,
      createdAt: form.createdAt || new Date().toISOString(),
    };
    onSave(data);
    onClose();
  };

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title={isEdit ? "Edit Client" : "Add Client"}
    >
      <div className="space-y-4">
        {/* Avatar color */}
        <div className="flex items-center gap-3">
          <ClientAvatar client={{ ...form as ClientData }} size={48} />
          <div className="flex gap-1.5">
            {avatarColors.map((c) => (
              <button
                key={c}
                onClick={() => setForm((f) => ({ ...f, avatarColor: c }))}
                className="w-6 h-6 rounded-full hover:scale-110 transition-transform"
                style={{
                  background: c,
                  outline: form.avatarColor === c ? "2px solid var(--accent-primary)" : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Name *</label>
          <input
            value={form.name || ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Client or company name"
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
            style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Description</label>
          <textarea
            value={form.description || ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description..."
            rows={2}
            className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none resize-none"
            style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-[6px] text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!form.name}
          className="px-4 py-2 rounded-[6px] text-[13px] font-medium text-white disabled:opacity-40"
          style={{ background: "var(--accent-primary)" }}
        >
          {isEdit ? "Save" : "Add Client"}
        </button>
      </div>
    </ResponsiveModal>
  );
}

/* ─── Client Card ─── */
function ClientCard({
  client,
  onNavigate,
  projectCount,
}: {
  client: ClientData;
  onNavigate: () => void;
  projectCount: number;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onNavigate}
      className="w-full text-left rounded-[10px] p-4 group transition-shadow hover:shadow-md"
      style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}
    >
      <div className="flex items-start gap-3">
        <ClientAvatar client={client} size={44} />
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {client.name}
          </h3>
          {client.description && (
            <p className="text-[12px] mt-0.5 line-clamp-1" style={{ color: "var(--text-tertiary)" }}>
              {client.description}
            </p>
          )}
        </div>
        <ArrowRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          style={{ color: "var(--text-quaternary)" }}
        />
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
          <SquareHalf size={13} />
          <span>{projectCount} project{projectCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
          <Users size={13} />
          <span>{client.contacts.length} contact{client.contacts.length !== 1 ? "s" : ""}</span>
        </div>
        {client.satisfactionRating && (
          <SatisfactionStars rating={client.satisfactionRating} size={12} />
        )}
      </div>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENTS LIST PAGE
   ═══════════════════════════════════════════════════════════ */

export function ClientsListPage() {
  const { clients, addClient, updateClient, deleteClient, projects, loadError, reload } = useData();
  const { navigate } = useNavigation();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<ClientData | null>(null);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  // Count projects per client
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach((c) => {
      counts[c.id] = c.connectedProjects?.length || 0;
    });
    return counts;
  }, [clients]);

  const handleSave = useCallback(
    (data: ClientData) => {
      const existing = clients.find((c) => c.id === data.id);
      if (existing) {
        updateClient(data.id, data);
      } else {
        addClient(data);
      }
      setEditClient(null);
    },
    [clients, addClient, updateClient]
  );

  /* ── Data load error fallback ── */
  if (loadError && clients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mx-auto" style={{ background: "oklch(0.95 0.04 60)" }}>
            <Warning className="w-6 h-6" style={{ color: "oklch(0.7 0.15 60)" }} weight="fill" />
          </div>
          <div>
            <h3 className="mb-1" style={{ color: "var(--text-primary)", fontSize: "16px", fontWeight: 600 }}>Unable to load clients</h3>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 style={{ color: "var(--text-primary)", fontSize: "24px", fontWeight: 700 }}>Clients</h1>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditClient(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium text-white hover:opacity-90 self-start"
          style={{ background: "var(--accent-primary)" }}
        >
          <Plus size={15} weight="bold" />
          Add Client
        </button>
      </div>

      <div className="mb-5">
          <ListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search clients…"
            hideSort
            hideFilter
            hideGroup
            hideOptions
          />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-[14px] flex items-center justify-center mb-4" style={{ background: "var(--neutral-100)" }}>
            <Binoculars size={28} style={{ color: "var(--text-quaternary)" }} />
          </div>
          <h3 className="text-[16px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            {search ? "No results" : "No clients yet"}
          </h3>
          <p className="text-[13px] max-w-sm" style={{ color: "var(--text-tertiary)" }}>
            {search ? "Try adjusting your search." : "Add your first client to track projects, contacts, and contracts."}
          </p>
          {!search && (
            <button
              onClick={() => { setEditClient(null); setShowModal(true); }}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium text-white"
              style={{ background: "var(--accent-primary)" }}
            >
              <Plus size={14} weight="bold" />
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                onNavigate={() => navigate("client", { clientId: c.id })}
                projectCount={projectCounts[c.id] || 0}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <ClientModal
            client={editClient}
            onClose={() => { setShowModal(false); setEditClient(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLIENT DETAIL PAGE
   ═══════════════════════════════════════════════════════════ */

type ClientTab = "overview" | "contacts" | "contracts" | "projects";

function AddContactModal({
  contact,
  onClose,
  onSave,
}: {
  contact?: ClientContact;
  onClose: () => void;
  onSave: (c: ClientContact) => void;
}) {
  const [form, setForm] = useState<Partial<ClientContact>>({
    name: "",
    email: "",
    phone: "",
    role: "",
    isPrimary: false,
    ...contact,
  });

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title={contact ? "Edit Contact" : "Add Contact"}
      desktopMaxWidth="400px"
    >
      <div className="space-y-3">
        <input
          value={form.name || ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Name *"
          className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
          style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        />
        <input
          value={form.email || ""}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Email *"
          className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
          style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.phone || ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone"
            className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
            style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          />
          <input
            value={form.role || ""}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="Role"
            className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
            style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          />
        </div>
        <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: "var(--text-secondary)" }}>
          <input
            type="checkbox"
            checked={form.isPrimary || false}
            onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
            className="w-4 h-4 rounded"
          />
          Primary contact
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button onClick={onClose} className="px-3 py-1.5 rounded-[6px] text-[13px]" style={{ color: "var(--text-secondary)" }}>Cancel</button>
        <button
          onClick={() => {
            if (!form.name || !form.email) return;
            onSave({
              id: form.id || `contact-${Date.now()}`,
              name: form.name!,
              email: form.email!,
              phone: form.phone,
              role: form.role,
              isPrimary: form.isPrimary,
            });
            onClose();
          }}
          disabled={!form.name || !form.email}
          className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-white disabled:opacity-40"
          style={{ background: "var(--accent-primary)" }}
        >
          Save
        </button>
      </div>
    </ResponsiveModal>
  );
}

function AddContractModal({
  contract,
  onClose,
  onSave,
}: {
  contract?: ClientContract;
  onClose: () => void;
  onSave: (c: ClientContract) => void;
}) {
  const [form, setForm] = useState<Partial<ClientContract>>({
    name: "",
    value: undefined,
    currency: "USD",
    status: "active",
    notes: "",
    ...contract,
  });

  return (
    <ResponsiveModal
      open={true}
      onClose={onClose}
      title={contract ? "Edit Contract" : "Add Contract"}
      desktopMaxWidth="400px"
    >
      <div className="space-y-3">
        <input
          value={form.name || ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Contract name *"
          className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
          style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={form.value ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value ? Number(e.target.value) : undefined }))}
            placeholder="Value"
            className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
            style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          />
          <select
            value={form.status || "active"}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
            className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none appearance-none"
            style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
          >
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] mb-1" style={{ color: "var(--text-quaternary)" }}>Start</label>
            <input
              type="date"
              value={form.startDate || ""}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            />
          </div>
          <div>
            <label className="block text-[11px] mb-1" style={{ color: "var(--text-quaternary)" }}>End</label>
            <input
              type="date"
              value={form.endDate || ""}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
              style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            />
          </div>
        </div>
        <textarea
          value={form.notes || ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Notes"
          rows={2}
          className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none resize-none"
          style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <button onClick={onClose} className="px-3 py-1.5 rounded-[6px] text-[13px]" style={{ color: "var(--text-secondary)" }}>Cancel</button>
        <button
          onClick={() => {
            if (!form.name) return;
            onSave({
              id: form.id || `contract-${Date.now()}`,
              name: form.name!,
              value: form.value,
              currency: form.currency,
              startDate: form.startDate,
              endDate: form.endDate,
              status: form.status,
              notes: form.notes,
            });
            onClose();
          }}
          disabled={!form.name}
          className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-white disabled:opacity-40"
          style={{ background: "var(--accent-primary)" }}
        >
          Save
        </button>
      </div>
    </ResponsiveModal>
  );
}

const CONTRACT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: "var(--teal-100)", text: "var(--teal-700)" },
  pending: { bg: "var(--mustard-100)", text: "var(--mustard-700)" },
  expired: { bg: "var(--neutral-200)", text: "var(--neutral-600)" },
  cancelled: { bg: "var(--red-100)", text: "var(--red-700)" },
};

export function ClientPage() {
  const { clients, updateClient, deleteClient, projects } = useData();
  const { params, navigate, goBack } = useNavigation();
  const clientId = params.clientId;
  const client = clients.find((c) => c.id === clientId);
  const [tab, setTab] = useState<ClientTab>("overview");
  const [showContactModal, setShowContactModal] = useState(false);
  const [editContact, setEditContact] = useState<ClientContact | undefined>();
  const [showContractModal, setShowContractModal] = useState(false);
  const [editContract, setEditContract] = useState<ClientContract | undefined>();
  const [notes, setNotes] = useState(client?.notes || "");

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Binoculars size={48} style={{ color: "var(--text-quaternary)" }} />
        <p className="text-[14px] mt-4" style={{ color: "var(--text-tertiary)" }}>Client not found</p>
        <button
          onClick={() => navigate("clients-list")}
          className="mt-3 text-[13px] font-medium"
          style={{ color: "var(--accent-primary)" }}
        >
          Back to Clients
        </button>
      </div>
    );
  }

  const connectedProjectData = Object.entries(projects)
    .filter(([key]) => client.connectedProjects?.includes(key.replace("project:shared:", "")))
    .map(([, p]) => p);

  const tabs: { id: ClientTab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "contacts", label: "Contacts", count: client.contacts.length },
    { id: "contracts", label: "Contracts", count: client.contracts.length },
    { id: "projects", label: "Projects", count: connectedProjectData.length },
  ];

  const handleSaveContact = (c: ClientContact) => {
    const existing = client.contacts.find((ct) => ct.id === c.id);
    const newContacts = existing
      ? client.contacts.map((ct) => (ct.id === c.id ? c : ct))
      : [...client.contacts, c];
    updateClient(client.id, { contacts: newContacts });
    setEditContact(undefined);
  };

  const handleDeleteContact = (id: string) => {
    updateClient(client.id, { contacts: client.contacts.filter((c) => c.id !== id) });
  };

  const handleSaveContract = (c: ClientContract) => {
    const existing = client.contracts.find((ct) => ct.id === c.id);
    const newContracts = existing
      ? client.contracts.map((ct) => (ct.id === c.id ? c : ct))
      : [...client.contracts, c];
    updateClient(client.id, { contracts: newContracts });
    setEditContract(undefined);
  };

  const handleDeleteContract = (id: string) => {
    updateClient(client.id, { contracts: client.contracts.filter((c) => c.id !== id) });
  };

  const handleSaveNotes = () => {
    updateClient(client.id, { notes });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <ClientAvatar client={client} size={56} />
        <div className="flex-1 min-w-0">
          <h1 className="text-[22px] font-bold" style={{ color: "var(--text-primary)" }}>
            {client.name}
          </h1>
          {client.description && (
            <p className="text-[13px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {client.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <SatisfactionStars
              rating={client.satisfactionRating || 0}
              size={16}
              interactive
              onChange={(r) => updateClient(client.id, { satisfactionRating: r })}
            />
            <span className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
              Satisfaction
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 pb-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors"
            style={{
              color: tab === t.id ? "var(--accent-primary)" : "var(--text-tertiary)",
              background: tab === t.id ? "var(--accent-primary-subtle)" : "transparent",
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1 text-[11px]" style={{ opacity: 0.7 }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Contacts", value: client.contacts.length, icon: Users },
              { label: "Contracts", value: client.contracts.length, icon: FileText },
              { label: "Projects", value: connectedProjectData.length, icon: SquareHalf },
              { label: "Rating", value: client.satisfactionRating ? `${client.satisfactionRating}/5` : "N/A", icon: Star },
            ].map((s) => (
              <div key={s.label} className="rounded-[8px] p-3" style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <s.icon size={14} style={{ color: "var(--text-quaternary)" }} />
                  <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--text-quaternary)" }}>{s.label}</span>
                </div>
                <p className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="rounded-[8px] p-4" style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}>
            <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add notes about this client..."
              rows={4}
              className="w-full text-[13px] outline-none resize-none leading-relaxed"
              style={{ color: "var(--text-secondary)", background: "transparent" }}
            />
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => { setEditContact(undefined); setShowContactModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-white"
              style={{ background: "var(--accent-primary)" }}
            >
              <Plus size={13} weight="bold" />
              Add Contact
            </button>
          </div>

          {client.contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users size={32} style={{ color: "var(--text-quaternary)" }} className="mx-auto mb-3" />
              <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No contacts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {client.contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-[8px] group"
                  style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--azure-100)" }}>
                    <UserCircle size={20} style={{ color: "var(--azure-600)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                      {c.isPrimary && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--teal-100)", color: "var(--teal-700)" }}>Primary</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                      {c.role && <span>{c.role}</span>}
                      <span className="flex items-center gap-1"><Envelope size={11} /> {c.email}</span>
                      {c.phone && <span className="flex items-center gap-1"><Phone size={11} /> {c.phone}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditContact(c); setShowContactModal(true); }} className="p-1.5 rounded hover:bg-black/5" style={{ color: "var(--text-tertiary)" }}><PencilSimple size={14} /></button>
                    <button onClick={() => handleDeleteContact(c.id)} className="p-1.5 rounded hover:bg-black/5" style={{ color: "oklch(0.7 0.18 25)" }}><Trash size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "contracts" && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => { setEditContract(undefined); setShowContractModal(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-white"
              style={{ background: "var(--accent-primary)" }}
            >
              <Plus size={13} weight="bold" />
              Add Contract
            </button>
          </div>

          {client.contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={32} style={{ color: "var(--text-quaternary)" }} className="mx-auto mb-3" />
              <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No contracts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {client.contracts.map((c) => {
                const statusColors = CONTRACT_STATUS_COLORS[c.status || "active"];
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-[8px] group"
                    style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}
                  >
                    <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "var(--mustard-100)" }}>
                      <CurrencyDollar size={20} style={{ color: "var(--mustard-700)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium capitalize" style={{ background: statusColors.bg, color: statusColors.text }}>
                          {c.status || "active"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                        {c.value !== undefined && <span>${c.value.toLocaleString()} {c.currency || "USD"}</span>}
                        {c.startDate && <span className="flex items-center gap-1"><CalendarBlank size={11} /> {c.startDate}</span>}
                        {c.endDate && <span>to {c.endDate}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditContract(c); setShowContractModal(true); }} className="p-1.5 rounded hover:bg-black/5" style={{ color: "var(--text-tertiary)" }}><PencilSimple size={14} /></button>
                      <button onClick={() => handleDeleteContract(c.id)} className="p-1.5 rounded hover:bg-black/5" style={{ color: "oklch(0.7 0.18 25)" }}><Trash size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "projects" && (
        <div>
          {connectedProjectData.length === 0 ? (
            <div className="text-center py-12">
              <SquareHalf size={32} style={{ color: "var(--text-quaternary)" }} className="mx-auto mb-3" />
              <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No connected projects</p>
              <p className="text-[12px] mt-1" style={{ color: "var(--text-quaternary)" }}>Link projects to this client from the project settings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {connectedProjectData.map((p) => (
                <button
                  key={p.name}
                  onClick={() => navigate("project", { projectId: p.name })}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-[8px] text-left group hover:bg-black/[0.02] transition-colors"
                  style={{ background: "var(--surface-bg)", border: "1px solid #e1e5eb" }}
                >
                  <div className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: p.color ? `${p.color}20` : "var(--azure-100)" }}>
                    <SquareHalf size={18} style={{ color: p.color || "var(--azure-600)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                    <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {p.tasks?.length || 0} tasks
                    </p>
                  </div>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-quaternary)" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showContactModal && (
          <AddContactModal
            contact={editContact}
            onClose={() => { setShowContactModal(false); setEditContact(undefined); }}
            onSave={handleSaveContact}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showContractModal && (
          <AddContractModal
            contract={editContract}
            onClose={() => { setShowContractModal(false); setEditContract(undefined); }}
            onSave={handleSaveContract}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClientsListPage;