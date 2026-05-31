"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export interface RankingTab {
  id: string;
  label: string;
}

interface RankingTabsProps {
  tabs: RankingTab[];
  initialActive: string;
  panels: Record<string, React.ReactNode>;
}

export function RankingTabs({
  tabs,
  initialActive,
  panels,
}: RankingTabsProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState<string>(initialActive);

  const onSelect = (id: string): void => {
    setActive(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <div className="flex flex-wrap gap-xs bg-surface-container-low rounded-lg p-xs border border-outline-variant">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`px-md py-sm text-label-caps uppercase rounded shrink-0 transition-colors ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} hidden={tab.id !== active} className="mt-lg">
          {panels[tab.id]}
        </div>
      ))}
    </>
  );
}
