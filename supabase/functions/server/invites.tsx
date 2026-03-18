/* ═══════════════════════════════════════════════════════════
   SPACE INVITES — Send branded invitation emails via Resend
   when people are added to a Space with an email address.
   ═══════════════════════════════════════════════════════════ */

import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

/* ─── Retry helper ─── */

async function withRetry<T extends unknown>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 300
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isTransient =
        String(err).includes("connection reset") ||
        String(err).includes("connection error") ||
        String(err).includes("ECONNRESET") ||
        String(err).includes("SendRequest") ||
        String(err).includes("Failed to fetch") ||
        String(err).includes("tcp connect error");
      if (isTransient && attempt < maxRetries - 1) {
        console.log(
          `[Invites] Transient error (attempt ${attempt + 1}/${maxRetries}), retrying: ${err}`
        );
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withRetry exhausted");
}

/* ─── Auth helper ─── */

async function getAuthUser(c: any): Promise<{ id: string; email: string } | null> {
  const token = c.req.header("X-User-Token");
  if (!token) return null;

  return withRetry(async () => {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email || "" };
  });
}

/* ─── Branded HTML email template ─── */

function buildInviteEmail({
  personName,
  personEmail,
  spaceName,
  spaceColor,
  inviterName,
  role,
  appUrl,
}: {
  personName: string;
  personEmail: string;
  spaceName: string;
  spaceColor: string;
  inviterName: string;
  role: string;
  appUrl: string;
}): string {
  // Use a safe hex fallback for the accent since email clients don't support oklch
  const accentHex = "#5B6CFF"; // Canto brand blue
  const roleLabel =
    role === "member"
      ? "a member"
      : role === "client"
      ? "a client"
      : role === "viewer"
      ? "a viewer"
      : `a ${role}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to ${spaceName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Accent bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,${accentHex},${accentHex}88);"></td>
          </tr>
          <!-- Logo area -->
          <tr>
            <td style="padding:32px 40px 0;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:${accentHex};border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-size:18px;font-weight:800;line-height:36px;">C</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:700;color:#1a1a1a;letter-spacing:-0.3px;">Canto</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:28px 40px 12px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a1a1a;line-height:1.3;">
                You've been invited to<br/>${spaceName}
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b6b6b;line-height:1.6;">
                <strong style="color:#1a1a1a;">${inviterName}</strong> has added you as ${roleLabel} of the <strong style="color:#1a1a1a;">${spaceName}</strong> space on Canto.
              </p>
            </td>
          </tr>
          <!-- CTA Button -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:${accentHex};border-radius:10px;">
                    <a href="${appUrl}" target="_blank" style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.2px;">
                      Open Canto
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Info box -->
          <tr>
            <td style="padding:0 40px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f8fa;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#8e8e93;text-transform:uppercase;letter-spacing:0.5px;">
                      Space details
                    </p>
                    <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.5;">
                      <strong>${spaceName}</strong><br/>
                      <span style="color:#6b6b6b;">Your role: <span style="color:${accentHex};font-weight:600;">${role.charAt(0).toUpperCase() + role.slice(1)}</span></span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 28px;">
              <p style="margin:0;font-size:12px;color:#aeaeb2;line-height:1.5;">
                If you don't have a Canto account yet, you can sign up with this email address (<strong>${personEmail}</strong>) to automatically join the space.
              </p>
            </td>
          </tr>
          <!-- Bottom border -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,${accentHex}22,${accentHex}08);"></td>
          </tr>
        </table>
        <!-- Sub-footer -->
        <table role="presentation" width="520" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#aeaeb2;line-height:1.5;">
                Sent by Canto · Project management for creative teams
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/* ═══════════════════════════════════════════════════════════
   REGISTER ROUTES
   ═══════════════════════════════════════════════════════════ */

export function registerInviteRoutes(app: any, PREFIX: string) {

  /**
   * GET /invites/test-resend
   * Diagnostic endpoint — verifies the Resend API key is valid and shows
   * which sender addresses / domains are available.
   */
  app.get(`${PREFIX}/invites/test-resend`, async (c: any) => {
    try {
      const user = await getAuthUser(c);
      if (!user) {
        return c.json({ error: "Authorization required" }, 401);
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return c.json({ ok: false, error: "RESEND_API_KEY not configured" });
      }

      // 1. Verify the API key by listing domains
      const domainsResp = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendApiKey}` },
      });
      const domainsBody = await domainsResp.text();
      console.log(`[Invites] Domains API response (${domainsResp.status}): ${domainsBody}`);

      // 2. Check API keys endpoint for key info
      const keysResp = await fetch("https://api.resend.com/api-keys", {
        headers: { Authorization: `Bearer ${resendApiKey}` },
      });
      const keysBody = await keysResp.text();
      console.log(`[Invites] API Keys response (${keysResp.status}): ${keysBody}`);

      let domains: any = null;
      try { domains = JSON.parse(domainsBody); } catch { /* */ }

      const verifiedDomains = domains?.data?.filter((d: any) => d.status === "verified") || [];

      return c.json({
        ok: domainsResp.ok,
        apiKeyValid: domainsResp.status !== 401 && domainsResp.status !== 403,
        domainsStatus: domainsResp.status,
        domains: domains?.data?.map((d: any) => ({
          name: d.name,
          status: d.status,
          created_at: d.created_at,
        })) || [],
        verifiedDomainCount: verifiedDomains.length,
        currentFromAddress: "Canto <onboarding@resend.dev>",
        recommendation: verifiedDomains.length === 0
          ? "No verified domains found. The 'onboarding@resend.dev' sender can ONLY deliver to the Resend account owner's email. To send to any recipient, verify a custom domain at https://resend.com/domains"
          : `You have ${verifiedDomains.length} verified domain(s). Update the 'from' address in invites.tsx to use one of: ${verifiedDomains.map((d: any) => d.name).join(", ")}`,
      });
    } catch (err) {
      console.log(`[Invites] Test Resend error: ${err}`);
      return c.json({ ok: false, error: String(err) });
    }
  });

  /**
   * POST /spaces/:id/invite
   * Body: { personName, personEmail, spaceName, spaceColor, inviterName, role }
   * Sends a branded invitation email via Resend and stores the invite record.
   */
  app.post(`${PREFIX}/spaces/:id/invite`, async (c: any) => {
    try {
      const user = await getAuthUser(c);
      if (!user) {
        return c.json({ error: "Authorization required to send invites" }, 401);
      }

      const spaceId = c.req.param("id");
      const { personName, personEmail, spaceName, spaceColor, inviterName, role } =
        await c.req.json();

      if (!personEmail) {
        return c.json({ error: "Email address is required to send an invite" }, 400);
      }

      if (!spaceName) {
        return c.json({ error: "Space name is required" }, 400);
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.log("[Invites] RESEND_API_KEY not configured");
        return c.json({ error: "Email service not configured (missing RESEND_API_KEY)" }, 500);
      }

      // Build the app URL — use the Supabase URL origin as a fallback
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      // The app is hosted at the same origin or a custom domain;
      // for now, use a generic link (the user can bookmark/share their app URL)
      const appUrl = supabaseUrl
        ? supabaseUrl.replace(".supabase.co", ".supabase.co")
        : "https://canto.app";

      const htmlBody = buildInviteEmail({
        personName: personName || "there",
        personEmail,
        spaceName,
        spaceColor: spaceColor || "#5B6CFF",
        inviterName: inviterName || "Someone",
        role: role || "member",
        appUrl,
      });

      // Send email via Resend API
      let resendResponse: any = null;
      let emailWarning: string | null = null;
      try {
        resendResponse = await withRetry(async () => {
          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Canto <onboarding@resend.dev>",
              to: [personEmail],
              subject: `${inviterName || "Someone"} invited you to ${spaceName} on Canto`,
              html: htmlBody,
            }),
          });
          const respBody = await resp.text();
          console.log(`[Invites] Resend API response (${resp.status}): ${respBody}`);
          if (!resp.ok) {
            throw new Error(`Resend API error (${resp.status}): ${respBody}`);
          }
          return JSON.parse(respBody);
        });
        // Log the important warning about onboarding@resend.dev limitations
        console.log(
          `[Invites] ⚠️  Email sent via onboarding@resend.dev → ${personEmail}. ` +
          `NOTE: onboarding@resend.dev can ONLY deliver to the Resend account owner's email. ` +
          `If the recipient is different, the email will appear sent but won't be delivered.`
        );
      } catch (emailErr) {
        // If the error is a 403 domain-verification issue, treat as non-fatal
        const errStr = String(emailErr);
        if (errStr.includes("403") || errStr.includes("verify a domain")) {
          console.log(
            `[Invites] Email delivery skipped (domain not verified): ${emailErr}`
          );
          emailWarning =
            "Person was added but the invite email could not be delivered. To send emails to external recipients, verify a domain at resend.com/domains.";
        } else {
          throw emailErr; // re-throw for other errors
        }
      }

      console.log(
        `[Invites] Invite processed for ${personEmail} in space "${spaceName}" (${spaceId}) by user ${user.id}. Resend ID: ${resendResponse?.id || "skipped"}`
      );

      // Store invite record in KV for tracking
      const normalizedEmail = personEmail.toLowerCase().trim();
      const inviteRecord = {
        spaceId,
        spaceName,
        personName,
        personEmail: normalizedEmail,
        inviterId: user.id,
        inviterName,
        role: role || "member",
        status: "pending",
        sentAt: new Date().toISOString(),
        resendId: resendResponse?.id || null,
      };

      await kv.set(`invite:${normalizedEmail}`, inviteRecord);

      // Also store a space-specific invite key for listing invites per space
      await kv.set(
        `space-invite:${spaceId}:${normalizedEmail}`,
        inviteRecord
      );

      return c.json({
        success: true,
        message: emailWarning
          ? `${personName || personEmail} added (email delivery skipped — verify a domain at resend.com/domains)`
          : `Invitation sent to ${personEmail}`,
        resendId: resendResponse?.id || null,
        warning: emailWarning,
      });
    } catch (err) {
      console.log(`[Invites] Error sending invite: ${err}`);
      return c.json({ error: `Failed to send invitation: ${err}` }, 500);
    }
  });

  /**
   * POST /spaces/:id/resend-invite
   * Body: { personEmail, personName, spaceName, spaceColor, inviterName, role }
   * Re-sends an invitation email.
   */
  app.post(`${PREFIX}/spaces/:id/resend-invite`, async (c: any) => {
    try {
      const user = await getAuthUser(c);
      if (!user) {
        return c.json({ error: "Authorization required to resend invites" }, 401);
      }

      const spaceId = c.req.param("id");
      const { personEmail, personName, spaceName, spaceColor, inviterName, role } =
        await c.req.json();

      if (!personEmail) {
        return c.json({ error: "Email address is required" }, 400);
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        return c.json({ error: "Email service not configured" }, 500);
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const appUrl = supabaseUrl || "https://canto.app";

      const htmlBody = buildInviteEmail({
        personName: personName || "there",
        personEmail,
        spaceName: spaceName || "a space",
        spaceColor: spaceColor || "#5B6CFF",
        inviterName: inviterName || "Someone",
        role: role || "member",
        appUrl,
      });

      let resendResponse: any = null;
      let emailWarning: string | null = null;
      try {
        resendResponse = await withRetry(async () => {
          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Canto <onboarding@resend.dev>",
              to: [personEmail],
              subject: `Reminder: ${inviterName || "Someone"} invited you to ${spaceName} on Canto`,
              html: htmlBody,
            }),
          });
          if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error(`Resend API error (${resp.status}): ${errBody}`);
          }
          return resp.json();
        });
      } catch (emailErr) {
        const errStr = String(emailErr);
        if (errStr.includes("403") || errStr.includes("verify a domain")) {
          console.log(
            `[Invites] Re-send email skipped (domain not verified): ${emailErr}`
          );
          emailWarning =
            "Invite email could not be delivered. Verify a domain at resend.com/domains to send to external recipients.";
        } else {
          throw emailErr;
        }
      }

      // Update invite record
      const normalizedEmail = personEmail.toLowerCase().trim();
      const existing = await kv.get(`space-invite:${spaceId}:${normalizedEmail}`);
      if (existing) {
        await kv.set(`space-invite:${spaceId}:${normalizedEmail}`, {
          ...(existing as any),
          lastResentAt: new Date().toISOString(),
          resentCount: ((existing as any).resentCount || 0) + 1,
        });
      }

      console.log(
        `[Invites] Re-send processed for ${personEmail} in space "${spaceName}" (${spaceId})`
      );

      return c.json({
        success: true,
        message: emailWarning
          ? `Re-send skipped — verify a domain at resend.com/domains`
          : `Invitation re-sent to ${personEmail}`,
        warning: emailWarning,
      });
    } catch (err) {
      console.log(`[Invites] Error re-sending invite: ${err}`);
      return c.json({ error: `Failed to re-send invitation: ${err}` }, 500);
    }
  });
}