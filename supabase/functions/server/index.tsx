import { Hono } from "npm:hono@4.6.20";
import { cors } from "npm:hono@4.6.20/cors";
import { logger } from "npm:hono@4.6.20/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
import { registerIntegrationRoutes } from "./integrations.tsx";
import { registerAsanaRoutes } from "./asana_routes.tsx";
import { registerChatRoutes } from "./chat.tsx";
import { registerUpdatesRoutes } from "./updates.tsx";
import { registerInviteRoutes } from "./invites.tsx";

const app = new Hono();

// Enable logger
app.use("*", logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

// Global error handler — catch transient auth errors across all routes
app.onError((err, c) => {
  const isTransientAuth = err instanceof TransientAuthError
    || (err as any)?.name === "TransientAuthError"
    || String(err.message).startsWith("TransientAuthError:");
  if (isTransientAuth) {
    console.log(`[Server] 503 Service Unavailable (global handler): ${err.message}`);
    return c.json({ error: "Service temporarily unavailable. Please retry.", retryable: true }, 503);
  }
  console.log(`[Server] Unhandled error: ${err}`);
  return c.json({ error: `Internal server error: ${err.message || err}` }, 500);
});

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

/** Custom error for transient network failures */
class TransientAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientAuthError";
  }
}

/** Extract and verify user from X-User-Token header (with retry for transient network errors) */
async function getAuthUser(c: any): Promise<{ id: string; email: string } | null> {
  const token = c.req.header("X-User-Token");
  if (!token) return null;

  const maxRetries = 4;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        console.log(`[Auth] Token verification failed: ${error?.message || "no user"}`);
        return null;
      }
      return { id: user.id, email: user.email || "" };
    } catch (err) {
      const errStr = String(err).toLowerCase();
      const isTransient =
        errStr.includes("connection reset") ||
        errStr.includes("connection error") ||
        errStr.includes("econnreset") ||
        errStr.includes("sendrequest") ||
        errStr.includes("tcp connect error") ||
        errStr.includes("os error 104") ||
        errStr.includes("broken pipe");
      if (isTransient && attempt < maxRetries - 1) {
        console.log(`[Auth] getAuthUser transient error (attempt ${attempt + 1}/${maxRetries}), retrying: ${err}`);
        await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt)));
        continue;
      }
      if (isTransient) {
        console.log(`[Auth] getAuthUser transient failure after ${maxRetries} attempts: ${err}`);
        throw new TransientAuthError(`Auth service temporarily unavailable after ${maxRetries} retries`);
      }
      console.log(`[Auth] Token verification error: ${err}`);
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
        console.log(`[Server] 503 Service Unavailable: ${err.message}`);
        return c.json({ error: "Service temporarily unavailable. Please retry.", retryable: true }, 503);
      }
      throw err;
    }
  };
}

const PREFIX = "/make-server-a038f2e0";

/* ═══════════════════════════════════════════════════════════
   HEALTH CHECK — registered first so it responds during cold start
   ═══════════════════════════════════════════════════════════ */

app.get(`${PREFIX}/health`, (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ── Register Integration Routes (Phase 12) ── */
registerAsanaRoutes(app, PREFIX);
registerIntegrationRoutes(app, PREFIX);
registerChatRoutes(app, PREFIX);
registerUpdatesRoutes(app, PREFIX);
registerInviteRoutes(app, PREFIX);



/* ═══════════════════════════════════════════════════════════
   AUTH — SIGNUP (admin user creation with email_confirm)
   ═══════════════════════════════════════════════════════════ */

app.post(`${PREFIX}/signup`, async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required for signup" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || "" },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`[Signup] Error creating user ${email}: ${error.message}`);
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }

    const newUserId = data.user.id;
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Signup] User created successfully: ${newUserId} (${email})`);

    /* ── Auto-link: match placeholder team members by email ── */
    try {
      const teamResult = await supabase
        .from("kv_store_a038f2e0")
        .select("key, value")
        .like("key", "team-member:%");

      if (teamResult.data) {
        for (const row of teamResult.data) {
          const member = row.value;
          if (
            member &&
            member.isPlaceholder &&
            member.email?.toLowerCase().trim() === normalizedEmail
          ) {
            const oldKey = row.key;
            const updatedMember = {
              ...member,
              userId: newUserId,
              isPlaceholder: false,
            };
            await kv.set(`team-member:${newUserId}`, updatedMember);
            if (oldKey !== `team-member:${newUserId}`) {
              await kv.del(oldKey);
            }

            // Update project membership and task assignee references
            const projectsResult = await supabase
              .from("kv_store_a038f2e0")
              .select("key, value")
              .like("key", "project:shared:%");

            if (projectsResult.data) {
              for (const projRow of projectsResult.data) {
                const proj = projRow.value;
                if (proj?.members?.includes(member.userId)) {
                  const updatedMembers = proj.members.map((m: string) =>
                    m === member.userId ? newUserId : m
                  );
                  const updatedTasks = (proj.tasks || []).map((t: any) =>
                    t.assignee === member.userId ? { ...t, assignee: newUserId } : t
                  );
                  const updatedNotes = (proj.notes || []).map((t: any) =>
                    t.assignee === member.userId ? { ...t, assignee: newUserId } : t
                  );
                  await kv.set(projRow.key, {
                    ...proj,
                    members: updatedMembers,
                    tasks: updatedTasks,
                    notes: updatedNotes,
                  });
                }
              }
            }

            console.log(
              `[Signup] Auto-linked placeholder "${member.displayName}" (${member.userId}) → real user ${newUserId}`
            );
            break;
          }
        }
      }
    } catch (linkErr) {
      console.log(`[Signup] Auto-link placeholder check failed (non-fatal): ${linkErr}`);
    }

    /* ── Accept pending invitations ── */
    try {
      const inviteData = await kv.get(`invite:${normalizedEmail}`);
      if (inviteData) {
        console.log(`[Signup] Found pending invitation for ${normalizedEmail}, auto-accepting`);
        await kv.set(`team-member:${newUserId}`, {
          userId: newUserId,
          displayName: name || email.split("@")[0],
          email: normalizedEmail,
          role: (inviteData as any).role || "",
          avatarColor: "oklch(0.82 0.12 25)",
          isPlaceholder: false,
        });
        await kv.set(`invite:${normalizedEmail}`, {
          ...(inviteData as any),
          status: "accepted",
          acceptedAt: new Date().toISOString(),
          acceptedUserId: newUserId,
        });
      }
    } catch (inviteErr) {
      console.log(`[Signup] Invitation acceptance check failed (non-fatal): ${inviteErr}`);
    }

    return c.json({
      user: { id: newUserId, email: data.user.email },
      message: "Account created successfully",
    });
  } catch (err) {
    console.log(`[Signup] Unexpected error: ${err}`);
    return c.json({ error: `Signup error: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   KV STORE ROUTES
   ═══════════════════════════════════════════════════════════ */

/** GET /kv/:key — Get a single value */
app.get(`${PREFIX}/kv/:key`, async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"));
    const value = await kv.get(key);
    return c.json({ value: value ?? null });
  } catch (err) {
    console.log(`[KV GET] Error reading key "${c.req.param("key")}": ${err}`);
    return c.json({ error: `KV get failed: ${err}` }, 500);
  }
});

/** POST /kv — Set a single key-value pair */
app.post(`${PREFIX}/kv`, async (c) => {
  try {
    const { key, value } = await c.req.json();
    if (!key) {
      return c.json({ error: "Key is required for KV set" }, 400);
    }
    await kv.set(key, value);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[KV SET] Error: ${err}`);
    return c.json({ error: `KV set failed: ${err}` }, 500);
  }
});

/** DELETE /kv/:key — Delete a single key */
app.delete(`${PREFIX}/kv/:key`, async (c) => {
  try {
    const key = decodeURIComponent(c.req.param("key"));
    await kv.del(key);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[KV DEL] Error deleting key "${c.req.param("key")}": ${err}`);
    return c.json({ error: `KV delete failed: ${err}` }, 500);
  }
});

/** POST /kv/mget — Get multiple values by keys */
app.post(`${PREFIX}/kv/mget`, async (c) => {
  try {
    const { keys } = await c.req.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return c.json({});
    }
    const values = await kv.mget(keys);
    // Return as { key: value } map
    const result: Record<string, any> = {};
    keys.forEach((k: string, i: number) => {
      if (values[i] !== undefined && values[i] !== null) {
        result[k] = values[i];
      }
    });
    return c.json(result);
  } catch (err) {
    console.log(`[KV MGET] Error: ${err}`);
    return c.json({ error: `KV mget failed: ${err}` }, 500);
  }
});

