// Shared in-content loading state — one consistent design + size used across
// every dashboard list/section (residents, staff, admins, appointments, etc.).
export function InlineLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[180px] w-full flex-col items-center justify-center gap-3 rounded-[24px] border border-sky-200 bg-white px-4 py-10 text-center">
      <span className="h-8 w-8 shrink-0 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-500" />
      <p className="text-sm font-semibold text-sky-600">{label}</p>
    </div>
  );
}
