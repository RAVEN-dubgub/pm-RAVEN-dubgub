"use client";

import { useCallback, useEffect, useState } from "react";

export type HoloFocusKind = "nav" | "task" | "project" | "widget";

export function dispatchHoloFocusPick(id: string, kind: HoloFocusKind = "widget") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("holo-focus-pick", { detail: { id, kind } }),
  );
}

export function useHoloFocus<T extends string>(
  initial: T | null = null,
  kind: HoloFocusKind = "widget",
) {
  const [focusedId, setFocusedId] = useState<T | null>(initial);

  const focus = useCallback(
    (id: T | null) => {
      setFocusedId(id);
      if (id) dispatchHoloFocusPick(id, kind);
    },
    [kind],
  );

  const toggle = useCallback(
    (id: T) => {
      setFocusedId((current) => {
        const next = current === id ? null : id;
        if (next) dispatchHoloFocusPick(next, kind);
        return next;
      });
    },
    [kind],
  );

  return { focusedId, focus, toggle, isFocused: (id: T) => focusedId === id };
}

export function useHoloFocusPulse() {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    function onPulse() {
      setPulseKey((count) => count + 1);
    }
    window.addEventListener("holo-nav-pick", onPulse);
    window.addEventListener("holo-focus-pick", onPulse);
    return () => {
      window.removeEventListener("holo-nav-pick", onPulse);
      window.removeEventListener("holo-focus-pick", onPulse);
    };
  }, []);

  return pulseKey;
}

/** Polar position on an elliptical orbit (degrees, px radius). */
export function orbitSlot(index: number, total: number, radiusX: number, radiusY?: number) {
  const ry = radiusY ?? radiusX * 0.42;
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * radiusX,
    y: Math.sin(angle) * ry,
    angleDeg: (angle * 180) / Math.PI,
  };
}
