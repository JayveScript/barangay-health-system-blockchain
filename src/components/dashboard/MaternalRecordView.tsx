import { formatRoleLabel } from "@/lib/role-labels";

type MaternalData = Record<string, string> | null | undefined;

const SECTIONS: { title: string; fields: [string, string][]; tests?: [string, string][] }[] = [
  {
    title: "OB-Gyne History",
    fields: [
      ["ob_g", "G"], ["ob_p", "P"], ["ob_fullterm", "Full Term"], ["ob_preterm", "Preterm"],
      ["ob_abortion", "Abortion"], ["ob_living", "Living"], ["menarche_age", "Menarche Age"],
      ["menstrual_cycle", "Menstrual Cycle"], ["menstrual_flow", "Menstrual Flow (days)"],
      ["coitarche_age", "Coitarche Age"], ["fp_method", "Current FP Method"],
    ],
    tests: [["pap_smear", "Pap Smear"], ["via", "VIA"], ["sti", "History of STI"]],
  },
  {
    title: "Prenatal Care",
    fields: [
      ["risk_code", "Risk Code"], ["mother_baby_book", "Mother-Baby Book"],
      ["tt1", "TT1"], ["tt2", "TT2"], ["tt3", "TT3"], ["tt4", "TT4"], ["tt5", "TT5"],
      ["lmp", "Last Menstrual Period"], ["edd", "Expected Date of Delivery"],
      ["plan_deliver", "Plan to Deliver At"], ["gestation_age", "Age of Gestation"],
      ["accompanying", "Accompanying Person"], ["iodized_salt", "Iodized Salt"],
      ["iron_supplement", "Iron Supplement"], ["pre_dentist", "Seen by Dentist"],
      ["pre_dentist_date", "Dentist Date"], ["pre_physician", "Seen by Physician"],
      ["pre_physician_date", "Physician Date"], ["pre_other_tests", "Other Tests"],
    ],
    tests: [
      ["pre_bloodtype", "Bloodtype"], ["pre_fbs", "FBS / HBA1C / RBS"], ["pre_hbsag", "HBsAg"],
      ["pre_hemoglobin", "Hemoglobin"], ["pre_hiv", "HIV"], ["pre_syphilis", "Syphilis"],
      ["pre_tuberculosis", "Tuberculosis"], ["pre_urinalysis", "Urinalysis"],
    ],
  },
  {
    title: "Postnatal Care",
    fields: [
      ["post_delivery_date", "Date of Delivery"], ["post_place", "Place of Delivery"],
      ["post_type", "Type of Delivery"], ["post_outcome", "Outcome of Pregnancy"],
      ["post_attended", "Attended By"], ["post_complications", "Complications"],
      ["post_newborn_sex", "Sex of Newborn"], ["post_birthweight", "Birthweight"],
      ["post_hemoglobin", "Hemoglobin"], ["post_hemoglobin_date", "Hemoglobin Date"],
      ["post_vitamin_a", "Vitamin A"], ["post_vitamin_a_date", "Vitamin A Date"],
      ["post_breastfeeding", "Breastfeeding"], ["post_breastfeeding_date", "Breastfeeding Date"],
      ["post_counseling", "Counseling"], ["post_counseling_date", "Counseling Date"],
    ],
  },
  {
    title: "Pregnancy History",
    fields: [
      ["ph_dentist", "Seen by Dentist"], ["ph_dentist_visits", "Dentist Visits"],
      ["ph_physician", "Seen by Physician"], ["ph_physician_visits", "Physician Visits"],
      ["ph_trimester_1", "1st Trimester Visits"], ["ph_trimester_2", "2nd Trimester Visits"],
      ["ph_trimester_3", "3rd Trimester Visits"], ["ph_other_tests", "Other Tests"],
    ],
    tests: [
      ["ph_bloodtype", "Bloodtype"], ["ph_fbs", "FBS / HBA1C / RBS"], ["ph_hbsag", "HBsAg"],
      ["ph_hemoglobin", "Hemoglobin"], ["ph_hiv", "HIV"], ["ph_syphilis", "Syphilis"],
      ["ph_tuberculosis", "Tuberculosis"], ["ph_urinalysis", "Urinalysis"],
    ],
  },
];

export function MaternalRecordView({
  data,
  updatedBy,
  updatedAt,
}: {
  data: MaternalData;
  updatedBy?: { fullName?: string | null; role?: string | null } | null;
  updatedAt?: string | null;
}) {
  const d = data || {};
  const has = (k: string) => (d[k] ?? "").toString().trim() !== "";

  return (
    <div className="space-y-4">
      {(updatedBy || updatedAt) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
          <p className="text-sm font-bold text-[#2563EB]">
            Recorded by {updatedBy?.fullName?.trim() || "Health Worker"}
            {updatedBy?.role ? (
              <span className="ml-1 text-xs font-semibold text-slate-500">
                · {formatRoleLabel(String(updatedBy.role))}
              </span>
            ) : null}
          </p>
          {updatedAt ? (
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
              {new Date(updatedAt).toLocaleString()}
            </span>
          ) : null}
        </div>
      )}

      {SECTIONS.map((section) => {
        const rows = section.fields.filter(([k]) => has(k));
        const testRows = (section.tests || []).filter(
          ([k]) => has(`${k}_result`) || has(`${k}_date`)
        );
        if (rows.length === 0 && testRows.length === 0) return null;

        return (
          <div key={section.title} className="rounded-2xl border border-[#BFDBFE] bg-white p-4 shadow-sm">
            <h4 className="mb-3 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
              {section.title}
            </h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {rows.map(([k, label]) => (
                <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900">{d[k]}</p>
                </div>
              ))}
              {testRows.map(([k, label]) => {
                const result = (d[`${k}_result`] ?? "").toString().trim();
                const date = (d[`${k}_date`] ?? "").toString().trim();
                return (
                  <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">
                      {result || "—"}
                      {date ? <span className="ml-1 text-xs font-semibold text-slate-400">({date})</span> : null}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