/** POST /kv/mdel ��� Delete multiple keys */
app.post(`${PREFIX}/kv/mdel`, async (c) => {
  try {
    const { keys } = await c.req.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return c.json({ success: true });
    }
    await kv.mdel(keys);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[KV MDEL] Error: ${err}`);
    return c.json({ error: `KV mdel failed: ${err}` }, 500);
  }
});

/** GET /kv/prefix/:prefix — Get all values by key prefix */
app.get(`${PREFIX}/kv/prefix/:prefix`, async (c) => {
  try {
    const prefix = decodeURIComponent(c.req.param("prefix"));
    const values = await kv.getByPrefix(prefix);
    // getByPrefix returns array of values; we need key-value pairs
    // Re-query to get keys too
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data, error } = await supabase
      .from("kv_store_a038f2e0")
      .select("key, value")
      .like("key", prefix + "%");

    if (error) {
      console.log(`[KV PREFIX] Error querying prefix "${prefix}": ${error.message}`);
      return c.json({ error: `KV prefix query failed: ${error.message}` }, 500);
    }

    const result: Record<string, any> = {};
    data?.forEach((row: { key: string; value: any }) => {
      result[row.key] = row.value;
    });
    return c.json(result);
  } catch (err) {
    console.log(`[KV PREFIX] Error: ${err}`);
    return c.json({ error: `KV prefix failed: ${err}` }, 500);
  }
});

/** POST /kv/mset — Set multiple key-value pairs */
app.post(`${PREFIX}/kv/mset`, async (c) => {
  try {
    const { entries } = await c.req.json();
    if (!Array.isArray(entries) || entries.length === 0) {
      return c.json({ success: true });
    }
    const keys = entries.map((e: { key: string }) => e.key);
    const values = entries.map((e: { value: any }) => e.value);
    await kv.mset(keys, values);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[KV MSET] Error: ${err}`);
    return c.json({ error: `KV mset failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   FILE STORAGE — Signed URL generation for avatar uploads etc.
   ═══════════════════════════════════════════════════════════ */

const AVATAR_BUCKET = "make-a038f2e0-avatars";

// Attachments bucket
const ATTACHMENTS_BUCKET = "make-a038f2e0-attachments";

// Idempotent bucket creation on startup
(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: buckets } = await supabase.storage.listBuckets();
    const avatarExists = buckets?.some(
      (bucket: { name: string }) => bucket.name === AVATAR_BUCKET
    );
    if (!avatarExists) {
      await supabase.storage.createBucket(AVATAR_BUCKET, { public: false });
      console.log(`[Storage] Created bucket: ${AVATAR_BUCKET}`);
    }
    const attachExists = buckets?.some(
      (bucket: { name: string }) => bucket.name === ATTACHMENTS_BUCKET
    );
    if (!attachExists) {
      await supabase.storage.createBucket(ATTACHMENTS_BUCKET, { public: false });
      console.log(`[Storage] Created bucket: ${ATTACHMENTS_BUCKET}`);
    }
  } catch (err) {
    console.log(`[Storage] Bucket setup error (non-fatal): ${err}`);
  }
})();

/** POST /storage/avatar-upload-url — Get a signed upload URL */
app.post(`${PREFIX}/storage/avatar-upload-url`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required for avatar upload" }, 401);
    }

    const { fileName, contentType } = await c.req.json();
    const path = `${user.id}/${fileName || "avatar.jpg"}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upload is done server-side; for now return a signed URL for reading
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    if (error) {
      console.log(`[Storage] Signed URL error: ${error.message}`);
      return c.json({ error: `Failed to create signed URL: ${error.message}` }, 500);
    }

    return c.json({ signedUrl: data.signedUrl, path });
  } catch (err) {
    console.log(`[Storage] Avatar upload URL error: ${err}`);
    return c.json({ error: `Storage error: ${err}` }, 500);
  }
});

