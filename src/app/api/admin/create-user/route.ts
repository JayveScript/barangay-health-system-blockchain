import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import {
  canManageBarangay,
  getCurrentApiUser,
  resolveScopeBarangayId,
} from "@/lib/tenant-auth";
import {
  BARANGAY_ADMIN_USERNAME_SUFFIX,
  isValidBarangayAdminUsername,
  normalizeBarangayHcmsUsername,
} from "@/lib/username-validation";

const allowedRoles = ["STAFF", "DOCTOR", "BHW", "NURSE", "MIDWIFE"] as const;

type StaffRole = (typeof allowedRoles)[number];

export async function POST(req: Request) {
  try {
    const admin = await getCurrentApiUser();

    if (!canManageBarangay(admin) || !admin?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Super-admin may create the user under any barangay (via the switcher);
    // a barangay-admin is locked to their own.
    const barangayId = resolveScopeBarangayId(admin, body.barangayId);

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase() || null;
    const phoneNumber = String(body.phoneNumber || "").trim() || null;
    const username = normalizeBarangayHcmsUsername(
      String(body.username || "")
    );
    const password = String(body.password || "").trim();
    const role = String(body.role || "").trim().toUpperCase() as StaffRole;

    if (!fullName || !username || !password || !role) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (!isValidBarangayAdminUsername(username)) {
      return NextResponse.json(
        {
          error: `Username must end with ${BARANGAY_ADMIN_USERNAME_SUFFIX}. Use letters, numbers, dots, underscores, or hyphens before the suffix.`,
        },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: {
        username,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists." },
        { status: 400 }
      );
    }

    if (email) {
      const [emailTakenByUser, emailTakenByResident] = await Promise.all([
        db.user.findUnique({ where: { email } }),
        db.resident.findUnique({ where: { email } }),
      ]);
      if (emailTakenByUser || emailTakenByResident) {
        return NextResponse.json(
          { error: "Email is already in use by another account or resident." },
          { status: 400 }
        );
      }
    }

    if (phoneNumber) {
      const [phoneTakenByUser, phoneTakenByResident] = await Promise.all([
        db.user.findUnique({ where: { phoneNumber } }),
        db.resident.findFirst({ where: { phoneNumber } }),
      ]);
      if (phoneTakenByUser || phoneTakenByResident) {
        return NextResponse.json(
          {
            error:
              "Phone number is already in use by another account or resident.",
          },
          { status: 400 }
        );
      }
    }

    const passwordHash = await hash(password, 10);

    const user = await db.user.create({
      data: {
        fullName,
        email,
        phoneNumber,
        username,
        password: passwordHash,
        role,
        isVerified: true,
        barangayId,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        username: true,
        role: true,
        isVerified: true,
        createdAt: true,
        barangay: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ADMIN_CREATE_USER_ERROR", error);

    return NextResponse.json(
      { error: "Failed to create user." },
      { status: 500 }
    );
  }
}
