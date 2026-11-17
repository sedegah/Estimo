# ESTIMO production runbook

Everything needed to run, deploy and support ESTIMO. Read the status section first; it says what is
genuinely production-grade today and what is not.

## 1. Status

| Area | State | Notes |
| --- | --- | --- |
| Estimating website | Deployed | Content, catalogue, estimator, projects, PDF |
| Data API worker | Deployed | `estimo-api`, D1 binding, token verification |
| Catalogue and prices | Working | 122 seeded materials; prices move console → database → website |
| Admin console | Built and shippable | Windows installer, per-user, self-updating |
| Console authentication | Working on development instance | Separate Clerk app, test keys |
| Website authentication | Working on development instance | Test keys |
| Production Clerk | Not done | Needs a production instance and a customer-owned domain |
| Code signing | Not done | Installer signed with a local certificate; SmartScreen still warns |
| Monthly email worker | Deployed, dormant | Needs a provider key and verified sender |

Anything described above as development or not done must not be presented as production-ready.

## 2. Accounts and access

| Service | Used for | Who needs it |
| --- | --- | --- |
| Cloudflare | D1 database, both workers | Owner account with D1 and Workers edit |
| Clerk | Authentication for both applications | Owner account, two applications |
| GitHub | Source, release assets for updates | Repository admin |
| Vercel | Website hosting | Project admin |
| Email provider | Monthly check-in | Billing account, verified sender |

## 3. Environment variables

### Website (root `.env`, also set in Vercel)

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL used in metadata |
| `NEXT_PUBLIC_APP_ENV` | Label returned by `/api/health` |
| `NEXT_PUBLIC_APP_VERSION` | Version returned by `/api/health` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Customer Clerk app, public |
| `CLERK_SECRET_KEY` | Customer Clerk app, server side |
| `NEXT_PUBLIC_ESTIMO_API_URL` | Base URL of the data API |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account (tooling only) |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 database id (tooling only) |

`.env` is ignored by git. All reads go through `lib/env.ts`, which is the only place `process.env` is
touched in the website.

### Admin application (`admin/.env`)

| Variable | Meaning |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Admin Clerk app, public |
| `CLERK_SECRET_KEY` | Admin Clerk app, server side |
| `NEXT_PUBLIC_ESTIMO_API_URL` | Same data API |

The publishable key is also baked into the packaged server as a fallback, because a stand-alone build has
no `.env` at runtime.

### Data API worker

Vars: `ADMIN_USER_IDS` (comma-separated Clerk user ids, optional allowlist),
`ADMIN_CLERK_PUBLISHABLE_KEY`. Secrets: `CLERK_PUBLISHABLE_KEY`, `DB_PEPPER`.

`DB_PEPPER` must never change after data exists: `owner_key` is derived from it, so a new pepper
disconnects every stored row from its owner.

### Monthly email worker

`RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, `RUN_TOKEN`.

## 4. Clerk setup

Two applications, both currently development instances:

1. **Estimo** (customer). Password sign-in enabled, sign-in code enabled, phone disabled, Google disabled
   until real OAuth credentials exist. Password minimum 8.
2. **Estimo Admin** (staff). Separate users; used only by the console.

For each application, set the sign-in and sign-up URLs to the relevant host (`/signin`, `/signup` on the
website; the admin app signs in in place).

### Moving to production

1. Create a production instance for each application in the Clerk dashboard.
2. Attach a domain you control, or use Clerk's production domain, and complete DNS verification.
3. Copy the live publishable and secret keys into `.env` (website), `admin/.env` (console) and the worker
   (`CLERK_PUBLISHABLE_KEY`); also update `ADMIN_CLERK_PUBLISHABLE_KEY`.
4. Rebuild the console so the live publishable key is baked in.
5. Sign in once on each side and confirm `/whoami` returns the expected user.

## 5. Cloudflare setup

### Database

```
wrangler d1 create estimo
```

Apply migrations in order:

```
wrangler d1 execute estimo --file lib/db/migrations/0002_owner_keys.sql --remote
wrangler d1 execute estimo --file lib/db/migrations/0003_counts_json.sql --remote
wrangler d1 execute estimo --file lib/db/migrations/0004_catalogue.sql --remote
wrangler d1 execute estimo --file lib/db/migrations/0005_project_templates.sql --remote
wrangler d1 execute estimo --file lib/db/seed-catalogue.sql --remote
```

`lib/db/seed-catalogue.sql` is generated from `lib/data/catalogue.ts` by `tools/seed-catalogue.mjs` and is
idempotent (`ON CONFLICT DO UPDATE`).

### Data API worker

Create `worker/api/wrangler.toml` (not committed, because it holds account ids):

```toml
name = "estimo-api"
main = "index.ts"
compatibility_date = "2026-11-16"

