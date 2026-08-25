"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  Eye,
  EyeOff,
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
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

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

      if (callbackUrl && callbackUrl.startsWith("/")) {
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
          window.location.href = "/dashboard/superadmin";
          break;
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
        case "MIDWIFE":
          window.location.href = "/dashboard/midwife";
          break;
        case "PHARMACIST":
          window.location.href = "/dashboard/pharmacist";
          break;
        case "MEDTECH":
          window.location.href = "/dashboard/medtech";
          break;
        case "NUTRITIONIST":
          window.location.href = "/dashboard/nutritionist";
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
    <main className="auth-shell auth-shell--login">
      <style>{`
        @keyframes cardGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0), 0 8px 32px rgba(15, 23, 42, 0.25);
          }
          50% {
            box-shadow: 0 0 22px 6px rgba(56, 189, 248, 0.35), 0 8px 32px rgba(15, 23, 42, 0.25);
          }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .info-card-anim {
          animation: cardGlow 3s ease-in-out infinite, cardFloat 4s ease-in-out infinite;
        }
        .info-card-anim-d1 {
          animation: cardGlow 3s ease-in-out 0.6s infinite, cardFloat 4s ease-in-out 0.6s infinite;
        }
        .info-card-anim-d2 {
          animation: cardGlow 3s ease-in-out 1.2s infinite, cardFloat 4s ease-in-out 1.2s infinite;
        }

        @keyframes iconPulseRing {
          0% { transform: scale(1); opacity: 1; }
          70% { transform: scale(1.55); opacity: 0; }
          100% { transform: scale(1.55); opacity: 0; }
        }
        @keyframes iconPulseRing2 {
          0% { transform: scale(1); opacity: 0.7; }
          70% { transform: scale(1.85); opacity: 0; }
          100% { transform: scale(1.85); opacity: 0; }
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes logoGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0), 0 10px 30px rgba(15, 23, 42, 0.18);
          }
          50% {
            box-shadow: 0 0 30px 8px rgba(56, 189, 248, 0.4), 0 10px 30px rgba(15, 23, 42, 0.22);
          }
        }
        @keyframes appGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(14, 165, 233, 0), 0 10px 30px rgba(14, 165, 233, 0.25);
          }
          50% {
            box-shadow: 0 0 36px 10px rgba(14, 165, 233, 0.45), 0 10px 30px rgba(14, 165, 233, 0.35);
          }
        }
        .logo-float { animation: logoFloat 4s ease-in-out infinite; }
        .logo-glow  { animation: logoGlow  2.8s ease-in-out infinite; }
        .app-float  { animation: logoFloat 4s ease-in-out 0.3s infinite; }
        .app-glow   { animation: appGlow   2.8s ease-in-out 0.3s infinite; }
        .logo-ring-1 {
          position: absolute; inset: 0; border-radius: 9999px;
          background: rgba(56, 189, 248, 0.22);
          animation: iconPulseRing 2.8s ease-out infinite;
        }
        .logo-ring-2 {
          position: absolute; inset: 0; border-radius: 9999px;
          background: rgba(56, 189, 248, 0.14);
          animation: iconPulseRing2 2.8s ease-out 0.5s infinite;
        }
        .app-ring-1 {
          position: absolute; inset: 0; border-radius: 9999px;
          background: rgba(14, 165, 233, 0.25);
          animation: iconPulseRing 2.8s ease-out 0.3s infinite;
        }
        .app-ring-2 {
          position: absolute; inset: 0; border-radius: 9999px;
          background: rgba(14, 165, 233, 0.15);
          animation: iconPulseRing2 2.8s ease-out 0.8s infinite;
        }
      `}</style>
      <div className="auth-card mx-auto flex overflow-hidden rounded-[2rem] border border-[#DCEAF7] bg-white shadow-2xl shadow-sky-900/10">

        <section className="relative hidden min-w-0 flex-[1.5] overflow-hidden lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/login-medical-bg.jpg')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-blue-950/70 to-sky-900/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/85 via-transparent to-slate-950/30" />

          <div className="relative z-10 flex h-full min-h-0 flex-col items-start justify-center gap-[clamp(1.25rem,3vh,2.5rem)] p-[clamp(1.5rem,3vw,2.75rem)] text-white">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold shadow-lg shadow-slate-950/20 backdrop-blur-md">
                <ShieldCheck className="h-4 w-4" />
                Secure Health Center Access
              </div>

              <div className="w-full max-w-2xl">
                <div className="flex items-center gap-[clamp(1rem,2vw,1.75rem)]">
                  <div className="logo-float relative flex-shrink-0">
                    <span className="logo-ring-1" />
                    <span className="logo-ring-2" />
                    <div className="logo-glow relative flex h-[clamp(4.5rem,6.5vw,6.5rem)] w-[clamp(4.5rem,6.5vw,6.5rem)] items-center justify-center rounded-full bg-white p-1.5 ring-2 ring-sky-200/60">
                      <img
                        src="/images/davao-logo.png"
                        alt="Lungsod ng Dabaw — Official Seal"
                        className="h-full w-full rounded-full object-contain"
                      />
                    </div>
                  </div>

                  <h1 className="text-[clamp(1.75rem,2.6vw,3rem)] font-extrabold leading-tight drop-shadow-lg">
                    Barangay Health Center Management System
                  </h1>
                </div>

                <p className="mt-4 max-w-xl text-[clamp(0.95rem,1.05vw,1.15rem)] leading-relaxed text-white/95 drop-shadow-md">
                  A secure and modern platform for managing patient records,
                  consultations, and daily barangay health center operations.
                </p>
              </div>

            <div className="w-full grid gap-[clamp(0.75rem,1.5vw,1.25rem)] xl:grid-cols-3">
              <InfoCard
                icon={<HeartPulse className="h-5 w-5" />}
                title="Patient Records"
                text="Securely manage consultations, health history, and treatment records."
                animClass="info-card-anim"
              />
              <InfoCard
                icon={<Stethoscope className="h-5 w-5" />}
                title="Health Staff Access"
                text="Organized access for doctors, nurses, BHWs, and health staff."
                animClass="info-card-anim-d1"
              />
              <InfoCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Blockchain Security"
                text="Blockchain-powered security for tamper-proof and trusted health records."
                animClass="info-card-anim-d2"
              />
            </div>

          </div>
        </section>

        <section className="flex w-full min-w-0 min-h-0 items-center justify-center overflow-y-auto bg-[#F8FAFC] px-5 py-5 sm:px-8 lg:flex-1 lg:px-10">
          <div className="w-full max-w-md">

            <div className="mb-4 flex flex-col items-center gap-3 lg:mb-4 lg:gap-2">
              <div className="app-float relative">
                <span className="app-ring-1" />
                <span className="app-ring-2" />
                <div className="app-glow relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-blue-600 ring-2 ring-sky-300/50 lg:h-20 lg:w-20">
                  <img
                    src="/icons/icon-512.png"
                    alt="Kalyo App"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 lg:gap-1.5">
                {["K", "A", "L", "Y", "O"].map((letter, i) => (
                  <span
                    key={i}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-lg font-black text-white shadow-lg shadow-sky-400/35 lg:h-9 lg:w-9 lg:text-sm"
                  >
                    {letter}
                  </span>
                ))}
              </div>

              <div className="text-center">
                <p className="text-sm font-bold text-sky-600 tracking-wide">
                  Kalusugan At Ligtas Yang Obyektibo
                </p>
                <p className="mt-0.5 text-xs italic text-slate-400">
                  &ldquo;Health and Safety as Our Objective&rdquo;
                </p>
              </div>
            </div>

            <div className="mb-4 text-center lg:hidden">
              <h2 className="text-4xl font-extrabold text-[#0EA5E9]">
                Welcome
              </h2>
              <p className="mt-1 text-base text-slate-500">
                Log in to your health center account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-2 space-y-4">
              <div>
                <Input
                  label="Username or Email"
                  icon={<User className="h-5 w-5" />}
                  value={identifier}
                  onChange={setIdentifier}
                  placeholder="Enter username or email"
                />
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  Residents: include the <span className="font-bold text-slate-500">@barangay.hcms</span> at the end of your username.
                </p>
              </div>

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

              {!isStandalone && (
                <Link
                  href="/install"
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3.5 text-sm font-semibold text-[#0EA5E9] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 hover:shadow-md"
                >
                  <Download className="h-4 w-4" />
                  Get the Kalyo App
                </Link>
              )}
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
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
        {label}
      </label>
      <div className="flex min-h-[54px] items-center rounded-2xl border border-sky-300 bg-white px-4 shadow-sm transition duration-300 focus-within:border-[#0EA5E9] focus-within:shadow-md focus-within:shadow-sky-100">
        <span className="mr-3 text-slate-400">{icon}</span>
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((prev) => !prev)}
            aria-label={show ? "Hide password" : "Show password"}
            title={show ? "Hide password" : "Show password"}
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-sky-50 hover:text-[#0EA5E9]"
          >
            {show ? (
              <Eye className="h-5 w-5" />
            ) : (
              <EyeOff className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
  animClass,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  animClass: string;
}) {
  return (
    <div className={`${animClass} group rounded-[20px] border border-white/20 bg-white/15 p-[clamp(1rem,1.4vw,1.4rem)] shadow-lg shadow-slate-950/20 backdrop-blur-md transition-[border-color,background-color] duration-300 hover:border-sky-200/70 hover:bg-white/20`}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white transition duration-300 group-hover:bg-[#0EA5E9] group-hover:shadow-lg group-hover:shadow-sky-500/30">
        {icon}
      </div>
      <h3 className="text-[clamp(1rem,1.1vw,1.25rem)] font-bold text-white drop-shadow-sm">{title}</h3>
      <p className="mt-2 text-[clamp(0.85rem,0.9vw,1rem)] leading-6 text-white/90 drop-shadow-sm">
        {text}
      </p>
    </div>
  );
}
