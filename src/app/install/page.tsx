"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Smartphone,
  Monitor,
  Share2,
  MoreVertical,
  PlusSquare,
  Chrome,
  CheckCircle2,
} from "lucide-react";

type Platform = "android" | "ios" | "desktop";

const steps: Record<Platform, { icon: React.ReactNode; title: string; desc: string }[]> = {
  android: [
    {
      icon: <Chrome className="h-5 w-5" />,
      title: "Open in Chrome",
      desc: "Visit this website using Google Chrome on your Android phone.",
    },
    {
      icon: <MoreVertical className="h-5 w-5" />,
      title: 'Tap the 3-dot menu "⋮"',
      desc: 'Tap the three-dot menu at the top-right corner of Chrome.',
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: '"Add to Home Screen"',
      desc: 'Select "Add to Home Screen" or "Install App" from the menu.',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Tap Install",
      desc: "Confirm by tapping Install. The Kalyo icon will appear on your home screen.",
    },
  ],
  ios: [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Open in Safari",
      desc: "Visit this website using Safari on your iPhone or iPad.",
    },
    {
      icon: <Share2 className="h-5 w-5" />,
      title: 'Tap the Share button "⎋"',
      desc: "Tap the Share icon at the bottom center of the screen.",
    },
    {
      icon: <PlusSquare className="h-5 w-5" />,
      title: '"Add to Home Screen"',
      desc: 'Scroll down and tap "Add to Home Screen".',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Tap Add",
      desc: 'Tap "Add" at the top-right. The Kalyo icon will appear on your home screen.',
    },
  ],
  desktop: [
    {
      icon: <Chrome className="h-5 w-5" />,
      title: "Open in Chrome or Edge",
      desc: "Visit this website using Google Chrome or Microsoft Edge on your computer.",
    },
    {
      icon: <Monitor className="h-5 w-5" />,
      title: "Look for the install icon",
      desc: "Find the install icon (monitor with a down arrow ↓) in the address bar on the right.",
    },
    {
      icon: <Download className="h-5 w-5" />,
      title: "Click Install",
      desc: 'Click the icon then select "Install" from the popup.',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: "Done!",
      desc: "Kalyo will open as a standalone app with no browser bar.",
    },
  ],
};

const platformLabels: Record<Platform, string> = {
  android: "Android",
  ios: "iPhone / iPad",
  desktop: "Desktop",
};

const platformIcons: Record<Platform, React.ReactNode> = {
  android: <Smartphone className="h-5 w-5" />,
  ios: <Smartphone className="h-5 w-5" />,
  desktop: <Monitor className="h-5 w-5" />,
};

export default function InstallPage() {
  const [active, setActive] = useState<Platform>("android");

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
        .app-icon-anim {
          animation: iconFloat 4s ease-in-out infinite, iconGlow 3s ease-in-out infinite;
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-in { animation: stepIn 0.3s ease both; }
      `}</style>

      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#0EA5E9]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {/* Card */}
        <div className="overflow-hidden rounded-[28px] border border-[#DCEAF7] bg-white shadow-2xl shadow-sky-900/10">

          {/* Hero banner */}
          <div className="relative flex flex-col items-center overflow-hidden bg-gradient-to-br from-[#0EA5E9] via-[#3E8FB5] to-[#0369A1] px-6 pb-10 pt-12 text-white">
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
              <img
                src="/icons/icon-512.png"
                alt="Kalyo App Icon"
                className="h-full w-full object-cover"
              />
            </div>

            <h1 className="relative z-10 text-3xl font-extrabold tracking-tight">Kalyo App</h1>
            <p className="relative z-10 mt-2 max-w-xs text-center text-sm text-white/80">
              A Barangay Health Center Blockchain System — install it on your device for quick access.
            </p>

            <div className="relative z-10 mt-5 flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Free · No app store needed · Works offline
            </div>
          </div>

          {/* Platform tabs */}
          <div className="flex border-b border-slate-100 bg-[#F8FAFC]">
            {(["android", "ios", "desktop"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setActive(p)}
                className={`flex flex-1 flex-col items-center gap-1 py-3.5 text-xs font-semibold transition ${
                  active === p
                    ? "border-b-2 border-[#0EA5E9] text-[#0EA5E9]"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {platformIcons[p]}
                {platformLabels[p]}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div className="space-y-3 p-6">
            {steps[active].map((step, i) => (
              <div
                key={`${active}-${i}`}
                className="step-in flex items-start gap-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
                  {step.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
                <span className="ml-auto shrink-0 text-xs font-bold text-slate-300">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-100 bg-[#F8FAFC] px-6 py-4 text-center text-xs text-slate-400">
            The Kalyo app is a PWA — no app store required. It opens your health center system
            in full-screen with no browser bar.
          </div>
        </div>

        {/* Back to login link */}
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
