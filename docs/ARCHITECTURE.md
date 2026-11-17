# ESTIMO architecture

This document describes how the ESTIMO system is put together today: the customer website, the private
admin console, the Cloudflare data API, and the shared database. It is written to be read by whoever
maintains the system next.

## 1. What the system is for

ESTIMO produces a first electrical estimate for a building in Ghana. A person picks the closest building
type, counts the rooms, chooses a fitting quality, and receives a cost breakdown (cables and conduit,
sockets and switches, light fittings, distribution board and breakers, earthing, labour). Materials can
be looked up and added to a basket. Estimates and projects can be saved and exported as PDF.

A second, private application lets the ESTIMO team maintain the material catalogue and its prices.
Prices are the one thing that must not be invented, so they are kept in a database that only staff can
write to, and the website reads from it.

## 2. System context

```
                 ┌──────────────────────────┐
   customers ───►│  Estimating website       │──┐
                 │  (Next.js, hosted)        │  │  HTTPS   ┌──────────────────┐
                 └──────────────────────────┘  ├─────────►│ estimo-api worker │
                                               │          │ (Cloudflare)      │
                 ┌──────────────────────────┐  │          └────────┬─────────┘
   staff ───────►│  Admin console (desktop)  │──┘                   │ D1 binding
                 │  Electron + local server  │                      ▼
                 └──────────────────────────┘          ┌──────────────────────────┐
                                                       │ Cloudflare D1 "estimo"    │
                 ┌──────────────────────────┐          │ catalogue, prices,        │
   monthly  ────►│  Email worker (cron)      │─────────►│ estimates, templates      │
   email         └──────────────────────────┘  reads   └──────────────────────────┘
```

Three deployed pieces and one desktop app:

| Piece | Technology | Hosted where |
| --- | --- | --- |
| Estimating website | Next.js 15 App Router, React 19, hand-written CSS | Vercel |
| Data API | Cloudflare Worker with a D1 binding | Cloudflare (`estimo-api`) |
| Monthly email | Cloudflare Worker with cron trigger | Cloudflare (`estimo-monthly-email`) |
| Admin console | Electron shell + bundled Next server | Windows installer, per user |

## 3. Repository layout

```
app/                     website routes (public and signed-in)
  (app)/                 signed-in shell: dashboard, estimates, projects, settings
  catalogue/             public catalogue list and material detail
  quick-estimate/        estimator setup (spaces, quality)
  estimate/              the estimate result, save and PDF
  api/health/            liveness endpoint
  api/estimates/pdf/     PDF route for the website
components/              shared UI (shell, header, catalogue, estimate, admin)
lib/                     domain logic, storage adapters, API clients, PDF
lib/db/                  schema, migrations, seed SQL
lib/data/catalogue.ts    generated material library (122 items)
styles/                  global, home, pages, auth, shell, admin, brand CSS
public/                  fonts, brand assets
worker/api/              the data API worker (estimates, catalogue, prices, templates)
worker/                  the monthly email worker
admin/                   the separate admin Next application
desktop/                 Electron shell, NSIS installer script, updater
tools/                   maintenance scripts (catalogue build, seeds, encoding repair)
docs/                    this document and the production runbook
emails/                  branded HTML email templates (Clerk)
assets/brand/            the official logo pack
```

## 4. The estimating website

### Routes

| Route | Renders |
| --- | --- |
| `/` | Hero, floor-plan artwork, recent projects, calls to action |
| `/catalogue` | Searchable material list with prices and category chips, paginated 40 per page |
| `/catalogue/[materialId]` | One material: specification, price, add to estimate |
| `/quick-estimate` | Project type, spaces accordion with steppers, quality cards, live summary |
| `/estimate` | Estimate lines, total, save, download PDF, adjust |
| `/estimate-basket` | Basket of materials selected from the catalogue |
| `/dashboard` | Welcome, tiles, current draft estimate, plan key |
| `/estimates` | All estimates with status filters |
| `/projects` | Saved projects, search, delete |
| `/projects/[id]` | Reopen a saved project and adjust its selections |
| `/settings` | Account note, currency and unit preferences |
| `/signin`, `/signup`, `/sso-callback` | Clerk authentication |
| `/api/health` | Service status JSON |
| `/api/estimates/pdf` | Generates the estimate PDF |

`next.config.ts` redirects legacy paths (`/sign-in`, `/sign-up`, `/catalog`, `/saved`, `/home`).

### Estimation model

