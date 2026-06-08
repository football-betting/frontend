export const DEPARTMENTS = [
  "Langenfeld",
  "Mannheim",
  "Mainz",
  "Siegen",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function displayDepartment(db: string): string {
  return db;
}
