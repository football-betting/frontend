"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

interface TabBarProps {
  tabs: { id: string; label: string }[];
  initialActive?: string;
  panels: Record<string, React.ReactNode>;
}

export function TabBar({
  tabs,
  initialActive,
  panels,
}: TabBarProps): React.ReactElement {
  const t = useTranslations("Dashboard");
  const [active, setActive] = useState<string>(
    initialActive ?? tabs[0]?.id ?? "",
  );

  return (
    <>
      <div className="p-md bg-surface-container-high border-b border-outline-variant">
        <h3 className="text-label-caps uppercase text-on-surface mb-md">
          {t("ranking")}
        </h3>
        <div className="flex gap-sm overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`text-[10px] font-bold px-md py-1 rounded-full shrink-0 uppercase transition-colors ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} hidden={tab.id !== active}>
          {panels[tab.id]}
        </div>
      ))}
    </>
  );
}
