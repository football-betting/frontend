"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { HistoryFilter } from "@/lib/history";

interface HistoryFilterContextValue {
  filter: HistoryFilter | null;
  setFilter: (filter: HistoryFilter | null) => void;
  toggleFilter: (filter: HistoryFilter) => void;
}

const HistoryFilterContext = createContext<HistoryFilterContextValue | null>(
  null,
);

export function HistoryFilterProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [filter, setFilter] = useState<HistoryFilter | null>(null);

  const value = useMemo<HistoryFilterContextValue>(
    () => ({
      filter,
      setFilter,
      toggleFilter: (next) =>
        setFilter((current) => (current === next ? null : next)),
    }),
    [filter],
  );

  return (
    <HistoryFilterContext.Provider value={value}>
      {children}
    </HistoryFilterContext.Provider>
  );
}

export function useHistoryFilter(): HistoryFilterContextValue {
  const ctx = useContext(HistoryFilterContext);
  if (ctx === null) {
    throw new Error(
      "useHistoryFilter must be used within a HistoryFilterProvider",
    );
  }
  return ctx;
}
