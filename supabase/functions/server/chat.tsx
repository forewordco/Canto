/* ═══════════════════════════════════════════════════════════
   CHAT ROUTES — One-on-one messaging backed by KV store.

   Key patterns:
   - chat:conv:{convId}             → conversation metadata
   - chat:user-convs:{userId}       → array of conversation IDs
   - chat:msgs:{convId}:{ts}-{rand} → individual messages
   - chat:unread:{userId}:{convId}  → unread count (number)
   - chat:presence:{userId}         → { status, lastSeen }
   - chat:user-prefs:{userId}       → { sidebarOrder, mutedConvs, archivedConvs }
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
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: { user }, error } = await supabase().auth.getUser(token);
      if (error || !user) return null;
      return { id: user.id, email: user.email || "" };
    } catch (err) {
      const isTransient =
        String(err).includes("connection reset") ||
        String(err).includes("connection error") ||
        String(err).includes("ECONNRESET") ||
        String(err).includes("SendRequest") ||
        String(err).includes("tcp connect error");
      if (isTransient && attempt < maxRetries - 1) {
        console.log(`[Chat] getUser transient error (attempt ${attempt + 1}/${maxRetries}), retrying: ${err}`);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      if (isTransient) {
        console.log(`[Chat] getUser transient failure after ${maxRetries} attempts: ${err}`);
        throw new TransientAuthError(`Auth service temporarily unavailable after ${maxRetries} retries`);
      }
      console.log(`[Chat] getUser non-transient error: ${err}`);
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
        console.log(`[Chat] 503 Service Unavailable: ${err.message}`);
        return c.json({ error: "Service temporarily unavailable. Please retry.", retryable: true }, 503);
      }
      throw err;
    }
  };
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function registerChatRoutes(app: Hono, PREFIX: string) {

  /* ─── GET /chat/conversations ─── */
  app.get(`${PREFIX}/chat/conversations`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convIds: string[] = (await kv.get(`chat:user-convs:${user.id}`)) || [];
      if (convIds.length === 0) return c.json({ conversations: [] });

      const convKeys = convIds.map((id) => `chat:conv:${id}`);
      const convValues = await kv.mget(convKeys);

      const conversations = convValues
        .filter(Boolean)
        .map((conv: any) => {
          // Attach unread count
          return { ...conv };
        });

      // Sort by last message time descending
      conversations.sort((a: any, b: any) =>
        new Date(b.lastMessageAt || b.createdAt).getTime() -
        new Date(a.lastMessageAt || a.createdAt).getTime()
      );

      // Fetch unread counts in parallel
      const unreadKeys = conversations.map((conv: any) => `chat:unread:${user.id}:${conv.id}`);
      const unreadValues = unreadKeys.length > 0 ? await kv.mget(unreadKeys) : [];
      conversations.forEach((conv: any, i: number) => {
        conv.unreadCount = unreadValues[i] || 0;
      });

      return c.json({ conversations });
    } catch (err) {
      console.log(`[Chat] GET conversations error: ${err}`);
      return c.json({ error: `Failed to load conversations: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/conversations — create or find existing ─── */
  app.post(`${PREFIX}/chat/conversations`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const { otherUserId } = await c.req.json();
      if (!otherUserId) return c.json({ error: "otherUserId required" }, 400);
      if (otherUserId === user.id) return c.json({ error: "Cannot chat with yourself" }, 400);

      // Check for existing conversation between these two users
      const userConvIds: string[] = (await kv.get(`chat:user-convs:${user.id}`)) || [];
      for (const cid of userConvIds) {
        const conv: any = await kv.get(`chat:conv:${cid}`);
        if (conv && conv.participants.includes(otherUserId)) {
          return c.json({ conversation: conv, existing: true });
        }
      }

      // Create new conversation
      const convId = genId("conv");
      const participants = [user.id, otherUserId].sort();
      const now = new Date().toISOString();

      const conv = {
        id: convId,
        participants,
        createdAt: now,
        lastMessageAt: now,
        lastMessagePreview: "",
        lastMessageSenderId: "",
        lastMessageType: "system",
      };

      // Save conversation + update both users' conversation lists
      const otherConvIds: string[] = (await kv.get(`chat:user-convs:${otherUserId}`)) || [];

      await kv.mset(
        [
          `chat:conv:${convId}`,
          `chat:user-convs:${user.id}`,
          `chat:user-convs:${otherUserId}`,
        ],
        [
          conv,
          [...userConvIds, convId],
          [...otherConvIds, convId],
        ]
      );

      // Create a system message
      const msgId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await kv.set(`chat:msgs:${convId}:${msgId}`, {
        id: msgId,
        convId,
        senderId: "__system__",
        text: "Conversation started",
        type: "system",
        createdAt: now,
      });

      return c.json({ conversation: conv, existing: false });
    } catch (err) {
      console.log(`[Chat] POST conversations error: ${err}`);
      return c.json({ error: `Failed to create conversation: ${err}` }, 500);
    }
  }));

  /* ─── PATCH /chat/conversations/:id — mute/archive ─── */
  app.patch(`${PREFIX}/chat/conversations/:id`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const updates = await c.req.json();

      // Update user prefs
      const prefs: any = (await kv.get(`chat:user-prefs:${user.id}`)) || {
        sidebarOrder: [],
        mutedConvs: [],
        archivedConvs: [],
      };

      if (updates.muted !== undefined) {
        if (updates.muted) {
          if (!prefs.mutedConvs.includes(convId)) prefs.mutedConvs.push(convId);
        } else {
          prefs.mutedConvs = prefs.mutedConvs.filter((id: string) => id !== convId);
        }
      }

      if (updates.archived !== undefined) {
        if (updates.archived) {
          if (!prefs.archivedConvs.includes(convId)) prefs.archivedConvs.push(convId);
        } else {
          prefs.archivedConvs = prefs.archivedConvs.filter((id: string) => id !== convId);
        }
      }

      await kv.set(`chat:user-prefs:${user.id}`, prefs);
      return c.json({ success: true, prefs });
    } catch (err) {
      console.log(`[Chat] PATCH conversation error: ${err}`);
      return c.json({ error: `Failed to update conversation: ${err}` }, 500);
    }
  }));

  /* ─── GET /chat/conversations/:id/messages ─── */
  app.get(`${PREFIX}/chat/conversations/:id/messages`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const limit = parseInt(c.req.query("limit") || "50");
      const before = c.req.query("before"); // cursor timestamp

      // Verify user is participant
      const conv: any = await kv.get(`chat:conv:${convId}`);
      if (!conv || !conv.participants.includes(user.id)) {
        return c.json({ error: "Conversation not found or not a participant" }, 404);
      }

      // Fetch messages by prefix
      const sb = supabase();
      let query = sb
        .from("kv_store_a038f2e0")
        .select("key, value")
        .like("key", `chat:msgs:${convId}:%`)
        .order("key", { ascending: false })
        .limit(limit + 1); // +1 to check hasMore

      if (before) {
        query = query.lt("key", `chat:msgs:${convId}:${before}`);
      }

      const { data, error } = await query;
      if (error) {
        console.log(`[Chat] Messages query error: ${error.message}`);
        return c.json({ error: `Failed to load messages: ${error.message}` }, 500);
      }

      const hasMore = data && data.length > limit;
      const messages = (data || []).slice(0, limit).map((row: any) => row.value).reverse();

      return c.json({ messages, hasMore });
    } catch (err) {
      console.log(`[Chat] GET messages error: ${err}`);
      return c.json({ error: `Failed to load messages: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/conversations/:id/messages — send message ─── */
  app.post(`${PREFIX}/chat/conversations/:id/messages`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const { text, type = "text", replyTo, imageUrl, fileName, fileSize, fileUrl, taskCard } = await c.req.json();

      if (!text && type === "text") return c.json({ error: "Message text required" }, 400);

      // Verify user is participant
      const conv: any = await kv.get(`chat:conv:${convId}`);
      if (!conv || !conv.participants.includes(user.id)) {
        return c.json({ error: "Conversation not found or not a participant" }, 404);
      }

      const now = new Date().toISOString();
      const ts = Date.now();
      const rand = Math.random().toString(36).slice(2, 6);
      const msgId = `${ts}-${rand}`;

      const message: any = {
        id: msgId,
        convId,
        senderId: user.id,
        text: text || "",
        type,
        createdAt: now,
        reactions: [],
      };

      if (replyTo) message.replyTo = replyTo;
      if (imageUrl) message.imageUrl = imageUrl;
      if (fileName) message.fileName = fileName;
      if (fileSize) message.fileSize = fileSize;
      if (fileUrl) message.fileUrl = fileUrl;
      if (taskCard) message.taskCard = taskCard;

      // Determine preview text
      let preview = text || "";
      if (type === "image") preview = "📷 Image";
      if (type === "file") preview = `📎 ${fileName || "File"}`;
      if (type === "task-card") preview = `📋 ${taskCard?.title || "Task"}`;
      if (preview.length > 60) preview = preview.slice(0, 60) + "…";

      // Update conversation metadata
      const updatedConv = {
        ...conv,
        lastMessageAt: now,
        lastMessagePreview: preview,
        lastMessageSenderId: user.id,
        lastMessageType: type,
      };

      // Increment unread for the other user
      const otherUserId = conv.participants.find((p: string) => p !== user.id);
      const unreadKey = `chat:unread:${otherUserId}:${convId}`;
      const currentUnread: number = (await kv.get(unreadKey)) || 0;

      await kv.mset(
        [
          `chat:msgs:${convId}:${msgId}`,
          `chat:conv:${convId}`,
          unreadKey,
        ],
        [
          message,
          updatedConv,
          currentUnread + 1,
        ]
      );

      return c.json({ message });
    } catch (err) {
      console.log(`[Chat] POST message error: ${err}`);
      return c.json({ error: `Failed to send message: ${err}` }, 500);
    }
  }));

  /* ─── PATCH /chat/conversations/:id/messages/:msgId — edit/react ─── */
  app.patch(`${PREFIX}/chat/conversations/:id/messages/:msgId`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const msgId = c.req.param("msgId");
      const { text, reaction } = await c.req.json();

      // Find the message key
      const msgKey = `chat:msgs:${convId}:${msgId}`;
      const msg: any = await kv.get(msgKey);
      if (!msg) return c.json({ error: "Message not found" }, 404);

      if (text !== undefined) {
        // Only sender can edit
        if (msg.senderId !== user.id) return c.json({ error: "Can only edit your own messages" }, 403);
        msg.text = text;
        msg.editedAt = new Date().toISOString();
      }

      if (reaction !== undefined) {
        // Toggle reaction
        if (!msg.reactions) msg.reactions = [];
        const existing = msg.reactions.find((r: any) => r.emoji === reaction);
        if (existing) {
          if (existing.userIds.includes(user.id)) {
            existing.userIds = existing.userIds.filter((id: string) => id !== user.id);
            if (existing.userIds.length === 0) {
              msg.reactions = msg.reactions.filter((r: any) => r.emoji !== reaction);
            }
          } else {
            existing.userIds.push(user.id);
          }
        } else {
          msg.reactions.push({ emoji: reaction, userIds: [user.id] });
        }
      }

      await kv.set(msgKey, msg);
      return c.json({ message: msg });
    } catch (err) {
      console.log(`[Chat] PATCH message error: ${err}`);
      return c.json({ error: `Failed to update message: ${err}` }, 500);
    }
  }));

  /* ─── DELETE /chat/conversations/:id/messages/:msgId ─── */
  app.delete(`${PREFIX}/chat/conversations/:id/messages/:msgId`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const msgId = c.req.param("msgId");
      const msgKey = `chat:msgs:${convId}:${msgId}`;
      const msg: any = await kv.get(msgKey);

      if (!msg) return c.json({ error: "Message not found" }, 404);
      if (msg.senderId !== user.id) return c.json({ error: "Can only delete your own messages" }, 403);

      // Soft delete
      msg.deleted = true;
      msg.text = "";
      msg.deletedAt = new Date().toISOString();
      await kv.set(msgKey, msg);

      return c.json({ success: true });
    } catch (err) {
      console.log(`[Chat] DELETE message error: ${err}`);
      return c.json({ error: `Failed to delete message: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/conversations/:id/read — mark as read ─── */
  app.post(`${PREFIX}/chat/conversations/:id/read`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      await kv.set(`chat:unread:${user.id}:${convId}`, 0);
      return c.json({ success: true });
    } catch (err) {
      console.log(`[Chat] POST read error: ${err}`);
      return c.json({ error: `Failed to mark as read: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/presence — update presence ─── */
  app.post(`${PREFIX}/chat/presence`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const { status, statusMessage } = await c.req.json();
      await kv.set(`chat:presence:${user.id}`, {
        status: status || "online",
        lastSeen: new Date().toISOString(),
        statusMessage: statusMessage || "",
      });
      return c.json({ success: true });
    } catch (err) {
      console.log(`[Chat] POST presence error: ${err}`);
      return c.json({ error: `Failed to update presence: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/typing — set typing indicator ─── */
  app.post(`${PREFIX}/chat/typing`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const { convId, isTyping } = await c.req.json();
      if (!convId) return c.json({ error: "convId required" }, 400);

      if (isTyping) {
        await kv.set(`chat:typing:${convId}:${user.id}`, {
          userId: user.id,
          timestamp: Date.now(),
        });
      } else {
        await kv.del(`chat:typing:${convId}:${user.id}`);
      }
      return c.json({ success: true });
    } catch (err) {
      console.log(`[Chat] POST typing error: ${err}`);
      return c.json({ error: `Failed to update typing: ${err}` }, 500);
    }
  }));

  /* ─── GET /chat/typing/:convId — get who is typing ─── */
  app.get(`${PREFIX}/chat/typing/:convId`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("convId");
      const sb = supabase();
      const { data } = await sb
        .from("kv_store_a038f2e0")
        .select("key, value")
        .like("key", `chat:typing:${convId}:%`);

      const now = Date.now();
      const typingUsers = (data || [])
        .map((row: any) => row.value)
        .filter((v: any) => v && v.userId !== user.id && now - v.timestamp < 10_000)
        .map((v: any) => v.userId);

      return c.json({ typingUsers });
    } catch (err) {
      console.log(`[Chat] GET typing error: ${err}`);
      return c.json({ error: `Failed to get typing: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/presence/batch — get presence for multiple users ─── */
  app.post(`${PREFIX}/chat/presence/batch`, withTransientHandling(async (c) => {
    try {
      const { userIds } = await c.req.json();
      if (!Array.isArray(userIds) || userIds.length === 0) return c.json({ presences: {} });

      const keys = userIds.map((id: string) => `chat:presence:${id}`);
      const values = await kv.mget(keys);

      const presences: Record<string, any> = {};
      userIds.forEach((id: string, i: number) => {
        const p = values[i];
        if (p) {
          // Consider online if last seen within 2 minutes
          const lastSeen = new Date(p.lastSeen).getTime();
          const isOnline = Date.now() - lastSeen < 120_000;
          presences[id] = { ...p, status: isOnline ? p.status : "offline" };
        } else {
          presences[id] = { status: "offline", lastSeen: null };
        }
      });

      return c.json({ presences });
    } catch (err) {
      console.log(`[Chat] GET presence batch error: ${err}`);
      return c.json({ error: `Failed to get presence: ${err}` }, 500);
    }
  }));

  /* ─── GET/PUT /chat/user-prefs — sidebar order etc. ─── */
  app.get(`${PREFIX}/chat/user-prefs`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const prefs = (await kv.get(`chat:user-prefs:${user.id}`)) || {
        sidebarOrder: [],
        mutedConvs: [],
        archivedConvs: [],
      };
      return c.json({ prefs });
    } catch (err) {
      console.log(`[Chat] GET user-prefs error: ${err}`);
      return c.json({ error: `Failed to get prefs: ${err}` }, 500);
    }
  }));

  app.put(`${PREFIX}/chat/user-prefs`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const prefs = await c.req.json();
      await kv.set(`chat:user-prefs:${user.id}`, prefs);
      return c.json({ success: true });
    } catch (err) {
      console.log(`[Chat] PUT user-prefs error: ${err}`);
      return c.json({ error: `Failed to save prefs: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/conversations/:id/pins/:msgId ─── */
  app.post(`${PREFIX}/chat/conversations/:id/pins/:msgId`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const msgId = c.req.param("msgId");

      const pins: string[] = (await kv.get(`chat:pins:${convId}`)) || [];
      if (!pins.includes(msgId)) pins.push(msgId);
      await kv.set(`chat:pins:${convId}`, pins);

      return c.json({ success: true, pins });
    } catch (err) {
      console.log(`[Chat] POST pin error: ${err}`);
      return c.json({ error: `Failed to pin message: ${err}` }, 500);
    }
  }));

  app.delete(`${PREFIX}/chat/conversations/:id/pins/:msgId`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const msgId = c.req.param("msgId");

      let pins: string[] = (await kv.get(`chat:pins:${convId}`)) || [];
      pins = pins.filter((id) => id !== msgId);
      await kv.set(`chat:pins:${convId}`, pins);

      return c.json({ success: true, pins });
    } catch (err) {
      console.log(`[Chat] DELETE pin error: ${err}`);
      return c.json({ error: `Failed to unpin message: ${err}` }, 500);
    }
  }));

  /* ─── GET /chat/conversations/:id/pins ─── */
  app.get(`${PREFIX}/chat/conversations/:id/pins`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const convId = c.req.param("id");
      const pinIds: string[] = (await kv.get(`chat:pins:${convId}`)) || [];
      if (pinIds.length === 0) return c.json({ pins: [] });

      const keys = pinIds.map((id) => `chat:msgs:${convId}:${id}`);
      const values = await kv.mget(keys);

      return c.json({ pins: values.filter(Boolean) });
    } catch (err) {
      console.log(`[Chat] GET pins error: ${err}`);
      return c.json({ error: `Failed to get pins: ${err}` }, 500);
    }
  }));

  /* ─── POST /chat/seed-test-user — Create a test user for chat testing ─── */
  app.post(`${PREFIX}/chat/seed-test-user`, withTransientHandling(async (c) => {
    try {
      const user = await getUser(c);
      if (!user) return c.json({ error: "Auth required" }, 401);

      const { name, email } = await c.req.json();
      if (!name || !email) {
        return c.json({ error: "name and email are required" }, 400);
      }

      const sb = supabase();

      // Create auth user with a random password
      const password = `Test${Date.now()}!${Math.random().toString(36).slice(2, 10)}`;
      const { data: authData, error: authError } = await sb.auth.admin.createUser({
        email,
        password,
        user_metadata: { name },
        email_confirm: true,
      });

      if (authError) {
        console.log(`[Chat] Seed test user auth error: ${authError.message}`);
        return c.json({ error: `Failed to create auth user: ${authError.message}` }, 400);
      }

      const testUserId = authData.user.id;

      // Create team member entry
      const colors = [
        "oklch(0.70 0.18 25)",   // warm red
        "oklch(0.72 0.16 145)",  // green
        "oklch(0.68 0.18 260)",  // blue
        "oklch(0.72 0.16 310)",  // purple
        "oklch(0.75 0.14 55)",   // orange
        "oklch(0.70 0.16 195)",  // teal
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      await kv.set(`team-member:${testUserId}`, {
        userId: testUserId,
        displayName: name,
        email: email.toLowerCase().trim(),
        role: "Test User",
        avatarColor: color,
        isPlaceholder: false,
      });

      console.log(`[Chat] Test user created: ${testUserId} (${email})`);

      return c.json({
        success: true,
        user: {
          id: testUserId,
          name,
          email,
          color,
        },
      });
    } catch (err) {
      console.log(`[Chat] Seed test user error: ${err}`);
      return c.json({ error: `Failed to create test user: ${err}` }, 500);
    }
  }));
}