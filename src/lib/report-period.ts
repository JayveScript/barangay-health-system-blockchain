// Shared helpers for month-scoped reports. A report "month" is a YYYY-MM string;
// records are bucketed by when they were encoded/updated (input month).

export function monthRange(
  month?: string | null
): { start: Date; end: Date } | null {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 1, 0, 0, 0, 0);
  return { start, end };
}

// True when `iso` (an ISO date string, e.g. a blob's __savedAt) falls in the month.
export function inMonth(iso: unknown, month?: string | null): boolean {
  const range = monthRange(month);
  if (!range) return true; // no month selected → all records count
  const t = new Date(String(iso ?? "")).getTime();
  if (Number.isNaN(t)) return false; // undated records excluded from a specific month
  return t >= range.start.getTime() && t < range.end.getTime();
}

export function monthLabel(month?: string | null): string {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return "All Months";
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
