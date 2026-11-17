# ESTIMO Admin (desktop)

The desktop app for maintaining the catalogue: material prices, services, units and
new items. It is an Electron window around the same admin interface the web app
serves at `/admin`, so there is one implementation to maintain.

## Run it

```bash
cd desktop
npm install          # installs Electron
npm start            # opens the admin at http://localhost:3000/admin/prices
```

Point it at a deployed site instead:

```bash
ESTIMO_ADMIN_URL=https://your-domain.com/admin/prices npm start
```

On Windows PowerShell:

```powershell
$env:ESTIMO_ADMIN_URL="https://your-domain.com/admin/prices"; npm start
```

The project's own dev server must be running (`npm run dev` at the repo root) when
using `localhost`.

## Signing in

Sign-in is Clerk, the same account system as the rest of ESTIMO. Only accounts on
the admin allowlist can change prices or add materials — everyone else sees the
“Not authorised” screen. The allowlist lives in the `ADMIN_USER_IDS` secret on the
`estimo-api` worker.

## What you can do

- **Prices** — search the catalogue, type new prices, review the draft panel and
  publish. Every published price is stored in Cloudflare D1 with the account that
  changed it and a timestamp.
- **Materials** — add a material (name, category, unit, specification) and correct
  the unit of an existing one.
- **Settings** — see the signed-in account, its role and the API it talks to.

## Notes

- Prices are per unit and in Ghana cedis (GHS).
- Blank fields stay “Pending”; nothing is invented.
- The admin interface uses the system typeface (Bricolage Grotesque) and the same
  navy/amber palette as the estimating app.

## Code signing

The installer is built unsigned, so Windows SmartScreen shows "Windows protected your PC" the first time it is downloaded.

To sign it, buy a code-signing certificate (an OV or EV certificate; EV clears SmartScreen
reputation immediately, OV builds it over time), export it as a .pfx, then build with:

``powershell
$env:CSC_LINK="C:\path\to\certificate.pfx"
$env:CSC_KEY_PASSWORD="the certificate password"
npm run dist
``

electron-builder signs the app and the installer automatically when those two variables are
set. Verify with:

``powershell
Get-AuthenticodeSignature "release\ESTIMO-Admin-Setup-1.0.0.exe"
``

A self-signed certificate does not help — SmartScreen only trusts certificates chained to a
public authority with reputation.