/** POST /storage/avatar — Upload avatar file (base64) */
app.post(`${PREFIX}/storage/avatar`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required for avatar upload" }, 401);
    }

    const { base64, contentType, fileName } = await c.req.json();
    if (!base64) {
      return c.json({ error: "base64 data is required" }, 400);
    }

    const path = `${user.id}/${fileName || "avatar.jpg"}`;

    // Decode base64 to Uint8Array
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, {
        contentType: contentType || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.log(`[Storage] Upload error: ${uploadError.message}`);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Create signed URL for reading
    const { data: urlData, error: urlError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (urlError) {
      console.log(`[Storage] Signed URL after upload error: ${urlError.message}`);
      return c.json({ error: `Signed URL creation failed: ${urlError.message}` }, 500);
    }

    return c.json({ url: urlData.signedUrl, path });
  } catch (err) {
    console.log(`[Storage] Avatar upload error: ${err}`);
    return c.json({ error: `Avatar upload error: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   BATCH DATA LOAD — Load all workspace data in a single request
   ═══════════════════════════════════════════════════════════ */

app.post(`${PREFIX}/data/batch-load`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required for batch load" }, 401);
    }

    const userId = user.id;

    // Build list of individual keys to fetch
    const singleKeys = [
      "clients:shared",
      "events:shared",
      "docs:shared",
      `profile:${userId}`,
      `starred:${userId}`,
      `today:${userId}`,
      `timeblocks:${userId}`,
      `weekSettings:${userId}`,
      `notifications:${userId}`,
      `spaces:${userId}`,
    ];

    // Fetch single keys + prefix-based queries in parallel
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [singleResult, projectsResult, teamResult] = await Promise.all([
      // Batch fetch single keys — query key+value so we can map by key.
      // NOTE: kv.mget only returns values without keys and SQL IN does NOT
      // guarantee order, so positional mapping (singleResult[i] → singleKeys[i])
      // silently shuffles data, causing projects/spaces to disappear.
      supabase
        .from("kv_store_a038f2e0")
        .select("key, value")
        .in("key", singleKeys),
      // Fetch all projects by prefix
      supabase
        .from("kv_store_a038f2e0")
        .select("key, value")
        .like("key", "project:shared:%"),
      // Fetch all team members by prefix
      supabase
        .from("kv_store_a038f2e0")
        .select("key, value")
        .like("key", "team-member:%"),
    ]);

    // Log any query errors for debugging
    if (singleResult.error) console.log(`[BatchLoad] Single-key query error: ${singleResult.error.message}`);
    if (projectsResult.error) console.log(`[BatchLoad] Projects query error: ${projectsResult.error.message}`);
    if (teamResult.error) console.log(`[BatchLoad] Team query error: ${teamResult.error.message}`);

    // Map single-key results back to named fields BY KEY (not by position)
    const singleValues: Record<string, any> = {};
    if (singleResult.data) {
      for (const row of singleResult.data) {
        singleValues[row.key] = row.value;
      }
    }

    // Build projects map
    const projects: Record<string, any> = {};
    if (projectsResult.data) {
      for (const row of projectsResult.data) {
        projects[row.key] = row.value;
      }
    }

    // Build team members array
    const teamMembers: any[] = [];
    if (teamResult.data) {
      for (const row of teamResult.data) {
        if (row.value) teamMembers.push(row.value);
      }
    }

    return c.json({
      projects,
      clients: singleValues["clients:shared"] ?? [],
      events: singleValues["events:shared"] ?? [],
      docs: singleValues["docs:shared"] ?? [],
      profile: singleValues[`profile:${userId}`] ?? null,
      starred: singleValues[`starred:${userId}`] ?? [],
      todayTasks: singleValues[`today:${userId}`] ?? [],
      timeBlocks: singleValues[`timeblocks:${userId}`] ?? [],
      weekSettings: singleValues[`weekSettings:${userId}`] ?? null,
      notifications: singleValues[`notifications:${userId}`] ?? [],
      teamMembers,
      spaces: singleValues[`spaces:${userId}`] ?? [],
    });
  } catch (err) {
    console.log(`[BatchLoad] Error: ${err}`);
    return c.json({ error: `Batch load failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   BATCH DATA SAVE — Save multiple dirty entities in one request
   ═══════════════════════════════════════════════════════════ */

app.post(`${PREFIX}/data/batch-save`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required for batch save" }, 401);
    }

    const userId = user.id;
    const body = await c.req.json();
    const entries: { key: string; value: any }[] = [];
    const delKeys: string[] = [];

    // Projects (set)
    if (body.projects) {
      for (const [projectKey, projectData] of Object.entries(body.projects)) {
        // projectKey is already "project:shared:<name>"
        entries.push({ key: projectKey, value: projectData });
      }
    }

    // Deleted projects
    if (body.deletedProjects && Array.isArray(body.deletedProjects)) {
      for (const key of body.deletedProjects) {
        delKeys.push(key);
      }
    }

    // Clients
    if (body.clients !== undefined) {
      entries.push({ key: "clients:shared", value: body.clients });
    }

    // Events
    if (body.events !== undefined) {
      entries.push({ key: "events:shared", value: body.events });
    }

    // Docs
    if (body.docs !== undefined) {
      entries.push({ key: "docs:shared", value: body.docs });
    }

    // Profile
    if (body.profile !== undefined) {
      entries.push({ key: `profile:${userId}`, value: body.profile });
    }

    // Starred
    if (body.starred !== undefined) {
      entries.push({ key: `starred:${userId}`, value: body.starred });
    }

    // Today tasks
    if (body.todayTasks !== undefined) {
      entries.push({ key: `today:${userId}`, value: body.todayTasks });
    }

    // Time blocks
    if (body.timeBlocks !== undefined) {
      entries.push({ key: `timeblocks:${userId}`, value: body.timeBlocks });
    }

    // Week settings
    if (body.weekSettings !== undefined) {
      entries.push({ key: `weekSettings:${userId}`, value: body.weekSettings });
    }

    // Notifications
    if (body.notifications !== undefined) {
      entries.push({ key: `notifications:${userId}`, value: body.notifications });
    }

    // Spaces
    if (body.spaces !== undefined) {
      entries.push({ key: `spaces:${userId}`, value: body.spaces });
    }

    // Team members
    if (body.teamMembers && Array.isArray(body.teamMembers)) {
      for (const member of body.teamMembers) {
        if (member.userId) {
          entries.push({ key: `team-member:${member.userId}`, value: member });
        }
      }
    }

    // Perform batch operations in parallel
    const ops: Promise<void>[] = [];

    if (entries.length > 0) {
      const keys = entries.map((e) => e.key);
      const values = entries.map((e) => e.value);
      ops.push(kv.mset(keys, values));
    }

    if (delKeys.length > 0) {
      ops.push(kv.mdel(delKeys));
    }

    await Promise.all(ops);

    console.log(
      `[BatchSave] Saved ${entries.length} entries, deleted ${delKeys.length} keys for user ${userId}`
    );

    return c.json({ success: true, saved: entries.length, deleted: delKeys.length });
  } catch (err) {
    console.log(`[BatchSave] Error: ${err}`);
    return c.json({ error: `Batch save failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   ATTACHMENT STORAGE
   ═══════════════════════════════════════════════════════════ */

/** POST /storage/attachment — Upload an attachment file (base64) */
app.post(`${PREFIX}/storage/attachment`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required for attachment upload" }, 401);
    }

    const { base64, contentType, fileName, projectName } = await c.req.json();
    if (!base64) {
      return c.json({ error: "base64 data is required" }, 400);
    }

    const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const folder = projectName ? `projects/${sanitize(projectName)}` : `users/${user.id}`;
    const path = `${folder}/${Date.now()}-${sanitize(fileName || "file")}`;

    // Decode base64 to Uint8Array
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, bytes, {
        contentType: contentType || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      console.log(`[Storage] Attachment upload error: ${uploadError.message}`);
      return c.json({ error: `Upload failed: ${uploadError.message}` }, 500);
    }

    // Create signed URL for reading (1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (urlError) {
      console.log(`[Storage] Attachment signed URL error: ${urlError.message}`);
      return c.json({ error: `Signed URL failed: ${urlError.message}` }, 500);
    }

    return c.json({ url: urlData.signedUrl, path, storageKey: path });
  } catch (err) {
    console.log(`[Storage] Attachment error: ${err}`);
    return c.json({ error: `Attachment upload error: ${err}` }, 500);
  }
});

/** DELETE /storage/attachment/:path — Delete an attachment */
app.delete(`${PREFIX}/storage/attachment/*`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required for attachment delete" }, 401);
    }

    const filePath = c.req.path.replace(`${PREFIX}/storage/attachment/`, "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.storage
      .from(ATTACHMENTS_BUCKET)
      .remove([decodeURIComponent(filePath)]);

    if (error) {
      console.log(`[Storage] Attachment delete error: ${error.message}`);
      return c.json({ error: `Delete failed: ${error.message}` }, 500);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`[Storage] Attachment delete error: ${err}`);
    return c.json({ error: `Attachment delete error: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS — Server-side generation & polling
   ═══════════════════════════════════════════════════════════ */

const MAX_NOTIFICATIONS_PER_USER = 200;

/**
 * POST /notifications/send
 * Body: { targetUserId, type, title, message, fromUserName?, projectName?, taskId?, taskTitle? }
 * Stores a notification into the target user's KV-backed notifications array, capped at 200.
 */
app.post(`${PREFIX}/notifications/send`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required to send notifications" }, 401);
    }

    const body = await c.req.json();
    const { targetUserId, type, title, message, fromUserName, projectName, taskId, taskTitle } = body;

    if (!targetUserId || !type || !title) {
      return c.json({ error: "targetUserId, type, and title are required" }, 400);
    }

    // Don't send notifications to yourself
    if (targetUserId === user.id) {
      return c.json({ success: true, skipped: true, reason: "self-notification" });
    }

    const kvKey = `notifications:${targetUserId}`;
    const existing: any[] = (await kv.get(kvKey)) || [];

    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message: message || "",
      fromUserId: user.id,
      fromUserName: fromUserName || "",
      projectName: projectName || undefined,
      taskId: taskId || undefined,
      taskTitle: taskTitle || undefined,
      read: false,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    // Prepend and cap
    const updated = [notification, ...existing].slice(0, MAX_NOTIFICATIONS_PER_USER);
    await kv.set(kvKey, updated);

    console.log(`[Notifications] Sent "${type}" to user ${targetUserId} from ${user.id}`);
    return c.json({ success: true, notificationId: notification.id });
  } catch (err) {
    console.log(`[Notifications] Send error: ${err}`);
    return c.json({ error: `Notification send failed: ${err}` }, 500);
  }
});

/**
 * POST /notifications/send-bulk
 * Body: { notifications: [{ targetUserId, type, title, message, ... }] }
 * Sends notifications to multiple users at once.
 */
app.post(`${PREFIX}/notifications/send-bulk`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required to send notifications" }, 401);
    }

    const { notifications } = await c.req.json();
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return c.json({ success: true, sent: 0 });
    }

    // Group by target user
    const byUser = new Map<string, any[]>();
    for (const n of notifications) {
      if (!n.targetUserId || n.targetUserId === user.id) continue;
      if (!byUser.has(n.targetUserId)) byUser.set(n.targetUserId, []);
      byUser.get(n.targetUserId)!.push({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: n.type,
        title: n.title,
        message: n.message || "",
        fromUserId: user.id,
        fromUserName: n.fromUserName || "",
        projectName: n.projectName || undefined,
        taskId: n.taskId || undefined,
        taskTitle: n.taskTitle || undefined,
        read: false,
        archived: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Batch update each user's notifications
    let sent = 0;
    for (const [targetUserId, newNotifs] of byUser) {
      const kvKey = `notifications:${targetUserId}`;
      const existing: any[] = (await kv.get(kvKey)) || [];
      const updated = [...newNotifs, ...existing].slice(0, MAX_NOTIFICATIONS_PER_USER);
      await kv.set(kvKey, updated);
      sent += newNotifs.length;
    }

    console.log(`[Notifications] Bulk sent ${sent} notifications from user ${user.id}`);
    return c.json({ success: true, sent });
  } catch (err) {
    console.log(`[Notifications] Bulk send error: ${err}`);
    return c.json({ error: `Bulk notification send failed: ${err}` }, 500);
  }
});

/**
 * GET /notifications/poll?since=<ISO timestamp>
 * Returns notifications newer than `since` for the authenticated user.
 * Also returns total unread count.
 */
app.get(`${PREFIX}/notifications/poll`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required for notification polling" }, 401);
    }

    const since = c.req.query("since") || null;
    const kvKey = `notifications:${user.id}`;
    const all: any[] = (await kv.get(kvKey)) || [];

    const unreadCount = all.filter((n: any) => !n.read && !n.archived).length;

    let newItems: any[] = [];
    if (since) {
      const sinceTime = new Date(since).getTime();
      newItems = all.filter((n: any) => {
        try {
          return new Date(n.createdAt).getTime() > sinceTime;
        } catch {
          return false;
        }
      });
    }

    return c.json({ unreadCount, newItems, total: all.length });
  } catch (err) {
    console.log(`[Notifications] Poll error: ${err}`);
    return c.json({ error: `Notification poll failed: ${err}` }, 500);
  }
});

