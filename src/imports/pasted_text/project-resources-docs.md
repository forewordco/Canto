Project Resources Section — Complete Feature Documentation
Overview
The app includes a rich Resources section that appears directly above the task list on each project's page. Resources act as a project-level attachment system, allowing teams to collect and organize documents, links, videos, image galleries, and travel/production logistics in one centralized place. Resources support both workspace documents (notes, meeting notes, scripts) created within the app and external content (links, videos, image galleries, travel planning).

Data Architecture
ProjectAttachment Interface
Resources are stored as ProjectAttachment objects in the project.projectAttachments[] array:

interface ProjectAttachment {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  type: "image" | "video" | "link" | "document" | "gallery" | "travel";
  url?: string;                  // External URL (for link, video types)
  thumbnail?: string;            // Preview image URL (for gallery)
  size?: string;                 // File size display string
  storageKey?: string;           // Supabase Storage reference (for uploaded files)
  images?: string[];             // Array of image URLs (for gallery type)
  travelItems?: TravelItem[];    // Array of travel logistics (for travel type)
}
TravelItem Interface
Travel resources contain categorized expense/logistics items:

interface TravelItem {
  id: string;
  category: "flight" | "stay" | "car_rental" | "gear" | "food" | "parking";
  title: string;                 // Item name
  details: string;               // Description/notes
  link?: string;                 // Confirmation link or booking URL
  cost: number;                  // Expense amount
}
Storage & Persistence
Resources stored in projects[projectName].projectAttachments[] array
Persisted to Supabase via saveProjects on every change
Uploaded files stored in Supabase Storage with signed URLs
Workspace documents (type: "document") linked via linkedProjectName field
Resource Types
1. Workspace Documents (Created in-app)
Types: Document, Meeting notes, Note, Script
Creation: Click "+ Add" → Select document type → Creates new doc in workspace
Display: Doc icon (colored by type) + title
Interaction: Click to open in DocEditor modal
Context menu: Right-click for delete option
Visual:
Purple doc icon (#6C63FF background)
28×28px rounded icon square
Truncated title (max 120px width)
Hover shows X button to remove
2. Link Resources
Icon: Chain link icon (#6159e1)
Creation: Click "+ Add" → "Link" → Enter URL + optional title
Display: Icon + title + domain preview
Interaction: Click to open URL in new tab
Metadata: Shows domain extracted from URL (e.g., "docs.google.com")
Visual:
Blue/purple link icon
Domain in small gray text below title
3. Video Resources
Icon: Video camera icon (#fa6863 coral)
Creation: Click "+ Add" → "Video" → Enter URL + optional title
Supported platforms: YouTube, Vimeo, Loom, direct MP4/WebM/OGG/MOV files
Display: Video icon + title + domain
Interaction: Click to open embedded video player modal
Embed detection:
YouTube: Extracts video ID, embeds with autoplay
Vimeo: Extracts video ID, embeds with autoplay
Loom: Extracts share ID, embeds with autoplay
Direct video: Uses file URL directly
4. Image Gallery
Icon: Gallery/image icon (#E67E22 orange) OR thumbnail of first image
Creation: Click "+ Add" → "Image Gallery" → Auto-creates empty gallery
Display: Shows first image as 28×28px thumbnail OR orange icon + "X images" count
Interaction: Click to open gallery manager modal
Features:
Masonry grid layout (3 columns)
Drag-to-reorder images
Add images via: Unsplash search, file upload, paste URL
Full-screen lightbox viewer with prev/next navigation
Editable gallery name (click title to rename)
Remove individual images
Visual:
Orange accent color throughout
Image count badge: "X images"
5. Travel Details
Icon: Airplane/expand icon (#2ECC71 green)
Creation: Click "+ Add" → "Travel Details" → Auto-creates empty travel resource
Display: Icon + title + "X items · $Y" summary
Categories:
Flight (purple): Flights and air travel
Stay (orange): Hotels, lodging
Car Rental (purple): Vehicle rentals
Gear (green): Equipment needed
Food (coral): Meals, catering
Parking (blue): Parking expenses
Interaction: Click to open travel manager modal
Features:
Add items by category with title, details, link, cost
Total cost calculation displayed in header
Category-grouped list with colored icons
Edit/delete individual items
Visual:
Green accent color
Cost shown as "$X,XXX" formatted
Item count: "X items"
Visual Design
Section Layout
Location: Between project header divider and task list
Header: "RESOURCES" in uppercase, 12px, bold (#6f6e6f)
Spacing: 7px gap between header and cards
Card grid: Flexbox wrap with 10px gaps
Background: Cards are white with 1px border (#eceae9)
Hover state: Subtle shadow appears on hover
Resource Card Design
┌─────────────────────────────┐
│ [Icon] Title         [×]    │  ← 11px horizontal padding, 10px vertical
│        Metadata             │     Icon: 28×28px rounded square
└─────────────────────────────┘     Title: 12px, 600 weight, truncated
Dimensions: Auto-width based on content, min height 48px
Border: 1px solid #eceae9
Border radius: 10px
Icon background: Translucent color (e.g., rgba(108,99,255,0.13) for docs)
Remove button: Appears on hover, top-right, 18×18px circle
Cursor: Pointer
Icon Colors by Type
Documents: Purple/blue (#6C63FF)
Links: Blue (#6159e1)
Videos: Coral (#fa6863)
Galleries: Orange (#E67E22)
Travel: Green (#2ECC71)
Add Resource Button
Style: Dashed border (1px, #e0dedd), muted color (#cfcbcb)
Hover: Border becomes #afabab, text becomes #6f6e6f, background #fafaf9
Icon: Plus sign (12×12px)
Label: "Add" in 11px, 500 weight
Interaction Patterns
1. Adding Resources
Dropdown Menu
Click "+ Add" button → Dropdown menu appears with:

Documents Section (with separator header):

Document (purple doc icon)
Meeting notes (orange clock icon)
Note (green lines icon)
Script (red script icon)
Other Section (with separator header):

Link (blue chain icon)
Video (coral video icon)
Image Gallery (orange gallery icon)
Travel Details (green airplane icon)
Menu styling:

Backdrop closes menu
10px rounded corners
Elevated shadow
Hover state on items (#bg-hover-solid)
14px icon + 12px label per row
Link/Video Addition Flow
Click "Link" or "Video" in menu
Modal appears with URL input + optional title input
Enter URL (auto-prefixes http:// if missing)
Enter title (optional, defaults to URL)
Click "Add" or press Enter
Modal closes, resource card appears
Gallery/Travel Creation Flow
Click "Image Gallery" or "Travel Details"
Resource auto-created with default name
Manager modal opens immediately
User can populate content
2. Interacting with Resources
Click Actions
Document: Opens DocEditor modal with full document
Link: Opens URL in new browser tab
Video: Opens video player modal with embedded iframe
Gallery: Opens gallery manager modal
Travel: Opens travel details manager modal
Hover Actions
Card shadow increases
Remove button (×) fades in (opacity 0 → 100)
Remove button background changes on hover (#f0efee)
Context Menu (Documents only)
Right-click document card → Shows delete option
Used for unlinking doc from project
Remove Action
Click × button → Removes resource from project
If uploaded file, also deletes from Supabase Storage
No confirmation dialog (instant removal)
Gallery Manager Modal
Layout
Dimensions: 820px wide, max-height 85vh
Background: Elevated surface with shadow and border
Sections:
Header with editable title (14px, 600 weight)
Masonry grid (3 columns, 10px gaps)
Footer with add-images tools
Header
Icon: Orange gallery icon (18px)
Title: Click to edit (inline input, auto-focus, save on blur/Enter)
Count: "X images" in gray (11px, 400 weight)
Close button: Top-right X (28×28px)
Masonry Grid
Layout: CSS columns (3), balanced fill
Image cards:
Rounded 8px corners
Hover: Scale 1.02, semi-transparent black overlay
Remove button: Top-right, appears on hover
Drag handle: Top-left dots icon, appears on hover
Drag-to-reorder:
Draggable attribute enabled
Drag over shows orange outline
Drop reorders array and saves
Click image: Opens lightbox at that index
Add Images Tools (Footer)
Three input methods in 2 rows:

Row 1: Unsplash Search + Upload

Unsplash input:
Search icon + text input + "Search" button
Enter key triggers search
Returns 10 thumbnail results below
Click thumbnail to add full-res image
Orange loading spinner during search
Upload button:
Hidden file input (accept="image/*", multiple)
FileReader converts to data URLs
Appends all selected images to gallery
Row 2: Paste URL

Text input with link icon
Paste or type image URL
Enter key or "Add" button appends to gallery
Input clears after add
Unsplash Results (appears conditionally):

Horizontal scrolling strip
90×65px thumbnails with hover ring
Plus icon overlay on hover
Click to add image
Lightbox Viewer
Full-screen modal over gallery modal (z-index 500):

Background: rgba(0,0,0,0.85)
Close button: Top-right white X on semi-transparent circle
Navigation:
Left arrow (appears if not first image)
Right arrow (appears if not last image)
Arrows are white circles on left/right edges
Image: Max 85vw × 85vh, centered, rounded 8px
Counter: Bottom-center, "X / Y" in white/semi-transparent
Click background: Closes lightbox (returns to grid)
Arrow keys: Navigate between images (future enhancement)
Travel Manager Modal
Layout
Dimensions: 580px wide, max-height 85vh
Background: Elevated surface
Sections:
Header with title + total cost
Scrollable item list grouped by category
Footer with category buttons
Header
Icon: Green airplane icon (18px)
Title: "Travel Details" (14px, 600 weight)
Total: "$X,XXX" in large text (18px, 700 weight, #2ECC71)
Close button: Top-right X
Item List (Scrollable body)
Grouped by category with headers:

Category header: Icon + label (uppercase, 10px, 700 weight)
Items:
Title (13px, 600 weight) + cost (right-aligned, $X)
Details (11px, 400 weight, gray, truncated)
Link (if present): Small chain icon + underlined URL
Edit/Delete buttons on hover
Add Item Form (appears when category selected)
Inline form with fields:

Title: Text input
Details: Text input
Link: URL input (optional)
Cost: Number input with $ prefix
Buttons: "Add [Category]" (green) + Cancel (gray)
Footer (Category buttons)
Six pill-shaped buttons:

Flight (purple), Stay (orange), Car Rental (purple)
Gear (green), Food (coral), Parking (blue)
Each has colored icon + label
Click to show add-item form for that category
Editing Items
Click item → Expands to edit form
Same fields as add form, pre-filled
Save or Cancel buttons
Cost Calculation
Auto-sums all item costs
Displays in header as $X,XXX (with comma thousands separator)
Updates live as items are added/edited/removed
Video Player Modal
Layout
Dimensions: 80vw wide, max 900px, auto height
Background: Black (#000)
Embedded iframe: Full width, 16:9 aspect ratio (approx)
Close button: Top-right white X on semi-transparent circle
Embed Logic
getEmbedUrl(url: string): string | null {
  // YouTube: youtube.com/watch?v= or youtu.be/
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  
  // Vimeo: vimeo.com/123456
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  
  // Loom: loom.com/share/abc123
  const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch) return `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`;
  
  // Direct video file: .mp4, .webm, .ogg, .mov
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return url;
  
  return null; // Unsupported format
}
Iframe
Width: 100%
Height: 500px (approx 16:9 for 900px width)
Allow: autoplay, fullscreen, picture-in-picture
No border
Interaction
Click background → Closes modal
Click close button → Closes modal
Iframe click → Doesn't close (stopPropagation)
Workspace Document Integration
Linking Documents to Projects
Documents in Workspace Docs can be linked to projects:

Field: linkedProjectName in WorkspaceDoc
Filter: linkedDocs = workspaceDocs.filter(d => d.linkedProjectName === projectName)
Display: Shows in Resources section alongside attachments
Document Types (with icons)
const DOC_TYPE_META = {
  doc:     { color: "#6159e1", label: "Document" },     // Purple
  meeting: { color: "#F59E0B", label: "Meeting" },      // Orange
  note:    { color: "#10B981", label: "Note" },         // Green
  script:  { color: "#E11D48", label: "Script" },       // Red
};

const DOC_DEFAULT_ICONS = {
  doc:     "FileText",      // Document lines icon
  meeting: "Calendar",      // Clock/calendar icon
  note:    "StickyNote",    // Note icon
  script:  "FileCode",      // Script/code icon
};
Opening Documents
Click doc card → onOpenProjectDoc(docId) callback
Opens DocEditor modal (same editor as Workspace Docs page)
Full editing capabilities (title, type, icon, content, tags)
Changes sync to workspace docs array
Unlinking Documents
Right-click doc card → Context menu → Delete option
Calls onDeleteProjectDoc(docId) callback
Removes linkedProjectName field (doc remains in workspace)
Does not delete the document itself
CRUD Operations
Create Resource
// Link or Video
const addResourceAttachment = (type: "link" | "video", title: string, url: string) => {
  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const att: ProjectAttachment = { id, name: title || url, type, url };
  onUpdateAttachments([...project.projectAttachments, att]);
};

// Gallery (empty)
const att: ProjectAttachment = { id, name: "Image Gallery", type: "gallery", images: [] };
onUpdateAttachments([...project.projectAttachments, att]);

// Travel (empty)
const att: ProjectAttachment = { id, name: "Travel Details", type: "travel", travelItems: [] };
onUpdateAttachments([...project.projectAttachments, att]);

// Workspace Doc (created in Workspace Docs system, linked via linkedProjectName)
Update Resource
// Rename gallery
const renameGallery = (galleryId: string, name: string) => {
  onUpdateAttachments(project.projectAttachments.map(a =>
    a.id === galleryId ? { ...a, name } : a
  ));
};

// Update gallery images
const updateGalleryImages = (galleryId: string, images: string[]) => {
  onUpdateAttachments(project.projectAttachments.map(a =>
    a.id === galleryId ? { ...a, images, thumbnail: images[0] || undefined } : a
  ));
};

// Update travel items
const updateTravelItems = (travelId: string, items: TravelItem[]) => {
  onUpdateAttachments(project.projectAttachments.map(a =>
    a.id === travelId ? { ...a, travelItems: items } : a
  ));
};
Delete Resource
const removeAttachment = (id: string) => {
  const att = project.projectAttachments.find(a => a.id === id);
  
  // Delete file from Supabase Storage if uploaded
  if (att?.storageKey && accessToken) {
    api.deleteFile(accessToken, att.storageKey).catch(err => 
      console.error("Failed to delete file from storage:", err)
    );
  }
  
  // Remove from array
  onUpdateAttachments(project.projectAttachments.filter(a => a.id !== id));
};
Persistence Flow
User action → updateGalleryImages/updateTravelItems/renameGallery/addResourceAttachment
→ onUpdateAttachments(newArray)
→ App.tsx: updateProjectField("projectAttachments", newArray)
→ setProjects({ ...prev, [projectName]: { ...project, projectAttachments: newArray } })
→ useEffect → saveProjects(projects)
→ api.saveProjects(accessToken, projects)
→ POST /make-server-3baa71aa/save-projects
→ Supabase kv_store_3baa71aa
Empty States
No Resources
Only shows "RESOURCES" header + "+ Add" button
No placeholder message (clean minimal look)
Empty Gallery
Large gray gallery icon (48px)
Message: "No images yet. Search Unsplash, upload files, or paste a URL below."
Centered in main area
Empty Travel
No items, just category buttons
Total shows "$0"
Click category to add first item
Edge Cases & Validations
Link/Video Addition
Empty URL: Add button disabled
Missing protocol: Auto-prepends https:// if URL doesn't start with http/https
Title fallback: If no title entered, uses URL as title
Domain extraction: Removes protocol + path for display (e.g., "docs.google.com")
Gallery
Max images: No hard limit (UI handles large galleries via scroll)
Image loading: No loading state (images load progressively)
Failed image URLs: Broken image icon shown by browser
Drag reorder: Prevents drop on self (no-op if fromIdx === toIdx)
Travel
Cost parsing: Number input enforces numeric-only
Negative costs: Allowed (for refunds/credits)
Missing fields: Title required, details/link optional
Total calculation: Sum of all costs, handles decimals
Unsplash Search
Empty query: Search disabled
API failure: Logged to console, no UI error state yet
Rate limiting: Not handled (Unsplash free tier limits)
Keyboard Shortcuts
Gallery Lightbox
ESC: Close lightbox (returns to grid) — Implemented via backdrop click only currently
Left/Right arrows: Navigate images — Not yet implemented
Gallery Manager
Enter: Submit Unsplash search or URL paste
ESC (during rename): Cancel rename, revert to original
Travel Manager
Enter: Submit add/edit form — Not yet implemented (click-only currently)
ESC: Close modal
Link/Video Modal
Enter: Submit form (add resource)
ESC: Close modal — Backdrop click only currently
File Upload & Storage
Gallery Image Upload
Method: HTML file input (multiple, accept="image/*")
Processing: FileReader converts to data URL (base64)
Storage: Stored inline as data URLs in gallery.images[] array
No Supabase Storage: Images embedded in project data (size considerations)
Attachment Upload (Status Updates)
Method: File input → upload to Supabase Storage
Max size: ~4.5MB per file
Returns: Signed URL + storageKey
Storage cleanup: Files deleted when attachment removed
Considerations
Gallery data URLs can bloat project JSON
Future enhancement: Upload gallery images to Supabase Storage
Performance Considerations
Masonry Layout
CSS columns: Native browser masonry (columns: 3, column-fill: balance)
No JS calculation: Pure CSS, fast rendering
Break-inside: break-inside-avoid prevents images splitting across columns
Image Loading
Progressive: Images load as they appear in viewport
No lazy loading: All images start loading on modal open
Lightbox preloading: Could preload adjacent images (not implemented)
Drag-and-Drop
HTML5 Drag API: Native browser DnD
State updates: Single reorder operation → one save call
No throttling: Direct array manipulation
Integration Points
Workspace Docs System
Docs created in Workspace Docs can be linked to projects
linkedProjectName field establishes connection
Doc appears in both Workspace Docs list and project Resources section
Single source of truth (workspace docs array)
Status Updates
Status updates also support attachments (separate from project attachments)
Uses similar Attachment interface but with Supabase Storage uploads
Different UI (inline in StatusUpdateEditor)
Asana Import
Asana projects don't import attachments (future enhancement)
Post-import, users can manually add resources
Visual Hierarchy
Section Positioning
Project header (banner, title, status, metadata)
Horizontal divider (subtle #f0efee line)
Resources section ← Documented feature
Horizontal divider
Tasks section header with filters/sort
Task list (table/board/insights view)
Z-Index Layers
Resource cards: z-1 (base)
Dropdown menu: z-98 (backdrop) + z-99 (menu)
Link/Video modal: z-300
Gallery manager: z-400
Gallery lightbox: z-500 (above gallery manager)
Travel manager: z-400
Accessibility
Current State (Areas for improvement)
Keyboard navigation: Limited (no tab-through, no arrow keys in lightbox)
Screen readers: Icons lack aria-labels, modals lack role attributes
Focus management: Modal open doesn't trap focus
Close actions: ESC key works, backdrop click works
Color contrast: Passes WCAG AA for text on backgrounds
Future Enhancements
Add aria-label to icon-only buttons
Implement focus trap in modals
Add keyboard navigation (arrows in lightbox, Enter to submit forms)
Add skip-to-content for long resource lists
Key Files
/src/app/App.tsx: ProjectAttachment, TravelItem interfaces, updateProjectAttachments callback
/src/app/components/MainContent.tsx: Resources section rendering (lines 1174–1401), Gallery manager modal (lines 3629–3899), Travel manager modal (lines 3901–4100+), Video player modal (lines 3581–3610)
/src/app/api.ts: uploadFile, deleteFile, searchUnsplash functions
This documentation covers every aspect of the project Resources section: all 5 resource types (docs, links, videos, galleries, travel), data structures, visual design, interactions, modals (gallery manager, travel manager, video player, lightbox), CRUD operations, persistence, edge cases, keyboard shortcuts, file uploads, performance, integrations, and accessibility. Use this as your comprehensive reference when building, debugging, or extending the Resources system.