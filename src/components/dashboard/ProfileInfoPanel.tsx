import type { ReactNode } from "react";
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
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
  roleLabel,
  username,
  email,
  phoneNumber,
  barangayName,
  isVerified,
  createdAt,
}: ProfileInfoPanelProps) {
  const displayName = fullName?.trim() || "Unnamed User";
  const displayBarangay = barangayName?.trim() || "Assigned Barangay";
  const statusLabel = isVerified ? "Verified Account" : "Pending Verification";

  return (
    <section className="overflow-hidden rounded-[28px] border border-sky-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-sky-100 px-5 py-4 sm:px-7">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">Account Details</h2>
          <p className="text-sm text-slate-500">{roleLabel}</p>
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
