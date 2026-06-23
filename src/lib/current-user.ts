import { redirect } from "next/navigation";
import { resolveAuthedUser } from "@/lib/api-auth";

export async function getCurrentResidentUser() {
  const user = await resolveAuthedUser({
    barangay: true,
    resident: {
      include: {
        medicalHistory: true,
        familyHistory: true,
        personalSocialHistory: true,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}