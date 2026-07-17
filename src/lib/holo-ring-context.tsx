"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RingCoreReadout = {
  primary?: string;
  secondary?: string;
  metric?: string | number;
};

type HoloRingContextValue = {
  readout: RingCoreReadout | null;
  setReadout: (readout: RingCoreReadout | null) => void;
};

const HoloRingContext = createContext<HoloRingContextValue | null>(null);

export function HoloRingProvider({ children }: { children: ReactNode }) {
  const [readout, setReadoutState] = useState<RingCoreReadout | null>(null);
  const setReadout = useCallback((next: RingCoreReadout | null) => {
    setReadoutState(next);
  }, []);

  const value = useMemo(
    () => ({ readout, setReadout }),
    [readout, setReadout],
  );

  return (
    <HoloRingContext.Provider value={value}>{children}</HoloRingContext.Provider>
  );
}

export function useHoloRingReadout() {
  const ctx = useContext(HoloRingContext);
  if (!ctx) {
    throw new Error("useHoloRingReadout must be used within HoloRingProvider");
  }
  return ctx;
}

export function useHoloRingReadoutOptional() {
  return useContext(HoloRingContext);
}
