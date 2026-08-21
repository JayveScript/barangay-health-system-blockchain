"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";
import {
  DEFAULT_BARANGAY_CITY,
  REGISTRATION_BARANGAY_OPTIONS,
} from "@/lib/barangay-options";

type FormState = {
  lastName: string;
  firstName: string;
  middleName: string;
  age: string;
  sex: "MALE" | "FEMALE" | "";
  birthDate: string;
  religion: string;

  houseStreet: string;
  barangayName: string;
  city: string;
  completeAddress: string;

  civilStatus:
    | "SINGLE"
    | "MARRIED"
    | "WIDOWED"
    | "ANNULLED"
    | "SEPARATED"
    | "COHABITANT"
    | "";
  contactNumber: string;
  educationalAttainment: string;
  occupation: string;
  accompanyingPerson: string;
  relationship: string;
  spouseMaidenName: string;
  spouseOccupation: string;
  spouseContactNumber: string;

  hasHypertension: boolean;
  hasDiabetes: boolean;
  hasStiHiv: boolean;
  hasHeartDisease: boolean;
  hasKidneyFailure: boolean;
  hasTuberculosis: boolean;
  hasAllergies: boolean;
  allergiesDetails: string;
  hasCancer: boolean;
  cancerDetails: string;
  hasOtherConditions: boolean;
  otherConditionsDetails: string;
  maintenanceMedications: string;
  previousIllnessesSurgeries: string;

  familyAsthmaAllergies: boolean;
  familyBirthDefects: boolean;
  familyCancer: boolean;
  familyDementia: boolean;
  familyDiabetes: boolean;
  familyHypertension: boolean;
  familyKidneyDisease: boolean;
  familyMentalIllness: boolean;

  eatsHealthyDiet: boolean;
  adequatePhysicalActivity: boolean;
  sufficientRestSleep: boolean;
  normalGrowthDevelopment: boolean;
  multipleSexPartners: boolean;
  smokesTobacco: boolean;
  tobaccoPacksPerYear: string;
  drinksAlcohol: boolean;
  alcoholBottlesPerDay: string;
  takesIllicitDrugs: boolean;
  illicitDrugsDetails: string;

  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type ErrorState = Partial<Record<keyof FormState | "otp", string>>;

const stepLabels = [
  "Identifying Data",
  "Past Medical History",
  "Family History",
  "Personal / Social History",
  "Account & Verification",
];

const STATIC_BARANGAY = REGISTRATION_BARANGAY_OPTIONS[0].value;
const STATIC_CITY = DEFAULT_BARANGAY_CITY;

const initialForm: FormState = {
  lastName: "",
  firstName: "",
  middleName: "",
  age: "",
  sex: "",
  birthDate: "",
  religion: "",

  houseStreet: "",
  barangayName: STATIC_BARANGAY,
  city: STATIC_CITY,
  completeAddress: "",

  civilStatus: "",
  contactNumber: "",
  educationalAttainment: "",
  occupation: "",
  accompanyingPerson: "",
  relationship: "",
  spouseMaidenName: "",
  spouseOccupation: "",
  spouseContactNumber: "",

  hasHypertension: false,
  hasDiabetes: false,
  hasStiHiv: false,
  hasHeartDisease: false,
  hasKidneyFailure: false,
  hasTuberculosis: false,
  hasAllergies: false,
  allergiesDetails: "",
  hasCancer: false,
  cancerDetails: "",
  hasOtherConditions: false,
  otherConditionsDetails: "",
  maintenanceMedications: "",
  previousIllnessesSurgeries: "",

  familyAsthmaAllergies: false,
  familyBirthDefects: false,
  familyCancer: false,
  familyDementia: false,
  familyDiabetes: false,
  familyHypertension: false,
  familyKidneyDisease: false,
  familyMentalIllness: false,

  eatsHealthyDiet: false,
  adequatePhysicalActivity: false,
  sufficientRestSleep: false,
  normalGrowthDevelopment: false,
  multipleSexPartners: false,
  smokesTobacco: false,
  tobaccoPacksPerYear: "",
  drinksAlcohol: false,
  alcoholBottlesPerDay: "",
  takesIllicitDrugs: false,
  illicitDrugsDetails: "",

  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverMessage, setServerMessage] = useState("");
  const [errors, setErrors] = useState<ErrorState>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const progress = useMemo(() => (step / 5) * 100, [step]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "houseStreet" || key === "barangayName" || key === "city") {
        next.completeAddress = [
          next.houseStreet.trim(),
          next.barangayName.trim(),
          next.city.trim(),
        ]
          .filter(Boolean)
          .join(", ");
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [key]: "" }));
    setServerError("");
  };

  const handleBirthDateChange = (value: string) => {
    const today = new Date();
    const birth = new Date(value);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    setForm((prev) => ({
      ...prev,
      birthDate: value,
      age: !Number.isNaN(birth.getTime()) && age >= 0 ? String(age) : "",
    }));

    setErrors((prev) => ({ ...prev, birthDate: "", age: "" }));
    setServerError("");
  };

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePhone = (value: string) =>
    /^(\+63|0)\d{10}$/.test(value.replace(/\s+/g, ""));

  const validateCurrentStep = () => {
    const nextErrors: ErrorState = {};

    if (step === 1) {
      if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";
      if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
      if (!form.birthDate) nextErrors.birthDate = "Birth date is required.";
      if (!form.age.trim()) nextErrors.age = "Age is required.";
      if (!form.sex) nextErrors.sex = "Please select sex.";
      if (!form.houseStreet.trim()) {
        nextErrors.houseStreet = "House / street is required.";
      }
      if (!form.barangayName.trim()) {
        nextErrors.barangayName = "Please select barangay.";
      }
      if (!form.civilStatus) {
        nextErrors.civilStatus = "Please select civil status.";
      }
      if (form.contactNumber.trim() && !validatePhone(form.contactNumber)) {
        nextErrors.contactNumber = "Enter a valid phone number.";
      }
    }

    if (step === 5) {
      if (!form.username.trim()) nextErrors.username = "Username is required.";

      if (!form.email.trim()) nextErrors.email = "Email is required.";
      else if (!validateEmail(form.email.trim())) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (!form.password) nextErrors.password = "Password is required.";
      else if (form.password.length < 8) {
        nextErrors.password = "Password must be at least 8 characters.";
      }

      if (!form.confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password.";
      } else if (form.password !== form.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);
    setServerError("");

    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      setServerError("Please correct the highlighted fields before continuing.");
      return;
    }

    setServerMessage("");
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setServerError("");
    setServerMessage("");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSendOtp = async () => {
    setServerError("");
    setServerMessage("");

    if (!validateCurrentStep()) {
      setServerError("Please complete the required account fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          city: STATIC_CITY,
          age: Number(form.age),
          birthDate: form.birthDate,
          email: form.email.trim().toLowerCase(),
          username: form.username.trim(),
          contactNumber: form.contactNumber.trim(),
          barangayName: form.barangayName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to submit registration.");
        return;
      }

      setOtpSent(true);
      setServerMessage("Verification code sent to your Gmail.");
    } catch (error) {
      console.error("REGISTER_SUBMIT_ERROR", error);
      setServerError("Unable to connect to the registration server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setServerError("");
    setServerMessage("");

    if (!otp.trim()) {
      setErrors((prev) => ({ ...prev, otp: "Verification code is required." }));
      setServerError("Please enter the verification code.");
      return;
    }

    setErrors((prev) => ({ ...prev, otp: "" }));

    try {
      setVerifying(true);

      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          code: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Failed to verify registration.");
        return;
      }

      setVerified(true);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("VERIFY_ERROR", error);
      setServerError("Unable to connect to the verification server.");
    } finally {
      setVerifying(false);
    }
  };

  const getFieldStatus = (name: keyof FormState) => {
    const value = form[name];

    if (typeof value === "boolean") return "default";
    if (errors[name]) return "error";
    if (typeof value === "string" && value.trim()) return "success";
    return "default";
  };

  return (
    <main className="auth-shell overflow-hidden">
      <style jsx global>{`
        html,
        body {
          height: 100%;
          overflow: hidden;
        }
      `}</style>

      <div className="auth-card mx-auto flex h-full w-full overflow-hidden rounded-[2rem] border border-[#DCEAF7] bg-white shadow-2xl shadow-sky-900/10">
       <div className="flex h-full w-full flex-col overflow-hidden rounded-[26px] border border-sky-200/80 bg-white shadow-2xl shadow-sky-900/10 backdrop-blur">
          <div className="shrink-0 border-b border-sky-200 bg-white/90 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25">
                  <Building2 className="h-6 w-6" />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-600">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      Trusted Health Center Registration
                    </span>
                  </div>

                  <h1 className="mt-1 text-2xl font-black leading-none tracking-tight text-sky-600 sm:text-3xl">
                    Register
                  </h1>
                </div>
              </div>

              <Link
                href="/login"
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-200"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            </div>
          </div>

          <div className="shrink-0 border-b border-sky-200 bg-gradient-to-r from-white via-sky-50/40 to-white px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sky-500">
                  Step {step} of 5
                </p>
                <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  {stepLabels[step - 1]}
                </h2>
              </div>

              <div className="grid gap-2 md:grid-cols-5">
                {stepLabels.map((label, index) => {
                  const current = index + 1;
                  const active = current === step;
                  const done = current < step;

                  return (
                    <div
                      key={label}
                      className={`rounded-2xl border px-3 py-2 transition ${
                        active
                          ? "border-sky-500 bg-white shadow-sm shadow-sky-500/10"
                          : done
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-white/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                            active
                              ? "bg-sky-500 text-white"
                              : done
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {done ? <Check className="h-4 w-4" /> : current}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`text-[11px] font-bold ${
                              active
                                ? "text-sky-500"
                                : done
                                ? "text-emerald-700"
                                : "text-slate-500"
                            }`}
                          >
                            Step {current}
                          </p>
                          <p className="truncate text-xs font-bold text-slate-800 sm:text-sm">
                            {label}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-sky-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6"
          >
            <div className="transition-all duration-300">
              {step === 1 && (
                <StepSection
                  icon={<UserRound className="h-5 w-5" />}
                  title="Identifying Data"
                  subtitle="Please enter the resident's personal information, address, and contact details."
                >
                  <FormSection title="Personal Information">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <InputField
                        label="Last Name"
                        required
                        placeholder="Enter last name"
                        value={form.lastName}
                        onChange={(v) => updateField("lastName", v)}
                        error={errors.lastName}
                        status={getFieldStatus("lastName")}
                      />
                      <InputField
                        label="First Name"
                        required
                        placeholder="Enter first name"
                        value={form.firstName}
                        onChange={(v) => updateField("firstName", v)}
                        error={errors.firstName}
                        status={getFieldStatus("firstName")}
                      />
                      <InputField
                        label="Middle Name / M.I."
                        placeholder="Enter middle name"
                        value={form.middleName}
                        onChange={(v) => updateField("middleName", v)}
                        status={getFieldStatus("middleName")}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <InputField
                        label="Age"
                        required
                        placeholder="Auto-computed"
                        value={form.age}
                        onChange={(v) => updateField("age", v)}
                        error={errors.age}
                        status={getFieldStatus("age")}
                      />
                      <InputField
                        label="Birthday"
                        required
                        type="date"
                        icon={<CalendarDays className="h-4 w-4" />}
                        value={form.birthDate}
                        onChange={handleBirthDateChange}
                        error={errors.birthDate}
                        status={getFieldStatus("birthDate")}
                      />
                      <SelectWithOther
                        label="Religion"
                        value={form.religion}
                        onChange={(v) => updateField("religion", v)}
                        options={[
                          "Roman Catholic",
                          "Muslim / Islam",
                          "Iglesia ni Cristo",
                          "Born Again Christian",
                          "Baptist",
                          "Seventh Day Adventist",
                          "Jehovah's Witness",
                          "Evangelical",
                          "Aglipayan (Philippine Independent Church)",
                          "Buddhism",
                          "None / Non-Religious",
                        ]}
                      />
                    </div>

                    <RadioGroup
                      label="Sex"
                      required
                      value={form.sex}
                      onChange={(v) => updateField("sex", v as FormState["sex"])}
                      error={errors.sex}
                      options={[
                        { label: "Male", value: "MALE" },
                        { label: "Female", value: "FEMALE" },
                      ]}
                    />
                  </FormSection>

                  <FormSection title="Address Information">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField
                        label="House No. / Street / Purok"
                        required
                        placeholder="Example: Purok 3, Zone 2"
                        icon={<MapPin className="h-4 w-4" />}
                        value={form.houseStreet}
                        onChange={(v) => updateField("houseStreet", v)}
                        error={errors.houseStreet}
                        status={getFieldStatus("houseStreet")}
                      />
                      <SelectField
                        label="Barangay"
                        required
                        value={form.barangayName}
                        onChange={(v) => updateField("barangayName", v)}
                        options={REGISTRATION_BARANGAY_OPTIONS}
                        error={errors.barangayName}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <ReadonlyBadgeField
                        label="City / Municipality"
                        value={STATIC_CITY}
                      />
                    </div>

                    <HelperText text="Your complete address is automatically combined from the street, barangay, and city." />
                  </FormSection>

                  <FormSection title="Contact Details">
                    <RadioGroup
                      label="Civil Status"
                      required
                      value={form.civilStatus}
                      onChange={(v) =>
                        updateField("civilStatus", v as FormState["civilStatus"])
                      }
                      error={errors.civilStatus}
                      options={[
                        { label: "Single", value: "SINGLE" },
                        { label: "Married", value: "MARRIED" },
                        { label: "Widowed", value: "WIDOWED" },
                        { label: "Annulled", value: "ANNULLED" },
                        { label: "Separated", value: "SEPARATED" },
                        { label: "Co-habitant", value: "COHABITANT" },
                      ]}
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <InputField
                        label="Contact Number"
                        placeholder="09XXXXXXXXX"
                        icon={<Phone className="h-4 w-4" />}
                        value={form.contactNumber}
                        onChange={(v) => updateField("contactNumber", v)}
                        error={errors.contactNumber}
                        status={getFieldStatus("contactNumber")}
                        helper="Use a valid Philippine mobile number."
                      />
                      <SelectWithOther
                        label="Educational Attainment"
                        value={form.educationalAttainment}
                        onChange={(v) => updateField("educationalAttainment", v)}
                        options={[
                          "No Formal Education",
                          "Elementary Level",
                          "Elementary Graduate",
                          "High School Level",
                          "High School Graduate",
                          "Senior High School Level",
                          "Senior High School Graduate",
                          "Vocational / Technical Course",
                          "College Level",
                          "College Graduate",
                          "Post Graduate (Master's / Doctorate)",
                        ]}
                      />
                      <SelectWithOther
                        label="Occupation"
                        value={form.occupation}
                        onChange={(v) => updateField("occupation", v)}
                        options={[
                          "Unemployed",
                          "Student",
                          "Farmer / Fisher",
                          "Driver",
                          "Construction Worker / Laborer",
                          "Factory Worker",
                          "Vendor / Market Seller",
                          "Housekeeper / Domestic Worker",
                          "Sari-sari Store Owner",
                          "Government Employee",
                          "Private Employee",
                          "Healthcare Worker",
                          "Teacher / Educator",
                          "Engineer",
                          "Overseas Filipino Worker (OFW)",
                          "Self-Employed / Business Owner",
                          "Retired",
                        ]}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <InputField
                        label="Accompanying Person"
                        placeholder="Optional"
                        value={form.accompanyingPerson}
                        onChange={(v) => updateField("accompanyingPerson", v)}
                        status={getFieldStatus("accompanyingPerson")}
                      />
                      <SelectWithOther
                        label="Relationship"
                        value={form.relationship}
                        onChange={(v) => updateField("relationship", v)}
                        options={[
                          "Father",
                          "Mother",
                          "Husband",
                          "Wife",
                          "Son",
                          "Daughter",
                          "Brother",
                          "Sister",
                          "Grandfather",
                          "Grandmother",
                          "Uncle",
                          "Aunt",
                          "Guardian",
                          "Friend",
                        ]}
                      />
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-white/80 p-4 sm:p-5">
                      <p className="mb-4 text-sm font-bold text-slate-700">
                        If Married
                      </p>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <InputField
                          label="Spouse's Maiden Name"
                          placeholder="Optional"
                          value={form.spouseMaidenName}
                          onChange={(v) => updateField("spouseMaidenName", v)}
                          status={getFieldStatus("spouseMaidenName")}
                        />
                        <InputField
                          label="Spouse Occupation"
                          placeholder="Optional"
                          value={form.spouseOccupation}
                          onChange={(v) => updateField("spouseOccupation", v)}
                          status={getFieldStatus("spouseOccupation")}
                        />
                        <InputField
                          label="Spouse Contact No."
                          placeholder="Optional"
                          value={form.spouseContactNumber}
                          onChange={(v) => updateField("spouseContactNumber", v)}
                          status={getFieldStatus("spouseContactNumber")}
                        />
                      </div>
                    </div>
                  </FormSection>
                </StepSection>
              )}

              {step === 2 && (
                <StepSection
                  icon={<Stethoscope className="h-5 w-5" />}
                  title="Past Medical History"
                  subtitle="Record co-morbidities, allergies, medications, and surgery history."
                >
                  <FormSection title="Co-Morbidities">
                    <CheckGrid>
                      <CheckField label="Hypertension" checked={form.hasHypertension} onChange={(v) => updateField("hasHypertension", v)} />
                      <CheckField label="Diabetes" checked={form.hasDiabetes} onChange={(v) => updateField("hasDiabetes", v)} />
                      <CheckField label="STI / HIV" checked={form.hasStiHiv} onChange={(v) => updateField("hasStiHiv", v)} />
                      <CheckField label="Heart Disease" checked={form.hasHeartDisease} onChange={(v) => updateField("hasHeartDisease", v)} />
                      <CheckField label="Kidney Failure" checked={form.hasKidneyFailure} onChange={(v) => updateField("hasKidneyFailure", v)} />
                      <CheckField label="Tuberculosis" checked={form.hasTuberculosis} onChange={(v) => updateField("hasTuberculosis", v)} />
                    </CheckGrid>
                  </FormSection>

                  <FormSection title="Condition Details">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <ToggleWithText label="Allergies" checked={form.hasAllergies} onToggle={(v) => updateField("hasAllergies", v)} value={form.allergiesDetails} onChange={(v) => updateField("allergiesDetails", v)} placeholder="Specify allergies" />
                      <ToggleWithText label="Cancer" checked={form.hasCancer} onToggle={(v) => updateField("hasCancer", v)} value={form.cancerDetails} onChange={(v) => updateField("cancerDetails", v)} placeholder="Specify cancer details" />
                    </div>

                    <ToggleWithText label="Other Conditions" checked={form.hasOtherConditions} onToggle={(v) => updateField("hasOtherConditions", v)} value={form.otherConditionsDetails} onChange={(v) => updateField("otherConditionsDetails", v)} placeholder="Specify other conditions" />
                  </FormSection>

                  <FormSection title="Medication & Procedures">
                    <TextAreaInput label="Maintenance Medication(s), Dose, & Frequency" placeholder="List any regular medicines, dose, and schedule" value={form.maintenanceMedications} onChange={(v) => updateField("maintenanceMedications", v)} />
                    <TextAreaInput label="Previous Illnesses / Surgeries" placeholder="List previous illnesses or surgeries" value={form.previousIllnessesSurgeries} onChange={(v) => updateField("previousIllnessesSurgeries", v)} />
                  </FormSection>
                </StepSection>
              )}

              {step === 3 && (
                <StepSection
                  icon={<Users className="h-5 w-5" />}
                  title="Family History"
                  subtitle="Mark conditions present in the resident’s family history."
                >
                  <FormSection title="Family Conditions">
                    <CheckGrid>
                      <CheckField label="Asthma / Allergies" checked={form.familyAsthmaAllergies} onChange={(v) => updateField("familyAsthmaAllergies", v)} />
                      <CheckField label="Birth Defects" checked={form.familyBirthDefects} onChange={(v) => updateField("familyBirthDefects", v)} />
                      <CheckField label="Cancer" checked={form.familyCancer} onChange={(v) => updateField("familyCancer", v)} />
                      <CheckField label="Dementia" checked={form.familyDementia} onChange={(v) => updateField("familyDementia", v)} />
                      <CheckField label="Diabetes" checked={form.familyDiabetes} onChange={(v) => updateField("familyDiabetes", v)} />
                      <CheckField label="Hypertension" checked={form.familyHypertension} onChange={(v) => updateField("familyHypertension", v)} />
                      <CheckField label="Kidney Disease" checked={form.familyKidneyDisease} onChange={(v) => updateField("familyKidneyDisease", v)} />
                      <CheckField label="Mental Illness" checked={form.familyMentalIllness} onChange={(v) => updateField("familyMentalIllness", v)} />
                    </CheckGrid>
                  </FormSection>
                </StepSection>
              )}

              {step === 4 && (
                <StepSection
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Personal / Social History"
                  subtitle="Capture the resident’s lifestyle, habits, and social health indicators."
                >
                  <FormSection title="Lifestyle Indicators">
                    <CheckGrid>
                      <CheckField label="Eats Healthy Diet" checked={form.eatsHealthyDiet} onChange={(v) => updateField("eatsHealthyDiet", v)} />
                      <CheckField label="Adequate Physical Activity" checked={form.adequatePhysicalActivity} onChange={(v) => updateField("adequatePhysicalActivity", v)} />
                      <CheckField label="Sufficient Rest / Sleep" checked={form.sufficientRestSleep} onChange={(v) => updateField("sufficientRestSleep", v)} />
                      <CheckField label="Normal Growth & Development" checked={form.normalGrowthDevelopment} onChange={(v) => updateField("normalGrowthDevelopment", v)} />
                      <CheckField label="Multiple Sex Partners" checked={form.multipleSexPartners} onChange={(v) => updateField("multipleSexPartners", v)} />
                    </CheckGrid>
                  </FormSection>

                  <FormSection title="Habits & Substance Use">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <ToggleWithText label="Smokes Tobacco" checked={form.smokesTobacco} onToggle={(v) => updateField("smokesTobacco", v)} value={form.tobaccoPacksPerYear} onChange={(v) => updateField("tobaccoPacksPerYear", v)} placeholder="Pack / Year" />
                      <ToggleWithText label="Drinks Alcohol" checked={form.drinksAlcohol} onToggle={(v) => updateField("drinksAlcohol", v)} value={form.alcoholBottlesPerDay} onChange={(v) => updateField("alcoholBottlesPerDay", v)} placeholder="Bottle / Day" />
                    </div>

                    <ToggleWithText label="Takes Illicit Drugs" checked={form.takesIllicitDrugs} onToggle={(v) => updateField("takesIllicitDrugs", v)} value={form.illicitDrugsDetails} onChange={(v) => updateField("illicitDrugsDetails", v)} placeholder="Specify drug details" />
                  </FormSection>
                </StepSection>
              )}

              {step === 5 && (
  <StepSection
    icon={<Lock className="h-5 w-5" />}
    title="Account Setup & Verification"
    subtitle="Complete your account details. A verification code will be sent to your Gmail."
  >
    <FormSection title="Account Credentials">
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Username"
          required
          placeholder="Choose a username"
          value={form.username}
          onChange={(v) => updateField("username", v)}
          error={errors.username}
          status={getFieldStatus("username")}
        />

        <InputField
          label="Gmail Address"
          required
          type="email"
          icon={<Mail className="h-4 w-4" />}
          placeholder="example@gmail.com"
          value={form.email}
          onChange={(v) => updateField("email", v)}
          error={errors.email}
          status={getFieldStatus("email")}
          helper="Use an active Gmail account to receive the OTP."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Password"
          required
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={(v) => updateField("password", v)}
          error={errors.password}
          status={getFieldStatus("password")}
        />

        <InputField
          label="Confirm Password"
          required
          type="password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          onChange={(v) => updateField("confirmPassword", v)}
          error={errors.confirmPassword}
          status={getFieldStatus("confirmPassword")}
        />
      </div>
    </FormSection>

    <FormSection title="Send Verification Code">
      {!otpSent ? (
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="w-full rounded-2xl bg-[#0EA5E9] hover:bg-sky-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-600 hover:to-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending Verification Code..." : "Send Code to Gmail"}
        </button>
      ) : (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-700">
                Verification code sent
              </p>
              <p className="mt-1 text-sm text-emerald-700/90">
                Enter the OTP below to create your account.
              </p>
            </div>
          </div>

          <InputField
            label="Verification Code"
            placeholder="Enter the 6-digit code"
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setErrors((prev) => ({ ...prev, otp: "" }));
            }}
            error={errors.otp}
            status={errors.otp ? "error" : otp ? "success" : "default"}
          />

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || verified}
            className="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {verifying
              ? "Verifying..."
              : verified
              ? "Verified"
              : "Verify and Create Account"}
          </button>
        </div>
      )}
    </FormSection>
  </StepSection>
)}
            </div>

            {serverError && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {serverError}
              </div>
            )}

            {serverMessage && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {serverMessage}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1 || loading || verifying}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {step < 5 && (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] hover:bg-sky-600 shadow-lg shadow-sky-500/25 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-600 hover:to-sky-500"
                >
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {/* Registration Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
            {/* Green top bar */}
            <div className="flex flex-col items-center bg-gradient-to-br from-emerald-400 to-teal-500 px-6 pb-8 pt-10 text-white">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
                <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-white stroke-[2.5]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Registration Complete!</h2>
              <p className="mt-2 text-center text-sm text-white/85">
                Your account has been verified and successfully created.
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="mb-5 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-emerald-600 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-emerald-800">Email verified</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-emerald-600 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-emerald-800">Account created successfully</p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-sky-600 stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
                  </div>
                  <p className="text-sm font-semibold text-sky-800">You can now log in to your account</p>
                </div>
              </div>

              <button
                onClick={() => { window.location.href = "/login"; }}
                className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-base font-extrabold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StepSection({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 ring-1 ring-sky-200">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-white to-sky-50/40 p-4 shadow-sm sm:p-5">
      <h4 className="mb-4 text-sm font-black text-slate-800">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function HelperText({ text }: { text: string }) {
  return <p className="text-xs font-medium text-slate-500">{text}</p>;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  error,
  icon,
  type = "text",
  helper,
  required = false,
  status = "default",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  type?: string;
  helper?: string;
  required?: boolean;
  status?: "default" | "success" | "error";
}) {
  const borderClass =
    status === "error"
      ? "border-red-400 focus-within:border-red-500"
      : status === "success"
      ? "border-emerald-400 focus-within:border-emerald-500"
      : "border-sky-200 focus-within:border-sky-500";

  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div
        className={`flex min-h-[52px] items-center rounded-2xl border bg-white px-4 shadow-sm transition ${borderClass}`}
      >
        {icon && <span className="mr-3 text-sky-400">{icon}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
        />
        {status === "success" && !error && value && (
          <CheckCircle2 className="ml-2 h-4 w-4 text-emerald-500" />
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs font-medium text-red-500">{error}</p>
      ) : helper ? (
        <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

function ReadonlyBadgeField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="flex min-h-[52px] items-center rounded-2xl border border-sky-200 bg-sky-50 px-4 shadow-sm">
        <span className="inline-flex rounded-full bg-sky-500 px-3 py-1 text-sm font-bold text-white shadow-sm">
          {value}
        </span>
      </div>
    </div>
  );
}

function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500"
      />
    </div>
  );
}

function RadioGroup({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </p>

      <div className="flex flex-wrap gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-2xl border px-4 py-3 text-sm font-bold shadow-sm transition ${
              value === opt.value
                ? "border-sky-500 bg-sky-50 text-sky-600"
                : "border-sky-200 bg-white text-slate-700 hover:bg-sky-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

function CheckGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-sky-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
      />
      {label}
    </label>
  );
}

function ToggleWithText({
  label,
  checked,
  onToggle,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-4 shadow-sm">
      <label className="mb-3 flex items-center gap-3 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
        />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={!checked}
        className="w-full rounded-2xl border border-sky-200 bg-sky-50/40 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
    </div>
  );
}

function SelectWithOther({
  label,
  value,
  onChange,
  options,
  required = false,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
}) {
  const isKnownOption = options.includes(value);
  const [otherMode, setOtherMode] = useState(() => value !== "" && !isKnownOption);

  const handleSelect = (v: string) => {
    if (v === "__other__") {
      setOtherMode(true);
      onChange("");
    } else {
      setOtherMode(false);
      onChange(v);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <select
        value={otherMode ? "__other__" : value}
        onChange={(e) => handleSelect(e.target.value)}
        className={`min-h-[52px] w-full rounded-2xl border bg-white px-4 text-sm font-bold text-slate-900 shadow-sm outline-none transition ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-sky-200 focus:border-sky-500"
        }`}
      >
        <option value="">— Select —</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__other__">Others (please specify)</option>
      </select>

      {otherMode && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Please specify…"
          autoFocus
          className="mt-2 w-full rounded-2xl border border-sky-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500"
        />
      )}

      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-[52px] w-full rounded-2xl border bg-white px-4 text-sm font-bold text-slate-900 shadow-sm outline-none transition ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-sky-200 focus:border-sky-500"
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
