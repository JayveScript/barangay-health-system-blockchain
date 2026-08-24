import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mail";
import {
  DEFAULT_BARANGAY_CITY,
  getHealthCenterForSitio,
} from "@/lib/barangay-options";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      lastName,
      firstName,
      middleName,
      age,
      sex,
      isPregnant,
      birthDate,
      religion,
      completeAddress,
      barangayName,
      civilStatus,
      contactNumber,
      educationalAttainment,
      occupation,
      accompanyingPerson,
      relationship,
      spouseMaidenName,
      spouseOccupation,
      spouseContactNumber,

      hasHypertension,
      hasDiabetes,
      hasStiHiv,
      hasHeartDisease,
      hasKidneyFailure,
      hasTuberculosis,
      hasAllergies,
      allergiesDetails,
      hasCancer,
      cancerDetails,
      hasOtherConditions,
      otherConditionsDetails,
      maintenanceMedications,
      previousIllnessesSurgeries,

      familyAsthmaAllergies,
      familyBirthDefects,
      familyCancer,
      familyDementia,
      familyDiabetes,
      familyHypertension,
      familyKidneyDisease,
      familyMentalIllness,

      eatsHealthyDiet,
      adequatePhysicalActivity,
      sufficientRestSleep,
      normalGrowthDevelopment,
      multipleSexPartners,
      smokesTobacco,
      tobaccoPacksPerYear,
      drinksAlcohol,
      alcoholBottlesPerDay,
      takesIllicitDrugs,
      illicitDrugsDetails,

      username,
      email,
      password,
    } = body;

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim();
    const normalizedPhone = String(contactNumber || "").trim();
    // The resident picks their sitio; it maps to one of the two health centers.
    const selectedSitio = String(barangayName || "").trim();
    const healthCenterName = getHealthCenterForSitio(selectedSitio);

    const parsedAge = Number(age);
    const parsedBirthDate = new Date(birthDate);

    if (
      !lastName ||
      !firstName ||
      !normalizedUsername ||
      !password ||
      !sex ||
      !civilStatus ||
      !completeAddress ||
      !birthDate
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    if (String(password).length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Email is required for Gmail verification." },
        { status: 400 }
      );
    }

    if (Number.isNaN(parsedAge) || parsedAge <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid age." },
        { status: 400 }
      );
    }

    if (Number.isNaN(parsedBirthDate.getTime())) {
      return NextResponse.json(
        { error: "Please enter a valid birth date." },
        { status: 400 }
      );
    }

    const existing = await db.user.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
          { username: normalizedUsername },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email or username already exists." },
        { status: 400 }
      );
    }

    if (!healthCenterName) {
      return NextResponse.json(
        { error: "Please select a valid sitio." },
        { status: 400 }
      );
    }

    // Route the resident to their health center (tenant) based on their sitio.
    const barangay =
      (await db.barangay.findFirst({
        where: { name: healthCenterName },
      })) ||
      (await db.barangay.create({
        data: {
          name: healthCenterName,
          municipality: DEFAULT_BARANGAY_CITY,
        },
      }));

    const passwordHash = await hash(password, 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const pendingData = {
      lastName,
      firstName,
      middleName: middleName || null,
      age: parsedAge,
      sex,
      isPregnant: sex === "FEMALE" ? Boolean(isPregnant) : null,
      birthDate: parsedBirthDate,
      religion: religion || null,

      completeAddress,
      barangayName: selectedSitio,
      city: DEFAULT_BARANGAY_CITY,

      civilStatus,
      contactNumber: normalizedPhone || null,
      educationalAttainment: educationalAttainment || null,
      occupation: occupation || null,
      accompanyingPerson: accompanyingPerson || null,
      relationship: relationship || null,
      spouseMaidenName: spouseMaidenName || null,
      spouseOccupation: spouseOccupation || null,
      spouseContactNumber: spouseContactNumber || null,

      hasHypertension: Boolean(hasHypertension),
      hasDiabetes: Boolean(hasDiabetes),
      hasStiHiv: Boolean(hasStiHiv),
      hasHeartDisease: Boolean(hasHeartDisease),
      hasKidneyFailure: Boolean(hasKidneyFailure),
      hasTuberculosis: Boolean(hasTuberculosis),

      hasAllergies: Boolean(hasAllergies),
      allergiesDetails: allergiesDetails || null,

      hasCancer: Boolean(hasCancer),
      cancerDetails: cancerDetails || null,

      hasOtherConditions: Boolean(hasOtherConditions),
      otherConditionsDetails: otherConditionsDetails || null,

      maintenanceMedications: maintenanceMedications || null,
      previousIllnessesSurgeries: previousIllnessesSurgeries || null,

      familyAsthmaAllergies: Boolean(familyAsthmaAllergies),
      familyBirthDefects: Boolean(familyBirthDefects),
      familyCancer: Boolean(familyCancer),
      familyDementia: Boolean(familyDementia),
      familyDiabetes: Boolean(familyDiabetes),
      familyHypertension: Boolean(familyHypertension),
      familyKidneyDisease: Boolean(familyKidneyDisease),
      familyMentalIllness: Boolean(familyMentalIllness),

      eatsHealthyDiet: Boolean(eatsHealthyDiet),
      adequatePhysicalActivity: Boolean(adequatePhysicalActivity),
      sufficientRestSleep: Boolean(sufficientRestSleep),
      normalGrowthDevelopment: Boolean(normalGrowthDevelopment),
      multipleSexPartners: Boolean(multipleSexPartners),

      smokesTobacco: Boolean(smokesTobacco),
      tobaccoPacksPerYear: tobaccoPacksPerYear || null,

      drinksAlcohol: Boolean(drinksAlcohol),
      alcoholBottlesPerDay: alcoholBottlesPerDay || null,

      takesIllicitDrugs: Boolean(takesIllicitDrugs),
      illicitDrugsDetails: illicitDrugsDetails || null,

      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      otpCode: otp,
      otpExpiresAt,
      barangayId: barangay.id,
    };

    await db.pendingRegistration.upsert({
      where: { email: normalizedEmail },
      update: pendingData,
      create: pendingData,
    });

    await sendOtpEmail(normalizedEmail, otp);
    console.log("OTP dispatched via EMAIL");

    return NextResponse.json({
      success: true,
      message: "OTP sent to Gmail successfully.",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json(
      { error: "Register failed." },
      { status: 500 }
    );
  }
}
