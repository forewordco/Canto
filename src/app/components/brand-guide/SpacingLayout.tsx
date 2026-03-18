export function SpacingLayout() {
  const spacingScale = [
    { name: "0", px: 0 },
    { name: "1", px: 4 },
    { name: "2", px: 8 },
    { name: "3", px: 12 },
    { name: "4", px: 16 },
    { name: "5", px: 20 },
    { name: "6", px: 24 },
    { name: "8", px: 32 },
    { name: "10", px: 40 },
    { name: "12", px: 48 },
    { name: "16", px: 64 },
    { name: "20", px: 80 },
    { name: "24", px: 96 },
  ];

  const radii = [
    { name: "none", value: "0px" },
    { name: "sm", value: "4px" },
    { name: "md", value: "6px" },
    { name: "DEFAULT", value: "8px" },
    { name: "lg", value: "10px" },
    { name: "xl", value: "12px" },
    { name: "2xl", value: "16px" },
    { name: "3xl", value: "24px" },
    { name: "full", value: "9999px" },
  ];

  const shadows = [
    { name: "xs", css: "0 1px 2px oklch(0 0 0 / 0.04)", usage: "Subtle elevation for cards at rest" },
    { name: "sm", css: "0 1px 3px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)", usage: "Cards on hover, dropdowns" },
    { name: "md", css: "0 4px 6px oklch(0 0 0 / 0.06), 0 2px 4px oklch(0 0 0 / 0.04)", usage: "Popovers, floating elements" },
    { name: "lg", css: "0 10px 15px oklch(0 0 0 / 0.06), 0 4px 6px oklch(0 0 0 / 0.03)", usage: "Modals, overlays" },
    { name: "xl", css: "0 20px 25px oklch(0 0 0 / 0.08), 0 8px 10px oklch(0 0 0 / 0.04)", usage: "Full-page modals, toasts" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.65 0.15 180)" }} />
          <p style={{ color: "oklch(0.5 0.13 180)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>
            SPATIAL SYSTEM
          </p>
        </div>
        <h1 style={{ color: "oklch(0.2 0.02 260)", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
          Spacing & Layout
        </h1>
        <p className="mt-2 max-w-2xl" style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>
          A consistent 4px base grid with a spacing scale for predictable, harmonious layouts.
        </p>
      </div>

      {/* Spacing Scale */}
      <section
        className="rounded-xl p-5 md:p-6 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Spacing Scale</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Based on a 4px unit. Use these tokens instead of arbitrary values.
        </p>

        <div className="space-y-2.5">
          {spacingScale.map((s) => (
            <div key={s.name} className="flex items-center gap-4">
              <code className="w-[60px] text-right shrink-0" style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px" }}>
                {s.name}
              </code>
              <code className="w-[50px] shrink-0" style={{ color: "oklch(0.55 0.15 280)", fontSize: "12px" }}>
                {s.px}px
              </code>
              <div className="flex-1 h-6 flex items-center">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${Math.max(s.px, 2)}px`,
                    background: s.px === 0
                      ? "oklch(0.9 0.01 260)"
                      : `linear-gradient(90deg, oklch(0.65 0.15 180), oklch(0.65 0.15 180 / 0.4))`,
                    minWidth: s.px === 0 ? "2px" : undefined,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid System */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Grid System</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Responsive column grid with consistent gutters.
        </p>

        {/* 12-column demo */}
        <div className="space-y-4">
          <div>
            <p className="mb-2" style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px", fontWeight: 500 }}>12 Columns</p>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded flex items-center justify-center"
                  style={{ background: "oklch(0.65 0.15 180 / 0.12)", color: "oklch(0.45 0.12 180)", fontSize: "11px", fontWeight: 500 }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2" style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px", fontWeight: 500 }}>Common Layouts</p>
            <div className="space-y-2">
              {/* 6-6 */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-6 h-10 rounded flex items-center justify-center" style={{ background: "oklch(0.7 0.18 25 / 0.12)", color: "oklch(0.5 0.15 25)", fontSize: "11px", fontWeight: 500 }}>
                  6 cols
                </div>
                <div className="col-span-6 h-10 rounded flex items-center justify-center" style={{ background: "oklch(0.7 0.18 25 / 0.12)", color: "oklch(0.5 0.15 25)", fontSize: "11px", fontWeight: 500 }}>
                  6 cols
                </div>
              </div>
              {/* 4-8 */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4 h-10 rounded flex items-center justify-center" style={{ background: "oklch(0.55 0.2 280 / 0.1)", color: "oklch(0.45 0.17 280)", fontSize: "11px", fontWeight: 500 }}>
                  4 cols — Sidebar
                </div>
                <div className="col-span-8 h-10 rounded flex items-center justify-center" style={{ background: "oklch(0.55 0.2 280 / 0.1)", color: "oklch(0.45 0.17 280)", fontSize: "11px", fontWeight: 500 }}>
                  8 cols — Main Content
                </div>
              </div>
              {/* 3-6-3 */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-3 h-10 rounded flex items-center justify-center" style={{ background: "oklch(0.85 0.15 85 / 0.15)", color: "oklch(0.55 0.12 85)", fontSize: "11px", fontWeight: 500 }}>
                  3 cols
                </div>
                <div className="col-span-6 h-10 rounded flex items-center justify-center" style={{ background: "oklch(0.85 0.15 85 / 0.15)", color: "oklch(0.55 0.12 85)", fontSize: "11px", fontWeight: 500 }}>
                  6 cols
                </div>
                <div className="col-span-3 h-10 rounded flex items-center justify-center" style={{ background: "oklch(0.85 0.15 85 / 0.15)", color: "oklch(0.55 0.12 85)", fontSize: "11px", fontWeight: 500 }}>
                  3 cols
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breakpoints */}
        <div className="mt-8">
          <p className="mb-4" style={{ color: "oklch(0.4 0.02 260)", fontSize: "14px", fontWeight: 500 }}>Breakpoints</p>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(0.92 0.01 260)" }}>
                  <th className="text-left py-2 pr-4" style={{ color: "oklch(0.5 0.02 260)", fontWeight: 500 }}>Name</th>
                  <th className="text-left py-2 pr-4" style={{ color: "oklch(0.5 0.02 260)", fontWeight: 500 }}>Min Width</th>
                  <th className="text-left py-2 pr-4" style={{ color: "oklch(0.5 0.02 260)", fontWeight: 500 }}>Columns</th>
                  <th className="text-left py-2" style={{ color: "oklch(0.5 0.02 260)", fontWeight: 500 }}>Gutter</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Mobile", min: "0px", cols: 4, gutter: "16px" },
                  { name: "Tablet", min: "768px", cols: 8, gutter: "24px" },
                  { name: "Desktop", min: "1024px", cols: 12, gutter: "24px" },
                  { name: "Wide", min: "1440px", cols: 12, gutter: "32px" },
                ].map((bp) => (
                  <tr key={bp.name} style={{ borderBottom: "1px solid oklch(0.95 0.005 260)" }}>
                    <td className="py-2.5 pr-4" style={{ color: "oklch(0.3 0.02 260)", fontWeight: 500 }}>{bp.name}</td>
                    <td className="py-2.5 pr-4"><code style={{ color: "oklch(0.55 0.15 280)", fontSize: "12px" }}>{bp.min}</code></td>
                    <td className="py-2.5 pr-4" style={{ color: "oklch(0.4 0.02 260)" }}>{bp.cols}</td>
                    <td className="py-2.5" style={{ color: "oklch(0.4 0.02 260)" }}>{bp.gutter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Border Radius */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Border Radius</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Consistent corner rounding for different element sizes and contexts.
        </p>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-4">
          {radii.map((r) => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div
                className="w-14 h-14 border-2"
                style={{
                  borderColor: "oklch(0.7 0.18 25)",
                  background: "oklch(0.7 0.18 25 / 0.06)",
                  borderRadius: r.value,
                }}
              />
              <div className="text-center">
                <p style={{ color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500 }}>{r.name}</p>
                <p style={{ color: "oklch(0.6 0.02 260)", fontSize: "10px", fontFamily: "monospace" }}>{r.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shadows */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Elevation & Shadows</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Shadow tokens for depth and layering. Use sparingly — most elements should be flat.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {shadows.map((s) => (
            <div key={s.name} className="flex flex-col items-center">
              <div
                className="w-full h-24 rounded-xl bg-white border"
                style={{ boxShadow: s.css, borderColor: "oklch(0.95 0.005 260)" }}
              />
              <div className="mt-3 text-center">
                <p style={{ color: "oklch(0.3 0.02 260)", fontSize: "13px", fontWeight: 500 }}>{s.name}</p>
                <p className="mt-0.5" style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>{s.usage}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Z-Index */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Z-Index Scale</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Defined layers for predictable stacking order.
        </p>

        <div className="space-y-2">
          {[
            { name: "Base", z: 0, desc: "Default content layer" },
            { name: "Sticky", z: 10, desc: "Sticky headers, toolbar" },
            { name: "Dropdown", z: 20, desc: "Dropdown menus, selects" },
            { name: "Popover", z: 30, desc: "Popovers, tooltips" },
            { name: "Modal", z: 40, desc: "Modal dialogs" },
            { name: "Toast", z: 50, desc: "Toast notifications" },
            { name: "Max", z: 100, desc: "Absolute top layer" },
          ].map((layer) => (
            <div
              key={layer.name}
              className="flex items-center gap-4 p-3 rounded-lg"
              style={{ background: "oklch(0.97 0.005 260)" }}
            >
              <code className="w-[40px] text-right shrink-0" style={{ color: "oklch(0.55 0.15 280)", fontSize: "13px", fontWeight: 600 }}>
                {layer.z}
              </code>
              <span className="w-[80px] shrink-0" style={{ color: "oklch(0.3 0.02 260)", fontSize: "13px", fontWeight: 500 }}>
                {layer.name}
              </span>
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${Math.max((layer.z / 100) * 100, 5)}%`,
                  background: `linear-gradient(90deg, oklch(0.65 0.15 180 / 0.5), oklch(0.65 0.15 180 / 0.15))`,
                }}
              />
              <span className="shrink-0" style={{ color: "oklch(0.55 0.02 260)", fontSize: "12px" }}>
                {layer.desc}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
