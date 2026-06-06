// src/app/api/logout/route.ts

import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logged out" });

    // Clear token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    
    // Clear auth_token cookie (used by middleware)
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}