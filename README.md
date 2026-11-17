# ESTIMO

ESTIMO is an electrical estimating app for Ghana. It turns a description of a building into a clear
first estimate: lights, sockets, distribution board, earthing and labour and lets you price the
materials that go into it.

## What it does

- **Pick the building.** Single room, 1–4 bedroom home, container kiosk, shop, office or workshop.
- **Describe the rooms.** Each space shows what it needs: light points, sockets, switches,
  air-conditioning and heater points. Adjust the numbers until they match the real place.
- **Choose a fitting quality.** Basic, standard or premium.
- **Get a first estimate.** A total, split into cables and conduit, sockets and switches, light
  fittings, distribution board and breakers, earthing, and labour.
- **Search materials.** Look up the catalogue the way you would ask for it at the shop — “2.5mm
  cable”, “double socket”, “32A MCB” — and add what you need to your estimate.
- **Keep your work.** Sign in and your estimates and material lists are saved to your account, so
  they are there next time and on your other devices.

## Running it locally

You need Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a production build:

```bash
npm run build
npm start
```

## Accounts and data

Sign-in is handled by **Clerk** — accounts, passwords and Google sign-in. Saved estimates, estimate
lines and projects are stored in **Cloudflare D1**, a managed database that belongs to this project.

Settings for both services live in a private `.env` file that is not committed. The variables are
documented in [docs/PRODUCTION.md](docs/PRODUCTION.md).

Guests can still explore the estimator and the catalogue before signing in.

## Good to know

- **Prices are pending.** ESTIMO only shows a price once it comes from a verified supplier source,
  so the catalogue shows “pending” rather than a guessed figure.
- **The total is a planning figure**, not a quotation. Final quantities depend on site conditions
  and a qualified electrician.
- **Documents are next.** Quotation, bill of quantities and PDF packs are the following step.

## Project layout

- `app/` — pages and routes
- `components/` — interface pieces
- `lib/` — domain logic, data and storage
- `styles/` — stylesheets
- `docs/` — architecture and production notes
- `tools/` — maintenance scripts

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together.
