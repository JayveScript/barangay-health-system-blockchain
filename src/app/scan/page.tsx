import { redirect } from "next/navigation";
import { getScannerUser } from "@/lib/get-scanner-user";
import { decryptQrToken } from "@/lib/qr-encryption";
import { prisma } from "@/lib/prisma";
import { logQrScanActivity } from "@/lib/qr-audit";
import { formatWelcomeLine } from "@/lib/role-labels";
import { SecureScanGate } from "@/components/SecureScanGate";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  searchParams: Promise<{ t?: string; id?: string }>;
};

export default async function SecureScanPage({ searchParams }: PageProps) {
  const { t: qrToken, id: legacyResidentId } = await searchParams;

  const scannerUser = await getScannerUser();
  if (!scannerUser) {
    redirect("/access-denied");
  }

  const payload = qrToken ? decryptQrToken(qrToken) : null;
  const residentId = payload?.residentId || legacyResidentId;

  if (!residentId) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#EEF4FF] p-5">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-black text-slate-900">Invalid QR Code</h1>
          <p className="mt-2 text-sm text-slate-500">
            This QR code is missing verification data. Please scan a valid resident Digital ID.
          </p>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: scannerUser.userId },
    select: {
      id: true,
      fullName: true,
      role: true,
      barangayId: true,
    },
  });

  if (!user) {
    redirect("/access-denied");
  }

  const headerStore = await headers();
  const ipAddress = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = headerStore.get("user-agent");

  await logQrScanActivity({
    residentId,
    scannedById: user.id,
    role: user.role,
    action: "SCAN_INITIATED",
    success: true,
    meta: {
      ipAddress,
      userAgent,
      deviceInfo: userAgent?.match(/mobile|android|iphone/i)
        ? "Mobile"
        : userAgent?.match(/tablet|ipad/i)
          ? "Tablet"
          : "Desktop",
    },
  });

  const welcomeLine = formatWelcomeLine(user.role, user.fullName);

  return (
    <SecureScanGate
      qrToken={qrToken}
      residentId={!payload ? residentId : undefined}
      welcomeLine={welcomeLine}
      role={user.role}
    />
  );
}
