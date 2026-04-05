import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@ambaril/shared/constants";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files only — API routes MUST go through auth check
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Public routes — no auth needed
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for session cookie (all non-public routes including /api)
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    // API routes return 401 JSON instead of redirect
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        {
          data: null,
          meta: null,
          errors: [
            { code: "UNAUTHORIZED", message: "Authentication required" },
          ],
        },
        { status: 401 },
      );
    }
    // UI routes redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Add request ID header for correlation (LM-005)
  const requestId = crypto.randomUUID();
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  // Full role/permission checking happens in getSession() server-side.
  // Middleware checks cookie presence + adds correlation ID.
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
