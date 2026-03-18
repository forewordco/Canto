/* ═══════════════════════════════════════════════════════════
   SPACE ROLES — Utility functions for role-based permission
   checks within Spaces.

   Role hierarchy:  super-admin > admin > member
   - Super Admin: Full control (settings, integrations, delete,
     visibility, manage people roles). Auto-assigned to creator.
   - Admin: Can manage people and content, but cannot change
     space settings or integrations.
   - Member: Standard access.
   ═══════════════════════════════════════════════════════════ */

import type { Space, SpaceMemberRole } from "./types";

/**
 * Determine the current user's role in a space.
 * Falls back: creatorId match → member with memberRole → "member".
 */
export function getUserSpaceRole(space: Space, userId: string | undefined): SpaceMemberRole | null {
  if (!userId) return null;

  // Creator is always super-admin regardless of members list
  if (space.creatorId === userId) return "super-admin";

  // Check members list for a matching userId
  const member = (space.members || []).find((m) => m.userId === userId);
  if (member) return member.memberRole || "member";

  // Not in the members list at all — treat as regular member for
  // the owning user (legacy spaces created before roles existed)
  // If no creatorId is set, the first user to view is treated as the owner.
  if (!space.creatorId) return "super-admin";

  return null;
}

/** Whether a role has super-admin privileges */
export function isSuperAdmin(role: SpaceMemberRole | null): boolean {
  return role === "super-admin";
}

/** Whether a role has admin-or-above privileges */
export function isAdminOrAbove(role: SpaceMemberRole | null): boolean {
  return role === "super-admin" || role === "admin";
}

/** Role display metadata */
export const MEMBER_ROLE_META: Record<SpaceMemberRole, { label: string; shortLabel: string; color: string; description: string }> = {
  "super-admin": {
    label: "Super Admin",
    shortLabel: "Super Admin",
    color: "oklch(0.7 0.18 25)",
    description: "Full control over space settings, integrations, and member roles",
  },
  admin: {
    label: "Admin",
    shortLabel: "Admin",
    color: "oklch(0.65 0.16 250)",
    description: "Can manage people and content, but not space settings or integrations",
  },
  member: {
    label: "Member",
    shortLabel: "Member",
    color: "oklch(0.65 0.015 260)",
    description: "Standard access to projects, tasks, and docs",
  },
};
