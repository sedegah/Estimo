# Authentication in production (estimo.live)

Clerk runs on the production instance whose Frontend API is `clerk.estimo.live`. The app
reads no keys from code: everything comes from the environment, so a build with no keys
stays a working guest-only site instead of signing everyone into the wrong instance.

## Environment (Vercel → Project → Settings → Environment Variables)

| Name | Value | Scope |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://estimo.live` | all |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` from the Clerk dashboard | all |
| `CLERK_SECRET_KEY` | `sk_live_…` from the Clerk dashboard | server only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/signin` | all |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/signup` | all |
| `NEXT_PUBLIC_ESTIMO_API_URL` | `https://estimo-api.sedegahkimathi.workers.dev` | all |
| `ESTIMO_PDF_SECRET` | a long random string | server only |

`NEXT_PUBLIC_*` values are compiled into the client bundle, so they must be present **at
build time**; changing them needs a redeploy. The secret key is read by the Clerk SDK and
by the data-API token verification; it must never be prefixed with `NEXT_PUBLIC_`.

## Clerk dashboard checklist

1. **Domains**: `estimo.live` is the application domain; `clerk.estimo.live` is the Frontend
   API (CNAME as Clerk instructs). Both must show as verified.
2. **Paths**: sign-in `/signin`, sign-up `/signup`, after sign-in `/dashboard`, after sign-up
   `/dashboard`, after sign-out `/`.
3. **Allowed origins / redirect URLs**: `https://estimo.live`, `https://www.estimo.live`
   (if used), and `http://localhost:3000` for development.
4. **Social connections** (if used): the OAuth callback is `https://estimo.live/sso-callback`.

## How the app behaves

- Public pages never load Clerk unless there is a session cookie, so guests get no auth JS.
- `/dashboard`, `/estimates`, `/projects` and `/settings` are protected by `middleware.ts`;
  a visitor is sent to `/signin?redirect_url=…` and brought back after signing in.
- Sign-out clears the Clerk session, wipes this browser's copy of the account's data and
  returns to `/`.
- A browser with no keys (local development) runs guest-only: saving works to localStorage,
  `/saved` lists it, and the app shell does not mount Clerk at all.

## Verify after deploying

1. `https://estimo.live/signin` shows the Clerk card (not "Authentication is not configured").
2. Visiting `/dashboard` while signed out lands on `/signin?redirect_url=%2Fdashboard`, and
   signing in returns to `/dashboard`.
3. The header shows **Sign in** when signed out and **Dashboard** + the user button when in.
4. Settings → Sign out returns to `/` and `/dashboard` is protected again.
5. `https://estimo.live/.well-known/` is not needed; Clerk's proxy is the CNAME above.
