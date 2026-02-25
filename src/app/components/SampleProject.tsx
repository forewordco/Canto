import { useState } from "react";
import {
  Star, CaretDown, DotsThreeVertical, Plus, Circle, CheckCircle,
  Eye, UserCircle, ListBullets, SquaresFour, ChartBar, Funnel,
  SortAscending, MagnifyingGlass, Flag, Image as ImageIcon,
  YoutubeLogo, Suitcase, FilmSlate, Tag, MapPin, VideoCamera,
  Diamond, Question,
} from "@phosphor-icons/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const coverImage = "https://images.unsplash.com/photo-1672288373992-3f1a6efe5d54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBzdW5nbGFzc2VzJTIwcmVmbGVjdGlvbiUyMGNsb3NlLXVwfGVufDF8fHx8MTc3MTg5OTU3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/* ── OKLCH brand palette ── */
const c = {
  bg: "oklch(0.99 0.002 260)",
  card: "oklch(1 0 0)",
  text1: "oklch(0.2 0.02 260)",
  text2: "oklch(0.35 0.02 260)",
  text3: "oklch(0.5 0.02 260)",
  text4: "oklch(0.6 0.02 260)",
  border: "oklch(0.92 0.01 260)",
  borderLight: "oklch(0.95 0.005 260)",
  coral: "oklch(0.7 0.18 25)",
  coralBg: "oklch(0.7 0.18 25 / 0.08)",
  indigo: "oklch(0.55 0.2 280)",
  teal: "oklch(0.65 0.15 180)",
  gold: "oklch(0.78 0.15 85)",
  green: "oklch(0.7 0.17 150)",
  greenBg: "oklch(0.7 0.17 150 / 0.08)",
  orange: "oklch(0.75 0.15 55)",
  purple: "oklch(0.6 0.2 300)",
};

/* ── Data ── */
const milestones = [
  { label: "Travel", date: "Feb 10 – Feb 11", color: c.orange },
  { label: "Shoot", date: "Feb 10", color: c.coral },
  { label: "Round 1", date: "Feb 11", color: c.indigo },
  { label: "Final", date: "Feb 12", color: c.indigo },
];

const resources = [
  { icon: FilmSlate, label: "Untitled Video", sub: "", color: c.indigo },
  { icon: YoutubeLogo, label: "https://www.youtub...", sub: "www.youtube.com", color: c.coral },
  { icon: ImageIcon, label: "Image Gallery", sub: "7 images", color: c.teal },
  { icon: Suitcase, label: "Travel Details", sub: "6 items · $5,849.41", color: c.purple },
];

interface Task {
  name: string;
  subtasks: string;
  tag?: string;
  date?: string;
  assignee?: string;
  assigneeColor?: string;
  milestone?: boolean;
  deliverable?: boolean;
}

interface TaskSection {
  label: string;
  color: string;
  tasks: Task[];
}

const taskSections: TaskSection[] = [
  {
    label: "PRE-PRODUCTION",
    color: c.coral,
    tasks: [
      { name: "Project Startup", subtasks: "0/2", assignee: "S", assigneeColor: c.coral },
      { name: "Internal Pre-Production", subtasks: "0/1", tag: "Feedback", date: "Feb 6 – Feb 9", assignee: "B", assigneeColor: c.teal },
      { name: "Travel Bookings", subtasks: "", assignee: "R", assigneeColor: c.green },
      { name: "Gear Booking", subtasks: "0/6" },
      { name: "Gear Prep", subtasks: "0/9", date: "Feb 11" },
    ],
  },
  {
    label: "PRODUCTION",
    color: c.gold,
    tasks: [
      { name: "Shoot", subtasks: "0/9", date: "Feb 10", milestone: true },
    ],
  },
  {
    label: "POST-PRODUCTION",
    color: c.indigo,
    tasks: [
      { name: "Post Workflow", subtasks: "0/3" },
      { name: "DELIVERABLE: Narrative", subtasks: "0/7", deliverable: true },
      { name: "DELIVERABLE: Application Brief", subtasks: "0/7", deliverable: true },
      { name: "DELIVERABLE: E2E 1", subtasks: "0/7", deliverable: true },
      { name: "DELIVERABLE: E2E 2", subtasks: "0/7", deliverable: true },
    ],
  },
];

