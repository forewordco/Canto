import { useState } from "react";
import {
  Bell,
  BellSlash,
  Check,
  CheckCircle,
  CaretDown,
  CaretRight,
  Circle,
  Clock,
  Funnel,
  Flag,
  Folder,
  ChatText,
  DotsThree,
  BookmarkSimple,
  ListChecks,
  Archive,
  At,
  UserPlus,
  Warning,
  ArrowSquareOut,
  Star,
  Gear,
  X,
  Tray,
  Eye,
  EyeSlash,
  Paperclip,
  Plus,
  ThumbsUp,
  UsersThree,
  Lightning,
  CalendarBlank,
  GitBranch,
  LinkSimple,
  FlagPennant,
  Crosshair,
  ShieldWarning,
  Trash,
} from "@phosphor-icons/react";

/* ─── OKLCH Palette ─── */
const c = {
  coral: "oklch(0.7 0.18 25)",
  coralLight: "oklch(0.7 0.18 25 / 0.1)",
  coralMid: "oklch(0.55 0.18 25)",
  indigo: "oklch(0.55 0.2 280)",
  indigoLight: "oklch(0.55 0.2 280 / 0.1)",
  indigoMid: "oklch(0.45 0.17 280)",
  teal: "oklch(0.65 0.15 180)",
  tealLight: "oklch(0.65 0.15 180 / 0.1)",
  tealMid: "oklch(0.45 0.12 180)",
  gold: "oklch(0.85 0.15 85)",
  goldLight: "oklch(0.85 0.15 85 / 0.15)",
  goldMid: "oklch(0.55 0.12 85)",
  orange: "oklch(0.78 0.17 55)",
  orangeLight: "oklch(0.78 0.17 55 / 0.12)",
  orangeMid: "oklch(0.55 0.14 55)",
  lime: "oklch(0.8 0.17 125)",
  limeLight: "oklch(0.8 0.17 125 / 0.12)",
  limeMid: "oklch(0.55 0.14 125)",
  lavender: "oklch(0.7 0.16 300)",
  lavenderLight: "oklch(0.7 0.16 300 / 0.12)",
  lavenderMid: "oklch(0.47 0.14 300)",
  magenta: "oklch(0.7 0.17 330)",
  magentaLight: "oklch(0.7 0.17 330 / 0.12)",
  magentaMid: "oklch(0.47 0.15 330)",
  rose: "oklch(0.7 0.17 350)",
  roseLight: "oklch(0.7 0.17 350 / 0.12)",
  roseMid: "oklch(0.47 0.16 350)",
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.65 0.015 260)",
  border: "oklch(0.92 0.01 260)",
  borderSubtle: "oklch(0.94 0.008 260)",
  bg1: "oklch(0.985 0.003 260)",
  bg2: "oklch(0.97 0.005 260)",
  surface: "white",
};

/* ─── Helpers ─── */
function Avatar({ initials, bg, size = 24, badge }: { initials: string; bg: string; size?: number; badge?: React.ReactNode }) {
  return (
    <div className="relative shrink-0">
      <div className="rounded-full flex items-center justify-center" style={{ width: size, height: size, background: bg }}>
        <span style={{ color: "white", fontSize: `${Math.max(size * 0.38, 8)}px`, fontWeight: 600 }}>{initials}</span>
      </div>
      {badge && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border-2" style={{ borderColor: c.surface }}>
          {badge}
        </div>
      )}
    </div>
  );
}

function ProjectTag({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
      <span style={{ color: c.text3, fontSize: "11px", fontWeight: 500 }}>{name}</span>
    </span>
  );
}

function StatusBadge({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full" style={{ background: bg, color: fg, fontSize: "10px", fontWeight: 500, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function UnreadDot() {
  return <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.indigo }} />;
}

/* ─── Notification Card Actions (hover) ─── */
function CardActions() {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1 py-0.5 rounded-md border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: c.surface, borderColor: c.border }}>
      <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/[0.04]" title="More">
        <DotsThree className="w-3.5 h-3.5" style={{ color: c.text4 }} />
      </button>
      <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/[0.04]" title="Bookmark">
        <BookmarkSimple className="w-3.5 h-3.5" style={{ color: c.text4 }} />
      </button>
      <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/[0.04]" title="Archive">
        <Archive className="w-3.5 h-3.5" style={{ color: c.text4 }} />
      </button>
    </div>
  );
}

