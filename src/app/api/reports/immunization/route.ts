import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentApiUser,
  isSuperAdmin,
  canManageBarangay,
} from "@/lib/tenant-auth";

export const runtime = "nodejs";

const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"];

type D = Record<string, string>;
type MFT = { m: number; f: number; t: number };
const has = (v: unknown) => String(v ?? "").trim().length > 0;

export async function GET() {
  try {
    const user = await getCurrentApiUser();
    const role = String(user?.role || "");
    const allowed =
      !!user && (STAFF_ROLES.includes(role) || canManageBarangay(user) || isSuperAdmin(user));
    if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const residents = await prisma.resident.findMany({
      where: {
        isArchived: false,
        ...(isSuperAdmin(user) ? {} : { barangayId: user!.barangayId ?? undefined }),
      },
      select: { sex: true, barangayName: true, immunizationData: true },
    });

    const counts: Record<string, MFT> = {};
    const add = (flag: string, sex: string) => {
      const c = (counts[flag] ??= { m: 0, f: 0, t: 0 });
      c.t += 1;
      if (sex === "MALE") c.m += 1;
      else if (sex === "FEMALE") c.f += 1;
    };

    let children = 0;
    for (const r of residents) {
      const d = (r.immunizationData as D) || {};
      if (!d || Object.keys(d).length === 0) continue;
      const sex = String(r.sex || "");
      children += 1;

      if (has(d.imm_bcg_24hrs)) add("bcg", sex);
      if (has(d.imm_hepb_24hrs)) add("hepb", sex);
      if (has(d.imm_penta_6wks)) add("penta1", sex);
      if (has(d.imm_penta_10wks)) add("penta2", sex);
      if (has(d.imm_penta_14wks)) add("penta3", sex);
      if (has(d.imm_opv_6wks)) add("opv1", sex);
      if (has(d.imm_opv_10wks)) add("opv2", sex);
      if (has(d.imm_opv_14wks)) add("opv3", sex);
      if (has(d.imm_ipv_14wks)) add("ipv1", sex);
      if (has(d.imm_ipv_9mos)) add("ipv2", sex);
      if (has(d.imm_pcv_6wks)) add("pcv1", sex);
      if (has(d.imm_pcv_10wks)) add("pcv2", sex);
      if (has(d.imm_pcv_14wks)) add("pcv3", sex);
      if (has(d.imm_mmr_9mos)) add("mmr1", sex);
      if (has(d.imm_mmr_12mos)) add("mmr2", sex);
      if (d.imm_fic === "Yes") add("fic", sex);
      if (d.imm_cic === "Yes") add("cic", sex);
    }

    const cell = (flag: string): MFT => counts[flag] ?? { m: 0, f: 0, t: 0 };
    type Row = { label: string; indent?: number; header?: boolean; isData?: boolean } & Partial<MFT>;
    const H = (label: string): Row => ({ label, header: true });
    const R = (label: string, flag: string): Row => ({ label, indent: 1, isData: true, ...cell(flag) });

    const rows: Row[] = [
      H("A.1 Immunization Services (doses given)"),
      R("BCG (within 24 hours)", "bcg"),
      R("Hepatitis B (within 24 hours)", "hepb"),
      R("DPT-HiB-HepB 1", "penta1"),
      R("DPT-HiB-HepB 2", "penta2"),
      R("DPT-HiB-HepB 3", "penta3"),
      R("OPV 1", "opv1"),
      R("OPV 2", "opv2"),
      R("OPV 3", "opv3"),
      R("IPV 1", "ipv1"),
      R("IPV 2", "ipv2"),
      R("PCV 1", "pcv1"),
      R("PCV 2", "pcv2"),
      R("PCV 3", "pcv3"),
      R("MMR 1", "mmr1"),
      R("MMR 2", "mmr2"),
      H("Immunization Status"),
      R("Fully Immunized Child (FIC)", "fic"),
      R("Completely Immunized Child (CIC)", "cic"),
    ];

    const scope = isSuperAdmin(user)
      ? "All barangays"
      : residents[0]?.barangayName || "Your barangay";

    return NextResponse.json({ scope, totalRecords: children, rows });
  } catch (err) {
    console.error("REPORTS_IMMUNIZATION_ERROR", err);
    return NextResponse.json({ error: "Failed to build report." }, { status: 500 });
  }
}
