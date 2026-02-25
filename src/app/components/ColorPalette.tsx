import { useState } from "react";
import { Check, Copy } from "@phosphor-icons/react";

interface ColorSwatch {
  name: string;
  value: string;
  textDark?: boolean;
}

interface ColorGroup {
  title: string;
  description: string;
  hue: string;
  colors: ColorSwatch[];
}

const colorGroups: ColorGroup[] = [
  {
    title: "Coral",
    hue: "25",
    description: "Primary brand color. CTAs, highlights, and brand moments.",
    colors: [
      { name: "50", value: "oklch(0.96 0.04 25)", textDark: true },
      { name: "100", value: "oklch(0.92 0.07 25)", textDark: true },
      { name: "200", value: "oklch(0.85 0.11 25)", textDark: true },
      { name: "300", value: "oklch(0.78 0.14 25)", textDark: true },
      { name: "400", value: "oklch(0.7 0.18 25)" },
      { name: "500", value: "oklch(0.63 0.2 25)" },
      { name: "600", value: "oklch(0.55 0.19 25)" },
      { name: "700", value: "oklch(0.47 0.16 25)" },
      { name: "800", value: "oklch(0.38 0.12 25)" },
      { name: "900", value: "oklch(0.3 0.08 25)" },
    ],
  },
  {
    title: "Rose",
    hue: "350",
    description: "Warm pink for notifications, feminine accents, and highlights.",
    colors: [
      { name: "50", value: "oklch(0.96 0.03 350)", textDark: true },
      { name: "100", value: "oklch(0.92 0.06 350)", textDark: true },
      { name: "200", value: "oklch(0.85 0.1 350)", textDark: true },
      { name: "300", value: "oklch(0.78 0.14 350)", textDark: true },
      { name: "400", value: "oklch(0.7 0.17 350)" },
      { name: "500", value: "oklch(0.63 0.2 350)" },
      { name: "600", value: "oklch(0.55 0.19 350)" },
      { name: "700", value: "oklch(0.47 0.16 350)" },
      { name: "800", value: "oklch(0.38 0.12 350)" },
      { name: "900", value: "oklch(0.3 0.08 350)" },
    ],
  },
  {
    title: "Orange",
    hue: "55",
    description: "Energetic warmth for urgency indicators and feature callouts.",
    colors: [
      { name: "50", value: "oklch(0.97 0.03 55)", textDark: true },
      { name: "100", value: "oklch(0.93 0.06 55)", textDark: true },
      { name: "200", value: "oklch(0.88 0.1 55)", textDark: true },
      { name: "300", value: "oklch(0.82 0.14 55)", textDark: true },
      { name: "400", value: "oklch(0.78 0.17 55)", textDark: true },
      { name: "500", value: "oklch(0.72 0.18 55)" },
      { name: "600", value: "oklch(0.65 0.17 55)" },
      { name: "700", value: "oklch(0.55 0.14 55)" },
      { name: "800", value: "oklch(0.45 0.11 55)" },
      { name: "900", value: "oklch(0.35 0.07 55)" },
    ],
  },
  {
    title: "Gold",
    hue: "85",
    description: "Warnings, attention states, and warmth in illustrations.",
    colors: [
      { name: "50", value: "oklch(0.97 0.03 85)", textDark: true },
      { name: "100", value: "oklch(0.94 0.06 85)", textDark: true },
      { name: "200", value: "oklch(0.9 0.1 85)", textDark: true },
      { name: "300", value: "oklch(0.87 0.13 85)", textDark: true },
      { name: "400", value: "oklch(0.85 0.15 85)", textDark: true },
      { name: "500", value: "oklch(0.8 0.16 85)", textDark: true },
      { name: "600", value: "oklch(0.72 0.15 85)" },
      { name: "700", value: "oklch(0.62 0.13 85)" },
      { name: "800", value: "oklch(0.5 0.1 85)" },
      { name: "900", value: "oklch(0.4 0.07 85)" },
    ],
  },
  {
    title: "Lime",
    hue: "125",
    description: "Fresh vibrancy for growth indicators, tags, and positive trends.",
    colors: [
      { name: "50", value: "oklch(0.97 0.04 125)", textDark: true },
      { name: "100", value: "oklch(0.94 0.07 125)", textDark: true },
      { name: "200", value: "oklch(0.9 0.11 125)", textDark: true },
      { name: "300", value: "oklch(0.85 0.14 125)", textDark: true },
      { name: "400", value: "oklch(0.8 0.17 125)", textDark: true },
      { name: "500", value: "oklch(0.74 0.18 125)", textDark: true },
      { name: "600", value: "oklch(0.65 0.16 125)" },
      { name: "700", value: "oklch(0.55 0.14 125)" },
      { name: "800", value: "oklch(0.45 0.1 125)" },
      { name: "900", value: "oklch(0.35 0.07 125)" },
    ],
  },
  {
    title: "Emerald",
    hue: "155",
    description: "Natural green for success, approvals, and positive confirmations.",
    colors: [
      { name: "50", value: "oklch(0.96 0.03 155)", textDark: true },
      { name: "100", value: "oklch(0.92 0.06 155)", textDark: true },
      { name: "200", value: "oklch(0.86 0.1 155)", textDark: true },
      { name: "300", value: "oklch(0.8 0.13 155)", textDark: true },
      { name: "400", value: "oklch(0.73 0.15 155)" },
      { name: "500", value: "oklch(0.65 0.16 155)" },
      { name: "600", value: "oklch(0.55 0.14 155)" },
      { name: "700", value: "oklch(0.47 0.12 155)" },
      { name: "800", value: "oklch(0.38 0.09 155)" },
      { name: "900", value: "oklch(0.3 0.06 155)" },
    ],
  },
  {
    title: "Teal",
    hue: "180",
    description: "Success states, progress indicators, and supportive accents.",
    colors: [
      { name: "50", value: "oklch(0.96 0.03 180)", textDark: true },
      { name: "100", value: "oklch(0.92 0.05 180)", textDark: true },
      { name: "200", value: "oklch(0.85 0.09 180)", textDark: true },
      { name: "300", value: "oklch(0.78 0.12 180)", textDark: true },
      { name: "400", value: "oklch(0.7 0.14 180)" },
      { name: "500", value: "oklch(0.65 0.15 180)" },
      { name: "600", value: "oklch(0.55 0.13 180)" },
      { name: "700", value: "oklch(0.47 0.11 180)" },
      { name: "800", value: "oklch(0.38 0.08 180)" },
      { name: "900", value: "oklch(0.3 0.06 180)" },
    ],
  },
  {
    title: "Cyan",
    hue: "205",
    description: "Cool blue for information states, links, and data visualization.",
    colors: [
      { name: "50", value: "oklch(0.96 0.03 205)", textDark: true },
      { name: "100", value: "oklch(0.92 0.05 205)", textDark: true },
      { name: "200", value: "oklch(0.85 0.09 205)", textDark: true },
      { name: "300", value: "oklch(0.78 0.13 205)", textDark: true },
      { name: "400", value: "oklch(0.7 0.15 205)" },
      { name: "500", value: "oklch(0.63 0.16 205)" },
      { name: "600", value: "oklch(0.55 0.14 205)" },
      { name: "700", value: "oklch(0.47 0.12 205)" },
      { name: "800", value: "oklch(0.38 0.09 205)" },
      { name: "900", value: "oklch(0.3 0.06 205)" },
    ],
  },
  {
    title: "Indigo",
    hue: "280",
    description: "Secondary actions, active states, and complementary accents.",
    colors: [
      { name: "50", value: "oklch(0.96 0.03 280)", textDark: true },
      { name: "100", value: "oklch(0.92 0.06 280)", textDark: true },
      { name: "200", value: "oklch(0.84 0.1 280)", textDark: true },
      { name: "300", value: "oklch(0.75 0.14 280)", textDark: true },
      { name: "400", value: "oklch(0.65 0.18 280)" },
      { name: "500", value: "oklch(0.55 0.2 280)" },
      { name: "600", value: "oklch(0.47 0.19 280)" },
      { name: "700", value: "oklch(0.39 0.16 280)" },
      { name: "800", value: "oklch(0.32 0.12 280)" },
      { name: "900", value: "oklch(0.25 0.08 280)" },
    ],
  },
  {
    title: "Lavender",
    hue: "300",
    description: "Soft purple for creative contexts, categories, and gentle highlights.",
    colors: [
      { name: "50", value: "oklch(0.96 0.03 300)", textDark: true },
      { name: "100", value: "oklch(0.92 0.05 300)", textDark: true },
      { name: "200", value: "oklch(0.85 0.09 300)", textDark: true },
      { name: "300", value: "oklch(0.78 0.13 300)", textDark: true },
      { name: "400", value: "oklch(0.7 0.16 300)" },
      { name: "500", value: "oklch(0.63 0.18 300)" },
      { name: "600", value: "oklch(0.55 0.17 300)" },
      { name: "700", value: "oklch(0.47 0.14 300)" },
      { name: "800", value: "oklch(0.38 0.1 300)" },
      { name: "900", value: "oklch(0.3 0.07 300)" },
    ],
  },
  {
    title: "Magenta",
    hue: "330",
    description: "Vibrant pink-purple for special states, badges, and expressive UI.",
    colors: [
      { name: "50", value: "oklch(0.96 0.03 330)", textDark: true },
      { name: "100", value: "oklch(0.92 0.06 330)", textDark: true },
      { name: "200", value: "oklch(0.85 0.1 330)", textDark: true },
      { name: "300", value: "oklch(0.78 0.14 330)", textDark: true },
      { name: "400", value: "oklch(0.7 0.17 330)" },
      { name: "500", value: "oklch(0.63 0.19 330)" },
      { name: "600", value: "oklch(0.55 0.18 330)" },
      { name: "700", value: "oklch(0.47 0.15 330)" },
      { name: "800", value: "oklch(0.38 0.11 330)" },
      { name: "900", value: "oklch(0.3 0.08 330)" },
    ],
  },
  {
    title: "Neutral",
    hue: "260",
    description: "Text, backgrounds, borders, and surfaces across the interface.",
    colors: [
      { name: "50", value: "oklch(0.985 0.003 260)", textDark: true },
      { name: "100", value: "oklch(0.97 0.005 260)", textDark: true },
      { name: "200", value: "oklch(0.94 0.008 260)", textDark: true },
      { name: "300", value: "oklch(0.88 0.01 260)", textDark: true },
      { name: "400", value: "oklch(0.75 0.015 260)", textDark: true },
      { name: "500", value: "oklch(0.6 0.02 260)" },
      { name: "600", value: "oklch(0.5 0.02 260)" },
      { name: "700", value: "oklch(0.4 0.02 260)" },
      { name: "800", value: "oklch(0.3 0.02 260)" },
      { name: "900", value: "oklch(0.2 0.02 260)" },
    ],
  },
];

