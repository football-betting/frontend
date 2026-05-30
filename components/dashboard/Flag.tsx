import { tlaToIso2 } from "@/lib/flag";

export function Flag({
  tla,
  name,
  className,
}: {
  tla: string;
  name: string;
  className?: string;
}): React.ReactElement {
  const iso2 = tlaToIso2(tla);
  const cls = className ?? "w-8 h-5 object-cover rounded-sm";

  if (iso2 === undefined) {
    return (
      <span
        role="img"
        aria-label={name}
        className={`${cls} inline-flex items-center justify-center bg-slate-200 text-slate-400`}
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      </span>
    );
  }

  return (
    <img src={`/flags/${iso2}.svg`} alt={name} className={cls} />
  );
}
