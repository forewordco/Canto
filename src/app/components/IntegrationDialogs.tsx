/* ═══════════════════════════════════════════════════════════
   INTEGRATION DIALOGS — Connection & import wizards for
   external service integrations. Phase 12 of Canto.
   
   P12-1: GoogleCalendarDialog
   P12-2: GmailDialog
   P12-3: FrameIoDialog
   P12-4: AsanaImportDialog
   P12-6: CraftImportDialog
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  X,
  GoogleLogo,
  EnvelopeSimple,
  FilmStrip,
  Cube,
  PencilSimple,
  CheckCircle,
  CircleNotch,
  Warning,
  ArrowRight,
  ArrowLeft,
  CaretRight,
  Check,
  Sparkle,
  Upload,
  FileText,
  Folder,
  Star,
  Calendar,
  Buildings,
  TreeStructure,
  DownloadSimple,
  Copy,
  LinkSimple,
  Eye,
  Plugs,
  ChatCircleDots,
  Paperclip,
  GitBranch,
  Sliders,
  UsersThree,
  ListChecks,
  MagnifyingGlass,
  CheckSquare,
  Info,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import {
  getGoogleAuthUrl,
  openGoogleOAuthPopup,
  getGCalCalendars,
  syncGCalEvents,
  getGmailStarred,
  extractTaskFromEmail,
  unstarEmail,
  connectFrameIo,
  getFrameIoTeams,
  getFrameIoProjects,
  getFrameIoAssets,
  connectAsana,
  getAsanaWorkspaces,
  getAsanaProjects,
  getAsanaProjectPreview,
  deepImportAsanaProject,
  importCraftMarkdown,
  importCraftJson,
  disconnectIntegration,
  type IntegrationStatus,
  type GCalCalendar,
  type GmailEmail,
  type GmailTaskExtraction,
  type FrameIoTeam,
  type FrameIoProject,
  type FrameIoAsset,
  type AsanaWorkspace,
  type AsanaProject,
  type AsanaProjectPreview,
  type AsanaDeepImportOptions,
  type AsanaImportStats,
} from "../lib/integrations";
import { SpacePicker } from "./SpacePicker";

/* ─── Shared Dialog Shell ─── */