`lib/estimate-model.ts` defines nine project types, each with a label, code and a list of space fields
(room kinds) and their item lines:

| Code | Project |
| --- | --- |
| HOME-1R | Single room |
| HOME-1B / 2B / 3B / 4B | Homes by bedroom count |
| SHOP-KIOSK | Container kiosk |
| SHOP-RETAIL | Retail shop |
| COMM-OFF-S | Small office |
| IND-WORK | Workshop |

Each space field carries an item list (lights, sockets, switches, AC points, heater points, cooking
points) with quantities and units. `computeEstimate` combines counts, site complexity and the fitting
quality (basic / standard / premium) into a total using calibration anchors, for example a two-bedroom
home anchoring at GH₵16,800. `estimateLines` derives the display lines and their share of the total.
These figures are planning assumptions, not supplier prices, and are labelled as such in the UI and PDF.

### Prices on the website

`lib/api/catalogue-prices.ts` calls the data API `GET /catalogue` with `cache: "no-store"` and returns a
map of material id to price. The catalogue view renders `GHS <price>` when a price exists and `Pending`
otherwise. No price is invented, and there is no fallback to bundled prices.

### PDF

`app/api/estimates/pdf/route.ts` recomputes the estimate from query parameters and builds an A4 document
with pdf-lib from `lib/pdf/estimate-document.ts`. The system typeface (Bricolage Grotesque, static 400
and 800 instances) is embedded from `public/fonts`; `outputFileTracingIncludes` keeps those files with
the route in the deployment bundle.

### Local data

`lib/storage/{basket,saved-estimates,draft,preferences}.ts` wrap `localStorage` and emit change events so
the header badge and lists stay in step. `lib/storage/reset.ts` records the signed-in account as
`estimo_owner_v1`; signing in with a different account, or signing out, clears local data. Signed-in
estimates are mirrored to D1 through `lib/api/estimates.ts`, and a sign-in pulls the account's list back
down (`components/auth/session-guard.tsx`).

## 5. Authentication

Two Clerk applications:

| Application | Used by | Notes |
| --- | --- | --- |
| Estimo | Website customers | Password and sign-in code; phone disabled |
| Estimo Admin | Console staff | Separate account pool, separate sign-in screen |

Both are development instances with test keys at the time of writing.

Session tokens are RS256. The website relies on Clerk middleware for session refresh. The data API
verifies tokens itself: it decodes the token header, fetches the JWKS for the relevant Clerk frontend API
(derived from the publishable key), verifies the signature and checks `exp`/`nbf` with 30 seconds of
skew. `/admin/*` paths verify against the admin publishable key, everything else against the customer key.

Ownership: `owner_key = SHA-256(DB_PEPPER + ":" + clerk_user_id)`. Raw Clerk ids are not stored as the
isolation key, and every row-scoped query filters by it. `ADMIN_USER_IDS` provides an optional additional
allowlist on top of the admin key.

## 6. The data API worker

Source: `worker/api/index.ts`. Binding: `DB` (D1). Vars: `ADMIN_USER_IDS`, `ADMIN_CLERK_PUBLISHABLE_KEY`.
Secrets: `CLERK_PUBLISHABLE_KEY`, `DB_PEPPER`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | none | Service name and configuration flags |
| GET | `/catalogue` | none | All active materials with latest price |
| GET | `/whoami` | session | Current user id and admin flag |
| GET | `/estimates` | session | The caller's estimates |
| POST | `/estimates` | session | Create (client-supplied id accepted) |
| PATCH | `/estimates/:id` | session | Update name, quality, counts, total, status |
| DELETE | `/estimates/:id` | session | Delete own estimate |
| GET | `/admin/templates` | admin | Saved builder plans |
| POST | `/admin/templates` | admin | Save or update a plan |
| POST | `/admin/catalogue/items` | admin | Add a material |
| PATCH | `/admin/catalogue/items/:id` | admin | Rename, re-unit, deactivate |
| POST | `/admin/catalogue/prices` | admin | Append a price observation |
| POST | `/admin/services/prices` | admin | Append a service price |

Responses are JSON with `ok` and either data or an `error` string. All admin writes also append to
`admin_audit` with the actor's owner key.

## 7. Database

Cloudflare D1 (SQLite). Migrations in `lib/db/migrations`:

| Migration | Adds |
| --- | --- |
| `0002_owner_keys.sql` | `owner_key` on estimates and saved projects, indexes |
| `0003_counts_json.sql` | editable selections on estimates |
| `0004_catalogue.sql` | catalogue items, prices, service prices, audit |
| `0005_project_templates.sql` | plans saved from the builder |

