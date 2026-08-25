import { NextResponse } from "next/server";
import { resolveAuthedUser } from "@/lib/api-auth";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

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
  const authedUser = await resolveAuthedUser();
  if (!authedUser) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

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

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5 MB." },
      { status: 400 }
    );
  }

  let buffer: Buffer;
  try {
    const bytes = await file.arrayBuffer();
    buffer = Buffer.from(bytes);
  } catch (err) {
    console.error("UPLOAD_ERROR arrayBuffer():", err);
    return NextResponse.json({ error: "Failed to read file data." }, { status: 500 });
  }

  const detectedMime = detectMimeType(buffer);
  if (!detectedMime) {
    return NextResponse.json(
      { error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." },
      { status: 400 }
    );
  }

  const base64 = buffer.toString("base64");
  const imageUrl = `data:${detectedMime};base64,${base64}`;
  return NextResponse.json({ imageUrl });
}
