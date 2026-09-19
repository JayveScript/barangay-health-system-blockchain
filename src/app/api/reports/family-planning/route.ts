import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentApiUser,
  isSuperAdmin,
  canManageBarangay,
} from "@/lib/tenant-auth";
import { displayAge } from "@/lib/age";

export const runtime = "nodejs";

const STAFF_ROLES = [
  "DOCTOR",
  "NURSE",
  "BHW",
  "MIDWIFE",
  "PHARMACIST",
  "MEDTECH",
  "NUTRITIONIST",
];

type Data = Record<string, string>;
type Band = "b1014" | "b1519" | "b2049";
type Cat = "na" | "oa" | "do" | "cu";
type Quad = { na: number; oa: number; do: number; cu: number };

const s = (v: unknown) => String(v ?? "").trim();

function bandOf(age: number | null | undefined): Band {
  const a = Number(age ?? 0);
  if (a >= 10 && a <= 14) return "b1014";
  if (a >= 15 && a <= 19) return "b1519";
  return "b2049";
}

// Acceptor category from the FP client type.
function catOf(clientType: string): Cat {
  switch (clientType) {
    case "New Acceptor":
      return "na";
    case "Dropout":
      return "do";
    case "Changing Method":
    case "Changing Clinic":
    case "Restart":
      return "oa";
    // Current User (and anything unset but with a method) = current user.
    default:
      return "cu";
  }
}

// Report method rows, keyed by the exact value stored in fpa_method.
const METHODS: [string, string][] = [
  ["FSTR / BTL", "1. FSTR / BTL"],
  ["MSTR / NSV", "2. MSTR / NSV"],
  ["Condom", "3. Condom"],
  ["IUD-Interval", "4. IUD-Interval"],
  ["IUD-Postpartum", "5. IUD-Postpartum"],
  ["Pills-POP", "6. Pills-POP"],
  ["Pills-COC", "7. Pills-COC"],
  ["Injectables", "8. Injectables"],
  ["Implants-Interval", "9. Implants-Interval"],
  ["Implants-Postpartum", "10. Implants-Postpartum"],
  ["NFP-CMM", "11. NFP-CMM"],
  ["NFP-BBT", "12. NFP-BBT"],
  ["NFP-STM", "13. NFP-STM"],
  ["NFP-SDM", "14. NFP-SDM"],
  ["NFP-LAM", "15. NFP-LAM"],
];
const BANDS: [Band, string][] = [
  ["b1014", "10 – 14 y.o"],
  ["b1519", "15 – 19 y.o"],
  ["b2049", "20 – 49 y.o"],
];

export async function GET() {
  try {
    const user = await getCurrentApiUser();
    const role = s(user?.role);
    const allowed =
      !!user && (STAFF_ROLES.includes(role) || canManageBarangay(user) || isSuperAdmin(user));
    if (!allowed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.maternalRecord.findMany({
      where: {
        resident: {
          isArchived: false,
          ...(isSuperAdmin(user) ? {} : { barangayId: user!.barangayId ?? undefined }),
        },
      },
      select: {
        data: true,
        resident: { select: { age: true, birthDate: true, barangayName: true } },
      },
    });

    // counts[methodValue][band] -> Quad
    const counts: Record<string, Record<Band, Quad>> = {};
    for (const [m] of METHODS) {
      counts[m] = {
        b1014: { na: 0, oa: 0, do: 0, cu: 0 },
        b1519: { na: 0, oa: 0, do: 0, cu: 0 },
        b2049: { na: 0, oa: 0, do: 0, cu: 0 },
      };
    }

    let counted = 0;
    for (const rec of records) {
      const d = (rec.data as Data) || {};
      const method = s(d.fpa_method);
      if (!counts[method]) continue; // no FP method recorded → not an FP client
      const band = bandOf(displayAge(rec.resident?.birthDate, rec.resident?.age));
      const cat = catOf(s(d.fpa_client_type));
      counts[method][band][cat] += 1;
      counted += 1;
    }

    type Row = {
      label: string;
      indent?: number;
      header?: boolean;
      isData?: boolean;
      na?: number;
      oa?: number;
      do?: number;
      cu?: number;
    };
    const rows: Row[] = [];
    const grand: Record<Band, Quad> = {
      b1014: { na: 0, oa: 0, do: 0, cu: 0 },
      b1519: { na: 0, oa: 0, do: 0, cu: 0 },
      b2049: { na: 0, oa: 0, do: 0, cu: 0 },
    };

    for (const [m, label] of METHODS) {
      rows.push({ label, header: true });
      for (const [band, bandLabel] of BANDS) {
        const q = counts[m][band];
        grand[band].na += q.na;
        grand[band].oa += q.oa;
        grand[band].do += q.do;
        grand[band].cu += q.cu;
        rows.push({ label: bandLabel, indent: 1, isData: true, ...q });
      }
    }

    rows.push({ label: "TOTAL (ALL METHODS)", header: true });
    for (const [band, bandLabel] of BANDS) {
      rows.push({ label: bandLabel, indent: 1, isData: true, ...grand[band] });
    }

    const scope = isSuperAdmin(user)
      ? "All barangays"
      : records[0]?.resident?.barangayName || "Your barangay";

    return NextResponse.json({ scope, totalRecords: counted, rows });
  } catch (err) {
    console.error("REPORTS_FP_ERROR", err);
    return NextResponse.json({ error: "Failed to build report." }, { status: 500 });
  }
}