/**
 * POST /notifications/mark-read
 * Body: { ids: string[] } or { all: true }
 * Marks notifications as read for the authenticated user.
 */
app.post(`${PREFIX}/notifications/mark-read`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required" }, 401);
    }

    const body = await c.req.json();
    const kvKey = `notifications:${user.id}`;
    const all: any[] = (await kv.get(kvKey)) || [];

    let updated: any[];
    if (body.all) {
      updated = all.map((n: any) => ({ ...n, read: true }));
    } else if (body.ids && Array.isArray(body.ids)) {
      const idSet = new Set(body.ids);
      updated = all.map((n: any) => idSet.has(n.id) ? { ...n, read: true } : n);
    } else {
      return c.json({ error: "Provide { ids: [...] } or { all: true }" }, 400);
    }

    await kv.set(kvKey, updated);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[Notifications] Mark-read error: ${err}`);
    return c.json({ error: `Mark-read failed: ${err}` }, 500);
  }
});

/**
 * POST /notifications/archive
 * Body: { ids: string[] } or { all: true }
 */
app.post(`${PREFIX}/notifications/archive`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) {
      return c.json({ error: "Authorization required" }, 401);
    }

    const body = await c.req.json();
    const kvKey = `notifications:${user.id}`;
    const all: any[] = (await kv.get(kvKey)) || [];

    let updated: any[];
    if (body.all) {
      updated = all.map((n: any) => ({ ...n, archived: true }));
    } else if (body.ids && Array.isArray(body.ids)) {
      const idSet = new Set(body.ids);
      updated = all.map((n: any) => idSet.has(n.id) ? { ...n, archived: true } : n);
    } else {
      return c.json({ error: "Provide { ids: [...] } or { all: true }" }, 400);
    }

    await kv.set(kvKey, updated);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[Notifications] Archive error: ${err}`);
    return c.json({ error: `Archive failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   GEMINI AI SERVICE (Phase 12-5)
   ═══════════════════════════════════════════════════════════ */

const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];
const GEMINI_MODEL = GEMINI_MODELS[0];

function geminiUrl(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/** Parse retry delay from 429 response body */
function parseRetryDelay(body: string): number {
  try {
    const parsed = JSON.parse(body);
    const details = parsed?.error?.details;
    if (Array.isArray(details)) {
      for (const d of details) {
        if (d?.retryDelay) {
          const seconds = parseFloat(d.retryDelay);
          if (!isNaN(seconds)) return Math.ceil(seconds);
        }
      }
    }
  } catch { /* ignore */ }
  return 0;
}

/** Sleep helper */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Call Gemini API with JSON response mode, model fallback chain, and 429 retry */
async function callGemini(
  prompt: string,
  systemInstruction?: string,
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; error?: string }> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.log("[AI] GEMINI_API_KEY not configured");
    return { text: "", error: "Gemini API key not configured on server" };
  }

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
      responseMimeType: "application/json",
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  for (const model of GEMINI_MODELS) {
    const url = `${geminiUrl(model)}?key=${apiKey}`;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (model !== GEMINI_MODELS[0]) {
            console.log(`[AI] Succeeded with fallback model: ${model}`);
          }
          return { text };
        }

        if (response.status === 429) {
          const errBody = await response.text();
          const retryDelay = parseRetryDelay(errBody);

          if (retryDelay > 0 && retryDelay <= 30 && attempt < MAX_RETRIES) {
            console.log(`[AI] Rate limited on ${model}, retrying in ${retryDelay}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await sleep(retryDelay * 1000);
            continue;
          }

          console.log(`[AI] Rate limited on ${model}, trying next model...`);
          break;
        }

        const errBody = await response.text();
        console.log(`[AI] Gemini API error ${response.status} on ${model}: ${errBody}`);
        return { text: "", error: `Gemini API error ${response.status}: ${errBody}` };
      } catch (err) {
        console.log(`[AI] Gemini call failed on ${model}: ${err}`);
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }

  return { text: "", error: "All Gemini models rate-limited. Please wait a moment and try again." };
}

/** Call Gemini with freeform text response, model fallback chain, and 429 retry */
async function callGeminiText(
  prompt: string,
  systemInstruction?: string,
  temperature = 0.7,
  maxTokens = 2048
): Promise<{ text: string; error?: string }> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return { text: "", error: "Gemini API key not configured on server" };
  }

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  for (const model of GEMINI_MODELS) {
    const url = `${geminiUrl(model)}?key=${apiKey}`;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (model !== GEMINI_MODELS[0]) {
            console.log(`[AI] Text call succeeded with fallback model: ${model}`);
          }
          return { text };
        }

        if (response.status === 429) {
          const errBody = await response.text();
          const retryDelay = parseRetryDelay(errBody);

          if (retryDelay > 0 && retryDelay <= 30 && attempt < MAX_RETRIES) {
            console.log(`[AI] Text rate limited on ${model}, retrying in ${retryDelay}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
            await sleep(retryDelay * 1000);
            continue;
          }

          console.log(`[AI] Text rate limited on ${model}, trying next model...`);
          break;
        }

        const errBody = await response.text();
        return { text: "", error: `Gemini API error ${response.status}: ${errBody}` };
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * (attempt + 1));
          continue;
        }
        break;
      }
    }
  }

  return { text: "", error: "All Gemini models rate-limited. Please wait a moment and try again." };
}

/** GET /ai/status — Check if Gemini API key is configured */
app.get(`${PREFIX}/ai/status`, async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Authorization required" }, 401);
  const hasKey = !!Deno.env.get("GEMINI_API_KEY");
  return c.json({ configured: hasKey, model: GEMINI_MODEL });
});

/** POST /ai/generate-tasks */
app.post(`${PREFIX}/ai/generate-tasks`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { projectName, projectDescription, existingTasks, count } = await c.req.json();
    if (!projectName) return c.json({ error: "projectName is required" }, 400);

    const existingList = existingTasks?.length
      ? `\n\nExisting tasks (avoid duplicating):\n${existingTasks.map((t: string) => `- ${t}`).join("\n")}`
      : "";

    const prompt = `Generate ${count || 5} actionable tasks for a project called "${projectName}".
${projectDescription ? `Project description: ${projectDescription}` : ""}${existingList}

Return a JSON object with a "tasks" array. Each task: { "title": string, "priority": "high"|"medium"|"low", "section": optional string }`;

    const result = await callGemini(prompt,
      "You are a project management assistant for a creative production studio. Generate practical, specific tasks. Tasks should be concise (under 80 chars) and actionable.",
      0.8, 1500);
    if (result.error) return c.json({ error: result.error }, 500);

    try {
      const parsed = JSON.parse(result.text);
      console.log(`[AI] Generated ${parsed.tasks?.length || 0} tasks for "${projectName}"`);
      return c.json(parsed);
    } catch {
      return c.json({ error: "Failed to parse AI response", raw: result.text }, 500);
    }
  } catch (err) {
    console.log(`[AI] generate-tasks error: ${err}`);
    return c.json({ error: `Task generation failed: ${err}` }, 500);
  }
});

/** POST /ai/suggest-subtasks */
app.post(`${PREFIX}/ai/suggest-subtasks`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { taskTitle, taskDescription, projectName, count } = await c.req.json();
    if (!taskTitle) return c.json({ error: "taskTitle is required" }, 400);

    const prompt = `Suggest ${count || 4} subtasks for: "${taskTitle}"
${taskDescription ? `Description: ${taskDescription}` : ""}
${projectName ? `Project: ${projectName}` : ""}

Return JSON: { "subtasks": [{ "title": string }] }`;

    const result = await callGemini(prompt,
      "You are a project management assistant. Break down tasks into specific, actionable subtasks under 60 characters.",
      0.7, 800);
    if (result.error) return c.json({ error: result.error }, 500);

    try {
      const parsed = JSON.parse(result.text);
      console.log(`[AI] Generated ${parsed.subtasks?.length || 0} subtasks for "${taskTitle}"`);
      return c.json(parsed);
    } catch {
      return c.json({ error: "Failed to parse AI response", raw: result.text }, 500);
    }
  } catch (err) {
    console.log(`[AI] suggest-subtasks error: ${err}`);
    return c.json({ error: `Subtask suggestion failed: ${err}` }, 500);
  }
});

/** POST /ai/summarize-project */
app.post(`${PREFIX}/ai/summarize-project`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { projectName, tasks, updates } = await c.req.json();
    if (!projectName) return c.json({ error: "projectName is required" }, 400);

    const taskList = tasks?.map((t: any) => `- [${t.completed ? "x" : " "}] ${t.title} (${t.status})`).join("\n") || "No tasks";
    const updateList = updates?.length ? `\n\nRecent updates:\n${updates.map((u: string) => `- ${u}`).join("\n")}` : "";

    const prompt = `Summarize the current state of project "${projectName}".

Tasks:\n${taskList}${updateList}

Return JSON: { "summary": string, "completionPercent": number, "risksOrBlockers": string[], "nextSteps": string[] }`;

    const result = await callGemini(prompt,
      "You are a project management analyst. Provide concise, actionable summaries. Be realistic about completion estimates.",
      0.5, 1200);
    if (result.error) return c.json({ error: result.error }, 500);

    try {
      const parsed = JSON.parse(result.text);
      console.log(`[AI] Generated summary for "${projectName}"`);
      return c.json(parsed);
    } catch {
      return c.json({ error: "Failed to parse AI response", raw: result.text }, 500);
    }
  } catch (err) {
    console.log(`[AI] summarize-project error: ${err}`);
    return c.json({ error: `Project summary failed: ${err}` }, 500);
  }
});

/** POST /ai/rewrite */
app.post(`${PREFIX}/ai/rewrite`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { text, style } = await c.req.json();
    if (!text) return c.json({ error: "text is required" }, 400);

    const styles: Record<string, string> = {
      concise: "Make it shorter and more direct.",
      professional: "Use professional business language.",
      friendly: "Make it warm and approachable.",
      detailed: "Expand with more detail and context.",
    };

    const prompt = `Rewrite the following text. ${styles[style || "concise"] || styles.concise}

Original: "${text}"

Return JSON: { "rewritten": string }`;

    const result = await callGemini(prompt, undefined, 0.6, 1000);
    if (result.error) return c.json({ error: result.error }, 500);

    try {
      return c.json(JSON.parse(result.text));
    } catch {
      return c.json({ error: "Failed to parse AI response", raw: result.text }, 500);
    }
  } catch (err) {
    console.log(`[AI] rewrite error: ${err}`);
    return c.json({ error: `Rewrite failed: ${err}` }, 500);
  }
});

/** POST /ai/chat */
app.post(`${PREFIX}/ai/chat`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { message, context } = await c.req.json();
    if (!message) return c.json({ error: "message is required" }, 400);

    const contextBlock = context ? `\n\nContext about the user's workspace:\n${context}` : "";
    const result = await callGeminiText(`${message}${contextBlock}`,
      "You are Canto AI, a helpful project management assistant for a creative production studio. Keep responses concise and actionable. Use markdown formatting.",
      0.7, 2048);
    if (result.error) return c.json({ error: result.error }, 500);

    return c.json({ reply: result.text });
  } catch (err) {
    console.log(`[AI] chat error: ${err}`);
    return c.json({ error: `Chat failed: ${err}` }, 500);
  }
});

