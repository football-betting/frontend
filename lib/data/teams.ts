export const TEAMS = [
  { code: "ALB", name: "Albanien" },
  { code: "BEL", name: "Belgien" },
  { code: "DEU", name: "Deutschland" },
  { code: "DNK", name: "Dänemark" },
  { code: "ENG", name: "England" },
  { code: "FRA", name: "Frankreich" },
  { code: "GEO", name: "Georgien" },
  { code: "ITA", name: "Italien" },
  { code: "HRV", name: "Kroatien" },
  { code: "NLD", name: "Niederlande" },
  { code: "AUT", name: "Österreich" },
  { code: "POL", name: "Polen" },
  { code: "PRT", name: "Portugal" },
  { code: "ROU", name: "Rumänien" },
  { code: "SCO", name: "Schottland" },
  { code: "CHE", name: "Schweiz" },
  { code: "SRB", name: "Serbien" },
  { code: "SVK", name: "Slowakei" },
  { code: "SVN", name: "Slowenien" },
  { code: "ESP", name: "Spanien" },
  { code: "CZE", name: "Tschechien" },
  { code: "TUR", name: "Türkei" },
  { code: "UKR", name: "Ukraine" },
  { code: "HUN", name: "Ungarn" },
] as const;

export type TeamCode = (typeof TEAMS)[number]["code"];

export const TEAM_CODES: readonly TeamCode[] = TEAMS.map((t) => t.code);

export function isTeamCode(value: string): value is TeamCode {
  return (TEAM_CODES as readonly string[]).includes(value);
}
