"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

type SecureScanGateProps = {
  qrToken?: string;
  residentId?: string;
  welcomeLine: string;
  role: string;
};

export function SecureScanGate({
  qrToken,
  residentId,
  welcomeLine,
  role,
}: SecureScanGateProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState<string | null>(null);
  const [successPulse, setSuccessPulse] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/qr-scan/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrToken: qrToken || undefined,
          residentId: residentId || undefined,
          password: requiresOtp ? undefined : password,
          otpSessionId: requiresOtp ? otpSessionId : undefined,
          otp: requiresOtp ? otp : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Access denied. Incorrect password.");
        setLoading(false);
        return;
      }

      if (data.requiresOtp) {
        setRequiresOtp(true);
        setOtpSessionId(data.otpSessionId);
        setLoading(false);
        return;
      }

      setSuccessPulse(true);
      setTimeout(() => {
        router.push(data.redirectUrl || "/dashboard");
      }, 900);
    } catch {
      setError("Unable to verify credentials. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#EEF4FF] p-4 sm:p-6">
      <style>{`
        @keyframes secureFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.35); }
          50% { box-shadow: 0 0 0 14px rgba(37, 99, 235, 0); }
        }
        @keyframes unlock {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.08) rotate(-6deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .fade-up { animation: secureFadeUp 0.55s ease forwards; }
        .fade-up-delay { animation: secureFadeUp 0.55s 0.12s ease both; }
        .fade-up-delay-2 { animation: secureFadeUp 0.55s 0.24s ease both; }
        .scan-pulse { animation: scanPulse 2s ease infinite; }
        .unlock-anim { animation: unlock 0.7s ease; }
      `}</style>

      <div className="fade-up w-full max-w-lg overflow-hidden rounded-[32px] bg-white shadow-2xl ring-1 ring-blue-100">
        <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600 px-6 py-8 text-white sm:px-8">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ${
                successPulse ? "unlock-anim" : "scan-pulse"
              }`}
            >
              {successPulse ? (
                <ShieldCheck className="h-8 w-8 text-emerald-300" />
              ) : (
                <Shield className="h-8 w-8" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-200">
                Secure Access Verification
              </p>
              <h1 className="mt-1 text-2xl font-black sm:text-3xl">WELCOME ADMIN</h1>
              <p className="mt-2 text-sm font-semibold text-blue-100">{welcomeLine}</p>
            </div>
          </div>
        </div>

        <div className="fade-up-delay px-6 py-8 sm:px-8">
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3">
            <Lock className="h-5 w-5 shrink-0 text-blue-600" />
            <p className="text-sm font-bold text-slate-700">
              Enter Password Before Accessing Resident Information
            </p>
          </div>

          {requiresOtp && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Two-factor verification required for {role.replace(/_/g, " ")} accounts.
              Check your registered email for the 6-digit code.
            </div>
          )}

          <form onSubmit={handleSubmit} className="fade-up-delay-2 space-y-5">
            {!requiresOtp ? (
              <div>
                <label
                  htmlFor="scan-password"
                  className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500"
                >
                  Account Password
                </label>
                <div className="relative">
                  <input
                    id="scan-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your secure password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="scan-otp"
                  className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500"
                >
                  Verification Code
                </label>
                <input
                  id="scan-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="6-digit code"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-lg font-black tracking-[0.4em] text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || successPulse}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-blue-700 hover:shadow-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying credentials...
                </>
              ) : successPulse ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Access granted — decrypting record...
                </>
              ) : requiresOtp ? (
                "Verify Code & Access Record"
              ) : (
                "Verify & Decrypt Resident Record"
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> AES-256 Encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> RBAC Protected
            </span>
            <span>Session Auto-Timeout</span>
          </div>
        </div>
      </div>
    </main>
  );
}
