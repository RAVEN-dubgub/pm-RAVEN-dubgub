"use client";

import type { ReactNode } from "react";

type HoloWorkspaceProps = {
  top?: ReactNode;
  bottom?: ReactNode;
  overlay?: ReactNode;
  fab?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function HoloWorkspace({
  top,
  bottom,
  overlay,
  fab,
  children,
  className = "",
}: HoloWorkspaceProps) {
  return (
    <div className={`holo-workspace ${className}`}>
      {top ? <div className="holo-orbit-zone holo-orbit-top">{top}</div> : null}
      <div className="holo-workspace-body">
        <div className="holo-void" aria-hidden="true" />
        <div className="holo-orbit-zone holo-orbit-main">{children}</div>
      </div>
      {bottom ? (
        <div className="holo-orbit-zone holo-orbit-bottom">{bottom}</div>
      ) : null}
      {overlay ? (
        <div className="holo-orbit-zone holo-orbit-overlay">{overlay}</div>
      ) : null}
      {fab ? <div className="holo-fab-slot">{fab}</div> : null}
    </div>
  );
}
