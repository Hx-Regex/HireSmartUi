import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  const { pathname } = request.nextUrl;

  // If user is going to /login or /register and is already authenticated, redirect to /
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If user is going to / but is not authenticated, redirect to /login
  if (!token && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow the request to continue for other cases
  return NextResponse.next();
}

// Matching paths configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
