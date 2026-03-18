/* ═══════════════════════════════════════════════════════════
   DATA MODEL — All TypeScript interfaces and constants
   for the Canto project management application.
   ═══════════════════════════════════════════════════════════ */

/* ─── Constants ─── */

/** Special project ID for personal (unassigned) tasks */
export const PERSONAL_PROJECT = "__personal__";

/** Display-friendly project name */
export function displayProjectName(name: string): string {
  return name === PERSONAL_PROJECT ? "Personal" : name;
}

/* ─── Enums / Union Types ─── */

export type TaskStatus = "todo" | "in-progress" | "completed" | "hold";
export type Priority = "urgent" | "high" | "medium" | "low" | "none";
export type ProjectStatus = "on-track" | "at-risk" | "off-track" | "on-hold" | "complete" | "dropped";

export type ProductionPhase =
  | "incoming"
  | "pre-production"
  | "in-production"
  | "post-production"
  | "submitted"
  | "revisions"
  | "ongoing"
  | "future"
  | "cold";

export type ProjectType =
  | "video-production"
  | "video-edit"
  | "photography"
  | "design"
  | "web"
  | "branding"
  | "motion-graphics"
  | "consulting";

export type DocType = "doc" | "note" | "meeting" | "script";
export type NoteType = "note" | "meeting";
export type ThemeMode = "light" | "dark" | "system";
export type WeekStart = "sunday" | "monday";
export type DateFormat = "mdy" | "dmy";

export type NotificationType =
  | "mention"
  | "task_assigned"
  | "task_unassigned"
  | "task_completed"
  | "comment"
  | "status_update"
  | "project_shared"
  | "due_date_changed"
  | "status_changed"
  | "subtask_completed"
  | "task_added"
  | "collaborator_added"
  | "task_liked"
  | "task_description_changed"
  | "attachment_added";

export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly";

/* ─── Block Editor ─── */

export type DocBlockType =
  | "paragraph"
  | "heading"
  | "bulleted-list"
  | "numbered-list"
  | "checklist"
  | "quote"
  | "code"
  | "divider"
  | "image"
  | "callout"
  | "toggle"
  | "embed"
  | "table"
  | "gallery"
  | "unsplash-image"
  | "group-card"
  /* Script-specific */
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export interface UnsplashImageMeta {
  id: string;
  url: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
}

export interface DocBlock {
  id: string;
  type: DocBlockType;
  content: string;
  /** For headings: 1, 2, or 3 */
  level?: number;
  /** For checklists: item completion state */
  checked?: boolean;
  /** For images: URL */
  imageUrl?: string;
  /** For images: alt text */
  imageAlt?: string;
  /** Nested children blocks (for lists) */
  children?: DocBlock[];
  /** Callout block accent color */
  calloutColor?: string;
  /** Callout block icon name */
  calloutIcon?: string;
  /** Code block language */
  language?: string;
  /** Toggle block collapsed state */
  collapsed?: boolean;
  /** Embed block type */
  embedType?: "youtube" | "video" | "photo";
  /** Embed block URL */
  embedUrl?: string;
  /** Table block data */
  tableData?: { headers: string[]; rows: string[][] };
  /** Gallery images (Unsplash) */
  galleryImages?: UnsplashImageMeta[];
  /** Single Unsplash image metadata */
  unsplashMeta?: UnsplashImageMeta;
  /** Group card: linked doc ID */
  linkedDocId?: string;
  /** Group card: visual style */
  cardStyle?: "compact" | "list" | "preview" | "gallery" | "board";
  /** Block decoration */
  decoration?: "focus" | "block";
  /** Override text/accent color */
  color?: string;
  /** Font family override */
  fontStyle?: "system" | "serif" | "mono" | "round";
}

/* ─── Recurrence ─── */

export interface Recurrence {
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ...
  endDate?: string; // ISO date
}