/** POST /ai/generate-update */
app.post(`${PREFIX}/ai/generate-update`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { projectName, tasks, recentChanges } = await c.req.json();
    if (!projectName) return c.json({ error: "projectName is required" }, 400);

    const taskSummary = tasks?.map((t: any) => `- [${t.completed ? "done" : t.status}] ${t.title}`).join("\n") || "No tasks";
    const changesBlock = recentChanges?.length ? `\n\nRecent changes:\n${recentChanges.map((ch: string) => `- ${ch}`).join("\n")}` : "";

    const prompt = `Write a brief project status update for "${projectName}".

Current tasks:\n${taskSummary}${changesBlock}

Return JSON: { "title": string, "content": string, "sections": [{ "label": string, "content": string }] }`;

    const result = await callGemini(prompt,
      "You are a project manager writing status updates. Be factual, concise, focus on progress and next steps.",
      0.6, 1500);
    if (result.error) return c.json({ error: result.error }, 500);

    try {
      const parsed = JSON.parse(result.text);
      console.log(`[AI] Generated update for "${projectName}"`);
      return c.json(parsed);
    } catch {
      return c.json({ error: "Failed to parse AI response", raw: result.text }, 500);
    }
  } catch (err) {
    console.log(`[AI] generate-update error: ${err}`);
    return c.json({ error: `Update generation failed: ${err}` }, 500);
  }
});

/** POST /ai/doc — Doc-specific AI operations (D11) */
app.post(`${PREFIX}/ai/doc`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { action, prompt, context, selectedText } = await c.req.json();
    if (!action) return c.json({ error: "action is required" }, 400);

    const ACTIONS: Record<string, { system: string; buildPrompt: (p: string, ctx: string, sel: string) => string }> = {
      write: {
        system: "You are a skilled writer. Generate well-structured content based on the user's prompt. Return JSON with an array of blocks.",
        buildPrompt: (p, ctx) => `Write content for a document based on this prompt: "${p}"${ctx ? `\n\nExisting document context:\n${ctx}` : ""}\n\nReturn JSON: { "blocks": [{ "type": "paragraph" | "heading" | "bulleted-list" | "numbered-list" | "quote" | "callout", "content": string, "level": number | undefined }] }\n\nUse appropriate block types. Headings use level 1-3. Keep content rich but concise.`,
      },
      summarize: {
        system: "You are an expert summarizer. Create concise, well-structured summaries.",
        buildPrompt: (_p, ctx) => `Summarize the following document content:\n\n${ctx}\n\nReturn JSON: { "blocks": [{ "type": "paragraph" | "heading" | "bulleted-list", "content": string, "level": number | undefined }] }\n\nProvide a brief heading then key points as a bulleted list.`,
      },
      brainstorm: {
        system: "You are a creative brainstorming partner. Generate diverse, actionable ideas.",
        buildPrompt: (p, ctx) => `Brainstorm ideas about: "${p}"${ctx ? `\n\nDocument context:\n${ctx}` : ""}\n\nReturn JSON: { "blocks": [{ "type": "paragraph" | "heading" | "bulleted-list" | "callout", "content": string, "level": number | undefined, "calloutColor": string | undefined, "calloutIcon": string | undefined }] }\n\nGenerate 5-8 creative ideas. Use a heading, then bullet points. Highlight the best idea in a callout block.`,
      },
      outline: {
        system: "You are an expert document architect. Create well-structured outlines.",
        buildPrompt: (p, ctx) => `Create a detailed document outline for: "${p}"${ctx ? `\n\nExisting content:\n${ctx}` : ""}\n\nReturn JSON: { "blocks": [{ "type": "heading" | "paragraph" | "bulleted-list" | "numbered-list", "content": string, "level": number | undefined }] }\n\nUse H1 (level 1) for main sections, H2 (level 2) for subsections, and bullet points for key topics under each.`,
      },
      continue: {
        system: "You are a skilled writer. Continue writing naturally from where the document left off.",
        buildPrompt: (_p, ctx) => `Continue writing this document naturally:\n\n${ctx}\n\nReturn JSON: { "blocks": [{ "type": "paragraph" | "heading" | "bulleted-list" | "numbered-list" | "quote", "content": string, "level": number | undefined }] }\n\nWrite 2-4 paragraphs that flow naturally from the existing content. Match the tone and style.`,
      },
      edit: {
        system: "You are an expert editor. Improve text while preserving the author's voice and intent.",
        buildPrompt: (p, _ctx, sel) => `Edit/revise the following text based on this instruction: "${p}"\n\nOriginal text: "${sel}"\n\nReturn JSON: { "blocks": [{ "type": "paragraph" | "heading" | "bulleted-list", "content": string, "level": number | undefined }] }\n\nReturn the improved version as blocks.`,
      },
    };

    const actionConfig = ACTIONS[action];
    if (!actionConfig) return c.json({ error: `Unknown action: ${action}` }, 400);

    const aiPrompt = actionConfig.buildPrompt(prompt || "", context || "", selectedText || "");
    const result = await callGemini(aiPrompt, actionConfig.system, 0.7, 3000);
    if (result.error) return c.json({ error: result.error }, 500);

    try {
      const parsed = JSON.parse(result.text);
      console.log(`[AI] Doc action "${action}" completed, ${parsed.blocks?.length || 0} blocks generated`);
      return c.json(parsed);
    } catch {
      return c.json({ error: "Failed to parse AI response", raw: result.text }, 500);
    }
  } catch (err) {
    console.log(`[AI] doc action error: ${err}`);
    return c.json({ error: `Doc AI failed: ${err}` }, 500);
  }
});

