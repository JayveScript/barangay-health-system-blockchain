"use client";

import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Inline Data Privacy Act consent block with a required acknowledgment checkbox.
// `checked`/`onChange` are controlled by the parent so submission can be gated.
export function ConsentNotice({
  checked,
  onChange,
  showError = false,
  className = "",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  showError?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div
      className={`rounded-2xl border border-sky-200 bg-sky-50/60 p-4 ${className}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">
          {t("consent.title")}
        </h4>
      </div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {t("consent.heading")}
      </p>
      <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 text-[13px] leading-relaxed text-slate-600">
        <p>{t("consent.body")}</p>
        <p className="mt-2 font-semibold text-slate-700">{t("consent.rights")}</p>
      </div>
      <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
        />
        <span>{t("consent.checkbox")}</span>
      </label>
      {showError && !checked && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          {t("consent.required")}
        </p>
      )}
    </div>
  );
}
