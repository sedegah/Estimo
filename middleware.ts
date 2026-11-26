import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { clerkEnabled } from "./lib/env";

/**
 * Routes that hold a person's work. A visitor without a session is sent to sign in
 * and brought straight back, so the saved estimates cannot be opened by typing the
 * address or following a link.
 */
const PROTECTED = [/^\/dashboard(\/|$)/, /^\/estimates(\/|$)/, /^\/projects(\/|$)/, /^\/settings(\/|$)/];

/** The auth screens. A session that already exists has no business on them. */
const AUTH_PAGES = [/^\/signin(\/|$)/, /^\/signup(\/|$)/];

const withClerk = clerkEnabled
  ? clerkMiddleware(async (auth, request) => {
      const path = request.nextUrl.pathname;
      const { userId } = await auth();

      // a signed-in visitor on /signin or /signup is sent on: this is what used to leave
      // people staring at the auth card after a successful sign-in
      if (userId && AUTH_PAGES.some((pattern) => pattern.test(path))) {
        const requested = request.nextUrl.searchParams.get("redirect_url");
        const next = requested ? new URL(requested, request.url) : new URL("/dashboard", request.url);
        // never follow a redirect off the site
        return NextResponse.redirect(next.origin === request.nextUrl.origin ? next : new URL("/dashboard", request.url));
      }

      if (!PROTECTED.some((pattern) => pattern.test(path))) return;
      if (userId) return;
      const signIn = new URL("/signin", request.url);
      signIn.searchParams.set("redirect_url", path + request.nextUrl.search);
      return NextResponse.redirect(signIn);
    })
  : null;

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (withClerk) return withClerk(request, event);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
