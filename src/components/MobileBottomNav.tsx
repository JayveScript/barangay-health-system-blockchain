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

export function MobileBottomNav(_props: MobileBottomNavProps) {
  return null;
}
