import { useState } from "react";
import {
  Check,
  CaretDown,
  Plus,
  MagnifyingGlass,
  Bell,
  DotsThree,
  CalendarBlank,
  User,
  Star,
  ArrowRight,
  SpinnerGap,
  X,
  WarningCircle,
  CheckCircle,
  Info,
  Smiley,
  LinkSimple,
  ArrowsOut,
  UsersThree,
  ChatCircle,
  ClipboardText,
  TextB,
  TextItalic,
  ListBullets,
  At,
  Paperclip,
  Image,
  PushPin,
  Timer,
  Play,
  Pause,
  Clock,
  Stop,
  FilePdf,
  FileDoc,
  VideoCamera,
  Globe,
  ArrowSquareOut,
  DownloadSimple,
  Eye,
  CaretRight,
  FileText,
  FileCsv,
  MonitorPlay,
  Table,
  Images,
} from "@phosphor-icons/react";

const avatarPhotos = {
  dp: "https://images.unsplash.com/photo-1719257751404-1dea075324bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbiUyMGJlYXJkfGVufDF8fHx8MTc3MTg4NzQzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  kr: "https://images.unsplash.com/photo-1758798261311-eb6b126aacce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFuJTIwcmVkaGVhZHxlbnwxfHx8fDE3NzE4OTc3MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  sc: "https://images.unsplash.com/flagged/photo-1573582677725-863b570e3c00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHdvbWFuJTIwYnJ1bmV0dGV8ZW58MXx8fHwxNzcxODk3NzEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  jm: "https://images.unsplash.com/photo-1769636930047-4478f12cf430?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbiUyMGdsYXNzZXN8ZW58MXx8fHwxNzcxODc0NjQ1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
};

/* Reusable formatting toolbar for comment/reply areas */
function FormattingToolbar() {
  return (
    <div className="flex items-center gap-0.5 px-1 py-1 border-t" style={{ borderColor: "oklch(0.93 0.01 260)" }}>
      <button className="p-1 rounded hover:bg-black/[0.04]" title="Bold"><TextB size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
      <button className="p-1 rounded hover:bg-black/[0.04]" title="Italic"><TextItalic size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
      <div className="w-px h-3.5 mx-0.5" style={{ background: "oklch(0.9 0.01 260)" }} />
      <button className="p-1 rounded hover:bg-black/[0.04]" title="Bulleted list"><ListBullets size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
      <button className="p-1 rounded hover:bg-black/[0.04]" title="Mention"><At size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
      <button className="p-1 rounded hover:bg-black/[0.04]" title="Attach file"><Paperclip size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
      <button className="p-1 rounded hover:bg-black/[0.04]" title="Add image"><Image size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
      <button className="p-1 rounded hover:bg-black/[0.04]" title="Emoji"><Smiley size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
    </div>
  );
}

/* Typing indicator dots */
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-2" style={{ background: "oklch(0.97 0.003 260)" }}>
      <div className="flex -space-x-1.5">
        <img src={avatarPhotos.kr} alt="KR" className="w-5 h-5 rounded-full object-cover border-[1.5px] border-white" />
      </div>
      <div className="flex items-center gap-1">
        <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>Krista is typing</span>
        <span className="flex gap-[3px] items-center ml-0.5">
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: "oklch(0.55 0.02 260)", animationDelay: "0ms", animationDuration: "1s" }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: "oklch(0.55 0.02 260)", animationDelay: "150ms", animationDuration: "1s" }} />
          <span className="w-1 h-1 rounded-full animate-bounce" style={{ background: "oklch(0.55 0.02 260)", animationDelay: "300ms", animationDuration: "1s" }} />
        </span>
      </div>
    </div>
  );
}

