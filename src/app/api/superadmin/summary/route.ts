import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE"];

// GET /api/superadmin/summary
// System-wide totals + a per-barangay breakdown (residents, staff, admin).
export async function GET() {
  try {
    const user = await getCurrentApiUser();
    if (!isSuperAdmin(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const barangays = await db.barangay.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, municipality: true },
    });

    const perBarangay = await Promise.all(
      barangays.map(async (b) => {
        const [residents, staff, verified, admin] = await Promise.all([
          db.resident.count({ where: { barangayId: b.id } }),
          db.user.count({
            where: { barangayId: b.id, role: { in: STAFF_ROLES as never } },
          }),
          db.resident.count({
            where: { barangayId: b.id, user: { isVerified: true } },
          }),
          db.user.findFirst({
            where: { barangayId: b.id, role: "BARANGAY_ADMIN" },
            select: { id: true, username: true, fullName: true, email: true },
            orderBy: { createdAt: "asc" },
          }),
        ]);
        return {
          id: b.id,
          name: b.name,
          municipality: b.municipality,
          residents,
          staff,
          verified,
          admin: admin
            ? {
                id: admin.id,
                username: admin.username,
                fullName: admin.fullName,
                email: admin.email,
              }
            : null,
        };
      })
    );

    const totals = {
      barangays: barangays.length,
      residents: perBarangay.reduce((s, b) => s + b.residents, 0),
      staff: perBarangay.reduce((s, b) => s + b.staff, 0),
      admins: perBarangay.filter((b) => b.admin).length,
    };

    return NextResponse.json({ totals, barangays: perBarangay });
  } catch (error) {
    console.error("SUPERADMIN_SUMMARY_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load summary." },
      { status: 500 }
    );
  }
}