[[d1_databases]]
binding = "DB"
database_name = "estimo"
database_id = "<id from d1 create>"

[vars]
ADMIN_USER_IDS = "<clerk user id>"
ADMIN_CLERK_PUBLISHABLE_KEY = "<admin publishable key>"
```

Then:

```
wrangler secret put CLERK_PUBLISHABLE_KEY --config worker/api/wrangler.toml
wrangler secret put DB_PEPPER --config worker/api/wrangler.toml
wrangler deploy --config worker/api/wrangler.toml
```

Verify: `GET /health` returns `{"ok":true,...}`, `GET /catalogue` returns 122 items, `GET /estimates`
without a token returns 401.

### Monthly email worker

`worker/wrangler.toml` with the same D1 binding plus `[triggers] crons = ["0 0 17 * *"]`. Deploy with
`wrangler deploy --config worker/wrangler.toml`. It stays dormant until `RESEND_API_KEY` and `EMAIL_FROM`
are set. Manual trigger: `POST /run` with header `x-run-token`.

## 6. Website deployment

Deploy the repository root to Vercel. Set the environment variables from section 3. The build runs
`next build`; routes are dynamic where they read search parameters, and the catalogue reads prices without
caching so a refresh always shows the current database values.

Health check: `/api/health` returns the environment label and version.

## 7. Admin console build and release

### Build

```
cd desktop
npm run vendor:admin      # copies admin/.next/standalone + static + public into desktop/vendor/admin
npx electron-builder --win --dir
node scripts/build-installer.mjs
```

`build-installer.mjs` reads the version from `package.json`, fills the NSIS script placeholders and calls
`makensis` from the electron-builder cache. Output:
`desktop/release/ESTIMO-Admin-Setup-<version>.exe`.

The installer script (`desktop/installer/estimo-admin.nsi`) provides: welcome page with brand graphic,
licence page, install-directory choice, progress, finish page with "Open ESTIMO Admin now", desktop and
Start-menu shortcuts, Apps and Features entry with version and size, and a working uninstaller. It is
per-user (`RequestExecutionLevel user`), so no administrator rights are needed.

### Publish an update (over the air)

1. Bump `version` in `desktop/package.json`.
2. Rebuild the installer.
3. Create a GitHub release tagged with that version and attach the installer:

```
gh release create v1.1.5 desktop/release/ESTIMO-Admin-Setup-1.1.5.exe \
  --repo sedegah/Estimo --title "ESTIMO Admin 1.1.5" --notes "..."
```

4. Installed consoles find it on launch (six seconds after the window opens) or from
   **Admin → Check for updates**, download it and run it with `/S`, which installs in place: no wizard,
   shortcuts preserved, user data untouched.

### Rollback

GitHub releases are immutable enough for rollback by deleting the newer release. Because the updater only
moves forward (`compareVersions`), a rollback needs either a higher version number with the old build, or
a manual reinstall of the earlier installer.

### Signing

The current build is signed with a locally generated certificate. It is tamper-evident, but Windows does
not trust the chain, so SmartScreen still warns. With a purchased certificate:

```
$env:CSC_LINK = "C:\path\to\certificate.pfx"
$env:CSC_KEY_PASSWORD = "password"
cd desktop
npm run dist
```

EV certificates clear SmartScreen immediately; OV certificates build reputation over downloads.

### Testing the updater without publishing

Serve a folder containing the new installer and a `latest.json`:

```json
{ "version": "1.2.0", "url": "http://127.0.0.1:9099/ESTIMO-Admin-Setup-1.2.0.exe" }
```

Run the installed app with `ESTIMO_UPDATE_FEED=http://127.0.0.1:9099/latest.json` and
`ESTIMO_UPDATE_AUTO=1`. It downloads the file and installs it silently.

## 8. Manual acceptance checklist

Website:

- Home renders with the floor plan and recent projects.
- Catalogue lists 122 materials, pagination shows 1–40 of 122, page 2 shows 41–80.
- A material with no price shows `Pending`; a published price shows `GHS <value>` after a refresh.
- Estimator completes and the estimate total matches the summary.
- PDF downloads with the system typeface embedded.
- Signed-in estimates survive a refresh and appear on another device.

Console:

- Sign-in completes and lands on Prices.
- Editing a price, publishing, and refreshing the website shows the new value.
- Import CSV with `name,price` rows populates drafts; Export downloads CSV.
- Materials: adding an item with a blank unit is allowed; unit edit saves.
- Builder: each preset draws a different plan; placement, dragging and erasing work; Save project
  reports success; Download estimate returns a PDF.

