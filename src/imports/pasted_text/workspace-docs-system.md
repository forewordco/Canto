
Workspace Docs System — Complete Feature Documentation
Overview
The app includes a powerful Workspace Docs system — a Notion-inspired block-based document editor that serves as the central knowledge management and note-taking hub. Docs support rich content blocks (text, headings, lists, code, images, embeds, tables, galleries), real-time collaboration, AI-powered content generation, screenplay formatting, and deep integration with projects, tasks, and clients. Documents can be organized into folders, linked to projects, prioritized for "Today" and "Lineup" queues, and exported as presentations.

Data Architecture
WorkspaceDoc Interface
The primary document object stored in workspaceDocs[] array:

interface WorkspaceDoc {
  // Core identity
  id: string;                          // Unique identifier
  title: string;                       // Document title
  icon: string;                        // Phosphor icon name (e.g., "clipboard", "handshake")
  
  // Content
  blocks: DocBlock[];                  // Array of content blocks
  coverImage?: string;                 // Header banner image URL
  coverImageY?: number;                // Vertical position % for cover (0-100)
  
  // Metadata
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
  docType?: DocType;                   // "doc" | "meeting" | "note" | "script"
  owner?: string;                      // Creator/owner name
  sortOrder?: number;                  // Custom sort weight
  
  // Organization
  parentId: string | null;             // Parent doc ID (for nested docs)
  isFolder?: boolean;                  // True if this is a folder (container only)
  folderId?: string | null;            // ID of containing folder
  folderColor?: string;                // Color if this is a folder
  
  // Linking
  linkedProjectName?: string;          // Associated project
  linkedTaskId?: string;               // Associated task
  linkedClientName?: string;           // Associated client
  
  // Flags
  pinned?: boolean;                    // Pin to top of list
  favorited?: boolean;                 // Star/favorite flag
  today?: boolean;                     // Show in "Today" queue
  lineup?: boolean;                    // Show in "Lineup" queue
  isPrivate?: boolean;                 // Private/draft status
  
  // Meeting-specific
  attendees?: DocAttendee[];           // Meeting participants
  gcalEventId?: string;                // Google Calendar event ID
  gcalLink?: string;                   // Google Calendar event URL
  gcalMeetLink?: string;               // Google Meet join URL
  gcalEventTime?: string;              // Event time string
  calendarLink?: string;               // Calendar app link
  meetingProjectStatus?: string;       // Project status snapshot
  
  // Script-specific
  scriptCharacters?: string[];         // Character names in screenplay
  scriptLocations?: string[];          // Location/set names
}
DocBlock Interface
Individual content blocks within a document:

interface DocBlock {
  id: string;                          // Unique block ID
  type: BlockType;                     // Block type (see below)
  content: string;                     // Text content or metadata
  
  // Type-specific properties
  checked?: boolean;                   // For "todo" blocks
  collapsed?: boolean;                 // For "toggle" blocks
  language?: string;                   // For "code" blocks (e.g., "javascript")
  
  // Callout blocks
  calloutColor?: string;               // Background color
  calloutIcon?: string;                // Icon name
  
  // Embed blocks
  embedType?: "youtube" | "video" | "photo" | "unsplash";
  embedUrl?: string;                   // Embed source URL
  imageUrl?: string;                   // Direct image URL
  
  // Group card blocks (nested doc reference)
  linkedDocId?: string;                // Child document ID
  cardStyle?: "compact" | "list" | "preview" | "gallery" | "board";
  
  // Styling
  decoration?: "focus" | "block" | null;  // Highlight style
  color?: string;                      // Text/background color
  fontStyle?: "system" | "serif" | "mono" | "round";
  
  // Gallery blocks
  galleryImages?: UnsplashImage[];     // Array of images
  unsplashMeta?: UnsplashImage;        // Single Unsplash image metadata
  
  // Table blocks
  tableData?: TableData;               // Headers + rows array
}
Block Types (25 types)
Standard Content Blocks:

paragraph — Plain text
heading1, heading2, heading3 — Section headings
bullet — Bulleted list item
numbered — Numbered list item
todo — Checkbox/task item (with checked property)
quote — Blockquote (indented with border)
callout — Highlighted callout box (icon + colored background)
divider — Horizontal rule separator
code — Code block (with syntax highlighting, language property)
toggle — Collapsible section (with collapsed property)
Media Blocks:

image — Single image (via imageUrl)
unsplash-image — Unsplash photo (with metadata)
gallery — Multi-image gallery grid
embed — Video/media embed (YouTube, Vimeo, etc.)
Advanced Blocks:

group-card — Nested doc reference (displays child doc as card)
table — Editable table with headers and rows
Script/Screenplay Blocks:

scene-heading — Scene header (INT./EXT. LOCATION — TIME)
action — Action description
character — Character name (centered, uppercase)
dialogue — Character speech
parenthetical — Stage direction (in parentheses)
transition — Scene transition (e.g., "CUT TO:")
DocType Enum
Four document types with distinct styling and behavior:

type DocType = "doc" | "meeting" | "note" | "script";

const DOC_TYPE_META = {
  doc:     { label: "Document", color: "#fa6863", bg: "#fff5f5", iconName: "clipboard" },
  meeting: { label: "Meeting",  color: "#F59E0B", bg: "#FFFBEB", iconName: "handshake" },
  note:    { label: "Note",     color: "#10B981", bg: "#ECFDF5", iconName: "pencil" },
  script:  { label: "Script",   color: "#E11D48", bg: "#FFF1F2", iconName: "filmslate" },
};
DocAttendee Interface
Meeting participants:

interface DocAttendee {
  id: string;
  name: string;
  type: "team" | "client" | "external";
  avatarUrl?: string;
  avatarColor?: string;
}
Document Types
1. Document (General)
Icon: Clipboard (red/coral)
Default blocks: Single empty paragraph
Use case: General-purpose notes, documentation, wikis
Features: All block types supported
2. Meeting Notes
Icon: Handshake (orange)
Default blocks: Empty paragraph
Special fields:
attendees[] — Participant list with avatars
gcalEventId — Link to Google Calendar event
gcalMeetLink — Google Meet join URL
meetingProjectStatus — Snapshot of project status at meeting time
Use case: Meeting agendas, minutes, retrospectives
Integration: Can be created from Google Calendar events
3. Note
Icon: Pencil (green)
Default blocks: Empty paragraph
Use case: Quick notes, ideas, scratchpad
Features: Lightweight, minimal metadata
4. Script (Screenplay)
Icon: Film slate (red)
Default blocks: Scene heading with "INT. " placeholder
Special features:
Fountain-style shortcuts: Type single characters to trigger block types
. → Scene heading
> → Transition
@ → Character name (centers automatically)
( → Parenthetical
Auto-advance: Pressing Enter on a Character block creates Dialogue block
Autocomplete: Character names and locations auto-suggest
Tracking: scriptCharacters[] and scriptLocations[] arrays
Block types: scene-heading, action, character, dialogue, parenthetical, transition
Use case: Screenplay writing, video scripts, film production
Block Editor Features
Slash Commands (Type / to open menu)
Comprehensive block insertion menu with 30+ options:

Text Blocks:

Text (paragraph)
Heading 1, 2, 3
Bullet list
Numbered list
To-do list
Quote
Callout
Divider
Code
Toggle
Media:

Image (upload or paste URL)
Unsplash image (search built-in)
Gallery (multi-image grid)
Video embed
Advanced:

Table
Group card (nested doc)
Script (script docs only):

Scene heading
Action
Character
Dialogue
Parenthetical
Transition
AI (Gemini integration):

Write with AI
Continue writing
Improve writing
Make longer
Make shorter
Fix spelling & grammar
Summarize
Find action items
Generate outline
Markdown Shortcuts
Type these patterns at the start of a line, press Space to convert:

# → Heading 1
## → Heading 2
### → Heading 3
- or * → Bullet list
1. → Numbered list
[] → To-do checkbox
> → Quote
--- → Divider
``` → Code block
Keyboard Shortcuts
Editing:

Ctrl+B — Bold (wraps selection with **)
Ctrl+I — Italic (wraps selection with *)
Ctrl+K — Link (wraps selection with [text](url))
Ctrl+/ — Inline code (wraps with backticks)
Tab — Indent (increase nesting)
Shift+Tab — Unindent (decrease nesting)
Navigation:

↑↓ — Move between blocks
Enter — Create new block below
Backspace (on empty block) — Delete block, merge with above
Ctrl+D — Duplicate block
/ — Open slash command menu
Esc — Close menus/modals
Multi-select:

Cmd+Click (Mac) or Ctrl+Click (Windows) — Select multiple blocks
Drag blocks to reorder
Collaboration:

Real-time cursor indicators show where others are typing
DocsPage Interface
Layout
Three-column layout with collapsible sidebar:

┌─────────────────┬──────────────────────┬─────────────────┐
│   Sidebar       │   Document Canvas    │   AI Sidebar    │
│   (Docs List)   │   (Block Editor)     │   (Optional)    │
│                 │                      │                 │
│  - Filters      │  - Cover image       │  - AI prompts   │
│  - Folders      │  - Title             │  - Suggestions  │
│  - Doc tree     │  - Blocks            │  - Actions      │
│  - Search       │  - Collaboration bar │                 │
└─────────────────┴──────────────────────┴─────────────────┘
Sidebar (Left Panel)
Header
"Docs" title (18px, 700 weight)
Search input (13px, magnifying glass icon)
Filter button (shows active filter count)
+ New button (creates new doc)
Filters (Top section)
Five filter chips with icons:

Favorited — Star icon (yellow when active)
Today — Sun icon (orange when active)
Lineup — List icon (blue when active)
Pinned — Pin icon
Private — Lock icon
Click to toggle filter. Active filters show colored icons and filter doc list.

Doc List (Scrollable)
Hierarchical tree with folders and docs:

Folders — Collapsible containers with colored icons
Docs — Individual documents with type-specific icons
Nesting — Indent shows parent-child relationships
Drag-to-reorder — Rearrange docs and move between folders
Doc List Item:

Icon (22px, colored background based on doc type)
Title (13px, 600 weight, truncated)
Metadata badges:
Today sun (if today: true)
Lineup badge (if lineup: true)
Pin icon (if pinned: true)
Private lock (if isPrivate: true)
Hover actions:
More menu (• • •) — Pin, favorite, move to folder, delete
Drag handle (dots) — Appears on left
Context Menu (right-click doc):

Pin to top
Add to Favorites
Mark for Today
Add to Lineup
Move to folder
Make private
Duplicate
Delete
Create Button
+ New dropdown with doc type options:

Document (red clipboard icon)
Meeting notes (orange handshake icon)
Note (green pencil icon)
Script (red film slate icon)
Document Canvas (Center Panel)
Cover Image (Optional)
Full-width banner at top (auto-height, object-fit: cover)
Reposition: Click cover → drag to adjust vertical position (0-100%)
Cover menu (gear icon on hover):
Change cover (search Unsplash, paste URL, gallery)
Reposition
Remove cover
Title
Large editable heading (32px, 700 weight)
Placeholder: "Untitled" (gray, italic)
Click to edit inline
Icon picker button (left of title) — Opens picker modal
Metadata Bar (Below title)
Compact row with:

Doc type badge — Colored pill (e.g., "Meeting" in orange)
Linked project — Project name with colored dot (if linkedProjectName)
Linked client — Client name (if linkedClientName)
Created date — "Created Jan 15, 2024"
Last edited — "Edited 2h ago" (relative time)
Attendees (meeting docs only) — Avatar row with names
Toolbar (Sticky, below metadata)
Horizontal row with action buttons:

Back arrow — Return to project (if opened from project)
Today sun — Toggle today flag (orange when active)
Lineup badge — Toggle lineup flag (blue when active)
Star — Toggle favorited (yellow when active)
Pin — Toggle pinned (gray when active)
Lock — Toggle isPrivate (gray when active)
AI button — Toggle AI sidebar
Outline — Show document outline (headings tree)
Present — Export to presentation mode
Share — Publish/share menu
More (• • •) — Duplicate, move, export, delete
Collaboration Bar (Below toolbar)
Shows active collaborators when real-time sync enabled:

Avatar row of online users
Connection status indicator ("Connected", "Connecting...", "Offline")
Click avatar to see user's focused block
Block Canvas (Scrollable)
Vertical stack of content blocks:

Empty placeholder: "Type / for commands..." (gray, italic)
Block rendering: Each block type has custom renderer
Hover actions (per block):
Drag handle (left) — Six-dot icon, appears on hover
Plus button (left) — Insert block above/below
More menu (right) — Duplicate, delete, convert type
Focus state: Active block has subtle border
Selection: Multi-select with checkboxes (Cmd+Click)
AI Sidebar (Right Panel, Optional)
Toggleable panel for AI features:

Prompt input — "Ask AI anything..." with send button
Quick actions — Buttons for common AI tasks (summarize, improve, etc.)
AI suggestions — Context-aware writing tips
Document outline — Heading tree for navigation (when AI panel closed, outline can replace it)
Real-Time Collaboration
Features
Live cursors: See where other users are typing with colored avatars
Block presence: Highlight blocks being edited by others
Presence indicators: Avatar row shows online collaborators
Conflict resolution: Last-write-wins for concurrent edits
Operational transformation: Block-level OT for insert/delete/update
Data Flow
// User edits block → Broadcast operation
broadcastOp({ 
  type: "block_update", 
  blockId: "abc123", 
  changes: { content: "New text" },
  userId: "user-xyz",
  timestamp: Date.now()
});

// Remote user receives op → Apply to local doc
applyRemoteOp(op) → updateDoc(docId, (doc) => ({
  ...doc,
  blocks: doc.blocks.map(b => 
    b.id === op.blockId ? { ...b, ...op.changes } : b
  )
}));
Presence Broadcasting
Focused block: Broadcast focusedBlockIdx when changing blocks
Cursor position: Debounced broadcast of cursor offset within block (80ms delay)
User color: Each collaborator gets assigned color (from palette)
Visual Indicators
Remote cursor: Colored vertical line (1px) at cursor position, with user avatar
Block presence: Subtle colored border around block being edited
Avatar row: Shows all online users with tooltips (name + current location)
Technology
Backend: Supabase Realtime (WebSocket channels)
Hook: useCollaboration(docId, userName, accessToken)
Operations: JSON-encoded deltas broadcasted to channel
AI Integration (Gemini)
Features
Write with AI: Generate content from prompt
Continue writing: Extend current block intelligently
Improve writing: Enhance clarity, tone, grammar
Transform: Longer, shorter, simplify, formalize
Analyze: Summarize, extract action items, find key points
Generate: Outline, ideas, alternatives
Slash Commands (AI-specific)
Type / in editor to access:

/write — AI writes from prompt
/continue — AI continues current thought
/improve — AI rewrites to improve
/longer — AI expands content
/shorter — AI condenses
/fix — Fix spelling & grammar
/summarize — Create summary
/action-items — Extract actionable tasks
/outline — Generate document structure
Inline AI Prompt
Trigger: Type /write or select text and click AI button
Interface: Floating prompt input appears
Flow: User types prompt → AI generates → User accepts/rejects
Options: Insert, replace, or append generated content
AI Sidebar
Toggle: Click "AI" button in toolbar
Prompt box: Free-form AI chat for document
Suggestions: Context-aware writing tips based on current block
Actions: Quick-action buttons for common transforms
Selection Toolbar
Select text → Floating toolbar appears with:

Bold, italic, link, code
Ask AI button — Opens prompt for selected text
Presentation Mode
Export to Slides
Converts document to presentation:

Slide breaks: Each H1 or H2 heading becomes new slide
Title slide: Doc title + cover image
Content slides: Blocks grouped under headings
Styling: Clean presentation theme with animations
Presentation View
Full-screen slideshow interface:

Navigation: Arrow keys, click to advance, progress bar
Slide counter: "3 / 12" bottom-right
Exit: Escape key or X button
Features: Markdown rendering, images, code blocks, lists
Loading State
"Generating presentation..." modal with spinner while compiling slides

Organization & Hierarchy
Folders
Creation: Click + New Folder in sidebar
Properties: Name, color (from 14-color palette)
Behavior: Collapsible, shows doc count
Drag-to-move: Drag docs onto folder to nest
Parent-Child Relationships
Nested docs: parentId field links child to parent
Group cards: Display child docs as inline cards in parent
Breadcrumbs: Show doc path in editor header
Sorting
Default: Manual sort via sortOrder field (drag-to-reorder)
Pinned first: Pinned docs always appear at top
Within folders: Docs sorted by sortOrder within folder
Linking & Integration
Project Linking
Field: linkedProjectName (project key)
Display: Badge in doc metadata bar + Resources section of project
Creation: "Create doc for project" action from project page
Unlinking: Right-click doc in project Resources → Remove
Task Linking
Field: linkedTaskId (task ID)
Use case: Attach notes/docs to specific tasks
Display: Doc badge in task detail pane
Client Linking
Field: linkedClientName (client name)
Use case: Client-specific notes, contracts, proposals
Display: Client badge in doc metadata
Google Calendar Integration
Meeting docs can be created from GCal events:

Auto-populate: Title, date, attendees, meet link
Fields: gcalEventId, gcalLink, gcalMeetLink, gcalEventTime
Sync: Edits to doc don't sync back to calendar (one-way)
Today & Lineup Queues
Today (Sun icon, orange)
Purpose: Docs to work on today
Toggle: Click sun icon in toolbar or sidebar item
Display: Shows in Today page alongside tasks
Behavior: Persists until manually removed
Lineup (List icon, blue)
Purpose: Docs queued for this week/upcoming
Toggle: Click lineup icon in toolbar or sidebar item
Display: Shows in Lineup section of Today page
Behavior: Manual queue management (no auto-clear)
Integration with Tasks
Today page shows unified view:

Today tasks (from task system)
Today docs (from workspace docs)
Lineup tasks
Lineup docs
Visual Design System
Typography
Font: Albert Sans (from Figma brand guide)
Title: 32px, 700 weight
Headings: 24px (H1), 20px (H2), 16px (H3), 600-700 weight
Body: 14px, 400 weight
Metadata: 11-12px, 500 weight
Colors (CSS Custom Properties)
Text: var(--text-primary), var(--text-secondary), var(--text-tertiary)
Backgrounds: var(--bg-surface), var(--bg-elevated), var(--bg-hover)
Borders: var(--border-default), var(--border-subtle)
Accent: Coral (#fa6863) for primary actions
Doc Type Colors
Document: Red/coral (#fa6863)
Meeting: Orange (#F59E0B)
Note: Green (#10B981)
Script: Red (#E11D48)
Block Styling
Paragraph: 14px, 1.7 line-height
Headings: Bold, larger size, top margin
Code: Monospace font, gray background, syntax highlighting
Quote: Left border (3px blue), italic, indented
Callout: Rounded box, colored background, icon
Divider: 1px gray line, margin top/bottom
Icons
System: Phosphor Icons library (duotone weight)
Size: 14-22px depending on context
Colors: Match doc type or action context
Interaction Patterns
Creating Documents
Click + New in sidebar → Select doc type
New doc appears in list, opens in editor
Focus on title field (cursor ready to type)
Empty paragraph block ready below
Editing Blocks
Click block to focus (subtle border appears)
Type to edit content
Press Enter to create new block below
Press Backspace on empty block to delete
Drag handle to reorder blocks
Slash Commands
Type / at start of block
Menu appears with options
Type to filter (e.g., /code shows code block)
Arrow keys to navigate, Enter to select
Esc to close menu
Markdown Shortcuts
Type pattern (e.g., ## )
Press Space
Block converts to heading type
Content cleared, ready to type
Multi-Select
Cmd+Click (Mac) or Ctrl+Click (Windows) to select blocks
Checkboxes appear on left
Toolbar appears with batch actions:
Delete selected
Duplicate selected
Convert to child doc (group card)
Change block type
Collaboration
Open doc with URL or doc ID
Real-time connection established (status: "Connected")
See avatars of online users in collaboration bar
Colored cursors show where others are typing
Edits appear live (80ms debounce)
Persistence & Lifecycle
Auto-Save
useEffect(() => {
  if (!initialLoadDone || !accessToken) return;
  clearTimeout(docsSaveRef.current);
  docsSaveRef.current = setTimeout(() => {
    saveWithAuth((token) => api.saveDocs(token, workspaceDocs), "Auto-save docs");
  }, 1500);
  return () => clearTimeout(docsSaveRef.current);
}, [workspaceDocs, saveWithAuth]);
Trigger: Every change to workspaceDocs array
Debounce: 1500ms delay to batch rapid edits
Endpoint: POST /make-server-3baa71aa/save-docs
Storage: Supabase KV store with key docs-${userId}
Loading on Startup
// On session load
const data = await api.loadUserData(accessToken);
if (data.workspaceDocs && Array.isArray(data.workspaceDocs)) {
  setWorkspaceDocs(data.workspaceDocs);
}
Document Updates
Update doc: updateDoc(docId, (doc) => ({ ...doc, title: "New Title" }))
Update block: updateBlock(blockId, (block) => ({ ...block, content: "New text" }))
Insert block: insertBlockAfter(idx, blockType)
Delete block: deleteBlock(idx)
Collaboration Sync
Local change: Update local state → Broadcast op to Supabase Realtime
Remote change: Receive op from channel → Apply to local state (dedupe by userId)
Conflict: Last-write-wins (no merge logic)
Advanced Features
1. Screenplay Formatting (Script Docs)
Block Types
Scene Heading: INT. COFFEE SHOP - DAY
All caps, bold
Autocomplete for locations
Action: Bobby enters, nervous.
Left-aligned, sentence case
Character: BOBBY
Centered, all caps
Autocomplete from scriptCharacters[]
Dialogue: I need to talk to you.
Centered, below character
Parenthetical: (quietly)
Centered, in parentheses
Transition: CUT TO:
Right-aligned, all caps
Fountain Shortcuts
Type at start of empty block:

. → Scene heading
> → Transition
@ → Character (uppercase, centered)
( → Parenthetical
Auto-Advance
Press Enter on:

Character → Creates Dialogue block
Dialogue → Creates Character block (for next speaker)
Scene Heading → Creates Action block
Autocomplete
Characters: Type name → suggests from scriptCharacters[]
Locations: Type location → suggests from scriptLocations[]
Add new: Type name not in list → auto-adds to array
2. Group Cards (Nested Docs)
Creation
Select multiple blocks
Click "Convert to child doc" in toolbar
Enter child doc title
Blocks move to new doc, replaced with card in parent
Card Styles
Compact: Small card with icon + title
List: Vertical list of child blocks
Preview: Shows first few blocks
Gallery: Image grid from child blocks
Board: Kanban-style card
Interaction
Click card → Opens child doc in editor
Edit card → Updates child doc title/icon
Delete card → Unlinks child (doesn't delete child doc)
3. Table Blocks
Structure
tableData: {
  headers: ["Name", "Role", "Email"],
  rows: [
    ["Alice", "Designer", "alice@co.com"],
    ["Bob", "Dev", "bob@co.com"]
  ]
}
Editing
Click cell to edit inline
Click header to rename column
Add row button (+ icon)
Add column button (+ icon)
Delete row/column (hover menu)
4. Unsplash Integration
Search
Click "Unsplash image" in slash menu
Enter search query
Grid of 9 results appears
Click image to insert
Cover Images
Click "Change cover" on existing cover
Search Unsplash or paste URL
Adjust vertical position (drag to reposition)
5. Gallery Blocks
Creation
Slash command → "Gallery"
Empty gallery block inserted
Populating
Click "Add images" button
Search Unsplash OR Upload files OR Paste URLs
Images display in masonry grid
Viewing
Click image thumbnail → Full-screen lightbox
Arrow navigation between images
Drag to reorder
Keyboard Shortcuts Reference
Navigation
Shortcut	Action
↑↓	Move between blocks
Tab	Jump to next block type (heading → paragraph → list)
Shift+Tab	Jump to previous block type
Cmd/Ctrl+K	Open quick search
Editing
Shortcut	Action
Ctrl+B	Bold text
Ctrl+I	Italic text
Ctrl+K	Insert link
Ctrl+/	Inline code
Enter	New block below
Backspace	Delete empty block
Ctrl+D	Duplicate block
Block Types
Shortcut	Action
/	Slash command menu
#	Heading 1
##	Heading 2
###	Heading 3
-	Bullet list
1.	Numbered list
[]	To-do checkbox
>	Quote
---	Divider
Multi-Select
Shortcut	Action
Cmd/Ctrl+Click	Select multiple blocks
Cmd/Ctrl+A	Select all blocks
Delete	Delete selected blocks
Edge Cases & Validations
Empty Document
Always maintains at least 1 block
Deleting last block resets to single empty paragraph
Duplicate Block IDs
Deduplication on load (keeps first occurrence)
Warning logged to console
Missing Doc Type
Defaults to "doc" if docType undefined
Icon defaults to clipboard
Broken Links
linkedProjectName → Show "Unknown Project" if project deleted
linkedDocId (group card) → Show "Deleted Doc" placeholder
Collaboration Conflicts
Concurrent edits to same block → Last write wins
No merge strategy (user sees latest version)
Large Documents
No hard block limit (tested up to 1000+ blocks)
Performance degrades with 500+ blocks (virtualization not implemented)
API Integration
Endpoints
Save Docs:

POST /make-server-3baa71aa/save-docs
Body: { docs: WorkspaceDoc[] }
Headers: { Authorization: `Bearer ${accessToken}` }
Load Docs:

GET /make-server-3baa71aa/load-user-data
Returns: { workspaceDocs: WorkspaceDoc[], ... }
Headers: { Authorization: `Bearer ${accessToken}` }
Unsplash Search:

GET /make-server-3baa71aa/unsplash/search?q=${query}&per_page=9
Returns: { results: UnsplashImage[] }
AI Generation (Gemini):

POST /make-server-3baa71aa/ai/generate
Body: { prompt: string, context: string }
Returns: { content: string }
Integration Points
1. Project Resources
Docs with linkedProjectName appear in project Resources section
Click doc card in Resources → Opens doc editor
"Create doc for project" action creates linked doc
2. Today Page
Shows docs with today: true flag
Mixed with today tasks in unified list
Toggle sun icon to add/remove from Today
3. Lineup Queue
Shows docs with lineup: true flag
Separate section on Today page
Manual queue management
4. Search
Global search (Cmd+K) indexes doc titles and content
Results show doc type icon + snippet
Click to open doc
5. Google Calendar
Import GCal event → Creates meeting doc
Populates attendees, time, meet link
One-way sync (edits don't push to calendar)
Key Files
/src/app/components/DocsPage.tsx: Main docs page (3800+ lines), sidebar, doc list, editor orchestration
/src/app/components/DocEditor.tsx: Legacy meeting note editor (used for simple note editing, deprecated in favor of block editor)
/src/app/components/GeminiAI.tsx: AI integration (slash commands, inline prompts, suggestions)
/src/app/components/useCollaboration.tsx: Real-time collaboration hook (Supabase Realtime)
/src/app/components/CollaborationBar.tsx: Presence indicators, remote cursors, status
/src/app/components/PresentationView.tsx: Presentation mode exporter and viewer
/src/app/App.tsx: WorkspaceDoc interface, state management, persistence
This documentation covers every aspect of the Workspace Docs system: data structures, all 4 doc types, 25+ block types, slash commands, markdown shortcuts, real-time collaboration, AI integration, presentation mode, screenplay formatting, organization (folders, linking, Today/Lineup), visual design, interactions, keyboard shortcuts, persistence, API integration, and all edge cases. Use this as your comprehensive reference when building, debugging, or extending the Docs system.