const tags = [
  { label: "Beckhoff", dot: c.coral },
  { label: "Mankato, MN", icon: MapPin },
  { label: "Video – Production", icon: VideoCamera },
];

export function SampleProject() {
  const [activeTab, setActiveTab] = useState("List");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const toggleTask = (name: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalTasks = taskSections.reduce((a, s) => a + s.tasks.length, 0);
  const doneCount = completedTasks.size;

  return (
    /* Break out of parent padding/max-width container */
    <div
      className="-mx-6 md:-mx-10 -my-8 md:-my-12 flex h-[calc(100vh-0px)] md:h-[calc(100vh-0px)]"
      style={{ background: c.bg }}
    >
      {/* ── Left: scrollable content ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 lg:px-8 pt-6 lg:pt-7">

          {/* ── Title row ── */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Project icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: c.coralBg }}
              >
                <Circle weight="fill" size={12} style={{ color: c.coral }} />
              </div>
              <h1
                className="truncate"
                style={{ color: c.text1, fontSize: "20px", fontWeight: 700, lineHeight: 1.3 }}
              >
                V-Tek Case Study
              </h1>
              <button className="shrink-0 p-1 rounded hover:bg-black/[0.04] transition-colors">
                <Star size={17} style={{ color: c.text4 }} />
              </button>
              <button className="shrink-0 p-0.5 rounded hover:bg-black/[0.04] transition-colors">
                <CaretDown size={13} style={{ color: c.text4 }} />
              </button>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Owner avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: c.coralBg }}
              >
                <UserCircle weight="fill" size={18} style={{ color: c.coral }} />
              </div>
              {/* On track badge */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: c.greenBg }}>
                <div className="w-[7px] h-[7px] rounded-full" style={{ background: c.green }} />
                <span style={{ color: c.green, fontSize: "12px", fontWeight: 600 }}>On track</span>
              </div>
            </div>
          </div>

          {/* ── Description + Milestones side by side ── */}
          <div className="flex gap-6 mb-5">
            {/* Description */}
            <p
              className="flex-1 min-w-0"
              style={{ color: c.text3, fontSize: "13px", lineHeight: 1.7 }}
            >
              Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit
              interdum, ac aliquet. Nunc vulputate libero et velit interdum, ac aliquet. Dolor sit amet,
              consectetur adipiscing elit....
            </p>

            {/* Milestones card */}
            <div
              className="shrink-0 rounded-lg px-4 py-3 flex flex-col gap-1.5"
              style={{ border: `1px solid ${c.border}` }}
            >
              {milestones.map((m) => (
                <div key={m.label} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-[68px]">
                    <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: m.color }} />
                    <span style={{ color: c.text2, fontSize: "12px", fontWeight: 500 }}>{m.label}</span>
                  </div>
                  <span style={{ color: c.text4, fontSize: "12px" }}>{m.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tags ── */}
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {tags.map((t) => (
              <span
                key={t.label}
                className="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full"
                style={{
                  border: `1px solid ${c.border}`,
                  fontSize: "12px",
                  color: c.text2,
                  fontWeight: 500,
                  background: c.card,
                }}
              >
                {t.dot ? (
                  <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: t.dot }} />
                ) : t.icon ? (
                  <t.icon size={13} style={{ color: c.text4 }} />
                ) : null}
                {t.label}
              </span>
            ))}
            <button
              className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-full transition-colors hover:bg-black/[0.04]"
              style={{ border: `1px solid ${c.border}` }}
            >
              <Plus size={12} style={{ color: c.text4 }} />
            </button>
          </div>
        </div>

        {/* ── Resources ── */}
        <div className="px-6 lg:px-8 pb-5">
          <h3
            className="mb-3"
            style={{ color: c.text2, fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em" }}
          >
            RESOURCES
          </h3>
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
            {resources.map((r) => (
              <div
                key={r.label}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg shrink-0 cursor-pointer hover:shadow-sm transition-all"
                style={{ background: c.card, border: `1px solid ${c.border}`, minWidth: "120px" }}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in oklch, ${r.color} 12%, transparent)` }}
                >
                  <r.icon weight="fill" size={15} style={{ color: r.color }} />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate"
                    style={{ color: c.text1, fontSize: "12px", fontWeight: 500, lineHeight: 1.3 }}
                  >
                    {r.label}
                  </p>
                  {r.sub && (
                    <p className="truncate" style={{ color: c.text4, fontSize: "11px", lineHeight: 1.3, marginTop: "1px" }}>
                      {r.sub}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <button
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg shrink-0 transition-colors hover:bg-black/[0.02]"
              style={{ border: `1px dashed ${c.border}`, color: c.text4, fontSize: "12px", fontWeight: 500 }}
            >
              <Plus size={12} />
              Add
            </button>
          </div>
        </div>

        {/* ── Tasks ── */}
        <div className="px-6 lg:px-8 pb-10">
          {/* Tasks header */}
          <div className="flex items-center justify-between gap-3 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <span style={{ color: c.text1, fontSize: "13px", fontWeight: 700, letterSpacing: "0.02em" }}>TASKS</span>
              <span
                className="px-1.5 py-0.5 rounded"
                style={{ background: c.borderLight, color: c.text4, fontSize: "11px", fontWeight: 600 }}
              >
                {totalTasks}
              </span>

              {/* Tabs */}
              <div
                className="flex items-center ml-1 rounded-md overflow-hidden"
                style={{ border: `1px solid ${c.border}` }}
              >
                {[
                  { label: "List", icon: ListBullets },
                  { label: "Board", icon: SquaresFour },
                  { label: "Insights", icon: ChartBar },
                ].map((tab, idx, arr) => (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    className="flex items-center gap-1 px-2.5 py-[5px] transition-colors"
                    style={{
                      background: activeTab === tab.label ? c.card : "transparent",
                      color: activeTab === tab.label ? c.text1 : c.text4,
                      fontSize: "12px",
                      fontWeight: activeTab === tab.label ? 500 : 400,
                      borderRight: idx < arr.length - 1 ? `1px solid ${c.border}` : "none",
                    }}
                  >
                    <tab.icon size={13} weight={activeTab === tab.label ? "bold" : "regular"} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-black/[0.03]"
                style={{ color: c.text3, fontSize: "12px", fontWeight: 500 }}
              >
                <SortAscending size={13} />
                Sort
              </button>
              <button
                className="flex items-center gap-1 px-2 py-1 rounded transition-colors hover:bg-black/[0.03]"
                style={{ color: c.text3, fontSize: "12px", fontWeight: 500 }}
              >
                <Funnel size={13} />
                Filter
              </button>
              <span className="ml-1" style={{ color: c.text4, fontSize: "12px" }}>
                {doneCount}/{totalTasks} done
              </span>
            </div>
          </div>

          {/* Task sections */}
          <div className="space-y-4">
            {taskSections.map((section) => (
              <div key={section.label}>
                {/* Section label */}
                <div className="mb-1 mt-1">
                  <span
                    style={{
                      color: section.color,
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {section.label}
                  </span>
                </div>

                {/* Tasks */}
                <div>
                  {section.tasks.map((task) => {
                    const done = completedTasks.has(task.name);
                    return (
                      <div
                        key={task.name}
                        className="group flex items-center gap-2.5 py-[9px] transition-colors hover:bg-black/[0.015] cursor-pointer"
                        style={{ borderBottom: `1px solid ${c.borderLight}` }}
                      >
                        {/* Checkbox / milestone / deliverable icon */}
                        <button
                          onClick={() => toggleTask(task.name)}
                          className="shrink-0 transition-colors flex items-center justify-center w-5 h-5"
                        >
                          {done ? (
                            <CheckCircle weight="fill" size={20} style={{ color: c.green }} />
                          ) : task.milestone ? (
                            <Diamond size={18} style={{ color: c.gold }} />
                          ) : task.deliverable ? (
                            <Diamond size={18} style={{ color: c.indigo }} />
                          ) : (
                            <Circle
                              size={20}
                              style={{ color: "oklch(0.85 0.01 260)" }}
                              className="group-hover:!text-[oklch(0.7_0.18_25)]"
                            />
                          )}
                        </button>

                        {/* Milestone flag */}
                        {task.milestone && (
                          <Flag weight="fill" size={14} style={{ color: c.gold }} className="shrink-0 -ml-0.5" />
                        )}

                        {/* Task name */}
                        <span
                          className={`truncate ${done ? "line-through" : ""}`}
                          style={{
                            color: done ? c.text4 : c.text1,
                            fontSize: "13px",
                            fontWeight: 400,
                          }}
                        >
                          {task.name}
                        </span>

                        {/* Subtasks count */}
                        {task.subtasks && (
                          <span
                            className="shrink-0"
                            style={{ color: "oklch(0.75 0.01 260)", fontSize: "11px" }}
                          >
                            {task.subtasks}
                          </span>
                        )}

                        {/* Tag */}
                        {task.tag && (
                          <span
                            className="shrink-0 px-1.5 py-[2px] rounded"
                            style={{
                              background: "oklch(0.94 0.005 260)",
                              color: c.text3,
                              fontSize: "11px",
                              fontWeight: 500,
                            }}
                          >
                            {task.tag}
                          </span>
                        )}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Date */}
                        {task.date && (
                          <span
                            className="shrink-0"
                            style={{ color: c.text4, fontSize: "12px" }}
                          >
                            {task.date}
                          </span>
                        )}

                        {/* Eye icon */}
                        <button className="shrink-0 p-0.5 rounded hover:bg-black/[0.04] transition-colors opacity-0 group-hover:opacity-100">
                          <Eye size={15} style={{ color: c.text4 }} />
                        </button>

                        {/* Assignee */}
                        {task.assignee ? (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{
                              background: `color-mix(in oklch, ${task.assigneeColor} 15%, transparent)`,
                              color: task.assigneeColor,
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {task.assignee}
                          </div>
                        ) : (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ border: `1.5px dashed oklch(0.88 0.01 260)` }}
                          >
                            <UserCircle size={14} style={{ color: "oklch(0.82 0.01 260)" }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Add task */}
          <button
            className="flex items-center gap-2 mt-2 py-2 rounded transition-colors hover:bg-black/[0.02] w-full"
            style={{ color: c.text4, fontSize: "13px" }}
          >
            <Plus size={13} />
            Add task
          </button>
        </div>
      </div>

      {/* ── Right: Cover image panel ── */}
      <div
        className="hidden lg:block relative shrink-0"
        style={{ width: "35%" }}
      >
        <ImageWithFallback
          src={coverImage}
          alt="Project cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Kebab menu */}
        <button
          className="absolute top-4 right-4 w-7 h-7 rounded-md flex items-center justify-center bg-black/25 backdrop-blur-sm hover:bg-black/35 transition-colors"
        >
          <DotsThreeVertical size={16} weight="bold" style={{ color: "white" }} />
        </button>
      </div>

      {/* ── FABs ── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2.5 z-20">
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          style={{ background: c.card, border: `1px solid ${c.border}` }}
        >
          <MagnifyingGlass size={18} style={{ color: c.text3 }} />
        </button>
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${c.coral}, oklch(0.65 0.2 30))`,
          }}
        >
          <Plus size={22} weight="bold" style={{ color: "white" }} />
        </button>
      </div>

      {/* ── Question FAB (bottom right, over image) ── */}
      <button
        className="fixed bottom-6 right-6 lg:right-[calc(35%-8px)] w-7 h-7 rounded-full flex items-center justify-center z-20"
        style={{ background: c.indigo }}
      >
        <Question size={16} weight="bold" style={{ color: "white" }} />
      </button>
    </div>
  );
}