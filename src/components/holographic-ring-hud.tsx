"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { resolveHoloRoute } from "@/lib/holo-route";

type Spark = {
  id: number;
  angle: number;
  distance: number;
};

function createSparks(seed: string): Spark[] {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Array.from({ length: 14 }, (_, index) => {
    const mixed = Math.abs(hash + index * 9973);
    return {
      id: mixed,
      angle: (360 / 14) * index + (mixed % 18),
      distance: 48 + (mixed % 36),
    };
  });
}

export function HolographicRingHud() {
  const pathname = usePathname();
  const route = resolveHoloRoute(pathname);
  const [navPickCounter, setNavPickCounter] = useState(0);
  const reactionKey = `${pathname}-${navPickCounter}`;
  const sparks = useMemo(() => createSparks(reactionKey), [reactionKey]);

  useEffect(() => {
    function onNavPick() {
      setNavPickCounter((count) => count + 1);
    }
    window.addEventListener("holo-nav-pick", onNavPick);
    return () => window.removeEventListener("holo-nav-pick", onNavPick);
  }, []);

  return (
    <div className="holo-hud" data-holo-route={route} aria-hidden="true">
      <div className="holo-hud-pedestal" />
      <div key={reactionKey} className="holo-hud-perspective holo-hud-pulse">
        <div className="holo-hud-ring holo-hud-ring-1">
          <svg viewBox="0 0 400 400" className="holo-hud-svg">
            <circle cx="200" cy="200" r="52" className="holo-hud-stroke holo-hud-stroke-dashed" />
          </svg>
        </div>
        <div className="holo-hud-ring holo-hud-ring-2">
          <svg viewBox="0 0 400 400" className="holo-hud-svg">
            <circle cx="200" cy="200" r="78" className="holo-hud-stroke holo-hud-stroke-inner" />
            <circle cx="200" cy="200" r="86" className="holo-hud-stroke holo-hud-stroke-dashed" />
          </svg>
        </div>
        <div className="holo-hud-ring holo-hud-ring-3">
          <svg viewBox="0 0 400 400" className="holo-hud-svg">
            <circle cx="200" cy="200" r="118" className="holo-hud-stroke holo-hud-stroke-segmented" />
          </svg>
        </div>
        <div className="holo-hud-ring holo-hud-ring-4">
          <svg viewBox="0 0 400 400" className="holo-hud-svg">
            <circle cx="200" cy="200" r="148" className="holo-hud-stroke holo-hud-stroke-arc" />
            <circle cx="200" cy="200" r="158" className="holo-hud-stroke holo-hud-stroke-ticks" />
          </svg>
        </div>
        <div className="holo-hud-ring holo-hud-ring-5">
          <svg viewBox="0 0 400 400" className="holo-hud-svg">
            <circle cx="200" cy="200" r="182" className="holo-hud-stroke holo-hud-stroke-outer" />
          </svg>
        </div>
        <div className="holo-hud-core">
          <div className="holo-hud-core-glow" />
          <div className="holo-hud-core-dot" />
        </div>
        <div className="holo-hud-sparks" aria-hidden="true">
          {sparks.map((spark) => (
            <span
              key={spark.id}
              className="holo-hud-spark"
              style={
                {
                  "--spark-angle": `${spark.angle}deg`,
                  "--spark-distance": `${spark.distance}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
