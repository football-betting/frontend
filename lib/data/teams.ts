// WM '26 participants. `code` is the football-data.org TLA (matches the imported
// match data and the betting-api TOURNAMENT_WINNER env), `name` is German.
export const TEAMS = [
  { code: "EGY", name: "Ägypten" },
  { code: "ALG", name: "Algerien" },
  { code: "ARG", name: "Argentinien" },
  { code: "AUS", name: "Australien" },
  { code: "BEL", name: "Belgien" },
  { code: "BIH", name: "Bosnien-Herzegowina" },
  { code: "BRA", name: "Brasilien" },
  { code: "CUW", name: "Curaçao" },
  { code: "COD", name: "DR Kongo" },
  { code: "GER", name: "Deutschland" },
  { code: "ECU", name: "Ecuador" },
  { code: "CIV", name: "Elfenbeinküste" },
  { code: "ENG", name: "England" },
  { code: "FRA", name: "Frankreich" },
  { code: "GHA", name: "Ghana" },
  { code: "HAI", name: "Haiti" },
  { code: "IRQ", name: "Irak" },
  { code: "IRN", name: "Iran" },
  { code: "JPN", name: "Japan" },
  { code: "JOR", name: "Jordanien" },
  { code: "CAN", name: "Kanada" },
  { code: "CPV", name: "Kap Verde" },
  { code: "QAT", name: "Katar" },
  { code: "COL", name: "Kolumbien" },
  { code: "CRO", name: "Kroatien" },
  { code: "MAR", name: "Marokko" },
  { code: "MEX", name: "Mexiko" },
  { code: "NZL", name: "Neuseeland" },
  { code: "NED", name: "Niederlande" },
  { code: "NOR", name: "Norwegen" },
  { code: "AUT", name: "Österreich" },
  { code: "PAN", name: "Panama" },
  { code: "PAR", name: "Paraguay" },
  { code: "POR", name: "Portugal" },
  { code: "KSA", name: "Saudi-Arabien" },
  { code: "SCO", name: "Schottland" },
  { code: "SWE", name: "Schweden" },
  { code: "SUI", name: "Schweiz" },
  { code: "SEN", name: "Senegal" },
  { code: "ESP", name: "Spanien" },
  { code: "RSA", name: "Südafrika" },
  { code: "KOR", name: "Südkorea" },
  { code: "CZE", name: "Tschechien" },
  { code: "TUN", name: "Tunesien" },
  { code: "TUR", name: "Türkei" },
  { code: "URY", name: "Uruguay" },
  { code: "USA", name: "USA" },
  { code: "UZB", name: "Usbekistan" },
] as const;

export type TeamCode = (typeof TEAMS)[number]["code"];

export const TEAM_CODES: readonly TeamCode[] = TEAMS.map((t) => t.code);

export function isTeamCode(value: string): value is TeamCode {
  return (TEAM_CODES as readonly string[]).includes(value);
}
