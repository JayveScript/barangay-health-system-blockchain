import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { DEFAULT_BARANGAY_CITY } from "@/lib/barangay-options";
import { anchorRecord } from "@/lib/blockchain";
import {
  buildResidentRecords,
  MEDICAL_RECORD_ORDER,
  type ResidentWithHistories,
} from "@/lib/resident-records";
import { sendRegistrationWelcomeEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCode = String(code).trim();

    const pending = await db.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (!pending) {
      return NextResponse.json(
        { error: "Pending registration not found." },
        { status: 404 }
      );
    }

    if (pending.otpCode !== normalizedCode) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    if (new Date() > pending.otpExpiresAt) {
      return NextResponse.json(
        { error: "Verification code has expired." },
        { status: 400 }
      );
    }

    const existingUserByEmail = await db.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 400 }
      );
    }

    const existingUserByUsername = await db.user.findUnique({
      where: { username: pending.username },
    });
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "This username is already registered." },
        { status: 400 }
      );
    }

    const existingResidentByEmail = await db.resident.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingResidentByEmail) {
      return NextResponse.json(
        { error: "This resident email already exists." },
        { status: 400 }
      );
    }

    if (pending.contactNumber) {
      const existingResidentByPhone = await db.resident.findFirst({
        where: { phoneNumber: pending.contactNumber },
      });
      if (existingResidentByPhone) {
        return NextResponse.json(
          { error: "This phone number is already registered." },
          { status: 400 }
        );
      }
    }

    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      let barangay = await tx.barangay.findUnique({
        where: { id: pending.barangayId },
      });

      if (!barangay) {
        barangay = await tx.barangay.create({
          data: {
            id: pending.barangayId,
            name: pending.barangayName,
            municipality: pending.city || DEFAULT_BARANGAY_CITY,
          },
        });
      }

      const user = await tx.user.create({
        data: {
          username: pending.username,
          email: normalizedEmail,
          password: pending.passwordHash,
          role: "RESIDENT",
          isVerified: true,
          barangayId: pending.barangayId,
        },
      });

      const resident = await tx.resident.create({
        data: {
          lastName: pending.lastName,
          firstName: pending.firstName,
          middleName: pending.middleName,
          age: pending.age,
          sex: pending.sex,
          isPregnant: pending.isPregnant,
          birthDate: pending.birthDate,
          religion: pending.religion,
          completeAddress: pending.completeAddress,
          barangayName: pending.barangayName,
          city: pending.city || DEFAULT_BARANGAY_CITY,
          civilStatus: pending.civilStatus,
          contactNumber: pending.contactNumber,
          educationalAttainment: pending.educationalAttainment,
          occupation: pending.occupation,
          accompanyingPerson: pending.accompanyingPerson,
          relationship: pending.relationship,
          spouseMaidenName: pending.spouseMaidenName,
          spouseOccupation: pending.spouseOccupation,
          spouseContactNumber: pending.spouseContactNumber,
          email: normalizedEmail,
          phoneNumber: pending.contactNumber,
          userId: user.id,
          barangayId: pending.barangayId,
        },
      });

      await tx.residentMedicalHistory.create({
        data: {
          residentId: resident.id,
          barangayId: pending.barangayId,
          hasHypertension: pending.hasHypertension,
          hasDiabetes: pending.hasDiabetes,
          hasStiHiv: pending.hasStiHiv,
          hasHeartDisease: pending.hasHeartDisease,
          hasKidneyFailure: pending.hasKidneyFailure,
          hasTuberculosis: pending.hasTuberculosis,
          hasAllergies: pending.hasAllergies,
          allergiesDetails: pending.allergiesDetails,
          hasCancer: pending.hasCancer,
          cancerDetails: pending.cancerDetails,
          hasOtherConditions: pending.hasOtherConditions,
          otherConditionsDetails: pending.otherConditionsDetails,
          maintenanceMedications: pending.maintenanceMedications,
          previousIllnessesSurgeries: pending.previousIllnessesSurgeries,
        },
      });

      await tx.residentFamilyHistory.create({
        data: {
          residentId: resident.id,
          barangayId: pending.barangayId,
          asthmaAllergies: pending.familyAsthmaAllergies,
          birthDefects: pending.familyBirthDefects,
          cancer: pending.familyCancer,
          dementia: pending.familyDementia,
          diabetes: pending.familyDiabetes,
          hypertension: pending.familyHypertension,
          kidneyDisease: pending.familyKidneyDisease,
          mentalIllness: pending.familyMentalIllness,
        },
      });

      await tx.residentPersonalSocialHistory.create({
        data: {
          residentId: resident.id,
          barangayId: pending.barangayId,
          eatsHealthyDiet: pending.eatsHealthyDiet,
          adequatePhysicalActivity: pending.adequatePhysicalActivity,
          sufficientRestSleep: pending.sufficientRestSleep,
          normalGrowthDevelopment: pending.normalGrowthDevelopment,
          multipleSexPartners: pending.multipleSexPartners,
          smokesTobacco: pending.smokesTobacco,
          tobaccoPacksPerYear: pending.tobaccoPacksPerYear,
          drinksAlcohol: pending.drinksAlcohol,
          alcoholBottlesPerDay: pending.alcoholBottlesPerDay,
          takesIllicitDrugs: pending.takesIllicitDrugs,
          illicitDrugsDetails: pending.illicitDrugsDetails,
        },
      });

      await tx.pendingRegistration.delete({
        where: { email: normalizedEmail },
      });

      return {
        userId: user.id,
        residentId: resident.id,
      };
    });

    {
      const residentFullName = `${pending.firstName} ${
        pending.middleName ?? ""
      } ${pending.lastName}`
        .replace(/\s+/g, " ")
        .trim();

      sendRegistrationWelcomeEmail(
        normalizedEmail,
        residentFullName,
        pending.barangayName,
        pending.username
      ).catch((err) =>
        console.error("[mail] registration welcome email failed:", err)
      );
    }

    ;(async () => {
      try {
        const residentId = result.residentId;

        const full = await db.resident.findUnique({
          where: { id: residentId },
          include: {
            medicalHistory: true,
            familyHistory: true,
            personalSocialHistory: true,
          },
        });
        if (!full) return;

        const records = buildResidentRecords(
          full as unknown as ResidentWithHistories
        );

        for (const recordType of MEDICAL_RECORD_ORDER) {
          const data = records[recordType];
          if (data) {
            await anchorRecord(residentId, data, recordType);
          }
        }
      } catch (blockchainErr) {
        console.error("[blockchain] verify-code anchor failed:", blockchainErr);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Account verified and created successfully.",
      userId: result.userId,
      residentId: result.residentId,
    });

  } catch (error: unknown) {
    console.error("VERIFY_CODE_ERROR", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = error.meta?.target;
      const field = Array.isArray(target) ? target[0] : "field";
      return NextResponse.json(
        { error: `This ${field} is already in use. Please use a different one.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to verify and create account." },
      { status: 500 }
    );
  }
}
