import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canManageBarangay,
  getCurrentApiUser,
  resolveScopeBarangayId,
} from "@/lib/tenant-auth";
import { sendAnnouncementEmail } from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const user = await getCurrentApiUser();

    if (!user || !user.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const manage = searchParams.get("manage") === "1";
    const statusFilter = searchParams.get("status"); // PENDING | PUBLISHED | ARCHIVED
    const barangayId = resolveScopeBarangayId(
      user,
      searchParams.get("barangayId")
    );

    // Admin "Manage Announcements": every announcement for the barangay,
    // any date, filterable by status. Admins only.
    if (manage) {
      if (!canManageBarangay(user)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const announcements = await prisma.announcement.findMany({
        where: {
          barangayId,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(announcements);
    }

    const selectedDate = date ? new Date(date) : new Date();

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    // Date view: published announcements, plus the viewer's own submissions
    // (so a staff member can see their still-pending post).
    const announcements = await prisma.announcement.findMany({
      where: {
        barangayId,
        publishDate: { gte: start, lte: end },
        OR: [{ status: "PUBLISHED" }, { authorId: user.id }],
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("GET_ADMIN_ANNOUNCEMENTS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to load announcements." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentApiUser();

    const role = String(user?.role || "");
    const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"];
    const isAdmin = canManageBarangay(user);
    const canPostAnnouncement = isAdmin || STAFF_ROLES.includes(role);

    if (!canPostAnnouncement || !user?.barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const barangayId = resolveScopeBarangayId(user, body.barangayId);

    if (!body.title || !body.content || !body.publishDate) {
      return NextResponse.json(
        { error: "Title, content, and publish date are required." },
        { status: 400 }
      );
    }

    // Admins publish directly; staff posts wait for admin approval.
    const status = isAdmin ? "PUBLISHED" : "PENDING";

    const announcement = await prisma.announcement.create({
      data: {
        barangayId,
        title: body.title,
        content: body.content,
        imageUrl: body.imageUrl || null,
        publishDate: new Date(body.publishDate),
        status,
        authorId: user.id,
        authorName: (user as { fullName?: string | null }).fullName ?? null,
        authorRole: role,
      },
    });

    // A pending (staff-submitted) announcement is not emailed to residents
    // until an admin approves/publishes it.
    if (status !== "PUBLISHED") {
      return NextResponse.json(announcement);
    }

    const barangay = await prisma.barangay.findUnique({
      where: { id: barangayId },
      select: { name: true },
    });

    const residents = await prisma.resident.findMany({
      where: { barangayId },
      select: {
        email: true,
        user: { select: { email: true } },
      },
    });

    const barangayName = barangay?.name ?? "Barangay";

    const emailPromises = residents
      .map((r) => r.email || r.user?.email)
      .filter((email): email is string => !!email)
      .map((email) =>
        sendAnnouncementEmail(
          email,
          barangayName,
          announcement.title,
          announcement.content,
          announcement.publishDate,
          announcement.imageUrl
        ).catch((err) =>
          console.error(`Failed to send announcement email to ${email}:`, err)
        )
      );

    Promise.all(emailPromises);

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("CREATE_ANNOUNCEMENT_ERROR", error);
    return NextResponse.json(
      { error: "Failed to create announcement." },
      { status: 500 }
    );
  }
}
