import { Flag } from "@/components/dashboard/Flag";

interface WinnerCardsProps {
  winner: string;
  secretWinner: string | null;
}

function WinnerCard({
  label,
  tla,
  icon,
}: {
  label: string;
  tla: string;
  icon: string;
}): React.ReactElement {
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
            className="w-10 h-auto rounded-xs grayscale group-hover:grayscale-0 transition-all duration-500"
          />
          <span className="text-headline-md font-bold uppercase tracking-widest">
            {tla}
          </span>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <span className="material-symbols-outlined" style={{ fontSize: 120 }}>
          {icon}
        </span>
      </div>
    </div>
  );
}

function HiddenSecretWinnerCard(): React.ReactElement {
  return (
    <div className="bg-surface-container border border-outline-variant p-lg relative overflow-hidden">
      <div className="relative z-10">
        <span className="text-label-caps uppercase text-on-surface-variant">
          SECRET WINNER
        </span>
        <div className="flex items-center gap-md mt-sm">
          <div className="w-10 h-7 rounded-xs bg-surface-container-high flex items-center justify-center">
            <span
              className="material-symbols-outlined text-on-surface-variant"
              style={{ fontSize: 18 }}
              aria-hidden
            >
              lock
            </span>
          </div>
          <span className="text-headline-md font-bold uppercase tracking-widest text-on-surface-variant">
            Hidden
          </span>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <span className="material-symbols-outlined" style={{ fontSize: 120 }}>
          visibility_off
        </span>
      </div>
    </div>
  );
}

export function WinnerCards({
  winner,
  secretWinner,
}: WinnerCardsProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-md">
      <WinnerCard label="TOURNAMENT WINNER" tla={winner} icon="emoji_events" />
      {secretWinner === null ? (
        <HiddenSecretWinnerCard />
      ) : (
        <WinnerCard
          label="SECRET WINNER"
          tla={secretWinner}
          icon="visibility_off"
        />
      )}
    </div>
  );
}
