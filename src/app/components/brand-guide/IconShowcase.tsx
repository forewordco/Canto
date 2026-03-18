import { useState } from "react";
import type { IconWeight } from "@phosphor-icons/react";
import {
  House, MagnifyingGlass, Bell, Gear, User, UsersThree, Envelope, CalendarBlank,
  CheckSquare, GridFour, ListBullets, ChartBar, ChartPie, TrendUp,
  Folder, File, FileText, Image, Link, ArrowSquareOut, Download, Upload,
  Plus, Minus, X, Check, CaretDown, CaretRight, CaretLeft, CaretUp,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  PencilSimple, Trash, Copy, Clipboard, Archive,
  Star, Heart, BookmarkSimple, Flag, Tag,
  Clock, Timer, Lightning, Crosshair, Trophy,
  ChatText, ChatCircle, PaperPlaneRight, ShareNetwork,
  Lock, LockOpen, Eye, EyeSlash, Shield,
  Sun, Moon, Globe, MapPin,
  DeviceMobile, Monitor, WifiHigh, Bluetooth,
  WarningCircle, Warning, Info, Question,
  Play, Pause, SkipForward, SpeakerHigh,
  Stack, SquaresFour, Columns, Sidebar, List, DotsThree,
  ArrowsClockwise, ArrowCounterClockwise, Funnel, SlidersHorizontal,
} from "@phosphor-icons/react";

const iconCategories = [
  {
    name: "Navigation",
    icons: [
      { icon: House, name: "House" }, { icon: MagnifyingGlass, name: "MagnifyingGlass" }, { icon: Bell, name: "Bell" },
      { icon: Gear, name: "Gear" }, { icon: List, name: "List" }, { icon: Sidebar, name: "Sidebar" },
      { icon: GridFour, name: "GridFour" }, { icon: ListBullets, name: "ListBullets" },
    ],
  },
  {
    name: "Actions",
    icons: [
      { icon: Plus, name: "Plus" }, { icon: Minus, name: "Minus" }, { icon: X, name: "X" },
      { icon: Check, name: "Check" }, { icon: PencilSimple, name: "PencilSimple" }, { icon: Trash, name: "Trash" },
      { icon: Copy, name: "Copy" }, { icon: Clipboard, name: "Clipboard" }, { icon: Archive, name: "Archive" },
      { icon: Download, name: "Download" }, { icon: Upload, name: "Upload" }, { icon: ShareNetwork, name: "ShareNetwork" },
      { icon: PaperPlaneRight, name: "PaperPlaneRight" }, { icon: ArrowsClockwise, name: "ArrowsClockwise" }, { icon: ArrowCounterClockwise, name: "ArrowCounterClockwise" },
      { icon: Funnel, name: "Funnel" }, { icon: SlidersHorizontal, name: "SlidersHorizontal" },
    ],
  },
  {
    name: "Arrows & Carets",
    icons: [
      { icon: ArrowRight, name: "ArrowRight" }, { icon: ArrowLeft, name: "ArrowLeft" },
      { icon: ArrowUp, name: "ArrowUp" }, { icon: ArrowDown, name: "ArrowDown" },
      { icon: CaretRight, name: "CaretRight" }, { icon: CaretLeft, name: "CaretLeft" },
      { icon: CaretUp, name: "CaretUp" }, { icon: CaretDown, name: "CaretDown" },
      { icon: ArrowSquareOut, name: "ArrowSquareOut" }, { icon: Link, name: "Link" },
    ],
  },
  {
    name: "People & Communication",
    icons: [
      { icon: User, name: "User" }, { icon: UsersThree, name: "UsersThree" }, { icon: Envelope, name: "Envelope" },
      { icon: ChatText, name: "ChatText" }, { icon: ChatCircle, name: "ChatCircle" },
    ],
  },
  {
    name: "Content & Files",
    icons: [
      { icon: File, name: "File" }, { icon: FileText, name: "FileText" }, { icon: Folder, name: "Folder" },
      { icon: Image, name: "Image" }, { icon: Stack, name: "Stack" },
      { icon: SquaresFour, name: "SquaresFour" }, { icon: Columns, name: "Columns" },
    ],
  },
  {
    name: "Data & Charts",
    icons: [
      { icon: ChartBar, name: "ChartBar" }, { icon: ChartPie, name: "ChartPie" },
      { icon: TrendUp, name: "TrendUp" }, { icon: CalendarBlank, name: "CalendarBlank" },
      { icon: CheckSquare, name: "CheckSquare" }, { icon: Clock, name: "Clock" },
      { icon: Timer, name: "Timer" },
    ],
  },
  {
    name: "Status & Feedback",
    icons: [
      { icon: Star, name: "Star" }, { icon: Heart, name: "Heart" }, { icon: BookmarkSimple, name: "BookmarkSimple" },
      { icon: Flag, name: "Flag" }, { icon: Tag, name: "Tag" }, { icon: Lightning, name: "Lightning" },
      { icon: Crosshair, name: "Crosshair" }, { icon: Trophy, name: "Trophy" },
      { icon: WarningCircle, name: "WarningCircle" }, { icon: Warning, name: "Warning" },
      { icon: Info, name: "Info" }, { icon: Question, name: "Question" },
    ],
  },
  {
    name: "Security & Visibility",
    icons: [
      { icon: Lock, name: "Lock" }, { icon: LockOpen, name: "LockOpen" },
      { icon: Eye, name: "Eye" }, { icon: EyeSlash, name: "EyeSlash" },
      { icon: Shield, name: "Shield" },
    ],
  },
  {
    name: "Miscellaneous",
    icons: [
      { icon: Sun, name: "Sun" }, { icon: Moon, name: "Moon" }, { icon: Globe, name: "Globe" },
      { icon: MapPin, name: "MapPin" }, { icon: DeviceMobile, name: "DeviceMobile" },
      { icon: Monitor, name: "Monitor" }, { icon: WifiHigh, name: "WifiHigh" }, { icon: Bluetooth, name: "Bluetooth" },
      { icon: Play, name: "Play" }, { icon: Pause, name: "Pause" },
      { icon: SkipForward, name: "SkipForward" }, { icon: SpeakerHigh, name: "SpeakerHigh" },
      { icon: DotsThree, name: "DotsThree" },
    ],
  },
];

