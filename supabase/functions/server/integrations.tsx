/* ═══════════════════════════════════════════════════════════
   INTEGRATIONS — Server routes for external service connections.
   Phase 12 of Canto build plan.
   
   P12-1: Google Calendar (OAuth2, calendar list, event CRUD)
   P12-2: Gmail (OAuth2, starred email fetch, email-to-task via Gemini)
   P12-3: Frame.io (developer token, teams/projects/assets/comments)
   P12-4: Asana Import (PAT, workspaces/projects/tasks)
   P12-6: Craft Import (file upload, block-type mapping)
   ═══════════════════════════════════════════════════════════ */

import type { Hono } from "npm:hono@4.6.20";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

/* ─── KV Key Helpers ─── */

const kvKey = {
  googleTokens: (userId: string) => `integration:google:${userId}`,
  googleCalendars: (userId: string) => `integration:google-cals:${userId}`,
  frameioToken: (userId: string) => `integration:frameio:${userId}`,
  asanaToken: (userId: string) => `integration:asana:${userId}`,
  craftToken: (userId: string) => `integration:craft:${userId}`,
  integrationStatus: (userId: string) => `integration:status:${userId}`,
};

/* ─── Auth Helper (same as index.tsx) ─── */

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
        console.log(`[Integrations] getAuthUser transient error (attempt ${attempt + 1}/${maxRetries}), retrying: ${err}`);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      if (isTransient) {
        throw new Error(`TransientAuthError: Auth service temporarily unavailable after ${maxRetries} retries`);
      }
      console.log(`[Integrations] getAuthUser error: ${err}`);
      return null;
    }
  }
  return null;
}

/* ─── Gemini Helper (for Gmail email-to-task) ─── */

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function callGeminiJson(prompt: string, systemInstruction?: string): Promise<any> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const body: any = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return JSON.parse(text);
}

/* ═══════════════════════════════════════════════════════════
   REGISTER ALL INTEGRATION ROUTES
   ═══════════════════════════════════════════════════════════ */

