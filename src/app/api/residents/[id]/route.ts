import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { canManageBarangay, getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";
import { anchorRecord, logAuditEvent, AuditEventType } from "@/lib/blockchain";

async function verifyAdminPassword(userId: string, password: string) {
  const admin = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!admin) {
    return {
      ok: false,
      error: "Admin account not found.",
      status: 404,
    };
  }

  const isValid = await bcrypt.compare(password, admin.password);

  if (!isValid) {
    return {
      ok: false,
      error: "Invalid admin password.",
      status: 401,
    };
  }

  return {
    ok: true,
    error: "",
    status: 200,
  };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { password, email, ...data } = await req.json();
    const currentUser = await getCurrentApiUser();
    const currentUserId = currentUser?.id;
    const barangayId = currentUser?.barangayId;

    const role = String(currentUser?.role || "");
    const canEditResident =
      canManageBarangay(currentUser) ||
      ["BHW", "NURSE", "MIDWIFE"].includes(role);

    if (!canEditResident || !currentUserId || !barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Resident ID is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Admin password is required." },
        { status: 400 }
      );
    }

    const verified = await verifyAdminPassword(currentUserId, password);

    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.error },
        { status: verified.status }
      );
    }

    const resident = await prisma.resident.findFirst({
      where: {
        id,
        ...(isSuperAdmin(currentUser) ? {} : { barangayId }),
      },
      select: {
        id: true,
      },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found." },
        { status: 404 }
      );
    }

    const updatedResident = await prisma.resident.update({
      where: {
        id,
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        age: Number(data.age),
        sex: data.sex,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        religion: data.religion || null,
        civilStatus: data.civilStatus || null,
        educationalAttainment: data.educationalAttainment || null,
        occupation: data.occupation || null,
        contactNumber: data.contactNumber || null,
        accompanyingPerson: data.accompanyingPerson || null,
        relationship: data.relationship || null,
        spouseMaidenName: data.spouseMaidenName || null,
        spouseOccupation: data.spouseOccupation || null,
        spouseContactNumber: data.spouseContactNumber || null,
        completeAddress: data.completeAddress || null,
        barangayName: data.barangayName,
        city: data.city || null,
      },
    });

    if (email) {
      await prisma.user.updateMany({
        where: {
          resident: {
            id,
            barangayId,
          },
        },
        data: {
          email,
        },
      });
    }

    anchorRecord(
      id,
      {
        firstName: updatedResident.firstName,
        lastName: updatedResident.lastName,
        middleName: updatedResident.middleName,
        age: updatedResident.age,
        sex: updatedResident.sex,
        birthDate: updatedResident.birthDate,
        civilStatus: updatedResident.civilStatus,
        completeAddress: updatedResident.completeAddress,
        barangayName: updatedResident.barangayName,
        city: updatedResident.city,
      },
      "resident_profile"
    ).then(() =>
      logAuditEvent(
        AuditEventType.RECORD_UPDATED,
        currentUserId,
        id,
        barangayId,
        null,
        { role: currentUser?.role ?? "unknown", event: "resident_profile_updated" }
      )
    ).catch(err => console.error("[blockchain] resident update anchor failed:", err));

    return NextResponse.json({
      message: "Resident updated successfully.",
      resident: updatedResident,
    });
  } catch (error) {
    console.error("UPDATE_RESIDENT_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update resident." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { password } = await req.json();
    const currentUser = await getCurrentApiUser();
    const currentUserId = currentUser?.id;
    const barangayId = currentUser?.barangayId;

    if (!canManageBarangay(currentUser) || !currentUserId || !barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Resident ID is required." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Admin password is required." },
        { status: 400 }
      );
    }

    const verified = await verifyAdminPassword(currentUserId, password);

    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.error },
        { status: verified.status }
      );
    }

    const resident = await prisma.resident.findFirst({
      where: {
        id,
        ...(isSuperAdmin(currentUser) ? {} : { barangayId }),
      },
      select: {
        id: true,
      },
    });

    if (!resident) {
      return NextResponse.json(
        { error: "Resident not found." },
        { status: 404 }
      );
    }

    await prisma.resident.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Resident deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE_RESIDENT_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete resident." },
      { status: 500 }
    );
  }
}