/* ─── Attachments ─── */

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size?: number; // bytes
  storageKey?: string;
  uploadedBy?: string;
  uploadedAt?: string; // ISO timestamp
  thumbnailUrl?: string;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url?: string;
  type: "image" | "video" | "link" | "document" | "gallery" | "travel";
  storageKey?: string;
  thumbnailUrl?: string;
  description?: string;
  /** For gallery type */
  images?: { url: string; caption?: string }[];
  /** For travel type */
  travelItems?: TravelItem[];
  /** For linked workspace docs */
  linkedProjectName?: string;
}

export interface TravelItem {
  id: string;
  category: "flight" | "stay" | "car_rental" | "gear" | "food" | "parking";
  title: string;
  details: string;
  link?: string;
  cost: number;
}

/* ─── Comments ─── */

export interface Comment {
  id: string;
  text: string;
  author: string; // userId
  authorName?: string;
  authorAvatar?: string;
  authorColor?: string;
  createdAt: string; // ISO timestamp
  updatedAt?: string;
  mentions?: string[]; // userIds
  reactions?: { emoji: string; userIds: string[] }[];
}

/* ─── Time Tracking ─── */

export interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName?: string;
  userId: string;
  userName?: string;
  startedAt: string; // ISO timestamp
  endedAt?: string; // ISO timestamp (null if still running)
  duration?: number; // seconds
  notes?: string;
}

/* ─── Subtasks ─── */

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  date?: string;
  startDate?: string;
  dueTime?: string;
  startTime?: string;
  assignee?: string;
  status?: TaskStatus;
  content?: string;
  descriptionBlocks?: DocBlock[];
  today?: boolean;
  lineup?: boolean;
  attachments?: Attachment[];
  comments?: Comment[];
  subtasks?: SubTask[]; // nested
  priority?: Priority;
}

/* ─── Tasks ─── */

export interface TaskItem {
  id: string;
  title: string;
  /** Formatted as "MMM. d, yyyy" e.g. "Feb. 23, 2026" */
  date?: string;
  startDate?: string;
  dueTime?: string;
  startTime?: string; // e.g. "09:00"
  assignee?: string;
  completed: boolean;
  status: TaskStatus;
  content?: string;
  descriptionBlocks?: DocBlock[];
  attendees?: string[];
  today?: boolean;
  lineup?: boolean;
  sourceNoteId?: string;
  subtasks?: SubTask[];
  linkedMeetings?: string[];
  attachments?: Attachment[];
  comments?: Comment[];
  noteType?: NoteType;
  gcalLink?: string;
  gcalEventId?: string;
  section?: string;
  milestone?: boolean;
  productionPhase?: ProductionPhase;
  priority?: Priority;
  tags?: string[];
  blockedBy?: string[]; // task IDs
  blocking?: string[]; // task IDs
  likedBy?: string[]; // user IDs who liked
  createdAt?: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  recurrence?: Recurrence;
  /** Gmail integration fields */
  gmailMessageId?: string;
  gmailThreadId?: string;
  gmailFrom?: string;
  gmailFromFull?: string;
  gmailTo?: string;
  gmailCc?: string;
  gmailDate?: string;
  gmailMessageCount?: number;
  gmailSummary?: string;
  gmailThreadMessages?: unknown[];
}

/* ─── Updates ─── */

export interface UpdateItem {
  id: string;
  title: string;
  content: string;
  author: string;
  authorName?: string;
  createdAt: string;
  status?: ProjectStatus;
  sections?: { label: string; content: string }[];
  reactions?: { emoji: string; userIds: string[] }[];
  /** Structured content — Markdown */
  summary?: string;
  nextSteps?: string;
  customSections?: { title: string; content: string }[];
  /** Metadata */
  owner?: string;
  ownerName?: string;
  attendees?: string[];
  attachments?: Attachment[];
  comments?: Comment[];
  /** Type discriminator */
  type?: "status-update" | "member-joined" | "project-created";
  eventMembers?: string[];
  /** Snapshot of project metadata at time of update */
  productionPhase?: ProductionPhase;
  projectType?: ProjectType;
  client?: string;
}

