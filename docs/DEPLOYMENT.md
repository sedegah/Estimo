# Deployment: estimo.live on Vercel, api.estimo.live on Cloudflare

One domain, split by hostname. Cloudflare owns DNS; Vercel serves the Next.js site; a
Cloudflare Worker serves the data API; D1 stores rows and R2 stores images. The two halves
deploy independently and talk over HTTPS with an explicit CORS allow-list.

## Hostnames

| Host | Serves | Platform | DNS |
|---|---|---|---|
| `estimo.live` | the site (root) | Vercel | `A` from the Vercel Domains panel, **DNS only** |
| `www.estimo.live` | 308 redirect to the root | Vercel | `CNAME` from Vercel, **DNS only** |
| `api.estimo.live` | the data API worker | Cloudflare Worker custom domain | created by Cloudflare, do not add by hand |
| `clerk.estimo.live` | Clerk Frontend API | Clerk | `CNAME` from Clerk, as instructed there |

Grey-cloud (DNS only) on the Vercel records avoids two proxies and two TLS layers in front of
the same site. The Worker's custom domain is proxied by Cloudflare, which is what it wants.

## Environment

### Vercel (frontend)

| Variable | Value | When |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://estimo.live` | build |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` | build |
| `CLERK_SECRET_KEY` | `sk_live_…` | server |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/signin` | build |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/signup` | build |
| `NEXT_PUBLIC_ESTIMO_API_URL` | `https://api.estimo.live` | build |
| `ESTIMO_PDF_SECRET` | long random string | server |

`NEXT_PUBLIC_*` values bake into the bundle at build time; changing one needs a redeploy.
The code defaults to `https://api.estimo.live` in production and to the workers.dev address
in development, so a local build works before the custom domain exists.

### Worker (`estimo-api`)

Bindings and secrets: `DB` (D1 `estimo`), `IMAGES` (R2), `CLERK_PUBLISHABLE_KEY`,
`DB_PEPPER`, optionally `ADMIN_CLERK_PUBLISHABLE_KEY`, `ADMIN_USER_IDS`, and
`ALLOWED_ORIGINS` (comma-separated). Without `ALLOWED_ORIGINS` the worker allows
`https://estimo.live`, `https://www.estimo.live`, `http://localhost:*` and
`https://*.vercel.app` previews, and echoes the calling origin back.

## Steps

1. **DNS**: add `estimo.live` to Cloudflare; replace the registrar nameservers; keep existing
   MX/TXT records.
2. **Vercel**: project → Settings → Domains → add `estimo.live` and `www.estimo.live`; copy the
   exact records Vercel shows into Cloudflare as **DNS only**; set `www` to redirect to the
   root (the app also 308s `www` in `next.config.ts`, so both layers agree).
3. **Worker custom domain**: Workers & Pages → `estimo-api` → Settings → Domains & Routes →
   Add → Custom Domain → `api.estimo.live`. Cloudflare creates the record and the certificate.
4. **Secrets**: set them with `wrangler secret put …` (never in `wrangler.jsonc`).
5. **Vercel env**: add the table above, then redeploy.
6. **Verify** (PowerShell):

```powershell
nslookup estimo.live
nslookup www.estimo.live
nslookup api.estimo.live
curl.exe -i https://api.estimo.live/health
curl.exe -i https://api.estimo.live/catalogue
curl.exe -i -X OPTIONS https://api.estimo.live/estimates `
  -H "Origin: https://estimo.live" -H "Access-Control-Request-Method: GET"
```

Expected: `health` returns `{"ok":true,…}`; `catalogue` returns items; the preflight returns
`204` with `Access-Control-Allow-Origin: https://estimo.live` and `Vary: Origin`. A request
from an unlisted origin gets no `Access-Control-Allow-Origin` header at all.

## Why not one host

`estimo.live/api/*` can be routed to the Worker by a Cloudflare rule, but a separate
`api.` subdomain keeps the cache rules, certificates and deploy pipelines independent: a
Worker deploy never touches the site, and a Vercel rollback never affects the API.

## Consolidating the Workers (optional)

The monthly-email worker (`worker/index.ts`) can join the data worker: move its `scheduled`
and `/run` handlers into `worker/api/index.ts`, add the `RESEND_API_KEY`, `EMAIL_FROM`,
`APP_URL` and `RUN_TOKEN` secrets, and add a cron trigger to the same config
(`"0 0 17 * *"`). That leaves one Cloudflare service plus D1 and R2.
