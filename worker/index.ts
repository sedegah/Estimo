/**
 * ESTIMO monthly check-in worker.
 *
 * Runs on a cron trigger at 00:00 UTC on the 17th of every month, reads the
 * account emails from D1 and sends the branded check-in email through Resend.
 *
 * Required secrets:
 *   RESEND_API_KEY  — API key from resend.com
 *   EMAIL_FROM      — verified sender, e.g. "ESTIMO <hello@yourdomain.com>"
 *   APP_URL         — public site URL, e.g. https://yourdomain.com
 */

type Env = {
  DB: D1Database;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  APP_URL?: string;
};

type Recipient = { email: string; full_name: string | null };

const SUBJECT = "A quick check-in from ESTIMO";

function renderEmail({ appUrl, firstName }: { appUrl: string; firstName: string }): string {
  const safeName = firstName || "there";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${SUBJECT}</title></head>
<body style="margin:0;padding:0;background:#f1f2ee;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">A quiet nudge from ESTIMO - pick up an estimate, check a price, or start something new.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f2ee;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e4dc;border-radius:14px;font-family:'Bricolage Grotesque',-apple-system,'Segoe UI',Arial,sans-serif;">
<tr><td style="padding:28px 32px 22px;"><a href="${appUrl}" style="text-decoration:none;"><img src="${appUrl}/brand/estimo-logo-horizontal-light.png" width="150" height="34" alt="ESTIMO" style="display:block;border:0;width:150px;height:auto;"></a></td></tr>
<tr><td style="padding:0 32px;"><div style="height:1px;background:#eceee6;line-height:1px;font-size:0;">&nbsp;</div></td></tr>
<tr><td style="padding:28px 32px 4px;">
<p style="margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8a94a3;font-weight:700;">Monthly check-in</p>
<h1 style="margin:0 0 14px;font-size:30px;line-height:1.1;letter-spacing:-.02em;color:#0b1f3f;font-weight:800;">Still planning that job?</h1>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#5f6b7a;">Hello ${safeName}, it is the 17th - a good moment to look at what you are working on. Your saved estimates are exactly where you left them, and material prices are one search away.</p>
</td></tr>
<tr><td style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf9f5;border:1px solid #eceee6;border-radius:10px;"><tr><td style="padding:18px 20px;">
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#0b1f3f;"><strong>Pick up an estimate.</strong>&nbsp;<a href="${appUrl}/projects" style="color:#0b1f3f;text-decoration:underline;">Open your saved projects</a></p>
<p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:#0b1f3f;"><strong>Check a price.</strong>&nbsp;<a href="${appUrl}/catalogue" style="color:#0b1f3f;text-decoration:underline;">Search the catalogue</a></p>
<p style="margin:0;font-size:14px;line-height:1.5;color:#0b1f3f;"><strong>Start something new.</strong>&nbsp;<a href="${appUrl}/quick-estimate?template=HOME-2B" style="color:#0b1f3f;text-decoration:underline;">Begin an estimate</a></p>
</td></tr></table></td></tr>
<tr><td style="padding:24px 32px 6px;">
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5f6b7a;">No action needed if everything is on track. If something changed on site, a fresh estimate takes a couple of minutes.</p>
<a href="${appUrl}/dashboard" style="display:inline-block;background:#f5b301;color:#0b1f3f;font-size:15px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:8px;">Open your dashboard</a>
</td></tr>
<tr><td style="padding:22px 32px 10px;"><p style="margin:0;font-size:14px;line-height:1.6;color:#5f6b7a;">- The ESTIMO team</p></td></tr>
<tr><td style="padding:20px 32px;background:#faf9f5;border-top:1px solid #eceee6;border-radius:0 0 14px 14px;"><p style="margin:0;font-size:12px;line-height:1.6;color:#8a94a3;">ESTIMO &middot; Ghana electrical estimates<br><a href="${appUrl}" style="color:#5f6b7a;text-decoration:none;">${appUrl}</a><br>You receive this once a month because you have an ESTIMO account. <a href="${appUrl}/settings" style="color:#5f6b7a;">Manage emails</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail(env: Env, to: string, html: string, subject: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
  });
  if (!response.ok) {
    console.error("Resend rejected", to, response.status, await response.text().catch(() => ""));
    return false;
  }
  return true;
}

async function sendMonthlyCheckIn(env: Env): Promise<void> {
  const appUrl = env.APP_URL ?? "https://estimo.app";

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.warn("Monthly check-in skipped: RESEND_API_KEY or EMAIL_FROM is not set.");
    return;
  }

  const { results } = await env.DB
    .prepare("SELECT email, full_name FROM users WHERE email IS NOT NULL AND email <> '' LIMIT 500")
    .all<Recipient>();

  let sent = 0;
  for (const recipient of results ?? []) {
    const firstName = (recipient.full_name ?? "").trim().split(/\s+/)[0] ?? "";
    const html = renderEmail({ appUrl, firstName });
    if (await sendEmail(env, recipient.email, html, SUBJECT)) sent++;
  }
  console.log(`Monthly check-in sent to ${sent} of ${(results ?? []).length} accounts.`);
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendMonthlyCheckIn(env));
  },

  async fetch(_request: Request, env: Env): Promise<Response> {
    return Response.json({
      ok: true,
      service: "estimo-monthly-email",
      configured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
      schedule: "00:00 UTC on the 17th of every month",
    });
  },
};
