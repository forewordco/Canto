Workspace Docs — Comprehensive Functionality Prompt
Overview
The Docs system is a full-featured workspace documentation platform modeled after Notion/Craft with deep integration into the project management app. It lives in DocsPage.tsx and is supported by PublishDialog.tsx, PublicViewPage.tsx, PresentationView.tsx, GeminiAI.tsx, useCollaboration.tsx, and CollaborationBar.tsx.

1. Document Types
Four distinct document types, each with unique behavior:

Document (doc) — General-purpose workspace doc (coral icon, ClipboardText)
Meeting (meeting) — Meeting notes with attendees bar, linked project, calendar link, project status picker, and Google Calendar integration fields (gcalEventId, gcalLink, gcalMeetLink, gcalEventTime)
Note (note) — Quick lightweight notes (green icon, Pencil)
Script (script) — Proper screenplay formatting with Courier font, centered title, "Written by" byline, auto-advancing element types (scene-heading → action → character → dialogue → parenthetical → transition cycle), character/location tracking panels, and dedicated screenplay block types
2. Block-Based Editor
Every document is composed of an ordered array of DocBlock objects. Each block has a type, content, and optional metadata.

Text block types:

paragraph, heading1, heading2, heading3
List block types:

bullet, numbered, todo (with checked boolean), toggle (with collapsed boolean)
Rich block types:

quote, callout (with calloutColor and calloutIcon), code (with language), divider
Media block types:

image (paste URL), unsplash-image (with unsplashMeta for attribution), gallery (with galleryImages array of Unsplash results), embed (YouTube/video/photo via embedType + embedUrl), table (with tableData: { headers, rows })
Grouping block type:

group-card — A nested document reference (linkedDocId) rendered inline in one of five card styles: compact, list, preview, gallery, board. Functions as a sub-document that can be opened/navigated into.
Script-specific block types:

scene-heading, action, character, dialogue, parenthetical, transition
Block metadata:

decoration: "focus" (left accent border) or "block" (rounded background container)
color: Override text/accent color from a 12-color palette
fontStyle: "system" | "serif" | "mono" | "round"
3. Editor Interactions
Slash commands (/):

Typing / triggers a filterable slash menu with all block types + AI options
Script mode shows screenplay-specific elements instead
AI slash options: Write, Summarize, Brainstorm, Outline, Continue, Edit
Markdown shortcuts (auto-convert on Space):