const weightOptions: { label: string; value: IconWeight }[] = [
  { label: "Thin", value: "thin" },
  { label: "Light", value: "light" },
  { label: "Regular", value: "regular" },
  { label: "Bold", value: "bold" },
  { label: "Fill", value: "fill" },
  { label: "Duotone", value: "duotone" },
];

export function IconShowcase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSize, setSelectedSize] = useState(20);
  const [selectedWeight, setSelectedWeight] = useState<IconWeight>("regular");

  const filteredCategories = iconCategories
    .map((cat) => ({
      ...cat,
      icons: cat.icons.filter((ic) =>
        ic.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.icons.length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.85 0.15 85)" }} />
          <p style={{ color: "oklch(0.6 0.12 85)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>
            ICONOGRAPHY
          </p>
        </div>
        <h1 style={{ color: "oklch(0.2 0.02 260)", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
          Iconography
        </h1>
        <p className="mt-2 max-w-2xl" style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>
          Phosphor icons — flexible, consistent, open-source. Six weights, pixel-perfect at every size.
        </p>
      </div>

      {/* Controls */}
      <section
        className="rounded-xl p-4 md:p-5 border sticky top-0 z-10"
        style={{ background: "oklch(0.995 0.002 260)", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          {/* Search */}
          <div className="flex-1">
            <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              Search Icons
            </label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.6 0.02 260)" }} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border outline-none"
                style={{
                  borderColor: "oklch(0.9 0.01 260)",
                  fontSize: "14px",
                  color: "oklch(0.2 0.02 260)",
                  background: "white",
                }}
              />
            </div>
          </div>

          {/* Size */}
          <div>
            <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              Size
            </label>
            <div className="flex gap-1.5">
              {[16, 20, 24, 32].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className="px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: selectedSize === s ? "oklch(0.7 0.18 25)" : "oklch(0.9 0.01 260)",
                    background: selectedSize === s ? "oklch(0.7 0.18 25 / 0.06)" : "white",
                    color: selectedSize === s ? "oklch(0.55 0.18 25)" : "oklch(0.4 0.02 260)",
                    fontSize: "13px",
                    fontWeight: selectedSize === s ? 500 : 400,
                  }}
                >
                  {s}px
                </button>
              ))}
            </div>
          </div>

          {/* Weight */}
          <div>
            <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>
              Weight
            </label>
            <div className="flex gap-1.5 flex-wrap">
              {weightOptions.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setSelectedWeight(w.value)}
                  className="px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    borderColor: selectedWeight === w.value ? "oklch(0.55 0.2 280)" : "oklch(0.9 0.01 260)",
                    background: selectedWeight === w.value ? "oklch(0.55 0.2 280 / 0.06)" : "white",
                    color: selectedWeight === w.value ? "oklch(0.45 0.17 280)" : "oklch(0.4 0.02 260)",
                    fontSize: "13px",
                    fontWeight: selectedWeight === w.value ? 500 : 400,
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Icon Grid */}
      {filteredCategories.map((cat) => (
        <section key={cat.name}>
          <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "18px", fontWeight: 600 }}>{cat.name}</h2>
          <p className="mt-1 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
            {cat.icons.length} icons
          </p>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {cat.icons.map((ic) => (
              <div
                key={ic.name}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-transparent transition-all duration-150 hover:border-[oklch(0.92_0.01_260)] hover:bg-white hover:shadow-sm cursor-pointer group"
              >
                <ic.icon
                  size={selectedSize}
                  weight={selectedWeight}
                  style={{
                    color: "oklch(0.35 0.02 260)",
                  }}
                  className="transition-colors group-hover:text-[oklch(0.55_0.18_25)]"
                />
                <span
                  className="text-center truncate w-full"
                  style={{ color: "oklch(0.55 0.02 260)", fontSize: "10px" }}
                >
                  {ic.name}
                </span>
              </div>
            ))}
          </div>
        </section>
      ))}

      {filteredCategories.length === 0 && (
        <div className="text-center py-16">
          <MagnifyingGlass className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.8 0.01 260)" }} />
          <p style={{ color: "oklch(0.4 0.02 260)", fontSize: "16px", fontWeight: 500 }}>
            No icons match "{searchQuery}"
          </p>
          <p className="mt-1" style={{ color: "oklch(0.6 0.02 260)", fontSize: "14px" }}>
            Try a different search term
          </p>
        </div>
      )}

      {/* Usage Guidelines */}
      <section
        className="rounded-2xl p-8 md:p-10 border"
        style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}
      >
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "20px", fontWeight: 600 }}>Usage Guidelines</h2>
        <p className="mt-1 mb-6" style={{ color: "oklch(0.55 0.02 260)", fontSize: "14px" }}>
          Best practices for Phosphor icon usage across the product.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              title: "Sizing",
              items: [
                "16px — inline with small text, compact UI",
                "20px — default size for most contexts",
                "24px — navigation, primary actions",
                "32px — empty states, feature highlights",
              ],
            },
            {
              title: "Weight",
              items: [
                "Regular — default weight for most contexts",
                "Bold — emphasis, active states, key actions",
                "Light / Thin — decorative, large display sizes",
                "Fill — selected states, toggles, solid indicators",
                "Duotone — illustrations, onboarding, empty states",
              ],
            },
            {
              title: "Color",
              items: [
                "Use oklch(0.4 0.02 260) for default icons",
                "Use oklch(0.6 0.02 260) for muted/secondary",
                "Use brand colors sparingly for emphasis",
                "Maintain 3:1 contrast ratio minimum",
              ],
            },
            {
              title: "Pairing with Text",
              items: [
                "Align icons vertically to text center",
                "Use 8px gap between icon and text",
                "Match icon size to text line-height",
                "Place action icons on the right of text",
              ],
            },
            {
              title: "Accessibility",
              items: [
                'Add aria-label for standalone icons',
                'Use aria-hidden for decorative icons',
                "Ensure touch targets are 44px minimum",
                "Provide text alternatives for meaning",
              ],
            },
            {
              title: "Phosphor-Specific",
              items: [
                "Import from @phosphor-icons/react",
                "Use the size prop instead of width/height",
                "Use the weight prop for visual variants",
                "All icons support all six weights",
              ],
            },
          ].map((guide) => (
            <div key={guide.title} className="rounded-xl p-5 border" style={{ borderColor: "oklch(0.93 0.01 260)" }}>
              <h3 style={{ color: "oklch(0.3 0.02 260)", fontSize: "14px", fontWeight: 600 }}>{guide.title}</h3>
              <ul className="mt-3 space-y-2">
                {guide.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2" style={{ color: "oklch(0.5 0.02 260)", fontSize: "13px" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "oklch(0.7 0.18 25)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
