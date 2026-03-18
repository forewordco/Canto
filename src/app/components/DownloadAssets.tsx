import { useState } from "react";
import { Check, Copy, Download, FileJs, FileCode, PaintBrush, Stack, FigmaLogo } from "@phosphor-icons/react";

/* ── Shared token data ────────────────────────────────────── */

const colorTokens = [
  { group: "coral", hue: 25, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.04,0.07,0.11,0.14,0.18,0.2,0.19,0.16,0.12,0.08], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "rose", hue: 350, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.06,0.1,0.14,0.17,0.2,0.19,0.16,0.12,0.08], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "orange", hue: 55, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.06,0.1,0.14,0.17,0.18,0.17,0.14,0.11,0.07], lightnesses: [0.97,0.93,0.88,0.82,0.78,0.72,0.65,0.55,0.45,0.35] },
  { group: "gold", hue: 85, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.06,0.1,0.13,0.15,0.16,0.15,0.13,0.1,0.07], lightnesses: [0.97,0.94,0.9,0.87,0.85,0.8,0.72,0.62,0.5,0.4] },
  { group: "lime", hue: 125, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.04,0.07,0.11,0.14,0.17,0.18,0.16,0.14,0.1,0.07], lightnesses: [0.97,0.94,0.9,0.85,0.8,0.74,0.65,0.55,0.45,0.35] },
  { group: "emerald", hue: 155, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.06,0.1,0.13,0.15,0.16,0.14,0.12,0.09,0.06], lightnesses: [0.96,0.92,0.86,0.8,0.73,0.65,0.55,0.47,0.38,0.3] },
  { group: "teal", hue: 180, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.05,0.09,0.12,0.14,0.15,0.13,0.11,0.08,0.06], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.65,0.55,0.47,0.38,0.3] },
  { group: "cyan", hue: 205, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.05,0.09,0.13,0.15,0.16,0.14,0.12,0.09,0.06], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "indigo", hue: 280, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.06,0.1,0.14,0.18,0.2,0.19,0.16,0.12,0.08], lightnesses: [0.96,0.92,0.84,0.75,0.65,0.55,0.47,0.39,0.32,0.25] },
  { group: "lavender", hue: 300, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.05,0.09,0.13,0.16,0.18,0.17,0.14,0.1,0.07], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "magenta", hue: 330, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.03,0.06,0.1,0.14,0.17,0.19,0.18,0.15,0.11,0.08], lightnesses: [0.96,0.92,0.85,0.78,0.7,0.63,0.55,0.47,0.38,0.3] },
  { group: "neutral", hue: 260, steps: [50,100,200,300,400,500,600,700,800,900], chromas: [0.003,0.005,0.008,0.01,0.015,0.02,0.02,0.02,0.02,0.02], lightnesses: [0.985,0.97,0.94,0.88,0.75,0.6,0.5,0.4,0.3,0.2] },
];

const typographyTokens = [
  { name: "display", size: "48px", weight: 700, lineHeight: "1.15", tracking: "-0.02em" },
  { name: "h1", size: "36px", weight: 700, lineHeight: "1.2", tracking: "-0.015em" },
  { name: "h2", size: "28px", weight: 600, lineHeight: "1.3", tracking: "-0.01em" },
  { name: "h3", size: "22px", weight: 600, lineHeight: "1.35", tracking: "-0.005em" },
  { name: "h4", size: "18px", weight: 600, lineHeight: "1.4", tracking: "0" },
  { name: "body-lg", size: "17px", weight: 400, lineHeight: "1.7", tracking: "0" },
  { name: "body", size: "15px", weight: 400, lineHeight: "1.65", tracking: "0" },
  { name: "body-sm", size: "13px", weight: 400, lineHeight: "1.55", tracking: "0.005em" },
  { name: "caption", size: "12px", weight: 500, lineHeight: "1.4", tracking: "0.01em" },
  { name: "overline", size: "11px", weight: 600, lineHeight: "1.3", tracking: "0.08em" },
];

