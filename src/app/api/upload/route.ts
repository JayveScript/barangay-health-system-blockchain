import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Allowed MIME types and their magic bytes
const ALLOWED_TYPES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png":  [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

function detectMimeType(buffer: Buffer): string | null {
  for (const [mime, signatures] of Object.entries(ALLOWED_TYPES)) {
    for (const sig of signatures) {
      if (sig.every((byte, i) => buffer[i] === byte)) return mime;
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value ?? cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    try {
      verifyAuthToken(token);
    } catch {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // ── Parse form ───────────────────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // ── Size check ───────────────────────────────────────────────────────────
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ── Magic-byte MIME check (ignore Content-Type header) ───────────────────
    const detectedMime = detectMimeType(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    // ── Save file ────────────────────────────────────────────────────────────
    const ext = detectedMime.split("/")[1].replace("jpeg", "jpg");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ imageUrl: `/uploads/${fileName}` });
  } catch (error) {
    console.error("UPLOAD_ERROR", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 }
    );
  }
}