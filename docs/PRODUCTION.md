# Production checklist (Clerk + hosting)

The app currently runs against the **Clerk development instance** (`pk_test_…`). Clerk's
"Development mode" badge disappears only after a **production instance** exists, and that
requires a domain you control. A hosting-provider URL such as `*.vercel.app` is rejected
by Clerk for production.

## 1. What is already done

- Clerk app linked to this repository and claimed by the owner account.
- `auth_password.min_length` set to `8` (Clerk's minimum; `6` is not accepted by the schema).
- Phone number authentication disabled (`auth_phone` has no sign-up, sign-in, or second-factor use).
- Google OAuth disabled, because no Google `client_id` / `client_secret` has been provided.
- Sign-in and sign-up use Clerk's hosted components; there is no local/auto session code.

## 2. Create the production instance

Ask the owner for a domain whose DNS they can edit, then run from the project root:

```bash
npx -y clerk@latest deploy --mode agent --domain <your-domain>
```

The command prints a JSON report. Add the DNS records it lists at the registrar, then:

```bash
npx -y clerk@latest deploy status --mode agent
```

`complete: true` means the production instance and domain are verified. Progress can also be
checked with:

```bash
npx -y clerk@latest deploy status --mode agent
```

## 3. Switch the app to production keys

Once the production instance exists, copy the production keys to the host (and to `.env` for
local production builds):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…
CLERK_SECRET_KEY=sk_live_…
NEXT_PUBLIC_APP_ENV=production
```

Never commit `.env` (it is git-ignored); add the same variables in the hosting dashboard.

## 4. Re-enable optional providers (only when configured)

Google OAuth needs a Google Cloud OAuth client. Create one, then enable it in Clerk:

```bash
npx -y clerk@latest config patch --json '{"connection_oauth_google":{"enabled":true,"client_id":"…","client_secret":"…"}}'
```

Only run this once real credentials exist — an enabled provider without credentials lets users
click "Continue with Google" and fail before authentication.

## 5. Verify

```bash
npm run typecheck
npm run build
npm start
```

Check `/signin`, `/signup`, and that the header shows **Dashboard** once signed in.
