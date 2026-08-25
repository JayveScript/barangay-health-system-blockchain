import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";


type NotificationItem = {
  id: string;
  type:
    | "diagnosis"
    | "record-update"
    | "suggestion"
    | "announcement"
    | "scan";
  title: string;
  message: string;
  doctorName: string | null;
  barangayName: string | null;
  conditions?: string[];
  actorName?: string | null;
  actorRole?: string | null;
  createdAt: string;
};

function humanizeRole(role?: string | null): string {
  if (!role) return "Staff";
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

async function getApiUser() {
  return resolveAuthedUser({ resident: true });
}

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user || String(user.role) !== "RESIDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resident = user.resident;
    const barangayId = user.barangayId;

    if (!resident) {
      return NextResponse.json(
        { error: "Resident profile not found." },
        { status: 404 }
      );
    }

    const [diagnoses, suggestionAppointments, announcements, scanLogs] =
      await Promise.all([
        db.diagnosis.findMany({
          where: { residentId: resident.id },
          include: {
            diagnosedBy: {
              select: {
                fullName: true,
                role: true,
                barangay: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.appointment.findMany({
          where: {
            residentId: resident.id,
            suggestion: { not: null },
            status: { not: "REJECTED" },
          },
          include: {
            doctor: {
              select: {
                fullName: true,
                barangay: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
        db.announcement.findMany({
          where: { barangayId },
          orderBy: { publishDate: "desc" },
          take: 30,
        }),
        db.qrScanAuditLog.findMany({
          where: { residentId: resident.id, action: "ACCESS_GRANTED" },
          include: { scannedBy: { select: { fullName: true } } },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ]);

    const items: NotificationItem[] = [];

    for (const d of diagnoses) {
      const doctorName = d.diagnosedBy?.fullName || "Health Worker";
      const barangayName = d.diagnosedBy?.barangay?.name || null;
      const conditionLabels = (d.conditions || []).map(
        (key) => CONDITION_LABELS[key] || key
      );

      items.push({
        id: `diagnosis-${d.id}`,
        type: "diagnosis",
        title: d.isHealthy
          ? "You were assessed as healthy"
          : conditionLabels.length > 0
            ? `Diagnosed: ${conditionLabels.join(", ")}`
            : "New diagnosis recorded",
        message: d.isHealthy
          ? `Dr. ${doctorName} reviewed your condition and found no new health concerns.`
          : conditionLabels.length > 0
            ? `Dr. ${doctorName} recorded the following condition(s): ${conditionLabels.join(", ")}.`
            : `Dr. ${doctorName} recorded a new diagnosis for you.`,
        doctorName,
        barangayName,
        conditions: conditionLabels,
        createdAt: d.createdAt.toISOString(),
      });

      if (!d.isHealthy && conditionLabels.length > 0) {
        items.push({
          id: `record-update-${d.id}`,
          type: "record-update",
          title: "Your medical record status was updated",
          message: `Dr. ${doctorName} updated your medical records — marked ${conditionLabels.join(", ")} as present.${d.notes ? ` Note: ${d.notes}` : ""}`,
          doctorName,
          barangayName,
          conditions: conditionLabels,
          createdAt: d.createdAt.toISOString(),
        });
      }
    }

    for (const a of suggestionAppointments) {
      const doctorName = a.doctor?.fullName || "Doctor";
      items.push({
        id: `suggestion-${a.id}`,
        type: "suggestion",
        title: "Checkup / appointment suggestion",
        message: `Dr. ${doctorName} suggested: ${a.suggestion}`,
        doctorName,
        barangayName: a.doctor?.barangay?.name || null,
        createdAt: a.createdAt.toISOString(),
      });
    }

    for (const an of announcements) {
      items.push({
        id: `announcement-${an.id}`,
        type: "announcement",
        title: an.title,
        message: an.content,
        doctorName: null,
        barangayName: null,
        createdAt: (an.publishDate || an.createdAt).toISOString(),
      });
    }

    for (const log of scanLogs) {
      const actorName = log.scannedBy?.fullName?.trim() || null;
      const actorRole = humanizeRole(log.role);
      const article = /^[AEIOU]/.test(actorRole) ? "An" : "A";
      items.push({
        id: `scan-${log.id}`,
        type: "scan",
        title: "Your QR ID was scanned",
        message: actorName
          ? `${actorRole} ${actorName} scanned and viewed your digital health ID.`
          : `${article} ${actorRole} scanned and viewed your digital health ID.`,
        doctorName: null,
        barangayName: null,
        actorName,
        actorRole,
        createdAt: log.createdAt.toISOString(),
      });
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ notifications: items });
  } catch (error) {
    console.error("RESIDENT_NOTIFICATIONS_GET_ERROR", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load notifications.",
      },
      { status: 500 }
    );
  }
}
