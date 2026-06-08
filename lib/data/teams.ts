// WM '26 participants. `code` is the football-data.org TLA (matches the imported
// match data and the betting-api TOURNAMENT_WINNER env); `de`/`en` are the
// localized display names.
export const TEAMS = [
  { code: "EGY", de: "Ägypten", en: "Egypt" },
  { code: "ALG", de: "Algerien", en: "Algeria" },
  { code: "ARG", de: "Argentinien", en: "Argentina" },
  { code: "AUS", de: "Australien", en: "Australia" },
  { code: "BEL", de: "Belgien", en: "Belgium" },
  { code: "BIH", de: "Bosnien-Herzegowina", en: "Bosnia and Herzegovina" },
  { code: "BRA", de: "Brasilien", en: "Brazil" },
  { code: "CUW", de: "Curaçao", en: "Curaçao" },
  { code: "COD", de: "DR Kongo", en: "DR Congo" },
  { code: "GER", de: "Deutschland", en: "Germany" },
  { code: "ECU", de: "Ecuador", en: "Ecuador" },
  { code: "CIV", de: "Elfenbeinküste", en: "Ivory Coast" },
  { code: "ENG", de: "England", en: "England" },
  { code: "FRA", de: "Frankreich", en: "France" },
  { code: "GHA", de: "Ghana", en: "Ghana" },
  { code: "HAI", de: "Haiti", en: "Haiti" },
  { code: "IRQ", de: "Irak", en: "Iraq" },
  { code: "IRN", de: "Iran", en: "Iran" },
  { code: "JPN", de: "Japan", en: "Japan" },
  { code: "JOR", de: "Jordanien", en: "Jordan" },
  { code: "CAN", de: "Kanada", en: "Canada" },
  { code: "CPV", de: "Kap Verde", en: "Cape Verde" },
  { code: "QAT", de: "Katar", en: "Qatar" },
  { code: "COL", de: "Kolumbien", en: "Colombia" },
  { code: "CRO", de: "Kroatien", en: "Croatia" },
  { code: "MAR", de: "Marokko", en: "Morocco" },
  { code: "MEX", de: "Mexiko", en: "Mexico" },
  { code: "NZL", de: "Neuseeland", en: "New Zealand" },
  { code: "NED", de: "Niederlande", en: "Netherlands" },
  { code: "NOR", de: "Norwegen", en: "Norway" },
  { code: "AUT", de: "Österreich", en: "Austria" },
  { code: "PAN", de: "Panama", en: "Panama" },
  { code: "PAR", de: "Paraguay", en: "Paraguay" },
  { code: "POR", de: "Portugal", en: "Portugal" },
  { code: "KSA", de: "Saudi-Arabien", en: "Saudi Arabia" },
  { code: "SCO", de: "Schottland", en: "Scotland" },
  { code: "SWE", de: "Schweden", en: "Sweden" },
  { code: "SUI", de: "Schweiz", en: "Switzerland" },
  { code: "SEN", de: "Senegal", en: "Senegal" },
  { code: "ESP", de: "Spanien", en: "Spain" },
  { code: "RSA", de: "Südafrika", en: "South Africa" },
  { code: "KOR", de: "Südkorea", en: "South Korea" },
  { code: "CZE", de: "Tschechien", en: "Czechia" },
  { code: "TUN", de: "Tunesien", en: "Tunisia" },
  { code: "TUR", de: "Türkei", en: "Türkiye" },
  { code: "URY", de: "Uruguay", en: "Uruguay" },
  { code: "USA", de: "USA", en: "USA" },
  { code: "UZB", de: "Usbekistan", en: "Uzbekistan" },
] as const;

export type TeamCode = (typeof TEAMS)[number]["code"];

export const TEAM_CODES: readonly TeamCode[] = TEAMS.map((t) => t.code);

export function isTeamCode(value: string): value is TeamCode {
  return (TEAM_CODES as readonly string[]).includes(value);
}

type TeamNameLocale = "de" | "en";

function resolveLocale(locale: string): TeamNameLocale {
  return locale.startsWith("en") ? "en" : "de";
}

// Localized team display name for a code (falls back to the code itself).
export function teamName(code: string, locale: string): string {
  const team = TEAMS.find((t) => t.code === code);
  if (!team) return code;
  return team[resolveLocale(locale)];
}

// Teams as `{ code, name }`, localized and sorted alphabetically in that locale
// (so the dropdown order is correct for both German and English).
export function localizedTeams(
  locale: string,
): { code: TeamCode; name: string }[] {
  const key = resolveLocale(locale);
  return TEAMS.map((t) => ({ code: t.code, name: t[key] })).sort((a, b) =>
    a.name.localeCompare(b.name, key),
  );
}
