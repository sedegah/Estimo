# ESTIMO emails

Branded email templates built from the official logo pack. They use table layout and inline CSS so
they render correctly in Gmail, Outlook, Apple Mail and mobile clients.

| File | Use |
| --- | --- |
| `verification-code.html` | Sign-in / verification code email (Clerk "Sign in code" template) |
| `welcome.html` | Welcome email after an account is created |
| `signature.html` | Personal email signature for the team |

## Before you send anything

1. **Replace `{{APP_URL}}`** with the live site address, for example `https://estimo.com`. Email
   clients need an absolute URL to load the logo.
2. **Logos** are PNG files in `public/brand/`, served at `/brand/…` once the app is deployed:
   - `estimo-logo-horizontal-light.png` — navy wordmark, for light backgrounds
   - `estimo-logo-horizontal-dark.png` — white wordmark, for navy backgrounds
   - `estimo-mark-light.png` — the mark on its own, used in the signature
3. **Test it.** Send a test to yourself in Gmail and Outlook before using it with real people.

## Clerk sign-in emails

Clerk sends the sign-in code itself; this template only changes how it looks.

1. Open the Clerk dashboard → **Customization → Emails**.
2. Choose the **Sign in code** (or verification code) template.
3. Paste the contents of `verification-code.html` into the HTML editor.
4. Keep Clerk's variables intact — `{{code}}` and `{{user.first_name}}` are filled in by Clerk.
5. Use "Send test email" and check the logo and the code box.

For the welcome email, use the **Welcome** template in the same section with `welcome.html`.

## Email signature

1. Open `signature.html` in a browser.
2. Replace `{{FULL_NAME}}`, `{{ROLE}}`, `{{EMAIL}}`, `{{PHONE}}`, `{{DOMAIN}}` and `{{APP_URL}}`.
3. Select the signature on the page and copy it.
4. Paste into Gmail (**Settings → See all settings → Signature**) or Outlook (File → Options →
   Mail → Signatures). The logo must keep its absolute URL.

## Notes

- Colours come from the brand pack: navy `#0B1F3F`, amber `#F5B301`, plaster `#F1F2EE`.
- The typeface is Bricolage Grotesque where the client supports web fonts; everywhere else it falls
  back to the system sans-serif stack, so nothing looks broken.
- Keep `{{code}}` in a single element — Clerk replaces it with the numeric code.