/** POST /ai/doc-chat — Doc-aware chat with document context (D11-4) */
app.post(`${PREFIX}/ai/doc-chat`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { message, docTitle, docContent, history } = await c.req.json();
    if (!message) return c.json({ error: "message is required" }, 400);

    const docCtx = docTitle ? `\n\nThe user is currently editing a document titled "${docTitle}".\nDocument content:\n${docContent || "(empty)"}` : "";
    const historyBlock = history?.length
      ? `\n\nConversation history:\n${history.map((h: any) => `${h.role}: ${h.content}`).join("\n")}`
      : "";

    const result = await callGeminiText(
      `${message}${docCtx}${historyBlock}`,
      "You are Canto AI, a helpful writing assistant embedded in a document editor. Help the user with their document — suggest improvements, answer questions about their content, help brainstorm ideas, and provide writing assistance. Keep responses concise and actionable. Use markdown formatting. When suggesting content to add to the document, be specific.",
      0.7,
      2048
    );
    if (result.error) return c.json({ error: result.error }, 500);

    return c.json({ reply: result.text });
  } catch (err) {
    console.log(`[AI] doc-chat error: ${err}`);
    return c.json({ error: `Doc chat failed: ${err}` }, 500);
  }
});

/** POST /ai/presentation — Generate presentation slides from document content (D11-5) */
app.post(`${PREFIX}/ai/presentation`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { title, content } = await c.req.json();
    if (!content) return c.json({ error: "content is required" }, 400);

    const prompt = `Create a professional presentation from this document.

Document title: "${title || "Untitled"}"
Document content:
${content}

Return JSON with an array of slides. Each slide has:
- title: string (slide heading)
- bullets: string[] (3-5 key bullet points)
- notes: string (speaker notes paragraph)
- layout: "title" | "content" | "bullets" | "quote" | "closing"

Create 5-10 slides total. The first slide should be layout "title" with just the presentation title. The last slide should be layout "closing" with a summary or call to action. Other slides should use "content" or "bullets" layout. If there's a notable quote in the content, use "quote" layout for one slide.

Return: { "slides": [...] }`;

    const result = await callGemini(
      prompt,
      "You are a presentation design expert. Create clear, impactful slide decks from document content. Each slide should have a focused message. Keep bullet points concise (8-12 words each). Speaker notes should expand on the bullets with 2-3 sentences.",
      0.7,
      4000
    );
    if (result.error) return c.json({ error: result.error }, 500);

    try {
      const parsed = JSON.parse(result.text);
      console.log(`[AI] Presentation generated: ${parsed.slides?.length || 0} slides`);
      return c.json(parsed);
    } catch {
      return c.json({ error: "Failed to parse AI response", raw: result.text }, 500);
    }
  } catch (err) {
    console.log(`[AI] presentation error: ${err}`);
    return c.json({ error: `Presentation generation failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   PUBLISHING SYSTEM (Phase 7 P7-3)
   Publish docs/projects with unique slugs for public viewing.
   KV keys: published:<slug> → { type, data, publishedAt, publishedBy }
   ═══════════════════════════════════════════════════════════ */

/** Generate a URL-friendly slug from title */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "untitled"}-${suffix}`;
}

/**
 * POST /publish/doc
 * Body: { docId, title, blocks, type, meetingDate?, attendees? }
 * Publishes a document with a unique slug. Returns the slug.
 */
app.post(`${PREFIX}/publish/doc`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required to publish documents" }, 401);

    const { docId, title, blocks, type, meetingDate, attendees, slug: existingSlug } = await c.req.json();
    if (!docId || !title) return c.json({ error: "docId and title are required" }, 400);

    const slug = existingSlug || generateSlug(title);
    const kvKey = `published:${slug}`;

    const publishedDoc = {
      type: "doc",
      docId,
      title,
      blocks: blocks || [],
      docType: type || "doc",
      meetingDate,
      attendees,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedBy: user.id,
      publisherEmail: user.email,
    };

    await kv.set(kvKey, publishedDoc);

    // Also store a lookup from docId to slug
    await kv.set(`publish-slug:${docId}`, slug);

    console.log(`[Publish] Doc "${title}" published at slug: ${slug} by user ${user.id}`);
    return c.json({ success: true, slug });
  } catch (err) {
    console.log(`[Publish] Doc publish error: ${err}`);
    return c.json({ error: `Publish failed: ${err}` }, 500);
  }
});

/**
 * POST /publish/project
 * Body: { projectName, projectData }
 * Publishes a project overview with a unique slug.
 */
app.post(`${PREFIX}/publish/project`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required to publish projects" }, 401);

    const { projectName, projectData, slug: existingSlug } = await c.req.json();
    if (!projectName) return c.json({ error: "projectName is required" }, 400);

    const slug = existingSlug || generateSlug(projectName);
    const kvKey = `published:${slug}`;

    // Strip sensitive data from project for public view
    const safeProject = {
      name: projectData?.name || projectName,
      description: projectData?.description || "",
      status: projectData?.status || "on-track",
      bannerImage: projectData?.bannerImage || "",
      color: projectData?.color || "",
      icon: projectData?.icon || "",
      productionPhase: projectData?.productionPhase || "",
      projectType: projectData?.projectType || "",
      tasks: (projectData?.tasks || []).map((t: any) => ({
        title: t.title,
        status: t.status,
        completed: t.completed,
        date: t.date,
        section: t.section,
        priority: t.priority,
      })),
      updates: projectData?.updates || [],
      timelineDates: projectData?.timelineDates || [],
    };

    const publishedProject = {
      type: "project",
      projectName,
      data: safeProject,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedBy: user.id,
    };

    await kv.set(kvKey, publishedProject);
    await kv.set(`publish-slug:project:${projectName}`, slug);

    console.log(`[Publish] Project "${projectName}" published at slug: ${slug} by user ${user.id}`);
    return c.json({ success: true, slug });
  } catch (err) {
    console.log(`[Publish] Project publish error: ${err}`);
    return c.json({ error: `Publish project failed: ${err}` }, 500);
  }
});

/**
 * POST /unpublish
 * Body: { slug } or { docId } or { projectName }
 * Removes a published item.
 */
app.post(`${PREFIX}/unpublish`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required to unpublish" }, 401);

    const { slug, docId, projectName } = await c.req.json();
    let targetSlug = slug;

    // Look up slug from docId or projectName if slug not provided
    if (!targetSlug && docId) {
      targetSlug = await kv.get(`publish-slug:${docId}`);
    }
    if (!targetSlug && projectName) {
      targetSlug = await kv.get(`publish-slug:project:${projectName}`);
    }

    if (!targetSlug) {
      return c.json({ error: "No published item found for the given identifier" }, 404);
    }

    // Delete the published content and the slug lookup
    const keysToDelete = [`published:${targetSlug}`];
    if (docId) keysToDelete.push(`publish-slug:${docId}`);
    if (projectName) keysToDelete.push(`publish-slug:project:${projectName}`);

    await kv.mdel(keysToDelete);

    console.log(`[Publish] Unpublished slug: ${targetSlug} by user ${user.id}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[Publish] Unpublish error: ${err}`);
    return c.json({ error: `Unpublish failed: ${err}` }, 500);
  }
});

/**
 * GET /published/:slug
 * Public endpoint — no auth required.
 * Returns the published content for rendering.
 */
app.get(`${PREFIX}/published/:slug`, async (c) => {
  try {
    const slug = c.req.param("slug");
    if (!slug) return c.json({ error: "Slug is required" }, 400);

    const data = await kv.get(`published:${slug}`);
    if (!data) {
      return c.json({ error: "Published content not found" }, 404);
    }

    return c.json(data);
  } catch (err) {
    console.log(`[Publish] Public read error: ${err}`);
    return c.json({ error: `Failed to load published content: ${err}` }, 500);
  }
});

/**
 * GET /publish-slug/:docId
 * Check if a doc is published, return its slug.
 */
