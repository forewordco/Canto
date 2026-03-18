/* ═══════════════════════════════════════════════════════════
   PROFILE SETTINGS PAGE — Full user settings with profile
   editing, avatar upload, theme selection, notification
   preferences, integration stubs, and data management.

   All settings auto-save on change.
   Phase 10 of Canto build plan.
   ═══════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Gear,
  User,
  Camera,
  Sun,
  Moon,
  Monitor,
  Bell,
  BellRinging,
  Check,
  At,
  ChatText,
  ArrowsClockwise,
  UserCircle,
  CheckCircle,
  Desktop,
  Plugs,
  GoogleLogo,
  EnvelopeSimple,
  Download,
  Upload,
  Trash,
  CaretRight,
  CalendarBlank,
  ListBullets,
  SlidersHorizontal,
  Eye,
  Globe,
  Buildings,
  Tag,
  SignOut,
  X,
  Info,
  Warning,
  Sparkle,
  CircleNotch,
  Robot,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/auth";
import { useData } from "../lib/data";
import { useTheme } from "../lib/theme";
import type { ProfileData, ThemeMode, WeekStart, DateFormat } from "../lib/types";
import { getAiStatus, chatWithAi, type AiStatus } from "../lib/ai";
import { usePushNotifications } from "../lib/push";
import { toast } from "sonner";
import { getIntegrationStatus, type IntegrationStatus } from "../lib/integrations";

import {
  GoogleCalendarDialog,
  GmailDialog,
} from "./IntegrationDialogs";
import { ImageCropModal } from "./ImageCropModal";

/* ─── Section Types ─── */
type SettingsSection = "profile" | "appearance" | "notifications" | "integrations" | "data";

/* ─── Section Card ─── */
function SectionCard({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--surface-bg)", border: "1px solid var(--border-default)" }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <h3 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
        {description && (
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>{description}</p>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ─── Toggle Switch ─── */
function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <button
        onClick={() => onChange(!checked)}
        className="relative w-10 h-[22px] rounded-full shrink-0 transition-colors mt-0.5"
        style={{
          background: checked ? "var(--accent-primary)" : "var(--neutral-300)",
        }}
      >
        <div
          className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform"
          style={{
            left: checked ? "calc(100% - 20px)" : "2px",
          }}
        />
      </button>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{label}</span>
        {description && (
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-quaternary)" }}>{description}</p>
        )}
      </div>
    </label>
  );
}

