/* ═══════════════════════════════════════════════════════════
   ASANA DEEP IMPORT — Enhanced routes for Asana integration.
   PAT auth, workspace/project browser, deep import with
   pagination, comments, attachments, dependencies, custom fields,
   project preview, and batch import.
   ═══════════════════════════════════════════════════════════ */

import type { Hono } from "npm:hono@4.6.20";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

/* ─── KV Key Helper ─── */
const kvKey = {
  asanaToken: (userId: string) => `integration:asana:${userId}`,
};

/* ─── Auth Helper (with retry for transient network errors) ─── */
async function getAuthUser(c: any): Promise<{ id: string; email: string } | null> {
  const token = c.req.header("X-User-Token");
  if (!token) return null;
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data: { user }, error } = await supabase.auth.getUser(token);
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
        console.log(`[Asana] getAuthUser transient error (attempt ${attempt + 1}/${maxRetries}), retrying: ${err}`);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      if (isTransient) {
        throw new Error(`TransientAuthError: Auth service temporarily unavailable after ${maxRetries} retries`);
      }
      console.log(`[Asana] getAuthUser error: ${err}`);
      return null;
    }
  }
  return null;
}

const ASANA_BASE = "https://app.asana.com/api/1.0";

/* ─── Asana API Helpers ─── */

