import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyAuthToken } from "@/lib/auth";

async function getApiUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const payload = verifyAuthToken(token);
    return await db.user.findUnique({
      where: { id: payload.userId },
      include: { barangay: true },
    });
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    const user = await getApiUser();
    if (!user || !["BHW", "STAFF"].includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const where: { barangayId: string; visitDate?: { gte: Date; lt: Date } } = {
      barangayId: user.barangayId,
    };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.visitDate = { gte: start, lt: end };
    }

    const entries = await db.healthCenterLogbook.findMany({
      where,
      orderBy: { visitDate: "desc" },
      take: 200,
    });

    return NextResponse.json(entries);
  } catch (err) {
    console.error("LOGBOOK_GET_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getApiUser();
    if (!user || !["BHW", "STAFF"].includes(String(user.role))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const purpose = String(body.purpose || "").trim();
    const visitDate = body.visitDate ? new Date(body.visitDate) : new Date();

    if (!name || !purpose) {
      return NextResponse.json(
        { error: "Name and Purpose are required." },
        { status: 400 }
      );
    }

    if (Number.isNaN(visitDate.getTime())) {
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    }

    const entry = await db.healthCenterLogbook.create({
      data: {
        barangayId: user.barangayId,
        name,
        purpose,
        visitDate,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("LOGBOOK_POST_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