export function ComponentShowcase() {
  const [switchOn, setSwitchOn] = useState(true);
  const [checkboxes, setCheckboxes] = useState([true, false, true]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [sliderVal, setSliderVal] = useState(65);

  const toggleCheckbox = (i: number) => {
    setCheckboxes((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.7 0.18 25)" }} />
          <p style={{ color: "oklch(0.6 0.18 25)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em" }}>
            UI COMPONENTS
          </p>
        </div>
        <h1 style={{ color: "oklch(0.2 0.02 260)", fontSize: "28px", fontWeight: 700, lineHeight: 1.2 }}>
          Components
        </h1>
        <p className="mt-2 max-w-2xl" style={{ color: "oklch(0.5 0.02 260)", fontSize: "14px", lineHeight: 1.6 }}>
          Core UI building blocks. All components use OKLCH colors with consistent sizing and spacing.
        </p>
      </div>

      {/* Buttons */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Buttons</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Primary actions, secondary options, and utility controls.
        </p>

        <div className="mb-4">
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>PRIMARY</p>
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3.5 py-1.5 rounded-md transition-all hover:opacity-90 active:scale-[0.98]" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "13px", fontWeight: 500 }}>
              Create Task
            </button>
            <button className="px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-all hover:opacity-90" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "13px", fontWeight: 500 }}>
              <Plus size={14} /> New Project
            </button>
            <button className="px-3.5 py-1.5 rounded-md opacity-40 cursor-not-allowed" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "13px", fontWeight: 500 }}>
              Disabled
            </button>
            <button className="px-3.5 py-1.5 rounded-md flex items-center gap-1.5" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "13px", fontWeight: 500 }}>
              <SpinnerGap size={14} className="animate-spin" /> Loading
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>SECONDARY</p>
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3.5 py-1.5 rounded-md border hover:bg-black/[0.02]" style={{ borderColor: "oklch(0.88 0.01 260)", color: "oklch(0.35 0.02 260)", fontSize: "13px", fontWeight: 500 }}>
              Cancel
            </button>
            <button className="px-3.5 py-1.5 rounded-md border flex items-center gap-1.5 hover:bg-black/[0.02]" style={{ borderColor: "oklch(0.88 0.01 260)", color: "oklch(0.35 0.02 260)", fontSize: "13px", fontWeight: 500 }}>
              <CalendarBlank size={14} /> Set Date
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>GHOST</p>
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3 py-1.5 rounded-md hover:bg-black/[0.04]" style={{ color: "oklch(0.4 0.02 260)", fontSize: "13px", fontWeight: 500 }}>
              Cancel
            </button>
            <button className="px-3 py-1.5 rounded-md hover:bg-black/[0.04] flex items-center gap-1" style={{ color: "oklch(0.55 0.18 25)", fontSize: "13px", fontWeight: 500 }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>DESTRUCTIVE</p>
          <div className="flex flex-wrap items-center gap-2">
            <button className="px-3.5 py-1.5 rounded-md hover:opacity-90" style={{ background: "oklch(0.6 0.22 25)", color: "white", fontSize: "13px", fontWeight: 500 }}>
              Delete
            </button>
            <button className="px-3.5 py-1.5 rounded-md border hover:bg-red-50/50" style={{ borderColor: "oklch(0.8 0.1 25)", color: "oklch(0.55 0.2 25)", fontSize: "13px", fontWeight: 500 }}>
              Remove
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>SIZES</p>
          <div className="flex flex-wrap items-end gap-2">
            <button className="px-2.5 py-1 rounded" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "11px", fontWeight: 500 }}>XS</button>
            <button className="px-3 py-1 rounded-md" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "12px", fontWeight: 500 }}>Small</button>
            <button className="px-3.5 py-1.5 rounded-md" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "13px", fontWeight: 500 }}>Medium</button>
            <button className="px-4 py-2 rounded-lg" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "14px", fontWeight: 500 }}>Large</button>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Inputs</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Form elements for data collection.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>Task Name</label>
            <input type="text" placeholder="e.g., Design homepage" className="w-full px-3 py-1.5 rounded-md border outline-none" style={{ borderColor: "oklch(0.9 0.01 260)", fontSize: "13px", color: "oklch(0.2 0.02 260)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "oklch(0.7 0.18 25)"; e.currentTarget.style.boxShadow = "0 0 0 2px oklch(0.7 0.18 25 / 0.1)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "oklch(0.9 0.01 260)"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>
          <div>
            <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>Search</label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2" size={14} style={{ color: "oklch(0.6 0.02 260)" }} />
              <input type="text" placeholder="Search tasks, projects..." className="w-full pl-8 pr-3 py-1.5 rounded-md border outline-none" style={{ borderColor: "oklch(0.9 0.01 260)", fontSize: "13px", color: "oklch(0.2 0.02 260)", background: "oklch(0.985 0.003 260)" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>Priority</label>
            <div className="relative">
              <select className="w-full px-3 py-1.5 rounded-md border outline-none appearance-none" style={{ borderColor: "oklch(0.9 0.01 260)", fontSize: "13px", color: "oklch(0.2 0.02 260)" }}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
              <CaretDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" size={14} style={{ color: "oklch(0.6 0.02 260)" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>Description</label>
            <textarea placeholder="Add a description..." rows={2} className="w-full px-3 py-1.5 rounded-md border outline-none resize-none" style={{ borderColor: "oklch(0.9 0.01 260)", fontSize: "13px", color: "oklch(0.2 0.02 260)" }} />
          </div>
        </div>
        <div className="mt-4">
          <label style={{ display: "block", color: "oklch(0.3 0.02 260)", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>Error State</label>
          <input type="email" defaultValue="invalid-email" className="w-full max-w-xs px-3 py-1.5 rounded-md border outline-none" style={{ borderColor: "oklch(0.7 0.2 25)", fontSize: "13px", color: "oklch(0.2 0.02 260)", boxShadow: "0 0 0 2px oklch(0.7 0.2 25 / 0.08)" }} />
          <p className="mt-1 flex items-center gap-1" style={{ color: "oklch(0.6 0.2 25)", fontSize: "11px" }}>
            <WarningCircle size={12} /> Please enter a valid email
          </p>
        </div>
      </section>

      {/* Controls */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Controls</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Toggles, checkboxes, and selection controls.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>TOGGLE</p>
            <div className="space-y-1.5">
              {[
                { label: "Email notifications", desc: "Task assignments" },
                { label: "Dark mode", desc: "Color scheme" },
              ].map((item, i) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-2.5 rounded-lg" style={{ background: "oklch(0.985 0.003 260)" }}>
                  <div>
                    <p style={{ color: "oklch(0.25 0.02 260)", fontSize: "13px", fontWeight: 500 }}>{item.label}</p>
                    <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}>{item.desc}</p>
                  </div>
                  <button onClick={() => { if (i === 0) setSwitchOn(!switchOn); }} className="relative w-9 h-5 rounded-full transition-all"
                    style={{ background: (i === 0 ? switchOn : false) ? "oklch(0.7 0.18 25)" : "oklch(0.85 0.01 260)" }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform" style={{ transform: (i === 0 ? switchOn : false) ? "translateX(18px)" : "translateX(2px)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>CHECKBOXES</p>
            <div className="space-y-0.5">
              {["Design review", "Code review", "QA testing"].map((task, i) => (
                <button key={task} onClick={() => toggleCheckbox(i)} className="flex items-center gap-2.5 w-full py-1.5 px-2 rounded-md hover:bg-black/[0.02] text-left">
                  <div className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-all"
                    style={{ borderColor: checkboxes[i] ? "oklch(0.7 0.18 25)" : "oklch(0.82 0.01 260)", background: checkboxes[i] ? "oklch(0.7 0.18 25)" : "transparent" }}>
                    {checkboxes[i] && <Check size={10} color="white" />}
                  </div>
                  <span style={{ color: checkboxes[i] ? "oklch(0.55 0.02 260)" : "oklch(0.25 0.02 260)", fontSize: "13px", textDecoration: checkboxes[i] ? "line-through" : "none" }}>{task}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>SLIDER</p>
          <div className="max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: "oklch(0.4 0.02 260)", fontSize: "12px" }}>Progress</span>
              <span style={{ color: "oklch(0.55 0.18 25)", fontSize: "12px", fontWeight: 600 }}>{sliderVal}%</span>
            </div>
            <input type="range" min={0} max={100} value={sliderVal} onChange={(e) => setSliderVal(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(90deg, oklch(0.7 0.18 25) ${sliderVal}%, oklch(0.93 0.01 260) ${sliderVal}%)` }} />
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Cards</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>Containers for related content.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Task card */}
          <div className="rounded-lg border p-3.5 transition-all hover:shadow-sm" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2 py-0.5 rounded-full" style={{ background: "oklch(0.7 0.18 25 / 0.1)", color: "oklch(0.55 0.18 25)", fontSize: "10px", fontWeight: 600 }}>High</span>
              <button className="p-0.5 rounded hover:bg-black/[0.04]"><DotsThree size={14} style={{ color: "oklch(0.6 0.02 260)" }} /></button>
            </div>
            <h4 style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Redesign onboarding flow</h4>
            <p className="mt-0.5" style={{ color: "oklch(0.55 0.02 260)", fontSize: "12px" }}>Simplify signup to 3 steps</p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t" style={{ borderColor: "oklch(0.94 0.005 260)" }}>
              <div className="flex items-center gap-1"><CalendarBlank size={12} style={{ color: "oklch(0.6 0.02 260)" }} /><span style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}>Feb 28</span></div>
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "oklch(0.55 0.2 280 / 0.15)" }}><User size={12} style={{ color: "oklch(0.45 0.17 280)" }} /></div>
            </div>
          </div>

          {/* Metric */}
          <div className="rounded-lg border p-3.5" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="flex items-center justify-between mb-0.5">
              <span style={{ color: "oklch(0.55 0.02 260)", fontSize: "12px", fontWeight: 500 }}>Completed</span>
              <CheckCircle size={14} style={{ color: "oklch(0.6 0.15 180)" }} />
            </div>
            <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "26px", fontWeight: 700 }}>247</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="px-1.5 py-0.5 rounded" style={{ background: "oklch(0.65 0.15 180 / 0.1)", color: "oklch(0.45 0.12 180)", fontSize: "10px", fontWeight: 600 }}>+12%</span>
              <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>vs last week</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.94 0.01 260)" }}>
              <div className="h-full rounded-full" style={{ width: "78%", background: "oklch(0.65 0.15 180)" }} />
            </div>
          </div>

          {/* User */}
          <div className="rounded-lg border p-3.5" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.7 0.18 25), oklch(0.55 0.2 280))" }}>
                <span style={{ color: "white", fontSize: "11px", fontWeight: 600 }}>SC</span>
              </div>
              <div>
                <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Sarah Chen</p>
                <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}>Product Designer</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-1.5 rounded-md text-center" style={{ background: "oklch(0.7 0.18 25)", color: "white", fontSize: "12px", fontWeight: 500 }}>Message</button>
              <button className="px-2.5 py-1.5 rounded-md border" style={{ borderColor: "oklch(0.9 0.01 260)" }}><Star size={14} style={{ color: "oklch(0.6 0.02 260)" }} /></button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Tabs</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>Content view navigation.</p>

        <div className="flex border-b" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
          {["Board", "List", "Timeline", "Calendar"].map((tab, i) => (
            <button key={tab} onClick={() => setSelectedTab(i)} className="px-3 py-2 relative"
              style={{ color: selectedTab === i ? "oklch(0.55 0.18 25)" : "oklch(0.55 0.02 260)", fontSize: "13px", fontWeight: selectedTab === i ? 500 : 400 }}>
              {tab}
              {selectedTab === i && <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "oklch(0.7 0.18 25)" }} />}
            </button>
          ))}
        </div>
        <div className="p-4 rounded-b-lg" style={{ background: "oklch(0.985 0.003 260)" }}>
          <p style={{ color: "oklch(0.45 0.02 260)", fontSize: "13px" }}>
            <strong>{["Board", "List", "Timeline", "Calendar"][selectedTab]}</strong> view content area.
          </p>
        </div>
      </section>

      {/* Badges */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Badges & Tags</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>Status indicators and labels.</p>

        <div className="space-y-4">
          <div>
            <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>STATUS</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "In Progress", bg: "oklch(0.55 0.2 280 / 0.1)", fg: "oklch(0.45 0.17 280)" },
                { label: "Completed", bg: "oklch(0.65 0.15 180 / 0.1)", fg: "oklch(0.45 0.12 180)" },
                { label: "Blocked", bg: "oklch(0.7 0.18 25 / 0.1)", fg: "oklch(0.55 0.18 25)" },
                { label: "On Track", bg: "oklch(0.85 0.15 85 / 0.15)", fg: "oklch(0.55 0.12 85)" },
                { label: "Not Started", bg: "oklch(0.94 0.008 260)", fg: "oklch(0.5 0.02 260)" },
              ].map((b) => (
                <span key={b.label} className="px-2 py-0.5 rounded-full" style={{ background: b.bg, color: b.fg, fontSize: "11px", fontWeight: 500 }}>{b.label}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>DOTS</p>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: "Active", color: "oklch(0.65 0.15 180)" },
                { label: "Warning", color: "oklch(0.85 0.15 85)" },
                { label: "Error", color: "oklch(0.7 0.18 25)" },
                { label: "Offline", color: "oklch(0.75 0.015 260)" },
              ].map((d) => (
                <span key={d.label} className="flex items-center gap-1" style={{ fontSize: "12px", color: "oklch(0.4 0.02 260)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />{d.label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>REMOVABLE</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: "Design", bg: "oklch(0.7 0.18 25 / 0.1)", fg: "oklch(0.55 0.18 25)" },
                { label: "Engineering", bg: "oklch(0.55 0.2 280 / 0.1)", fg: "oklch(0.45 0.17 280)" },
                { label: "Marketing", bg: "oklch(0.65 0.15 180 / 0.1)", fg: "oklch(0.45 0.12 180)" },
              ].map((t) => (
                <span key={t.label} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full" style={{ background: t.bg, color: t.fg, fontSize: "11px", fontWeight: 500 }}>
                  {t.label}
                  <button className="p-0.5 rounded-full hover:bg-black/10"><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Alerts</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>System messages and feedback.</p>

        <div className="space-y-2">
          {[
            { type: "Info", Icon: Info, bg: "oklch(0.55 0.2 280 / 0.05)", border: "oklch(0.55 0.2 280 / 0.12)", fg: "oklch(0.4 0.17 280)", text: "Project shared with 3 members." },
            { type: "Success", Icon: CheckCircle, bg: "oklch(0.65 0.15 180 / 0.05)", border: "oklch(0.65 0.15 180 / 0.12)", fg: "oklch(0.4 0.12 180)", text: "Task completed successfully." },
            { type: "Warning", Icon: WarningCircle, bg: "oklch(0.85 0.15 85 / 0.08)", border: "oklch(0.85 0.15 85 / 0.15)", fg: "oklch(0.5 0.12 85)", text: "Trial expires in 3 days." },
            { type: "Error", Icon: WarningCircle, bg: "oklch(0.7 0.18 25 / 0.05)", border: "oklch(0.7 0.18 25 / 0.12)", fg: "oklch(0.5 0.17 25)", text: "Failed to save. Try again." },
          ].map((a) => (
            <div key={a.type} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border" style={{ background: a.bg, borderColor: a.border }}>
              <a.Icon size={16} className="shrink-0" style={{ color: a.fg }} />
              <div className="flex-1 min-w-0">
                <span style={{ color: a.fg, fontSize: "12px", fontWeight: 600 }}>{a.type} </span>
                <span style={{ color: a.fg, fontSize: "12px", opacity: 0.85 }}>{a.text}</span>
              </div>
              <button className="p-0.5 rounded hover:bg-black/[0.05]"><X size={12} style={{ color: a.fg }} /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Avatars & Icon Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
          <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Avatars</h2>
          <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>User representation.</p>
          <div className="flex items-end gap-2.5 mb-4">
            {[
              { size: 20, text: "7px", i: "A" }, { size: 24, text: "8px", i: "BK" },
              { size: 32, text: "10px", i: "SC" }, { size: 40, text: "13px", i: "JM" },
            ].map((a) => (
              <div key={a.size} className="rounded-full flex items-center justify-center" style={{ width: a.size, height: a.size, background: "linear-gradient(135deg, oklch(0.7 0.18 25), oklch(0.6 0.2 280))" }}>
                <span style={{ color: "white", fontSize: a.text, fontWeight: 600 }}>{a.i}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {[{ i: "SC", bg: "oklch(0.7 0.18 25)" }, { i: "JM", bg: "oklch(0.55 0.2 280)" }, { i: "LP", bg: "oklch(0.65 0.15 180)" }, { i: "AK", bg: "oklch(0.8 0.15 85)" }].map((a, idx) => (
                <div key={idx} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center" style={{ background: a.bg }}>
                  <span style={{ color: "white", fontSize: "9px", fontWeight: 600 }}>{a.i}</span>
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center" style={{ background: "oklch(0.94 0.008 260)" }}>
                <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "9px", fontWeight: 600 }}>+5</span>
              </div>
            </div>
            <span className="ml-2" style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>9 members</span>
          </div>
        </section>

        <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
          <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Icon Buttons</h2>
          <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>Compact action triggers.</p>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button className="p-1.5 rounded-md hover:bg-black/[0.04]" style={{ color: "oklch(0.45 0.02 260)" }}><Bell size={16} /></button>
              <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: "oklch(0.7 0.18 25)" }}>
                <span style={{ color: "white", fontSize: "8px", fontWeight: 700 }}>3</span>
              </div>
            </div>
            <button className="p-1.5 rounded-md hover:bg-black/[0.04]" style={{ color: "oklch(0.45 0.02 260)" }}><MagnifyingGlass size={16} /></button>
            <button className="p-1.5 rounded-md hover:bg-black/[0.04]" style={{ color: "oklch(0.45 0.02 260)" }}><Plus size={16} /></button>
            <button className="p-1.5 rounded-md hover:bg-black/[0.04]" style={{ color: "oklch(0.45 0.02 260)" }}><DotsThree size={16} /></button>
          </div>
        </section>
      </div>

      {/* Time Tracking */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Time Tracking</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Timer controls, logged time entries, and time summaries for tasks and projects.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Active Timer */}
          <div>
            <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>ACTIVE TIMER</p>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
              <div className="px-4 py-3" style={{ background: "oklch(0.7 0.18 25 / 0.04)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "oklch(0.7 0.18 25)" }} />
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "oklch(0.55 0.18 25)", letterSpacing: "0.02em" }}>TRACKING</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "oklch(0.5 0.02 260)" }}>Started 2:14 PM</span>
                </div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "oklch(0.2 0.02 260)" }}>Modal & Dialog system</p>
                <p style={{ fontSize: "11px", color: "oklch(0.5 0.02 260)", marginTop: "2px" }}>Atlas Design System · Components</p>
              </div>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid oklch(0.93 0.01 260)" }}>
                <div className="flex items-center gap-2">
                  <Timer size={16} weight="fill" style={{ color: "oklch(0.7 0.18 25)" }} />
                  <span style={{ fontSize: "24px", fontWeight: 700, color: "oklch(0.2 0.02 260)", fontVariantNumeric: "tabular-nums" }}>01:47:32</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/[0.04] transition-colors" style={{ border: "1px solid oklch(0.9 0.01 260)" }}>
                    <Pause size={14} weight="fill" style={{ color: "oklch(0.4 0.02 260)" }} />
                  </button>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "oklch(0.6 0.22 25)", color: "white" }}>
                    <Stop size={14} weight="fill" />
                  </button>
                </div>
              </div>
            </div>

            {/* Idle / Start state */}
            <div className="mt-3 rounded-xl border px-4 py-3 flex items-center justify-between" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
              <div className="flex items-center gap-2.5">
                <Timer size={16} style={{ color: "oklch(0.6 0.02 260)" }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "oklch(0.35 0.02 260)" }}>Start timer</p>
                  <p style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>No active timer</p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: "oklch(0.7 0.18 25)", color: "white" }}>
                <Play size={14} weight="fill" />
              </button>
            </div>
          </div>

          {/* Time Entries Log */}
          <div>
            <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>TIME ENTRIES</p>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
              {[
                { task: "Color token scale — dark mode", person: "Nina A.", duration: "2h 15m", date: "Today", color: "oklch(0.7 0.18 25)" },
                { task: "Input, Select, Checkbox, Radio", person: "Mei C.", duration: "3h 40m", date: "Today", color: "oklch(0.55 0.2 280)" },
                { task: "Navigation — sidebar, tabs", person: "Mei C.", duration: "1h 20m", date: "Yesterday", color: "oklch(0.55 0.2 280)" },
                { task: "Accessibility audit", person: "Sara L.", duration: "4h 05m", date: "Yesterday", color: "oklch(0.65 0.15 180)" },
              ].map((entry, i) => (
                <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-black/[0.015] transition-colors" style={{ borderBottom: i < 3 ? "1px solid oklch(0.95 0.005 260)" : "none" }}>
                  <div className="w-[3px] h-7 rounded-full shrink-0" style={{ background: entry.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontSize: "12px", fontWeight: 500, color: "oklch(0.2 0.02 260)" }}>{entry.task}</p>
                    <p style={{ fontSize: "10px", color: "oklch(0.6 0.02 260)" }}>{entry.person} · {entry.date}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock size={12} style={{ color: "oklch(0.6 0.02 260)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "oklch(0.35 0.02 260)", fontVariantNumeric: "tabular-nums" }}>{entry.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task time summary bar */}
        <div className="mt-5">
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>TASK TIME SUMMARY</p>
          <div className="rounded-xl border px-4 py-3.5" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Timer size={15} style={{ color: "oklch(0.5 0.02 260)" }} />
                <span style={{ fontSize: "13px", fontWeight: 500, color: "oklch(0.25 0.02 260)" }}>Input, Select, Checkbox, Radio</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>Logged </span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "oklch(0.25 0.02 260)" }}>14h 20m</span>
                  <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}> / 20h est.</span>
                </div>
              </div>
            </div>
            {/* Stacked bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden gap-px" style={{ background: "oklch(0.94 0.008 260)" }}>
              <div className="rounded-l-full" style={{ width: "28%", background: "oklch(0.55 0.2 280)" }} title="Mei C. — 5h 40m" />
              <div style={{ width: "22%", background: "oklch(0.7 0.18 25)" }} title="Nina A. — 4h 30m" />
              <div style={{ width: "14%", background: "oklch(0.65 0.15 180)" }} title="Sara L. — 2h 50m" />
              <div style={{ width: "8%", background: "oklch(0.78 0.15 85)" }} title="Andre D. — 1h 20m" />
            </div>
            <div className="flex flex-wrap gap-3 mt-2.5">
              {[
                { name: "Mei C.", time: "5h 40m", color: "oklch(0.55 0.2 280)" },
                { name: "Nina A.", time: "4h 30m", color: "oklch(0.7 0.18 25)" },
                { name: "Sara L.", time: "2h 50m", color: "oklch(0.65 0.15 180)" },
                { name: "Andre D.", time: "1h 20m", color: "oklch(0.78 0.15 85)" },
              ].map((p) => (
                <div key={p.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                  <span style={{ fontSize: "11px", color: "oklch(0.5 0.02 260)" }}>{p.name}</span>
                  <span style={{ fontSize: "11px", fontWeight: 600, color: "oklch(0.35 0.02 260)" }}>{p.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inline time badge variants */}
        <div className="mt-5">
          <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>INLINE BADGES</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full" style={{ background: "oklch(0.7 0.18 25 / 0.08)", fontSize: "11px", fontWeight: 500, color: "oklch(0.55 0.18 25)" }}>
              <Timer size={11} weight="bold" /> 1h 47m
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full" style={{ background: "oklch(0.65 0.15 180 / 0.08)", fontSize: "11px", fontWeight: 500, color: "oklch(0.5 0.12 180)" }}>
              <Clock size={11} /> 4h 05m logged
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full" style={{ background: "oklch(0.78 0.15 85 / 0.1)", fontSize: "11px", fontWeight: 500, color: "oklch(0.6 0.12 85)" }}>
              <Timer size={11} /> 8h est.
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full" style={{ background: "oklch(0.6 0.22 25 / 0.08)", fontSize: "11px", fontWeight: 600, color: "oklch(0.55 0.2 25)" }}>
              <WarningCircle size={11} weight="bold" /> Over by 2h
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-[3px] rounded-full animate-pulse" style={{ background: "oklch(0.7 0.18 25 / 0.06)", fontSize: "11px", fontWeight: 500, color: "oklch(0.55 0.18 25)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.7 0.18 25)" }} /> Tracking…
            </span>
          </div>
        </div>
      </section>

      {/* Status Updates */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Status Updates</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Project status dialog and activity timeline — Asana-style status reporting.
        </p>

        <div className="space-y-4">
          {/* ── Status Update Dialog ── */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            {/* Dialog header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
              <h3 style={{ color: "oklch(0.2 0.02 260)", fontSize: "14px", fontWeight: 600 }}>
                Status of Norwalt (New Jersey) Case Study
              </h3>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded hover:bg-black/[0.04]"><Bell size={16} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
                <button className="px-3 py-1 rounded-md border flex items-center gap-1.5" style={{ borderColor: "oklch(0.88 0.01 260)", color: "oklch(0.35 0.02 260)", fontSize: "12px", fontWeight: 500 }}>
                  Update status <CaretDown size={12} />
                </button>
                <button className="p-1 rounded hover:bg-black/[0.04]"><X size={16} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
              </div>
            </div>
            {/* Dialog body — sidebar + content */}
            <div className="flex">
              {/* Timeline sidebar */}
              <div className="w-52 shrink-0 border-r py-2" style={{ borderColor: "oklch(0.92 0.01 260)", background: "oklch(0.985 0.003 260)" }}>
                <div className="px-3 py-2 rounded-md mx-2" style={{ background: "oklch(0.55 0.2 280 / 0.06)" }}>
                  <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 500 }}>Pre-Production Meeting Set</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span style={{ color: "oklch(0.55 0.02 260)", fontSize: "10px" }}>Jan 5</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.65 0.15 180)" }} />
                    <span style={{ color: "oklch(0.45 0.12 180)", fontSize: "10px", fontWeight: 500 }}>On track</span>
                  </div>
                </div>
              </div>
              {/* Main content */}
              <div className="flex-1 min-w-0">
                {/* Color bar */}
                <div className="h-1" style={{ background: "oklch(0.65 0.15 180)" }} />
                <div className="p-4 space-y-4">
                  {/* Title */}
                  <h4 style={{ color: "oklch(0.2 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Pre-Production Meeting Set</h4>
                  {/* Author */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "oklch(0.7 0.18 25)" }}>
                      <span style={{ color: "white", fontSize: "9px", fontWeight: 600 }}>DP</span>
                    </div>
                    <div>
                      <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 500 }}>Dane Pedersen</span>
                      <span style={{ color: "oklch(0.55 0.02 260)", fontSize: "12px" }}> · Jan 5</span>
                    </div>
                  </div>
                  {/* Action toolbar */}
                  <div className="flex items-center gap-1 justify-end -mt-2">
                    <button className="p-1 rounded hover:bg-black/[0.04]"><Smiley size={16} style={{ color: "oklch(0.6 0.02 260)" }} /></button>
                    <button className="p-1 rounded hover:bg-black/[0.04]"><LinkSimple size={16} style={{ color: "oklch(0.6 0.02 260)" }} /></button>
                    <button className="p-1 rounded hover:bg-black/[0.04]"><ArrowsOut size={16} style={{ color: "oklch(0.6 0.02 260)" }} /></button>
                    <button className="p-1 rounded hover:bg-black/[0.04]"><DotsThree size={16} style={{ color: "oklch(0.6 0.02 260)" }} /></button>
                  </div>
                  {/* Metadata fields */}
                  <div className="space-y-2">
                    {[
                      { label: "Status", value: <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.65 0.15 180)" }} /><span style={{ color: "oklch(0.45 0.12 180)", fontSize: "12px", fontWeight: 500 }}>On track</span></span> },
                      { label: "Project", value: <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "oklch(0.7 0.18 25)" }} /><span style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px" }}>Norwalt (New Jersey) Case Study</span></span> },
                      { label: "Owner", value: <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px" }}>Dane Pedersen</span> },
                      { label: "Current Stage", value: <span className="px-2 py-0.5 rounded-full" style={{ background: "oklch(0.65 0.15 180 / 0.12)", color: "oklch(0.45 0.12 180)", fontSize: "11px", fontWeight: 500 }}>Incoming</span> },
                      { label: "Work Type", value: <span className="px-2 py-0.5 rounded" style={{ background: "oklch(0.55 0.2 280 / 0.08)", color: "oklch(0.45 0.17 280)", fontSize: "11px", fontWeight: 500, border: "1px solid oklch(0.55 0.2 280 / 0.15)" }}>Video - Production</span> },
                      { label: "Client", value: <span className="px-2 py-0.5 rounded" style={{ background: "oklch(0.7 0.18 25 / 0.08)", color: "oklch(0.55 0.18 25)", fontSize: "11px", fontWeight: 500, border: "1px solid oklch(0.7 0.18 25 / 0.15)" }}>Beckhoff</span> },
                    ].map((field) => (
                      <div key={field.label} className="grid grid-cols-[88px_1fr] gap-2 items-center">
                        <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px" }}>{field.label}</span>
                        {field.value}
                      </div>
                    ))}
                  </div>
                  {/* Summary */}
                  <div>
                    <h5 style={{ color: "oklch(0.2 0.02 260)", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Summary</h5>
                    <p style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", lineHeight: 1.6 }}>Meeting set for the morning of January 13th</p>
                  </div>
                  {/* Next steps */}
                  <div>
                    <h5 style={{ color: "oklch(0.2 0.02 260)", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Next steps</h5>
                    <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px", fontStyle: "italic" }}>No next steps added yet</p>
                  </div>
                </div>
                {/* Reply area with formatting toolbar */}
                <div className="px-4 py-3" style={{ background: "oklch(0.97 0.003 260)" }}>
                  <div className="flex items-start gap-3">
                    <img src={avatarPhotos.dp} alt="User" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
                    <div className="flex-1 rounded-lg border overflow-hidden" style={{ borderColor: "oklch(0.9 0.01 260)", background: "white" }}>
                      <textarea
                        placeholder="Reply to message..."
                        rows={3}
                        className="w-full px-3.5 py-2.5 outline-none resize-none"
                        style={{ fontSize: "13px", color: "oklch(0.2 0.02 260)" }}
                      />
                      <FormattingToolbar />
                    </div>
                  </div>
                </div>
                {/* Typing indicator */}
                <TypingIndicator />
                {/* Collaborators footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: "oklch(0.92 0.01 260)", background: "oklch(0.97 0.003 260)" }}>
                  <div className="flex items-center gap-2.5">
                    <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px" }}>Collaborators</span>
                    <div className="flex -space-x-2">
                      <img src={avatarPhotos.dp} alt="DP" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                      <img src={avatarPhotos.kr} alt="KR" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                      <div className="w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: "oklch(0.82 0.01 260)" }}>
                        <User size={14} style={{ color: "oklch(0.7 0.01 260)" }} />
                      </div>
                    </div>
                    <button className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "oklch(0.94 0.008 260)" }}>
                      <Plus size={12} style={{ color: "oklch(0.5 0.02 260)" }} />
                    </button>
                  </div>
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-black/[0.03]" style={{ color: "oklch(0.4 0.02 260)", fontSize: "12px" }}>
                    <Bell size={14} /> Join
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Activity Timeline ── */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            {/* Timeline header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: "oklch(0.65 0.15 180)" }} />
                  <span style={{ color: "oklch(0.45 0.12 180)", fontSize: "13px", fontWeight: 600 }}>On track</span>
                </span>
              </div>
              <button className="px-3 py-1 rounded-md border flex items-center gap-1.5" style={{ borderColor: "oklch(0.88 0.01 260)", color: "oklch(0.35 0.02 260)", fontSize: "12px", fontWeight: 500 }}>
                Update status <CaretDown size={12} />
              </button>
            </div>
            {/* Latest status card */}
            <div className="mx-4 mt-4">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
                <div className="h-1" style={{ background: "oklch(0.65 0.15 180)" }} />
                <div className="p-3.5 space-y-2">
                  <h4 style={{ color: "oklch(0.2 0.02 260)", fontSize: "14px", fontWeight: 600 }}>Pre-Production Meeting Set</h4>
                  <div>
                    <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 600, marginBottom: "2px" }}>Summary</p>
                    <p style={{ color: "oklch(0.4 0.02 260)", fontSize: "12px", lineHeight: 1.5 }}>Meeting set for the morning of January 13th</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "oklch(0.7 0.18 25)" }}>
                        <span style={{ color: "white", fontSize: "8px", fontWeight: 600 }}>DP</span>
                      </div>
                      <div>
                        <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "11px", fontWeight: 500 }}>Dane Pedersen</span>
                        <span style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}> · Jan 5</span>
                      </div>
                    </div>
                    <button className="p-1 rounded hover:bg-black/[0.04]"><Smiley size={14} style={{ color: "oklch(0.6 0.02 260)" }} /></button>
                  </div>
                </div>
              </div>
            </div>
            {/* Timeline entries */}
            <div className="px-4 py-3 space-y-0">
              {[
                {
                  icon: <CalendarBlank size={16} style={{ color: "oklch(0.6 0.02 260)" }} />,
                  content: <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px" }}>No due date</span>,
                  line: true,
                },
                {
                  icon: <ChatCircle size={16} style={{ color: "oklch(0.55 0.2 280)" }} />,
                  content: <span style={{ color: "oklch(0.45 0.17 280)", fontSize: "12px", fontWeight: 500 }}>Send message to members</span>,
                  line: true,
                },
                {
                  icon: <span className="w-3 h-3 rounded-full" style={{ background: "oklch(0.65 0.15 180)" }} />,
                  content: (
                    <div>
                      <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 500 }}>Pre-Production Meeting Set</p>
                      <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}>Dane Pedersen · Jan 5</p>
                    </div>
                  ),
                  line: true,
                },
                {
                  icon: <UsersThree size={16} style={{ color: "oklch(0.6 0.02 260)" }} />,
                  content: (
                    <div>
                      <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 500 }}>You, Krista Rose Koester, and 2 others joined</p>
                      <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}>Nov 21, 2025</p>
                      <div className="flex -space-x-1.5 mt-1.5">
                        {[{ i: "YO", bg: "oklch(0.55 0.2 280)" }, { i: "KR", bg: "oklch(0.65 0.15 180)" }, { i: "JM", bg: "oklch(0.8 0.15 85)" }, { i: "SC", bg: "oklch(0.7 0.18 25)" }].map((a, idx) => (
                          <div key={idx} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ background: a.bg }}>
                            <span style={{ color: "white", fontSize: "7px", fontWeight: 600 }}>{a.i}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                  line: true,
                },
                {
                  icon: <UsersThree size={16} style={{ color: "oklch(0.6 0.02 260)" }} />,
                  content: (
                    <div>
                      <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 500 }}>Foreword team joined</p>
                      <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}>Nov 21, 2025</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="flex -space-x-1.5">
                          {[{ i: "LP", bg: "oklch(0.7 0.17 350)" }, { i: "BK", bg: "oklch(0.6 0.15 320)" }, { i: "AK", bg: "oklch(0.8 0.15 85)" }, { i: "JG", bg: "oklch(0.55 0.2 280)" }].map((a, idx) => (
                            <div key={idx} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center" style={{ background: a.bg }}>
                              <span style={{ color: "white", fontSize: "7px", fontWeight: 600 }}>{a.i}</span>
                            </div>
                          ))}
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full" style={{ background: "oklch(0.94 0.008 260)", color: "oklch(0.5 0.02 260)", fontSize: "10px", fontWeight: 600 }}>10</span>
                      </div>
                    </div>
                  ),
                  line: true,
                },
                {
                  icon: <ClipboardText size={16} style={{ color: "oklch(0.6 0.02 260)" }} />,
                  content: (
                    <div>
                      <p style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 500 }}>Project created from Beckhoff Case Study</p>
                      <p style={{ color: "oklch(0.55 0.02 260)", fontSize: "11px" }}>Dane Pedersen · Nov 21, 2025</p>
                    </div>
                  ),
                  line: false,
                },
              ].map((entry, idx) => (
                <div key={idx} className="flex gap-3">
                  {/* Timeline rail */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0" style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}>
                      {entry.icon}
                    </div>
                    {entry.line && <div className="w-px flex-1 my-1" style={{ background: "oklch(0.92 0.01 260)" }} />}
                  </div>
                  {/* Content */}
                  <div className="pb-4 pt-1.5">{entry.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Attachments</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Files, links, images, and media attached to tasks and projects.
        </p>

        {/* Upload dropzone */}
        <div className="rounded-xl border-2 border-dashed p-6 mb-5 flex flex-col items-center justify-center gap-2 transition-colors hover:border-[oklch(0.7_0.18_25)] cursor-pointer" style={{ borderColor: "oklch(0.88 0.01 260)", background: "oklch(0.985 0.003 260)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "oklch(0.7 0.18 25 / 0.08)" }}>
            <Paperclip size={20} style={{ color: "oklch(0.55 0.18 25)" }} />
          </div>
          <p style={{ color: "oklch(0.3 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Drop files here or <span style={{ color: "oklch(0.55 0.18 25)", textDecoration: "underline", textUnderlineOffset: "2px", cursor: "pointer" }}>browse</span></p>
          <p style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>PDF, DOC, PNG, JPG, MP4, CSV up to 25 MB</p>
        </div>

        {/* Compact chip cards */}
        <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>COMPACT</p>
        <div className="flex flex-wrap gap-2.5 mb-5">
          {/* Video chip */}
          <button className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-xl border hover:shadow-md hover:border-transparent transition-all" style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.94 0.01 260)" }}>
              <MonitorPlay size={18} style={{ color: "oklch(0.6 0.02 260)" }} />
            </div>
            <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Untitled Video</span>
          </button>

          {/* Link chip */}
          <button className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-xl border hover:shadow-md hover:border-transparent transition-all" style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.94 0.01 260)" }}>
              <MonitorPlay size={18} style={{ color: "oklch(0.55 0.18 25)" }} />
            </div>
            <div className="text-left min-w-0">
              <span className="block truncate" style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500, maxWidth: "160px" }}>https://www.youtu...</span>
              <span className="block" style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>www.youtube.com</span>
            </div>
          </button>

          {/* Image gallery chip */}
          <button className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-xl border hover:shadow-md hover:border-transparent transition-all" style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}>
            <img
              src="https://images.unsplash.com/photo-1758238338031-ed9f03022aa1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnaXJhZmZlJTIwcG9ydHJhaXQlMjBjbG9zZSUyMHdpbGRsaWZlfGVufDF8fHx8MTc3MTk2OTM2MXww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Gallery thumbnail"
              className="w-9 h-9 rounded-lg object-cover shrink-0"
            />
            <div className="text-left">
              <span className="block" style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Image Gallery</span>
              <span className="block" style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>7 images</span>
            </div>
          </button>

          {/* Spreadsheet/details chip */}
          <button className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-xl border hover:shadow-md hover:border-transparent transition-all" style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.92 0.15 180 / 0.25)" }}>
              <Table size={18} style={{ color: "oklch(0.5 0.15 180)" }} />
            </div>
            <div className="text-left">
              <span className="block" style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Travel Details</span>
              <span className="block" style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>6 items · $5,840.41</span>
            </div>
          </button>

          {/* PDF chip */}
          <button className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-xl border hover:shadow-md hover:border-transparent transition-all" style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.6 0.22 25 / 0.08)" }}>
              <FilePdf size={18} style={{ color: "oklch(0.6 0.22 25)" }} />
            </div>
            <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Brand Guide.pdf</span>
          </button>

          {/* Multi-image chip */}
          <button className="flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-xl border hover:shadow-md hover:border-transparent transition-all" style={{ borderColor: "oklch(0.92 0.01 260)", background: "white" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "oklch(0.55 0.2 280 / 0.08)" }}>
              <Images size={18} style={{ color: "oklch(0.55 0.2 280)" }} />
            </div>
            <div className="text-left">
              <span className="block" style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 500 }}>Screenshots</span>
              <span className="block" style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>12 files · 8.4 MB</span>
            </div>
          </button>
        </div>

        {/* Grid of attachment cards */}
        <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>CARDS</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          {/* Image attachment */}
          <div className="rounded-lg border overflow-hidden group" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="relative h-[120px] overflow-hidden" style={{ background: "oklch(0.96 0.005 260)" }}>
              <img src="https://images.unsplash.com/photo-1743862558369-5dcea79ccbff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBkYXNoYm9hcmQlMjB1aSUyMHdpcmVmcmFtZXxlbnwxfHx8fDE3NzE5NjgzOTd8MA&ixlib=rb-4.1.0&q=80&w=1080" alt="Dashboard wireframe" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><Eye size={14} style={{ color: "oklch(0.3 0.02 260)" }} /></button>
                <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><DownloadSimple size={14} style={{ color: "oklch(0.3 0.02 260)" }} /></button>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Image size={14} weight="fill" style={{ color: "oklch(0.55 0.2 280)" }} />
                <span className="flex-1 min-w-0 truncate" style={{ fontSize: "12px", fontWeight: 500, color: "oklch(0.25 0.02 260)" }}>dashboard-wireframe-v3.png</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>2.4 MB · PNG</span>
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>·</span>
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>Sarah Chen · 2h ago</span>
              </div>
            </div>
          </div>

          {/* Photo attachment */}
          <div className="rounded-lg border overflow-hidden group" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="relative h-[120px] overflow-hidden" style={{ background: "oklch(0.96 0.005 260)" }}>
              <img src="https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwZGVzaWduJTIwbW9ja3VwJTIwc2NyZWVuc2hvdHxlbnwxfHx8fDE3NzE5NjgzOTR8MA&ixlib=rb-4.1.0&q=80&w=1080" alt="Design mockup" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><Eye size={14} style={{ color: "oklch(0.3 0.02 260)" }} /></button>
                <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><DownloadSimple size={14} style={{ color: "oklch(0.3 0.02 260)" }} /></button>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Image size={14} weight="fill" style={{ color: "oklch(0.65 0.15 180)" }} />
                <span className="flex-1 min-w-0 truncate" style={{ fontSize: "12px", fontWeight: 500, color: "oklch(0.25 0.02 260)" }}>hero-mockup-final.jpg</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>1.8 MB · JPG</span>
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>·</span>
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>Krista Rose · 1d ago</span>
              </div>
            </div>
          </div>

          {/* Video attachment */}
          <div className="rounded-lg border overflow-hidden group" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="relative h-[120px] flex items-center justify-center" style={{ background: "oklch(0.15 0.02 260)" }}>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Play size={18} weight="fill" style={{ color: "white" }} />
              </div>
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-white" style={{ background: "rgba(0,0,0,0.6)", fontSize: "10px", fontWeight: 500 }}>2:34</span>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><Eye size={14} style={{ color: "oklch(0.3 0.02 260)" }} /></button>
                <button className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white"><DownloadSimple size={14} style={{ color: "oklch(0.3 0.02 260)" }} /></button>
              </div>
            </div>
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <VideoCamera size={14} weight="fill" style={{ color: "oklch(0.7 0.18 25)" }} />
                <span className="flex-1 min-w-0 truncate" style={{ fontSize: "12px", fontWeight: 500, color: "oklch(0.25 0.02 260)" }}>prototype-walkthrough.mp4</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>18.2 MB · MP4</span>
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>·</span>
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>James Miller · 3h ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* List-style file attachments */}
        <p className="mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>FILES</p>
        <div className="rounded-lg border overflow-hidden divide-y" style={{ borderColor: "oklch(0.92 0.01 260)", borderWidth: "1px" }}>
          {([
            { icon: FilePdf, iconColor: "oklch(0.6 0.22 25)", name: "brand-guidelines-v2.pdf", size: "4.2 MB", type: "PDF", uploader: "Dane Pedersen", time: "2d ago" },
            { icon: FileDoc, iconColor: "oklch(0.55 0.2 280)", name: "project-brief.docx", size: "320 KB", type: "DOCX", uploader: "Sarah Chen", time: "3d ago" },
            { icon: FileCsv, iconColor: "oklch(0.5 0.15 150)", name: "analytics-export-jan.csv", size: "1.1 MB", type: "CSV", uploader: "James Miller", time: "5d ago" },
            { icon: FileText, iconColor: "oklch(0.55 0.02 260)", name: "meeting-notes-sprint4.txt", size: "12 KB", type: "TXT", uploader: "Krista Rose", time: "1w ago" },
          ] as const).map((file) => (
            <div key={file.name} className="flex items-center gap-3 px-4 py-3 group hover:bg-black/[0.01] transition-colors" style={{ borderColor: "oklch(0.94 0.005 260)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${file.iconColor}10` }}>
                <file.icon size={18} weight="fill" style={{ color: file.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block truncate" style={{ fontSize: "13px", fontWeight: 500, color: "oklch(0.25 0.02 260)" }}>{file.name}</span>
                <span style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>{file.size} · {file.type} · {file.uploader} · {file.time}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 rounded hover:bg-black/[0.04]" title="Preview"><Eye size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
                <button className="p-1.5 rounded hover:bg-black/[0.04]" title="Download"><DownloadSimple size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
                <button className="p-1.5 rounded hover:bg-black/[0.04]" title="More"><DotsThree size={14} style={{ color: "oklch(0.5 0.02 260)" }} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Link attachments */}
        <p className="mt-5 mb-2" style={{ color: "oklch(0.4 0.02 260)", fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em" }}>LINKS</p>
        <div className="rounded-lg border overflow-hidden divide-y" style={{ borderColor: "oklch(0.92 0.01 260)", borderWidth: "1px" }}>
          {([
            { name: "Figma — Dashboard Design", url: "figma.com/file/abc123", favicon: "oklch(0.55 0.2 280)", desc: "Latest high-fidelity mockups for the dashboard redesign" },
            { name: "Google Docs — PRD", url: "docs.google.com/d/xyz789", favicon: "oklch(0.55 0.17 250)", desc: "Product requirements document for Q1 sprint" },
            { name: "Loom — Design Review", url: "loom.com/share/demo456", favicon: "oklch(0.55 0.2 300)", desc: "Recorded walkthrough of the new navigation patterns" },
          ] as const).map((link) => (
            <div key={link.name} className="flex items-center gap-3 px-4 py-3 group hover:bg-black/[0.01] transition-colors cursor-pointer" style={{ borderColor: "oklch(0.94 0.005 260)" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${link.favicon}10` }}>
                <Globe size={18} style={{ color: link.favicon }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "oklch(0.25 0.02 260)" }}>{link.name}</span>
                  <ArrowSquareOut size={11} style={{ color: "oklch(0.6 0.02 260)" }} />
                </div>
                <span className="block truncate" style={{ fontSize: "11px", color: "oklch(0.6 0.02 260)" }}>{link.desc}</span>
                <span style={{ fontSize: "10px", color: "oklch(0.7 0.02 260)" }}>{link.url}</span>
              </div>
              <button className="p-1.5 rounded hover:bg-black/[0.04] opacity-0 group-hover:opacity-100 transition-opacity" title="More">
                <DotsThree size={14} style={{ color: "oklch(0.5 0.02 260)" }} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: "oklch(0.94 0.005 260)" }}>
          <span style={{ fontSize: "12px", color: "oklch(0.55 0.02 260)" }}>10 attachments · 27.3 MB total</span>
          <button className="flex items-center gap-1 px-3 py-1 rounded-md hover:bg-black/[0.03]" style={{ color: "oklch(0.55 0.18 25)", fontSize: "12px", fontWeight: 500 }}>
            View all <CaretRight size={12} />
          </button>
        </div>
      </section>

      {/* Comments */}
      <section className="rounded-xl p-5 md:p-6 border" style={{ background: "white", borderColor: "oklch(0.92 0.01 260)" }}>
        <h2 style={{ color: "oklch(0.25 0.02 260)", fontSize: "16px", fontWeight: 600 }}>Comments</h2>
        <p className="mt-0.5 mb-4" style={{ color: "oklch(0.55 0.02 260)", fontSize: "13px" }}>
          Threaded comment sections for task and project discussions.
        </p>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
          {/* Existing comments thread */}
          <div className="divide-y" style={{ borderColor: "oklch(0.94 0.005 260)" }}>
            {/* Comment 1 — standard */}
            <div className="px-4 py-3.5">
              <div className="flex gap-3">
                <img src={avatarPhotos.sc} alt="Sarah Chen" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 600 }}>Sarah Chen</span>
                    <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>2 hours ago</span>
                  </div>
                  <p className="mt-1" style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", lineHeight: 1.6 }}>
                    I've updated the homepage mockups based on last week's feedback. The hero section now uses the new illustration style. Can everyone take a look before our review tomorrow?
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>
                      <Smiley size={12} /> React
                    </button>
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>
                      <ChatCircle size={12} /> Reply
                    </button>
                  </div>
                  {/* Threaded reply */}
                  <div className="mt-3 ml-1 pl-4 border-l-2" style={{ borderColor: "oklch(0.92 0.01 260)" }}>
                    <div className="flex gap-3">
                      <img src={avatarPhotos.jm} alt="James Miller" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "12px", fontWeight: 600 }}>James Miller</span>
                          <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "10px" }}>1 hour ago</span>
                        </div>
                        <p className="mt-0.5" style={{ color: "oklch(0.35 0.02 260)", fontSize: "12px", lineHeight: 1.5 }}>
                          Looks great! The illustration style is a big improvement. One small note — can we bump up the CTA button contrast slightly?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment 2 — with reaction + @mention */}
            <div className="px-4 py-3.5">
              <div className="flex gap-3">
                <img src={avatarPhotos.kr} alt="Krista Rose" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 600 }}>Krista Rose</span>
                    <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>45 min ago</span>
                  </div>
                  <p className="mt-1" style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", lineHeight: 1.6 }}>
                    I've assigned the remaining QA tasks. <span style={{ color: "oklch(0.45 0.17 280)", fontWeight: 500 }}>@James</span> can you handle the mobile breakpoints?
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "oklch(0.7 0.18 25 / 0.08)", fontSize: "11px" }}>
                      <span style={{ fontSize: "12px" }}>&#128077;</span> <span style={{ color: "oklch(0.5 0.02 260)" }}>2</span>
                    </span>
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>
                      <Smiley size={12} /> React
                    </button>
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>
                      <ChatCircle size={12} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment 3 — Pinned */}
            <div className="px-4 py-3.5" style={{ background: "oklch(0.85 0.15 85 / 0.04)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <PushPin size={12} weight="fill" style={{ color: "oklch(0.6 0.12 85)" }} />
                <span style={{ color: "oklch(0.55 0.1 85)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.03em" }}>PINNED</span>
              </div>
              <div className="flex gap-3">
                <img src={avatarPhotos.dp} alt="Dane Pedersen" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "oklch(0.2 0.02 260)", fontSize: "13px", fontWeight: 600 }}>Dane Pedersen</span>
                    <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>Yesterday</span>
                    <PushPin size={12} weight="fill" style={{ color: "oklch(0.65 0.12 85)" }} />
                  </div>
                  <p className="mt-1" style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", lineHeight: 1.6 }}>
                    Reminder: all final assets need to be uploaded to the shared drive by EOD Friday. Please flag any blockers in the #design channel.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "oklch(0.85 0.15 85 / 0.12)", fontSize: "11px" }}>
                      <span style={{ fontSize: "12px" }}>&#128204;</span> <span style={{ color: "oklch(0.5 0.02 260)" }}>1</span>
                    </span>
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>
                      <Smiley size={12} /> React
                    </button>
                    <button className="flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-black/[0.03]" style={{ color: "oklch(0.5 0.02 260)", fontSize: "11px" }}>
                      <ChatCircle size={12} /> Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comment 4 — Resolved */}
            <div className="px-4 py-3.5" style={{ background: "oklch(0.65 0.15 180 / 0.03)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={12} weight="fill" style={{ color: "oklch(0.5 0.12 180)" }} />
                <span style={{ color: "oklch(0.45 0.1 180)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.03em" }}>RESOLVED</span>
              </div>
              <div className="flex gap-3">
                <img src={avatarPhotos.jm} alt="James Miller" className="w-8 h-8 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ color: "oklch(0.35 0.02 260)", fontSize: "13px", fontWeight: 600 }}>James Miller</span>
                    <span style={{ color: "oklch(0.6 0.02 260)", fontSize: "11px" }}>3 hours ago</span>
                    <CheckCircle size={12} weight="fill" style={{ color: "oklch(0.55 0.12 180)" }} />
                  </div>
                  <p className="mt-1" style={{ color: "oklch(0.5 0.02 260)", fontSize: "13px", lineHeight: 1.6, textDecoration: "line-through", textDecorationColor: "oklch(0.8 0.02 260)" }}>
                    The footer links are broken on the staging build — looks like the router config needs updating.
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <CheckCircle size={11} style={{ color: "oklch(0.55 0.12 180)" }} />
                    <span style={{ color: "oklch(0.5 0.1 180)", fontSize: "11px" }}>Resolved by Sarah Chen · 1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reply area with formatting toolbar */}
          <div className="px-4 py-3 border-t" style={{ background: "oklch(0.97 0.003 260)", borderColor: "oklch(0.92 0.01 260)" }}>
            <div className="flex items-start gap-3">
              <img src={avatarPhotos.dp} alt="You" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
              <div className="flex-1 rounded-lg border overflow-hidden" style={{ borderColor: "oklch(0.9 0.01 260)", background: "white" }}>
                <textarea
                  placeholder="Reply to message..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 outline-none resize-none"
                  style={{ fontSize: "13px", color: "oklch(0.2 0.02 260)" }}
                />
                <FormattingToolbar />
              </div>
            </div>
          </div>
          {/* Typing indicator */}
          <TypingIndicator />
          {/* Collaborators footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t" style={{ borderColor: "oklch(0.92 0.01 260)", background: "oklch(0.97 0.003 260)" }}>
            <div className="flex items-center gap-2.5">
              <span style={{ color: "oklch(0.5 0.02 260)", fontSize: "12px" }}>Collaborators</span>
              <div className="flex -space-x-2">
                <img src={avatarPhotos.sc} alt="SC" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                <img src={avatarPhotos.kr} alt="KR" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                <img src={avatarPhotos.jm} alt="JM" className="w-7 h-7 rounded-full object-cover border-2 border-white" />
                <div className="w-7 h-7 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: "oklch(0.82 0.01 260)" }}>
                  <User size={14} style={{ color: "oklch(0.7 0.01 260)" }} />
                </div>
              </div>
              <button className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "oklch(0.94 0.008 260)" }}>
                <Plus size={12} style={{ color: "oklch(0.5 0.02 260)" }} />
              </button>
            </div>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-black/[0.03]" style={{ color: "oklch(0.4 0.02 260)", fontSize: "12px" }}>
              <Bell size={14} /> Join
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