/* ─── Timeline ─── */

export interface TimelineDate {
  label: string;
  type: "shoot" | "round1" | "final" | "travel";
  endLabel?: string;
  assignees?: string[];
}

/* ─── Tag Palette ─── */

export interface TagDef {
  name: string;
  color: string;
}

/* ─── Spaces ─── */

export type SpacePersonRole = "member" | "client" | "viewer";
export type SpaceMemberRole = "super-admin" | "admin" | "member";

export interface SpacePerson {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  avatarColor?: string;
  /** Internal role within the space (only for members list) */
  memberRole?: SpaceMemberRole;
  /** The auth user ID this person is linked to (for permission checks) */
  userId?: string;
  /** Invitation status: set when an email invite was sent */
  inviteStatus?: "pending" | "sent" | "accepted";
  /** ISO timestamp of when the invite was sent */
  invitedAt?: string;
}

export interface SpaceTeam {
  id: string;
  name: string;
  color: string;
  phosphorIcon?: string;
  description?: string;
  /** Person IDs from the space's members/clients/viewers */
  personIds: string[];
  createdAt: string;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  icon: string;           // emoji
  iconUrl?: string;       // custom uploaded icon
  phosphorIcon?: string;  // Phosphor icon name
  description?: string;
  order: number;
  visible: boolean;
  createdAt: string;
  /** Auth user ID of the space creator (always super-admin) */
  creatorId?: string;
  members?: SpacePerson[];
  clients?: SpacePerson[];
  viewers?: SpacePerson[];
  teams?: SpaceTeam[];
}

/* ─── Projects ─── */

export interface ProjectData {
  name: string;
  shortName?: string;
  abbreviation?: string;
  description: string;
  tasks: TaskItem[];
  notes: TaskItem[];
  updates: UpdateItem[];
  timelineDates: TimelineDate[];
  status: ProjectStatus;
  bannerImage: string;
  bannerImageY?: number;
  sidebarBgImage?: string;
  sidebarBgImageY?: number;
  client: string;
  color: string;
  icon: string; // emoji
  iconUrl?: string; // custom upload
  phosphorIcon?: string; // Phosphor icon name (e.g. "Camera", "VideoCamera")
  projectAttachments: ProjectAttachment[];
  productionPhase: ProductionPhase;
  projectType: ProjectType;
  location?: string;
  members?: string[]; // userIds
  archived?: boolean;
  tagPalette?: TagDef[];
  spaceId?: string;
}

/* ─── Clients ─── */

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface ClientContract {
  id: string;
  name: string;
  value?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  status?: "active" | "pending" | "expired" | "cancelled";
  notes?: string;
}

export interface ClientData {
  id: string;
  name: string;
  description?: string;
  contacts: ClientContact[];
  contracts: ClientContract[];
  connectedProjects: string[]; // project names
  satisfactionRating?: number; // 1-5
  notes?: string;
  avatarUrl?: string;
  avatarColor?: string;
  attachments?: Attachment[];
  createdAt?: string;
}

/* ─── Calendar Events ─── */

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  projectName?: string;
  gcalEventId?: string;
  gcalCalendarId?: string;
  isAllDay?: boolean;
  color?: string;
}

/* ─── Team Members ─── */

export interface TeamMemberInfo {
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  avatarColor?: string;
  role?: string;
  department?: string;
  timezone?: string;
  /** For Asana-imported placeholders */
  isPlaceholder?: boolean;
}

/* ─── User Profile ─── */

export interface ProfileData {
  displayName: string;
  email: string;
  role?: string;
  department?: string;
  timezone?: string;
  bio?: string;
  avatarColor: string;
  avatarUrl?: string;
  avatarStorageKey?: string;
  onboardingComplete: boolean;
  homeGradient?: string;
  theme: ThemeMode;
  /** Notification preferences */
  notifyInbox?: boolean;
  notifyTaskAssigned?: boolean;
  notifyTaskCompleted?: boolean;
  notifyComments?: boolean;
  notifyUpdates?: boolean;
  notifyMentions?: boolean;
  notifyDesktop?: boolean;
  weekStart: WeekStart;
  dateFormat: DateFormat;
  compactMode?: boolean;
  preferShortNames?: boolean;
  lastInProgressTask?: string;
}

