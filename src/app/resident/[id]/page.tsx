import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { getScannerUser } from "@/lib/get-scanner-user";
import { verifyQrAccessToken } from "@/lib/qr-access";
import { encryptQrPayload } from "@/lib/qr-encryption";
import { logQrScanActivity } from "@/lib/qr-audit";
import { formatWelcomeLine } from "@/lib/role-labels";
import { SecureScanGate } from "@/components/SecureScanGate";
import {
  ShieldCheck,
  UserRound,
  Phone,
  MapPin,
  Users,
  HeartPulse,
} from "lucide-react";
import { ConditionHistoryCard } from "@/components/ConditionHistoryCard";
import { ResidentComplaints } from "@/components/ResidentComplaints";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicResidentPage({ params }: PageProps) {
  const { id } = await params;

  // ── Security gate (defence-in-depth) ─────────────────────────────────────
  // Middleware already verified the JWT and checked the role. We read the
  // trusted headers it forwarded. If they're missing, reject immediately.
  const scannerUser = await getScannerUser();
  if (!scannerUser) {
    redirect("/access-denied");
  }
  // ─────────────────────────────────────────────────────────────────────────

  const viewer = await prisma.user.findUnique({
    where: { id: scannerUser.userId },
    select: {
      id: true,
      fullName: true,
      role: true,
      barangayId: true,
    },
  });

  if (!viewer) {
    redirect("/access-denied");
  }

  const cookieStore = await cookies();
  const qrAccessToken = cookieStore.get("qr_access_token")?.value;
  const qrAccess = qrAccessToken
    ? verifyQrAccessToken(qrAccessToken, id)
    : null;

  if (!qrAccess || qrAccess.userId !== viewer.id) {
    const residentStub = await prisma.resident.findUnique({
      where: { id },
      select: { id: true, barangayId: true },
    });

    if (!residentStub) {
      return (
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#EEF4FF] p-5">
          <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
            <h1 className="text-xl font-black text-slate-900">Resident Not Found</h1>
            <p className="mt-2 text-sm text-slate-500">
              This Digital ID record does not exist.
            </p>
          </div>
        </main>
      );
    }

    if (qrAccessToken && !qrAccess) {
      await logQrScanActivity({
        residentId: id,
        scannedById: viewer.id,
        role: viewer.role,
        action: "SESSION_EXPIRED",
        success: false,
        failureReason: "QR access session expired",
      });
    }

    let qrToken: string | undefined;
    try {
      qrToken = encryptQrPayload({
        residentId: residentStub.id,
        barangayId: residentStub.barangayId,
        issuedAt: Date.now(),
        v: 1,
      });
    } catch {
      qrToken = undefined;
    }

    await logQrScanActivity({
      residentId: residentStub.id,
      scannedById: viewer.id,
      role: viewer.role,
      action: "SCAN_INITIATED",
      success: true,
    });

    return (
      <SecureScanGate
        qrToken={qrToken}
        residentId={residentStub.id}
        welcomeLine={formatWelcomeLine(viewer.role, viewer.fullName)}
        role={viewer.role}
      />
    );
  }

  const [resident, appointments, bmiRecords, diagnoses] = await Promise.all([
  prisma.resident.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      age: true,
      sex: true,
      birthDate: true,
      religion: true,
      houseStreet: true,
      completeAddress: true,
      barangayName: true,
      city: true,
      civilStatus: true,
      contactNumber: true,
      educationalAttainment: true,
      occupation: true,
      accompanyingPerson: true,
      relationship: true,
      spouseMaidenName: true,
      spouseOccupation: true,
      spouseContactNumber: true,
      email: true,
      phoneNumber: true,

      user: {
        select: {
          username: true,
          email: true,
          phoneNumber: true,
          isVerified: true,
        },
      },

      medicalHistory: {
        select: {
          hasHypertension: true,
          hasDiabetes: true,
          hasStiHiv: true,
          hasHeartDisease: true,
          hasKidneyFailure: true,
          hasTuberculosis: true,
          hasAllergies: true,
          allergiesDetails: true,
          hasCancer: true,
          cancerDetails: true,
          hasOtherConditions: true,
          otherConditionsDetails: true,
          maintenanceMedications: true,
          previousIllnessesSurgeries: true,
        },
      },

      familyHistory: {
        select: {
          asthmaAllergies: true,
          birthDefects: true,
          cancer: true,
          dementia: true,
          diabetes: true,
          hypertension: true,
          kidneyDisease: true,
          mentalIllness: true,
        },
      },

      personalSocialHistory: {
        select: {
          eatsHealthyDiet: true,
          adequatePhysicalActivity: true,
          sufficientRestSleep: true,
          normalGrowthDevelopment: true,
          multipleSexPartners: true,
          smokesTobacco: true,
          tobaccoPacksPerYear: true,
          drinksAlcohol: true,
          alcoholBottlesPerDay: true,
          takesIllicitDrugs: true,
          illicitDrugsDetails: true,
        },
      },
    },
  }),
  prisma.appointment.findMany({
    where: { residentId: id },
    select: {
      id: true,
      date: true,
      time: true,
      reason: true,
      otherReason: true,
      suggestion: true,
      status: true,
      doctor: { select: { fullName: true } },
    },
    orderBy: { date: "desc" },
  }),
  prisma.bMIRecord.findMany({
    where: { residentId: id },
    select: {
      id: true,
      height: true,
      weight: true,
      bmi: true,
      bmiCategory: true,
      pulseRate: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  }),
  prisma.diagnosis.findMany({
    where: { residentId: id },
    select: {
      conditions: true,
      createdAt: true,
      diagnosedBy: {
        select: {
          fullName: true,
          barangay: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  }),
]);

  const diagnosisData = diagnoses.map((d) => ({
    conditions: d.conditions,
    createdAt: d.createdAt.toISOString(),
    diagnosedBy: {
      fullName: d.diagnosedBy?.fullName ?? null,
      barangay: d.diagnosedBy?.barangay
        ? { name: d.diagnosedBy.barangay.name }
        : null,
    },
  }));

  if (!resident) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#EEF4FF] p-5">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-black text-slate-900">
            Resident Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This Digital ID record does not exist.
          </p>
        </div>
      </main>
    );
  }

  const fullName = `${resident.firstName ?? ""} ${resident.middleName ?? ""} ${
    resident.lastName ?? ""
  }`
    .replace(/\s+/g, " ")
    .trim();

  const birthDate = resident.birthDate
    ? new Date(resident.birthDate).toLocaleDateString()
    : "";

  return (
    <main className="min-h-[100dvh] bg-[#EEF4FF] p-4">
      <style>{`
        .tab-input { display: none; }
        .tab-panel { display: none; }

        #tab-identifying:checked ~ .tab-panels .panel-identifying,
        #tab-medical:checked ~ .tab-panels .panel-medical,
        #tab-family:checked ~ .tab-panels .panel-family,
        #tab-social:checked ~ .tab-panels .panel-social,
        #tab-complaints:checked ~ .tab-panels .panel-complaints {
          display: block;
        }

        #tab-identifying:checked ~ .tab-nav label[for="tab-identifying"],
        #tab-medical:checked ~ .tab-nav label[for="tab-medical"],
        #tab-family:checked ~ .tab-nav label[for="tab-family"],
        #tab-social:checked ~ .tab-nav label[for="tab-social"],
        #tab-complaints:checked ~ .tab-nav label[for="tab-complaints"] {
          background: #2563eb;
          color: white;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.25);
        }
      `}</style>

      <div className="mx-auto max-w-4xl overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-blue-950 to-blue-700 px-4 sm:px-5 py-6 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <img
              src="/images/davao-logo.png"
              alt="Barangay Logo"
              className="h-16 w-16 rounded-full bg-white object-contain p-1"
            />

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">
                Barangay Health
              </p>
              <h1 className="text-xl sm:text-2xl font-black leading-tight">
                Digital Resident ID
              </h1>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-blue-100 sm:justify-start">
                <ShieldCheck className="h-4 w-4" />
                Secure decrypted access — session active
              </p>
            </div>
          </div>
        </div>

        <div>
          <input
            className="tab-input"
            type="radio"
            name="resident-tab"
            id="tab-identifying"
            defaultChecked
          />
          <input
            className="tab-input"
            type="radio"
            name="resident-tab"
            id="tab-medical"
          />
          <input
            className="tab-input"
            type="radio"
            name="resident-tab"
            id="tab-family"
          />
          <input
            className="tab-input"
            type="radio"
            name="resident-tab"
            id="tab-social"
          />
          <input
            className="tab-input"
            type="radio"
            name="resident-tab"
            id="tab-complaints"
          />

          <div className="tab-nav flex gap-2 overflow-x-auto border-b border-blue-100 bg-white p-3">
            <label
              htmlFor="tab-identifying"
              className="min-w-max cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-slate-600 transition"
            >
              Identifying Data
            </label>
            <label
              htmlFor="tab-medical"
              className="min-w-max cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-slate-600 transition"
            >
              Past Medical History
            </label>
            <label
              htmlFor="tab-family"
              className="min-w-max cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-slate-600 transition"
            >
              Family History
            </label>
            <label
              htmlFor="tab-social"
              className="min-w-max cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-slate-600 transition"
            >
              Personal / Social History
            </label>
            <label
              htmlFor="tab-complaints"
              className="min-w-max cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-slate-600 transition"
            >
              Complaints
            </label>
          </div>

          <div className="tab-panels p-5">
            <section className="tab-panel panel-identifying">
              <SectionTitle title="Identifying Data" />
              <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
                <QrInfoGroup title="Personal Details" icon={<UserRound className="h-4 w-4" />}>
                  <QrInfoRow label="Full Name" value={fullName} />
                  <QrInfoRow label="Age" value={resident.age} />
                  <QrInfoRow label="Sex" value={resident.sex} />
                  <QrInfoRow label="Birth Date" value={birthDate} />
                  <QrInfoRow label="Civil Status" value={resident.civilStatus} />
                  <QrInfoRow label="Religion" value={resident.religion} />
                  <QrInfoRow label="Education" value={resident.educationalAttainment} />
                  <QrInfoRow label="Occupation" value={resident.occupation} />
                </QrInfoGroup>

                <div className="space-y-8">
                  <QrInfoGroup title="Contact & Account" icon={<Phone className="h-4 w-4" />}>
                    <QrInfoRow label="Contact Number" value={resident.contactNumber} />
                    <QrInfoRow label="Email" value={resident.email ?? resident.user?.email} />
                    <QrInfoRow label="Phone Number" value={resident.phoneNumber ?? resident.user?.phoneNumber} />
                    <QrInfoRow label="Username" value={resident.user?.username} />
                    <QrInfoRow label="Verified Resident" value={resident.user?.isVerified ? "Yes" : "No"} />
                    <QrInfoRow label="Accompanying Person" value={resident.accompanyingPerson} />
                    <QrInfoRow label="Relationship" value={resident.relationship} />
                    <QrInfoRow label="Spouse Maiden Name" value={resident.spouseMaidenName} />
                    <QrInfoRow label="Spouse Occupation" value={resident.spouseOccupation} />
                    <QrInfoRow label="Spouse Contact Number" value={resident.spouseContactNumber} />
                  </QrInfoGroup>

                  <QrInfoGroup title="Address" icon={<MapPin className="h-4 w-4" />}>
                    <QrInfoRow label="House / Street" value={resident.houseStreet} />
                    <QrInfoRow label="Complete Address" value={resident.completeAddress} />
                  </QrInfoGroup>
                </div>
              </div>
            </section>

            <section className="tab-panel panel-medical">
              <SectionTitle title="Medical History" />
              <div className="space-y-5">
                {/* Conditions summary */}
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">Recorded Conditions</p>
                  <ConditionHistoryCard
                    medicalHistory={resident.medicalHistory ?? null}
                    diagnoses={diagnosisData}
                    residentName={fullName}
                  />
                </div>

                {/* Extra condition details */}
                <div className="space-y-2">
                  <Info label="Allergies Details" value={resident.medicalHistory?.allergiesDetails} />
                  <Info label="Cancer Details" value={resident.medicalHistory?.cancerDetails} />
                  <Info label="Other Conditions Details" value={resident.medicalHistory?.otherConditionsDetails} />
                  <Info label="Maintenance Medications" value={resident.medicalHistory?.maintenanceMedications} />
                  <Info label="Previous Illnesses / Surgeries" value={resident.medicalHistory?.previousIllnessesSurgeries} />
                </div>

                {/* BMI Records */}
                {bmiRecords.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">BMI Records</p>
                    <div className="space-y-2">
                      {bmiRecords.map((r) => (
                        <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-black text-slate-900">{r.bmiCategory}</span>
                            <span className="text-xs font-bold text-slate-500">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            BMI: {r.bmi.toFixed(1)} · Height: {r.height} cm · Weight: {r.weight} kg · Pulse: {r.pulseRate} bpm
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Appointment history */}
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">
                    Appointment History ({appointments.length})
                  </p>
                  {appointments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-400">
                      No appointments recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {appointments.map((appt) => (
                        <div key={appt.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {new Date(appt.date).toLocaleDateString()} · {appt.time}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${
                              appt.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700"
                                : appt.status === "CANCELLED"
                                ? "bg-red-50 text-red-600"
                                : "bg-sky-50 text-sky-600"
                            }`}>
                              {appt.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            {appt.reason}{appt.otherReason ? ` — ${appt.otherReason}` : ""}
                            {appt.doctor?.fullName ? ` · Dr. ${appt.doctor.fullName}` : ""}
                          </p>
                          {appt.suggestion && (
                            <p className="mt-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                              Suggestion: {appt.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="tab-panel panel-family">
              <SectionTitle title="Family History" />
              {resident.familyHistory ? (
                <QrFlagGroup
                  title="Hereditary Conditions"
                  icon={<Users className="h-4 w-4" />}
                  tone="bad"
                  columns={2}
                  items={[
                    { label: "Asthma / Allergies", value: resident.familyHistory.asthmaAllergies },
                    { label: "Birth Defects", value: resident.familyHistory.birthDefects },
                    { label: "Cancer", value: resident.familyHistory.cancer },
                    { label: "Dementia", value: resident.familyHistory.dementia },
                    { label: "Diabetes", value: resident.familyHistory.diabetes },
                    { label: "Hypertension", value: resident.familyHistory.hypertension },
                    { label: "Kidney Disease", value: resident.familyHistory.kidneyDisease },
                    { label: "Mental Illness", value: resident.familyHistory.mentalIllness },
                  ]}
                />
              ) : (
                <p className="text-sm font-semibold text-slate-400">
                  No family history recorded.
                </p>
              )}
            </section>

            <section className="tab-panel panel-social">
              <SectionTitle title="Personal / Social History" />
              {resident.personalSocialHistory ? (
                <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                  <QrFlagGroup
                    title="Healthy Lifestyle"
                    icon={<HeartPulse className="h-4 w-4" />}
                    tone="good"
                    items={[
                      { label: "Eats Healthy Diet", value: resident.personalSocialHistory.eatsHealthyDiet },
                      { label: "Adequate Physical Activity", value: resident.personalSocialHistory.adequatePhysicalActivity },
                      { label: "Sufficient Rest / Sleep", value: resident.personalSocialHistory.sufficientRestSleep },
                      { label: "Normal Growth / Development", value: resident.personalSocialHistory.normalGrowthDevelopment },
                      { label: "Multiple Sex Partners", value: resident.personalSocialHistory.multipleSexPartners, tone: "bad" },
                    ]}
                  />

                  <QrFlagGroup
                    title="Risk Factors"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    tone="bad"
                    items={[
                      { label: "Smokes Tobacco", value: resident.personalSocialHistory.smokesTobacco },
                      { label: "Tobacco Packs / Year", value: resident.personalSocialHistory.tobaccoPacksPerYear },
                      { label: "Drinks Alcohol", value: resident.personalSocialHistory.drinksAlcohol },
                      { label: "Alcohol Bottles / Day", value: resident.personalSocialHistory.alcoholBottlesPerDay },
                      { label: "Takes Illicit Drugs", value: resident.personalSocialHistory.takesIllicitDrugs },
                      { label: "Illicit Drugs Details", value: resident.personalSocialHistory.illicitDrugsDetails },
                    ]}
                  />
                </div>
              ) : (
                <p className="text-sm font-semibold text-slate-400">
                  No personal / social history recorded.
                </p>
              )}
            </section>

            <section className="tab-panel panel-complaints">
              <SectionTitle title="Patient Complaints" />
              <p className="mb-4 -mt-2 text-sm font-medium text-slate-500">
                Record the patient&apos;s complaint below. It is saved to their
                record with your name and the date.
              </p>
              <ResidentComplaints residentId={id} />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-blue-950">{title}</h2>
      <div className="mt-2 h-1 w-20 rounded-full bg-blue-600" />
    </div>
  );
}

function QrInfoGroup({
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
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {title}
        </h4>
      </div>
      <dl className="divide-y divide-slate-100">{children}</dl>
    </div>
  );
}

function QrInfoRow({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <span className="break-words text-right text-sm font-bold text-slate-900">
        {String(value)}
      </span>
    </div>
  );
}

function QrFlagGroup({
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
      : item.value !== null &&
        item.value !== undefined &&
        String(item.value).trim() !== ""
  );

  if (visible.length === 0) {
    return (
      <p className="text-sm font-semibold text-slate-400">
        No records in this section.
      </p>
    );
  }

  const headerBadge =
    tone === "bad"
      ? "bg-rose-50 text-rose-600 ring-rose-100"
      : "bg-emerald-50 text-emerald-600 ring-emerald-100";

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${headerBadge}`}
        >
          {icon}
        </span>
        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
          {title}
        </h4>
      </div>

      <div className={columns === 2 ? "grid sm:grid-cols-2 sm:gap-x-10" : ""}>
        {visible.map((item) => {
          const isBool = typeof item.value === "boolean";
          const itemTone = item.tone ?? tone;

          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 border-b border-slate-100 py-3"
            >
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
                <span className="break-words text-right text-sm font-bold text-slate-900">
                  {String(item.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-950">
        {String(value)}
      </p>
    </div>
  );
}

