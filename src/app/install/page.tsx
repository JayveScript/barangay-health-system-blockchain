"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

type Platform = "desktop" | "android" | "ios";

export default function InstallPage() {
  const [active, setActive]           = useState<Platform>("desktop");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled]     = useState(false);
  const [showIOSHint, setShowIOSHint]         = useState(false);
  const [showAndroidHint, setShowAndroidHint] = useState(false);

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

      {/* Android hint overlay */}
      {showAndroidHint && active === "android" && (
        <div className="slide-up fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-slate-200 bg-white pb-10 pt-5 shadow-2xl">
          <button onClick={() => setShowAndroidHint(false)} className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-lg">×</button>
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] shadow-lg">
              <img src="/icons/icon-192.png" alt="Kalyo" className="h-full w-full object-cover" />
            </div>
            <p className="text-lg font-extrabold text-slate-800">Add Kalyo to Home Screen</p>
            <div className="w-full space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500 shadow shadow-sky-500/30">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Tap ⋮ Menu</p>
                  <p className="text-xs text-slate-500">Top-right of Chrome</p>
                </div>
              </div>
              <div className="flex justify-center text-slate-400">↓</div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-200 shadow">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-slate-600"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 3v10M9 6l3-3 3 3"/></svg>
                </div>
                <div className="text-left">
                  <p className="font-bold text-slate-800">Add to Home Screen</p>
                  <p className="text-xs text-slate-500">Then tap Install to confirm</p>
                </div>
              </div>
            </div>
            <div className="bounce-arrow text-3xl text-sky-400">↓</div>
            <p className="text-xs text-slate-400">The menu ⋮ is at the top-right corner of Chrome</p>
          </div>
        </div>
      )}

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
          <div className="mt-2 flex flex-wrap justify-center gap-1 text-center">
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-black tracking-widest text-sky-700">K</span>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-black tracking-widest text-sky-700">A</span>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-black tracking-widest text-sky-700">L</span>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-black tracking-widest text-sky-700">Y</span>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-black tracking-widest text-sky-700">O</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-sky-700">Kalusugan At Ligtas Yang Obyektibo</p>
          <p className="text-xs text-slate-400 italic">"Health and Safety as Our Objective"</p>
          <p className="mt-1 text-sm text-slate-500">Barangay Health Center · Blockchain System</p>
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
            ) : (
              <div className="flex flex-col items-center gap-5 py-2">
                <div className="flex h-20 w-20 overflow-hidden rounded-[22px] shadow-lg">
                  <img src="/icons/icon-512.png" alt="Kalyo" className="h-full w-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-slate-800 text-lg">Install on your Desktop</p>
                  <p className="mt-1 text-sm text-slate-500">Opens with the Kalyo icon — no browser bar.</p>
                </div>
                <button
                  onClick={installPrompt ? handleInstall : () => {
                    window.open(window.location.href.replace("/install", "/login"), "_blank");
                    alert('Look for the install icon ⊕ in your Chrome or Edge address bar, then click Install.');
                  }}
                  className="btn-pulse w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-5 text-lg font-extrabold text-white shadow-xl shadow-sky-500/30 transition hover:-translate-y-1 hover:shadow-2xl active:scale-95">
                  🖥️ &nbsp;{installPrompt ? "Install Kalyo Now" : "Install Kalyo on Desktop"}
                </button>
                {!installPrompt && (
                  <p className="text-xs text-slate-400 text-center">
                    Open this page in <strong className="text-slate-600">Chrome</strong> or <strong className="text-slate-600">Edge</strong> — the button will trigger the install automatically.
                  </p>
                )}
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
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-20 w-20 overflow-hidden rounded-[24px] shadow-lg">
                  <img src="/icons/icon-192.png" alt="Kalyo" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-800">Add Kalyo to Your Home Screen</p>
                  <p className="mt-1 text-sm text-slate-500">Android Chrome — two taps to install.</p>
                </div>

                <div className="w-full rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100 border border-sky-200 p-5">
                  <p className="mb-4 text-sm font-semibold text-sky-800">In Chrome, do this:</p>
                  <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/40">
                      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-slate-800">Tap Menu ⋮</p>
                      <p className="text-xs text-slate-500">Top-right corner of Chrome</p>
                    </div>
                  </div>
                  <div className="my-2 flex justify-center text-slate-400 text-xl">↓</div>
                  <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 shadow">
                      <svg viewBox="0 0 24 24" className="h-8 w-8 fill-slate-600"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 3v10M9 6l3-3 3 3"/></svg>
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-slate-800">Add to Home Screen</p>
                      <p className="text-xs text-slate-500">Tap Install to confirm</p>
                    </div>
                  </div>
                </div>

                {installPrompt ? (
                  <button onClick={handleInstall}
                    className="btn-pulse w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-4 text-base font-extrabold text-white shadow-xl shadow-sky-500/30 transition hover:shadow-2xl active:scale-95">
                    🤖 &nbsp;Install Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const url = window.location.href;
                      const noProto = url.replace(/^https?:\/\//, "");
                      const scheme = url.startsWith("https") ? "https" : "http";
                      window.location.href = `intent://${noProto}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
                    }}
                    className="w-full rounded-2xl border-2 border-sky-400 bg-sky-50 py-4 text-base font-extrabold text-sky-600 transition hover:bg-sky-100 active:scale-95">
                    🤖 &nbsp;Open in Chrome to Install
                  </button>
                )}
                <button onClick={() => setShowAndroidHint(true)}
                  className="w-full rounded-2xl border-2 border-sky-400 bg-sky-50 py-4 text-base font-extrabold text-sky-600 transition hover:bg-sky-100 active:scale-95">
                  🤖 &nbsp;Show Me How
                </button>
                <p className="text-xs text-slate-400">The Kalyo icon will appear on your Android home screen.</p>
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
