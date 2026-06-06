"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HeartPulse,
  Lock,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!identifier.trim() || !password.trim()) {
      setServerError("Username/Email and password required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Login failed.");
        return;
      }

      // If there's a callbackUrl (e.g. from a QR scan redirect), go there first.
      if (callbackUrl && callbackUrl.startsWith("/")) {
        // IMPORTANT: If they logged in as a resident on the verification screen for a QR code,
        // they are NOT allowed to view it. Show them the Access Denied screen.
        if (
          (callbackUrl.startsWith("/resident/") || callbackUrl.startsWith("/scan")) &&
          data.role === "RESIDENT"
        ) {
          window.location.href = "/access-denied";
          return;
        }
        window.location.href = callbackUrl;
        return;
      }

      switch (data.role) {
        case "SUPER_ADMIN":
        case "BARANGAY_ADMIN":
          window.location.href = "/dashboard/admin";
          break;

        case "RESIDENT":
          window.location.href = "/dashboard/resident";
          break;

        case "DOCTOR":
          window.location.href = "/dashboard/doctor";
          break;

        case "NURSE":
          window.location.href = "/dashboard/nurse";
          break;

        case "BHW":
          window.location.href = "/dashboard/bhw";
          break;

        case "STAFF":
          window.location.href = "/dashboard/staff";
          break;

        case "MIDWIFE":
          window.location.href = "/dashboard/midwife";
          break;

        default:
          setServerError("Unknown account role.");
          break;
      }
    } catch (error) {
      console.error("LOGIN_FRONTEND_ERROR", error);
      setServerError("Unable to connect to the login server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#EFF6FF] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-7xl overflow-hidden rounded-[32px] border border-[#DCEAF7] bg-white shadow-2xl shadow-sky-900/10">
        <section className="relative hidden w-[60%] overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/login-medical-bg.jpg')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/70 to-sky-900/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-transparent to-slate-950/30" />

          <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold shadow-lg shadow-slate-950/20 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
                Secure Health Center Access
              </div>

              <div className="mt-12 max-w-2xl">
                <h1 className="text-5xl font-extrabold leading-tight drop-shadow-lg">
                  Barangay Health Center Management System
                </h1>
                <p className="mt-6 max-w-xl text-xl leading-9 text-white/95 drop-shadow-md">
                  A secure and modern platform for managing patient records,
                  consultations, and daily barangay health center operations.
                </p>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <InfoCard
                icon={<HeartPulse className="h-5 w-5" />}
                title="Patient Records"
                text="Securely manage consultations, health history, and treatment records."
              />
              <InfoCard
                icon={<Stethoscope className="h-5 w-5" />}
                title="Health Staff Access"
                text="Organized access for doctors, nurses, BHWs, and health staff."
              />
              <InfoCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Blockchain Security"
                text="Blockchain-powered security for tamper-proof and trusted health records."
              />
            </div>
          </div>
        </section>

        <section className="flex w-full items-center justify-center bg-[#F8FAFC] px-5 py-8 sm:px-8 lg:w-[40%] lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#0EA5E9] text-white shadow-lg shadow-sky-500/25 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/30">
                <HeartPulse className="h-10 w-10" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-[#0EA5E9] sm:text-5xl">
                Welcome
              </h2>
              <p className="mt-3 text-lg text-slate-500">
                Log in to your health center account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5 sm:mt-10 sm:space-y-6">
              <Input
                label="Username or Email"
                icon={<User className="h-5 w-5" />}
                value={identifier}
                onChange={setIdentifier}
                placeholder="Enter username or email"
              />

              <Input
                label="Password"
                type="password"
                icon={<Lock className="h-5 w-5" />}
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
              />

              {serverError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {serverError}
                </div>
              )}

              <div className="flex justify-end">
  <Link
    href="/forgot-password"
    className="inline-block rounded-lg px-1 text-sm font-medium text-slate-500 transition hover:text-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-sky-300"
  >
    Forgot password?
  </Link>
</div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#0EA5E9] px-5 py-4 text-base font-bold uppercase tracking-wide text-white shadow-lg shadow-sky-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-600 hover:shadow-xl hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-sm font-semibold text-slate-400">OR</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-[#0EA5E9] transition hover:text-sky-600"
                >
                  Register Now
                </Link>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}


function Input({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
        {label}
      </label>
      <div className="flex min-h-[54px] items-center rounded-2xl border border-sky-300 bg-white px-4 shadow-sm transition duration-300 focus-within:border-[#0EA5E9] focus-within:shadow-md focus-within:shadow-sky-100">
        <span className="mr-3 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group rounded-[24px] border border-white/20 bg-white/15 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-md transition duration-300 hover:-translate-y-2 hover:border-sky-200/70 hover:bg-white/20 hover:shadow-2xl hover:shadow-sky-950/30">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white transition duration-300 group-hover:bg-[#0EA5E9] group-hover:shadow-lg group-hover:shadow-sky-500/30">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white drop-shadow-sm">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/90 drop-shadow-sm">
        {text}
      </p>
    </div>
  );
}