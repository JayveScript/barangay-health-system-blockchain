"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Smartphone,
  Monitor,
  Share2,
  MoreVertical,
  PlusSquare,
  Globe,
  CheckCircle2,
  FolderOpen,
  MousePointer2,
} from "lucide-react";

type Platform = "desktop" | "android" | "ios";

export default function InstallPage() {
  const [active, setActive] = useState<Platform>("desktop");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) setActive("android");
    else if (/iphone|ipad|ipod/i.test(ua)) setActive("ios");
    else setActive("desktop");
  }, []);

  const handleDesktopDownload = () => {
    setDownloading(true);
    const a = document.createElement("a");
    a.href = "/api/download/shortcut";
    a.download = "Kalyo App.url";
    a.click();
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <main className="min-h-[100dvh] bg-[#EFF6FF] px-4 py-8 sm:px-6">
      <style>{`
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes iconGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(56,189,248,0), 0 12px 40px rgba(15,23,42,0.18); }
          50% { box-shadow: 0 0 32px 10px rgba(56,189,248,0.35), 0 12px 40px rgba(15,23,42,0.22); }
        }
        .app-icon-anim { animation: iconFloat 4s ease-in-out infinite, iconGlow 3s ease-in-out infinite; }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-in { animation: stepIn 0.28s ease both; }
        @keyframes pulse-dl {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        .dl-pulse { animation: pulse-dl 1.2s ease-in-out infinite; }
      `}</style>

      <div className="mx-auto max-w-lg">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0EA5E9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <div className="overflow-hidden rounded-[28px] border border-[#DCEAF7] bg-white shadow-2xl shadow-sky-900/10">

          {/* Hero */}
          <div className="relative flex flex-col items-center overflow-hidden bg-gradient-to-br from-[#0EA5E9] via-[#2E86BE] to-[#0369A1] px-6 pb-10 pt-12 text-white">
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="hex" width="60" height="52" patternUnits="userSpaceOnUse">
                    <polygon points="30,2 56,17 56,47 30,62 4,47 4,17" fill="none" stroke="white" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#hex)"/>
              </svg>
            </div>
            <div className="app-icon-anim relative z-10 mb-5 h-28 w-28 overflow-hidden rounded-[28px] border-4 border-white/30 bg-white shadow-2xl">
              <img src="/icons/icon-512.png" alt="Kalyo App Icon" className="h-full w-full object-cover" />
            </div>
            <h1 className="relative z-10 text-3xl font-extrabold tracking-tight">Kalyo App</h1>
            <p className="relative z-10 mt-2 max-w-xs text-center text-sm text-white/80">
              Barangay Health Center Blockchain System — get it on your device for instant access.
            </p>
            <div className="relative z-10 mt-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Free · No app store required
            </div>
          </div>

          {/* Platform tabs */}
          <div className="flex border-b border-slate-100 bg-[#F8FAFC]">
            {([
              { id: "desktop", label: "Desktop", icon: <Monitor className="h-4 w-4" /> },
              { id: "android", label: "Android",  icon: <Smartphone className="h-4 w-4" /> },
              { id: "ios",     label: "iPhone / iPad", icon: <Smartphone className="h-4 w-4" /> },
            ] as { id: Platform; label: string; icon: React.ReactNode }[]).map((p) => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={`flex flex-1 flex-col items-center gap-1 py-3.5 text-xs font-semibold transition ${
                  active === p.id
                    ? "border-b-2 border-[#0EA5E9] text-[#0EA5E9]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>

          {/* Desktop */}
          {active === "desktop" && (
            <div className="p-6">
              <p className="mb-5 text-center text-sm text-slate-500">
                Download a shortcut file — it will appear in your <strong>Downloads folder</strong>. Drag it to your Desktop to use it anytime.
              </p>

              <button
                onClick={handleDesktopDownload}
                disabled={downloading}
                className={`dl-pulse w-full rounded-2xl bg-[#0EA5E9] px-5 py-4 text-base font-bold text-white shadow-lg shadow-sky-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-sky-600 disabled:opacity-60 ${downloading ? "" : ""}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <Download className="h-5 w-5" />
                  {downloading ? "Downloading…" : "Download Kalyo App"}
                </span>
              </button>

              <div className="mt-6 space-y-3">
                {[
                  { icon: <Download className="h-5 w-5" />,       step: "1", title: "Click Download above",            desc: 'A file called "Kalyo App.url" will be saved to your Downloads folder.' },
                  { icon: <FolderOpen className="h-5 w-5" />,      step: "2", title: "Open your Downloads folder",      desc: "Find the Kalyo App.url file that was just downloaded." },
                  { icon: <MousePointer2 className="h-5 w-5" />,   step: "3", title: "Drag it to your Desktop",         desc: 'Right-click the file → "Send to" → "Desktop (create shortcut)" — or drag it directly.' },
                  { icon: <CheckCircle2 className="h-5 w-5" />,    step: "4", title: "Double-click to open Kalyo",      desc: "The Kalyo app will open in your browser. You can also pin it to your taskbar." },
                ].map((s, i) => (
                  <div key={i} className="step-in flex items-start gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">{s.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{s.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-bold text-slate-300">{s.step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Android */}
          {active === "android" && (
            <div className="p-6">
              <p className="mb-5 text-center text-sm text-slate-500">
                Install Kalyo directly on your Android home screen — no Play Store needed.
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Globe className="h-5 w-5" />,        step: "1", title: "Open this page in Chrome",         desc: "Visit this website using Google Chrome on your Android phone." },
                  { icon: <MoreVertical className="h-5 w-5" />, step: "2", title: 'Tap the 3-dot menu "⋮"',           desc: "Tap the three-dot menu at the top-right corner of Chrome." },
                  { icon: <Download className="h-5 w-5" />,     step: "3", title: '"Add to Home Screen"',             desc: 'Select "Add to Home Screen" or "Install App" from the menu.' },
                  { icon: <CheckCircle2 className="h-5 w-5" />, step: "4", title: "Tap Install — done!",             desc: "The Kalyo icon will appear on your home screen. Tap it to open with no browser bar." },
                ].map((s, i) => (
                  <div key={i} className="step-in flex items-start gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">{s.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{s.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-bold text-slate-300">{s.step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* iOS */}
          {active === "ios" && (
            <div className="p-6">
              <p className="mb-5 text-center text-sm text-slate-500">
                Install Kalyo on your iPhone or iPad home screen using Safari.
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Globe className="h-5 w-5" />,        step: "1", title: "Open this page in Safari",         desc: "Visit this website using Safari on your iPhone or iPad." },
                  { icon: <Share2 className="h-5 w-5" />,       step: "2", title: 'Tap the Share button "⎋"',         desc: "Tap the Share icon at the bottom center of the Safari screen." },
                  { icon: <PlusSquare className="h-5 w-5" />,   step: "3", title: '"Add to Home Screen"',             desc: 'Scroll down in the share sheet and tap "Add to Home Screen".' },
                  { icon: <CheckCircle2 className="h-5 w-5" />, step: "4", title: 'Tap "Add" — done!',               desc: "The Kalyo icon will appear on your home screen. Tap it to open with no browser bar." },
                ].map((s, i) => (
                  <div key={i} className="step-in flex items-start gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">{s.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{s.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs font-bold text-slate-300">{s.step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 py-4 text-center text-xs text-slate-400">
            Kalyo is a web app — it works on any device with a browser, no app store required.
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0EA5E9] hover:text-sky-600">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
