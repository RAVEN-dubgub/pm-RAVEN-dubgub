"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HolographicRingHud } from "@/components/holographic-ring-hud";
import { resolveHoloRoute } from "@/lib/holo-route";

const STORAGE_KEY = "pm-holo-effects";

function readHoloEnabled() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) !== "off";
}

export function HolographicBackground() {
  const pathname = usePathname();
  const route = resolveHoloRoute(pathname);
  const [enabled, setEnabled] = useState(readHoloEnabled);

  useEffect(() => {
    document.documentElement.dataset.holoRoute = route;
    return () => {
      delete document.documentElement.dataset.holoRoute;
    };
  }, [route]);

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
    <div className="holo-bg-root" data-holo-route={route} aria-hidden="true">
      <div className="holo-bg-tint" />
      <div className="holo-bg-mesh" />
      <div className="holo-bg-grid holo-bg-grid-full" />
      <div className="holo-bg-vignette" />
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