const spacingTokens = [0,4,8,12,16,20,24,32,40,48,64,80,96];
const radiusTokens = [
  { name: "none", value: "0px" },{ name: "sm", value: "4px" },{ name: "md", value: "6px" },
  { name: "default", value: "8px" },{ name: "lg", value: "10px" },{ name: "xl", value: "12px" },
  { name: "2xl", value: "16px" },{ name: "3xl", value: "24px" },{ name: "full", value: "9999px" },
];
const shadowTokens = [
  { name: "sm", value: "0 1px 2px 0 oklch(0 0 0 / 0.04)" },
  { name: "default", value: "0 1px 3px 0 oklch(0 0 0 / 0.06), 0 1px 2px -1px oklch(0 0 0 / 0.06)" },
  { name: "md", value: "0 4px 6px -1px oklch(0 0 0 / 0.06), 0 2px 4px -2px oklch(0 0 0 / 0.06)" },
  { name: "lg", value: "0 10px 15px -3px oklch(0 0 0 / 0.06), 0 4px 6px -4px oklch(0 0 0 / 0.06)" },
  { name: "xl", value: "0 20px 25px -5px oklch(0 0 0 / 0.06), 0 8px 10px -6px oklch(0 0 0 / 0.04)" },
];

const semanticDefs: { name: string; L: number; C: number; H: number }[] = [
  { name: "background", L: 0.99, C: 0.002, H: 260 },
  { name: "surface", L: 1, C: 0, H: 0 },
  { name: "border", L: 0.92, C: 0.01, H: 260 },
  { name: "text-primary", L: 0.2, C: 0.02, H: 260 },
  { name: "text-secondary", L: 0.5, C: 0.02, H: 260 },
  { name: "text-muted", L: 0.65, C: 0.015, H: 260 },
  { name: "primary", L: 0.7, C: 0.18, H: 25 },
  { name: "success", L: 0.65, C: 0.15, H: 180 },
  { name: "warning", L: 0.85, C: 0.15, H: 85 },
  { name: "error", L: 0.6, C: 0.22, H: 25 },
  { name: "info", L: 0.63, C: 0.16, H: 205 },
];

/* ── Helpers ──────────────────────────────────────────────── */

function oklchStr(l: number, c: number, h: number) {
  return `oklch(${l} ${c} ${h})`;
}

/* ── OKLCH → Hex conversion ───────────────────────────────── */

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

  const toGamma = (v: number) =>
    v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;

  r = Math.round(Math.min(255, Math.max(0, toGamma(r) * 255)));
  g = Math.round(Math.min(255, Math.max(0, toGamma(g) * 255)));
  bl = Math.round(Math.min(255, Math.max(0, toGamma(bl) * 255)));

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

/* ── Generate export strings ──────────────────────────────── */

function generateCSS(): string {
  let css = `/* Canto Design Tokens — CSS Custom Properties */\n/* Generated from Canto Brand Guide */\n\n:root {\n  /* ─── Font ─── */\n  --font-sans: 'Albert Sans', sans-serif;\n\n`;

  css += `  /* ─── Colors ─── */\n`;
  for (const ct of colorTokens) {
    for (let i = 0; i < ct.steps.length; i++) {
      css += `  --color-${ct.group}-${ct.steps[i]}: ${oklchStr(ct.lightnesses[i], ct.chromas[i], ct.hue)};\n`;
    }
    css += `\n`;
  }

  css += `  /* ─── Semantic ─── */\n`;
  for (const s of semanticDefs) {
    css += `  --color-${s.name}: ${oklchStr(s.L, s.C, s.H)};\n`;
  }
  css += `\n`;

  css += `  /* ─── Typography ─── */\n`;
  for (const t of typographyTokens) {
    css += `  --text-${t.name}-size: ${t.size};\n`;
    css += `  --text-${t.name}-weight: ${t.weight};\n`;
    css += `  --text-${t.name}-line-height: ${t.lineHeight};\n`;
    css += `  --text-${t.name}-tracking: ${t.tracking};\n`;
  }
  css += `\n`;

  css += `  /* ─── Spacing (4px grid) ─── */\n`;
  for (const s of spacingTokens) {
    css += `  --space-${s}: ${s}px;\n`;
  }
  css += `\n`;

  css += `  /* ─── Radius ─── */\n`;
  for (const r of radiusTokens) {
    css += `  --radius-${r.name}: ${r.value};\n`;
  }
  css += `\n`;

  css += `  /* ─── Shadows ─── */\n`;
  for (const s of shadowTokens) {
    css += `  --shadow-${s.name}: ${s.value};\n`;
  }

  css += `}\n`;
  return css;
}

