"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag } from "@/components/dashboard/Flag";
import { WinnerEditForm } from "@/components/profile/WinnerEditForm";

interface WinnerCardsProps {
  winner: string;
  secretWinner: string;
  userId: number;
  editable?: boolean;
}

function WinnerCard({
  label,
  tla,
  icon,
  editable,
  onEdit,
}: {
  label: string;
  tla: string;
  icon: string;
  editable: boolean;
  onEdit: () => void;
}): React.ReactElement {
  const t = useTranslations("Profile");
  return (
    <div className="bg-surface-container border border-outline-variant p-lg relative overflow-hidden group">
      <div className="relative z-10">
        <span className="text-label-caps uppercase text-on-surface-variant">
          {label}
        </span>
        <div className="flex items-center gap-md mt-sm">
          <Flag
            tla={tla}
            name={tla}
            className="w-10 h-auto rounded-xs"
          />
          <span className="text-headline-md font-bold uppercase tracking-widest">
            {tla}
          </span>
        </div>
      </div>
      {editable ? (
        <button
          type="button"
          onClick={onEdit}
          aria-label={t("editLabel", { label })}
          className="absolute top-sm right-sm z-20 w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high active:scale-95 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
      ) : null}
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <span className="material-symbols-outlined" style={{ fontSize: 120 }}>
          {icon}
        </span>
      </div>
    </div>
  );
}

export function WinnerCards({
  winner,
  secretWinner,
  userId,
  editable = false,
}: WinnerCardsProps): React.ReactElement {
  const t = useTranslations("Profile");
  const [isEditing, setIsEditing] = useState(false);
  void userId;

  if (editable && isEditing) {
    return (
      <div className="flex flex-col gap-md">
        <WinnerEditForm
          winner={winner}
          secretWinner={secretWinner}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <WinnerCard
        label={t("tournamentWinner")}
        tla={winner}
        icon="emoji_events"
        editable={editable}
        onEdit={() => setIsEditing(true)}
      />
      <WinnerCard
        label={t("secretWinner")}
        tla={secretWinner}
        icon="visibility_off"
        editable={editable}
        onEdit={() => setIsEditing(true)}
      />
      {editable ? (
        <p className="text-label-caps text-on-surface-variant opacity-70">
          {t("pickDeadlineHint")}
        </p>
      ) : null}
    </div>
  );
}
