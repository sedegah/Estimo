# Publishing ESTIMO Admin to the Microsoft Store

Everything the Store needs from our side is in this folder. The submission itself has
to happen in your own Microsoft Partner Center account (identity verification and the
developer fee are tied to your Microsoft account — I cannot do that step for you).

## What is ready

| File | Used for |
| --- | --- |
| `../desktop/release/ESTIMO-Admin-Setup-1.4.1.exe` | the package you upload (Win32 EXE submission) |
| `assets/store-logo-300.png` | Store listing logo (1:1, 300 × 300) |
| `assets/Square150x150Logo.png`, `Square44x44Logo.png`, `Square71x71Logo.png`, `Square89x89Logo.png`, `Square310x310Logo.png`, `StoreLogo.png`, `Wide310x150Logo.png` | tile artwork if we later ship an MSIX package |
| `screenshots/store-01-home.png` … `store-04-console.png` | listing screenshots, 1366 × 768 and larger |

## Before you start

1. **Partner Center account** — <https://partner.microsoft.com/dashboard>. Individual
   accounts cost a one-off fee (~US$19); company accounts need business verification.
2. **Reserve the app name** — *Apps and features → New product → EXE or MSI app*, name
   it **ESTIMO Admin**. Reserving is free and holds the name while you finish the listing.
3. **Production Clerk instance** — the console currently runs on Clerk **development**
   keys (`pk_test_…`), which shows a "Development mode" banner and has strict usage
   limits. The Store listing must point at production keys, otherwise certification
   will flag it and the banner appears in the app. Create the production instance in
   Clerk, add the worker hostname to its allowed origins, then set
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for the console build
   (`admin/.env`, and the `CLERK_SECRET_KEY` worker secret).

## Submission steps (EXE / MSI path — recommended)

1. Partner Center → **New product → EXE or MSI app** → reserve **ESTIMO Admin**.
2. **Packages**: upload `ESTIMO-Admin-Setup-1.4.1.exe`. The Store re-signs the package,
   so our unsigned build is acceptable here; the installer must stay a single silent-
   capable EXE with a per-user install (it is: Inno Setup, `PrivilegesRequired=lowest`).
3. **Properties**: category *Business → Business tools*; privacy policy URL
   (required — point at the ESTIMO privacy page); support contact.
4. **Age ratings**: complete the IARC questionnaire — no user-generated content, no
   ads, business tool → expect 3+.
5. **Listing** (copy is in `listing.md`): description, short description, keywords,
   screenshots from `screenshots/`, `assets/store-logo-300.png`.
6. **Notes for certification**: supply a **test account** for the console (Clerk email
   + password, or a note that Google sign-in works with the test account), and explain
   that the app is a desktop shell around our own admin console, requires internet and
   a staff account.
7. **Pricing & availability**: free, all markets (or Ghana only), release ASAP.
8. Submit. Certification typically takes 1–3 business days.

## Things that will be asked and must be true

- **Policy 10.1.1 (web-wrapped apps).** The shell loads our console. Be explicit in the
  notes: it is not a generic browser — one fixed destination, our own product, with a
  native window/menu, offline retry screen and auto-update. Add screens showing the
  console rather than the marketing site if asked.
- **Account requirement.** Apps that need sign-in must provide credentials for testers.
- **Connectivity.** The app needs the internet; the offline screen should be described
  as such, not as an offline mode.
- **Updates.** Interface updates ship from the worker automatically; shell updates come
  from GitHub releases. Mention both.

## MSIX alternative

If a fully packaged Store app is preferred (Store-managed install/uninstall, no UAC
dialog at all), we can produce an MSIX with electron-builder. That needs the identity
values from Partner Center (*Product identity*):

- `Package/Identity/Name` (e.g. `1234ESTIMO.ESTIMOAdmin`)
- `Package/Identity/Publisher` (e.g. `CN=ABCD1234-…`)
- `Publisher display name`

Send those three values and I will add the `appx` target to `desktop/package.json`,
wire the tile assets above, and produce a signed `.msixupload`.