function DialogShell({
  open,
  onClose,
  title,
  icon: Icon,
  iconColor,
  children,
  width,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  width?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "oklch(0.15 0.01 260 / 0.4)", backdropFilter: "blur(4px)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative rounded-[12px] shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--surface-bg)",
          border: "1px solid var(--border-default)",
          width: width || "480px",
          maxWidth: "95vw",
          maxHeight: "85vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div
            className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0"
            style={{ background: `${iconColor}15` }}
          >
            <Icon size={18} weight="fill" style={{ color: iconColor }} />
          </div>
          <h2 className="text-[15px] font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center transition-colors hover:bg-black/[0.04]"
            style={{ color: "var(--text-quaternary)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">{children}</div>
      </motion.div>
    </div>
  );
}

/* ─── Shared Button ─── */

function ActionButton({
  onClick,
  loading,
  disabled,
  children,
  variant = "primary",
  color,
}: {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  color?: string;
}) {
  const accentColor = color || "oklch(0.55 0.2 280)";
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="px-4 py-2 rounded-[6px] text-[13px] font-medium transition-all disabled:opacity-50 flex items-center gap-2"
      style={{
        background:
          variant === "primary"
            ? accentColor
            : variant === "danger"
            ? "oklch(0.7 0.18 25 / 0.1)"
            : "var(--neutral-200)",
        color:
          variant === "primary"
            ? "white"
            : variant === "danger"
            ? "oklch(0.55 0.18 25)"
            : "var(--text-secondary)",
      }}
    >
      {loading && <CircleNotch size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ─── Status Chip ─── */

function StatusChip({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        background: connected ? "oklch(0.73 0.15 155 / 0.12)" : "oklch(0.85 0.15 85 / 0.15)",
        color: connected ? "oklch(0.4 0.12 155)" : "oklch(0.5 0.12 85)",
      }}
    >
      <div
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: connected ? "oklch(0.6 0.15 155)" : "oklch(0.7 0.15 85)" }}
      />
      {label || (connected ? "Connected" : "Not connected")}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   GOOGLE CALENDAR DIALOG (P12-1)
   ═══════════════════════════════════════════════════════════ */

export function GoogleCalendarDialog({
  open,
  onClose,
  status,
  onRefreshStatus,
  onSyncEvents,
}: {
  open: boolean;
  onClose: () => void;
  status: IntegrationStatus | null;
  onRefreshStatus: () => void;
  onSyncEvents?: (events: any[]) => void;
}) {
  const [step, setStep] = useState<"connect" | "calendars" | "syncing" | "done">(
    status?.google.connected ? "calendars" : "connect"
  );
  const [connecting, setConnecting] = useState(false);
  const [calendars, setCalendars] = useState<GCalCalendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ count: number; syncedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (open && status?.google.connected) {
      setStep("calendars");
      loadCalendars();
    } else if (open) {
      setStep("connect");
    }
  }, [open, status?.google.connected]);

  const loadCalendars = async () => {
    setLoadingCalendars(true);
    const cals = await getGCalCalendars();
    setCalendars(cals);
    // Auto-select primary calendar
    const primary = cals.find((c) => c.primary);
    if (primary) setSelectedCalendars(new Set([primary.id]));
    setLoadingCalendars(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const authData = await getGoogleAuthUrl("gcal");
      if (!authData?.authUrl) {
        setError("Failed to get Google auth URL. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured.");
        setConnecting(false);
        return;
      }

      openGoogleOAuthPopup(
        authData.authUrl,
        () => {
          setConnecting(false);
          setStep("calendars");
          onRefreshStatus();
          loadCalendars();
        },
        (err) => {
          setConnecting(false);
          setError(err);
        }
      );
    } catch (err) {
      setError(String(err));
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setStep("syncing");
    setError(null);
    try {
      const result = await syncGCalEvents({
        calendarIds: Array.from(selectedCalendars),
        daysAhead: 30,
      });
      if (result) {
        setSyncResult({ count: result.events.length, syncedAt: result.syncedAt });
        onSyncEvents?.(result.events);
        setStep("done");
      } else {
        setError("Sync returned no data");
        setStep("calendars");
      }
    } catch (err) {
      setError(String(err));
      setStep("calendars");
    }
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await disconnectIntegration("google");
    onRefreshStatus();
    setStep("connect");
    setCalendars([]);
    setDisconnecting(false);
  };

  const toggleCalendar = (id: string) => {
    setSelectedCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Google Calendar"
      icon={GoogleLogo}
      iconColor="oklch(0.7 0.18 25)"
    >
      <div className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-[8px]" style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}>
            <Warning size={14} style={{ color: "oklch(0.55 0.18 25)" }} className="shrink-0 mt-0.5" />
            <p className="text-[12px]" style={{ color: "oklch(0.45 0.12 25)" }}>{error}</p>
          </div>
        )}

        {/* Connect Step */}
        {step === "connect" && (
          <div className="text-center space-y-4 py-4">
            <div
              className="w-16 h-16 rounded-[14px] flex items-center justify-center mx-auto"
              style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}
            >
              <Calendar size={28} style={{ color: "oklch(0.7 0.18 25)" }} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Connect Google Calendar
              </h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                Sync your calendar events, deadlines, and meetings directly into Canto.
              </p>
            </div>
            <div className="space-y-2 text-left max-w-[300px] mx-auto">
              {["View and sync calendar events", "Create events from tasks", "Two-way deadline sync"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={14} weight="bold" style={{ color: "oklch(0.6 0.15 155)" }} />
                  <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{f}</span>
                </div>
              ))}
            </div>
            <ActionButton onClick={handleConnect} loading={connecting} color="oklch(0.55 0.18 25)">
              <GoogleLogo size={16} weight="bold" />
              Sign in with Google
            </ActionButton>
            {!status?.google.hasClientCredentials && (
              <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
              </p>
            )}
          </div>
        )}

        {/* Calendar Selection */}
        {step === "calendars" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <StatusChip connected label={`Connected as ${status?.google.email || "Google Account"}`} />
              </div>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-[12px] font-medium px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
                style={{ color: "oklch(0.55 0.18 25)" }}
              >
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>

            <div>
              <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Select Calendars to Sync
              </h3>
              {loadingCalendars ? (
                <div className="flex items-center gap-2 py-4 justify-center">
                  <CircleNotch size={16} className="animate-spin" style={{ color: "var(--text-quaternary)" }} />
                  <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>Loading calendars...</span>
                </div>
              ) : (
                <div className="space-y-1 max-h-[240px] overflow-y-auto">
                  {calendars.map((cal) => (
                    <label
                      key={cal.id}
                      className="flex items-center gap-3 p-2.5 rounded-[6px] cursor-pointer transition-colors hover:bg-black/[0.02]"
                    >
                      <button
                        onClick={() => toggleCalendar(cal.id)}
                        className="w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors"
                        style={{
                          borderColor: selectedCalendars.has(cal.id)
                            ? cal.backgroundColor || "oklch(0.55 0.2 280)"
                            : "var(--border-default)",
                          background: selectedCalendars.has(cal.id)
                            ? cal.backgroundColor || "oklch(0.55 0.2 280)"
                            : "transparent",
                        }}
                      >
                        {selectedCalendars.has(cal.id) && <Check size={10} weight="bold" color="white" />}
                      </button>
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: cal.backgroundColor || "oklch(0.6 0.1 260)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium block truncate" style={{ color: "var(--text-primary)" }}>
                          {cal.summary}
                        </span>
                        {cal.description && (
                          <span className="text-[11px] block truncate" style={{ color: "var(--text-quaternary)" }}>
                            {cal.description}
                          </span>
                        )}
                      </div>
                      {cal.primary && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--neutral-100)", color: "var(--text-quaternary)" }}>
                          Primary
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <ActionButton
                onClick={handleSync}
                loading={syncing}
                disabled={selectedCalendars.size === 0}
                color="oklch(0.55 0.18 25)"
              >
                <ArrowRight size={14} />
                Sync {selectedCalendars.size} Calendar{selectedCalendars.size !== 1 ? "s" : ""}
              </ActionButton>
            </div>
          </>
        )}

        {/* Syncing */}
        {step === "syncing" && (
          <div className="text-center py-8 space-y-3">
            <CircleNotch size={32} className="animate-spin mx-auto" style={{ color: "oklch(0.7 0.18 25)" }} />
            <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>Syncing events...</p>
            <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
              Fetching events from {selectedCalendars.size} calendar{selectedCalendars.size !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Done */}
        {step === "done" && syncResult && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle size={40} weight="fill" className="mx-auto" style={{ color: "oklch(0.6 0.15 155)" }} />
            <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Sync Complete</h3>
            <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              {syncResult.count} event{syncResult.count !== 1 ? "s" : ""} synced to Canto
            </p>
            <ActionButton onClick={onClose} color="oklch(0.55 0.18 25)">Done</ActionButton>
          </div>
        )}
      </div>
    </DialogShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   GMAIL DIALOG (P12-2)
   ═══════════════════════════════════════════════════════════ */

export function GmailDialog({
  open,
  onClose,
  status,
  onRefreshStatus,
  onCreateTask,
}: {
  open: boolean;
  onClose: () => void;
  status: IntegrationStatus | null;
  onRefreshStatus: () => void;
  onCreateTask?: (task: GmailTaskExtraction) => void;
}) {
  const [step, setStep] = useState<"connect" | "emails" | "extracting">(
    status?.google.connected ? "emails" : "connect"
  );
  const [connecting, setConnecting] = useState(false);
  const [emails, setEmails] = useState<GmailEmail[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedTask, setExtractedTask] = useState<GmailTaskExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && status?.google.connected) {
      setStep("emails");
      loadStarredEmails();
    } else if (open) {
      setStep("connect");
    }
  }, [open, status?.google.connected]);

  const loadStarredEmails = async () => {
    setLoading(true);
    const starred = await getGmailStarred(20);
    setEmails(starred);
    setLoading(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const authData = await getGoogleAuthUrl("gmail");
      if (!authData?.authUrl) {
        setError("Failed to get auth URL.");
        setConnecting(false);
        return;
      }
      openGoogleOAuthPopup(
        authData.authUrl,
        () => {
          setConnecting(false);
          setStep("emails");
          onRefreshStatus();
          loadStarredEmails();
        },
        (err) => {
          setConnecting(false);
          setError(err);
        }
      );
    } catch (err) {
      setError(String(err));
      setConnecting(false);
    }
  };

  const handleExtractTask = async (email: GmailEmail) => {
    setSelectedEmail(email);
    setExtracting(true);
    setStep("extracting");
    setExtractedTask(null);

    const task = await extractTaskFromEmail({
      subject: email.subject,
      from: email.from,
      snippet: email.snippet,
      date: email.date,
      threadId: email.threadId,
      messageId: email.id,
    });

    setExtractedTask(task);
    setExtracting(false);
  };

  const handleCreateTask = () => {
    if (extractedTask) {
      onCreateTask?.(extractedTask);
      // Remove from list
      setEmails((prev) => prev.filter((e) => e.id !== selectedEmail?.id));
      setStep("emails");
      setExtractedTask(null);
      setSelectedEmail(null);
    }
  };

  const parseFromName = (from: string) => {
    const match = from.match(/^"?([^"<]+)"?\s*<?/);
    return match ? match[1].trim() : from.split("@")[0];
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Gmail Integration"
      icon={EnvelopeSimple}
      iconColor="oklch(0.55 0.2 280)"
      width="520px"
    >
      <div className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-[8px]" style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}>
            <Warning size={14} style={{ color: "oklch(0.55 0.18 25)" }} className="shrink-0 mt-0.5" />
            <p className="text-[12px]" style={{ color: "oklch(0.45 0.12 25)" }}>{error}</p>
          </div>
        )}

        {/* Connect Step */}
        {step === "connect" && (
          <div className="text-center space-y-4 py-4">
            <div
              className="w-16 h-16 rounded-[14px] flex items-center justify-center mx-auto"
              style={{ background: "oklch(0.55 0.2 280 / 0.08)" }}
            >
              <EnvelopeSimple size={28} style={{ color: "oklch(0.55 0.2 280)" }} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Connect Gmail
              </h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                Turn starred emails into actionable tasks using AI-powered extraction.
              </p>
            </div>
            <div className="space-y-2 text-left max-w-[300px] mx-auto">
              {["Fetch starred emails", "AI-powered task extraction", "Auto-populate task fields"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check size={14} weight="bold" style={{ color: "oklch(0.6 0.15 155)" }} />
                  <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{f}</span>
                </div>
              ))}
            </div>
            <ActionButton onClick={handleConnect} loading={connecting} color="oklch(0.55 0.2 280)">
              <GoogleLogo size={16} weight="bold" />
              Sign in with Google
            </ActionButton>
          </div>
        )}

        {/* Starred Emails */}
        {step === "emails" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Starred Emails
              </h3>
              <button
                onClick={loadStarredEmails}
                disabled={loading}
                className="text-[12px] font-medium px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
                style={{ color: "oklch(0.55 0.2 280)" }}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <CircleNotch size={16} className="animate-spin" style={{ color: "var(--text-quaternary)" }} />
                <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>Loading starred emails...</span>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8">
                <Star size={24} className="mx-auto mb-2" style={{ color: "var(--text-quaternary)" }} />
                <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>No starred emails found</p>
                <p className="text-[12px]" style={{ color: "var(--text-quaternary)" }}>
                  Star an email in Gmail to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[360px] overflow-y-auto">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className="flex items-start gap-3 p-3 rounded-[8px] cursor-pointer transition-colors hover:bg-black/[0.02] group"
                    style={{ border: "1px solid var(--border-subtle)" }}
                    onClick={() => handleExtractTask(email)}
                  >
                    <Star size={14} weight="fill" className="shrink-0 mt-1" style={{ color: "oklch(0.85 0.15 85)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {parseFromName(email.from)}
                        </span>
                        <span className="text-[11px] shrink-0" style={{ color: "var(--text-quaternary)" }}>
                          {email.date ? new Date(email.date).toLocaleDateString() : ""}
                        </span>
                      </div>
                      <p className="text-[12px] font-medium truncate" style={{ color: "var(--text-secondary)" }}>
                        {email.subject}
                      </p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--text-quaternary)" }}>
                        {email.snippet}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      <Sparkle size={14} style={{ color: "oklch(0.55 0.2 280)" }} />
                      <span className="text-[11px] font-medium" style={{ color: "oklch(0.55 0.2 280)" }}>Extract</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Task Extraction */}
        {step === "extracting" && (
          <>
            <button
              onClick={() => { setStep("emails"); setExtractedTask(null); }}
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              <ArrowLeft size={12} /> Back to emails
            </button>

            {extracting ? (
              <div className="text-center py-8 space-y-3">
                <Sparkle size={28} className="mx-auto animate-pulse" style={{ color: "oklch(0.55 0.2 280)" }} />
                <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
                  Extracting task with AI...
                </p>
                <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                  Analyzing: {selectedEmail?.subject}
                </p>
              </div>
            ) : extractedTask ? (
              <div className="space-y-3">
                <div className="p-3 rounded-[8px]" style={{ background: "oklch(0.55 0.2 280 / 0.04)", border: "1px solid oklch(0.55 0.2 280 / 0.1)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle size={14} weight="fill" style={{ color: "oklch(0.55 0.2 280)" }} />
                    <span className="text-[12px] font-semibold" style={{ color: "oklch(0.45 0.15 280)" }}>
                      AI-Extracted Task
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] font-medium block" style={{ color: "var(--text-quaternary)" }}>Title</span>
                      <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{extractedTask.title}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-medium block" style={{ color: "var(--text-quaternary)" }}>Description</span>
                      <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{extractedTask.description}</span>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-[11px] font-medium block" style={{ color: "var(--text-quaternary)" }}>Priority</span>
                        <span className="text-[12px] capitalize" style={{ color: "var(--text-secondary)" }}>{extractedTask.priority}</span>
                      </div>
                      {extractedTask.dueDate && (
                        <div>
                          <span className="text-[11px] font-medium block" style={{ color: "var(--text-quaternary)" }}>Due Date</span>
                          <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{extractedTask.dueDate}</span>
                        </div>
                      )}
                    </div>
                    {extractedTask.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {extractedTask.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ background: "var(--neutral-100)", color: "var(--text-tertiary)" }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] px-1" style={{ color: "var(--text-quaternary)" }}>
                  From: {selectedEmail?.from} | Subject: {selectedEmail?.subject}
                </div>

                <div className="flex justify-end gap-2">
                  <ActionButton onClick={() => { setStep("emails"); setExtractedTask(null); }} variant="secondary">
                    Cancel
                  </ActionButton>
                  <ActionButton onClick={handleCreateTask} color="oklch(0.55 0.2 280)">
                    <Check size={14} weight="bold" />
                    Create Task
                  </ActionButton>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Warning size={24} className="mx-auto mb-2" style={{ color: "oklch(0.55 0.18 25)" }} />
                <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>Failed to extract task from email</p>
              </div>
            )}
          </>
        )}
      </div>
    </DialogShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   FRAME.IO DIALOG (P12-3)
   ═══════════════════════════════════════════════════════════ */

export function FrameIoDialog({
  open,
  onClose,
  status,
  onRefreshStatus,
}: {
  open: boolean;
  onClose: () => void;
  status: IntegrationStatus | null;
  onRefreshStatus: () => void;
}) {
  const [step, setStep] = useState<"connect" | "browse">(status?.frameio.connected ? "browse" : "connect");
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [teams, setTeams] = useState<FrameIoTeam[]>([]);
  const [projects, setProjects] = useState<FrameIoProject[]>([]);
  const [assets, setAssets] = useState<FrameIoAsset[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<FrameIoTeam | null>(null);
  const [selectedProject, setSelectedProject] = useState<FrameIoProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (open && status?.frameio.connected) {
      setStep("browse");
      loadTeams();
    } else if (open) {
      setStep("connect");
    }
  }, [open, status?.frameio.connected]);

  const loadTeams = async () => {
    setLoading(true);
    const t = await getFrameIoTeams();
    setTeams(t);
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!token.trim()) return;
    setConnecting(true);
    setError(null);
    const result = await connectFrameIo(token.trim());
    if (result) {
      onRefreshStatus();
      setStep("browse");
      loadTeams();
      setToken("");
    } else {
      setError("Invalid token. Please check your Frame.io Developer Token.");
    }
    setConnecting(false);
  };

  const handleSelectTeam = async (team: FrameIoTeam) => {
    setSelectedTeam(team);
    setSelectedProject(null);
    setLoading(true);
    setBreadcrumbs([{ id: team.id, name: team.name }]);
    const p = await getFrameIoProjects(team.id);
    setProjects(p);
    setAssets([]);
    setLoading(false);
  };

  const handleSelectProject = async (project: FrameIoProject) => {
    setSelectedProject(project);
    setLoading(true);
    setBreadcrumbs((prev) => [...prev.slice(0, 1), { id: project.id, name: project.name }]);
    const a = await getFrameIoAssets({ projectId: project.id });
    setAssets(a);
    setLoading(false);
  };

  const handleBrowseAsset = async (asset: FrameIoAsset) => {
    if (asset.type !== "folder" && asset.type !== "version_stack") return;
    setLoading(true);
    setBreadcrumbs((prev) => [...prev, { id: asset.id, name: asset.name }]);
    const a = await getFrameIoAssets({ assetId: asset.id });
    setAssets(a);
    setLoading(false);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      // Back to teams
      setSelectedTeam(null);
      setSelectedProject(null);
      setProjects([]);
      setAssets([]);
      setBreadcrumbs([]);
    } else if (index === 1 && selectedTeam) {
      // Back to projects
      setSelectedProject(null);
      setAssets([]);
      setBreadcrumbs((prev) => prev.slice(0, 1));
      handleSelectTeam(selectedTeam);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await disconnectIntegration("frameio");
    onRefreshStatus();
    setStep("connect");
    setTeams([]);
    setProjects([]);
    setAssets([]);
    setDisconnecting(false);
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Frame.io"
      icon={FilmStrip}
      iconColor="oklch(0.65 0.15 180)"
      width="520px"
    >
      <div className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-[8px]" style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}>
            <Warning size={14} style={{ color: "oklch(0.55 0.18 25)" }} className="shrink-0 mt-0.5" />
            <p className="text-[12px]" style={{ color: "oklch(0.45 0.12 25)" }}>{error}</p>
          </div>
        )}

        {/* Connect */}
        {step === "connect" && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-[14px] flex items-center justify-center mx-auto mb-3"
                style={{ background: "oklch(0.65 0.15 180 / 0.08)" }}
              >
                <FilmStrip size={28} style={{ color: "oklch(0.65 0.15 180)" }} />
              </div>
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Connect Frame.io
              </h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                Browse teams, projects, and review assets directly in Canto.
              </p>
            </div>

            <div>
              <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Developer Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="fio-u-..."
                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
                style={{
                  background: "var(--neutral-50)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-quaternary)" }}>
                Generate a token at{" "}
                <a href="https://developer.frame.io/tokens" target="_blank" rel="noopener noreferrer" className="underline">
                  developer.frame.io/tokens
                </a>
              </p>
            </div>

            <ActionButton onClick={handleConnect} loading={connecting} disabled={!token.trim()} color="oklch(0.55 0.12 180)">
              Connect
            </ActionButton>
          </div>
        )}

        {/* Browse */}
        {step === "browse" && (
          <>
            <div className="flex items-center justify-between">
              <StatusChip connected label={`Connected as ${status?.frameio.accountName || "Frame.io"}`} />
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-[12px] font-medium px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
                style={{ color: "oklch(0.55 0.18 25)" }}
              >
                {disconnecting ? "..." : "Disconnect"}
              </button>
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 text-[12px] flex-wrap">
                <button
                  onClick={() => handleBreadcrumbClick(0)}
                  className="font-medium hover:underline"
                  style={{ color: "oklch(0.55 0.12 180)" }}
                >
                  Teams
                </button>
                {breadcrumbs.map((bc, i) => (
                  <span key={bc.id} className="flex items-center gap-1">
                    <CaretRight size={10} style={{ color: "var(--text-quaternary)" }} />
                    <button
                      onClick={() => handleBreadcrumbClick(i + 1)}
                      className="font-medium hover:underline"
                      style={{ color: i === breadcrumbs.length - 1 ? "var(--text-primary)" : "oklch(0.55 0.12 180)" }}
                    >
                      {bc.name}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <CircleNotch size={16} className="animate-spin" style={{ color: "var(--text-quaternary)" }} />
                <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>Loading...</span>
              </div>
            ) : !selectedTeam ? (
              /* Teams list */
              <div className="space-y-1">
                <h3 className="text-[13px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Teams</h3>
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSelectTeam(team)}
                    className="w-full flex items-center gap-3 p-3 rounded-[8px] text-left transition-colors hover:bg-black/[0.02]"
                    style={{ border: "1px solid var(--border-subtle)" }}
                  >
                    <Buildings size={18} style={{ color: "oklch(0.55 0.12 180)" }} />
                    <div className="flex-1">
                      <span className="text-[13px] font-medium block" style={{ color: "var(--text-primary)" }}>{team.name}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{team.memberCount} members</span>
                    </div>
                    <CaretRight size={14} style={{ color: "var(--text-quaternary)" }} />
                  </button>
                ))}
                {teams.length === 0 && (
                  <p className="text-[13px] py-4 text-center" style={{ color: "var(--text-tertiary)" }}>No teams found</p>
                )}
              </div>
            ) : !selectedProject ? (
              /* Projects list */
              <div className="space-y-1 max-h-[320px] overflow-y-auto">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className="w-full flex items-center gap-3 p-3 rounded-[8px] text-left transition-colors hover:bg-black/[0.02]"
                    style={{ border: "1px solid var(--border-subtle)" }}
                  >
                    <Folder size={18} style={{ color: "oklch(0.55 0.12 180)" }} />
                    <div className="flex-1">
                      <span className="text-[13px] font-medium block" style={{ color: "var(--text-primary)" }}>{proj.name}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{proj.itemCount} items</span>
                    </div>
                    <CaretRight size={14} style={{ color: "var(--text-quaternary)" }} />
                  </button>
                ))}
              </div>
            ) : (
              /* Assets list */
              <div className="space-y-1 max-h-[320px] overflow-y-auto">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => asset.type === "folder" && handleBrowseAsset(asset)}
                    className={`flex items-center gap-3 p-3 rounded-[8px] transition-colors ${asset.type === "folder" ? "cursor-pointer hover:bg-black/[0.02]" : ""}`}
                    style={{ border: "1px solid var(--border-subtle)" }}
                  >
                    {asset.thumbnailUrl ? (
                      <img src={asset.thumbnailUrl} alt="" className="w-10 h-10 rounded-[4px] object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-[4px] flex items-center justify-center shrink-0" style={{ background: "var(--neutral-100)" }}>
                        {asset.type === "folder" ? (
                          <Folder size={18} style={{ color: "var(--text-quaternary)" }} />
                        ) : (
                          <FileText size={18} style={{ color: "var(--text-quaternary)" }} />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium block truncate" style={{ color: "var(--text-primary)" }}>{asset.name}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                        {asset.type} {asset.commentCount > 0 && `· ${asset.commentCount} comments`}
                      </span>
                    </div>
                    {asset.type === "folder" && <CaretRight size={14} style={{ color: "var(--text-quaternary)" }} />}
                  </div>
                ))}
                {assets.length === 0 && (
                  <p className="text-[13px] py-4 text-center" style={{ color: "var(--text-tertiary)" }}>No assets found</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DialogShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   ASANA DEEP IMPORT DIALOG (P12-4)
   Multi-step wizard: Connect → Workspace → Select Projects →
   Preview & Options → Import with progress → Results summary.
   ═══════════════════════════════════════════════════════════ */

type AsanaStep = "connect" | "workspaces" | "projects" | "preview" | "importing" | "done";

const ASANA_COLOR_MAP: Record<string, string> = {
  "dark-pink": "oklch(0.65 0.18 350)",
  "dark-green": "oklch(0.55 0.15 155)",
  "dark-blue": "oklch(0.5 0.15 250)",
  "dark-red": "oklch(0.55 0.18 25)",
  "dark-teal": "oklch(0.55 0.12 180)",
  "dark-brown": "oklch(0.55 0.08 55)",
  "dark-orange": "oklch(0.65 0.15 55)",
  "dark-purple": "oklch(0.55 0.18 290)",
  "dark-warm-gray": "oklch(0.55 0.02 50)",
  "light-pink": "oklch(0.8 0.12 350)",
  "light-green": "oklch(0.75 0.12 155)",
  "light-blue": "oklch(0.7 0.12 250)",
  "light-red": "oklch(0.75 0.12 25)",
  "light-teal": "oklch(0.75 0.1 180)",
  "light-yellow": "oklch(0.88 0.1 85)",
  "light-orange": "oklch(0.8 0.12 55)",
  "light-purple": "oklch(0.75 0.12 290)",
  "light-warm-gray": "oklch(0.8 0.02 50)",
};

const ASANA_ACCENT = "oklch(0.7 0.18 25)";
const ASANA_ACCENT_DARK = "oklch(0.55 0.15 25)";

function OptionToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-[8px] cursor-pointer transition-colors hover:bg-black/[0.015]"
      style={{ border: `1px solid ${checked ? "oklch(0.7 0.18 25 / 0.35)" : "var(--border-subtle)"}` }}
    >
      <Icon size={16} weight="regular" className="shrink-0 mt-0.5" style={{ color: checked ? ASANA_ACCENT : "var(--text-quaternary)" }} />
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium block" style={{ color: "var(--text-primary)" }}>{label}</span>
        <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{description}</span>
      </div>
      <div className="relative mt-0.5">
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-8 h-[18px] rounded-full transition-colors"
          style={{ background: checked ? ASANA_ACCENT : "var(--neutral-200)" }}
        />
        <div className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform"
          style={{ left: checked ? "16px" : "2px" }}
        />
      </div>
    </label>
  );
}

function StatBadge({ icon: Icon, value, label }: { icon: React.ElementType; value: number; label: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: "var(--neutral-50)", color: "var(--text-tertiary)" }}
    >
      <Icon size={11} />
      {value} {label}
    </span>
  );
}

