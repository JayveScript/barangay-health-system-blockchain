import type { PrismaClient } from "@prisma/client";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import {
  BARANGAY_ADMIN_USERNAME_SUFFIX,
  isValidBarangayAdminUsername,
} from "./username-validation";

export type CreateBarangayAdminInput = {
  username: string;
  password: string;
  barangayName: string;
  municipality?: string | null;
  fullName?: string | null;
  email?: string | null;
};

export class CreateBarangayAdminError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "CreateBarangayAdminError";
  }
}

function normalizeOptional(value: unknown) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

export async function createBarangayAdmin(
  db: PrismaClient,
  input: CreateBarangayAdminInput
) {
  const username = String(input.username || "").trim().toLowerCase();
  const password = String(input.password || "");
  const barangayName = String(input.barangayName || "").trim();
  const municipality = normalizeOptional(input.municipality);
  const fullName = normalizeOptional(input.fullName) || barangayName;
  const email = normalizeOptional(input.email)?.toLowerCase() || null;

  if (!barangayName) {
    throw new CreateBarangayAdminError("Barangay name is required.");
  }

  if (!isValidBarangayAdminUsername(username)) {
    throw new CreateBarangayAdminError(
      `Barangay admin username must match /^[a-z0-9._-]+@barangay\\.hcms$/i and end with ${BARANGAY_ADMIN_USERNAME_SUFFIX}.`
    );
  }

  if (password.length < 8) {
    throw new CreateBarangayAdminError(
      "Password must be at least 8 characters."
    );
  }

  return db.$transaction(async (tx) => {
    const existingUser = await tx.user.findFirst({
      where: {
        OR: [{ username }, ...(email ? [{ email }] : [])],
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new CreateBarangayAdminError(
        "A user with this username or email already exists."
      );
    }

    const barangay = await tx.barangay.create({
      data: {
        name: barangayName,
        municipality,
      },
    });

    const passwordHash = await hash(password, 10);

    const admin = await tx.user.create({
      data: {
        fullName,
        username,
        email,
        password: passwordHash,
        role: Role.BARANGAY_ADMIN,
        isVerified: true,
        barangayId: barangay.id,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        barangay: {
          select: {
            id: true,
            name: true,
            municipality: true,
          },
        },
      },
    });

    return {
      ...admin,
      initializedWorkspace: {
        residents: 0,
        staffUsers: 0,
        appointments: 0,
        announcements: 0,
      },
    };
  });
}
