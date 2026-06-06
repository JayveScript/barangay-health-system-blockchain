import { prisma } from "@/lib/prisma";
import { getCurrentApiUser } from "@/lib/tenant-auth";

export default async function ResidentQRPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getCurrentApiUser();

  const resident = await prisma.resident.findFirst({
    where: {
      id,
      ...(viewer?.role === "SUPER_ADMIN"
        ? {}
        : { barangayId: viewer?.barangayId || "" }),
    },
    include: {
      user: true,
    },
  });

  if (!resident) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-2xl bg-white p-6 shadow">
          Resident not found
        </div>
      </div>
    );
  }

  const fullName = `${resident.firstName} ${resident.middleName ?? ""} ${resident.lastName}`
    .replace(/\s+/g, " ")
    .trim();

  return (
    <main className="min-h-screen bg-[#EEF4FF] p-6">
      <div className="mx-auto max-w-2xl rounded-[28px] border border-blue-100 bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-black text-blue-900">
          Barangay Health Digital ID
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Resident verification information
        </p>

        <div className="mt-6 space-y-3">
          <Info label="Full Name" value={fullName} />
          <Info label="Sex" value={resident.sex} />
          <Info label="Age" value={resident.age} />
          <Info
            label="Birth Date"
            value={
              resident.birthDate
                ? new Date(resident.birthDate).toLocaleDateString()
                : ""
            }
          />
          <Info label="Civil Status" value={resident.civilStatus} />
          <Info label="Religion" value={resident.religion} />
          <Info label="Occupation" value={resident.occupation} />
          <Info label="Educational Attainment" value={resident.educationalAttainment} />
          <Info label="Complete Address" value={resident.completeAddress} />
          <Info label="Barangay" value={resident.barangayName} />
          <Info label="City" value={resident.city} />
          <Info label="Contact Number" value={resident.contactNumber} />
          <Info label="Email" value={resident.user?.email} />
        </div>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{String(value)}</p>
    </div>
  );
}
