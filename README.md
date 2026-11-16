# ESTIMO — V2.5 offline edition

Ghana-focused electrical estimating: pick a project, count the rooms, get a preliminary estimate, and price materials
from a bundled catalogue. No accounts, no database, no API keys.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

Production: `npm run build && npm start`.

## Flow

| Screen | Route | What it does |
| --- | --- | --- |
| Home | `/` | Full-bleed lit floor plan, entry points to estimating and prices |
| Sign in / Create account | `/signin`, `/signup` | Local account (browser only): SHA-256 password hash, session in local or session storage |
| Set up project | `/quick-estimate?template=HOME-2B` | Room counts (expand a room for lights, sockets, switches, points) and fitting quality; live total |
| Your estimate | `/estimate?template=-¦` | Cost groups, total, save, print/PDF, adjust |
| Material prices | `/catalogue` | Search + category chips over 122 materials; add to estimate |
| Estimate basket | `/estimate-basket` | Quantities held in the browser; save as a project |
| Saved projects | `/projects` | Quick estimates and material lists stored in the browser |

## Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Short version: `app/` routes, `components/` by feature, `lib/` domain
and storage, `styles/` stylesheets, `public/brand/` the official logo pack.

## Brand

Use the official pack — never redraw the mark. `components/layout/estimo-logo.tsx` serves
`public/brand/estimo-logo-horizontal-dark.svg` in the navy header, the stacked logo on the loading splash, and
`app/icon.svg` (amber app icon) as the favicon.

## Data

`lib/data/catalogue.ts` is generated from the original ESTIMO seed:

```bash
node tools/build-catalogue-data.mjs <seedProjectDir> .
```

Prices are intentionally absent — the build has no verified supplier feed, so the catalogue shows "Pending" rather
than invented figures. The estimate total is an illustrative calibration baseline.

## Verify

```bash
npm run typecheck
npm run build
```

