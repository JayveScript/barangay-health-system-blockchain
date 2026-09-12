import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageBarangay, getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";
import { sendAnnouncementEmail } from "@/lib/mail";

export const runtime = "nodejs";

// Admin-only management of a single announcement: approve/publish, edit,
// archive, or restore. Super admins can act on any barangay; barangay admins
// only on their own.
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentApiUser();
    if (!user || !canManageBarangay(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    }
    if (!isSuperAdmin(user) && existing.barangayId !== user.barangayId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body.content === "string" && body.content.trim()) data.content = body.content.trim();
    if (body.publishDate) data.publishDate = new Date(body.publishDate);
    if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl || null;

    const nextStatus =
      body.status && ["PENDING", "PUBLISHED", "ARCHIVED"].includes(body.status)
        ? String(body.status)
        : null;
    if (nextStatus) data.status = nextStatus;

    const becomingPublished = nextStatus === "PUBLISHED" && existing.status !== "PUBLISHED";

    const updated = await prisma.announcement.update({ where: { id }, data });

    // Email residents only the first time an announcement becomes published.
    if (becomingPublished) {
      const barangay = await prisma.barangay.findUnique({
        where: { id: updated.barangayId },
        select: { name: true },
      });
      const residents = await prisma.resident.findMany({
        where: { barangayId: updated.barangayId },
        select: { email: true, user: { select: { email: true } } },
      });
      const barangayName = barangay?.name ?? "Barangay";
      Promise.all(
        residents
          .map((r) => r.email || r.user?.email)
          .filter((e): e is string => !!e)
          .map((email) =>
            sendAnnouncementEmail(
              email,
              barangayName,
              updated.title,
              updated.content,
              updated.publishDate,
              updated.imageUrl
            ).catch((err) => console.error(`Announcement email to ${email} failed:`, err))
          )
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH_ANNOUNCEMENT_ERROR", err);
    return NextResponse.json({ error: "Failed to update announcement." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentApiUser();
    if (!user || !canManageBarangay(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Announcement not found." }, { status: 404 });
    }
    if (!isSuperAdmin(user) && existing.barangayId !== user.barangayId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE_ANNOUNCEMENT_ERROR", err);
    return NextResponse.json({ error: "Failed to delete announcement." }, { status: 500 });
  }
}