function generateJSON(): string {
  const obj: Record<string, unknown> = {
    $schema: "https://flowos.design/tokens/v1",
    name: "Canto Design Tokens",
    version: "1.0.0",
    font: { sans: "'Albert Sans', sans-serif" },
    colors: {} as Record<string, Record<string, string>>,
    semantic: {} as Record<string, string>,
    typography: {} as Record<string, unknown>,
    spacing: {} as Record<string, string>,
    radius: {} as Record<string, string>,
    shadows: {} as Record<string, string>,
  };

  for (const ct of colorTokens) {
    const g: Record<string, string> = {};
    for (let i = 0; i < ct.steps.length; i++) {
      g[String(ct.steps[i])] = oklchStr(ct.lightnesses[i], ct.chromas[i], ct.hue);
    }
    (obj.colors as Record<string, Record<string, string>>)[ct.group] = g;
  }
  for (const s of semanticDefs) {
    (obj.semantic as Record<string, string>)[s.name] = oklchStr(s.L, s.C, s.H);
  }
  for (const t of typographyTokens) {
    (obj.typography as Record<string, unknown>)[t.name] = {
      fontSize: t.size, fontWeight: t.weight, lineHeight: t.lineHeight, letterSpacing: t.tracking,
    };
  }
  for (const s of spacingTokens) {
    (obj.spacing as Record<string, string>)[String(s)] = `${s}px`;
  }
  for (const r of radiusTokens) {
    (obj.radius as Record<string, string>)[r.name] = r.value;
  }
  for (const s of shadowTokens) {
    (obj.shadows as Record<string, string>)[s.name] = s.value;
  }

  return JSON.stringify(obj, null, 2);
}

function generateTailwind(): string {
  let tw = `/* Canto — Tailwind v4 theme extension */\n/* Paste into your main CSS file alongside @import "tailwindcss" */\n\n@theme {\n`;

  tw += `  /* ─── Font ─── */\n  --font-sans: 'Albert Sans', sans-serif;\n\n`;

  tw += `  /* ─── Colors ─── */\n`;
  for (const ct of colorTokens) {
    for (let i = 0; i < ct.steps.length; i++) {
      tw += `  --color-${ct.group}-${ct.steps[i]}: ${oklchStr(ct.lightnesses[i], ct.chromas[i], ct.hue)};\n`;
    }
  }
  tw += `\n`;

  tw += `  /* ─── Spacing ─── */\n`;
  for (const s of spacingTokens) {
    tw += `  --spacing-${s}: ${s}px;\n`;
  }
  tw += `\n`;

  tw += `  /* ─── Radius ─── */\n`;
  for (const r of radiusTokens) {
    tw += `  --radius-${r.name}: ${r.value};\n`;
  }
  tw += `\n`;

  tw += `  /* ─── Shadows ─── */\n`;
  for (const s of shadowTokens) {
    tw += `  --shadow-${s.name}: ${s.value};\n`;
  }

  tw += `}\n`;
  return tw;
}

