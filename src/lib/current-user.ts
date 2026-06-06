import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAuthToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentResidentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  let payload: { userId: string };

  try {
    payload = verifyAuthToken(token);
  } catch {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    include: {
      barangay: true,
      resident: {
        include: {
          medicalHistory: true,
          familyHistory: true,
          personalSocialHistory: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;

  
}