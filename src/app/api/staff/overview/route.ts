import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser } from "@/lib/tenant-auth";

const ALLOWED_ROLES = ["BHW", "NURSE", "MIDWIFE", "DOCTOR"];

export async function GET() {
  try {
    const user = await getCurrentApiUser();

    if (!user || !ALLOWED_ROLES.includes(String(user.role)) || !user.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [
      pendingRegistrations,
      referralsReceived,
      referralsSent,
      pendingReferrals,
      logbookTotal,
      logbookToday,
      bmiTotal,
      bmiToday,
      announcements,
    ] = await Promise.all([
      db.pendingRegistration.count({
        where: { barangayId, isVerified: false },
      }),
      db.residentReferral.count({ where: { targetBarangayId: barangayId } }),
      db.residentReferral.count({ where: { sourceBarangayId: barangayId } }),
      db.residentReferral.count({
        where: { targetBarangayId: barangayId, status: "PENDING" },
      }),
      db.healthCenterLogbook.count({ where: { barangayId } }),
      db.healthCenterLogbook.count({
        where: {
          barangayId,
          visitDate: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      db.bMIRecord.count({ where: { barangayId } }),
      db.bMIRecord.count({
        where: { barangayId, createdAt: { gte: todayStart, lt: tomorrowStart } },
      }),
      db.announcement.count({ where: { barangayId } }),
    ]);

    return NextResponse.json({
      pendingRegistrations,
      referralsReceived,
      referralsSent,
      pendingReferrals,
      logbookTotal,
      logbookToday,
      bmiTotal,
      bmiToday,
      announcements,
    });
  } catch (error) {
    console.error("STAFF_OVERVIEW_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load activity overview." },
      { status: 500 }
    );
  }
}
