/* ═══════════════════════════════════════════════════════════
   UPDATES ROUTES — Social-style news feed backed by KV store.

   Key patterns:
   - update:{updateId}                → individual update post
   - updates:space:{spaceId}          → array of update IDs for a space
   - updates:global                   → array of update IDs for global (no space)
   - updates:read:{userId}            → set of read update IDs
   ═══════════════════════════════════════════════════════════ */

import { Hono } from "npm:hono@4.6.20";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

let _supabase: ReturnType<typeof createClient> | null = null;
function supabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }
  return _supabase;
}

/** Custom error for transient network failures */
class TransientAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientAuthError";
  }
}

/** Verify user from X-User-Token (with retry for transient network errors) */
async function getUser(c: any): Promise<{ id: string; email: string } | null> {
  const token = c.req.header("X-User-Token");
  if (!token) return null;
  const maxRetries = 3;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: { user }, error } = await supabase().auth.getUser(token);
      if (error || !user) return null;
      return { id: user.id, email: user.email || "" };
    } catch (err) {
      lastErr = err;
      const isTransient =
        String(err).includes("connection reset") ||
        String(err).includes("connection error") ||
        String(err).includes("ECONNRESET") ||
        String(err).includes("SendRequest") ||
        String(err).includes("tcp connect error");
      if (isTransient && attempt < maxRetries - 1) {
        console.log(`[Updates] getUser transient error (attempt ${attempt + 1}/${maxRetries}), retrying: ${err}`);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      if (isTransient) {
        console.log(`[Updates] getUser transient failure after ${maxRetries} attempts: ${err}`);
        throw new TransientAuthError(`Auth service temporarily unavailable after ${maxRetries} retries: ${err}`);
      }
      console.log(`[Updates] getUser non-transient error: ${err}`);
      return null;
    }
  }
  return null;
}

/** Wrap route handler to catch TransientAuthError and return 503 */
function withTransientHandling(handler: (c: any) => Promise<Response>) {
  return async (c: any) => {
    try {
      return await handler(c);
    } catch (err) {
      if (err instanceof TransientAuthError) {
        console.log(`[Updates] 503 Service Unavailable: ${err.message}`);
        return c.json({ error: "Service temporarily unavailable. Please retry.", retryable: true }, 503);
      }
      throw err;
    }
  };
}

