"use client";

import React from "react";

/**
 * Shared, mobile-first chart primitives for every dashboard.
 *
 * These replace the hand-rolled CSS charts that were copy-pasted across the
 * admin / doctor / staff / nurse / midwife / bhw pages. They are built to never
 * overflow horizontally on small screens (down to 320px):
 *   - the donut circle is fluid (shrinks to fit, capped width) instead of a
 *     fixed 208px square,
 *   - grid columns use minmax(0,…) so they can actually shrink,
 *   - every label/value row uses min-w-0 + truncate + shrink-0 so long labels
 *     ellipsize instead of pushing the value out and overlapping,
 *   - wrappers carry the .chart-safe guard (max-width:100%; overflow-x:hidden).
 */

/** Default palette — matches the colors previously inlined in each dashboard. */
export const CHART_COLORS = ["#0EA5E9", "#EC4899", "#94A3B8", "#10B981", "#F59E0B"];

/**
 * Flexible datum so existing call-sites stay untouched: the admin pie passes
 * `{ name, value }`, the admin bars pass `{ name, total }`, and the doctor
 * charts pass `{ label, value }`. We normalize all of them here.
 */
export type ChartDatum = {
  label?: string;
  name?: string;
  value?: number;
  total?: number;
};

const labelOf = (d: ChartDatum) => d.label ?? d.name ?? "";
const valueOf = (d: ChartDatum) => d.value ?? d.total ?? 0;

/** Donut chart (conic-gradient ring + center total) with a stacked legend. */
export function DonutChart({
  data,
  colors = CHART_COLORS,
}: {
  data: ChartDatum[];
  colors?: string[];
}) {
  const items = data.map((d) => ({ name: labelOf(d), value: valueOf(d) }));
  const total = items.reduce((sum, item) => sum + item.value, 0);

  let cursor = 0;
  const gradient =
    total === 0
      ? "#E0F2FE 0% 100%"
      : items
          .map((item, index) => {
            const start = cursor;
            const end = cursor + (item.value / total) * 100;
            cursor = end;
            return `${colors[index % colors.length]} ${start}% ${end}%`;
          })
          .join(", ");

  return (
    <div className="chart-safe grid w-full min-w-0 items-center gap-5 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)]">
      {/* Fluid ring — fills its column up to 12rem, never a fixed 208px square. */}
      <div className="relative mx-auto flex aspect-square w-full max-w-[12rem] items-center justify-center rounded-full bg-sky-50">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        />
        <div className="relative flex aspect-square w-3/5 flex-col items-center justify-center rounded-full bg-white shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 sm:text-xs">Total</p>
          <p className="text-2xl font-black text-slate-900 sm:text-3xl">{total}</p>
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="truncate text-sm font-bold text-slate-700">{item.name}</span>
            </div>
            <span className="shrink-0 text-lg font-black text-sky-600">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal labeled bar list, scaled to the max value in the set. */
export function BarList({ data }: { data: ChartDatum[] }) {
  const items = data.map((d) => ({ label: labelOf(d), value: valueOf(d) }));
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="chart-safe w-full min-w-0 space-y-4">
      {items.map((item, index) => {
        const width = Math.round((item.value / max) * 100);
        return (
          <div key={`${item.label}-${index}`} className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-bold text-slate-700">{item.label}</span>
              <span className="shrink-0 font-black text-sky-600">{item.value}</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-sky-50">
              <div
                className="h-full rounded-full bg-[#0EA5E9] transition-all duration-500"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Single percentage progress bar (0–100). */
export function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-semibold text-slate-700">{label}</span>
        <span className="shrink-0 font-bold text-sky-600">{value}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-sky-50">
        <div
          className="h-full rounded-full bg-[#0EA5E9]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