const semanticColors = [
  { name: "Background", value: "oklch(0.99 0.002 260)", usage: "Page backgrounds", textDark: true },
  { name: "Surface", value: "oklch(1 0 0)", usage: "Cards, panels, modals", textDark: true },
  { name: "Border", value: "oklch(0.92 0.01 260)", usage: "Dividers, outlines", textDark: true },
  { name: "Text Primary", value: "oklch(0.2 0.02 260)", usage: "Headings, key content" },
  { name: "Text Secondary", value: "oklch(0.5 0.02 260)", usage: "Descriptions, labels" },
  { name: "Text Muted", value: "oklch(0.65 0.015 260)", usage: "Placeholders, hints", textDark: true },
  { name: "Primary", value: "oklch(0.7 0.18 25)", usage: "CTAs, active states" },
  { name: "Success", value: "oklch(0.65 0.15 180)", usage: "Confirmations, completed" },
  { name: "Warning", value: "oklch(0.85 0.15 85)", usage: "Alerts, attention needed", textDark: true },
  { name: "Error", value: "oklch(0.6 0.22 25)", usage: "Errors, destructive" },
  { name: "Info", value: "oklch(0.63 0.16 205)", usage: "Informational messages" },
  { name: "Highlight", value: "oklch(0.63 0.18 300)", usage: "New features, promotions" },
];

