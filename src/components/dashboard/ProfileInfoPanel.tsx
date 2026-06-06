import type { ReactNode } from "react";
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type ProfileInfoPanelProps = {
  fullName?: string | null;
  initials: string;
  roleLabel: string;
  username?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  barangayName?: string | null;
  isVerified?: boolean | null;
  createdAt?: string | Date | null;
  eyebrow?: string;
};

function formatProfileDate(value?: string | Date | null) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProfileInfoPanel({
  fullName,
  initials,
  roleLabel,
  username,
  email,
  phoneNumber,
  barangayName,
  isVerified,
  createdAt,
  eyebrow = "Personal Info",
}: ProfileInfoPanelProps) {
  const displayName = fullName?.trim() || "Unnamed User";
  const displayBarangay = barangayName?.trim() || "Assigned Barangay";
  const statusLabel = isVerified ? "Verified Account" : "Pending Verification";

  return (
    <section className="overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-[#0369A1] via-[#0EA5E9] to-[#38BDF8] px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white/15 text-3xl font-black ring-1 ring-white/35 shadow-lg shadow-sky-950/20">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-100">
                {eyebrow}
              </p>

              <h2 className="mt-2 truncate text-2xl font-black text-white sm:text-4xl">
                {displayName}
              </h2>

              <p className="mt-2 text-sm font-semibold text-sky-50">
                {roleLabel}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-[36px] items-center gap-2 rounded-full bg-white/15 px-3 text-xs font-bold text-white ring-1 ring-white/30">
              <ShieldCheck className="h-4 w-4" />
              {statusLabel}
            </span>

            <span className="inline-flex min-h-[36px] items-center gap-2 rounded-full bg-white/15 px-3 text-xs font-bold text-white ring-1 ring-white/30">
              <MapPin className="h-4 w-4" />
              {displayBarangay}
            </span>
          </div>
        </div>
      </div>

      <div className="grid bg-sky-50/70 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border-b border-sky-100 p-5 lg:border-b-0 lg:border-r sm:p-6">
          <div className="space-y-4">
            <ProfileSummaryLine
              icon={<BadgeCheck className="h-5 w-5" />}
              label="Status"
              value={statusLabel}
            />
            <ProfileSummaryLine
              icon={<MapPin className="h-5 w-5" />}
              label="Barangay"
              value={displayBarangay}
            />
            <ProfileSummaryLine
              icon={<CalendarDays className="h-5 w-5" />}
              label="Created"
              value={formatProfileDate(createdAt)}
            />
          </div>
        </div>

        <dl className="divide-y divide-sky-100 bg-white">
          <ProfileDetailRow
            icon={<UserRound className="h-5 w-5" />}
            label="Full Name"
            value={displayName}
          />
          <ProfileDetailRow
            icon={<AtSign className="h-5 w-5" />}
            label="Username"
            value={username || "Not set"}
          />
          <ProfileDetailRow
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            value={email || "Not set"}
          />
          <ProfileDetailRow
            icon={<Phone className="h-5 w-5" />}
            label="Phone Number"
            value={phoneNumber || "Not set"}
          />
        </dl>
      </div>
    </section>
  );
}

function ProfileSummaryLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function ProfileDetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="grid gap-3 px-5 py-4 sm:grid-cols-[180px_1fr] sm:items-center sm:px-6">
      <dt className="flex min-w-0 items-center gap-3 text-xs font-black uppercase tracking-wide text-slate-400">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          {icon}
        </span>
        {label}
      </dt>

      <dd className="min-w-0 break-words text-sm font-bold text-slate-900">
        {value}
      </dd>
    </div>
  );
}
