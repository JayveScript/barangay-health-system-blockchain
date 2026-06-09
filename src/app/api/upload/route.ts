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
  "image/gif":  [[0x47, 0x49, 0x46, 0x38]],
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
  // ── Auth check ──────────────────────────────────────────────────────────
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get("auth_token")?.value ?? cookieStore.get("token")?.value;
  } catch (err) {
    console.error("UPLOAD_ERROR cookies():", err);
    return NextResponse.json({ error: "Server error reading session." }, { status: 500 });
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    verifyAuthToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Parse form ───────────────────────────────────────────────────────────
  let file: File | null;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
  } catch (err) {
    console.error("UPLOAD_ERROR formData():", err);
    return NextResponse.json({ error: "Failed to read uploaded file." }, { status: 400 });
  }

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

  // ── Read bytes ───────────────────────────────────────────────────────────
  let buffer: Buffer;
  try {
    const bytes = await file.arrayBuffer();
    buffer = Buffer.from(bytes);
  } catch (err) {
    console.error("UPLOAD_ERROR arrayBuffer():", err);
    return NextResponse.json({ error: "Failed to read file data." }, { status: 500 });
  }

  // ── Magic-byte MIME check ────────────────────────────────────────────────
  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." },
      { status: 400 }
    );
  }

  // ── Save file ────────────────────────────────────────────────────────────
  try {
    const ext = detectedMime.split("/")[1].replace("jpeg", "jpg");
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    return NextResponse.json({ imageUrl: `/uploads/${fileName}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("UPLOAD_ERROR writeFile():", err);
    return NextResponse.json({ error: `Failed to save image file: ${msg}` }, { status: 500 });
  }
}
