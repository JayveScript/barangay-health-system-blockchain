"use client";

import { useState } from "react";
import { KeyRound, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ChangePasswordTab() {
  const { t } = useI18n();
  const [step, setStep] = useState<"request" | "verify" | "done">("request");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    setError("");
    try {
      setLoading(true);
      const res = await fetch("/api/me/change-password/send-code", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t("cp.errSend"));
        return;
      }
      setMaskedEmail(json.email || "your email");
      setStep("verify");
    } catch {
      setError(t("cp.errConnect"));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    setError("");
    if (!code.trim()) {
      setError(t("cp.errCode"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("cp.errPwLen"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("cp.errPwMatch"));
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/me/change-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), newPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t("cp.errChange"));
        return;
      }
      setStep("done");
    } catch {
      setError(t("cp.errConnect"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="mx-auto max-w-xl rounded-[24px] border border-sky-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">{t("cp.title")}</h3>
            <p className="text-sm text-slate-500">
              {t("cp.subtitle")}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
        )}

        {step === "request" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
              <p className="text-sm font-semibold text-slate-600">
                {t("cp.info")}
              </p>
            </div>
            <button
              type="button"
              onClick={sendCode}
              disabled={loading}
              className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0EA5E9] px-6 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600 disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {loading ? t("cp.sending") : t("cp.send")}
            </button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">
                {t("cp.sentPrefix")} <span className="font-black">{maskedEmail}</span>. {t("cp.sentSuffix")}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{t("cp.code")}</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("cp.codePh")}
                className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold tracking-widest text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{t("cp.newPw")}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("cp.newPwPh")}
                className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{t("cp.confirmPw")}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("cp.confirmPwPh")}
                className="min-h-[48px] w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={sendCode}
                disabled={loading}
                className="min-h-[48px] rounded-2xl border border-sky-200 bg-white px-5 text-sm font-bold text-sky-700 transition hover:bg-sky-50 disabled:opacity-60"
              >
                {t("cp.resend")}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={loading}
                className="min-h-[48px] flex-1 rounded-2xl bg-[#0EA5E9] px-6 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-60"
              >
                {loading ? t("cp.saving") : t("cp.submit")}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">{t("cp.doneTitle")}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {t("cp.doneBody")}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/logout", { method: "POST" }).catch(() => {});
                window.location.href = "/login";
              }}
              className="min-h-[48px] rounded-2xl bg-[#0EA5E9] px-8 text-sm font-bold text-white transition hover:bg-sky-600"
            >
              {t("cp.goLogin")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
