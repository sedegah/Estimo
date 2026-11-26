/**
 * One place for the ESTIMO data API address.
 *
 * Production serves the API from the custom domain (api.estimo.live). Development keeps
 * using the workers.dev address unless an explicit value is configured, so a local build
 * works before the custom domain exists.
 */
const configured = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

export const API_URL = (
  configured?.trim() ||
  (process.env.NODE_ENV === "production"
    ? "https://api.estimo.live"
    : "https://estimo-api.sedegahkimathi.workers.dev")
).replace(/\/$/, "");
