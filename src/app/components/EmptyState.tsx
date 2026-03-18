/* ===================================================================
   EMPTY STATE — Reusable branded empty state component.

   Provides consistent empty state UI across all views with:
   - Configurable icon, title, description
   - Optional CTA button
   - Subtle animated illustration
   - Compact and full-page variants

   Phase 16 of Canto build plan (P16-2).
   =================================================================== */

import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  SquareHalf,
  FileText,
  CalendarBlank,
  Tray,
  UsersThree,
  Binoculars,
  ListChecks,
  ChatCircle,
  Paperclip,
  MagnifyingGlass,
  Plus,
  Sparkle,
} from "@phosphor-icons/react";

/* ── Props ── */

export interface EmptyStateProps {
  /** Icon to display */
  icon?: React.ElementType;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** CTA button label */
  actionLabel?: string;
  /** CTA button handler */
  onAction?: () => void;
  /** Size variant */
  variant?: "compact" | "default" | "full";
  /** Custom children to render below description */
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = Sparkle,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  children,
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  const isFull = variant === "full";

  return (
    <motion.div
      className={`flex flex-col items-center justify-center text-center ${
        isFull ? "min-h-[50vh] py-20" : isCompact ? "py-6" : "py-12"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Icon container with subtle background rings */}
      <div className="relative mb-4">
        {!isCompact && (
          <>
            <div
              className="absolute inset-0 rounded-full scale-[2.2] opacity-[0.04]"
              style={{ background: "var(--accent-primary)" }}
            />
            <div
              className="absolute inset-0 rounded-full scale-[1.6] opacity-[0.06]"
              style={{ background: "var(--accent-primary)" }}
            />
          </>
        )}
        <div
          className={`relative rounded-[12px] flex items-center justify-center ${
            isCompact ? "w-10 h-10" : "w-14 h-14"
          }`}
          style={{
            background: "var(--accent-primary-subtle)",
          }}
        >
          <Icon
            className={isCompact ? "w-5 h-5" : "w-7 h-7"}
            style={{ color: "var(--accent-primary)" }}
          />
        </div>
      </div>

      {/* Text */}
      <h3
        style={{
          color: "var(--text-primary)",
          fontSize: isCompact ? "14px" : "16px",
          fontWeight: 600,
          marginBottom: description ? "4px" : "0",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="max-w-xs"
          style={{
            color: "var(--text-quaternary)",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          {description}
        </p>
      )}

      {/* CTA */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] transition-all hover:brightness-95 active:scale-[0.97]"
          style={{
            background: "var(--accent-primary)",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}

      {/* Custom children */}
      {children}
    </motion.div>
  );
}

/* ── Preset Empty States ── */

export function EmptyProjects({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={SquareHalf}
      title="No projects yet"
      description="Create your first project to start organizing tasks, timelines, and team collaboration."
      actionLabel="New Project"
      onAction={onAction}
    />
  );
}

export function EmptyTasks({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={ListChecks}
      title="No tasks yet"
      description="Add tasks to track your work and keep things moving forward."
      actionLabel="Add Task"
      onAction={onAction}
      variant="compact"
    />
  );
}

export function EmptyDocs({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents yet"
      description="Create documents, meeting notes, and reference materials for your team."
      actionLabel="New Document"
      onAction={onAction}
    />
  );
}

export function EmptyCalendar({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={CalendarBlank}
      title="Nothing scheduled"
      description="Add events and deadlines to keep your calendar organized."
      actionLabel="New Event"
      onAction={onAction}
      variant="compact"
    />
  );
}

export function EmptyInbox() {
  return (
    <EmptyState
      icon={Tray}
      title="All caught up!"
      description="No new notifications. Check back later or adjust your notification preferences."
    />
  );
}

export function EmptyTeam({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={UsersThree}
      title="No team members"
      description="Invite people to your workspace to start collaborating."
      actionLabel="Invite Member"
      onAction={onAction}
    />
  );
}

export function EmptyClients({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Binoculars}
      title="No clients yet"
      description="Add your first client to track relationships, contracts, and project history."
      actionLabel="Add Client"
      onAction={onAction}
    />
  );
}

export function EmptyComments() {
  return (
    <EmptyState
      icon={ChatCircle}
      title="No comments yet"
      description="Start a conversation about this task."
      variant="compact"
    />
  );
}

export function EmptyAttachments({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Paperclip}
      title="No attachments"
      description="Drag and drop files or click to upload."
      actionLabel="Upload File"
      onAction={onAction}
      variant="compact"
    />
  );
}

export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={MagnifyingGlass}
      title="No results found"
      description={`No matches for "${query}". Try a different search term.`}
    />
  );
}

export default EmptyState;