function genId() {
  return `upd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registerUpdatesRoutes(app: Hono, PREFIX: string) {

  /* ─── POST /updates — Create a new update post ─── */
  app.post(`${PREFIX}/updates`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required to create an update" }, 401);

      const { title, content, spaceId, authorName, authorAvatar, authorColor, contentFormat, attachments } = await c.req.json();

      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;
      if ((!content || !content.trim()) && !hasAttachments) {
        return c.json({ error: "Content or attachments required for an update" }, 400);
      }

      const updateId = genId();
      const now = new Date().toISOString();

      const update = {
        id: updateId,
        title: title || "",
        content: (content || "").trim(),
        contentFormat: contentFormat || "text",
        attachments: Array.isArray(attachments) ? attachments : [],
        authorId: user.id,
        authorName: authorName || user.email.split("@")[0],
        authorAvatar: authorAvatar || null,
        authorColor: authorColor || "oklch(0.82 0.12 25)",
        spaceId: spaceId || null,
        createdAt: now,
        reactions: [],
        comments: [],
      };

      // Save the update
      await kv.set(`update:${updateId}`, update);

      // Add to space-specific or global index
      const indexKey = spaceId ? `updates:space:${spaceId}` : "updates:global";
      const existing: string[] = (await kv.get(indexKey)) || [];
      await kv.set(indexKey, [updateId, ...existing]);

      console.log(`[Updates] Created update ${updateId} by ${user.id} in space=${spaceId || "global"}`);
      return c.json({ update });
    } catch (err) {
      console.log(`[Updates] Error creating update: ${err}`);
      return c.json({ error: `Failed to create update: ${err}` }, 500);
    }
  }));

  /* ─── GET /updates — Get feed of updates (optionally by spaceId) ─── */
  app.get(`${PREFIX}/updates`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required to view updates" }, 401);

      const spaceId = c.req.query("spaceId");
      const limit = parseInt(c.req.query("limit") || "50", 10);
      const offset = parseInt(c.req.query("offset") || "0", 10);

      // Get all update IDs the user can see
      // If spaceId specified, just that space. Otherwise, aggregate global + all visible spaces.
      let allUpdateIds: string[] = [];

      if (spaceId) {
        const ids: string[] = (await kv.get(`updates:space:${spaceId}`)) || [];
        allUpdateIds = ids;
      } else {
        // Get global updates
        const globalIds: string[] = (await kv.get("updates:global")) || [];
        allUpdateIds.push(...globalIds);

        // Get all space update indices
        const db = supabase();
        const { data: spaceRows } = await db
          .from("kv_store_a038f2e0")
          .select("key, value")
          .like("key", "updates:space:%");

        if (spaceRows) {
          for (const row of spaceRows) {
            const ids = Array.isArray(row.value) ? row.value : [];
            allUpdateIds.push(...ids);
          }
        }
      }

      // Deduplicate and sort by timestamp (embedded in ID)
      const unique = [...new Set(allUpdateIds)];
      // Sort by creation time desc (IDs have timestamp prefix)
      unique.sort((a, b) => {
        const tsA = parseInt(a.split("-")[1] || "0", 10);
        const tsB = parseInt(b.split("-")[1] || "0", 10);
        return tsB - tsA;
      });

      const paged = unique.slice(offset, offset + limit);

      if (paged.length === 0) {
        return c.json({ updates: [], total: unique.length });
      }

      // Fetch the actual updates
      const updateKeys = paged.map((id) => `update:${id}`);
      const updateValues = await kv.mget(updateKeys);
      const updates = updateValues.filter(Boolean);

      // Get read set for this user
      const readSet: string[] = (await kv.get(`updates:read:${user.id}`)) || [];
      const readSetLookup = new Set(readSet);

      // Attach read status
      const updatesWithRead = updates.map((u: any) => ({
        ...u,
        isRead: readSetLookup.has(u.id),
      }));

      return c.json({ updates: updatesWithRead, total: unique.length });
    } catch (err) {
      console.log(`[Updates] Error fetching updates: ${err}`);
      return c.json({ error: `Failed to fetch updates: ${err}` }, 500);
    }
  }));

  /* ─── GET /updates/unread-count — Get count of unread updates ─── */
  app.get(`${PREFIX}/updates/unread-count`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      // Get all update IDs across global + spaces
      let allUpdateIds: string[] = [];
      const globalIds: string[] = (await kv.get("updates:global")) || [];
      allUpdateIds.push(...globalIds);

      const db = supabase();
      const { data: spaceRows } = await db
        .from("kv_store_a038f2e0")
        .select("key, value")
        .like("key", "updates:space:%");

      if (spaceRows) {
        for (const row of spaceRows) {
          const ids = Array.isArray(row.value) ? row.value : [];
          allUpdateIds.push(...ids);
        }
      }

      const unique = [...new Set(allUpdateIds)];
      const readSet: string[] = (await kv.get(`updates:read:${user.id}`)) || [];
      const readSetLookup = new Set(readSet);

      const unreadCount = unique.filter((id) => !readSetLookup.has(id)).length;
      return c.json({ unreadCount });
    } catch (err) {
      console.log(`[Updates] Error getting unread count: ${err}`);
      return c.json({ error: `Failed to get unread count: ${err}` }, 500);
    }
  }));

  /* ─── POST /updates/mark-read — Mark updates as read ─── */
  app.post(`${PREFIX}/updates/mark-read`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const { updateIds } = await c.req.json();
      if (!Array.isArray(updateIds) || updateIds.length === 0) {
        return c.json({ success: true });
      }

      const readSet: string[] = (await kv.get(`updates:read:${user.id}`)) || [];
      const merged = [...new Set([...readSet, ...updateIds])];
      // Keep only last 500 to prevent unbounded growth
      const trimmed = merged.slice(-500);
      await kv.set(`updates:read:${user.id}`, trimmed);

      return c.json({ success: true });
    } catch (err) {
      console.log(`[Updates] Error marking read: ${err}`);
      return c.json({ error: `Failed to mark read: ${err}` }, 500);
    }
  }));

  /* ─── POST /updates/:id/react — Add/toggle a reaction ─── */
  app.post(`${PREFIX}/updates/:id/react`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const updateId = c.req.param("id");
      const { emoji } = await c.req.json();
      if (!emoji) return c.json({ error: "Emoji is required" }, 400);

      const update: any = await kv.get(`update:${updateId}`);
      if (!update) return c.json({ error: "Update not found" }, 404);

      const reactions = update.reactions || [];
      const existingIdx = reactions.findIndex((r: any) => r.emoji === emoji);

      if (existingIdx >= 0) {
        const reaction = reactions[existingIdx];
        const userIdx = reaction.userIds.indexOf(user.id);
        if (userIdx >= 0) {
          reaction.userIds.splice(userIdx, 1);
          if (reaction.userIds.length === 0) {
            reactions.splice(existingIdx, 1);
          }
        } else {
          reaction.userIds.push(user.id);
        }
      } else {
        reactions.push({ emoji, userIds: [user.id] });
      }

      update.reactions = reactions;
      await kv.set(`update:${updateId}`, update);

      return c.json({ update });
    } catch (err) {
      console.log(`[Updates] Error reacting: ${err}`);
      return c.json({ error: `Failed to react: ${err}` }, 500);
    }
  }));

  /* ─── POST /updates/:id/comment — Add a comment ─── */
  app.post(`${PREFIX}/updates/:id/comment`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const updateId = c.req.param("id");
      const { text, authorName, authorAvatar, authorColor } = await c.req.json();
      if (!text?.trim()) return c.json({ error: "Comment text is required" }, 400);

      const update: any = await kv.get(`update:${updateId}`);
      if (!update) return c.json({ error: "Update not found" }, 404);

      const comment = {
        id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: text.trim(),
        authorId: user.id,
        authorName: authorName || user.email.split("@")[0],
        authorAvatar: authorAvatar || null,
        authorColor: authorColor || "oklch(0.82 0.12 25)",
        createdAt: new Date().toISOString(),
      };

      update.comments = [...(update.comments || []), comment];
      await kv.set(`update:${updateId}`, update);

      return c.json({ comment });
    } catch (err) {
      console.log(`[Updates] Error commenting: ${err}`);
      return c.json({ error: `Failed to comment: ${err}` }, 500);
    }
  }));

  /* ─── DELETE /updates/:id — Delete an update (author only) ─── */
  app.delete(`${PREFIX}/updates/:id`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const updateId = c.req.param("id");
      const update: any = await kv.get(`update:${updateId}`);
      if (!update) return c.json({ error: "Update not found" }, 404);

      if (update.authorId !== user.id) {
        return c.json({ error: "Only the author can delete this update" }, 403);
      }

      // Remove from index
      const indexKey = update.spaceId ? `updates:space:${update.spaceId}` : "updates:global";
      const existing: string[] = (await kv.get(indexKey)) || [];
      await kv.set(indexKey, existing.filter((id) => id !== updateId));

      // Delete the update itself
      await kv.del(`update:${updateId}`);

      console.log(`[Updates] Deleted update ${updateId} by ${user.id}`);
      return c.json({ success: true });
    } catch (err) {
      console.log(`[Updates] Error deleting update: ${err}`);
      return c.json({ error: `Failed to delete update: ${err}` }, 500);
    }
  }));

  /* ─── PATCH /updates/:id — Edit an update (author only) ─── */
  app.patch(`${PREFIX}/updates/:id`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const updateId = c.req.param("id");
      const update: any = await kv.get(`update:${updateId}`);
      if (!update) return c.json({ error: "Update not found" }, 404);

      if (update.authorId !== user.id) {
        return c.json({ error: "Only the author can edit this update" }, 403);
      }

      const body = await c.req.json();

      // Editable fields: content, contentFormat, spaceId, commentsDisabled
      if (body.content !== undefined) {
        update.content = (body.content || "").trim();
      }
      if (body.contentFormat !== undefined) {
        update.contentFormat = body.contentFormat;
      }
      if (body.commentsDisabled !== undefined) {
        update.commentsDisabled = !!body.commentsDisabled;
      }
      if (body.spaceId !== undefined) {
        const oldIndexKey = update.spaceId ? `updates:space:${update.spaceId}` : "updates:global";
        const newSpaceId = body.spaceId || null;
        const newIndexKey = newSpaceId ? `updates:space:${newSpaceId}` : "updates:global";

        if (oldIndexKey !== newIndexKey) {
          // Remove from old index
          const oldIds: string[] = (await kv.get(oldIndexKey)) || [];
          await kv.set(oldIndexKey, oldIds.filter((id) => id !== updateId));

          // Add to new index
          const newIds: string[] = (await kv.get(newIndexKey)) || [];
          if (!newIds.includes(updateId)) {
            await kv.set(newIndexKey, [updateId, ...newIds]);
          }
        }

        update.spaceId = newSpaceId;
      }

      await kv.set(`update:${updateId}`, update);
      console.log(`[Updates] Patched update ${updateId} by ${user.id}`);
      return c.json({ update });
    } catch (err) {
      console.log(`[Updates] Error patching update: ${err}`);
      return c.json({ error: `Failed to patch update: ${err}` }, 500);
    }
  }));
}