const TLA_MAP: Record<string, string> = {
  DEU: "GER",
  NLD: "NED",
  HRV: "CRO",
  DNK: "DEN",
  PRT: "POR",
  CHE: "SUI",
};

function mapTla(tla: string): string {
  return TLA_MAP[tla] ?? tla;
}

export function Flag({
  tla,
  name,
  className,
}: {
  tla: string;
  name: string;
  className?: string;
}): React.ReactElement {
  const mapped = mapTla(tla);
  return (
    <img
      src={`/svg/${mapped}.svg`}
      alt={name}
      className={className ?? "w-8 h-5 object-cover rounded-sm"}
    />
  );
}
