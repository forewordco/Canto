import { useState } from "react";
import {
  TextB,
  TextItalic,
  TextStrikethrough,
  CodeSimple,
  LinkSimple,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  Minus,
  Image,
  At,
  Hash,
  CaretRight,
  Plus,
  ChatText,
  DotsThree,
  Clock,
  UsersThree,
  Star,
  ShareNetwork,
  Lock,
  TextT,
  TextHOne,
  TextHTwo,
  TextHThree,
  Table,
  FileText,
  Command,
  ArrowSquareOut,
  WarningCircle,
  Info,
  Lightbulb,
  Lightning,
  DotsSixVertical,
  Eye,
  Columns,
  Notebook,
  CalendarBlank,
  BookOpenText,
} from "@phosphor-icons/react";

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
  lavender: "oklch(0.7 0.16 300)",
  lavenderLight: "oklch(0.7 0.16 300 / 0.12)",
  lavenderMid: "oklch(0.47 0.14 300)",
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

function Avatar({ initials, bg, size = 24 }: { initials: string; bg: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: bg }}>
      <span style={{ color: "white", fontSize: `${Math.max(size * 0.38, 8)}px`, fontWeight: 600 }}>{initials}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>
      {children}
    </p>
  );
}

/* ─── Floating Toolbar ─── */
function FloatingToolbar() {
  const tools = [
    { icon: TextB, label: "Bold", active: false },
    { icon: TextItalic, label: "Italic", active: false },
    { icon: TextStrikethrough, label: "Strike", active: false },
    { icon: CodeSimple, label: "Code", active: false },
    { divider: true },
    { icon: LinkSimple, label: "Link", active: false },
    { icon: At, label: "Mention", active: false },
    { divider: true },
    { icon: TextHOne, label: "H1", active: false },
    { icon: TextHTwo, label: "H2", active: true },
    { icon: TextHThree, label: "H3", active: false },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg border shadow-lg" style={{ background: c.surface, borderColor: c.border }}>
      {tools.map((tool, i) =>
        "divider" in tool ? (
          <div key={i} className="w-px h-4 mx-0.5" style={{ background: c.borderSubtle }} />
        ) : (
          <button
            key={tool.label}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-black/[0.04]"
            style={{ background: tool.active ? c.indigoLight : "transparent", color: tool.active ? c.indigoMid : c.text3 }}
          >
            {tool.icon && <tool.icon className="w-3.5 h-3.5" />}
          </button>
        )
      )}
    </div>
  );
}

