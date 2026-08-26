"use client";

import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { Download, RefreshCw } from "lucide-react";

export type DigitalIdResident = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  sex: string;
  birthDate?: string | null;
  completeAddress?: string | null;
  civilStatus?: string | null;
  religion?: string | null;
  occupation?: string | null;
  barangayName?: string | null;
};

async function toDataUrl(src: string): Promise<string> {
  try {
    const res = await fetch(src, { cache: "force-cache" });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

function formatDate(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatIdName(resident: DigitalIdResident) {
  const middle = resident.middleName ? ` ${resident.middleName}` : "";
  return `${resident.lastName}, ${resident.firstName}${middle}`.trim();
}

function IdBarcode({ seed }: { seed: string }) {
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const push = (w: number, gap: number) => { bars.push({ x, w }); x += w + gap; };
  push(2, 1); push(1, 1); push(2, 1);
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    push(((c >> 4) % 3) + 1, ((c >> 2) % 2) + 1);
    push(((c) % 2) + 1, ((c >> 1) % 2) + 1);
    push(((c * 3) % 3) + 1, 1);
  }
  push(2, 1); push(1, 1); push(2, 0);
  return (
    <svg viewBox={`0 0 ${x} 22`} preserveAspectRatio="none" className="h-5 w-full sm:h-7 lg:h-10">
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={22} fill="#1e293b" />)}
    </svg>
  );
}

function HealthLogoIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none">
      <path d="M20 34c-6.5 0-11-5-11-11 0-5.5 4.3-10 9.8-10 4 0 7.3 2.3 9 5.6C29.7 15.3 33 13 37 13c5.5 0 9.8 4.5 9.8 10 0 6-4.5 11-11 11H20z" fill="#BAE6FD" />
      <circle cx="45" cy="16" r="7" fill="#0EA5E9" />
      <circle cx="22" cy="14" r="6" fill="#38BDF8" />
      <path d="M31 28c-10 0-18 8-18 18v5h36v-5c0-10-8-18-18-18z" fill="#0EA5E9" opacity="0.95" />
      <circle cx="31" cy="29" r="10" fill="white" />
      <path d="M31 21v16M23 29h16" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function ResidentDigitalId({
  resident,
  allowDownload = false,
}: {
  resident: DigitalIdResident;
  allowDownload?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState("/images/davao-logo.png");
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const qrLoading = qrImageUrl === null;

  useEffect(() => {
    toDataUrl("/images/davao-logo.png").then(setLogoDataUrl);
  }, []);

  // The QR encodes a signed, time-limited token. For a resident viewing their
  // OWN ID it is short-lived and rotates, so a screenshot expires and becomes
  // unscannable. Staff/admin (allowDownload) get a durable token for printing.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    async function refresh() {
      try {
        const endpoint = allowDownload
          ? `/api/qr-token/${resident.id}`
          : `/api/qr-token`;
        const res = await fetch(endpoint, { cache: "no-store" });
        const json = await res.json();
        if (!active || !json?.token) return;
        const data = `KALYO://resident/${resident.id}?t=${json.token}`;
        setQrImageUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(data)}`
        );
      } catch (err) {
        console.error("QR_TOKEN_FETCH_ERROR", err);
      }
    }

    refresh();
    if (!allowDownload) {
      timer = setInterval(refresh, 10000);
    }
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [resident.id, allowDownload]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setDownloading(true);
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 3,
        cacheBust: true,
        includeQueryParams: true,
      });
      const link = document.createElement("a");
      link.download = `digital-id-${resident.lastName || "resident"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download card", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pb-6 pt-2">
      <div
        ref={cardRef}
        onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
        className={`relative w-[340px] overflow-hidden rounded-[18px] border border-sky-200 bg-white font-sans shadow-[0_18px_45px_rgba(14,165,233,0.18)] sm:w-[500px] sm:rounded-[24px] lg:aspect-[760/480] lg:h-auto lg:w-full lg:max-w-[760px] lg:rounded-[30px] ${allowDownload ? "" : "select-none [-webkit-touch-callout:none]"}`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#F8FBFF_0%,#FFFFFF_42%,#EEF6FF_100%)]" />
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,#0EA5E9_0%,#38BDF8_55%,#BAE6FD_100%)] sm:h-2 lg:h-2.5" />
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(180deg,#0EA5E9_0%,#38BDF8_55%,#BAE6FD_100%)] sm:w-2 lg:w-2.5" />
        <div className="absolute right-[-42px] top-[-60px] h-[150px] w-[150px] rounded-full border-[22px] border-sky-100/70 sm:right-[-58px] sm:top-[-82px] sm:h-[230px] sm:w-[230px] sm:border-[34px] lg:right-[-78px] lg:top-[-108px] lg:h-[320px] lg:w-[320px] lg:border-[48px]" />
        <div className="absolute bottom-[-58px] left-[70px] h-[150px] w-[150px] rounded-full border-[18px] border-sky-50/80 sm:bottom-[-86px] sm:left-[110px] sm:h-[220px] sm:w-[220px] sm:border-[26px] lg:bottom-[-120px] lg:left-[170px] lg:h-[300px] lg:w-[300px] lg:border-[36px]" />
        <div className="absolute inset-0 opacity-[0.18]">
          <div className="h-full w-full bg-[repeating-linear-gradient(125deg,rgba(37,99,235,0.16)_0px,rgba(37,99,235,0.16)_1px,transparent_1px,transparent_12px)] lg:bg-[repeating-linear-gradient(125deg,rgba(37,99,235,0.15)_0px,rgba(37,99,235,0.15)_1px,transparent_1px,transparent_16px)]" />
        </div>
        <div className="absolute left-[56%] top-[53%] -translate-x-1/2 -translate-y-1/2 opacity-[0.10]">
          <img src={logoDataUrl} alt="Watermark" className="h-[250px] w-[250px] object-contain sm:h-[380px] sm:w-[380px] lg:h-[540px] lg:w-[540px]" />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_53%,rgba(219,234,254,0.08)_0%,rgba(255,255,255,0.20)_38%,rgba(248,251,255,0.84)_74%,rgba(248,251,255,0.94)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.22)_38%,rgba(255,255,255,0.58)_100%)]" />

        <div className="relative z-10 flex h-full flex-col p-3 pl-4 sm:p-5 sm:pl-6 lg:p-7 lg:pl-9">
          <div className="flex items-center justify-between border-b border-sky-100/90 pb-2 sm:pb-3 lg:pb-4">
            <img src={logoDataUrl} alt="Barangay logo" className="h-9 w-9 object-contain drop-shadow-sm sm:h-14 sm:w-14 lg:h-[74px] lg:w-[74px]" />
            <div className="flex-1 px-2 text-center sm:px-4">
              <p className="text-[7px] font-black leading-tight text-slate-800 sm:text-[10px] lg:text-[13px]">REPUBLIC OF THE PHILIPPINES</p>
              <p className="text-[7px] font-black leading-tight text-slate-800 sm:text-[10px] lg:text-[13px]">{(resident.barangayName || "Barangay").toUpperCase()} HEALTH OFFICE</p>
              <h2 className="mt-1 text-[11px] font-black uppercase tracking-wide text-sky-900 sm:text-[17px] lg:text-[25px]">BARANGAY HEALTH DIGITAL ID</h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 shadow-sm ring-1 ring-sky-100 sm:h-14 sm:w-14 sm:rounded-2xl lg:h-[74px] lg:w-[74px] lg:rounded-[22px]">
              <HealthLogoIcon className="h-7 w-7 sm:h-11 sm:w-11 lg:h-14 lg:w-14" />
            </div>
          </div>

          <div className="flex flex-1 gap-2 pt-2 sm:gap-4 sm:pt-4 lg:gap-8 lg:pt-6">
            <div className="flex w-[80px] shrink-0 flex-col items-center sm:w-[130px] lg:w-[200px]">
              <div className="w-full rounded-xl border border-sky-100 bg-white p-1 shadow-[0_10px_24px_rgba(15,23,42,0.12)] sm:rounded-2xl sm:p-2 lg:rounded-[24px] lg:p-3">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Encrypted health record QR code"
                    draggable={false}
                    onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}
                    className={`aspect-square h-auto w-full object-contain ${allowDownload ? "" : "pointer-events-none select-none [-webkit-touch-callout:none]"}`}
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-slate-100 text-[8px] font-bold text-slate-400">
                    {qrLoading ? "Loading..." : "QR N/A"}
                  </div>
                )}
              </div>
              <p className="mt-1 text-center text-[6px] font-bold leading-tight text-slate-500 sm:mt-1.5 sm:text-[9px] lg:mt-2 lg:text-[12px]">Scan for Health Record</p>
              <div className="mt-1.5 w-full sm:mt-2 lg:mt-3">
                <IdBarcode seed={resident.id ?? "B19B-HC"} />
                <p className="mt-0.5 text-center text-[5px] font-bold text-slate-400 sm:text-[7px] lg:text-[9px]">B19B-HC</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2 lg:gap-3">
              <div className="rounded-lg border border-sky-100/70 bg-white/70 px-2 py-1 shadow-sm backdrop-blur-sm sm:rounded-xl sm:px-3 sm:py-1.5 lg:rounded-2xl lg:px-4 lg:py-2.5">
                <p className="text-[5px] font-black uppercase text-sky-900 sm:text-[7px] lg:text-[10px]">Last Name, First Name, Middle Name</p>
                <h3 className="text-[10px] font-black uppercase leading-tight text-slate-950 sm:text-[16px] lg:text-[24px]">{formatIdName(resident)}</h3>
              </div>

              <div className="grid grid-cols-3 gap-x-1 sm:gap-x-2 lg:gap-x-3">
                <div className="flex flex-col">
                  <p className="text-[5px] font-black uppercase text-sky-600 sm:text-[7px] lg:text-[10px]">Nationality</p>
                  <p className="text-[8px] font-black uppercase text-slate-950 sm:text-[12px] lg:text-[17px]">PHL</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[5px] font-black uppercase text-sky-600 sm:text-[7px] lg:text-[10px]">Sex</p>
                  <p className="text-[8px] font-black uppercase text-slate-950 sm:text-[12px] lg:text-[17px]">{resident.sex}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[5px] font-black uppercase text-sky-600 sm:text-[7px] lg:text-[10px]">Date of Birth</p>
                  <p className="text-[8px] font-black uppercase leading-tight text-slate-950 sm:text-[12px] lg:text-[17px]">{formatDate(resident.birthDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-[5px] font-black uppercase text-sky-600 sm:text-[7px] lg:text-[10px]">Address</p>
                <p className="break-words text-[8px] font-black uppercase leading-tight text-slate-950 sm:text-[11px] lg:text-[16px]">{resident.completeAddress}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-1 sm:gap-x-2 lg:gap-x-3">
                <div className="flex flex-col">
                  <p className="text-[5px] font-black uppercase text-sky-600 sm:text-[7px] lg:text-[10px]">Civil Status</p>
                  <p className="break-words text-[8px] font-black uppercase leading-tight text-slate-950 sm:text-[12px] lg:text-[17px]">{resident.civilStatus || "-"}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-[5px] font-black uppercase text-sky-600 sm:text-[7px] lg:text-[10px]">Religion</p>
                  <p className="break-words text-[8px] font-black uppercase leading-tight text-slate-950 sm:text-[12px] lg:text-[17px]">{resident.religion || "-"}</p>
                </div>
              </div>

              <div className="flex flex-col">
                <p className="text-[5px] font-black uppercase text-sky-600 sm:text-[7px] lg:text-[10px]">Occupation</p>
                <p className="break-words text-[8px] font-black uppercase leading-tight text-slate-950 sm:text-[12px] lg:text-[17px]">{resident.occupation || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {allowDownload ? (
        <div className="mt-4 w-full max-w-[340px] sm:max-w-[500px] lg:max-w-[760px]">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-600 disabled:opacity-60 lg:py-4 lg:text-base"
          >
            <Download className="h-4 w-4" />
            {downloading ? "Saving Card Image..." : "Download Digital ID"}
          </button>
        </div>
      ) : (
        <div className="mt-4 w-full max-w-[340px] sm:max-w-[500px] lg:max-w-[760px]">
          <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-700">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            </span>
            <span>
              <span className="inline-flex items-center gap-1 font-black text-emerald-700">
                <RefreshCw className="h-3.5 w-3.5" /> LIVE
              </span>{" "}
              — this QR refreshes every few seconds and can only be scanned live
              inside the app by authorized health workers. A screenshot expires
              within ~20 seconds and cannot be scanned. It cannot be downloaded.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
