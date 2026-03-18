"Today" and "Lineup" — Comprehensive Functionality Prompt
Conceptual Overview
Today and Lineup are two distinct prioritization systems that work across tasks, subtasks, and workspace docs. They serve different scopes:

Today = personal, per-user daily focus list. "What am I working on right now?" Each user maintains their own Today list — flagging a task as Today is private to you and doesn't affect other team members. Color identity: amber/gold (#F59E0B), icon: sun.

Lineup = shared, team-level work queue. "What's next for the team?" Flagging a task for Lineup is visible to everyone on the workspace — it's a universal team queue. Color identity: blue (#3B82F6), icon: horizontal stacked lines (three lines of decreasing width, optionally with a blue dot when active).

1. Data Architecture — The Critical Difference
Today (per-user):

Tasks: Stored as a standalone Set<string> of task IDs (todayTaskIds) in app state, completely separate from the task objects themselves. This means each authenticated user has their own Today set, and toggling Today for a task doesn't mutate the TaskItem data.
Docs: Stored as a today?: boolean property directly on the WorkspaceDoc object (not per-user for docs).
Persistence: Auto-saved via api.saveTodayTaskIds() on a 1200ms debounce, keyed to the current user session.
Automatic inclusion: Any task whose date field matches the current calendar date (isDueToday()) is automatically surfaced in the Today list, even if the user never manually flagged it.
Lineup (universal/team):

Tasks: Stored as a lineup?: boolean property directly on the TaskItem object itself. Toggling Lineup mutates the task data via setProjects(), so it persists as part of the project data and is visible to all users.
Docs: Stored as a lineup?: boolean property directly on the WorkspaceDoc object.
Persistence: Auto-saved with normal project data since it lives on the task/doc objects.
Subtasks: Both Today and Lineup extend to subtasks. Subtask entries include parentTaskId, parentTaskTitle, and projectName for navigation context.

2. Toggle Mechanics
toggleTaskToday(projectName, taskId):
  → Adds/removes taskId from the todayTaskIds Set (does NOT touch task object)

toggleTaskLineup(projectName, taskId):
  → Flips task.lineup boolean on the actual TaskItem in project data

toggleDocToday(docId):
  → Flips doc.today boolean on the WorkspaceDoc object

toggleDocLineup(docId):
  → Flips doc.lineup boolean on the WorkspaceDoc object
When a doc is duplicated, the copy has today: false and lineup: false regardless of the original's flags.

3. Computed Lists (App.tsx)
todayTasks = allTasks.filter(t => todayTaskIds.has(t.task.id) || isDueToday(t.task.date))
lineupTasks = allTasks.filter(t => t.task.lineup)
todayDocs = workspaceDocs.filter(d => d.today)
lineupDocs = workspaceDocs.filter(d => d.lineup)
todaySubtasks = subtasks where subtask ID is in todayTaskIds
lineupSubtasks = subtasks where subtask.lineup is true
Both lists are split into incomplete/completed for rendering purposes.

4. Where Today & Lineup Appear
4a. Sidebar Navigation Badge
The Home nav item shows pill-shaped badge counts:
Amber pill with sun icon + count for Today (incomplete tasks + subtasks + docs)
Blue pill with lineup icon + count for Lineup (incomplete tasks + subtasks + docs)
Only shown when respective count > 0
4b. Home Page — Dedicated Cards
The Home page renders two collapsible cards in a left column:

Today Card:

Header: Sun icon + "Today" title + amber count badge + collapse chevron
Content: Incomplete today tasks as compact TaskRow components, then incomplete today subtasks as SubtaskRow components
"Add task..." inline input (appears on hover) — creates a personal task and auto-flags it to Today (markToday: true)
Completed section with "Completed" divider
Docs sub-section: Today-flagged docs as HomeDocCard components with "Remove from Today" action
Empty state: "All clear for now"
Lineup Card:

Header: Lineup icon + "Lineup" title + blue count badge + collapse chevron
Sub-header: "Team Queue" label
Content: Same structure — incomplete lineup tasks, subtasks, completed divider, docs sub-section
Docs show "Remove from Lineup" action
Greeting subtitle summarizes counts: "X today · Y in lineup · Z in progress"

4c. Task Row — Hover-Reveal Toggle Buttons
In every task list view (Home, My Tasks, MainContent project view), each task row shows:

Sun icon button: Appears on hover (opacity transition), stays visible when active. Amber when Today-flagged.
Title: "Add to Today" / "Remove from Today"
Lineup icon button: Same reveal pattern, blue when Lineup-flagged.
Title: "Add to Lineup" / "Remove from Lineup"
Both use stopPropagation to prevent opening the task when clicking the toggle.
4d. Context Menus
Right-clicking a task in any view opens a context menu with:

