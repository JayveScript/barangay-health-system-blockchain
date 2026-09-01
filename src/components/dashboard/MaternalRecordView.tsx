"use client";

import { useState, type ReactNode } from "react";
import { formatRoleLabel } from "@/lib/role-labels";

type MaternalData = Record<string, string> | null | undefined;

// Age of Gestation is derived live from LMP + today's date.
function liveGestation(lmp: string | undefined): string {
  if (!lmp) return "";
  const start = new Date(lmp);
  if (Number.isNaN(start.getTime())) return "";
  const diffMs = Date.now() - start.getTime();
  if (diffMs < 0) return "";
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} week${weeks === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"}`;
}

// Age of Gestation at a specific prenatal visit = (Date of Visit - LMP).
function gestationBetween(lmp: string | undefined, visitDate: string | undefined): string {
  if (!lmp || !visitDate) return "";
  const start = new Date(lmp);
  const visit = new Date(visitDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(visit.getTime())) return "";
  const diffMs = visit.getTime() - start.getTime();
  if (diffMs < 0) return "";
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return `${weeks} week${weeks === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"}`;
}

type Section = { title: string; fields: [string, string][]; tests?: [string, string][] };
type TabId = "obgyne" | "prenatal" | "postnatal";

const OBGYNE_SECTIONS: Section[] = [
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

const PRENATAL_SECTIONS: Section[] = [
  {
    title: "Present Pregnancy — Baseline",
    fields: [
      ["lmp", "Last Menstrual Period"], ["edd", "Expected Date of Delivery"],
      ["gestation_age", "Age of Gestation"], ["risk_code", "Risk Code"],
      ["mother_baby_book", "Mother-Baby Book"],
      ["tt1", "TT1"], ["tt2", "TT2"], ["tt3", "TT3"], ["tt4", "TT4"], ["tt5", "TT5"],
      ["plan_deliver", "Plan to Deliver At"], ["accompanying", "Accompanying Person"],
      ["iodized_salt", "Iodized Salt"], ["iron_supplement", "Iron Supplement"],
      ["pre_dentist", "Seen by Dentist"], ["pre_dentist_date", "Dentist Date"],
      ["pre_physician", "Seen by Physician"], ["pre_physician_date", "Physician Date"],
      ["pre_other_tests", "Other Tests"],
    ],
    tests: [
      ["pre_bloodtype", "Bloodtype"], ["pre_fbs", "FBS / HBA1C / RBS"], ["pre_hbsag", "HBsAg"],
      ["pre_hemoglobin", "Hemoglobin"], ["pre_hiv", "HIV"], ["pre_syphilis", "Syphilis"],
      ["pre_tuberculosis", "Tuberculosis"], ["pre_urinalysis", "Urinalysis"],
    ],
  },
];

const POSTNATAL_SECTIONS: Section[] = [
  {
    title: "Delivery Details",
    fields: [
      ["post_delivery_date", "Date of Delivery"], ["post_place", "Place of Delivery"],
      ["post_type", "Type of Delivery"], ["post_outcome", "Outcome of Pregnancy"],
      ["post_attended", "Attended By"], ["post_complications", "Complications"],
      ["post_newborn_sex", "Sex of Newborn"], ["post_birthweight", "Birthweight"],
      ["post_hemoglobin", "Hemoglobin"], ["post_hemoglobin_date", "Hemoglobin Date"],
      ["post_vitamin_a", "Vitamin A"], ["post_vitamin_a_date", "Vitamin A Date"],
    ],
  },
];

// Repeating visit definitions (read-only rendering).
const PRENATAL_VISIT_FIELDS: [string, string][] = [
  ["date", "Date of Visit"], ["weight", "Weight (kg)"], ["bp", "Blood Pressure"],
  ["fundal", "Fundal Height (cm)"], ["fht", "Fetal Heart Tone"], ["remarks", "Findings / Remarks"],
];
const POSTNATAL_DAYS = [0, 3, 7, 42];
const POSTNATAL_VISIT_FIELDS: [string, string][] = [
  ["date", "Date of Visit"], ["bp", "Blood Pressure"], ["temp", "Temperature"],
  ["breastfeeding", "Breastfeeding"], ["counseling", "Counseling"], ["remarks", "Findings / Remarks"],
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
  const [tab, setTab] = useState<TabId>("obgyne");

  const renderSection = (section: Section) => {
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
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {k === "gestation_age" ? liveGestation(d.lmp) || d[k] : d[k]}
              </p>
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
  };

  // Read-only card for one repeating visit (prenatal month / postnatal day).
  // `aog`, when given, is rendered right after the Date of Visit chip.
  const renderVisit = (
    title: string,
    prefix: string,
    fields: [string, string][],
    aog?: string
  ) => {
    const rows = fields.filter(([suffix]) => has(`${prefix}_${suffix}`));
    if (rows.length === 0) return null;
    const chips: ReactNode[] = [];
    rows.forEach(([suffix, label]) => {
      chips.push(
        <div key={suffix} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">{d[`${prefix}_${suffix}`]}</p>
        </div>
      );
      if (suffix === "date" && aog) {
        chips.push(
          <div key="aog" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Age of Gestation</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">{aog}</p>
          </div>
        );
      }
    });
    return (
      <div key={prefix} className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
        <h4 className="mb-3 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white">
          {title}
        </h4>
        <div className="grid gap-2 sm:grid-cols-2">{chips}</div>
      </div>
    );
  };

  const prenatalVisits = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((n) =>
      renderVisit(
        `Prenatal Visit ${n} — Month ${n}`,
        `pn${n}`,
        PRENATAL_VISIT_FIELDS,
        gestationBetween(d.lmp, d[`pn${n}_date`])
      )
    )
    .filter(Boolean);
  const postnatalVisits = POSTNATAL_DAYS
    .map((day) => renderVisit(`Postnatal Visit — Day ${day}`, `postd${day}`, POSTNATAL_VISIT_FIELDS))
    .filter(Boolean);

  const tabs: { id: TabId; label: string }[] = [
    { id: "obgyne", label: "OB-Gyne History" },
    { id: "prenatal", label: "Prenatal Care" },
    { id: "postnatal", label: "Postnatal Care" },
  ];

  const EmptyNote = ({ text }: { text: string }) => (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );

  const obgyneContent = OBGYNE_SECTIONS.map(renderSection).filter(Boolean);
  const prenatalSectionContent = PRENATAL_SECTIONS.map(renderSection).filter(Boolean);
  const postnatalSectionContent = POSTNATAL_SECTIONS.map(renderSection).filter(Boolean);

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

      <div className="flex gap-1 rounded-2xl bg-[#EFF6FF] p-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl px-2 py-2.5 text-[11px] font-black uppercase tracking-wide transition sm:text-xs ${
              tab === t.id ? "bg-[#2563EB] text-white shadow-sm" : "text-slate-500 hover:bg-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "obgyne" && (
        <div className="space-y-4">
          {obgyneContent.length ? obgyneContent : <EmptyNote text="No OB-Gyne history recorded yet." />}
        </div>
      )}

      {tab === "prenatal" && (
        <div className="space-y-4">
          {prenatalSectionContent}
          {prenatalVisits}
          {prenatalSectionContent.length === 0 && prenatalVisits.length === 0 && (
            <EmptyNote text="No prenatal care recorded yet." />
          )}
        </div>
      )}

      {tab === "postnatal" && (
        <div className="space-y-4">
          {postnatalSectionContent}
          {postnatalVisits}
          {postnatalSectionContent.length === 0 && postnatalVisits.length === 0 && (
            <EmptyNote text="No postnatal care recorded yet." />
          )}
        </div>
      )}
    </div>
  );
}