function generateTokensStudio(): string {
  const tokens: Record<string, unknown> = {
    "flowos-colors": { $type: "color" } as Record<string, unknown>,
    "flowos-typography": {} as Record<string, unknown>,
    "flowos-spacing": {} as Record<string, unknown>,
    "flowos-borderRadius": {} as Record<string, unknown>,
    "flowos-boxShadow": {} as Record<string, unknown>,
    "flowos-fontFamilies": { sans: { $value: "Albert Sans", $type: "fontFamilies" } },
  };

  for (const ct of colorTokens) {
    for (let i = 0; i < ct.steps.length; i++) {
      (tokens["flowos-colors"] as Record<string, unknown>)[`${ct.group}-${ct.steps[i]}`] = {
        $value: oklchToHex(ct.lightnesses[i], ct.chromas[i], ct.hue),
        $type: "color",
        $description: `${ct.group} ${ct.steps[i]} — ${oklchStr(ct.lightnesses[i], ct.chromas[i], ct.hue)}`,
      };
    }
  }
  for (const s of semanticDefs) {
    (tokens["flowos-colors"] as Record<string, unknown>)[`semantic-${s.name}`] = {
      $value: oklchToHex(s.L, s.C, s.H), $type: "color", $description: `Semantic: ${s.name}`,
    };
  }
  for (const t of typographyTokens) {
    (tokens["flowos-typography"] as Record<string, unknown>)[t.name] = {
      $value: { fontFamily: "Albert Sans", fontWeight: String(t.weight), fontSize: t.size, lineHeight: t.lineHeight, letterSpacing: t.tracking },
      $type: "typography",
    };
  }
  for (const s of spacingTokens) {
    (tokens["flowos-spacing"] as Record<string, unknown>)[String(s)] = { $value: `${s}`, $type: "spacing" };
  }
  for (const r of radiusTokens) {
    (tokens["flowos-borderRadius"] as Record<string, unknown>)[r.name] = { $value: r.value, $type: "borderRadius" };
  }
  for (const s of shadowTokens) {
    (tokens["flowos-boxShadow"] as Record<string, unknown>)[s.name] = { $value: s.value, $type: "boxShadow" };
  }

  return JSON.stringify(tokens, null, 2);
}

/* ── Figma Variables JSON (DTCG format with hex, ready for Figma REST API / plugins) ── */

function generateFigmaVariables(): string {
  // Pure W3C DTCG format — no wrapper, no metadata keys.
  // Top-level groups map to Figma Variable Collections / groups.
  const root: Record<string, unknown> = {};

  // ─── Color primitives (grouped by scale) ───
  for (const ct of colorTokens) {
    const group: Record<string, unknown> = {};
    for (let i = 0; i < ct.steps.length; i++) {
      const hex = oklchToHex(ct.lightnesses[i], ct.chromas[i], ct.hue);
      group[String(ct.steps[i])] = {
        $type: "color",
        $value: hex,
        $description: oklchStr(ct.lightnesses[i], ct.chromas[i], ct.hue),
      };
    }
    root[ct.group] = group;
  }

  // ─── Semantic color aliases ───
  const semantic: Record<string, unknown> = {};
  for (const s of semanticDefs) {
    semantic[s.name] = {
      $type: "color",
      $value: oklchToHex(s.L, s.C, s.H),
      $description: oklchStr(s.L, s.C, s.H),
    };
  }
  root["semantic"] = semantic;

  // ─── Spacing ───
  const spacing: Record<string, unknown> = {};
  for (const s of spacingTokens) {
    spacing[`space-${s}`] = {
      $type: "number",
      $value: s,
      $description: `${s}px`,
    };
  }
  root["spacing"] = spacing;

  // ─── Radius ───
  const radius: Record<string, unknown> = {};
  for (const r of radiusTokens) {
    radius[r.name] = {
      $type: "number",
      $value: parseFloat(r.value),
      $description: r.value,
    };
  }
  root["radius"] = radius;

  // ─── Typography (individual number variables per property) ───
  const typography: Record<string, unknown> = {};
  for (const t of typographyTokens) {
    typography[t.name] = {
      "font-size": { $type: "number", $value: parseFloat(t.size), $description: t.size },
      "font-weight": { $type: "number", $value: t.weight },
      "line-height": { $type: "number", $value: parseFloat(t.lineHeight) },
      "letter-spacing": { $type: "number", $value: parseFloat(t.tracking) || 0, $description: t.tracking },
    };
  }
  root["typography"] = typography;

  return JSON.stringify(root, null, 2);
}

/* ── Tab config ───────────────────────────────────────────── */

