"use client";

import { ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Full-screen consent gate shown as the FIRST step of registration. The
// resident must read the Patient Consent and the Data Privacy Act notice and
// tick "I understand" before the Proceed button unlocks and the registration
// form becomes available.
export function ConsentGate({
  checked,
  onChange,
  onProceed,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  onProceed: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="px-4 py-5 sm:px-6">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-500">
          {t("consent.heading")}
        </p>
        <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
          {t("consent.gateTitle")}
        </h2>
        <p className="mt-1 text-sm font-medium text-slate-600">
          {t("consent.gateIntro")}
        </p>
      </div>

      {/* Patient Consent */}
      <section className="rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <FileText className="h-4 w-4" />
          </span>
          <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">
            {t("consent.patientHeading")}
          </h4>
        </div>
        <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-relaxed text-slate-600">
          <p>{t("consent.patientBody")}</p>
        </div>
      </section>

      {/* Data Privacy Act */}
      <section className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">
            {t("consent.privacyHeading")}
          </h4>
        </div>
        <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-relaxed text-slate-600">
          <p>{t("consent.body")}</p>
          <p className="mt-2 font-semibold text-slate-700">
            {t("consent.rights")}
          </p>
        </div>
      </section>

      {/* I understand */}
      <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <span>{t("consent.understand")}</span>
      </label>

      {/* Proceed — locked until the box is ticked */}
      <button
        type="button"
        onClick={onProceed}
        disabled={!checked}
        className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("consent.proceed")}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
