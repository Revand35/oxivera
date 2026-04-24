"use client";

import { useEffect, ReactNode } from "react";

export function SettingsApplier({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      const s = localStorage.getItem("oxivera:settings");
      if (s) {
        const p = JSON.parse(s);
        if (p && p.theme === "dark") {
          document.documentElement.classList.add("dark");
        }
        if (p && p.language) {
          document.documentElement.setAttribute("lang", p.language);
        }
      }
    } catch (e) {}
  }, []);
  return <>{children}</>;
}
