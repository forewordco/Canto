import { useState } from "react";
import {
  CaretDown,
  CaretRight,
  Palette,
  TextT,
  GridNine,
  Stack,
  Sun,
  FolderOpen,
  CursorClick,
  CheckCircle,
  WarningCircle,
  Info,
  Lightbulb,
  Copy,
  Check,
} from "@phosphor-icons/react";

/* ── Styles ───────────────────────────────────────────────── */

const c = {
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.65 0.015 260)",
  border: "oklch(0.92 0.01 260)",
  bg2: "oklch(0.97 0.005 260)",
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
  emerald: "oklch(0.73 0.15 155)",
  emeraldLight: "oklch(0.73 0.15 155 / 0.12)",
  emeraldMid: "oklch(0.47 0.12 155)",
  lavender: "oklch(0.7 0.16 300)",
  lavenderLight: "oklch(0.7 0.16 300 / 0.12)",
  lavenderMid: "oklch(0.47 0.14 300)",
};

/* ── Callout ──────────────────────────────────────────────── */

function Callout({ type, children }: { type: "tip" | "info" | "warning"; children: React.ReactNode }) {
  const config = {
    tip: { icon: Lightbulb, bg: c.emeraldLight, fg: c.emeraldMid, border: c.emerald, label: "Tip" },
    info: { icon: Info, bg: c.indigoLight, fg: c.indigoMid, border: c.indigo, label: "Note" },
    warning: { icon: WarningCircle, bg: c.goldLight, fg: c.goldMid, border: c.gold, label: "Heads up" },
  }[type];
  const Icon = config.icon;

  return (
    <div className="flex gap-3 p-3.5 rounded-lg border-l-[3px]" style={{ background: config.bg, borderLeftColor: config.border }}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: config.fg }} />
      <div style={{ color: config.fg, fontSize: "12px", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

/* ── Inline code copy ─────────────────────────────────────── */

function InlineCode({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(children); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80 transition-opacity"
      style={{ background: c.bg2, fontSize: "11px", fontFamily: "monospace", color: c.indigoMid, border: `1px solid ${c.border}` }}
    >
      {children}
      {copied ? <Check className="w-2.5 h-2.5" style={{ color: c.tealMid }} /> : <Copy className="w-2.5 h-2.5 opacity-40" />}
    </button>
  );
}

/* ── Accordion Step ───────────────────────────────────────── */

function Step({ number, title, icon: Icon, children, defaultOpen = false }: {
  number: number;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.border, background: "white" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-5 py-4 text-left transition-colors hover:bg-black/[0.015]"
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: c.coralLight, color: c.coralMid, fontSize: "12px", fontWeight: 700 }}
        >
          {number}
        </span>
        <Icon className="w-4 h-4 shrink-0" style={{ color: c.text3 }} />
        <span className="flex-1" style={{ color: c.text1, fontSize: "14px", fontWeight: 600 }}>{title}</span>
        {open ? (
          <CaretDown className="w-4 h-4" style={{ color: c.text4 }} />
        ) : (
          <CaretRight className="w-4 h-4" style={{ color: c.text4 }} />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: c.border }}>
          <div className="pt-4" />
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Substep ──────────────────────────────────────────────── */

function Substep({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <CheckCircle className="w-4 h-4 shrink-0" style={{ color: c.teal }} />
        <div className="flex-1 w-px mt-1" style={{ background: c.border }} />
      </div>
      <div className="pb-4 space-y-2 flex-1 min-w-0">
        <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600 }}>{label}</p>
        <div style={{ color: c.text3, fontSize: "12px", lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

export function FigmaSetupGuide() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.lavender }} />
          <p style={{ color: c.lavenderMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>FIGMA INTEGRATION</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Figma Setup Guide</h1>
        <p className="mt-2 max-w-2xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Step-by-step instructions to recreate the FlowOS design system as Figma local variables, text styles, and color styles — ready for your team to use as a shared library.
        </p>
      </div>

      {/* Quick overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: Palette, label: "Color Variables", count: "120+", color: c.coral },
          { icon: TextT, label: "Text Styles", count: "10", color: c.indigo },
          { icon: GridNine, label: "Spacing Variables", count: "13", color: c.teal },
          { icon: Sun, label: "Effect Styles", count: "5", color: c.gold },
        ].map((card) => (
          <div key={card.label} className="rounded-lg p-3.5 border flex items-center gap-3" style={{ borderColor: c.border, background: "white" }}>
            <card.icon className="w-5 h-5 shrink-0" style={{ color: card.color }} />
            <div>
              <p style={{ color: c.text2, fontSize: "12px", fontWeight: 500 }}>{card.label}</p>
              <p style={{ color: card.color, fontSize: "16px", fontWeight: 700 }}>{card.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Prerequisites */}
      <Callout type="info">
        <strong>Prerequisites:</strong> You'll need Figma Desktop or Web, a team/org plan for shared libraries, and optionally the <strong>Tokens Studio for Figma</strong> plugin (free) for automated setup. The Download Assets page includes a Tokens Studio JSON export for one-click import.
      </Callout>

      {/* Steps */}
      <div className="space-y-3">

        {/* STEP 1: File Setup */}
        <Step number={1} title="Create Your Library File" icon={FolderOpen} defaultOpen>
          <Substep label="Create a new Figma file">
            <p>Name it <strong>"FlowOS — Design System"</strong> (or your preferred name). This file will become your published library.</p>
          </Substep>
          <Substep label="Create pages for each token category">
            <p>Add pages named: <strong>Colors</strong>, <strong>Typography</strong>, <strong>Spacing</strong>, <strong>Effects</strong>, <strong>Components</strong>, and <strong>Cover</strong>.</p>
          </Substep>
          <Substep label="Add a cover page">
            <p>Set the "Cover" page as first. Design a cover frame (1600×960) with the brand gradient, logo, and version number. This appears as the library thumbnail.</p>
          </Substep>
          <Callout type="tip">
            Keep token definitions in this library file and components in a separate file. This keeps things modular — token changes propagate without touching component structure.
          </Callout>
        </Step>

        {/* STEP 2: Color Variables */}
        <Step number={2} title="Set Up Color Variables" icon={Palette}>
          <Substep label="Open the Variables panel">
            <p>Go to the right sidebar → <strong>Local variables</strong> (or press the grid icon). Create a new <strong>Collection</strong> called <InlineCode>FlowOS / Colors</InlineCode>.</p>
          </Substep>
          <Substep label="Create color groups">
            <p>For each of the 12 color scales (Coral, Rose, Orange, Gold, Lime, Emerald, Teal, Cyan, Indigo, Lavender, Magenta, Neutral), create a group by naming variables with a slash separator. For example:</p>
            <div className="mt-2 space-y-1">
              {["coral/50", "coral/100", "coral/200", "coral/300", "coral/400", "coral/500"].map((name) => (
                <div key={name} className="flex items-center gap-2">
                  <InlineCode>{name}</InlineCode>
                </div>
              ))}
              <p className="mt-1" style={{ color: c.text4, fontSize: "11px" }}>… and so on for each step through 900</p>
            </div>
          </Substep>
          <Substep label="Enter OKLCH values">
            <p>Figma now supports OKLCH natively. In the color picker, switch to the OKLCH mode and enter the values from the Color Palette page. For example, Coral 500 is:</p>
            <div className="mt-2 flex gap-3 items-center">
              <div className="w-8 h-8 rounded-md" style={{ background: "oklch(0.63 0.2 25)" }} />
              <InlineCode>oklch(0.63 0.2 25)</InlineCode>
            </div>
          </Substep>
          <Substep label="Add semantic aliases">
            <p>Create a second collection called <InlineCode>FlowOS / Semantic</InlineCode>. Add variables that <strong>alias</strong> your color primitives:</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                { name: "primary", ref: "coral/400" },
                { name: "success", ref: "teal/500" },
                { name: "warning", ref: "gold/400" },
                { name: "error", ref: "coral/600" },
                { name: "info", ref: "cyan/500" },
                { name: "text/primary", ref: "neutral/900" },
                { name: "text/secondary", ref: "neutral/500" },
                { name: "background", ref: "neutral/50" },
                { name: "surface", ref: "white" },
                { name: "border", ref: "neutral/200" },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-2 px-2 py-1 rounded" style={{ background: c.bg2 }}>
                  <InlineCode>{item.name}</InlineCode>
                  <span style={{ color: c.text4, fontSize: "10px" }}>→</span>
                  <span style={{ color: c.text3, fontSize: "11px" }}>{item.ref}</span>
                </div>
              ))}
            </div>
          </Substep>
          <Callout type="tip">
            Using aliases means you can change Coral 400 once and every component referencing "primary" updates automatically. This is the most powerful feature of Figma Variables.
          </Callout>
        </Step>

        {/* STEP 3: Typography */}
        <Step number={3} title="Create Text Styles" icon={TextT}>
          <Substep label="Install Albert Sans">
            <p>Install <strong>Albert Sans</strong> from <a href="https://fonts.google.com/specimen/Albert+Sans" target="_blank" rel="noopener noreferrer" style={{ color: c.coralMid, textDecoration: "underline" }}>Google Fonts</a>. Make sure all weights (300–800) are available on your system or via Figma's font service.</p>
          </Substep>
          <Substep label="Create text styles for each scale level">
            <p>Go to the right sidebar text styles panel. Create text styles with these exact specs:</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full" style={{ fontSize: "11px" }}>
                <thead>
                  <tr style={{ color: c.text4 }}>
                    <th className="text-left py-1.5 pr-3" style={{ fontWeight: 600 }}>Style Name</th>
                    <th className="text-left py-1.5 pr-3" style={{ fontWeight: 600 }}>Size</th>
                    <th className="text-left py-1.5 pr-3" style={{ fontWeight: 600 }}>Weight</th>
                    <th className="text-left py-1.5 pr-3" style={{ fontWeight: 600 }}>Line Height</th>
                    <th className="text-left py-1.5" style={{ fontWeight: 600 }}>Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Display", "48", "Bold (700)", "1.15", "-0.02em"],
                    ["H1", "36", "Bold (700)", "1.2", "-0.015em"],
                    ["H2", "28", "SemiBold (600)", "1.3", "-0.01em"],
                    ["H3", "22", "SemiBold (600)", "1.35", "-0.005em"],
                    ["H4", "18", "SemiBold (600)", "1.4", "0"],
                    ["Body Large", "17", "Regular (400)", "1.7", "0"],
                    ["Body", "15", "Regular (400)", "1.65", "0"],
                    ["Body Small", "13", "Regular (400)", "1.55", "0.005em"],
                    ["Caption", "12", "Medium (500)", "1.4", "0.01em"],
                    ["Overline", "11", "SemiBold (600)", "1.3", "0.08em"],
                  ].map(([name, size, weight, lh, tracking]) => (
                    <tr key={name} style={{ color: c.text2 }}>
                      <td className="py-1.5 pr-3" style={{ fontWeight: 500 }}>{name}</td>
                      <td className="py-1.5 pr-3">{size}px</td>
                      <td className="py-1.5 pr-3">{weight}</td>
                      <td className="py-1.5 pr-3">{lh}</td>
                      <td className="py-1.5">{tracking}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Substep>
          <Substep label="Name using slash convention">
            <p>Name your styles with slash grouping for a clean hierarchy: <InlineCode>FlowOS / Display</InlineCode>, <InlineCode>FlowOS / H1</InlineCode>, <InlineCode>FlowOS / Body</InlineCode>, etc.</p>
          </Substep>
          <Callout type="warning">
            Figma letter-spacing uses pixels, not em. To convert: multiply the em value by the font size. For example, Display tracking of -0.02em at 48px = <strong>-0.96px</strong>.
          </Callout>
        </Step>

        {/* STEP 4: Spacing */}
        <Step number={4} title="Create Spacing Variables" icon={GridNine}>
          <Substep label="Create a spacing collection">
            <p>Create a new variable collection called <InlineCode>FlowOS / Spacing</InlineCode>. Set the type to <strong>Number</strong>.</p>
          </Substep>
          <Substep label="Add 4px grid values">
            <p>Create variables for each spacing step:</p>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {[
                { name: "space/0", value: "0" },
                { name: "space/1", value: "4" },
                { name: "space/2", value: "8" },
                { name: "space/3", value: "12" },
                { name: "space/4", value: "16" },
                { name: "space/5", value: "20" },
                { name: "space/6", value: "24" },
                { name: "space/8", value: "32" },
                { name: "space/10", value: "40" },
                { name: "space/12", value: "48" },
                { name: "space/16", value: "64" },
                { name: "space/20", value: "80" },
                { name: "space/24", value: "96" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between px-2 py-1 rounded" style={{ background: c.bg2 }}>
                  <span style={{ color: c.text3, fontSize: "11px" }}>{item.name}</span>
                  <span style={{ color: c.text4, fontSize: "10px", fontFamily: "monospace" }}>{item.value}px</span>
                </div>
              ))}
            </div>
          </Substep>
          <Substep label="Add radius variables">
            <p>In the same collection (or a new one called <InlineCode>FlowOS / Radius</InlineCode>), add border radius values:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                { name: "none", value: "0" },
                { name: "sm", value: "4" },
                { name: "md", value: "6" },
                { name: "default", value: "8" },
                { name: "lg", value: "10" },
                { name: "xl", value: "12" },
                { name: "2xl", value: "16" },
                { name: "3xl", value: "24" },
                { name: "full", value: "9999" },
              ].map((item) => (
                <span key={item.name} className="px-2 py-1 rounded" style={{ background: c.bg2, color: c.text3, fontSize: "11px" }}>
                  {item.name}: {item.value}px
                </span>
              ))}
            </div>
          </Substep>
          <Callout type="tip">
            Use spacing variables for auto-layout gaps, padding, and margins. This ensures every designer on your team uses the exact same 4px grid.
          </Callout>
        </Step>

        {/* STEP 5: Effects */}
        <Step number={5} title="Create Effect Styles" icon={Sun}>
          <Substep label="Create shadow styles">
            <p>Go to the right sidebar → Effect styles. Create drop shadow styles for each elevation level:</p>
            <div className="mt-2 space-y-2">
              {[
                { name: "Shadow / SM", desc: "Subtle card hover", offset: "0, 1", blur: "2", spread: "0", opacity: "4%" },
                { name: "Shadow / Default", desc: "Default card elevation", offset: "0, 1", blur: "3", spread: "0", opacity: "6%" },
                { name: "Shadow / MD", desc: "Raised elements", offset: "0, 4", blur: "6", spread: "-1", opacity: "6%" },
                { name: "Shadow / LG", desc: "Modals, drawers", offset: "0, 10", blur: "15", spread: "-3", opacity: "6%" },
                { name: "Shadow / XL", desc: "Popovers, overlays", offset: "0, 20", blur: "25", spread: "-5", opacity: "6%" },
              ].map((s) => (
                <div key={s.name} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: c.bg2 }}>
                  <div className="w-12 h-8 rounded-md bg-white shrink-0" style={{ boxShadow: `0 ${s.offset.split(", ")[1]}px ${s.blur}px ${s.spread}px rgba(0,0,0,0.06)` }} />
                  <div>
                    <p style={{ color: c.text2, fontSize: "12px", fontWeight: 500 }}>{s.name}</p>
                    <p style={{ color: c.text4, fontSize: "10px" }}>
                      {s.desc} — offset ({s.offset}), blur {s.blur}, spread {s.spread}, opacity {s.opacity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Substep>
          <Substep label="Use black with OKLCH notation">
            <p>Set the shadow color to black <InlineCode>oklch(0 0 0)</InlineCode> with the opacity listed above. Figma supports OKLCH in the color picker.</p>
          </Substep>
        </Step>

        {/* STEP 6: Publish */}
        <Step number={6} title="Publish & Share Your Library" icon={Stack}>
          <Substep label="Review your library contents">
            <p>Before publishing, verify you have all variables, text styles, and effect styles. Go to <strong>Assets</strong> panel → your library to see a summary.</p>
          </Substep>
          <Substep label="Publish the library">
            <p>Click the <strong>Assets</strong> panel → book icon → <strong>"Publish Library"</strong>. Write a clear version note like "v1.0 — Initial FlowOS design tokens".</p>
          </Substep>
          <Substep label="Enable for your team">
            <p>Team members can enable the library from any file: <strong>Assets → Team Library → Toggle on "FlowOS — Design System"</strong>. All tokens are now available in the variable picker and style menus.</p>
          </Substep>
          <Callout type="info">
            When you update tokens and republish, team members will see a notification to accept updates. Variable aliases ensure changes cascade automatically.
          </Callout>
        </Step>

        {/* STEP 7: Tokens Studio shortcut */}
        <Step number={7} title="Shortcut: Import via Tokens Studio" icon={CursorClick}>
          <Substep label="Install the Tokens Studio plugin">
            <p>Search for <strong>"Tokens Studio for Figma"</strong> in the Figma Community and install it. It's free for local tokens.</p>
          </Substep>
          <Substep label="Get the Tokens Studio JSON">
            <p>Go to the <strong>Download Assets</strong> page in this guide and switch to the <strong>"Tokens Studio"</strong> tab. Copy the full JSON output.</p>
          </Substep>
          <Substep label="Import into Figma">
            <p>Open the Tokens Studio plugin in Figma → click <strong>"Import"</strong> → paste the JSON. The plugin will automatically create:</p>
            <ul className="mt-1 space-y-0.5 list-disc list-inside" style={{ color: c.text3, fontSize: "12px" }}>
              <li>120+ color variables organized by group</li>
              <li>10 typography styles with all properties</li>
              <li>13 spacing values and 9 radius values</li>
              <li>5 shadow/elevation styles</li>
              <li>Semantic color aliases</li>
            </ul>
          </Substep>
          <Substep label="Apply tokens to your designs">
            <p>Once imported, use the plugin's UI to apply tokens to selected elements. Right-click any layer → <strong>Tokens Studio → Apply</strong>. The plugin keeps your designs in sync with the token source.</p>
          </Substep>
          <Callout type="tip">
            This is the fastest way to set up the entire system. The Tokens Studio JSON from the Download page is pre-formatted with the correct schema — no manual variable creation needed.
          </Callout>
        </Step>
      </div>

      {/* Checklist */}
      <section className="rounded-xl border p-5" style={{ borderColor: c.border, background: "white" }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Setup Checklist</h2>
        <p className="mt-0.5 mb-4" style={{ color: c.text3, fontSize: "13px" }}>Track your progress setting up the Figma library.</p>

        <div className="space-y-1.5">
          {[
            "Create library file with organized pages",
            "Set up 12 color scales as Figma Variables (120+ tokens)",
            "Create semantic color aliases (primary, success, warning, error, info)",
            "Install Albert Sans (weights 300–800)",
            "Create 10 text styles (Display → Overline)",
            "Create 13 spacing variables on 4px grid",
            "Create 9 border radius variables",
            "Create 5 elevation/shadow effect styles",
            "Review and publish library to team",
            "Verify team members can access and use tokens",
          ].map((item) => (
            <ChecklistItem key={item} label={item} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── Checklist item (interactive) ─────────────────────────── */

function ChecklistItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);

  return (
    <button
      onClick={() => setChecked(!checked)}
      className="flex items-center gap-3 w-full p-2.5 rounded-lg transition-colors hover:bg-black/[0.02] text-left"
    >
      <div
        className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
        style={{
          borderColor: checked ? c.teal : c.border,
          background: checked ? c.tealLight : "transparent",
        }}
      >
        {checked && <Check className="w-3 h-3" style={{ color: c.tealMid }} />}
      </div>
      <span
        className="transition-all"
        style={{
          color: checked ? c.text4 : c.text2,
          fontSize: "13px",
          textDecoration: checked ? "line-through" : "none",
        }}
      >
        {label}
      </span>
    </button>
  );
}