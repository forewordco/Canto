Project Status Update System — Complete Feature Documentation
Overview
The app includes an Asana-inspired Status Update feature that allows team members to post rich, structured progress reports for projects. Status updates are the primary mechanism for communicating project health, progress, blockers, and next steps to collaborators. They appear throughout the app on project timelines, in notifications, and alongside meeting notes in a unified activity feed.

Data Architecture
UpdateItem Interface
Status updates are stored as UpdateItem objects in the project.updates[] array. Each update contains:

interface UpdateItem {
  id: string;                    // Unique identifier
  title: string;                 // Update headline (e.g., "Project Alpha - Feb 15")
  description: string;           // Legacy field; Summary preferred
  date: string;                  // Date string ("Feb. 15, 2026")
  status?: ProjectStatus;        // Project status snapshot (on-track, at-risk, off-track, on-hold, complete, dropped)
  
  // Structured content
  summary?: string;              // Main progress summary (Markdown)
  nextSteps?: string;            // Next steps section (Markdown)
  customSections?: { title: string; content: string }[];  // User-added sections
  
  // Metadata
  owner?: string;                // Update author (team member name)
  attendees?: string[];          // Collaborators who drafted the update
  attachments?: Attachment[];    // Files, links, videos
  comments?: Comment[];          // Discussion thread on the update
  
  // Type discriminator
  type?: 'status-update' | 'member-joined' | 'project-created';
  eventMembers?: string[];       // For activity events only
}
Storage & Persistence
Updates are stored in projects[projectName].updates[] array
Newest updates are prepended (index 0 = most recent)
Persisted to Supabase via the saveProjects function
Imported from Asana via statusUpdates field mapping
Type Discrimination
Updates use a type field to distinguish:

'status-update' (or undefined) — Real project status updates
'member-joined' — Activity event when a member joins
'project-created' — Activity event when project is created
Timeline views filter these separately to show status updates vs. activity events.

Creation & Editing
StatusUpdateEditor Component
A full-screen modal editor (StatusUpdateEditor.tsx) with a two-panel layout:

Left Panel — Editor
Title input — Defaults to "[ProjectName] - [Date]"
Status picker (required) — Dropdown with all 6 statuses (on-track, at-risk, off-track, on-hold, complete, dropped), color-coded
Draft collaborators — Multi-select team member picker
Owner picker — Single-select dropdown (defaults to current user)
Current Stage — Project production phase picker (optional, toggleable)
Work Type — Project type picker (optional, toggleable)
Client — Display-only badge if project has client
Attachments:
File upload (max ~4.5MB per file)
Link attachment with optional label
Display with type icons (image, video, link, document)
Remove button per attachment
Field visibility toggle — Show/hide Stage, Work Type, Client, Connected channel
Content sections:
Summary — "How's this project going?" (Markdown, write/preview toggle)
Next steps — "What's next for the team?" (Markdown, write/preview toggle)
Custom sections — Add unlimited titled sections with Markdown content
AI Draft banner — Placeholder for "Draft with AI" feature
Post button — Top-right, color matches selected status
Right Panel — "Build your update" Sidebar
Three tabs:

Previous update — Read-only card showing last status update (title, author, status, metadata, summary, next steps)
Highlights — Empty state placeholder for automated milestone/task highlights
Drafts — Empty state placeholder for saved drafts
Markdown Support
All content fields (Summary, Next Steps, custom sections) support GitHub-flavored Markdown via react-markdown and remark-gfm
Write/Preview toggle — Click to switch modes; auto-switches to preview on blur if content exists
Renders: headings, lists, bold, italic, links, blockquotes, code blocks, task lists, horizontal rules
File Attachments
Upload flow: Click "Add attachment" → file input → upload to Supabase Storage via api.uploadFile → signed URL returned
File size limit: ~4.5MB (enforced client-side)
Link attachments: Inline input with URL + optional label → added to attachments array with type: "link"
Attachment metadata: { id, name, type, size, url, storageKey }
Deletion: Removes from array + deletes from Supabase Storage via api.deleteFile
Triggering Status Updates
Entry Points
Project header status badge — Click colored status indicator → opens editor with current status
Empty state in Overview tab — "Add a status update" button when no updates exist
Status dropdown in project detail header — "Set status" menu → clicking a status opens editor with that status pre-selected
Request update callback — onRequestStatusUpdate() → sets addUpdateRequested flag → triggers editor
Flow
User clicks trigger → setShowStatusModal(true) → StatusUpdateEditor renders as portal → User fills form → Click "Post"
→ onPost callback → addUpdate(title, description, status, extra) → prepends to project.updates[] → saveProjects → Supabase
→ Editor closes → Timeline refreshes
Display Surfaces
1. Project Overview Tab — Latest Update Card
Location: Top of Overview tab, below project header
Content:
Status badge with colored dot + label
Author avatar + name + relative time ("2 days ago")
Update title
Summary section (Markdown rendered, expandable)
Metadata: Project name, Owner, Current Stage, Work Type, Client
"View full update" link (future)
Fallback: If no status updates but meeting notes exist, shows latest meeting note card
Empty state: Dashed border box with "Add a status update" button
2. Unified Timeline (Overview Tab)
Merge logic: Combines statusUpdates, linkedMeetingDocs, and activityEvents into single timeline
Sort order: Most recent first (by date or createdAt)
Timeline items:
Status updates: Status dot + title + author avatar + relative time + summary snippet
Meeting notes: Different icon + note title + date
Activity events: Member-joined / project-created banners
Visual: Vertical timeline with connecting line down the left side
3. Inbox Notifications
Trigger: When a status update is posted, sendNotif("status_update", collaborators, { projectName, taskTitle }) is called
Notification card:
Purple accent color (#A177FF)
"Update" badge
"[Author] posted a status update"
Project name
Relative time
Navigation: Clicking notification navigates to project
4. Previous Update Card (Editor Sidebar)
When shown: In StatusUpdateEditor right panel, "Previous update" tab
Content: Full read-only view of most recent status update (same as Overview card)
Empty state: "No previous updates yet. This will be your first!"
Visual System
Status Badges
Each status has a color scheme with dot, text color, and background:

{
  "on-track":   { dot: "#10B880", color: "#0D9668", bg: "#E8FCF7" },
  "at-risk":    { dot: "#F79000", color: "#C07300", bg: "#FFF8E5" },
  "off-track":  { dot: "#fa6863", color: "#D03040", bg: "#FEE5F8" },
  "on-hold":    { dot: "#6159e1", color: "#5048c7", bg: "#eeedfc" },
  "complete":   { dot: "#10B880", color: "#0D9668", bg: "#E8FCF7" },
  "dropped":    { dot: "#868E95", color: "#676076", bg: "#EEEEF0" }
}
Typography
Font: Albert Sans (from Figma brand guide)
Title: 700 weight, 16–24px depending on context
Body: 400 weight, 12–13px
Metadata labels: 500 weight, 11–12px, tertiary color
Colors (CSS Custom Properties)
Text: var(--text-primary), var(--text-secondary), var(--text-tertiary), var(--text-quaternary)
Backgrounds: var(--bg-elevated), var(--bg-surface), var(--bg-surface-secondary), var(--bg-hover), var(--bg-overlay)
Borders: var(--border-default), var(--border-subtle), var(--border-strong)
Links: var(--text-link) (default #6A67CE)
Icons
Status update: Circle with checkmark (status dot color)
Meeting note: Calendar icon
Member joined: User plus icon
Attachment types: Paperclip (generic), link icon (links), play button (video), image icon (images)
Relative Time Display
Today → "Today"
1 day → "1 day ago"
2–29 days → "X days ago"
30+ days → "X months ago"
Interaction Patterns
Editor Modal
Open: Click trigger → full-screen portal overlay with z-[200]
Close: ESC key, X button top-right, or click backdrop
Body scroll: Disabled while open
Focus management: Auto-focus first input on open
Status Picker
Trigger: Click status badge → dropdown appears below
Behavior: Click status → updates selection, closes dropdown
Backdrop: Transparent overlay closes dropdown on click
Active state: Checkmark next to selected status
Owner/Phase/Type Pickers
Same dropdown pattern as Status picker
Show current selection with avatar (Owner) or badge (Phase/Type)
Hover state on dropdown items
Field Visibility Toggle
Click "Show or hide fields" → dropdown with checkboxes
Toggle visibility of: Current Stage, Work Type, Client, Connected channel
State persists during edit session (not saved)
Custom Sections
Click "+ Add a section" → new section appended
Inline title + content editing
Hover to reveal remove button (right side)
No limit on section count
Attachments
File upload: Hidden file input triggered by button → uploads on select → shows in list
Link input: Toggle inline form → URL + label fields → Enter or "Add" button → appends to list
Remove: Hover attachment row → X button appears → click to delete (and remove from storage)
Post Button
Color: Dynamically matches selected status dot color
State: Enabled always (no validation required except status)
Action: Calls onPost → closes editor → refreshes timeline
Notification Banner
Shows "X people will be notified" count in editor header
Count = unique task assignees in project (collaborators)
Notifications & Collaboration
Who Gets Notified
When a status update is posted:

Derive collaborators: Unique set of all task.assignee values in project
Send notification: sendNotif("status_update", Array.from(collaborators), { projectName, taskTitle: title })
Inbox entry: Purple "Update" badge, "[Author] posted a status update", project name, time
Draft Collaborators
Field: Multi-select team member picker in editor
Storage: Saved in update.attendees[] array
Default: Current user (userName)
Purpose: Track who contributed to drafting the update (not used for notifications yet)
Owner Assignment
Field: Single-select dropdown in editor
Default: Current user (userName)
Storage: Saved in update.owner field
Display: Shows avatar + name in timeline cards
Persistence & Lifecycle
Create Flow
// User clicks "Post" in editor
handlePost() → onPost(title, description, status, extra)

// In App.tsx
addUpdate(title, description, status, extra) → {
  const newUpdate: UpdateItem = {
    id: genId(),
    title,
    description,
    date: todayStr,
    status,
    ...extra,  // summary, nextSteps, customSections, owner, attendees, attachments
    type: 'status-update',
    comments: [],
  };
  
  setProjects(prev => ({
    ...prev,
    [activeProject]: {
      ...prev[activeProject],
      updates: [newUpdate, ...prev[activeProject].updates],  // Prepend
      status,  // Update project status to match
    },
  }));
  
  sendNotif("status_update", collaborators, { projectName, taskTitle: title });
}
Edit Flow
editUpdate(updateId, changes) → {
  setProjects(prev => ({
    ...prev,
    [activeProject]: {
      ...prev[activeProject],
      updates: prev[activeProject].updates.map(u =>
        u.id === updateId ? { ...u, ...changes } : u
      ),
    },
  }));
}
Supabase Sync
Trigger: Every mutation to projects state calls saveProjects(newProjects) via useEffect
Endpoint: api.saveProjects(accessToken, projects) → POST /make-server-3baa71aa/save-projects
Storage: JSON blob in kv_store_3baa71aa table with key projects-${userId}
Asana Import
// AsanaImporter maps Asana status_updates to UpdateItem
const ASANA_STATUS_MAP = {
  on_track: "on-track",
  at_risk: "at-risk",
  off_track: "off-track",
  on_hold: "on-hold",
  complete: "complete",
};

const updates = asanaData.statusUpdates.map(su => ({
  id: genId(),
  title: su.title || "Status Update",
  description: su.text || "",
  date: format(su.createdAt, DISPLAY_FORMAT),
  status: ASANA_STATUS_MAP[su.statusType] || "on-track",
  owner: su.author || "",
  type: 'status-update',
  comments: [],
}));
Integration Points
1. Meeting Notes (Workspace Docs)
Linking: Docs with linkedProjectName matching project + docType: "meeting" appear in unified timeline
Sort order: Interleaved with status updates by date
Visual distinction: Different icon (calendar vs. status circle)
Fallback: If no status updates exist, latest meeting note shows as hero card
2. Activity Events
Types: member-joined, project-created
Stored in: Same project.updates[] array with type field
Display: Separate items in timeline with special formatting (team icon, join badge)
Filtering: Excluded from "status updates" count and cards
3. Project Metadata
Status updates capture project metadata snapshots:

Status: Project's current status (on-track, at-risk, etc.)
Production Phase: Current stage (incoming, pre-production, in-production, post-production, etc.)
Project Type: Work type (video-production, photography, design, etc.)
Client: Client name if assigned
These are displayed in update cards as badges but can be edited inline in the editor (changes persist to project, not just the update).

4. Comments on Updates
Schema: Each UpdateItem has comments?: Comment[] array
Future: Comment threads on updates (not yet implemented in UI)
Structure: Same Comment interface as task comments (id, text, author, date)
Edge Cases & Validations
Required Fields
Status: Always required (defaults to project's current status)
Title: Defaults to "[ProjectName] - [Date]" if empty
All other fields are optional
File Upload Limits
Max size: ~4.5MB per file (client-side check)
Error handling: Shows error message below attachment buttons if upload fails
Storage cleanup: Files deleted from Supabase Storage if attachment removed
Empty States
No previous updates: "No previous updates yet. This will be your first!" in editor sidebar
No highlights: "Key milestones and completed tasks will appear here" placeholder
No drafts: "Save drafts of your updates" placeholder
No updates on timeline: Dashed border "Add a status update" button
Markdown Edge Cases
Auto-resize: Textareas auto-expand to fit content
Preview mode: Click to edit → auto-blur to preview if content exists
Empty preview: Shows italic placeholder text ("How's this project going?")
Visual Variations by Status
On-track (Green)
Dot: #10B880
Text: #0D9668
Background: #E8FCF7
Post button: Green background
At-risk (Orange)
Dot: #F79000
Text: #C07300
Background: #FFF8E5
Post button: Orange background
Off-track (Coral)
Dot: #fa6863
Text: #D03040
Background: #FEE5F8
Post button: Coral background
On-hold (Purple)
Dot: #6159e1
Text: #5048c7
Background: #eeedfc
Post button: Purple background
Complete (Green)
Same as On-track
Dropped (Gray)
Dot: #868E95
Text: #676076
Background: #EEEEF0
Post button: Gray background
Future Enhancements (Placeholders)
AI Draft: "Draft with AI" button in editor banner (not yet functional)
Highlights: Auto-populate completed tasks, milestones, and achievements in sidebar
Drafts: Save in-progress updates for later editing
Slack integration: "Connected channel" field to post updates to Slack
Recipients: "Add recipients" button to manually choose notification recipients
View full update: Link in timeline cards to expand update in modal
Comments: Comment threads on status updates (schema exists, UI not implemented)
Edit existing updates: Currently only creates new; edit UI not built