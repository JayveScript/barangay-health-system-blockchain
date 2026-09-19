import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentApiUser,
  isSuperAdmin,
  canManageBarangay,
} from "@/lib/tenant-auth";

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
type Cell = { b1014: number; b1519: number; b2049: number; total: number };

const s = (v: unknown) => String(v ?? "").trim();
const has = (v: unknown) => s(v).length > 0;

function isHighBp(v: unknown): boolean {
  const m = s(v).match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!m) return false;
  return Number(m[1]) >= 130 || Number(m[2]) >= 90;
}

function bandOf(age: number | null | undefined): Band {
  const a = Number(age ?? 0);
  if (a >= 10 && a <= 14) return "b1014";
  if (a >= 15 && a <= 19) return "b1519";
  return "b2049";
}

function birthGrams(v: string): number | null {
  const num = parseFloat(v.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num) || num <= 0) return null;
  return num < 100 ? Math.round(num * 1000) : Math.round(num);
}

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
        resident: { select: { age: true, barangayName: true } },
      },
    });

    const counts: Record<string, Cell> = {};
    const add = (flag: string, band: Band) => {
      const c = (counts[flag] ??= { b1014: 0, b1519: 0, b2049: 0, total: 0 });
      c[band] += 1;
      c.total += 1;
    };

    for (const rec of records) {
      const d = (rec.data as Data) || {};
      const band = bandOf(rec.resident?.age);
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9];

      const monthDates = months.filter((n) => has(d[`pn${n}_date`])).length;
      const monthBp = months.filter((n) => has(d[`pn${n}_bp`])).length;
      const anyMonthHighBp = months.some((n) => isHighBp(d[`pn${n}_bp`]));
      const ttCount = ["tt1", "tt2", "tt3", "tt4", "tt5", "tt5plus"].filter((k) => has(d[k])).length;
      const parity = parseInt(s(d.ob_p), 10);
      const completed8 = monthDates >= 8;

      const cls = s(d.client_class); // Resident | Trans-in | Trans-out
      const isRes = cls === "Resident";
      const isTin = cls === "Trans-in";
      const isTout = cls === "Trans-out";

      const delivered = has(d.post_delivery_date);
      const tracked = has(d.lmp) || monthDates > 0;

      // ── I. PRENATAL ──────────────────────────────────────────────
      // 1. 8ANC (delivered women)
      if (delivered && completed8) add("anc8", band);
      if (delivered && completed8 && isRes) add("anc8_a1", band);
      if (delivered && completed8 && isTin) add("anc8_a2", band);
      if (delivered && tracked) add("anc8_b", band);
      if (delivered && tracked && isRes) add("anc8_b1", band);
      if (delivered && tracked && isTin) add("anc8_b2", band);
      if (isTout) add("anc8_b3", band);
      // 2. Nutritional status (1st trimester BMI)
      if (d.nutrition_bmi === "Normal BMI") add("bmi_normal", band);
      if (d.nutrition_bmi === "Low BMI") add("bmi_low", band);
      if (d.nutrition_bmi === "High BMI") add("bmi_high", band);
      // 3. Td vaccination
      if ((Number.isFinite(parity) ? parity : 0) === 0 && ttCount >= 2) add("td_first", band);
      if (Number.isFinite(parity) && parity >= 1 && ttCount >= 3) add("td_multi", band);
      // 4. Supplementation
      if (d.iron_supplement === "Yes" || d.prenatal_supplement === "Folic Acid") add("supp_iron", band);
      if (d.prenatal_supplement === "Micronutrient") add("supp_mms", band);
      if (d.prenatal_supplement === "Calcium Carbonate") add("supp_cal", band);
      if (d.prenatal_supplement === "Deworming Tablet") add("supp_deworm", band);
      // 5. Anemia
      if (has(d.pre_cbc_result) || months.some((n) => has(d[`pn${n}_cbc_result`]))) add("anemia_tested", band);
      if (d.pre_anemia === "Yes" || months.some((n) => d[`pn${n}_anemia`] === "Yes")) add("anemia_diag", band);
      // 6. GDM
      if (has(d.pre_gdm_screen_result) || months.some((n) => has(d[`pn${n}_gdm_screen_result`]))) add("gdm_screened", band);
      if (d.pre_diabetes === "Yes" || months.some((n) => d[`pn${n}_diabetes`] === "Yes")) add("gdm_positive", band);
      // 7. ANC BP
      if (completed8 && monthBp >= 8) add("anc_bp", band);
      if (anyMonthHighBp) add("anc_high_bp", band);
      if (d.anc_referred === "Yes") add("anc_referred", band);

      // ── II. INTRAPARTUM & NEWBORN ────────────────────────────────
      const outcome = s(d.post_pregnancy_outcome);
      const isAbortion = outcome === "Abortion / Miscarriage";
      const isFetalDeath = outcome === "Fetal Death";
      const isLiveBirth = outcome === "Full Term" || outcome === "Preterm";
      // 1. Total deliveries (exclude abortion/miscarriage)
      if (delivered && !isAbortion) add("deliveries", band);
      // 2. Skilled Health Professional
      if (delivered && d.post_attendant_type === "Physician") add("shp_physician", band);
      if (delivered && d.post_attendant_type === "Nurse") add("shp_nurse", band);
      if (delivered && d.post_attendant_type === "Midwife") add("shp_midwife", band);
      // 3. Facility Based Delivery
      if (delivered && d.post_facility_sector === "Public") add("fbd_public", band);
      if (delivered && d.post_facility_sector === "Private") add("fbd_private", band);
      // 4. Delivery type
      if (delivered && d.post_type === "Normal") add("dtype_vaginal", band);
      if (delivered && d.post_type === "Caesarean Section") add("dtype_cesarean", band);
      if (delivered && d.post_type === "Combined Vaginal-Cesarean") add("dtype_combined", band);
      // 5. Outcome
      if (outcome === "Full Term") add("outcome_fullterm", band);
      if (outcome === "Preterm") add("outcome_preterm", band);
      if (isFetalDeath) add("outcome_fetaldeath", band);
      if (isAbortion) add("outcome_abortion", band);
      // 6. Live births by birth weight & sex
      if (isLiveBirth && (d.post_newborn_sex === "Male" || d.post_newborn_sex === "Female")) {
        const sex = d.post_newborn_sex === "Male" ? "male" : "female";
        const g = birthGrams(s(d.post_birthweight));
        const cat = g === null ? "unknown" : g > 2500 ? "normal" : "low";
        add(`bw_${cat}_${sex}`, band);
      }

      // ── III. POSTPARTUM ──────────────────────────────────────────
      const pncDays = [0, 3, 7, 42];
      const pnc4 = pncDays.every((day) => has(d[`postd${day}_date`]));
      const pncBp = pncDays.every((day) => has(d[`postd${day}_bp`]));
      const pncCls = s(d.pnc_class) || cls; // fall back to prenatal classification
      const pncRes = pncCls === "Resident";
      const pncTin = pncCls === "Trans-in";
      const pncTout = pncCls === "Trans-out";
      const dueForPnc = delivered && !isAbortion;
      // 1. 4PNC
      if (pnc4) add("pnc4", band);
      if (pnc4 && pncRes) add("pnc4_a1", band);
      if (pnc4 && pncTin) add("pnc4_a2", band);
      if (dueForPnc) add("pnc4_b", band);
      if (dueForPnc && pncRes) add("pnc4_b1", band);
      if (dueForPnc && pncTin) add("pnc4_b2", band);
      if (pncTout) add("pnc4_b3", band);
      // 2. Postpartum supplementation
      if (d.post_iron_folic === "Yes") add("pp_iron", band);
      if (d.post_vitamin_a === "Yes") add("pp_vitamin_a", band);
      // 3. PNC BP
      if (pnc4 && pncBp) add("pnc_bp", band);
      if (pncDays.some((day) => isHighBp(d[`postd${day}_bp`])) || isHighBp(d.post_bp)) add("pnc_high_bp", band);
      if (d.pnc_referred === "Yes") add("pnc_referred", band);
    }

    const cell = (flag: string): Cell => counts[flag] ?? { b1014: 0, b1519: 0, b2049: 0, total: 0 };

    type Row = {
      label: string;
      indent?: number;
      header?: boolean;
      b1014?: number;
      b1519?: number;
      b2049?: number;
      total?: number;
      isData?: boolean;
    };
    const R = (label: string, indent: number, flag: string): Row => ({
      label,
      indent,
      isData: true,
      ...cell(flag),
    });
    const H = (label: string): Row => ({ label, header: true });
    const G = (label: string, indent = 0): Row => ({ label, indent }); // group heading, no numbers

    const rows: Row[] = [
      H("I. PRENATAL CARE SERVICES"),
      G("1. Completed at least 8 ANC (delivered women)"),
      R("a. Delivered & completed at least 8 ANC", 1, "anc8"),
      R("a1. On schedule (Resident)", 2, "anc8_a1"),
      R("a2. Trans-in from other LGUs", 2, "anc8_a2"),
      R("b. Delivered & tracked during pregnancy", 1, "anc8_b"),
      R("b1. Resident", 2, "anc8_b1"),
      R("b2. Trans-in", 2, "anc8_b2"),
      R("b3. Trans-out before completing 8 ANC", 2, "anc8_b3"),
      G("2. Nutritional status assessed (1st trimester)"),
      R("a. Normal BMI", 1, "bmi_normal"),
      R("b. Low BMI", 1, "bmi_low"),
      R("c. High BMI", 1, "bmi_high"),
      G("3. Tetanus / Td Vaccination Status"),
      R("a. First pregnancy given ≥2 doses (Parity=0)", 1, "td_first"),
      R("b. 2nd+ pregnancy given ≥3 doses / Td2+ (Parity≥1)", 1, "td_multi"),
      G("4. Prenatal Supplementation"),
      R("a. Iron with folic acid", 1, "supp_iron"),
      R("b. Multiple Micronutrient (MMS)", 1, "supp_mms"),
      R("c. Calcium carbonate", 1, "supp_cal"),
      R("d. Deworming tablet", 1, "supp_deworm"),
      G("5. Anemia Screening"),
      R("a. Tested for CBC or Hgb & Hct", 1, "anemia_tested"),
      R("b. Diagnosed with Anemia", 1, "anemia_diag"),
      G("6. Gestational Diabetes Screening"),
      R("a. Screened for Gestational Diabetes", 1, "gdm_screened"),
      R("b. Positive for Gestational Diabetes", 1, "gdm_positive"),
      G("7. ANC Blood Pressure Measurement"),
      R("a. BP measured during ANC visits (completed 8 ANC)", 1, "anc_bp"),
      R("a1. Identified with high BP (≥130/90) / danger signs", 2, "anc_high_bp"),
      R("a2. Referred to a higher-level facility", 2, "anc_referred"),

      H("II. INTRAPARTUM & NEWBORN CARE"),
      R("1. Total Deliveries (excluding abortion/miscarriage)", 0, "deliveries"),
      G("2. Skilled Health Professionals"),
      R("a. Physicians", 1, "shp_physician"),
      R("b. Nurses", 1, "shp_nurse"),
      R("c. Midwives", 1, "shp_midwife"),
      G("3. Facility Based Delivery"),
      R("a. Public", 1, "fbd_public"),
      R("b. Private", 1, "fbd_private"),
      G("4. Delivery Type"),
      R("a. Vaginal", 1, "dtype_vaginal"),
      R("b. Cesarean Section", 1, "dtype_cesarean"),
      R("c. Combined Vaginal-Cesarean", 1, "dtype_combined"),
      G("5. Pregnancy Delivery Outcome"),
      R("a. Full Term", 1, "outcome_fullterm"),
      R("b. Preterm", 1, "outcome_preterm"),
      R("c. Fetal Death", 1, "outcome_fetaldeath"),
      R("d. Abortion / Miscarriage", 1, "outcome_abortion"),
      G("6. Live births by Birth Weight"),
      R("a. Normal (>2500 g) — Male", 1, "bw_normal_male"),
      R("a. Normal (>2500 g) — Female", 1, "bw_normal_female"),
      R("b. Low (<2500 g) — Male", 1, "bw_low_male"),
      R("b. Low (<2500 g) — Female", 1, "bw_low_female"),
      R("c. Unknown — Male", 1, "bw_unknown_male"),
      R("c. Unknown — Female", 1, "bw_unknown_female"),

      H("III. POSTPARTUM CARE"),
      G("1. Completed at least 4 PNC"),
      R("a. Delivered & completed at least 4 PNC", 1, "pnc4"),
      R("a1. On schedule (Resident)", 2, "pnc4_a1"),
      R("a2. Trans-in from other LGUs", 2, "pnc4_a2"),
      R("b. Due for PNC", 1, "pnc4_b"),
      R("b1. Resident", 2, "pnc4_b1"),
      R("b2. Trans-in", 2, "pnc4_b2"),
      R("b3. Trans-out before completing 4 PNC", 2, "pnc4_b3"),
      G("2. Postpartum Supplementation"),
      R("a. Iron with folic acid", 1, "pp_iron"),
      R("b. Vitamin A supplementation", 1, "pp_vitamin_a"),
      G("3. PNC Blood Pressure Measurement"),
      R("a. BP measured during PNC visits (completed 4 PNC)", 1, "pnc_bp"),
      R("a1. Identified with high BP (≥130/90) / danger signs", 2, "pnc_high_bp"),
      R("a2. Referred to a higher-level facility", 2, "pnc_referred"),
    ];

    const scope = isSuperAdmin(user)
      ? "All barangays"
      : records[0]?.resident?.barangayName || "Your barangay";

    return NextResponse.json({ scope, totalRecords: records.length, rows });
  } catch (err) {
    console.error("REPORTS_MATERNAL_ERROR", err);
    return NextResponse.json({ error: "Failed to build report." }, { status: 500 });
  }
}
