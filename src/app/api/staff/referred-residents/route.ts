import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { REFERRAL_RECEIVING_BARANGAY_NAMES } from "@/lib/barangay-options";
import { anchorRecord, logAuditEvent, AuditEventType } from "@/lib/blockchain";

function createSlots(startTime: string, endTime: string, slotMinutes: number) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const slots: string[] = [];

  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  while (start < end) {
    const hour = start.getHours();
    const minute = start.getMinutes();

    if (hour !== 12) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }

    start.setMinutes(start.getMinutes() + slotMinutes);
  }

  return slots;
}

async function getApiUser() {
  return resolveAuthedUser({ barangay: true });
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

async function getBarangayAvailabilitySummary(barangayId: string) {
  const availabilities = await db.doctorAvailability.findMany({
    where: {
      barangayId,
      date: {
        gte: getTodayStart(),
      },
    },
    include: {
      doctor: {
        select: {
          id: true,
          fullName: true,
          username: true,
        },
      },
      appointments: {
        where: {
          barangayId,
          status: {
            not: "REJECTED",
          },
        },
        select: {
          time: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  let totalSlots = 0;
  let availableSlots = 0;
  let nextAvailability:
    | {
        id: string;
        date: Date;
        startTime: string;
        endTime: string;
        doctorName: string;
        freeSlots: number;
      }
    | null = null;

  for (const availability of availabilities) {
    const slots = createSlots(
      availability.startTime,
      availability.endTime,
      availability.slotMinutes
    );
    const takenSlots = new Set(
      availability.appointments.map((appointment) => appointment.time)
    );
    const freeSlots = slots.filter((slot) => !takenSlots.has(slot));

    totalSlots += slots.length;
    availableSlots += freeSlots.length;

    if (!nextAvailability && freeSlots.length > 0) {
      nextAvailability = {
        id: availability.id,
        date: availability.date,
        startTime: availability.startTime,
        endTime: availability.endTime,
        doctorName:
          availability.doctor.fullName ||
          availability.doctor.username ||
          "Doctor",
        freeSlots: freeSlots.length,
      };
    }
  }

  return {
    hasAvailableDoctor: availableSlots > 0,
    availableSlots,
    totalSlots,
    postedSchedules: availabilities.length,
    nextAvailability,
  };
}

async function findResidentForReferral(residentId: string, barangayId: string) {
  return db.resident.findFirst({
    where: {
      id: residentId,
      barangayId,
    },
    include: {
      barangay: {
        select: {
          name: true,
          municipality: true,
        },
      },
      user: {
        select: {
          username: true,
          email: true,
          phoneNumber: true,
          isVerified: true,
        },
      },
      medicalHistory: true,
      familyHistory: true,
      personalSocialHistory: true,
    },
  });
}

type ReferralResident = NonNullable<
  Awaited<ReturnType<typeof findResidentForReferral>>
>;

function normalizeText(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function isAllowedReferralReceivingBarangay(barangayName: string) {
  return REFERRAL_RECEIVING_BARANGAY_NAMES.includes(barangayName);
}

function getResidentFullName(resident: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
}) {
  return `${resident.firstName || ""} ${resident.middleName || ""} ${
    resident.lastName || ""
  }`
    .replace(/\s+/g, " ")
    .trim();
}

function buildIdentifyingData(resident: ReferralResident) {
  return {
    id: resident.id,
    fullName: getResidentFullName(resident),
    lastName: resident.lastName,
    firstName: resident.firstName,
    middleName: resident.middleName,
    age: resident.age,
    sex: resident.sex,
    birthDate: resident.birthDate.toISOString(),
    religion: resident.religion,
    houseStreet: resident.houseStreet,
    completeAddress: resident.completeAddress,
    barangayName: resident.barangayName,
    city: resident.city,
    civilStatus: resident.civilStatus,
    contactNumber: resident.contactNumber,
    educationalAttainment: resident.educationalAttainment,
    occupation: resident.occupation,
    accompanyingPerson: resident.accompanyingPerson,
    relationship: resident.relationship,
    spouseMaidenName: resident.spouseMaidenName,
    spouseOccupation: resident.spouseOccupation,
    spouseContactNumber: resident.spouseContactNumber,
    email: resident.email || resident.user?.email || null,
    phoneNumber: resident.phoneNumber || resident.user?.phoneNumber || null,
    username: resident.user?.username || null,
    isVerified: resident.user?.isVerified ?? false,
    sourceBarangayName: resident.barangay?.name || resident.barangayName,
    sourceMunicipality: resident.barangay?.municipality || resident.city,
  };
}

function buildMedicalHistory(resident: ReferralResident) {
  const history = resident.medicalHistory;
  if (!history) return null;

  return {
    hasHypertension: history.hasHypertension,
    hasDiabetes: history.hasDiabetes,
    hasStiHiv: history.hasStiHiv,
    hasHeartDisease: history.hasHeartDisease,
    hasKidneyFailure: history.hasKidneyFailure,
    hasTuberculosis: history.hasTuberculosis,
    hasAllergies: history.hasAllergies,
    allergiesDetails: history.allergiesDetails,
    hasCancer: history.hasCancer,
    cancerDetails: history.cancerDetails,
    hasOtherConditions: history.hasOtherConditions,
    otherConditionsDetails: history.otherConditionsDetails,
    maintenanceMedications: history.maintenanceMedications,
    previousIllnessesSurgeries: history.previousIllnessesSurgeries,
  };
}

function buildFamilyHistory(resident: ReferralResident) {
  const history = resident.familyHistory;
  if (!history) return null;

  return {
    asthmaAllergies: history.asthmaAllergies,
    birthDefects: history.birthDefects,
    cancer: history.cancer,
    dementia: history.dementia,
    diabetes: history.diabetes,
    hypertension: history.hypertension,
    kidneyDisease: history.kidneyDisease,
    mentalIllness: history.mentalIllness,
  };
}

function buildPersonalSocialHistory(resident: ReferralResident) {
  const history = resident.personalSocialHistory;
  if (!history) return null;

  return {
    eatsHealthyDiet: history.eatsHealthyDiet,
    adequatePhysicalActivity: history.adequatePhysicalActivity,
    sufficientRestSleep: history.sufficientRestSleep,
    normalGrowthDevelopment: history.normalGrowthDevelopment,
    multipleSexPartners: history.multipleSexPartners,
    smokesTobacco: history.smokesTobacco,
    tobaccoPacksPerYear: history.tobaccoPacksPerYear,
    drinksAlcohol: history.drinksAlcohol,
    alcoholBottlesPerDay: history.alcoholBottlesPerDay,
    takesIllicitDrugs: history.takesIllicitDrugs,
    illicitDrugsDetails: history.illicitDrugsDetails,
  };
}

function formatResidentOption(resident: ReferralResident) {
  return {
    id: resident.id,
    fullName: getResidentFullName(resident),
    age: resident.age,
    sex: resident.sex,
    birthDate: resident.birthDate,
    contactNumber: resident.contactNumber,
    completeAddress: resident.completeAddress,
  };
}

function formatReferral(referral: {
  id: string;
  status: string;
  reason: string | null;
  notes: string | null;
  identifyingData: unknown;
  medicalHistory: unknown;
  familyHistory: unknown;
  personalSocialHistory: unknown;
  createdAt: Date;
  updatedAt: Date;
  sourceBarangay: { id: string; name: string; municipality: string | null };
  targetBarangay: { id: string; name: string; municipality: string | null };
  referredByStaff: { id: string; fullName: string | null; username: string };
}) {
  return {
    id: referral.id,
    status: referral.status,
    reason: referral.reason,
    notes: referral.notes,
    identifyingData: referral.identifyingData,
    medicalHistory: referral.medicalHistory,
    familyHistory: referral.familyHistory,
    personalSocialHistory: referral.personalSocialHistory,
    createdAt: referral.createdAt,
    updatedAt: referral.updatedAt,
    sourceBarangay: referral.sourceBarangay,
    targetBarangay: referral.targetBarangay,
    referredByStaff: referral.referredByStaff,
  };
}

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user || !["BHW", "NURSE"].includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;

    const barangays = await db.barangay.findMany({
      where: {
        name: {
          in: REFERRAL_RECEIVING_BARANGAY_NAMES,
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    const availabilityBarangayIds = Array.from(
      new Set([barangayId, ...barangays.map((barangay) => barangay.id)])
    );

    const availabilitySummaries = await Promise.all(
      availabilityBarangayIds.map(async (availabilityBarangayId) => ({
        barangayId: availabilityBarangayId,
        summary: await getBarangayAvailabilitySummary(availabilityBarangayId),
      }))
    );
    const summaryByBarangayId = new Map(
      availabilitySummaries.map((item) => [item.barangayId, item.summary])
    );

    const [residents, receivedReferrals, sentReferrals] = await Promise.all([
      db.resident.findMany({
        where: {
          barangayId,
        },
        include: {
          barangay: {
            select: {
              name: true,
              municipality: true,
            },
          },
          user: {
            select: {
              username: true,
              email: true,
              phoneNumber: true,
              isVerified: true,
            },
          },
          medicalHistory: true,
          familyHistory: true,
          personalSocialHistory: true,
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      }),
      db.residentReferral.findMany({
        where: {
          targetBarangayId: barangayId,
        },
        include: {
          sourceBarangay: true,
          targetBarangay: true,
          referredByStaff: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.residentReferral.findMany({
        where: {
          sourceBarangayId: barangayId,
        },
        include: {
          sourceBarangay: true,
          targetBarangay: true,
          referredByStaff: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    return NextResponse.json({
      currentBarangay: user.barangay,
      localAvailability: summaryByBarangayId.get(barangayId) || {
        hasAvailableDoctor: false,
        availableSlots: 0,
        totalSlots: 0,
        postedSchedules: 0,
        nextAvailability: null,
      },
      targetBarangays: barangays
        .filter((barangay) => barangay.id !== barangayId)
        .map((barangay) => ({
          id: barangay.id,
          name: barangay.name,
          municipality: barangay.municipality,
          availability: summaryByBarangayId.get(barangay.id) || {
            hasAvailableDoctor: false,
            availableSlots: 0,
            totalSlots: 0,
            postedSchedules: 0,
            nextAvailability: null,
          },
        })),
      residents: residents.map(formatResidentOption),
      receivedReferrals: receivedReferrals.map(formatReferral),
      sentReferrals: sentReferrals.map(formatReferral),
    });
  } catch (error) {
    console.error("STAFF_REFERRED_RESIDENTS_GET_ERROR", error);

    return NextResponse.json(
      { error: "Failed to load referred residents." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getApiUser();

    if (!user || !["BHW", "NURSE"].includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const residentId = String(body.residentId || "").trim();
    const targetBarangayId = String(body.targetBarangayId || "").trim();
    const reason = normalizeText(body.reason);
    const notes = normalizeText(body.notes);
    const sourceBarangayId = user.barangayId;

    if (!residentId || !targetBarangayId || !reason) {
      return NextResponse.json(
        { error: "Please select a resident, receiving barangay, and reason." },
        { status: 400 }
      );
    }

    if (targetBarangayId === sourceBarangayId) {
      return NextResponse.json(
        { error: "Please select the other barangay for referral." },
        { status: 400 }
      );
    }

    const [resident, targetBarangay] = await Promise.all([
      findResidentForReferral(residentId, sourceBarangayId),
      db.barangay.findUnique({
        where: {
          id: targetBarangayId,
        },
      }),
    ]);

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found in your barangay." },
        { status: 404 }
      );
    }

    if (!targetBarangay) {
      return NextResponse.json(
        { error: "Receiving barangay not found." },
        { status: 404 }
      );
    }

    if (!isAllowedReferralReceivingBarangay(targetBarangay.name)) {
      return NextResponse.json(
        { error: "Please select a valid receiving barangay for referral." },
        { status: 400 }
      );
    }

    const [sourceAvailability, targetAvailability] = await Promise.all([
      getBarangayAvailabilitySummary(sourceBarangayId),
      getBarangayAvailabilitySummary(targetBarangayId),
    ]);

    if (sourceAvailability.hasAvailableDoctor) {
      return NextResponse.json(
        {
          error:
            "Referral is only allowed when your barangay has no open doctor slots.",
        },
        { status: 400 }
      );
    }

    if (!targetAvailability.hasAvailableDoctor) {
      return NextResponse.json(
        {
          error:
            "Referral cannot be sent because the receiving barangay has no open doctor slots.",
        },
        { status: 400 }
      );
    }

    const existingReferral = await db.residentReferral.findFirst({
      where: {
        residentId,
        sourceBarangayId,
        targetBarangayId,
        status: "PENDING",
      },
    });

    if (existingReferral) {
      return NextResponse.json(
        { error: "This resident already has a pending referral." },
        { status: 400 }
      );
    }

    const medicalHistory = buildMedicalHistory(resident);
    const familyHistory = buildFamilyHistory(resident);
    const personalSocialHistory = buildPersonalSocialHistory(resident);

    const referral = await db.residentReferral.create({
      data: {
        residentId,
        referredByStaffId: user.id,
        sourceBarangayId,
        targetBarangayId,
        reason,
        notes,
        identifyingData: buildIdentifyingData(resident),
        ...(medicalHistory ? { medicalHistory } : {}),
        ...(familyHistory ? { familyHistory } : {}),
        ...(personalSocialHistory ? { personalSocialHistory } : {}),
      },
      include: {
        sourceBarangay: true,
        targetBarangay: true,
        referredByStaff: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    anchorRecord(
      residentId,
      {
        referralId: referral.id,
        sourceBarangayId,
        targetBarangayId,
        reason,
        notes,
        identifyingData: buildIdentifyingData(resident),
        medicalHistory,
        familyHistory,
        personalSocialHistory,
      },
      "referral"
    ).then(() =>
      logAuditEvent(
        AuditEventType.REFERRAL_CREATED,
        user.id,
        residentId,
        sourceBarangayId,
        null,
        { role: user.role, targetBarangayId, referralId: referral.id }
      )
    ).catch(err => console.error("[blockchain] referral anchor failed:", err));

    return NextResponse.json(
      {
        success: true,
        message: "Resident referral sent.",
        referral: formatReferral(referral),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("STAFF_REFERRED_RESIDENTS_POST_ERROR", error);

    return NextResponse.json(
      { error: "Failed to send resident referral." },
      { status: 500 }
    );
  }
}
