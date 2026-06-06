"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send, Lock, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/forgot-password/send-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code.");
        return;
      }

      setMessage("Verification code sent to your email.");
      setStep("reset");
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Password reset failed.");
        return;
      }

      setMessage("Password reset successful. You can now login.");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EFF6FF] px-4 py-8">
      <div className="w-full max-w-xl rounded-[32px] border border-[#DCEAF7] bg-white p-8 shadow-2xl shadow-sky-900/10 sm:p-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0EA5E9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="mt-8 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#0EA5E9] text-white shadow-xl shadow-sky-500/25">
            {step === "email" ? (
              <Mail className="h-12 w-12" />
            ) : (
              <ShieldCheck className="h-12 w-12" />
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <h1 className="text-4xl font-extrabold text-[#0EA5E9] sm:text-5xl">
            Forgot Password
          </h1>
          <p className="mt-3 text-base text-slate-500">
            {step === "email"
              ? "Enter your email to receive a reset code"
              : "Enter the code and your new password"}
          </p>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
            {message}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
                Email Address
              </label>
              <div className="flex min-h-[58px] items-center rounded-2xl border border-sky-300 bg-white px-4 shadow-sm transition focus-within:border-[#0EA5E9] focus-within:shadow-md focus-within:shadow-sky-100">
                <Mail className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-4 text-base font-bold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-5 w-5" />
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
                Verification Code
              </label>
              <div className="flex min-h-[58px] items-center rounded-2xl border border-sky-300 bg-white px-4 shadow-sm transition focus-within:border-[#0EA5E9]">
                <ShieldCheck className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
                New Password
              </label>
              <div className="flex min-h-[58px] items-center rounded-2xl border border-sky-300 bg-white px-4 shadow-sm transition focus-within:border-[#0EA5E9]">
                <Lock className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[#0EA5E9]">
                Confirm Password
              </label>
              <div className="flex min-h-[58px] items-center rounded-2xl border border-sky-300 bg-white px-4 shadow-sm transition focus-within:border-[#0EA5E9]">
                <Lock className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] px-5 py-4 text-base font-bold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Lock className="h-5 w-5" />
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}