"This Week" Page — Comprehensive Feature Documentation
Overview
The "This Week" page is a dedicated calendar-based time management view that provides a 4-day weekly time-blocking interface (Monday–Thursday) for scheduling tasks, visualizing Google Calendar events, and organizing work around working hours. It enables users to drag tasks from a sidebar into specific time slots, view calendar events alongside task blocks, carry forward incomplete tasks automatically, and customize working hours with overflow buckets.

1. Data Architecture
1.1 Core Data Models
TimeBlock (runtime, computed):

interface TimeBlock {
  id: string;                    // "tb-<timestamp>-<random>"
  taskId: string;                // Task ID
  projectName: string;           // Project identifier
  dateStr: string;               // "YYYY-MM-DD" (persisted absolute date)
  dayIndex: number;              // 0-3 (Mon-Thu), computed at render time from dateStr + weekDays
  startHour: number;             // 0-23
  startMinute: number;           // 0 or 30
  durationMinutes: number;       // 30, 60, 90, etc.
  isCarryForward?: boolean;      // Virtual carry-forward (not persisted)
  carryForwardOf?: string;       // Original block ID (not persisted)
}
TimeBlockSaved (persisted form, no computed fields):

interface TimeBlockSaved {
  id: string;
  taskId: string;
  projectName: string;
  dateStr: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
}
CalEventBlock (Google Calendar events, read-only):

interface CalEventBlock {
  id: string;
  summary: string;
  dateStr: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  dayIndex: number;
  location?: string;
  htmlLink?: string;
  colorId?: string;           // Google Calendar color ID (1-11)
}
Week Settings (per-user, persisted):

interface WeekSettings {
  gridStartHour?: number;       // Default: 8 (8am)
  gridEndHour?: number;         // Default: 17 (5pm)
  notepadText?: string;         // Free-form scratch pad
}
1.2 Storage & Persistence
KV Store (per-user):

timeblocks:${userId} → TimeBlockSaved[]
weekSettings:${userId} → WeekSettings
Server Routes:

PUT /make-server-3baa71aa/data/timeblocks — saves time blocks (debounced 1200ms in frontend)
PUT /make-server-3baa71aa/data/week-settings — saves working hours & notepad text (debounced 1200ms)
Local State (App.tsx):

savedTimeBlocks: TimeBlockSaved[] — loaded from server, passed to WeekView
savedWeekSettings: WeekSettings | null — loaded from server, passed to WeekView
weekGCalEvents: GCalEvent[] — fetched from Google Calendar API (today + 6 days)
2. UI Structure & Layout
2.1 Three-Panel Layout
┌────────────────────────────────────────────────────────────────────────────┐
│                         HEADER (Title, Controls)                           │
├───────────┬──────────────────────────────────────────────┬─────────────────┤
│  Notepad  │          4-Day Calendar Grid (Mon-Thu)       │  Tasks Sidebar  │
│  (220px)  │                                               │     (240px)     │
│  Toggle   │  ┌────────────────────────────────────────┐  │                 │
│           │  │ Day Headers (date, due-date pills)     │  │   - Lineup      │
│  Textarea │  ├────────────────────────────────────────┤  │   - My Tasks    │
│           │  │ Before Hours bucket (collapsible)      │  │                 │
│           │  ├────────────────────────────────────────┤  │   Draggable     │
│           │  │                                         │  │   task cards    │
│           │  │  Main Time Grid (hourly slots)         │  │                 │
│           │  │  - Time blocks (draggable)              │  │                 │
│           │  │  - GCal events (read-only)              │  │                 │
│           │  │  - Now line (today only)                │  │                 │
│           │  │                                         │  │                 │
│           │  ├────────────────────────────────────────┤  │                 │
│           │  │ After Hours bucket (always shown)      │  │                 │
│           │  └────────────────────────────────────────┘  │                 │
└───────────┴──────────────────────────────────────────────┴─────────────────┘
2.2 Header Controls
Left Section:

