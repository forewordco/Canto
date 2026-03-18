/* ===================================================================
   LOADING SKELETONS — Content-shaped loading placeholders.

   Provides shimmer/pulse skeleton states for different page types.
   Each skeleton matches the approximate layout of its real page.

   Phase 16 of Canto build plan (P16-3).
   =================================================================== */

/* ── Shimmer base block ── */

function Bone({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[6px] animate-pulse ${className}`}
      style={{
        background: "var(--neutral-150, oklch(0.92 0.005 260))",
        ...style,
      }}
    />
  );
}

/* ═══ PROJECT LIST SKELETON ═══ */

export function ProjectListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Bone className="h-7 w-44" />
        <Bone className="h-8 w-28 rounded-[6px]" />
      </div>
      {/* Filter bar */}
      <div className="flex gap-2">
        {[80, 64, 72, 56].map((w, i) => (
          <Bone key={i} className="h-7" style={{ width: w }} />
        ))}
      </div>
      {/* Project cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-[10px] p-4 space-y-3"
            style={{ border: "1px solid var(--border-default)" }}
          >
            <div className="flex items-center gap-2.5">
              <Bone className="w-9 h-9 rounded-[8px]" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
            <Bone className="h-2 w-full rounded-full" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex -space-x-1.5">
                {[0, 1, 2].map((j) => (
                  <Bone key={j} className="w-6 h-6 rounded-full" />
                ))}
              </div>
              <Bone className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ TASK LIST SKELETON ═══ */

export function TaskListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[6px]"
        >
          <Bone className="w-4 h-4 rounded-full shrink-0" />
          <Bone
            className="h-4 flex-1"
            style={{ maxWidth: `${55 + Math.random() * 30}%` }}
          />
          <Bone className="w-6 h-6 rounded-full shrink-0" />
          <Bone className="w-16 h-5 rounded-[4px] shrink-0 hidden sm:block" />
          <Bone className="w-14 h-5 rounded-full shrink-0 hidden sm:block" />
        </div>
      ))}
    </div>
  );
}

/* ═══ PROJECT PAGE SKELETON ═══ */

export function ProjectPageSkeleton() {
  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 space-y-6">
      {/* Project header */}
      <div className="flex items-center gap-3">
        <Bone className="w-10 h-10 rounded-[10px]" />
        <div className="space-y-1.5 flex-1">
          <Bone className="h-6 w-56" />
          <Bone className="h-3.5 w-80" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-default)" }}>
        {[48, 56, 64, 52, 48].map((w, i) => (
          <Bone key={i} className="h-8 mb-[-1px]" style={{ width: w }} />
        ))}
      </div>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <Bone className="h-5 w-32" />
        <Bone className="h-7 w-20 rounded-[6px]" />
      </div>
      {/* Task list */}
      <TaskListSkeleton count={8} />
    </div>
  );
}

/* ═══ DOC LIST SKELETON ═══ */

export function DocListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Bone className="h-7 w-36" />
        <Bone className="h-8 w-28 rounded-[6px]" />
      </div>
      {/* Search */}
      <Bone className="h-9 w-full max-w-xs rounded-[6px]" />
      {/* Doc cards */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-[8px]"
            style={{ border: "1px solid var(--border-default)" }}
          >
            <Bone className="w-9 h-9 rounded-[6px] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-4 w-2/3" />
              <Bone className="h-3 w-1/3" />
            </div>
            <Bone className="w-6 h-6 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ CALENDAR SKELETON ═══ */

export function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bone className="w-8 h-8 rounded-[6px]" />
          <Bone className="h-6 w-36" />
          <Bone className="w-8 h-8 rounded-[6px]" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-8 w-20 rounded-[6px]" />
          <Bone className="h-8 w-20 rounded-[6px]" />
        </div>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <Bone key={i} className="h-6" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square p-1.5 space-y-1">
            <Bone className="h-4 w-6" />
            {i % 5 === 0 && <Bone className="h-4 w-full rounded-[3px]" />}
            {i % 7 === 3 && <Bone className="h-4 w-3/4 rounded-[3px]" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ INBOX SKELETON ═══ */

export function InboxSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Bone className="h-7 w-24" />
        <div className="flex gap-2">
          <Bone className="h-7 w-14 rounded-full" />
          <Bone className="h-7 w-16 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
        </div>
      </div>
      {/* Group header */}
      <Bone className="h-4 w-20" />
      {/* Notification items */}
      <div className="space-y-1">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-[8px]">
            <Bone className="w-8 h-8 rounded-[8px] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3.5 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
            <Bone className="w-12 h-3 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ HOME PAGE SKELETON ═══ */

export function HomePageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="space-y-1.5">
        <Bone className="h-8 w-64" />
        <Bone className="h-4 w-48" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[10px] p-4 space-y-2"
            style={{ border: "1px solid var(--border-default)" }}
          >
            <Bone className="h-3 w-16" />
            <Bone className="h-7 w-10" />
          </div>
        ))}
      </div>
      {/* Task sections */}
      {[1, 2].map((s) => (
        <div key={s} className="space-y-3">
          <Bone className="h-5 w-28" />
          <TaskListSkeleton count={3} />
        </div>
      ))}
    </div>
  );
}

/* ═══ TEAM PAGE SKELETON ═══ */

export function TeamPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-7 w-28" />
        <Bone className="h-8 w-28 rounded-[6px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[10px] p-4 flex items-center gap-3"
            style={{ border: "1px solid var(--border-default)" }}
          >
            <Bone className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ GENERIC PAGE SKELETON (fallback) ═══ */

export function GenericPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Bone className="h-8 w-48" />
      <Bone className="h-4 w-96" />
      <div className="grid grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map((i) => (
          <Bone key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

export default GenericPageSkeleton;
