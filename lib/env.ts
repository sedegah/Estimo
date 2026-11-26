/**
 * Single place where public environment values are read.
 *
 * Secrets (for example CLERK_SECRET_KEY) stay in .env and are read by the SDK
 * that owns them — application code never references them.
 */
export const env = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  appEnv: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0",
  clerkPublishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
} as const;

export const clerkEnabled = Boolean(env.clerkPublishableKey);