Title: "This Week" (22px, 700 weight, Albert Sans)
Week Navigation:
< Previous Week button
"Today" button (accented when weekOffset === 0)
> Next Week button
Week label: "Jan 6 - Jan 9, 2026" (13px, 500 weight, secondary text)
Right Section:

Notes toggle (notepad icon, purple #8B5CF6 when open)
Tasks panel toggle (panel icon, accent color when open)
Divider
Working hours dropdown (clock icon):
Displays current hours: "8am – 5pm"
Opens popover to adjust start/end hours (5am–5pm start, 12pm–12am end)
"Reset to default" button (8am–5pm)
3. Week Calculation & Day Logic
3.1 Week Start Determination
// If today is Fri/Sat/Sun (5/6/0), show the following week
const weekStart = getWeekStart(APP_TODAY);
const todayDay = APP_TODAY.getDay();
if (todayDay === 0 || todayDay >= 5) {
  weekStart.setDate(weekStart.getDate() + 7);
}
weekStart.setDate(weekStart.getDate() + weekOffset * 7);
Default behavior: Always show Mon–Thu of the current work week
Weekend/Friday logic: If today is Fri/Sat/Sun, automatically advance to the following Mon–Thu
Week offset: Users can navigate backward/forward weeks with weekOffset state
3.2 Day Headers
Each day column displays:

Day label: "MON", "TUE", "WED", "THU" (11px uppercase, 600 weight, purple for today)
Date badge: Circular badge with date number (24px, purple bg + white text if today)
Due-date pills: Up to 3 tasks with task.date matching the day (draggable, project-colored)
Overflow: "+N more" text if more than 3
4. Time Grid & Slots
4.1 Dynamic Hour Grid
Working hours: User-configurable (default 8am–5pm)
Slot granularity: Each hour divided into two 30-minute drop zones (top/bottom half)
Dynamic hour height: Computed via ResizeObserver on grid container
Formula: hourHeight = Math.max(containerHeight / numHours, MIN_HOUR_HEIGHT)
MIN_HOUR_HEIGHT = 30px (scrolls only if viewport is very small)
4.2 Hour Cell Drop Zones
Each hour cell has:

Top half (0 minutes) — purple tint on hover (rgba(106,103,206,0.08))
Bottom half (30 minutes) — purple tint on hover, dashed border separator
Visual feedback: Immediate highlight when dragging task over slot
5. Time Blocks (User Tasks)
5.1 Creating Time Blocks
Method: Drag task from sidebar OR from calendar pill → drop onto time slot

Behavior:

Creates new TimeBlock with:
id: "tb-<timestamp>-<random>"
taskId, projectName from dragged task
dateStr: toDateStr(weekDays[dayIndex]) (absolute date)
startHour, startMinute from drop target
durationMinutes: Default 60 minutes
Auto-assigns task to current user if not already assigned
Removes task from sidebar "Lineup" or "My Tasks" (blocked tasks excluded from sidebar)
5.2 Time Block Card
Visual Design:

Rounded 6px card with project color background (projectColor + "18" opacity)
Border: 1px solid ${projectColor}40
Left edge: No explicit accent (background color provides identity)
Height: (durationMinutes / 60) * hourHeight - 2px
Position: Absolute, calculated from startHour, startMinute
Content (responsive to height):

Always: Task title (10px, 600 weight, truncated)
≥40px height: Time range (e.g., "9am - 10am", 9px, 400 weight)
≥54px height: Project name (9px, quaternary text)
Hover: Remove button (×) appears (opacity transition)
Interactions:

Click: Opens task detail popup
Drag: Re-time-block (moves to new slot, removes old block)
Resize: Drag bottom edge to extend/shrink duration (snaps to 30-min increments)
5.3 Carry-Forward Blocks (Virtual)
Trigger: Incomplete tasks whose scheduled time has passed

Rules:

Past days: Carry to today
Today (time passed): Carry to next weekday
Skip weekends: If carry-forward lands on Sat/Sun, advance to Monday
Skip duplicates: Don't create carry-forward if task already has a real block on target date
Visual Distinction:

Background: projectColor + "0C" (lighter opacity)
Border: 1.5px dashed ${projectColor}60
Badge: Yellow "↩" icon (7px, 700 weight, #F59E0B background)
Duration: Always 30 minutes
Stacking: Stack sequentially from gridStartHour (30min increments)
Lifecycle:

Not persisted — computed on every render
Removed when user drags the carry-forward block to a new slot (creates new real block, deletes old)
6. Google Calendar Events (Read-Only)
6.1 Data Source
Fetched via useGoogleCalendar hook (today + 6 days)
Stored in weekGCalEvents: GCalEvent[] state
Filtered to current week's 4 days at render time
6.2 Calendar Event Card
Visual Design:

Rounded 6px card, color determined by event.colorId (Google's 11-color palette)
Background: color + "18"
Border: 1px solid ${color}30
Left accent: 3px solid ${color}
Calendar icon (8px) in header
Z-index: 5 (below time blocks' z-index 10)
Content (responsive to height):

Always: Event title (9px, 600 weight)
≥34px height: Time range
≥48px height: Location (if present)
Interactions:

Click: Opens event.htmlLink in new tab (Google Calendar)
Tooltip: Shows full summary, time, location on hover
6.3 Google Calendar Color Mapping
const GCAL_COLORS: Record<string, string> = {
  "1": "#7986CB", "2": "#33B679", "3": "#8E24AA", "4": "#E67C73",
  "5": "#F6BF26", "6": "#F4511E", "7": "#039BE5", "8": "#616161",
  "9": "#3F51B5", "10": "#0B8043", "11": "#D50000",
};
Default: #4285F4 (Google blue) if colorId missing

7. Before/After Hours Buckets
7.1 Purpose
Handle time blocks/events scheduled outside the main working hours grid (e.g., 7am meeting when grid is 8am–5pm, or 7pm dinner event).

7.2 Bucket Rows
Before Hours:

Label: "BEFORE HOURS" / "Before 8am"
Show condition: Only visible if blocks or events exist in this range
Background: rgba(0,0,0,0.015) (subtle gray tint)
Drop behavior: Creates block at gridStartHour - 1 (e.g., 7am if grid starts at 8am)
After Hours:

Label: "AFTER HOURS" / "After 5pm"
Show condition: Always visible
Drop behavior: Creates block at gridEndHour (e.g., 5pm if grid ends at 5pm)
7.3 Bucket Drop Cells
4 columns (one per day), purple tint on hover
Display time blocks as compact pills:
Project color dot + truncated title + remove button
Display calendar events similarly (calendar icon, no remove button)
8. Now Line
Appearance:

Red line (#FC5360) spanning the day column
Red dot (6px) on the left edge
Position: topPx = (hour - gridStartHour) * hourHeight + (minute / 60) * hourHeight
Visibility:

Only shown on "today's" column (if today is within the 4-day week)
Only if current time is ≥ gridStartHour
Z-index: 20 (above all blocks/events)

9. Notepad Panel (Left Sidebar)
9.1 Layout
Width: 220px (collapses to 0px when toggled off)
Background: var(--bg-surface-secondary)
Border-right: var(--border-default)
Transition: Smooth 300ms expand/collapse
9.2 Components
Header:

Purple notepad icon with spiral rings (12px)
"NOTES" label (11px uppercase, 700 weight, tracking 0.5px)
Textarea:

Full height, resize: none
Placeholder: "Jot down quick notes, ideas, reminders..."
12px font, 400 weight, 18px line-height
Auto-saved via onWeekSettingsChange (1200ms debounce)
Footer:

Line count: "N lines" (or "Your scratch pad" if empty)
9px quaternary text
10. Tasks Sidebar (Right Panel)
10.1 Layout
Width: 240px (collapses to 0px when toggled off)
Background: var(--bg-surface-secondary)
Border-left: var(--border-default)
Transition: Smooth 300ms expand/collapse
10.2 Task Sections
Lineup (top section):

Lineup icon (blue list with top circle)
"LINEUP" label (11px uppercase, 700 weight)
Count badge (e.g., "12")
Collapsible arrow
My Tasks (bottom section):

Sun icon (orange/yellow)
"MY TASKS" label
Count badge
Collapsible arrow
Filtering:

Exclude time-blocked tasks from both sections
Lineup: task.lineup === true
My Tasks: Tasks assigned to current user, lineup !== true
10.3 Sidebar Task Card
Visual Design:

Rounded 8px card, var(--bg-surface) background
1px border var(--border-default)
Subtle shadow: 0 1px 3px rgba(0,0,0,0.04)
Project color accent: 3px vertical bar on left
Content:

Task title (11px, 600 weight, truncated)
Project name + due date (9px, 500 weight, separated by middot)
Interactions:

Drag: Starts time-blocking flow (cursor changes to grab → grabbing)
Click: Opens task detail popup
Opacity: 0.4 while dragging (visual feedback)
10.4 Footer Hint
"Drag tasks to schedule" (10px, quaternary text, centered)
11. Drag & Drop System
11.1 DND Provider
Library: react-dnd with HTML5Backend
DND_TYPE: "WEEK_TASK"
11.2 Drag Sources
Sidebar task cards (new time block)
Due-date pills (new time block from calendar header)
Existing time blocks (re-schedule, includes fromTimeBlock ID)
11.3 Drop Targets
Main grid half-hour cells (384 total: 4 days × 24 half-hours per day at 12-hour grid)
Before Hours bucket columns (4 cells)
After Hours bucket columns (4 cells)
11.4 Drop Behavior
const handleDrop = (item: DragItem, dayIndex: number, hour: number, minute: number) => {
  // If re-dragging existing block, remove old one
  if (item.fromTimeBlock) {
    setTimeBlocks((prev) => prev.filter((b) => b.id !== item.fromTimeBlock));
  }

  // Create new time block
  const newBlock: TimeBlock = {
    id: `tb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    taskId: item.taskId,
    projectName: item.projectName,
    dateStr: toDateStr(weekDays[dayIndex]),
    dayIndex,
    startHour: hour,
    startMinute: minute,
    durationMinutes: 60,
  };

  setTimeBlocks((prev) => [...prev, newBlock]);

  // Auto-assign task to current user if not already assigned
  if (!entry.task.assignee || entry.task.assignee !== userName) {
    onUpdateTaskField(item.projectName, item.taskId, { assignee: userName });
  }
};
12. Computed Task Lists
12.1 My Tasks
const myTasks = allTasks.filter((t) => {
  const assignee = t.task.assignee?.toLowerCase();
  return assignee && userName && assignee.includes(userName.toLowerCase());
});
12.2 Tasks on Calendar (Due-Date Pills)
const tasksOnCalendar = useMemo(() => {
  const blockedIds = new Set(timeBlocks.map((b) => b.taskId));
  const result: { entry: TaskEntry; dayIndex: number }[] = [];

  for (const entry of allTasks) {
    if (blockedIds.has(entry.task.id)) continue; // Exclude time-blocked tasks

    const dueDate = entry.task.date ? parseDate(entry.task.date) : undefined;

    // Check if due this week
    if (dueDate) {
      const di = weekDays.findIndex((d) => isSameDate(d, dueDate));
      if (di >= 0) {
        result.push({ entry, dayIndex: di });
        continue;
      }
    }

    // If marked "Today", show on today's column
    if (todayTaskIds.has(entry.task.id) && todayDayIndex >= 0) {
      result.push({ entry, dayIndex: todayDayIndex });
    }
  }

  return result;
}, [allTasks, timeBlocks, todayTaskIds, weekDays, todayDayIndex]);
Rules:

Exclude tasks already time-blocked
Include tasks with task.date matching Mon–Thu of current week
Include "Today" tasks on today's column (if within week)
13. Persistence & Lifecycle
13.1 Loading Flow
App.tsx calls loadData() on mount (after auth)
Fetches timeblocks:${userId} and weekSettings:${userId} from KV store
Sets savedTimeBlocks and savedWeekSettings state
WeekView receives these as props and hydrates local state:
useEffect(() => {
  if (savedTimeBlocks && savedTimeBlocks.length > 0) {
    setTimeBlocks(savedTimeBlocks.map((sb) => ({
      ...sb,
      dayIndex: -1, // computed per-week
    })));
  }
}, [savedTimeBlocks]);
13.2 Auto-Save Flow
Time Blocks (App.tsx):

useEffect(() => {
  if (!initialLoadDone || !accessToken) return;
  clearTimeout(timeBlocksSaveRef.current);
  timeBlocksSaveRef.current = setTimeout(() => {
    saveWithAuth((t) => api.saveTimeBlocks(t, savedTimeBlocks), "Auto-save time blocks");
  }, 1200);
}, [savedTimeBlocks]);
Week Settings (App.tsx):

useEffect(() => {
  if (!initialLoadDone || !accessToken) return;
  clearTimeout(weekSettingsSaveRef.current);
  weekSettingsSaveRef.current = setTimeout(() => {
    saveWithAuth((t) => api.saveWeekSettings(t, savedWeekSettings), "Auto-save week settings");
  }, 1200);
}, [savedWeekSettings]);
13.3 Data Flow Diagram
WeekView (local state)
    ↓ onChange callback
savedTimeBlocks (App.tsx)
    ↓ auto-save effect (1200ms debounce)
PUT /data/timeblocks
    ↓
kv.set(`timeblocks:${userId}`, blocks)
14. Visual System
14.1 Brand Colors
Accent: var(--accent-primary) (Coral #fa6863) — used sparingly (active nav, Today button)
Purple accent: #6A67CE — primary calendar UI color (today column, drop zones, default project color)
Secondary purple: #8B5CF6 — notepad icon
Text hierarchy:
Primary: var(--text-primary)
Secondary: var(--text-secondary)
Tertiary: var(--text-tertiary)
Quaternary: var(--text-quaternary)
14.2 Backgrounds & Surfaces
Page: var(--bg-page)
Surfaces: var(--bg-surface)
Secondary surfaces: var(--bg-surface-secondary) (notepad, sidebar)
Hover: var(--bg-hover-solid)
Borders: var(--border-default), var(--border-subtle)
14.3 Project Colors
Each project has a unique color (e.g., #6A67CE, #10B981, #F59E0B)
Time blocks inherit project color with 18% opacity background + 40% border
Due-date pills: 12% background + 25% border
14.4 Typography
Font: 'Albert Sans', sans-serif (imported in fonts.css)
Title: 22px / 700 weight
Section headers: 11px uppercase / 700 weight / 0.5px tracking
Task titles: 10–11px / 600 weight
Metadata: 9px / 500 weight
Labels: 10px / 500 weight
15. Interaction Patterns
15.1 Time Block Resize
User hovers over bottom edge of time block → resize handle appears (6px height, gradient background)
Cursor changes to ns-resize
Mouse down → start tracking startY, startDuration
Mouse move → calculate deltaY in pixels, convert to 30-min increments
Mouse up → commit new duration, persist
Constraints:

Minimum duration: 30 minutes
Maximum: Cannot exceed gridEndHour (cap at end of grid)
15.2 Working Hours Popover
Click clock icon in header → opens popover (220px, positioned below button)
Two dropdowns:
Start: 5am–5pm (in 1-hour increments)
End: 12pm–12am (filtered to > startHour)
Auto-adjust: If start ≥ end, bump end to start + 1
"Reset to default" button → sets 8am–5pm
Changes persist immediately via onWeekSettingsChange
15.3 Week Navigation
Previous/Next: Increment/decrement weekOffset by 1
Today button: Sets weekOffset = 0, highlights in accent color
Week label updates dynamically: "Jan 6 - Jan 9, 2026"
15.4 Panel Toggles
Notepad toggle: Expands/collapses left panel (220px ↔ 0px)
Icon color: Purple when open, tertiary when closed
Tasks panel toggle: Expands/collapses right panel (240px ↔ 0px)
Icon color: Accent when open, tertiary when closed
Both use transition: width 300ms, opacity 300ms
16. Surfaces Where "This Week" Appears
16.1 Sidebar Navigation (Sidebar.tsx)
Label: "This Week"
Icon: <WeekViewIcon active={activeNav === "ThisWeek"} />
Active state: activeNav === "ThisWeek"
Click: onNavChange("ThisWeek")
Position: Between "My Tasks" and "Calendar" in nav stack
16.2 Home Page Card (HomePage.tsx)
Component: <ThisWeekCard />
Position: Right column of top row (Today + Lineup | This Week)
Size: min-w-[220px] max-w-[260px]
Data: Displays calendar events (calendarEvents) + GCal events (weekGCalEvents)
Content:
Header: Calendar week icon + "This Week" + event count badge
7 days (full week Mon–Sun, not just Mon–Thu)
Each day: Date badge + event list (both regular + GCal)
Empty days: Compact single row (20px badge + day name)
Days with events: Expanded view (24px badge + event cards)
Event Cards (HomePage "This Week" card):

Regular events: 10px title, 8px time
GCal events: Calendar icon, 10px title, 8px time, location (if present)
Click: Opens event detail popup (GCal) or inline event editor (regular)
Right-click: Context menu (copy title, create meeting doc, join Meet, open in GCal)
16.3 Main App Routing (App.tsx)
const isThisWeek = activeNav === "ThisWeek";
// ...
{isThisWeek ? (
  <WeekView
    allTasks={allTasks}
    lineupTasks={lineupTasks}
    todayTaskIds={todayTaskIds}
    userName={userName}
    projectColors={projectColors}
    onOpenTaskPopup={handleOpenTaskPopup}
    onUpdateTaskField={updateTaskFieldInProject}
    savedTimeBlocks={savedTimeBlocks}
    onTimeBlocksChange={handleTimeBlocksChange}
    savedWeekSettings={savedWeekSettings}
    onWeekSettingsChange={handleWeekSettingsChange}
    calendarEvents={weekGCalEvents}
  />
) : isHome ? (
  <HomePage ... />
) : ...}
Sidebar padding adjustment:

style={{ paddingLeft: isThisWeek ? 68 : (sidebarPinned ? 252 : 68) }}
This Week view always uses collapsed sidebar (68px), ignoring sidebarPinned state
17. Integration with Other Features
17.1 Today System
Tasks marked "Today" (todayTaskIds set) appear in sidebar "My Tasks" if not time-blocked
If marked "Today" but no due date, appear as due-date pill on today's column (if today is within Mon–Thu week)
17.2 Lineup System
Lineup tasks appear in sidebar "Lineup" section if not time-blocked
Dragging from Lineup → time-blocking removes from Lineup sidebar
Task retains lineup: true flag (only visibility changes)
17.3 Task Detail Popup
Clicking any time block → onOpenTaskPopup(taskId, projectName)
Opens full task editor with all fields (title, description, assignee, due date, subtasks, etc.)
Changes immediately reflected in time block card (title, project color)
17.4 Google Calendar Integration
useGoogleCalendar hook manages OAuth flow + event fetching
Fetches events for "today + 6 days" (7-day window)
Events stored in weekGCalEvents state
WeekView filters to Mon–Thu of current week
No write operations (read-only display)
17.5 Project Resources (Subtasks)
Subtasks DO NOT appear in This Week view (parent tasks only)
If parent task is time-blocked, its subtasks remain hidden
18. Edge Cases & Special Behaviors
18.1 Weekend Handling
Week display: Always Mon–Thu (4 days)
Today is Fri/Sat/Sun: Automatically advance to following Mon–Thu
Carry-forward to weekend: Skip to next Monday
18.2 Cross-Week Time Blocks
Time blocks persist via absolute dateStr (e.g., "2026-01-06")
When navigating to different week, blocks for that week's dates are computed/displayed
dayIndex is recomputed on every week change
18.3 Multiple Time Blocks for Same Task
Allowed: User can schedule the same task multiple times in a week
Carry-forward skip: If task already has a real block on carry-forward target date, no virtual block created
18.4 Task Deletion
Deleting a task does NOT auto-remove its time blocks
Time blocks become "orphaned" (entry lookup fails → card renders as blank/null)
On next save, orphaned blocks persist (no cleanup logic)
18.5 Empty Sidebar Sections
If "Lineup" is empty: "No items" placeholder (10px italic, quaternary text)
If "My Tasks" is empty: "No items" placeholder
Sections remain collapsible even when empty
19. Accessibility & UX Details
19.1 Keyboard Navigation
Not currently implemented (drag-drop is mouse-only)
19.2 Responsive Behavior
Not responsive — designed for desktop (minimum ~1200px viewport)
Panels collapse via toggles, but layout does not adapt to mobile
19.3 Loading States
No explicit loading spinner for time blocks (loads instantly from KV store)
Google Calendar events: Managed by useGoogleCalendar hook (shows connection state)
19.4 Error Handling
If saveTimeBlocks API call fails: Silent failure (no user notification)
Console logs errors: "Save time blocks error: ..."
Orphaned blocks (task not found): Render as null (no error UI)
20. Performance Considerations
20.1 Debounced Saves
Time blocks: 1200ms debounce (prevents API spam during rapid dragging)
Week settings: 1200ms debounce (notepad typing)
20.2 Memoized Computations
myTasks — memoized with [allTasks, userName] deps
tasksOnCalendar — memoized with [allTasks, timeBlocks, todayTaskIds, weekDays] deps
blocksByDay — memoized with [allDisplayBlocks, gridStartHour, gridEndHour] deps
carryForwardBlocks — memoized with [timeBlocks, allTasks, gridStartHour] deps
calEventBlocks — memoized with [calendarEvents, weekDays] deps
20.3 ResizeObserver
Observes grid container height to dynamically compute hourHeight
Disconnects on unmount (cleanup in useEffect return)
21. Future Enhancements (Not Implemented)
Multi-week view: Expand to 2+ weeks simultaneously
Recurring time blocks: Weekly templates ("Every Monday 9am: standup")
Time block templates: Pre-configured durations (e.g., "Focus Time: 2hrs")
Keyboard shortcuts: Arrow keys to move blocks, Delete to remove
Drag to resize: Drag top edge to adjust start time (currently only bottom edge resizes)
Conflict warnings: Highlight overlapping blocks/events
Mobile view: Responsive single-day view with swipe navigation
Export calendar: Generate .ics file from time blocks
Time tracking: Log actual time spent vs. planned (integration with time-tracking feature)
22. Complete Data Flow: Creating a Time Block
1. User drags task card from sidebar
   → useDrag() sets isDragging = true, item = { taskId, projectName, title }

2. User hovers over time slot (e.g., Monday 9:00am)
   → useDrop() on HourCell sets isOver = true
   → Purple background tint appears

3. User releases mouse
   → Drop handler fires: handleDrop(item, dayIndex=0, hour=9, minute=0)

4. handleDrop() creates new TimeBlock:
   {
     id: "tb-1706342400000-a7x3z",
     taskId: "task-001",
     projectName: "Website Redesign",
     dateStr: "2026-01-06",
     dayIndex: 0,
     startHour: 9,
     startMinute: 0,
     durationMinutes: 60
   }

5. setTimeBlocks([...prev, newBlock])
   → Re-renders WeekView
   → TimeBlockCard appears at calculated topPx

6. persistTimeBlocks(timeBlocks) called (filters out virtual carry-forward blocks)
   → onTimeBlocksChange(toSave) called
   → App.tsx: setSavedTimeBlocks(blocks)

7. Auto-save effect triggers (1200ms debounce):
   → PUT /make-server-3baa71aa/data/timeblocks
   → Body: { timeBlocks: [...] }
   → Server: kv.set(`timeblocks:${userId}`, blocks)

8. Auto-assign logic:
   → If task.assignee !== userName:
     onUpdateTaskField(projectName, taskId, { assignee: userName })
   → Updates task in project state
   → Triggers project auto-save

9. Sidebar updates:
   → blockedIds = new Set(timeBlocks.map(b => b.taskId))
   → sidebarLineup/sidebarMyTasks filter out task-001
   → Task card disappears from sidebar
End of "This Week" Feature Documentation