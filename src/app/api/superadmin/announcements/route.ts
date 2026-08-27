import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentApiUser, isSuperAdmin } from "@/lib/tenant-auth";

// Super admin broadcast: create the announcement for EVERY barangay so all
// barangays (their residents and staff) see it through the normal per-barangay
// announcement feed.
export async function POST(req: Request) {
  try {
    const user = await getCurrentApiUser();
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const publishDate = body.publishDate ? new Date(body.publishDate) : new Date();
    if (Number.isNaN(publishDate.getTime())) {
      return NextResponse.json({ error: "Invalid publish date." }, { status: 400 });
    }

    const barangays = await prisma.barangay.findMany({ select: { id: true } });
    if (barangays.length === 0) {
      return NextResponse.json(
        { error: "No barangays exist yet to announce to." },
        { status: 400 }
      );
    }

    await prisma.announcement.createMany({
      data: barangays.map((b) => ({
        barangayId: b.id,
        title,
        content,
        publishDate,
      })),
    });

    return NextResponse.json({ success: true, count: barangays.length });
  } catch (err) {
    console.error("SUPERADMIN_ANNOUNCEMENT_ERROR", err);
    return NextResponse.json(
      { error: "Failed to post announcement." },
      { status: 500 }
    );
  }
}
