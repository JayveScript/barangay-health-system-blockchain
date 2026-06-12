"use client";

import { HeartPulse } from "lucide-react";

type PortalLoaderProps = {
  label?: string;
  /** When set, shows an error state instead of the spinner. */
  error?: string;
  /** Optional retry / back action shown under an error. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Render embedded inside an existing shell instead of full-screen. */
  inline?: boolean;
};

/**
 * Modern, branded loading screen shared across the resident, doctor, staff and
 * admin portals. Shows an animated medical pulse ring while loading, or a clean
 * error card with a retry action.
 */
export function PortalLoader({
  label = "Loading...",
  error,
  onRetry,
  retryLabel = "Back to Login",
  inline = false,
}: PortalLoaderProps) {
  const wrapperClass = inline
    ? "flex min-h-[340px] w-full items-center justify-center px-6"
    : "flex min-h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-[#EFF6FF] via-[#F5FAFF] to-[#E0F2FE] px-6";

  return (
    <div className={wrapperClass}>
      <div className="relative flex w-full max-w-sm flex-col items-center">
        {/* soft glow behind the card */}
        <div className="pointer-events-none absolute -top-8 h-44 w-44 rounded-full bg-sky-300/30 blur-3xl" />

        <div className="relative flex w-full flex-col items-center gap-7 rounded-[32px] border border-white/70 bg-white/80 px-10 py-12 shadow-2xl shadow-sky-900/10 backdrop-blur-xl">
          {/* animated pulse ring + medical icon */}
          <div className="relative flex h-24 w-24 items-center justify-center">
            {/* expanding halo */}
            {!error && (
              <span className="absolute inset-0 animate-ping rounded-full bg-sky-400/20 [animation-duration:1.8s]" />
            )}
            {/* spinning gradient ring */}
            {!error && (
              <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent [animation-duration:1s] [border-right-color:#7DD3FC] [border-top-color:#0EA5E9]" />
            )}
            {/* static track ring */}
            <span className="absolute inset-1.5 rounded-full border-2 border-sky-100" />
            {/* center badge */}
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg ${
                error
                  ? "bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/30"
                  : "bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] shadow-sky-500/30"
              }`}
            >
              <HeartPulse
                className={`h-8 w-8 ${error ? "" : "animate-pulse"}`}
                strokeWidth={2.4}
              />
            </span>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div>
                <p className="text-base font-black text-slate-900">
                  Something went wrong
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {error}
                </p>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-2xl bg-[#0EA5E9] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-600"
                >
                  {retryLabel}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3.5 text-center">
              <p className="text-base font-bold text-slate-800">{label}</p>

              {/* bouncing dots */}
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-sky-300" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Barangay Health Portal
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
