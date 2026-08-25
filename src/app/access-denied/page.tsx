"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AccessDeniedPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutAndRedirect = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF4FF] p-5">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        .access-denied-card { font-family: 'Inter', sans-serif; }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.6s ease-in-out; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-delay { animation: fadeUp 0.5s 0.15s ease both; }
        .fade-up-delay-2 { animation: fadeUp 0.5s 0.3s ease both; }
      `}</style>

      <div
        className="access-denied-card mx-auto max-w-md w-full overflow-hidden rounded-3xl bg-white shadow-2xl"
        style={{ boxShadow: "0 25px 60px rgba(37, 99, 235, 0.12)" }}
      >
        <div className="bg-gradient-to-r from-red-600 to-rose-500 px-8 py-6 text-white">
          <div className="flex items-center gap-4">
            <div
              className="shake flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl"
              aria-hidden="true"
            >
              🔒
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-red-100">
                Barangay Health System
              </p>
              <h1 className="text-2xl font-black leading-tight">
                Access Denied
              </h1>
            </div>
          </div>
        </div>

        <div className="px-8 py-10 text-center">
          <p
            className="fade-up text-4xl font-black text-red-500"
            style={{ lineHeight: 1 }}
          >
            403
          </p>
          <p className="fade-up-delay mt-4 text-base font-bold text-slate-700">
            You do not have permission to view this record.
          </p>
          <p className="fade-up-delay mt-2 text-sm text-slate-500">
            Viewing a resident&apos;s digital health ID requires one of the
            following roles:{" "}
            <span className="font-bold text-slate-700">
              Admin, Nurse, Midwife, Doctor, BHW,
            </span>{" "}
            or{" "}
            <span className="font-bold text-slate-700">Staff</span>.
          </p>

          <div className="fade-up-delay-2 mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleLogoutAndRedirect}
              disabled={isLoggingOut}
              id="access-denied-login-btn"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-700 hover:shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ boxShadow: "0 8px 24px rgba(37,99,235,0.25)" }}
            >
              {isLoggingOut ? "Logging out..." : "Log in with an authorized account"}
            </button>
            <Link
              href="/"
              id="access-denied-home-btn"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100"
            >
              Go to Home
            </Link>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-8 py-4 text-center">
          <p className="text-xs text-slate-400">
            If you believe this is an error, please contact your Barangay
            Health administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
