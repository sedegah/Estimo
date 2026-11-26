/**
 * One place for the ESTIMO data API address.
 *
 * Production serves the API from the custom domain (api.estimo.live). Development keeps
 * using the workers.dev address unless an explicit value is configured, so a local build
 * works before the custom domain exists.
 */
const configured = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? process.env.NEXT_PUBLIC_API_URL;

/**
 * Until api.estimo.live is attached to the worker (the zone has to be in the same
 * Cloudflare account), production keeps calling the workers.dev address. Set
 * NEXT_PUBLIC_ESTIMO_API_URL=https://api.estimo.live to switch, with no code change.
 */
export const API_URL = (
  configured?.trim() || "https://estimo-api.sedegahkimathi.workers.dev"
).replace(/\/$/, "");
