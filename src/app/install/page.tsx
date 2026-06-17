"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type Platform = "desktop" | "android" | "ios";

export default function InstallPage() {
  const [active, setActive]           = useState<Platform>("desktop");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled]     = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua))           setActive("android");
    else if (/iphone|ipad|ipod/i.test(ua)) { setActive("ios"); setShowIOSHint(true); }
    else                               setActive("desktop");

    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
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
        @keyframes floatIcon{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
        @keyframes glowIcon{0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,0),0 20px 60px rgba(14,165,233,.2);}50%{box-shadow:0 0 40px 12px rgba(14,165,233,.4),0 20px 60px rgba(14,165,233,.3);}}
        .icon-float{animation:floatIcon 3.5s ease-in-out infinite,glowIcon 3s ease-in-out infinite;}
        @keyframes ripple{0%{transform:scale(1);opacity:.5;}100%{transform:scale(2.4);opacity:0;}}
        .rip1{animation:ripple 2s ease-out infinite;}
        .rip2{animation:ripple 2s ease-out .65s infinite;}
        .rip3{animation:ripple 2s ease-out 1.3s infinite;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
        .fade-up{animation:fadeUp .3s ease both;}
        @keyframes bounceArrow{0%,100%{transform:translateY(0);}50%{transform:translateY(6px);}}
        .bounce-arrow{animation:bounceArrow 1s ease-in-out infinite;}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
        .slide-up{animation:slideUp .4s cubic-bezier(.16,1,.3,1);}
        @keyframes btnPulse{0%,100%{box-shadow:0 0 0 0 rgba(14,165,233,.5);}70%{box-shadow:0 0 0 14px rgba(14,165,233,0);}}
        .btn-pulse{animation:btnPulse 2s ease-out infinite;}
      `}</style>

      {/* iOS share hint overlay */}
      {showIOSHint && active === "ios" && (
        <div className="slide-up fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-slate-200 bg-white pb-10 pt-5 shadow-2xl">
          <button onClick={() => setShowIOSHint(false)} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-lg">×</button>
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] shadow-lg">
              <img src="/icons/icon-192.png" alt="Kalyo" className="h-full w-full object-cover" />
            </div>
            <p className="text-lg font-extrabold text-slate-800">Add Kalyo to Home Screen</p>
            <p className="text-sm text-slate-500">Tap the <strong>Share button</strong> in Safari, then choose <strong>"Add to Home Screen"</strong></p>
            <div className="mt-1 flex items-center justify-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-6 py-3">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-sky-500 fill-current"><path d="M12 2l-3 5h2v7h2V7h2L12 2zm-7 9v10h14V11h-3v2h1v6H7v-6h1v-2H5z"/></svg>
              <span className="text-sm font-semibold text-sky-700">Tap Share → Add to Home Screen</span>
            </div>
            <div className="bounce-arrow text-3xl text-sky-400">↓</div>
            <p className="text-xs text-slate-400">The Share button is at the bottom of Safari</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md">
        <Link href="/login" className="mb-8 inline-flex items-center gap-2 rounded-xl bg-white/60 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-sky-600">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>

        {/* App Icon */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <span className="rip1 absolute inset-0 rounded-[32px] bg-sky-400/30" />
            <span className="rip2 absolute inset-0 rounded-[32px] bg-sky-400/20" />
            <span className="rip3 absolute inset-0 rounded-[32px] bg-sky-400/10" />
            <div className="icon-float relative h-32 w-32 overflow-hidden rounded-[32px] border-4 border-white shadow-2xl">
              <img src="/icons/icon-512.png" alt="Kalyo" className="h-full w-full object-cover" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800">Kalyo App</h1>
          <p className="mt-1.5 text-base text-slate-500">Barangay Health Center · Blockchain</p>
          <div className="mt-3 flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Free · No app store needed
          </div>
        </div>

        {/* Platform tabs */}
        <div className="mb-4 flex gap-2">
          {([
            { id: "desktop", emoji: "🖥️", label: "Desktop" },
            { id: "android", emoji: "🤖", label: "Android" },
            { id: "ios",     emoji: "🍎", label: "iPhone" },
          ] as { id: Platform; emoji: string; label: string }[]).map((p) => (
            <button key={p.id} onClick={() => setActive(p.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-3 text-sm font-bold transition ${
                active === p.id
                  ? "border-sky-400 bg-sky-500 text-white shadow-lg shadow-sky-500/30"
                  : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600"
              }`}>
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {/* ── DESKTOP ── */}
        {active === "desktop" && (
          <div className="fade-up rounded-3xl bg-white p-6 shadow-xl shadow-sky-900/10">
            {installed ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                <p className="text-xl font-extrabold text-emerald-700">Kalyo Installed!</p>
                <p className="text-sm text-slate-500">Find it in your Start Menu. Right-click → Pin to Desktop or Taskbar.</p>
              </div>
            ) : installPrompt ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <p className="text-center text-sm text-slate-500">Click below — Kalyo installs with its own icon, no browser bar.</p>
                <button onClick={handleInstall}
                  className="btn-pulse w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-5 text-lg font-extrabold text-white transition hover:-translate-y-1 hover:shadow-2xl">
                  🖥️ &nbsp;Install Kalyo on Desktop
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-center text-sm text-slate-500">Open this page in <strong>Chrome</strong> or <strong>Edge</strong>, then click the install icon in the address bar.</p>
                {/* Address bar mockup */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" /><div className="h-3 w-3 rounded-full bg-yellow-400" /><div className="h-3 w-3 rounded-full bg-green-400" />
                    <div className="ml-1 flex flex-1 items-center justify-between rounded-md bg-white px-3 py-1.5 text-xs text-slate-400 ring-1 ring-slate-200">
                      <span>your-site.vercel.app</span>
                      <div className="relative flex items-center gap-1">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-sky-500 text-white text-xs font-bold shadow">⊕</div>
                        <div className="absolute -top-9 right-0 flex flex-col items-center">
                          <span className="whitespace-nowrap rounded-lg bg-sky-500 px-2 py-1 text-[10px] font-bold text-white shadow">Tap here!</span>
                          <span className="bounce-arrow text-sky-500 text-sm leading-none">▼</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {["Open in Chrome or Edge.", 'Click the ⊕ icon in the address bar (top right).', 'Click "Install" → Kalyo icon appears on your desktop.'].map((t, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-600">{i + 1}</span>
                      <p className="text-sm text-slate-600">{t}</p>
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
            {installed ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                <p className="text-xl font-extrabold text-emerald-700">Kalyo Installed!</p>
                <p className="text-sm text-slate-500">The Kalyo icon is now on your home screen.</p>
              </div>
            ) : installPrompt ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="flex h-20 w-20 overflow-hidden rounded-[24px] shadow-lg">
                  <img src="/icons/icon-192.png" alt="Kalyo" className="h-full w-full object-cover" />
                </div>
                <p className="text-center text-sm text-slate-500">
                  Tap the button — Kalyo downloads and goes straight to your home screen.
                </p>
                <button onClick={handleInstall}
                  className="btn-pulse w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-5 text-lg font-extrabold text-white transition hover:shadow-2xl active:scale-95">
                  🤖 &nbsp;Add to Home Screen
                </button>
                <p className="text-xs text-slate-400">No app store. Installs directly with the Kalyo icon.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-700">
                  <strong>Open this page in Google Chrome</strong> on your Android phone to get the install button.
                </div>
                <p className="text-sm text-slate-500">Then tap the <strong>3-dot menu ⋮</strong> → <strong>"Add to Home Screen"</strong></p>
              </div>
            )}
          </div>
        )}

        {/* ── iOS ── */}
        {active === "ios" && (
          <div className="fade-up rounded-3xl bg-white p-6 shadow-xl shadow-sky-900/10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-20 w-20 overflow-hidden rounded-[24px] shadow-lg">
                <img src="/icons/icon-192.png" alt="Kalyo" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800">Add Kalyo to Your Home Screen</p>
                <p className="mt-1 text-sm text-slate-500">iPhone/iPad uses Safari — one step to install.</p>
              </div>

              {/* Big visual share instruction */}
              <div className="w-full rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 p-5">
                <p className="mb-4 text-sm font-semibold text-sky-800">In Safari, do this:</p>
                <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  {/* Share icon big */}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/40">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white"><path d="M12 2l-3 5h2v7h2V7h2L12 2zm-7 9v10h14V11h-3v2h1v6H7v-6h1v-2H5z"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-slate-800">Tap Share</p>
                    <p className="text-xs text-slate-500">Bottom of Safari screen</p>
                  </div>
                </div>
                <div className="my-2 flex justify-center text-slate-400 text-xl">↓</div>
                <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 shadow">
                    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-slate-600"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 3v10M9 6l3-3 3 3"/></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-slate-800">Add to Home Screen</p>
                    <p className="text-xs text-slate-500">Scroll down in the share sheet</p>
                  </div>
                </div>
              </div>

              <button onClick={() => setShowIOSHint(true)}
                className="w-full rounded-2xl border-2 border-sky-400 bg-sky-50 py-4 text-base font-extrabold text-sky-600 transition hover:bg-sky-100 active:scale-95">
                🍎 &nbsp;Show Me How
              </button>
              <p className="text-xs text-slate-400">The Kalyo icon will appear on your iPhone home screen.</p>
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
