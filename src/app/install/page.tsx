"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type Platform = "desktop" | "android" | "ios";

export default function InstallPage() {
  const [active, setActive] = useState<Platform>("desktop");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) setActive("android");
    else if (/iphone|ipad|ipod/i.test(ua)) setActive("ios");
    else setActive("desktop");

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 px-4 py-8">
      <style>{`
        @keyframes floatIcon {
          0%,100%{transform:translateY(0);}
          50%{transform:translateY(-10px);}
        }
        @keyframes glowIcon {
          0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,0),0 20px 60px rgba(14,165,233,0.2);}
          50%{box-shadow:0 0 40px 12px rgba(14,165,233,0.4),0 20px 60px rgba(14,165,233,0.3);}
        }
        .icon-float{animation:floatIcon 3.5s ease-in-out infinite,glowIcon 3s ease-in-out infinite;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        .fade-up{animation:fadeUp .35s ease both;}
        @keyframes ripple{0%{transform:scale(1);opacity:.6;}100%{transform:scale(2.2);opacity:0;}}
        .ripple-1{animation:ripple 2s ease-out infinite;}
        .ripple-2{animation:ripple 2s ease-out .7s infinite;}
        .ripple-3{animation:ripple 2s ease-out 1.4s infinite;}
      `}</style>

      <div className="mx-auto max-w-md">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-sky-600">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>

        {/* App Icon + Title */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <span className="ripple-1 absolute inset-0 rounded-[32px] bg-sky-400/30" />
            <span className="ripple-2 absolute inset-0 rounded-[32px] bg-sky-400/20" />
            <span className="ripple-3 absolute inset-0 rounded-[32px] bg-sky-400/10" />
            <div className="icon-float relative h-32 w-32 overflow-hidden rounded-[32px] border-4 border-white shadow-2xl">
              <img src="/icons/icon-512.png" alt="Kalyo" className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Kalyo App</h1>
          <p className="mt-2 text-base text-slate-500">Barangay Health Center · Blockchain System</p>
          <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Free · No app store needed
          </div>
        </div>

        {/* Platform selector */}
        <div className="mb-4 flex gap-2">
          {([
            { id: "desktop", emoji: "🖥️", label: "Desktop" },
            { id: "android", emoji: "🤖", label: "Android" },
            { id: "ios",     emoji: "🍎", label: "iPhone" },
          ] as { id: Platform; emoji: string; label: string }[]).map((p) => (
            <button
              key={p.id}
              onClick={() => setActive(p.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-3 text-sm font-bold transition ${
                active === p.id
                  ? "border-sky-400 bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600"
              }`}
            >
              <span>{p.emoji}</span>{p.label}
            </button>
          ))}
        </div>

        {/* ── DESKTOP ── */}
        {active === "desktop" && (
          <div className="fade-up space-y-4">
            {installed ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </div>
                <p className="text-xl font-extrabold text-emerald-700">Installed!</p>
                <p className="mt-1 text-sm text-emerald-600">Find Kalyo in your Start Menu. Right-click → Pin to Desktop or Taskbar.</p>
              </div>
            ) : installPrompt ? (
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-sky-900/10">
                <p className="mb-4 text-center text-sm font-medium text-slate-500">Your browser is ready — click to install now.</p>
                <button
                  onClick={handleInstall}
                  className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-5 text-lg font-extrabold text-white shadow-xl shadow-sky-500/30 transition hover:-translate-y-1 hover:shadow-2xl"
                >
                  🖥️ &nbsp;Install Kalyo on Desktop
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">Installs with the Kalyo icon. Opens without browser bar.</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-6 shadow-xl shadow-sky-900/10">
                <p className="mb-5 text-center text-sm text-slate-500">
                  Open this page in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>, then follow these steps:
                </p>

                {/* Visual address bar mockup */}
                <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-3 py-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <div className="ml-2 flex flex-1 items-center justify-between rounded-md bg-white px-3 py-1.5 text-xs text-slate-500 ring-1 ring-slate-200">
                      <span>your-site.vercel.app/install</span>
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-sky-500 text-white shadow">
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 16l-4-4h8z" fill="white"/></svg>
                          </div>
                          {/* Arrow pointing to install button */}
                          <div className="absolute -top-8 right-0 flex flex-col items-center">
                            <span className="whitespace-nowrap rounded-lg bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">Tap here!</span>
                            <svg className="h-3 w-3 text-sky-500 fill-current" viewBox="0 0 10 10"><path d="M5 10L0 0h10z"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3 text-center text-xs text-slate-400">
                    Look for the <strong className="text-slate-600">install icon ⊕</strong> in the address bar
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { n: "1", text: "Open this page in Chrome or Edge on your computer." },
                    { n: "2", text: 'Click the install icon ⊕ in the address bar (top right).' },
                    { n: "3", text: 'Select "Install" — Kalyo opens with its own icon.' },
                    { n: "4", text: 'Right-click the app in Start Menu → "Pin to Desktop" or "Pin to Taskbar".' },
                  ].map((s) => (
                    <div key={s.n} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-600">{s.n}</span>
                      <p className="pt-0.5 text-sm text-slate-600">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ANDROID ── */}
        {active === "android" && (
          <div className="fade-up rounded-3xl bg-white p-6 shadow-xl shadow-sky-900/10">
            <p className="mb-5 text-center text-sm text-slate-500">
              Add Kalyo to your Android home screen — one tap to open, no browser bar.
            </p>

            {/* Phone mockup */}
            <div className="mb-6 flex justify-center">
              <div className="relative h-48 w-28 overflow-hidden rounded-3xl border-4 border-slate-700 bg-gradient-to-b from-sky-400 to-blue-600 shadow-2xl shadow-slate-900/40">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[16px] shadow-lg">
                    <img src="/icons/icon-192.png" alt="Kalyo" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 text-center text-[9px] font-bold text-white drop-shadow">Kalyo</p>
                </div>
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded bg-black/40 text-[10px] font-bold text-white">⋮</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { n: "1", text: "Open this page in Google Chrome on your Android phone." },
                { n: "2", text: 'Tap the 3-dot menu "⋮" at the top-right of Chrome.' },
                { n: "3", text: 'Tap "Add to Home Screen" or "Install App".' },
                { n: "4", text: "Tap Install. The Kalyo icon appears on your home screen!" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-600">{s.n}</span>
                  <p className="pt-0.5 text-sm text-slate-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── iOS ── */}
        {active === "ios" && (
          <div className="fade-up rounded-3xl bg-white p-6 shadow-xl shadow-sky-900/10">
            <p className="mb-5 text-center text-sm text-slate-500">
              Add Kalyo to your iPhone or iPad home screen — one tap to open, no browser bar.
            </p>

            {/* Phone mockup */}
            <div className="mb-6 flex justify-center">
              <div className="relative h-48 w-28 overflow-hidden rounded-3xl border-4 border-slate-700 bg-gradient-to-b from-sky-400 to-blue-600 shadow-2xl shadow-slate-900/40">
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[16px] shadow-lg">
                    <img src="/icons/icon-192.png" alt="Kalyo" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 text-center text-[9px] font-bold text-white drop-shadow">Kalyo</p>
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg">⎋</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { n: "1", text: "Open this page in Safari on your iPhone or iPad." },
                { n: "2", text: 'Tap the Share button "⎋" at the bottom of Safari.' },
                { n: "3", text: 'Scroll down and tap "Add to Home Screen".' },
                { n: "4", text: 'Tap "Add". The Kalyo icon appears on your home screen!' },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-600">{s.n}</span>
                  <p className="pt-0.5 text-sm text-slate-600">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-sky-500 hover:text-sky-600">Log in</Link>
        </p>
      </div>
    </main>
  );
}
