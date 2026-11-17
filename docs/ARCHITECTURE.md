# ESTIMO architecture

Two applications share one database.

## Applications

| Part | What it is | Where it runs |
| --- | --- | --- |
| Estimating app | Customer site: home, catalogue, estimate, projects, PDF | Hosted (Vercel) |
| Admin console | Private price, catalogue and plan editor | Windows desktop app (Electron) that starts its own copy of the admin screens |

The console lives in `admin/` as a separate Next.js app. Electron starts it as a stand-alone server on a
loopback port and opens a window on it, so sign-in has a normal web origin. `desktop/` holds the Electron
shell, the NSIS installer script and the updater.

## Console screens

- **Prices** — search, category chips, per-row price entry, draft panel, publish. Import CSV reads
  `id` or `name` plus `price` columns into the draft; Export writes the full list with current prices as CSV.
  Add item jumps to Materials.
- **Materials** — add a material (name, category, unit, specification) and correct units inline.
- **Estimate builder** — project-type presets (single room through workshop), interactive floor plan,
  placement and dragging of lights, sockets, boards and runs, erase, live cost panel. Save project writes
  to `project_templates`; Download estimate produces a PDF from the plan.
- **Sign in** — Clerk, using the separate admin application.

## Data

Cloudflare D1, the `estimo` database, reached through one worker, `estimo-api` (`worker/api/index.ts`).

| Table | Holds |
| --- | --- |
| `users` | account rows keyed by the hashed owner id |
| `estimates`, `estimate_items` | saved estimates and their lines |
| `saved_projects` | saved projects |
| `catalogue_items` | seeded materials plus anything added in the console |
| `catalogue_prices` | append-only price observations with author and time |
| `service_prices` | prices for services |
| `project_templates` | plans saved from the estimate builder |
| `admin_audit` | every admin write |

`estimates` and `saved_projects` carry `owner_key`, a salted SHA-256 of the Clerk user id. D1 has no
row-level security, so the worker enforces ownership: every statement filters by `owner_key`, and admin
routes verify a token from the admin Clerk application. `ADMIN_USER_IDS` is an optional extra allowlist.

## API surface

Public: `GET /catalogue`, `GET /health`.

Signed-in: `GET /whoami`, `GET/POST/PATCH/DELETE /estimates`.

Admin: `GET/POST/PATCH` catalogue items, `POST` catalogue and service prices, `GET/POST` templates.

## Other pieces

- Monthly email worker (`worker/index.ts`), separate deployment, dormant until provider secrets exist.
- Web catalogue reads prices server-side with no caching, so a published price shows on the next refresh.
- Desktop updates: the console checks the latest GitHub release, downloads the installer and runs it
  silently in place. A local feed can be substituted with `ESTIMO_UPDATE_FEED`.

## Local data

Basket, draft and guest estimates live in `localStorage`. Signed-in estimates sync through the worker.
Local data is cleared when a different account signs in or a session ends.

## Configuration

`worker/wrangler.toml` and `worker/api/wrangler.toml` are not committed because they contain account ids;
`docs/PRODUCTION.md` lists what they must contain.
