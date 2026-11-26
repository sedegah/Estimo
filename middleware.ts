import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { clerkEnabled, env } from "./lib/env";

/**
 * Routes that hold a person's work. A visitor without a session is sent to sign in
 * and brought straight back, so the saved estimates cannot be opened by typing the
 * address or following a link.
 */
const PROTECTED = [/^\/dashboard(\/|$)/, /^\/estimates(\/|$)/, /^\/projects(\/|$)/, /^\/settings(\/|$)/];

const withClerk = clerkEnabled
  ? clerkMiddleware(
      async (auth, request) => {
        if (!PROTECTED.some((pattern) => pattern.test(request.nextUrl.pathname))) return;
        const { userId } = await auth();
        if (userId) return;
        const signIn = new URL("/signin", request.url);
        signIn.searchParams.set("redirect_url", request.nextUrl.pathname + request.nextUrl.search);
        return NextResponse.redirect(signIn);
      },
      {
        publishableKey: env.clerkPublishableKey,
        secretKey: process.env.CLERK_SECRET_KEY,
      },
    )
  : null;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (withClerk) return withClerk(request, event);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};