Table summary:

- `users` (id, owner-derived, email, name, role)
- `estimates` (id, user_id, owner_key, name, template, quality, spaces, total_ghs, status, counts_json,
  timestamps)
- `estimate_items` (estimate_id, label, quantity, unit, amount_ghs)
- `saved_projects` (id, user_id, owner_key, name, detail, total_ghs, created_at)
- `catalogue_items` (id, code, name, category, unit, spec, tier, relevance, keywords, active, timestamps)
- `catalogue_prices` (id, item_id, price_ghs, currency, source, note, effective_from, updated_by)
- `service_prices` (id, service_code, name, unit, price_ghs, note, updated_by)
- `project_templates` (id, name, preset, plan_json, totals_json, timestamps)
- `admin_audit` (id, actor_key, action, entity, entity_id, detail, created_at)

D1 has no row-level security. Isolation is enforced by the worker, not by the database, and that must
remain true for every new query.

## 8. The admin console

`admin/` is a second Next.js application with its own Clerk key, its own styles and its own port
(3001 in development). Screens:

- **Prices** — search, category chips, per-row price inputs (digits and one decimal separator only),
  live change percentage, status pill, draft panel with publish and discard, pagination 20 rows.
  Import CSV reads `id` or `name` plus `price`; Export writes the current catalogue as CSV; Add item
  switches to Materials.
- **Materials** — add a material (name, category, unit, specification), edit units inline.
- **Estimate builder** — presets for all nine project types, a floor plan drawn per preset (one room for
  a single room, up to eight for a four-bedroom home), tool-based placement, drag to move, erase,
  counts and cost panel, Save project to `project_templates`, Download estimate as PDF.
- **Settings** — account and role, API target, sign out.

Sign-in uses Clerk's own `<SignIn />` inside the branded split panel; a hand-rolled form previously
authenticated but failed to finalise the session, which is why the prebuilt flow is used.

`admin/app/api/estimate-pdf/route.ts` builds the builder PDF with the same embedded typeface.

## 9. Desktop packaging and updates

`desktop/main.js`:

1. Finds a free loopback port.
2. Starts the bundled admin server (`resources/admin/server.js`) with `ELECTRON_RUN_AS_NODE=1`, the port,
   `HOSTNAME=127.0.0.1` and the admin Clerk publishable key.
3. Waits for the port to answer, then loads it in a 1440×920 window.
4. Kills the server process on quit.

A remote UI can be substituted by setting `ESTIMO_ADMIN_URL` or writing `{ "adminUrl": "..." }` into
`config.json` in the app's user data folder, which allows UI-only changes without shipping a new binary.

Packaging: `electron-builder --win --dir` produces `release/win-unpacked`, then a custom NSIS script
(`desktop/installer/estimo-admin.nsi`) compiles the installer. The script is deliberately our own: the
electron-builder NSIS wrapper contains a "close the running app" gate that false-positives on some
machines and blocked installation here.

Updater (`desktop/updater.js`): reads the latest GitHub release for `sedegah/Estimo`, compares versions,
downloads `ESTIMO-Admin-Setup-<version>.exe` and runs it with `/S`, then quits. `ESTIMO_UPDATE_FEED` can
point at a JSON file or URL for testing, and `ESTIMO_UPDATE_AUTO=1` skips the confirmation dialog.

## 10. Email

Clerk sends authentication mail (sign-in code, welcome) using the templates in `emails/`, configured in
the Clerk dashboard. The monthly check-in is a separate worker (`worker/index.ts`) on a cron of
`0 0 17 * *`; it reads accounts from D1 and sends through an email provider. It is dormant until provider
secrets exist, and deliberately does nothing rather than failing silently.

## 11. Failure behaviour

| Situation | Behaviour |
| --- | --- |
| Data API unreachable | Catalogue shows `Pending` for prices; pages still render |
| Not signed in | Public pages work; estimates stay local |
| Token rejected | API returns 401 and the client keeps local data |
| Admin without allowlist | Console shows "not authorised"; API returns 403 |
| Update feed unavailable | Console opens normally; update check is silent |
| Server fails to start | Electron shows an error dialog and quits cleanly |

## 12. Deliberate constraints

- No price is fabricated; missing data is shown as pending.
- No customer data is shared between accounts, and local data is wiped on account change.
- The console is a separate application with a separate account pool, not a hidden route on the website.
- The database is only reachable through the worker; the website never receives database credentials.
