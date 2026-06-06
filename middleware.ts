/**
 * middleware.ts  (Edge Runtime — runs before every matched request)
 *
 * Protection matrix:
 * ┌─────────────────────────────┬──────────────────────────────────────────┐
 * │ Route                       │ Rule                                     │
 * ├─────────────────────────────┼──────────────────────────────────────────┤
 * │ /scan, /resident/[id]       │ Must be logged in + have allowed role    │
 * │ /dashboard/** (all roles)   │ Must be logged in                        │
 * │ /login, /register           │ Redirect to dashboard if already logged  │
 * └─────────────────────────────┴──────────────────────────────────────────┘
 *
 * IMPORTANT: middleware runs in the Edge Runtime. Do NOT import anything that
 * uses native Node.js APIs (e.g. `jsonwebtoken`, `bcrypt`, `fs`, etc.).
 * Use `auth-edge.ts` which relies solely on the Web Crypto API.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthTokenEdge, SCANNER_ALLOWED_ROLES } from "@/lib/auth-edge";

// ---------------------------------------------------------------------------
// Route helpers
// ---------------------------------------------------------------------------

function isAuthPage(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

function isProtectedDashboard(pathname: string) {
  return pathname.startsWith("/dashboard");
}

function isResidentScanRoute(pathname: string) {
  // Matches /resident/<anything>
  return /^\/resident\/[^/]+/.test(pathname);
}

function isSecureScanRoute(pathname: string) {
  return pathname === "/scan" || pathname.startsWith("/scan/");
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // ------------------------------------------------------------------
  // 1. Secure QR scan gate + resident info — role-based guard
  // ------------------------------------------------------------------
  if (isSecureScanRoute(pathname) || isResidentScanRoute(pathname)) {
    if (!token) {
      // Not logged in → redirect to login, preserve the scan URL as callback
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAuthTokenEdge(token);

    if (!payload) {
      // Tampered / expired token → clear cookie and send to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth_token");
      return response;
    }

    if (!SCANNER_ALLOWED_ROLES.has(payload.role)) {
      // User is logged in as a Resident but trying to scan a QR code.
      // The user requested that we SHOW THE LOGIN SCREEN FIRST instead of 
      // instantly showing Access Denied. So we clear their session and 
      // redirect them to the login screen.
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      response.cookies.delete("auth_token");
      return response;
    }

    // Pass the verified role downstream via a request header so the
    // Server Component can trust it without re-verifying the JWT.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ------------------------------------------------------------------
  // 2. Dashboard routes — must be logged in (any role)
  // ------------------------------------------------------------------
  if (isProtectedDashboard(pathname)) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAuthTokenEdge(token);
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth_token");
      return response;
    }

    return NextResponse.next();
  }

  // ------------------------------------------------------------------
  // 3. Auth pages — redirect away if already logged in
  // ------------------------------------------------------------------
  if (isAuthPage(pathname) && token) {
    const payload = await verifyAuthTokenEdge(token);
    if (payload) {
      // Send each role to its own dashboard
      let rolePath = payload.role.toLowerCase();
      if (rolePath === "barangay_admin" || rolePath === "super_admin") {
        rolePath = "admin";
      }
      const destination = `/dashboard/${rolePath}`;
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return NextResponse.next();
}

// ---------------------------------------------------------------------------
// Matcher — list every path prefix that should run through middleware.
// Exclude static files and Next.js internals to avoid unnecessary overhead.
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico, images/, fonts/  (public assets)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|images/|fonts/).*)",
  ],
};