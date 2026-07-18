"use client";



import { usePathname } from "next/navigation";

import { useMemo } from "react";

import { useHoloFocusPulse } from "@/lib/holo-focus";
import { useHoloRingReadoutOptional } from "@/lib/holo-ring-context";
import { HOLO_NAV_SEGMENTS, resolveHoloRoute } from "@/lib/holo-route";



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

  const pulseKey = useHoloFocusPulse();

  const ringCtx = useHoloRingReadoutOptional();

  const readout = ringCtx?.readout;

  const reactionKey = `${pathname}-${pulseKey}`;

  const sparks = useMemo(() => createSparks(reactionKey), [reactionKey]);



  return (

    <div className="holo-hud" data-holo-route={route}>

      <div className="holo-hud-pedestal" />

      <div key={reactionKey} className="holo-hud-perspective holo-hud-pulse holo-hud-pulse-intense">

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

            {/* Nav segment arcs: 120° each */}

            {HOLO_NAV_SEGMENTS.map((segment) => {

              const active = pathname.startsWith(segment.href);

              const startAngle = segment.angle - 50;

              return (

                <path

                  key={segment.href}

                  d={describeArc(200, 200, 128, startAngle, startAngle + 100)}

                  className={`holo-hud-nav-arc ${active ? "holo-hud-nav-arc-active" : ""}`}

                />

              );

            })}

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



        {/* Orbit nav labels: visual ring ↔ menu connection */}

        <div className="holo-hud-orbit-labels">

          {HOLO_NAV_SEGMENTS.map((segment) => {

            const active = pathname.startsWith(segment.href);

            const rad = ((segment.angle - 90) * Math.PI) / 180;

            const dist = 42;

            return (

              <span
                key={segment.href}
                className={`holo-hud-orbit-label ${active ? "holo-hud-orbit-label-active" : ""}`}
                style={{
                  left: `${50 + Math.cos(rad) * dist}%`,
                  top: `${50 + Math.sin(rad) * dist}%`,
                }}
                aria-hidden="true"
              >
                {segment.label.slice(0, 3).toUpperCase()}
              </span>

            );

          })}

        </div>



        <div className="holo-hud-core">
          <div className="holo-hud-core-glow" />
          {readout ? (
            <div className="holo-hud-core-readout" aria-live="polite">
              {readout.metric !== undefined && (
                <p className="jarvis-metric-glow text-xl sm:text-2xl">{readout.metric}</p>
              )}
              {readout.primary && (
                <p className="jarvis-metric-label text-center text-[10px]">{readout.primary}</p>
              )}
              {readout.secondary && (
                <p className="mt-0.5 text-center text-[9px] text-slate-500">{readout.secondary}</p>
              )}
            </div>
          ) : (
            <div className="holo-hud-core-dot" />
          )}
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



function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {

  const rad = ((angleDeg - 90) * Math.PI) / 180;

  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };

}



function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {

  const start = polarToCartesian(cx, cy, r, endAngle);

  const end = polarToCartesian(cx, cy, r, startAngle);

  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;

}