/* ─── Avatar Upload Component ─── */
function AvatarEditor({
  profile,
  onUpdate,
}: {
  profile: ProfileData;
  onUpdate: (updates: Partial<ProfileData>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const initials = profile.displayName
    ? profile.displayName.split(/\s+/).map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

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

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file as data URL, then open crop modal
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }, []);

  const handleCropComplete = useCallback((_blob: Blob, dataUrl: string) => {
    onUpdate({ avatarUrl: dataUrl });
    setCropSrc(null);
  }, [onUpdate]);

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: profile.avatarColor,
            }}
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span style={{ color: "white", fontSize: "24px", fontWeight: 700, textShadow: "0 1px 2px oklch(0 0 0/0.1)" }}>
                {initials}
              </span>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera size={20} style={{ color: "white" }} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[12px] font-medium px-3 py-1.5 rounded-[6px]"
              style={{ color: "var(--accent-primary)", background: "var(--accent-primary-subtle)" }}
            >
              Upload Photo
            </button>
            {profile.avatarUrl && (
              <button
                onClick={() => onUpdate({ avatarUrl: undefined })}
                className="text-[12px] font-medium px-3 py-1.5 rounded-[6px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Remove
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {avatarColors.map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ avatarColor: c })}
                className="w-5 h-5 rounded-full hover:scale-110 transition-transform"
                style={{
                  background: c,
                  outline: profile.avatarColor === c ? "2px solid var(--accent-primary)" : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          shape="circle"
          aspect="1:1"
          outputWidth={256}
          title="Crop Avatar"
          onCrop={handleCropComplete}
          onClose={() => setCropSrc(null)}
        />
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   PROFILE SETTINGS PAGE — Main Export
   ═══════════════════════════════════════════════════════════ */

export function ProfileSettingsPage() {
  const { profile, updateProfile, signOut, isDevMode } = useAuth();
  const { saveNow, reload, hasDirtyData, lastSavedAt, projects, clients, docs, teamMembers, setEvents, events, addEvent, addTask } = useData();
  const { theme, setTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const { requestPermission, isPermissionGranted } = usePushNotifications();
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null);
  const [activeDialog, setActiveDialog] = useState<"gcal" | "gmail" | null>(null);

  const refreshIntegrationStatus = useCallback(() => {
    getIntegrationStatus().then((s) => setIntegrationStatus(s));
  }, []);

  useEffect(() => {
    if (activeSection === "integrations") {
      getAiStatus().then((status) => setAiStatus(status));
      refreshIntegrationStatus();
    }
  }, [activeSection, refreshIntegrationStatus]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>Loading profile...</p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<ProfileData>) => {
    updateProfile(updates);
  };

  const sections: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Sun },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "integrations", label: "Integrations", icon: Plugs },
    { id: "data", label: "Data", icon: SlidersHorizontal },
  ];

  const themes: { id: ThemeMode; label: string; icon: React.ElementType; desc: string }[] = [
    { id: "light", label: "Light", icon: Sun, desc: "Bright, clean interface" },
    { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
    { id: "system", label: "System", icon: Monitor, desc: "Match device settings" },
  ];

  const integrations = [
    {
      name: "Google Calendar",
      icon: GoogleLogo,
      desc: "Sync events and deadlines",
      connected: integrationStatus?.google.connected || false,
      connectedLabel: integrationStatus?.google.email || undefined,
      color: "oklch(0.7 0.18 25)",
      dialogId: "gcal" as const,
    },
    {
      name: "Gmail",
      icon: EnvelopeSimple,
      desc: "AI-powered email-to-task pipeline",
      connected: integrationStatus?.google.connected || false,
      connectedLabel: integrationStatus?.google.email || undefined,
      color: "oklch(0.55 0.2 280)",
      dialogId: "gmail" as const,
    },
  ];

  const handleExportData = () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        projects: Object.values(projects),
        clients,
        docs,
        teamMembers,
        profile,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `flowos-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <h1 className="text-[24px] font-bold mb-6" style={{ color: "var(--text-primary)" }}>Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="md:w-[180px] shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors shrink-0"
                style={{
                  color: activeSection === s.id ? "var(--accent-primary)" : "var(--text-tertiary)",
                  background: activeSection === s.id ? "var(--accent-primary-subtle)" : "transparent",
                }}
              >
                <s.icon size={16} weight={activeSection === s.id ? "fill" : "regular"} />
                {s.label}
              </button>
            ))}

            <div className="hidden md:block mt-4 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 rounded-[6px] text-[13px] font-medium transition-colors w-full hover:bg-black/[0.03]"
                style={{ color: "oklch(0.7 0.18 25)" }}
              >
                <SignOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-5">
          {/* ─── PROFILE SECTION ─── */}
          {activeSection === "profile" && (
            <>
              <SectionCard title="Avatar">
                <AvatarEditor profile={profile} onUpdate={handleUpdate} />
              </SectionCard>

              <SectionCard title="Personal Info" description="This info is visible to your team.">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Display Name</label>
                    <input
                      value={profile.displayName}
                      onChange={(e) => handleUpdate({ displayName: e.target.value })}
                      className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
                      style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Email</label>
                    <input
                      value={profile.email}
                      onChange={(e) => handleUpdate({ email: e.target.value })}
                      className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
                      style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Role</label>
                      <input
                        value={profile.role || ""}
                        onChange={(e) => handleUpdate({ role: e.target.value })}
                        placeholder="e.g. Designer"
                        className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
                        style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Department</label>
                      <input
                        value={profile.department || ""}
                        onChange={(e) => handleUpdate({ department: e.target.value })}
                        placeholder="e.g. Engineering"
                        className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
                        style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Timezone</label>
                    <input
                      value={profile.timezone || ""}
                      onChange={(e) => handleUpdate({ timezone: e.target.value })}
                      placeholder="America/New_York"
                      className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none"
                      style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Bio</label>
                    <textarea
                      value={profile.bio || ""}
                      onChange={(e) => handleUpdate({ bio: e.target.value })}
                      placeholder="A short bio about yourself..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-[6px] text-[14px] outline-none resize-none"
                      style={{ background: "var(--neutral-100)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
                    />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ─── APPEARANCE SECTION ─── */}
          {activeSection === "appearance" && (
            <>
              <SectionCard title="Theme" description="Choose how Canto looks.">
                <div className="grid grid-cols-3 gap-3">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTheme(t.id);
                        handleUpdate({ theme: t.id });
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-[8px] transition-colors"
                      style={{
                        background: theme === t.id ? "var(--accent-primary-subtle)" : "var(--neutral-100)",
                        border: `2px solid ${theme === t.id ? "var(--accent-primary)" : "transparent"}`,
                      }}
                    >
                      <t.icon
                        size={24}
                        weight={theme === t.id ? "fill" : "regular"}
                        style={{ color: theme === t.id ? "var(--accent-primary)" : "var(--text-tertiary)" }}
                      />
                      <span className="text-[13px] font-medium" style={{ color: theme === t.id ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                        {t.label}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Preferences">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>Week Starts On</label>
                    <div className="flex gap-2">
                      {(["monday", "sunday"] as WeekStart[]).map((ws) => (
                        <button
                          key={ws}
                          onClick={() => handleUpdate({ weekStart: ws })}
                          className="px-4 py-2 rounded-[6px] text-[13px] font-medium capitalize transition-colors"
                          style={{
                            background: profile.weekStart === ws ? "var(--accent-primary-subtle)" : "var(--neutral-100)",
                            color: profile.weekStart === ws ? "var(--accent-primary)" : "var(--text-secondary)",
                            border: `1px solid ${profile.weekStart === ws ? "var(--accent-primary)" : "var(--border-default)"}`,
                          }}
                        >
                          {ws}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>Date Format</label>
                    <div className="flex gap-2">
                      {([
                        { id: "mdy" as DateFormat, label: "MM/DD/YYYY" },
                        { id: "dmy" as DateFormat, label: "DD/MM/YYYY" },
                      ]).map((df) => (
                        <button
                          key={df.id}
                          onClick={() => handleUpdate({ dateFormat: df.id })}
                          className="px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors"
                          style={{
                            background: profile.dateFormat === df.id ? "var(--accent-primary-subtle)" : "var(--neutral-100)",
                            color: profile.dateFormat === df.id ? "var(--accent-primary)" : "var(--text-secondary)",
                            border: `1px solid ${profile.dateFormat === df.id ? "var(--accent-primary)" : "var(--border-default)"}`,
                          }}
                        >
                          {df.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Toggle
                    checked={profile.compactMode || false}
                    onChange={(v) => handleUpdate({ compactMode: v })}
                    label="Compact Mode"
                    description="Reduce spacing and font sizes throughout the app."
                  />

                  <Toggle
                    checked={profile.preferShortNames || false}
                    onChange={(v) => handleUpdate({ preferShortNames: v })}
                    label="Short Names"
                    description="Show first names only in task assignments and comments."
                  />
                </div>
              </SectionCard>
            </>
          )}

          {/* ─── NOTIFICATIONS SECTION ─── */}
          {activeSection === "notifications" && (
            <>
              <SectionCard title="Notification Channels">
                <div className="space-y-1">
                  <Toggle
                    checked={profile.notifyInbox !== false}
                    onChange={(v) => handleUpdate({ notifyInbox: v })}
                    label="Inbox Notifications"
                    description="Show notifications in your inbox."
                  />
                  <Toggle
                    checked={profile.notifyDesktop || false}
                    onChange={(v) => handleUpdate({ notifyDesktop: v })}
                    label="Desktop Notifications"
                    description="Browser push notifications when Canto is in the background."
                  />
                </div>
              </SectionCard>

              <SectionCard title="Notification Types" description="Choose which events trigger notifications.">
                <div className="space-y-1">
                  <Toggle
                    checked={profile.notifyTaskAssigned !== false}
                    onChange={(v) => handleUpdate({ notifyTaskAssigned: v })}
                    label="Task Assigned"
                    description="When a task is assigned to you."
                  />
                  <Toggle
                    checked={profile.notifyTaskCompleted !== false}
                    onChange={(v) => handleUpdate({ notifyTaskCompleted: v })}
                    label="Task Completed"
                    description="When a task you're following is completed."
                  />
                  <Toggle
                    checked={profile.notifyComments !== false}
                    onChange={(v) => handleUpdate({ notifyComments: v })}
                    label="Comments"
                    description="When someone comments on a task you follow."
                  />
                  <Toggle
                    checked={profile.notifyMentions !== false}
                    onChange={(v) => handleUpdate({ notifyMentions: v })}
                    label="Mentions"
                    description="When someone @mentions you."
                  />
                  <Toggle
                    checked={profile.notifyUpdates !== false}
                    onChange={(v) => handleUpdate({ notifyUpdates: v })}
                    label="Status Updates"
                    description="When project statuses change."
                  />
                </div>
              </SectionCard>
            </>
          )}

          {/* ─── INTEGRATIONS SECTION ─── */}
          {activeSection === "integrations" && (
            <SectionCard title="Integrations" description="Connect external services to enhance your workflow.">
              <div className="space-y-3">
                {/* ── Gemini AI (Live) ── */}
                <div
                  className="p-3 rounded-[8px]"
                  style={{ background: "oklch(0.55 0.2 280 / 0.04)", border: "1px solid oklch(0.55 0.2 280 / 0.15)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
                      style={{ background: "oklch(0.55 0.2 280 / 0.12)" }}
                    >
                      <Sparkle size={20} weight="fill" style={{ color: "oklch(0.55 0.2 280)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                          Gemini AI
                        </span>
                        {aiStatus?.configured && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: "oklch(0.73 0.15 155 / 0.15)", color: "oklch(0.45 0.12 155)" }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.6 0.15 155)" }} />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                        {aiStatus?.configured
                          ? `Connected to ${aiStatus.model} — document writing, text rewriting, slash commands, and doc chat`
                          : aiStatus === null
                          ? "Checking connection..."
                          : "API key not configured. Contact your admin."}
                      </p>
                    </div>
                    <button
                      disabled={aiTesting || !aiStatus?.configured}
                      onClick={async () => {
                        setAiTesting(true);
                        setAiTestResult(null);
                        try {
                          const result = await chatWithAi({ message: "Say hello in one short sentence as Canto AI assistant." });
                          setAiTestResult(result?.reply || "No response received");
                        } catch (err) {
                          setAiTestResult("Test failed — check console for details");
                        }
                        setAiTesting(false);
                      }}
                      className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors shrink-0 disabled:opacity-50"
                      style={{
                        background: aiStatus?.configured ? "oklch(0.55 0.2 280 / 0.12)" : "var(--neutral-200)",
                        color: aiStatus?.configured ? "oklch(0.55 0.2 280)" : "var(--text-quaternary)",
                      }}
                    >
                      {aiTesting ? (
                        <span className="flex items-center gap-1.5">
                          <CircleNotch size={12} className="animate-spin" />
                          Testing...
                        </span>
                      ) : (
                        "Test Connection"
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {aiTestResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 overflow-hidden"
                        style={{ borderTop: "1px solid oklch(0.55 0.2 280 / 0.1)" }}
                      >
                        <div className="flex items-start gap-2">
                          <Robot size={14} style={{ color: "oklch(0.55 0.2 280)" }} className="shrink-0 mt-0.5" />
                          <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                            {aiTestResult}
                          </p>
                        </div>
                        <button
                          onClick={() => setAiTestResult(null)}
                          className="text-[11px] mt-1.5 ml-5"
                          style={{ color: "var(--text-quaternary)" }}
                        >
                          Dismiss
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {aiStatus?.configured && (
                    <div className="mt-3 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ borderTop: "1px solid oklch(0.55 0.2 280 / 0.08)" }}>
                      {[
                        { label: "Doc Writing", desc: "AI-assisted content creation" },
                        { label: "Slash Commands", desc: "Inline AI in documents" },
                        { label: "Rewrite Text", desc: "Polish your writing" },
                        { label: "Doc Chat", desc: "Ask questions about docs" },
                      ].map((cap) => (
                        <div key={cap.label} className="px-2 py-1.5 rounded-[6px]" style={{ background: "oklch(0.55 0.2 280 / 0.04)" }}>
                          <span className="text-[11px] font-medium block" style={{ color: "var(--text-primary)" }}>{cap.label}</span>
                          <span className="text-[10px]" style={{ color: "var(--text-quaternary)" }}>{cap.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── External Integrations ── */}
                {integrations.map((integ) => (
                  <div
                    key={integ.name}
                    className="flex items-center gap-3 p-3 rounded-[8px] transition-colors hover:bg-black/[0.01]"
                    style={{
                      background: integ.connected ? `${integ.color}04` : "var(--neutral-50)",
                      border: `1px solid ${integ.connected ? `${integ.color}15` : "var(--border-subtle)"}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0"
                      style={{ background: `${integ.color}12` }}
                    >
                      <integ.icon size={20} style={{ color: integ.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{integ.name}</span>
                        {integ.connected && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: "oklch(0.73 0.15 155 / 0.15)", color: "oklch(0.45 0.12 155)" }}
                          >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.6 0.15 155)" }} />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
                        {integ.connected && integ.connectedLabel
                          ? integ.connectedLabel
                          : integ.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveDialog(integ.dialogId)}
                      className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-colors shrink-0"
                      style={{
                        background: integ.connected ? `${integ.color}12` : "var(--neutral-200)",
                        color: integ.connected ? integ.color : "var(--text-secondary)",
                      }}
                    >
                      {integ.connected ? "Manage" : "Connect"}
                    </button>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ─── DATA SECTION ─── */}
          {activeSection === "data" && (
            <>
              <SectionCard title="Data Status">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Unsaved changes</span>
                    <span className="text-[13px] font-medium" style={{ color: hasDirtyData ? "oklch(0.85 0.15 85)" : "var(--teal-600)" }}>
                      {hasDirtyData ? "Pending" : "All saved"}
                    </span>
                  </div>
                  {lastSavedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Last saved</span>
                      <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                        {lastSavedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Projects</span>
                    <span className="text-[13px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                      {Object.keys(projects).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Clients</span>
                    <span className="text-[13px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                      {clients.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Documents</span>
                    <span className="text-[13px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                      {docs.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Team members</span>
                    <span className="text-[13px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                      {teamMembers.length}
                    </span>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Actions">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => saveNow()}
                      className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium"
                      style={{ background: "var(--accent-primary-subtle)", color: "var(--accent-primary)" }}
                    >
                      <Check size={14} weight="bold" />
                      Save Now
                    </button>
                    <button
                      onClick={() => reload()}
                      className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium"
                      style={{ background: "var(--neutral-100)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                    >
                      <ArrowsClockwise size={14} />
                      Reload Data
                    </button>
                  </div>

                  <div className="h-px" style={{ background: "var(--border-subtle)" }} />

                  <div>
                    <h4 className="text-[13px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>Export</h4>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium"
                      style={{ background: "var(--neutral-100)", color: "var(--text-secondary)", border: "1px solid var(--border-default)" }}
                    >
                      <Download size={14} />
                      Export All Data (JSON)
                    </button>
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--text-quaternary)" }}>
                      Downloads all projects, tasks, clients, documents, and settings as a JSON file.
                    </p>
                  </div>
                </div>
              </SectionCard>

              {!isDevMode && (
                <SectionCard title="Account">
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-[6px] text-[13px] font-medium"
                    style={{ color: "oklch(0.7 0.18 25)", background: "oklch(0.7 0.18 25 / 0.08)" }}
                  >
                    <SignOut size={14} />
                    Sign Out
                  </button>
                </SectionCard>
              )}
            </>
          )}

          {/* Auto-save indicator */}
          <div className="flex items-center gap-2 pt-2">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: hasDirtyData ? "oklch(0.85 0.15 85)" : "var(--teal-500)" }}
            />
            <span className="text-[11px]" style={{ color: "var(--text-quaternary)" }}>
              {hasDirtyData ? "Changes pending auto-save..." : "All changes saved"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Integration Dialogs ─── */}
      <GoogleCalendarDialog
        open={activeDialog === "gcal"}
        onClose={() => setActiveDialog(null)}
        status={integrationStatus}
        onRefreshStatus={refreshIntegrationStatus}
        onSyncEvents={(syncedEvents) => {
          // Merge GCal events into Canto calendar, avoiding duplicates
          const existing = new Set(events.map((e) => e.gcalEventId).filter(Boolean));
          const newEvents = syncedEvents.filter((e: any) => !existing.has(e.gcalEventId));
          if (newEvents.length > 0) {
            setEvents([...events, ...newEvents]);
          }
          toast.success(`Synced ${syncedEvents.length} calendar events`);
          console.log(`[GCal] Merged ${newEvents.length} new events (${syncedEvents.length} total synced)`);
        }}
      />
      <GmailDialog
        open={activeDialog === "gmail"}
        onClose={() => setActiveDialog(null)}
        status={integrationStatus}
        onRefreshStatus={refreshIntegrationStatus}
        onCreateTask={(task) => {
          // Create a task in the personal project from Gmail extraction
          const newTask = {
            id: `gmail-${task.gmailMessageId}-${Date.now()}`,
            title: task.title,
            content: task.description,
            date: task.dueDate || "",
            completed: false,
            status: "todo" as const,
            priority: task.priority,
            tags: task.tags,
            gmailMessageId: task.gmailMessageId,
            gmailThreadId: task.gmailThreadId,
            gmailFrom: task.gmailFrom,
            gmailDate: task.gmailDate,
            createdAt: new Date().toISOString(),
          };
          // Add to first available project or personal
          const projectNames = Object.keys(projects);
          const targetProject = projectNames[0] || "__personal__";
          addTask(targetProject, newTask);
          toast.success(`Task "${task.title}" created from email`);
          console.log(`[Gmail] Task "${task.title}" created in project "${targetProject}"`);
        }}
      />

    </div>
  );
}

export default ProfileSettingsPage;