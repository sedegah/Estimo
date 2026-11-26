/**
 * ESTIMO monthly check-in worker.
 *
 * Cron: 00:00 UTC on the 17th of every month (Ghana is UTC+0, so local midnight).
 * Reads account emails from the `estimo` D1 database and sends the branded check-in
 * email through Resend. Manual trigger for testing:
 *
 *   POST /run   (header: x-run-token: <RUN_TOKEN>)   optional ?to=you@example.com
 *
 * Required secrets:
 *   RESEND_API_KEY  — API key from resend.com
 *   EMAIL_FROM      — verified sender, e.g. "ESTIMO <hello@yourdomain.com>"
 *   APP_URL         — public site URL, e.g. https://yourdomain.com
 *   RUN_TOKEN       — any long random string, for the manual trigger
 */

type Env = {
  DB: D1Database;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  APP_URL?: string;
  RUN_TOKEN?: string;
};

type Recipient = { email: string; full_name: string | null };

const SUBJECT = "A quick check-in from ESTIMO";

function renderEmail({ appUrl, firstName }: { appUrl: string; firstName: string }): string {
  const name = firstName || "there";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f1f2ee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">A quiet nudge from ESTIMO - pick up an estimate, check a price, or start something new.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f2ee;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-radius:16px;overflow:hidden;font-family:'Bricolage Grotesque',-apple-system,'Segoe UI',Arial,sans-serif;">

<tr><td style="background:#0b1f3f;padding:22px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" style="vertical-align:middle;"><a href="${appUrl}" style="text-decoration:none;"><img src="${appUrl}/brand/estimo-logo-horizontal-dark.png" width="132" height="30" alt="ESTIMO" style="display:block;border:0;width:132px;height:auto;"></a></td>
<td align="right" style="vertical-align:middle;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8fa3bd;">Monthly check-in</td>
</tr></table></td></tr>

<tr><td style="background:#0b1f3f;padding:0;"><img src="${appUrl}/brand/estimo-plan-banner.png" width="600" height="240" alt="A floor plan with lights, sockets and a distribution board" style="display:block;border:0;width:100%;max-width:600px;height:auto;"></td></tr>

<tr><td style="background:#ffffff;padding:30px 32px 6px;">
<p style="margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a6d1f;font-weight:700;">Still on the cards?</p>
<h1 style="margin:0 0 14px;font-size:30px;line-height:1.1;letter-spacing:-.02em;color:#0b1f3f;font-weight:800;">Still planning that job?</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5f6b7a;">Hello ${name}, it is the 17th - a good moment to look at what you are working on. Your saved estimates are exactly where you left them.</p>
</td></tr>

<tr><td style="background:#ffffff;padding:0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f5;border:1px solid #eceee6;border-radius:12px;"><tr><td style="padding:18px 20px;">
<p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#0b1f3f;"><span style="display:inline-block;background:#f5b301;color:#0b1f3f;font-weight:700;font-size:11px;border-radius:999px;padding:3px 9px;margin-right:8px;">1</span><strong>Pick up an estimate.</strong> <a href="${appUrl}/projects" style="color:#0b1f3f;text-decoration:underline;">Open your saved projects</a></p>
<p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#0b1f3f;"><span style="display:inline-block;background:#f5b301;color:#0b1f3f;font-weight:700;font-size:11px;border-radius:999px;padding:3px 9px;margin-right:8px;">2</span><strong>Check a price.</strong> <a href="${appUrl}/catalogue" style="color:#0b1f3f;text-decoration:underline;">Search the catalogue</a></p>
<p style="margin:0;font-size:14px;line-height:1.5;color:#0b1f3f;"><span style="display:inline-block;background:#f5b301;color:#0b1f3f;font-weight:700;font-size:11px;border-radius:999px;padding:3px 9px;margin-right:8px;">3</span><strong>Start something new.</strong> <a href="${appUrl}/quick-estimate?template=HOME-2B" style="color:#0b1f3f;text-decoration:underline;">Begin an estimate</a></p>
</td></tr></table></td></tr>

<tr><td style="background:#ffffff;padding:24px 32px 8px;">
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5f6b7a;">No action needed if everything is on track. If something changed on site, a fresh estimate takes a couple of minutes.</p>
<a href="${appUrl}/dashboard" style="display:inline-block;background:#f5b301;color:#0b1f3f;font-size:15px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:8px;">Open your dashboard</a>
</td></tr>

<tr><td style="background:#ffffff;padding:22px 32px 28px;"><p style="margin:0;font-size:14px;line-height:1.6;color:#5f6b7a;">- The ESTIMO team</p></td></tr>

<tr><td style="background:#faf9f5;border-top:1px solid #eceee6;padding:22px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="left" style="vertical-align:middle;"><p style="margin:0;font-size:12px;line-height:1.6;color:#8a94a3;">ESTIMO &middot; Ghana electrical estimates<br><a href="${appUrl}" style="color:#5f6b7a;text-decoration:none;">${appUrl}</a><br>You receive this once a month because you have an ESTIMO account. <a href="${appUrl}/settings" style="color:#5f6b7a;">Manage emails</a></p></td>
<td align="right" style="vertical-align:middle;"><img src="${appUrl}/brand/estimo-mark-light.png" width="28" height="28" alt="" style="display:block;border:0;width:28px;height:28px;"></td>
</tr></table></td></tr>

</table></td></tr></table></body></html>`;
}

async function sendEmail(env: Env, to: string, html: string): Promise<boolean> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject: SUBJECT, html }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend rejected", to, response.status, detail.slice(0, 200));
    return false;
  }
  return true;
}

type RunSummary = { recipients: number; sent: number; failed: number; skipped: string | null };

async function runCheckIn(env: Env, testRecipient?: string): Promise<RunSummary> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    return { recipients: 0, sent: 0, failed: 0, skipped: "RESEND_API_KEY or EMAIL_FROM is not set" };
  }

  const appUrl = env.APP_URL ?? "https://estimo.live";
  const recipients: Recipient[] = testRecipient
    ? [{ email: testRecipient, full_name: "Test" }]
    : (
        await env.DB
          .prepare("SELECT email, full_name FROM users WHERE email IS NOT NULL AND email <> '' ORDER BY created_at LIMIT 500")
          .all<Recipient>()
      ).results ?? [];

  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const firstName = (recipient.full_name ?? "").trim().split(/\s+/)[0] ?? "";
    if (await sendEmail(env, recipient.email, renderEmail({ appUrl, firstName }))) sent++;
    else failed++;
  }

  console.log(`Monthly check-in: ${sent} sent, ${failed} failed, ${recipients.length} recipients.`);
  return { recipients: recipients.length, sent, failed, skipped: null };
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCheckIn(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" || url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "estimo-monthly-email",
        configured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
        schedule: "00:00 UTC on the 17th of every month",
        manualTrigger: Boolean(env.RUN_TOKEN),
      });
    }

    if (url.pathname === "/run" && request.method === "POST") {
      if (!env.RUN_TOKEN || request.headers.get("x-run-token") !== env.RUN_TOKEN) {
        return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
      const to = url.searchParams.get("to") ?? undefined;
      return Response.json({ ok: true, ...(await runCheckIn(env, to ?? undefined)) });
    }

    return Response.json({ ok: false, error: "not_found" }, { status: 404 });
  },
};
