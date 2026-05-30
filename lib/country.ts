interface CountryTranslator {
  has: (key: string) => boolean;
  (key: string): string;
}

export function resolveCountryName(
  tla: string,
  fallback: string,
  t: CountryTranslator,
): string {
  return t.has(tla) ? t(tla) : fallback;
}
