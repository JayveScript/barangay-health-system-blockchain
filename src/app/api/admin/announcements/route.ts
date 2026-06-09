import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageBarangay, getCurrentApiUser } from "@/lib/tenant-auth";
import { sendAnnouncementEmail } from "@/lib/mail";

export async function GET(req: Request) {
  try {
    const user = await getCurrentApiUser();
    const barangayId = user?.barangayId;

    if (!user || !barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const selectedDate = date ? new Date(date) : new Date();

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const announcements = await prisma.announcement.findMany({
      where: {
        barangayId,
        publishDate: {
          gte: start,
          lte: end,
        },
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
    const barangayId = user?.barangayId;

    if (!canManageBarangay(user) || !barangayId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.title || !body.content || !body.publishDate) {
      return NextResponse.json(
        { error: "Title, content, and publish date are required." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        barangayId,
        title: body.title,
        content: body.content,
        imageUrl: body.imageUrl || null,
        publishDate: new Date(body.publishDate),
      },
    });

    // Send email notifications to all barangay residents with an email on file
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

    // Fire-and-forget — don't block the response
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
