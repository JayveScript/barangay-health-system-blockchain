import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

const STATIC_BARANGAY = "Barangay 19-B";
const STATIC_CITY = "Davao City";

type Body = {
  lastName: string;
  firstName: string;
  middleName?: string;
  age: number | string;
  sex: "MALE" | "FEMALE";
  birthDate: string;
  religion?: string;
  houseStreet?: string;
  completeAddress: string;
  civilStatus:
    | "SINGLE"
    | "MARRIED"
    | "WIDOWED"
    | "ANNULLED"
    | "SEPARATED"
    | "COHABITANT";
  contactNumber?: string;
  educationalAttainment?: string;
  occupation?: string;
  accompanyingPerson?: string;
  relationship?: string;
  spouseMaidenName?: string;
  spouseOccupation?: string;
  spouseContactNumber?: string;
  hasHypertension?: boolean;
  hasDiabetes?: boolean;
  hasStiHiv?: boolean;
  hasHeartDisease?: boolean;
  hasKidneyFailure?: boolean;
  hasTuberculosis?: boolean;
  hasAllergies?: boolean;
  allergiesDetails?: string;
  hasCancer?: boolean;
  cancerDetails?: string;
  hasOtherConditions?: boolean;
  otherConditionsDetails?: string;
  maintenanceMedications?: string;
  previousIllnessesSurgeries?: string;
  familyAsthmaAllergies?: boolean;
  familyBirthDefects?: boolean;
  familyCancer?: boolean;
  familyDementia?: boolean;
  familyDiabetes?: boolean;
  familyHypertension?: boolean;
  familyKidneyDisease?: boolean;
  familyMentalIllness?: boolean;
  eatsHealthyDiet?: boolean;
  adequatePhysicalActivity?: boolean;
  sufficientRestSleep?: boolean;
  normalGrowthDevelopment?: boolean;
  multipleSexPartners?: boolean;
  smokesTobacco?: boolean;
  tobaccoPacksPerYear?: string;
  drinksAlcohol?: boolean;
  alcoholBottlesPerDay?: string;
  takesIllicitDrugs?: boolean;
  illicitDrugsDetails?: string;
};

async function getApiUser() {
  return resolveAuthedUser({ barangay: true });
}

function normalize(value?: string) {
  return String(value || "").trim() || null;
}

export async function POST(req: Request) {
  try {
    const user = await getApiUser();
    if (!user || String(user.role) !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const barangayId = user.barangayId;
    const barangayName = user.barangay?.name || STATIC_BARANGAY;
    const city = user.barangay?.municipality || STATIC_CITY;
    const body = (await req.json()) as Body;
    const age = Number(body.age);
    const birthDate = new Date(body.birthDate);

    if (
      !body.lastName ||
      !body.firstName ||
      !body.sex ||
      !body.civilStatus ||
      !body.completeAddress ||
      Number.isNaN(age) ||
      age <= 0 ||
      Number.isNaN(birthDate.getTime())
    ) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    const now = Date.now();
    const usernameBase = `${body.firstName}.${body.lastName}`
      .replace(/\s+/g, "")
      .toLowerCase();
    const generatedUsername = `${usernameBase}.${now.toString().slice(-6)}`;
    const generatedPasswordHash = await hash(`resident-${now}`, 10);

    const result = await db.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName: `${body.firstName} ${body.lastName}`.trim(),
          username: generatedUsername,
          password: generatedPasswordHash,
          role: "RESIDENT",
          isVerified: false,
          barangayId,
        },
      });

      const resident = await tx.resident.create({
        data: {
          lastName: body.lastName,
          firstName: body.firstName,
          middleName: normalize(body.middleName),
          age,
          sex: body.sex,
          birthDate,
          religion: normalize(body.religion),
          houseStreet: normalize(body.houseStreet),
          completeAddress: body.completeAddress,
          barangayName,
          city,
          civilStatus: body.civilStatus,
          contactNumber: normalize(body.contactNumber),
          educationalAttainment: normalize(body.educationalAttainment),
          occupation: normalize(body.occupation),
          accompanyingPerson: normalize(body.accompanyingPerson),
          relationship: normalize(body.relationship),
          spouseMaidenName: normalize(body.spouseMaidenName),
          spouseOccupation: normalize(body.spouseOccupation),
          spouseContactNumber: normalize(body.spouseContactNumber),
          userId: createdUser.id,
          barangayId,
        },
      });

      await tx.residentMedicalHistory.create({
        data: {
          residentId: resident.id,
          barangayId,
          hasHypertension: Boolean(body.hasHypertension),
          hasDiabetes: Boolean(body.hasDiabetes),
          hasStiHiv: Boolean(body.hasStiHiv),
          hasHeartDisease: Boolean(body.hasHeartDisease),
          hasKidneyFailure: Boolean(body.hasKidneyFailure),
          hasTuberculosis: Boolean(body.hasTuberculosis),
          hasAllergies: Boolean(body.hasAllergies),
          allergiesDetails: normalize(body.allergiesDetails),
          hasCancer: Boolean(body.hasCancer),
          cancerDetails: normalize(body.cancerDetails),
          hasOtherConditions: Boolean(body.hasOtherConditions),
          otherConditionsDetails: normalize(body.otherConditionsDetails),
          maintenanceMedications: normalize(body.maintenanceMedications),
          previousIllnessesSurgeries: normalize(body.previousIllnessesSurgeries),
        },
      });

      await tx.residentFamilyHistory.create({
        data: {
          residentId: resident.id,
          barangayId,
          asthmaAllergies: Boolean(body.familyAsthmaAllergies),
          birthDefects: Boolean(body.familyBirthDefects),
          cancer: Boolean(body.familyCancer),
          dementia: Boolean(body.familyDementia),
          diabetes: Boolean(body.familyDiabetes),
          hypertension: Boolean(body.familyHypertension),
          kidneyDisease: Boolean(body.familyKidneyDisease),
          mentalIllness: Boolean(body.familyMentalIllness),
        },
      });

      await tx.residentPersonalSocialHistory.create({
        data: {
          residentId: resident.id,
          barangayId,
          eatsHealthyDiet: Boolean(body.eatsHealthyDiet),
          adequatePhysicalActivity: Boolean(body.adequatePhysicalActivity),
          sufficientRestSleep: Boolean(body.sufficientRestSleep),
          normalGrowthDevelopment: Boolean(body.normalGrowthDevelopment),
          multipleSexPartners: Boolean(body.multipleSexPartners),
          smokesTobacco: Boolean(body.smokesTobacco),
          tobaccoPacksPerYear: normalize(body.tobaccoPacksPerYear),
          drinksAlcohol: Boolean(body.drinksAlcohol),
          alcoholBottlesPerDay: normalize(body.alcoholBottlesPerDay),
          takesIllicitDrugs: Boolean(body.takesIllicitDrugs),
          illicitDrugsDetails: normalize(body.illicitDrugsDetails),
        },
      });

      return resident;
    });

    return NextResponse.json({
      success: true,
      message: "Resident registered successfully.",
      residentId: result.id,
    });
  } catch (error) {
    console.error("STAFF_RESIDENT_REGISTRATION_ERROR", error);
    return NextResponse.json(
      { error: "Failed to register resident." },
      { status: 500 }
    );
  }
}
