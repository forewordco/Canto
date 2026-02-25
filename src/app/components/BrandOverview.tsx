import { Sparkle, Crosshair, Heart, Lightning, ArrowRight } from "@phosphor-icons/react";

export function BrandOverview() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "oklch(0.7 0.18 25)" }}
          />
          <p style={{ color: "oklch(0.6 0.18 25)", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em" }}>
            BRAND IDENTITY
          </p>
        </div>
        <h1 style={{ color: "oklch(0.2 0.02 260)", fontSize: "36px", fontWeight: 700, lineHeight: 1.2 }}>
          FlowOS Brand Guide
        </h1>
        <p className="mt-3 max-w-2xl" style={{ color: "oklch(0.5 0.02 260)", fontSize: "17px", lineHeight: 1.7 }}>
          A comprehensive guide to our visual identity, design system, and brand elements.
          Use this resource to ensure consistency across all touchpoints.
        </p>
      </div>

      {/* Logo showcase */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Logo</h2>
        <p className="mt-1.5 mb-8" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Our logo represents flow, productivity, and creative energy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Primary */}
          <div className="rounded-xl p-8 flex flex-col items-center justify-center border" style={{ background: "oklch(0.985 0.005 260)", borderColor: "oklch(0.93 0.01 260)", minHeight: "180px" }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.7 0.18 25)" }}
              >
                <Sparkle className="w-6 h-6 text-white" />
              </div>
              <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "22px", fontWeight: 700 }}>FlowOS</span>
            </div>
            <span className="px-3 py-1 rounded-full" style={{ background: "oklch(0.95 0.01 260)", color: "oklch(0.5 0.02 260)", fontSize: "12px", fontWeight: 500 }}>
              Primary
            </span>
          </div>

          {/* Dark */}
          <div className="rounded-xl p-8 flex flex-col items-center justify-center" style={{ background: "oklch(0.22 0.02 260)", minHeight: "180px" }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.7 0.18 25)" }}
              >
                <Sparkle className="w-6 h-6 text-white" />
              </div>
              <span style={{ color: "oklch(0.95 0 0)", fontSize: "22px", fontWeight: 700 }}>FlowOS</span>
            </div>
            <span className="px-3 py-1 rounded-full" style={{ background: "oklch(0.3 0.02 260)", color: "oklch(0.7 0 0)", fontSize: "12px", fontWeight: 500 }}>
              Dark Mode
            </span>
          </div>

          {/* Monochrome */}
          <div className="rounded-xl p-8 flex flex-col items-center justify-center border" style={{ background: "white", borderColor: "oklch(0.93 0.01 260)", minHeight: "180px" }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(0.25 0.02 260)" }}
              >
                <Sparkle className="w-6 h-6 text-white" />
              </div>
              <span style={{ color: "oklch(0.25 0.02 260)", fontSize: "22px", fontWeight: 700 }}>FlowOS</span>
            </div>
            <span className="px-3 py-1 rounded-full" style={{ background: "oklch(0.95 0.01 260)", color: "oklch(0.5 0.02 260)", fontSize: "12px", fontWeight: 500 }}>
              Monochrome
            </span>
          </div>
        </div>

        {/* Logo usage rules */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg p-4 border" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            <p style={{ color: "oklch(0.6 0.17 150)", fontSize: "13px", fontWeight: 600 }}>DO</p>
            <ul className="mt-2 space-y-1.5" style={{ color: "oklch(0.45 0.02 260)", fontSize: "13px" }}>
              <li>&#x2713; Use on clean, uncluttered backgrounds</li>
              <li>&#x2713; Maintain minimum clear space of 1x logo height</li>
              <li>&#x2713; Use approved color variations only</li>
            </ul>
          </div>
          <div className="rounded-lg p-4 border" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            <p style={{ color: "oklch(0.6 0.18 25)", fontSize: "13px", fontWeight: 600 }}>DON'T</p>
            <ul className="mt-2 space-y-1.5" style={{ color: "oklch(0.45 0.02 260)", fontSize: "13px" }}>
              <li>&#x2717; Stretch or distort the logo</li>
              <li>&#x2717; Change the logo colors arbitrarily</li>
              <li>&#x2717; Place on busy or low-contrast backgrounds</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Brand values */}
      <section>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Brand Values</h2>
        <p className="mt-1.5 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          The core principles that drive our product and brand expression.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: Crosshair,
              title: "Clarity",
              desc: "We believe in removing noise so teams can focus on what matters most.",
              color: "oklch(0.7 0.18 25)",
              bgColor: "oklch(0.7 0.18 25 / 0.08)",
            },
            {
              icon: Heart,
              title: "Delight",
              desc: "Productivity should feel good. We craft experiences that inspire momentum.",
              color: "oklch(0.55 0.2 280)",
              bgColor: "oklch(0.55 0.2 280 / 0.08)",
            },
            {
              icon: Lightning,
              title: "Speed",
              desc: "Every interaction should feel instant. We optimize for flow, not friction.",
              color: "oklch(0.65 0.15 180)",
              bgColor: "oklch(0.65 0.15 180 / 0.08)",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-xl p-6 border transition-all duration-200 hover:shadow-md cursor-default"
              style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: v.bgColor }}
              >
                <v.icon className="w-5 h-5" style={{ color: v.color }} />
              </div>
              <h3 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>{v.title}</h3>
              <p className="mt-1.5" style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Voice & Tone */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Voice & Tone</h2>
        <p className="mt-1.5 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          How we speak as a brand across all communications.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: "Confident", value: 90 },
            { label: "Friendly", value: 85 },
            { label: "Concise", value: 95 },
            { label: "Playful", value: 40 },
            { label: "Formal", value: 20 },
            { label: "Technical", value: 55 },
          ].map((t) => (
            <div key={t.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", fontWeight: 500 }}>{t.label}</span>
                <span style={{ color: "oklch(0.55 0.02 260)", fontSize: "12px" }}>{t.value}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.94 0.01 260)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${t.value}%`,
                    background: `linear-gradient(90deg, oklch(0.7 0.18 25), oklch(0.6 0.2 280))`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 rounded-xl" style={{ background: "oklch(0.97 0.005 260)" }}>
          <p style={{ color: "oklch(0.5 0.02 260)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Example Copy</p>
          <p style={{ color: "oklch(0.3 0.02 260)", fontSize: "15px", lineHeight: 1.7, fontStyle: "italic" }}>
            "Your team's best work starts here. FlowOS helps you organize, track, and ship — all in one place."
          </p>
        </div>
      </section>

      {/* Quick links */}
      <section>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Quick Links</h2>
        <p className="mt-1.5 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Jump to specific sections of the brand guide.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Color System", desc: "Full OKLCH palette with usage guidelines", href: "/colors" },
            { label: "Typography", desc: "Type scale, weights, and pairings", href: "/typography" },
            { label: "Spacing & Layout", desc: "Spatial system and grid specifications", href: "/spacing" },
            { label: "Components", desc: "UI elements, buttons, inputs, and more", href: "/components" },
            { label: "Product Patterns", desc: "Task panes, kanban, date pickers", href: "/patterns" },
            { label: "Iconography", desc: "Searchable icon set with guidelines", href: "/icons" },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="flex items-center justify-between p-4 rounded-xl border transition-all duration-150 hover:shadow-sm group"
              style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
            >
              <div>
                <p style={{ color: "oklch(0.25 0.02 260)", fontSize: "14px", fontWeight: 500 }}>{link.label}</p>
                <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>{link.desc}</p>
              </div>
              <ArrowRight
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
                style={{ color: "oklch(0.6 0.02 260)" }}
              />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}