"use client";

import { useEffect, useState } from "react";
import { setHoloEffectsEnabled } from "@/components/holographic-background";

const STORAGE_KEY = "pm-holo-effects";

function readHoloEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) !== "off";
}

export function HolographicThemeToggle({ compact = false }: { compact?: boolean }) {
  const [enabled, setEnabled] = useState(readHoloEnabled);

  useEffect(() => {
    function onToggle(event: Event) {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
      setEnabled(detail.enabled);
    }
    window.addEventListener("holo-effects-change", onToggle);
    return () => window.removeEventListener("holo-effects-change", onToggle);
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setHoloEffectsEnabled(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={
        compact
          ? "holo-theme-toggle holo-theme-toggle-compact"
          : "holo-theme-toggle"
      }
      aria-pressed={enabled}
      title={enabled ? "Disable holographic effects" : "Enable holographic effects"}
    >
      <span className="holo-theme-toggle-icon" aria-hidden="true">
        ✦
      </span>
      {!compact && (
        <span className="hidden sm:inline">
          {enabled ? "Holo FX on" : "Holo FX off"}
        </span>
      )}
      <span className="sr-only">
        {enabled ? "Disable holographic background effects" : "Enable holographic background effects"}
      </span>
    </button>
  );
}
