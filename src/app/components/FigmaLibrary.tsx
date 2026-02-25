import { useState, useCallback } from "react";
import {
  Download,
  Check,
  Copy,
  FigmaLogo,
  Package,
  Palette,
  TextT,
  Square,
  Lightning,
  Stack,
  GridFour,
  CaretRight,
  CaretDown,
  CheckCircle,
  Info,
  Lightbulb,
  ArrowSquareOut,
  Swatches,
  PaintBrush,
  Eye,
  Warning,
} from "@phosphor-icons/react";

/* ────────────────────────────────────────────────────────────
   TOKEN DATA  — single source of truth (mirrors DownloadAssets)
   ──────────────────────────────────────────────────────────── */

const colorScales = [
  { group: "coral", hue: 25, role: "Primary brand, CTAs", chromas: [0.04,0.07,0.11,0.14,0.18,0.2,0.19,0.16,0.12,0.08], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "rose", hue: 350, role: "Notifications, feminine accents", chromas: [0.03,0.06,0.1,0.14,0.17,0.2,0.19,0.16,0.12,0.08], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "orange", hue: 55, role: "Urgency, feature callouts", chromas: [0.03,0.06,0.1,0.14,0.17,0.18,0.17,0.14,0.11,0.07], lightnesses: [0.97,0.93,0.88,0.82,0.78,0.72,0.65,0.55,0.45,0.35] },
  { group: "gold", hue: 85, role: "Warnings, attention states", chromas: [0.03,0.06,0.1,0.13,0.15,0.16,0.15,0.13,0.1,0.07], lightnesses: [0.97,0.94,0.9,0.87,0.85,0.8,0.72,0.62,0.5,0.4] },
  { group: "lime", hue: 125, role: "Growth, positive trends", chromas: [0.04,0.07,0.11,0.14,0.17,0.18,0.16,0.14,0.1,0.07], lightnesses: [0.97,0.94,0.9,0.85,0.8,0.74,0.65,0.55,0.45,0.35] },
  { group: "emerald", hue: 155, role: "Success, approvals", chromas: [0.03,0.06,0.1,0.13,0.15,0.16,0.14,0.12,0.09,0.06], lightnesses: [0.96,0.92,0.86,0.8,0.73,0.65,0.55,0.47,0.38,0.3] },
  { group: "teal", hue: 180, role: "Success, progress, accents", chromas: [0.03,0.05,0.09,0.12,0.14,0.15,0.13,0.11,0.08,0.06], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.65,0.55,0.47,0.38,0.3] },
  { group: "cyan", hue: 205, role: "Info states, links", chromas: [0.03,0.05,0.09,0.13,0.15,0.16,0.14,0.12,0.09,0.06], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "indigo", hue: 280, role: "Secondary actions, active states", chromas: [0.03,0.06,0.1,0.14,0.18,0.2,0.19,0.16,0.12,0.08], lightnesses: [0.96,0.92,0.84,0.75,0.65,0.55,0.47,0.39,0.32,0.25] },
  { group: "lavender", hue: 300, role: "Creative contexts, categories", chromas: [0.03,0.05,0.09,0.13,0.16,0.18,0.17,0.14,0.1,0.07], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "magenta", hue: 330, role: "Special states, badges", chromas: [0.03,0.06,0.1,0.14,0.17,0.19,0.18,0.15,0.11,0.08], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "neutral", hue: 260, role: "Text, backgrounds, borders", chromas: [0.003,0.005,0.008,0.01,0.015,0.02,0.02,0.02,0.02,0.02], lightnesses: [0.985,0.97,0.94,0.88,0.75,0.6,0.5,0.4,0.3,0.2] },
];

const steps = [50,100,200,300,400,500,600,700,800,900];

const semanticTokens = [
  { name: "background", L: 0.99, C: 0.002, H: 260, desc: "Page backgrounds" },
  { name: "surface", L: 1, C: 0, H: 0, desc: "Cards, panels, modals" },
  { name: "border", L: 0.92, C: 0.01, H: 260, desc: "Dividers, outlines" },
  { name: "text-primary", L: 0.2, C: 0.02, H: 260, desc: "Headings, key content" },
  { name: "text-secondary", L: 0.5, C: 0.02, H: 260, desc: "Descriptions, labels" },
  { name: "text-muted", L: 0.65, C: 0.015, H: 260, desc: "Placeholders, hints" },
  { name: "primary", L: 0.7, C: 0.18, H: 25, desc: "CTAs, active states" },
  { name: "success", L: 0.65, C: 0.15, H: 180, desc: "Confirmations, completed" },
  { name: "warning", L: 0.85, C: 0.15, H: 85, desc: "Alerts, attention needed" },
  { name: "error", L: 0.6, C: 0.22, H: 25, desc: "Errors, destructive" },
  { name: "info", L: 0.63, C: 0.16, H: 205, desc: "Informational messages" },
  { name: "highlight", L: 0.63, C: 0.18, H: 300, desc: "New features, promotions" },
];