app.get(`${PREFIX}/publish-slug/:docId`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const docId = c.req.param("docId");
    const slug = await kv.get(`publish-slug:${docId}`);
    return c.json({ slug: slug || null });
  } catch (err) {
    console.log(`[Publish] Slug lookup error: ${err}`);
    return c.json({ error: `Slug lookup failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   PUSH NOTIFICATION SUBSCRIPTIONS (Phase 9 P9-4)
   Store push subscriptions per user for Web Push API.
   KV keys: push-sub:<userId> → PushSubscription JSON[]
   ═══════════════════════════════════════════════════════════ */

/**
 * POST /push/subscribe
 * Body: { subscription: PushSubscriptionJSON }
 * Stores a push subscription for the authenticated user.
 */
app.post(`${PREFIX}/push/subscribe`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required for push subscription" }, 401);

    const { subscription } = await c.req.json();
    if (!subscription || !subscription.endpoint) {
      return c.json({ error: "Valid push subscription is required" }, 400);
    }

    const kvKey = `push-sub:${user.id}`;
    const existing: any[] = (await kv.get(kvKey)) || [];

    // Prevent duplicates (same endpoint)
    const alreadyExists = existing.some((s: any) => s.endpoint === subscription.endpoint);
    if (!alreadyExists) {
      existing.push({
        ...subscription,
        subscribedAt: new Date().toISOString(),
        userAgent: c.req.header("User-Agent") || "",
      });
      await kv.set(kvKey, existing);
      console.log(`[Push] Subscription added for user ${user.id} (total: ${existing.length})`);
    } else {
      console.log(`[Push] Subscription already exists for user ${user.id}`);
    }

    return c.json({ success: true, totalSubscriptions: existing.length });
  } catch (err) {
    console.log(`[Push] Subscribe error: ${err}`);
    return c.json({ error: `Push subscription failed: ${err}` }, 500);
  }
});

/**
 * POST /push/unsubscribe
 * Body: { endpoint: string }
 * Removes a push subscription.
 */
app.post(`${PREFIX}/push/unsubscribe`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const { endpoint } = await c.req.json();
    if (!endpoint) return c.json({ error: "endpoint is required" }, 400);

    const kvKey = `push-sub:${user.id}`;
    const existing: any[] = (await kv.get(kvKey)) || [];
    const filtered = existing.filter((s: any) => s.endpoint !== endpoint);
    await kv.set(kvKey, filtered);

    console.log(`[Push] Subscription removed for user ${user.id} (remaining: ${filtered.length})`);
    return c.json({ success: true, remainingSubscriptions: filtered.length });
  } catch (err) {
    console.log(`[Push] Unsubscribe error: ${err}`);
    return c.json({ error: `Push unsubscribe failed: ${err}` }, 500);
  }
});

/**
 * GET /push/status
 * Returns the push subscription status for the authenticated user.
 */
app.get(`${PREFIX}/push/status`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const kvKey = `push-sub:${user.id}`;
    const existing: any[] = (await kv.get(kvKey)) || [];

    return c.json({
      subscribed: existing.length > 0,
      subscriptionCount: existing.length,
      subscriptions: existing.map((s: any) => ({
        endpoint: s.endpoint?.slice(0, 50) + "...",
        subscribedAt: s.subscribedAt,
      })),
    });
  } catch (err) {
    console.log(`[Push] Status error: ${err}`);
    return c.json({ error: `Push status failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   VAPID KEY MANAGEMENT — Generate and store VAPID keys for
   Web Push API. Keys are generated once and cached in KV.
   ═══════════════════════════════════════════════════════════ */

const VAPID_KV_KEY = "flowos:vapid-keys";

/**
 * Generate VAPID key pair using Web Crypto API (P-256 / ECDSA).
 * Returns { publicKey, privateKey } as base64url-encoded strings.
 */
async function generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  // Export public key as raw (uncompressed point, 65 bytes)
  const publicRaw = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKey = arrayBufferToBase64Url(publicRaw);

  // Export private key as PKCS8
  const privateRaw = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const privateKey = arrayBufferToBase64Url(privateRaw);

  return { publicKey, privateKey };
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Get or generate VAPID keys (cached in KV store).
 */
async function getOrCreateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  try {
    const existing = await kv.get(VAPID_KV_KEY);
    if (existing && typeof existing === "object" && (existing as any).publicKey && (existing as any).privateKey) {
      return existing as { publicKey: string; privateKey: string };
    }
  } catch {
    // Continue to generation
  }

  console.log("[VAPID] Generating new VAPID key pair...");
  const keys = await generateVapidKeys();
  await kv.set(VAPID_KV_KEY, keys);
  console.log("[VAPID] Keys generated and stored in KV");
  return keys;
}

/**
 * GET /push/vapid-public-key
 * Public endpoint — returns the VAPID public key for client-side subscription.
 * No auth required so the client can subscribe before full auth flow.
 */
app.get(`${PREFIX}/push/vapid-public-key`, async (c) => {
  try {
    const keys = await getOrCreateVapidKeys();
    return c.json({ publicKey: keys.publicKey });
  } catch (err) {
    console.log(`[VAPID] Error getting public key: ${err}`);
    return c.json({ error: `Failed to get VAPID public key: ${err}` }, 500);
  }
});

/**
 * POST /push/send
 * Send a push notification to a specific user.
 * Body: { userId?: string, title: string, body: string, url?: string, tag?: string }
 * Auth required.
 */
app.post(`${PREFIX}/push/send`, async (c) => {
  try {
    const sender = await getAuthUser(c);
    if (!sender) return c.json({ error: "Authorization required to send push" }, 401);

    const { userId, title, body: msgBody, url, tag } = await c.req.json();
    const targetUserId = userId || sender.id;

    // Get target user's push subscriptions
    const subs: any[] = (await kv.get(`push-sub:${targetUserId}`)) || [];
    if (subs.length === 0) {
      return c.json({ sent: 0, message: "No push subscriptions found for user" });
    }

    // Get VAPID keys
    const vapidKeys = await getOrCreateVapidKeys();
    const contactEmail = `mailto:push@flowos.app`;

    const payload = JSON.stringify({
      title: title || "Canto",
      body: msgBody || "You have a new notification",
      url: url || "/",
      tag: tag || "flowos-push",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
    });

    let sent = 0;
    let failed = 0;
    const failedEndpoints: string[] = [];

    for (const sub of subs) {
      if (!sub.endpoint || sub.type === "notification-api") continue;

      try {
        // Import private key for signing
        const privateKeyBytes = base64UrlToArrayBuffer(vapidKeys.privateKey);
        const privKey = await crypto.subtle.importKey(
          "pkcs8",
          privateKeyBytes,
          { name: "ECDSA", namedCurve: "P-256" },
          false,
          ["sign"]
        );

        // Create JWT for VAPID
        const jwt = await createVapidJwt(sub.endpoint, contactEmail, privKey);

        // Send push message via Web Push protocol
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "Authorization": `vapid t=${jwt}, k=${vapidKeys.publicKey}`,
            "TTL": "86400",
            "Urgency": "normal",
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          sent++;
        } else if (response.status === 404 || response.status === 410) {
          failedEndpoints.push(sub.endpoint);
          failed++;
        } else {
          console.log(`[Push] Send failed (${response.status}): ${await response.text()}`);
          failed++;
        }
      } catch (err) {
        console.log(`[Push] Send error for ${sub.endpoint?.slice(0, 40)}: ${err}`);
        failed++;
      }
    }

    // Clean up expired subscriptions
    if (failedEndpoints.length > 0) {
      const remaining = subs.filter((s: any) => !failedEndpoints.includes(s.endpoint));
      await kv.set(`push-sub:${targetUserId}`, remaining);
      console.log(`[Push] Cleaned ${failedEndpoints.length} expired subscriptions`);
    }

    return c.json({ sent, failed, total: subs.length });
  } catch (err) {
    console.log(`[Push] Send error: ${err}`);
    return c.json({ error: `Push send failed: ${err}` }, 500);
  }
});

/**
 * Create a VAPID JWT for the given push endpoint.
 */
async function createVapidJwt(
  endpoint: string,
  contactEmail: string,
  privateKey: CryptoKey
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: "JWT", alg: "ES256" };
  const jwtPayload = { aud: audience, exp: expiration, sub: contactEmail };

  const encodedHeader = btoa(JSON.stringify(header))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const encodedPayload = btoa(JSON.stringify(jwtPayload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const sigData = new TextEncoder().encode(signingInput);

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    sigData
  );

  const rawSig = derToRaw(new Uint8Array(signature));
  const encodedSig = arrayBufferToBase64Url(rawSig.buffer);

  return `${signingInput}.${encodedSig}`;
}

/** Convert DER-encoded ECDSA signature to raw r||s format (64 bytes). */
function derToRaw(der: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  let offset = 2;
  if (der[1] > 127) offset++;

  offset++; // skip 0x02
  const rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen < 32 ? 32 - rLen : 0;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  offset++; // skip 0x02
  const sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen < 32 ? 64 - sLen : 32;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

/* ═══════════════════════════════════════════════════════════
   EMAIL INVITATIONS (via Resend API)
   KV keys: invite:<email> → { email, role, message, invitedBy, ... }
   ═══════════════════════════════════════════════════════════ */

/**
 * POST /invite/send
 * Body: { email, role?, message?, inviterName? }
 * Sends an email invitation via Resend and stores the pending invite in KV.
 */
app.post(`${PREFIX}/invite/send`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required to send invitations" }, 401);

    const { email, role, message: inviteMessage, inviterName } = await c.req.json();
    if (!email) return c.json({ error: "Email is required" }, 400);

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already a team member
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const teamResult = await supabase
      .from("kv_store_a038f2e0")
      .select("key, value")
      .like("key", "team-member:%");

    const existingMember = teamResult.data?.find(
      (row: any) => row.value?.email?.toLowerCase().trim() === normalizedEmail && !row.value?.isPlaceholder
    );
    if (existingMember) {
      return c.json({ error: "This person is already a team member" }, 409);
    }

    // Store invite in KV
    const invite = {
      email: normalizedEmail,
      role: role || "",
      message: inviteMessage || "",
      invitedBy: user.id,
      inviterEmail: user.email,
      inviterName: inviterName || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    await kv.set(`invite:${normalizedEmail}`, invite);

    // Send email via Resend API
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("[Invite] RESEND_API_KEY not configured — invite stored but email not sent");
      return c.json({
        success: true,
        emailSent: false,
        message: "Invitation saved but email not sent (Resend API key not configured)",
      });
    }

    const fromName = inviterName || "Canto";
    const subject = `${fromName} invited you to join their team on Canto`;
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0;">Canto</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 32px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">
            You've been invited!
          </h2>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 16px;">
            <strong>${fromName}</strong> has invited you to join their team on Canto
            ${role ? ` as <strong>${role}</strong>` : ""}.
          </p>
          ${inviteMessage ? `
            <div style="background: #f7f7f7; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
              <p style="font-size: 14px; color: #666; margin: 0; font-style: italic;">"${inviteMessage}"</p>
            </div>
          ` : ""}
          <div style="text-align: center; margin: 24px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".vercel.app") || "https://flowos.app"}"
               style="display: inline-block; background: #6159E1; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 13px; color: #999; margin: 24px 0 0; text-align: center;">
            Create an account with <strong>${normalizedEmail}</strong> to join the team.
          </p>
        </div>
        <p style="font-size: 12px; color: #bbb; text-align: center; margin-top: 24px;">
          Sent via Canto — Project management for creative teams
        </p>
      </div>
    `;

    try {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: "Canto <onboarding@resend.dev>",
          to: [normalizedEmail],
          subject,
          html: htmlBody,
        }),
      });

      if (!resendResponse.ok) {
        const errBody = await resendResponse.text();
        console.log(`[Invite] Resend API error ${resendResponse.status}: ${errBody}`);
        return c.json({
          success: true,
          emailSent: false,
          message: `Invitation saved but email failed: ${errBody}`,
        });
      }

      const resendData = await resendResponse.json();
      console.log(`[Invite] Email sent to ${normalizedEmail}, Resend ID: ${resendData.id}`);

      // Update invite with email metadata
      await kv.set(`invite:${normalizedEmail}`, {
        ...invite,
        emailSent: true,
        resendId: resendData.id,
        sentAt: new Date().toISOString(),
      });

      return c.json({ success: true, emailSent: true, resendId: resendData.id });
    } catch (emailErr) {
      console.log(`[Invite] Email send error: ${emailErr}`);
      return c.json({
        success: true,
        emailSent: false,
        message: `Invitation saved but email failed: ${emailErr}`,
      });
    }
  } catch (err) {
    console.log(`[Invite] Send error: ${err}`);
    return c.json({ error: `Invitation failed: ${err}` }, 500);
  }
});

/**
 * GET /invite/pending
 * Returns all pending invitations sent by the current user.
 */
app.get(`${PREFIX}/invite/pending`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data } = await supabase
      .from("kv_store_a038f2e0")
      .select("key, value")
      .like("key", "invite:%");

    const invites = (data || [])
      .map((row: any) => row.value)
      .filter((inv: any) => inv && inv.invitedBy === user.id);

    return c.json({ invites });
  } catch (err) {
    console.log(`[Invite] Pending list error: ${err}`);
    return c.json({ error: `Failed to list invitations: ${err}` }, 500);
  }
});

/**
 * DELETE /invite/:email
 * Revokes a pending invitation.
 */
app.delete(`${PREFIX}/invite/:email`, async (c) => {
  try {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "Authorization required" }, 401);

    const email = decodeURIComponent(c.req.param("email")).toLowerCase().trim();
    const existing = await kv.get(`invite:${email}`);
    if (!existing) return c.json({ error: "Invitation not found" }, 404);

    await kv.del(`invite:${email}`);
    console.log(`[Invite] Revoked invitation for ${email} by user ${user.id}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[Invite] Revoke error: ${err}`);
    return c.json({ error: `Revoke invitation failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   CATCH-ALL 404
   ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
   UNSPLASH SEARCH
   ═══════════════════════════════════════════════════════════ */

app.get(`${PREFIX}/unsplash/search`, async (c) => {
  try {
    const query = c.req.query("query");
    const page = c.req.query("page") || "1";
    const perPage = c.req.query("per_page") || "12";

    if (!query) {
      return c.json({ error: "Missing 'query' parameter for Unsplash search" }, 400);
    }

    const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!accessKey) {
      console.log("[Unsplash] UNSPLASH_ACCESS_KEY not configured");
      return c.json({ error: "Unsplash API key not configured" }, 500);
    }

    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape`;
    const resp = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.log(`[Unsplash] API error ${resp.status}: ${errText}`);
      return c.json({ error: `Unsplash API error: ${resp.status}` }, resp.status);
    }

    const data = await resp.json();
    const results = (data.results || []).map((photo: any) => ({
      id: photo.id,
      url: photo.urls?.regular || photo.urls?.full,
      thumb: photo.urls?.small || photo.urls?.thumb,
      photographer: photo.user?.name || "Unknown",
      profileUrl: photo.user?.links?.html || "",
    }));

    return c.json({ results, total: data.total || 0, totalPages: data.total_pages || 0 });
  } catch (err) {
    console.log(`[Unsplash] Search error: ${err}`);
    return c.json({ error: `Unsplash search failed: ${err}` }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════
   UNSPLASH CURATED — browse popular / topic photos
   ═══════════════════════════════════════════════════════════ */

app.get(`${PREFIX}/unsplash/curated`, async (c) => {
  try {
    const page = c.req.query("page") || "1";
    const perPage = c.req.query("per_page") || "30";
    const accessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!accessKey) {
      return c.json({ error: "Unsplash API key not configured" }, 500);
    }
    const topicSlug = c.req.query("topic") || "";
    const url = topicSlug
      ? `https://api.unsplash.com/topics/${topicSlug}/photos?page=${page}&per_page=${perPage}`
      : `https://api.unsplash.com/photos?page=${page}&per_page=${perPage}&order_by=popular`;
    const resp = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.log(`[Unsplash] Curated error: ${resp.status} ${text}`);
      return c.json({ error: `Unsplash API error: ${resp.status}` }, resp.status);
    }
    const data = await resp.json();
    const photos = (Array.isArray(data) ? data : data.results || []).map((p: any) => ({
      id: p.id,
      url: p.urls?.regular || p.urls?.small,
      thumb: p.urls?.thumb || p.urls?.small,
      alt: p.alt_description || p.description || "",
      author: p.user?.name || "",
      authorUrl: p.user?.links?.html || "",
      color: p.color,
    }));
    return c.json({ photos });
  } catch (err) {
    console.log(`[Unsplash] Curated error: ${err}`);
    return c.json({ error: `Unsplash curated failed: ${err}` }, 500);
  }
});

/* ─── Catch-all 404 ─── */
app.all("*", (c) => {
  console.log(`[404] Route not found: ${c.req.method} ${c.req.url}`);
  return c.json({ error: `Route not found: ${c.req.method} ${c.req.path}` }, 404);
});

Deno.serve(async (req: Request) => {
  try {
    return await app.fetch(req);
  } catch (err) {
    // Suppress "connection closed before message completed" — the client
    // disconnected before we finished writing the response.  This is
    // normal for preflight requests, aborted fetches, and browser
    // navigations; there is nothing actionable on the server side.
    const msg = String(err?.message ?? err).toLowerCase();
    if (
      msg.includes("connection closed before message completed") ||
      msg.includes("connection closed") ||
      msg.includes("http: connection error") ||
      msg.includes("broken pipe")
    ) {
      console.log(`[Server] Client disconnected early (suppressed): ${msg}`);
      return new Response(null, { status: 499 });
    }
    console.log(`[Server] Unexpected fetch-level error: ${err}`);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});