const tabs = [
  { id: "figma", label: "Figma Variables", icon: FigmaLogo, generate: generateFigmaVariables, filename: "flowos-figma-variables.json" },
  { id: "css", label: "CSS Variables", icon: FileCode, generate: generateCSS, filename: "flowos-tokens.css" },
  { id: "json", label: "JSON Tokens", icon: FileJs, generate: generateJSON, filename: "flowos-tokens.json" },
  { id: "tailwind", label: "Tailwind v4", icon: PaintBrush, generate: generateTailwind, filename: "flowos-tailwind.css" },
  { id: "tokens-studio", label: "Tokens Studio", icon: Stack, generate: generateTokensStudio, filename: "flowos-tokens-studio.json" },
];

const tabDescriptions: Record<string, string> = {
  figma: "Figma Variables JSON — import via plugin or REST API. Hex colors converted from OKLCH for full compatibility.",
  css: "CSS custom properties — paste into your :root block or import as a stylesheet.",
  json: "Structured JSON — use with any token pipeline, Style Dictionary, or build tooling.",
  tailwind: "Tailwind CSS v4 @theme block — paste alongside your @import \"tailwindcss\" directive.",
  "tokens-studio": "Tokens Studio for Figma format — import directly via the plugin to auto-generate variables & styles.",
};

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
  teal: "oklch(0.65 0.15 180)",
  tealLight: "oklch(0.65 0.15 180 / 0.1)",
  tealMid: "oklch(0.45 0.12 180)",
};

/* ── Component ────────────────────────────────────────────── */