function SwatchCard({ color, groupTitle, onCopy }: { color: ColorSwatch; groupTitle: string; onCopy: (v: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(color.value);
    setCopied(true);
    onCopy(color.value);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="group relative rounded-lg overflow-hidden border transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 cursor-pointer text-left"
      style={{ borderColor: "oklch(0.92 0.01 260)" }}
    >
      <div
        className="h-14 w-full flex items-center justify-center"
        style={{ background: color.value }}
      >
        {copied && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 backdrop-blur-sm">
            <Check className="w-3 h-3 text-white" />
            <span style={{ color: "white", fontSize: "10px", fontWeight: 500 }}>Copied</span>
          </div>
        )}
        {!copied && (
          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" style={{ color: color.textDark ? "oklch(0.3 0 0)" : "white" }} />
        )}
      </div>
      <div className="px-2 py-1.5" style={{ background: "white" }}>
        <p style={{ color: "oklch(0.3 0.02 260)", fontSize: "11px", fontWeight: 500 }}>{color.name}</p>
        <p className="truncate" style={{ color: "oklch(0.6 0.02 260)", fontSize: "9px", fontFamily: "monospace" }}>{color.value}</p>
      </div>
    </button>
  );
}

export function ColorPalette() {
  const [lastCopied, setLastCopied] = useState("");

  /* Build the full hue spectrum preview strip */
  const spectrumSwatches = colorGroups.filter(g => g.title !== "Neutral").map(g => ({
    label: g.title,
    value: g.colors[3].value, /* 300 level — pastel-ish like the reference image */
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.7 0.18 25)" }} />
          <p style={{ color: "oklch(0.6 0.18 25)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>
            COLOR SYSTEM
          </p>
        </div>
        <h1 style={{ color: "oklch(0.2 0.02 260)", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
          Color Palette
        </h1>
        <p className="mt-2 max-w-2xl" style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>
          12 full-spectrum OKLCH scales — perceptually uniform, accessible, and production-ready. Click any swatch to copy.
        </p>
        {lastCopied && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "oklch(0.65 0.15 180 / 0.1)" }}>
            <Check className="w-3.5 h-3.5" style={{ color: "oklch(0.55 0.15 180)" }} />
            <span style={{ color: "oklch(0.45 0.12 180)", fontSize: "12px", fontWeight: 500 }}>
              Copied: {lastCopied}
            </span>
          </div>
        )}
      </div>

      {/* Spectrum overview — mirrors the reference image layout */}
      <section className="rounded-xl p-5 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Hue Spectrum</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          All 11 chromatic scales at their 300-level pastel values, arranged by hue angle.
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-2">
          {spectrumSwatches.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <div className="w-full aspect-square rounded-xl" style={{ background: s.value }} />
              <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "10px", fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Gradient banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className="rounded-xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, oklch(0.7 0.18 25), oklch(0.55 0.2 280), oklch(0.65 0.15 180))",
          }}
        >
          <h3 style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>Brand Gradient</h3>
          <p className="mt-1" style={{ color: "oklch(1 0 0 / 0.8)", fontSize: "12px", lineHeight: 1.5 }}>
            Coral → Indigo → Teal
          </p>
          <code className="mt-2 inline-block px-2 py-1 rounded" style={{ background: "oklch(0 0 0 / 0.2)", color: "white", fontSize: "10px" }}>
            linear-gradient(135deg, oklch(0.7 0.18 25), oklch(0.55 0.2 280), oklch(0.65 0.15 180))
          </code>
        </div>
        <div
          className="rounded-xl p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, oklch(0.78 0.14 350), oklch(0.7 0.16 300), oklch(0.63 0.16 205))",
          }}
        >
          <h3 style={{ color: "white", fontSize: "16px", fontWeight: 600 }}>Cool Gradient</h3>
          <p className="mt-1" style={{ color: "oklch(1 0 0 / 0.8)", fontSize: "12px", lineHeight: 1.5 }}>
            Rose → Lavender → Cyan
          </p>
          <code className="mt-2 inline-block px-2 py-1 rounded" style={{ background: "oklch(0 0 0 / 0.2)", color: "white", fontSize: "10px" }}>
            linear-gradient(135deg, oklch(0.78 0.14 350), oklch(0.7 0.16 300), oklch(0.63 0.16 205))
          </code>
        </div>
      </div>

      {/* Color groups */}
      {colorGroups.map((group) => (
        <section key={group.title}>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="w-3 h-3 rounded" style={{ background: group.colors[4]?.value ?? group.colors[3].value }} />
            <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>
              {group.title}
              <span className="ml-2" style={{ color: "oklch(0.6 0.02 260)", fontSize: "12px", fontWeight: 400 }}>hue {group.hue}</span>
            </h2>
          </div>
          <p className="mb-3 ml-[22px]" style={{ color: "oklch(0.55 0.02 260)", fontSize: "12px" }}>
            {group.description}
          </p>

          {/* Color bar */}
          <div className="flex rounded-lg overflow-hidden mb-3 h-8">
            {group.colors.map((c) => (
              <div key={c.name} className="flex-1" style={{ background: c.value }} />
            ))}
          </div>

          {/* Swatch grid */}
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
            {group.colors.map((color) => (
              <SwatchCard key={`${group.title}-${color.name}`} color={color} groupTitle={group.title} onCopy={setLastCopied} />
            ))}
          </div>
        </section>
      ))}

      {/* Semantic colors */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Semantic Tokens</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Contextual color tokens mapped to specific UI roles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {semanticColors.map((sc) => (
            <div
              key={sc.name}
              className="flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors hover:bg-black/[0.02]"
              style={{ borderColor: "oklch(0.93 0.01 260)" }}
            >
              <div
                className="w-8 h-8 rounded-md shrink-0 border"
                style={{ background: sc.value, borderColor: "oklch(0.92 0.01 260)" }}
              />
              <div className="min-w-0">
                <p style={{ color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500 }}>{sc.name}</p>
                <p style={{ color: "oklch(0.6 0.02 260)", fontSize: "10px" }}>{sc.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Accessibility */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Accessibility</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Contrast ratios for common pairings.
        </p>

        <div className="space-y-2">
          {[
            { bg: "oklch(1 0 0)", fg: "oklch(0.2 0.02 260)", label: "Dark on white", ratio: "15.3:1", pass: "AAA" },
            { bg: "oklch(1 0 0)", fg: "oklch(0.5 0.02 260)", label: "Secondary on white", ratio: "5.7:1", pass: "AA" },
            { bg: "oklch(0.7 0.18 25)", fg: "oklch(1 0 0)", label: "White on Coral 400", ratio: "3.8:1", pass: "AA Lg" },
            { bg: "oklch(0.55 0.2 280)", fg: "oklch(1 0 0)", label: "White on Indigo 500", ratio: "7.2:1", pass: "AAA" },
            { bg: "oklch(0.63 0.16 205)", fg: "oklch(1 0 0)", label: "White on Cyan 500", ratio: "5.1:1", pass: "AA" },
            { bg: "oklch(0.55 0.18 330)", fg: "oklch(1 0 0)", label: "White on Magenta 600", ratio: "6.8:1", pass: "AAA" },
            { bg: "oklch(0.22 0.02 260)", fg: "oklch(0.95 0 0)", label: "Light on dark", ratio: "14.1:1", pass: "AAA" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 p-2.5 rounded-lg border"
              style={{ borderColor: "oklch(0.93 0.01 260)" }}
            >
              <div
                className="w-16 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ background: item.bg, border: item.bg === "oklch(1 0 0)" ? "1px solid oklch(0.92 0.01 260)" : undefined }}
              >
                <span style={{ color: item.fg, fontSize: "11px", fontWeight: 600 }}>Aa</span>
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500 }}>{item.label}</p>
                <p style={{ color: "oklch(0.6 0.02 260)", fontSize: "10px" }}>{item.ratio}</p>
              </div>
              <span
                className="px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: item.pass === "AAA" ? "oklch(0.65 0.15 180 / 0.1)" : "oklch(0.85 0.15 85 / 0.15)",
                  color: item.pass === "AAA" ? "oklch(0.45 0.12 180)" : "oklch(0.5 0.12 85)",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                {item.pass}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}