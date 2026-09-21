import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentApiUser,
  isSuperAdmin,
  canManageBarangay,
} from "@/lib/tenant-auth";
import { displayAge } from "@/lib/age";

export const runtime = "nodejs";

const STAFF_ROLES = ["DOCTOR", "NURSE", "BHW", "MIDWIFE", "PHARMACIST", "MEDTECH", "NUTRITIONIST"];

type PD = Record<string, string>;
type MFT = { m: number; f: number; t: number };

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
      select: { age: true, birthDate: true, sex: true, barangayName: true, philpenData: true },
    });

    const counts: Record<string, MFT> = {};
    const add = (flag: string, sex: string) => {
      const c = (counts[flag] ??= { m: 0, f: 0, t: 0 });
      c.t += 1;
      if (sex === "MALE") c.m += 1;
      else if (sex === "FEMALE") c.f += 1;
    };

    let assessedTotal = 0;
    for (const r of residents) {
      const pd = (r.philpenData as PD) || {};
      if (!pd || Object.keys(pd).length === 0) continue;
      const age = displayAge(r.birthDate, r.age);
      if (age == null || age < 20) continue; // PhilPEN is 20+
      const grp = age <= 59 ? "ad" : "sr"; // Adults 20-59 vs Senior 60+
      const sex = String(r.sex || "");
      assessedTotal += 1;

      add(`${grp}_assessed`, sex);
      if (pd.p1_smoker === "Yes") add(`${grp}_smoker`, sex);
      if (pd.p1_mgmt_bti === "Yes") add(`${grp}_bti`, sex);
      if (pd.p1_binge === "Yes") add(`${grp}_binge`, sex);
      if (pd.p1_activity === "No") add(`${grp}_inactive`, sex);
      if (pd.p1_lowfruit === "Yes") add(`${grp}_diet`, sex);
      if (pd.p1_bmi_class === "Overweight") add(`${grp}_overweight`, sex);
      if (pd.p1_bmi_class === "Obese") add(`${grp}_obese`, sex);

      // Cardiovascular / Hypertension
      const htn = pd.p1_htn === "Yes";
      const htnMeds = htn && pd.p1_htn_meds === "Yes";
      if (htn) add(`${grp}_htn`, sex);
      if (htnMeds) add(`${grp}_htn_meds`, sex);
      if (htnMeds && pd.p2_med_provided === "Provided by facility") add(`${grp}_htn_fac`, sex);
      if (htnMeds && pd.p2_med_provided === "Out of pocket") add(`${grp}_htn_oop`, sex);

      // Diabetes (Type II)
      const dm = pd.p1_dm === "Yes";
      const dmMeds = dm && pd.p1_dm_meds === "Yes";
      if (dm) add(`${grp}_dm`, sex);
      if (dmMeds) add(`${grp}_dm_meds`, sex);
      if (dmMeds && pd.p2_med_provided === "Provided by facility") add(`${grp}_dm_fac`, sex);
      if (dmMeds && pd.p2_med_provided === "Out of pocket") add(`${grp}_dm_oop`, sex);
    }

    const cell = (flag: string): MFT => counts[flag] ?? { m: 0, f: 0, t: 0 };
    type Row = { label: string; indent?: number; header?: boolean; isData?: boolean } & Partial<MFT>;
    const H = (label: string): Row => ({ label, header: true });
    const R = (label: string, indent: number, flag: string): Row => ({ label, indent, isData: true, ...cell(flag) });

    const rows: Row[] = [
      H("1. PhilPEN Risk Assessment"),
      { label: "Adults (20–59 years old)", indent: 0 },
      R("a. Risk assessed using PhilPEN protocol", 1, "ad_assessed"),
      R("b. Current smokers", 1, "ad_smoker"),
      R("c. Provided Brief Tobacco Intervention", 1, "ad_bti"),
      R("d. Binge drinkers", 1, "ad_binge"),
      R("e. Insufficient physical activity", 1, "ad_inactive"),
      R("f. Consumed unhealthy diet", 1, "ad_diet"),
      R("g. Overweight", 1, "ad_overweight"),
      R("h. Obese", 1, "ad_obese"),
      { label: "Senior Citizens (60 years old and above)", indent: 0 },
      R("i. Risk assessed using PhilPEN protocol", 1, "sr_assessed"),
      R("j. Current smokers", 1, "sr_smoker"),
      R("k. Provided Brief Tobacco Intervention", 1, "sr_bti"),
      R("l. Binge drinkers", 1, "sr_binge"),
      R("m. Insufficient physical activity", 1, "sr_inactive"),
      R("n. Consumed unhealthy diet", 1, "sr_diet"),
      R("o. Overweight", 1, "sr_overweight"),
      R("p. Obese", 1, "sr_obese"),

      H("2. Cardiovascular Disease (Hypertension)"),
      R("a. Adults identified as hypertensive", 1, "ad_htn"),
      R("b. Adults hypertensive with complete medications", 1, "ad_htn_meds"),
      R("b1. Provided by facility", 2, "ad_htn_fac"),
      R("b2. Out of pocket", 2, "ad_htn_oop"),
      R("c. Senior Citizens identified as hypertensive", 1, "sr_htn"),
      R("d. Senior hypertensive with complete medications", 1, "sr_htn_meds"),
      R("d1. Provided by facility", 2, "sr_htn_fac"),
      R("d2. Out of pocket", 2, "sr_htn_oop"),

      H("3. Diabetes Mellitus (Type II)"),
      R("a. Adults identified with Type II Diabetes", 1, "ad_dm"),
      R("b. Adults diabetic with complete medications", 1, "ad_dm_meds"),
      R("b1. Provided by facility", 2, "ad_dm_fac"),
      R("b2. Out of pocket", 2, "ad_dm_oop"),
      R("c. Senior Citizens identified with Type II Diabetes", 1, "sr_dm"),
      R("d. Senior diabetic with complete medications", 1, "sr_dm_meds"),
      R("d1. Provided by facility", 2, "sr_dm_fac"),
      R("d2. Out of pocket", 2, "sr_dm_oop"),
    ];

    const scope = isSuperAdmin(user)
      ? "All barangays"
      : residents[0]?.barangayName || "Your barangay";

    return NextResponse.json({ scope, totalRecords: assessedTotal, rows });
  } catch (err) {
    console.error("REPORTS_PHILPEN_ERROR", err);
    return NextResponse.json({ error: "Failed to build report." }, { status: 500 });
  }
}
