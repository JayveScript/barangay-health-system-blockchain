import React from "react";

export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-blue-950">{title}</h2>
      <div className="mt-2 h-1 w-20 rounded-full bg-blue-600" />
    </div>
  );
}

export function QrInfoGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100">
          {icon}
        </span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</h4>
      </div>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </div>
  );
}

export function QrInfoRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="break-words text-right text-sm font-bold text-slate-900">{String(value)}</span>
    </div>
  );
}

export function QrFlagGroup({
  title,
  icon,
  items,
  tone = "bad",
  columns = 1,
}: {
  title: string;
  icon: React.ReactNode;
  items: { label: string; value: unknown; tone?: "good" | "bad" }[];
  tone?: "good" | "bad";
  columns?: 1 | 2;
}) {
  const visible = items.filter((item) =>
    typeof item.value === "boolean"
      ? true
      : item.value !== null && item.value !== undefined && String(item.value).trim() !== ""
  );

  if (visible.length === 0) {
    return <p className="text-sm font-semibold text-slate-400">No records in this section.</p>;
  }

  const headerBadge =
    tone === "bad"
      ? "bg-rose-50 text-rose-600 ring-rose-100"
      : "bg-emerald-50 text-emerald-600 ring-emerald-100";

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${headerBadge}`}>{icon}</span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</h4>
      </div>
      <div className={columns === 2 ? "grid sm:grid-cols-2 sm:gap-x-10" : ""}>
        {visible.map((item) => {
          const isBool = typeof item.value === "boolean";
          const itemTone = item.tone ?? tone;
          return (
            <div key={item.label} className="flex items-center justify-between gap-4 border-b border-slate-100 py-3">
              <span className="text-sm text-slate-500">{item.label}</span>
              {isBool ? (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                    item.value === true
                      ? itemTone === "good"
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                        : "bg-rose-50 text-rose-700 ring-rose-100"
                      : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}
                >
                  {item.value === true ? "Yes" : "No"}
                </span>
              ) : (
                <span className="break-words text-right text-sm font-bold text-slate-900">{String(item.value)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InfoCard({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">{String(value)}</p>
    </div>
  );
}