/** Single-page Asana fetch */
async function asanaFetch(userId: string, path: string): Promise<any> {
  const tokenData = (await kv.get(kvKey.asanaToken(userId))) as any;
  if (!tokenData?.token) throw new Error("Asana not connected");

  const res = await fetch(`${ASANA_BASE}${path}`, {
    headers: { Authorization: `Bearer ${tokenData.token}` },
  });

  if (!res.ok) {
    throw new Error(`Asana API error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.data;
}

/** Paginated Asana fetch — collects all pages */
async function asanaFetchAll(userId: string, basePath: string, limit = 100): Promise<any[]> {
  const tokenData = (await kv.get(kvKey.asanaToken(userId))) as any;
  if (!tokenData?.token) throw new Error("Asana not connected");

  const results: any[] = [];
  let offset: string | null = null;
  const separator = basePath.includes("?") ? "&" : "?";

  do {
    const url = offset
      ? `${ASANA_BASE}${basePath}${separator}limit=${limit}&offset=${offset}`
      : `${ASANA_BASE}${basePath}${separator}limit=${limit}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tokenData.token}` },
    });

    if (!res.ok) {
      throw new Error(`Asana API error ${res.status}: ${await res.text()}`);
    }

    const json = await res.json();
    results.push(...(json.data || []));
    offset = json.next_page?.offset || null;
  } while (offset);

  return results;
}

/* ─── Deep Import Core ─── */

interface DeepImportOptions {
  includeComments: boolean;
  includeAttachments: boolean;
  includeDependencies: boolean;
  includeCustomFields: boolean;
}

/** Deep import a single Asana project with all enrichments */
async function deepImportProject(
  userId: string,
  projectGid: string,
  options: DeepImportOptions
) {
  // Fetch project details
  const project = await asanaFetch(
    userId,
    `/projects/${projectGid}?opt_fields=name,notes,color,icon,created_at,modified_at,current_status_update.title,current_status_update.status_type,members.name,members.email`
  );

  // Fetch all sections (paginated)
  const sections = await asanaFetchAll(userId, `/projects/${projectGid}/sections?opt_fields=name`);

  // Build opt_fields for tasks based on import options
  const taskFields = [
    "name", "notes", "html_notes", "completed", "completed_at",
    "due_on", "due_at", "start_on", "start_at",
    "assignee.name", "assignee.email", "assignee.photo.image_60x60",
    "tags.name", "tags.color",
    "created_at", "modified_at", "num_subtasks",
    "permalink_url",
  ];
  if (options.includeCustomFields) {
    taskFields.push(
      "custom_fields.name", "custom_fields.display_value",
      "custom_fields.type", "custom_fields.enum_value.name",
      "custom_fields.number_value", "custom_fields.text_value"
    );
  }
  if (options.includeDependencies) {
    taskFields.push("dependencies.name", "dependents.name");
  }

  const allTasks: any[] = [];
  let statsComments = 0;
  let statsAttachments = 0;
  let statsDeps = 0;

  for (const section of sections || []) {
    // Paginated task fetch per section
    const sectionTasks = await asanaFetchAll(
      userId,
      `/sections/${section.gid}/tasks?opt_fields=${taskFields.join(",")}`
    );

    for (const task of sectionTasks || []) {
      // Fetch subtasks (paginated, only if any exist)
      let subtasks: any[] = [];
      try {
        if (task.num_subtasks > 0) {
          subtasks = await asanaFetchAll(
            userId,
            `/tasks/${task.gid}/subtasks?opt_fields=name,completed,due_on,assignee.name,notes`
          );
        }
      } catch { /* skip subtask fetch errors */ }

      // Fetch comments/stories
      let comments: any[] = [];
      if (options.includeComments) {
        try {
          const stories = await asanaFetchAll(
            userId,
            `/tasks/${task.gid}/stories?opt_fields=text,created_by.name,created_at,type,resource_subtype`
          );
          comments = (stories || [])
            .filter((s: any) => s.type === "comment" || s.resource_subtype === "comment_added")
            .map((s: any) => ({
              id: s.gid,
              text: s.text || "",
              authorName: s.created_by?.name || "Unknown",
              createdAt: s.created_at || "",
            }));
          statsComments += comments.length;
        } catch { /* skip */ }
      }

      // Fetch attachments (paginated)
      let attachments: any[] = [];
      if (options.includeAttachments) {
        try {
          const atts = await asanaFetchAll(
            userId,
            `/tasks/${task.gid}/attachments?opt_fields=name,download_url,host,view_url,permanent_url,size,created_at`
          );
          attachments = (atts || []).map((a: any) => ({
            id: a.gid,
            name: a.name || "Attachment",
            url: a.download_url || a.view_url || a.permanent_url || "",
            host: a.host || "asana",
            size: a.size || 0,
            createdAt: a.created_at || "",
          }));
          statsAttachments += attachments.length;
        } catch { /* skip */ }
      }

      // Count dependencies
      if (options.includeDependencies) {
        statsDeps += (task.dependencies?.length || 0) + (task.dependents?.length || 0);
      }

      allTasks.push({
        ...task,
        sectionName: section.name === "(no section)" ? undefined : section.name,
        subtasks,
        _comments: comments,
        _attachments: attachments,
      });
    }
  }

  // Map Asana status to Canto status
  const statusMap: Record<string, string> = {
    on_track: "on-track",
    at_risk: "at-risk",
    off_track: "off-track",
    on_hold: "on-hold",
    complete: "complete",
  };

  // Infer priority from Asana custom field if present
  function inferPriority(task: any): string {
    if (!options.includeCustomFields || !task.custom_fields) return "medium";
    const priorityField = task.custom_fields.find((cf: any) =>
      cf.name?.toLowerCase() === "priority" && cf.enum_value?.name
    );
    if (priorityField) {
      const val = priorityField.enum_value.name.toLowerCase();
      if (val.includes("urgent") || val.includes("critical")) return "urgent";
      if (val.includes("high")) return "high";
      if (val.includes("low")) return "low";
      if (val.includes("none")) return "none";
    }
    return "medium";
  }

  // Build Canto-compatible project data
  const flowosProject = {
    name: project.name,
    description: project.notes || "",
    status: statusMap[project.current_status_update?.status_type || ""] || "on-track",
    tasks: allTasks.map((t: any, idx: number) => {
      const taskData: any = {
        id: `asana-${t.gid}-${idx}`,
        title: t.name || "Untitled Task",
        date: t.due_on || "",
        startDate: t.start_on || "",
        assignee: t.assignee?.name || "",
        assigneeEmail: t.assignee?.email || "",
        assigneePhoto: t.assignee?.photo?.image_60x60 || "",
        completed: t.completed || false,
        status: t.completed ? "completed" : "todo",
        content: t.notes || "",
        htmlContent: t.html_notes || "",
        section: t.sectionName || "",
        priority: inferPriority(t),
        tags: (t.tags || []).map((tag: any) => tag.name),
        tagColors: (t.tags || []).reduce((acc: any, tag: any) => {
          if (tag.name && tag.color) acc[tag.name] = tag.color;
          return acc;
        }, {}),
        subtasks: (t.subtasks || []).map((st: any, stIdx: number) => ({
          id: `asana-st-${st.gid}-${stIdx}`,
          title: st.name || "Untitled Subtask",
          completed: st.completed || false,
          date: st.due_on || "",
          assignee: st.assignee?.name || "",
          content: st.notes || "",
        })),
        createdAt: t.created_at || new Date().toISOString(),
        updatedAt: t.modified_at || "",
        asanaGid: t.gid,
        permalinkUrl: t.permalink_url || "",
      };

      if (options.includeComments && t._comments?.length) {
        taskData.comments = t._comments;
      }
      if (options.includeAttachments && t._attachments?.length) {
        taskData.attachments = t._attachments;
      }
      if (options.includeDependencies) {
        if (t.dependencies?.length) {
          taskData.blockedBy = t.dependencies.map((d: any) => `asana-${d.gid}`);
          taskData.blockedByNames = t.dependencies.map((d: any) => d.name);
        }
        if (t.dependents?.length) {
          taskData.blocking = t.dependents.map((d: any) => `asana-${d.gid}`);
          taskData.blockingNames = t.dependents.map((d: any) => d.name);
        }
      }
      if (options.includeCustomFields && t.custom_fields?.length) {
        taskData.customFields = t.custom_fields
          .filter((cf: any) => cf.display_value)
          .map((cf: any) => ({
            name: cf.name,
            value: cf.display_value,
            type: cf.type,
          }));
      }

      return taskData;
    }),
    members: (project.members || []).map((m: any) => ({
      name: m.name || "",
      email: m.email || "",
    })),
    sections: (sections || [])
      .filter((s: any) => s.name !== "(no section)")
      .map((s: any) => s.name),
    importSource: "asana",
    importedAt: new Date().toISOString(),
    asanaProjectGid: projectGid,
    asanaColor: project.color || "",
    asanaIcon: project.icon?.name || "",
    stats: {
      tasks: allTasks.length,
      subtasks: allTasks.reduce((sum: number, t: any) => sum + (t.subtasks?.length || 0), 0),
      comments: statsComments,
      attachments: statsAttachments,
      dependencies: statsDeps,
      sections: (sections || []).filter((s: any) => s.name !== "(no section)").length,
      members: (project.members || []).length,
    },
  };

  return flowosProject;
}

/* ═══════════════════════════════════════════════════════════
   REGISTER ASANA ROUTES
   ═══════════════════════════════════════════════════════════ */

export function registerAsanaRoutes(app: Hono, PREFIX: string) {

  /** POST /integrations/asana/connect — Validate and store PAT */
  app.post(`${PREFIX}/integrations/asana/connect`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { token } = await c.req.json();
      if (!token) return c.json({ error: "Personal Access Token is required" }, 400);

      const res = await fetch(`${ASANA_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return c.json({ error: "Invalid or expired Asana Personal Access Token" }, 401);
        }
        return c.json({ error: `Asana API error: ${res.status}` }, res.status);
      }

      const { data: asanaUser } = await res.json();
      const tokenData = {
        token,
        userId: asanaUser.gid,
        userName: asanaUser.name || asanaUser.email || "",
        email: asanaUser.email || "",
        connectedAt: new Date().toISOString(),
      };

      await kv.set(kvKey.asanaToken(user.id), tokenData);
      console.log(`[Asana] Connected for user ${user.id} (${tokenData.userName})`);
      return c.json({ success: true, userName: tokenData.userName, email: tokenData.email });
    } catch (err) {
      console.log(`[Asana] Connect error: ${err}`);
      return c.json({ error: `Asana connect failed: ${err}` }, 500);
    }
  });

  /** GET /integrations/asana/workspaces */
  app.get(`${PREFIX}/integrations/asana/workspaces`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const data = await asanaFetch(user.id, "/workspaces?opt_fields=name,is_organization");
      return c.json({
        workspaces: (data || []).map((w: any) => ({
          gid: w.gid,
          name: w.name,
          isOrganization: w.is_organization || false,
        })),
      });
    } catch (err) {
      console.log(`[Asana] Workspaces error: ${err}`);
      return c.json({ error: `Asana workspaces failed: ${err}` }, 500);
    }
  });

  /** GET /integrations/asana/projects?workspaceGid=... */
  app.get(`${PREFIX}/integrations/asana/projects`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const workspaceGid = c.req.query("workspaceGid");
      if (!workspaceGid) return c.json({ error: "workspaceGid is required" }, 400);

      const data = await asanaFetchAll(
        user.id,
        `/workspaces/${workspaceGid}/projects?opt_fields=name,color,icon,archived,current_status_update.title,current_status_update.status_type`
      );

      return c.json({
        projects: (data || []).map((p: any) => ({
          gid: p.gid,
          name: p.name,
          color: p.color || "",
          icon: p.icon?.name || "",
          archived: p.archived || false,
          statusType: p.current_status_update?.status_type || "",
          statusTitle: p.current_status_update?.title || "",
        })),
      });
    } catch (err) {
      console.log(`[Asana] Projects error: ${err}`);
      return c.json({ error: `Asana projects failed: ${err}` }, 500);
    }
  });

  /** GET /integrations/asana/project-preview?projectGid=... — Preview before import */
  app.get(`${PREFIX}/integrations/asana/project-preview`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const projectGid = c.req.query("projectGid");
      if (!projectGid) return c.json({ error: "projectGid is required" }, 400);

      const [project, sections] = await Promise.all([
        asanaFetch(
          user.id,
          `/projects/${projectGid}?opt_fields=name,notes,color,icon,created_at,modified_at,current_status_update.title,current_status_update.status_type,members.name,members.email,custom_field_settings.custom_field.name,custom_field_settings.custom_field.type`
        ),
        asanaFetchAll(user.id, `/projects/${projectGid}/sections?opt_fields=name`),
      ]);

      const sectionPreviews = [];
      let totalTasks = 0;
      for (const section of sections || []) {
        const tasks = await asanaFetchAll(user.id, `/sections/${section.gid}/tasks?opt_fields=gid`);
        const count = tasks?.length || 0;
        totalTasks += count;
        sectionPreviews.push({
          gid: section.gid,
          name: section.name === "(no section)" ? "Untitled section" : section.name,
          taskCount: count,
        });
      }

      const customFields = (project.custom_field_settings || []).map((cfs: any) => ({
        name: cfs.custom_field?.name || "",
        type: cfs.custom_field?.type || "",
      }));

      return c.json({
        preview: {
          gid: projectGid,
          name: project.name,
          description: (project.notes || "").slice(0, 500),
          color: project.color || "",
          icon: project.icon?.name || "",
          createdAt: project.created_at || "",
          modifiedAt: project.modified_at || "",
          statusType: project.current_status_update?.status_type || "",
          statusTitle: project.current_status_update?.title || "",
          totalTasks,
          sections: sectionPreviews,
          members: (project.members || []).map((m: any) => ({
            name: m.name || "",
            email: m.email || "",
          })),
          customFields,
        },
      });
    } catch (err) {
      console.log(`[Asana] Project preview error: ${err}`);
      return c.json({ error: `Asana project preview failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/asana/import — Legacy single import (backward compat) */
  app.post(`${PREFIX}/integrations/asana/import`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { projectGid } = await c.req.json();
      if (!projectGid) return c.json({ error: "projectGid is required" }, 400);

      const result = await deepImportProject(user.id, projectGid, {
        includeComments: false,
        includeAttachments: false,
        includeDependencies: false,
        includeCustomFields: true,
      });

      console.log(
        `[Asana] Imported "${result.name}" with ${result.tasks.length} tasks for user ${user.id}`
      );
      return c.json({ project: result });
    } catch (err) {
      console.log(`[Asana] Import error: ${err}`);
      return c.json({ error: `Asana import failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/asana/deep-import — Enhanced import with options */
  app.post(`${PREFIX}/integrations/asana/deep-import`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { projectGid, options } = await c.req.json();
      if (!projectGid) return c.json({ error: "projectGid is required" }, 400);

      const importOptions: DeepImportOptions = {
        includeComments: options?.includeComments ?? true,
        includeAttachments: options?.includeAttachments ?? true,
        includeDependencies: options?.includeDependencies ?? true,
        includeCustomFields: options?.includeCustomFields ?? true,
      };

      const result = await deepImportProject(user.id, projectGid, importOptions);

      console.log(
        `[Asana] Deep imported "${result.name}" — ${result.tasks.length} tasks, ` +
        `${result.stats.comments} comments, ${result.stats.attachments} attachments, ` +
        `${result.stats.dependencies} deps for user ${user.id}`
      );
      return c.json({ project: result });
    } catch (err) {
      console.log(`[Asana] Deep import error: ${err}`);
      return c.json({ error: `Asana deep import failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/asana/batch-import — Import multiple projects */
  app.post(`${PREFIX}/integrations/asana/batch-import`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { projectGids, options } = await c.req.json();
      if (!projectGids || !Array.isArray(projectGids) || projectGids.length === 0) {
        return c.json({ error: "projectGids array is required" }, 400);
      }
      if (projectGids.length > 10) {
        return c.json({ error: "Maximum 10 projects per batch" }, 400);
      }

      const importOptions: DeepImportOptions = {
        includeComments: options?.includeComments ?? true,
        includeAttachments: options?.includeAttachments ?? true,
        includeDependencies: options?.includeDependencies ?? true,
        includeCustomFields: options?.includeCustomFields ?? true,
      };

      const results: any[] = [];
      const errors: { gid: string; error: string }[] = [];

      for (const gid of projectGids) {
        try {
          const result = await deepImportProject(user.id, gid, importOptions);
          results.push(result);
        } catch (err) {
          console.log(`[Asana] Batch import error for ${gid}: ${err}`);
          errors.push({ gid, error: `${err}` });
        }
      }

      console.log(
        `[Asana] Batch: ${results.length} ok, ${errors.length} failed for user ${user.id}`
      );
      return c.json({ projects: results, errors, total: projectGids.length });
    } catch (err) {
      console.log(`[Asana] Batch import error: ${err}`);
      return c.json({ error: `Asana batch import failed: ${err}` }, 500);
    }
  });
}