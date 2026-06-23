import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentApiUser, canManageBarangay } from "@/lib/tenant-auth";

// Unified activity feed of what STAFF / NURSE / DOCTOR / BHW did, aggregated
// from the actor-attributed records in the database and scoped to the admin's
// barangay (SUPER_ADMIN sees all).

type ActivityItem = {
  id: string;
  type: "diagnosis" | "bmi" | "availability" | "referral" | "qr-scan";
  action: string;
  detail: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
};

const CONDITION_LABELS: Record<string, string> = {
  hasHypertension: "Hypertension",
  hasDiabetes: "Diabetes",
  hasStiHiv: "STI / HIV",
  hasHeartDisease: "Heart Disease",
  hasKidneyFailure: "Kidney Failure",
  hasTuberculosis: "Tuberculosis",
  hasAllergies: "Allergies",
  hasCancer: "Cancer",
  hasOtherConditions: "Other Conditions",
};

function residentName(r?: { firstName?: string | null; lastName?: string | null } | null) {
  if (!r) return "a resident";
  return `${r.firstName ?? ""} ${r.lastName ?? ""}`.replace(/\s+/g, " ").trim() || "a resident";
}

export async function GET() {
  try {
    const admin = await getCurrentApiUser();

    if (!canManageBarangay(admin) || !admin?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuper = String(admin.role) === "SUPER_ADMIN";
    const barangayId = admin.barangayId;
    const scope = isSuper ? {} : { barangayId };

    const [diagnoses, bmiRecords, availabilities, referrals, scans] =
      await Promise.all([
        db.diagnosis.findMany({
          where: scope,
          include: {
            diagnosedBy: { select: { fullName: true, role: true } },
            resident: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 60,
        }),
        db.bMIRecord.findMany({
          where: scope,
          include: {
            recordedBy: { select: { fullName: true, role: true } },
            resident: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 60,
        }),
        db.doctorAvailability.findMany({
          where: scope,
          include: { doctor: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
        db.residentReferral.findMany({
          where: isSuper ? {} : { sourceBarangayId: barangayId },
          include: {
            referredByStaff: { select: { fullName: true, role: true } },
            targetBarangay: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        }),
        db.qrScanAuditLog.findMany({
          where: {
            action: "ACCESS_GRANTED",
            ...(isSuper ? {} : { scannedBy: { barangayId } }),
          },
          include: { scannedBy: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: "desc" },
          take: 60,
        }),
      ]);

    // Resolve resident names for QR scans (no direct relation on the log).
    const scanResidentIds = [...new Set(scans.map((s) => s.residentId))];
    const scanResidents = scanResidentIds.length
      ? await db.resident.findMany({
          where: { id: { in: scanResidentIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const scanResidentMap = new Map(scanResidents.map((r) => [r.id, r]));

    const items: ActivityItem[] = [];

    for (const d of diagnoses) {
      const labels = (d.conditions || []).map((k) => CONDITION_LABELS[k] || k);
      items.push({
        id: `diagnosis-${d.id}`,
        type: "diagnosis",
        action: "Diagnosed a patient",
        detail: d.isHealthy
          ? `Assessed ${residentName(d.resident)} as healthy`
          : labels.length > 0
            ? `Recorded ${labels.join(", ")} for ${residentName(d.resident)}`
            : `Recorded a diagnosis for ${residentName(d.resident)}`,
        actorName: d.diagnosedBy?.fullName || "Health Worker",
        actorRole: String(d.diagnosedBy?.role || "STAFF"),
        createdAt: d.createdAt.toISOString(),
      });
    }

    for (const b of bmiRecords) {
      items.push({
        id: `bmi-${b.id}`,
        type: "bmi",
        action: "Recorded BMI & vitals",
        detail: `BMI ${b.bmi.toFixed(1)} (${b.bmiCategory}) for ${residentName(b.resident)}`,
        actorName: b.recordedBy?.fullName || "Health Worker",
        actorRole: String(b.recordedBy?.role || "STAFF"),
        createdAt: b.createdAt.toISOString(),
      });
    }

    for (const a of availabilities) {
      const dateLabel = new Date(a.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      items.push({
        id: `availability-${a.id}`,
        type: "availability",
        action: "Posted doctor availability",
        detail: `${dateLabel}, ${a.startTime}–${a.endTime}`,
        actorName: a.doctor?.fullName || "Doctor",
        actorRole: String(a.doctor?.role || "DOCTOR"),
        createdAt: a.createdAt.toISOString(),
      });
    }

    for (const r of referrals) {
      const data = (r.identifyingData ?? {}) as { fullName?: string | null };
      items.push({
        id: `referral-${r.id}`,
        type: "referral",
        action: "Sent a resident referral",
        detail: `Referred ${data.fullName || "a resident"} to ${r.targetBarangay?.name || "another barangay"} (${r.status})`,
        actorName: r.referredByStaff?.fullName || "Staff",
        actorRole: String(r.referredByStaff?.role || "STAFF"),
        createdAt: r.createdAt.toISOString(),
      });
    }

    for (const s of scans) {
      items.push({
        id: `qr-scan-${s.id}`,
        type: "qr-scan",
        action: "Scanned a resident QR ID",
        detail: `Viewed ${residentName(scanResidentMap.get(s.residentId))}'s digital health ID`,
        actorName: s.scannedBy?.fullName || "Staff",
        actorRole: String(s.scannedBy?.role || s.role || "STAFF"),
        createdAt: s.createdAt.toISOString(),
      });
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ logs: items.slice(0, 150) });
  } catch (error) {
    console.error("ADMIN_ACTIVITY_LOGS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load activity logs." },
      { status: 500 }
    );
  }
}
