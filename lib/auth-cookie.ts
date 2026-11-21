import { cookies } from "next/headers";

/**
 * Whether the browser carries a Clerk session, read from the cookie Clerk sets.
 * Public pages use this to decide whether Clerk's runtime is worth loading: an
 * anonymous visitor gets a plain "Sign in" link and none of Clerk's JavaScript.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const jar = await cookies();
  const activity = jar.get("__client_uat")?.value;
  if (activity && activity !== "0") return true;
  return Boolean(jar.get("__session")?.value);
}
