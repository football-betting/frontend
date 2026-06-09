"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DEPARTMENTS, displayDepartment } from "@/lib/data/departments";

export function DepartmentSwitcher({
  current,
}: {
  current: string;
}): React.ReactElement {
  const t = useTranslations("Settings");
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: string): void {
    if (next === value) return;
    const previous = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/user/department", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ department: next }),
        });
        if (!res.ok) throw new Error("failed");
        router.refresh();
      } catch {
        setValue(previous);
        setError(t("locationError"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-xs items-end">
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        aria-label={t("location")}
        className="bg-surface-container-lowest border border-outline-variant rounded text-body-lg p-md text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
      >
        {DEPARTMENTS.map((d) => (
          <option key={d} value={d}>
            {displayDepartment(d)}
          </option>
        ))}
      </select>
      {error ? <p className="text-body-sm text-danger">{error}</p> : null}
    </div>
  );
}
