# ESTIMO — architecture

ESTIMO is a Next.js App Router application with **no backend**. The material library ships with the bundle; guest
estimates live in the browser.

## Flow

1. **Home** (`/`) — pick a project type. The floor-plan illustration maps the four legend symbols to lights, sockets,
   a distribution board and circuit runs.
2. **Set up** (`/quick-estimate?template=-¦`) — room counts (expand a room to see its lights, sockets, switches and
   points) plus fitting quality. The sidebar recalculates the preliminary total live.
3. **Estimate** (`/estimate?template=-¦&rooms-¦`) — cost groups, total, save project, print/PDF and adjust.
4. **Catalogue** (`/catalogue`) — search and category chips over the bundled 122-material library; add to estimate.
5. **Basket** (`/estimate-basket`) — quantities in localStorage, save as a project.
6. **Saved projects** (`/projects`) — quick estimates and material lists from localStorage.


## Layout

```
ESTIMO/
-œ- app/                     # routes only (App Router)
-   -œ- layout.tsx           # fonts, global styles, header
-   -œ- loading.tsx          # branded splash during navigation
-   -œ- icon.svg             # app icon (official brand pack)
-   -œ- apple-icon.png
-   -œ- page.tsx             # home
-   -œ- quick-estimate/      # step 2 — project setup
-   -œ- estimate/            # step 3 — your estimate
-   -œ- catalogue/           # material prices + [materialId] detail
-   -œ- estimate-basket/
-   -œ- projects/
-   - api/health/
-œ- components/
-   -œ- layout/              # header, official logo assets
-   -œ- home/                # floor-plan illustration
-   -œ- catalogue/           # material card
-   -œ- estimate/            # basket, add-to-estimate, basket link
-   - ui/                  # project icons
-œ- lib/
-   -œ- types.ts             # domain types
-   -œ- format.ts            # GHS/date formatting
-   -œ- estimate-model.ts    # calibration anchors, room -†’ points, cost groups
-   -œ- data/catalogue.ts    # 122 core materials, bundled
-   - storage/             # localStorage adapters (basket, saved estimates)
-œ- styles/                  # globals, home, pages, brand
-œ- public/brand/            # official logo pack (SVG)
-œ- tools/                   # seed -†’ dataset generator, CSS prune helper
- docs/
```

## Data flow

1. **Material library** — `lib/data/catalogue.ts` is generated from the original ESTIMO seed by
   `tools/build-catalogue-data.mjs` (122 materials). Plain module: catalogue pages render server-side, no network.
2. **Basket** — `lib/storage/basket.ts` reads/writes `localStorage` and emits `estimo-basket-change`, so the header
   counter and the basket page stay in sync without a store library.
3. **Saved estimates** — `lib/storage/saved-estimates.ts` persists quick estimates and material lists.
4. **Estimate model** — `lib/estimate-model.ts` holds the staging calibration anchors, converts rooms into electrical
   points and splits the preliminary total into cost groups.

No authentication, database or server actions. Components that need browser state are client components.

## Design system

- Font: **Bricolage Grotesque** (`next/font/google`), one family across the product.
- Colour tokens (`styles/globals.css`): navy `#0B1F3F`, amber `#F5B301`, plaster `#F1F2EE`.
- Logo: official pack in `public/brand/` (horizontal for the header, stacked for the loading splash, app icon for the
  favicon). Do not redraw the mark — reference the pack.

## Constraints

Prices are deliberately absent: there is no verified supplier feed, so the catalogue shows "Pending" instead of
inventing figures. The estimate total is an illustrative calibration baseline, labelled as such. Adding a real
pricing backend means adding a data layer behind `lib/data/`, not reaching into components.

