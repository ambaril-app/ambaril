import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@ambaril/shared/constants";

// Routes that don't require authentication (prefix match)
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/creators/login", "/creators/apply"];
// Routes that don't require auth — exact match only (can't use startsWith for "/")
const PUBLIC_EXACT_ROUTES = ["/"];

// Route prefix → allowed roles
const ROUTE_ROLES: Record<string, string[]> = {
  "/admin": ["admin", "pm", "creative", "operations", "support", "finance", "commercial"],
  "/portal": ["creator"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes (API routes handle auth themselves)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public routes — no auth needed
  if (
    PUBLIC_EXACT_ROUTES.includes(pathname) ||
    PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    // Redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Note: Full role/permission checking happens in getSession() server-side.
  // Middleware only checks cookie presence for speed.
  // Server components and API routes do the full RBAC check.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