Desktop:

- Installer runs without administrator rights and creates shortcuts.
- App opens, signs in, and the window has no horizontal scrollbar.
- Uninstall removes the program and leaves data alone.

## 9. Monitoring

- Worker logs: `wrangler tail estimo-api`, `wrangler tail estimo-monthly-email`.
- Website: Vercel build and function logs. `/api/health` for liveness.
- Database: `wrangler d1 execute estimo --command "SELECT COUNT(*) FROM catalogue_prices" --remote`
  to confirm prices are arriving.

## 10. Backup and restore

D1 export:

```
wrangler d1 export estimo --remote --output backup-$(date +%F).sql
```

Restore into a fresh database with `wrangler d1 execute <db> --file backup.sql --remote`, then re-point the
worker binding. Test a restore before you need one.

## 11. Troubleshooting

| Symptom | Likely cause | Action |
| --- | --- | --- |
| `401 unauthorized` from the API | No token, or token from the wrong Clerk application | Sign in again; check which key the path verifies against |
| `403 forbidden` in the console | Account not in `ADMIN_USER_IDS` and admin-key check not satisfied | Add the Clerk user id to the worker var and redeploy |
| Prices stay `Pending` on the site | No `catalogue_prices` row, or the API URL is wrong | Check `GET /catalogue` directly; confirm `NEXT_PUBLIC_ESTIMO_API_URL` |
| Console shows a blank window | Bundled server failed to start | Open the app's user data folder, check logs; verify `resources/admin/server.js` exists |
| Installer will not finish | Old running app/installer, or disk permissions | Close both, rerun the current build; the wizard no longer performs a running check |
| Sign-in appears to succeed but stays on the form | Session not finalised | The console uses Clerk's own sign-in; if it recurs, check the Clerk instance keys |
| Update never arrives | No release, or tag version not higher | Publish a release whose tag is above the installed version |
| `DB_PEPPER` changed | Owner hashes no longer match | Restore the previous pepper; data is otherwise unreachable |

## 12. Decisions worth remembering

- D1 has no row-level security; the worker is the only enforcement point.
- The console is a separate application and separate Clerk pool, not an admin route on the website.
- The installer script is ours, not electron-builder's, because its running-app gate blocked installs.
- Prices are append-only observations; nothing is overwritten, so history is auditable.
- No price is invented: absence is displayed as pending.

## 13. Remaining work

- Production Clerk instances and a domain, for both applications.
- A code-signing certificate.
- Website starting an estimate from a saved console template.
- Import CSV supporting supplier-specific layouts.
- Emails: provider key and verified sender for the monthly check-in.

## 14. Database recovery

The database holds prices, customer estimates, project templates and the admin audit trail. Losing it
without a recovery path would be the most serious failure in the system, so this section is deliberately
concrete and records what has actually been exercised.

### What protects the data

| Layer | What it gives | Where it lives |
| --- | --- | --- |
| D1 Time Travel | Point-in-time restore of the live database, 30 day window | Cloudflare, per database |
| Scheduled export | A SQL dump produced by the operator and kept off the machine | Operator machine or storage |
| Manual export | Ad hoc dump before risky work | Operator machine |
| Append-only prices | Price history cannot be lost by an edit | `catalogue_prices` rows |

Recovery objectives assumed here: a restore point no older than 24 hours in the worst case (nightly
export), or to the minute when Time Travel is used. Time to restore is minutes, not hours, because D1
restores in place or into a fresh database without a server to rebuild.

### Backup schedule

- **Nightly**: the operator runs `wrangler d1 export estimo --remote` and stores the dump somewhere safe (an external drive, a private folder). No paid service is used.
- **Before a migration or a bulk import**: run the export manually and keep the file outside the
  repository.
- **Monthly**: restore one of those dumps (procedure below) and confirm the counts, because an untested backup is an assumption, not a backup.

Keep the dump files out of the repository: they contain customer estimates. A forgotten backup is worse than none, so put the nightly run in your own calendar.

### Restore procedure A: point in time (preferred)

Use when bad data was written and the moment is known.

```
wrangler d1 time-travel info estimo --remote          # current bookmark and timestamp
wrangler d1 time-travel restore estimo --timestamp "2026-11-16T14:00:00Z" --remote
```

A bookmark is captured automatically before a restore, so the restore itself can be undone with
`--bookmark <value>` if the wrong moment was chosen.

### Restore procedure B: from a dump into a new database

Use when the live database is damaged beyond a point restore, or when rehearsing.

