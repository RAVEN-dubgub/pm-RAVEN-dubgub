"use client";

import { useEffect, useState } from "react";
import { HolographicRingHud } from "@/components/holographic-ring-hud";

const STORAGE_KEY = "pm-holo-effects";

function readHoloEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) !== "off";
}

export function HolographicBackground() {
  const [enabled, setEnabled] = useState(readHoloEnabled);

  useEffect(() => {
    function onToggle(event: Event) {
      const detail = (event as CustomEvent<{ enabled: boolean }>).detail;
      setEnabled(detail.enabled);
    }
    window.addEventListener("holo-effects-change", onToggle);
    return () => window.removeEventListener("holo-effects-change", onToggle);
  }, []);

  if (!enabled) return null;

  return (
    <div className="holo-bg-root" aria-hidden="true">
      <div className="holo-bg-mesh" />
      <div className="holo-bg-grid" />
      <div className="holo-bg-scanlines" />
      <HolographicRingHud />
    </div>
  );
}

export function setHoloEffectsEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  document.documentElement.dataset.holoEffects = enabled ? "on" : "off";
  window.dispatchEvent(new CustomEvent("holo-effects-change", { detail: { enabled } }));
}
