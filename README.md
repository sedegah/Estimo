# ESTIMO

ESTIMO helps you work out what an electrical job will cost in Ghana — before you buy anything.

Pick the kind of building you are working on, say how many rooms it has, and ESTIMO gives you a
first estimate in cedis. You can then look up materials, add them to a list, and keep the result
for later.

## What you can do

- **Start with a building type.** A single room, a 1–4 bedroom home, a shop, an office or a
  workshop.
- **Describe the rooms.** Tap a room to see exactly what it needs — lights, sockets, switches,
  air-conditioning points. Change the numbers until it matches the real place.
- **Choose a quality level.** Basic, standard or premium fittings.
- **Get a first estimate.** Materials, distribution board, earthing and labour, with a total.
- **Look up material prices.** Search the catalogue the way you would ask for something at the
  shop, then add what you need to your estimate.
- **Save your work.** Keep estimates and material lists to come back to later.

You do not need an account to try it. Signing in is optional — it is only there to keep your work
attached to you.

## Running it on your own computer

You need two things installed: **Node.js** (version 22 or newer) and a terminal window.

1. Open a terminal in this folder.
2. Type `npm install` and press Enter. This downloads everything the app needs; it takes a few
   minutes the first time.
3. Type `npm run dev` and press Enter.
4. Open **http://localhost:3000** in your browser.

To stop it, press `Ctrl` + `C` in the terminal.

## Sign-in

Signing in uses **Clerk**, a service that handles accounts and passwords for us. It needs a few
settings before it will work on a new machine. Those settings live in a file called `.env`, which
is deliberately not shared — it is private to your copy of the app.

If sign-in says it is not set up, ask whoever manages the project for the two Clerk settings and
add them to `.env`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

Everyone can still estimate without signing in.

## Keeping data

- **Without signing in:** everything stays in your browser. Closing the browser can clear it, and
  it is not visible on other devices.
- **With an account:** saved estimates will live in a Cloudflare database so they follow you
  between devices. The database connection is being set up; until it is finished, saved work stays
  in the browser.

## Before real use

- Material prices are shown as **pending**. ESTIMO does not invent prices — they will appear once a
  verified supplier price feed is connected.
- The estimate is a planning figure, not a quotation. Site conditions and a qualified electrician
  still decide the final numbers.
- Formal documents (quotation, bill of quantities, PDF packs) are not part of this version yet.

## Putting it online

When you are ready to publish it, you will need somewhere to host it (for example Cloudflare or
Vercel) and a domain name for sign-in. Until a domain is connected, the sign-in screen shows a small
"development mode" note — that is expected and disappears once the live sign-in settings are in
place.

## More detail

The technical notes live in the `docs` folder: `ARCHITECTURE.md` explains how the app is put
together, and `PRODUCTION.md` lists the steps for going live.
