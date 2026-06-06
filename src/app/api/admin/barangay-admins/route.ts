import { NextResponse } from "next/server";
import {
  createBarangayAdmin,
  CreateBarangayAdminError,
} from "@/lib/barangay-admin-service";
import { db } from "@/lib/db";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentApiUser();

    if (!isSuperAdmin(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const admin = await createBarangayAdmin(db, {
      username: body.username,
      password: body.password,
      barangayName: body.barangayName,
      municipality: body.municipality,
      fullName: body.fullName,
      email: body.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Barangay admin created successfully.",
        admin,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof CreateBarangayAdminError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }

    console.error("CREATE_BARANGAY_ADMIN_ROUTE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to create barangay admin." },
      { status: 500 }
    );
  }
}
