// Production fallback updated for estimo.live custom domain.
const PRODUCTION_FALLBACK = "https://estimo.live";

/**
 * Canonical address of the public site, used by the sitemap and robots.txt.
 * `NEXT_PUBLIC_SITE_URL` wins, except in production where a localhost value is
 * ignored so a build made from a development .env never publishes localhost URLs.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(configured);
  if (configured && !(isLocal && process.env.NODE_ENV === "production")) {
    return configured.replace(/\/+$/, "");
  }
  return process.env.NODE_ENV === "production" ? PRODUCTION_FALLBACK : "http://localhost:3000";
}