export function registerIntegrationRoutes(app: Hono, PREFIX: string) {

  /* ─────────────────────────────────────────────────────────
     INTEGRATION STATUS — Get connection status for all services
     ───────────────────────────────────────────────────────── */

  app.get(`${PREFIX}/integrations/status`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const [googleTokens, frameioToken, asanaToken, craftToken] = await Promise.all([
        kv.get(kvKey.googleTokens(user.id)),
        kv.get(kvKey.frameioToken(user.id)),
        kv.get(kvKey.asanaToken(user.id)),
        kv.get(kvKey.craftToken(user.id)),
      ]);

      const hasGoogleClientId = !!Deno.env.get("GOOGLE_CLIENT_ID");

      return c.json({
        google: {
          connected: !!(googleTokens as any)?.access_token,
          hasClientCredentials: hasGoogleClientId,
          scopes: (googleTokens as any)?.scopes || [],
          email: (googleTokens as any)?.email || null,
        },
        frameio: {
          connected: !!(frameioToken as any)?.token,
          accountName: (frameioToken as any)?.accountName || null,
        },
        asana: {
          connected: !!(asanaToken as any)?.token,
          userName: (asanaToken as any)?.userName || null,
          workspaceName: (asanaToken as any)?.workspaceName || null,
        },
        craft: {
          connected: !!(craftToken as any)?.configured,
        },
      });
    } catch (err) {
      console.log(`[Integrations] Status check error: ${err}`);
      return c.json({ error: `Integration status failed: ${err}` }, 500);
    }
  });

  /* ─────────────────────────────────────────────────────────
     DISCONNECT — Remove an integration
     ───────────────────────────────────────────────────────── */

  app.post(`${PREFIX}/integrations/disconnect`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { service } = await c.req.json();
      const keyMap: Record<string, string> = {
        google: kvKey.googleTokens(user.id),
        frameio: kvKey.frameioToken(user.id),
        asana: kvKey.asanaToken(user.id),
        craft: kvKey.craftToken(user.id),
      };

      const key = keyMap[service];
      if (!key) return c.json({ error: `Unknown service: ${service}` }, 400);

      await kv.del(key);
      if (service === "google") {
        await kv.del(kvKey.googleCalendars(user.id));
      }

      console.log(`[Integrations] Disconnected ${service} for user ${user.id}`);
      return c.json({ success: true });
    } catch (err) {
      console.log(`[Integrations] Disconnect error: ${err}`);
      return c.json({ error: `Disconnect failed: ${err}` }, 500);
    }
  });

  /* ═══════════════════════════════════════════════════════════
     GOOGLE CALENDAR & GMAIL (P12-1 & P12-2)
     OAuth2 with refresh tokens, calendar CRUD, Gmail starred.
     ═══════════════════════════════════════════════════════════ */

  const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  /** Get a valid Google access token, refreshing if needed */
  async function getGoogleAccessToken(userId: string): Promise<string | null> {
    const tokens = (await kv.get(kvKey.googleTokens(userId))) as any;
    if (!tokens?.access_token) return null;

    // Check if token is expired (with 60s buffer)
    const now = Math.floor(Date.now() / 1000);
    if (tokens.expires_at && tokens.expires_at - now < 60 && tokens.refresh_token) {
      // Refresh the token
      try {
        const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
        const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

        const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: tokens.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const updatedTokens = {
            ...tokens,
            access_token: refreshData.access_token,
            expires_at: Math.floor(Date.now() / 1000) + (refreshData.expires_in || 3600),
          };
          await kv.set(kvKey.googleTokens(userId), updatedTokens);
          console.log(`[Google] Token refreshed for user ${userId}`);
          return refreshData.access_token;
        } else {
          console.log(`[Google] Token refresh failed: ${await refreshResponse.text()}`);
        }
      } catch (err) {
        console.log(`[Google] Token refresh error: ${err}`);
      }
    }

    return tokens.access_token;
  }

  /** GET /integrations/google/auth-url — Generate OAuth URL */
  app.get(`${PREFIX}/integrations/google/auth-url`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      if (!clientId) {
        return c.json({
          error: "GOOGLE_CLIENT_ID not configured. Please set up Google OAuth credentials in your Supabase project settings.",
        }, 400);
      }

      const type = c.req.query("type") || "gcal"; // "gcal" or "gmail"
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const redirectUri = `${supabaseUrl}/functions/v1/make-server-a038f2e0/integrations/google/callback`;

      const state = `${type}-${user.id}-${Date.now()}`;
      // Store state temporarily for validation
      await kv.set(`oauth-state:${state}`, { userId: user.id, type }, );

      const scopes = GOOGLE_SCOPES.join(" ");
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);

      return c.json({ authUrl: authUrl.toString(), state });
    } catch (err) {
      console.log(`[Google] Auth URL error: ${err}`);
      return c.json({ error: `Failed to generate auth URL: ${err}` }, 500);
    }
  });

  /** GET /integrations/google/callback — OAuth callback handler */
  app.get(`${PREFIX}/integrations/google/callback`, async (c) => {
    try {
      const code = c.req.query("code");
      const state = c.req.query("state");
      const error = c.req.query("error");

      if (error) {
        const html = `<html><body><script>
          window.opener?.postMessage({ type: 'oauth-error', error: '${error}' }, '*');
          setTimeout(() => window.close(), 1500);
        </script><p>Authentication cancelled.</p></body></html>`;
        return c.html(html);
      }

      if (!code || !state) {
        return c.json({ error: "Missing code or state parameter" }, 400);
      }

      // Validate state
      const stateData = (await kv.get(`oauth-state:${state}`)) as any;
      if (!stateData?.userId) {
        return c.json({ error: "Invalid or expired OAuth state" }, 400);
      }
      // Clean up state
      await kv.del(`oauth-state:${state}`);

      const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const redirectUri = `${supabaseUrl}/functions/v1/make-server-a038f2e0/integrations/google/callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errBody = await tokenResponse.text();
        console.log(`[Google] Token exchange failed: ${errBody}`);
        const html = `<html><body><script>
          window.opener?.postMessage({ type: 'oauth-error', error: 'Token exchange failed' }, '*');
          setTimeout(() => window.close(), 2000);
        </script><p>Authentication failed. Please try again.</p></body></html>`;
        return c.html(html);
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      let email = "";
      try {
        const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          email = userInfo.email || "";
        }
      } catch {
        // Non-fatal
      }

      // Store tokens
      const tokens = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
        scopes: GOOGLE_SCOPES,
        email,
        connectedAt: new Date().toISOString(),
      };
      await kv.set(kvKey.googleTokens(stateData.userId), tokens);

      console.log(`[Google] OAuth complete for user ${stateData.userId} (${email})`);

      const callbackType = stateData.type === "gmail" ? "gmail" : "gcal";
      const html = `<html><body><script>
        window.opener?.postMessage({
          type: 'oauth-callback-${callbackType}',
          success: true,
          email: '${email}'
        }, '*');
        setTimeout(() => window.close(), 1500);
      </script><p>Connected successfully! This window will close.</p></body></html>`;
      return c.html(html);
    } catch (err) {
      console.log(`[Google] OAuth callback error: ${err}`);
      const html = `<html><body><script>
        window.opener?.postMessage({ type: 'oauth-error', error: '${String(err).replace(/'/g, "\\'")}' }, '*');
        setTimeout(() => window.close(), 2000);
      </script><p>Error: ${err}</p></body></html>`;
      return c.html(html);
    }
  });

  /* ── Google Calendar Routes ── */

  /** GET /integrations/gcal/calendars — List user's calendars */
  app.get(`${PREFIX}/integrations/gcal/calendars`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const res = await fetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.log(`[GCal] Calendar list error: ${errText}`);
        return c.json({ error: `Failed to fetch calendars: ${res.status}` }, res.status);
      }

      const data = await res.json();
      const calendars = (data.items || []).map((cal: any) => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description || "",
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor || "",
        accessRole: cal.accessRole,
        selected: cal.selected || false,
      }));

      // Cache the calendar list
      await kv.set(kvKey.googleCalendars(user.id), calendars);

      return c.json({ calendars });
    } catch (err) {
      console.log(`[GCal] Calendar list error: ${err}`);
      return c.json({ error: `Calendar list failed: ${err}` }, 500);
    }
  });

  /** GET /integrations/gcal/events — Fetch events from a calendar */
  app.get(`${PREFIX}/integrations/gcal/events`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const calendarId = c.req.query("calendarId") || "primary";
      const timeMin = c.req.query("timeMin") || new Date().toISOString();
      const timeMax = c.req.query("timeMax") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const maxResults = c.req.query("maxResults") || "100";

      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.set("timeMin", timeMin);
      url.searchParams.set("timeMax", timeMax);
      url.searchParams.set("maxResults", maxResults);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        return c.json({ error: `Failed to fetch events: ${res.status}` }, res.status);
      }

      const data = await res.json();
      const events = (data.items || []).map((ev: any) => ({
        id: ev.id,
        title: ev.summary || "(No title)",
        description: ev.description || "",
        location: ev.location || "",
        start: ev.start?.dateTime || ev.start?.date || "",
        end: ev.end?.dateTime || ev.end?.date || "",
        isAllDay: !!ev.start?.date && !ev.start?.dateTime,
        attendees: (ev.attendees || []).map((a: any) => a.email),
        htmlLink: ev.htmlLink || "",
        status: ev.status || "confirmed",
        calendarId,
      }));

      return c.json({ events });
    } catch (err) {
      console.log(`[GCal] Events fetch error: ${err}`);
      return c.json({ error: `Events fetch failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/gcal/events — Create a calendar event */
  app.post(`${PREFIX}/integrations/gcal/events`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const { calendarId, title, description, start, end, location, attendees, isAllDay } = await c.req.json();
      const targetCalendar = calendarId || "primary";

      const event: any = {
        summary: title,
        description: description || "",
        location: location || "",
      };

      if (isAllDay) {
        event.start = { date: start };
        event.end = { date: end || start };
      } else {
        event.start = { dateTime: start, timeZone: "UTC" };
        event.end = { dateTime: end, timeZone: "UTC" };
      }

      if (attendees?.length) {
        event.attendees = attendees.map((email: string) => ({ email }));
      }

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.log(`[GCal] Create event error: ${errText}`);
        return c.json({ error: `Failed to create event: ${res.status}` }, res.status);
      }

      const created = await res.json();
      console.log(`[GCal] Event created: ${created.id} for user ${user.id}`);
      return c.json({
        id: created.id,
        title: created.summary,
        htmlLink: created.htmlLink,
      });
    } catch (err) {
      console.log(`[GCal] Create event error: ${err}`);
      return c.json({ error: `Event creation failed: ${err}` }, 500);
    }
  });

  /** PUT /integrations/gcal/events/:eventId — Update a calendar event */
  app.put(`${PREFIX}/integrations/gcal/events/:eventId`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const eventId = c.req.param("eventId");
      const { calendarId, title, description, start, end, location, isAllDay } = await c.req.json();
      const targetCalendar = calendarId || "primary";

      const event: any = {};
      if (title !== undefined) event.summary = title;
      if (description !== undefined) event.description = description;
      if (location !== undefined) event.location = location;
      if (start) {
        event.start = isAllDay ? { date: start } : { dateTime: start, timeZone: "UTC" };
      }
      if (end) {
        event.end = isAllDay ? { date: end } : { dateTime: end, timeZone: "UTC" };
      }

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendar)}/events/${eventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!res.ok) {
        return c.json({ error: `Failed to update event: ${res.status}` }, res.status);
      }

      const updated = await res.json();
      return c.json({ id: updated.id, title: updated.summary });
    } catch (err) {
      console.log(`[GCal] Update event error: ${err}`);
      return c.json({ error: `Event update failed: ${err}` }, 500);
    }
  });

  /** DELETE /integrations/gcal/events/:eventId — Delete a calendar event */
  app.delete(`${PREFIX}/integrations/gcal/events/:eventId`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const eventId = c.req.param("eventId");
      const calendarId = c.req.query("calendarId") || "primary";

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok && res.status !== 410) {
        return c.json({ error: `Failed to delete event: ${res.status}` }, res.status);
      }

      return c.json({ success: true });
    } catch (err) {
      console.log(`[GCal] Delete event error: ${err}`);
      return c.json({ error: `Event delete failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/gcal/sync — Sync GCal events to Canto calendar */
  app.post(`${PREFIX}/integrations/gcal/sync`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const { calendarIds, daysAhead } = await c.req.json();
      const calendars = calendarIds || ["primary"];
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + (daysAhead || 30) * 24 * 60 * 60 * 1000).toISOString();

      const allEvents: any[] = [];

      for (const calId of calendars) {
        const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`);
        url.searchParams.set("timeMin", timeMin);
        url.searchParams.set("timeMax", timeMax);
        url.searchParams.set("maxResults", "250");
        url.searchParams.set("singleEvents", "true");
        url.searchParams.set("orderBy", "startTime");

        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const data = await res.json();
          for (const ev of data.items || []) {
            allEvents.push({
              id: `gcal-${ev.id}`,
              title: ev.summary || "(No title)",
              date: (ev.start?.dateTime || ev.start?.date || "").split("T")[0],
              startTime: ev.start?.dateTime ? ev.start.dateTime.split("T")[1]?.slice(0, 5) : undefined,
              endTime: ev.end?.dateTime ? ev.end.dateTime.split("T")[1]?.slice(0, 5) : undefined,
              description: ev.description || "",
              location: ev.location || "",
              attendees: (ev.attendees || []).map((a: any) => a.email),
              gcalEventId: ev.id,
              gcalCalendarId: calId,
              isAllDay: !!ev.start?.date && !ev.start?.dateTime,
              color: "",
            });
          }
        }
      }

      console.log(`[GCal] Synced ${allEvents.length} events for user ${user.id}`);
      return c.json({ events: allEvents, syncedAt: new Date().toISOString() });
    } catch (err) {
      console.log(`[GCal] Sync error: ${err}`);
      return c.json({ error: `Calendar sync failed: ${err}` }, 500);
    }
  });

  /* ── Gmail Routes (P12-2) ── */

  /** GET /integrations/gmail/starred — Fetch starred emails */
  app.get(`${PREFIX}/integrations/gmail/starred`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const maxResults = c.req.query("maxResults") || "20";

      // List starred messages
      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:starred&maxResults=${maxResults}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!listRes.ok) {
        return c.json({ error: `Failed to list emails: ${listRes.status}` }, listRes.status);
      }

      const listData = await listRes.json();
      const messageIds = (listData.messages || []).map((m: any) => m.id);

      if (messageIds.length === 0) {
        return c.json({ emails: [] });
      }

      // Fetch each message (batch of up to 20)
      const emails: any[] = [];
      for (const msgId of messageIds.slice(0, 20)) {
        try {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Date`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (msgRes.ok) {
            const msg = await msgRes.json();
            const headers = msg.payload?.headers || [];
            const getHeader = (name: string) =>
              headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

            emails.push({
              id: msg.id,
              threadId: msg.threadId,
              subject: getHeader("Subject") || "(No subject)",
              from: getHeader("From"),
              to: getHeader("To"),
              cc: getHeader("Cc"),
              date: getHeader("Date"),
              snippet: msg.snippet || "",
              labelIds: msg.labelIds || [],
            });
          }
        } catch {
          // Skip individual message errors
        }
      }

      return c.json({ emails, total: listData.resultSizeEstimate || emails.length });
    } catch (err) {
      console.log(`[Gmail] Starred fetch error: ${err}`);
      return c.json({ error: `Gmail starred fetch failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/gmail/email-to-task — Extract task from email via Gemini */
  app.post(`${PREFIX}/integrations/gmail/email-to-task`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { subject, from, snippet, date, threadId, messageId } = await c.req.json();
      if (!subject) return c.json({ error: "Email subject is required" }, 400);

      const prompt = `Extract a project management task from this email:

Subject: ${subject}
From: ${from || "Unknown"}
Date: ${date || "Unknown"}
Preview: ${snippet || "No preview available"}

Return JSON: {
  "title": "A concise task title (under 80 chars)",
  "description": "Brief description of what needs to be done",
  "priority": "high" | "medium" | "low",
  "dueDate": "YYYY-MM-DD if mentioned, null otherwise",
  "tags": ["relevant", "tags"]
}`;

      const result = await callGeminiJson(
        prompt,
        "You are a project management assistant. Extract actionable tasks from email content. Be specific and concise."
      );

      return c.json({
        ...result,
        gmailMessageId: messageId,
        gmailThreadId: threadId,
        gmailFrom: from,
        gmailDate: date,
        gmailSubject: subject,
      });
    } catch (err) {
      console.log(`[Gmail] Email-to-task error: ${err}`);
      return c.json({ error: `Email-to-task extraction failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/gmail/unstar — Remove star from an email */
  app.post(`${PREFIX}/integrations/gmail/unstar`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const accessToken = await getGoogleAccessToken(user.id);
      if (!accessToken) return c.json({ error: "Google not connected" }, 401);

      const { messageId } = await c.req.json();
      if (!messageId) return c.json({ error: "messageId is required" }, 400);

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ removeLabelIds: ["STARRED"] }),
        }
      );

      if (!res.ok) {
        return c.json({ error: `Failed to unstar email: ${res.status}` }, res.status);
      }

      return c.json({ success: true });
    } catch (err) {
      console.log(`[Gmail] Unstar error: ${err}`);
      return c.json({ error: `Unstar failed: ${err}` }, 500);
    }
  });

  /* ═══════════════════════════════════════════════════════════
     FRAME.IO (P12-3)
     Developer token auth, proxy routes for teams/projects/assets/comments
     ═══════════════════════════════════════════════════════════ */

  const FRAMEIO_BASE = "https://api.frame.io/v2";

  /** POST /integrations/frameio/connect — Validate and store Frame.io token */
  app.post(`${PREFIX}/integrations/frameio/connect`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { token } = await c.req.json();
      if (!token) return c.json({ error: "Developer token is required" }, 400);

      // Validate token by fetching account info
      const res = await fetch(`${FRAMEIO_BASE}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const status = res.status;
        if (status === 401 || status === 403) {
          return c.json({ error: "Invalid or expired Frame.io token" }, 401);
        }
        return c.json({ error: `Frame.io API error: ${status}` }, status);
      }

      const meData = await res.json();
      const tokenData = {
        token,
        accountId: meData.account_id || meData.id,
        accountName: meData.name || meData.email || "",
        email: meData.email || "",
        connectedAt: new Date().toISOString(),
      };

      await kv.set(kvKey.frameioToken(user.id), tokenData);
      console.log(`[Frame.io] Connected for user ${user.id} (${tokenData.accountName})`);
      return c.json({ success: true, accountName: tokenData.accountName });
    } catch (err) {
      console.log(`[Frame.io] Connect error: ${err}`);
      return c.json({ error: `Frame.io connect failed: ${err}` }, 500);
    }
  });

  /** Generic Frame.io API proxy */
  async function frameioProxy(userId: string, path: string): Promise<any> {
    const tokenData = (await kv.get(kvKey.frameioToken(userId))) as any;
    if (!tokenData?.token) throw new Error("Frame.io not connected");

    const res = await fetch(`${FRAMEIO_BASE}${path}`, {
      headers: { Authorization: `Bearer ${tokenData.token}` },
    });

    if (!res.ok) {
      throw new Error(`Frame.io API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  /** GET /integrations/frameio/teams */
  app.get(`${PREFIX}/integrations/frameio/teams`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const tokenData = (await kv.get(kvKey.frameioToken(user.id))) as any;
      if (!tokenData?.token) return c.json({ error: "Frame.io not connected" }, 401);

      // Get account info first to get teams
      const meRes = await fetch(`${FRAMEIO_BASE}/me`, {
        headers: { Authorization: `Bearer ${tokenData.token}` },
      });

      if (!meRes.ok) return c.json({ error: `Frame.io API error: ${meRes.status}` }, meRes.status);
      const me = await meRes.json();

      // Fetch teams for the account
      const teamsRes = await fetch(`${FRAMEIO_BASE}/accounts/${me.account_id}/teams`, {
        headers: { Authorization: `Bearer ${tokenData.token}` },
      });

      if (!teamsRes.ok) return c.json({ error: `Frame.io teams error: ${teamsRes.status}` }, teamsRes.status);
      const teams = await teamsRes.json();

      return c.json({ teams: (Array.isArray(teams) ? teams : []).map((t: any) => ({
        id: t.id,
        name: t.name,
        memberCount: t.member_count || 0,
      })) });
    } catch (err) {
      console.log(`[Frame.io] Teams error: ${err}`);
      return c.json({ error: `Frame.io teams failed: ${err}` }, 500);
    }
  });

  /** GET /integrations/frameio/projects?teamId=... */
  app.get(`${PREFIX}/integrations/frameio/projects`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const teamId = c.req.query("teamId");
      if (!teamId) return c.json({ error: "teamId is required" }, 400);

      const data = await frameioProxy(user.id, `/teams/${teamId}/projects`);
      const projects = (Array.isArray(data) ? data : []).map((p: any) => ({
        id: p.id,
        name: p.name,
        insertedAt: p.inserted_at,
        itemCount: p.item_count || 0,
      }));

      return c.json({ projects });
    } catch (err) {
      console.log(`[Frame.io] Projects error: ${err}`);
      return c.json({ error: `Frame.io projects failed: ${err}` }, 500);
    }
  });

  /** GET /integrations/frameio/assets?projectId=... or ?assetId=... */
  app.get(`${PREFIX}/integrations/frameio/assets`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const projectId = c.req.query("projectId");
      const assetId = c.req.query("assetId");

      let data: any;
      if (assetId) {
        data = await frameioProxy(user.id, `/assets/${assetId}/children`);
      } else if (projectId) {
        // Get root asset of the project first
        const project = await frameioProxy(user.id, `/projects/${projectId}`);
        data = await frameioProxy(user.id, `/assets/${project.root_asset_id}/children`);
      } else {
        return c.json({ error: "projectId or assetId is required" }, 400);
      }

      const assets = (Array.isArray(data) ? data : []).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type, // "file", "folder", "version_stack"
        label: a.label || "",
        itemCount: a.item_count || 0,
        fileSize: a.filesize || 0,
        thumbnailUrl: a.thumb || "",
        insertedAt: a.inserted_at,
        commentCount: a.comment_count || 0,
      }));

      return c.json({ assets });
    } catch (err) {
      console.log(`[Frame.io] Assets error: ${err}`);
      return c.json({ error: `Frame.io assets failed: ${err}` }, 500);
    }
  });

  /** GET /integrations/frameio/comments?assetId=... */
  app.get(`${PREFIX}/integrations/frameio/comments`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const assetId = c.req.query("assetId");
      if (!assetId) return c.json({ error: "assetId is required" }, 400);

      const data = await frameioProxy(user.id, `/assets/${assetId}/comments`);
      const comments = (Array.isArray(data) ? data : []).map((cm: any) => ({
        id: cm.id,
        text: cm.text || "",
        author: cm.owner?.name || cm.owner?.email || "Unknown",
        timestamp: cm.timestamp || 0,
        insertedAt: cm.inserted_at,
        completed: cm.completed || false,
      }));

      return c.json({ comments });
    } catch (err) {
      console.log(`[Frame.io] Comments error: ${err}`);
      return c.json({ error: `Frame.io comments failed: ${err}` }, 500);
    }
  });

  /* ═══════════════════════════════════════════════════════════
     ASANA IMPORT (P12-4)
     PAT auth, workspace/project browser, full import.
     ═══════════════════════════════════════════════════════════ */

  const ASANA_BASE = "https://app.asana.com/api/1.0";

  /** POST /integrations/asana/connect — Validate and store Asana PAT */
  app.post(`${PREFIX}/integrations/asana/connect`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { token } = await c.req.json();
      if (!token) return c.json({ error: "Personal Access Token is required" }, 400);

      // Validate token by fetching user info
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

  /** Asana API helper */
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

  /** GET /integrations/asana/workspaces */
  app.get(`${PREFIX}/integrations/asana/workspaces`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const data = await asanaFetch(user.id, "/workspaces?opt_fields=name,is_organization");
      return c.json({ workspaces: (data || []).map((w: any) => ({
        gid: w.gid,
        name: w.name,
        isOrganization: w.is_organization || false,
      })) });
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

      const data = await asanaFetch(
        user.id,
        `/workspaces/${workspaceGid}/projects?opt_fields=name,color,icon,archived,current_status_update.title,current_status_update.status_type&limit=100`
      );

      return c.json({
        projects: (data || []).map((p: any) => ({
          gid: p.gid,
          name: p.name,
          color: p.color || "",
          icon: p.icon || "",
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

  /** POST /integrations/asana/import — Import an Asana project into Canto */
  app.post(`${PREFIX}/integrations/asana/import`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { projectGid, workspaceName } = await c.req.json();
      if (!projectGid) return c.json({ error: "projectGid is required" }, 400);

      // Fetch project details
      const project = await asanaFetch(
        user.id,
        `/projects/${projectGid}?opt_fields=name,notes,color,icon,current_status_update.title,current_status_update.status_type,members.name,members.email`
      );

      // Fetch tasks with sections
      const sections = await asanaFetch(user.id, `/projects/${projectGid}/sections?opt_fields=name`);
      const allTasks: any[] = [];

      for (const section of sections || []) {
        const sectionTasks = await asanaFetch(
          user.id,
          `/sections/${section.gid}/tasks?opt_fields=name,notes,completed,due_on,start_on,assignee.name,assignee.email,tags.name,custom_fields.name,custom_fields.display_value&limit=100`
        );

        for (const task of sectionTasks || []) {
          // Fetch subtasks for each task
          let subtasks: any[] = [];
          try {
            subtasks = await asanaFetch(
              user.id,
              `/tasks/${task.gid}/subtasks?opt_fields=name,completed,due_on,assignee.name`
            ) || [];
          } catch {
            // Skip subtask fetch errors
          }

          allTasks.push({
            ...task,
            sectionName: section.name === "(no section)" ? undefined : section.name,
            subtasks,
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

      // Build Canto-compatible project data
      const flowosProject = {
        name: project.name,
        description: project.notes || "",
        status: statusMap[project.current_status_update?.status_type || ""] || "on-track",
        tasks: allTasks.map((t: any, idx: number) => ({
          id: `asana-${t.gid}-${idx}`,
          title: t.name || "Untitled Task",
          date: t.due_on || "",
          startDate: t.start_on || "",
          assignee: t.assignee?.name || "",
          completed: t.completed || false,
          status: t.completed ? "completed" : "todo",
          content: t.notes || "",
          section: t.sectionName || "",
          priority: "medium" as const,
          tags: (t.tags || []).map((tag: any) => tag.name),
          subtasks: (t.subtasks || []).map((st: any, stIdx: number) => ({
            id: `asana-st-${st.gid}-${stIdx}`,
            title: st.name || "Untitled Subtask",
            completed: st.completed || false,
            date: st.due_on || "",
            assignee: st.assignee?.name || "",
          })),
          createdAt: new Date().toISOString(),
        })),
        members: (project.members || []).map((m: any) => m.name || m.email),
        importSource: "asana",
        importedAt: new Date().toISOString(),
        asanaProjectGid: projectGid,
      };

      console.log(
        `[Asana] Imported project "${project.name}" with ${flowosProject.tasks.length} tasks for user ${user.id}`
      );
      return c.json({ project: flowosProject });
    } catch (err) {
      console.log(`[Asana] Import error: ${err}`);
      return c.json({ error: `Asana import failed: ${err}` }, 500);
    }
  });

  /* ═══════════════════════════════════════════════════════════
     CRAFT IMPORT (P12-6)
     Token auth, space/document browser, block-type mapping.
     ═══════════════════════════════════════════════════════════ */

  /** POST /integrations/craft/connect — Store Craft token */
  app.post(`${PREFIX}/integrations/craft/connect`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { token } = await c.req.json();
      if (!token) return c.json({ error: "Craft API token is required" }, 400);

      // Craft's API is limited — store as configured
      const tokenData = {
        token,
        configured: true,
        connectedAt: new Date().toISOString(),
      };

      await kv.set(kvKey.craftToken(user.id), tokenData);
      console.log(`[Craft] Token stored for user ${user.id}`);
      return c.json({ success: true });
    } catch (err) {
      console.log(`[Craft] Connect error: ${err}`);
      return c.json({ error: `Craft connect failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/craft/import-markdown — Import Craft markdown export */
  app.post(`${PREFIX}/integrations/craft/import-markdown`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { markdown, title, sourceName } = await c.req.json();
      if (!markdown) return c.json({ error: "Markdown content is required" }, 400);

      // Convert markdown to Canto doc blocks
      const blocks = markdownToBlocks(markdown);

      const doc = {
        id: `craft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title || "Imported from Craft",
        type: "doc",
        blocks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.id,
        importSource: "craft",
        importSourceId: sourceName || "craft-export",
      };

      console.log(`[Craft] Imported document "${doc.title}" with ${blocks.length} blocks for user ${user.id}`);
      return c.json({ doc });
    } catch (err) {
      console.log(`[Craft] Import error: ${err}`);
      return c.json({ error: `Craft import failed: ${err}` }, 500);
    }
  });

  /** POST /integrations/craft/import-json — Import Craft JSON export */
  app.post(`${PREFIX}/integrations/craft/import-json`, async (c) => {
    try {
      const user = await getAuthUser(c);
      if (!user) return c.json({ error: "Authorization required" }, 401);

      const { documents } = await c.req.json();
      if (!Array.isArray(documents) || documents.length === 0) {
        return c.json({ error: "documents array is required" }, 400);
      }

      const importedDocs = documents.map((doc: any, idx: number) => {
        const blocks = doc.blocks
          ? doc.blocks.map((b: any, bIdx: number) => mapCraftBlock(b, bIdx))
          : doc.content
          ? markdownToBlocks(doc.content)
          : [];

        return {
          id: `craft-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          title: doc.title || `Imported Document ${idx + 1}`,
          type: doc.type === "meeting" ? "meeting" : "doc",
          blocks,
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString(),
          createdBy: user.id,
          importSource: "craft",
          importSourceId: doc.id || `craft-${idx}`,
        };
      });

      console.log(`[Craft] Imported ${importedDocs.length} documents for user ${user.id}`);
      return c.json({ docs: importedDocs });
    } catch (err) {
      console.log(`[Craft] JSON import error: ${err}`);
      return c.json({ error: `Craft JSON import failed: ${err}` }, 500);
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

/** Map a Craft block to Canto DocBlock format */
function mapCraftBlock(block: any, index: number): any {
  const id = `b-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`;

  // Craft block types: text, heading, bulletedList, numberedList,
  // todoList, quote, code, divider, image
  const typeMap: Record<string, string> = {
    text: "paragraph",
    heading: "heading",
    heading1: "heading",
    heading2: "heading",
    heading3: "heading",
    bulletedList: "bulleted-list",
    bulleted_list: "bulleted-list",
    numberedList: "numbered-list",
    numbered_list: "numbered-list",
    todoList: "checklist",
    todo_list: "checklist",
    todo: "checklist",
    quote: "quote",
    blockquote: "quote",
    code: "code",
    codeBlock: "code",
    code_block: "code",
    divider: "divider",
    horizontalRule: "divider",
    image: "image",
  };

  const result: any = {
    id,
    type: typeMap[block.type] || "paragraph",
    content: block.content || block.text || "",
  };

  if (block.type?.includes("heading")) {
    result.level = block.level || (block.type === "heading1" ? 1 : block.type === "heading3" ? 3 : 2);
  }
  if (block.checked !== undefined) {
    result.checked = !!block.checked;
  }
  if (block.imageUrl || block.url) {
    result.imageUrl = block.imageUrl || block.url;
    result.imageAlt = block.alt || block.caption || "";
  }

  return result;
}

/** Convert markdown to Canto DocBlock array */
function markdownToBlocks(markdown: string): any[] {
  const lines = markdown.split("\n");
  const blocks: any[] = [];
  let codeBlock = false;
  let codeContent = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const id = `b-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;

    // Code block handling
    if (line.startsWith("```")) {
      if (codeBlock) {
        blocks.push({ id, type: "code", content: codeContent.trim() });
        codeContent = "";
        codeBlock = false;
      } else {
        codeBlock = true;
      }
      continue;
    }
    if (codeBlock) {
      codeContent += line + "\n";
      continue;
    }

    // Skip empty lines
    if (!line.trim()) continue;

    // Headings
    if (line.startsWith("### ")) {
      blocks.push({ id, type: "heading", content: line.slice(4), level: 3 });
    } else if (line.startsWith("## ")) {
      blocks.push({ id, type: "heading", content: line.slice(3), level: 2 });
    } else if (line.startsWith("# ")) {
      blocks.push({ id, type: "heading", content: line.slice(2), level: 1 });
    }
    // Horizontal rule
    else if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ id, type: "divider", content: "" });
    }
    // Checklist
    else if (/^\s*[-*]\s*\[[ x]\]/.test(line)) {
      const checked = /\[x\]/i.test(line);
      const content = line.replace(/^\s*[-*]\s*\[[ x]\]\s*/, "");
      blocks.push({ id, type: "checklist", content, checked });
    }
    // Bulleted list
    else if (/^\s*[-*+]\s+/.test(line)) {
      blocks.push({ id, type: "bulleted-list", content: line.replace(/^\s*[-*+]\s+/, "") });
    }
    // Numbered list
    else if (/^\s*\d+\.\s+/.test(line)) {
      blocks.push({ id, type: "numbered-list", content: line.replace(/^\s*\d+\.\s+/, "") });
    }
    // Blockquote
    else if (line.startsWith("> ")) {
      blocks.push({ id, type: "quote", content: line.slice(2) });
    }
    // Image
    else if (/^!\[.*?\]\(.*?\)/.test(line)) {
      const match = line.match(/^!\[(.*?)\]\((.*?)\)/);
      if (match) {
        blocks.push({ id, type: "image", content: "", imageAlt: match[1], imageUrl: match[2] });
      }
    }
    // Paragraph (default)
    else {
      blocks.push({ id, type: "paragraph", content: line });
    }
  }

  return blocks;
}