export function TypographyGuide() {
  const typeScale = [
    { name: "Display", size: "48px", weight: 700, lineHeight: "1.15", tracking: "-0.02em", tag: "Display headings", sample: "Ship better work" },
    { name: "H1", size: "36px", weight: 700, lineHeight: "1.2", tracking: "-0.015em", tag: "Page titles", sample: "Manage your projects" },
    { name: "H2", size: "28px", weight: 600, lineHeight: "1.3", tracking: "-0.01em", tag: "Section headers", sample: "Team collaboration" },
    { name: "H3", size: "22px", weight: 600, lineHeight: "1.35", tracking: "-0.005em", tag: "Subsections", sample: "Task assignment" },
    { name: "H4", size: "18px", weight: 600, lineHeight: "1.4", tracking: "0", tag: "Card titles", sample: "Sprint planning" },
    { name: "Body L", size: "17px", weight: 400, lineHeight: "1.7", tracking: "0", tag: "Long-form content", sample: "Organize work across your team in a way that's clear, trackable, and keeps everyone in flow." },
    { name: "Body", size: "15px", weight: 400, lineHeight: "1.65", tracking: "0", tag: "Default text", sample: "Create tasks, assign owners, and set due dates to keep projects on track and teams aligned." },
    { name: "Body S", size: "13px", weight: 400, lineHeight: "1.55", tracking: "0.005em", tag: "Secondary text", sample: "Updated 2 hours ago by Sarah Chen" },
    { name: "Caption", size: "12px", weight: 500, lineHeight: "1.4", tracking: "0.01em", tag: "Labels, metadata", sample: "3 tasks remaining" },
    { name: "Overline", size: "11px", weight: 600, lineHeight: "1.3", tracking: "0.08em", tag: "Categories, tags", sample: "IN PROGRESS" },
  ];

  const fontWeights = [
    { weight: 300, label: "Light", usage: "Rarely used; only for very large decorative text" },
    { weight: 400, label: "Regular", usage: "Body text, descriptions, and general content" },
    { weight: 500, label: "Medium", usage: "Captions, labels, navigation items" },
    { weight: 600, label: "Semibold", usage: "Headings H2–H4, emphasis within body" },
    { weight: 700, label: "Bold", usage: "Display text, H1, and primary headings" },
    { weight: 800, label: "Extra Bold", usage: "Reserved for marketing hero moments only" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.55 0.2 280)" }} />
          <p style={{ color: "oklch(0.5 0.18 280)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>
            TYPOGRAPHY
          </p>
        </div>
        <h1 style={{ color: "oklch(0.2 0.02 260)", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
          Typography
        </h1>
        <p className="mt-2 max-w-2xl" style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>
          Albert Sans is our primary typeface — versatile, highly legible, and optimized for screens.
        </p>
      </div>

      {/* Font Family */}
      <section
        className="rounded-xl p-5 md:p-6 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Typeface</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Our primary and only typeface, used across all product and marketing surfaces.
        </p>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: "oklch(0.97 0.005 260)" }}
            >
              <p style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: "72px", fontWeight: 300, color: "oklch(0.25 0.02 260)", lineHeight: 1 }}>
                Aa
              </p>
              <p className="mt-4" style={{ fontFamily: "'Albert Sans', sans-serif", color: "oklch(0.4 0.02 260)", fontSize: "14px" }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ
              </p>
              <p className="mt-1" style={{ fontFamily: "'Albert Sans', sans-serif", color: "oklch(0.4 0.02 260)", fontSize: "14px" }}>
                abcdefghijklmnopqrstuvwxyz
              </p>
              <p className="mt-1" style={{ fontFamily: "'Albert Sans', sans-serif", color: "oklch(0.4 0.02 260)", fontSize: "14px" }}>
                0123456789 !@#$%&amp;*()
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <h3 style={{ color: "oklch(0.25 0.02 260)", fontSize: "24px", fontWeight: 700, fontFamily: "'Albert Sans', sans-serif" }}>
              Albert Sans
            </h3>
            <p className="mt-2" style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px", lineHeight: 1.7 }}>
              Designed by Andreas Rasmussen. A geometric sans-serif with a clean, modern aesthetic.
              Features variable font support for precise weight control. Supports Latin Extended character sets.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Variable", "Latin Extended", "Screen Optimized", "Open Source"].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full"
                  style={{ background: "oklch(0.55 0.2 280 / 0.08)", color: "oklch(0.45 0.18 280)", fontSize: "12px", fontWeight: 500 }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Type Scale */}
      <section>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Type Scale</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          A modular scale for consistent visual hierarchy. Each level has defined size, weight, and line height.
        </p>

        <div className="space-y-1">
          {typeScale.map((item) => (
            <div
              key={item.name}
              className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 p-4 md:p-5 rounded-xl border transition-colors hover:bg-white group"
              style={{ borderColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "oklch(0.92 0.01 260)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
            >
              {/* Label */}
              <div className="flex items-center gap-3 md:w-[120px] shrink-0">
                <span
                  className="px-2 py-0.5 rounded"
                  style={{ background: "oklch(0.55 0.2 280 / 0.08)", color: "oklch(0.45 0.18 280)", fontSize: "11px", fontWeight: 600 }}
                >
                  {item.name}
                </span>
              </div>

              {/* Sample */}
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontFamily: "'Albert Sans', sans-serif",
                    fontSize: item.size,
                    fontWeight: item.weight,
                    lineHeight: item.lineHeight,
                    letterSpacing: item.tracking,
                    color: "oklch(0.2 0.02 260)",
                  }}
                >
                  {item.sample}
                </p>
              </div>

              {/* Specs */}
              <div className="flex items-center gap-3 shrink-0">
                <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px", fontFamily: "monospace" }}>
                  {item.size} / {item.lineHeight}
                </span>
                <span
                  className="px-2 py-0.5 rounded"
                  style={{ background: "oklch(0.95 0.01 260)", color: "oklch(0.55 0.02 260)", fontSize: "10px", fontWeight: 500 }}
                >
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weights */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Font Weights</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Weight usage guidelines for maintaining consistent typographic rhythm.
        </p>

        <div className="space-y-4">
          {fontWeights.map((fw) => (
            <div key={fw.weight} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
              <div className="md:w-[200px] shrink-0">
                <p
                  style={{
                    fontFamily: "'Albert Sans', sans-serif",
                    fontWeight: fw.weight,
                    fontSize: "28px",
                    color: "oklch(0.25 0.02 260)",
                    lineHeight: 1.2,
                  }}
                >
                  Canto
                </p>
              </div>
              <div className="flex items-center gap-3 md:w-[140px] shrink-0">
                <code style={{ color: "oklch(0.5 0.18 280)", fontSize: "12px" }}>{fw.weight}</code>
                <span style={{ color: "oklch(0.4 0.02 260)", fontSize: "13px", fontWeight: 500 }}>{fw.label}</span>
              </div>
              <p className="flex-1" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
                {fw.usage}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Paragraph Styles */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Text Styles in Context</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          How typography works together in a real interface.
        </p>

        <div className="rounded-xl border p-6 md:p-8" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
          <p style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: "oklch(0.7 0.18 25)", textTransform: "uppercase" }}>
            Product Update
          </p>
          <h2 className="mt-2" style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: "28px", fontWeight: 700, color: "oklch(0.2 0.02 260)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
            Introducing Timeline View
          </h2>
          <p className="mt-3 max-w-xl" style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: "15px", fontWeight: 400, color: "oklch(0.5 0.02 260)", lineHeight: 1.7 }}>
            See how your project's tasks connect over time. Timeline view gives your team a
            shared understanding of how work fits together, making planning and coordination effortless.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              className="px-4 py-2 rounded-lg"
              style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "14px", fontWeight: 500 }}
            >
              Learn more
            </button>
            <button
              className="px-4 py-2 rounded-lg"
              style={{ background: "transparent", color: "oklch(0.5 0.02 260)", fontSize: "14px", fontWeight: 500 }}
            >
              Dismiss
            </button>
          </div>
          <p className="mt-4" style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: "12px", fontWeight: 500, color: "oklch(0.65 0.015 260)" }}>
            Released Feb 2026 &middot; 3 min read
          </p>
        </div>
      </section>
    </div>
  );
}