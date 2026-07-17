"use client";

import type { ReactNode } from "react";

type ArcGaugeProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: "cyan" | "magenta" | "violet" | "emerald" | "amber" | "rose";
  className?: string;
  children?: ReactNode;
};

const ARC_COLORS = {
  cyan: { stroke: "#22d3ee", glow: "rgba(34, 211, 238, 0.55)" },
  magenta: { stroke: "#e879f9", glow: "rgba(232, 121, 249, 0.55)" },
  violet: { stroke: "#a78bfa", glow: "rgba(167, 139, 250, 0.55)" },
  emerald: { stroke: "#34d399", glow: "rgba(52, 211, 153, 0.55)" },
  amber: { stroke: "#fbbf24", glow: "rgba(251, 191, 36, 0.55)" },
  rose: { stroke: "#fb7185", glow: "rgba(251, 113, 133, 0.55)" },
};

export function ArcGauge({
  value,
  max = 100,
  size = 88,
  strokeWidth = 5,
  label,
  sublabel,
  color = "cyan",
  className = "",
  children,
}: ArcGaugeProps) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const palette = ARC_COLORS[color];

  return (
    <div
      className={`hud-arc-gauge relative inline-flex flex-col items-center ${className}`}
      role="img"
      aria-label={label ? `${label}: ${pct}%` : `${pct}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.15)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={palette.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="hud-arc-stroke transition-all duration-700"
          style={{ filter: `drop-shadow(0 0 6px ${palette.glow})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            <span className="text-lg font-bold tabular-nums text-white">{pct}</span>
            <span className="text-[10px] text-slate-400">%</span>
          </>
        )}
      </div>
      {label && (
        <p className="jarvis-metric-label mt-1.5 max-w-[7rem] text-center leading-tight">
          {label}
        </p>
      )}
      {sublabel && <p className="mt-0.5 text-[10px] text-slate-500">{sublabel}</p>}
    </div>
  );
}

type HudWidgetProps = {
  title?: string;
  label?: string;
  children: ReactNode;
  className?: string;
  accent?: "cyan" | "magenta" | "violet" | "amber" | "rose" | "emerald";
  scanlines?: boolean;
};

export function HudWidget({
  title,
  label,
  children,
  className = "",
  accent = "cyan",
  scanlines = true,
}: HudWidgetProps) {
  return (
    <section
      className={`hud-widget hud-widget-${accent} ${scanlines ? "hud-widget-scanlines" : ""} ${className}`}
    >
      {(label || title) && (
        <header className="mb-3 flex items-start justify-between gap-2">
          <div>
            {label && <p className="jarvis-metric-label">{label}</p>}
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
          </div>
        </header>
      )}
      {children}
    </section>
  );
}

type HudPillProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
  alert?: boolean;
};

export function HudPill({ active, onClick, children, count, alert }: HudPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`hud-pill ${active ? "hud-pill-active" : ""} ${alert ? "hud-pill-alert" : ""}`}
    >
      {children}
      {count !== undefined && (
        <span className="ml-1.5 rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[10px] tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}

type HudFilterStripProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

export function HudFilterStrip({ children, label, className = "" }: HudFilterStripProps) {
  return (
    <div className={`hud-filter-strip ${className}`} role="group" aria-label={label ?? "Filters"}>
      {label && <span className="jarvis-metric-label shrink-0">{label}</span>}
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

type StatusArcProps = {
  status: "TODO" | "IN_PROGRESS" | "DONE";
  size?: number;
};

const STATUS_ARC = {
  TODO: { pct: 0, color: "#94a3b8", label: "To do" },
  IN_PROGRESS: { pct: 55, color: "#fbbf24", label: "Active" },
  DONE: { pct: 100, color: "#34d399", label: "Done" },
};

export function StatusArc({ status, size = 52 }: StatusArcProps) {
  const cfg = STATUS_ARC[status];
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (cfg.pct / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      title={cfg.label}
      aria-label={`Status: ${cfg.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={cfg.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
          style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium uppercase tracking-wider text-slate-400">
        {status === "IN_PROGRESS" ? "WIP" : status === "DONE" ? "✓" : "—"}
      </span>
    </div>
  );
}

export function PriorityGlow({ priority }: { priority: "LOW" | "MEDIUM" | "HIGH" }) {
  const cls =
    priority === "HIGH"
      ? "hud-priority-high"
      : priority === "MEDIUM"
        ? "hud-priority-medium"
        : "hud-priority-low";
  return (
    <span className={`hud-priority-glow ${cls}`} aria-hidden="true" />
  );
}

export function AssigneeChip({
  name,
  isYou,
}: {
  name: string;
  isYou?: boolean;
}) {
  return (
    <span className="hud-assignee-chip">
      <span className="hud-assignee-dot" aria-hidden="true" />
      {name}
      {isYou ? " (you)" : ""}
    </span>
  );
}
