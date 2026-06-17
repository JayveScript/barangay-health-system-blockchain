import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  const content = [
    "[InternetShortcut]",
    `URL=${baseUrl}/login`,
    `IconFile=${baseUrl}/icons/icon-512.png`,
    "IconIndex=0",
  ].join("\r\n");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="Kalyo App.url"',
      "Cache-Control": "no-store",
    },
  });
}
