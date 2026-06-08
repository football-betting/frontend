// Narrow an array's first element to a defined value or fail loudly — keeps the
// integration tests honest under `noUncheckedIndexedAccess`.
export function first<T>(arr: readonly T[], message: string): T {
  const value = arr[0];
  if (value === undefined) throw new Error(message);
  return value;
}

// Known seeded demo accounts (see scripts/demo_data.ts).
export const SEED_EMAIL = {
  ada: "ada.lovelace@local.dev",
  marie: "marie.curie@local.dev",
  nikola: "nikola.tesla@local.dev",
  rosa: "rosa.parks@local.dev",
  testUser: "test.user@local.dev",
  isaac: "isaac.newton@local.dev",
} as const;
