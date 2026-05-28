export const DEPARTMENTS = ["Langenfeld", "Mannheim", "Maintz"] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function displayDepartment(db: string): string {
  return db === "Maintz" ? "Mainz" : db;
}
