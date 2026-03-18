# Workspace Docs — Comprehensive Overhaul Build Plan

## Gap Analysis Summary

### What Exists Today
- **DocsPage.tsx** (~1353 lines): Grid view with doc cards, basic document editor (title + blocks), 4 doc types, folders, favorites, search/sort, breadcrumb folder nav, create doc modal, context menu, inline publishing
- **DescriptionBlockEditor.tsx** (~600 lines): 9 block types (paragraph, heading, bulleted-list, numbered-list, checklist, quote, code, divider, image), slash commands, markdown shortcuts (`#`, `-`, `>`, `` ``` ``, `---`, `[]`, `1.`), AI rewrite on blocks
- **Types**: `DocBlockType` (9 types), `DocBlock` (id, type, content, level, checked, imageUrl, imageAlt, children), `WorkspaceDoc` (basic 16 fields), `DocFolder` (id, name, parentId, order)
- **PublishedViewer.tsx**: Read-only public viewer for docs & projects
- **AiChatPanel.tsx**: Global AI chat sidebar (not doc-context-aware)
- **MentionInput.tsx**: Standalone @mention component (not integrated into block editor)

### What the Spec Requires (Not Yet Built)
- **14 new block types**: callout, toggle, embed, table, gallery, unsplash-image, group-card, scene-heading, action, character, dialogue, parenthetical, transition, and block metadata (decoration, color, fontStyle, calloutColor, calloutIcon, language, collapsed, embedType, embedUrl, tableData, galleryImages, unsplashMeta, linkedDocId, cardStyle)
- **Block selection system**: Single/shift/cmd/drag/marquee multi-select with floating toolbar
- **Format Panel**: Craft-style floating card (titles, content types, inline formatting, decorations, colors, fonts)
- **Blocks Panel**: Draggable block type grid for position-specific insertion
- **Cover images**: Unsplash search, built-in gallery, URL paste, drag-reposition
- **Document outline**: Heading nav sidebar with scroll-tracking
- **Enhanced organization**: Pin/private/owner flags, status filters, folder colors, drag-to-folder
- **Meeting features**: Attendees bar (3 types), project link, calendar link, status picker
- **Script features**: Courier font, auto-advance typing, element toolbar, character/location panels, autocomplete
- **Group cards**: Nested document references with 5 card styles, navigation stack
- **Doc-specific AI**: 6 AI slash commands, inline prompt, selection AI toolbar, doc-aware sidebar, presentation generator
- **Real-time collaboration**: Supabase Realtime, broadcast ops, presence, remote cursors
- **Table blocks**: Editable headers/rows/columns
- **Media blocks**: Unsplash with attribution, multi-image gallery, video/embed
- **Publishing overhaul**: PublishDialog component, PresentationView, enhanced PublicViewPage
- **Editor toolbar strip**: Blocks/format/fullwidth/AI/present action buttons
- **Bottom status bar**: Block count, script stats, action buttons

---

## Phase D1: Types & Data Model Foundation
**Priority: CRITICAL** | **Depends on: nothing** | **Effort: Small**

Expand all TypeScript types to support the full feature set. This unblocks every subsequent phase.

### D1-1: Expand DocBlockType
```
Add: "callout" | "toggle" | "embed" | "table" | "gallery" | "unsplash-image" | "group-card"
Add script types: "scene-heading" | "action" | "character" | "dialogue" | "parenthetical" | "transition"
```
Total: 9 current + 13 new = 22 block types.

### D1-2: Expand DocBlock interface
```
Add fields:
  calloutColor?: string        // callout accent color
  calloutIcon?: string         // callout icon name
  language?: string            // code block language
  collapsed?: boolean          // toggle block state
  embedType?: "youtube" | "video" | "photo"
  embedUrl?: string
  tableData?: { headers: string[]; rows: string[][] }
  galleryImages?: UnsplashImageMeta[]
  unsplashMeta?: UnsplashImageMeta
  linkedDocId?: string         // group-card reference
  cardStyle?: "compact" | "list" | "preview" | "gallery" | "board"
  decoration?: "focus" | "block"
  color?: string               // text/accent color override
  fontStyle?: "system" | "serif" | "mono" | "round"
```

### D1-3: Expand WorkspaceDoc interface
```
Add fields:
  coverImage?: string          // cover image URL
  coverImageY?: number         // vertical position 0-100
  pinned?: boolean
  private?: boolean
  icon?: string                // custom icon name
  owner?: string               // user ID
  sortOrder?: number           // manual sort order
  gcalLink?: string            // Google Calendar event link
  gcalMeetLink?: string        // Google Meet link
  gcalEventTime?: string       // event ISO timestamp
  linkedProjectId?: string
  linkedClientId?: string
  linkedTaskId?: string
  characters?: string[]        // script: tracked characters
  locations?: string[]         // script: tracked locations
  scriptByline?: string        // script: "Written by" name
```

### D1-4: Expand DocFolder interface
```
Add fields:
  color?: string               // folder accent color
```

### D1-5: Add UnsplashImageMeta interface
```
interface UnsplashImageMeta {
  id: string
  url: string
  thumbUrl: string
  photographer: string
  photographerUrl: string
}
```

**Files:** `/src/app/lib/types.ts`

---

## Phase D2: Enhanced Block Editor Core
**Priority: HIGH** | **Depends on: D1** | **Effort: Large**

Rebuild `DescriptionBlockEditor.tsx` to support all new block types and metadata.

### D2-1: New block type renderers
Add rendering for each new block type inside `BlockItem`:
- **callout**: Colored left border + icon + text area, configurable color/icon
- **toggle**: Disclosure triangle that collapses/expands children content
- **embed**: YouTube/video iframe or photo embed with URL input
- **table**: Inline editable table (see D9 for full implementation)
- **gallery**: Multi-image grid with lightbox preview
- **unsplash-image**: Image with photographer attribution bar
- **group-card**: Nested doc reference card (see D7 for full implementation)

### D2-2: Block metadata support
- **decoration**: "focus" renders left accent border on block, "block" renders rounded background container
- **color**: Override text color from 12-color palette
- **fontStyle**: Apply system/serif/mono/round font family per block

### D2-3: Inline formatting
Add bold/italic/strikethrough/code inline formatting:
- Cmd+B → bold, Cmd+I → italic, Cmd+Shift+S → strikethrough, Cmd+E → inline code
- Store as HTML in block.content (e.g., `<strong>`, `<em>`, `<code>`, `<s>`)
- Render via `dangerouslySetInnerHTML` only for reading; use `document.execCommand` for applying

### D2-4: @Mention integration
- Integrate `MentionInput.tsx` logic into block editor
- Trigger on `@` keystroke, show filterable dropdown of team members, projects, clients
- Store mentions as `<span data-mention-id="..." data-mention-type="...">@Name</span>` in content

### D2-5: Enhanced slash command menu
Expand slash menu to include all new block types:
- Text: Body, Title, Subtitle, Heading
- Lists: Bullet, Number, To-do, Toggle
- Rich: Quote, Callout, Code, Divider
- Media: Image, Unsplash, Gallery, Video/Embed
- Data: Table
- AI: Write, Summarize, Brainstorm, Outline, Continue, Edit
- Script mode: Show screenplay element types instead

### D2-6: Toggle block behavior
- Click disclosure triangle to collapse/expand
- Children blocks indent under toggle
- Collapsed state persisted in `block.collapsed`

**Files:** `/src/app/components/DescriptionBlockEditor.tsx` (major rewrite), new `/src/app/components/docs/BlockRenderers.tsx`

---

## Phase D3: Editor Panels & Toolbar Strip
**Priority: HIGH** | **Depends on: D2** | **Effort: Medium**

### D3-1: Editor Toolbar Strip
Right-aligned action strip below cover image area:
- (+) Blocks panel toggle
- (pencil) Format panel toggle
- (expand) Full-width toggle
- (sparkle) AI sidebar toggle
- (present) Generate AI presentation button

### D3-2: Format Panel (Craft-style floating card)
Floating card anchored to pencil button:
- **Titles section**: Title / Subtitle / Heading toggle buttons
- **Content section**: Strong (quote) / Body (paragraph) / Caption (callout)
- **Groups section**: Page / Card
- **Inline section**: Bold, Italic, Strikethrough, Code
- **Lists section**: Todo, Toggle, Bullet, Numbered
- **Decorations section**: Focus (left accent) / Block (rounded container)
- **Color picker**: 12-color grid with rainbow/reset
- **Font chooser**: System, Serif, Mono, Round

### D3-3: Blocks Panel (floating card)
Floating card anchored to + button:
- Category grid layout with labeled sections
- Text: Body, Title, Subtitle, Heading
- Lists: Bullet, Number, To-do, Toggle
- Rich: Quote, Callout, Code, Divider
- Media: Image, Unsplash, Gallery, Video
- Data: Table
- Items are draggable into the document for position-specific insertion
- Script mode shows screenplay elements instead

**Files:** New `/src/app/components/docs/EditorToolbar.tsx`, `/src/app/components/docs/FormatPanel.tsx`, `/src/app/components/docs/BlocksPanel.tsx`

---

## Phase D4: Cover Images & Document Outline
**Priority: MEDIUM** | **Depends on: D1** | **Effort: Medium**

### D4-1: Cover image system
- 220px tall banner at top of document editor
- Hover reveals: Reposition / Change cover / Remove buttons
- `ImageRepositionOverlay`: Drag to set `coverImageY` percentage

### D4-2: Cover Image Picker modal
Three sources:
- **Unsplash search**: API-connected grid via `/unsplash/search` server route
- **Built-in gallery**: 6 curated images (Gradient, Sunset, Workspace, Studio, Ocean, Forest)
- **Paste URL**: Direct URL input

### D4-3: Document Outline sidebar
- Toggle-able panel showing heading hierarchy (H1/H2/H3) with indentation
- `IntersectionObserver` to track active heading on scroll
- Click-to-scroll with smooth scrolling
- Updates dynamically as headings are added/removed

**Files:** New `/src/app/components/docs/CoverImage.tsx`, `/src/app/components/docs/CoverImagePicker.tsx`, `/src/app/components/docs/DocOutline.tsx`

---

## Phase D5: Enhanced Document Organization
**Priority: MEDIUM** | **Depends on: D1** | **Effort: Medium**

### D5-1: Enhanced document metadata
- Pin, Favorite (star), Today (sun), Lineup (queue) flags on docs
- Private/public toggle with lock icon
- Owner tracking per doc

### D5-2: Status filter bar
Toggleable filters below header:
- All / Favorited / Today / Lineup / Pinned / Private
- Filter dropdown with count badges
- Type filter tabs: All / Document / Meeting / Note / Script

### D5-3: Folder colors
- 14-color options for folder customization
- Color picker in folder context menu ("Change color")
- Folder card shows colored icon/accent

### D5-4: Drag-to-folder
- Drag doc cards onto folder cards to move docs into folders
- Visual drop highlight on target folder
- HTML5 DnD with drag preview

### D5-5: Enhanced context menu
Right-click on doc card shows:
- Pin, Favorite, Today, Lineup, Private toggles
- Duplicate, Move to folder submenu, Delete

### D5-6: Document Top Navigation Bar (DocTopNav)
Editor top bar with:
- Doc type switcher (Document/Meeting/Note/Script)
- Link-to-project dropdown
- Link-to-client dropdown
- Link-to-task dropdown (tasks from linked project)
- Private/public toggle

### D5-7: Bottom Status Bar
- Regular docs: block count
- Script docs: scene count, element count, character count, location count
- Action buttons: Favorite, Today, Lineup, Pin, Delete

### D5-8: Document Icon System
- Each doc type has a default Phosphor icon
- Customizable via DocIconPickerPopover using full ICON_MAP
- DocIconDisplay: Icon with colored background badge

**Files:** `/src/app/components/DocsPage.tsx` (updates), new `/src/app/components/docs/DocTopNav.tsx`, `/src/app/components/docs/DocStatusBar.tsx`, `/src/app/components/docs/DocIconPicker.tsx`

---

## Phase D6: Block Selection & Multi-Select
**Priority: MEDIUM** | **Depends on: D2, D3** | **Effort: Large**

### D6-1: Selection state management
- `selectedBlockIds: Set<string>` state in editor
- Selection modes: single-click, shift-click range, cmd/ctrl-click toggle
- Click-drag sweep across blocks for contiguous selection

### D6-2: Marquee (lasso) selection
- Click empty space and drag to create selection rectangle
- Blocks intersecting the rectangle get selected
- Visual marquee overlay

### D6-3: Selection Floating Toolbar
Fixed bottom-center portal showing:
- Selected block count badge
- **Type switchers**: H1, H2, H3, paragraph, quote, bullet, numbered, todo, toggle
- **Decoration toggles**: Focus, Block
- **Color palette**: 6 colors + clear
- **AI actions**: Improve, Expand, Summarize, Custom (operate on selected text)
- **Group-into-card buttons**: Compact, Preview, Gallery, List, Board
- Delete selected / Escape to clear selection

### D6-4: Block visual selection state
- Selected blocks show blue highlight border/background
- Drag handle shows on selected blocks
- Keyboard: Escape clears selection, Delete removes selected blocks

**Files:** `/src/app/components/DescriptionBlockEditor.tsx` (major additions), new `/src/app/components/docs/SelectionToolbar.tsx`

---

## Phase D7: Meeting Document Features
**Priority: MEDIUM** | **Depends on: D1, D5** | **Effort: Medium**

### D7-1: Attendees bar
- Horizontal bar below title for meeting docs
- Three attendee types: team member, client, external (email)
- Avatar circles with colored borders by type
- (+) button opens attendee invite modal
- Remove attendee on click/hover

### D7-2: Project link dropdown
- Dropdown to link meeting doc to a workspace project
- Shows project name + color dot when linked
- Populates related tasks for linking

### D7-3: Calendar link field
- Paste Google Calendar event link
- Display linked event time, meet link
- Google Calendar integration via gcalEventId/gcalLink/gcalMeetLink

### D7-4: Project status picker
- On track / At risk / Off track / On hold / Complete / Dropped
- Color-coded radio buttons matching ProjectStatus type
- Only visible on meeting-type docs

**Files:** New `/src/app/components/docs/MeetingBar.tsx`, `/src/app/components/docs/AttendeeModal.tsx`

---

## Phase D8: Script Document Features
**Priority: MEDIUM** | **Depends on: D1, D2** | **Effort: Large**

### D8-1: Script block type renderers
- `scene-heading`: Uppercase, bold, left-aligned
- `action`: Regular text, full width
- `character`: Uppercase, centered
- `dialogue`: Centered, indented
- `parenthetical`: Centered, in parentheses, italic
- `transition`: Uppercase, right-aligned
- All in Courier Prime font

### D8-2: Script title page
- Centered, uppercase title
- "Written by" byline (from `doc.scriptByline`)
- Proper screenplay formatting

### D8-3: Auto-advance typing
- After Enter in a script block, automatically advance to next logical element type:
  - scene-heading -> action -> character -> dialogue -> parenthetical -> transition -> scene-heading
- Tab to cycle between element types manually

### D8-4: Script Element Toolbar
- Quick insert buttons for all screenplay element types
- Horizontal bar above or below editor
- Shows only for script-type docs

### D8-5: Character & Location panels
- Sidebar panels listing tracked characters and locations
- Add/remove from panels
- Auto-populate from content (scan scene-heading for locations, character blocks for characters)

### D8-6: Script Autocomplete
- When typing in character blocks: dropdown from saved characters list
- When typing in scene-heading blocks: dropdown from saved locations list
- Fuzzy matching

### D8-7: Script bottom stats bar
- Scene count, element count, character count, location count
- Updates in real-time as content changes

**Files:** New `/src/app/components/docs/ScriptEditor.tsx`, `/src/app/components/docs/ScriptToolbar.tsx`, `/src/app/components/docs/ScriptPanels.tsx`

---

## Phase D9: Table & Media Blocks
**Priority: MEDIUM** | **Depends on: D2** | **Effort: Medium**

### D9-1: Table block
- Editable table with configurable headers and rows
- Add/remove columns (header-level +/- buttons)
- Add/remove rows (row-level +/- buttons)
- Inline cell editing with Tab to advance
- Data stored as `{ headers: string[], rows: string[][] }`

### D9-2: Unsplash image block
- Search Unsplash via `/unsplash/search` server route
- Insert image with photographer attribution bar
- Store `unsplashMeta` for proper attribution

### D9-3: Gallery block
- Multi-image gallery from Unsplash search results
- Grid layout (2-4 columns)
- Click to expand/lightbox
- Store `galleryImages` array

### D9-4: Embed block
- YouTube video embed (auto-detect URL, render iframe)
- Generic video embed
- Photo embed
- `embedType` + `embedUrl` stored on block

**Files:** New `/src/app/components/docs/TableBlock.tsx`, `/src/app/components/docs/UnsplashBlock.tsx`, `/src/app/components/docs/GalleryBlock.tsx`, `/src/app/components/docs/EmbedBlock.tsx`

---

## Phase D10: Group Cards & Nested Docs
**Priority: LOW** | **Depends on: D2, D6** | **Effort: Large**

### D10-1: Group-card block type
- When blocks are selected, "Group into card" option in selection toolbar
- Creates a new `WorkspaceDoc` with selected blocks as content
- Replaces selected blocks with a single `group-card` block referencing the new doc via `linkedDocId`

### D10-2: Five card styles
- **Compact**: Small icon + title only
- **List**: Title + preview text
- **Preview**: Full rendered content inline
- **Gallery**: Cover image prominent
- **Board**: Styled card with metadata

### D10-3: Navigation stack
- Clicking a group card navigates into the nested document
- `docNavStack: string[]` for history
- Back button pops stack to return to parent doc
- Breadcrumb trail shows document hierarchy

### D10-4: Nested doc rendering
- Group-card block fetches linked doc and renders inline preview
- Edit in place or click to navigate into full editor

**Files:** New `/src/app/components/docs/GroupCard.tsx`, updates to `DocsPage.tsx` for nav stack

---

## Phase D11: Doc-Specific AI Integration
**Priority: LOW** | **Depends on: D2, D3** | **Effort: Large**

### D11-1: AI slash commands
Add 6 AI options to slash menu:
- `/ai-write` — Generate content from prompt
- `/ai-summarize` — Summarize existing content
- `/ai-brainstorm` — Generate ideas
- `/ai-outline` — Create document outline
- `/ai-continue` — Continue writing from context
- `/ai-edit` — Edit/revise existing content

### D11-2: AI Inline Prompt
- After selecting an AI slash command, inline prompt input appears below current block
- User types prompt, AI generates content via Gemini API
- New blocks inserted after the prompt block
- Loading state with typing indicator

### D11-3: AI Selection Toolbar actions
- When blocks are selected, AI actions in selection toolbar:
  - Improve, Expand, Summarize, Custom prompt
- Results can replace selected blocks or be inserted after them
- Uses existing Gemini API routes

### D11-4: Doc-Aware AI Sidebar
- Dedicated 320px sidebar panel (separate from global AiChatPanel)
- Full chat interface with message history
- Document context: sends title + all block content to AI
- AI responses can be "inserted" as blocks at cursor position
- Typing indicator with bouncing dots

### D11-5: AI Presentation Generator
- "Present" button in editor toolbar
- Sends doc content to Gemini with presentation generation prompt
- Returns structured slide data (title, content, speaker notes per slide)
- Renders in fullscreen `PresentationView`:
  - Slide navigation (arrow keys, click)
  - Speaker notes toggle
  - Dark theme with polished slide designs
  - Slide counter

**Files:** New `/src/app/components/docs/DocAiSidebar.tsx`, `/src/app/components/docs/AiPromptInline.tsx`, `/src/app/components/docs/PresentationView.tsx`, updates to `DescriptionBlockEditor.tsx`, server AI routes

---

## Phase D12: Real-Time Collaboration
**Priority: LOW** | **Depends on: D2** | **Effort: Large**

### D12-1: useCollaboration hook
- Supabase Realtime channel per document: `doc:{docId}`
- Join on mount, leave on unmount
- Broadcast and listen for operations

### D12-2: Broadcast operations
Fine-grained sync messages:
- `block_update` — Changed block content/properties
- `block_insert` — New block inserted after reference
- `block_delete` — Block removed
- `blocks_reorder` — Full block list reorder
- `title_change` — Doc title updated
- `meta_change` — Doc metadata updated (type, icon, project link, etc.)

### D12-3: Presence tracking
- Track which collaborators are viewing the document
- Remote collaborator avatars in top bar (`CollabStatus` component)
- Color-coded user indicators

### D12-4: Remote cursor indicators
- Per-block cursor indicators showing which block each collaborator is editing
- `RemoteBlockPresence` component: colored dot/name next to active block
- Cursor position within blocks via `selectionchange` listener
- Debounced position broadcasts (100ms)

### D12-5: Connection status
- Connected / Reconnecting / Disconnected indicator
- Auto-reconnect on disconnect
- Last-write-wins conflict resolution (timestamp-based)

### D12-6: CollaborationBar component
- Top bar showing connected collaborators, status, share button

**Files:** New `/src/app/hooks/useCollaboration.ts`, `/src/app/components/docs/CollaborationBar.tsx`, `/src/app/components/docs/RemoteBlockPresence.tsx`

---

## Phase D13: Publishing & Presentation Overhaul
**Priority: LOW** | **Depends on: D2, D11** | **Effort: Medium**

### D13-1: PublishDialog component
- Replaces inline publish menu in editor
- Full modal with:
  - Publish/Update/Unpublish buttons
  - Published URL display with copy button
  - Published status indicator
  - Last published timestamp

### D13-2: Enhanced PublicViewPage
- Support all new block types: callout, toggle, table, gallery, embed, unsplash-image, group-card
- Script documents render in proper screenplay format with Courier font
- Meeting docs show attendee bar, project link
- Document metadata: type badge, publish date, author

### D13-3: PresentationView
- Fullscreen presentation mode
- Multi-slide layout generated by AI (D11-5)
- Keyboard navigation (arrow keys, Escape to exit)
- Slide transitions (fade)
- Speaker notes panel (toggle-able)
- Dark theme with polished slide designs
- Slide counter / progress bar

**Files:** New `/src/app/components/docs/PublishDialog.tsx`, `/src/app/components/docs/PresentationView.tsx`, updates to `PublishedViewer.tsx`

---

## Phase D14: Polish & Integration
**Priority: LOW** | **Depends on: all above** | **Effort: Medium**

### D14-1: Mobile responsive polish
- Touch-friendly block interactions
- Responsive panels (bottom sheet on mobile for format/blocks panels)
- Swipe gestures for navigation
- Mobile-optimized cover image repositioning

### D14-2: Keyboard shortcuts refinement
- Full shortcut map: Cmd+B/I/U, Cmd+Shift+S (strikethrough), Cmd+E (code)
- Cmd+/ to toggle slash menu
- Cmd+Shift+H for heading cycle
- Escape to clear selection, exit panels

### D14-3: Performance optimization
- Virtualize block list for large documents (>100 blocks)
- Debounce block content sync to KV (300ms)
- Lazy load heavy block types (table, gallery, embed)
- Memoize block renderers

### D14-4: Error handling & edge cases
- Empty state handling for all new features
- Graceful degradation when Unsplash/AI APIs are unavailable
- Undo/redo support (block-level history stack)

### D14-5: Integration with existing features
- Command palette: deep-link into docs with specific block focused
- Home page: Today/Lineup doc cards with cover image preview
- Notifications: @mention in doc triggers notification
- Calendar: Meeting docs linked to calendar events

---

## Recommended Implementation Order

```
Sprint 1 (Foundation):     D1 -> D2 (core blocks + metadata)
Sprint 2 (Editor UX):      D3 (panels + toolbar) -> D4 (cover + outline)
Sprint 3 (Organization):   D5 (filters, folders, nav bar, status bar, icons)
Sprint 4 (Selection):      D6 (multi-select + selection toolbar)
Sprint 5 (Doc Types):      D7 (meetings) -> D8 (scripts)
Sprint 6 (Rich Content):   D9 (table + media blocks)
Sprint 7 (Advanced):       D10 (group cards) -> D11 (AI integration)
Sprint 8 (Collaboration):  D12 (realtime collab)
Sprint 9 (Publishing):     D13 (publish dialog + presentation)
Sprint 10 (Polish):        D14 (mobile, keyboard, perf, integration)
```

## File Architecture

```
/src/app/components/
  DocsPage.tsx                        # Main page (grid + editor orchestration)
  DescriptionBlockEditor.tsx          # Core block editor engine
  docs/
    BlockRenderers.tsx                # All block type render components
    EditorToolbar.tsx                 # Action strip (blocks/format/AI/present)
    FormatPanel.tsx                   # Craft-style format floating card
    BlocksPanel.tsx                   # Block type grid floating card
    CoverImage.tsx                    # Cover image display + reposition
    CoverImagePicker.tsx              # Cover source picker modal
    DocOutline.tsx                    # Heading outline sidebar
    DocTopNav.tsx                     # Doc type/project/client/task nav bar
    DocStatusBar.tsx                  # Bottom stats + action bar
    DocIconPicker.tsx                 # Custom icon picker popover
    SelectionToolbar.tsx              # Multi-select floating toolbar
    MeetingBar.tsx                    # Meeting attendees + project + calendar
    AttendeeModal.tsx                 # Add attendee modal
    ScriptEditor.tsx                  # Script-specific editor wrapper
    ScriptToolbar.tsx                 # Script element quick-insert bar
    ScriptPanels.tsx                  # Character & location sidebars
    TableBlock.tsx                    # Editable table component
    UnsplashBlock.tsx                 # Unsplash image with attribution
    GalleryBlock.tsx                  # Multi-image gallery
    EmbedBlock.tsx                    # YouTube/video/photo embed
    GroupCard.tsx                     # Nested document card
    DocAiSidebar.tsx                  # Doc-aware AI chat sidebar
    AiPromptInline.tsx                # Inline AI prompt below block
    PresentationView.tsx              # Fullscreen slide presentation
    PublishDialog.tsx                  # Publish modal
    CollaborationBar.tsx              # Collab status + avatars bar
    RemoteBlockPresence.tsx           # Per-block remote cursor indicator
  
/src/app/hooks/
  useCollaboration.ts                 # Supabase Realtime collaboration hook

/src/app/lib/
  types.ts                            # Expanded type definitions
```

## Total Effort Estimate
- **~14 phases, ~60+ sub-tasks**
- **~15-20 new component files**
- **Estimated: 8,000-12,000 lines of new code**
- **Major rewrites: DescriptionBlockEditor.tsx, DocsPage.tsx, types.ts**