export function DownloadAssets() {
  const [activeTab, setActiveTab] = useState("figma");
  const [copied, setCopied] = useState(false);

  const currentTab = tabs.find((t) => t.id === activeTab)!;
  const code = currentTab.generate();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentTab.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.teal }} />
          <p style={{ color: c.tealMid, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>EXPORT</p>
        </div>
        <h1 style={{ color: c.text1, fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>Download Assets</h1>
        <p className="mt-2 max-w-2xl" style={{ color: c.text3, fontSize: "14px", lineHeight: 1.6 }}>
          Export the complete Canto design token system in multiple formats. The <strong>Figma Variables</strong> tab outputs hex-converted JSON ready for direct import into Figma.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Color Scales", count: "12", sub: "120 swatches" },
          { label: "Type Styles", count: "10", sub: "Display → Overline" },
          { label: "Spacing", count: "13", sub: "0–96 px" },
          { label: "Extras", count: "14+", sub: "Radius, shadow" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg p-3.5 border" style={{ borderColor: c.border, background: "white" }}>
            <p style={{ color: c.coral, fontSize: "22px", fontWeight: 700 }}>{card.count}</p>
            <p style={{ color: c.text2, fontSize: "12px", fontWeight: 500 }}>{card.label}</p>
            <p style={{ color: c.text4, fontSize: "10px" }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Figma import instructions callout (visible only on figma tab) */}
      {activeTab === "figma" && (
        <div className="rounded-xl border p-4" style={{ borderColor: "oklch(0.55 0.2 280 / 0.25)", background: "oklch(0.55 0.2 280 / 0.06)" }}>
          <p style={{ color: "oklch(0.35 0.15 280)", fontSize: "13px", fontWeight: 600 }}>How to import into Figma</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: "1", title: "Install a plugin", desc: "Search for \"Import Variables\" or \"Variables Manager\" in the Figma Community and install it." },
              { step: "2", title: "Download or copy", desc: "Click \"Copy All\" or download the JSON file using the button below." },
              { step: "3", title: "Import in Figma", desc: "Open the plugin → Import → paste or select the JSON file. All collections are created automatically." },
            ].map((s) => (
              <div key={s.step} className="flex gap-2.5">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.55 0.2 280 / 0.15)", color: "oklch(0.4 0.17 280)", fontSize: "11px", fontWeight: 700 }}
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
      )}

      {/* Tab bar */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: c.border, background: "white" }}>
        <div className="flex border-b overflow-x-auto" style={{ borderColor: c.border }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 transition-colors shrink-0 border-b-2"
                style={{
                  borderBottomColor: isActive ? c.coral : "transparent",
                  color: isActive ? c.coralMid : c.text3,
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? c.coralLight : "transparent",
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <div className="px-5 py-3 border-b flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: c.border, background: c.bg2 }}>
          <div>
            <p style={{ color: c.text2, fontSize: "13px", fontWeight: 500 }}>
              {tabDescriptions[activeTab]}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/[0.03]"
              style={{ borderColor: c.border, color: copied ? c.tealMid : c.text3, fontSize: "12px", fontWeight: 500 }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy All"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: c.coral, color: "white", fontSize: "12px", fontWeight: 500 }}
            >
              <Download className="w-3.5 h-3.5" />
              {currentTab.filename}
            </button>
          </div>
        </div>

        {/* Code block */}
        <div className="overflow-auto max-h-[520px]" style={{ background: "oklch(0.18 0.02 260)" }}>
          <pre className="p-5" style={{ color: "oklch(0.85 0.01 260)", fontSize: "12px", lineHeight: 1.65, fontFamily: "monospace", whiteSpace: "pre" }}>
            {code}
          </pre>
        </div>
      </div>

      {/* Color swatch preview (Figma tab) */}
      {activeTab === "figma" && (
        <section className="rounded-xl border p-5" style={{ borderColor: c.border, background: "white" }}>
          <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Hex Preview</h2>
          <p className="mt-0.5 mb-4" style={{ color: c.text4, fontSize: "12px" }}>Verify OKLCH → hex conversion accuracy. Each swatch shows the computed hex value.</p>
          <div className="space-y-3">
            {colorTokens.slice(0, 5).map((ct) => (
              <div key={ct.group}>
                <p className="mb-1.5" style={{ color: c.text3, fontSize: "11px", fontWeight: 600, textTransform: "capitalize" }}>{ct.group}</p>
                <div className="flex gap-1 flex-wrap">
                  {ct.steps.map((step, i) => {
                    const hex = oklchToHex(ct.lightnesses[i], ct.chromas[i], ct.hue);
                    return (
                      <div key={step} className="text-center">
                        <div
                          className="w-10 h-8 rounded-md border"
                          style={{ background: hex, borderColor: ct.lightnesses[i] > 0.9 ? c.border : "transparent" }}
                        />
                        <p style={{ color: c.text4, fontSize: "8px", fontFamily: "monospace", marginTop: "2px" }}>{hex}</p>
                        <p style={{ color: c.text4, fontSize: "7px", opacity: 0.6 }}>{step}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Format notes */}
      <section className="rounded-xl border p-5" style={{ borderColor: c.border, background: "white" }}>
        <h2 style={{ color: c.text1, fontSize: "16px", fontWeight: 600 }}>Format Details</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: "Figma Variables", desc: "DTCG-structured JSON with OKLCH→hex conversion. Import via plugin (Import Variables, Variables Manager) or the Figma REST API. Creates collections for Color Primitives, Semantic Colors, Spacing, Radius, and Typography." },
            { title: "CSS Custom Properties", desc: "Drop-in for any web project. Reference tokens with var(--color-coral-500) syntax. Keeps native OKLCH values for maximum color gamut." },
            { title: "JSON Tokens", desc: "Feed into Style Dictionary, Theo, or your custom build pipeline. Schema follows the W3C Community Group draft spec with OKLCH values." },
            { title: "Tailwind v4 Theme", desc: "Native @theme block for Tailwind CSS v4. Generates utility classes like bg-coral-500, text-indigo-300, etc." },
            { title: "Tokens Studio", desc: "Import via Tokens Studio for Figma (formerly Figma Tokens). Uses hex values for compatibility. Auto-creates color variables, text styles, and spacing." },
          ].map((note) => (
            <div key={note.title} className="p-3 rounded-lg" style={{ background: c.bg2 }}>
              <p style={{ color: c.text2, fontSize: "12px", fontWeight: 600 }}>{note.title}</p>
              <p className="mt-1" style={{ color: c.text4, fontSize: "11px", lineHeight: 1.5 }}>{note.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}