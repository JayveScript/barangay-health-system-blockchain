"use client";

import React from "react";

export type BottomNavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

interface MobileBottomNavProps {
  items: BottomNavItem[];
  active: string;
  onChange: (id: string) => void;
}

/**
 * Fixed bottom navigation bar — visible only on mobile (lg:hidden).
 * Renders up to 5 thumb-friendly tabs with icon + label.
 */
export function MobileBottomNav({ items, active, onChange }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-sky-100 bg-white/95 backdrop-blur-md lg:hidden bottom-nav-safe"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
              isActive
                ? "text-sky-600"
                : "text-slate-400 hover:text-sky-500"
            }`}
            style={{ minHeight: 56 }}
          >
            {/* Active indicator dot */}
            <span className="relative flex items-center justify-center">
              {isActive && (
                <span className="absolute -top-1 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-sky-500" />
              )}
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-xl transition-all ${
                  isActive ? "bg-sky-50 text-sky-600" : "text-slate-400"
                }`}
              >
                {item.icon}
              </span>
            </span>
            <span className="leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