/* ─── Notifications ── */

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  fromUserId?: string;
  fromUserName?: string;
  projectName?: string;
  taskId?: string;
  taskTitle?: string;
  read: boolean;
  archived: boolean;
  createdAt: string; // ISO timestamp
}

/* ─── Time Blocks (Week View) ─── */

export interface TimeBlock {
  id: string;
  dayIndex: number; // 0-6
  startHour: number;
  endHour: number;
  taskId?: string;
  taskTitle?: string;
  projectName?: string;
  color?: string;
  notes?: string;
}

export interface WeekSettings {
  workingHoursStart: number; // e.g. 9
  workingHoursEnd: number; // e.g. 17
  hiddenDays: number[]; // e.g. [0, 6] for weekends
  notepad?: string;
}

/* ─── Workspace Documents ─── */

export interface WorkspaceDoc {
  id: string;
  title: string;
  type: DocType;
  folderId?: string;
  content?: string;
  blocks?: DocBlock[];
  /** For meeting notes */
  attendees?: string[];
  gcalEventId?: string;
  meetingDate?: string;
  /** Metadata */
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  projectName?: string;
  /** Publishing */
  publishedSlug?: string;
  /** Import source */
  importSource?: "craft" | "asana";
  importSourceId?: string;
  /** Today/Lineup flags for Home page integration */
  today?: boolean;
  lineup?: boolean;
  /** Cover image */
  coverImage?: string;
  coverImageY?: number;
  /** Organization flags */
  pinned?: boolean;
  private?: boolean;
  /** Custom icon name */
  icon?: string;
  /** Owner user ID */
  owner?: string;
  /** Manual sort order */
  sortOrder?: number;
  /** Google Calendar integration */
  gcalLink?: string;
  gcalMeetLink?: string;
  gcalEventTime?: string;
  /** Cross-references */
  linkedProjectId?: string;
  linkedClientId?: string;
  linkedTaskId?: string;
  /** Meeting-specific */
  meetingStatus?: "on-track" | "at-risk" | "off-track" | "on-hold" | "complete" | "dropped";
  /** Script-specific */
  characters?: string[];
  locations?: string[];
  scriptByline?: string;
  /** Parent doc reference for nested docs */
  parentDocId?: string;
  /** Space assignment */
  spaceId?: string;
}

export interface DocFolder {
  id: string;
  name: string;
  parentId?: string;
  order?: number;
  /** Folder accent color */
  color?: string;
}

/* ─── Production Phase Metadata ─── */

export interface PhaseMeta {
  label: string;
  color: string;
  bgColor: string;
  description?: string;
}

export const PHASE_META: Record<ProductionPhase, PhaseMeta> = {
  incoming: { label: "Incoming", color: "oklch(0.55 0.2 280)", bgColor: "oklch(0.55 0.2 280 / 0.1)" },
  "pre-production": { label: "Pre-Production", color: "oklch(0.7 0.18 25)", bgColor: "oklch(0.7 0.18 25 / 0.1)" },
  "in-production": { label: "In Production", color: "oklch(0.65 0.15 180)", bgColor: "oklch(0.65 0.15 180 / 0.1)" },
  "post-production": { label: "Post-Production", color: "oklch(0.55 0.2 280)", bgColor: "oklch(0.55 0.2 280 / 0.1)" },
  submitted: { label: "Submitted", color: "oklch(0.73 0.15 155)", bgColor: "oklch(0.73 0.15 155 / 0.1)" },
  revisions: { label: "Revisions", color: "oklch(0.85 0.15 85)", bgColor: "oklch(0.85 0.15 85 / 0.15)" },
  ongoing: { label: "Ongoing", color: "oklch(0.5 0.02 260)", bgColor: "oklch(0.5 0.02 260 / 0.1)" },
  future: { label: "Future", color: "oklch(0.65 0.015 260)", bgColor: "oklch(0.65 0.015 260 / 0.08)" },
  cold: { label: "Cold", color: "oklch(0.65 0.015 260)", bgColor: "oklch(0.65 0.015 260 / 0.06)" },
};

