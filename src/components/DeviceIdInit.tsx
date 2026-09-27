"use client";

import { useEffect } from "react";

export default function DeviceIdInit() {
  useEffect(() => {
    try {
      const hasDid = document.cookie
        .split("; ")
        .some((c) => c.startsWith("did="));
      if (!hasDid) {
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const secure = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `did=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
      }
    } catch {
    }
  }, []);

  return null;
}