export function AsanaImportDialog({
  open,
  onClose,
  status,
  onRefreshStatus,
  onImportProject,
}: {
  open: boolean;
  onClose: () => void;
  status: IntegrationStatus | null;
  onRefreshStatus: () => void;
  onImportProject?: (project: any, spaceId?: string) => void;
}) {
  const [step, setStep] = useState<AsanaStep>(status?.asana.connected ? "workspaces" : "connect");
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [workspaces, setWorkspaces] = useState<AsanaWorkspace[]>([]);
  const [projects, setProjects] = useState<AsanaProject[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<AsanaWorkspace | null>(null);
  const [selectedGids, setSelectedGids] = useState<Set<string>>(new Set());
  const [previews, setPreviews] = useState<Map<string, AsanaProjectPreview>>(new Map());
  const [loadingPreview, setLoadingPreview] = useState<string | null>(null);
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Import options
  const [importOptions, setImportOptions] = useState<AsanaDeepImportOptions>({
    includeComments: true,
    includeAttachments: true,
    includeDependencies: true,
    includeCustomFields: true,
  });

  // Import target space
  const [targetSpaceId, setTargetSpaceId] = useState<string | undefined>(undefined);

  // Import progress
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importCurrentName, setImportCurrentName] = useState("");
  const [importResults, setImportResults] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<{ gid: string; error: string }[]>([]);

  useEffect(() => {
    if (open && status?.asana.connected) {
      setStep("workspaces");
      loadWorkspaces();
    } else if (open) {
      setStep("connect");
    }
  }, [open, status?.asana.connected]);

  // Reset selections when going back
  const resetToWorkspaces = () => {
    setStep("workspaces");
    setSelectedWorkspace(null);
    setSelectedGids(new Set());
    setPreviews(new Map());
    setExpandedPreview(null);
    setSearchQuery("");
  };

  const resetToProjects = () => {
    setStep("projects");
    setSelectedGids(new Set());
    setPreviews(new Map());
    setExpandedPreview(null);
  };

  const loadWorkspaces = async () => {
    setLoading(true);
    setError(null);
    const ws = await getAsanaWorkspaces();
    setWorkspaces(ws);
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!token.trim()) return;
    setConnecting(true);
    setError(null);
    const result = await connectAsana(token.trim());
    if (result) {
      onRefreshStatus();
      setStep("workspaces");
      loadWorkspaces();
      setToken("");
    } else {
      setError("Invalid Personal Access Token. Please check and try again.");
    }
    setConnecting(false);
  };

  const handleSelectWorkspace = async (ws: AsanaWorkspace) => {
    setSelectedWorkspace(ws);
    setLoading(true);
    setStep("projects");
    setSearchQuery("");
    const p = await getAsanaProjects(ws.gid);
    setProjects(p);
    setLoading(false);
  };

  const toggleProjectSelection = (gid: string) => {
    setSelectedGids((prev) => {
      const next = new Set(prev);
      if (next.has(gid)) {
        next.delete(gid);
      } else if (next.size < 10) {
        next.add(gid);
      }
      return next;
    });
  };

  const handleLoadPreview = async (gid: string) => {
    if (previews.has(gid)) {
      setExpandedPreview(expandedPreview === gid ? null : gid);
      return;
    }
    setLoadingPreview(gid);
    setExpandedPreview(gid);
    const preview = await getAsanaProjectPreview(gid);
    if (preview) {
      setPreviews((prev) => new Map(prev).set(gid, preview));
    }
    setLoadingPreview(null);
  };

  const handleGoToPreview = () => {
    if (selectedGids.size === 0) return;
    setStep("preview");
  };

  const handleStartImport = async () => {
    const gids = Array.from(selectedGids);
    setStep("importing");
    setImportProgress(0);
    setImportTotal(gids.length);
    setImportResults([]);
    setImportErrors([]);
    setError(null);

    if (gids.length === 1) {
      // Single project deep import
      setImportCurrentName(projects.find((p) => p.gid === gids[0])?.name || "Project");
      const result = await deepImportAsanaProject(gids[0], importOptions);
      if (result?.project) {
        setImportResults([result.project]);
        onImportProject?.(result.project, targetSpaceId);
      } else {
        setImportErrors([{ gid: gids[0], error: "Import failed" }]);
      }
      setImportProgress(1);
    } else {
      // Batch import — do one at a time for progress tracking
      const results: any[] = [];
      const errors: { gid: string; error: string }[] = [];

      for (let i = 0; i < gids.length; i++) {
        const gid = gids[i];
        const proj = projects.find((p) => p.gid === gid);
        setImportCurrentName(proj?.name || `Project ${i + 1}`);
        setImportProgress(i);

        try {
          const result = await deepImportAsanaProject(gid, importOptions);
          if (result?.project) {
            results.push(result.project);
            onImportProject?.(result.project, targetSpaceId);
          } else {
            errors.push({ gid, error: "Import returned no data" });
          }
        } catch (err) {
          errors.push({ gid, error: String(err) });
        }
      }

      setImportResults(results);
      setImportErrors(errors);
      setImportProgress(gids.length);
    }

    setStep("done");
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await disconnectIntegration("asana");
    onRefreshStatus();
    setStep("connect");
    setWorkspaces([]);
    setProjects([]);
    setSelectedGids(new Set());
    setDisconnecting(false);
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    if (!showArchived && p.archived) return false;
    if (searchQuery) {
      return p.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Total stats across all import results
  const totalStats: AsanaImportStats | null = importResults.length > 0
    ? importResults.reduce(
        (acc, p) => ({
          tasks: acc.tasks + (p.stats?.tasks || p.tasks?.length || 0),
          subtasks: acc.subtasks + (p.stats?.subtasks || 0),
          comments: acc.comments + (p.stats?.comments || 0),
          attachments: acc.attachments + (p.stats?.attachments || 0),
          dependencies: acc.dependencies + (p.stats?.dependencies || 0),
          sections: acc.sections + (p.stats?.sections || 0),
          members: acc.members + (p.stats?.members || 0),
        }),
        { tasks: 0, subtasks: 0, comments: 0, attachments: 0, dependencies: 0, sections: 0, members: 0 }
      )
    : null;

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Import from Asana"
      icon={Cube}
      iconColor={ASANA_ACCENT}
      width="560px"
    >
      <div className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-[8px]" style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}>
            <Warning size={14} style={{ color: "oklch(0.55 0.18 25)" }} className="shrink-0 mt-0.5" />
            <p className="text-[12px]" style={{ color: "oklch(0.45 0.12 25)" }}>{error}</p>
          </div>
        )}

        {/* ── Step 1: Connect ── */}
        {step === "connect" && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <div className="w-16 h-16 rounded-[14px] flex items-center justify-center mx-auto mb-3"
                style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}
              >
                <Cube size={28} style={{ color: ASANA_ACCENT }} />
              </div>
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Deep Import from Asana
              </h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                Import projects with tasks, subtasks, comments, attachments, dependencies, and custom fields.
              </p>
            </div>
            <div>
              <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Personal Access Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="1/12345678..."
                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
                style={{
                  background: "var(--neutral-50)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
              <p className="text-[11px] mt-1" style={{ color: "var(--text-quaternary)" }}>
                Generate at{" "}
                <a href="https://app.asana.com/0/my-apps" target="_blank" rel="noopener noreferrer" className="underline">
                  app.asana.com/0/my-apps
                </a>{" "}
                → Personal Access Tokens
              </p>
            </div>
            <ActionButton onClick={handleConnect} loading={connecting} disabled={!token.trim()} color={ASANA_ACCENT_DARK}>
              Connect & Browse
            </ActionButton>
          </div>
        )}

        {/* ── Step 2: Workspaces ── */}
        {step === "workspaces" && (
          <>
            <div className="flex items-center justify-between">
              <StatusChip connected label={`Connected as ${status?.asana.userName || "Asana"}`} />
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-[12px] font-medium px-2 py-1 rounded-[4px] transition-colors hover:bg-black/[0.04]"
                style={{ color: "oklch(0.55 0.18 25)" }}
              >
                {disconnecting ? "..." : "Disconnect"}
              </button>
            </div>

            <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>Select Workspace</h3>

            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <CircleNotch size={16} className="animate-spin" style={{ color: "var(--text-quaternary)" }} />
                <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>Loading workspaces...</span>
              </div>
            ) : (
              <div className="space-y-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws.gid}
                    onClick={() => handleSelectWorkspace(ws)}
                    className="w-full flex items-center gap-3 p-3 rounded-[8px] text-left transition-colors hover:bg-black/[0.02]"
                    style={{ border: "1px solid var(--border-subtle)" }}
                  >
                    <Buildings size={18} style={{ color: ASANA_ACCENT_DARK }} />
                    <div className="flex-1">
                      <span className="text-[13px] font-medium block" style={{ color: "var(--text-primary)" }}>{ws.name}</span>
                      <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                        {ws.isOrganization ? "Organization" : "Workspace"}
                      </span>
                    </div>
                    <CaretRight size={14} style={{ color: "var(--text-quaternary)" }} />
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Step 3: Select Projects (multi-select with search) ── */}
        {step === "projects" && (
          <>
            <button onClick={resetToWorkspaces}
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              <ArrowLeft size={12} /> {selectedWorkspace?.name || "Workspaces"}
            </button>

            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Select Projects
              </h3>
              {selectedGids.size > 0 && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.7 0.18 25 / 0.1)", color: ASANA_ACCENT_DARK }}
                >
                  {selectedGids.size} selected (max 10)
                </span>
              )}
            </div>

            {/* Search bar */}
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-quaternary)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-8 pr-3 py-2 rounded-[6px] text-[13px] outline-none"
                style={{
                  background: "var(--neutral-50)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Show archived toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded"
              />
              <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                Show archived projects ({projects.filter((p) => p.archived).length})
              </span>
            </label>

            {loading ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <CircleNotch size={16} className="animate-spin" style={{ color: "var(--text-quaternary)" }} />
                <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>Loading projects...</span>
              </div>
            ) : (
              <div className="space-y-1 max-h-[320px] overflow-y-auto">
                {filteredProjects.map((proj) => {
                  const isSelected = selectedGids.has(proj.gid);
                  const preview = previews.get(proj.gid);
                  const isExpanded = expandedPreview === proj.gid;
                  const isLoadingPreview = loadingPreview === proj.gid;

                  return (
                    <div key={proj.gid}>
                      <div
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-[8px] text-left transition-colors hover:bg-black/[0.02]"
                        style={{
                          border: `1px solid ${isSelected ? "oklch(0.7 0.18 25 / 0.35)" : "var(--border-subtle)"}`,
                          background: isSelected ? "oklch(0.7 0.18 25 / 0.04)" : undefined,
                        }}
                      >
                        {/* Checkbox */}
                        <button onClick={() => toggleProjectSelection(proj.gid)}
                          className="w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors"
                          style={{
                            border: `1.5px solid ${isSelected ? ASANA_ACCENT : "var(--border-default)"}`,
                            background: isSelected ? ASANA_ACCENT : "transparent",
                          }}
                        >
                          {isSelected && <Check size={12} weight="bold" className="text-white" />}
                        </button>

                        {/* Color dot + name */}
                        <div className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: ASANA_COLOR_MAP[proj.color] || "var(--text-quaternary)" }}
                        />
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleProjectSelection(proj.gid)}>
                          <span className="text-[13px] font-medium block truncate" style={{ color: "var(--text-primary)" }}>
                            {proj.name}
                            {proj.archived && (
                              <span className="ml-1 text-[10px] font-normal" style={{ color: "var(--text-quaternary)" }}>(archived)</span>
                            )}
                          </span>
                          {proj.statusTitle && (
                            <span className="text-[11px] truncate block" style={{ color: "var(--text-quaternary)" }}>{proj.statusTitle}</span>
                          )}
                        </div>

                        {/* Preview toggle */}
                        <button
                          onClick={() => handleLoadPreview(proj.gid)}
                          className="w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0 transition-colors hover:bg-black/[0.04]"
                          title="Preview project details"
                        >
                          {isLoadingPreview ? (
                            <CircleNotch size={12} className="animate-spin" style={{ color: "var(--text-quaternary)" }} />
                          ) : (
                            <Info size={13} style={{ color: isExpanded ? ASANA_ACCENT : "var(--text-quaternary)" }} />
                          )}
                        </button>
                      </div>

                      {/* Expanded preview */}
                      {isExpanded && preview && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-[30px] mb-1"
                        >
                          <div className="py-2 pl-3 space-y-2" style={{ borderLeft: `2px solid oklch(0.7 0.18 25 / 0.2)` }}>
                            {preview.description && (
                              <p className="text-[11px] line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
                                {preview.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              <StatBadge icon={ListChecks} value={preview.totalTasks} label="tasks" />
                              <StatBadge icon={TreeStructure} value={preview.sections.length} label="sections" />
                              <StatBadge icon={UsersThree} value={preview.members.length} label="members" />
                              <StatBadge icon={Sliders} value={preview.customFields.length} label="fields" />
                            </div>
                            {preview.sections.length > 0 && (
                              <div className="space-y-0.5">
                                {preview.sections.slice(0, 6).map((s) => (
                                  <div key={s.gid} className="flex items-center justify-between text-[11px]"
                                    style={{ color: "var(--text-quaternary)" }}
                                  >
                                    <span className="truncate">{s.name}</span>
                                    <span className="shrink-0 ml-2">{s.taskCount}</span>
                                  </div>
                                ))}
                                {preview.sections.length > 6 && (
                                  <span className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>
                                    +{preview.sections.length - 6} more sections
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <p className="text-[13px] py-4 text-center" style={{ color: "var(--text-tertiary)" }}>
                    {searchQuery ? "No projects match your search" : "No projects found in this workspace"}
                  </p>
                )}
              </div>
            )}

            {/* Continue button */}
            {selectedGids.size > 0 && (
              <ActionButton onClick={handleGoToPreview} color={ASANA_ACCENT_DARK}>
                Continue with {selectedGids.size} project{selectedGids.size > 1 ? "s" : ""} <ArrowRight size={14} />
              </ActionButton>
            )}
          </>
        )}

        {/* ── Step 4: Preview & Import Options ── */}
        {step === "preview" && (
          <>
            <button onClick={resetToProjects}
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              <ArrowLeft size={12} /> Back to projects
            </button>

            <h3 className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              Import Settings
            </h3>

            {/* Selected projects summary */}
            <div className="rounded-[8px] p-3 space-y-1.5" style={{ background: "var(--neutral-50)", border: "1px solid var(--border-subtle)" }}>
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-quaternary)" }}>
                {selectedGids.size} Project{selectedGids.size > 1 ? "s" : ""}
              </span>
              {Array.from(selectedGids).map((gid) => {
                const proj = projects.find((p) => p.gid === gid);
                if (!proj) return null;
                return (
                  <div key={gid} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: ASANA_COLOR_MAP[proj.color] || "var(--text-quaternary)" }}
                    />
                    <span className="text-[12px] truncate" style={{ color: "var(--text-primary)" }}>{proj.name}</span>
                    <button onClick={() => {
                      setSelectedGids((prev) => {
                        const next = new Set(prev);
                        next.delete(gid);
                        return next;
                      });
                    }}
                      className="ml-auto shrink-0"
                    >
                      <X size={12} style={{ color: "var(--text-quaternary)" }} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Import options */}
            <div className="space-y-2">
              <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                What to import
              </span>
              <OptionToggle
                icon={ChatCircleDots}
                label="Comments"
                description="Task comments and conversation history"
                checked={importOptions.includeComments}
                onChange={(v) => setImportOptions((o) => ({ ...o, includeComments: v }))}
              />
              <OptionToggle
                icon={Paperclip}
                label="Attachments"
                description="File links and attachment metadata"
                checked={importOptions.includeAttachments}
                onChange={(v) => setImportOptions((o) => ({ ...o, includeAttachments: v }))}
              />
              <OptionToggle
                icon={GitBranch}
                label="Dependencies"
                description="Task blocking relationships"
                checked={importOptions.includeDependencies}
                onChange={(v) => setImportOptions((o) => ({ ...o, includeDependencies: v }))}
              />
              <OptionToggle
                icon={Sliders}
                label="Custom Fields"
                description="Priority, status, and other custom fields"
                checked={importOptions.includeCustomFields}
                onChange={(v) => setImportOptions((o) => ({ ...o, includeCustomFields: v }))}
              />
            </div>

            {/* Warning for many options + projects */}
            {selectedGids.size > 3 && (importOptions.includeComments || importOptions.includeAttachments) && (
              <div className="flex items-start gap-2 p-3 rounded-[8px]" style={{ background: "oklch(0.88 0.1 85 / 0.2)" }}>
                <Info size={14} style={{ color: "oklch(0.55 0.12 85)" }} className="shrink-0 mt-0.5" />
                <p className="text-[11px]" style={{ color: "oklch(0.4 0.1 85)" }}>
                  Importing {selectedGids.size} projects with comments/attachments may take several minutes.
                  Each task requires additional API calls.
                </p>
              </div>
            )}

            {/* Assign to space */}
            <div className="flex items-center gap-2 py-2">
              <span style={{ color: "var(--text-tertiary)", fontSize: "12px", fontWeight: 500 }}>
                Assign to space:
              </span>
              <SpacePicker
                value={targetSpaceId}
                onChange={setTargetSpaceId}
                compact
                label="No space"
              />
            </div>

            <ActionButton onClick={handleStartImport} color={ASANA_ACCENT_DARK}>
              <DownloadSimple size={14} />
              Start Deep Import
            </ActionButton>
          </>
        )}

        {/* ── Step 5: Importing ── */}
        {step === "importing" && (
          <div className="text-center py-6 space-y-4">
            <CircleNotch size={36} className="animate-spin mx-auto" style={{ color: ASANA_ACCENT }} />
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Importing{importTotal > 1 ? ` ${importProgress + 1} of ${importTotal}` : ""}...
              </p>
              {importCurrentName && (
                <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {importCurrentName}
                </p>
              )}
              <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                Fetching tasks, subtasks
                {importOptions.includeComments ? ", comments" : ""}
                {importOptions.includeAttachments ? ", attachments" : ""}
                {importOptions.includeDependencies ? ", dependencies" : ""}
                ...
              </p>
            </div>

            {/* Progress bar */}
            {importTotal > 1 && (
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--neutral-100)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ASANA_ACCENT }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${Math.max(5, (importProgress / importTotal) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── Step 6: Results ── */}
        {step === "done" && (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-2">
              <CheckCircle size={40} weight="fill" className="mx-auto"
                style={{ color: importErrors.length === 0 ? "oklch(0.6 0.15 155)" : "oklch(0.65 0.15 85)" }}
              />
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {importErrors.length === 0 ? "Import Complete" : "Import Finished with Errors"}
              </h3>
            </div>

            {/* Imported projects */}
            {importResults.length > 0 && (
              <div className="rounded-[8px] p-3 space-y-2" style={{ background: "oklch(0.6 0.15 155 / 0.04)", border: "1px solid oklch(0.6 0.15 155 / 0.15)" }}>
                {importResults.map((proj, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={14} weight="fill" style={{ color: "oklch(0.6 0.15 155)" }} />
                    <span className="text-[13px] font-medium flex-1 truncate" style={{ color: "var(--text-primary)" }}>
                      {proj.name}
                    </span>
                    <span className="text-[11px] shrink-0" style={{ color: "var(--text-tertiary)" }}>
                      {proj.stats?.tasks || proj.tasks?.length || 0} tasks
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Errors */}
            {importErrors.length > 0 && (
              <div className="rounded-[8px] p-3 space-y-2" style={{ background: "oklch(0.55 0.18 25 / 0.04)", border: "1px solid oklch(0.55 0.18 25 / 0.15)" }}>
                {importErrors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Warning size={14} style={{ color: "oklch(0.55 0.18 25)" }} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[12px] font-medium block" style={{ color: "oklch(0.45 0.12 25)" }}>
                        {projects.find((p) => p.gid === err.gid)?.name || err.gid}
                      </span>
                      <span className="text-[11px]" style={{ color: "oklch(0.55 0.08 25)" }}>{err.error}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total stats */}
            {totalStats && (
              <div className="flex flex-wrap gap-1.5 justify-center">
                <StatBadge icon={ListChecks} value={totalStats.tasks} label="tasks" />
                <StatBadge icon={CheckSquare} value={totalStats.subtasks} label="subtasks" />
                <StatBadge icon={ChatCircleDots} value={totalStats.comments} label="comments" />
                <StatBadge icon={Paperclip} value={totalStats.attachments} label="attachments" />
                <StatBadge icon={GitBranch} value={totalStats.dependencies} label="deps" />
                <StatBadge icon={UsersThree} value={totalStats.members} label="members" />
              </div>
            )}

            <div className="flex gap-2">
              <ActionButton
                onClick={() => {
                  resetToProjects();
                  setImportResults([]);
                  setImportErrors([]);
                }}
                variant="secondary"
                color={ASANA_ACCENT_DARK}
              >
                Import More
              </ActionButton>
              <ActionButton onClick={onClose} color={ASANA_ACCENT_DARK}>
                Done
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </DialogShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   CRAFT IMPORT DIALOG (P12-6)
   ═══════════════════════════════════════════════════════════ */

export function CraftImportDialog({
  open,
  onClose,
  onImportDocs,
}: {
  open: boolean;
  onClose: () => void;
  onImportDocs?: (docs: any[]) => void;
}) {
  const [mode, setMode] = useState<"select" | "markdown" | "json" | "importing" | "done">("select");
  const [markdownContent, setMarkdownContent] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMarkdownImport = async () => {
    if (!markdownContent.trim()) return;
    setImporting(true);
    setMode("importing");
    setError(null);

    const doc = await importCraftMarkdown({
      markdown: markdownContent,
      title: docTitle || "Imported from Craft",
      sourceName: "craft-markdown",
    });

    if (doc) {
      setImportedCount(1);
      onImportDocs?.([doc]);
      setMode("done");
    } else {
      setError("Failed to import markdown");
      setMode("markdown");
    }
    setImporting(false);
  };

  const handleJsonImport = async () => {
    if (!jsonFile) return;
    setImporting(true);
    setMode("importing");
    setError(null);

    try {
      const text = await jsonFile.text();
      const parsed = JSON.parse(text);

      // Support both array format and { documents: [...] } format
      const documents = Array.isArray(parsed) ? parsed : parsed.documents || parsed.docs || [parsed];

      const docs = await importCraftJson(documents);
      if (docs) {
        setImportedCount(docs.length);
        onImportDocs?.(docs);
        setMode("done");
      } else {
        setError("Failed to import JSON");
        setMode("json");
      }
    } catch (err) {
      setError(`Invalid JSON file: ${err}`);
      setMode("json");
    }
    setImporting(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setJsonFile(file);

      // Also try to read as markdown if it's .md
      if (file.name.endsWith(".md") || file.name.endsWith(".markdown")) {
        setMode("markdown");
        file.text().then((text) => {
          setMarkdownContent(text);
          setDocTitle(file.name.replace(/\.(md|markdown)$/, ""));
        });
      }
    }
  };

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title="Import from Craft"
      icon={PencilSimple}
      iconColor="oklch(0.55 0.15 280)"
      width="520px"
    >
      <div className="p-5 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-[8px]" style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}>
            <Warning size={14} style={{ color: "oklch(0.55 0.18 25)" }} className="shrink-0 mt-0.5" />
            <p className="text-[12px]" style={{ color: "oklch(0.45 0.12 25)" }}>{error}</p>
          </div>
        )}

        {/* Mode Selection */}
        {mode === "select" && (
          <div className="space-y-4 py-2">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-[14px] flex items-center justify-center mx-auto mb-3"
                style={{ background: "oklch(0.55 0.15 280 / 0.08)" }}
              >
                <PencilSimple size={28} style={{ color: "oklch(0.55 0.15 280)" }} />
              </div>
              <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Import from Craft
              </h3>
              <p className="text-[13px] mt-1 mb-4" style={{ color: "var(--text-tertiary)" }}>
                Import your Craft documents into Canto. Export from Craft as Markdown or JSON.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("markdown")}
                className="p-4 rounded-[10px] text-center transition-all hover:scale-[1.02]"
                style={{ border: "1px solid var(--border-default)", background: "var(--neutral-50)" }}
              >
                <FileText size={24} className="mx-auto mb-2" style={{ color: "oklch(0.55 0.15 280)" }} />
                <span className="text-[13px] font-semibold block" style={{ color: "var(--text-primary)" }}>Markdown</span>
                <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>Paste or upload .md</span>
              </button>
              <button
                onClick={() => setMode("json")}
                className="p-4 rounded-[10px] text-center transition-all hover:scale-[1.02]"
                style={{ border: "1px solid var(--border-default)", background: "var(--neutral-50)" }}
              >
                <TreeStructure size={24} className="mx-auto mb-2" style={{ color: "oklch(0.55 0.15 280)" }} />
                <span className="text-[13px] font-semibold block" style={{ color: "var(--text-primary)" }}>JSON Export</span>
                <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>Upload .json file</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-[6px] text-[13px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-black/[0.04]"
              style={{ border: "1px dashed var(--border-default)", color: "var(--text-tertiary)" }}
            >
              <Upload size={14} />
              Or drop/select a file
            </button>
          </div>
        )}

        {/* Markdown Input */}
        {mode === "markdown" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("select")}
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              <ArrowLeft size={12} /> Back
            </button>

            <div>
              <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Document Title
              </label>
              <input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="My Craft Document"
                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none"
                style={{
                  background: "var(--neutral-50)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <label className="text-[12px] font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Markdown Content
              </label>
              <textarea
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                placeholder="Paste your Craft markdown export here..."
                rows={12}
                className="w-full px-3 py-2 rounded-[6px] text-[13px] outline-none resize-none font-mono"
                style={{
                  background: "var(--neutral-50)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <ActionButton onClick={() => setMode("select")} variant="secondary">Cancel</ActionButton>
              <ActionButton onClick={handleMarkdownImport} loading={importing} disabled={!markdownContent.trim()} color="oklch(0.55 0.15 280)">
                <DownloadSimple size={14} />
                Import Document
              </ActionButton>
            </div>
          </div>
        )}

        {/* JSON Upload */}
        {mode === "json" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("select")}
              className="flex items-center gap-1 text-[12px] font-medium"
              style={{ color: "var(--text-tertiary)" }}
            >
              <ArrowLeft size={12} /> Back
            </button>

            <div
              className="border-2 border-dashed rounded-[10px] p-8 text-center cursor-pointer transition-colors hover:bg-black/[0.01]"
              style={{ borderColor: jsonFile ? "oklch(0.6 0.15 155)" : "var(--border-default)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              {jsonFile ? (
                <>
                  <CheckCircle size={28} className="mx-auto mb-2" style={{ color: "oklch(0.6 0.15 155)" }} />
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{jsonFile.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                    {(jsonFile.size / 1024).toFixed(1)} KB — Click to change
                  </p>
                </>
              ) : (
                <>
                  <Upload size={28} className="mx-auto mb-2" style={{ color: "var(--text-quaternary)" }} />
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                    Select JSON file
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
                    Export from Craft &rarr; Share &rarr; Export as JSON
                  </p>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <ActionButton onClick={() => setMode("select")} variant="secondary">Cancel</ActionButton>
              <ActionButton onClick={handleJsonImport} loading={importing} disabled={!jsonFile} color="oklch(0.55 0.15 280)">
                <DownloadSimple size={14} />
                Import
              </ActionButton>
            </div>
          </div>
        )}

        {/* Importing */}
        {mode === "importing" && (
          <div className="text-center py-8 space-y-3">
            <CircleNotch size={32} className="animate-spin mx-auto" style={{ color: "oklch(0.55 0.15 280)" }} />
            <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>Importing...</p>
            <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>Converting Craft blocks to Canto format</p>
          </div>
        )}

        {/* Done */}
        {mode === "done" && (
          <div className="text-center py-6 space-y-3">
            <CheckCircle size={40} weight="fill" className="mx-auto" style={{ color: "oklch(0.6 0.15 155)" }} />
            <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>Import Complete</h3>
            <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
              {importedCount} document{importedCount !== 1 ? "s" : ""} imported into Canto Docs
            </p>
            <ActionButton onClick={onClose} color="oklch(0.55 0.15 280)">Done</ActionButton>
          </div>
        )}
      </div>
    </DialogShell>
  );
}
