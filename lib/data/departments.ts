import { getBrand } from "@/lib/brand";

export const DEPARTMENTS = getBrand().departments;

export type Department = string;

export function displayDepartment(db: string): string {
  return db;
}