/* ─── Main ─── */
export function NotificationsInbox() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const filters = [
    { id: "all", label: "All", count: 14 },
    { id: "unread", label: "Unread", count: 6 },
    { id: "mentions", label: "@Mentions", count: 3 },
    { id: "assigned", label: "Assigned to me", count: 4 },
    { id: "following", label: "Following", count: 7 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.coral }} />
          <p style={{ color: c.coralMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>NOTIFICATIONS</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Notifications Inbox</h1>
        <p className="mt-2 max-w-2xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Asana-inspired notification feed — rich context cards with project attribution, status tracking, importance tiers, inline content previews, and batch actions.
        </p>
      </div>

      {/* ──────── FULL INBOX MOCK ──────── */}
      <section className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: c.border, background: c.bg1 }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Bell className="w-4.5 h-4.5" style={{ color: c.coral }} />
              <span style={{ color: c.text1, fontSize: "15px", fontWeight: 600 }}>Inbox</span>
            </div>
            {/* Filter pills */}
            <div className="flex items-center gap-1">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className="px-2.5 py-1 rounded-md transition-colors"
                  style={{
                    background: activeFilter === f.id ? c.coralLight : "transparent",
                    color: activeFilter === f.id ? c.coralMid : c.text3,
                    fontSize: "12px",
                    fontWeight: activeFilter === f.id ? 500 : 400,
                  }}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className="ml-1 px-1 rounded" style={{
                      background: activeFilter === f.id ? c.coral : c.bg2,
                      color: activeFilter === f.id ? "white" : c.text4,
                      fontSize: "10px",
                      fontWeight: 600,
                    }}>{f.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-black/[0.04]" style={{ color: c.text3, fontSize: "12px" }}>
              <Eye className="w-3 h-3" /> Mark all read
            </button>
            <button className="px-2.5 py-1 rounded-md flex items-center gap-1 hover:bg-black/[0.04]" style={{ color: c.text3, fontSize: "12px" }}>
              <Gear className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Date group: Today */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-t" style={{ borderColor: c.border, background: c.bg2 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.coral }} />
          <span style={{ color: c.text2, fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em" }}>TODAY</span>
          <div className="flex-1 h-px" style={{ background: c.border }} />
        </div>

        {/* ── Notification 1: Comment with rich content (critical) ── */}
        <div
          className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]"
          style={{ borderColor: c.border, background: "oklch(0.55 0.2 280 / 0.025)" }}
          onClick={() => setExpandedId(expandedId === 1 ? null : 1)}
        >
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Project context */}
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Website Redesign" color={c.coral} />
                <div className="flex items-center gap-2">
                  <StatusBadge label="On track" bg={c.tealLight} fg={c.tealMid} />
                  <UnreadDot />
                </div>
              </div>
              {/* Notification title */}
              <div className="flex items-center gap-2 mb-1.5">
                <ChatText className="w-4 h-4 shrink-0" style={{ color: c.text4 }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>
                  Dashboard UX Review — Feb 23
                </h3>
              </div>
              {/* Actor + time */}
              <div className="flex items-center gap-2 mb-2">
                <Avatar initials="SC" bg={c.coral} size={22} />
                <span style={{ color: c.text1, fontSize: "12px", fontWeight: 500 }}>Sarah Chen</span>
                <span style={{ color: c.text4, fontSize: "11px" }}>&middot; 12 min ago</span>
              </div>
              {/* Rich content preview */}
              {expandedId === 1 && (
                <div className="ml-7 space-y-2">
                  <div>
                    <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>Summary</p>
                    <p style={{ color: c.text3, fontSize: "13px", lineHeight: 1.6 }}>
                      Reviewed the latest dashboard prototypes. The widget grid is working well, but we need to revisit the sidebar nav — current layout conflicts with our mobile breakpoints.
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>Next steps</p>
                    <p style={{ color: c.text3, fontSize: "13px", lineHeight: 1.6 }}>
                      Prepare two sidebar variants (collapsible vs. bottom-tab on mobile) for Thursday's design crit.
                    </p>
                  </div>
                  {/* Quick actions */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button className="px-2.5 py-1 rounded-md flex items-center gap-1" style={{ background: c.coralLight, color: c.coralMid, fontSize: "11px", fontWeight: 500 }}>
                      <ChatText className="w-3 h-3" /> Reply
                    </button>
                    <button className="px-2.5 py-1 rounded-md flex items-center gap-1 border" style={{ borderColor: c.border, color: c.text3, fontSize: "11px" }}>
                      <ThumbsUp className="w-3 h-3" /> Acknowledge
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Notification 2: Task assigned (urgent — overdue) ── */}
        <div
          className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]"
          style={{ borderColor: c.border, background: "oklch(0.55 0.2 280 / 0.025)" }}
          onClick={() => setExpandedId(expandedId === 2 ? null : 2)}
        >
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Backend v2" color={c.indigo} />
                <div className="flex items-center gap-2">
                  <StatusBadge label="Overdue" bg={c.coralLight} fg={c.coralMid} />
                  <UnreadDot />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Circle className="w-4 h-4 shrink-0" style={{ color: c.text4 }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>
                  Cancel Outstanding Subscriptions/Fees
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Avatar initials="JG" bg={c.indigo} size={22} />
                <p style={{ fontSize: "12px" }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>Jack Groves</span>{" "}
                  <span style={{ color: c.text3 }}>assigned to you</span>
                </p>
                <span style={{ color: c.text4, fontSize: "11px" }}>&middot; 2h ago</span>
              </div>
              {expandedId === 2 && (
                <div className="ml-7 mt-2 flex items-center gap-1.5">
                  <button className="px-2.5 py-1 rounded-md flex items-center gap-1" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "11px", fontWeight: 500 }}>
                    <ArrowSquareOut className="w-3 h-3" /> Open task
                  </button>
                  <button className="px-2.5 py-1 rounded-md flex items-center gap-1 border" style={{ borderColor: c.border, color: c.text3, fontSize: "11px" }}>
                    <Check className="w-3 h-3" /> Mark complete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Notification 3: Comment thread with content (medium) ── */}
        <div
          className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]"
          style={{ borderColor: c.border, background: "oklch(0.55 0.2 280 / 0.025)" }}
          onClick={() => setExpandedId(expandedId === 3 ? null : 3)}
        >
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Growth Experiments" color={c.teal} />
                <div className="flex items-center gap-2">
                  <StatusBadge label="On track" bg={c.tealLight} fg={c.tealMid} />
                  <UnreadDot />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <ChatText className="w-4 h-4 shrink-0" style={{ color: c.text4 }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>
                  Onboarding Funnel Optimization — Feb 21
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Avatar initials="LP" bg={c.teal} size={22} />
                <span style={{ color: c.text1, fontSize: "12px", fontWeight: 500 }}>Lisa Park</span>
                <span style={{ color: c.text4, fontSize: "11px" }}>&middot; 3h ago</span>
              </div>
              {expandedId === 3 && (
                <div className="ml-7 space-y-2">
                  <div>
                    <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>Summary</p>
                    <p style={{ color: c.text3, fontSize: "13px", lineHeight: 1.6 }}>
                      A/B test results are in for the shortened onboarding flow. Variant B (3-step) shows a 22% improvement in completion rate compared to the 5-step control.
                    </p>
                  </div>
                  <div>
                    <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>Next steps</p>
                    <p style={{ color: c.text3, fontSize: "13px", lineHeight: 1.6 }}>
                      Ship Variant B to 100% of users. Schedule follow-up measurement for Day 7 retention.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Notification 4: Task completed (low) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Website Redesign" color={c.coral} />
                <div className="flex items-center gap-2">
                  <UnreadDot />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" style={{ color: c.teal }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 500, lineHeight: 1.3 }}>
                  Accessibility Audit — Nav Components
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Avatar initials="LP" bg={c.teal} size={22}
                  badge={<div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: c.teal }}><Check className="w-2.5 h-2.5 text-white" /></div>}
                />
                <p style={{ fontSize: "12px" }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>Lisa Park</span>{" "}
                  <span style={{ color: c.text3 }}>completed this task</span>
                </p>
                <span style={{ color: c.text4, fontSize: "11px" }}>&middot; 5h ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notification 5: Portfolio addition (info) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <Folder className="w-4 h-4 shrink-0" style={{ color: c.gold }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>
                  Productions
                </h3>
                <UnreadDot />
              </div>
              <p className="mb-2" style={{ color: c.text3, fontSize: "12px" }}>
                <span style={{ color: c.text1, fontWeight: 500 }}>Dane Pedersen</span>{" "}added new work
              </p>
              {/* Nested project items */}
              <div className="ml-1 rounded-lg border overflow-hidden" style={{ borderColor: c.borderSubtle }}>
                {[
                  { name: "Little Acorns", color: c.lime },
                  { name: "Automate 2026 (Chicago)", color: c.coral },
                  { name: "Pre-MODEX Edits", color: c.rose },
                ].map((project) => (
                  <div key={project.name} className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0 hover:bg-black/[0.02]" style={{ borderColor: c.borderSubtle }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: project.color }} />
                    <span style={{ color: c.text2, fontSize: "13px" }}>{project.name}</span>
                  </div>
                ))}
              </div>
              <button className="mt-1.5 px-1 py-0.5 rounded hover:bg-black/[0.03]" style={{ color: c.indigo, fontSize: "11px", fontWeight: 500 }}>
                Show more work
              </button>
            </div>
          </div>
        </div>

        {/* Date group: Yesterday */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-t" style={{ borderColor: c.border, background: c.bg2 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.indigo }} />
          <span style={{ color: c.text2, fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em" }}>YESTERDAY</span>
          <div className="flex-1 h-px" style={{ background: c.border }} />
        </div>

        {/* ── Notification 6: @mention (high) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border, background: "oklch(0.55 0.2 280 / 0.025)" }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Backend v2" color={c.indigo} />
                <div className="flex items-center gap-2">
                  <StatusBadge label="At risk" bg={c.orangeLight} fg={c.orangeMid} />
                  <UnreadDot />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <At className="w-4 h-4 shrink-0" style={{ color: c.lavender }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>
                  API Rate Limiting — Production Hotfix
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Avatar initials="BK" bg="oklch(0.6 0.15 320)" size={22} />
                <p style={{ fontSize: "12px" }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>Ben Kim</span>{" "}
                  <span style={{ color: c.text3 }}>mentioned you: </span>
                  <span style={{ color: c.indigoMid, fontWeight: 500 }}>@you</span>{" "}
                  <span style={{ color: c.text3 }}>can you review the throttle config before we push?</span>
                </p>
              </div>
              <div className="ml-7 flex items-center gap-1.5">
                <button className="px-2.5 py-1 rounded-md flex items-center gap-1" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "11px", fontWeight: 500 }}>
                  <ChatText className="w-3 h-3" /> Reply
                </button>
                <button className="px-2.5 py-1 rounded-md flex items-center gap-1 border" style={{ borderColor: c.border, color: c.text3, fontSize: "11px" }}>
                  <ArrowSquareOut className="w-3 h-3" /> View task
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notification 7: Milestone reached (medium) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Website Redesign" color={c.coral} />
                <StatusBadge label="On track" bg={c.tealLight} fg={c.tealMid} />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <FlagPennant className="w-4 h-4 shrink-0" style={{ color: c.gold }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 500, lineHeight: 1.3 }}>
                  Milestone reached: Design Phase Complete
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Avatar initials="SC" bg={c.coral} size={22} />
                <p style={{ fontSize: "12px" }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>Sarah Chen</span>{" "}
                  <span style={{ color: c.text3 }}>marked milestone as complete</span>
                </p>
                <span style={{ color: c.text4, fontSize: "11px" }}>&middot; yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notification 8: Approval request (critical) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Operations" color={c.gold} />
                <StatusBadge label="Needs approval" bg={c.lavenderLight} fg={c.lavenderMid} />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldWarning className="w-4 h-4 shrink-0" style={{ color: c.lavender }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 500, lineHeight: 1.3 }}>
                  Vendor Contract Renewal — Action Required
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Avatar initials="AK" bg={c.gold} size={22} />
                <p style={{ fontSize: "12px" }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>Alex Kim</span>{" "}
                  <span style={{ color: c.text3 }}>requested your approval &middot; deadline Mar 1</span>
                </p>
              </div>
              <div className="ml-7 flex items-center gap-1.5">
                <button className="px-2.5 py-1 rounded-md flex items-center gap-1" style={{ background: c.teal, color: "white", fontSize: "11px", fontWeight: 500 }}>
                  <Check className="w-3 h-3" /> Approve
                </button>
                <button className="px-2.5 py-1 rounded-md flex items-center gap-1 border" style={{ borderColor: c.border, color: c.text3, fontSize: "11px" }}>
                  <X className="w-3 h-3" /> Decline
                </button>
                <button className="px-2.5 py-1 rounded-md flex items-center gap-1 border" style={{ borderColor: c.border, color: c.text3, fontSize: "11px" }}>
                  <ChatText className="w-3 h-3" /> Comment
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Date group: Earlier This Week */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-t" style={{ borderColor: c.border, background: c.bg2 }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.text4 }} />
          <span style={{ color: c.text2, fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em" }}>EARLIER THIS WEEK</span>
          <div className="flex-1 h-px" style={{ background: c.border }} />
        </div>

        {/* ── Notification 9: Added to project (low) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <UserPlus className="w-4 h-4 shrink-0" style={{ color: c.teal }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 500, lineHeight: 1.3 }}>
                  You were added to "Q2 Planning"
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Avatar initials="JM" bg={c.indigo} size={22} />
                <p style={{ fontSize: "12px" }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>Jake Martinez</span>{" "}
                  <span style={{ color: c.text3 }}>added you as a collaborator</span>
                </p>
                <span style={{ color: c.text4, fontSize: "11px" }}>&middot; Feb 21</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notification 10: Status change (medium) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Backend v2" color={c.indigo} />
                <div className="flex items-center gap-2">
                  <StatusBadge label="At risk" bg={c.orangeLight} fg={c.orangeMid} />
                  <CaretRight className="w-3 h-3" style={{ color: c.text4 }} />
                  <StatusBadge label="Off track" bg={c.coralLight} fg={c.coralMid} />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Warning className="w-4 h-4 shrink-0" style={{ color: c.orange }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 500, lineHeight: 1.3 }}>
                  Project status changed to Off Track
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Avatar initials="BK" bg="oklch(0.6 0.15 320)" size={22} />
                <p style={{ fontSize: "12px" }}>
                  <span style={{ color: c.text1, fontWeight: 500 }}>Ben Kim</span>{" "}
                  <span style={{ color: c.text3 }}>updated the status &middot; Feb 20</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Notification 11: Attachment added (low) ── */}
        <div className="relative group border-b px-4 py-3 cursor-pointer transition-colors hover:bg-black/[0.012]" style={{ borderColor: c.border }}>
          <CardActions />
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <ProjectTag name="Growth Experiments" color={c.teal} />
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <Paperclip className="w-4 h-4 shrink-0" style={{ color: c.text4 }} />
                <h3 style={{ color: c.text1, fontSize: "14px", fontWeight: 500, lineHeight: 1.3 }}>
                  3 files attached to "Analytics Dashboard Mockups"
                </h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Avatar initials="AK" bg={c.gold} size={22} />
                <span style={{ color: c.text1, fontSize: "12px", fontWeight: 500 }}>Alex Kim</span>
                <span style={{ color: c.text4, fontSize: "11px" }}>&middot; Feb 20</span>
              </div>
              {/* File previews */}
              <div className="ml-7 flex gap-2">
                {[
                  { name: "dashboard-v3.fig", size: "2.4 MB" },
                  { name: "widget-specs.pdf", size: "840 KB" },
                  { name: "color-audit.xlsx", size: "120 KB" },
                ].map((file) => (
                  <div key={file.name} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border" style={{ borderColor: c.borderSubtle }}>
                    <Paperclip className="w-3 h-3" style={{ color: c.text4 }} />
                    <div>
                      <p style={{ color: c.text2, fontSize: "11px", fontWeight: 500 }}>{file.name}</p>
                      <p style={{ color: c.text4, fontSize: "10px" }}>{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Load more */}
        <div className="flex items-center justify-center py-3 border-t" style={{ borderColor: c.border }}>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-black/[0.03] transition-colors" style={{ color: c.text3, fontSize: "12px" }}>
            <CaretDown className="w-3.5 h-3.5" /> Load older notifications
          </button>
        </div>
      </section>

      {/* ──────── IMPORTANCE TIERS ──────── */}
      <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Importance Tiers</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>
          Vertical accent bars indicate notification priority. Color-coded for instant triage.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { color: c.coral, label: "Critical", desc: "Overdue, blockers, escalations", examples: "Overdue task, blocked dependency" },
            { color: c.indigo, label: "High", desc: "@mentions, approvals, assignments", examples: "Direct mention, approval request" },
            { color: c.gold, label: "Medium", desc: "Status changes, comments, milestones", examples: "Comment thread, milestone" },
            { color: c.borderSubtle, label: "Low", desc: "FYI — additions, attachments, follows", examples: "Added to project, file attached" },
          ].map((tier) => (
            <div key={tier.label} className="rounded-lg border overflow-hidden" style={{ borderColor: c.borderSubtle }}>
              <div className="flex items-stretch">
                <div className="w-1.5 shrink-0" style={{ background: tier.color }} />
                <div className="p-3 flex-1">
                  <p style={{ color: c.text1, fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{tier.label}</p>
                  <p style={{ color: c.text3, fontSize: "11px", lineHeight: 1.5 }}>{tier.desc}</p>
                  <p className="mt-1.5" style={{ color: c.text4, fontSize: "10px", fontStyle: "italic" }}>{tier.examples}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────── NOTIFICATION TYPES ──────── */}
      <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Notification Types</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>All supported notification categories with their corresponding icons.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: ChatText, label: "Comment", desc: "New comment or reply" },
            { icon: At, label: "Mention", desc: "Tagged in content" },
            { icon: UserPlus, label: "Assignment", desc: "Task assigned to you" },
            { icon: CheckCircle, label: "Completion", desc: "Task marked done" },
            { icon: Warning, label: "Status Change", desc: "Project status updated" },
            { icon: FlagPennant, label: "Milestone", desc: "Milestone reached" },
            { icon: ShieldWarning, label: "Approval", desc: "Approval requested" },
            { icon: Paperclip, label: "Attachment", desc: "Files added" },
            { icon: Folder, label: "Portfolio", desc: "New work added" },
            { icon: Star, label: "Starred", desc: "Activity on starred item" },
            { icon: CalendarBlank, label: "Due Date", desc: "Upcoming or overdue" },
            { icon: UsersThree, label: "Team", desc: "Membership changes" },
          ].map((type) => (
            <div key={type.label} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ border: `1px solid ${c.borderSubtle}` }}>
              <type.icon className="w-4 h-4 shrink-0" style={{ color: c.text4 }} />
              <div>
                <p style={{ color: c.text2, fontSize: "11px", fontWeight: 500 }}>{type.label}</p>
                <p style={{ color: c.text4, fontSize: "10px" }}>{type.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────── STATUS BADGES ──────── */}
      <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Context Badges</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Project status and notification state indicators.</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "On track", bg: c.tealLight, fg: c.tealMid },
            { label: "At risk", bg: c.orangeLight, fg: c.orangeMid },
            { label: "Off track", bg: c.coralLight, fg: c.coralMid },
            { label: "Overdue", bg: c.coralLight, fg: c.coralMid },
            { label: "Needs approval", bg: c.lavenderLight, fg: c.lavenderMid },
            { label: "Completed", bg: c.tealLight, fg: c.tealMid },
            { label: "On hold", bg: c.goldLight, fg: c.goldMid },
            { label: "Archived", bg: c.bg2, fg: c.text4 },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: c.borderSubtle }}>
              <StatusBadge label={badge.label} bg={badge.bg} fg={badge.fg} />
            </div>
          ))}
        </div>
      </section>

      {/* ──────── NOTIFICATION SETTINGS PREVIEW ──────── */}
      <section className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Notification Preferences</h2>
          <span className="px-1.5 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>Settings Pattern</span>
        </div>
        <div className="divide-y" style={{ borderColor: c.borderSubtle }}>
          {[
            { label: "Task assignments", desc: "When someone assigns a task to you", inApp: true, email: true, push: true },
            { label: "@mentions", desc: "When someone mentions you in a comment", inApp: true, email: true, push: true },
            { label: "Task completions", desc: "When a task you follow is completed", inApp: true, email: false, push: false },
            { label: "Status updates", desc: "When a project status changes", inApp: true, email: true, push: false },
            { label: "New comments", desc: "On tasks and projects you follow", inApp: true, email: false, push: false },
            { label: "Portfolio changes", desc: "When work is added or removed", inApp: true, email: false, push: false },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-black/[0.01]">
              <div className="flex-1 min-w-0 mr-4">
                <p style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>{pref.label}</p>
                <p style={{ color: c.text4, fontSize: "11px" }}>{pref.desc}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {[
                  { label: "In-app", on: pref.inApp },
                  { label: "Email", on: pref.email },
                  { label: "Push", on: pref.push },
                ].map((channel) => (
                  <div key={channel.label} className="flex flex-col items-center gap-1">
                    <span style={{ color: c.text4, fontSize: "9px", fontWeight: 500 }}>{channel.label}</span>
                    <div
                      className="w-7 h-4 rounded-full relative cursor-pointer transition-colors"
                      style={{ background: channel.on ? c.teal : c.bg2 }}
                    >
                      <div
                        className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                        style={{
                          background: c.surface,
                          left: channel.on ? "14px" : "2px",
                          boxShadow: "0 1px 2px oklch(0 0 0 / 0.1)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}