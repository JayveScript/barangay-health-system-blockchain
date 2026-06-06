import { getCurrentResidentUser } from "@/lib/current-user";

export async function GET() {
  const user = await getCurrentResidentUser();

  if (!user || !user.resident) {
    return Response.json({ error: "Resident not found" }, { status: 404 });
  }

  return Response.json({
    id: user.resident.id,
    lastName: user.resident.lastName,
    firstName: user.resident.firstName,
    middleName: user.resident.middleName,
    age: user.resident.age,
    sex: user.resident.sex,
    birthDate: user.resident.birthDate,
    religion: user.resident.religion,

    completeAddress: user.resident.completeAddress,
    barangayName: user.resident.barangayName,
    city: user.resident.city,
    civilStatus: user.resident.civilStatus,
    contactNumber: user.resident.contactNumber,
    educationalAttainment: user.resident.educationalAttainment,
    occupation: user.resident.occupation,
    accompanyingPerson: user.resident.accompanyingPerson,
    relationship: user.resident.relationship,
    spouseMaidenName: user.resident.spouseMaidenName,
    spouseOccupation: user.resident.spouseOccupation,
    spouseContactNumber: user.resident.spouseContactNumber,

    email: user.email,
    phoneNumber: user.phoneNumber,
    username: user.username,
    isVerified: user.isVerified,

    medicalHistory: user.resident.medicalHistory,
    familyHistory: user.resident.familyHistory,
    personalSocialHistory: user.resident.personalSocialHistory,
  });
}