const typographyTokens = [
  { name: "Display", style: "display", size: 48, weight: 700, lineHeight: 1.15, tracking: -0.02 },
  { name: "Heading 1", style: "h1", size: 36, weight: 700, lineHeight: 1.2, tracking: -0.015 },
  { name: "Heading 2", style: "h2", size: 28, weight: 600, lineHeight: 1.3, tracking: -0.01 },
  { name: "Heading 3", style: "h3", size: 22, weight: 600, lineHeight: 1.35, tracking: -0.005 },
  { name: "Heading 4", style: "h4", size: 18, weight: 600, lineHeight: 1.4, tracking: 0 },
  { name: "Body Large", style: "body-lg", size: 17, weight: 400, lineHeight: 1.7, tracking: 0 },
  { name: "Body", style: "body", size: 15, weight: 400, lineHeight: 1.65, tracking: 0 },
  { name: "Body Small", style: "body-sm", size: 13, weight: 400, lineHeight: 1.55, tracking: 0.005 },
  { name: "Caption", style: "caption", size: 12, weight: 500, lineHeight: 1.4, tracking: 0.01 },
  { name: "Overline", style: "overline", size: 11, weight: 600, lineHeight: 1.3, tracking: 0.08 },
];

const spacingValues = [0,2,4,6,8,10,12,16,20,24,32,40,48,64,80,96];

const radiusTokens = [
  { name: "none", value: 0 }, { name: "sm", value: 4 }, { name: "md", value: 6 },
  { name: "default", value: 8 }, { name: "lg", value: 10 }, { name: "xl", value: 12 },
  { name: "2xl", value: 16 }, { name: "3xl", value: 24 }, { name: "full", value: 9999 },
];

const shadowTokens = [
  { name: "sm", value: "0 1px 2px 0 rgba(0,0,0,0.04)" },
  { name: "default", value: "0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)" },
  { name: "md", value: "0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.06)" },
  { name: "lg", value: "0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -4px rgba(0,0,0,0.06)" },
  { name: "xl", value: "0 20px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)" },
];

const componentSpecs = [
  {
    name: "Button",
    variants: ["Primary", "Secondary", "Ghost", "Destructive", "Outline"],
    sizes: ["sm (32px)", "md (36px)", "lg (40px)"],
    states: ["Default", "Hover", "Active", "Disabled", "Loading"],
    radius: "6px",
    props: { paddingX: "16px", paddingY: "8px", gap: "8px", fontSize: "13px", fontWeight: 500 },
  },
  {
    name: "Input",
    variants: ["Default", "With Icon", "With Suffix", "Textarea"],
    sizes: ["sm (32px)", "md (36px)", "lg (40px)"],
    states: ["Default", "Focus", "Error", "Disabled"],
    radius: "6px",
    props: { paddingX: "12px", paddingY: "8px", fontSize: "13px", borderWidth: "1px" },
  },
  {
    name: "Badge / Tag",
    variants: ["Coral", "Indigo", "Teal", "Gold", "Lavender", "Neutral"],
    sizes: ["sm (20px)", "md (24px)"],
    states: ["Default"],
    radius: "9999px",
    props: { paddingX: "8px", paddingY: "2px", fontSize: "11px", fontWeight: 500 },
  },
  {
    name: "Avatar",
    variants: ["Initials", "Image"],
    sizes: ["xs (20px)", "sm (24px)", "md (32px)", "lg (40px)", "xl (56px)"],
    states: ["Default", "With Status Dot"],
    radius: "9999px",
    props: { fontSize: "varies", fontWeight: 600 },
  },
  {
    name: "Card",
    variants: ["Default", "Interactive", "Selected"],
    sizes: ["Flexible"],
    states: ["Default", "Hover", "Selected"],
    radius: "6px",
    props: { padding: "16px", borderWidth: "1px", shadow: "sm" },
  },
  {
    name: "Checkbox",
    variants: ["Square (subtask)", "Circle (task)"],
    sizes: ["sm (14px)", "md (16px)"],
    states: ["Unchecked", "Checked", "In-Progress", "On Hold", "Blocked"],
    radius: "3px / full",
    props: { borderWidth: "1.5px" },
  },
  {
    name: "Tooltip",
    variants: ["Default", "Rich"],
    sizes: ["Auto"],
    states: ["Visible"],
    radius: "6px",
    props: { padding: "6px 10px", fontSize: "12px", background: "neutral-900" },
  },
  {
    name: "Dropdown / Menu",
    variants: ["Default", "With Icons", "With Submenu", "With Dividers"],
    sizes: ["min-width: 180px"],
    states: ["Default", "Hover Item", "Active Item"],
    radius: "6px",
    props: { padding: "4px", itemHeight: "32px", fontSize: "13px", shadow: "lg" },
  },
  {
    name: "Priority Flag",
    variants: ["Urgent (coral)", "High (orange)", "Medium (gold)", "Low (teal)", "None (gray)"],
    sizes: ["14px", "16px"],
    states: ["Filled (active)", "Outline (none)"],
    radius: "—",
    props: { iconWeight: "fill / regular" },
  },
  {
    name: "Task Status Icon",
    variants: ["Task (circle)", "Subtask (square)"],
    sizes: ["14px", "16px"],
    states: ["Open", "In-Progress (indigo)", "On Hold (gold)", "Blocked (coral)", "Done (teal)"],
    radius: "—",
    props: { iconWeight: "regular / fill for done" },
  },
];

