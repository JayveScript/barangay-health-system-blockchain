
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthTokenEdge, SCANNER_ALLOWED_ROLES } from "@/lib/auth-edge";


function isAuthPage(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/register");
}

function isProtectedDashboard(pathname: string) {
  return pathname.startsWith("/dashboard");
}

function isResidentScanRoute(pathname: string) {
  return /^\/resident\/[^/]+/.test(pathname);
}

function isSecureScanRoute(pathname: string) {
  return pathname === "/scan" || pathname.startsWith("/scan/");
}

const SECTION_ROLES: Record<string, string[]> = {
  superadmin: ["SUPER_ADMIN"],
  admin: ["SUPER_ADMIN", "BARANGAY_ADMIN"],
  doctor: ["DOCTOR"],
  nurse: ["NURSE"],
  bhw: ["BHW"],
  midwife: ["MIDWIFE"],
  pharmacist: ["PHARMACIST"],
  medtech: ["MEDTECH"],
  nutritionist: ["NUTRITIONIST"],
};

function dashboardForRole(role: string): string {
  const r = role.toUpperCase();
  if (r === "SUPER_ADMIN") return "/dashboard/superadmin";
  if (r === "BARANGAY_ADMIN") return "/dashboard/admin";
  return `/dashboard/${r.toLowerCase()}`;
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  if (isSecureScanRoute(pathname) || isResidentScanRoute(pathname)) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAuthTokenEdge(token);

    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth_token");
      return response;
    }

    if (!SCANNER_ALLOWED_ROLES.has(payload.role)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("token");
      response.cookies.delete("auth_token");
      return response;
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

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

    const role = payload.role.toUpperCase();
    const section = pathname.split("/")[2];
    const allowedRoles = section ? SECTION_ROLES[section] : undefined;

    if (
      role !== "SUPER_ADMIN" &&
      allowedRoles &&
      !allowedRoles.includes(role)
    ) {
      return NextResponse.redirect(
        new URL(dashboardForRole(role), request.url)
      );
    }

    return NextResponse.next();
  }

  if (isAuthPage(pathname) && token) {
    const payload = await verifyAuthTokenEdge(token);
    if (payload) {
      return NextResponse.redirect(
        new URL(dashboardForRole(payload.role), request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|images/|fonts/).*)",
  ],
};