```
wrangler d1 create estimo-restored
wrangler d1 execute estimo-restored --file backup.sql --remote
wrangler d1 execute estimo-restored --command "SELECT COUNT(*) FROM catalogue_items; SELECT COUNT(*) FROM catalogue_prices;" --remote
```

Then point `database_id` in `worker/api/wrangler.toml` at the new database, redeploy the worker, and
confirm `GET /catalogue` and a price read from the console before deleting the old database.

### Restore procedure C: same database

`wrangler d1 execute estimo --file backup.sql --remote` works, but only after clearing existing tables
(the dump contains plain inserts). Prefer procedure B: it keeps the damaged database intact for
inspection.

### Migration rollback

Migrations are **forward-only**. There is no automatic down migration, by design, because dropping a
column in production can destroy data that the code has already written.

The policy is:

1. Never edit an applied migration. Add a new file under `lib/db/migrations`.
2. If a migration is wrong, write a compensating migration that reverses the change safely (drop the
   added index, add back a removed column as nullable, and so on).
3. If data was corrupted, restore with Time Travel to the moment before the migration, then re-apply the
   corrected migration.
4. Record the migration name, the bookmark before it, and the reason in the release notes so the next
   person has the timestamp they need.

### Verified on 17 November 2026

The backup and restore path was executed end to end, not just documented:

- `wrangler d1 export estimo --remote` produced a 55,184 byte dump.
- A fresh database `estimo-restore-test` was created and the dump imported.
- Counts in the restored copy matched the live database: `catalogue_items` 122, `catalogue_prices` 9,
  `estimates` 4, `project_templates` 0.
- The scratch database was then deleted.

That exercise should be repeated whenever the schema changes, and the result noted here.

### What is not automated yet

- Restores are manual. Automating a restore rehearsal monthly is the obvious next step.
- There is no automatic reminder yet; the nightly export depends on someone running it.
- No off-site copy beyond wherever the operator stores the dump.

## 15. Automated testing

Two suites exist today, both runnable locally:

| Suite | Command | Needs |
| --- | --- | --- |
| Unit | `npm test` | Node 24 only |
| Integration | `npm run test:integration` | The website running and network access to the API |

There is no continuous integration service enabled (it is not worth the bill for this project). Run `npm test` and `npm run typecheck` before pushing, and `npm run test:integration` before a release.

### Coverage against the six critical behaviours

| Behaviour | How it is checked | Kind |
| --- | --- | --- |
| Cross-account data isolation | `tests/storage-reset.test.ts`: a different account clears local data, signing out clears it, first sign-in keeps guest work. Server-side isolation is enforced by `owner_key` filtering and covered by the 401 checks below; a two-account test with real sessions remains manual. | Unit + manual |
| Admin-only price modification | `tests/integration.mjs`: `POST /admin/catalogue/prices` and `POST /admin/templates` without a token return 401. The 403 path is exercised manually by signing in as a non-admin staff account. | Integration + manual |
| Estimate calculation accuracy | `tests/estimate-model.test.ts`: the two-bedroom anchor equals GH₵16,800, quality increases the total monotonically, adding a room increases the total, and every one of the nine project types gives a positive total whose lines sum to the total within 2%. | Unit |
| PDF output correctness | `tests/integration.mjs`: the PDF route returns 200, `application/pdf`, a body beginning `%PDF`, and more than 10 KB (which proves the typeface is embedded). Page structure is generated by one shared builder, covered by the same check for both the website and the console. | Integration |
| Desktop installation and updating | Manual, with a written checklist in section 8. The installer is our own NSIS script; the updater can be exercised without publishing via `ESTIMO_UPDATE_FEED` and `ESTIMO_UPDATE_AUTO=1`. Automating this needs a Windows machine and is not done. | Manual |
| Recovery when the API is unavailable | `tests/catalogue-prices.test.ts`: a failing fetch yields an empty price map and the page degrades to `Pending` instead of erroring; non-numeric values are discarded. | Unit |

### What the suites do not cover

- Two real Clerk sessions proving account A cannot read account B's estimates end to end. The
  mechanism is tested in pieces; the full path needs a seeded pair of accounts.
- Visual regressions. Layout is checked by eye against the artboards.
- The installer and updater as a single automated run.
- Load and rate-limit behaviour of the API.

### Extending the suites

Add a file under `tests/` for unit work; it is picked up by `npm test` if listed in the script, so add
the name there. For endpoint work, extend `tests/integration.mjs`: each `check(name, fn)` becomes one
line in the report, and the script exits non-zero when anything fails, which is what a pre-release check needs.