/* ── OKLCH → Hex ──────────────────────────────────────────── */

function oklchToHex(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const toGamma = (v: number) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  r = Math.round(Math.min(255, Math.max(0, toGamma(r) * 255)));
  g = Math.round(Math.min(255, Math.max(0, toGamma(g) * 255)));
  bl = Math.round(Math.min(255, Math.max(0, toGamma(bl) * 255)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/* ── Generate the full Figma library JSON ──────────────────── */

function generateFigmaLibraryJSON(): string {
  const lib: Record<string, unknown> = {
    _meta: {
      name: "FlowOS Design System",
      version: "1.0.0",
      description: "Complete Figma-ready design tokens and component specifications for FlowOS",
      fontFamily: "Albert Sans",
      generatedAt: new Date().toISOString(),
      format: "W3C DTCG (Design Tokens Community Group)",
    },
    color: {} as Record<string, unknown>,
    semantic: {} as Record<string, unknown>,
    typography: {} as Record<string, unknown>,
    spacing: {} as Record<string, unknown>,
    borderRadius: {} as Record<string, unknown>,
    boxShadow: {} as Record<string, unknown>,
    components: {} as Record<string, unknown>,
  };

  // Colors — full scales with hex + oklch
  for (const sc of colorScales) {
    const group: Record<string, unknown> = { $description: sc.role };
    for (let i = 0; i < steps.length; i++) {
      group[String(steps[i])] = {
        $type: "color",
        $value: oklchToHex(sc.lightnesses[i], sc.chromas[i], sc.hue),
        $extensions: { oklch: `oklch(${sc.lightnesses[i]} ${sc.chromas[i]} ${sc.hue})` },
      };
    }
    (lib.color as Record<string, unknown>)[sc.group] = group;
  }

  // Semantic
  for (const s of semanticTokens) {
    (lib.semantic as Record<string, unknown>)[s.name] = {
      $type: "color",
      $value: oklchToHex(s.L, s.C, s.H),
      $description: s.desc,
      $extensions: { oklch: `oklch(${s.L} ${s.C} ${s.H})` },
    };
  }

  // Typography
  for (const t of typographyTokens) {
    (lib.typography as Record<string, unknown>)[t.style] = {
      $type: "typography",
      $value: {
        fontFamily: "Albert Sans",
        fontWeight: t.weight,
        fontSize: t.size,
        lineHeight: Math.round(t.size * t.lineHeight * 100) / 100,
        letterSpacing: t.tracking !== 0 ? `${t.tracking}em` : "0",
      },
      $description: t.name,
    };
  }

  // Spacing
  for (const s of spacingValues) {
    (lib.spacing as Record<string, unknown>)[`space-${s}`] = { $type: "dimension", $value: `${s}px` };
  }

  // Radius
  for (const r of radiusTokens) {
    (lib.borderRadius as Record<string, unknown>)[r.name] = { $type: "dimension", $value: `${r.value}px` };
  }

  // Shadows
  for (const s of shadowTokens) {
    (lib.boxShadow as Record<string, unknown>)[s.name] = { $type: "shadow", $value: s.value };
  }

  // Component specs
  for (const comp of componentSpecs) {
    (lib.components as Record<string, unknown>)[comp.name.toLowerCase().replace(/\s+\/\s+/g, "-").replace(/\s+/g, "-")] = {
      $description: comp.name,
      variants: comp.variants,
      sizes: comp.sizes,
      states: comp.states,
      borderRadius: comp.radius,
      properties: comp.props,
    };
  }

  return JSON.stringify(lib, null, 2);
}

/* ── Tokens Studio format ────────────────────────────────── */

function generateTokensStudioJSON(): string {
  const root: Record<string, unknown> = {};

  // Global group
  const global: Record<string, unknown> = {};

  // Font families
  global["fontFamilies"] = {
    "sans": { $value: "Albert Sans", $type: "fontFamilies" },
  };

  // Font weights
  global["fontWeights"] = {
    regular: { $value: "400", $type: "fontWeights" },
    medium: { $value: "500", $type: "fontWeights" },
    semibold: { $value: "600", $type: "fontWeights" },
    bold: { $value: "700", $type: "fontWeights" },
  };

  // Colors
  for (const sc of colorScales) {
    for (let i = 0; i < steps.length; i++) {
      global[`${sc.group}-${steps[i]}`] = {
        $value: oklchToHex(sc.lightnesses[i], sc.chromas[i], sc.hue),
        $type: "color",
      };
    }
  }

  // Semantic
  for (const s of semanticTokens) {
    global[`semantic-${s.name}`] = {
      $value: oklchToHex(s.L, s.C, s.H),
      $type: "color",
      $description: s.desc,
    };
  }

  // Typography composites
  for (const t of typographyTokens) {
    global[`typography-${t.style}`] = {
      $value: {
        fontFamily: "{fontFamilies.sans}",
        fontWeight: `{fontWeights.${t.weight === 700 ? "bold" : t.weight === 600 ? "semibold" : t.weight === 500 ? "medium" : "regular"}}`,
        fontSize: `${t.size}`,
        lineHeight: `${Math.round(t.size * t.lineHeight)}`,
        letterSpacing: t.tracking !== 0 ? `${(t.tracking * 100).toFixed(1)}%` : "0%",
      },
      $type: "typography",
    };
  }

  // Spacing
  for (const s of spacingValues) {
    global[`space-${s}`] = { $value: `${s}`, $type: "spacing" };
  }

  // Radius
  for (const r of radiusTokens) {
    global[`radius-${r.name}`] = { $value: `${r.value}`, $type: "borderRadius" };
  }

  // Shadows
  for (const sh of shadowTokens) {
    global[`shadow-${sh.name}`] = { $value: sh.value, $type: "boxShadow" };
  }

  root["FlowOS"] = global;
  return JSON.stringify(root, null, 2);
}

/* ── Style Dictionary format ─────────────────────────────── */

function generateStyleDictionaryJSON(): string {
  const sd: Record<string, unknown> = {
    color: {} as Record<string, unknown>,
    size: {
      font: {} as Record<string, unknown>,
      spacing: {} as Record<string, unknown>,
      radius: {} as Record<string, unknown>,
    },
    asset: {
      font: { sans: { value: "Albert Sans, sans-serif" } },
    },
  };

  for (const sc of colorScales) {
    const group: Record<string, unknown> = {};
    for (let i = 0; i < steps.length; i++) {
      group[String(steps[i])] = { value: oklchToHex(sc.lightnesses[i], sc.chromas[i], sc.hue) };
    }
    (sd.color as Record<string, unknown>)[sc.group] = group;
  }

  const semGroup: Record<string, unknown> = {};
  for (const s of semanticTokens) {
    semGroup[s.name] = { value: oklchToHex(s.L, s.C, s.H), comment: s.desc };
  }
  (sd.color as Record<string, unknown>)["semantic"] = semGroup;

  for (const t of typographyTokens) {
    ((sd.size as Record<string, unknown>).font as Record<string, unknown>)[t.style] = { value: `${t.size}` };
  }
  for (const s of spacingValues) {
    ((sd.size as Record<string, unknown>).spacing as Record<string, unknown>)[`space-${s}`] = { value: `${s}` };
  }
  for (const r of radiusTokens) {
    ((sd.size as Record<string, unknown>).radius as Record<string, unknown>)[r.name] = { value: `${r.value}` };
  }

  return JSON.stringify(sd, null, 2);
}

/* ── Styles ───────────────────────────────────────────────── */

const c = {
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.65 0.015 260)",
  border: "oklch(0.92 0.01 260)",
  bg1: "oklch(0.99 0.002 260)",
  bg2: "oklch(0.97 0.005 260)",
  surface: "oklch(1 0 0)",
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

/* ── File definitions ─────────────────────────────────────── */

const downloadFiles = [
  {
    id: "figma-variables",
    label: "Figma Variables JSON",
    description: "W3C DTCG format with hex colors, OKLCH preserved in $extensions. Import via any Figma variables plugin.",
    icon: FigmaLogo,
    filename: "flowos-figma-library.json",
    generate: generateFigmaLibraryJSON,
    color: c.indigo,
    colorLight: c.indigoLight,
    colorMid: c.indigoMid,
  },
  {
    id: "tokens-studio",
    label: "Tokens Studio",
    description: "Compatible with Tokens Studio for Figma plugin. Creates color variables, text styles, spacing, and radii automatically.",
    icon: Stack,
    filename: "flowos-tokens-studio.json",
    generate: generateTokensStudioJSON,
    color: c.coral,
    colorLight: c.coralLight,
    colorMid: c.coralMid,
  },
  {
    id: "style-dictionary",
    label: "Style Dictionary",
    description: "Amazon Style Dictionary format. Build platform-specific tokens for iOS, Android, web, and more.",
    icon: PaintBrush,
    filename: "flowos-style-dictionary.json",
    generate: generateStyleDictionaryJSON,
    color: c.teal,
    colorLight: c.tealLight,
    colorMid: c.tealMid,
  },
];

/* ── Sub-components ───────────────────────────────────────── */

function CollapsibleSection({ title, icon: Icon, badge, defaultOpen = false, children }: {
  title: string; icon: React.ElementType; badge?: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[6px] border overflow-hidden" style={{ borderColor: c.border, background: c.surface }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full px-4 py-3 text-left transition-colors hover:bg-black/[0.015]"
      >
        {open ? <CaretDown className="w-3.5 h-3.5" style={{ color: c.text4 }} /> : <CaretRight className="w-3.5 h-3.5" style={{ color: c.text4 }} />}
        <Icon className="w-4 h-4" style={{ color: c.text3 }} />
        <span className="flex-1" style={{ color: c.text1, fontSize: "14px", fontWeight: 600 }}>{title}</span>
        {badge && <span className="px-2 py-0.5 rounded-full" style={{ background: c.bg2, color: c.text4, fontSize: "11px" }}>{badge}</span>}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: c.border }}>
          <div className="pt-3">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */

export function FigmaLibrary() {
  const [copied, setCopied] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  const handleDownload = useCallback((file: typeof downloadFiles[0]) => {
    const content = file.generate();
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadAll = useCallback(() => {
    // Download each file individually (no zip library needed)
    for (const file of downloadFiles) {
      handleDownload(file);
    }
  }, [handleDownload]);

  const handleCopy = useCallback((file: typeof downloadFiles[0]) => {
    navigator.clipboard.writeText(file.generate());
    setCopied(file.id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  // Stats
  const totalColors = colorScales.length * steps.length + semanticTokens.length;
  const totalTokens = totalColors + typographyTokens.length + spacingValues.length + radiusTokens.length + shadowTokens.length;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.indigo }} />
          <p style={{ color: c.indigoMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>FIGMA LIBRARY</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Downloadable Figma Library</h1>
        <p className="mt-2 max-w-2xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Export the complete FlowOS design system as Figma-ready token files. Import into Figma using Tokens Studio, the Variables API, or any token plugin to auto-generate your styles, variables, and component foundations.
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "Color Scales", value: "12", sub: `${colorScales.length * steps.length} swatches`, icon: Palette },
          { label: "Semantic Tokens", value: `${semanticTokens.length}`, sub: "Mapped to roles", icon: Swatches },
          { label: "Type Styles", value: `${typographyTokens.length}`, sub: "Display → Overline", icon: TextT },
          { label: "Spacing + Radius", value: `${spacingValues.length + radiusTokens.length}`, sub: "4px grid + radii", icon: GridFour },
          { label: "Total Tokens", value: `${totalTokens}`, sub: "All categories", icon: Package },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[6px] border p-3" style={{ borderColor: c.border, background: c.surface }}>
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-3.5 h-3.5" style={{ color: c.text4 }} />
              <span style={{ color: c.text4, fontSize: "11px" }}>{stat.label}</span>
            </div>
            <p style={{ color: c.indigo, fontSize: "22px", fontWeight: 700 }}>{stat.value}</p>
            <p style={{ color: c.text4, fontSize: "10px" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── How to import (callout) ── */}
      <div className="rounded-[6px] border p-4" style={{ borderColor: "oklch(0.55 0.2 280 / 0.2)", background: "oklch(0.55 0.2 280 / 0.05)" }}>
        <div className="flex items-center gap-2 mb-3">
          <FigmaLogo className="w-4 h-4" style={{ color: c.indigoMid }} />
          <p style={{ color: c.indigoMid, fontSize: "13px", fontWeight: 600 }}>How to import into Figma</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: "1", title: "Download tokens", desc: "Click any download button below to get the JSON file for your preferred format." },
            { step: "2", title: "Install Tokens Studio", desc: "Search \"Tokens Studio\" in Figma Community plugins and install it (free tier works)." },
            { step: "3", title: "Import JSON", desc: "Open Tokens Studio → Settings → Import → Select the downloaded JSON file." },
            { step: "4", title: "Apply & publish", desc: "Create styles from tokens, then publish your file as a Figma library for your team." },
          ].map((s) => (
            <div key={s.step} className="flex gap-2.5">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "11px", fontWeight: 700 }}
              >
                {s.step}
              </span>
              <div>
                <p style={{ color: "oklch(0.3 0.1 280)", fontSize: "12px", fontWeight: 600 }}>{s.title}</p>
                <p style={{ color: "oklch(0.45 0.08 280)", fontSize: "11px", lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Download all button ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Export Files</h2>
          <p style={{ color: c.text4, fontSize: "12px" }}>Choose a format or download all three.</p>
        </div>
        <button
          onClick={handleDownloadAll}
          className="flex items-center gap-2 px-4 py-2 rounded-[6px] transition-colors hover:opacity-90"
          style={{ background: c.indigo, color: "white", fontSize: "13px", fontWeight: 500 }}
        >
          <Download className="w-4 h-4" />
          Download All Formats
        </button>
      </div>

      {/* ── Download cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {downloadFiles.map((file) => (
          <div key={file.id} className="rounded-[6px] border overflow-hidden" style={{ borderColor: c.border, background: c.surface }}>
            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: c.border }}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-[6px] flex items-center justify-center" style={{ background: file.colorLight }}>
                  <file.icon className="w-4 h-4" style={{ color: file.colorMid }} />
                </div>
                <div>
                  <p style={{ color: c.text1, fontSize: "14px", fontWeight: 600 }}>{file.label}</p>
                  <p style={{ color: c.text4, fontSize: "10px", fontFamily: "monospace" }}>{file.filename}</p>
                </div>
              </div>
              <p style={{ color: c.text3, fontSize: "12px", lineHeight: 1.5 }}>{file.description}</p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 p-3" style={{ background: c.bg2 }}>
              <button
                onClick={() => handleDownload(file)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] flex-1 justify-center transition-colors hover:opacity-90"
                style={{ background: file.color, color: "white", fontSize: "12px", fontWeight: 500 }}
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button
                onClick={() => handleCopy(file)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border transition-colors hover:bg-black/[0.03]"
                style={{ borderColor: c.border, color: copied === file.id ? c.tealMid : c.text3, fontSize: "12px", fontWeight: 500 }}
              >
                {copied === file.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === file.id ? "Copied" : "Copy"}
              </button>
              <button
                onClick={() => setPreviewFile(previewFile === file.id ? null : file.id)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-[6px] border transition-colors hover:bg-black/[0.03]"
                style={{ borderColor: c.border, color: previewFile === file.id ? c.indigoMid : c.text4, fontSize: "12px" }}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Preview */}
            {previewFile === file.id && (
              <div className="overflow-auto max-h-[320px] border-t" style={{ background: "oklch(0.18 0.02 260)", borderColor: c.border }}>
                <pre className="p-4" style={{ color: "oklch(0.85 0.01 260)", fontSize: "10px", lineHeight: 1.65, fontFamily: "monospace", whiteSpace: "pre" }}>
                  {file.generate()}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── What's included ── */}
      <div>
        <h2 className="mb-3" style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>What's Included</h2>
        <div className="space-y-2">
          {/* Color Scales */}
          <CollapsibleSection title="Color Scales" icon={Palette} badge={`${colorScales.length} scales, ${colorScales.length * steps.length} swatches`} defaultOpen>
            <div className="space-y-3">
              {colorScales.map((sc) => (
                <div key={sc.group}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-3 h-3 rounded" style={{ background: oklchToHex(sc.lightnesses[4], sc.chromas[4], sc.hue) }} />
                    <span style={{ color: c.text2, fontSize: "12px", fontWeight: 600, textTransform: "capitalize" }}>{sc.group}</span>
                    <span style={{ color: c.text4, fontSize: "10px" }}>hue {sc.hue} — {sc.role}</span>
                  </div>
                  <div className="flex gap-0.5 rounded-[6px] overflow-hidden h-6">
                    {steps.map((step, i) => (
                      <div
                        key={step}
                        className="flex-1 relative group"
                        style={{ background: oklchToHex(sc.lightnesses[i], sc.chromas[i], sc.hue) }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-1 rounded text-[8px]" style={{ background: "oklch(0 0 0 / 0.5)", color: "white" }}>{step}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Semantic Tokens */}
          <CollapsibleSection title="Semantic Tokens" icon={Swatches} badge={`${semanticTokens.length} tokens`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {semanticTokens.map((s) => (
                <div key={s.name} className="flex items-center gap-2 p-2 rounded-[6px]" style={{ background: c.bg2 }}>
                  <div className="w-6 h-6 rounded shrink-0 border" style={{ background: oklchToHex(s.L, s.C, s.H), borderColor: s.L > 0.9 ? c.border : "transparent" }} />
                  <div>
                    <p style={{ color: c.text2, fontSize: "11px", fontWeight: 500 }}>{s.name}</p>
                    <p style={{ color: c.text4, fontSize: "9px" }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Typography */}
          <CollapsibleSection title="Typography Styles" icon={TextT} badge={`${typographyTokens.length} styles`}>
            <div className="space-y-1.5">
              {typographyTokens.map((t) => (
                <div key={t.style} className="flex items-center justify-between p-2 rounded-[6px] hover:bg-black/[0.02]">
                  <div className="flex items-center gap-3">
                    <span style={{ color: c.text1, fontSize: `${Math.min(t.size, 22)}px`, fontWeight: t.weight, lineHeight: 1.3 }}>
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: c.text4, fontSize: "10px", fontFamily: "monospace" }}>{t.size}px</span>
                    <span style={{ color: c.text4, fontSize: "10px", fontFamily: "monospace" }}>w{t.weight}</span>
                    <span style={{ color: c.text4, fontSize: "10px", fontFamily: "monospace" }}>{t.lineHeight}</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Spacing */}
          <CollapsibleSection title="Spacing & Radius" icon={GridFour} badge={`${spacingValues.length + radiusTokens.length} tokens`}>
            <div className="space-y-4">
              <div>
                <p className="mb-2" style={{ color: c.text3, fontSize: "12px", fontWeight: 500 }}>Spacing Scale (4px grid)</p>
                <div className="flex items-end gap-1 flex-wrap">
                  {spacingValues.filter(s => s > 0).map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div className="rounded" style={{ width: `${Math.min(s, 48)}px`, height: `${Math.min(s, 48)}px`, background: c.indigoLight, border: `1px solid ${c.indigo}` }} />
                      <span style={{ color: c.text4, fontSize: "9px" }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2" style={{ color: c.text3, fontSize: "12px", fontWeight: 500 }}>Border Radius</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {radiusTokens.filter(r => r.value < 100).map((r) => (
                    <div key={r.name} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 border-2" style={{ borderRadius: `${r.value}px`, borderColor: c.coral, background: c.coralLight }} />
                      <span style={{ color: c.text4, fontSize: "9px" }}>{r.name}</span>
                      <span style={{ color: c.text4, fontSize: "8px", fontFamily: "monospace" }}>{r.value}px</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Effects */}
          <CollapsibleSection title="Elevation / Shadows" icon={Square} badge={`${shadowTokens.length} levels`}>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {shadowTokens.map((s) => (
                <div
                  key={s.name}
                  className="rounded-[6px] border p-4 flex items-center justify-center"
                  style={{ background: c.surface, borderColor: c.border, boxShadow: s.value, minHeight: "64px" }}
                >
                  <span style={{ color: c.text3, fontSize: "12px", fontWeight: 500 }}>{s.name}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Component Specs */}
          <CollapsibleSection title="Component Specifications" icon={Lightning} badge={`${componentSpecs.length} components`}>
            <div className="space-y-3">
              {componentSpecs.map((comp) => (
                <div key={comp.name} className="rounded-[6px] border p-3" style={{ borderColor: c.border, background: c.bg2 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <p style={{ color: c.text1, fontSize: "13px", fontWeight: 600 }}>{comp.name}</p>
                    <span className="px-1.5 py-0.5 rounded-full" style={{ background: c.indigoLight, color: c.indigoMid, fontSize: "10px" }}>
                      {comp.variants.length} variants
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <p style={{ color: c.text4, fontSize: "10px", fontWeight: 600 }}>VARIANTS</p>
                      <p style={{ color: c.text3, fontSize: "11px", lineHeight: 1.5 }}>{comp.variants.join(", ")}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text4, fontSize: "10px", fontWeight: 600 }}>SIZES</p>
                      <p style={{ color: c.text3, fontSize: "11px", lineHeight: 1.5 }}>{comp.sizes.join(", ")}</p>
                    </div>
                    <div>
                      <p style={{ color: c.text4, fontSize: "10px", fontWeight: 600 }}>STATES</p>
                      <p style={{ color: c.text3, fontSize: "11px", lineHeight: 1.5 }}>{comp.states.join(", ")}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t flex items-center gap-3 flex-wrap" style={{ borderColor: c.border }}>
                    <span style={{ color: c.text4, fontSize: "10px" }}>radius: <span style={{ fontFamily: "monospace" }}>{comp.radius}</span></span>
                    {Object.entries(comp.props).map(([k, v]) => (
                      <span key={k} style={{ color: c.text4, fontSize: "10px" }}>{k}: <span style={{ fontFamily: "monospace" }}>{String(v)}</span></span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      </div>

      {/* ── Helpful notes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-[6px] border p-4 flex gap-3" style={{ borderColor: c.border, background: c.surface }}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.indigoMid }} />
          <div>
            <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600 }}>OKLCH in Figma</p>
            <p className="mt-1" style={{ color: c.text3, fontSize: "12px", lineHeight: 1.6 }}>
              Figma doesn't natively support OKLCH yet, so all exports include hex conversions. The original OKLCH values are preserved in <code className="px-1 py-0.5 rounded" style={{ background: c.bg2, fontSize: "10px", fontFamily: "monospace" }}>$extensions.oklch</code> for reference.
            </p>
          </div>
        </div>
        <div className="rounded-[6px] border p-4 flex gap-3" style={{ borderColor: c.border, background: c.surface }}>
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.goldMid }} />
          <div>
            <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600 }}>Recommended Workflow</p>
            <p className="mt-1" style={{ color: c.text3, fontSize: "12px", lineHeight: 1.6 }}>
              Use <strong>Tokens Studio</strong> for the fastest setup — it auto-creates Figma Variables and text styles. Then publish your file as a team library. Use the <strong>Figma Variables JSON</strong> for REST API automation.
            </p>
          </div>
        </div>
        <div className="rounded-[6px] border p-4 flex gap-3" style={{ borderColor: c.border, background: c.surface }}>
          <Warning className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.goldMid }} />
          <div>
            <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600 }}>Font Requirement</p>
            <p className="mt-1" style={{ color: c.text3, fontSize: "12px", lineHeight: 1.6 }}>
              Install <strong>Albert Sans</strong> on your system or activate it via Google Fonts before importing tokens. Figma needs the font locally to apply text styles correctly.
            </p>
          </div>
        </div>
        <div className="rounded-[6px] border p-4 flex gap-3" style={{ borderColor: c.border, background: c.surface }}>
          <ArrowSquareOut className="w-4 h-4 shrink-0 mt-0.5" style={{ color: c.tealMid }} />
          <div>
            <p style={{ color: c.text2, fontSize: "13px", fontWeight: 600 }}>Need More Formats?</p>
            <p className="mt-1" style={{ color: c.text3, fontSize: "12px", lineHeight: 1.6 }}>
              Visit the <a href="/downloads" style={{ color: c.coral, textDecoration: "underline" }}>Download Assets</a> page for CSS Variables, Tailwind v4, and raw JSON exports. The <a href="/figma-guide" style={{ color: c.coral, textDecoration: "underline" }}>Figma Guide</a> page has step-by-step setup instructions.
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick reference: component overview ── */}
      <section className="rounded-[6px] border overflow-hidden" style={{ borderColor: c.border, background: c.surface }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: c.border, background: c.bg2 }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Component Quick Reference</h2>
          <p className="mt-0.5" style={{ color: c.text4, fontSize: "12px" }}>Standard dimensions and tokens for building components in Figma.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: "12px" }}>
            <thead>
              <tr style={{ background: c.bg2 }}>
                <th className="text-left px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontWeight: 600 }}>Component</th>
                <th className="text-left px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontWeight: 600 }}>Radius</th>
                <th className="text-left px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontWeight: 600 }}>Heights</th>
                <th className="text-left px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontWeight: 600 }}>Font</th>
                <th className="text-left px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontWeight: 600 }}>Padding</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Button", radius: "6px", heights: "32 / 36 / 40", font: "13px / 500", padding: "8px 16px" },
                { name: "Input", radius: "6px", heights: "32 / 36 / 40", font: "13px / 400", padding: "8px 12px" },
                { name: "Card", radius: "6px", heights: "Auto", font: "—", padding: "16px" },
                { name: "Badge", radius: "full", heights: "20 / 24", font: "11px / 500", padding: "2px 8px" },
                { name: "Avatar", radius: "full", heights: "20–56", font: "varies / 600", padding: "—" },
                { name: "Tooltip", radius: "6px", heights: "Auto", font: "12px / 400", padding: "6px 10px" },
                { name: "Menu Item", radius: "4px", heights: "32", font: "13px / 400", padding: "6px 8px" },
                { name: "Table Row", radius: "—", heights: "40", font: "13px / 400", padding: "8px 12px" },
                { name: "Sidebar Item", radius: "6px", heights: "32", font: "13px / 500", padding: "6px 8px" },
                { name: "Tab", radius: "—", heights: "36", font: "13px / 500", padding: "8px 12px" },
              ].map((row) => (
                <tr key={row.name} className="hover:bg-black/[0.015] transition-colors">
                  <td className="px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text1, fontWeight: 500 }}>{row.name}</td>
                  <td className="px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontFamily: "monospace" }}>{row.radius}</td>
                  <td className="px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontFamily: "monospace" }}>{row.heights}</td>
                  <td className="px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontFamily: "monospace" }}>{row.font}</td>
                  <td className="px-4 py-2 border-b" style={{ borderColor: c.border, color: c.text3, fontFamily: "monospace" }}>{row.padding}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Figma file structure recommendation ── */}
      <section className="rounded-[6px] border p-5" style={{ borderColor: c.border, background: c.surface }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Recommended Figma File Structure</h2>
        <p className="mt-1 mb-4" style={{ color: c.text3, fontSize: "12px", lineHeight: 1.6 }}>
          Organize your Figma library file with these pages for maximum reusability.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { page: "Cover", desc: "Library thumbnail with version number and description", icon: "1" },
            { page: "Color Styles", desc: "All 120 color swatches organized by scale, plus semantic tokens", icon: "2" },
            { page: "Typography", desc: "Text style samples from Display to Overline", icon: "3" },
            { page: "Icons", desc: "Phosphor icon set — regular and fill weights at 16/20/24px", icon: "4" },
            { page: "Components", desc: "Buttons, inputs, cards, badges, avatars, menus, tooltips", icon: "5" },
            { page: "Patterns", desc: "Task lists, kanban boards, project cards, detail panes", icon: "6" },
          ].map((p) => (
            <div key={p.page} className="flex gap-2.5 p-3 rounded-[6px]" style={{ background: c.bg2 }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: c.coralLight, color: c.coralMid, fontSize: "11px", fontWeight: 700 }}
              >
                {p.icon}
              </span>
              <div>
                <p style={{ color: c.text2, fontSize: "12px", fontWeight: 600 }}>{p.page}</p>
                <p style={{ color: c.text4, fontSize: "11px", lineHeight: 1.5 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