# → H1, ## → H2, ### → H3
- or * → bullet, 1. → numbered, [] → todo
> → quote, --- → divider, ``` → code
Keyboard behavior:

Enter creates a new block (script mode auto-advances to the next logical element type)
Backspace on empty block deletes it and focuses previous
Tab indentation within code blocks
@Mentions:

Inline @mention support via MentionInput component for referencing team members, projects, clients
4. Block Selection & Multi-Select
Selection modes:

Single-click selects a block (deselects others)
Shift+click extends selection range
Cmd/Ctrl+click toggles individual blocks
Click-drag sweep across blocks for contiguous selection
Marquee (lasso) selection by clicking empty space and dragging
Selection floating toolbar (bottom-center portal):

Shows count of selected blocks
Block type switchers (H1–H3, paragraph, quote, bullet, numbered, todo, toggle)
Decoration toggles (Focus, Block)
Color palette (6 colors + clear)
AI actions (AI, Improve, Expand, Summarize, Custom) — all operate only on selected text
Group-into-card buttons (Compact, Preview, Gallery, List, Board)
Delete selected / Escape to clear
5. Drag & Drop
Block reorder: Drag handle on each block allows reordering via HTML5 DnD with visual drop indicators (above/below)
Block insertion by drag: Blocks panel items can be dragged directly into the document at a target position
Doc card drag: In grid view, docs can be dragged onto folders to move them
6. Format Panel (Craft-style floating card)
Accessible via the edit/pencil toolbar button. A floating panel anchored to the button with:

Titles: Title / Subtitle / Heading toggle buttons
Content: Strong (quote) / Body (paragraph) / Caption (callout)
Groups: Page / Card
Inline formatting: Bold, Italic, Strikethrough, Code
List types: Todo, Toggle, Bullet, Numbered
Decorations: Focus (accent left border) / Block (rounded container)
Color picker: 12-color grid including rainbow/reset
Font chooser: System, Serif, Mono, Round
7. Blocks Panel (floating card)
Accessible via the + toolbar button. Shows block categories in a grid:

Text: Body, Title, Subtitle, Heading
Lists: Bullet, Number, To-do, Toggle
Rich: Quote, Callout, Code, Divider
Media: Image, Unsplash, Gallery, Video
Data: Table
Script mode shows: Scene Heading, Action, Transition, Character, Lines, Parenthetical, Act, Note, Break

Items are draggable into the document for position-specific insertion.

8. Cover Images
Documents can have a cover image (header banner, 220px tall)
Cover Image Picker with three sources:
Unsplash search (API-connected, returns grid of thumbnails)
Built-in gallery (6 curated images: Gradient, Sunset, Workspace, Studio, Ocean, Forest)
Paste URL
Cover images support vertical repositioning via ImageRepositionOverlay (drag to set coverImageY percentage)
Hover reveals Reposition / Change cover / Remove buttons
9. Document Outline
Toggle-able outline sidebar that renders navigation links from all heading blocks (H1, H2, H3) with indentation
Tracks active heading via scroll position with IntersectionObserver
Click-to-scroll navigation with smooth scrolling
10. Document Organization
Grid view (doc list):

Responsive card grid with doc icon, title, preview text, type badge, timestamp
Hover reveals favorite/today/lineup quick-action buttons
Context menu (right-click) with: Pin, Favorite, Today, Lineup, Private, Duplicate, Move to folder, Delete
Folders:

Create folders with customizable colors (14 color options)
Drag docs into folders
Breadcrumb navigation (All Docs → Folder Name)
Folder context menu: Rename, Change color, Delete (moves docs out)
Folder cards show doc count
Favorites section:

Favorited docs appear in a dedicated top section with star icons
Filtering & Search:

Type filter tabs: All / Document / Meeting / Note / Script
Status filters: Favorited, Today, Lineup, Pinned, Private (toggleable)
Text search across doc titles
Filter dropdown with count badges
Document metadata:

Pin, Favorite, Today (sun icon), Lineup (queue icon) flags
Private/public toggle with lock icon
Owner tracking
Sort order for manual ordering
11. Meeting Documents — Special Features
When doc type is "meeting":

Attendees bar: Add/remove attendees of three types: team member, client, external. Shows avatar circles with add button and invite modal.
Project link: Dropdown to link to a workspace project
Calendar link: Paste or link to a Google Calendar event
Project status picker: On track / At risk / Off track / On hold / Complete / Dropped — color-coded radio buttons
12. Script Documents — Special Features
When doc type is "script":

Courier font family throughout
Centered, uppercase title with "Written by" byline
Auto-advance typing: After pressing Enter, the block type automatically changes to the next logical screenplay element (scene-heading → action → character → dialogue, etc.)
Script Element Toolbar: Quick insert buttons for all screenplay element types
Character & Location panels: Sidebar panels to manage lists of characters and locations with add/remove
Script Autocomplete: When typing in character or scene-heading blocks, shows autocomplete dropdown from saved characters/locations
Bottom bar shows: scene count, element count, character count, location count
13. AI Integration (Gemini)
Slash command AI options:

/ai-write — Generate content from a prompt
/ai-summarize — Summarize existing content
/ai-brainstorm — Generate ideas
/ai-outline — Create document outline
/ai-continue — Continue writing from context
/ai-edit — Edit/revise existing content
AI Inline Prompt: After selecting an AI slash command, an inline prompt input appears below the current block. User types a prompt, AI generates content, and new blocks are inserted.

AI Selection Toolbar: When blocks are selected, AI actions (Improve, Expand, Summarize, Custom) appear in the selection toolbar. Results can replace selected blocks or be inserted after them.

AI Document Sidebar: A dedicated 320px sidebar panel for conversational AI:

Full chat interface with message history
Document context awareness (sends title + content)
Chat messages with user/AI bubbles
AI responses can be inserted as blocks into the document
Typing indicator with bouncing dots
AI Presentation Generator: One-click "Present" button generates a multi-slide presentation from document content using Gemini AI, rendered in a fullscreen PresentationView with slide navigation, speaker notes, and polished dark-theme slides.

14. Real-Time Collaboration
Powered by useCollaboration hook using Supabase Realtime:

Broadcast operations (fine-grained sync):

block_update — Change block content/properties
block_insert — Insert new block after a reference block
block_delete — Remove a block
blocks_reorder — Reorder full block list
title_change — Update document title
meta_change — Update doc metadata (type, icon, linked project, etc.)
Presence tracking:

Remote collaborator avatars in top bar (CollabStatus component)
Per-block cursor indicators showing which block each collaborator is editing (RemoteBlockPresence)
Cursor position tracking within blocks via selectionchange listener with debounced broadcasts
Connection status indicator (connected/reconnecting/disconnected)
Last-write-wins conflict resolution (timestamp-based)
15. Publishing to Web
Publish flow (PublishDialog):

Publish button in editor toolbar opens dialog
Creates a public URL via server API (/publish endpoint)
Shows published status, copy-link button, update/unpublish actions
Publishes document content snapshot to KV storage
Public view (PublicViewPage):

Renders published documents with read-only block rendering
Supports all block types including tables, galleries, embeds, code blocks
Script documents render in screenplay format with Courier font
Shows document metadata: type badge, publish date
Also supports published project views (task lists, status, progress bar, milestones, timeline, attachments)
Branded footer with app logo
16. Group Cards (Nested Documents)
Selected blocks can be grouped into a "card" — a nested sub-document:

Creates a new WorkspaceDoc with the selected blocks as content
Inserts a group-card block with linkedDocId referencing the new doc
Five visual styles: Compact (icon + title), List (title + preview), Preview (full content), Gallery (cover image), Board (styled card)
Clicking a group card navigates into the nested document
Doc navigation maintains a stack for back-button support (docNavStack)
Breadcrumb trail shows document hierarchy
17. Unsplash Integration
Cover image search: Search Unsplash from the cover picker
Unsplash image blocks: Insert standalone Unsplash images with photographer attribution
Gallery blocks: Build multi-image galleries from Unsplash search results
All Unsplash calls go through the server proxy at /unsplash/search
18. Table Blocks
Editable table with configurable headers and rows
Add/remove columns and rows
Inline cell editing
Table data stored as { headers: string[], rows: string[][] }
19. Document Top Navigation Bar
The DocTopNav component provides:

Doc type switcher (Document/Meeting/Note/Script)
Link-to-project dropdown (from workspace projects)
Link-to-client dropdown
Link-to-task dropdown (tasks from linked project)
Private/public toggle
All changes broadcast to collaborators
20. Document Icon System
Each doc type has a default Phosphor icon
Icons are customizable via a picker popover (DocIconPickerPopover) using the full ICON_MAP from ProjectIcon.tsx
Icons render with a colored background badge (DocIconDisplay)
21. Editor Toolbar Strip
Right-aligned action strip below the cover image:

Blocks panel toggle (+ icon)
Format panel toggle (pencil icon)
Full width toggle (expand icon)
AI sidebar toggle (sparkle icon)
Present button — generates AI presentation from document
22. Bottom Status Bar
Shows contextual document stats:

Regular docs: block count
Script docs: scene count, element count, character count, location count
Action buttons: Favorite, Today, Lineup, Pin, Delete
23. Navigation
Grid → Editor: Click a doc card to open it
Editor → Grid: Back button (or breadcrumb "All Docs")
Doc → Nested doc: Click a group card to navigate into it
Navigation stack: Full history stack (docNavStack) with push/pop for back navigation
Return to project: When navigating from a project page, shows a coral "Back to [Project]" button
Breadcrumb trail: Shows hierarchy for nested document navigation
Initial doc deep link: Supports initialDocId prop for opening a specific doc on mount (e.g., from project page or search)
home