"Add to Today" / "Remove from Today" (with sun icon, reflects current state)
"Add to Lineup" / "Remove from Lineup" (with lineup icon, reflects current state)
The context menu passes isToday: todayTaskIds.has(task.id) and isLineup: task.lineup to render the correct label.

4e. Task Detail Popup
The task detail/popup view includes Today and Lineup toggle buttons in the actions area, calling the same toggle functions.

4f. Multi-Select Batch Actions
When multiple tasks are selected (via shift-click or marquee), the floating batch action toolbar includes:

"Add to Today" batch action — toggles Today for all selected tasks
"Add to Lineup" batch action — toggles Lineup for all selected tasks
4g. MainContent (Project View)
Each task row in list/board/timeline views shows:

Today toggle button (sun icon, hover-reveal)
Lineup toggle button (lineup icon, hover-reveal, only when onToggleLineup is provided)
Context menu items for both
Board view cards, timeline bars, and list rows all support these toggles.

4h. My Tasks Page
The My Tasks page shows all tasks assigned to the current user. Each TaskRow has:

showLineup prop enabled
isToday={todayTaskIds.has(task.id)} for checking Today state
Both toggle buttons in the row
4i. Week View
The week planner integrates both:

Today tasks are placed in the current day's column (based on todayTaskIds check plus isDueToday)
Lineup tasks appear in a sidebar queue, excluding tasks already placed on time blocks
4j. Docs Page
In Grid View (doc list):

Doc cards show status badges in the top-left corner: amber sun badge for Today, blue lineup badge for Lineup (rendered as small frosted-glass pill icons)
Hover reveals Today + Lineup toggle buttons on each card
Context menu (right-click) includes "Add to Today" / "Remove from Today" and "Add to Lineup" / "Remove from Lineup"
Filter Dropdown:

Status filter pills include "Today" (amber, sun icon) and "Lineup" (blue, lineup icon) as toggleable filters
When active, the grid only shows docs matching the filter
Filters are combinable (e.g. Today + Pinned)
In Editor View (bottom bar):

Today toggle: Sun icon button, amber when active
Lineup toggle: Lineup icon button, blue when active
Located alongside Favorite, Pin, and Delete buttons
Favorite Doc Rows:

Show Today and Lineup badge pills (amber/blue frosted backgrounds) next to the doc entry
Multi-select batch actions (doc grid):

"Add to Today" and "Add to Lineup" as batch quick actions
5. Visual System
Attribute	Today	Lineup
Color	Amber #F59E0B	Blue #3B82F6
Active bg	#FEF3C7 / #F59E0B/15	#EFF6FF / #3B82F6/12
Text color	#B45309	#1D4ED8
Icon	Sun with rays (circle + 8 ray lines)	3-4 horizontal lines of decreasing width, optional dot
Hover bg (cards)	#FEF3C7	#EFF6FF
Ring (active)	Amber	Blue
Badge shape	Rounded pill	Rounded pill
Icon rendering:

SunIcon({ active, size }) — Filled amber circle + ray lines when active, outline when inactive
LineupIcon({ active, size }) — Blue strokes when active, currentColor when inactive; optional dot indicator when active
DocSunIcon and DocLineupIcon — Docs-specific variants with the same visual language
Opacity transitions:

Inactive: opacity-0 (hidden), revealed on row hover via group-hover:opacity-40
Hover over button: hover:!opacity-80
Active: opacity-100 (always visible)
6. Interaction Patterns
Single toggle:

Click sun icon → adds/removes from Today
Click lineup icon → adds/removes from Lineup
Both can be active simultaneously (a task can be in Today AND Lineup)
Context menu toggle:

Label dynamically reflects current state ("Add to..." vs "Remove from...")
Icon renders in active state when flag is on
Quick add to Today (Home page only):

Inline task input at the bottom of the Today card
Auto-creates a personal task AND flags it to Today in one action
Shows "Personal" badge on the input row
No mutual exclusivity:

Today and Lineup are independent flags. A task/doc can be in both, either, or neither.
Favorited, Pinned, Today, and Lineup are all orthogonal flags.
7. Persistence & Lifecycle
Today tasks:

todayTaskIds Set loaded from KV store on initial data fetch
Toggles update the local Set immediately
Auto-save fires after 1200ms debounce via api.saveTodayTaskIds(accessToken, Array.from(todayTaskIds))
Per-user: different authenticated users maintain separate Today sets
Lineup tasks:

task.lineup boolean loaded as part of project data
Toggles update the task in setProjects() immediately
Auto-saved with normal project data (1500ms debounce)
Universal: all users see the same Lineup state
Today/Lineup docs:

doc.today and doc.lineup booleans on WorkspaceDoc
Saved with workspace docs data
Visible to all users (not per-user for docs)