export const TASK_PHASE_OPTIONS: { value: ProductionPhase; label: string }[] = [
  { value: "incoming", label: "Incoming" },
  { value: "pre-production", label: "Pre-Production" },
  { value: "in-production", label: "In Production" },
  { value: "post-production", label: "Post-Production" },
  { value: "submitted", label: "Submitted" },
  { value: "revisions", label: "Revisions" },
  { value: "ongoing", label: "Ongoing" },
  { value: "future", label: "Future" },
  { value: "cold", label: "Cold" },
];

export const PROJECT_TYPE_OPTIONS: { value: ProjectType; label: string }[] = [
  { value: "video-production", label: "Video Production" },
  { value: "video-edit", label: "Video Edit" },
  { value: "photography", label: "Photography" },
  { value: "design", label: "Design" },
  { value: "web", label: "Web" },
  { value: "branding", label: "Branding" },
  { value: "motion-graphics", label: "Motion Graphics" },
  { value: "consulting", label: "Consulting" },
];

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "on-track", label: "On Track", color: "oklch(0.73 0.15 155)" },
  { value: "at-risk", label: "At Risk", color: "oklch(0.85 0.15 85)" },
  { value: "off-track", label: "Off Track", color: "oklch(0.7 0.18 25)" },
  { value: "on-hold", label: "On Hold", color: "oklch(0.65 0.015 260)" },
  { value: "complete", label: "Complete", color: "oklch(0.65 0.15 180)" },
  { value: "dropped", label: "Dropped", color: "oklch(0.5 0.02 260)" },
];

/** Avatar color palette (14 pastel colors) */
export const AVATAR_COLORS = [
  "oklch(0.82 0.12 25)",   // coral
  "oklch(0.85 0.12 55)",   // peach
  "oklch(0.88 0.1 85)",    // gold
  "oklch(0.85 0.1 115)",   // lime
  "oklch(0.82 0.1 155)",   // mint
  "oklch(0.8 0.1 180)",    // teal
  "oklch(0.82 0.1 210)",   // sky
  "oklch(0.8 0.12 250)",   // blue
  "oklch(0.8 0.12 280)",   // indigo
  "oklch(0.82 0.1 300)",   // purple
  "oklch(0.83 0.1 320)",   // magenta
  "oklch(0.85 0.08 340)",  // pink
  "oklch(0.88 0.04 80)",   // sand
  "oklch(0.85 0.02 260)",  // slate
];

/** Home gradient presets */
export const HOME_GRADIENTS: { id: string; name: string; gradient: string }[] = [
  { id: "emerald", name: "Emerald", gradient: "linear-gradient(135deg, oklch(0.7 0.14 155), oklch(0.6 0.12 180))" },
  { id: "ocean", name: "Ocean", gradient: "linear-gradient(135deg, oklch(0.65 0.14 230), oklch(0.55 0.12 260))" },
  { id: "violet", name: "Violet", gradient: "linear-gradient(135deg, oklch(0.65 0.16 290), oklch(0.55 0.14 310))" },
  { id: "sunbeam", name: "Sunbeam", gradient: "linear-gradient(135deg, oklch(0.85 0.14 80), oklch(0.75 0.12 55))" },
  { id: "coral", name: "Coral", gradient: "linear-gradient(135deg, oklch(0.72 0.16 25), oklch(0.62 0.14 10))" },
  { id: "slate", name: "Slate", gradient: "linear-gradient(135deg, oklch(0.55 0.02 260), oklch(0.4 0.02 260))" },
];