/* ─── Slash Command Menu ─── */
function SlashMenu() {
  const commands = [
    { icon: TextT, label: "Text", desc: "Plain text block", color: c.text3 },
    { icon: TextHOne, label: "Heading 1", desc: "Large section heading", color: c.coral },
    { icon: TextHTwo, label: "Heading 2", desc: "Medium heading", color: c.coral },
    { icon: ListBullets, label: "Bullet List", desc: "Unordered list", color: c.indigo },
    { icon: ListNumbers, label: "Numbered List", desc: "Ordered list", color: c.indigo },
    { icon: CheckSquare, label: "To-do List", desc: "Task checklist", color: c.teal },
    { icon: Quotes, label: "Quote", desc: "Block quote", color: c.lavender },
    { icon: CodeSimple, label: "Code Block", desc: "Syntax highlighted", color: c.text3 },
    { icon: Minus, label: "Divider", desc: "Horizontal rule", color: c.text4 },
    { icon: Image, label: "Image", desc: "Upload or embed", color: c.gold },
    { icon: Table, label: "Table", desc: "Data table", color: c.teal },
    { icon: WarningCircle, label: "Callout", desc: "Highlighted block", color: c.coral },
  ];

  return (
    <div className="w-[260px] rounded-xl border shadow-xl overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
      <div className="px-3 py-2 border-b" style={{ borderColor: c.border }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: c.bg1 }}>
          <Command className="w-3 h-3" style={{ color: c.text4 }} />
          <input placeholder="Filter blocks..." className="flex-1 bg-transparent outline-none" style={{ fontSize: "12px", color: c.text1 }} />
        </div>
      </div>
      <div className="py-1 max-h-[260px] overflow-y-auto">
        <p className="px-3 py-1" style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>BLOCKS</p>
        {commands.map((cmd, i) => (
          <button
            key={cmd.label}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left hover:bg-black/[0.03] transition-colors"
            style={{ background: i === 0 ? c.bg1 : "transparent" }}
          >
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: `${cmd.color}15` }}>
              <cmd.icon className="w-3.5 h-3.5" style={{ color: cmd.color }} />
            </div>
            <div>
              <p style={{ color: c.text1, fontSize: "12px", fontWeight: 500 }}>{cmd.label}</p>
              <p style={{ color: c.text4, fontSize: "10px" }}>{cmd.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export function DocsDesign() {
  const [activeTab, setActiveTab] = useState("editor");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.lavender }} />
          <p style={{ color: c.lavenderMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>DOCS DESIGN</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Document Patterns</h1>
        <p className="mt-2 max-w-2xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Craft &amp; Dropbox Paper-inspired document editor patterns — block-based editing, floating toolbars, slash commands, inline comments, and rich content blocks.
        </p>
      </div>

      {/* ──────── FULL DOCUMENT MOCK ──────── */}
      <section className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        {/* Doc header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: c.border, background: c.bg1 }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: c.lavender }} />
            <span style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>Product Requirements — Q1 2026</span>
            <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.tealLight, color: c.tealMid, fontSize: "9px", fontWeight: 600 }}>Published</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5 mr-1">
              <Avatar initials="SC" bg={c.coral} size={20} />
              <Avatar initials="JM" bg={c.indigo} size={20} />
            </div>
            <button className="p-1.5 rounded-md hover:bg-black/[0.04]"><ShareNetwork className="w-3.5 h-3.5" style={{ color: c.text3 }} /></button>
            <button className="p-1.5 rounded-md hover:bg-black/[0.04]"><Star className="w-3.5 h-3.5" style={{ color: c.text4 }} /></button>
            <button className="p-1.5 rounded-md hover:bg-black/[0.04]"><DotsThree className="w-3.5 h-3.5" style={{ color: c.text4 }} /></button>
          </div>
        </div>

        {/* Document body */}
        <div className="max-w-[680px] mx-auto px-6 py-8">
          {/* Cover image */}
          <div className="rounded-lg overflow-hidden mb-6 relative group">
            <img
              src="https://images.unsplash.com/photo-1641388867126-75c2b1eb2857?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGxhbmRzY2FwZSUyMGFlcmlhbHxlbnwxfHx8fDE3NzE4ODE4NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Cover"
              className="w-full h-[180px] object-cover"
            />
            <button className="absolute bottom-2 right-2 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)", color: "white", fontSize: "10px" }}>
              Change cover
            </button>
          </div>

          {/* Icon + Title */}
          <div className="mb-1">
            <span style={{ fontSize: "40px" }}>📋</span>
          </div>
          <h1 className="mb-1" style={{ color: c.text1, fontSize: "32px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            Product Requirements
          </h1>
          <p className="mb-6" style={{ color: c.text4, fontSize: "14px" }}>
            Q1 2026 &middot; Website Redesign &middot; Last edited 2h ago by Sarah Chen
          </p>

          {/* Metadata strip */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 pb-6 border-b" style={{ borderColor: c.borderSubtle }}>
            {[
              { label: "Owner", value: <div className="flex items-center gap-1.5"><Avatar initials="SC" bg={c.coral} size={18} /><span>Sarah Chen</span></div> },
              { label: "Status", value: <span className="px-2 py-0.5 rounded-full" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "11px", fontWeight: 500 }}>In Progress</span> },
              { label: "Due", value: <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Mar 15, 2026</span> },
              { label: "Viewers", value: <span className="flex items-center gap-1"><Eye className="w-3 h-3" />12</span> },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2" style={{ fontSize: "12px" }}>
                <span style={{ color: c.text4, fontWeight: 500 }}>{m.label}</span>
                <span style={{ color: c.text2 }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Document blocks */}
          <div className="space-y-4">
            {/* H2 */}
            <div className="group relative">
              <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button className="p-0.5 rounded hover:bg-black/[0.04]"><Plus className="w-3 h-3" style={{ color: c.text4 }} /></button>
                <button className="p-0.5 rounded hover:bg-black/[0.04] cursor-grab"><DotsSixVertical className="w-3 h-3" style={{ color: c.text4 }} /></button>
              </div>
              <h2 style={{ color: c.text1, fontSize: "22px", fontWeight: 600, lineHeight: 1.3 }}>Overview</h2>
            </div>

            {/* Paragraph */}
            <div className="group relative">
              <div className="absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button className="p-0.5 rounded hover:bg-black/[0.04]"><Plus className="w-3 h-3" style={{ color: c.text4 }} /></button>
                <button className="p-0.5 rounded hover:bg-black/[0.04] cursor-grab"><DotsSixVertical className="w-3 h-3" style={{ color: c.text4 }} /></button>
              </div>
              <p style={{ color: c.text2, fontSize: "15px", lineHeight: 1.7 }}>
                This document outlines the product requirements for the <span style={{ background: c.indigoLight, color: c.indigoMid, padding: "1px 4px", borderRadius: "3px", fontWeight: 500 }}>Website Redesign</span> project. Our goal is to modernize the user experience while maintaining feature parity with the existing platform.
              </p>
            </div>

            {/* Callout - Info */}
            <div className="group relative">
              <div className="absolute -left-8 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button className="p-0.5 rounded hover:bg-black/[0.04]"><Plus className="w-3 h-3" style={{ color: c.text4 }} /></button>
                <button className="p-0.5 rounded hover:bg-black/[0.04] cursor-grab"><DotsSixVertical className="w-3 h-3" style={{ color: c.text4 }} /></button>
              </div>
              <div className="flex gap-3 px-4 py-3 rounded-lg border-l-3" style={{ background: c.indigoLight, borderLeftColor: c.indigo }}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.indigo }} />
                <p style={{ color: c.indigoMid, fontSize: "13px", lineHeight: 1.6 }}>
                  This PRD is the source of truth for Sprint 4. All design and engineering decisions should reference this document.
                </p>
              </div>
            </div>

            {/* H3 */}
            <h3 style={{ color: c.text1, fontSize: "17px", fontWeight: 600, lineHeight: 1.3, marginTop: "8px" }}>Key Objectives</h3>

            {/* Numbered list */}
            <div className="space-y-1">
              {[
                "Reduce page load time to under 2 seconds on 3G connections",
                "Increase conversion rate by 15% through simplified onboarding",
                "Achieve WCAG 2.1 AA compliance across all user-facing pages",
                "Ship responsive mobile layouts for the top 5 user flows",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 group/item">
                  <span className="shrink-0 w-5 text-right" style={{ color: c.text4, fontSize: "14px", fontWeight: 500 }}>{i + 1}.</span>
                  <p style={{ color: c.text2, fontSize: "15px", lineHeight: 1.7 }}>{item}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="py-2"><div className="h-px" style={{ background: c.borderSubtle }} /></div>

            {/* H2 */}
            <h2 style={{ color: c.text1, fontSize: "22px", fontWeight: 600, lineHeight: 1.3 }}>User Stories</h2>

            {/* Toggle / Disclosure block */}
            <div className="space-y-1">
              {[
                { title: "As a new user, I want a guided onboarding flow", open: true, content: "The onboarding wizard should have 3 steps max, with progress indicators and the ability to skip. Each step should be completable in under 30 seconds." },
                { title: "As a team admin, I want to manage member permissions", open: false, content: "" },
                { title: "As a viewer, I want to export documents as PDF", open: false, content: "" },
              ].map((toggle) => (
                <div key={toggle.title} className="rounded-lg border" style={{ borderColor: c.borderSubtle }}>
                  <button className="flex items-center gap-2 w-full px-3 py-2 text-left">
                    <CaretRight className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ color: c.text4, transform: toggle.open ? "rotate(90deg)" : "none" }} />
                    <span style={{ color: c.text1, fontSize: "14px", fontWeight: 500 }}>{toggle.title}</span>
                  </button>
                  {toggle.open && (
                    <div className="px-3 pb-3 pl-8">
                      <p style={{ color: c.text3, fontSize: "13px", lineHeight: 1.6 }}>{toggle.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Checklist block */}
            <h3 style={{ color: c.text1, fontSize: "17px", fontWeight: 600, lineHeight: 1.3, marginTop: "8px" }}>Launch Checklist</h3>
            <div className="space-y-0.5">
              {[
                { text: "Design review completed", done: true },
                { text: "Accessibility audit passed", done: true },
                { text: "Performance benchmarks met", done: false },
                { text: "Stakeholder sign-off", done: false },
                { text: "Release notes drafted", done: false },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2.5 py-1 px-1 rounded hover:bg-black/[0.02]">
                  <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0" style={{
                    borderColor: item.done ? c.teal : c.border,
                    background: item.done ? c.teal : "transparent",
                  }}>
                    {item.done && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                  <span style={{ color: item.done ? c.text4 : c.text2, fontSize: "14px", textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Block quote */}
            <div className="border-l-2 pl-4 py-1" style={{ borderColor: c.lavender }}>
              <p style={{ color: c.text2, fontSize: "15px", lineHeight: 1.7, fontStyle: "italic" }}>
                "Good design is as little design as possible. Less, but better — because it concentrates on the essential aspects."
              </p>
              <p className="mt-1" style={{ color: c.text4, fontSize: "12px" }}>— Dieter Rams</p>
            </div>

            {/* Code block */}
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: c.border }}>
              <div className="flex items-center justify-between px-3 py-1.5" style={{ background: c.bg1 }}>
                <span style={{ color: c.text4, fontSize: "11px", fontWeight: 500 }}>tokens.css</span>
                <button className="px-2 py-0.5 rounded text-[10px]" style={{ color: c.text4, background: c.bg2 }}>Copy</button>
              </div>
              <pre className="px-4 py-3 overflow-x-auto" style={{ background: "oklch(0.17 0.02 260)", color: "oklch(0.85 0.02 260)", fontSize: "12px", lineHeight: 1.6 }}>
{`:root {
  --color-primary: oklch(0.7 0.18 25);
  --color-surface: oklch(0.99 0.002 260);
  --radius-md: 8px;
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
}`}
              </pre>
            </div>

            {/* Inline comment indicator */}
            <div className="relative">
              <p style={{ color: c.text2, fontSize: "15px", lineHeight: 1.7 }}>
                The design system should support both <span className="border-b-2 relative" style={{ borderColor: c.gold }}>light and dark themes<span className="absolute -right-5 top-0"><span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: c.goldLight }}><ChatText className="w-2.5 h-2.5" style={{ color: c.goldMid }} /></span></span></span> from day one, with theme tokens defined at the CSS custom property level.
              </p>
            </div>

            {/* Placeholder block */}
            <div className="flex items-center gap-2 py-3 px-4 rounded-lg border border-dashed cursor-text" style={{ borderColor: c.borderSubtle }}>
              <span style={{ color: c.text4, fontSize: "14px" }}>Type <kbd className="px-1 py-0.5 rounded border mx-0.5" style={{ borderColor: c.border, fontSize: "11px", fontFamily: "monospace" }}>/</kbd> for commands or just start writing...</span>
            </div>
          </div>
        </div>
      </section>

      {/* ──────── FLOATING TOOLBAR ──────── */}
      <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Floating Toolbar</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Selection-based formatting toolbar. Appears on text selection.</p>
        <div className="flex justify-center">
          <FloatingToolbar />
        </div>
      </section>

      {/* ──────── SLASH COMMAND MENU ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Slash Commands</h2>
          <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Block insertion via <kbd className="px-1 py-0.5 rounded border mx-0.5" style={{ borderColor: c.border, fontSize: "11px", fontFamily: "monospace" }}>/</kbd> command.</p>
          <div className="flex justify-center">
            <SlashMenu />
          </div>
        </section>

        {/* Page tree */}
        <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Page Hierarchy</h2>
          <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Nested document tree with drag-to-reorder.</p>
          <div className="space-y-0.5">
            {[
              { label: "Product Requirements", icon: "📋", level: 0, active: true, children: true },
              { label: "Overview", icon: null, level: 1, active: false },
              { label: "User Stories", icon: null, level: 1, active: false },
              { label: "Technical Spec", icon: null, level: 1, active: false },
              { label: "Design System Guide", icon: "🎨", level: 0, active: false, children: true },
              { label: "Sprint Planning", icon: "🏃", level: 0, active: false, children: false },
              { label: "Meeting Notes", icon: "📝", level: 0, active: false, children: true },
              { label: "Feb 20 Standup", icon: null, level: 1, active: false },
              { label: "Feb 23 Retro", icon: null, level: 1, active: false },
            ].map((page, i) => (
              <button
                key={i}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-left transition-colors group/page"
                style={{
                  paddingLeft: `${8 + page.level * 16}px`,
                  background: page.active ? c.indigoLight : "transparent",
                  color: page.active ? c.indigoMid : c.text2,
                }}
              >
                {page.children && <CaretRight className="w-3 h-3 shrink-0" style={{ color: c.text4, transform: page.active ? "rotate(90deg)" : "none" }} />}
                {!page.children && page.level === 0 && <span className="w-3" />}
                {page.icon && <span style={{ fontSize: "13px" }}>{page.icon}</span>}
                {!page.icon && <FileText className="w-3 h-3 shrink-0" style={{ color: c.text4 }} />}
                <span className="truncate" style={{ fontSize: "12px", fontWeight: page.active ? 500 : 400 }}>{page.label}</span>
                <span className="ml-auto opacity-0 group-hover/page:opacity-100">
                  <DotsThree className="w-3 h-3" style={{ color: c.text4 }} />
                </span>
              </button>
            ))}
            <button className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-left hover:bg-black/[0.03]" style={{ color: c.text4, fontSize: "12px" }}>
              <Plus className="w-3 h-3" /> New page
            </button>
          </div>
        </section>
      </div>

      {/* ──────── CALLOUT VARIANTS ──────── */}
      <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Callout Blocks</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Semantic callouts for different content types.</p>

        <div className="space-y-2">
          {[
            { icon: Info, label: "Info", color: c.indigo, bg: c.indigoLight, text: "This section contains important context for the feature specification." },
            { icon: Lightbulb, label: "Tip", color: c.teal, bg: c.tealLight, text: "Use OKLCH for all color definitions to ensure perceptual uniformity across the palette." },
            { icon: WarningCircle, label: "Warning", color: c.coral, bg: c.coralLight, text: "Breaking changes are expected in the API layer — coordinate with backend before merging." },
            { icon: Lightning, label: "Note", color: c.gold, bg: c.goldLight, text: "Performance budget: max 200KB JS bundle, 100KB CSS, LCP under 2.5s." },
          ].map((callout) => (
            <div key={callout.label} className="flex gap-3 px-4 py-3 rounded-lg" style={{ background: callout.bg }}>
              <callout.icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: callout.color }} />
              <div>
                <p style={{ color: callout.color, fontSize: "11px", fontWeight: 600, letterSpacing: "0.03em", marginBottom: "2px" }}>{callout.label.toUpperCase()}</p>
                <p style={{ color: c.text2, fontSize: "13px", lineHeight: 1.6 }}>{callout.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────── TABLE BLOCK ──────── */}
      <section className="rounded-xl border overflow-hidden" style={{ background: c.surface, borderColor: c.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: c.border }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Table Block</h2>
          <div className="flex items-center gap-1">
            <button className="px-2 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>Add column</button>
            <button className="px-2 py-0.5 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>Add row</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: c.bg1 }}>
                {["Feature", "Priority", "Status", "Owner", "ETA"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 border-b border-r last:border-r-0" style={{ borderColor: c.borderSubtle, color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Dark mode", priority: "High", prColor: c.coralLight, prFg: c.coralMid, status: "In Progress", stColor: c.indigoLight, stFg: c.indigoMid, owner: "SC", ownerBg: c.coral, eta: "Mar 1" },
                { feature: "Export to PDF", priority: "Med", prColor: c.goldLight, prFg: c.goldMid, status: "To Do", stColor: c.bg2, stFg: c.text3, owner: "JM", ownerBg: c.indigo, eta: "Mar 8" },
                { feature: "Real-time collab", priority: "High", prColor: c.coralLight, prFg: c.coralMid, status: "In Review", stColor: c.goldLight, stFg: c.goldMid, owner: "LP", ownerBg: c.teal, eta: "Feb 28" },
                { feature: "Comments API", priority: "Low", prColor: c.tealLight, prFg: c.tealMid, status: "Done", stColor: c.tealLight, stFg: c.tealMid, owner: "AK", ownerBg: c.gold, eta: "Feb 20" },
              ].map((row) => (
                <tr key={row.feature} className="hover:bg-black/[0.01]">
                  <td className="px-4 py-2 border-b border-r" style={{ borderColor: c.borderSubtle, color: c.text1, fontSize: "13px", fontWeight: 500 }}>{row.feature}</td>
                  <td className="px-4 py-2 border-b border-r" style={{ borderColor: c.borderSubtle }}><span className="px-1.5 py-0.5 rounded" style={{ background: row.prColor, color: row.prFg, fontSize: "10px", fontWeight: 500 }}>{row.priority}</span></td>
                  <td className="px-4 py-2 border-b border-r" style={{ borderColor: c.borderSubtle }}><span className="px-2 py-0.5 rounded-full" style={{ background: row.stColor, color: row.stFg, fontSize: "10px", fontWeight: 500 }}>{row.status}</span></td>
                  <td className="px-4 py-2 border-b border-r" style={{ borderColor: c.borderSubtle }}><Avatar initials={row.owner} bg={row.ownerBg} size={20} /></td>
                  <td className="px-4 py-2 border-b" style={{ borderColor: c.borderSubtle, color: c.text3, fontSize: "12px" }}>{row.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ──────── INLINE COMMENT THREAD ──────── */}
      <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Inline Comments</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Contextual discussions anchored to specific text ranges.</p>

        <div className="flex gap-4">
          <div className="flex-1 min-w-0">
            <p style={{ color: c.text2, fontSize: "15px", lineHeight: 1.7 }}>
              The navigation should use a <span className="border-b-2 px-0.5" style={{ borderColor: c.gold, background: c.goldLight }}>progressive disclosure pattern</span> that reveals complexity only when needed. Primary actions should be visible at all times, while secondary options can live behind an overflow menu.
            </p>
          </div>
          <div className="w-[240px] shrink-0 rounded-lg border p-3 space-y-2.5" style={{ borderColor: c.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Avatar initials="JM" bg={c.indigo} size={18} />
                <span style={{ color: c.text1, fontSize: "11px", fontWeight: 500 }}>Jake Martinez</span>
              </div>
              <span style={{ color: c.text4, fontSize: "10px" }}>1h ago</span>
            </div>
            <p style={{ color: c.text2, fontSize: "12px", lineHeight: 1.5 }}>
              Should we consider a mega-menu pattern instead? It might work better for the admin views.
            </p>
            <div className="flex items-center gap-1.5">
              <Avatar initials="SC" bg={c.coral} size={16} />
              <p style={{ color: c.text3, fontSize: "11px", lineHeight: 1.4 }}>
                Good point — let's prototype both and user test.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-1.5 border-t" style={{ borderColor: c.borderSubtle }}>
              <input placeholder="Reply..." className="flex-1 bg-transparent outline-none" style={{ fontSize: "11px", color: c.text1 }} />
              <button className="px-2 py-0.5 rounded" style={{ background: c.indigo, color: "white", fontSize: "10px", fontWeight: 500 }}>Reply</button>
            </div>
          </div>
        </div>
      </section>

      {/* ──────── DOCUMENT CARDS ──────── */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Document Cards</h2>
        <p className="mt-0.5 mb-5" style={{ color: c.text3, fontSize: "13px" }}>
          Clickable embedded document references at multiple sizes — for linking related docs, galleries, and collections.
        </p>

        {/* ── MICRO / INLINE CHIP ── */}
        <div className="mb-5">
          <p className="mb-2" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>MICRO</p>
          <p className="mb-3" style={{ color: c.text4, fontSize: "12px", lineHeight: 1.5 }}>
            Inline document chips for embedding references inside paragraphs, table cells, and tight layouts.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { icon: "📋", title: "PRD — Q1 2026" },
              { icon: "🎨", title: "Design System" },
              { icon: "📊", title: "Sprint Report" },
              { icon: "📐", title: "Layout Grid" },
              { icon: "📝", title: "Meeting Notes" },
            ].map((doc) => (
              <button key={doc.title} className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-md border hover:shadow-sm hover:border-transparent transition-all group/micro" style={{ borderColor: c.border, background: c.bg1 }}>
                <span style={{ fontSize: "11px", lineHeight: 1 }}>{doc.icon}</span>
                <span className="truncate" style={{ color: c.text2, fontSize: "11px", fontWeight: 500, maxWidth: "120px" }}>{doc.title}</span>
                <ArrowSquareOut className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover/micro:opacity-100 transition-opacity" style={{ color: c.text4 }} />
              </button>
            ))}
          </div>
          {/* Inline usage example */}
          <div className="mt-3 rounded-lg px-3.5 py-2.5" style={{ background: c.bg1, border: `1px solid ${c.borderSubtle}` }}>
            <p style={{ color: c.text3, fontSize: "12px", lineHeight: 1.8 }}>
              <span style={{ color: c.text4, fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em" }}>USAGE EXAMPLE</span><br />
              Please review the{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded border align-middle" style={{ borderColor: c.border, background: c.surface, fontSize: "11px", fontWeight: 500, color: c.text2 }}>
                <span style={{ fontSize: "10px" }}>📋</span> PRD — Q1 2026
              </span>{" "}
              before the standup. Updated specs are in the{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-[1px] rounded border align-middle" style={{ borderColor: c.border, background: c.surface, fontSize: "11px", fontWeight: 500, color: c.text2 }}>
                <span style={{ fontSize: "10px" }}>🎨</span> Design System
              </span>{" "}
              doc.
            </p>
          </div>
        </div>

        {/* ── COMPACT / INLINE ── */}
        <div className="mb-5">
          <p className="mb-2" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>COMPACT</p>
          <div className="space-y-1.5">
            {[
              { icon: "📋", title: "Product Requirements — Q1 2026", breadcrumb: "Projects · Website Redesign · Docs" },
              { icon: "🎨", title: "Design System Guide", breadcrumb: "Projects · Atlas · Reference" },
              { icon: "📊", title: "Sprint Velocity Report", breadcrumb: "Analytics · Reports · Weekly" },
            ].map((doc) => (
              <button key={doc.title} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg border hover:shadow-sm hover:border-opacity-80 transition-all text-left group/compact" style={{ borderColor: c.border }}>
                <span style={{ fontSize: "16px" }}>{doc.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ color: c.text1, fontSize: "13px", fontWeight: 500 }}>{doc.title}</p>
                  <p className="truncate" style={{ color: c.text4, fontSize: "11px" }}>{doc.breadcrumb}</p>
                </div>
                <ArrowSquareOut className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover/compact:opacity-100 transition-opacity" style={{ color: c.text4 }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── SMALL CARDS ── */}
        <div className="mb-5">
          <p className="mb-2" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>SMALL</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {/* Text-only card */}
            <button className="rounded-xl border p-4 text-left hover:shadow-md hover:border-transparent transition-all group/sm" style={{ borderColor: c.border }}>
              <h4 style={{ color: c.text1, fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>Onboarding Script</h4>
              <div className="mt-2 rounded-md px-2.5 py-2" style={{ background: c.bg1, border: `1px solid ${c.borderSubtle}` }}>
                <p className="line-clamp-3" style={{ color: c.text3, fontSize: "11px", lineHeight: 1.5 }}>
                  Welcome to FlowOS — your all-in-one productivity platform. Let's get you set up in just 3 easy steps...
                </p>
              </div>
            </button>

            {/* Image card */}
            <button className="rounded-xl border overflow-hidden text-left hover:shadow-md hover:border-transparent transition-all group/sm" style={{ borderColor: c.border }}>
              <h4 className="px-4 pt-3.5 pb-2" style={{ color: c.text1, fontSize: "14px", fontWeight: 600, lineHeight: 1.3 }}>Design Review</h4>
              <div className="px-3 pb-3">
                <img
                  src="https://images.unsplash.com/photo-1759884247160-27b8465544b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwY29sbGFib3JhdGlvbiUyMHdoaXRlYm9hcmR8ZW58MXx8fHwxNzcxOTIwMDY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Design Review"
                  className="w-full h-[100px] object-cover rounded-lg"
                />
              </div>
            </button>

            {/* Icon-centered card */}
            <button className="rounded-xl border p-4 text-left hover:shadow-md hover:border-transparent transition-all flex flex-col items-center text-center group/sm" style={{ borderColor: c.border }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: c.bg2 }}>
                <span style={{ fontSize: "16px" }}>📝</span>
              </div>
              <h4 className="mt-2.5" style={{ color: c.text1, fontSize: "14px", fontWeight: 600 }}>Meeting Notes</h4>
              <p style={{ color: c.text4, fontSize: "11px", marginTop: "2px" }}>Team Standups</p>
            </button>
          </div>
        </div>

        {/* ── MEDIUM CARDS ── */}
        <div className="mb-5">
          <p className="mb-2" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>MEDIUM</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="rounded-xl border p-5 text-left hover:shadow-md hover:border-transparent transition-all flex items-start justify-between gap-4 group/md" style={{ borderColor: c.border }}>
              <div className="flex-1 min-w-0">
                <h4 style={{ color: c.text1, fontSize: "17px", fontWeight: 700, lineHeight: 1.3 }}>Technical Spec</h4>
                <p className="mt-1" style={{ color: c.text3, fontSize: "12px" }}>Architecture · Backend</p>
                <div className="flex items-center gap-2 mt-3">
                  <Avatar initials="JM" bg={c.indigo} size={18} />
                  <span style={{ color: c.text4, fontSize: "11px" }}>Jake · 3h ago</span>
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1566837945700-30057527ade0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RlJTIwZWRpdG9yJTIwd29ya3NwYWNlfGVufDF8fHx8MTc3MTk1NDE2NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Technical Spec"
                className="w-[140px] h-[90px] rounded-lg object-cover shrink-0"
              />
            </button>

            <button className="rounded-xl border p-5 text-left hover:shadow-md hover:border-transparent transition-all flex items-start justify-between gap-4 group/md" style={{ borderColor: c.border }}>
              <div className="flex-1 min-w-0">
                <h4 style={{ color: c.text1, fontSize: "17px", fontWeight: 700, lineHeight: 1.3 }}>User Research</h4>
                <p className="mt-1" style={{ color: c.text3, fontSize: "12px" }}>Research · Interviews</p>
                <div className="flex items-center gap-2 mt-3">
                  <Avatar initials="SC" bg={c.coral} size={18} />
                  <span style={{ color: c.text4, fontSize: "11px" }}>Sarah · 1d ago</span>
                </div>
              </div>
              <img
                src="https://images.unsplash.com/photo-1636390877494-3ba0c41c7e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2VyJTIwcmVzZWFyY2glMjBpbnRlcnZpZXclMjBub3Rlc3xlbnwxfHx8fDE3NzE4NTcyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="User Research"
                className="w-[140px] h-[90px] rounded-lg object-cover shrink-0"
              />
            </button>
          </div>
        </div>

        {/* ── LARGE / HERO CARD ── */}
        <div className="mb-5">
          <p className="mb-2" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>LARGE</p>
          <button className="w-full rounded-xl border p-6 text-left hover:shadow-lg hover:border-transparent transition-all flex items-start justify-between gap-6 group/lg" style={{ borderColor: c.border }}>
            <div className="flex-1 min-w-0">
              <h4 style={{ color: c.text1, fontSize: "22px", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}>Product Roadmap</h4>
              <p className="mt-1.5" style={{ color: c.text3, fontSize: "13px", lineHeight: 1.5 }}>Strategic overview and milestone planning for Q1–Q2 2026.</p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="px-2 py-0.5 rounded-full" style={{ background: c.coralLight, color: c.coralMid, fontSize: "10px", fontWeight: 600 }}>Strategy</span>
                <span className="px-2 py-0.5 rounded-full" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "10px", fontWeight: 600 }}>Roadmap</span>
                <div className="w-px h-3 mx-0.5" style={{ background: c.borderSubtle }} />
                <div className="flex -space-x-1.5">
                  <Avatar initials="SC" bg={c.coral} size={18} />
                  <Avatar initials="JM" bg={c.indigo} size={18} />
                  <Avatar initials="LP" bg={c.teal} size={18} />
                </div>
                <span style={{ color: c.text4, fontSize: "11px" }}>Updated 2h ago</span>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1590402494610-2c378a9114c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwcm9hZG1hcCUyMHBsYW5uaW5nfGVufDF8fHx8MTc3MTg2MTI5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Product Roadmap"
              className="w-[200px] h-[140px] rounded-xl object-cover shrink-0 hidden sm:block"
            />
          </button>
        </div>

        {/* ── GROUPED COLLECTION ── */}
        <div>
          <p className="mb-2" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>COLLECTION GROUP</p>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.border }}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: c.borderSubtle, background: c.bg1 }}>
              <div className="flex items-center gap-2">
                <BookOpenText className="w-4 h-4" style={{ color: c.lavender }} />
                <span style={{ color: c.text1, fontSize: "13px", fontWeight: 600 }}>Design References</span>
                <span className="px-1.5 py-[2px] rounded" style={{ background: c.bg2, color: c.text4, fontSize: "10px", fontWeight: 500 }}>4 docs</span>
              </div>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-black/[0.04]" style={{ color: c.text4, fontSize: "11px" }}>
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x" style={{ borderColor: c.borderSubtle }}>
              {[
                { icon: "🎨", title: "Color System", sub: "Foundations", img: "https://images.unsplash.com/photo-1616861771635-49063a4636ed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjBzeXN0ZW0lMjBkb2N1bWVudGF0aW9ufGVufDF8fHx8MTc3MTg3OTY2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
                { icon: "🔤", title: "Typography", sub: "Foundations", img: null },
                { icon: "🧩", title: "Components", sub: "Library", img: "https://images.unsplash.com/photo-1715528233539-5fe70a4e0d71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aXJlZnJhbWUlMjBwcm90b3R5cGUlMjBza2V0Y2h8ZW58MXx8fHwxNzcxOTA2NDA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
                { icon: "📐", title: "Layout Grid", sub: "Foundations", img: null },
              ].map((doc) => (
                <button key={doc.title} className="p-3 text-left hover:bg-black/[0.015] transition-colors group/col">
                  <span style={{ fontSize: "18px" }}>{doc.icon}</span>
                  <h5 className="mt-1.5" style={{ color: c.text1, fontSize: "12px", fontWeight: 600 }}>{doc.title}</h5>
                  <p style={{ color: c.text4, fontSize: "10px", marginTop: "1px" }}>{doc.sub}</p>
                  {doc.img && (
                    <img src={doc.img} alt={doc.title} className="w-full h-[56px] rounded-md object-cover mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────── BLOCK TYPE LEGEND ──────── */}
      <section className="rounded-xl p-5 border" style={{ background: c.surface, borderColor: c.border }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Block Types</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>All supported content block types in the document editor.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { icon: TextT, label: "Text", desc: "Body paragraph" },
            { icon: TextHOne, label: "Heading 1", desc: "Page title" },
            { icon: TextHTwo, label: "Heading 2", desc: "Section header" },
            { icon: TextHThree, label: "Heading 3", desc: "Subsection" },
            { icon: ListBullets, label: "Bullet List", desc: "Unordered" },
            { icon: ListNumbers, label: "Num. List", desc: "Ordered" },
            { icon: CheckSquare, label: "Checklist", desc: "To-do items" },
            { icon: Quotes, label: "Quote", desc: "Block quote" },
            { icon: CodeSimple, label: "Code", desc: "Syntax block" },
            { icon: Image, label: "Image", desc: "Media embed" },
            { icon: Table, label: "Table", desc: "Data grid" },
            { icon: WarningCircle, label: "Callout", desc: "Highlight" },
            { icon: Minus, label: "Divider", desc: "Section break" },
            { icon: Columns, label: "Columns", desc: "Multi-column" },
            { icon: FileText, label: "Page Link", desc: "Cross-ref" },
            { icon: ArrowSquareOut, label: "Embed", desc: "External" },
            { icon: Notebook, label: "Notebook", desc: "Notes" },
            { icon: CalendarBlank, label: "Calendar", desc: "Events" },
            { icon: BookOpenText, label: "Book", desc: "Reference" },
          ].map((block) => (
            <div key={block.label} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-black/[0.02] transition-colors" style={{ border: `1px solid ${c.borderSubtle}` }}>
              <block.icon className="w-4 h-4 shrink-0" style={{ color: c.text4 }} />
              <div>
                <p style={{ color: c.text2, fontSize: "11px", fontWeight: 500 }}>{block.label}</p>
                <p style={{ color: c.text4, fontSize: "10px" }}>{block.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}